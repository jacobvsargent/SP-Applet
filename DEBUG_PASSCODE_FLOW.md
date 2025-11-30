# Debug Guide: Passcode Not Passing Through

## ✅ Test Function Works, Real App Doesn't

Since `testPasscodeFolder()` worked, we know:
- ✅ Apps Script code is correct
- ✅ Folder creation logic works
- ✅ Apps Script is deployed correctly

**The issue is: Passcode not being passed from frontend → backend**

---

## 🔍 Step-by-Step Debugging

### Step 1: Check Frontend Console

1. **Open your browser** and go to the app
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Login with passcode** "MARK"
5. **Fill out the form** and click "Run Scenarios"

### Look for these logs in Console:

```javascript
✅ Passcode accepted: MARK

🔐 Form submission with passcode: {
  passcode: "MARK",           // ← Should be "MARK", not null!
  hasPasscode: true,          // ← Should be true
  formDataWithPasscode: {
    name: "...",
    income: 75000,
    passcode: "MARK"          // ← Should be here!
  }
}

📁 createAnalysisFolder called with: {
  hasPasscode: true,          // ← Should be true
  passcode: "MARK",           // ← Should be "MARK"
  userInputs: { ... }
}
```

---

## 🚨 If Passcode is NULL or Undefined

### Possible Causes:

**1. Session Not Persisting**
- Passcode saved in localStorage but not in App state
- Check: `localStorage.getItem('sp_applet_passcode')`
- Should return: `"MARK"`

**2. PasscodeGate Not Calling Callback**
- `handlePasscodeValid` not being called
- `setPasscode()` not executing

**3. Passcode State Lost Before Submission**
- Passcode state exists on login but disappears later
- Page refresh or navigation issue

### Fix: Add Defensive Check

If passcode is null, let me add a fallback to get it from localStorage:

```javascript
// In handleFormSubmit
const passcode = this.state.passcode || localStorage.getItem('sp_applet_passcode');
```

---

## 📊 What to Look For

### In Browser Console (F12 → Console):

| Log Message | What It Means | What to Check |
|-------------|---------------|---------------|
| `✅ Passcode accepted: MARK` | Login successful | ✅ Good |
| `passcode: null` in form submission | Passcode state is null | ❌ Problem! Check state |
| `hasPasscode: false` | Passcode missing from data | ❌ Problem! |
| `📁 createAnalysisFolder called with: { passcode: "MARK" }` | Passcode being sent to backend | ✅ Good |

### In Apps Script Logs (Executions tab):

| Log Message | What It Means |
|-------------|---------------|
| `createFolder action - passcode value: MARK` | Backend received passcode | ✅ Good |
| `createFolder action - passcode value: undefined` | Backend didn't receive it | ❌ Problem! |
| `Passcode from userInputs: MARK` | createAnalysisFolder got it | ✅ Good |
| `Passcode from userInputs: UNKNOWN` | No passcode in userInputs | ❌ Problem! |

---

## 🔧 Quick Tests

### Test 1: Check Passcode State
Open browser console and run:
```javascript
// Should show "MARK"
localStorage.getItem('sp_applet_passcode')
```

### Test 2: Check App State (React DevTools)
1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Find `<App>` component
4. Check state → `passcode` should be "MARK"

### Test 3: Check Network Request
1. Open DevTools → Network tab
2. Run analysis
3. Find request to Google Apps Script URL
4. Look at Query String Parameters
5. Check if `userInputs` contains `"passcode":"MARK"`

---

## 💡 Most Likely Issue

The passcode state might not be set properly when PasscodeGate calls the callback. Let me check the flow:

1. User enters "MARK"
2. PasscodeGate validates it
3. Calls `onPasscodeValid("MARK", config)`
4. App.jsx `handlePasscodeValid` sets state
5. **BUT** - Is state set before form is submitted?

### Potential Race Condition

If form is submitted too quickly after login, `passcode` state might still be null.

---

## 🛠️ Immediate Fix Options

### Option 1: Get Passcode from localStorage as Fallback

Update `handleFormSubmit` in App.jsx:

```javascript
// Add passcode to formData - use state or fallback to localStorage
const currentPasscode = passcode || localStorage.getItem('sp_applet_passcode');

const formDataWithPasscode = {
  ...formData,
  passcode: currentPasscode
};

console.log('🔐 Form submission with passcode:', {
  passcode: currentPasscode,
  fromState: passcode,
  fromStorage: localStorage.getItem('sp_applet_passcode'),
  hasPasscode: !!currentPasscode,
  formDataWithPasscode: formDataWithPasscode
});
```

### Option 2: Block Form Until Passcode Set

Prevent form submission if passcode is null.

---

## 📝 Testing Instructions

After rebuilding:

1. **Clear everything and start fresh:**
   ```javascript
   // In browser console:
   localStorage.clear();
   // Refresh page
   ```

2. **Login with "MARK"**
   - Check console shows: `✅ Passcode accepted: MARK`

3. **Fill form and submit**
   - Watch console for the debug logs
   - Take screenshot of console output

4. **Check Apps Script Executions**
   - Go to Apps Script → Executions tab
   - Find latest `createAnalysisFolder` execution
   - Check logs for passcode value
   - Take screenshot

5. **Share Results**
   - Console screenshot showing passcode logs
   - Apps Script execution log screenshot

This will tell us exactly where the passcode is being lost!

---

## 🎯 Expected Flow

```
User logs in
    ↓
PasscodeGate validates "MARK"
    ↓
PasscodeGate calls onPasscodeValid("MARK", config)
    ↓
App.handlePasscodeValid sets state.passcode = "MARK"
    ↓
User fills form
    ↓
User submits form
    ↓
handleFormSubmit reads state.passcode = "MARK"
    ↓
Creates formDataWithPasscode with passcode: "MARK"
    ↓
Passes to runSelectedScenarios(formDataWithPasscode, ...)
    ↓
createAnalysisFolder(formDataWithPasscode)
    ↓
makeRequest('createFolder', { userInputs: JSON.stringify(formDataWithPasscode) })
    ↓
Apps Script doGet receives e.parameter.userInputs
    ↓
Parses JSON → userInputs object with passcode: "MARK"
    ↓
createAnalysisFolder(userInputs) → sees passcode!
```

**Where is it breaking?** The console logs will tell us!

