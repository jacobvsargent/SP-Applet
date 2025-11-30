# Visual Guide: Passcode System UI

This document describes what users will see and experience with the new passcode system.

---

## 🔒 Initial Access Screen

When a user first visits the site (or after logout), they see:

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  [Blurred background showing the main interface]     │
│                                                       │
│         ┌─────────────────────────────┐             │
│         │                             │             │
│         │     Access Required         │             │
│         │                             │             │
│         │  Please enter your 4-digit  │             │
│         │  passcode to access the     │             │
│         │  Strategic Partner          │             │
│         │  Estimator Tool.            │             │
│         │                             │             │
│         │  ┌─────────────────────┐   │             │
│         │  │                     │   │             │
│         │  │    [M][A][R][K]    │   │             │
│         │  │                     │   │             │
│         │  └─────────────────────┘   │             │
│         │                             │             │
│         │  ┌─────────────────────┐   │             │
│         │  │       Unlock        │   │             │
│         │  └─────────────────────┘   │             │
│         │                             │             │
│         │  This tool is for           │             │
│         │  authorized users only.     │             │
│         │                             │             │
│         └─────────────────────────────┘             │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Clean white modal with shadow
- Centered on screen
- Blurred background creates focus
- Large input field with letter spacing
- Green "Unlock" button
- Subtle footer text

---

## ❌ Invalid Passcode

When user enters wrong passcode:

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│         ┌─────────────────────────────┐             │
│         │     Access Required         │             │
│         │                             │             │
│         │  ┌─────────────────────┐   │             │
│         │  │                     │   │             │
│         │  │    [_][_][_][_]    │   │  ← Red border
│         │  │                     │   │             │
│         │  └─────────────────────┘   │             │
│         │                             │             │
│         │  ⚠️  Invalid passcode.      │             │
│         │     Please try again.       │  ← Error msg
│         │                             │             │
│         │  ┌─────────────────────┐   │             │
│         │  │       Unlock        │   │             │
│         │  └─────────────────────┘   │             │
│         │                             │             │
│         └─────────────────────────────┘             │
│                 [Shake animation]                    │
└─────────────────────────────────────────────────────┘
```

**Behavior:**
- Input border turns red
- Error message appears in red
- Entire modal shakes left-right
- Input clears automatically
- User can try again immediately

---

## ✅ Successful Login

After valid passcode, modal disappears revealing:

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Strategic Partner Estimator Tool          [Logout] [🏢 Logo]│
│  This product is in beta...                                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  Name: ____________________                          │    │
│  │                                                       │    │
│  │  2025 Ordinary Income: __________                    │    │
│  │                                                       │    │
│  │  [Rest of form...]                                   │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**New Elements:**
- Red "Logout" button in top-right corner
- Button shows current passcode on hover: "Logout (User: MARK)"
- No passcode modal visible
- Full interface accessible

---

## 🚪 Logout Flow

When user clicks logout button:

```
┌─────────────────────────────────────────┐
│                                         │
│  Are you sure you want to logout?      │
│  This will clear your session.          │
│                                         │
│         [Cancel]      [OK]              │
│                                         │
└─────────────────────────────────────────┘
```

After clicking OK:
- Session clears from localStorage
- Page reloads automatically
- Passcode modal appears again
- User must re-enter passcode

---

## 📱 Mobile View

On mobile devices (< 768px):

```
┌────────────────────┐
│                    │
│  [Blurred BG]      │
│                    │
│  ┌──────────────┐  │
│  │              │  │
│  │    Access    │  │
│  │   Required   │  │
│  │              │  │
│  │  Enter your  │  │
│  │   4-digit    │  │
│  │   passcode   │  │
│  │              │  │
│  │ ┌──────────┐ │  │
│  │ │  M A R K │ │  │
│  │ └──────────┘ │  │
│  │              │  │
│  │ ┌──────────┐ │  │
│  │ │  Unlock  │ │  │
│  │ └──────────┘ │  │
│  │              │  │
│  └──────────────┘  │
│                    │
└────────────────────┘
```

**Responsive Features:**
- Modal scales to 90% width
- Text adjusts for readability
- Input remains large and touch-friendly
- Button full-width for easy tapping

---

## 🎨 Color Scheme

### Passcode Modal
- Background: White (#ffffff)
- Border: None
- Shadow: `0 10px 40px rgba(0, 0, 0, 0.2)`
- Border Radius: 12px

### Input Field
- Normal: Gray border (#ddd)
- Focus: Green border (#4CAF50)
- Error: Red border (#f44336)
- Font: 24px, letter-spacing 8px
- Padding: 15px

### Unlock Button
- Background: Green (#4CAF50)
- Hover: Dark Green (#45a049)
- Text: White
- Font: 16px, weight 600
- Padding: 15px

### Logout Button
- Background: Red (#f44336)
- Hover: Dark Red (#d32f2f)
- Text: White
- Font: 14px, weight 500
- Padding: 8px 16px

### Error Message
- Color: Red (#f44336)
- Font: 14px, weight 500

---

## ⌨️ Keyboard Interactions

### Input Field
- **Focus**: Automatically focused on page load
- **Typing**: Accepts letters and numbers
- **Auto-uppercase**: Converts input to uppercase automatically
- **Max length**: Limited to 4 characters
- **Enter key**: Submits the form (same as clicking Unlock)
- **Escape key**: (Future) Could close modal or clear input

### Navigation
- **Tab**: Navigate between input and button
- **Shift+Tab**: Reverse navigation
- **Space**: (On button) Activate button
- **Enter**: (On button) Submit form

---

## 🎭 Animations

### Shake Animation (on error)
```css
Duration: 0.5s
Pattern: 
  0%:   translateX(0)
  10%:  translateX(-10px)
  20%:  translateX(10px)
  30%:  translateX(-10px)
  40%:  translateX(10px)
  50%:  translateX(-10px)
  60%:  translateX(10px)
  70%:  translateX(-10px)
  80%:  translateX(10px)
  90%:  translateX(-10px)
  100%: translateX(0)
