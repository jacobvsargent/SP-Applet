# Quick Test Checklist

## ✅ Testing the CHAT Integration

### Before Testing
- ✅ OpenAI package installed
- ✅ `.env` file created with API key
- ✅ Dev server running: `http://localhost:3000/SP-Applet/`

---

## Test 1: CHAT Passcode User

### Steps:
1. Open browser: `http://localhost:3000/SP-Applet/`
2. Enter passcode: `CHAT`
3. Click Submit/Login

### Expected Results:
- [ ] **NO** "Strategic Partner Estimator Tool" header visible
- [ ] **NO** subtitle text visible
- [ ] **NO** Taxwise Partners logo visible in top-right
- [ ] **ONLY** the chat interface is visible
- [ ] Chat shows: "💬 Tax Analysis Assistant" header
- [ ] First message: "Hi! I'm here to help you analyze tax optimization scenarios. Let's start with your name - what should I call you?"

### Test Conversation:
```
You: My name is John Smith
GPT: [Acknowledges name, asks for income]

You: I make 150 thousand dollars
GPT: [Acknowledges income, asks for state]

You: California
GPT: [Acknowledges state, asks for filing status]

You: married filing jointly
GPT: [Acknowledges status, asks for 2022 tax info]

You: I paid 25k in federal taxes in 2022
GPT: [Shows summary, asks "Ready to run your analysis?"]

You: yes
GPT: "Perfect! Running your analysis now... 🚀"
[Analysis should start]
```

---

## Test 2: MARK Passcode User (Non-CHAT)

### Steps:
1. Refresh browser or logout
2. Enter passcode: `MARK`
3. Click Submit/Login

### Expected Results:
- [ ] ✅ "Strategic Partner Estimator Tool" header **IS** visible
- [ ] ✅ Subtitle text **IS** visible
- [ ] ✅ Taxwise Partners logo **IS** visible in top-right
- [ ] ✅ Traditional form **IS** visible
- [ ] ✅ **NO** chat interface visible
- [ ] ✅ All form fields work as before:
  - Name input
  - Income inputs
  - State dropdown
  - Filing status dropdown
  - Donation preference radio buttons
  - Scenario checkboxes
  - "Run Scenarios" button

---

## Test 3: WTAI Passcode User (Non-CHAT)

### Steps:
1. Refresh browser or logout
2. Enter passcode: `WTAI`
3. Click Submit/Login

### Expected Results:
- [ ] ✅ Same as Test 2 (traditional form visible, no chat)

---

## Test 4: TEST Passcode User (Non-CHAT)

### Steps:
1. Refresh browser or logout
2. Enter passcode: `TEST`
3. Click Submit/Login

### Expected Results:
- [ ] ✅ Same as Test 2 (traditional form visible, no chat)

---

## Test 5: ADMI Passcode User (Non-CHAT)

### Steps:
1. Refresh browser or logout
2. Enter passcode: `ADMI`
3. Click Submit/Login

### Expected Results:
- [ ] ✅ Same as Test 2 (traditional form visible, no chat)

---

## Visual Comparison

### CHAT User View:
```
┌─────────────────────────────────────────┐
│ (NO HEADER - BLANK SPACE)              │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 💬 Tax Analysis Assistant         │  │
│ ├───────────────────────────────────┤  │
│ │                                   │  │
│ │  Assistant: Hi! I'm here to...   │  │
│ │                                   │  │
│ │           User: My name is John  │  │
│ │                                   │  │
│ │  Assistant: Great! What's your...│  │
│ │                                   │  │
│ ├───────────────────────────────────┤  │
│ │ [Type message...]    [Send]       │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Non-CHAT User View:
```
┌─────────────────────────────────────────┐
│ Strategic Partner Estimator Tool   🏢   │
│ This product is in beta...              │
├─────────────────────────────────────────┤
│ Name: [_______________]                 │
│                                         │
│ 2025 Income: [_______________]          │
│ Capital Gains: [_______________]        │
│                                         │
│ State: [▼ Select a state...]           │
│ Filing Status: [▼ Select status...]    │
│                                         │
│ Donation Strategy:                      │
│  ( ) Land  ( ) Medtech  (•) Both       │
│                                         │
│ Select Scenarios:                       │
│  [ ] Solar Only                         │
│  [ ] Donation Only                      │
│  [ ] Solar + Donation (No Refund)      │
│                                         │
│ [Run Scenarios]                         │
└─────────────────────────────────────────┘
```

---

## Common Issues & Fixes

### Issue: Chat not showing for CHAT user
**Fix**: Check browser console for errors. Verify `.env` file exists.

### Issue: "OpenAI API error"
**Fix**: Verify API key is correct in `.env` file.

### Issue: Chat shows for non-CHAT users
**Fix**: Check `src/config/passcodes.js` - ensure only CHAT has `useChat: true`.

### Issue: Header still visible for CHAT user
**Fix**: Check `src/App.jsx` - verify conditional rendering logic.

---

## Success Criteria

All tests pass when:
- ✅ CHAT user sees **only** chat interface (no header/logo)
- ✅ Non-CHAT users see **only** traditional form (with header/logo)
- ✅ CHAT conversation successfully collects all data
- ✅ CHAT analysis runs and shows results
- ✅ Non-CHAT form still works exactly as before
- ✅ No console errors in browser
- ✅ No build errors in terminal

---

## Debug Mode

For CHAT users, there's a debug panel at the bottom of the chat:
- Click "Debug: Collected Data" to see form state
- Verify fields are being populated correctly
- Only visible in development mode

---

## Performance Notes

- First chat message may take 2-3 seconds (OpenAI API call)
- Subsequent messages: 1-2 seconds
- Total conversation time: ~30-60 seconds
- Analysis runs normally after chat completion

---

## Quick Commands

### Start dev server:
```bash
npm run dev
```

### Stop dev server:
```
Ctrl+C in terminal
```

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

---

## Ready to Test! 🚀

1. Open: `http://localhost:3000/SP-Applet/`
2. Try passcode: `CHAT`
3. Start chatting!
4. Then test other passcodes to verify they still work

---

**Questions or Issues?**
Check `IMPLEMENTATION_SUMMARY.md` for detailed information.

