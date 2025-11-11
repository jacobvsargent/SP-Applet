# Strategic Partner Estimator Tool - Technical Overview

## Overview

The Strategic Partner Estimator Tool is a web-based tax analysis application that automates complex financial scenarios by integrating a React frontend with Google Sheets calculations via Google Apps Script. The tool runs 5 different tax strategy scenarios and generates detailed workbook snapshots for each.

---

## Technology Stack

### Frontend Framework
**React 18.2.0** - Component-based UI library for building the interactive user interface
- **React Hooks**: `useState` for state management across input, processing, results, and error states
- **Component Architecture**: Modular design with separate components for forms, progress tracking, results display, and error handling

### Build Tool
**Vite 5.0.0** - Next-generation frontend build tool providing fast development and optimized production builds
- **Hot Module Replacement (HMR)**: Instant updates during development
- **Optimized Bundling**: Code splitting and tree shaking for minimal bundle size
- **Plugin**: `@vitejs/plugin-react` for React Fast Refresh support

### Backend/Integration Layer
**Google Apps Script** - Server-side JavaScript platform that runs in Google's cloud
- **Web App Deployment**: Exposes RESTful endpoints accessible via HTTPS
- **SpreadsheetApp API**: Native Google Sheets integration for reading/writing cell values and formulas
- **DriveApp API**: File and folder management for creating workbook copies and organizing outputs

### Data Storage
**Google Sheets** - Serves as both the calculation engine and data storage layer
- **"Blended Solution Calculator" sheet**: Primary input and calculation worksheet
- **"Detailed Summary" sheet**: Aggregated results and outputs
- **Formula-based calculations**: Complex financial models built into spreadsheet formulas

### Deployment
**GitHub Pages** - Static site hosting for the React application
- Base path: `/SP-Applet/`
- Serves pre-built static assets from the `dist/` directory

---

## Information Flow Architecture

### 1. User Input → Frontend
```
User fills out form with:
- Name
- Income (2025 projected)
- Average Income (2022-2024)
- State
- Filing Status
- Optional: Skip Scenario 5 minimum calculation
```

**Component**: `InputForm.jsx`
- Collects and validates user inputs
- Submits data to main App component

---

### 2. Frontend → Google Apps Script (Setup Phase)
```
React App → HTTP POST → Google Apps Script Web App
```

**Service**: `googleSheetsService.js`
- **Action**: `createFolder` - Creates analysis folder in Google Drive
  - Folder naming: `[Name] - $[Income]k - [State] - [Filing Status] - [Date]`
  - Parent folder ID: `1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW`

- **Action**: `createWorkingCopy` - Clones master workbook into analysis folder
  - Creates temporary working copy to preserve master workbook integrity
  - Named: `WORKING_COPY - [Timestamp]`

**Apps Script Handler**: `doPost(e)` function in `Code.gs`
- Routes action to appropriate function
- Returns JSON responses with folder/file IDs and URLs

---

### 3. Scenario Execution Loop (Per Scenario)

For each of 5 scenarios, the following flow repeats:

#### 3a. Frontend → Apps Script (Write Operations)
```
React App → HTTP POST → Apps Script → Google Sheets
```

**Actions performed**:
- `cleanupLimited`: Zeros out colored cells from previous runs
- `setInputs`: Writes user inputs to specific cells (C4, B4, B9, G4)
- `setValue`: Sets individual cell values (e.g., E17, B43, F47)
- `writeFormula`: Writes formulas to cells (e.g., `=F51`, `=MAX(0, B92)`)
- `runScenario`: Executes built-in Apps Script functions (`solveForITC`, `solveForITCRefund`)

**Key cells manipulated**:
- `E17`: Solar system size (0 or 1950)
- `B43`: Solar cash outlay
- `C90`: Donation percentage (30% or 60%)
- `C92`: Donation amount formula
- `F47`, `G47`: Solar ITC values

#### 3b. Google Sheets Calculation Engine
```
Apps Script writes data → Sheets recalculates formulas → Results propagate
```

