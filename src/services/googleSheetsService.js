/**
 * Service for communicating with Google Sheets via Apps Script Web App
 */

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

// ⚠️ CONFIGURATION: Adjust this if you're seeing $0 values in results
// This controls how long to wait between operations for sheet calculations to settle
// Increase if calculations are showing $0 or incorrect values
// Decrease if analysis is taking too long and values are correct
const WAIT_TIME = 200; // 0.2 seconds wait time between operations

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
 * @returns {Promise<object>} - Response data
 */
async function makeGetRequest(action) {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured. Please set VITE_GOOGLE_APPS_SCRIPT_URL in your .env file.');
  }

  const url = `${SCRIPT_URL}?action=${action}`;
  
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Set user inputs in the Google Sheet
 * @param {object} inputs - User input data
 */
export async function setUserInputs(inputs) {
  await makeRequest('setInputs', inputs);
  await wait(WAIT_TIME);
}

/**
 * Write a formula to a specific cell
 * @param {string} cell - Cell reference (e.g., "F47")
 * @param {string} formula - Formula to write (e.g., "=F51")
 */
export async function writeFormula(cell, formula) {
  await makeRequest('writeFormula', { cell, formula });
  await wait(WAIT_TIME);
}

/**
 * Set a value in a specific cell
 * @param {string} cell - Cell reference (e.g., "F47")
 * @param {any} value - Value to set
 */
export async function setValue(cell, value) {
  await makeRequest('setValue', { cell, value });
  await wait(WAIT_TIME);
}

/**
 * Call a Google Apps Script function
 * @param {string} functionName - Name of the function to call
 */
