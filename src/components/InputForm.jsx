import React, { useState } from 'react';
import { US_STATES, FILING_STATUS, FILING_STATUS_LABELS } from '../constants';
import { isValidCurrency, parseCurrency, formatCurrencyInput } from '../utils/formatting';

export default function InputForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    income: '',
    avgIncome: '',
    state: '',
    filingStatus: '',
    donationPreference: 'both'  // 'land', 'medtech', or 'both'
  });

  const [selectedScenarios, setSelectedScenarios] = useState({
    scenario2: false,  // Solar Only
    scenario3: false,  // Donation Only
    scenario4: false,  // Solar + Donation - No Refund
    scenario5: false,  // Solar + Donation - With Refund
    scenario6: false   // Donation + CTB
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          return 'This field is required';
        }
        return '';
      
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

    // Format currency fields
    if ((name === 'income' || name === 'avgIncome') && value && isValidCurrency(value)) {
      const numericValue = parseCurrency(value);
      const formatted = formatCurrencyInput(numericValue);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    }
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
      name: true,
      income: true,
      avgIncome: true,
      state: true,
      filingStatus: true
    });

    if (validateForm()) {
      // Parse currency values before submitting
      const submissionData = {
        name: formData.name.trim(),
        income: parseCurrency(formData.income),
        avgIncome: parseCurrency(formData.avgIncome),
        state: formData.state,
        filingStatus: formData.filingStatus,
        donationPreference: formData.donationPreference,
        selectedScenarios: Object.keys(selectedScenarios)
          .filter(key => selectedScenarios[key])
          .map(key => parseInt(key.replace('scenario', '')))  // Convert to [2, 3, 5] format
      };
      onSubmit(submissionData);
    }
  };

  const handleScenarioCheckbox = (e) => {
    const { name, checked } = e.target;
    setSelectedScenarios(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const isFormValid = () => {
    // Check only the required fields (not the checkbox)
    const requiredFields = ['name', 'income', 'avgIncome', 'state', 'filingStatus'];
    return requiredFields.every(key => {
      const value = formData[key];
      return value && value !== '' && !validateField(key, value);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., John Smith"
          className={errors.name && touched.name ? 'error' : ''}
        />
        {errors.name && touched.name && (
          <div className="error-message">{errors.name}</div>
        )}
      </div>

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
        <label htmlFor="avgIncome">Estimated 2022 Income</label>
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

      {/* Donation Strategy Selection */}
      <div className="form-group" style={{ marginTop: '20px' }}>
        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
          Donation Strategy
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px 16px',
            backgroundColor: formData.donationPreference === 'land' ? '#4CAF50' : 'white',
            color: formData.donationPreference === 'land' ? 'white' : '#333',
            borderRadius: '6px',
            border: '2px solid ' + (formData.donationPreference === 'land' ? '#4CAF50' : '#ddd'),
            fontWeight: '500',
            transition: 'all 0.2s',
            flex: 1,
            justifyContent: 'center'
          }}>
            <input
              type="radio"
              name="donationPreference"
              value="land"
              checked={formData.donationPreference === 'land'}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Land (30%)
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px 16px',
            backgroundColor: formData.donationPreference === 'medtech' ? '#2196F3' : 'white',
            color: formData.donationPreference === 'medtech' ? 'white' : '#333',
            borderRadius: '6px',
            border: '2px solid ' + (formData.donationPreference === 'medtech' ? '#2196F3' : '#ddd'),
            fontWeight: '500',
            transition: 'all 0.2s',
            flex: 1,
            justifyContent: 'center'
          }}>
            <input
              type="radio"
              name="donationPreference"
              value="medtech"
              checked={formData.donationPreference === 'medtech'}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Medtech (60%)
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px 12px',
            backgroundColor: formData.donationPreference === 'both' ? '#FF9800' : 'white',
            color: formData.donationPreference === 'both' ? 'white' : '#333',
            borderRadius: '6px',
            border: '2px solid ' + (formData.donationPreference === 'both' ? '#FF9800' : '#ddd'),
            fontWeight: '500',
            transition: 'all 0.2s',
            flex: 1,
            justifyContent: 'center'
          }}>
            <input
              type="radio"
              name="donationPreference"
              value="both"
              checked={formData.donationPreference === 'both'}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Both (Range)
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px 12px',
            backgroundColor: formData.donationPreference === 'both-separate' ? '#9C27B0' : 'white',
            color: formData.donationPreference === 'both-separate' ? 'white' : '#333',
            borderRadius: '6px',
            border: '2px solid ' + (formData.donationPreference === 'both-separate' ? '#9C27B0' : '#ddd'),
            fontWeight: '500',
            transition: 'all 0.2s',
            flex: 1,
            justifyContent: 'center'
          }}>
            <input
              type="radio"
              name="donationPreference"
              value="both-separate"
              checked={formData.donationPreference === 'both-separate'}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Both (Separate)
          </label>
        </div>
      </div>

      {/* Scenario Selection Checkboxes */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        border: '2px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', color: '#333' }}>
          Select Scenarios to Run:
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="scenario2"
              checked={selectedScenarios.scenario2}
              onChange={handleScenarioCheckbox}
              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Solar Only</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="scenario3"
              checked={selectedScenarios.scenario3}
              onChange={handleScenarioCheckbox}
              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Donation Only</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="scenario4"
              checked={selectedScenarios.scenario4}
              onChange={handleScenarioCheckbox}
              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Solar + Donation (No Refund)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="scenario5"
              checked={selectedScenarios.scenario5}
              onChange={handleScenarioCheckbox}
              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Solar + Donation (With Refund)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="scenario6"
              checked={selectedScenarios.scenario6}
              onChange={handleScenarioCheckbox}
              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Donation + CTB</span>
          </label>
        </div>
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#666', 
          fontStyle: 'italic' 
        }}>
          Note: Baseline (Do Nothing) scenario will always run for comparison.
        </div>
      </div>

      <button 
        type="submit" 
        className="btn-primary"
        disabled={!isFormValid()}
        style={{ marginTop: '20px' }}
      >
        Run Scenarios
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

