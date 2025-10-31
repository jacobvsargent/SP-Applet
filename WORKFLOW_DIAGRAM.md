# Tax Solar Analysis - Workflow Diagrams

Visual representations of how the application works.

---

## 1. Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER OPENS APP                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      INPUT FORM (App State: INPUT)               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  • Annual Income            [_________________]            │ │
│  │  • Average 3-Year Income    [_________________]            │ │
│  │  • State                    [▼ Select State  ]            │ │
│  │  • Filing Status            [▼ Select Status ]            │ │
│  │                                                             │ │
│  │  [Run Analysis] ← Disabled until all fields valid         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User Clicks "Run Analysis"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PROCESSING (App State: PROCESSING)               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Progress Bar: [████████░░░░░░░░] 45%                     │ │
│  │  Status: Running Scenario 3: Donation Only...              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Executes:                                                       │
│  → Scenario 1: Do Nothing                    [✓] 10-20%         │
│  → Scenario 2: Solar Only                    [✓] 20-35%         │
│  → Scenario 3: Donation Only                 [⟳] 35-55%         │
│  → Scenario 4: Solar + Donation (No Refund)  [ ] 55-75%         │
│  → Scenario 5: Solar + Donation (W/ Refund)  [ ] 75-95%         │
│  → Cleanup                                    [ ] 95-100%        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                     Analysis Completes
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   RESULTS (App State: RESULTS)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Scenario               │ AGI      │Tax Due  │ Net Gain   │ │
│  │  ──────────────────────────────────────────────────────────│ │
│  │  Do Nothing            │ $75,000  │ $8,500  │ $0         │ │
│  │  Solar Only            │ $75,000  │ $6,200  │ $2,300     │ │
│  │  Donation Only         │ $70,000  │ $7,100  │ $1,400-... │ │
│  │  Solar+Don (No Refund) │ $70,000  │ $5,000  │ $3,500-... │ │
│  │  Solar+Don (W/ Refund) │ $70,000  │ $4,500  │ $4,000-... │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Email Results] [Start Intake Form] [Start New Analysis]       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                 User Clicks "Start New Analysis"
                              ↓
                        Return to INPUT
```

---

## 2. Data Flow Diagram

```
┌──────────────┐
│ React App    │
│ (Browser)    │
└──────┬───────┘
       │
       │ 1. User submits form
       │    { income, avgIncome, state, filingStatus }
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  googleSheetsService.js                                          │
│                                                                  │
│  runAllScenarios()                                               │
│    ├─→ runScenario1()                                           │
│    ├─→ runScenario2()                                           │
│    ├─→ runScenario3()                                           │
│    ├─→ runScenario4()                                           │
│    └─→ runScenario5()                                           │
│                                                                  │
│  Each scenario calls:                                            │
│    • setUserInputs()    ─┐                                      │
│    • writeFormula()      ├─→ makeRequest() ─┐                  │
│    • setValue()          │                   │                  │
│    • callFunction()     ─┘                   │                  │
│    • getOutputs()       ──→ makeGetRequest() │                  │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                               │ HTTP POST/GET
                                               │
                                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  Google Apps Script Web App (Code.gs)                            │
│                                                                  │
│  doPost(e) / doGet(e)                                            │
│    ├─→ action: 'setInputs'    → setUserInputs()                │
│    ├─→ action: 'writeFormula' → writeFormula()                 │
│    ├─→ action: 'setValue'     → setValue()                     │
│    ├─→ action: 'runScenario'  → runScenario()                  │
│    ├─→ action: 'getOutputs'   → getOutputs()                   │
│    └─→ action: 'cleanup'      → cleanup()                      │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                               │ Apps Script API
                                               │
                                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  Google Sheet                                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tab: "Blended Solution Calculator"                          ││
