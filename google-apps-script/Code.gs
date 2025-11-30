/**
 * @OnlyCurrentDoc false
 * 
 * Google Apps Script Web App for Tax Solar Analysis
 * 
 * DEPLOYMENT INSTRUCTIONS: s    
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
        Logger.log('createFolder action - raw parameter: ' + e.parameter.userInputs);
        const userInputs = e.parameter.userInputs ? JSON.parse(e.parameter.userInputs) : {};
        Logger.log('createFolder action - parsed userInputs: ' + JSON.stringify(userInputs));
        Logger.log('createFolder action - passcode value: ' + userInputs.passcode);
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
  
  const ss = data.workingCopyId 
    ? SpreadsheetApp.openById(data.workingCopyId)
    : SpreadsheetApp.getActiveSpreadsheet();
    
  const sheet = ss.getSheetByName('Blended Solution Calculator');
  
  if (!sheet) {
    throw new Error('Sheet "Blended Solution Calculator" not found');
  }
  
  // DIAGNOSTIC: Write to A1-E1 to confirm function is being called and show values
  sheet.getRange('A1').setValue('setUserInputs: ' + new Date().toLocaleTimeString());
  sheet.getRange('B1').setValue('WorkingCopyId: ' + (data.workingCopyId || 'NONE'));
  sheet.getRange('C1').setValue('avgIncome: ' + (data.avgIncome || 'none'));
  sheet.getRange('D1').setValue('knownTax: ' + (data.knownFederalTax || 'none'));
  sheet.getRange('E1').setValue('income: ' + (data.income || 'none'));
  
  // Set the values in the appropriate cells
  sheet.getRange('C4').setValue(data.income);
  sheet.getRange('B4').setValue(data.state);
  sheet.getRange('B9').setValue(data.filingStatus);
  
  // Handle capitalGains - write to C9 (optional)
  if (data.capitalGains) {
    sheet.getRange('C9').setValue(data.capitalGains);
  }
  
  // Handle G10 population: knownFederalTax takes priority over avgIncome
  if (data.knownFederalTax) {
    // If knownFederalTax is provided, use it directly (skip avgIncome processing)
    sheet.getRange('F1').setValue('Using knownFederalTax path');
    
    sheet.getRange('G10').clearContent();
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    const taxValue = Number(data.knownFederalTax);
    sheet.getRange('G10').setValue(taxValue);
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    // Verify what actually got written
    sheet.getRange('G1').setValue('G10 after write: ' + sheet.getRange('G10').getValue());
  } else if (data.avgIncome) {
    // Only process avgIncome if knownFederalTax is NOT provided
    sheet.getRange('F1').setValue('Using avgIncome path');
    
    sheet.getRange('G4').setValue(data.avgIncome);
    sheet.getRange('H1').setValue('G4 after write: ' + sheet.getRange('G4').getValue());
    
    SpreadsheetApp.flush();
    Utilities.sleep(1000);  // Wait for sheet to recalculate
    
    const g6Value = sheet.getRange('G6').getValue();
    sheet.getRange('I1').setValue('G6 value: ' + g6Value);
    
    sheet.getRange('G10').setValue(g6Value);
    sheet.getRange('J1').setValue('G10 after write: ' + sheet.getRange('G10').getValue());
  }
  
  sheet.getRange('Q5').setValue(data.name);  // Set client name
  
  // Force calculation and wait for it to settle
  SpreadsheetApp.flush();
  Utilities.sleep(200); // Wait 0.2 seconds for calculations (reduced for performance)
  
  // Only set G10 formula if we didn't already handle it above
  // (Don't overwrite if knownFederalTax or avgIncome already set it)
  if (!data.knownFederalTax && !data.avgIncome) {
    // Make G10 equal to G6 as default
    sheet.getRange('G10').setFormula('=G6');
    sheet.getRange('K1').setValue('Set G10 formula to =G6 (default)');
  } else {
    sheet.getRange('K1').setValue('Skipped G10 formula (already set by knownTax or avgIncome)');
  }
  
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
 * All copies go into a folder structure organized by passcode
 * Structure: Top-Level → Passcode Folder → Client Analysis Folder → Workbook Copies
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
    
    // Set the working copy as active so nameFile reads from it
    const originalActiveSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    SpreadsheetApp.setActiveSpreadsheet(ss);
    
    // First, get the filename string for the response (hover display)
    let displayFileName;
    try {
      displayFileName = nameFile(true);  // returnOnly = true to get the name string
      Logger.log('Generated display filename from nameFile(true): ' + displayFileName);
      
      if (!displayFileName || displayFileName === null || displayFileName === '') {
        // Fallback if nameFile fails
        displayFileName = userInputs.name + ' - Scenario ' + scenarioNumber;
        Logger.log('Using fallback display filename: ' + displayFileName);
      }
    } catch (error) {
      Logger.log('Error calling nameFile(true): ' + error.toString());
      // Fallback filename
      displayFileName = userInputs.name + ' - Scenario ' + scenarioNumber;
      Logger.log('Using fallback display filename due to error: ' + displayFileName);
    }
    
    // Restore original active spreadsheet
    SpreadsheetApp.setActiveSpreadsheet(originalActiveSpreadsheet);
    
    const originalFile = DriveApp.getFileById(ss.getId());
    // Use specific folder ID instead of parent folder
    const topLevelFolder = DriveApp.getFolderById('1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW');
    
    Logger.log('Top-level folder name: ' + topLevelFolder.getName());
    
    // STEP 1: Find or create passcode folder
    let passcodeFolderName = userInputs.passcode ? userInputs.passcode.toUpperCase() : 'UNKNOWN';
    Logger.log('Looking for passcode folder starting with: ' + passcodeFolderName);
    
    let passcodeFolder = findOrCreatePasscodeFolder(topLevelFolder, passcodeFolderName);
    Logger.log('Using passcode folder: ' + passcodeFolder.getName() + ' (ID: ' + passcodeFolder.getId() + ')');
    
    // STEP 2: Create client analysis folder inside passcode folder
    // Create timestamp for date for folder
    const dateOnly = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    // Format income for folder name (e.g., $75000 -> $75k)
    const formatIncome = (income) => {
      if (income >= 1000) {
        return '$' + Math.round(income / 1000) + 'k';
      }
      return '$' + income;
    };
    
    // Create client folder name WITHOUT passcode prefix (since it's inside passcode folder)
    const clientFolderName = `${userInputs.name} - ${formatIncome(userInputs.income)} - ${userInputs.state} - ${userInputs.filingStatus} - ${dateOnly}`;
    
    Logger.log('Looking for/creating client folder: ' + clientFolderName);
    
    // Check if client folder already exists in passcode folder
    let clientFolder;
    const existingClientFolders = passcodeFolder.getFoldersByName(clientFolderName);
    
    if (existingClientFolders.hasNext()) {
      clientFolder = existingClientFolders.next();
      Logger.log('Found existing client folder');
    } else {
      // Create new client folder inside passcode folder
      clientFolder = passcodeFolder.createFolder(clientFolderName);
      Logger.log('Created new client folder: ' + clientFolder.getId());
    }
    
    Logger.log('Creating workbook copy...');
    
    // Make a copy of the entire workbook (keeping all formulas intact)
    // Initially create with a temporary name
    const tempName = 'temp_' + new Date().getTime();
    const copiedFile = originalFile.makeCopy(tempName, clientFolder);
    
    Logger.log('Workbook copied, now naming it with nameFile(false)...');
    
    // Now set the copied file as active and call nameFile(false) to name it
    const copiedSpreadsheet = SpreadsheetApp.openById(copiedFile.getId());
    SpreadsheetApp.setActiveSpreadsheet(copiedSpreadsheet);
    
    try {
      nameFile(false);  // returnOnly = false to actually rename the file
      Logger.log('File renamed using nameFile(false)');
    } catch (error) {
      Logger.log('Error calling nameFile(false): ' + error.toString());
      // If nameFile(false) fails, at least use the display name
      copiedFile.setName(displayFileName);
      Logger.log('Used display filename as fallback for file name');
    } finally {
      // Restore original active spreadsheet
      SpreadsheetApp.setActiveSpreadsheet(originalActiveSpreadsheet);
    }
    
    Logger.log('Workbook copied successfully with formulas preserved');
    
    Logger.log('Success! File URL: ' + copiedFile.getUrl());
    Logger.log('Client Folder URL: ' + clientFolder.getUrl());
    Logger.log('Passcode Folder URL: ' + passcodeFolder.getUrl());
    
    // Write the folder URL to a visible cell in the original spreadsheet
    const controlSheet = ss.getSheetByName('Blended Solution Calculator');
    if (controlSheet) {
      try {
        controlSheet.getRange('A1').setValue('Last Analysis Folder: ' + clientFolder.getUrl());
        Logger.log('Successfully wrote folder URL to A1: ' + clientFolder.getUrl());
      } catch (writeError) {
        Logger.log('ERROR writing to A1: ' + writeError.toString());
      }
    }
    
    return {
      success: true,
      fileName: displayFileName,
      folderName: clientFolderName,
      passcodeFolderName: passcodeFolder.getName(),
      passcodeFolderId: passcodeFolder.getId(),
      passcodeFolderUrl: passcodeFolder.getUrl(),
      folderId: clientFolder.getId(),
      folderUrl: clientFolder.getUrl(),
      fileUrl: copiedFile.getUrl()
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
 * Structure: Top-Level → Passcode Folder → Client Analysis Folder
 * @param {object} userInputs - User input data for folder naming
 * @returns {object} - Folder info (id, url, name)
 */
