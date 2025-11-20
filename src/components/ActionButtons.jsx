import React from 'react';
import { formatCurrency } from '../utils/formatting';

export default function ActionButtons({ onNewAnalysis, results, userInputs }) {
  const handleEmailClick = () => {
    // Generate email content
    const subject = 'Taxwise Partners Strategic Partner Analysis Results';
    
    let body = 'Here are my tax optimization scenario analysis results from the Taxwise Partners Strategic Partner Estimator Tool:\n\n';
    
    // Add user inputs at the top
    if (userInputs) {
      body += '=== YOUR INPUTS ===\n\n';
      body += `Client Name: ${userInputs.name}\n`;
      body += `2025 Ordinary Income: ${formatCurrency(userInputs.income)}\n`;
      
      if (userInputs.capitalGains) {
        body += `2025 Long-term Capital Gains: ${formatCurrency(userInputs.capitalGains)}\n`;
      }
      
      if (userInputs.avgIncome) {
        body += `Estimated 2022 Income: ${formatCurrency(userInputs.avgIncome)}\n`;
      }
      
      if (userInputs.knownFederalTax) {
        body += `Known 2022 Federal Tax Paid: ${formatCurrency(userInputs.knownFederalTax)}\n`;
      }
      
      body += `State of Residence: ${userInputs.state}\n`;
      body += `Filing Status: ${userInputs.filingStatus}\n`;
      
      if (userInputs.donationPreference) {
        const donationLabel = 
          userInputs.donationPreference === 'land' ? 'Land (30%)' :
          userInputs.donationPreference === 'medtech' ? 'Medtech (60%)' :
          userInputs.donationPreference === 'both' ? 'Both (Range)' :
          userInputs.donationPreference === 'both-separate' ? 'Both (Separate)' :
          userInputs.donationPreference;
        body += `Donation Strategy: ${donationLabel}\n`;
      }
      
      body += '\n';
    }
    
    body += '=== ANALYSIS RESULTS ===\n\n';
    
    // Helper to calculate taxable income (AGI + Capital Gains)
    const calculateTaxableIncome = (agi) => {
      const capitalGains = userInputs.capitalGains || 0;
      
      if (typeof agi === 'object' && agi.min !== undefined && agi.max !== undefined) {
        return {
          min: agi.min + capitalGains,
          max: agi.max + capitalGains
        };
      }
      
      return agi + capitalGains;
    };
    
    // Helper to format values (handles ranges)
    const formatValue = (value) => {
      if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        if (value.min === value.max) {
          return formatCurrency(value.max);
        }
        const smaller = Math.min(value.min, value.max);
        const larger = Math.max(value.min, value.max);
        return `${formatCurrency(smaller)} - ${formatCurrency(larger)}`;
      }
      return formatCurrency(value);
    };
    
    // Add each scenario
    if (results.scenario1) {
      body += `1. DO NOTHING (Baseline)\n`;
      body += `   Taxable Income: ${formatValue(calculateTaxableIncome(results.scenario1.agi))}\n`;
      body += `   Total Tax Due: ${formatValue(results.scenario1.totalTaxDue)}\n`;
      body += `   Net Gain: ${formatValue(results.scenario1.totalNetGain)}\n\n`;
    }
    
    if (results.scenario2) {
      body += `2. SOLAR ONLY\n`;
      body += `   Taxable Income: ${formatValue(calculateTaxableIncome(results.scenario2.agi))}\n`;
      body += `   Total Tax Due: ${formatValue(results.scenario2.totalTaxDue)}\n`;
      body += `   Net Gain: ${formatValue(results.scenario2.totalNetGain)}\n\n`;
    }
    
    if (results.scenario3) {
      const s3 = results.scenario3;
      let s3Data;
      
      if (s3.min && s3.max) {
        // Range format
        s3Data = {
          agi: { min: s3.min.agi, max: s3.max.agi },
          totalTaxDue: { min: s3.min.totalTaxDue, max: s3.max.totalTaxDue },
          totalNetGain: { min: s3.min.totalNetGain, max: s3.max.totalNetGain }
        };
      } else {
        // Single value format
        s3Data = {
          agi: s3.agi,
          totalTaxDue: s3.totalTaxDue,
          totalNetGain: s3.totalNetGain
        };
      }
      
      body += `3. DONATION ONLY\n`;
      body += `   Taxable Income: ${formatValue(calculateTaxableIncome(s3Data.agi))}\n`;
      body += `   Total Tax Due: ${formatValue(s3Data.totalTaxDue)}\n`;
      body += `   Net Gain: ${formatValue(s3Data.totalNetGain)}\n\n`;
    }
    
    if (results.scenario4) {
      const s4 = results.scenario4;
      let s4Data;
      
      if (s4.min && s4.max) {
        s4Data = {
          agi: { min: s4.min.agi, max: s4.max.agi },
          totalTaxDue: { min: s4.min.totalTaxDue, max: s4.max.totalTaxDue },
          totalNetGain: { min: s4.min.totalNetGain, max: s4.max.totalNetGain }
        };
      } else {
        s4Data = {
          agi: s4.agi,
          totalTaxDue: s4.totalTaxDue,
          totalNetGain: s4.totalNetGain
        };
      }
      
      body += `4. SOLAR + DONATION (No Refund)\n`;
      body += `   Taxable Income: ${formatValue(calculateTaxableIncome(s4Data.agi))}\n`;
      body += `   Total Tax Due: ${formatValue(s4Data.totalTaxDue)}\n`;
      body += `   Net Gain: ${formatValue(s4Data.totalNetGain)}\n\n`;
    }
    
    if (results.scenario5) {
      const s5 = results.scenario5;
      let s5Data;
      
      if (s5.min && s5.max) {
        s5Data = {
          agi: { min: s5.min.agi, max: s5.max.agi },
          totalTaxDue: { min: s5.min.totalTaxDue, max: s5.max.totalTaxDue },
          totalNetGain: { min: s5.min.totalNetGain, max: s5.max.totalNetGain }
        };
      } else {
        s5Data = {
          agi: s5.agi,
          totalTaxDue: s5.totalTaxDue,
          totalNetGain: s5.totalNetGain
        };
      }
      
      body += `5. SOLAR + DONATION (With Refund)\n`;
      body += `   Taxable Income: ${formatValue(calculateTaxableIncome(s5Data.agi))}\n`;
      body += `   Total Tax Due: ${formatValue(s5Data.totalTaxDue)}\n`;
      body += `   Net Gain: ${formatValue(s5Data.totalNetGain)}\n\n`;
    }
    
    if (results.scenario6) {
      const s6 = results.scenario6;
      let s6Data;
      
      if (s6.min && s6.max) {
        s6Data = {
          agi: { min: 0, max: 0 },
          totalTaxDue: { min: s6.min.totalTaxDue, max: s6.max.totalTaxDue },
          totalNetGain: { min: s6.min.totalNetGain, max: s6.max.totalNetGain }
        };
      } else {
        s6Data = {
          agi: 0,
          totalTaxDue: s6.totalTaxDue,
          totalNetGain: s6.totalNetGain
        };
      }
      
      body += `6. DONATION + CTB\n`;
      body += `   Taxable Income: ${formatValue(calculateTaxableIncome(s6Data.agi))}\n`;
      body += `   Total Tax Due: ${formatValue(s6Data.totalTaxDue)}\n`;
      body += `   Net Gain: ${formatValue(s6Data.totalNetGain)}\n\n`;
    }
    
    body += '\n---\n';
    body += 'For a detailed custom analysis, start the Taxwise Partners Intake Form:\n';
    body += 'https://taxwisecrm.mytimelogportal.com/forms/tax-reduction-increased-profit';
    
    // Create mailto link and open in new window/tab
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open in a new window to avoid navigating away from the current page
    const newWindow = window.open(mailtoLink, '_blank');
    
    // Fallback if popup is blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = mailtoLink;
    }
  };

  const handleIntakeFormClick = () => {
    window.open('https://taxwisecrm.mytimelogportal.com/forms/tax-reduction-increased-profit', '_blank');
  };

  const handleNewAnalysisClick = () => {
    // Refresh the page to ensure clean state
    window.location.reload();
  };

  return (
    <div className="action-buttons">
      <button 
        className="btn-secondary"
        onClick={handleEmailClick}
      >
        Email this to myself/client
      </button>
      
      <button 
        className="btn-info"
        onClick={handleIntakeFormClick}
      >
        Start the TaxWise Partners Intake Form
      </button>
      
      <button 
        className="btn-success"
        onClick={handleNewAnalysisClick}
      >
        Start a New Analysis
      </button>
    </div>
  );
}

