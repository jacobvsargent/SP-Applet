# Deployment Checklist

Use this checklist to ensure your Tax Solar Analysis app is properly deployed to production.

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All features working in development
- [ ] No console errors
- [ ] All test cases pass (see TESTING_GUIDE.md)
- [ ] Code reviewed and clean
- [ ] No commented-out code left
- [ ] No debug console.log statements (except intentional error logging)

### Configuration

- [ ] `.env` file has correct Google Apps Script URL
- [ ] Google Apps Script deployed and tested
- [ ] All sheet tab names verified
- [ ] Cell references verified
- [ ] Required functions exist: `solveForITC()`, `solveForITCRefund()`, `zeroCellsByColor()`

### Documentation

- [ ] README.md is complete
- [ ] SETUP_GUIDE.md reviewed
- [ ] All placeholder URLs updated (intake form)
- [ ] Email functionality implemented OR noted as TODO

---

## Google Apps Script Pre-Deployment

### Verify Sheet Setup

- [ ] Sheet name correct: "Blended Solution Calculator"
- [ ] Sheet name correct: "Detailed Summary"
- [ ] Input cells accessible: C4, B4, B9, G10
- [ ] Output cells accessible: E117, C118, H22
- [ ] Working cells accessible: F47, G47, C90, C92

### Verify Apps Script

- [ ] Code.gs deployed
- [ ] Functions callable: `solveForITC()`, `solveForITCRefund()`, `zeroCellsByColor()`
- [ ] Web App deployed with:
  - Execute as: **Me**
  - Who has access: **Anyone**
- [ ] Web App URL copied
- [ ] Test endpoint responds: `<URL>?action=getOutputs`

### Security Review

- [ ] Sheet doesn't contain sensitive data
- [ ] Consider if "Anyone" access is acceptable
- [ ] Review who has edit access to the sheet
- [ ] Consider implementing authentication (if needed)

---

## Frontend Pre-Deployment

### Build Test

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] `dist` folder created
- [ ] Files in `dist` look correct

### Environment Variables

- [ ] `.env` NOT committed to git (check `.gitignore`)
- [ ] `.env.example` exists for reference
- [ ] Production environment variables ready

---

## Deployment Options

Choose your deployment platform:

---

## Option 1: Vercel (Recommended)

### Prerequisites

- [ ] Vercel account created
- [ ] Vercel CLI installed: `npm install -g vercel`

### Steps

1. **Login to Vercel**
   ```bash
   vercel login
   ```
   - [ ] Logged in successfully

2. **Deploy**
   ```bash
   vercel
   ```
   - [ ] Follow prompts
   - [ ] Note deployment URL

3. **Configure Environment Variables**
   - [ ] Go to Vercel dashboard
   - [ ] Select your project
   - [ ] Go to Settings → Environment Variables
   - [ ] Add: `VITE_GOOGLE_APPS_SCRIPT_URL` = `<your URL>`
   - [ ] Save

4. **Redeploy**
   ```bash
   vercel --prod
   ```
   - [ ] Production deployment complete
   - [ ] Custom domain configured (optional)

5. **Test Production**
   - [ ] Visit production URL
   - [ ] Run test analysis
   - [ ] Verify all functionality works

---

## Option 2: Netlify

### Prerequisites

- [ ] Netlify account created

### Steps

1. **Build Locally**
   ```bash
   npm run build
   ```
   - [ ] Build successful

2. **Deploy via Drag & Drop**
   - [ ] Go to https://app.netlify.com/drop
   - [ ] Drag `dist` folder
   - [ ] Note deployment URL

3. **Configure Environment Variables**
   - [ ] Go to Site settings
   - [ ] Build & deploy → Environment
   - [ ] Add: `VITE_GOOGLE_APPS_SCRIPT_URL`
   - [ ] Save

4. **Redeploy**
   - [ ] Trigger new deployment
   - [ ] Or use Netlify CLI

5. **Test Production**
   - [ ] Visit production URL
   - [ ] Run test analysis
   - [ ] Verify all functionality works

### Optional: Connect to Git

- [ ] Connect GitHub repository
- [ ] Configure build command: `npm run build`
- [ ] Configure publish directory: `dist`
- [ ] Enable automatic deployments

---

## Option 3: GitHub Pages

### Prerequisites

- [ ] GitHub repository created
- [ ] Code pushed to repository

### Steps

