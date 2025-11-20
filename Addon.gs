function zeroCellsByColor() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Blended Solution Calculator");
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'Blended Solution Calculator' sheet not found");
    return;
  }
  
  var range = sheet.getDataRange();
  var backgrounds = range.getBackgrounds();
  
  // Define the target color (in hex format)
  var targetColor = "#ffff99"; // Change this to your target color
  
  // Loop through all cells
  for (var i = 0; i < backgrounds.length; i++) {
    for (var j = 0; j < backgrounds[i].length; j++) {
      if (backgrounds[i][j].toLowerCase() === targetColor.toLowerCase()) {
        // Only set the specific cell that matches the color
        sheet.getRange(i + 1, j + 1).setValue(0);
      }
    }
  }
  
  // Now update the Detailed Summary sheet
  var detailedSheet = ss.getSheetByName("Detailed Summary");
  
  if (!detailedSheet) {
    SpreadsheetApp.getUi().alert("Error: 'Detailed Summary' sheet not found");
    return;
  }
  
  // Now update the GFX + Ordinary Summary sheet
  var gfxSheet = ss.getSheetByName("GFX + Ordinary Summary");
  
  if (gfxSheet) {
    var gfxRange = gfxSheet.getDataRange();
    var gfxBackgrounds = gfxRange.getBackgrounds();
    
    // Loop through all cells in GFX + Ordinary Summary
    for (var i = 0; i < gfxBackgrounds.length; i++) {
      for (var j = 0; j < gfxBackgrounds[i].length; j++) {
        if (gfxBackgrounds[i][j].toLowerCase() === targetColor.toLowerCase()) {
          // Only set the specific cell that matches the color
          gfxSheet.getRange(i + 1, j + 1).setValue(0);
        }
      }
    }
  }
  
}

function zeroCellsByColorLimited() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Blended Solution Calculator");
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'Blended Solution Calculator' sheet not found");
    return;
  }
  
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  
  // Only process from row 19 onwards
  if (lastRow < 19) {
    return; // Nothing to do if sheet has fewer than 19 rows
  }
  
  var range = sheet.getRange(19, 1, lastRow - 18, lastColumn);
  var backgrounds = range.getBackgrounds();
  
  // Define the target color (in hex format)
  var targetColor = "#ffff99"; // Change this to your target color
  
  // Loop through all cells in the range
  for (var i = 0; i < backgrounds.length; i++) {
    for (var j = 0; j < backgrounds[i].length; j++) {
      if (backgrounds[i][j].toLowerCase() === targetColor.toLowerCase()) {
        // Only set the specific cell that matches the color
        // i + 19 because we start at row 19
        sheet.getRange(i + 19, j + 1).setValue(0);
      }
    }
  }
  
  // Now update the GFX + Ordinary Summary sheet (all cells, not limited)
  var gfxSheet = ss.getSheetByName("GFX + Ordinary Summary");
  
  if (gfxSheet) {
    var gfxRange = gfxSheet.getDataRange();
    var gfxBackgrounds = gfxRange.getBackgrounds();
    
    // Loop through all cells in GFX + Ordinary Summary
    for (var i = 0; i < gfxBackgrounds.length; i++) {
      for (var j = 0; j < gfxBackgrounds[i].length; j++) {
        if (gfxBackgrounds[i][j].toLowerCase() === targetColor.toLowerCase()) {
          // Only set the specific cell that matches the color
          gfxSheet.getRange(i + 1, j + 1).setValue(0);
        }
      }
    }
  }
}

