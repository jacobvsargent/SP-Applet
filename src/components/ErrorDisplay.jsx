import React from 'react';

export default function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="error-container">
      <h3>An Error Occurred</h3>
      <p>{error.message || 'Something went wrong while running the analysis.'}</p>
      {error.details && (
        <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
          Details: {error.details}
        </p>
      )}
      <button className="btn-primary" onClick={onRetry}>
        Retry Analysis
      </button>
    </div>
  );
}

