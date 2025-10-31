import React from 'react';
import { formatCurrency } from '../utils/formatting';
import { SCENARIOS } from '../constants';

export default function ResultsTable({ results }) {
  /**
   * Format value - can be single value or range
   */
  const formatValue = (value) => {
    if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      // Always put smaller number first
      const smaller = Math.min(value.min, value.max);
      const larger = Math.max(value.min, value.max);
      return `${formatCurrency(smaller)} - ${formatCurrency(larger)}`;
    }
    return formatCurrency(value);
  };

  /**
   * Calculate "What You Keep" (Taxable Income - Tax Due)
   */
  const calculateWhatYouKeep = (agi, taxDue) => {
    if (typeof agi === 'object' && typeof taxDue === 'object') {
      // Both are ranges
      return {
        min: agi.min - taxDue.max, // Worst case: lowest income, highest tax
        max: agi.max - taxDue.min  // Best case: highest income, lowest tax
      };
    } else {
      // Single values
      return agi - taxDue;
    }
  };

  /**
   * Get CSS class for net gain value
   */
  const getNetGainClass = (value) => {
    let numValue = value;
    if (typeof value === 'object') {
      numValue = value.max; // Use max value for color determination
    }
    return numValue > 0 ? 'value-positive' : numValue < 0 ? 'value-negative' : 'value-neutral';
  };

  // Filter out null scenarios (for when only scenario 5 is run)
  const allRows = [
    {
      scenario: SCENARIOS.DO_NOTHING,
      data: results.scenario1
    },
    {
      scenario: SCENARIOS.SOLAR_ONLY,
      data: results.scenario2
    },
    {
      scenario: SCENARIOS.DONATION_ONLY,
      data: results.scenario3 ? {
        agi: {
          min: results.scenario3.min.agi,
          max: results.scenario3.max.agi
        },
        totalTaxDue: {
          min: results.scenario3.min.totalTaxDue,
          max: results.scenario3.max.totalTaxDue
        },
        totalNetGain: {
          min: results.scenario3.min.totalNetGain,
          max: results.scenario3.max.totalNetGain
        }
      } : null
    },
    {
      scenario: SCENARIOS.SOLAR_DONATION_NO_REFUND,
      data: results.scenario4 ? {
        agi: {
          min: results.scenario4.min.agi,
          max: results.scenario4.max.agi
        },
        totalTaxDue: {
          min: results.scenario4.min.totalTaxDue,
          max: results.scenario4.max.totalTaxDue
        },
        totalNetGain: {
          min: results.scenario4.min.totalNetGain,
          max: results.scenario4.max.totalNetGain
        }
      } : null
    },
    {
      scenario: SCENARIOS.SOLAR_DONATION_WITH_REFUND,
      data: results.scenario5 ? {
        agi: {
          min: results.scenario5.min.agi,
          max: results.scenario5.max.agi
        },
        totalTaxDue: {
          min: results.scenario5.min.totalTaxDue,
          max: results.scenario5.max.totalTaxDue
        },
        totalNetGain: {
          min: results.scenario5.min.totalNetGain,
          max: results.scenario5.max.totalNetGain
        }
      } : null
    }
  ];

  // Filter out scenarios that weren't run (data is null)
  const rows = allRows.filter(row => row.data !== null);

  return (
    <div>
      <h2>Analysis Results</h2>
      
      <div className="info-box" style={{
        background: '#e8f4f8',
        border: '1px solid #0066cc',
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        <strong>📂 Saved Workbooks:</strong> All scenario workbooks have been saved to Google Drive. 
        Check cell A1 in your "Blended Solution Calculator" sheet for the folder link, or look for the 
        "Analysis - [income] - [state] - [filing status]" folder in your Google Drive.
      </div>
      
      <table className="results-table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Taxable Income</th>
            <th>Total Tax Due</th>
            <th>What You Keep</th>
            <th>Net Gain</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="scenario-name">{row.scenario}</td>
              <td className="value-neutral">
                {formatValue(row.data.agi)}
              </td>
              <td className="value-negative">
                {formatValue(row.data.totalTaxDue)}
              </td>
              <td className="value-positive">
                {formatValue(calculateWhatYouKeep(row.data.agi, row.data.totalTaxDue))}
              </td>
              <td className={getNetGainClass(row.data.totalNetGain)}>
                {formatValue(row.data.totalNetGain)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