function solveForITC() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Blended Solution Calculator");
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'Blended Solution Calculator' sheet not found");
    return;
  }
  
  const maxIterations = 15;
  let iteration = 0;
  let previousB43 = 0;

  while (iteration < maxIterations) {
    iteration++;

    // Get the current values
    const F49 = sheet.getRange("F49").getValue();
    const B49 = sheet.getRange("B49").getValue();
    const C39 = sheet.getRange("C39").getValue();
    const G49 = Math.abs(sheet.getRange("G49").getValue());

    // Check if we've achieved the goal
    if (G49 < 10) {
      SpreadsheetApp.getUi().alert("Success!\nConverged in " + iteration + " iteration(s)\nG49 = " + G49.toFixed(4));
      Logger.log("Success! Converged in " + iteration + " iterations. G49 = " + G49);
      return;
    }

    // Check for invalid values
    if (B49 === 0) {
      SpreadsheetApp.getUi().alert("Error: B49 cannot be zero");
      return;
    }

    if (C39 === 100) {
      SpreadsheetApp.getUi().alert("Error: C39 cannot be 100");
      return;
    }

    // Calculate B43 using the formula and round to nearest integer
    const B43_calculated = F49 * (100 - C39) / (100 * B49);
    let B43 = Math.round(B43_calculated);

    // Apply damping on the first 4 iterations
    if (iteration <= 4 && iteration > 1) {
      const difference = B43 - previousB43;
      const dampedDifference = difference * 0.6; // Keep 60% of the change
      B43 = Math.round(previousB43 + dampedDifference);
    }

    // Update previousB43 before setting the value
    previousB43 = B43;

    // Set the calculated value in B43
    sheet.getRange("B43").setValue(B43);

    // Force recalculation
    SpreadsheetApp.flush();

    Logger.log("Iteration " + iteration + ": B43 = " + B43 + ", G49 = " + G49);
  }

  // If we exit the loop without converging
  const finalG49 = sheet.getRange("G49").getValue();
  SpreadsheetApp.getUi().alert("Failed to converge after " + maxIterations + " iterations.\nG49 = " + finalG49.toFixed(4));
  Logger.log("Failed to converge after " + maxIterations + " iterations. G49 = " + finalG49);
}

function solveForITCRefund() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Blended Solution Calculator");
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'Blended Solution Calculator' sheet not found");
    return;
  }
  
  const maxIterations = 15;
  let iteration = 0;
  let previousB43 = 0;

  // Get H51 (this won't change)
  const H51 = sheet.getRange("H51").getValue();

  while (iteration < maxIterations) {
    iteration++;

    // Get the current values
    const F49 = sheet.getRange("F49").getValue();
    const B49 = sheet.getRange("B49").getValue();
    const C39 = sheet.getRange("C39").getValue();
    const G49 = sheet.getRange("G49").getValue();

    // Check if we've achieved the goal (G49 equals H51 within 1)
    const difference = Math.abs(G49 - H51);
    if (difference < 10) {
      SpreadsheetApp.getUi().alert("Success!\nConverged in " + iteration + " iteration(s)\nG49 = " + G49.toFixed(4) + "\nH51 = " + H51.toFixed(4));
      Logger.log("Success! Converged in " + iteration + " iterations. G49 = " + G49 + ", H51 = " + H51);
      return;
    }

    // Check for invalid values
    if (B49 === 0) {
      SpreadsheetApp.getUi().alert("Error: B49 cannot be zero");
      return;
    }

    if (C39 === 100) {
      SpreadsheetApp.getUi().alert("Error: C39 cannot be 100");
      return;
    }

    // Calculate B43 using the formula: B43 = (F49 + H51) * (100 - C39) / (100 * B49)
    const B43_calculated = (F49 + H51) * (100 - C39) / (100 * B49);
    let B43 = Math.round(B43_calculated);

    // Apply damping on the first 4 iterations
    if (iteration <= 4 && iteration > 1) {
      const diff = B43 - previousB43;
      let dampedDifference = diff * 0.6; // Keep 60% of the change
      if (dampedDifference > 100000) {
        dampedDifference = dampedDifference * 0.6; // Cut further for large numbers
      }
      B43 = Math.round(previousB43 + dampedDifference);
    }

    // Update previousB43 before setting the value
    previousB43 = B43;

    // Set the calculated value in B43
    sheet.getRange("B43").setValue(B43);

    // Force recalculation
    SpreadsheetApp.flush();

    Logger.log("Iteration " + iteration + ": B43 = " + B43 + ", G49 = " + G49 + ", Target (H51) = " + H51 + ", Difference = " + difference);
  }

  // If we exit the loop without converging
  const finalG49 = sheet.getRange("G49").getValue();
  const finalDifference = Math.abs(finalG49 - H51);
  SpreadsheetApp.getUi().alert("Failed to converge after " + maxIterations + " iterations.\nG49 = " + finalG49.toFixed(4) + "\nH51 = " + H51.toFixed(4) + "\nDifference = " + finalDifference.toFixed(4));
  Logger.log("Failed to converge after " + maxIterations + " iterations. G49 = " + finalG49 + ", H51 = " + H51 + ", Difference = " + finalDifference);
}

