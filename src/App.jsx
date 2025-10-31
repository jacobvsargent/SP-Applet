import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ProgressBar from './components/ProgressBar';
import ResultsTable from './components/ResultsTable';
import ActionButtons from './components/ActionButtons';
import ErrorDisplay from './components/ErrorDisplay';
import { runAllScenarios } from './services/googleSheetsService';

const APP_STATE = {
  INPUT: 'input',
  PROCESSING: 'processing',
  RESULTS: 'results',
  ERROR: 'error'
};

export default function App() {
  const [appState, setAppState] = useState(APP_STATE.INPUT);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [lastSubmittedData, setLastSubmittedData] = useState(null);

  const handleProgressUpdate = (progressValue, message) => {
    setProgress(progressValue);
    setProgressMessage(message);
  };

  const handleFormSubmit = async (formData, scenarioOnly = null) => {
    setLastSubmittedData(formData);
    setAppState(APP_STATE.PROCESSING);
    setProgress(0);
    setProgressMessage('Initializing...');
    setError(null);

    try {
      let scenarioResults;
      if (scenarioOnly === 5) {
        // Run only Scenario 5
        const { runScenario5Only } = await import('./services/googleSheetsService');
        scenarioResults = await runScenario5Only(formData, handleProgressUpdate);
      } else {
        // Run all scenarios
        const { runAllScenarios } = await import('./services/googleSheetsService');
        scenarioResults = await runAllScenarios(formData, handleProgressUpdate);
      }
      setResults(scenarioResults);
      setAppState(APP_STATE.RESULTS);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError({
        message: err.message || 'Failed to complete the analysis',
        details: err.stack
      });
      setAppState(APP_STATE.ERROR);
    }
  };

  const handleNewAnalysis = () => {
    setAppState(APP_STATE.INPUT);
    setResults(null);
    setError(null);
    setProgress(0);
    setProgressMessage('');
  };

  const handleRetry = () => {
    if (lastSubmittedData) {
      handleFormSubmit(lastSubmittedData);
    } else {
      handleNewAnalysis();
    }
  };

  return (
    <div className="container">
      <h1>Taxwise Partners Strategic Partner Estimator Tool</h1>
      <p className="subtitle">
        Calculate potential net gains across 5 different tax optimization scenarios
      </p>

      {appState === APP_STATE.INPUT && (
        <InputForm onSubmit={handleFormSubmit} />
      )}

      {appState === APP_STATE.PROCESSING && (
        <ProgressBar progress={progress} message={progressMessage} />
      )}

      {appState === APP_STATE.ERROR && (
        <ErrorDisplay error={error} onRetry={handleRetry} />
      )}

      {appState === APP_STATE.RESULTS && results && (
        <>
          <ResultsTable results={results} />
          <ActionButtons onNewAnalysis={handleNewAnalysis} results={results} />
        </>
      )}
    </div>
  );
}