```

Result: Modal shakes left-right rapidly, drawing attention to error

### Hover Transitions
- Buttons: `background-color 0.3s`
- Input focus: `border-color 0.3s`

---

## 🔔 User Feedback

### Success States
- ✅ Valid passcode → Modal disappears smoothly
- ✅ Session restored → No modal at all
- ✅ Logout → Confirmation dialog

### Error States
- ❌ Invalid passcode → Red border + error message + shake
- ❌ Wrong length → Error message "Passcode must be 4 characters"
- ❌ Empty input → Prevented by frontend validation

### Loading States
- Currently instant (client-side validation)
- Future: Could add loading spinner for server validation

---

## 📊 Folder Organization Visual

After running analyses, Google Drive structure:

```
📁 Analysis Folder (ID: 1oAKr...)
│
├── 📁 MARK - John Smith - $75k - NC - Single - 2025-11-30
│   ├── 📄 Scenario 1 - Baseline.xlsx
│   ├── 📄 Scenario 2 - Solar Only.xlsx
│   ├── 📄 Scenario 3 - Donation Only (Medtech).xlsx
│   ├── 📄 Scenario 3 - Donation Only (Land).xlsx
│   ├── 📄 Scenario 4 - Solar + Donation No Refund (Medtech).xlsx
│   └── 📄 Scenario 5 - Solar + Donation With Refund (Medtech).xlsx
│
├── 📁 JOHN - Jane Doe - $120k - CA - Married - 2025-11-30
│   └── [Analysis files...]
│
└── 📁 ADMN - Test Client - $200k - NY - Single - 2025-11-30
    └── [Analysis files...]
```

**Benefits:**
- Easy to identify who created each analysis
- Quick filtering by passcode
- Organized by user for billing/tracking
- Clean separation between different users' work

---

## 💡 Tips for Users

### First Time Setup
1. Receive passcode from administrator
2. Visit site
3. Enter passcode (case doesn't matter)
4. Click Unlock or press Enter
5. Start using the tool

### Daily Usage
- Passcode remembered across sessions
- No need to re-enter unless you logout
- Logout button always visible in top-right

### Switching Users
1. Click Logout button
2. Confirm logout
3. Enter different passcode
4. All future analyses tagged with new passcode

### Troubleshooting
- **Forgot passcode?** Contact administrator
- **Can't unlock?** Check caps lock, try lowercase
- **Need to clear session?** Use logout button
- **Private browsing?** Will need to re-enter passcode each time

---

## 🎯 User Experience Goals

**Achieved:**
✅ Simple, intuitive interface
✅ Clear error messages
✅ Smooth animations
✅ Session persistence
✅ Easy logout process
✅ Mobile-friendly
✅ Accessible (keyboard navigation)
✅ Professional appearance
✅ Matches existing design

**Maintained:**
✅ Fast load times
✅ No impact on form functionality
✅ Same workflow after login
✅ Existing features unchanged

---

This visual guide should help you understand exactly what users will see and experience with the new passcode system!