function nameFile(returnOnly) {
  // Log that function was called
  Logger.log("nameFile called with returnOnly: " + returnOnly);
  Logger.log("returnOnly type: " + typeof returnOnly);
  
  // When called from CardService button, returnOnly will be an event object
  // When called from captureScenario, returnOnly will be true (boolean)
  // When called directly, returnOnly will be undefined
  var isReturnOnlyMode = false;
  
  if (returnOnly === true) {
    // Explicitly called with true from captureScenario
    isReturnOnlyMode = true;
  } else if (returnOnly === undefined || returnOnly === null) {
    // Called directly without parameter
    isReturnOnlyMode = false;
  } else if (typeof returnOnly === 'object') {
    // Called from CardService button - this is an event object
    isReturnOnlyMode = false;
  } else {
    // Any other case, default to false
    isReturnOnlyMode = false;
  }
  
  Logger.log("isReturnOnlyMode: " + isReturnOnlyMode);
  
  var ss;
  var sheet;
  var fileName;
  
  try {
    Logger.log("Starting nameFile execution");
    ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("Blended Solution Calculator");
    
    if (!sheet) {
      if (isReturnOnlyMode) {
        return null;
      }
      // For UI, just return - don't try to show notification if sheet doesn't exist
      return;
    }
    
    // Get all required values
    var clientName = sheet.getRange("Q5").getValue();
    var year = sheet.getRange("S5").getValue();
    var income = sheet.getRange("C4").getValue();
    var state = sheet.getRange("B4").getValue();
    var solarAmount = sheet.getRange("B43").getValue();
    var donationAmount = sheet.getRange("H88").getValue();
    var donationType = sheet.getRange("C86").getValue();
    var dur = sheet.getRange("G24").getValue();
    var plan831b = sheet.getRange("G32").getValue();
    var ctb = sheet.getRange("N124").getValue();
    var refund = sheet.getRange("G16").getValue();
    
    // Handle missing or zero client name
    if (!clientName || clientName === 0 || clientName === "") {
      clientName = "No Name";
    }
    
    // Start building the file name
    fileName = "";
    
    // If not returnOnly mode, include client name
    if (!isReturnOnlyMode) {
      fileName = clientName + " ";
    }
    
    // Add income (formatted)
    fileName += formatAmount(income) + " ";
    
    // Add state abbreviation
    fileName += getStateAbbreviation(state);
    
    // Add year and optionally "Tax Savings Analysis"
    if (isReturnOnlyMode) {
      fileName += " - " + year + " - ";
    } else {
      fileName += " - " + year + " Tax Savings Analysis - ";
    }
    
    // Add solar if not zero
    if (solarAmount && solarAmount !== 0) {
      fileName += formatAmount(solarAmount) + " Solar - ";
    }
    
    // Add donation if not zero
    if (donationAmount && donationAmount !== 0) {
      fileName += formatAmount(donationAmount) + " " + donationType + " - ";
    }
    
    // Add DUR if not zero
    if (dur && dur !== 0) {
      fileName += formatAmount(dur) + " DUR - ";
    }
    
    // Add 831B if not zero
    if (plan831b && plan831b !== 0) {
      fileName += formatAmount(plan831b) + " 831B - ";
    }
    
    // Add CTB if not zero
    if (ctb && ctb !== 0) {
      fileName += formatAmount(ctb) + " CTB - ";
    }
    
    // Add refund or "No Refund"
    if (refund && refund !== 0) {
      fileName += formatAmount(refund) + " Refund";
    } else {
      fileName += "No Refund";
    }
    
    // Handle long filenames (Google Sheets has a 400 character limit)
    var maxLength = 400;
    
    if (fileName.length > maxLength) {
      // First try: abbreviate "Tax Savings Analysis" to "TSA" and remove dollar signs
      fileName = fileName.replace("Tax Savings Analysis", "TSA");
      fileName = fileName.replace(/\$/g, "");
      
      // If still too long, truncate
      if (fileName.length > maxLength) {
        fileName = fileName.substring(0, maxLength);
      }
    }
    
    // If returnOnly mode, just return the filename
    if (isReturnOnlyMode) {
      Logger.log("Returning filename: " + fileName);
      return fileName;
    }
    
    // Otherwise, rename the spreadsheet
    Logger.log("Renaming file to: " + fileName);
    ss.rename(fileName);
    
    // Return a simple notification response
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText("File renamed successfully"))
      .build();
      
  } catch (e) {
    // Log the error
    Logger.log("Error in nameFile: " + e.toString());
    Logger.log("Stack: " + e.stack);
    
    // Handle any errors that occur
    if (isReturnOnlyMode) {
      // For captureScenario, return null on error
      return null;
    } else {
      // For UI calls, return error notification
      try {
        return CardService.newActionResponseBuilder()
          .setNotification(CardService.newNotification()
            .setText("Error renaming file"))
          .build();
      } catch (cardError) {
        // If even the card response fails, just return nothing
        Logger.log("Card response error: " + cardError.toString());
        return;
      }
    }
  }
}

