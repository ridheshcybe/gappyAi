import React, { useState, useEffect, useRef } from 'react';
import { ingestAlert, triageAlert } from '../../lib/api';
import { socket } from '../../lib/socket';
import { Button } from '../../components/common/Button';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './SubmitIncident.module.css';

const STAGES = [
  { key: 'triage', label: 'AI Triage', icon: 'search' },
  { key: 'root-cause', label: 'Root Cause', icon: 'biotech' },
  { key: 'runbook', label: 'Runbook', icon: 'description' },
  { key: 'validate', label: 'Validation', icon: 'fact_check' },
  { key: 'store', label: 'Storing', icon: 'save' },
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'route', label: 'Routing', icon: 'alt_route' },
  { key: 'finalize', label: 'Finalizing', icon: 'check_circle' },
];

const SubmitIncident = () => {
  const [source, setSource] = useState('email');
  const [rawAlert, setRawAlert] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  const currentAlertId = useRef(null);
  const successTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const handleProgress = (data) => {
      if (mountedRef.current && data.alertId === currentAlertId.current) {
        setProgress(data.progress);
        setCurrentStage(data.stage);
        setProgressMessage(data.message);
      }
    };

    socket.on('triage:progress', handleProgress);
    return () => {
      mountedRef.current = false;
      clearTimeout(successTimeoutRef.current);
      socket.off('triage:progress', handleProgress);
    };
  }, []);

  const resetFormState = () => {
    setLoading(false);
    setSuccess(false);
    setProgress(null);
    setCurrentStage(null);
    setProgressMessage('');
    setError('');
    currentAlertId.current = null;
  };

  const getStageIndex = (stageKey) => STAGES.findIndex(s => s.key === stageKey);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawAlert.trim()) {
      setError('Please enter alert data before submitting.');
      return;
    }
    setLoading(true);
    setError('');
    setProgress(0);
    setCurrentStage(null);
    setProgressMessage('Ingesting alert…');
    setSuccess(false);
    try {
      const result = await ingestAlert({ source, payload: rawAlert });
      if (!mountedRef.current) return;
      currentAlertId.current = result.alertId;
      if (result.alertId) {
        await triageAlert(result.alertId);
      }
      if (!mountedRef.current) return;
      setSuccess(true);
      setProgress(100);
      setCurrentStage('finalize');
      setProgressMessage('Triage complete!');
      // Reset form back to idle after showing success state
      successTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          resetFormState();
        }
      }, 3000);
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err.message || 'Failed to process incident';
      setError(message);
      setProgress(null);
      setCurrentStage(null);
      setProgressMessage('');
      setLoading(false);
      currentAlertId.current = null;
    }
  };

  const handleClear = () => {
    if (loading) return;
    clearTimeout(successTimeoutRef.current);
    setRawAlert('');
    setSource('email');
    resetFormState();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Submit Incident</h1>
        <p>Manually ingest alerts for AI-driven triage and runbook generation.</p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="alertSource">Alert Source</label>
            <div className={styles.selectWrapper}>
              <select
                id="alertSource"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={`${styles.select} ${loading ? styles.selectDisabled : ''}`}
                disabled={loading}
              >
                <option value="email">Email</option>
                <option value="discord">Discord</option>

                <option value="pagerduty">PagerDuty</option>
                <option value="custom">Custom Webhook</option>
              </select>
              <MaterialSymbol icon="arrow_drop_down" className={styles.selectIcon} />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="rawAlert">Raw Alert Data</label>
              <span className={styles.badge}>JSON / Text</span>
            </div>
            <textarea
              id="rawAlert"
              value={rawAlert}
              onChange={(e) => setRawAlert(e.target.value)}
              className={`${styles.textarea} ${loading ? styles.textareaDisabled : ''}`}
              disabled={loading}
              placeholder="[2023-10-27T08:14:32Z] ERROR: PaymentGatewayTimeout - connection refused to endpoint api.stripe-proxy.internal. TraceID: a8f93b2c. Retries exhausted."
              rows="10"
            />
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={handleClear} disabled={loading}>
              Clear
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {success ? (
                <>
                  <MaterialSymbol icon="check_circle" />
                  <span>Triaged</span>
                </>
              ) : (
                <>
                  {loading ? <MaterialSymbol icon="autorenew" className={styles.spinning} /> : <MaterialSymbol icon="play_arrow" />}
                  <span>{loading ? 'Analyzing…' : 'Analyze & Triage'}</span>
                </>
              )}
            </Button>
          </div>

          {loading && progress !== null && !success && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
                <span className={styles.progressPct}>{progress}%</span>
              </div>
              <p className={styles.progressMessage}>
                <MaterialSymbol icon="hourglass_bottom" className={styles.progressIcon} />
                {progressMessage}
              </p>
              <div className={styles.stagesRow}>
                {STAGES.map((stage, idx) => {
                  const stageIdx = getStageIndex(currentStage);
                  const isActive = stage.key === currentStage;
                  const isDone = stageIdx > idx || (stage.key === 'finalize' && progress === 100);
                  const isPending = !isActive && !isDone;
                  return (
                    <div
                      key={stage.key}
                      className={`${styles.stageChip} ${isActive ? styles.stageActive : ''} ${isDone ? styles.stageDone : ''} ${isPending ? styles.stagePending : ''}`}
                    >
                      <MaterialSymbol
                        icon={isDone ? 'check_circle' : isActive ? 'hourglass_bottom' : 'radio_button_unchecked'}
                        className={styles.stageIcon}
                      />
                      <span>{stage.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <MaterialSymbol icon="error" className={styles.errorIcon} />
              {error}
            </div>
          )}
        </form>
      </div>
      <div className={styles.decor}></div>
    </div>
  );
};

export default SubmitIncident;