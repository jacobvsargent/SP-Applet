/**
 * Passcode Configuration
 * 
 * Each passcode entry can include:
 * - userId: Unique identifier for the user
 * - displayName: Human-readable name
 * - frontEndConfig: Optional configuration for front-end behavior
 * - backEndConfig: Optional configuration for back-end behavior
 * 
 * SECURITY NOTE:
 * This is a soft security measure. For production environments with sensitive data,
 * consider moving passcode validation to a secure backend service.
 */

export const VALID_PASSCODES = {
  'MARK': {
    userId: 'MARK',
    displayName: 'Mark',
    // Future: Add custom configurations
    // frontEndConfig: { theme: 'default', features: ['solar', 'donation'] },
    // backEndConfig: { permissions: ['read', 'write'], rateLimit: 100 }
  },
  
  'WTAI': {
    userId: 'WTAI',
    displayName: 'WTAI User',
  },
  
  'TEST': {
    userId: 'TEST',
    displayName: 'Test User',
  },
  
  'ADMI': {
    userId: 'ADMI',
    displayName: 'Administrator',
  },
  
  // Add more passcodes here as needed:
  // 'CODE': {
  //   userId: 'CODE',
  //   displayName: 'User Name',
  //   frontEndConfig: { ... },
  //   backEndConfig: { ... }
  // }
};

/**
 * Get user configuration by passcode
 * @param {string} passcode - The passcode to look up
 * @returns {object|null} - User configuration or null if invalid
 */
export function getUserConfig(passcode) {
  return VALID_PASSCODES[passcode] || null;
}

/**
 * Check if a passcode is valid
 * @param {string} passcode - The passcode to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPasscode(passcode) {
  return passcode in VALID_PASSCODES;
}

