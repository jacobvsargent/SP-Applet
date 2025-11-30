# Quick Setup Guide: Adding New Passcodes

This guide shows you how to add new passcodes for additional users.

## Step 1: Edit the Passcode Configuration File

Open `src/config/passcodes.js` and add your new passcode:

```javascript
export const VALID_PASSCODES = {
  'MARK': {
    userId: 'MARK',
    displayName: 'Mark',
  },
  // Add your new passcode here:
  'JOHN': {
    userId: 'JOHN',
    displayName: 'John Doe',
  },
};
```

## Step 2: Choose a Good Passcode

### Best Practices:
- ✅ Use 4 characters (letters and/or numbers)
- ✅ Make it memorable for the user
- ✅ Use uppercase for consistency (system converts to uppercase automatically)
- ✅ Avoid easily guessed codes like '0000' or '1234'

### Examples:
- `'ALEX'` - First name
- `'JD01'` - Initials + number
- `'BLUE'` - Word-based
- `'2024'` - Year-based

## Step 3: Configure User Details

Each passcode entry requires:

```javascript
'CODE': {
  userId: 'CODE',          // Unique identifier (usually same as passcode)
  displayName: 'Name',     // Human-readable name for logs/UI
}
```

### Optional (Future Use):
```javascript
'CODE': {
  userId: 'CODE',
  displayName: 'Name',
  frontEndConfig: {
    // Custom UI settings
    theme: 'default',
    features: ['solar', 'donation', 'ctb']
  },
  backEndConfig: {
    // Backend permissions/settings
    permissions: ['read', 'write'],
    rateLimit: 100
  }
}
```

## Step 4: Save and Rebuild

After editing the file:

### Development:
```bash
# Your dev server will auto-reload
# Just refresh the browser
```

### Production:
```bash
# Rebuild the application
npm run build

# Deploy the new dist/ folder
# (Vercel, Netlify, GitHub Pages, etc.)
```

## Step 5: Test the New Passcode

1. Clear your browser's localStorage:
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Delete "sp_applet_passcode"
   - Refresh the page

2. Enter the new passcode
3. Verify access is granted
4. Run a test analysis
5. Check that the folder name includes the new passcode

## Example: Adding Multiple Users

```javascript
export const VALID_PASSCODES = {
  // Original user
  'MARK': {
    userId: 'MARK',
    displayName: 'Mark',
  },
  
  // Sales team
  'JOHN': {
    userId: 'JOHN',
    displayName: 'John Doe',
  },
  'JANE': {
    userId: 'JANE',
    displayName: 'Jane Smith',
  },
  
  // Admin access
  'ADMN': {
    userId: 'ADMN',
    displayName: 'Administrator',
  },
  
  // Client access codes
  'CL01': {
    userId: 'CL01',
    displayName: 'Client Portal 1',
  },
  'CL02': {
    userId: 'CL02',
    displayName: 'Client Portal 2',
  },
};
```

## Folder Organization

With the passcode system, your Google Drive folders will be organized as:

```
Analysis Folder/
├── MARK - John Smith - $75k - NC - Single - 2025-11-30/
│   ├── Scenario 1 - Baseline.xlsx
│   ├── Scenario 2 - Solar Only.xlsx
│   └── ...
├── JOHN - Jane Doe - $120k - CA - Married - 2025-11-30/
│   ├── Scenario 1 - Baseline.xlsx
│   └── ...
└── ADMN - Test Client - $200k - NY - Single - 2025-11-30/
    └── ...
```

This makes it easy to:
- Track which user created each analysis
- Filter/search by passcode
- Monitor usage per user
- Organize client work

## Troubleshooting

### New passcode not working
- Check spelling and uppercase in `passcodes.js`
- Verify you saved the file
- Clear browser cache and localStorage
- Rebuild if in production

### Old sessions still active
- Users need to clear localStorage or use incognito
- Or: Add a version number to force logout

### Want to remove a passcode
- Simply delete the entry from `VALID_PASSCODES`
- Existing sessions will be invalidated on next refresh
- Rebuild and redeploy

## Security Notes

⚠️ **Important**: This is a soft security system. Passcodes are visible in the client-side code.

**Current system is best for:**
- Internal team use
- User identification
- Organization and tracking
- Soft access control

**Not suitable for:**
- High-security applications
- Protecting sensitive financial data
- Compliance with strict security requirements

For stronger security, see the "Recommendations for Production" section in [PASSCODE_SYSTEM.md](PASSCODE_SYSTEM.md).

## Questions?

- Full documentation: [PASSCODE_SYSTEM.md](PASSCODE_SYSTEM.md)
- Technical details: [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md)
- General info: [README.md](README.md)

---

**Quick Reference:**
- Passcode file: `src/config/passcodes.js`
- Component: `src/components/PasscodeGate.jsx`
- Backend handling: `google-apps-script/Code.gs` (lines 473-479, 665-671)