│  │                                                              ││
│  │  Input Cells:                                               ││
│  │    C4  ← Annual Income                                      ││
│  │    B4  ← State                                              ││
│  │    B9  ← Filing Status                                      ││
│  │    G10 ← Average Income                                     ││
│  │                                                              ││
│  │  Working Cells:                                             ││
│  │    F47 ← Solar credit formula                               ││
│  │    G47 ← Solar with refund formula                          ││
│  │    C90 ← Donation percentage (30% or 60%)                   ││
│  │    C92 ← Donation formula                                   ││
│  │                                                              ││
│  │  Functions:                                                 ││
│  │    • solveForITC()                                          ││
│  │    • solveForITCRefund()                                    ││
│  │    • zeroCellsByColor()                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tab: "Detailed Summary"                                     ││
│  │                                                              ││
│  │  Output Cells:                                              ││
│  │    E117 → AGI                                               ││
│  │    C118 → Total Tax Due                                     ││
│  │    H22  → Total Net Gain                                    ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
                                               │
                                               │ Results flow back up
                                               │
                                               ↓
                                      [ Display Results ]
```

---

## 3. Scenario Execution Timeline

```
Time    Scenario                        Actions
────────────────────────────────────────────────────────────────────

0s      Start Analysis
        │
        ↓
2s      Scenario 1: Do Nothing          • setUserInputs(data)
        │                                 - Write to C4, B4, B9, G10
5s      │                               • Wait 2.5s
        │                               • getOutputs()
7s      │                                 - Read E117, C118, H22
        ↓
        
9s      Scenario 2: Solar Only          • writeFormula(F47, "=F51")
        │                               • Wait 2.5s
12s     │                               • callFunction("solveForITC")
        │                               • Wait 2.5s
14s     │                               • getOutputs()
        ↓
        
16s     Scenario 3: Donation Only       • setValue(F47, 0)
        │   (Maximum)                    • Wait 2.5s
19s     │                               • writeFormula(C92, "=B92")
        │                               • Wait 2.5s
21s     │                               • setValue(C90, 0.6)
        │                               • Wait 2.5s
24s     │                               • getOutputs() → max
        ↓
        
26s     Scenario 3: Donation Only       • setValue(C90, 0.3)
        │   (Minimum)                    • Wait 2.5s
28s     │                               • getOutputs() → min
        │                               • setValue(C90, 0.6) [reset]
31s     ↓                               • Wait 2.5s
        
33s     Scenario 4: Solar+Don NR        • writeFormula(F47, "=F51")
        │   (Maximum)                    • Wait 2.5s
36s     │                               • callFunction("solveForITC")
        │                               • Wait 2.5s
38s     │                               • writeFormula(C92, "=B92")
        │                               • Wait 2.5s
41s     │                               • setValue(C90, 0.6)
        │                               • Wait 2.5s
43s     │                               • getOutputs() → max
        ↓
        
45s     Scenario 4: Solar+Don NR        • setValue(C90, 0.3)
        │   (Minimum)                    • Wait 2.5s
48s     │                               • getOutputs() → min
        │                               • setValue(C90, 0.6) [reset]
50s     ↓                               • Wait 2.5s
        
52s     Scenario 5: Solar+Don WR        • callFunction("solveForITCRefund")
        │   (Maximum)                    • Wait 2.5s
55s     │                               • writeFormula(G47, "=H51")
        │                               • Wait 2.5s
57s     │                               • setValue(C90, 0.6)
        │                               • Wait 2.5s
60s     │                               • getOutputs() → max
        ↓
        
62s     Scenario 5: Solar+Don WR        • setValue(C90, 0.3)
        │   (Minimum)                    • Wait 2.5s
65s     │                               • getOutputs() → min
        │                               • setValue(C90, 0.6) [reset]
67s     ↓                               • Wait 2.5s
        
69s     Cleanup                         • cleanup()
        │                               • Calls zeroCellsByColor()
72s     ↓                               • Wait 2.5s
        
        Complete!
        Display Results Table
