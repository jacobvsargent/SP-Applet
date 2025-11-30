# Folder Structure Update - Change Summary

## Overview

Updated the folder organization system to use a two-tier structure organized by passcode, rather than including the passcode in each client folder name.

---

## 🗂️ New Folder Structure

### OLD Structure (Before):
```
Top-Level Folder/
├── Master Sheet
├── MARK - John Smith - $75k - NC - Single - 2025-11-30/
│   ├── Scenario 1.xlsx
│   ├── Scenario 2.xlsx
│   └── ...
├── MARK - Jane Doe - $120k - CA - Married - 2025-11-30/
│   └── ...
└── JOHN - Client Name - $150k - NY - Single - 2025-11-30/
    └── ...
```

### NEW Structure (After):
```
Top-Level Folder/
├── Master Sheet
├── MARK/  (passcode folder)
│   ├── John Smith - $75k - NC - Single - 2025-11-30/  (client folder)
│   │   ├── Scenario 1.xlsx
│   │   ├── Scenario 2.xlsx
│   │   └── ...
│   ├── Jane Doe - $120k - CA - Married - 2025-11-30/
│   │   └── ...
│   └── ...
├── WTAI/  (passcode folder)
│   └── Client analyses...
└── JOHN/  (passcode folder)
    └── Client analyses...
```

---

## ✅ Changes Made

### 1. Added New Passcode: "WTAI"
**File**: `src/config/passcodes.js`
- Added WTAI to VALID_PASSCODES object
- Configuration: `{ userId: 'WTAI', displayName: 'WTAI User' }`

### 2. Updated `createWorkbookCopy()` Function
**File**: `google-apps-script/Code.gs`

**Changes**:
- Now searches for passcode folder at top level (case-insensitive, starts-with match)
- Creates passcode folder if it doesn't exist (just the passcode, e.g., "MARK")
- Creates client folder INSIDE passcode folder
- Removed passcode prefix from client folder name
- Returns additional info: `passcodeFolderName`, `passcodeFolderId`, `passcodeFolderUrl`

**Logic Flow**:
1. Get top-level folder
2. Find or create passcode folder (e.g., "MARK")
3. Inside passcode folder, find or create client folder (e.g., "John Smith - $75k - NC - Single - 2025-11-30")
4. Copy workbook into client folder

### 3. Updated `createAnalysisFolder()` Function
**File**: `google-apps-script/Code.gs`

**Changes**:
- Same two-tier structure as createWorkbookCopy
- Finds or creates passcode folder first
- Creates client folder inside passcode folder
- Returns both passcode and client folder info

### 4. Added `findOrCreatePasscodeFolder()` Helper Function
**File**: `google-apps-script/Code.gs`

**Purpose**: Centralized logic for finding or creating passcode folders

**Features**:
- Searches all folders in parent (top-level folder)
- Case-insensitive comparison (converts to uppercase)
- Matches folders that START WITH the passcode
  - "MARK" matches "MARK", "MARK - Mark Myers", "MARK_OLD", etc.
- Creates new folder with just the passcode name if not found
- Logs all actions for debugging

**Code**:
```javascript
function findOrCreatePasscodeFolder(parentFolder, passcode) {
  const passcodeUpper = passcode.toUpperCase();
  const allFolders = parentFolder.getFolders();
  
  // Search for existing folder
  while (allFolders.hasNext()) {
    const folder = allFolders.next();
    const folderName = folder.getName().toUpperCase();
    
    if (folderName.indexOf(passcodeUpper) === 0) {
      return folder;  // Found!
    }
  }
  
  // Not found, create new one
  return parentFolder.createFolder(passcodeUpper);
}
```

---

## 🔍 Search Logic Details

### Passcode Folder Search
- **Case-Insensitive**: "mark" finds "MARK", "Mark", "MARK - User", etc.
- **Starts With**: Must begin with the passcode
  - ✅ "MARK" matches "MARK"
  - ✅ "MARK" matches "MARK - Mark Myers"
  - ✅ "MARK" matches "MARK_OLD"
  - ❌ "MARK" does NOT match "USER_MARK"
  - ❌ "MARK" does NOT match "mark_temp" (because uppercase comparison)

### Client Folder Search
- **Exact Match**: Folder name must match exactly
- **Within Passcode Folder**: Only searches inside the correct passcode folder

