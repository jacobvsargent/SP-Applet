# Workbook Copy Feature Implementation

## Overview
The application now creates full workbook copies (all sheets) instead of single-sheet snapshots. Each analysis session creates a unique folder containing 1-5 workbook copies depending on the analysis type.

---

## What Changed

### 1. **Snapshot Feature → Commented Out**
- The `createSnapshot()` function in both frontend and backend is now commented out (not deleted)
- Single-sheet snapshots are no longer created
- All snapshot-related code is preserved for potential future use

### 2. **New Workbook Copy Feature**

#### **Frontend (`src/services/googleSheetsService.js`)**
- Added `createWorkbookCopy(scenarioName, userInputs)` function
- All scenario functions now accept `userInputs` parameter
- Each scenario calls `createWorkbookCopy()` after capturing outputs
- Works for both full analysis (5 scenarios) and "Scenario 5 Only"

#### **Backend (`google-apps-script/Code.gs`)**
- New `createWorkbookCopy(scenarioName, userInputs)` function
- Creates a folder named: `Analysis - $75k - NC - Single - 2025-10-30_143022`
- Creates workbook copies named: `1 - Do Nothing - 2025-10-30_143022`

---

## How It Works

### **Folder Creation**
1. **Location**: Same Google Drive folder as the original spreadsheet
2. **Naming Format**: `Analysis - [Income] - [State] - [Filing Status] - [Timestamp]`
   - Example: `Analysis - $75k - NC - Single - 2025-10-30_143022`
3. **Reuse**: The folder is created once per analysis session
4. **All scenario workbooks** go into this single folder

### **Workbook Copy Creation**
1. **Full Workbook**: Copies the **entire spreadsheet** (all sheets, not just one)
2. **Static Values**: All formulas are converted to values (like a screenshot)
3. **Naming Format**: `[Scenario Name] - [Timestamp]`
   - Example: `1 - Do Nothing - 2025-10-30_143022`
   - Example: `5 - Solar + Donation (With Refund) - 2025-10-30_143022`

### **Permissions**
- Copied workbooks inherit the same sharing permissions as the original spreadsheet
- Anyone with access to the original can access the copies

---

## Analysis Session Results

### **Full Analysis (All 5 Scenarios)**
Creates a folder with **5 workbook copies**:
1. `1 - Do Nothing - 2025-10-30_143022`
2. `2 - Solar Only - 2025-10-30_143022`
3. `3 - Donation Only - 2025-10-30_143022`
4. `4 - Solar + Donation (No Refund) - 2025-10-30_143022`
5. `5 - Solar + Donation (With Refund) - 2025-10-30_143022`

### **Scenario 5 Only**
Creates a folder with **1 workbook copy**:
1. `5 - Solar + Donation (With Refund) - 2025-10-30_143022`

---

## Technical Details

### **Timing**
- Workbook copies are created **after** capturing outputs for each scenario
- The original spreadsheet remains untouched (no cleanup during scenario 5 only)
- Full cleanup (`zeroCellsByColor()`) only runs after full analysis

### **Progress Messages**
Updated progress messages:
- "Saving Do Nothing workbook..."
- "Saving Solar Only workbook..."
- "Saving Donation Only workbook..."
- "Saving Solar + Donation (No Refund) workbook..."
- "Saving Solar + Donation (With Refund) workbook..."

### **Function Signatures**
All scenario functions now include `userInputs`:
```javascript
runScenario1(userInputs, onProgress)
runScenario2(userInputs, onProgress)
runScenario3(userInputs, onProgress)
runScenario4(userInputs, onProgress)
runScenario5(userInputs, onProgress)
```

---

## Backend Implementation

### **`createWorkbookCopy()` Function**
```javascript
function createWorkbookCopy(scenarioName, userInputs) {
  // 1. Get original file and parent folder
  // 2. Create/find analysis folder
  // 3. Make full workbook copy
  // 4. Convert ALL sheets' formulas to values
  // 5. Return success with file URL
}
```

### **Key Features**
- **Format Income**: `$75000` → `$75k` for cleaner folder names
- **Reuse Folders**: Checks if folder exists before creating
- **All Sheets**: Iterates through every sheet in the workbook
- **Formula Conversion**: Replaces every formula with its calculated value
- **Returns URL**: Provides direct link to the copied workbook

---

## Deployment Required

### ⚠️ **IMPORTANT: You Must Redeploy Google Apps Script**

1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. Replace `Code.gs` with the updated version
4. Click **Deploy** > **Manage deployments**
5. Click the pencil icon (✏️) next to your active deployment
6. Change version to "New version"
7. Click **Deploy**

**The frontend changes are immediate, but the backend changes require redeployment!**

---

## Benefits

### **vs. Single Sheet Snapshots**
✅ **Complete Context**: All sheets are preserved, not just one  
✅ **Separate Files**: Each scenario is its own workbook  
✅ **Organized**: All scenarios grouped in one folder  
✅ **Static Values**: Cannot be accidentally modified  
✅ **Original Untouched**: Master sheet remains clean  
✅ **Easy Sharing**: Send folder link or individual workbooks  

### **User Experience**
✅ **Clear Organization**: Folder name shows analysis details  
✅ **Easy Navigation**: All scenarios in one place  
✅ **Historical Record**: Timestamp ensures uniqueness  
✅ **No Clutter**: Original spreadsheet doesn't fill with snapshot tabs  

---

## File Structure Example

```
📁 My Google Drive
  📁 Tax Analysis Folder
    📊 Tax Solar Analysis (Original Spreadsheet)
    📁 Analysis - $75k - NC - Single - 2025-10-30_143022
      📊 1 - Do Nothing - 2025-10-30_143022
      📊 2 - Solar Only - 2025-10-30_143022
      📊 3 - Donation Only - 2025-10-30_143022
      📊 4 - Solar + Donation (No Refund) - 2025-10-30_143022
      📊 5 - Solar + Donation (With Refund) - 2025-10-30_143022
```

---

## Testing Checklist

- [ ] Run full analysis (5 scenarios)
- [ ] Check folder is created in correct location
- [ ] Verify folder name format
- [ ] Confirm 5 workbook copies exist
- [ ] Open a copy and verify all sheets are present
- [ ] Verify formulas are replaced with values
- [ ] Run "Scenario 5 Only"
- [ ] Verify only 1 workbook copy is created
- [ ] Check sharing permissions match original

---

## Rollback Plan

If you need to revert to the old snapshot feature:

### **Frontend**
1. Comment out `createWorkbookCopy()` calls
2. Uncomment `createSnapshot()` calls

### **Backend**
1. Uncomment the `createSnapshot()` function
2. Comment out the `createWorkbookCopy()` function
3. Update the `doPost` case statement
4. Redeploy

---

## Summary

✅ **Snapshot feature commented out (preserved)**  
✅ **New workbook copy feature implemented**  
✅ **Folder organization added**  
✅ **All sheets copied with static values**  
✅ **Works for both full and Scenario 5 only**  
✅ **Original spreadsheet remains clean**  
✅ **Requires backend redeployment**  

---

**Ready to Deploy!** 🚀

