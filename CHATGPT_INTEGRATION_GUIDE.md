# ChatGPT Integration Guide for "CHAT" Passcode

## Overview

This guide explains how to add a conversational ChatGPT interface for the "CHAT" passcode only. Users with this passcode will see a chat widget instead of the traditional form, where they can provide information conversationally.

---

## Architecture

### User Flow
1. User logs in with passcode "CHAT"
2. Instead of form, they see a chat interface
3. ChatGPT asks questions conversationally
4. User responds naturally (e.g., "My name is John Jameson")
5. GPT extracts structured data and populates form fields
6. Fields update in real-time (visible or hidden)
7. When all required fields are filled, GPT asks: "Ready to run analysis?"
8. User confirms → Analysis runs with collected data

### Technical Flow
```
User Input (Chat) 
    ↓
OpenAI API (Function Calling)
    ↓
Extract Structured Data
    ↓
Update formData State
    ↓
All Fields Complete?
    ↓
GPT Confirms → onSubmit(formData)
    ↓
Existing Analysis Pipeline
```

---

## Implementation Steps

### Step 1: Add OpenAI API Dependency

```bash
npm install openai
```

### Step 2: Add OpenAI API Key to Environment

**File**: `.env`

```bash
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

⚠️ **Security Note**: In production, the OpenAI API key should be on a backend server, not exposed in frontend code. For now, this works for testing.

### Step 3: Update Passcode Configuration

**File**: `src/config/passcodes.js`

```javascript
export const VALID_PASSCODES = {
  'MARK': {
    userId: 'MARK',
    displayName: 'Mark',
  },
  'WTAI': {
    userId: 'WTAI',
    displayName: 'WTAI User',
  },
  'TEST': {
    userId: 'TEST',
    displayName: 'Test User',
  },
  'ADMI': {
    userId: 'ADMI',
    displayName: 'Administrator',
  },
  'CHAT': {
    userId: 'CHAT',
    displayName: 'Chat User',
    frontEndConfig: {
      useChat: true  // ← Flag to show chat interface
    }
  },
};
```

### Step 4: Create Chat Widget Component

**File**: `src/components/ChatWidget.jsx`

```javascript
import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function ChatWidget({ onFormDataUpdate, onComplete, initialFormData }) {
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
    selectedScenarios: []
  });
  
  const messagesEndRef = useRef(null);
  const openai = useRef(null);

  // Initialize OpenAI client
  useEffect(() => {
    openai.current = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // ⚠️ Only for development!
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

  // Define functions that GPT can call to update form data
  const tools = [
    {
      type: "function",
      function: {
        name: "update_client_name",
        description: "Update the client's name",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The client's full name"
            }
          },
          required: ["name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_income",
        description: "Update the 2025 ordinary income amount",
        parameters: {
          type: "object",
          properties: {
            income: {
              type: "number",
              description: "The ordinary income amount for 2025 in dollars"
            }
          },
          required: ["income"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_capital_gains",
        description: "Update the 2025 long-term capital gains (optional)",
        parameters: {
          type: "object",
          properties: {
            capitalGains: {
              type: "number",
              description: "The long-term capital gains for 2025 in dollars"
            }
          },
          required: ["capitalGains"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_avg_income",
        description: "Update the estimated 2022 income",
        parameters: {
          type: "object",
          properties: {
            avgIncome: {
              type: "number",
              description: "The estimated 2022 income in dollars"
            }
          },
          required: ["avgIncome"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_known_federal_tax",
        description: "Update the known 2022 federal tax paid",
        parameters: {
          type: "object",
          properties: {
            knownFederalTax: {
              type: "number",
              description: "The known 2022 federal tax paid in dollars"
            }
          },
          required: ["knownFederalTax"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_state",
        description: "Update the state of residence",
        parameters: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "The US state of residence (e.g., 'California', 'Texas', 'New York')"
            }
          },
          required: ["state"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_filing_status",
        description: "Update the tax filing status",
        parameters: {
          type: "object",
          properties: {
            filingStatus: {
              type: "string",
              enum: ["Single", "MarriedJointly"],
              description: "The tax filing status: 'Single' or 'MarriedJointly'"
            }
          },
          required: ["filingStatus"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "update_donation_preference",
        description: "Update the donation strategy preference",
        parameters: {
          type: "object",
          properties: {
            donationPreference: {
              type: "string",
              enum: ["land", "medtech", "both", "both-separate"],
              description: "Donation strategy: 'land' (30%), 'medtech' (60%), 'both' (range), or 'both-separate'"
            }
          },
          required: ["donationPreference"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "confirm_ready_to_analyze",
        description: "User confirms they are ready to run the analysis with the collected data",
        parameters: {
          type: "object",
          properties: {
            confirmed: {
              type: "boolean",
              description: "Whether the user confirmed they want to proceed"
            }
          },
          required: ["confirmed"]
        }
      }
    }
  ];

  // System prompt for GPT
  const systemPrompt = `You are a helpful assistant collecting tax information for a Strategic Partner Estimator Tool. 

Your job is to:
1. Ask the user conversational questions to gather the following information:
   - Client name (required)
   - 2025 Ordinary Income (required)
   - 2025 Long-term Capital Gains (optional)
   - Either Estimated 2022 Income OR Known 2022 Federal Tax Paid (at least one required)
   - State of residence (required)
   - Filing status: Single or Married Filing Jointly (required)
   - Donation preference: Land (30%), Medtech (60%), Both (range), or Both (separate) - default to "both" if not specified

2. Extract numeric values from natural language (e.g., "seventy five thousand" → 75000, "$75k" → 75000)

3. Use the provided functions to update the form data as you collect information

4. Keep track of what you've collected and what's still missing

5. Once all REQUIRED fields are filled, ask the user: "I've got everything we need. Ready to run your analysis?"

6. When user confirms (says yes, sure, go ahead, etc.), call the confirm_ready_to_analyze function

Be friendly, conversational, and efficient. Don't ask for information you already have.`;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
        userMessage
      ];

      // Call OpenAI API with function calling
      const response = await openai.current.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: conversationMessages,
        tools: tools,
        tool_choice: 'auto'
      });

      const assistantMessage = response.choices[0].message;
      
      // Check if GPT wants to call functions
      if (assistantMessage.tool_calls) {
        // Process each function call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          // Update form data based on function called
          const newFormData = { ...formData };
          
          switch (functionName) {
            case 'update_client_name':
              newFormData.name = functionArgs.name;
              break;
            case 'update_income':
              newFormData.income = functionArgs.income;
              break;
            case 'update_capital_gains':
              newFormData.capitalGains = functionArgs.capitalGains;
              break;
            case 'update_avg_income':
              newFormData.avgIncome = functionArgs.avgIncome;
              break;
            case 'update_known_federal_tax':
              newFormData.knownFederalTax = functionArgs.knownFederalTax;
              break;
            case 'update_state':
              newFormData.state = functionArgs.state;
              break;
            case 'update_filing_status':
              newFormData.filingStatus = functionArgs.filingStatus;
              break;
            case 'update_donation_preference':
              newFormData.donationPreference = functionArgs.donationPreference;
              break;
            case 'confirm_ready_to_analyze':
              if (functionArgs.confirmed && isFormComplete()) {
                // Trigger form submission!
                onComplete(formData);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: "Perfect! Running your analysis now... 🚀"
                }]);
                setIsLoading(false);
                return;
              }
              break;
          }
          
          setFormData(newFormData);
          onFormDataUpdate(newFormData);
        }

        // Get GPT's next response after function calls
        const followUpResponse = await openai.current.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationMessages,
            assistantMessage,
            {
              role: 'tool',
              tool_call_id: assistantMessage.tool_calls[0].id,
              content: JSON.stringify({ success: true })
            }
          ]
        });

        const followUpMessage = followUpResponse.choices[0].message;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: followUpMessage.content
        }]);
      } else {
        // Regular text response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: assistantMessage.content
        }]);
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again."
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
        fontSize: '18px'
      }}>
        💬 Tax Analysis Assistant
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

      {/* Debug: Show collected data (optional, can remove in production) */}
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
          </details>
        </div>
      )}
    </div>
  );
}
```

### Step 5: Update InputForm to Support Chat Mode

**File**: `src/components/InputForm.jsx`

Add this at the beginning of the component:

```javascript
import React, { useState } from 'react';
import { US_STATES, FILING_STATUS, FILING_STATUS_LABELS } from '../constants';
import { isValidCurrency, parseCurrency, formatCurrencyInput } from '../utils/formatting';
import ChatWidget from './ChatWidget';  // ← Add this import

