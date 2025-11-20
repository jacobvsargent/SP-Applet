import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ProgressBar from './components/ProgressBar';
import ResultsTable from './components/ResultsTable';
import ActionButtons from './components/ActionButtons';
import ErrorDisplay from './components/ErrorDisplay';
import { runAllScenarios, runSelectedScenarios } from './services/googleSheetsService';

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
  const [retryCount, setRetryCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = React.useRef(null);

  const handleProgressUpdate = (progressValue, message) => {
    setProgress(progressValue);
    setProgressMessage(message);
  };

  const handleFormSubmit = async (formData, scenarioOnly = null, isAutoRetry = false) => {
    // Only reset retry count if this is a new submission (not an auto-retry)
    if (!isAutoRetry) {
      setRetryCount(0);
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      setElapsedTime(0);
    }
    
    setLastSubmittedData(formData);
    setAppState(APP_STATE.PROCESSING);
    setProgress(0);
    setProgressMessage(isAutoRetry ? 'Retrying analysis...' : 'Initializing...');
    setError(null);

    try {
      let scenarioResults;
      
      // Check if we have selected scenarios (new checkbox system)
      if (formData.selectedScenarios !== undefined) {
        scenarioResults = await runSelectedScenarios(
          formData, 
          formData.selectedScenarios, 
          handleProgressUpdate
        );
      } else {
        // Fallback to old system (shouldn't happen with new UI, but keeps compatibility)
        const { runAllScenarios } = await import('./services/googleSheetsService');
        scenarioResults = await runAllScenarios(formData, handleProgressUpdate);
      }
      
      // Calculate final elapsed time using ref to ensure we have the correct start time
      const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(finalElapsed);
      
      // Debug logging
      console.log('📊 Scenario Results:', scenarioResults);
      if (scenarioResults.scenario3) {
        console.log('📊 Scenario 3 structure:', scenarioResults.scenario3);
      }
      if (scenarioResults.scenario6) {
        console.log('📊 Scenario 6 structure:', scenarioResults.scenario6);
      }
      
      setResults(scenarioResults);
      setAppState(APP_STATE.RESULTS);
    } catch (err) {
      console.error('Error running analysis:', err);
      
      // Auto-retry once if this is the first failure
      if (retryCount === 0) {
        console.log('First attempt failed, automatically retrying...');
        setRetryCount(1);
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        return handleFormSubmit(formData, scenarioOnly, true);
      }
      
      // If this is the second failure, show error
      setError({
        message: err.message || 'Failed to complete the analysis',
        details: err.stack,
        retryAttempted: true
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
    setRetryCount(0);
    setStartTime(null);
    startTimeRef.current = null;
    setElapsedTime(0);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1>Strategic Partner Estimator Tool</h1>
          <p className="subtitle">
            This product is in beta. Please refer to a member of the Taxwise team with any questions or concerns.
          </p>
        </div>
        <img 
          src="/SP-Applet/TWP_Logo_Final.png" 
          alt="Taxwise Partners Logo" 
          style={{ height: '80px', marginLeft: '20px' }}
        />
      </div>

      {appState === APP_STATE.INPUT && (
        <InputForm onSubmit={handleFormSubmit} />
      )}

      {appState === APP_STATE.PROCESSING && (
        <ProgressBar progress={progress} message={progressMessage} startTime={startTime} />
      )}

      {appState === APP_STATE.ERROR && (
        <ErrorDisplay error={error} onRetry={handleRetry} />
      )}

      {appState === APP_STATE.RESULTS && results && (
        <>
          <ResultsTable results={results} userInputs={lastSubmittedData} elapsedTime={elapsedTime} />
          <ActionButtons onNewAnalysis={handleNewAnalysis} results={results} userInputs={lastSubmittedData} />
        </>
      )}
    </div>
  );
}

