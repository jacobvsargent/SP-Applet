/**
 * @OnlyCurrentDoc false
 * 
 * Google Apps Script Web App for Tax Solar Analysis
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Replace the content of Code.gs with this file
 * 4. Click "Deploy" > "New deployment"
 * 5. Select type: "Web app"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone"
 * 8. Click "Deploy"
 * 9. Copy the Web App URL and add it to your .env file as VITE_GOOGLE_APPS_SCRIPT_URL
 * 
 * REQUIRED SCOPES:
 * This script requires access to Google Drive to create workbook copies.
 * You will be prompted to authorize these permissions when first deploying.
 */

/**
 * Main handler for POST requests
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    let data = {};
    
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    let result;
    
    switch(action) {
      case 'setInputs':
        result = setUserInputs(data);
        break;
      case 'runScenario':
        result = runScenario(data);
        break;
      case 'getOutputs':
        result = getOutputs();
        break;
      case 'writeFormula':
        result = writeFormula(data);
        break;
      case 'setValue':
        result = setValue(data);
        break;
      case 'forceRecalc':
        result = forceRecalculation(data.workingCopyId);
        break;
      case 'createWorkbookCopy':
        Logger.log('doPost received createWorkbookCopy request');
        Logger.log('scenarioNumber: ' + data.scenarioNumber);
        Logger.log('userInputs: ' + JSON.stringify(data.userInputs));
        result = createWorkbookCopy(data.scenarioNumber, data.userInputs);
        Logger.log('createWorkbookCopy returned: ' + JSON.stringify(result));
        break;
      case 'createFolder':
        result = createAnalysisFolder(data.userInputs);
        break;
      case 'createWorkingCopy':
        result = createWorkingCopy(data.folderId);
        break;
      case 'deleteWorkingCopy':
        result = deleteWorkingCopy(data.workingCopyId);
        break;
      case 'cleanup':
        result = cleanup(data.workingCopyId);
        break;
      case 'cleanupLimited':
        result = cleanupLimited(data.workingCopyId);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    // Fix CORB issues by ensuring proper JSON response with CORS headers
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Note: Apps Script Web Apps automatically handle CORS when deployed as "Anyone"
    // but we ensure clean JSON output
    return output;
      
  } catch (error) {
    const errorOutput = ContentService.createTextOutput(JSON.stringify({ 
      success: false,
      error: error.toString(),
      stack: error.stack 
    }));
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    return errorOutput;
  }
}

/**
 * Main handler for GET requests (for reading data)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const workingCopyId = e.parameter.workingCopyId;
    
    let result;
    
    switch(action) {
      case 'getOutputs':
        result = getOutputs(workingCopyId);
        break;
      case 'getValue':
        result = getSingleValue(e.parameter.cell, workingCopyId);
        break;
      case 'createFolder':
        // Parse userInputs from JSON string
        const userInputs = e.parameter.userInputs ? JSON.parse(e.parameter.userInputs) : {};
        result = createAnalysisFolder(userInputs);
        break;
      case 'createWorkingCopy':
        result = createWorkingCopy(e.parameter.folderId);
        break;
      case 'createWorkbookCopy':
        const scenarioNumber = parseInt(e.parameter.scenarioNumber);
        const copyUserInputs = e.parameter.userInputs ? JSON.parse(e.parameter.userInputs) : {};
        const copyWorkingCopyId = e.parameter.workingCopyId || null;
        result = createWorkbookCopy(scenarioNumber, copyUserInputs, copyWorkingCopyId);
        break;
      default:
        result = { error: 'Unknown GET action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: error.toString(),
        stack: error.stack 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Set user inputs in the Blended Solution Calculator sheet
 * @param {object} data - Contains income, avgIncome, state, filingStatus, and optional workingCopyId
 */
