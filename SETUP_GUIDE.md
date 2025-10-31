# Tax Solar Analysis - Complete Setup Guide

This guide will walk you through setting up the complete Tax Solar Analysis application from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Setup](#frontend-setup)
3. [Google Apps Script Setup](#google-apps-script-setup)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- Access to the **Google Sheet** with:
  - Tab: "Blended Solution Calculator"
  - Tab: "Detailed Summary"
  - Existing functions: `solveForITC()`, `solveForITCRefund()`, `zeroCellsByColor()`
- A code editor (VS Code recommended)

---

## Frontend Setup

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required dependencies:
- React 18
- Vite (build tool)
- React DOM

### Step 2: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
# On Windows (PowerShell)
New-Item .env

# On Mac/Linux
touch .env
```

2. Add the following line (you'll update this after setting up Google Apps Script):

```
VITE_GOOGLE_APPS_SCRIPT_URL=YOUR_URL_WILL_GO_HERE
```

**Don't worry about the actual URL yet** - we'll get this in the next section.

### Step 3: Verify File Structure

Your project should now have this structure:

```
SP Applet/
├── google-apps-script/
│   ├── Code.gs
│   └── README.md
├── src/
│   ├── components/
│   │   ├── ActionButtons.jsx
│   │   ├── ErrorDisplay.jsx
│   │   ├── InputForm.jsx
│   │   ├── ProgressBar.jsx
│   │   └── ResultsTable.jsx
│   ├── services/
│   │   └── googleSheetsService.js
│   ├── utils/
│   │   └── formatting.js
│   ├── App.jsx
│   ├── constants.js
│   ├── index.css
│   └── main.jsx
├── .env
├── .gitignore
├── index.html
├── package.json
├── README.md
├── SETUP_GUIDE.md
└── vite.config.js
```

---

## Google Apps Script Setup

This is the most important step - it connects your frontend to the Google Sheet.

### Step 1: Open Your Google Sheet

1. Open the Google Sheet that contains your tax calculation logic
2. Make sure it has the tabs: "Blended Solution Calculator" and "Detailed Summary"

### Step 2: Open Apps Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. This opens the Apps Script editor in a new tab

### Step 3: Add the Web App Code

1. In the Apps Script editor, you should see a file called `Code.gs`
2. **Option A**: If you have existing code that includes `solveForITC()`, `solveForITCRefund()`, and `zeroCellsByColor()`:
   - Click the **+** button next to "Files"
   - Name it "WebApp.gs"
   - Copy the contents from `google-apps-script/Code.gs` into this new file

3. **Option B**: If your existing code is in a different script file:
   - Add the code from `google-apps-script/Code.gs` to the bottom of your existing file

4. Click **Save** (💾 icon)

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Select **Web app**
4. Configure:
   - Description: "Tax Solar Analysis API" (optional)
   - Execute as: **Me (your email)**
   - Who has access: **Anyone**
5. Click **Deploy**

### Step 5: Authorize the Script

First time deploying, you'll need to authorize:

1. Click **Authorize access**
2. Choose your Google account
3. You'll see a warning "Google hasn't verified this app"
4. Click **Advanced**
5. Click **Go to [Your Project Name] (unsafe)**
6. Click **Allow**

### Step 6: Copy the Web App URL

1. After deployment, you'll see a "Web app URL"
2. It looks like: `https://script.google.com/macros/s/AKfycbz.../exec`
3. **Copy this entire URL**

### Step 7: Update Your .env File

1. Open the `.env` file in your project
2. Replace `YOUR_URL_WILL_GO_HERE` with the URL you just copied:

```
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbz.../exec
```

3. Save the file

---

## Testing

### Test 1: Start the Development Server

In your terminal, run:

```bash
npm run dev
```

You should see:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Test 2: Open in Browser

1. Open your browser
2. Go to `http://localhost:3000`
3. You should see the Tax Solar Analysis form

### Test 3: Run a Test Analysis

Use one of the test cases from the requirements:

**Test Case 1:**
- Income: `$75,000`
- Avg 3-year income: `$70,000`
- State: `North Carolina`
- Filing Status: `Single`

Click **Run Analysis** and watch the progress bar. The analysis should:
1. Show progress updates
2. Take approximately 30-60 seconds to complete
3. Display a results table with 5 scenarios

### Test 4: Verify Results

The results table should show:
- All 5 scenarios
- AGI, Total Tax Due, and Net Gain columns
- Formatted currency values (e.g., "$75,000")
- Color coding: Green for positive net gains, Red for tax due

### Test 5: Check Google Sheet

Open your Google Sheet and verify:
- Values were written to the input cells
- Calculations ran successfully
- The sheet was cleaned up (zeroCellsByColor was called)

---

## Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Build your project:
   ```bash
   npm run build
   ```
4. Deploy:
   ```bash
   vercel
   ```
5. Add environment variable in Vercel dashboard:
   - Go to your project settings
   - Add `VITE_GOOGLE_APPS_SCRIPT_URL` with your Google Apps Script URL

### Option 2: Deploy to Netlify

1. Create a Netlify account at [netlify.com](https://netlify.com)
2. Build your project:
   ```bash
   npm run build
   ```
3. Drag and drop the `dist` folder to Netlify
4. Add environment variable in Netlify dashboard:
   - Go to Site settings → Build & deploy → Environment
   - Add `VITE_GOOGLE_APPS_SCRIPT_URL`

### Option 3: Deploy to GitHub Pages

1. Update `vite.config.js` with your base path:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/'
   })
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Deploy the `dist` folder to GitHub Pages

---

## Troubleshooting

### Issue: "Google Apps Script URL not configured"

**Solution**: Make sure your `.env` file exists and contains the correct URL. Restart the dev server after creating/updating `.env`.

### Issue: Analysis hangs at a certain percentage

**Possible causes**:
1. Google Apps Script function doesn't exist
2. Sheet tab names don't match exactly
3. Cell references are incorrect

**Solution**: 
- Check browser console for errors
- Verify sheet tab names: "Blended Solution Calculator" and "Detailed Summary"
- Ensure `solveForITC()`, `solveForITCRefund()`, and `zeroCellsByColor()` exist

### Issue: CORS errors in browser console

**Solution**: 
- Verify your Web App is deployed with "Who has access: Anyone"
- Try redeploying the Google Apps Script
- Clear browser cache

### Issue: Results show $0 for all values

**Possible causes**:
1. Calculations haven't settled yet
2. Cell references are wrong
3. Sheet formulas aren't working

**Solution**:
- Increase wait time in `googleSheetsService.js` (change `WAIT_TIME` from 2500 to 3500)
- Verify cell references in the Google Apps Script code match your sheet

### Issue: Form validation not working

**Solution**: Check that you're entering valid formats:
- Income: `$75,000` or `75000` (both work)
- State: Select from dropdown
- Filing Status: Select from dropdown

### Issue: "Sheet not found" error

**Solution**: Your sheet must have tabs named EXACTLY:
- "Blended Solution Calculator"
- "Detailed Summary"

Check for extra spaces or typos.

---

## Next Steps

Now that your application is running:

1. **Test all scenarios** with different input values
2. **Customize the UI** by editing `src/index.css`
3. **Add email functionality** in `src/components/ActionButtons.jsx`
4. **Update the intake form URL** in `ActionButtons.jsx`
5. **Deploy to production** using one of the deployment options

---

## Support

If you encounter issues:

1. Check the browser console for errors (F12 → Console tab)
2. Check the Google Apps Script logs:
   - Apps Script editor → Executions tab
3. Review the troubleshooting section above
4. Verify all cell references match your actual sheet

---

## File Locations for Customization

- **Colors and styling**: `src/index.css`
- **Form fields**: `src/components/InputForm.jsx`
- **Scenarios**: `src/services/googleSheetsService.js`
- **Result formatting**: `src/components/ResultsTable.jsx`
- **Progress messages**: `src/services/googleSheetsService.js`
- **Action buttons**: `src/components/ActionButtons.jsx`

Happy analyzing! 🎉

