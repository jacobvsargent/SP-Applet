/**
 * Format a number as currency
 * @param {number} value - The numeric value to format
 * @returns {string} - Formatted currency string (e.g., "$123,456")
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(absValue);
  
  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Format a number as currency with 2 decimal places for input display
 * @param {number} value - The numeric value to format
 * @returns {string} - Formatted currency string (e.g., "$123,456.00")
 */
export function formatCurrencyInput(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absValue);
  
  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Parse currency string or number string to a number
 * Handles formats like "$1,234,420" or "1234420"
 * @param {string} value - The string to parse
 * @returns {number} - The parsed number
 */
export function parseCurrency(value) {
  if (!value) return 0;
  
  // Remove $, commas, and whitespace
  const cleaned = value.toString().replace(/[$,\s]/g, '');
  
  return parseFloat(cleaned) || 0;
}

/**
 * Validate if a string can be parsed as a valid currency/number
 * @param {string} value - The string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidCurrency(value) {
  if (!value || value.trim() === '') return false;
  
  const cleaned = value.toString().replace(/[$,\s]/g, '');
  const number = parseFloat(cleaned);
  
  return !isNaN(number) && number > 0;
}

