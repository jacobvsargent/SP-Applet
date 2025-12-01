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
  const [currentStep, setCurrentStep] = useState('name'); // Track what we're asking for

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

  // Determine next step based on what's missing
  const getNextStep = (data = formData) => {
    if (!data.name) return 'name';
    if (!data.income) return 'income';
    if (!data.state) return 'state';
    if (!data.filingStatus) return 'filingStatus';
    if (!data.avgIncome && !data.knownFederalTax) return 'tax2022';
    if (!data.capitalGains) return 'capitalGains';
    return 'complete';
  };

  // Get the question for the next step
  const getQuestionForStep = (step) => {
    switch (step) {
      case 'name':
        return "Hi! I'm here to help you analyze tax optimization scenarios. Let's start with your name - what should I call you?";
      case 'income':
        return "What's your 2025 ordinary income?";
      case 'state':
        return "What state do you file taxes in?";
      case 'filingStatus':
        return "Are you filing as Single or Married Filing Jointly?";
      case 'tax2022':
        return "Do you know your 2022 income or the federal tax you paid in 2022? Either one works.";
      case 'capitalGains':
        return "Do you have any long-term capital gains for 2025? (You can say 'no' or 'none' if not)";
      case 'complete':
        return "Perfect! I have everything I need. Ready to run your analysis?";
      default:
        return "Let me know when you're ready to continue.";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Use GPT to extract data from user's response based on current step
      const extractionPrompt = `Extract information from the user's response for the "${currentStep}" field.

Current step: ${currentStep}
User said: "${userInput}"

Extract and return ONLY a JSON object with the extracted value. Examples:

For name: {"name": "John Smith"}
For income: {"income": 750000} (extract number only)
For state: {"state": "California"} (full state name)
For filingStatus: {"filingStatus": "Single"} or {"filingStatus": "MarriedJointly"}
For tax2022: {"avgIncome": 1000000} or {"knownFederalTax": 280000} (whichever they provided)
For capitalGains: {"capitalGains": 50000} or {"capitalGains": 0} (if they said no/none)

If asking to confirm/run analysis: {"confirmed": true}

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

      // Check if user confirmed to run analysis
      if (parsedData.confirmed && isFormComplete()) {
        console.log('🚀 Chat Analysis Triggered!');
        console.log('📊 Form Data being sent:', updatedFormData);
        onComplete(updatedFormData);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Perfect! Running your analysis now... 🚀"
        }]);
        setIsLoading(false);
        return;
      }

      // Determine next step using the UPDATED form data
      const nextStep = getNextStep(updatedFormData);
      setCurrentStep(nextStep);
      
      console.log('➡️ Current step was:', currentStep, '| Next step is:', nextStep);

      // Generate acknowledgment and next question
      let response;
      if (nextStep === 'complete') {
        response = getQuestionForStep('complete');
      } else {
        // Simple acknowledgment + next question
        const acknowledgments = {
          name: `Nice to meet you, ${updatedFormData.name}!`,
          income: `Got it, $${updatedFormData.income?.toLocaleString()}.`,
          state: `Perfect, ${updatedFormData.state}.`,
          filingStatus: `Understood.`,
          tax2022: `Great.`,
          capitalGains: `Okay.`
        };
        
        const ack = acknowledgments[currentStep] || 'Got it.';
        const nextQuestion = getQuestionForStep(nextStep);
        response = `${ack} ${nextQuestion}`;
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
            <summary>Debug: Collected Data (Step: {currentStep})</summary>
            <pre style={{ fontSize: '10px', overflow: 'auto' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
