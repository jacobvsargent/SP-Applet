# Scenario Logic Update - October 30, 2025

## Summary of Changes

Updated the scenario execution logic based on user feedback to ensure proper calculation flow and handling of negative solar credit values.

---

## Changes Made

### 1. Added Cell Value Reading Capability

**Frontend (`src/services/googleSheetsService.js`):**
- Added `getValue(cell)` function to read specific cell values
- Allows checking if F51 is negative before setting F47

**Backend (`google-apps-script/Code.gs`):**
- Added `getSingleValue(cell)` function
- Added `getValue` case to the `doGet()` handler
- Returns cell value from Blended Solution Calculator sheet

---

## 2. Scenario 3: Donation Only

**New Logic:**
```
1. Set B43 = 0 (transition from Solar Only to Donation Only)
2. Set F47 = 0
3. Write formula: C92 = C91 (changed from =B92)
4. Set C90 = 60% (for maximum)
5. Capture maximum results
6. Set C90 = 30% (for minimum)
7. Capture minimum results
8. Reset C90 = 60%
```

**Key Changes:**
- ✅ Added: Set B43 to 0 when transitioning from Solar Only
- ✅ Changed: C92 formula from `=B92` to `=C91`

---

## 3. Scenario 4: Solar + Donation (No Refund)

**New Logic:**
```
1. Do donation part FIRST:
   - Write formula: C92 = C91
   - Set C90 = 60%

2. Call solveForITC()

3. Check F51 value:
   - If F51 < 0:
     * Set F47 = 0
     * Run solveForITC() again
   - Otherwise:
     * Write formula: F47 = F51

4. Capture maximum results

5. Set C90 = 30%

6. Check F51 again and handle negative values

7. Capture minimum results

8. Reset C90 = 60%
```

**Key Changes:**
- ✅ Changed: Donation part runs BEFORE solar optimization
- ✅ Added: Check if F51 is negative
- ✅ Added: If negative, set F47 = 0 and run solver again
- ✅ Added: Otherwise, F47 = F51
- ✅ Changed: C92 formula from `=B92` to `=C91`

---

## 4. Scenario 5: Solar + Donation (With Refund)

**New Logic:**
```
1. Do donation part FIRST:
   - Write formula: C92 = C91
   - Set C90 = 60%

2. Call solveForITCRefund()

3. Check F51 value:
   - If F51 < 0:
     * Set F47 = 0
     * Run solveForITCRefund() again
   - Otherwise:
     * Write formula: F47 = F51

4. Write formula: G47 = H51

5. Capture maximum results

6. Set C90 = 30%

7. Check F51 again and handle negative values

8. Capture minimum results

9. Reset C90 = 60%
```

**Key Changes:**
- ✅ Changed: Donation part runs BEFORE solar optimization
- ✅ Added: Check if F51 is negative
- ✅ Added: If negative, set F47 = 0 and run solver again
- ✅ Added: Otherwise, F47 = F51
- ✅ Changed: C92 formula from `=B92` to `=C91`

---

## Why These Changes Matter

### Problem: Negative Solar Credits
When the donation reduces taxable income significantly, the calculated solar credit (F51) can become negative, which doesn't make sense. The new logic:

1. **Checks F51 after solving**: Reads the calculated value
2. **Handles negatives gracefully**: Sets F47 to 0 instead of using negative value
3. **Re-runs solver**: Ensures calculations settle with F47 = 0

### Problem: Order of Operations
Previously, solar calculations ran before donations. The correct order is:

1. **Donation first**: Set up charitable donation (C92 = C91)
2. **Then solar**: Run solar optimization with donation in place
3. **Check result**: Handle negative F51 values appropriately

This ensures the solver has all the context it needs for accurate calculations.

---

## Technical Details

### New API Endpoints

**GET Request:**
```
?action=getValue&cell=F51
```

**Response:**
```json
{
  "value": 12345.67,
  "success": true
}
```

### Code Flow for Blended Scenarios (4 & 5)

