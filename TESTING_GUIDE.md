# Testing Guide

This guide helps you test all functionality of the Tax Solar Analysis application.

## Pre-Testing Checklist

Before testing, ensure:

- ✅ Dependencies installed (`npm install`)
- ✅ `.env` file configured with Google Apps Script URL
- ✅ Google Apps Script deployed as Web App
- ✅ Development server running (`npm run dev`)
- ✅ Browser open at `http://localhost:3000`

---

## Test Suite 1: Form Validation

### Test 1.1: Required Fields

**Steps:**
1. Leave all fields empty
2. Click "Run Analysis"

**Expected Result:**
- Button should be disabled
- No submission occurs

### Test 1.2: Income Validation

**Test valid formats:**
- Enter `$75,000` → Should accept
- Enter `75000` → Should accept
- Enter `$1,234,567` → Should accept
- Enter `1234567` → Should accept

**Test invalid formats:**
- Enter `abc` → Should show error "Please enter a valid number"
- Enter `-1000` → Should show error
- Leave empty and blur → Should show error "This field is required"

### Test 1.3: State Selection

**Steps:**
1. Click state dropdown
2. Verify all 50 states + DC are present
3. Select "North Carolina"

**Expected Result:**
- Dropdown shows 51 options
- Selection works correctly

### Test 1.4: Filing Status

**Steps:**
1. Click filing status dropdown
2. Verify options: "Single" and "Married Filing Jointly"
3. Select one

**Expected Result:**
- Both options available
- Selection works correctly

---

## Test Suite 2: Complete Analysis Flow

### Test 2.1: Successful Analysis (Test Case 1)

**Input:**
- Income: `$75,000`
- Avg 3-year income: `$70,000`
- State: `North Carolina`
- Filing Status: `Single`

**Steps:**
1. Enter all values
2. Click "Run Analysis"
3. Observe progress bar
4. Wait for results

**Expected Results:**
- Progress bar appears immediately
- Progress updates through stages:
  - "Setting up your analysis..." (0-10%)
  - "Running Scenario 1: Baseline..." (10-20%)
  - "Running Scenario 2: Solar Only..." (20-35%)
  - "Running Scenario 3: Donation Only..." (35-55%)
  - "Running Scenario 4: Solar + Donation (No Refund)..." (55-75%)
  - "Running Scenario 5: Solar + Donation (With Refund)..." (75-95%)
  - "Finalizing results..." (95-100%)
- Results table appears with 5 scenarios
- All values formatted as currency (e.g., "$75,000")
- Net Gain values in green (if positive) or red (if negative)
- Total Tax Due values in red
- Scenarios 3, 4, 5 show ranges (e.g., "$10,000 - $15,000")

**Duration:** Should complete in 30-60 seconds

### Test 2.2: High Income Scenario (Test Case 2)

**Input:**
- Income: `$150,000`
- Avg 3-year income: `$145,000`
- State: `New York`
- Filing Status: `Married Filing Jointly`

**Expected Results:**
- Same flow as Test 2.1
- Higher AGI and tax values
- Different net gain amounts

### Test 2.3: DC Residence (Test Case 3)

**Input:**
- Income: `$200,000`
- Avg 3-year income: `$195,000`
- State: `DC`
- Filing Status: `Single`

**Expected Results:**
- DC handles correctly (not a state but valid)
- All calculations complete successfully

---

## Test Suite 3: Results Display

### Test 3.1: Table Formatting

**Verify:**
- ✅ Table has 4 columns: Scenario, AGI, Total Tax Due, Net Gain
- ✅ Table has 5 rows (one per scenario)
- ✅ Header has gradient background
- ✅ Rows alternate hover effect
- ✅ All currency values have $ and commas
- ✅ No decimal places shown

### Test 3.2: Color Coding

**Verify:**
- ✅ Net Gain column: Green text for positive values
- ✅ Total Tax Due column: Red text
- ✅ AGI column: Neutral/black text

### Test 3.3: Range Display

**Verify scenarios 3, 4, 5:**
- ✅ Net Gain shows format: "$X - $Y"
- ✅ Minimum value on left, maximum on right
- ✅ Both values properly formatted

---

## Test Suite 4: Action Buttons

### Test 4.1: Email Button

**Steps:**
1. Complete an analysis
2. Click "Email this to myself"

**Expected Result:**
- Alert appears: "Email functionality coming soon!"
- (This is a placeholder - TODO for future implementation)

### Test 4.2: Intake Form Button

**Steps:**
1. Click "Start the TaxWise Partners Intake Form"

**Expected Result:**
- New tab opens
- Links to placeholder URL (example.com/intake-form)
- (TODO: Replace with actual intake form URL)

### Test 4.3: New Analysis Button

**Steps:**
1. Complete an analysis
2. Click "Start a New Analysis"

**Expected Result:**
- Returns to input form
- All form fields cleared/reset
- No results displayed
- Ready for new input

---

## Test Suite 5: Error Handling

### Test 5.1: Network Error

**Steps:**
1. Stop your internet connection
2. Try to run analysis