function createAnalysisFolder(userInputs) {
  try {
    Logger.log('=== createAnalysisFolder START ===');
    Logger.log('User inputs: ' + JSON.stringify(userInputs));
    Logger.log('Passcode from userInputs: ' + userInputs.passcode);
    
    // Use specific parent folder ID
    const topLevelFolder = DriveApp.getFolderById('1oAKrZEv2Hrji5lfERWcsrmGmsajueMqW');
    Logger.log('Top-level folder: ' + topLevelFolder.getName());
    
    // STEP 1: Find or create passcode folder
    let passcodeFolderName = userInputs.passcode ? userInputs.passcode.toUpperCase() : 'UNKNOWN';
    Logger.log('Passcode folder name to search: ' + passcodeFolderName);
    
    let passcodeFolder = findOrCreatePasscodeFolder(topLevelFolder, passcodeFolderName);
    Logger.log('Using passcode folder: ' + passcodeFolder.getName() + ' (ID: ' + passcodeFolder.getId() + ')');
    
    // STEP 2: Create client analysis folder inside passcode folder
    // Create timestamp
    const dateOnly = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    // Format income for folder name
    const formatIncome = (income) => {
      if (income >= 1000) {
        return '$' + Math.round(income / 1000) + 'k';
      }
      return '$' + income;
    };
    
    // Create client folder name WITHOUT passcode prefix (since it's inside passcode folder)
    const clientFolderName = `${userInputs.name} - ${formatIncome(userInputs.income)} - ${userInputs.state} - ${userInputs.filingStatus} - ${dateOnly}`;
    
    Logger.log('Looking for/creating client folder: ' + clientFolderName);
    
    // Check if client folder already exists
    let clientFolder;
    const existingClientFolders = passcodeFolder.getFoldersByName(clientFolderName);
    
    if (existingClientFolders.hasNext()) {
      clientFolder = existingClientFolders.next();
      Logger.log('Found existing client folder');
    } else {
      clientFolder = passcodeFolder.createFolder(clientFolderName);
      Logger.log('Created new client folder: ' + clientFolder.getId());
    }
    
    return {
      success: true,
      folderId: clientFolder.getId(),
      folderUrl: clientFolder.getUrl(),
      folderName: clientFolderName,
      passcodeFolderId: passcodeFolder.getId(),
      passcodeFolderUrl: passcodeFolder.getUrl(),
      passcodeFolderName: passcodeFolder.getName()
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

/**
 * Helper function to find or create a passcode folder
 * Searches for folders starting with the passcode (case-insensitive)
 * Creates a new folder with just the passcode name if not found
 * @param {Folder} parentFolder - The parent folder to search in
 * @param {string} passcode - The passcode to search for (e.g., "MARK")
 * @returns {Folder} - The found or created passcode folder
 */
function findOrCreatePasscodeFolder(parentFolder, passcode) {
  const passcodeUpper = passcode.toUpperCase();
  Logger.log('=== findOrCreatePasscodeFolder START ===');
  Logger.log('Searching for folder starting with: "' + passcodeUpper + '"');
  Logger.log('Parent folder: ' + parentFolder.getName() + ' (ID: ' + parentFolder.getId() + ')');
  
  // Get all folders in parent and convert to array
  const allFoldersIterator = parentFolder.getFolders();
  const folders = [];
  
  // Collect all folders first
  while (allFoldersIterator.hasNext()) {
    folders.push(allFoldersIterator.next());
  }
  
  Logger.log('Total folders to check: ' + folders.length);
  
  // Search for folder starting with passcode (case-insensitive)
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const folderName = folder.getName();
    const folderNameUpper = folderName.toUpperCase();
    
    Logger.log('Checking folder #' + (i + 1) + ': "' + folderName + '"');
    Logger.log('  - Uppercase: "' + folderNameUpper + '"');
    Logger.log('  - Starts with "' + passcodeUpper + '"? ' + (folderNameUpper.indexOf(passcodeUpper) === 0));
    
    // Check if folder name starts with the passcode
    if (folderNameUpper.indexOf(passcodeUpper) === 0) {
      Logger.log('✅ MATCH FOUND! Using existing passcode folder: "' + folderName + '"');
      Logger.log('  - Folder ID: ' + folder.getId());
      return folder;
    }
  }
  
  Logger.log('❌ No matching folder found after checking ' + folders.length + ' folders');
  Logger.log('Creating new passcode folder: "' + passcodeUpper + '"');
  
  // No folder found, create new one with just the passcode
  const newFolder = parentFolder.createFolder(passcodeUpper);
  Logger.log('✅ Created new passcode folder: "' + newFolder.getName() + '"');
  Logger.log('  - Folder ID: ' + newFolder.getId());
  Logger.log('  - Folder URL: ' + newFolder.getUrl());
  
  return newFolder;
}

/**
 * TEST FUNCTION - Call this to test if passcode is being passed
 * You can run this from the Apps Script editor
 */
function testPasscodeFolder() {
  const testUserInputs = {
    name: 'Test Client',
    income: 75000,
    state: 'NC',
    filingStatus: 'Single',
    passcode: 'MARK'
  };
  
  Logger.log('=== TESTING PASSCODE FOLDER CREATION ===');
  const result = createAnalysisFolder(testUserInputs);
  Logger.log('Result: ' + JSON.stringify(result));
  Logger.log('Passcode folder URL: ' + result.passcodeFolderUrl);
  Logger.log('Client folder URL: ' + result.folderUrl);
}