export async function callFunction(functionName) {
  await makeRequest('runScenario', { function: functionName });
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
 * @returns {Promise<object>} - Object with agi, totalTaxDue, totalNetGain
 */
export async function getOutputs() {
  // Force recalculation before reading values
  await forceRecalculation();
  
  // Get the values
  const data = await makeGetRequest('getOutputs');
  return data;
}

/**
 * Get a specific cell value from the sheet
 * @param {string} cell - Cell reference (e.g., "F51")
 * @returns {Promise<number>} - Cell value
 */
export async function getValue(cell) {
  const data = await makeGetRequest(`getValue&cell=${cell}`);
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
 * @returns {Promise<object>} - Scenario results
 */
export async function runScenario1(userInputs, onProgress) {
  onProgress(10, 'Setting up baseline scenario...');
  
  // Clean up before starting
  await cleanupLimited();
  
  // Set E17 to 0 (no solar for this scenario)
  await setValue('E17', 0);
  
  // Set user inputs
  await setUserInputs(userInputs);
  
  onProgress(15, 'Capturing baseline results...');
  
  // Get outputs
  const outputs = await getOutputs();
  
  // COMMENTED OUT - Create workbook copy (may be used for some users later)
  // onProgress(18, 'Saving Do Nothing workbook...');
  // await createWorkbookCopy('1 - Do Nothing', userInputs);
  
  // Create snapshot (COMMENTED OUT)
  // onProgress(18, 'Saving Do Nothing snapshot...');
  // await createSnapshot('1 - Do Nothing');
  
  return outputs;
}

/**
 * Run Scenario 2: Solar Only
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenario results
 */
export async function runScenario2(userInputs, onProgress) {
  onProgress(20, 'Running Solar Only scenario...');
  
  // Clean up before starting
  await cleanupLimited();
  
  // Set E17 to 1950 (solar system size)
  await setValue('E17', 1950);
  
  // Write formula in F47
  await writeFormula('F47', '=F51');
  
  // Call solveForITC
  await callFunction('solveForITC');
  
  onProgress(30, 'Capturing Solar Only results...');
  
  // Get outputs
  const outputs = await getOutputs();
  
  // COMMENTED OUT - Create workbook copy (may be used for some users later)
  // onProgress(33, 'Saving Solar Only workbook...');
  // await createWorkbookCopy('2 - Solar Only', userInputs);
  
  // Create snapshot (COMMENTED OUT)
  // onProgress(33, 'Saving Solar Only snapshot...');
  // await createSnapshot('2 - Solar Only');
  
  return outputs;
}

/**
 * Run Scenario 3: Donation Only (RANGE)
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenario results with min and max
 */
export async function runScenario3(userInputs, onProgress) {
  onProgress(35, 'Running Donation Only scenario (Maximum)...');
  
  // Clean up before starting
  await cleanupLimited();
  
  // Set E17 to 0 (no solar for this scenario)
  await setValue('E17', 0);
  
  // Set B43 to 0 (transition from Solar Only to Donation Only)
  await setValue('B43', 0);
  
  // Set F47 to 0
  await setValue('F47', 0);
  
  // Write formula in C92
  await writeFormula('C92', '=MAX(0, B92)');
  
  // Ensure C90 = 60%
  await setValue('C90', 0.6);
  
  onProgress(42, 'Capturing Donation Only maximum...');
  
  // Get outputs for MAX
  const maxOutputs = await getOutputs();
  
  // COMMENTED OUT - Save workbook copy at 60% state (may be used for some users later)
  // onProgress(47, 'Saving Donation Only workbook...');
  // await createWorkbookCopy('3 - Donation Only', userInputs);
  
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
  await setValue('C90', 0.3);
  
  onProgress(53, 'Capturing Donation Only minimum...');
  
  // Get outputs for MIN
  const minOutputs = await getOutputs();
  
  // Reset C90 to 60% for next scenario
  await setValue('C90', 0.6);
  
  // Create snapshot (COMMENTED OUT)
  // await createSnapshot('3 - Donation Only');
  
  return {
    max: maxOutputs,
    min: minOutputs
  };
}

/**
 * Run Scenario 4: Solar + Donation (No Refund) - RANGE
 * @param {object} userInputs - User input data
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} - Scenario results with min and max
 */
export async function runScenario4(userInputs, onProgress) {
  onProgress(55, 'Running Solar + Donation (No Refund) - Maximum...');
  
  // Clean up before starting
  await cleanupLimited();
  
  // Set E17 to 1950 (solar system size)
  await setValue('E17', 1950);
  
  // Step 1: Do donation part first
  await writeFormula('C92', '=MAX(0, B92)');
  await setValue('C90', 0.6);
  
  // Step 2: Call solveForITC
  await writeFormula('F47', '=F51');
  await callFunction('solveForITC');
  
  // Step 3: Check if F51 is negative
  const f51Value = await getValue('F51');
  
  if (f51Value < 0) {
    // If negative, set F47 to 0
    await setValue('F47', 0);
    // Run solve function again
    await callFunction('solveForITC');
  } else {
    // Otherwise, F47 should equal F51
    await writeFormula('F47', '=F51');
  }
  
  onProgress(62, 'Capturing Solar + Donation (No Refund) maximum...');
  
  // Get outputs for MAX
  const maxOutputs = await getOutputs();
  
  // COMMENTED OUT - Save workbook copy at 60% state (may be used for some users later)
  // onProgress(67, 'Saving Solar + Donation (No Refund) workbook...');
  // await createWorkbookCopy('4 - Solar + Donation (No Refund)', userInputs);
  
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
  await setValue('C90', 0.3);
  
  // Check F51 again for minimum
  const f51ValueMin = await getValue('F51');
  
  if (f51ValueMin < 0) {
    await setValue('F47', 0);
    await callFunction('solveForITC');
  } else {
    await writeFormula('F47', '=F51');
    await callFunction('solveForITC');
  }
  
  onProgress(73, 'Capturing Solar + Donation (No Refund) minimum...');
  
  // Get outputs for MIN
  const minOutputs = await getOutputs();
  
  // Reset C90 to 60% for next scenario
  await setValue('C90', 0.6);
  
  // Create snapshot (COMMENTED OUT)
  // await createSnapshot('4 - Solar + Donation (No Refund)');
  
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
export async function runScenario5(userInputs, onProgress) {
  onProgress(75, 'Running Solar + Donation (With Refund) - Maximum...');
  
  // Clean up before starting
  await cleanupLimited();
  
  // Set E17 to 1950 (solar system size)
  await setValue('E17', 1950);
  
  // Step 1: Do donation part first
  await writeFormula('C92', '=MAX(0, B92)');
  await setValue('C90', 0.6);
  
  // Step 2: Call solveForITCRefund
  await writeFormula('F47', '=F51');
  await callFunction('solveForITCRefund');
  
  // Step 3: Check if F51 is negative
  const f51Value = await getValue('F51');
  
  if (f51Value < 0) {
    // If negative, set F47 to 0
    await setValue('F47', 0);
    // Run solve function again
    await callFunction('solveForITCRefund');
  } else {
    // Otherwise, F47 should equal F51 (note: for refund scenario, using F47 not G47)
    await writeFormula('F47', '=F51');
    await callFunction('solveForITCRefund');
  }
  
  // Get value from G49 and write it to G47
  const g49Value = await getValue('G49');
  await setValue('G47', g49Value);
  
  onProgress(82, 'Capturing Solar + Donation (With Refund) maximum...');
  
  
  // Get outputs for MAX
  const maxOutputs = await getOutputs();
  
  // COMMENTED OUT - Save workbook copy at 60% state (may be used for some users later)
  // onProgress(87, 'Saving Solar + Donation (With Refund) workbook...');
  // await createWorkbookCopy('5 - Solar + Donation (With Refund)', userInputs);
  
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
  await writeFormula('G47', '0');
  // Set C90 = 30%
  await setValue('C90', 0.3);
  
  // Check F51 again for minimum
  const f51ValueMin = await getValue('F51');
  
  if (f51ValueMin < 0) {
    await setValue('F47', 0);
    await callFunction('solveForITCRefund');
  } else {
    await writeFormula('F47', '=F51');
  }
 
  // Get value from G49 and write it to G47
  const g49ValueMin = await getValue('G49');
  await setValue('G47', g49ValueMin);
  
  onProgress(93, 'Capturing Solar + Donation (With Refund) minimum...');
  
  // Get outputs for MIN
  const minOutputs = await getOutputs();
  
  // Reset C90 to 60% for any future scenarios
  await setValue('C90', 0.6);
  
  // Create snapshot (COMMENTED OUT)
  // await createSnapshot('5 - Solar + Donation (With Refund)');
  
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
  try {
    onProgress(0, 'Setting up your analysis...');
    
    // Set user inputs
    onProgress(10, 'Setting up inputs...');
    await setUserInputs(userInputs);
    
    // Run Scenario 5
    onProgress(20, 'Running Solar + Donation (With Refund)...');
    const scenario5 = await runScenario5(userInputs, onProgress);
    
    // Cleanup
    onProgress(96, 'Finalizing results...');
    //await cleanup();
    
    onProgress(100, 'Analysis complete!');
    
    // Return in same format as full analysis but only scenario5 populated
    return {
      scenario1: null,
      scenario2: null,
      scenario3: null,
      scenario4: null,
      scenario5
    };
  } catch (error) {
    console.error('Error running scenario 5:', error);
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
  try {
    onProgress(0, 'Setting up your analysis...');
    
    // Scenario 1: Do Nothing
    onProgress(10, 'Running Scenario 1: Baseline...');
    const scenario1 = await runScenario1(userInputs, onProgress);
    
    // Scenario 2: Solar Only
    onProgress(20, 'Running Scenario 2: Solar Only...');
    const scenario2 = await runScenario2(userInputs, onProgress);
    
    // Scenario 3: Donation Only
    onProgress(35, 'Running Scenario 3: Donation Only...');
    const scenario3 = await runScenario3(userInputs, onProgress);
    
    // Scenario 4: Solar + Donation (No Refund)
    onProgress(55, 'Running Scenario 4: Solar + Donation (No Refund)...');
    const scenario4 = await runScenario4(userInputs, onProgress);
    
    // Scenario 5: Solar + Donation (With Refund)
    onProgress(75, 'Running Scenario 5: Solar + Donation (With Refund)...');
    const scenario5 = await runScenario5(userInputs, onProgress);
    
    // Cleanup
    onProgress(96, 'Finalizing results...');
    await cleanup();
    
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
    throw error;
  }
}