function setUserInputs(data) {
  Logger.log('🔍 setUserInputs called with workingCopyId: ' + data.workingCopyId);
  Logger.log('🔍 Data object: ' + JSON.stringify(data));
  
  // Use working copy if provided, otherwise use active spreadsheet (master)
  const ss = data.workingCopyId 
    ? SpreadsheetApp.openById(data.workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('🔍 Using spreadsheet: ' + ss.getName() + ' (ID: ' + ss.getId() + ')');
  Logger.log('🔍 Spreadsheet URL: ' + ss.getUrl());
    
  const sheet = ss.getSheetByName('Blended Solution Calculator');
  
  if (!sheet) {
    throw new Error('Sheet "Blended Solution Calculator" not found');
  }
  
  Logger.log('🔍 About to set income: ' + data.income + ' to cell C4');
  
  // Set the values in the appropriate cells
  sheet.getRange('C4').setValue(data.income);
  sheet.getRange('B4').setValue(data.state);
  sheet.getRange('B9').setValue(data.filingStatus);
  sheet.getRange('G4').setValue(data.avgIncome);
  
  Logger.log('🔍 Values set successfully. Verifying C4 = ' + sheet.getRange('C4').getValue());
  
  // Force calculation and wait for it to settle
  SpreadsheetApp.flush();
  Utilities.sleep(200); // Wait 0.2 seconds for calculations (reduced for performance)
  
  // Make G10 equal to G6
  sheet.getRange('G10').setFormula('=G6');
  
  // Force calculation again
  SpreadsheetApp.flush();
  
  return { success: true };
}

/**
 * Run a scenario function (solveForITC or solveForITCRefund)
 * @param {object} data - Contains function name and optional workingCopyId
 */
function runScenario(data) {
  const functionName = data.function;
  
  // CRITICAL: If workingCopyId is provided, we must set it as the active spreadsheet
  // so that solveForITC and solveForITCRefund operate on the working copy
  let originalActiveSpreadsheet = null;
  
  if (data.workingCopyId) {
    // Save the current active spreadsheet (master)
    originalActiveSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Open the working copy and set it as active
    const workingCopy = SpreadsheetApp.openById(data.workingCopyId);
    SpreadsheetApp.setActiveSpreadsheet(workingCopy);
    
    Logger.log('Switched to working copy: ' + data.workingCopyId);
  }
  
  try {
    // Now solveForITC and solveForITCRefund will operate on the working copy
    if (functionName === 'solveForITC') {
      solveForITC();
    } else if (functionName === 'solveForITCRefund') {
      solveForITCRefund();
    } else {
      throw new Error('Unknown function: ' + functionName);
    }
    
    // Force calculation
    SpreadsheetApp.flush();
    
    return { success: true };
    
  } finally {
    // IMPORTANT: Restore the original active spreadsheet (master)
    if (originalActiveSpreadsheet) {
      SpreadsheetApp.setActiveSpreadsheet(originalActiveSpreadsheet);
      Logger.log('Restored master spreadsheet as active');
    }
  }
}

/**
 * Get output values from the Detailed Summary sheet
 * @param {string} workingCopyId - Optional working copy ID
 * @returns {object} - Contains agi, totalTaxDue, totalNetGain
 */
function getOutputs(workingCopyId) {
  const ss = workingCopyId 
    ? SpreadsheetApp.openById(workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
    
  const summarySheet = ss.getSheetByName('Detailed Summary');
  
  if (!summarySheet) {
    throw new Error('Sheet "Detailed Summary" not found');
  }
  
  const agi = summarySheet.getRange('E118').getValue();
  const totalTaxDue = summarySheet.getRange('D18').getValue();
  const totalNetGain = summarySheet.getRange('H22').getValue();
  
  return {
    agi: agi,
    totalTaxDue: totalTaxDue,
    totalNetGain: totalNetGain,
    success: true
  };
}

/**
 * Get a single cell value from the Blended Solution Calculator sheet
 * @param {string} cell - Cell reference (e.g., "F51")
 * @param {string} workingCopyId - Optional working copy ID
 * @returns {object} - Contains the cell value
 */
function getSingleValue(cell, workingCopyId) {
  const ss = workingCopyId 
    ? SpreadsheetApp.openById(workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
    
  const sheet = ss.getSheetByName('Blended Solution Calculator');
  
  if (!sheet) {
    throw new Error('Sheet "Blended Solution Calculator" not found');
  }
  
  const value = sheet.getRange(cell).getValue();
  
  return {
    value: value,
    success: true
  };
}

/**
 * Write a formula to a specific cell
 * @param {object} data - Contains cell, formula, and optional workingCopyId
 */
function writeFormula(data) {
  Logger.log('🔍 writeFormula called - cell: ' + data.cell + ', formula: ' + data.formula + ', workingCopyId: ' + data.workingCopyId);
  
  const ss = data.workingCopyId 
    ? SpreadsheetApp.openById(data.workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('🔍 writeFormula using spreadsheet: ' + ss.getName() + ' (ID: ' + ss.getId() + ')');
    
  const sheet = ss.getSheetByName('Blended Solution Calculator');
  
  if (!sheet) {
    throw new Error('Sheet "Blended Solution Calculator" not found');
  }
  
  sheet.getRange(data.cell).setFormula(data.formula);
  
  // Force calculation
  SpreadsheetApp.flush();
  
  return { success: true };
}

/**
 * Set a value in a specific cell
 * @param {object} data - Contains cell, value, and optional workingCopyId
 */
function setValue(data) {
  Logger.log('🔍 setValue called - cell: ' + data.cell + ', value: ' + data.value + ', workingCopyId: ' + data.workingCopyId);
  
  const ss = data.workingCopyId 
    ? SpreadsheetApp.openById(data.workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('🔍 setValue using spreadsheet: ' + ss.getName() + ' (ID: ' + ss.getId() + ')');
    
  const sheet = ss.getSheetByName('Blended Solution Calculator');
  
  if (!sheet) {
    throw new Error('Sheet "Blended Solution Calculator" not found');
  }
  
  sheet.getRange(data.cell).setValue(data.value);
  
  // Force calculation
  SpreadsheetApp.flush();
  
  return { success: true };
}

/**
 * Force recalculation of all formulas in the spreadsheet
 * @param {string} workingCopyId - Optional working copy ID
 */
function forceRecalculation(workingCopyId) {
  const ss = workingCopyId 
    ? SpreadsheetApp.openById(workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
    
  SpreadsheetApp.flush();
  ss.getSpreadsheetTimeZone(); // Triggers recalc
  Utilities.sleep(200); // Wait 0.2 seconds for calculations to settle (reduced for performance)
  return { success: true };
}

/**
 * Create a full copy of the entire workbook (all sheets)
 * All copies go into a folder named with user inputs and timestamp
 * @param {number} scenarioNumber - Scenario number (1-5)
 * @param {object} userInputs - User input data for folder naming
 * @param {string} workingCopyId - Optional working copy ID to copy from
 */
function createWorkbookCopy(scenarioNumber, userInputs, workingCopyId) {
  try {
    Logger.log('Starting createWorkbookCopy for scenario: ' + scenarioNumber);
    Logger.log('User inputs: ' + JSON.stringify(userInputs));
    Logger.log('Working copy ID: ' + workingCopyId);
    
    // Use working copy if provided, otherwise use active spreadsheet (master)
    const ss = workingCopyId 
      ? SpreadsheetApp.openById(workingCopyId)
      : SpreadsheetApp.getActiveSpreadsheet();
      
    Logger.log('Copying from spreadsheet: ' + ss.getName() + ' (ID: ' + ss.getId() + ')');
    
    const sheet = ss.getSheetByName('Blended Solution Calculator');
    
    if (!sheet) {
      throw new Error('Sheet "Blended Solution Calculator" not found');
    }
    
    // Read the three values for dynamic naming
    const b43Value = sheet.getRange('B43').getValue() || 0;
    const c92Value = sheet.getRange('C92').getValue() || 0;
    const g47Value = sheet.getRange('G47').getValue() || 0;
    const c90Value = sheet.getRange('C90').getValue() || 0;
    
    Logger.log('Values - B43: ' + b43Value + ', C92: ' + c92Value + ', G47: ' + g47Value + ', C90: ' + c90Value);
    
    // Helper function to format value as $XXXk (rounded to nearest thousand)
    const formatValue = (value, label) => {
      const roundedThousands = Math.round(value / 1000);
      if (roundedThousands > 0) {
        return `$${roundedThousands}k ${label}`;
      }
      return '';
    };
    
    // Determine donation type based on C90 value
    // C90 = 0.3 (30%) => Land, C90 = 0.6 (60%) => Medtech
    const donationType = (c90Value <= 0.35) ? 'Land' : 'Medtech';
    Logger.log('Donation type: ' + donationType + ' (C90 = ' + c90Value + ')');
    
    // Build the filename parts - start with name
    const namePart = userInputs.name || 'Unknown';
    const parts = [namePart, scenarioNumber + ' -'];
    
    const solarPart = formatValue(b43Value, 'Solar');
    if (solarPart) parts.push(solarPart);
    
    const donationPart = formatValue(c92Value, donationType);
    if (donationPart) parts.push(donationPart);
    
    const refundPart = formatValue(g47Value, 'Refund');
    if (refundPart) parts.push(refundPart);
    
    // Join: "Name - Scenario# - value_value_value"
    // First element is name, second is scenario number, rest are values
    let copyName;
    if (parts.length === 2) {
      // No values > 0, just use name and scenario number
      copyName = `${parts[0]} - ${scenarioNumber}`;
    } else {
      // Name - Scenario# - values
      copyName = parts[0] + ' - ' + parts[1] + ' ' + parts.slice(2).join('_');
    }
    
    const originalFile = DriveApp.getFileById(ss.getId());
    // Use specific folder ID instead of parent folder
    const parentFolder = DriveApp.getFolderById('1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW');
    
    Logger.log('Parent folder name: ' + parentFolder.getName());
    
    // Create timestamp for file naming and date for folder
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
    const dateOnly = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    // Format income for folder name (e.g., $75000 -> $75k)
    const formatIncome = (income) => {
      if (income >= 1000) {
        return '$' + Math.round(income / 1000) + 'k';
      }
      return '$' + income;
    };
    
    // Create folder name with name first: "John Smith - $75k - NC - Single - 2025-10-30"
    const folderName = `${userInputs.name} - ${formatIncome(userInputs.income)} - ${userInputs.state} - ${userInputs.filingStatus} - ${dateOnly}`;
    
    Logger.log('Looking for/creating folder: ' + folderName);
    
    // Check if folder already exists for this analysis session
    let analysisFolder;
    const existingFolders = parentFolder.getFoldersByName(folderName);
    
    if (existingFolders.hasNext()) {
      analysisFolder = existingFolders.next();
      Logger.log('Found existing folder');
    } else {
      // Create new folder in the same location as the original spreadsheet
      analysisFolder = parentFolder.createFolder(folderName);
      Logger.log('Created new folder: ' + analysisFolder.getId());
    }
    
    // Add timestamp to filename
    copyName = `${copyName} - ${timestamp}`;
    
    Logger.log('Creating workbook copy: ' + copyName);
    
    // Make a copy of the entire workbook (keeping all formulas intact)
    const copiedFile = originalFile.makeCopy(copyName, analysisFolder);
    
    Logger.log('Workbook copied successfully with formulas preserved');
    
    Logger.log('Success! File URL: ' + copiedFile.getUrl());
    Logger.log('Folder URL: ' + analysisFolder.getUrl());
    
    // Write the folder URL to a visible cell in the original spreadsheet
    // so users can find their saved workbooks even if CORS blocks the response
    const controlSheet = ss.getSheetByName('Blended Solution Calculator');
    if (controlSheet) {
      // Write to a cell (e.g., A1) - adjust as needed
      try {
        controlSheet.getRange('A1').setValue('Last Analysis Folder: ' + analysisFolder.getUrl());
        Logger.log('Successfully wrote folder URL to A1: ' + analysisFolder.getUrl());
      } catch (writeError) {
        Logger.log('ERROR writing to A1: ' + writeError.toString());
        // Try writing to a different cell as backup
        try {
          controlSheet.getRange('Z1').setValue('Last Analysis Folder: ' + analysisFolder.getUrl());
          Logger.log('Successfully wrote folder URL to Z1 as backup');
        } catch (backupError) {
          Logger.log('ERROR writing to Z1: ' + backupError.toString());
        }
      }
    } else {
      Logger.log('ERROR: Could not find sheet "Blended Solution Calculator"');
      // Try to log all sheet names to help debug
      const allSheets = ss.getSheets();
      Logger.log('Available sheets: ' + allSheets.map(s => s.getName()).join(', '));
    }
    
    return {
      success: true,
      fileName: copyName,
      folderName: folderName,
      folderId: analysisFolder.getId(),
      folderUrl: analysisFolder.getUrl(),
      fileUrl: copiedFile.getUrl(),
      timestamp: timestamp
    };
  } catch (error) {
    Logger.log('ERROR in createWorkbookCopy: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

/**
 * Clean up by calling zeroCellsByColor
 * @param {string} workingCopyId - Optional working copy ID
 */
function cleanup(workingCopyId) {
  Logger.log('🔍 cleanup called with workingCopyId: ' + workingCopyId);
  
  let originalActiveSpreadsheet = null;
  
  if (workingCopyId) {
    // Save the current active spreadsheet
    originalActiveSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('🔍 Original active spreadsheet: ' + originalActiveSpreadsheet.getName());
    
    // Set working copy as active so zeroCellsByColor operates on it
    const workingCopy = SpreadsheetApp.openById(workingCopyId);
    SpreadsheetApp.setActiveSpreadsheet(workingCopy);
    
    Logger.log('🔍 Switched to working copy for cleanup: ' + workingCopy.getName() + ' (ID: ' + workingCopyId + ')');
  } else {
    Logger.log('🔍 WARNING: No workingCopyId provided to cleanup! Operating on master!');
  }
  
  try {
    // Now zeroCellsByColor will operate on the working copy
    zeroCellsByColor();
    return { success: true };
    
  } finally {
    // Restore original active spreadsheet
    if (originalActiveSpreadsheet) {
      SpreadsheetApp.setActiveSpreadsheet(originalActiveSpreadsheet);
      Logger.log('Restored master spreadsheet after cleanup');
    }
  }
}

/**
 * Clean up by calling zeroCellsByColorLimited (runs before each scenario)
 * @param {string} workingCopyId - Optional working copy ID
 */
function cleanupLimited(workingCopyId) {
  Logger.log('🔍 cleanupLimited called with workingCopyId: ' + workingCopyId);
  
  let originalActiveSpreadsheet = null;
  
  if (workingCopyId) {
    // Save the current active spreadsheet
    originalActiveSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('🔍 Original active spreadsheet: ' + originalActiveSpreadsheet.getName());
    
    // Set working copy as active so zeroCellsByColorLimited operates on it
    const workingCopy = SpreadsheetApp.openById(workingCopyId);
    SpreadsheetApp.setActiveSpreadsheet(workingCopy);
    
    Logger.log('🔍 Switched to working copy for limited cleanup: ' + workingCopy.getName() + ' (ID: ' + workingCopyId + ')');
  } else {
    Logger.log('🔍 WARNING: No workingCopyId provided to cleanupLimited! Operating on master!');
  }
  
  try {
    // Now zeroCellsByColorLimited will operate on the working copy
    zeroCellsByColorLimited();
    return { success: true };
    
  } finally {
    // Restore original active spreadsheet
    if (originalActiveSpreadsheet) {
      SpreadsheetApp.setActiveSpreadsheet(originalActiveSpreadsheet);
      Logger.log('Restored master spreadsheet after limited cleanup');
    }
  }
}

/**
 * NEW WORKFLOW FUNCTIONS
 * These functions implement the workflow where operations are done on a working copy
 * instead of the master workbook
 */

/**
 * Step 1: Create the analysis folder
 * @param {object} userInputs - User input data for folder naming
 * @returns {object} - Folder info (id, url, name)
 */
function createAnalysisFolder(userInputs) {
  try {
    Logger.log('Creating analysis folder');
    Logger.log('User inputs: ' + JSON.stringify(userInputs));
    
    // Use specific parent folder ID
    const parentFolder = DriveApp.getFolderById('1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW');
    
    // Create timestamp
    const dateOnly = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    // Format income for folder name
    const formatIncome = (income) => {
      if (income >= 1000) {
        return '$' + Math.round(income / 1000) + 'k';
      }
      return '$' + income;
    };
    
    // Create folder name with name first: "John Smith - $75k - NC - Single - 2025-10-30"
    const folderName = `${userInputs.name} - ${formatIncome(userInputs.income)} - ${userInputs.state} - ${userInputs.filingStatus} - ${dateOnly}`;
    
    Logger.log('Looking for/creating folder: ' + folderName);
    
    // Check if folder already exists
    let analysisFolder;
    const existingFolders = parentFolder.getFoldersByName(folderName);
    
    if (existingFolders.hasNext()) {
      analysisFolder = existingFolders.next();
      Logger.log('Found existing folder');
    } else {
      analysisFolder = parentFolder.createFolder(folderName);
      Logger.log('Created new folder: ' + analysisFolder.getId());
    }
    
    return {
      success: true,
      folderId: analysisFolder.getId(),
      folderUrl: analysisFolder.getUrl(),
      folderName: folderName
    };
  } catch (error) {
    Logger.log('ERROR in createAnalysisFolder: ' + error.toString());
    throw error;
  }
}

/**
 * Step 2: Create a working copy of the master workbook in the folder
 * @param {string} folderId - ID of the folder to place the working copy
 * @returns {object} - Working copy info (id, url)
 */
function createWorkingCopy(folderId) {
  try {
    Logger.log('Creating working copy in folder: ' + folderId);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterFile = DriveApp.getFileById(ss.getId());
    const targetFolder = DriveApp.getFolderById(folderId);
    
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
    const workingCopyName = `WORKING_COPY - ${timestamp}`;
    
    Logger.log('Creating working copy: ' + workingCopyName);
    
    // Make a copy of the master workbook
    const workingCopy = masterFile.makeCopy(workingCopyName, targetFolder);
    
    Logger.log('Working copy created: ' + workingCopy.getId());
    
    return {
      success: true,
      workingCopyId: workingCopy.getId(),
      workingCopyUrl: workingCopy.getUrl()
    };
  } catch (error) {
    Logger.log('ERROR in createWorkingCopy: ' + error.toString());
    throw error;
  }
}

/**
 * Step 3: Delete the working copy after all scenarios are complete
 * @param {string} workingCopyId - ID of the working copy to delete
 * @returns {object} - Success status
 */
function deleteWorkingCopy(workingCopyId) {
  try {
    Logger.log('Deleting working copy: ' + workingCopyId);
    
    const workingCopyFile = DriveApp.getFileById(workingCopyId);
    workingCopyFile.setTrashed(true);
    
    Logger.log('Working copy moved to trash');
    
    return {
      success: true
    };
  } catch (error) {
    Logger.log('ERROR in deleteWorkingCopy: ' + error.toString());
    throw error;
  }
}

/**
 * NOTE: The following functions should already exist in your Google Sheet's script:
 * - solveForITC()
 * - solveForITCRefund()
 * - zeroCellsByColor()
 * - zeroCellsByColorLimited()
 * 
 * If they don't exist, you'll need to add them or this script will fail.
 * These functions are specific to your sheet's calculation logic.
 */

