import React from 'react';

export default function ActionButtons({ onNewAnalysis }) {
  const handleEmailClick = () => {
    // TODO: Implement email functionality
    alert('Email functionality coming soon!');
  };

  const handleIntakeFormClick = () => {
    // TODO: Replace with actual intake form URL
    window.open('https://example.com/intake-form', '_blank');
  };

  return (
    <div className="action-buttons">
      <button 
        className="btn-secondary"
        onClick={handleEmailClick}
      >
        Email this to myself
      </button>
      
      <button 
        className="btn-info"
        onClick={handleIntakeFormClick}
      >
        Start the TaxWise Partners Intake Form
      </button>
      
      <button 
        className="btn-success"
        onClick={onNewAnalysis}
      >
        Start a New Analysis
      </button>
    </div>
  );
}

