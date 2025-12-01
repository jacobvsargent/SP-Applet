import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function ChatWidget({ onFormDataUpdate, onComplete, initialFormData, onLogout }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you analyze tax optimization scenarios. Let's start with your name - what should I call you?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData || {
    name: '',
    income: null,
    capitalGains: null,
    avgIncome: null,
    knownFederalTax: null,
    state: '',
    filingStatus: '',
    donationPreference: 'both',
    selectedScenarios: [2, 3, 4, 5, 6]
  });
  
  const messagesEndRef = useRef(null);
  const openai = useRef(null);

  // Initialize OpenAI client
  useEffect(() => {
    openai.current = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if all required fields are filled
  const isFormComplete = () => {
    const hasName = formData.name && formData.name.trim() !== '';
    const hasIncome = formData.income !== null && formData.income > 0;
    const hasState = formData.state && formData.state.trim() !== '';
    const hasFilingStatus = formData.filingStatus && formData.filingStatus.trim() !== '';
    const hasAvgOrKnown = (formData.avgIncome && formData.avgIncome > 0) || 
                          (formData.knownFederalTax && formData.knownFederalTax > 0);
    
    return hasName && hasIncome && hasState && hasFilingStatus && hasAvgOrKnown;
  };

  // Determine what fields are still missing
  const getMissingFields = (data) => {
    const missing = [];
    if (!data.name) missing.push('name');
    if (!data.income) missing.push('2025 income');
    if (!data.state) missing.push('state');
    if (!data.filingStatus) missing.push('filing status');
    if (!data.avgIncome && !data.knownFederalTax) missing.push('2022 tax information');
    return missing;
  };

  // Get the question for the next missing field
  const getNextQuestion = (data) => {
    if (!data.name) return "What's your name?";
    if (!data.income) return "What's your 2025 ordinary income?";
    if (!data.state) return "What state do you file taxes in?";
    if (!data.filingStatus) return "Are you filing as Single or Married Filing Jointly?";
    if (!data.avgIncome && !data.knownFederalTax) return "Do you know your 2022 income or the federal tax you paid in 2022?";
    if (!data.capitalGains) return "Do you have any long-term capital gains for 2025? (You can say 'no' or 'none' if not)";
    return "Perfect! I have everything I need. Ready to run your analysis?";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Phase 1: Classify user intent
      const classificationPrompt = `Analyze the user's message and classify their intent.

User message: "${userInput}"

Context: We're collecting tax information. We need: name, 2025 income, state, filing status, and 2022 tax info.

Classify as ONE of these intents:
1. "providing_data" - User is giving tax/personal information (name, numbers, location, status, etc.)
2. "asking_question" - User is asking a question about taxes, programs, legality, how things work, etc.
3. "confirming" - User is saying yes/ready/go ahead/let's do it
4. "casual" - Small talk, greetings, off-topic comments

Return ONLY a JSON object: {"intent": "providing_data"} or {"intent": "asking_question"} etc.`;

      const classificationResponse = await openai.current.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: classificationPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0
      });

      const classificationText = classificationResponse.choices[0].message.content.trim();
      console.log('🎯 Intent classification:', classificationText);
      
      let classification;
      try {
        classification = JSON.parse(classificationText);
      } catch (e) {
        console.error('Failed to parse classification:', classificationText);
        classification = { intent: 'providing_data' }; // Default fallback
      }

      // Phase 2: Handle based on intent
      if (classification.intent === 'confirming' && isFormComplete()) {
        // User is ready to run analysis
        console.log('🚀 Chat Analysis Triggered!');
        console.log('📊 Form Data being sent:', formData);
        onComplete(formData);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Perfect! Running your analysis now... 🚀"
        }]);
        setIsLoading(false);
        return;
      }

      if (classification.intent === 'asking_question') {
        // User asked a question - answer it conversationally and redirect
        const questionAnswerPrompt = `The user asked a question while we're collecting tax information. Answer their question helpfully and professionally, then gently redirect them back to providing the information we need.

User's question: "${userInput}"

Missing information we still need: ${getMissingFields(formData).join(', ')}

Guidelines:
- Answer their question concisely and accurately
- For legal/specific program questions, suggest contacting Taxwise Partners directly
- After answering, smoothly transition back to collecting data
- End with the next question we need answered: "${getNextQuestion(formData)}"
- Keep response under 3 sentences
- Be friendly and helpful

Example format:
"[Answer to their question]. [Transition]. [Next question]?"`;

        const answerResponse = await openai.current.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: questionAnswerPrompt },
            { role: 'user', content: userInput }
          ],
          temperature: 0.7
        });

        const answer = answerResponse.choices[0].message.content.trim();
        console.log('💬 Conversational response:', answer);

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: answer
        }]);
        setIsLoading(false);
        return;
      }

      if (classification.intent === 'casual') {
        // Small talk - respond briefly and redirect
        const casualPrompt = `The user made a casual comment. Respond briefly and friendly, then redirect to data collection.

User said: "${userInput}"

Next info we need: "${getNextQuestion(formData)}"

Keep it very brief (1-2 sentences). Be friendly but professional. Redirect to the question.`;

        const casualResponse = await openai.current.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: casualPrompt },
            { role: 'user', content: userInput }
          ],
          temperature: 0.7
        });

        const response = casualResponse.choices[0].message.content.trim();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response
        }]);
        setIsLoading(false);
        return;
      }

      // Intent is 'providing_data' - extract ALL available information
      const extractionPrompt = `Extract ALL tax-related information from the user's message. Look for ANY of these fields:

User said: "${userInput}"

Extract any/all of these that are present:
- name: Full name (string)
- income: 2025 ordinary income (number only, no formatting)
- capitalGains: 2025 long-term capital gains (number, or 0 if they say no/none)
- avgIncome: 2022 income estimate (number)
- knownFederalTax: 2022 federal tax paid (number)
- state: State where they file taxes (full state name)
- filingStatus: "Single" or "MarriedJointly"

Return a JSON object with ONLY the fields you found. Examples:

User: "my name is jacob and i make 100k per year"
Return: {"name": "Jacob", "income": 100000}

User: "I'm from California and I'm single"
Return: {"state": "California", "filingStatus": "Single"}

User: "750k income, paid 200k in taxes in 2022"
Return: {"income": 750000, "knownFederalTax": 200000}

User: "no capital gains"
Return: {"capitalGains": 0}

If you can't extract any relevant data, return: {}

Return ONLY the JSON object, nothing else.`;

      const extractionResponse = await openai.current.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: extractionPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0
      });

      const extracted = extractionResponse.choices[0].message.content.trim();
      console.log('📊 Extracted data:', extracted);
      
      let parsedData;
      try {
        parsedData = JSON.parse(extracted);
      } catch (e) {
        console.error('Failed to parse extraction:', extracted);
        parsedData = {};
      }

      // Update form data with extracted information
      const updatedFormData = { ...formData, ...parsedData };
      setFormData(updatedFormData);
      onFormDataUpdate(updatedFormData);

      console.log('📋 Updated form data:', updatedFormData);
      console.log('📝 Extracted fields:', Object.keys(parsedData));

      // Generate appropriate response
      let response;
      
      if (Object.keys(parsedData).length === 0) {
        // Couldn't extract anything - ask them to clarify
        response = `I'm not sure I understood that. ${getNextQuestion(updatedFormData)}`;
      } else if (isFormComplete()) {
        // All data collected!
        response = "Perfect! I have everything I need. Ready to run your analysis?";
      } else {
        // Acknowledge what we got and ask for next piece
        const acknowledgments = [];
        
        if (parsedData.name) {
          acknowledgments.push(`Nice to meet you, ${updatedFormData.name}!`);
        }
        if (parsedData.income) {
          acknowledgments.push(`I see you make $${updatedFormData.income.toLocaleString()}.`);
        }
        if (parsedData.capitalGains && parsedData.capitalGains > 0) {
          acknowledgments.push(`And $${updatedFormData.capitalGains.toLocaleString()} in capital gains.`);
        }
        if (parsedData.capitalGains === 0) {
          acknowledgments.push(`No capital gains, got it.`);
        }
        if (parsedData.state) {
          acknowledgments.push(`${updatedFormData.state}.`);
        }
        if (parsedData.filingStatus) {
          const status = updatedFormData.filingStatus === 'MarriedJointly' ? 'Married Filing Jointly' : 'Single';
          acknowledgments.push(`Filing as ${status}.`);
        }
        if (parsedData.avgIncome) {
          acknowledgments.push(`2022 income of $${updatedFormData.avgIncome.toLocaleString()}.`);
        }
        if (parsedData.knownFederalTax) {
          acknowledgments.push(`$${updatedFormData.knownFederalTax.toLocaleString()} in 2022 federal taxes.`);
        }

        const ackText = acknowledgments.length > 0 ? acknowledgments.join(' ') : 'Got it.';
        const nextQuestion = getNextQuestion(updatedFormData);
        response = `${ackText} ${nextQuestion}`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response
      }]);

    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Could you please repeat that?"
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      border: '2px solid #ddd',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#fff'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        fontWeight: '600',
        fontSize: '18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>💬 Tax Analysis Assistant</span>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#d32f2f'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = '#f44336'; }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? '#4CAF50' : '#e0e0e0',
              color: msg.role === 'user' ? 'white' : '#333',
              wordWrap: 'break-word'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ textAlign: 'center', color: '#666' }}>
            <em>Thinking...</em>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #ddd',
        backgroundColor: '#fff'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Debug: Show collected data */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f0f0f0',
          fontSize: '12px',
          borderTop: '1px solid #ddd'
        }}>
          <details>
            <summary>Debug: Collected Data</summary>
            <pre style={{ fontSize: '10px', overflow: 'auto' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
            <div style={{ marginTop: '8px', fontSize: '11px' }}>
              Missing: {getMissingFields(formData).join(', ') || 'Nothing - ready to go!'}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
