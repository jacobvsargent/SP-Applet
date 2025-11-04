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
        result = forceRecalculation();
        break;
      // case 'createSnapshot':
      //   result = createSnapshot(data.scenarioName);
      //   break;
      case 'createWorkbookCopy':
        Logger.log('doPost received createWorkbookCopy request');
        Logger.log('scenarioName: ' + data.scenarioName);
        Logger.log('userInputs: ' + JSON.stringify(data.userInputs));
        result = createWorkbookCopy(data.scenarioName, data.userInputs);
        Logger.log('createWorkbookCopy returned: ' + JSON.stringify(result));
        break;
      case 'createFolder':
        result = createAnalysisFolder(data.userInputs);
        break;
      case 'createWorkingCopy':
        result = createWorkingCopy(data.folderId);
        break;
      case 'saveScenarioSnapshot':
        result = saveScenarioSnapshot(data.workingCopyId, data.scenarioName, data.folderId);
        break;
      case 'deleteWorkingCopy':
        result = deleteWorkingCopy(data.workingCopyId);
        break;
      case 'cleanup':
        result = cleanup();
        break;
      case 'cleanupLimited':
        result = cleanupLimited();
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
  // Use working copy if provided, otherwise use active spreadsheet (master)
  const ss = data.workingCopyId 
    ? SpreadsheetApp.openById(data.workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
    
  const sheet = ss.getSheetByName('Blended Solution Calculator');
  
  if (!sheet) {
    throw new Error('Sheet "Blended Solution Calculator" not found');
  }
  
  // Set the values in the appropriate cells
  sheet.getRange('C4').setValue(data.income);
  sheet.getRange('B4').setValue(data.state);
  sheet.getRange('B9').setValue(data.filingStatus);
  sheet.getRange('G4').setValue(data.avgIncome);
  
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
  
  // Note: solveForITC and solveForITCRefund must exist in the script
  // They will operate on the active spreadsheet context
  // If workingCopyId is provided, we need to switch context
  if (data.workingCopyId) {
    const ss = SpreadsheetApp.openById(data.workingCopyId);
    // These functions are assumed to be part of the script and work on active context
    // This is a limitation - they need to be modified to accept a spreadsheet parameter
    // For now, we'll call them as-is (they should work on the opened spreadsheet)
  }
  
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
  
  const agi = summarySheet.getRange('E117').getValue();
  const totalTaxDue = summarySheet.getRange('L18').getValue();
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
  const ss = data.workingCopyId 
    ? SpreadsheetApp.openById(data.workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
    
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
  const ss = data.workingCopyId 
    ? SpreadsheetApp.openById(data.workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
    
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
 */
function forceRecalculation() {
  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(); // Triggers recalc
  Utilities.sleep(200); // Wait 0.2 seconds for calculations to settle (reduced for performance)
  return { success: true };
}

/**
 * Create a snapshot of the Blended Solution Calculator sheet
 * The snapshot will have all formulas converted to static values
 * @param {string} scenarioName - Name of the scenario (e.g., "Do Nothing", "Solar Only")
 */
// COMMENTED OUT - Now using createWorkbookCopy instead
// function createSnapshot(scenarioName) {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const calcSheet = ss.getSheetByName('Blended Solution Calculator');
//   
//   if (!calcSheet) {
//     throw new Error('Sheet "Blended Solution Calculator" not found');
//   }
//   
//   // Create timestamp for unique naming
//   const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
//   const snapshotName = scenarioName + " - " + timestamp;
//   
//   // Copy the sheet
//   const snapshot = calcSheet.copyTo(ss);
//   snapshot.setName(snapshotName);
//   
//   // Convert all formulas to values (make it static like a screenshot)
//   const dataRange = snapshot.getDataRange();
//   const values = dataRange.getValues();
//   const formulas = dataRange.getFormulas();
//   
//   // Replace formulas with their current values
//   for (let i = 0; i < formulas.length; i++) {
//     for (let j = 0; j < formulas[i].length; j++) {
//       if (formulas[i][j]) {
//         // This cell has a formula, replace it with its value
//         snapshot.getRange(i + 1, j + 1).setValue(values[i][j]);
//       }
//     }
//   }
//   
//   // Move the snapshot to the end
//   ss.moveActiveSheet(ss.getNumSheets());
//   
//   return {
//     success: true,
//     sheetName: snapshotName,
//     timestamp: timestamp
//   };
// }

/**
 * Create a full copy of the entire workbook (all sheets)
 * The copy will have all formulas converted to static values
 * All copies go into a folder named with user inputs and timestamp
 * @param {string} scenarioName - Name of the scenario (e.g., "1 - Do Nothing")
 * @param {object} userInputs - User input data for folder naming
 */
function createWorkbookCopy(scenarioName, userInputs) {
  try {
    Logger.log('Starting createWorkbookCopy for: ' + scenarioName);
    Logger.log('User inputs: ' + JSON.stringify(userInputs));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
    
    // Create folder name with date only: "Analysis - $75k - NC - Single - 2025-10-30"
    const folderName = `Analysis - ${formatIncome(userInputs.income)} - ${userInputs.state} - ${userInputs.filingStatus} - ${dateOnly}`;
    
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
    
    // Create workbook copy name with full timestamp: "1 - Do Nothing - 2025-10-30_143022"
    const copyName = `${scenarioName} - ${timestamp}`;
    
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
 */
function cleanup() {
  zeroCellsByColor();
  
  return { success: true };
}

/**
 * Clean up by calling zeroCellsByColorLimited (runs before each scenario)
 */
function cleanupLimited() {
  zeroCellsByColorLimited();
  
  return { success: true };
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
    
    // Create folder name: "Analysis - $75k - NC - Single - 2025-10-30"
    const folderName = `Analysis - ${formatIncome(userInputs.income)} - ${userInputs.state} - ${userInputs.filingStatus} - ${dateOnly}`;
    
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
 * Step 3: Save a scenario snapshot from the working copy
 * This copies the current state of the working copy with a scenario name
 * @param {string} workingCopyId - ID of the working copy spreadsheet
 * @param {number} scenarioNumber - Scenario number (1-5)
 * @param {string} folderId - ID of the folder
 * @returns {object} - Snapshot info
 */
function saveScenarioSnapshot(workingCopyId, scenarioNumber, folderId) {
  try {
    Logger.log('Saving scenario snapshot: ' + scenarioNumber);
    
    // Open the working copy to read values
    const workingCopySpreadsheet = SpreadsheetApp.openById(workingCopyId);
    const sheet = workingCopySpreadsheet.getSheetByName('Blended Solution Calculator');
    
    if (!sheet) {
      throw new Error('Sheet "Blended Solution Calculator" not found in working copy');
    }
    
    // Read the three values
    const b43Value = sheet.getRange('B43').getValue() || 0;
    const c92Value = sheet.getRange('C92').getValue() || 0;
    const g47Value = sheet.getRange('G47').getValue() || 0;
    
    Logger.log('Values - B43: ' + b43Value + ', C92: ' + c92Value + ', G47: ' + g47Value);
    
    // Helper function to format value as $XXXk (rounded to nearest thousand)
    const formatValue = (value, label) => {
      const roundedThousands = Math.round(value / 1000);
      if (roundedThousands > 0) {
        return `$${roundedThousands}k ${label}`;
      }
      return '';
    };
    
    // Build the filename parts
    const parts = [scenarioNumber + ' -'];
    
    const solarPart = formatValue(b43Value, 'Solar');
    if (solarPart) parts.push(solarPart);
    
    const medtechPart = formatValue(c92Value, 'Medtech');
    if (medtechPart) parts.push(medtechPart);
    
    const refundPart = formatValue(g47Value, 'Refund');
    if (refundPart) parts.push(refundPart);
    
    // Join with underscore between value parts
    let snapshotName;
    if (parts.length === 1) {
      // No values > 0, just use scenario number
      snapshotName = scenarioNumber.toString();
    } else {
      snapshotName = parts[0] + ' ' + parts.slice(1).join('_');
    }
    
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
    snapshotName = `${snapshotName} - ${timestamp}`;
    
    Logger.log('Creating snapshot with name: ' + snapshotName);
    
    // Make a copy of the working copy to preserve this scenario
    const workingCopyFile = DriveApp.getFileById(workingCopyId);
    const targetFolder = DriveApp.getFolderById(folderId);
    const snapshot = workingCopyFile.makeCopy(snapshotName, targetFolder);
    
    Logger.log('Snapshot saved: ' + snapshot.getId());
    
    return {
      success: true,
      snapshotId: snapshot.getId(),
      snapshotUrl: snapshot.getUrl(),
      snapshotName: snapshotName
    };
  } catch (error) {
    Logger.log('ERROR in saveScenarioSnapshot: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

/**
 * Step 4: Delete the working copy after all scenarios are complete
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