**Expected Result:**
- Error display appears
- Shows user-friendly message
- "Retry Analysis" button available
- Console shows detailed error

### Test 5.2: Invalid Script URL

**Steps:**
1. Change `.env` to have invalid URL
2. Restart dev server
3. Try to run analysis

**Expected Result:**
- Error appears: "Google Apps Script URL not configured"
- Provides clear guidance

### Test 5.3: Retry After Error

**Steps:**
1. Cause an error (disconnect internet)
2. Run analysis
3. Reconnect internet
4. Click "Retry Analysis"

**Expected Result:**
- Analysis runs again with same inputs
- Completes successfully

---

## Test Suite 6: Google Sheets Integration

### Test 6.1: Verify Input Writing

**Steps:**
1. Open your Google Sheet
2. Navigate to "Blended Solution Calculator" tab
3. Run analysis from web app
4. Immediately check sheet

**Expected Result:**
- C4 contains income value
- B4 contains state name
- B9 contains filing status
- G10 contains average income

### Test 6.2: Verify Cleanup

**Steps:**
1. Complete full analysis
2. Check Google Sheet immediately after

**Expected Result:**
- `zeroCellsByColor()` was called
- Working cells cleared appropriately
- Sheet ready for next analysis

### Test 6.3: Concurrent Users (if applicable)

**Steps:**
1. Have two people run analyses simultaneously

**Expected Result:**
- Both complete successfully
- (Note: Results may interfere if using same sheet - this is expected for MVP)

---

## Test Suite 7: Responsive Design

### Test 7.1: Mobile View

**Steps:**
1. Open browser dev tools (F12)
2. Toggle device toolbar
3. Select "iPhone 12" or similar

**Expected Result:**
- Form fields stack vertically
- Table scrolls horizontally if needed
- Buttons stack vertically
- Text remains readable
- No horizontal overflow

### Test 7.2: Tablet View

**Steps:**
1. Select "iPad" in device toolbar

**Expected Result:**
- Layout adapts appropriately
- Table readable
- Form comfortable to use

### Test 7.3: Desktop View (1920px)

**Steps:**
1. Maximize browser window

**Expected Result:**
- Container max-width keeps content centered
- Doesn't stretch too wide
- Maintains good readability

---

## Test Suite 8: Browser Compatibility

Test in multiple browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on Mac)

**Each browser should:**
- Display correctly
- Form validation works
- Analysis completes
- Results display properly

---

## Performance Tests

### Test 8.1: Analysis Duration

**Expected:** 30-60 seconds total

**If too slow:**
- Increase `WAIT_TIME` in `googleSheetsService.js`
- Check Google Sheet calculation speed
- Verify internet connection

### Test 8.2: UI Responsiveness

**Expected:**
- Form inputs respond immediately
- No lag when typing
- Progress bar animates smoothly
- No freezing during analysis

---

## Regression Testing Checklist

Run this checklist after any code changes:

- [ ] Form validation works
- [ ] All 5 scenarios execute
- [ ] Results display correctly
- [ ] Color coding applied
- [ ] Action buttons work
- [ ] New analysis resets properly
- [ ] Error handling works
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Google Sheet integrates correctly

---

## Known Issues / Limitations

1. **No concurrent user support**: Multiple users on same sheet may interfere with each other
2. **Email button**: Not yet implemented (placeholder)
3. **Intake form**: URL is placeholder, needs to be updated
4. **No authentication**: Anyone with URL can access
5. **No data persistence**: No history of previous analyses

---

## Debugging Tips

### Check Browser Console

Press F12 and look at:
- **Console tab**: JavaScript errors
- **Network tab**: API calls to Google Apps Script

### Check Google Apps Script Logs

1. Open Apps Script editor
2. Click "Executions" on left
3. Review recent executions
4. Check for errors

### Common Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Analysis hangs | Sheet calculations slow | Increase WAIT_TIME |
| $0 results | Cell references wrong | Verify cell mappings |
| CORS errors | Web app not deployed correctly | Redeploy with "Anyone" access |
| Form won't submit | Validation failing | Check console for errors |
| Progress stuck | JavaScript error | Check console |

---

## Test Data Sets

Use these for comprehensive testing:

**Low Income:**
- Income: $50,000
- Avg: $48,000
- State: Alabama
- Status: Single

**Medium Income:**
- Income: $100,000
- Avg: $95,000
- State: California
- Status: Married Filing Jointly

**High Income:**
- Income: $250,000
- Avg: $240,000
- State: New York
- Status: Single

**Edge Cases:**
- Very high: $1,000,000
- With symbols: $1,234,567
- Without symbols: 1234567
- State: DC (not a state)

---

## Sign-Off Checklist

Before considering testing complete:

- [ ] All Test Suites completed
- [ ] All 3 test cases from requirements tested
- [ ] Mobile responsive verified
- [ ] Multiple browsers tested
- [ ] Google Sheets integration verified
- [ ] Error handling validated
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Documentation reviewed
- [ ] Ready for deployment

---

## Automated Testing (Future)

For production, consider adding:
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Cypress or Playwright
- Google Sheets API mocking for tests