- Spreadsheet formulas automatically recalculate when cells change
- `SpreadsheetApp.flush()` forces synchronous calculation
- `Utilities.sleep(200)` provides settling time for complex calculations

#### 3c. Apps Script → Frontend (Read Operations)
```
Google Sheets → Apps Script → HTTP GET → React App
```

**Action**: `getOutputs`
- **Force recalculation** before reading to ensure fresh values
- Reads from "Detailed Summary" sheet:
  - `E117`: Adjusted Gross Income (AGI)
  - `L18`: Total Tax Due
  - `H22`: Total Net Gain

**Action**: `getValue`
- Reads individual cell values (e.g., F51, G49) for conditional logic

#### 3d. Snapshot Creation
```
Apps Script → Google Drive API → Creates full workbook copy
```

**Action**: `createWorkbookCopy`
- Reads dynamic values for filename:
  - `B43`: Solar cash outlay
  - `C92`: Donation amount
  - `G47`: Solar ITC refund
- Generates filename: `[Name] - [Scenario#] - $[Solar]k Solar_$[Medtech]k Medtech_$[Refund]k Refund - [Timestamp]`
- Creates complete workbook copy (all sheets, formulas intact) in analysis folder
- Returns file URL and folder URL to frontend

---

### 4. Cleanup Phase
```
React App → Apps Script → Google Drive API
```

**Action**: `deleteWorkingCopy`
- Moves temporary working copy to trash
- Preserves master workbook and all scenario snapshots
- Leaves only the organized analysis folder with 5 scenario copies

---

### 5. Results Display
```
Frontend receives all scenario results → ResultsTable component
```

**Component**: `ResultsTable.jsx`
- Displays side-by-side comparison of all scenarios
- Shows AGI, Total Tax Due, and Total Net Gain for each
- Calculates and displays net benefit vs. baseline
- Formats currency values for readability

**Component**: `ActionButtons.jsx`
- Provides "New Analysis" button to reset and start over
- Can be extended for additional actions (e.g., export, print)

---

## Scenario Logic

### Scenario 1: Baseline (Do Nothing)
- Sets solar to 0 (`E17 = 0`)
- Establishes baseline tax liability with no strategies

### Scenario 2: Solar Only
- Enables solar (`E17 = 1950`)
- Runs `solveForITC` to optimize solar investment tax credit
- Formula: `F47 = F51`

### Scenario 3: Donation Only (Range: 30%-60%)
- Disables solar (`E17 = 0`, `B43 = 0`, `F47 = 0`)
- **Maximum**: Sets donation at 60% (`C90 = 0.6`)
- **Minimum**: Sets donation at 30% (`C90 = 0.3`)
- Formula: `C92 = MAX(0, B92)`

### Scenario 4: Solar + Donation, No Refund (Range: 30%-60%)
- Enables solar (`E17 = 1950`)
- Maximizes donation first, then optimizes solar
- Conditional logic: If `F51 < 0`, sets `F47 = 0`
- **Maximum**: `C90 = 0.6`
- **Minimum**: `C90 = 0.3`

### Scenario 5: Solar + Donation, With Refund (Range: 30%-60%)
- Enables solar (`E17 = 1950`)
- Runs `solveForITCRefund` instead of `solveForITC`
- Captures refund value from `G49` and writes to `G47`
- **Maximum**: `C90 = 0.6`
- **Minimum**: `C90 = 0.3` (with `G47` zeroed first)

**Optional**: User can skip minimum calculations for Scenarios 3-5 via checkbox

---

## Error Handling & Resilience

### Auto-Retry Mechanism
- First failure triggers automatic retry after 2-second delay
- Second failure displays error to user with retry button
- Manual retry option available via `ErrorDisplay` component

### CORS Handling
- Primary: Standard CORS requests for read operations
- Fallback: `no-cors` mode for write operations that don't require response data
- Ensures compatibility across different deployment environments

### Progress Tracking
- Real-time progress updates (0-100%)
- Descriptive status messages for each operation
- Elapsed time counter displayed in results
- Component: `ProgressBar.jsx` with visual indicator

---

