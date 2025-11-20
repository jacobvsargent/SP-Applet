import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatting';
import { SCENARIOS } from '../constants';

export default function ResultsTable({ results, userInputs, elapsedTime }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
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
      data: results.scenario1,
      fileName: results.scenario1?.fileName
    },
    {
      scenario: SCENARIOS.SOLAR_ONLY,
      data: results.scenario2,
      fileName: results.scenario2?.fileName
    },
    {
      scenario: SCENARIOS.DONATION_ONLY,
      data: results.scenario3 ? (
        (results.scenario3.min && results.scenario3.max) ? {
          // Range format (both land and medtech)
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
          },
          fileName: results.scenario3.max.fileName
        } : results.scenario3  // Single value format (land or medtech only)
      ) : null,
      fileName: results.scenario3?.fileName || results.scenario3?.max?.fileName
    },
    {
      scenario: SCENARIOS.SOLAR_DONATION_NO_REFUND,
      data: results.scenario4 ? (
        (results.scenario4.min && results.scenario4.max) ? {
          // Range format (both land and medtech)
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
          },
          fileName: results.scenario4.max.fileName
        } : results.scenario4  // Single value format (land or medtech only)
      ) : null,
      fileName: results.scenario4?.fileName || results.scenario4?.max?.fileName
    },
    {
      scenario: SCENARIOS.SOLAR_DONATION_WITH_REFUND,
      data: results.scenario5 ? (
        (results.scenario5.min && results.scenario5.max) ? {
          // Range format (both land and medtech)
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
          },
          fileName: results.scenario5.max.fileName
        } : results.scenario5  // Single value format (land or medtech only)
      ) : null,
      fileName: results.scenario5?.fileName || results.scenario5?.max?.fileName
    },
    {
      scenario: 'Donation + CTB',
      data: results.scenario6 ? (
        (results.scenario6.min && results.scenario6.max) ? {
          // Range format (both land and medtech)
          agi: {
            min: 0,
            max: 0
          },
          totalTaxDue: {
            min: results.scenario6.min.totalTaxDue,
            max: results.scenario6.max.totalTaxDue
          },
          totalNetGain: {
            min: results.scenario6.min.totalNetGain,
            max: results.scenario6.max.totalNetGain
          },
          fileName: results.scenario6.max.fileName
        } : {
          // Single value format (land or medtech only)
          agi: 0,
          totalTaxDue: results.scenario6.totalTaxDue,
          totalNetGain: results.scenario6.totalNetGain,
          fileName: results.scenario6.fileName
        }
      ) : null,
      fileName: results.scenario6?.fileName || results.scenario6?.max?.fileName
    }
  ];

  // Filter out scenarios that weren't run (data is null)
  const rows = allRows.filter(row => row.data !== null);

  return (
    <div style={{ position: 'relative' }}>
      {/* Hover Overlay */}
      {hoveredRow !== null && rows[hoveredRow]?.fileName && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#333',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            pointerEvents: 'none',
            maxWidth: '600px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          📄 {rows[hoveredRow].fileName}
        </div>
      )}
      
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
            // Safety check - ensure row.data exists and has required properties
            if (!row.data || !row.data.agi || !row.data.totalTaxDue || row.data.totalNetGain === undefined) {
              console.warn('Invalid row data:', row);
              return null;
            }
            return (
              <tr 
                key={index}
                onMouseEnter={(e) => {
                  if (row.fileName) {
                    setHoveredRow(index);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoverPosition({ 
                      x: rect.left + rect.width / 2, 
                      y: rect.top - 10 
                    });
                  }
                }}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ position: 'relative', cursor: row.fileName ? 'pointer' : 'default' }}
              >
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

