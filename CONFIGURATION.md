# Configuration Guide

Quick reference for configuring the Taxwise Partners Strategic Partner Estimator Tool.

---

## ⏱️ Adjusting Wait Times

If you're seeing `$0` values in results, the sheet calculations may not have enough time to settle. 

### How to Adjust

**File:** `src/services/googleSheetsService.js`

**Line:** ~11

```javascript
const WAIT_TIME = 5000; // Current setting: 5 seconds
```

### Recommended Values

| Symptom | Recommended WAIT_TIME | Duration Impact |
|---------|----------------------|-----------------|
| Seeing $0 in results | 7000-10000 (7-10 sec) | Analysis takes 2-3 minutes |
| Results correct but slow | 3000-4000 (3-4 sec) | Analysis takes 1-1.5 minutes |
| Fast & accurate | 5000 (5 sec) | Analysis takes ~2 minutes |

### How to Test

1. Change `WAIT_TIME` value
2. Save the file
3. Refresh browser (or dev server auto-reloads)
4. Run a test analysis
5. Check if results are accurate
6. Adjust up or down as needed

---

## 🎨 Color Scheme

Current brand colors:

**Primary Colors:**
- **Gold:** `#d4af37` (headings, buttons, progress bar)
- **Dark Gold:** `#b8941f` (button hover, gradients)
- **Black:** `#1a1a1a` (background start)
- **Dark Gray:** `#2d2d2d` (background end)
- **White:** `#ffffff` (card background)

**Accent Colors:**
- **Green:** `#10b981` (positive net gain values)
- **Red:** `#ef4444` (negative values, tax due)

### Where to Change Colors

**File:** `src/index.css`

**Key Classes:**
- `.btn-primary` - Primary button colors (line ~103)
- `.progress-bar` - Progress bar colors (line ~157)
- `.results-table thead` - Table header colors (line ~182)
- `h1, h2` - Heading colors (line ~30, ~37)
- `body` - Background gradient (line ~7)
- `.value-positive` - Green accent (line ~210)
- `.value-negative` - Red accent (line ~214)

---

## 📝 Branding

### Application Title

**HTML Title (browser tab):**
- File: `index.html`
- Line: 6
- Current: "Taxwise Partners Strategic Partner Estimator Tool"

**Page Heading:**
- File: `src/App.jsx`
- Line: 68
- Current: "Taxwise Partners Strategic Partner Estimator Tool"

**Subtitle:**
- File: `src/App.jsx`
- Line: 69-71
- Current: "Calculate potential net gains across 5 different tax optimization scenarios"

---

## 🔗 Google Apps Script Configuration

### Web App URL

**File:** `.env`

```
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

**Important:** Changes to `.env` require restarting the dev server!

```bash
# Stop server: Ctrl+C
# Restart:
npm run dev
```

---

## 📊 Sheet Cell Mappings

If you need to change which cells the app reads/writes:

**File:** `google-apps-script/Code.gs`

**Input Cells (Blended Solution Calculator):**
- Line 78: `sheet.getRange('C4').setValue(data.income);`
- Line 79: `sheet.getRange('B4').setValue(data.state);`
- Line 80: `sheet.getRange('B9').setValue(data.filingStatus);`
- Line 81: `sheet.getRange('G10').setValue(data.avgIncome);`

**Output Cells (Detailed Summary):**
- Line 156: `const agi = summarySheet.getRange('E117').getValue();`
- Line 157: `const totalTaxDue = summarySheet.getRange('D14').getValue();`
- Line 158: `const totalNetGain = summarySheet.getRange('H22').getValue();`

**Working Cells Used During Scenarios:**
- B43: Reset between scenarios
- F47: Solar credit (set based on F51)
- F51: Calculated solar credit (checked for negative)
- C90: Donation percentage (30% or 60%)
- C91: Donation source reference
- C92: Donation formula target
- G47: Solar with refund
- H51: Refund calculation

**After changing cell references:**
1. Save the script
2. Deploy → Manage deployments
3. Click pencil icon
4. New version → Deploy
5. Test the changes

See `SCENARIO_LOGIC_UPDATE.md` for detailed scenario flow and cell usage.

---

## 🧪 Test Cases

Quick test data for verifying changes:

**Test 1 - Basic:**
- Income: `$75,000`
- Avg Income: `$70,000`
- State: `North Carolina`
- Filing: `Single`

**Test 2 - High Income:**
- Income: `$200,000`
- Avg Income: `$195,000`
- State: `New York`
- Filing: `Married Filing Jointly`

Expected: All 5 scenarios show non-zero values

---

## 🔧 Common Adjustments

### Make Analysis Faster
- Decrease `WAIT_TIME` in `googleSheetsService.js`
- Risk: May show $0 if too fast

### Make Analysis More Accurate
- Increase `WAIT_TIME` in `googleSheetsService.js`
- Trade-off: Takes longer to complete

### Change Progress Messages
- Edit `src/services/googleSheetsService.js`
- Look for `onProgress()` calls
- Example line 180: `onProgress(10, 'Setting up baseline scenario...');`

### Add More Form Fields
- Edit `src/components/InputForm.jsx` (add field)
- Edit `google-apps-script/Code.gs` (add cell write)
- Edit `src/constants.js` (if dropdown options needed)

---

## 📱 Responsive Breakpoints

**File:** `src/index.css` (line ~273)

```css
@media (max-width: 768px) {
  /* Mobile styles */
}
```

Change `768px` to adjust when mobile layout kicks in.

---

## 🎯 Quick Reference

| What to Change | File | Line |
|----------------|------|------|
| Wait time | `src/services/googleSheetsService.js` | ~11 |
| Colors | `src/index.css` | Various |
| Title | `index.html` | 6 |
| Heading | `src/App.jsx` | 68 |
| Cell references | `google-apps-script/Code.gs` | 78-81, 113-115 |
| Google Script URL | `.env` | 1 |

---

## 🚨 Remember

1. **After changing `.env`** → Restart dev server
2. **After changing Google Apps Script** → Redeploy Web App
3. **After changing colors** → Refresh browser
4. **After changing wait time** → Refresh browser

---

This configuration guide makes it easy to fine-tune the application without diving through all the documentation!

