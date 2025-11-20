import React, { useState, useEffect } from 'react';

export default function ProgressBar({ progress, message, startTime }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [jumpCount, setJumpCount] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    // Update elapsed time every second
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Track jump count based on progress milestones
  useEffect(() => {
    const newJumpCount = Math.floor(progress / 10);
    if (newJumpCount > jumpCount) {
      setJumpCount(newJumpCount);
    }
  }, [progress, jumpCount]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Check if this jump should be a spin (every 5th jump)
  const isSpinJump = jumpCount % 5 === 0 && jumpCount > 0;

  return (
    <div className="progress-container">
      {/* Owl Runner Game Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '120px',
        background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #8B7355 50%, #A0826D 100%)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '15px',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Scrolling Road Lines */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: 0,
          width: '200%',
          height: '2px',
          background: 'repeating-linear-gradient(to right, #FFF 0px, #FFF 20px, transparent 20px, transparent 40px)',
          animation: 'scrollRoad 2s linear infinite'
        }} />
        
        {/* Hurdles - different sizes appearing at intervals */}
        {[...Array(12)].map((_, i) => {
          const hurdleProgress = (i * 10) % 100;
          const isVisible = Math.abs(hurdleProgress - (progress % 100)) < 15;
          const height = i % 3 === 0 ? 25 : i % 3 === 1 ? 18 : 12;
          return isVisible && (
            <div key={i} style={{
              position: 'absolute',
              bottom: '40px',
              left: `${20 + (i * 8) % 80}%`,
              width: '4px',
              height: `${height}px`,
              backgroundColor: '#D2691E',
              borderRadius: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              animation: 'scrollHurdle 2s linear infinite',
              opacity: 0.8
            }} />
          );
        })}

        {/* The Owl Runner */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '20%',
          fontSize: '32px',
          animation: `owlHop 0.6s ease-in-out infinite, ${isSpinJump ? 'owlSpin 0.6s ease-in-out' : 'none'}`,
          transformOrigin: 'center center',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
          transition: 'transform 0.3s ease'
        }}>
          🦉
        </div>

        {/* Progress Percentage Display */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '15px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#FFF',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'monospace'
        }}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* Progress Message */}
      <div className="progress-text" style={{ marginBottom: '10px' }}>{message}</div>
      
      {/* Time Elapsed */}
      {startTime && (
        <div style={{ 
          textAlign: 'center', 
          fontSize: '14px', 
          color: '#666',
          fontWeight: '500'
        }}>
          Time Elapsed: {formatTime(elapsedSeconds)}
        </div>
      )}

      {/* CSS Keyframes */}
      <style>{`
        @keyframes scrollRoad {
          from { transform: translateX(0); }
          to { transform: translateX(-40px); }
        }

        @keyframes scrollHurdle {
          from { transform: translateX(0); }
          to { transform: translateX(-100vw); }
        }

        @keyframes owlHop {
          0%, 100% { transform: translateY(0) scaleY(1); }
          25% { transform: translateY(-8px) scaleY(1.1); }
          50% { transform: translateY(-20px) scaleY(0.95); }
          75% { transform: translateY(-8px) scaleY(1.05); }
        }

        @keyframes owlSpin {
          0% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(90deg) translateY(-15px); }
          50% { transform: rotate(180deg) translateY(-25px); }
          75% { transform: rotate(270deg) translateY(-15px); }
          100% { transform: rotate(360deg) translateY(0); }
        }
      `}</style>
    </div>
  );
}

