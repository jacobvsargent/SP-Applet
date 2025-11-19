/**
 * Service for communicating with Google Sheets via Apps Script Web App
 */

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

// ⚠️ CONFIGURATION: Adjust this if you're seeing $0 values in results
// This controls how long to wait between operations for sheet calculations to settle
// Increase if calculations are showing $0 or incorrect values
// Decrease if analysis is taking too long and values are correct
const WAIT_TIME = 100; // 0.1 seconds wait time between operations

/**
 * Helper function to wait/delay execution
 * @param {number} ms - Milliseconds to wait
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Actions that don't need to read responses - use no-cors mode directly
 * This avoids CORS preflight errors in the console
 */
const WRITE_ONLY_ACTIONS = [
  'setInputs',
  'writeFormula',
  'setValue',
  'forceRecalc',
  'cleanup',
  'cleanupLimited',
  'runScenario',
  'deleteWorkingCopy'
];

/**
 * Make a POST request to Google Apps Script
 * @param {string} action - The action to perform
 * @param {object} data - The data to send
 * @returns {Promise<object>} - Response data
 */
async function makeRequest(action, data = {}) {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured. Please set VITE_GOOGLE_APPS_SCRIPT_URL in your .env file.');
  }

  const url = `${SCRIPT_URL}?action=${action}`;
  
  // For write-only operations, use no-cors directly to avoid console errors
  if (WRITE_ONLY_ACTIONS.includes(action)) {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    return { success: true };
  }
  
  // For operations that need responses, use GET request (Apps Script supports GET with params)
  const urlParams = new URLSearchParams({ action, ...data });
  const getUrl = `${SCRIPT_URL}?${urlParams.toString()}`;
  
  const response = await fetch(getUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Make a GET request to Google Apps Script (for reading data)
 * @param {string} action - The action to perform
 * @param {object} params - Additional URL parameters
 * @returns {Promise<object>} - Response data
 */
async function makeGetRequest(action, params = {}) {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured. Please set VITE_GOOGLE_APPS_SCRIPT_URL in your .env file.');
  }

  // Build URL with parameters
  const urlParams = new URLSearchParams({ action, ...params });
  const url = `${SCRIPT_URL}?${urlParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * NEW WORKFLOW FUNCTIONS - Work with copies instead of master workbook
 */

/**
 * Create analysis folder for organizing workbook copies
 * @param {object} userInputs - User input data for folder naming
 * @returns {Promise<object>} - Folder info {folderId, folderUrl, folderName}
 */
export async function createAnalysisFolder(userInputs) {
  const result = await makeRequest('createFolder', { userInputs: JSON.stringify(userInputs) });
  await wait(WAIT_TIME);
  return result;
}

/**
 * Create a working copy of the master workbook
 * @param {string} folderId - ID of the folder to place the working copy
 * @returns {Promise<object>} - Working copy info {workingCopyId, workingCopyUrl}
 */
export async function createWorkingCopy(folderId) {
  const result = await makeRequest('createWorkingCopy', { folderId });
  await wait(WAIT_TIME);
  return result;
}

/**
 * Delete the working copy after analysis is complete
 * @param {string} workingCopyId - ID of the working copy to delete
 * @returns {Promise<object>} - Success status
 */
export async function deleteWorkingCopy(workingCopyId) {
  const result = await makeRequest('deleteWorkingCopy', { workingCopyId });
  await wait(WAIT_TIME);
  return result;
}

/**
 * Set user inputs in the Google Sheet
 * @param {object} inputs - User input data
 * @param {string} workingCopyId - Optional working copy ID
 */
export async function setUserInputs(inputs, workingCopyId = null) {
  const data = workingCopyId ? { ...inputs, workingCopyId } : inputs;
  await makeRequest('setInputs', data);
  await wait(WAIT_TIME);
}

/**
 * Write a formula to a specific cell
 * @param {string} cell - Cell reference (e.g., "F47")
 * @param {string} formula - Formula to write (e.g., "=F51")
 * @param {string} workingCopyId - Optional working copy ID
 */
export async function writeFormula(cell, formula, workingCopyId = null) {
  const data = workingCopyId ? { cell, formula, workingCopyId } : { cell, formula };
  await makeRequest('writeFormula', data);
  await wait(WAIT_TIME);
}

/**
 * Set a value in a specific cell
 * @param {string} cell - Cell reference (e.g., "F47")
 * @param {any} value - Value to set
 * @param {string} workingCopyId - Optional working copy ID
 */
export async function setValue(cell, value, workingCopyId = null) {
  const data = workingCopyId ? { cell, value, workingCopyId } : { cell, value };
  await makeRequest('setValue', data);
  await wait(WAIT_TIME);
}

/**
 * Call a Google Apps Script function
 * @param {string} functionName - Name of the function to call
 * @param {string} workingCopyId - Optional working copy ID
 */
export async function callFunction(functionName, workingCopyId = null) {
  const data = workingCopyId ? { function: functionName, workingCopyId } : { function: functionName };
  await makeRequest('runScenario', data);
  await wait(WAIT_TIME);
}

/**
 * Force recalculation of all formulas in the spreadsheet
 * @param {string} workingCopyId - Optional working copy ID
 */
export async function forceRecalculation(workingCopyId = null) {
  const data = workingCopyId ? { workingCopyId } : {};
  await makeRequest('forceRecalc', data);
  await wait(WAIT_TIME);
}

/**
 * Clean up cells by calling zeroCellsByColorLimited
 * @param {string} workingCopyId - Optional working copy ID
 */
export async function cleanupLimited(workingCopyId = null) {
  const data = workingCopyId ? { workingCopyId } : {};
  await makeRequest('cleanupLimited', data);
  await wait(WAIT_TIME);
}

/**
 * Create a full workbook copy
 * @param {number} scenarioNumber - Scenario number (1-5)
 * @param {object} userInputs - User input data for folder naming
 * @returns {Promise<object>} - Copy info
 */
export async function createWorkbookCopy(scenarioNumber, userInputs) {
  console.log('📁 Creating workbook copy for scenario:', scenarioNumber, userInputs);
  const result = await makeRequest('createWorkbookCopy', { scenarioNumber: scenarioNumber.toString(), userInputs: JSON.stringify(userInputs) });
  console.log('📁 Workbook copy result:', result);
  
  if (result.folderUrl) {
    console.log('📂 FOLDER URL:', result.folderUrl);
    console.log('📄 FILE URL:', result.fileUrl);
  }
  else {
    console.log('📁 Failed to create workbook copy - or at least no URL');
  }
  
  await wait(WAIT_TIME);
  return { success: true };
}

/**
 * Get output values from the sheet
 * IMPORTANT: This now includes forced recalculation before reading
 * @param {string} workingCopyId - Optional working copy ID
 * @returns {Promise<object>} - Object with agi, totalTaxDue, totalNetGain
 */
export async function getOutputs(workingCopyId = null) {
  // Force recalculation before reading values
  await forceRecalculation(workingCopyId);
  
  // Get the values
  const params = workingCopyId ? { workingCopyId } : {};
  const data = await makeGetRequest('getOutputs', params);
  return data;
}

/**
 * Get a specific cell value from the sheet
 * @param {string} cell - Cell reference (e.g., "F51")
 * @param {string} workingCopyId - Optional working copy ID
 * @returns {Promise<number>} - Cell value
 */
export async function getValue(cell, workingCopyId = null) {
  const params = { cell };
  if (workingCopyId) params.workingCopyId = workingCopyId;
  const data = await makeGetRequest('getValue', params);
  return data.value;
}

/**
 * Clean up the sheet by calling zeroCellsByColor
 * @param {string} workingCopyId - Optional working copy ID
 */
export async function cleanup(workingCopyId = null) {
  const data = workingCopyId ? { workingCopyId } : {};
  await makeRequest('cleanup', data);
  await wait(WAIT_TIME);
}

/**
 * LOCAL STORAGE HELPERS FOR AUTO-RESUME FUNCTIONALITY
 */

const STORAGE_KEY = 'sp_applet_analysis_state';

/**
 * Save completed scenario to localStorage
 * @param {string} analysisId - Unique ID for this analysis run
 * @param {number} scenarioNumber - Scenario number (1-5)
 * @param {string} part - 'full', 'max', or 'min'
 * @param {object} result - Scenario result data
 */
function saveCompletedScenario(analysisId, scenarioNumber, part, result) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const state = stored ? JSON.parse(stored) : {};
    
    if (!state[analysisId]) {
      state[analysisId] = { completed: {}, timestamp: Date.now() };
    }
    
    const key = `scenario${scenarioNumber}_${part}`;
    state[analysisId].completed[key] = result;
    state[analysisId].timestamp = Date.now();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log(`✅ Saved ${key} to localStorage`);
  } catch (error) {
    console.warn('Failed to save scenario to localStorage:', error);
  }
}

/**
 * Get completed scenarios from localStorage
 * @param {string} analysisId - Unique ID for this analysis run
 * @returns {object} - Object with completed scenario data
 */
function getCompletedScenarios(analysisId) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const state = JSON.parse(stored);
    if (!state[analysisId]) return {};
    
    // Check if state is recent (within 1 hour)
    const age = Date.now() - state[analysisId].timestamp;
    if (age > 3600000) { // 1 hour in milliseconds
      console.log('Stored analysis state is too old, discarding');
      clearAnalysisState(analysisId);
      return {};
    }
    
    return state[analysisId].completed || {};
  } catch (error) {
    console.warn('Failed to read scenarios from localStorage:', error);
    return {};
  }
}

/**
 * Clear analysis state from localStorage
 * @param {string} analysisId - Unique ID for this analysis run
 */
function clearAnalysisState(analysisId) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const state = JSON.parse(stored);
    delete state[analysisId];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log(`🗑️ Cleared analysis state for ${analysisId}`);
  } catch (error) {
    console.warn('Failed to clear analysis state:', error);
  }
}

/**
 * Generate unique analysis ID based on user inputs
 * @param {object} userInputs - User input data
 * @returns {string} - Unique ID
 */
function generateAnalysisId(userInputs) {
  return `${userInputs.name}_${userInputs.income}_${userInputs.state}_${userInputs.filingStatus}`.replace(/\s+/g, '_');
}

/**
 * CENTRAL SCENARIO RUNNER
 * This function handles all scenario configurations
 * 
 * @param {object} params - Scenario parameters
 * @param {object} params.userInputs - User input data
 * @param {function} params.onProgress - Progress callback
 * @param {string} params.workingCopyId - Working copy ID
 * @param {string} params.folderId - Folder ID (unused, for compatibility)
 * @param {number} params.scenarioNumber - Scenario number (1-5) for workbook naming
 * @param {boolean} params.solarBoolean - Whether solar is included
 * @param {number} params.solarCoordinationFee - Solar coordination fee (writes to E17)
 * @param {string} params.donationType - 'medtech', 'land', or 'none'
 * @param {boolean} params.getRefund - Whether to get refund (uses solveForITCRefund vs solveForITC)
 * @param {string} params.progressMessage - Message to show during progress
 * @returns {Promise<object>} - Scenario outputs
 */
async function runScenario({
  userInputs,
  onProgress,
  workingCopyId,
  folderId = null,
  scenarioNumber,
  solarBoolean,
  solarCoordinationFee,
  donationType,
  getRefund,
  progressMessage
}) {
  // Clean up previous scenario values
  await cleanupLimited(workingCopyId);
  await wait(WAIT_TIME * 2);
  
  if (progressMessage) {
    onProgress(null, progressMessage);
  }
  
  // Set E17 (solar coordination fee)
  await setValue('E17', solarCoordinationFee, workingCopyId);
  
  // Handle donation setup
  if (donationType === 'none') {
    // No donation - set C92 to 0
    await setValue('C92', 0, workingCopyId);
  } else {
    // Donation exists - set formula and configure based on type
    await writeFormula('C92', '=MAX(0, B92)', workingCopyId);
    
    if (donationType === 'medtech') {
      // 60% donation
      await setValue('C90', 0.6, workingCopyId);
      await setValue('C88', 5, workingCopyId);
      await writeFormula('G88', '=MIN(L100, F88)', workingCopyId);
    } else if (donationType === 'land') {
      // 30% donation
      await setValue('C90', 0.3, workingCopyId);
      await setValue('C88', 4.55, workingCopyId);
      await setValue('G88', 0, workingCopyId);
    }
  }
  
  // If scenario 1 (baseline), set user inputs
  if (scenarioNumber === 1) {
    await setUserInputs(userInputs, workingCopyId);
  }
  
  // Handle solar scenarios
  if (solarBoolean && donationType === 'none') {
    // Solar only (no donation) - Scenario 2
    await writeFormula('F47', '=F51', workingCopyId);
    await callFunction('solveForITC', workingCopyId);
  } else if (solarBoolean && donationType !== 'none') {
    // Solar + Donation scenarios (4 or 5)
    if (getRefund) {
      // Scenario 5: With Refund
      await writeFormula('F47', '=F51', workingCopyId);
      await callFunction('solveForITCRefund', workingCopyId);
      
      // Check if F51 is negative
      const f51Value = await getValue('F51', workingCopyId);
      
      if (f51Value < 0) {
        await setValue('F47', 0, workingCopyId);
        await callFunction('solveForITCRefund', workingCopyId);
      } else {
        await writeFormula('F47', '=F51', workingCopyId);
        await callFunction('solveForITCRefund', workingCopyId);
      }
      
      // Get value from G49 and write it to G47
      const g49Value = await getValue('G49', workingCopyId);
      await setValue('G47', g49Value, workingCopyId);
    } else {
      // Scenario 4: No Refund
      await writeFormula('F47', '=F51', workingCopyId);
      await callFunction('solveForITC', workingCopyId);
      
      // Check if F51 is negative
      const f51Value = await getValue('F51', workingCopyId);
      
      if (f51Value < 0) {
        await setValue('F47', 0, workingCopyId);
        await callFunction('solveForITC', workingCopyId);
      } else {
        await writeFormula('F47', '=F51', workingCopyId);
      }
    }
  } else if (!solarBoolean && donationType !== 'none') {
    // Donation only (no solar) - Scenario 3
    // Clear solar-related cells
    await setValue('B43', 0, workingCopyId);
    await setValue('F47', 0, workingCopyId);
  }
  
  // Get outputs
  const outputs = await getOutputs(workingCopyId);
  
  // Create workbook copy
  await createWorkbookCopy(scenarioNumber, userInputs);
  
  return outputs;
}

/**
 * Run Scenario 5 only
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenario 5 results formatted as full results
 */
export async function runScenario5Only(userInputs, onProgress) {
  const analysisId = generateAnalysisId(userInputs);
  let workingCopyId = null;
  
  try {
    onProgress(0, 'Setting up your analysis...');
    
    // Check for completed scenarios
    const completed = getCompletedScenarios(analysisId);
    console.log('📦 Checking for completed scenarios:', completed);
    
    // Step 1: Create folder
    onProgress(2, 'Creating analysis folder...');
    const folderInfo = await createAnalysisFolder(userInputs);
    const folderId = folderInfo.folderId;
    
    // Step 2: Create working copy
    onProgress(5, 'Creating working copy...');
    const workingCopyInfo = await createWorkingCopy(folderId);
    workingCopyId = workingCopyInfo.workingCopyId;
    
    // Step 3: Clean up the working copy and set user inputs
    onProgress(8, 'Preparing working copy...');
    await cleanup(workingCopyId);  // Full cleanup to clear any residual data
    await setUserInputs(userInputs, workingCopyId);  // Set correct user inputs
    await cleanupLimited(workingCopyId);  // Limited cleanup before scenarios
    
    // Step 4: Run Scenario 1 (Baseline) if not completed
    let scenario1;
    if (completed.scenario1_full) {
      console.log('✅ Using cached Scenario 1');
      scenario1 = completed.scenario1_full;
      onProgress(10, 'Using cached Scenario 1: Baseline...');
    } else {
      onProgress(10, 'Running Scenario 1: Baseline...');
      scenario1 = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 1,
        solarBoolean: false,
        solarCoordinationFee: 0,
        donationType: 'none',
        getRefund: false,
        progressMessage: 'Capturing baseline results...'
      });
      saveCompletedScenario(analysisId, 1, 'full', scenario1);
    }
    
    // Step 5: Run Scenario 5
    let scenario5 = {};
    
    // Run Scenario 5 Max (60% - Medtech) if not completed
    if (completed.scenario5_max) {
      console.log('✅ Using cached Scenario 5 Max');
      scenario5.max = completed.scenario5_max;
      onProgress(50, 'Using cached Scenario 5 Max...');
    } else {
      onProgress(50, 'Running Solar + Donation (With Refund) - Maximum (Medtech)...');
      scenario5.max = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 5,
        solarBoolean: true,
        solarCoordinationFee: 1950,
        donationType: 'medtech',
        getRefund: true,
        progressMessage: 'Capturing Solar + Donation (With Refund) maximum (Medtech)...'
      });
      saveCompletedScenario(analysisId, 5, 'max', scenario5.max);
    }
    
    // Run Scenario 5 Min (30% - Land) if not skipped and not completed
    if (userInputs.skipScenario5Min) {
      scenario5.min = scenario5.max;
    } else if (completed.scenario5_min) {
      console.log('✅ Using cached Scenario 5 Min');
      scenario5.min = completed.scenario5_min;
      onProgress(80, 'Using cached Scenario 5 Min...');
    } else {
      onProgress(80, 'Running Solar + Donation (With Refund) - Minimum (Land)...');
      scenario5.min = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 5,
        solarBoolean: true,
        solarCoordinationFee: 1950,
        donationType: 'land',
        getRefund: true,
        progressMessage: 'Capturing Solar + Donation (With Refund) minimum (Land)...'
      });
      saveCompletedScenario(analysisId, 5, 'min', scenario5.min);
    }
    
    // Clear localStorage after successful completion
    clearAnalysisState(analysisId);
    
    onProgress(100, 'Analysis complete!');
    
    // Return in same format as full analysis with scenario1 and scenario5 populated
    return {
      scenario1,
      scenario2: null,
      scenario3: null,
      scenario4: null,
      scenario5
    };
  } catch (error) {
    console.error('Error running scenario 5:', error);
    // Keep completed scenarios in localStorage for resume
    console.log('💾 Keeping completed scenarios in localStorage for resume');
    throw error;
  }
}

/**
 * Run Scenario 6 only (Donation + CTB) - Runs scenarios 1, 3, and 6
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenarios 1, 3, and 6 results formatted for display
 */
export async function runScenario6Only(userInputs, onProgress) {
  const analysisId = generateAnalysisId(userInputs) + '_scenario6';
  let workingCopyId = null;
  
  try {
    onProgress(0, 'Setting up your analysis...');
    
    // Check for completed scenarios
    const completed = getCompletedScenarios(analysisId);
    console.log('📦 Checking for completed scenarios:', completed);
    
    // Step 1: Create folder
    onProgress(2, 'Creating analysis folder...');
    const folderInfo = await createAnalysisFolder(userInputs);
    const folderId = folderInfo.folderId;
    
    // Step 2: Create working copy
    onProgress(5, 'Creating working copy...');
    const workingCopyInfo = await createWorkingCopy(folderId);
    workingCopyId = workingCopyInfo.workingCopyId;
    
    // Step 3: Clean up the working copy and set user inputs
    onProgress(8, 'Preparing working copy...');
    await cleanup(workingCopyId);  // Full cleanup to clear any residual data
    await setUserInputs(userInputs, workingCopyId);  // Set correct user inputs
    await cleanupLimited(workingCopyId);  // Limited cleanup before scenarios
    
    // Step 4: Run Scenario 1 (Baseline) if not completed
    let scenario1;
    if (completed.scenario1_full) {
      console.log('✅ Using cached Scenario 1');
      scenario1 = completed.scenario1_full;
      onProgress(10, 'Using cached Scenario 1: Baseline...');
    } else {
      onProgress(10, 'Running Scenario 1: Baseline...');
      scenario1 = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 1,
        solarBoolean: false,
        solarCoordinationFee: 0,
        donationType: 'none',
        getRefund: false,
        progressMessage: 'Capturing baseline results...'
      });
      saveCompletedScenario(analysisId, 1, 'full', scenario1);
    }
    
    // Step 5: Run Scenario 3 (Donation Only) - RANGE
    let scenario3 = {};
    
    // Scenario 3 Max (60% - Medtech)
    if (completed.scenario3_max) {
      console.log('✅ Using cached Scenario 3 Max');
      scenario3.max = completed.scenario3_max;
      onProgress(30, 'Using cached Scenario 3 Max...');
    } else {
      onProgress(30, 'Running Donation Only scenario (Maximum - Medtech)...');
      scenario3.max = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 3,
        solarBoolean: false,
        solarCoordinationFee: 0,
        donationType: 'medtech',
        getRefund: false,
        progressMessage: 'Capturing Donation Only maximum (Medtech)...'
      });
      saveCompletedScenario(analysisId, 3, 'max', scenario3.max);
    }
    
    // Scenario 3 Min (30% - Land)
    if (userInputs.skipScenario5Min) {
      scenario3.min = scenario3.max;
    } else if (completed.scenario3_min) {
      console.log('✅ Using cached Scenario 3 Min');
      scenario3.min = completed.scenario3_min;
      onProgress(50, 'Using cached Scenario 3 Min...');
    } else {
      onProgress(50, 'Running Donation Only scenario (Minimum - Land)...');
      scenario3.min = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 3,
        solarBoolean: false,
        solarCoordinationFee: 0,
        donationType: 'land',
        getRefund: false,
        progressMessage: 'Capturing Donation Only minimum (Land)...'
      });
      saveCompletedScenario(analysisId, 3, 'min', scenario3.min);
    }
    
    // Step 6: Run Scenario 6 (Donation + CTB)
    let scenario6 = {};
    
    // Run Scenario 6 Max (60% - Medtech) if not completed
    if (completed.scenario6_max) {
      console.log('✅ Using cached Scenario 6 Max');
      scenario6.max = completed.scenario6_max;
      onProgress(70, 'Using cached Scenario 6 Max...');
    } else {
      onProgress(70, 'Running Donation + CTB - Maximum (Medtech)...');
      
      // Clean up before running
      await cleanupLimited(workingCopyId);
      await wait(WAIT_TIME * 2);
      
      // Set E17 (no solar coordination fee)
      await setValue('E17', 0, workingCopyId);
      
      // Set donation configuration for 60% (Medtech)
      await writeFormula('C92', '=MAX(0, B92)', workingCopyId);
      await setValue('C90', 0.6, workingCopyId);
      await setValue('C88', 5, workingCopyId);
      await writeFormula('G88', '=MIN(L100, F88)', workingCopyId);
      
      // Clear solar-related cells
      await setValue('B43', 0, workingCopyId);
      await setValue('F47', 0, workingCopyId);
      
      // Apply CTB setting: J124 = I124 (formula)
      await writeFormula('J124', '=I124', workingCopyId);
      
      // Get outputs
      const outputs = await getOutputs(workingCopyId);
      
      // Create workbook copy
      await createWorkbookCopy(6, userInputs);
      
      scenario6.max = outputs;
      saveCompletedScenario(analysisId, 6, 'max', scenario6.max);
    }
    
    // Run Scenario 6 Min (30% - Land) if not skipped and not completed
    if (userInputs.skipScenario5Min) {
      scenario6.min = scenario6.max;
    } else if (completed.scenario6_min) {
      console.log('✅ Using cached Scenario 6 Min');
      scenario6.min = completed.scenario6_min;
      onProgress(90, 'Using cached Scenario 6 Min...');
    } else {
      onProgress(90, 'Running Donation + CTB - Minimum (Land)...');
      
      // Clean up before running
      await cleanupLimited(workingCopyId);
      await wait(WAIT_TIME * 2);
      
      // Set E17 (no solar coordination fee)
      await setValue('E17', 0, workingCopyId);
      
      // Set donation configuration for 30% (Land)
      await writeFormula('C92', '=MAX(0, B92)', workingCopyId);
      await setValue('C90', 0.3, workingCopyId);
      await setValue('C88', 4.55, workingCopyId);
      await setValue('G88', 0, workingCopyId);
      
      // Clear solar-related cells
      await setValue('B43', 0, workingCopyId);
      await setValue('F47', 0, workingCopyId);
      
      // Apply CTB setting: J124 = I124 (formula)
      await writeFormula('J124', '=I124', workingCopyId);
      
      // Get outputs
      const outputs = await getOutputs(workingCopyId);
      
      // Create workbook copy
      await createWorkbookCopy(6, userInputs);
      
      scenario6.min = outputs;
      saveCompletedScenario(analysisId, 6, 'min', scenario6.min);
    }
    
    // Clear localStorage after successful completion
    clearAnalysisState(analysisId);
    
    onProgress(100, 'Analysis complete!');
    
    // Return with scenario1, scenario3, and scenario6 populated
    return {
      scenario1,
      scenario3,
      scenario6
    };
  } catch (error) {
    console.error('Error running scenario 6:', error);
    // Keep completed scenarios in localStorage for resume
    console.log('💾 Keeping completed scenarios in localStorage for resume');
    throw error;
  }
}

/**
 * Run all scenarios
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - All scenario results
 */
export async function runAllScenarios(userInputs, onProgress) {
  const analysisId = generateAnalysisId(userInputs);
  let workingCopyId = null;
  
  try {
    onProgress(0, 'Setting up your analysis...');
    
    // Check for completed scenarios
    const completed = getCompletedScenarios(analysisId);
    if (Object.keys(completed).length > 0) {
      console.log('🔄 Resuming from previous run. Completed scenarios:', Object.keys(completed));
      onProgress(0, '🔄 Resuming from previous run...');
    }
    
    // Step 1: Create folder
    onProgress(2, 'Creating analysis folder...');
    const folderInfo = await createAnalysisFolder(userInputs);
    const folderId = folderInfo.folderId;
    console.log('🔍 DEBUG: Folder created with ID:', folderId);
    
    // Step 2: Create working copy
    onProgress(5, 'Creating working copy...');
    console.log('🔍 DEBUG: About to create working copy in folder:', folderId);
    const workingCopyInfo = await createWorkingCopy(folderId);
    console.log('🔍 DEBUG: createWorkingCopy returned:', workingCopyInfo);
    workingCopyId = workingCopyInfo.workingCopyId;
    console.log('🔍 DEBUG: Working copy created with ID:', workingCopyId);
    console.log('🔍 DEBUG: Working copy URL:', workingCopyInfo.workingCopyUrl);
    
    // Step 3: Clean up the working copy and set user inputs
    onProgress(8, 'Preparing working copy...');
    console.log('🔍 DEBUG: About to call cleanup with workingCopyId:', workingCopyId);
    await cleanup(workingCopyId);  // Full cleanup to clear any residual data
    console.log('🔍 DEBUG: About to call setUserInputs with workingCopyId:', workingCopyId);
    await setUserInputs(userInputs, workingCopyId);  // Set correct user inputs
    console.log('🔍 DEBUG: About to call cleanupLimited with workingCopyId:', workingCopyId);
    await cleanupLimited(workingCopyId);  // Limited cleanup before scenarios
    
    // SCENARIO 1: Do Nothing (Baseline)
    let scenario1;
    if (completed.scenario1_full) {
      console.log('✅ Using cached Scenario 1');
      scenario1 = completed.scenario1_full;
      onProgress(10, 'Using cached Scenario 1: Baseline...');
    } else {
      onProgress(10, 'Running Scenario 1: Baseline...');
      scenario1 = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 1,
        solarBoolean: false,
        solarCoordinationFee: 0,
        donationType: 'none',
        getRefund: false,
        progressMessage: 'Capturing baseline results...'
      });
      saveCompletedScenario(analysisId, 1, 'full', scenario1);
    }
    
    // SCENARIO 2: Solar Only
    let scenario2;
    if (completed.scenario2_full) {
      console.log('✅ Using cached Scenario 2');
      scenario2 = completed.scenario2_full;
      onProgress(20, 'Using cached Scenario 2: Solar Only...');
    } else {
      onProgress(20, 'Running Scenario 2: Solar Only...');
      scenario2 = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 2,
        solarBoolean: true,
        solarCoordinationFee: 1950,
        donationType: 'none',
        getRefund: false,
        progressMessage: 'Capturing Solar Only results...'
      });
      saveCompletedScenario(analysisId, 2, 'full', scenario2);
    }
    
    // SCENARIO 3: Donation Only (RANGE)
    let scenario3 = {};
    
    // Scenario 3 Max (60% - Medtech)
    if (completed.scenario3_max) {
      console.log('✅ Using cached Scenario 3 Max');
      scenario3.max = completed.scenario3_max;
      onProgress(35, 'Using cached Scenario 3 Max...');
    } else {
      onProgress(35, 'Running Donation Only scenario (Maximum - Medtech)...');
      scenario3.max = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 3,
        solarBoolean: false,
        solarCoordinationFee: 0,
        donationType: 'medtech',
        getRefund: false,
        progressMessage: 'Capturing Donation Only maximum (Medtech)...'
      });
      saveCompletedScenario(analysisId, 3, 'max', scenario3.max);
    }
    
    // Scenario 3 Min (30% - Land)
    if (userInputs.skipScenario5Min) {
      scenario3.min = scenario3.max;
    } else if (completed.scenario3_min) {
      console.log('✅ Using cached Scenario 3 Min');
      scenario3.min = completed.scenario3_min;
      onProgress(50, 'Using cached Scenario 3 Min...');
    } else {
      onProgress(50, 'Running Donation Only scenario (Minimum - Land)...');
      scenario3.min = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 3,
        solarBoolean: false,
        solarCoordinationFee: 0,
        donationType: 'land',
        getRefund: false,
        progressMessage: 'Capturing Donation Only minimum (Land)...'
      });
      saveCompletedScenario(analysisId, 3, 'min', scenario3.min);
    }
    
    // SCENARIO 4: Solar + Donation (No Refund) - RANGE
    let scenario4 = {};
    
    // Scenario 4 Max (60% - Medtech)
    if (completed.scenario4_max) {
      console.log('✅ Using cached Scenario 4 Max');
      scenario4.max = completed.scenario4_max;
      onProgress(55, 'Using cached Scenario 4 Max...');
    } else {
      onProgress(55, 'Running Solar + Donation (No Refund) - Maximum (Medtech)...');
      scenario4.max = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 4,
        solarBoolean: true,
        solarCoordinationFee: 1950,
        donationType: 'medtech',
        getRefund: false,
        progressMessage: 'Capturing Solar + Donation (No Refund) maximum (Medtech)...'
      });
      saveCompletedScenario(analysisId, 4, 'max', scenario4.max);
    }
    
    // Scenario 4 Min (30% - Land)
    if (userInputs.skipScenario5Min) {
      scenario4.min = scenario4.max;
    } else if (completed.scenario4_min) {
      console.log('✅ Using cached Scenario 4 Min');
      scenario4.min = completed.scenario4_min;
      onProgress(70, 'Using cached Scenario 4 Min...');
    } else {
      onProgress(70, 'Running Solar + Donation (No Refund) - Minimum (Land)...');
      scenario4.min = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 4,
        solarBoolean: true,
        solarCoordinationFee: 1950,
        donationType: 'land',
        getRefund: false,
        progressMessage: 'Capturing Solar + Donation (No Refund) minimum (Land)...'
      });
      saveCompletedScenario(analysisId, 4, 'min', scenario4.min);
    }
    
    // SCENARIO 5: Solar + Donation (With Refund) - RANGE
    let scenario5 = {};
    
    // Scenario 5 Max (60% - Medtech)
    if (completed.scenario5_max) {
      console.log('✅ Using cached Scenario 5 Max');
      scenario5.max = completed.scenario5_max;
      onProgress(75, 'Using cached Scenario 5 Max...');
    } else {
      onProgress(75, 'Running Solar + Donation (With Refund) - Maximum (Medtech)...');
      scenario5.max = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 5,
        solarBoolean: true,
        solarCoordinationFee: 1950,
        donationType: 'medtech',
        getRefund: true,
        progressMessage: 'Capturing Solar + Donation (With Refund) maximum (Medtech)...'
      });
      saveCompletedScenario(analysisId, 5, 'max', scenario5.max);
    }
    
    // Scenario 5 Min (30% - Land)
    if (userInputs.skipScenario5Min) {
      scenario5.min = scenario5.max;
    } else if (completed.scenario5_min) {
      console.log('✅ Using cached Scenario 5 Min');
      scenario5.min = completed.scenario5_min;
      onProgress(90, 'Using cached Scenario 5 Min...');
    } else {
      onProgress(90, 'Running Solar + Donation (With Refund) - Minimum (Land)...');
      scenario5.min = await runScenario({
        userInputs,
        onProgress,
        workingCopyId,
        folderId,
        scenarioNumber: 5,
        solarBoolean: true,
        solarCoordinationFee: 1950,
        donationType: 'land',
        getRefund: true,
        progressMessage: 'Capturing Solar + Donation (With Refund) minimum (Land)...'
      });
      saveCompletedScenario(analysisId, 5, 'min', scenario5.min);
    }
    
    // Clear localStorage after successful completion
    clearAnalysisState(analysisId);
    
    onProgress(100, 'Analysis complete!');
    
    return {
      scenario1,
      scenario2,
      scenario3,
      scenario4,
      scenario5
    };
  } catch (error) {
    console.error('Error running scenarios:', error);
    // Keep completed scenarios in localStorage for resume
    console.log('💾 Keeping completed scenarios in localStorage for resume');
    throw error;
  }
}

