# Troubleshooting: Passcode Folder Not Creating

## 🔍 Most Likely Issue: Apps Script Not Redeployed

The #1 reason this happens is that the updated `Code.gs` wasn't properly redeployed to the Web App.

### ✅ How to Redeploy Correctly

1. **Open Google Apps Script**
   - Open your Google Sheet
   - Go to **Extensions** → **Apps Script**

2. **Paste Updated Code**
   - Copy the entire contents of `google-apps-script/Code.gs`
   - Replace ALL code in the Apps Script editor
   - **Save** (Ctrl+S or File → Save)

3. **Deploy as NEW VERSION** (Critical!)
   - Click **Deploy** (top right)
   - Click **Manage deployments**
   - Click the **Edit** button (pencil icon) next to your existing deployment
   - Under "Version", select **"New version"**
   - Add description: "Fixed passcode folder structure"
   - Click **Deploy**
   - You should see: "Web app has been updated"

4. **Verify Deployment**
   - The version number should increment (e.g., Version 1 → Version 2)
   - Note the timestamp - it should be current

⚠️ **Common Mistake**: Just saving the code is NOT enough! You MUST create a new deployment version for changes to take effect.

---

## 🧪 Test with Apps Script Directly

Before testing from the web app, test directly in Apps Script:

### Step 1: Run Test Function

1. In Apps Script editor, find the `testPasscodeFolder()` function at the bottom
2. Select it from the function dropdown at the top
3. Click **Run** (play button)
4. Check **Execution log** (View → Logs or Ctrl+Enter)

### Step 2: Check Logs

Look for these log messages:
```
=== TESTING PASSCODE FOLDER CREATION ===
Passcode from userInputs: MARK
Passcode folder name to search: MARK
=== findOrCreatePasscodeFolder START ===
Searching for folder starting with: MARK
Checking folder #1: "MARK" (uppercase: "MARK")
✅ MATCH FOUND! Using existing passcode folder: MARK
```

If you see `✅ MATCH FOUND`, the code is working!

If you see `Creating new passcode folder: MARK`, it's creating the folder correctly.

---

## 🔎 Debug Checklist

### 1. Is Passcode Being Passed from Frontend?

**Check Browser Console** (F12):
```javascript
// Look for this log when submitting form:
📤 setUserInputs - Sending to backend: {
  passcode: "MARK",  // ← Should be present!
  name: "John Smith",
  income: 75000,
  ...
}
```

**If passcode is missing:**
- Clear browser cache and localStorage
- Re-login with passcode
- Try again

### 2. Is Apps Script Receiving Passcode?

**Check Apps Script Logs**:
1. Go to Apps Script editor
2. Click **Executions** (left sidebar, clock icon)
3. Find recent execution
4. Check logs for: `Passcode from userInputs: MARK`

**If passcode is "UNKNOWN" or missing:**
- Frontend isn't sending it
- OR deployment is old version
- Redeploy with new version!

### 3. Is Search Logic Working?

**Check Apps Script Logs** for:
```
=== findOrCreatePasscodeFolder START ===
Searching for folder starting with: MARK
Checking folder #1: "..." 
Checking folder #2: "..."
```

**If no folders are checked:**
- Wrong parent folder ID
- Permissions issue

**If folders are checked but none match:**
- Folder name doesn't start with "MARK"
- Case sensitivity issue (shouldn't be, but check)

---

## 🔧 Manual Testing Steps

### Test 1: Frontend to Backend Communication

1. Open browser console (F12)
2. Run analysis with passcode "MARK"
3. Look for logs showing passcode in data being sent

### Test 2: Apps Script Execution

1. Go to Apps Script → Executions
2. Find the `createAnalysisFolder` execution
3. Click to see full logs
4. Verify passcode appears in logs

### Test 3: Direct Apps Script Test

1. Run `testPasscodeFolder()` function
2. Check logs show: `Passcode from userInputs: MARK`
3. Check Google Drive for "MARK" folder created

### Test 4: Check Folder Structure

1. Go to Google Drive
2. Navigate to folder ID: `1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW`
3. Look for "MARK" folder
4. Check if client folders are inside it

---

## 🐛 Common Issues & Solutions

### Issue: "Old folder structure still being used"
**Solution**: 
- Redeploy Apps Script with NEW VERSION
- Don't just save - must create new deployment version
- Wait 1-2 minutes after deployment

### Issue: "I created MARK folder manually but it's ignored"
**Solution**:
- Check folder name is exactly "MARK" (uppercase)
- Check folder is at correct level (not nested)
- Try running `testPasscodeFolder()` to see logs
- Folder might have special characters (copy-paste issue)

### Issue: "Multiple MARK folders being created"
**Solution**:
- Search logic might not be finding existing folder
- Check Apps Script logs to see what folders it's checking
- Delete duplicate folders
- Ensure folder name starts with "MARK" (no spaces before)

### Issue: "Error about userInputs.passcode"
**Solution**:
- Frontend not passing passcode
- User not logged in / session expired
- Clear localStorage and re-login

### Issue: "Folders created at top level, not inside MARK"
**Solution**:
- Old version of Apps Script is running
- **MUST redeploy with new version**
- Check deployment timestamp

---

## 📋 Quick Diagnostic

Run this in Apps Script console to see what folders exist:

```javascript
function listTopLevelFolders() {
  const topLevel = DriveApp.getFolderById('1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW');
  const folders = topLevel.getFolders();
  
  Logger.log('=== TOP LEVEL FOLDERS ===');
  let count = 0;
  while (folders.hasNext()) {
    const folder = folders.next();
    count++;
    Logger.log(count + '. "' + folder.getName() + '" (ID: ' + folder.getId() + ')');
  }
  Logger.log('Total folders: ' + count);
}
```

This will show you exactly what folders exist at the top level.

---

## ✅ Verification Steps

After redeployment, verify:

1. **Apps Script Version**
   - Deploy → Manage deployments
   - Check version number and timestamp
   - Should be recent (within last few minutes)

2. **Test Function**
   - Run `testPasscodeFolder()`
   - Check logs show new logic
   - Verify folder created correctly

3. **Full Analysis Test**
   - Login to web app with "MARK"
   - Run complete analysis
   - Check Drive: `Top-Level/MARK/Client-Folder/Scenarios...`

4. **Browser Console**
   - No errors in console (F12)
   - Passcode visible in network requests

---

## 🆘 Still Not Working?

### Get Detailed Logs

1. **Browser Side**:
   ```javascript
   // In browser console after form submission:
   localStorage.getItem('sp_applet_passcode')
   // Should show: "MARK"
   ```

2. **Apps Script Side**:
   - Go to Executions tab
   - Find latest `createAnalysisFolder` execution  
   - Screenshot the full log
   - Look for: "=== createAnalysisFolder START ==="

3. **Check Folder IDs**:
   - Parent folder ID in code: `1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW`
   - Does this folder exist in your Drive?
   - Do you have edit permissions?

### Nuclear Option: Fresh Deployment

1. Delete existing deployment
2. Create completely new deployment
3. Update `.env` with new URL
4. Rebuild frontend: `npm run build`
5. Test again

---

## 📞 Need Help?

If still not working, provide:
1. Screenshot of Apps Script logs (from Executions tab)
2. Screenshot of browser console (F12) showing passcode
3. Screenshot of Drive folder structure
4. Current deployment version number

The issue is almost certainly a deployment problem - the updated code needs to be deployed as a new version!

