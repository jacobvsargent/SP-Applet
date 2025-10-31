# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies (30 seconds)

```bash
npm install
```

## 2. Set Up Google Apps Script (2 minutes)

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Copy the code from `google-apps-script/Code.gs` into the editor
4. Click **Deploy** → **New deployment** → Select **Web app**
5. Set "Execute as: Me" and "Who has access: Anyone"
6. Click **Deploy** and copy the Web App URL

## 3. Configure Environment (30 seconds)

Create a `.env` file:

```
VITE_GOOGLE_APPS_SCRIPT_URL=<paste your Web App URL here>
```

## 4. Start Development Server (10 seconds)

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 5. Test It! (1 minute)

Enter test data:
- Income: `$75,000`
- Avg 3-year income: `$70,000`
- State: `North Carolina`
- Filing Status: `Single`

Click **Run Analysis** and watch it work!

---

## Need Help?

- 📖 See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
- 📂 See [google-apps-script/README.md](google-apps-script/README.md) for Google Apps Script help
- 🐛 Check browser console (F12) for errors

## Production Deployment

```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel: `vercel`
- Netlify: Drag and drop `dist` folder
- GitHub Pages: Copy `dist` to `gh-pages` branch

