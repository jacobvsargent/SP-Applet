# Quick Deployment Guide - Workbook Copy Feature

## ⚠️ IMPORTANT: Backend Redeployment Required

The frontend changes are already applied, but you **MUST redeploy the Google Apps Script** for the workbook copy feature to work.

---

## Step-by-Step Deployment

### 1. **Open Google Apps Script**
- Open your Google Sheet
- Go to **Extensions** > **Apps Script**

### 2. **Update the Code**
- You should see `Code.gs` in the left panel
- **Replace the entire contents** with the updated version from `google-apps-script/Code.gs`

### 3. **Redeploy the Web App**
- Click **Deploy** (top right)
- Select **Manage deployments**
- Click the **pencil icon** (✏️) next to your active deployment
- Under "Version":
  - Change from "Latest (v1, v2, etc.)" to **"New version"**
  - Add description: "Added workbook copy feature"
- Click **Deploy**
- Click **Done**

### 4. **Test the Frontend**
- **NO NEED to restart the Vite dev server** (frontend changes auto-reload)
- Open your browser
- Run a test analysis

---

## What to Expect

### **During Analysis:**
You'll see new progress messages:
- "Saving Do Nothing workbook..."
- "Saving Solar Only workbook..."
- etc.

### **After Analysis:**
1. Open your Google Drive
2. Navigate to the folder where your original spreadsheet is located
3. You should see a **new folder** named something like:
   ```
   Analysis - $75k - NC - Single - 2025-10-30_143022
   ```
4. Inside that folder, you'll find **1-5 workbook copies** (depending on analysis type):
   ```
   1 - Do Nothing - 2025-10-30_143022
   2 - Solar Only - 2025-10-30_143022
   3 - Donation Only - 2025-10-30_143022
   4 - Solar + Donation (No Refund) - 2025-10-30_143022
   5 - Solar + Donation (With Refund) - 2025-10-30_143022
   ```

---

## Verification Checklist

After deployment, verify:

- [ ] **Run "Scenario 5 Only"**
  - Should create folder with **1 workbook**
  
- [ ] **Run "Full Analysis"**
  - Should create folder with **5 workbooks**
  
- [ ] **Check Folder Location**
  - Folder should be in the same Drive location as original
  
- [ ] **Open a Workbook Copy**
  - All sheets should be present
  - Values should be static (no formulas)
  - Try editing a cell - it should just be a number, not a formula

---

## Troubleshooting

### **"No folder created"**
- Check Apps Script deployment was successful
- Look for errors in browser console (F12)
- Check Apps Script execution logs (Executions tab)

### **"Error: Unknown action: createWorkbookCopy"**
- You didn't redeploy the Apps Script
- Follow deployment steps above

### **"Formulas still present in copied workbook"**
- This shouldn't happen, but if it does:
  - Check Apps Script logs for errors
  - Verify the `createWorkbookCopy()` function was copied correctly

---

## What Changed vs. Snapshots

### **Old Behavior (Snapshots)**
- Created new **tabs** in the original spreadsheet
- Only copied **one sheet** (Blended Solution Calculator)
- Tab names: "1 - Do Nothing - timestamp"

### **New Behavior (Workbook Copies)**
- Creates **separate workbook files**
- Copies **all sheets**
- Organized in a **dedicated folder**
- Original spreadsheet stays clean

---

## Need to Rollback?

If something goes wrong and you need the old snapshot feature:

1. Open `google-apps-script/Code.gs`
2. Find the `createSnapshot()` function (currently commented out)
3. Uncomment it
4. Comment out the `createWorkbookCopy()` function
5. Update the `doPost` case statement
6. Redeploy

Then in frontend:
1. Open `src/services/googleSheetsService.js`
2. Comment out `createWorkbookCopy()` calls
3. Uncomment `createSnapshot()` calls
4. Save and refresh browser

---

## Ready to Test! 🚀

Once you've completed the deployment steps above, run a test analysis and check your Google Drive for the new folder!

