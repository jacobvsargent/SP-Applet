import React, { useState, useEffect } from 'react';

export default function ProgressBar({ progress, message, startTime }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    // Update elapsed time every second
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div className="progress-bar" style={{ width: `${progress}%` }}>
          {progress > 10 && `${Math.round(progress)}%`}
        </div>
      </div>
      <div className="progress-text">{message}</div>
      {startTime && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '10px', 
          fontSize: '14px', 
          color: '#666',
          fontWeight: '500'
        }}>
          Time Elapsed: {formatTime(elapsedSeconds)}
        </div>
      )}
    </div>
  );
}

