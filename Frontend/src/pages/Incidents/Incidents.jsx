import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../../lib/api';
import { socket } from '../../lib/socket';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './Incidents.module.css';

const SEV_LABELS = {
  P0_CRITICAL: { label: 'P0_CRITICAL', cls: 'p0' },
  P1_HIGH: { label: 'P1_HIGH', cls: 'p1' },
  P2_MEDIUM: { label: 'P2_MEDIUM', cls: 'p2' },
  P3_LOW: { label: 'P3_LOW', cls: 'p3' },
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  async function load() {
    try {
      const data = await getIncidents();
      setIncidents(data.incidents || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);

    socket.on('incident_created', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });

    return () => {
      clearInterval(interval);
      socket.off('incident_created');
    };
  }, []);

  const filtered = filter === 'all'
    ? incidents
    : incidents.filter((i) => i.classification?.severity === filter);

  const sevBadge = (incident) => {
    const severity = incident.classification?.severity || 'P3_LOW';
    const info = SEV_LABELS[severity] || SEV_LABELS.P3_LOW;
    return <span className={`${styles.badge} ${styles[info.cls]}`}>{info.label}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>All Incidents</h1>
          <p className={styles.subtitle}>{incidents.length} total · Live updates via WebSocket</p>
        </div>
        <div className={styles.actions}>
          <Link to="/submit" className={styles.newBtn}>
            <MaterialSymbol icon="add" /> New Incident
          </Link>
        </div>
      </div>

      <div className={styles.filters}>
        {['all', 'P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW'].map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading incidents…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <MaterialSymbol icon="shield" className={styles.emptyIcon} />
          <h3>No incidents found</h3>
          <p>{filter === 'all' ? 'No incidents have been created yet.' : `No ${filter.replace('_', ' ')} incidents.`}</p>
          <Link to="/playground" className={styles.emptyCta}>Trigger a test incident →</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((incident) => (
            <Link
              key={incident.incidentId || incident.id}
              to={`/incidents/${incident.incidentId || incident.id}`}
              className={styles.card}
            >
              <div className={styles.cardLeft}>
                <div className={styles.cardMeta}>
                  {sevBadge(incident)}
                  <span className={styles.cardId}>{incident.incidentId || incident.id}</span>
                  {incident.confidenceScore !== undefined && (
                    <span className={styles.confidence}>{incident.confidenceScore}% confidence</span>
                  )}
                </div>
                <h3 className={styles.cardTitle}>
                  {incident.triageAnalysis?.headline || incident.classification?.errorCategory || 'Untriaged Incident'}
                </h3>
                <div className={styles.cardComponent}>
                  <MaterialSymbol icon="account_tree" />
                  {incident.classification?.affectedComponent || 'Unknown component'}
                </div>
                {incident.triageAnalysis?.userImpactDescription && (
                  <p className={styles.cardImpact}>{incident.triageAnalysis.userImpactDescription}</p>
                )}
              </div>
              <div className={styles.cardRight}>
                <MaterialSymbol icon="chevron_right" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