---

## 📊 Benefits of New Structure

### Better Organization
✅ All work for a user grouped together under their passcode folder
✅ Easy to find all analyses by a specific user
✅ Cleaner client folder names (no redundant passcode prefix)

### Easier Management
✅ Can rename passcode folders to add display names (e.g., "MARK" → "MARK - Mark Myers")
✅ Can move all user's work by moving one folder
✅ Can set folder-level permissions per user

### Scalability
✅ Supports many users without cluttering top level
✅ Works with existing folders that start with passcode
✅ Easy to archive old work by user

---

## 🧪 Testing Checklist

### Test with "MARK" Passcode
- [ ] Login with "MARK"
- [ ] Run analysis
- [ ] Verify folder structure: `Top-Level/MARK/Client-Name-.../Scenarios...`
- [ ] Run second analysis with different client name
- [ ] Verify both client folders are inside `MARK/`

### Test with "WTAI" Passcode (New)
- [ ] Logout, login with "WTAI"
- [ ] Run analysis
- [ ] Verify new `WTAI/` folder created at top level
- [ ] Verify client folder inside `WTAI/`

### Test Existing Passcode Folder
- [ ] Manually create folder "MARK - Mark Myers" at top level
- [ ] Run analysis with "MARK" passcode
- [ ] Verify it uses existing "MARK - Mark Myers" folder (not creating new "MARK")
- [ ] Verify client folder created inside it

### Test Case-Insensitive
- [ ] Create folder "mark" (lowercase) at top level
- [ ] Run analysis with "MARK" passcode
- [ ] Verify it finds and uses "mark" folder

---

## 🚀 Deployment Steps

### Frontend (Already Complete)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Google Apps Script)
1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. Replace `Code.gs` with updated version from `google-apps-script/Code.gs`
4. Save (Ctrl+S)
5. Deploy → Manage deployments
6. Click edit (pencil icon) on existing deployment
7. Version → New version
8. Click "Deploy"

**Important**: You must redeploy for the folder structure changes to take effect!

---

## 📁 Migration Notes

### Existing Folders
- Old structure folders (e.g., "MARK - Client Name...") will remain in place
- They won't be automatically moved to the new structure
- New analyses will use the new structure

### Optional: Manual Migration
If you want to reorganize existing folders:

1. Create passcode folders at top level (MARK, WTAI, etc.)
2. Move existing client folders into appropriate passcode folders
3. Rename client folders to remove passcode prefix
   - From: "MARK - John Smith - $75k..."
   - To: "John Smith - $75k..."

### Gradual Migration
- Let old and new structures coexist
- New analyses automatically use new structure
- Clean up old folders manually when convenient

---

## 🔧 Configuration

### Valid Passcodes
Located in `src/config/passcodes.js`:
```javascript
'MARK': { userId: 'MARK', displayName: 'Mark' },
'WTAI': { userId: 'WTAI', displayName: 'WTAI User' },
```

### Top-Level Folder ID
Located in `google-apps-script/Code.gs`:
```javascript
const topLevelFolder = DriveApp.getFolderById('1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW');
```

---

## 📞 Troubleshooting

### Issue: Folders still created with old structure
**Solution**: Redeploy Google Apps Script with new version

### Issue: Can't find existing passcode folder
**Solution**: 
- Check folder name starts with passcode (case-insensitive)
- Check folder is at correct level (not nested)
- Review Apps Script logs for folder search results

### Issue: Multiple passcode folders created
**Solution**:
- Manually merge folders in Google Drive
- Delete duplicate passcode folders
- Next analysis will use remaining folder

### Issue: Client folder in wrong passcode folder
**Solution**:
- Manually move folder to correct passcode folder
- Or delete and re-run analysis

---

## ✅ Summary

**What Changed:**
- Two-tier folder structure (Passcode → Client)
- Passcode folders at top level
- Client folders inside passcode folders
- Client folder names without passcode prefix
- Added "WTAI" passcode

**What Stayed the Same:**
- Frontend passcode gate functionality
- Session management
- Workbook copying logic
- File naming conventions
- All scenario logic

**Impact:**
- Better organization
- Easier user management
- Cleaner folder structure
- Same user experience

---

**Implementation Date**: November 30, 2025
**Version**: 1.1.0
**Changes**: Folder structure reorganization, added WTAI passcode