1. **Update vite.config.js**
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/'  // Add this line
   })
   ```
   - [ ] Base path configured

2. **Build**
   ```bash
   npm run build
   ```
   - [ ] Build successful

3. **Deploy to gh-pages Branch**
   
   Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```
   
   Add to package.json scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```
   
   Deploy:
   ```bash
   npm run deploy
   ```
   - [ ] Deployed successfully

4. **Configure GitHub Pages**
   - [ ] Go to repository Settings
   - [ ] Pages section
   - [ ] Source: gh-pages branch
   - [ ] Save

5. **Environment Variables**
   - **Note:** GitHub Pages doesn't support server-side env vars
   - [ ] Update code to use hardcoded URL OR
   - [ ] Use build-time replacement

6. **Test Production**
   - [ ] Visit GitHub Pages URL
   - [ ] Run test analysis
   - [ ] Verify all functionality works

---

## Post-Deployment Checklist

### Functional Testing

- [ ] Visit production URL
- [ ] Form loads correctly
- [ ] Can submit form
- [ ] Analysis runs successfully
- [ ] Results display correctly
- [ ] Action buttons work
- [ ] Error handling works
- [ ] Mobile responsive

### Performance Testing

- [ ] Page loads quickly (< 3 seconds)
- [ ] Analysis completes in reasonable time (30-60 seconds)
- [ ] No slow network requests
- [ ] Images optimized (if any added)

### Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

### Device Testing

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (iPad)
- [ ] Mobile (iPhone)

### Analytics (Optional)

- [ ] Google Analytics added (if desired)
- [ ] Tracking events configured
- [ ] Error tracking setup (Sentry, etc.)

---

## Security Checklist

- [ ] `.env` file not in repository
- [ ] No API keys exposed in client code
- [ ] Google Apps Script has appropriate access levels
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] No sensitive data in sheet
- [ ] Consider rate limiting (if high traffic expected)

---

## Monitoring & Maintenance

### Setup Monitoring

- [ ] Error tracking configured
- [ ] Uptime monitoring (UptimeRobot, etc.)
- [ ] Performance monitoring
- [ ] Google Apps Script execution logs reviewed

### Documentation for Users

- [ ] User guide created (if needed)
- [ ] Support contact information provided
- [ ] FAQ section (if needed)

### Maintenance Plan

- [ ] Schedule for dependency updates
- [ ] Process for handling bug reports
- [ ] Backup plan for Google Sheet
- [ ] Disaster recovery plan

---

## Rollback Plan

If something goes wrong:

### Vercel
```bash
vercel rollback <deployment-url>
```

### Netlify
- Go to Deploys
- Find previous successful deploy
- Click "Publish deploy"

### GitHub Pages
```bash
git revert <commit-hash>
git push
npm run deploy
```

### Emergency Contacts

- [ ] Google Apps Script owner contact
- [ ] Sheet access admin contact
- [ ] Hosting platform support

---

## Launch Checklist

Final steps before announcing to users:

- [ ] All checklists above completed
- [ ] Production URL tested multiple times
- [ ] Test data cleared from sheet
- [ ] Documentation updated with production URL
- [ ] Support process in place
- [ ] Announcement prepared
- [ ] Training materials ready (if needed)

---

## Post-Launch

### Week 1
- [ ] Monitor error logs daily
- [ ] Check user feedback
- [ ] Track usage analytics
- [ ] Quick fixes for critical bugs

### Month 1
- [ ] Review performance metrics
- [ ] Collect user feedback
- [ ] Plan improvements
- [ ] Update documentation based on common questions

### Ongoing
- [ ] Monthly dependency updates
- [ ] Quarterly security review
- [ ] Regular backups of Google Sheet
- [ ] Feature enhancements based on feedback

---

## Custom Domain Setup (Optional)

### Vercel
1. Go to project Settings → Domains
2. Add custom domain
3. Configure DNS (A or CNAME record)
4. Verify and wait for SSL

### Netlify
1. Go to Domain settings
2. Add custom domain
3. Configure DNS
4. Enable HTTPS

---

## Troubleshooting Production Issues

### Users Report Analysis Not Working

**Check:**
1. Google Apps Script still deployed?
2. Environment variable correct?
3. Sheet accessible?
4. Browser console errors?

### Analysis Hangs

**Check:**
1. Google Apps Script execution time limit
2. Sheet calculation speed
3. Network timeout settings

### Results Show $0

**Check:**
1. Cell references correct?
2. Sheet formulas working?
3. Output tab accessible?

---

## Success Criteria

Deployment is successful when:

- ✅ All test cases pass in production
- ✅ Analysis completes successfully
- ✅ Results display correctly
- ✅ Mobile responsive works
- ✅ No console errors
- ✅ Performance acceptable
- ✅ Monitoring in place
- ✅ Documentation complete
- ✅ Support process ready

---

## Sign-Off

- [ ] Deployment completed by: ________________
- [ ] Date: ________________
- [ ] Production URL: ________________
- [ ] Google Apps Script URL: ________________
- [ ] All checks passed: [ ] Yes [ ] No

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

Congratulations on deploying your Tax Solar Analysis application! 🎉

