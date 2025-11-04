/**
 * Service for communicating with Google Sheets via Apps Script Web App
 */

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

// ⚠️ CONFIGURATION: Adjust this if you're seeing $0 values in results
// This controls how long to wait between operations for sheet calculations to settle
// Increase if calculations are showing $0 or incorrect values
// Decrease if analysis is taking too long and values are correct
const WAIT_TIME = 50; // 0.05 seconds wait time between operations (reduced for performance)

/**
 * Helper function to wait/delay execution
 * @param {number} ms - Milliseconds to wait
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  
  try {
    // Try with CORS first (for actions that need to read responses)
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    // If CORS fails, fall back to no-cors for actions that don't need response data
    console.warn('CORS request failed, using no-cors fallback:', error.message);
    
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    // For no-cors, we can't read the response
    return { success: true };
  }
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
  const result = await makeRequest('createFolder', { userInputs });
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
 * Save a scenario snapshot from the working copy
 * @param {string} workingCopyId - ID of the working copy
 * @param {number} scenarioNumber - Scenario number (1-5)
 * @param {string} folderId - ID of the folder
 * @returns {Promise<object>} - Snapshot info
 */
export async function saveScenarioSnapshot(workingCopyId, scenarioNumber, folderId) {
  const result = await makeRequest('saveScenarioSnapshot', { workingCopyId, scenarioNumber, folderId });
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
 */
export async function forceRecalculation() {
  await makeRequest('forceRecalc');
  await wait(WAIT_TIME);
}

/**
 * Clean up cells by calling zeroCellsByColorLimited
 */
export async function cleanupLimited() {
  await makeRequest('cleanupLimited');
  await wait(WAIT_TIME);
}

/**
 * Create a snapshot of the Blended Solution Calculator sheet
 * @param {string} scenarioName - Name of the scenario
 * @returns {Promise<object>} - Snapshot info
 */
// export async function createSnapshot(scenarioName) {
//   await makeRequest('createSnapshot', { scenarioName });
//   await wait(WAIT_TIME);
//   return { success: true };
// }

/**
 * Create a full workbook copy
 * @param {string} scenarioName - Name of the scenario
 * @param {object} userInputs - User input data for folder naming
 * @returns {Promise<object>} - Copy info
 */
export async function createWorkbookCopy(scenarioName, userInputs) {
  console.log('📁 Creating workbook copy:', scenarioName, userInputs);
  const result = await makeRequest('createWorkbookCopy', { scenarioName, userInputs });
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
  await forceRecalculation();
  
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
 */
export async function cleanup() {
  await makeRequest('cleanup');
  await wait(WAIT_TIME);
}

/**
 * Run Scenario 1: Do Nothing (Baseline)
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @param {string} workingCopyId - Optional working copy ID
 * @param {string} folderId - Optional folder ID for saving snapshots
 * @returns {Promise<object>} - Scenario results
 */
export async function runScenario1(userInputs, onProgress, workingCopyId = null, folderId = null) {
  onProgress(10, 'Setting up baseline scenario...');
  
  // Set E17 to 0 (no solar for this scenario)
  await setValue('E17', 0, workingCopyId);
  
  // Set user inputs
  await setUserInputs(userInputs, workingCopyId);
  
  onProgress(15, 'Capturing baseline results...');
  
  // Get outputs
  const outputs = await getOutputs(workingCopyId);
  
  // Create a full workbook copy for this scenario
  if (workingCopyId && folderId) {
    // New workflow: Create full workbook copy from working copy (all sheets preserved)
    await saveScenarioSnapshot(workingCopyId, 1, folderId);
  } else {
    // Legacy workflow: Create workbook copy from master
    await createWorkbookCopy('1 - Do Nothing', userInputs);
  }
  
  return outputs;
}

/**
 * Run Scenario 2: Solar Only
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @param {string} workingCopyId - Optional working copy ID
 * @param {string} folderId - Optional folder ID for saving snapshots
 * @returns {Promise<object>} - Scenario results
 */
export async function runScenario2(userInputs, onProgress, workingCopyId = null, folderId = null) {
  onProgress(20, 'Running Solar Only scenario...');
  
  // Set E17 to 1950 (solar system size)
  await setValue('E17', 1950, workingCopyId);
  
  // Write formula in F47
  await writeFormula('F47', '=F51', workingCopyId);
  
  // Call solveForITC
  await callFunction('solveForITC', workingCopyId);
  
  onProgress(30, 'Capturing Solar Only results...');
  
  // Get outputs
  const outputs = await getOutputs(workingCopyId);
  
  // Create a full workbook copy for this scenario
  if (workingCopyId && folderId) {
    // New workflow: Create full workbook copy from working copy (all sheets preserved)
    await saveScenarioSnapshot(workingCopyId, 2, folderId);
  } else {
    // Legacy workflow: Create workbook copy from master
    await createWorkbookCopy('2 - Solar Only', userInputs);
  }
  
  return outputs;
}

/**
 * Run Scenario 3: Donation Only (RANGE)
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenario results with min and max
 */
export async function runScenario3(userInputs, onProgress, workingCopyId = null, folderId = null) {
  onProgress(35, 'Running Donation Only scenario (Maximum)...');
  
  // Set E17 to 0 (no solar for this scenario)
  await setValue('E17', 0, workingCopyId);
  
  // Set B43 to 0 (transition from Solar Only to Donation Only)
  await setValue('B43', 0, workingCopyId);
  
  // Set F47 to 0
  await setValue('F47', 0, workingCopyId);
  
  // Write formula in C92
  await writeFormula('C92', '=MAX(0, B92)', workingCopyId);
  
  // Ensure C90 = 60%
  await setValue('C90', 0.6, workingCopyId);
  
  onProgress(42, 'Capturing Donation Only maximum...');
  
  // Get outputs for MAX
  const maxOutputs = await getOutputs(workingCopyId);
  
  // Create a full workbook copy for this scenario
  if (workingCopyId && folderId) {
    // New workflow: Create full workbook copy from working copy (all sheets preserved)
    await saveScenarioSnapshot(workingCopyId, 3, folderId);
  } else {
    // Legacy workflow: Create workbook copy from master
    await createWorkbookCopy('3 - Donation Only', userInputs);
  }
  
  // Check if we should skip the minimum calculation
  if (userInputs.skipScenario5Min) {
    // Return only max values (use same values for min to avoid display issues)
    return {
      max: maxOutputs,
      min: maxOutputs
    };
  }
  
  onProgress(50, 'Running Donation Only scenario (Minimum)...');
  
  // Set C90 = 30%
  await setValue('C90', 0.3, workingCopyId);
  
  onProgress(53, 'Capturing Donation Only minimum...');
  
  // Get outputs for MIN
  const minOutputs = await getOutputs(workingCopyId);
  
  // Reset C90 to 60% for next scenario
  await setValue('C90', 0.6, workingCopyId);
  
  return {
    max: maxOutputs,
    min: minOutputs
  };
}

/**
 * Run Scenario 4: Solar + Donation (No Refund) - RANGE
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @param {string} workingCopyId - Optional working copy ID
 * @param {string} folderId - Optional folder ID for saving snapshots
 * @returns {Promise<object>} - Scenario results with min and max
 */
export async function runScenario4(userInputs, onProgress, workingCopyId = null, folderId = null) {
  onProgress(55, 'Running Solar + Donation (No Refund) - Maximum...');
  
  // Set E17 to 1950 (solar system size)
  await setValue('E17', 1950, workingCopyId);
  
  // Step 1: Do donation part first
  await writeFormula('C92', '=MAX(0, B92)', workingCopyId);
  await setValue('C90', 0.6, workingCopyId);
  
  // Step 2: Call solveForITC
  await writeFormula('F47', '=F51', workingCopyId);
  await callFunction('solveForITC', workingCopyId);
  
  // Step 3: Check if F51 is negative
  const f51Value = await getValue('F51', workingCopyId);
  
  if (f51Value < 0) {
    // If negative, set F47 to 0
    await setValue('F47', 0, workingCopyId);
    // Run solve function again
    await callFunction('solveForITC', workingCopyId);
  } else {
    // Otherwise, F47 should equal F51
    await writeFormula('F47', '=F51', workingCopyId);
  }
  
  onProgress(62, 'Capturing Solar + Donation (No Refund) maximum...');
  
  // Get outputs for MAX
  const maxOutputs = await getOutputs(workingCopyId);
  
  // Create a full workbook copy for this scenario
  if (workingCopyId && folderId) {
    // New workflow: Create full workbook copy from working copy (all sheets preserved)
    await saveScenarioSnapshot(workingCopyId, 4, folderId);
  } else {
    // Legacy workflow: Create workbook copy from master
    await createWorkbookCopy('4 - Solar + Donation (No Refund)', userInputs);
  }
  
  // Check if we should skip the minimum calculation
  if (userInputs.skipScenario5Min) {
    // Return only max values (use same values for min to avoid display issues)
    return {
      max: maxOutputs,
      min: maxOutputs
    };
  }
  
  onProgress(70, 'Running Solar + Donation (No Refund) - Minimum...');
  
  // Set C90 = 30%
  await setValue('C90', 0.3, workingCopyId);
  
  // Check F51 again for minimum
  const f51ValueMin = await getValue('F51', workingCopyId);
  
  if (f51ValueMin < 0) {
    await setValue('F47', 0, workingCopyId);
    await callFunction('solveForITC', workingCopyId);
  } else {
    await writeFormula('F47', '=F51', workingCopyId);
    await callFunction('solveForITC', workingCopyId);
  }
  
  onProgress(73, 'Capturing Solar + Donation (No Refund) minimum...');
  
  // Get outputs for MIN
  const minOutputs = await getOutputs(workingCopyId);
  
  // Reset C90 to 60% for next scenario
  await setValue('C90', 0.6, workingCopyId);
  
  return {
    max: maxOutputs,
    min: minOutputs
  };
}

/**
 * Run Scenario 5: Solar + Donation (With Refund) - RANGE
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenario results with min and max
 */
export async function runScenario5(userInputs, onProgress, workingCopyId = null, folderId = null) {
  onProgress(75, 'Running Solar + Donation (With Refund) - Maximum...');
  
  // Set E17 to 1950 (solar system size)
  await setValue('E17', 1950, workingCopyId);
  
  // Step 1: Do donation part first
  await writeFormula('C92', '=MAX(0, B92)', workingCopyId);
  await setValue('C90', 0.6, workingCopyId);
  
  // Step 2: Call solveForITCRefund
  await writeFormula('F47', '=F51', workingCopyId);
  await callFunction('solveForITCRefund', workingCopyId);
  
  // Step 3: Check if F51 is negative
  const f51Value = await getValue('F51', workingCopyId);
  
  if (f51Value < 0) {
    // If negative, set F47 to 0
    await setValue('F47', 0, workingCopyId);
    // Run solve function again
    await callFunction('solveForITCRefund', workingCopyId);
  } else {
    // Otherwise, F47 should equal F51 (note: for refund scenario, using F47 not G47)
    await writeFormula('F47', '=F51', workingCopyId);
    await callFunction('solveForITCRefund', workingCopyId);
  }
  
  // Get value from G49 and write it to G47
  const g49Value = await getValue('G49', workingCopyId);
  await setValue('G47', g49Value, workingCopyId);
  
  onProgress(82, 'Capturing Solar + Donation (With Refund) maximum...');
  
  
  // Get outputs for MAX
  const maxOutputs = await getOutputs(workingCopyId);
  
  // Create a full workbook copy for this scenario
  if (workingCopyId && folderId) {
    // New workflow: Create full workbook copy from working copy (all sheets preserved)
    await saveScenarioSnapshot(workingCopyId, 5, folderId);
  } else {
    // Legacy workflow: Create workbook copy from master
    await createWorkbookCopy('5 - Solar + Donation (With Refund)', userInputs);
  }
  
  // Check if we should skip the minimum calculation
  if (userInputs.skipScenario5Min) {
    // Return only max values (use same values for min to avoid display issues)
    return {
      max: maxOutputs,
      min: maxOutputs
    };
  }
  
  onProgress(90, 'Running Solar + Donation (With Refund) - Minimum...');
  
  // Zero out G47
  await writeFormula('G47', '0', workingCopyId);
  // Set C90 = 30%
  await setValue('C90', 0.3, workingCopyId);
  
  // Check F51 again for minimum
  const f51ValueMin = await getValue('F51', workingCopyId);
  
  if (f51ValueMin < 0) {
    await setValue('F47', 0, workingCopyId);
    await callFunction('solveForITCRefund', workingCopyId);
  } else {
    await writeFormula('F47', '=F51', workingCopyId);
  }
 
  // Get value from G49 and write it to G47
  const g49ValueMin = await getValue('G49', workingCopyId);
  await setValue('G47', g49ValueMin, workingCopyId);
  
  onProgress(93, 'Capturing Solar + Donation (With Refund) minimum...');
  
  // Get outputs for MIN
  const minOutputs = await getOutputs(workingCopyId);
  
  // Reset C90 to 60% for any future scenarios
  await setValue('C90', 0.6, workingCopyId);
  
  return {
    max: maxOutputs,
    min: minOutputs
  };
}

/**
 * Run Scenario 5 only
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenario 5 results formatted as full results
 */
export async function runScenario5Only(userInputs, onProgress) {
  let workingCopyId = null;
  
  try {
    onProgress(0, 'Setting up your analysis...');
    
    // Step 1: Create folder
    onProgress(2, 'Creating analysis folder...');
    const folderInfo = await createAnalysisFolder(userInputs);
    const folderId = folderInfo.folderId;
    
    // Step 2: Create working copy
    onProgress(5, 'Creating working copy...');
    const workingCopyInfo = await createWorkingCopy(folderId);
    workingCopyId = workingCopyInfo.workingCopyId;
    
    // Step 3: Clean up once at the start (working copy is fresh)
    onProgress(8, 'Preparing working copy...');
    await cleanupLimited();
    
    // Step 4: Always run Scenario 1 (Do Nothing) first for baseline
    onProgress(10, 'Running Scenario 1: Baseline...');
    const scenario1 = await runScenario1(userInputs, onProgress, workingCopyId, folderId);
    
    // Step 4: Run Scenario 5
    onProgress(50, 'Running Solar + Donation (With Refund)...');
    const scenario5 = await runScenario5(userInputs, onProgress, workingCopyId, folderId);
    
    // Step 5: Delete working copy
    onProgress(96, 'Cleaning up...');
    await deleteWorkingCopy(workingCopyId);
    
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
    // Try to clean up working copy if it was created
    if (workingCopyId) {
      try {
        await deleteWorkingCopy(workingCopyId);
      } catch (cleanupError) {
        console.error('Error cleaning up working copy:', cleanupError);
      }
    }
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
  let workingCopyId = null;
  
  try {
    onProgress(0, 'Setting up your analysis...');
    
    // Step 1: Create folder
    onProgress(2, 'Creating analysis folder...');
    const folderInfo = await createAnalysisFolder(userInputs);
    const folderId = folderInfo.folderId;
    
    // Step 2: Create working copy
    onProgress(5, 'Creating working copy...');
    const workingCopyInfo = await createWorkingCopy(folderId);
    workingCopyId = workingCopyInfo.workingCopyId;
    
    // Step 3: Clean up once at the start (working copy is fresh)
    onProgress(8, 'Preparing working copy...');
    await cleanupLimited();
    
    // Step 4: Run all scenarios on the working copy
    // Scenario 1: Do Nothing
    onProgress(10, 'Running Scenario 1: Baseline...');
    const scenario1 = await runScenario1(userInputs, onProgress, workingCopyId, folderId);
    
    // Scenario 2: Solar Only
    onProgress(20, 'Running Scenario 2: Solar Only...');
    const scenario2 = await runScenario2(userInputs, onProgress, workingCopyId, folderId);
    
    // Scenario 3: Donation Only
    onProgress(35, 'Running Scenario 3: Donation Only...');
    const scenario3 = await runScenario3(userInputs, onProgress, workingCopyId, folderId);
    
    // Scenario 4: Solar + Donation (No Refund)
    onProgress(55, 'Running Scenario 4: Solar + Donation (No Refund)...');
    const scenario4 = await runScenario4(userInputs, onProgress, workingCopyId, folderId);
    
    // Scenario 5: Solar + Donation (With Refund)
    onProgress(75, 'Running Scenario 5: Solar + Donation (With Refund)...');
    const scenario5 = await runScenario5(userInputs, onProgress, workingCopyId, folderId);
    
    // Step 4: Delete working copy
    onProgress(96, 'Cleaning up...');
    await deleteWorkingCopy(workingCopyId);
    
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
    // Try to clean up working copy if it was created
    if (workingCopyId) {
      try {
        await deleteWorkingCopy(workingCopyId);
      } catch (cleanupError) {
        console.error('Error cleaning up working copy:', cleanupError);
      }
    }
    throw error;
  }
}

