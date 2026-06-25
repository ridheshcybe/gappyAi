import React, { useState } from 'react';
import { ingestAlert, triageAlert } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './SubmitIncident.module.css';

const SubmitIncident = () => {
  const [source, setSource] = useState('email');
  const [rawAlert, setRawAlert] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawAlert.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await ingestAlert({ source, payload: rawAlert });
      if (result.alertId) {
        await triageAlert(result.alertId);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to process incident');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRawAlert('');
    setSource('email');
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
                className={styles.select}
              >
                <option value="email">Email</option>
                <option value="discord">Discord</option>
                <option value="slack">Slack</option>
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
              className={styles.textarea}
              placeholder="[2023-10-27T08:14:32Z] ERROR: PaymentGatewayTimeout - connection refused to endpoint api.stripe-proxy.internal. TraceID: a8f93b2c. Retries exhausted."
              rows="10"
            />
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={handleClear}>
              Clear
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <>
                  <span>Analyzing...</span>
                  <div className={styles.spinner}></div>
                </>
              ) : success ? (
                '✓ Triaged'
              ) : (
                'Analyze & Triage'
              )}
            </Button>
          </div>
        </form>
      </div>          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.decor}></div>
    </div>
  );
};

export default SubmitIncident;