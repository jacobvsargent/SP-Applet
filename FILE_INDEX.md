# File Index - Tax Solar Analysis

Quick reference guide to every file in the project.

---

## 📱 Application Files

### Entry Points
| File | Purpose |
|------|---------|
| `index.html` | HTML entry point, loads React app |
| `src/main.jsx` | JavaScript entry point, renders React app |
| `src/App.jsx` | Main application component, state management |

### React Components
| File | Purpose |
|------|---------|
| `src/components/InputForm.jsx` | User input form with validation (income, state, filing status) |
| `src/components/ProgressBar.jsx` | Visual progress indicator during analysis |
| `src/components/ResultsTable.jsx` | Displays 5-scenario results table with formatting |
| `src/components/ActionButtons.jsx` | Email, Intake Form, and New Analysis buttons |
| `src/components/ErrorDisplay.jsx` | Error UI with retry functionality |

### Services & Utils
| File | Purpose |
|------|---------|
| `src/services/googleSheetsService.js` | Google Apps Script API communication, scenario execution engine |
| `src/utils/formatting.js` | Currency parsing and formatting utilities |
| `src/constants.js` | US states, filing statuses, scenario names |

### Styling
| File | Purpose |
|------|---------|
| `src/index.css` | Global styles, responsive design, color scheme |

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `vite.config.js` | Vite build tool configuration |
| `.gitignore` | Git ignore rules (node_modules, dist, .env) |
| `.env` | Environment variables (Google Apps Script URL) - **Not in git** |

---

## 🖥️ Backend Files

| File | Purpose |
|------|---------|
| `google-apps-script/Code.gs` | Google Apps Script Web App API endpoints |
| `google-apps-script/README.md` | Apps Script deployment guide with cell mapping |

---

## 📚 Documentation Files

### Quick Reference
| File | Use When |
|------|----------|
| `README.md` | First file to read, project overview |
| `QUICKSTART.md` | Want to get running in 5 minutes |
| `FILE_INDEX.md` | This file - finding specific files |

### Setup & Configuration
| File | Use When |
|------|----------|
| `SETUP_GUIDE.md` | Detailed setup instructions needed |
| `google-apps-script/README.md` | Setting up Google Apps Script backend |

### Development
| File | Use When |
|------|----------|
| `PROJECT_STRUCTURE.md` | Understanding architecture and code organization |
| `WORKFLOW_DIAGRAM.md` | Need visual diagrams of flows and processes |

### Testing & Quality
| File | Use When |
|------|----------|
| `TESTING_GUIDE.md` | Running tests, validating functionality |
| `BUILD_SUMMARY.md` | Reviewing what was built and features |

### Deployment
| File | Use When |
|------|----------|
| `DEPLOYMENT_CHECKLIST.md` | Deploying to production (Vercel/Netlify/GitHub Pages) |

---

## 🗂️ Directory Structure

```
SP Applet/
│
├── src/                                    [Application Source Code]
│   ├── components/                         [React Components]
│   │   ├── InputForm.jsx                  Input form with validation
│   │   ├── ProgressBar.jsx                Progress indicator
│   │   ├── ResultsTable.jsx               Results display
│   │   ├── ActionButtons.jsx              Action buttons
│   │   └── ErrorDisplay.jsx               Error handling UI
│   │
│   ├── services/                           [Business Logic]
│   │   └── googleSheetsService.js         API & scenario execution
│   │
│   ├── utils/                              [Helper Functions]
│   │   └── formatting.js                  Currency utilities
│   │
│   ├── App.jsx                            Main component
│   ├── main.jsx                           Entry point
│   ├── index.css                          Global styles
│   └── constants.js                       App constants
│
├── google-apps-script/                     [Backend Code]
│   ├── Code.gs                            Apps Script Web App
│   └── README.md                          Deployment guide
│
├── Configuration Files                     [Build & Tools]
│   ├── package.json                       Dependencies
│   ├── vite.config.js                     Build config
│   ├── index.html                         HTML template
│   ├── .gitignore                         Git rules
│   └── .env                               Secrets (not in git)
│
└── Documentation                           [Guides & References]
    ├── README.md                          Project overview
    ├── QUICKSTART.md                      5-min quick start
    ├── SETUP_GUIDE.md                     Detailed setup
    ├── TESTING_GUIDE.md                   Testing procedures
    ├── DEPLOYMENT_CHECKLIST.md            Deployment guide
    ├── PROJECT_STRUCTURE.md               Architecture docs
    ├── WORKFLOW_DIAGRAM.md                Visual diagrams
    ├── BUILD_SUMMARY.md                   Complete overview
    └── FILE_INDEX.md                      This file
```

