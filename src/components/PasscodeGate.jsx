import React, { useState, useEffect } from 'react';
import { VALID_PASSCODES } from '../config/passcodes';

export default function PasscodeGate({ children, onPasscodeValid }) {
  const [isLocked, setIsLocked] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);

  // Check localStorage for existing valid session
  useEffect(() => {
    const storedPasscode = localStorage.getItem('sp_applet_passcode');
    if (storedPasscode && VALID_PASSCODES[storedPasscode]) {
      // Valid session exists
      setIsLocked(false);
      onPasscodeValid(storedPasscode, VALID_PASSCODES[storedPasscode]);
    }
  }, [onPasscodeValid]);

  const handlePasscodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    // Limit to 4 characters
    if (value.length <= 4) {
      setPasscode(value);
      setError('');
      setShakeError(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (passcode.length !== 4) {
      setError('Passcode must be 4 characters');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    if (VALID_PASSCODES[passcode]) {
      // Valid passcode
      setIsLocked(false);
      setError('');
      // Store in localStorage for session persistence
      localStorage.setItem('sp_applet_passcode', passcode);
      // Notify parent component
      onPasscodeValid(passcode, VALID_PASSCODES[passcode]);
    } else {
      // Invalid passcode
      setError('Invalid passcode. Please try again.');
      setShakeError(true);
      setPasscode('');
      setTimeout(() => setShakeError(false), 500);
    }
  };

  if (!isLocked) {
    return children;
  }

  return (
    <>
      {/* Blurred background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 9998
      }}>
        {children}
      </div>

      {/* Passcode modal */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px 50px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          maxWidth: '400px',
          width: '90%',
          animation: shakeError ? 'shake 0.5s' : 'none'
        }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '10px',
            fontSize: '24px',
            color: '#333'
          }}>
            Access Required
          </h2>
          <p style={{
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '14px',
            color: '#666'
          }}>
            Please enter your 4-digit passcode to access the Strategic Partner Estimator Tool.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={passcode}
                onChange={handlePasscodeChange}
                placeholder="Enter passcode"
                autoFocus
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: '600',
                  border: error ? '2px solid #f44336' : '2px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  textTransform: 'uppercase'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4CAF50';
                }}
                onBlur={(e) => {
                  if (!error) {
                    e.target.style.borderColor = '#ddd';
                  }
                }}
              />
            </div>

            {error && (
              <div style={{
                color: '#f44336',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '20px',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#45a049';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#4CAF50';
              }}
            >
              Unlock
            </button>
          </form>

          <p style={{
            marginTop: '30px',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center'
          }}>
            This tool is for authorized users only.
          </p>
        </div>
      </div>

      {/* Shake animation CSS */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
          }
        `}
      </style>
    </>
  );
}

