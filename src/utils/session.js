/**
 * Session Management Utilities
 * 
 * These utilities help manage passcode sessions stored in localStorage
 */

const SESSION_KEY = 'sp_applet_passcode';

/**
 * Get the current passcode from session
 * @returns {string|null} - Current passcode or null if not logged in
 */
export function getCurrentPasscode() {
  return localStorage.getItem(SESSION_KEY);
}

/**
 * Clear the current session (logout)
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  console.log('🔓 Session cleared');
}

/**
 * Check if user is currently logged in
 * @returns {boolean} - True if session exists
 */
export function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) !== null;
}

/**
 * Force logout and reload page
 * Useful for switching users
 */
export function logout() {
  clearSession();
  window.location.reload();
}

/**
 * Get session info for debugging
 * @returns {object} - Session information
 */
export function getSessionInfo() {
  const passcode = getCurrentPasscode();
  return {
    isLoggedIn: isLoggedIn(),
    passcode: passcode,
    storageKey: SESSION_KEY
  };
}