## Key Design Patterns

### Working Copy Pattern
- Master workbook remains pristine and unchanged
- All scenario manipulations occur on a temporary clone
- Working copy deleted after all scenarios complete
- Ensures data integrity and enables parallel analysis sessions

### Progressive Enhancement
- Form validates inputs before submission
- Progress bar provides real-time feedback
- Results table highlights improvements vs. baseline
- Error display offers actionable recovery options

### Stateless Service Layer
- `googleSheetsService.js` exports pure functions
- Each function accepts inputs and returns outputs
- No internal state management
- Facilitates testing and maintains predictability

---

## File Structure

```
SP-Applet/
├── src/
│   ├── App.jsx                          # Main application orchestrator
│   ├── main.jsx                         # React entry point
│   ├── index.css                        # Global styles
│   ├── components/
│   │   ├── InputForm.jsx               # User input form
│   │   ├── ProgressBar.jsx             # Progress tracking UI
│   │   ├── ResultsTable.jsx            # Scenario results display
│   │   ├── ActionButtons.jsx           # Post-analysis actions
│   │   └── ErrorDisplay.jsx            # Error state UI
│   ├── services/
│   │   └── googleSheetsService.js      # Apps Script API client
│   ├── utils/
│   │   └── formatting.js               # Currency/number formatting
│   └── constants.js                     # App-wide constants
├── google-apps-script/
│   ├── Code.gs                          # Apps Script backend
│   ├── appsscript.json                  # Apps Script manifest
│   └── README.md                        # Deployment instructions
├── public/
│   └── TWP_Logo_Final.png              # Taxwise Partners logo
├── dist/                                # Build output (generated)
├── package.json                         # Dependencies and scripts
├── vite.config.js                       # Vite configuration
└── README.md                            # Main documentation
```

---

## Environment Configuration

### Frontend (.env file required)
```
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
```

### Apps Script Deployment
1. Open master Google Sheet
2. Navigate to Extensions > Apps Script
3. Paste `Code.gs` content
4. Deploy as Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy deployment URL to frontend `.env` file

### Required Google OAuth Scopes
- `https://www.googleapis.com/auth/spreadsheets` - Read/write sheets
- `https://www.googleapis.com/auth/drive` - Create/manage files and folders

---

## Performance Considerations

### Wait Times
- **WAIT_TIME**: 50ms between operations (configurable in `googleSheetsService.js`)
- **Flush & Sleep**: 200ms after writes to ensure calculation settling
- Tunable based on spreadsheet complexity vs. speed requirements

### Request Optimization
- GET requests for read operations (cacheable)
- POST requests for write operations
- Batched operations where possible (e.g., single `setInputs` call for multiple cells)

### Calculation Efficiency
- Working copy approach prevents concurrent user conflicts
- Scenario-specific cell cleanup minimizes recalculation scope
- Formula-based calculations leverage Google Sheets' optimized engine

---

## Future Extensibility

The architecture supports:
- Additional scenarios by extending service functions
- Custom report generation by reading additional cells
- Email notifications via Apps Script's MailApp
- Database integration by replacing/supplementing Sheets storage
- Multi-user collaboration through Drive permissions
- API integrations via Apps Script's UrlFetchApp

---

## Maintenance Notes

### When Adding Scenarios
1. Create new function in `googleSheetsService.js` (e.g., `runScenario6`)
2. Add case to `doPost` handler in `Code.gs` if new actions needed
3. Update `runAllScenarios` to include new scenario
4. Extend `ResultsTable` component to display new results

### When Modifying Cell Logic
1. Update cell references in service functions
2. Verify formula strings match spreadsheet expectations
3. Test with working copy to avoid corrupting master
4. Document changes in memory/comments

### When Changing Folder Structure
1. Update parent folder ID in `Code.gs` (line 370)
2. Verify Drive permissions for Apps Script execution user
3. Test folder creation and file organization

---

This tool represents a sophisticated integration of modern web technologies with Google's productivity suite, creating a powerful, accessible tax analysis platform that requires no server infrastructure beyond Google's cloud services.