```
┌─────────────────────────────┐
│ 1. Set up donation          │
│    C92 = C91, C90 = 60%/30% │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ 2. Run solver               │
│    solveForITC() or         │
│    solveForITCRefund()      │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ 3. Read F51 value           │
│    getValue('F51')          │
└────────────┬────────────────┘
             ↓
        ┌────┴────┐
        │ F51 < 0? │
        └────┬────┘
             │
    ┌────────┼────────┐
    │ YES            NO│
    ↓                 ↓
┌───────────┐  ┌──────────────┐
│ F47 = 0   │  │ F47 = F51    │
│ Re-run    │  │              │
│ solver    │  │              │
└─────┬─────┘  └──────┬───────┘
      │                │
      └────────┬───────┘
               ↓
    ┌──────────────────┐
    │ Capture results  │
    └──────────────────┘
```

---

## Files Modified

1. **`src/services/googleSheetsService.js`**
   - Added `getValue()` function
   - Updated `runScenario3()` - added B43 = 0, changed formula
   - Updated `runScenario4()` - donation first, check F51
   - Updated `runScenario5()` - donation first, check F51

2. **`google-apps-script/Code.gs`**
   - Added `getValue` case to `doGet()` handler
   - Added `getSingleValue()` function

---

## Testing Recommendations

### Test Case 1: Normal Income (No Negative F51)
- Income: $75,000
- Avg Income: $70,000
- State: North Carolina
- Filing: Single

**Expected:** All scenarios show positive values, no F47 = 0 fallback triggered

### Test Case 2: High Donation Scenario (Might Trigger Negative F51)
- Income: $200,000
- Avg Income: $195,000
- State: New York
- Filing: Married Filing Jointly

**Expected:** May see F47 = 0 in blended scenarios if F51 goes negative

### What to Look For

✅ **Good Signs:**
- All scenarios show non-zero values
- Tax due values are realistic
- Net gains are calculated correctly
- No errors in console

⚠️ **Watch Out For:**
- If still seeing $0 values, increase WAIT_TIME in `googleSheetsService.js`
- Check browser console for errors
- Verify Google Apps Script is redeployed

---

## Deployment Steps

### 1. Update Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Replace the code with updated `google-apps-script/Code.gs`
4. Click **Save**
5. Click **Deploy** → **Manage deployments**
6. Click pencil icon (✏️) → **New version** → **Deploy**

### 2. Restart Frontend

If dev server is running:
```bash
# It should auto-reload, but if not:
# Press Ctrl+C to stop
npm run dev
```

### 3. Test

Run a complete analysis with test data and verify:
- All 5 scenarios complete
- Results show non-zero values
- No console errors

---

## Troubleshooting

### Still Seeing $0 Values

1. **Increase wait time:**
   - Edit `src/services/googleSheetsService.js`
   - Line 11: Change `WAIT_TIME = 5000` to `7000` or `10000`
   - Refresh browser

2. **Check Google Apps Script:**
   - Verify it's deployed with latest code
   - Check "Executions" tab for errors
   - Ensure "Anyone" can access

3. **Verify cell references:**
   - B43, F47, F51, C90, C91, C92 all exist
   - Formulas work in sheet

### getValue Not Working

**Symptom:** Error about getValue or getSingleValue

**Solution:**
- Ensure Google Apps Script is redeployed
- Check URL in `.env` is correct
- Restart dev server after `.env` changes

### F51 Always Negative

**Symptom:** All blended scenarios show F47 = 0

**Possible Causes:**
- Solar credit calculations need adjustment in sheet
- Donation amounts too high
- Check F51 formula in sheet

---

## Summary

These changes implement more sophisticated scenario logic that:

1. ✅ Properly transitions between scenarios (B43 = 0)
2. ✅ Runs operations in correct order (donation first)
3. ✅ Handles edge cases (negative F51)
4. ✅ Uses correct cell references (C91 instead of B92)
5. ✅ Ensures accurate calculations

The app should now produce accurate results for all scenarios!

---

**Last Updated:** October 30, 2025  
**Changes By:** Scenario logic refinement based on user feedback

