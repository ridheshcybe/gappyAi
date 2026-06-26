import { useEffect, useState } from 'react';
import { getIncidents } from '../../lib/api';
import ExecutiveDashboard from '../../components/ExecutiveDashboard';
import StatsBar from '../../components/StatsBar';
import { socket } from '../../lib/socket';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './Analytics.module.css';

export default function Analytics() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    async function load() {
      try {
        const data = await getIncidents();
        setIncidents(data.incidents || []);
      } catch (err) {
        console.error('Failed to load incidents for analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    socket.on('incident_created', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });
    return () => {
      clearInterval(interval);
      socket.off('incident_created');
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Real-time incident metrics and executive overview</p>
        </div>
        <div className={styles.controls}>
          {['24h', '7d', '30d'].map((r) => (
            <button
              key={r}
              className={`${styles.timeBtn} ${timeRange === r ? styles.timeActive : ''}`}
              onClick={() => setTimeRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading metrics…</span>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MaterialSymbol icon="monitoring" /> Key Performance Indicators
            </h2>
            <StatsBar incidents={incidents} />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MaterialSymbol icon="dashboard" /> Executive Overview
            </h2>
            <ExecutiveDashboard />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MaterialSymbol icon="list_alt" /> Raw Incident Data
            </h2>
            <div className={styles.dataCard}>
              <div className={styles.dataHeader}>
                <span>{incidents.length} incidents tracked</span>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} /> Live
                </span>
              </div>
              <div className={styles.dataGrid}>
                {incidents.map((inc) => (
                  <div key={inc.incidentId || inc.id} className={styles.dataRow}>
                    <span className={styles.dataId}>{inc.incidentId || inc.id}</span>
                    <span>{inc.triageAnalysis?.headline || inc.classification?.errorCategory || 'Untriaged'}</span>
                    <span className={styles.dataSev}>{inc.classification?.severity || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