export default function InputForm({ onSubmit, userConfig }) {  // ← Add userConfig prop
  const [formData, setFormData] = useState({
    name: '',
    income: '',
    capitalGains: '',
    avgIncome: '',
    knownFederalTax: '',
    state: '',
    filingStatus: '',
    donationPreference: 'both'
  });

  const [selectedScenarios, setSelectedScenarios] = useState({
    scenario2: false,
    scenario3: false,
    scenario4: false,
    scenario5: false,
    scenario6: false
  });

  // Check if user should see chat interface
  const useChatInterface = userConfig?.frontEndConfig?.useChat === true;

  // Handler for chat widget data updates
  const handleChatDataUpdate = (chatFormData) => {
    setFormData(chatFormData);
  };

  // Handler for chat widget completion
  const handleChatComplete = (chatFormData) => {
    // Format and submit the data
    const submissionData = {
      name: chatFormData.name.trim(),
      income: chatFormData.income,
      capitalGains: chatFormData.capitalGains || null,
      avgIncome: chatFormData.avgIncome || null,
      knownFederalTax: chatFormData.knownFederalTax || null,
      state: chatFormData.state,
      filingStatus: chatFormData.filingStatus,
      donationPreference: chatFormData.donationPreference,
      selectedScenarios: Object.keys(selectedScenarios)
        .filter(key => selectedScenarios[key])
        .map(key => parseInt(key.replace('scenario', '')))
    };
    onSubmit(submissionData);
  };

  // If chat mode, show chat widget instead of form
  if (useChatInterface) {
    return (
      <div>
        <ChatWidget
          onFormDataUpdate={handleChatDataUpdate}
          onComplete={handleChatComplete}
          initialFormData={formData}
        />
      </div>
    );
  }

  // ... rest of existing form code ...
```

### Step 6: Pass userConfig to InputForm

**File**: `src/App.jsx`

Update the InputForm component call:

```javascript
{appState === APP_STATE.INPUT && (
  <InputForm onSubmit={handleFormSubmit} userConfig={userConfig} />
)}
```

---

## Testing

### Test Conversation Flow

1. **Login with "CHAT" passcode**
2. **Chat interface appears**
3. **Test conversation:**
```
GPT: "Hi! I'm here to help you analyze tax optimization scenarios. Let's start with your name - what should I call you?"

User: "My name is John Smith"

GPT: "Great to meet you, John! What's your 2025 ordinary income?"

User: "I make about 150 thousand dollars"

GPT: "Got it, $150,000. What state do you live in?"

User: "California"

GPT: "Perfect. Are you filing as Single or Married Filing Jointly?"

User: "married filing jointly"

GPT: "Excellent. Now I need to know either your estimated 2022 income or your known 2022 federal tax paid. Which would you prefer to provide?"

User: "I paid about 25k in federal taxes in 2022"

GPT: "Thank you! I've got everything we need:
- Name: John Smith
- 2025 Income: $150,000
- State: California
- Filing Status: Married Filing Jointly
- 2022 Federal Tax: $25,000

Ready to run your analysis?"

User: "yes"

GPT: "Perfect! Running your analysis now... 🚀"

[Analysis starts]
```

---

## Security Considerations

### ⚠️ Important Security Notes

1. **API Key Exposure**
   - Current setup exposes OpenAI API key in browser
   - **For Production**: Move OpenAI calls to a backend server
   - Create `/api/chat` endpoint that proxies OpenAI requests
   - Never expose API keys in frontend code

2. **Recommended Production Architecture**
```
Frontend (React)
    ↓
Your Backend Server (Node.js/Python/etc.)
    ↓
OpenAI API
```

3. **Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Set usage quotas per user/session

4. **Cost Management**
   - Monitor OpenAI API usage costs
   - GPT-4 Turbo: ~$0.01 per conversation
   - Set spending alerts in OpenAI dashboard

---

## Customization Options

### Adjust Conversation Style

Edit the `systemPrompt` in `ChatWidget.jsx`:

```javascript
const systemPrompt = `You are a friendly tax assistant for [Company Name].

Be professional but warm. Use these guidelines:
- Address user by name once you know it
- Explain why you need each piece of information
- Offer examples when asking for numbers
- Confirm understanding with summaries
- Keep responses concise but helpful

[... rest of prompt ...]`;
```

### Add Visual Feedback

Show filled fields in real-time:

```javascript
// Add to ChatWidget component
<div style={{ padding: '15px', backgroundColor: '#f5f5f5', marginTop: '10px' }}>
  <h4>Information Collected:</h4>
  <ul>
    {formData.name && <li>✅ Name: {formData.name}</li>}
    {formData.income && <li>✅ Income: ${formData.income.toLocaleString()}</li>}
    {formData.state && <li>✅ State: {formData.state}</li>}
    {formData.filingStatus && <li>✅ Filing Status: {formData.filingStatus}</li>}
    {/* Add more as needed */}
  </ul>
</div>
```

### Different Chat Styles

**Casual/Friendly:**
```javascript
"Hi there! 👋 I'm your tax strategy buddy. What's your name?"
```

**Professional/Formal:**
```javascript
"Good day. I'll be assisting you with your tax optimization analysis. May I have your full name, please?"
```

**Quick/Efficient:**
```javascript
"Tax Analysis Assistant. Name?"
```

---

## Cost Estimation

### OpenAI API Costs (GPT-4 Turbo)

**Per Conversation:**
- Input tokens: ~1,000 tokens (system prompt + conversation)
- Output tokens: ~500 tokens (GPT responses)
- **Cost**: ~$0.01 - $0.03 per analysis

**Monthly Estimates:**
- 100 analyses/month: ~$1-3
- 500 analyses/month: ~$5-15
- 1,000 analyses/month: ~$10-30

**Tips to Reduce Costs:**
- Use GPT-3.5 Turbo instead (10x cheaper, but less accurate)
- Cache common responses
- Limit conversation length

---

## Troubleshooting

### Chat Not Appearing

**Check:**
1. Passcode is exactly "CHAT" (uppercase)
2. `userConfig.frontEndConfig.useChat === true`
3. `ChatWidget` component imported correctly
4. Console for errors

### Functions Not Being Called

**Check:**
1. OpenAI API key is valid
2. Tools array is formatted correctly
3. GPT model supports function calling (gpt-4-turbo, gpt-3.5-turbo)
4. Console logs for function call responses

### Analysis Not Starting

**Check:**
1. All required fields are filled
2. `isFormComplete()` returns true
3. `onComplete()` callback is being called
4. Form data format matches expected structure

### High API Costs

**Solutions:**
- Switch to GPT-3.5 Turbo
- Add caching layer
- Implement stricter conversation limits
- Use system prompts to make GPT more concise

---

## Future Enhancements

### 1. Multi-Language Support
- Detect user language
- Respond in their preferred language
- Still extract English field names

### 2. Voice Input
- Add speech-to-text
- Allow voice responses
- Text-to-speech for GPT responses

### 3. Smart Defaults
- Pre-fill common values
- Remember previous analyses
- Suggest likely answers

### 4. Guided Mode
- Show progress bar
- Visual checklist
- "Skip to form" button

### 5. Hybrid Mode
- Show form fields alongside chat
- Allow switching between modes
- Update either interface updates both

---

## Summary

This implementation:
- ✅ Only shows chat for "CHAT" passcode users
- ✅ Collects all required form data conversationally
- ✅ Updates form state in real-time
- ✅ Triggers analysis when complete
- ✅ Uses existing analysis pipeline
- ✅ No changes to other passcode users

**Estimated Development Time**: 4-6 hours

**Key Files to Create/Modify:**
1. `src/components/ChatWidget.jsx` (NEW)
2. `src/components/InputForm.jsx` (MODIFY)
3. `src/App.jsx` (MINOR MODIFY)
4. `src/config/passcodes.js` (ADD "CHAT")
5. `.env` (ADD OPENAI_API_KEY)

**Next Steps:**
1. Install OpenAI package
2. Get OpenAI API key
3. Create ChatWidget component
4. Test with "CHAT" passcode
5. Refine conversation flow
6. Deploy!