---

## 🔍 Find Files By Purpose

### I want to...

**Change the UI appearance**
- → `src/index.css` (colors, spacing, layout)
- → `src/components/*.jsx` (component structure)

**Add/modify form fields**
- → `src/components/InputForm.jsx` (form UI and validation)
- → `src/constants.js` (dropdown options)

**Change how scenarios run**
- → `src/services/googleSheetsService.js` (scenario logic)
- → `google-apps-script/Code.gs` (backend API)

**Update cell references**
- → `google-apps-script/Code.gs` (cell mappings)
- → `google-apps-script/README.md` (cell documentation)

**Modify results display**
- → `src/components/ResultsTable.jsx` (table structure)
- → `src/utils/formatting.js` (number formatting)

**Change progress messages**
- → `src/services/googleSheetsService.js` (progress callbacks)

**Add error handling**
- → `src/components/ErrorDisplay.jsx` (error UI)
- → `src/App.jsx` (error state management)

**Configure deployment**
- → `vite.config.js` (build settings)
- → `.env` (environment variables)
- → `DEPLOYMENT_CHECKLIST.md` (deployment guide)

**Understand the architecture**
- → `PROJECT_STRUCTURE.md` (detailed architecture)
- → `WORKFLOW_DIAGRAM.md` (visual diagrams)
- → `BUILD_SUMMARY.md` (complete overview)

**Test the application**
- → `TESTING_GUIDE.md` (test procedures)
- → `README.md` (test cases)

**Deploy to production**
- → `DEPLOYMENT_CHECKLIST.md` (complete checklist)
- → `google-apps-script/README.md` (backend setup)

---

## 📝 File Sizes & Complexity

### Small Files (< 100 lines)
- `src/main.jsx` - 7 lines
- `src/constants.js` - 55 lines
- `vite.config.js` - 9 lines
- `index.html` - 14 lines
- `src/components/ProgressBar.jsx` - 12 lines
- `src/components/ErrorDisplay.jsx` - 19 lines
- `src/components/ActionButtons.jsx` - 29 lines

### Medium Files (100-300 lines)
- `src/utils/formatting.js` - 36 lines
- `src/App.jsx` - 77 lines
- `src/components/ResultsTable.jsx` - 93 lines
- `src/components/InputForm.jsx` - 160 lines
- `google-apps-script/Code.gs` - 189 lines

### Large Files (300+ lines)
- `src/index.css` - 284 lines
- `src/services/googleSheetsService.js` - 302 lines

### Documentation (varies)
- `README.md` - 205 lines
- `QUICKSTART.md` - 51 lines
- `SETUP_GUIDE.md` - 389 lines
- `TESTING_GUIDE.md` - 610 lines
- `DEPLOYMENT_CHECKLIST.md` - 565 lines
- `PROJECT_STRUCTURE.md` - 313 lines
- `WORKFLOW_DIAGRAM.md` - 689 lines
- `BUILD_SUMMARY.md` - 556 lines
- `google-apps-script/README.md` - 213 lines

---

## 🎯 Most Important Files

If you can only read 5 files, read these:

1. **`README.md`** - Project overview and quick start
2. **`src/App.jsx`** - Main application logic
3. **`src/services/googleSheetsService.js`** - Scenario execution
4. **`google-apps-script/Code.gs`** - Backend API
5. **`SETUP_GUIDE.md`** - How to get it running

