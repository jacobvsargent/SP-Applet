# Tax Solar Analysis Web Application

A professional web application that analyzes tax optimization scenarios involving solar tax credits and charitable donations. Calculates potential net gains across 5 different scenarios and presents results in an interactive, color-coded table.

## ✨ Features

- **Smart Input Form** - Validates user input with flexible currency formatting
- **5 Scenario Analysis** - Compares Do Nothing, Solar Only, Donation Only, and combined strategies
- **Real-time Progress** - Visual progress bar with status updates
- **Professional Results** - Color-coded table with currency formatting
- **Mobile Responsive** - Works beautifully on all devices
- **Error Handling** - Graceful error recovery with retry functionality

## 🚀 Quick Start

Get up and running in 5 minutes! See [QUICKSTART.md](QUICKSTART.md) for the fastest path to success.

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Comprehensive setup instructions
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Complete testing procedures
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Production deployment guide
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Architecture documentation
- **[WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)** - Visual flow diagrams
- **[BUILD_SUMMARY.md](BUILD_SUMMARY.md)** - Complete build overview
- **[google-apps-script/README.md](google-apps-script/README.md)** - Backend setup

## 🛠️ Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Apps Script

Deploy the backend code to Google Apps Script:

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Copy code from `google-apps-script/Code.gs`
4. Deploy as Web App (see [google-apps-script/README.md](google-apps-script/README.md))
5. Copy the Web App URL

### 3. Set Environment Variable

Create a `.env` file:
```bash
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 4. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 🧪 Testing

Use these test cases to verify functionality:

**Test Case 1:** Low Income
- Income: `$75,000`
- Avg 3-year income: `$70,000`
- State: `North Carolina`
- Filing Status: `Single`

**Test Case 2:** Medium Income
- Income: `$150,000`
- Avg 3-year income: `$145,000`
- State: `New York`
- Filing Status: `Married Filing Jointly`

**Test Case 3:** High Income
- Income: `$200,000`
- Avg 3-year income: `$195,000`
- State: `DC`
- Filing Status: `Single`

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing procedures.

## 📊 How It Works

```
User Input → React App → Google Apps Script → Google Sheets
                ↓                                    ↓
         Progress Bar                         Calculations
                ↓                                    ↓
         Results Table ← Format & Display ← Results Data
```

The app runs 5 scenarios sequentially:
1. **Do Nothing** - Baseline calculation
2. **Solar Only** - Solar tax credit optimization
3. **Donation Only** - Charitable donation strategy (range)
4. **Solar + Donation (No Refund)** - Combined approach (range)
5. **Solar + Donation (With Refund)** - Full optimization (range)

## 🏗️ Tech Stack

**Frontend:**
- React 18 - UI framework
- Vite - Build tool & dev server
- Vanilla CSS - Responsive styling

**Backend:**
- Google Apps Script - API layer
- Google Sheets - Calculation engine

**Deployment:**
- Vercel / Netlify / GitHub Pages

## 📦 Building for Production

```bash
npm run build
```

The `dist` folder will contain production-ready files. Deploy to:

**Vercel** (Recommended)
```bash
vercel
```

**Netlify**
- Drag and drop `dist` folder

**GitHub Pages**
- See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## 🎨 Customization

- **Colors/Styling:** Edit `src/index.css`
- **Form Fields:** Modify `src/components/InputForm.jsx`
- **Scenarios:** Update `src/services/googleSheetsService.js`
- **Results Display:** Customize `src/components/ResultsTable.jsx`

## 📁 Project Structure

```
SP Applet/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   ├── services/                # API communication
│   ├── utils/                   # Helper functions
│   └── App.jsx                  # Main application
├── google-apps-script/          # Backend code
│   ├── Code.gs                  # Apps Script Web App
│   └── README.md                # Deployment guide
├── Documentation files          # Guides & references
└── Configuration files          # package.json, vite.config.js, etc.
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed architecture.

## 🔒 Security Notes

- Google Apps Script executes with sheet owner permissions
- Web App is accessible to anyone with the URL (by design)
- No sensitive data exposed in frontend code
- HTTPS enforced on deployment platforms

For production use with sensitive data, consider adding authentication.

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "URL not configured" | Check `.env` file exists and has correct URL |
| Analysis hangs | Verify Google Apps Script is deployed correctly |
| $0 results | Check cell references in Apps Script match your sheet |
| CORS errors | Ensure Web App deployed with "Anyone" access |

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed troubleshooting.

## 📞 Support

1. Check the documentation files above
2. Review browser console for errors (F12)
3. Check Google Apps Script execution logs
4. Verify sheet tab names and cell references

## 📝 License

This project is built for TaxWise Partners tax optimization analysis.

## 🎉 Ready to Launch!

This is a complete, production-ready application. All features implemented, tested, and documented.

**Next Steps:**
1. Follow [QUICKSTART.md](QUICKSTART.md) to get running
2. Test with sample data
3. Deploy using [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
4. Share with users!

---

Built with ❤️ for tax optimization analysis

