# Project Structure

## Directory Overview

```
SP Applet/
│
├── google-apps-script/          # Google Apps Script backend code
│   ├── Code.gs                  # Main Apps Script file to deploy
│   └── README.md                # Detailed deployment instructions
│
├── src/                         # Frontend source code
│   │
│   ├── components/              # React components
│   │   ├── ActionButtons.jsx   # Email, Intake Form, New Analysis buttons
│   │   ├── ErrorDisplay.jsx    # Error handling UI
│   │   ├── InputForm.jsx       # User input form with validation
│   │   ├── ProgressBar.jsx     # Analysis progress indicator
│   │   └── ResultsTable.jsx    # Results display with formatting
│   │
│   ├── services/                # API and business logic
│   │   └── googleSheetsService.js  # Google Sheets API communication
│   │
│   ├── utils/                   # Utility functions
│   │   └── formatting.js        # Currency formatting/parsing
│   │
│   ├── App.jsx                  # Main application component
│   ├── constants.js             # App constants (states, scenarios)
│   ├── index.css                # Global styles
│   └── main.jsx                 # React entry point
│
├── .env                         # Environment variables (not in git)
├── .gitignore                   # Git ignore rules
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite build configuration
│
├── README.md                    # Project overview
├── SETUP_GUIDE.md               # Detailed setup instructions
├── QUICKSTART.md                # 5-minute quick start
└── PROJECT_STRUCTURE.md         # This file
```

## Component Relationships

```
App.jsx (Main State Management)
│
├── InputForm.jsx
│   ├── Uses: constants.js (US_STATES, FILING_STATUS)
│   └── Uses: formatting.js (isValidCurrency, parseCurrency)
│
├── ProgressBar.jsx
│   └── Displays progress during analysis
│
├── ResultsTable.jsx
│   ├── Uses: formatting.js (formatCurrency)
│   └── Uses: constants.js (SCENARIOS)
│
├── ErrorDisplay.jsx
│   └── Shows errors with retry option
│
└── ActionButtons.jsx
    └── Post-analysis actions
```

## Data Flow

```
1. User Input
   └─> InputForm.jsx
       └─> Validates and parses data
           └─> App.jsx (handleFormSubmit)

2. Analysis Processing
   └─> App.jsx
       └─> googleSheetsService.js (runAllScenarios)
           ├─> Scenario 1: Do Nothing
           ├─> Scenario 2: Solar Only
           ├─> Scenario 3: Donation Only (Range)
           ├─> Scenario 4: Solar + Donation No Refund (Range)
           └─> Scenario 5: Solar + Donation With Refund (Range)
               └─> Each scenario:
                   ├─> writeFormula()
                   ├─> setValue()
                   ├─> callFunction()
                   ├─> getOutputs()
                   └─> Returns: {agi, totalTaxDue, totalNetGain}

3. Results Display
   └─> App.jsx (setResults)
       └─> ResultsTable.jsx
           └─> Formats and displays data
```

## Google Sheets Integration

```
Frontend (React App)
    ↓ HTTP POST/GET
Google Apps Script Web App (Code.gs)
    ↓ API Calls
Google Sheet
    ├─> "Blended Solution Calculator" tab (Input/Processing)
    └─> "Detailed Summary" tab (Output)
```

## Key Files Explained

### Frontend

| File | Purpose |
|------|---------|
| `App.jsx` | Main application state management, orchestrates all components |
| `InputForm.jsx` | Collects and validates user input (income, state, filing status) |
| `googleSheetsService.js` | All Google Sheets API communication and scenario logic |
| `ResultsTable.jsx` | Displays results with proper formatting and color coding |
| `constants.js` | All static data (US states, filing statuses, scenario names) |
| `formatting.js` | Currency parsing and formatting utilities |

### Backend

| File | Purpose |
|------|---------|
| `Code.gs` | Google Apps Script Web App that bridges frontend to sheet |

### Configuration

| File | Purpose |
|------|---------|
| `.env` | Environment variables (Google Apps Script URL) |
| `vite.config.js` | Build tool configuration |
| `package.json` | Dependencies and npm scripts |

## Scenario Execution Logic

Each scenario follows this pattern:

```javascript
1. Write formulas/values to specific cells
2. Call sheet functions if needed (solveForITC, etc.)
3. Wait for calculations (2.5 seconds)
4. Read output from Detailed Summary tab
5. Return results
```

### Cell References

**Input Cells (Blended Solution Calculator):**
- C4: Annual Income
- B4: State
- B9: Filing Status
- G10: Average Income

**Output Cells (Detailed Summary):**
- E117: AGI
- C118: Total Tax Due
- H22: Total Net Gain

**Working Cells (used during scenarios):**
- F47: Solar credit formula
- G47: Solar credit with refund
- C90: Donation percentage
- C92: Donation formula

## State Management

The app uses React useState for state management:

```javascript
appState: 'input' | 'processing' | 'results' | 'error'
progress: 0-100
progressMessage: string
results: { scenario1, scenario2, scenario3, scenario4, scenario5 }
error: { message, details }
```

## Styling

All styles are in `src/index.css`:
- Uses CSS custom properties for colors
- Responsive design with media queries
- Gradient backgrounds for modern look
- Color-coded values (green=positive, red=negative)

## Build Process

```
Development:
npm run dev → Vite dev server → http://localhost:3000

Production:
npm run build → Vite builds → dist/ folder
    ↓
Deploy to Vercel/Netlify/GitHub Pages
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_GOOGLE_APPS_SCRIPT_URL` | Web App endpoint | `https://script.google.com/macros/s/.../exec` |

Note: Vite requires `VITE_` prefix for environment variables to be exposed to client code.

