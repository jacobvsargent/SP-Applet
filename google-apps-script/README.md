# Google Apps Script Setup

This directory contains the Google Apps Script code that needs to be deployed as a Web App to enable communication between the frontend and your Google Sheet.

## Prerequisites

- Access to the Google Sheet named "TSA_SP_APPLET"
- The sheet must have two tabs:
  - "Blended Solution Calculator" (for inputs and calculations)
  - "Detailed Summary" (for reading results)
- The following functions must already exist in your sheet's script:
  - `solveForITC()`
  - `solveForITCRefund()`
  - `zeroCellsByColor()`

## Deployment Steps

### 1. Open the Apps Script Editor

1. Open your Google Sheet
2. Click on **Extensions** → **Apps Script**

### 2. Add the Code

1. If there's existing code, you can either:
   - Add this code to the existing file, OR
   - Create a new file by clicking the **+** button next to "Files"
2. Copy the contents of `Code.gs` into the editor
3. Click **Save** (💾 icon)

### 3. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Tax Solar Analysis Web App" (optional)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. You may need to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
7. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/XXXXX/exec`)

### 4. Configure the Frontend

1. In your project root, create a `.env` file (if it doesn't exist)
2. Add the Web App URL:
   ```
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
   ```
3. Save the file
4. Restart your development server if it's running

## Testing the Setup

You can test the deployment by visiting the Web App URL in your browser with a test action:

```
https://script.google.com/macros/s/XXXXX/exec?action=getOutputs
```

You should see JSON output with `agi`, `totalTaxDue`, and `totalNetGain` values.

## Troubleshooting

### "Sheet not found" error

- Verify that your sheet has tabs named exactly:
  - "Blended Solution Calculator"
  - "Detailed Summary"

### Function not defined error

- Make sure `solveForITC()`, `solveForITCRefund()`, and `zeroCellsByColor()` exist in your sheet's script
- These functions should already be part of the "TSA_SP_APPLET" script

### CORS errors in browser

- Make sure you deployed the Web App with "Who has access" set to "Anyone"
- Try redeploying if the issue persists

### Authorization issues

- You may need to re-authorize the script if you make changes
- Go to **Deploy** → **Manage deployments** → Click the pencil icon → **Deploy**

## Updating the Script

If you need to make changes to the script:

1. Edit the code in the Apps Script editor
2. Click **Save**
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon (✏️) next to your deployment
5. Change "Version" to "New version"
6. Click **Deploy**

The Web App URL will remain the same.

## Security Notes

- The script executes with your permissions
- Anyone with the URL can trigger the script
- The script only interacts with the specific Google Sheet
- Consider adding authentication if this will be used in production
- For MVP purposes, the current setup is acceptable if the sheet doesn't contain sensitive data

## Cell Mapping Reference

### Input Cells (Blended Solution Calculator tab)
- C4: Income
- B4: State of Residence
- B9: Filing Status
- G10: Average Income (Last 3 Years)

### Output Cells (Detailed Summary tab)
- E117: AGI
- C118: Total Tax Due
- H22: Total Net Gain

### Formula/Value Cells Used During Scenarios
- F47: Solar credit formula (Scenario 2, 4)
- G47: Solar credit with refund (Scenario 5)
- C90: Donation percentage (30% or 60%)
- C92: Donation formula