```

**Total Duration: ~72 seconds (can vary based on sheet calculations)**

---

## 4. Component Hierarchy

```
<App>
  │
  ├─── [State: INPUT]
  │    └─── <InputForm>
  │           ├─── Income field
  │           ├─── Avg Income field
  │           ├─── State dropdown
  │           ├─── Filing Status dropdown
  │           └─── Submit button
  │
  ├─── [State: PROCESSING]
  │    └─── <ProgressBar>
  │           ├─── Progress bar visual
  │           └─── Status message
  │
  ├─── [State: ERROR]
  │    └─── <ErrorDisplay>
  │           ├─── Error message
  │           └─── Retry button
  │
  └─── [State: RESULTS]
       ├─── <ResultsTable>
       │      ├─── Table header
       │      └─── 5 scenario rows
       │            ├─── Scenario name
       │            ├─── AGI (neutral color)
       │            ├─── Tax Due (red color)
       │            └─── Net Gain (green/red color)
       │
       └─── <ActionButtons>
              ├─── Email button
              ├─── Intake Form button
              └─── New Analysis button
```

---

## 5. State Machine

```
                    ┌──────────┐
                    │  INPUT   │ ← Initial State
                    └─────┬────┘
                          │
                 User submits form
                          │
                          ↓
                  ┌───────────────┐
                  │  PROCESSING   │
                  └───┬───────┬───┘
                      │       │
              Success │       │ Error
                      │       │
                      ↓       ↓
              ┌─────────┐  ┌───────┐
              │ RESULTS │  │ ERROR │
              └────┬────┘  └───┬───┘
                   │           │
    New Analysis  │           │ Retry
                   │           │
                   ↓           ↓
                ┌──────────────────┐
                │  INPUT (reset)   │
                └──────────────────┘
```

---

## 6. Error Handling Flow

```
                    User Action
                         │
                         ↓
                 ┌───────────────┐
                 │ Try Execute   │
                 └───────┬───────┘
                         │
                    ┌────┴────┐
                    │ Success? │
                    └────┬────┘
                         │
          ┌──────────────┼──────────────┐
          │ YES                    NO    │
          ↓                              ↓
    ┌──────────┐            ┌────────────────────┐
    │ Continue │            │ Catch Error        │
    │ Process  │            │  • Log to console  │
    └──────────┘            │  • Set error state │
                            │  • Show ErrorUI    │
                            └─────────┬──────────┘
                                      │
                            User clicks "Retry"
                                      │
                                      ↓
                            ┌──────────────────┐
                            │ Re-run analysis  │
                            │ with same inputs │
                            └──────────────────┘
```

---

## 7. Google Sheets Cell Map

```
┌────────────────────────────────────────────────────────────────┐
│ Tab: "Blended Solution Calculator"                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│     A          B              C              D                 │
│  ┌──────┬──────────────┬──────────────┬──────────────┐        │
│1 │      │              │              │              │        │
│2 │      │              │              │              │        │
│3 │      │              │              │              │        │
│4 │      │  [State] ←───┤  [Income] ←──┤              │        │
│5 │      │              │              │              │        │
│6 │      │              │              │              │        │
│7 │      │              │              │              │        │
│8 │      │              │              │              │        │
│9 │      │ [FilingStatus│              │              │        │
│  │      │    ]←────────┤              │              │        │
│10│      │              │              │              │        │
│  └──────┴──────────────┴──────────────┴──────────────┘        │
│                                                                │
│           E        F          G          H                     │
│  ┌──────────┬──────────┬──────────┬──────────┐                │
│1 │          │          │          │          │                │
│  ...                                                           │
│10│          │          │ [AvgInc] │          │                │
│  │          │          │    ←─────│          │                │
│  ...                                                           │
│47│          │ [Solar]  │ [SolarRef│          │                │
│  │          │   ←──────│  und] ←──│          │                │
│  ...                                                           │
│90│          │          │ [DonPct] │          │                │
│  │          │          │    ←─────│          │                │
│  ...                                                           │
│92│          │          │ [DonForm]│          │                │
│  │          │          │    ←─────│          │                │
│  └──────────┴──────────┴──────────┴──────────┘                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Tab: "Detailed Summary"                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│          C          D          E          F          H         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐     │
│  ...                                                           │
│22│          │          │          │          │ [NetGain]│     │
│  │          │          │          │          │    →─────│     │
│  ...                                                           │
│117          │          │  [AGI]   │          │          │     │
│  │          │          │    →─────│          │          │     │
│118[TaxDue]  │          │          │          │          │     │
│  │    →─────│          │          │          │          │     │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘     │
└────────────────────────────────────────────────────────────────┘