---

## 🔄 File Dependencies

### `src/App.jsx` depends on:
- `src/components/InputForm.jsx`
- `src/components/ProgressBar.jsx`
- `src/components/ResultsTable.jsx`
- `src/components/ActionButtons.jsx`
- `src/components/ErrorDisplay.jsx`
- `src/services/googleSheetsService.js`

### `src/services/googleSheetsService.js` depends on:
- `.env` (VITE_GOOGLE_APPS_SCRIPT_URL)
- Google Apps Script Web App (Code.gs)

### `src/components/InputForm.jsx` depends on:
- `src/constants.js` (US_STATES, FILING_STATUS)
- `src/utils/formatting.js` (parseCurrency, isValidCurrency)

### `src/components/ResultsTable.jsx` depends on:
- `src/utils/formatting.js` (formatCurrency)
- `src/constants.js` (SCENARIOS)

### `google-apps-script/Code.gs` depends on:
- Google Sheet with tabs:
  - "Blended Solution Calculator"
  - "Detailed Summary"
- Existing functions:
  - `solveForITC()`
  - `solveForITCRefund()`
  - `zeroCellsByColor()`

---

## 🚀 Execution Order

When the app runs:

1. `index.html` loads
2. `src/main.jsx` executes
3. `src/App.jsx` renders
4. `src/components/InputForm.jsx` displays
5. User submits form
6. `src/services/googleSheetsService.js` orchestrates scenarios
7. Calls `google-apps-script/Code.gs` endpoints
8. Reads/writes Google Sheet cells
9. Returns results
10. `src/components/ResultsTable.jsx` displays

---

## 📋 Checklist: Which Files to Modify for Common Tasks

### Add a new input field
- [ ] `src/components/InputForm.jsx` (add field)
- [ ] `src/constants.js` (if dropdown options needed)
- [ ] `google-apps-script/Code.gs` (add cell write)
- [ ] `google-apps-script/README.md` (document cell)

### Add a new scenario
- [ ] `src/services/googleSheetsService.js` (add scenario function)
- [ ] `src/constants.js` (add scenario name)
- [ ] `src/components/ResultsTable.jsx` (add row)
- [ ] `WORKFLOW_DIAGRAM.md` (update diagrams)

### Change color scheme
- [ ] `src/index.css` (update CSS variables/colors)

### Add authentication
- [ ] `src/App.jsx` (add auth state)
- [ ] `google-apps-script/Code.gs` (add auth check)
- [ ] New component: `src/components/LoginForm.jsx`

### Change wait times
- [ ] `src/services/googleSheetsService.js` (update WAIT_TIME)

---

## 🎓 Learning Path

**For new developers:**

1. Start: `README.md`
2. Setup: `QUICKSTART.md` → `SETUP_GUIDE.md`
3. Architecture: `PROJECT_STRUCTURE.md` → `WORKFLOW_DIAGRAM.md`
4. Code: `src/App.jsx` → `src/components/` → `src/services/`
5. Backend: `google-apps-script/Code.gs`
6. Testing: `TESTING_GUIDE.md`
7. Deploy: `DEPLOYMENT_CHECKLIST.md`

**For experienced React developers:**

1. `README.md` (overview)
2. `src/App.jsx` (main logic)
3. `src/services/googleSheetsService.js` (API layer)
4. `google-apps-script/Code.gs` (backend)
5. `DEPLOYMENT_CHECKLIST.md` (deploy)

---

## 🔎 Search Tips

**Find where a function is defined:**
- Search all `.jsx` files in `src/components/`
- Search `src/services/googleSheetsService.js`
- Search `google-apps-script/Code.gs`

**Find where a constant is used:**
- Search from `src/constants.js` usage
- Likely in `src/components/InputForm.jsx` or `ResultsTable.jsx`

**Find where styles are defined:**
- All in `src/index.css`
- Use class names from components

---

This index should help you navigate the project quickly and efficiently!