function nameFileWithoutCoupons() {
  // Log that function was called
  Logger.log("nameFileWithoutCoupons called");
  
  // This function is only called from UI, so we don't need returnOnly mode
  var ss;
  var sheet;
  var fileName;
  
  try {
    Logger.log("Starting nameFileWithoutCoupons execution");
    ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("Blended Solution Calculator");
    
    if (!sheet) {
      // For UI, just return - don't try to show notification if sheet doesn't exist
      return;
    }
    
    // Get required values (only what we need for the basic name)
    var clientName = sheet.getRange("Q5").getValue();
    var year = sheet.getRange("S5").getValue();
    var income = sheet.getRange("C4").getValue();
    var state = sheet.getRange("B4").getValue();
    
    // Handle missing or zero client name
    if (!clientName || clientName === 0 || clientName === "") {
      clientName = "No Name";
    }
    
    // Build the file name - stop after "Tax Savings Analysis"
    fileName = clientName + " ";
    fileName += formatAmount(income) + " ";
    fileName += getStateAbbreviation(state);
    fileName += " - " + year + " Tax Savings Analysis";
    
    // Handle long filenames (Google Sheets has a 400 character limit)
    var maxLength = 400;
    
    if (fileName.length > maxLength) {
      // First try: abbreviate "Tax Savings Analysis" to "TSA" and remove dollar signs
      fileName = fileName.replace("Tax Savings Analysis", "TSA");
      fileName = fileName.replace(/\$/g, "");
      
      // If still too long, truncate
      if (fileName.length > maxLength) {
        fileName = fileName.substring(0, maxLength);
      }
    }
    
    // Rename the spreadsheet
    Logger.log("Renaming file to: " + fileName);
    ss.rename(fileName);
    
    // Return a simple notification response
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText("File renamed successfully"))
      .build();
      
  } catch (e) {
    // Log the error
    Logger.log("Error in nameFileWithoutCoupons: " + e.toString());
    Logger.log("Stack: " + e.stack);
    
    // Return error notification
    try {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText("Error renaming file"))
        .build();
    } catch (cardError) {
      // If even the card response fails, just return nothing
      Logger.log("Card response error: " + cardError.toString());
      return;
    }
  }
}

function formatAmount(amount) {
  // Convert to number if it's not already
  var num = Number(amount);
  
  if (isNaN(num)) {
    return "$0k";
  }
  
  // If amount is >= 1 million, use M format with 2 decimal places
  if (Math.abs(num) >= 1000000) {
    var millions = num / 1000000;
    // Format with 2 decimals, then remove trailing zeros and decimal point if not needed
    var formatted = millions.toFixed(2).replace(/\.?0+$/, '');
    return "$" + formatted + "M";
  } else {
    // Otherwise use k format, rounded to nearest thousand
    var thousands = Math.round(num / 1000);
    return "$" + thousands + "k";
  }
}

function getStateAbbreviation(stateName) {
  // State mapping object
  var stateMap = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
    "District of Columbia": "DC",
    "Puerto Rico": "PR",
    "Guam": "GU",
    "American Samoa": "AS",
    "U.S. Virgin Islands": "VI",
    "Northern Mariana Islands": "MP"
  };
  
  // If stateName is already an abbreviation, return it
  if (stateName && stateName.length === 2) {
    return stateName.toUpperCase();
  }
  
  // Look up the abbreviation
  var abbreviation = stateMap[stateName];
  
  // Return the abbreviation or the original if not found
  return abbreviation || stateName || "";
}

