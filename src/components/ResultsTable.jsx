import React from 'react';
import { formatCurrency } from '../utils/formatting';
import { SCENARIOS } from '../constants';

export default function ResultsTable({ results, userInputs, elapsedTime }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };
  /**
   * Format value - can be single value or range
   */
  const formatValue = (value) => {
    if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      // Check if min and max are the same (when skipScenario5Min is checked)
      if (value.min === value.max) {
        return formatCurrency(value.max);
      }
      // Always put smaller number first
      const smaller = Math.min(value.min, value.max);
      const larger = Math.max(value.min, value.max);
      return `${formatCurrency(smaller)} - ${formatCurrency(larger)}`;
    }
    return formatCurrency(value);
  };

  /**
   * Calculate baseline "What You Keep" for Do Nothing scenario (X)
   */
  const calculateBaselineWhatYouKeep = () => {
    if (!results.scenario1) return 0;
    return results.scenario1.agi - results.scenario1.totalTaxDue;
  };

  /**
   * Calculate "What You Keep" for a scenario
   * For Do Nothing: Taxable Income - Tax Due
   * For other scenarios: X + Net Gain (where X is Do Nothing's "What You Keep")
   */
  const calculateWhatYouKeep = (agi, taxDue, netGain, isDoNothing) => {
    if (isDoNothing) {
      // For Do Nothing scenario, calculate normally
      return agi - taxDue;
    } else {
      // For other scenarios: X + Net Gain
      const baselineX = calculateBaselineWhatYouKeep();
      
      if (typeof netGain === 'object' && netGain.min !== undefined && netGain.max !== undefined) {
        // Net Gain is a range, so What You Keep will be a range
        return {
          min: baselineX + netGain.min,
          max: baselineX + netGain.max
        };
      } else {
        // Net Gain is a single value
        return baselineX + netGain;
      }
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

  // Filter out null scenarios (for when only scenario 5 or 6 is run)
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
      data: (results.scenario3 && results.scenario3.min && results.scenario3.max) ? {
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
      data: (results.scenario4 && results.scenario4.min && results.scenario4.max) ? {
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
      data: (results.scenario5 && results.scenario5.min && results.scenario5.max) ? {
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
    },
    {
      scenario: 'DONATION + CTB',
      data: (results.scenario6 && results.scenario6.min && results.scenario6.max) ? {
        agi: {
          min: results.scenario6.min.agi,
          max: results.scenario6.max.agi
        },
        totalTaxDue: {
          min: results.scenario6.min.totalTaxDue,
          max: results.scenario6.max.totalTaxDue
        },
        totalNetGain: {
          min: results.scenario6.min.totalNetGain,
          max: results.scenario6.max.totalNetGain
        }
      } : null
    }
  ];

  // Filter out scenarios that weren't run (data is null)
  const rows = allRows.filter(row => row.data !== null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Analysis Results</h2>
        {elapsedTime > 0 && (
          <div style={{
            background: '#e8f4f8',
            border: '1px solid #0066cc',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#0066cc'
          }}>
            Completed in {formatTime(elapsedTime)}
          </div>
        )}
      </div>
      
      {userInputs && (
        <div style={{
          background: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>Analysis for: {userInputs.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
            <div>
              <strong>Annual Income:</strong> {formatCurrency(userInputs.income)}
            </div>
            <div>
              <strong>Average Income (3 Years):</strong> {formatCurrency(userInputs.avgIncome)}
            </div>
            <div>
              <strong>State of Residence:</strong> {userInputs.state}
            </div>
            <div>
              <strong>Filing Status:</strong> {userInputs.filingStatus}
            </div>
          </div>
        </div>
      )}
      
      {/* COMMENTED OUT - Saved Workbooks notification (may be used for some users later)
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
      */}
      
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
          {rows.map((row, index) => {
            const isDoNothing = row.scenario === SCENARIOS.DO_NOTHING;
            return (
              <tr key={index}>
                <td className="scenario-name">{row.scenario}</td>
                <td className="value-neutral">
                  {formatValue(row.data.agi)}
                </td>
                <td className="value-negative">
                  {formatValue(row.data.totalTaxDue)}
                </td>
                <td className="value-positive">
                  {formatValue(calculateWhatYouKeep(row.data.agi, row.data.totalTaxDue, row.data.totalNetGain, isDoNothing))}
                </td>
                <td className={getNetGainClass(row.data.totalNetGain)}>
                  {formatValue(row.data.totalNetGain)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

