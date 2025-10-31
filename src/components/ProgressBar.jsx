import React from 'react';

export default function ProgressBar({ progress, message }) {
  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div className="progress-bar" style={{ width: `${progress}%` }}>
          {progress > 10 && `${Math.round(progress)}%`}
        </div>
      </div>
      <div className="progress-text">{message}</div>
    </div>
  );
}