function captureScenario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Define the sheets to scan and target colors
  var sheetsToScan = ["Blended Solution Calculator", "GFX + Ordinary Summary"];
  var targetColors = ["#ffff99", "#f4b083"];
  
  // Get or create the Scenarios sheet
  var scenariosSheet = ss.getSheetByName("Scenarios");
  var isNewSheet = false;
  
  if (!scenariosSheet) {
    scenariosSheet = ss.insertSheet("Scenarios");
    isNewSheet = true;
    
    // Set up initial headers
    scenariosSheet.getRange("B1").setValue("Scenario Number");
    scenariosSheet.getRange("C1").setValue("Summary");
    scenariosSheet.getRange("D1").setValue("Notes");
    scenariosSheet.getRange("E1").setValue("Total Expense");
    scenariosSheet.getRange("F1").setValue("Total Benefit");
    scenariosSheet.getRange("G1").setValue("Total Net Gain");
    scenariosSheet.getRange("H1").setValue("Timestamp");
    // Column I onwards will be for variable collection (cell references)
  }
  
  // Determine the next scenario number
  var lastRow = scenariosSheet.getLastRow();
  var nextScenarioNumber = 1;
  
  if (lastRow > 1) {
    // Get the last scenario number and increment
    var lastScenarioNumber = scenariosSheet.getRange(lastRow, 2).getValue();
    nextScenarioNumber = lastScenarioNumber + 1;
  }
  
  var newRowIndex = lastRow + 1;
  
  // Get existing headers (from column I onwards, which is column 9)
  var existingHeaders = [];
  var headerRow = 1;
  
  if (lastRow >= 1) {
    var lastCol = scenariosSheet.getLastColumn();
    if (lastCol >= 9) {
      var headerRange = scenariosSheet.getRange(headerRow, 9, 1, lastCol - 8);
      existingHeaders = headerRange.getValues()[0];
    }
  }
  
  // Store captured data: {cellRef: {value: val, formula: formula}}
  var capturedData = {};
  var cellRefsInOrder = [];
  
  // Scan each sheet
  for (var s = 0; s < sheetsToScan.length; s++) {
    var sheetName = sheetsToScan[s];
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log("Warning: Sheet '" + sheetName + "' not found");
      continue;
    }
    
    var dataRange = sheet.getDataRange();
    var backgrounds = dataRange.getBackgrounds();
    var values = dataRange.getValues();
    var formulas = dataRange.getFormulas();
    
    // Loop through all cells
    for (var i = 0; i < backgrounds.length; i++) {
      for (var j = 0; j < backgrounds[i].length; j++) {
        var bgColor = backgrounds[i][j].toLowerCase();
        
        // Check if this cell matches any target color
        var isTargetColor = false;
        for (var c = 0; c < targetColors.length; c++) {
          if (bgColor === targetColors[c].toLowerCase()) {
            isTargetColor = true;
            break;
          }
        }
        
        if (isTargetColor) {
          // Get cell reference (A1 notation)
          var rowNum = i + 1;
          var colNum = j + 1;
          var cellA1 = columnToLetter(colNum) + rowNum;
          var fullCellRef = sheetName + "!" + cellA1;
          
          // Get the actual cell to check if it's merged
          var cell = sheet.getRange(rowNum, colNum);
          var mergedRange = cell.getMergedRanges();
          
          var actualFormula;
          var actualValue;
          
          // If this cell is part of a merged range, get the value from the merged range
          if (mergedRange.length > 0) {
            // Get the top-left cell of the merged range (which holds the actual value)
            var topLeftCell = mergedRange[0].getCell(1, 1);
            actualFormula = topLeftCell.getFormula();
            actualValue = topLeftCell.getValue();
            
            // Use the top-left cell reference for the merged cell
            var topLeftA1 = topLeftCell.getA1Notation();
            fullCellRef = sheetName + "!" + topLeftA1;
          } else {
            // Regular cell, use the values from the arrays
            actualFormula = formulas[i][j];
            actualValue = values[i][j];
          }
          
          // Only add if we haven't already captured this cell reference
          if (!capturedData[fullCellRef]) {
            // Determine what to store: formula takes precedence over value
            var valueToStore;
            if (actualFormula && actualFormula !== "") {
              // Store the formula as a string (with the = sign)
              valueToStore = actualFormula;
            } else {
              // Store the actual value
              valueToStore = actualValue;
            }
            
            // Store the data
            capturedData[fullCellRef] = valueToStore;
            cellRefsInOrder.push(fullCellRef);
          }
        }
      }
    }
  }
  
  // Now we need to match captured cells with existing headers and add new ones
  var nextColIndex = 9 + existingHeaders.length; // Start after existing headers (column I = 9)
  var rowData = {};
  
  // First, handle existing headers
  for (var h = 0; h < existingHeaders.length; h++) {
    var headerCellRef = existingHeaders[h];
    if (capturedData.hasOwnProperty(headerCellRef)) {
      rowData[9 + h] = capturedData[headerCellRef]; // Column index (9 = I, 10 = J, etc.)
    } else {
      rowData[9 + h] = ""; // Empty if not found in current capture
    }
  }
  
  // Now add new headers for cells not in existing headers
  for (var r = 0; r < cellRefsInOrder.length; r++) {
    var cellRef = cellRefsInOrder[r];
    
    // Check if this cell reference is already in headers
    var foundInHeaders = false;
    for (var h = 0; h < existingHeaders.length; h++) {
      if (existingHeaders[h] === cellRef) {
        foundInHeaders = true;
        break;
      }
    }
    
    if (!foundInHeaders) {
      // Add new header
      scenariosSheet.getRange(headerRow, nextColIndex).setValue(cellRef);
      
      // Add value to row data
      rowData[nextColIndex] = capturedData[cellRef];
      
      nextColIndex++;
    }
  }
  
  // Generate summary using nameFile function
  var summary = "";
  try {
    summary = nameFile(true);
    if (!summary || summary === null) {
      summary = ""; // Use blank if nameFile couldn't generate a summary
    }
  } catch (e) {
    Logger.log("Error generating summary: " + e.message);
    summary = "";
  }
  
  // Get specific values from Detailed Summary sheet (D22, F22, H22)
  var detailedSummarySheet = ss.getSheetByName("Detailed Summary");
  var totalExpense = "";
  var totalBenefit = "";
  var totalNetGain = "";
  
  if (detailedSummarySheet) {
    try {
      // These are merged cells, so get the top-left cell value
      totalExpense = detailedSummarySheet.getRange("D22").getValue();
      totalBenefit = detailedSummarySheet.getRange("F22").getValue();
      totalNetGain = detailedSummarySheet.getRange("H22").getValue();
    } catch (e) {
      Logger.log("Error getting Detailed Summary values: " + e.message);
    }
  }
  
  // Write the scenario data to the new row
  scenariosSheet.getRange(newRowIndex, 2).setValue(nextScenarioNumber); // Scenario Number (B)
  scenariosSheet.getRange(newRowIndex, 3).setValue(summary); // Summary (C)
  scenariosSheet.getRange(newRowIndex, 4).setValue(""); // Notes (D)
  scenariosSheet.getRange(newRowIndex, 5).setValue(totalExpense); // Total Expense from D22 (E)
  scenariosSheet.getRange(newRowIndex, 6).setValue(totalBenefit); // Total Benefit from F22 (F)
  scenariosSheet.getRange(newRowIndex, 7).setValue(totalNetGain); // Total Net Gain from H22 (G)
  scenariosSheet.getRange(newRowIndex, 8).setValue(new Date()); // Timestamp (H)
  
  // Write all the captured values as text (to preserve formulas as strings)
  for (var colIndex in rowData) {
    var cellValue = rowData[colIndex];
    var targetCell = scenariosSheet.getRange(newRowIndex, parseInt(colIndex));
    
    // If it's a formula (starts with =), store it as text by prefixing with single quote
    if (typeof cellValue === 'string' && cellValue.charAt(0) === '=') {
      targetCell.setValue("'" + cellValue); // Prefix with ' to store as text
    } else {
      targetCell.setValue(cellValue);
    }
  }
  
  SpreadsheetApp.getUi().alert("Scenario " + nextScenarioNumber + " captured successfully!\n" + 
                                "Captured " + cellRefsInOrder.length + " cells.");
}

