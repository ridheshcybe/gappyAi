import { useState } from 'react';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './Runbooks.module.css';

const RUNBOOKS = [
  {
    id: 'rb-payment',
    name: 'Payment Gateway Failover',
    service: 'Payment Gateway',
    severity: 'P0',
    steps: ['Verify Auth Service Health', 'Restart Gateway Pods', 'Failover to Secondary DB'],
    automated: true,
  },
  {
    id: 'rb-db',
    name: 'Database Connection Pool Exhaustion',
    service: 'PostgreSQL Cluster',
    severity: 'P1',
    steps: ['Check active connections', 'Kill idle transactions', 'Scale up connection pool', 'Restart affected services'],
    automated: false,
  },
  {
    id: 'rb-auth',
    name: 'Auth Gateway Recovery',
    service: 'Auth Service',
    severity: 'P0',
    steps: ['Check auth service pods', 'Verify cert rotation', 'Restart auth gateway', 'Validate token issuance'],
    automated: true,
  },
  {
    id: 'rb-redis',
    name: 'Redis Cache OOM Recovery',
    service: 'Orders API',
    severity: 'P1',
    steps: ['Kill Redis process', 'Increase maxmemory', 'Restart Redis with new config', 'Warm cache from DB'],
    automated: false,
  },
  {
    id: 'rb-api',
    name: 'API Rate Limit Bypass',
    service: 'API Gateway',
    severity: 'P2',
    steps: ['Identify abusive tenant', 'Apply rate limit override', 'Notify tenant admin'],
    automated: false,
  },
];

export default function Runbooks() {
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Runbooks</h1>
          <p className={styles.subtitle}>{RUNBOOKS.length} automated remediations ready</p>
        </div>
        <button className={styles.newBtn}>
          <MaterialSymbol icon="add" /> New Runbook
        </button>
      </div>

      <div className={styles.grid}>
        {RUNBOOKS.map((rb) => (
          <div key={rb.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardHeader}>
                <span className={`${styles.sevBadge} ${styles[`sev${rb.severity.toLowerCase()}`]}`}>{rb.severity}</span>
                {rb.automated && <span className={styles.autoBadge}>Automated</span>}
              </div>
              <h3 className={styles.cardName}>{rb.name}</h3>
              <p className={styles.cardService}>{rb.service}</p>
            </div>

            <div className={styles.cardSteps}>
              <button
                className={styles.expandBtn}
                onClick={() => toggleExpand(rb.id)}
              >
                <MaterialSymbol icon={expanded === rb.id ? 'expand_less' : 'expand_more'} />
                {rb.steps.length} steps
              </button>

              {expanded === rb.id && (
                <ol className={styles.stepsList}>
                  {rb.steps.map((step, i) => (
                    <li key={i} className={styles.stepItem}>
                      <span className={styles.stepNum}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className={styles.cardActions}>
              <button className={styles.runBtn} onClick={() => setSelected(rb)}>
                <MaterialSymbol icon="play_arrow" /> Execute
              </button>
              <button className={styles.editBtn}>
                <MaterialSymbol icon="edit" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className={styles.confirmOverlay} onClick={() => setSelected(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <MaterialSymbol icon="warning" className={styles.confirmIcon} />
            <h3>Execute Runbook</h3>
            <p>Are you sure you want to run <strong>{selected.name}</strong> on <strong>{selected.service}</strong>?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setSelected(null)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={() => { alert(`Executing: ${selected.name}`); setSelected(null); }}>
                <MaterialSymbol icon="play_arrow" /> Execute Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
