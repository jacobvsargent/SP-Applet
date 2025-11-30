# Passcode System Documentation

## Overview

The Strategic Partner Estimator Tool now includes a passcode-based access control system. This provides a soft security layer and enables user identification for custom configurations.

## How It Works

### Front-End

1. **Initial Access**: When a user visits the application, they are presented with a passcode input overlay that blurs the main interface.

2. **Passcode Entry**: Users enter a 4-character passcode (letters/numbers, case-insensitive).

3. **Validation**: The passcode is validated against a list of authorized codes stored in `src/config/passcodes.js`.

4. **Session Persistence**: Valid passcodes are stored in `localStorage` to maintain the session across page refreshes.

5. **Access Granted**: Upon successful validation, the overlay is removed and the user can access the tool.

### Back-End

1. **Folder Naming**: The passcode is passed through the function chain to Google Apps Script.

2. **Document Organization**: When creating analysis folders in Google Drive, the passcode is prepended to the folder name.
   - Format: `PASSCODE - Name - Income - State - Filing Status - Date`
   - Example: `MARK - John Smith - $75k - NC - Single - 2025-11-30`

3. **User Tracking**: This allows you to easily identify which user/passcode generated each analysis.

## Configuration

### Adding New Passcodes

Edit `src/config/passcodes.js`:

```javascript
export const VALID_PASSCODES = {
  'MARK': {
    userId: 'MARK',
    displayName: 'Mark',
  },
  'JOHN': {
    userId: 'JOHN',
    displayName: 'John Doe',
  },
  'ABCD': {
    userId: 'ABCD',
    displayName: 'Another User',
  }
};
```

### Future Configuration Options

Each passcode entry can be extended with custom configurations:

```javascript
'CODE': {
  userId: 'CODE',
  displayName: 'User Name',
  frontEndConfig: {
    theme: 'dark',
    features: ['solar', 'donation', 'ctb'],
    defaultState: 'California'
  },
  backEndConfig: {
    permissions: ['read', 'write', 'admin'],
    rateLimit: 100,
    masterSpreadsheetId: 'different-spreadsheet-id'
  }
}
```

## Security Considerations

### Current Implementation (Soft Security)

- **Purpose**: User identification and organization, not high-security access control
- **Location**: Passcodes are stored in client-side JavaScript code
- **Validation**: Happens entirely in the browser
- **Best For**: Internal team use, soft access control, user identification

### Limitations

1. **Not Cryptographically Secure**: Anyone with access to the source code can view valid passcodes
2. **Client-Side Only**: No server-side validation
3. **localStorage Persistence**: Sessions persist across browser sessions until cleared

### Recommendations for Production

If you need stronger security:

1. **Backend Validation**: Move passcode validation to a secure backend service
2. **Database Storage**: Store passcodes in a secure database with encryption
3. **Session Management**: Implement proper session tokens with expiration
4. **Rate Limiting**: Prevent brute-force attempts
5. **Audit Logging**: Track all access attempts
6. **Password Hashing**: Never store plain-text passwords

## User Experience

### First Visit
1. User sees blurred interface with passcode modal
2. Enters 4-digit passcode
3. Clicks "Unlock" or presses Enter
4. Upon success, modal disappears and interface becomes accessible

### Return Visits
- If valid session exists in localStorage, user bypasses the passcode screen
- To log out/clear session: Clear browser localStorage or use Private/Incognito mode

### Error Handling
- Invalid passcode: Error message displays, input shakes, passcode clears
- Wrong length: Error message prompts for exactly 4 characters
- Auto-focus on input for immediate typing

## Implementation Details

### Files Modified

1. **`src/components/PasscodeGate.jsx`** (NEW)
   - Main passcode modal component
   - Handles validation and session management
   - Provides blur overlay

2. **`src/config/passcodes.js`** (NEW)
   - Centralized passcode configuration
   - User configuration storage
   - Helper functions for validation

3. **`src/App.jsx`** (MODIFIED)
   - Wraps entire app with PasscodeGate
   - Manages passcode state
   - Passes passcode to form submissions

4. **`src/services/googleSheetsService.js`** (NO CHANGES NEEDED)
   - Already passes userInputs (including passcode) to backend

5. **`google-apps-script/Code.gs`** (MODIFIED)
   - Updated `createWorkbookCopy()` to include passcode in folder name
   - Updated `createAnalysisFolder()` to include passcode in folder name

### Data Flow

```
User Input → PasscodeGate → App State → Form Submission → 
googleSheetsService → Google Apps Script → Folder Creation (with passcode)
```

## Testing

### Test the Passcode System

1. **Valid Passcode**: Enter "MARK" (case-insensitive) - should unlock
2. **Invalid Passcode**: Enter "XXXX" - should show error
3. **Session Persistence**: Refresh page - should remain unlocked
4. **Clear Session**: Open DevTools → Application → Local Storage → Delete "sp_applet_passcode" → Refresh
5. **Folder Naming**: Run an analysis and verify folder name includes passcode

### Test Cases

```javascript
// Valid inputs
'MARK' → ✅ Access granted
'mark' → ✅ Access granted (case-insensitive)
'MaRk' → ✅ Access granted

// Invalid inputs
'XXXX' → ❌ Invalid passcode
'MAR'  → ❌ Must be 4 characters
'MARKS' → ❌ Input limited to 4 characters
''     → ❌ Must be 4 characters
```

## Future Enhancements

### Planned Features

1. **User-Specific Configurations**
   - Custom themes per user
   - Feature toggles (enable/disable scenarios)
   - Default form values

2. **Backend Integration**
   - Server-side validation
   - Database storage
   - API authentication

3. **Session Management**
   - Logout button
   - Session expiration
   - Multi-device tracking

4. **Admin Panel**
   - Add/remove passcodes without code deployment
   - View usage analytics
   - Manage user permissions

5. **Analytics**
   - Track passcode usage
   - Monitor analysis frequency per user
   - Generate usage reports

## Troubleshooting

### Issue: Passcode screen appears every time
**Solution**: Check if localStorage is being cleared. Ensure browser allows localStorage for the site.

### Issue: Can't unlock with valid passcode
**Solution**: 
1. Check `src/config/passcodes.js` for correct passcode
2. Ensure passcode is exactly 4 characters
3. Clear browser cache and try again

### Issue: Folder names don't include passcode
**Solution**: 
1. Verify Apps Script deployment is updated
2. Check that passcode is being passed in userInputs
3. Review Apps Script logs for errors

### Issue: Need to log out/switch users
**Solution**: 
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find key "sp_applet_passcode" and delete it
4. Refresh the page

## Questions?

This is a new feature with room for expansion. If you have questions or need different behavior:

1. Check this documentation first
2. Review the code comments in `src/components/PasscodeGate.jsx` and `src/config/passcodes.js`
3. Test with different passcodes to understand the behavior
4. Let me know if you need additional features or modifications

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0