// Wrapper function to show the restore scenario card
function restoreScenarioFromCard() {
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Restore Scenario'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('Enter the scenario number you want to restore:'))
      .addWidget(CardService.newTextInput()
        .setFieldName('scenarioNumber')
        .setTitle('Scenario Number'))
      .addWidget(CardService.newTextButton()
        .setText('Restore')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('executeRestoreScenario'))))
    .build();
  
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card))
    .build();
}

// Execute the restore based on card input
function executeRestoreScenario(e) {
  var scenarioNumber = parseInt(e.formInput.scenarioNumber);
  
  var result = restoreScenario(scenarioNumber);
  
  // Show notification
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText(result))
    .build();
}

function restoreScenario(scenarioNumber) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scenariosSheet = ss.getSheetByName("Scenarios");
  
  if (!scenariosSheet) {
    return "Error: 'Scenarios' sheet not found. Please capture a scenario first.";
  }
  
  // Validate scenario number
  if (isNaN(scenarioNumber) || scenarioNumber < 1) {
    return "Error: Please enter a valid scenario number (1 or greater).";
  }
  
  // Find the row with the matching scenario number
  var lastRow = scenariosSheet.getLastRow();
  var scenarioRow = -1;
  
  for (var i = 2; i <= lastRow; i++) {
    var currentScenarioNum = scenariosSheet.getRange(i, 2).getValue();
    if (currentScenarioNum == scenarioNumber) {
      scenarioRow = i;
      break;
    }
  }
  
  if (scenarioRow == -1) {
    return "Error: Scenario " + scenarioNumber + " not found.";
  }
  
  // Get all the headers (column I onwards, which is column 9)
  // Columns E, F, G, H are for display only (Total Expense, Total Benefit, Total Net Gain, Timestamp)
  var lastCol = scenariosSheet.getLastColumn();
  
  if (lastCol < 9) {
    return "Error: No cell data found in Scenario " + scenarioNumber + ".";
  }
  
  // Get headers from row 1, starting at column I (column 9)
  var headersRange = scenariosSheet.getRange(1, 9, 1, lastCol - 8);
  var headers = headersRange.getValues()[0];
  
  // Get values from the scenario row, starting at column I (column 9)
  var valuesRange = scenariosSheet.getRange(scenarioRow, 9, 1, lastCol - 8);
  var values = valuesRange.getValues()[0];
  
  // Track how many cells we update
  var cellsUpdated = 0;
  var errors = [];
  
  // Loop through each header and restore the value
  for (var i = 0; i < headers.length; i++) {
    var cellRef = headers[i];
    var value = values[i];
    
    // Skip empty headers or empty values
    if (!cellRef || cellRef === "") {
      continue;
    }
    
    // Parse the cell reference (format: "SheetName!CellA1")
    var parts = cellRef.split("!");
    if (parts.length != 2) {
      errors.push("Invalid cell reference format: " + cellRef);
      continue;
    }
    
    var sheetName = parts[0];
    var cellA1 = parts[1];
    
    // Get the target sheet
    var targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      errors.push("Sheet not found: " + sheetName);
      continue;
    }
    
    try {
      var targetCell = targetSheet.getRange(cellA1);
      
      // Check if the value is a formula (starts with =)
      // Note: formulas are stored as text with ' prefix in Google Sheets, so we need to handle that
      var cellValueToRestore = value;
      
      if (typeof cellValueToRestore === 'string') {
        // Remove leading single quote if present (Google Sheets adds this to store formulas as text)
        if (cellValueToRestore.charAt(0) === "'") {
          cellValueToRestore = cellValueToRestore.substring(1);
        }
        
        // Now check if it's a formula
        if (cellValueToRestore.charAt(0) === '=') {
          targetCell.setFormula(cellValueToRestore);
        } else {
          targetCell.setValue(cellValueToRestore);
        }
      } else {
        targetCell.setValue(cellValueToRestore);
      }
      
      cellsUpdated++;
    } catch (e) {
      errors.push("Error updating " + cellRef + ": " + e.message);
    }
  }
  
  // Force recalculation
  SpreadsheetApp.flush();
  
  // Build results message
  var message = "Scenario " + scenarioNumber + " restored successfully! Updated " + cellsUpdated + " cell(s).";
  
  if (errors.length > 0) {
    message += " Warnings: " + errors.slice(0, 3).join("; ");
    if (errors.length > 3) {
      message += " (+" + (errors.length - 3) + " more)";
    }
  }
  
  return message;
}

// Helper function to convert column number to letter
function columnToLetter(column) {
  var temp;
  var letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}