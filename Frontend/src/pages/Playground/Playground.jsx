import { useEffect, useState } from 'react';
import { getIncidents } from '../../lib/api';
import ChaosPanel from '../../components/ChaosPanel';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './Playground.module.css';

export default function Playground() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    getIncidents().then((data) => setIncidents(data.incidents || []));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Playground</h1>
          <p className={styles.subtitle}>Test the AI incident pipeline with simulated scenarios</p>
        </div>
      </div>

      <ChaosPanel />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <MaterialSymbol icon="dataset" /> Ingested Incidents
        </h2>
        <p className={styles.sectionDesc}>
          Incidents triggered from the Chaos Panel appear here. Click to view details.
        </p>
        {incidents.length === 0 ? (
          <div className={styles.empty}>
            <MaterialSymbol icon="science" className={styles.emptyIcon} />
            <p>No incidents yet. Use the Chaos Panel above to trigger one.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {incidents.map((inc) => (
              <div key={inc.incidentId || inc.id} className={styles.listItem}>
                <div className={styles.listMeta}>
                  <span className={`${styles.sevBadge} ${styles[`sev${(inc.classification?.severity || 'P3').charAt(1)}`]}`}>
                    {inc.classification?.severity || 'N/A'}
                  </span>
                  <span className={styles.listId}>{inc.incidentId || inc.id}</span>
                </div>
                <span className={styles.listTitle}>
                  {inc.triageAnalysis?.headline || inc.classification?.errorCategory || 'Processing…'}
                </span>
                <span className={styles.listTime}>
                  {inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
