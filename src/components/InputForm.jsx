import React, { useState } from 'react';
import { US_STATES, FILING_STATUS, FILING_STATUS_LABELS } from '../constants';
import { isValidCurrency, parseCurrency } from '../utils/formatting';

export default function InputForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    income: '',
    avgIncome: '',
    state: '',
    filingStatus: '',
    skipScenario5Min: false
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'income':
      case 'avgIncome':
        if (!value || value.trim() === '') {
          return 'This field is required';
        }
        if (!isValidCurrency(value)) {
          return 'Please enter a valid number (e.g., $75,000 or 75000)';
        }
        return '';
      
      case 'state':
        if (!value || value === '') {
          return 'Please select a state';
        }
        return '';
      
      case 'filingStatus':
        if (!value || value === '') {
          return 'Please select a filing status';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      income: true,
      avgIncome: true,
      state: true,
      filingStatus: true
    });

    if (validateForm()) {
      // Parse currency values before submitting
      const submissionData = {
        income: parseCurrency(formData.income),
        avgIncome: parseCurrency(formData.avgIncome),
        state: formData.state,
        filingStatus: formData.filingStatus,
        skipScenario5Min: formData.skipScenario5Min
      };
      onSubmit(submissionData);
    }
  };

  const isFormValid = () => {
    // Check only the required fields (not the checkbox)
    const requiredFields = ['income', 'avgIncome', 'state', 'filingStatus'];
    return requiredFields.every(key => {
      const value = formData[key];
      return value && value !== '' && !validateField(key, value);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="income">Annual Income</label>
        <input
          type="text"
          id="income"
          name="income"
          value={formData.income}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., $75,000 or 75000"
          className={errors.income && touched.income ? 'error' : ''}
        />
        {errors.income && touched.income && (
          <div className="error-message">{errors.income}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="avgIncome">Average Annual Income (Last 3 Years)</label>
        <input
          type="text"
          id="avgIncome"
          name="avgIncome"
          value={formData.avgIncome}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., $70,000 or 70000"
          className={errors.avgIncome && touched.avgIncome ? 'error' : ''}
        />
        {errors.avgIncome && touched.avgIncome && (
          <div className="error-message">{errors.avgIncome}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="state">State of Residence</label>
        <select
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.state && touched.state ? 'error' : ''}
        >
          <option value="">Select a state...</option>
          {US_STATES.map(state => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors.state && touched.state && (
          <div className="error-message">{errors.state}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="filingStatus">Filing Status</label>
        <select
          id="filingStatus"
          name="filingStatus"
          value={formData.filingStatus}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.filingStatus && touched.filingStatus ? 'error' : ''}
        >
          <option value="">Select filing status...</option>
          <option value={FILING_STATUS.SINGLE}>
            {FILING_STATUS_LABELS[FILING_STATUS.SINGLE]}
          </option>
          <option value={FILING_STATUS.MARRIED_JOINTLY}>
            {FILING_STATUS_LABELS[FILING_STATUS.MARRIED_JOINTLY]}
          </option>
        </select>
        {errors.filingStatus && touched.filingStatus && (
          <div className="error-message">{errors.filingStatus}</div>
        )}
      </div>

      <div className="form-group" style={{ marginTop: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'normal' }}>
          <input
            type="checkbox"
            name="skipScenario5Min"
            checked={formData.skipScenario5Min}
            onChange={handleChange}
            style={{ marginRight: '8px', width: 'auto', cursor: 'pointer' }}
          />
          <span>Skip 30% donation calculation for all scenarios (faster results)</span>
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
          When checked, all donation scenarios will only show the maximum (60% donation) result instead of a range.
        </div>
      </div>

      <button 
        type="submit" 
        className="btn-primary"
        disabled={!isFormValid()}
      >
        Run Full Analysis (All Scenarios)
      </button>

      <button 
        type="button"
        className="btn-secondary"
        style={{ width: '100%', marginTop: '10px' }}
        disabled={!isFormValid()}
        onClick={(e) => {
          e.preventDefault();
          if (isFormValid()) {
            const submissionData = {
              income: parseCurrency(formData.income),
              avgIncome: parseCurrency(formData.avgIncome),
              state: formData.state,
              filingStatus: formData.filingStatus,
              skipScenario5Min: formData.skipScenario5Min
            };
            onSubmit(submissionData, 5);
          }
        }}
      >
        Run Scenario 5 Only (Maximum Savings Only)
      </button>

      <div className="disclaimer">
        <p><strong>Disclaimer:</strong> these estimates are based on a number of assumptions and may change with further information about state specific deduction limits, income type and timing, previous charitable giving, etc. Use the "Start Taxwise Partners Intake Form" to get a full custom analysis by a member of the Taxwise team.</p>
      </div>

      <button 
        type="button"
        className="btn-info"
        style={{ width: '100%', marginTop: '20px' }}
        onClick={() => window.open('https://taxwisecrm.mytimelogportal.com/forms/tax-reduction-increased-profit', '_blank')}
      >
        Start the Taxwise Partners Intake Form
      </button>
    </form>
  );
}