Legend:
  ←─── : Input (written by app)
  →─── : Output (read by app)
```

---

## 8. User Journey Map

```
Step 1: Discovery
   User lands on page
   ↓
   Sees clean, professional UI
   ↓
   Reads title: "Tax Solar Analysis"

Step 2: Input
   Enters annual income ──→ Real-time validation
   ↓
   Enters avg income ────→ Format flexibility ($75,000 or 75000)
   ↓
   Selects state ────────→ Easy dropdown
   ↓
   Selects filing status ──→ Clear options
   ↓
   Button enables ──────→ All fields valid!

Step 3: Submit
   Clicks "Run Analysis"
   ↓
   Form disappears
   ↓
   Progress bar appears

Step 4: Wait
   Watches progress bar move ──→ Reassured it's working
   ↓
   Reads status updates ──────→ Knows what's happening
   ↓
   Waits 30-60 seconds ───────→ Anticipation builds

Step 5: Results
   Table appears ──────────────→ Clean layout
   ↓
   Sees 5 scenarios ───────────→ Easy comparison
   ↓
   Color-coded values ─────────→ Quick understanding
   ↓
   Green = good, Red = bad ────→ Instant insight

Step 6: Action
   Three buttons appear
   ↓
   Options: Email, Intake Form, or New Analysis
   ↓
   Chooses next action ────────→ Satisfied!
```

---

## 9. Development Workflow

```
Developer Setup
   ↓
1. npm install ──────────→ Install dependencies
   ↓
2. Create .env ──────────→ Add Google Apps Script URL
   ↓
3. npm run dev ─────────→ Start dev server
   ↓
4. Open localhost:3000 ──→ See app running
   ↓
5. Make changes ─────────→ Hot reload updates
   ↓
6. Test thoroughly ──────→ Use TESTING_GUIDE.md
   ↓
7. npm run build ────────→ Create production build
   ↓
8. Deploy ───────────────→ Vercel/Netlify/GitHub Pages
   ↓
9. Test production ──────→ Verify everything works
   ↓
10. Monitor & iterate ───→ Improve based on feedback
```

---

## 10. Deployment Architecture

```
                   ┌──────────────┐
                   │   Developer  │
                   └──────┬───────┘
                          │
                   npm run build
                          │
                          ↓
                   ┌──────────────┐
                   │ dist/ folder │
                   └──────┬───────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ↓               ↓               ↓
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │ Vercel  │    │ Netlify  │    │  GitHub  │
    │         │    │          │    │  Pages   │
    └────┬────┘    └────┬─────┘    └────┬─────┘
         │              │               │
         └──────────────┼───────────────┘
                        │
                   CDN/HTTPS
                        │
                        ↓
                 ┌─────────────┐
                 │   Users'    │
                 │  Browsers   │
                 └──────┬──────┘
                        │
                   HTTP Requests
                        │
                        ↓
            ┌────────────────────────┐
            │ Google Apps Script     │
            │ Web App (always same)  │
            └────────┬───────────────┘
                     │
                     ↓
            ┌────────────────────────┐
            │   Google Sheets        │
            │   (calculation engine) │
            └────────────────────────┘
```

---

These diagrams provide a complete visual understanding of how the Tax Solar Analysis application works from every angle!

