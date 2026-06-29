import { useEffect, useState, useRef } from 'react';
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

const SORT_OPTIONS = [
  { key: 'severity', label: 'Severity' },
  { key: 'date', label: 'Date' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'alpha', label: 'A–Z' },
];

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('severity');
  const [sortAsc, setSortAsc] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortWrapRef = useRef(null);

  // Close sort menu on outside click and Escape
  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleClick = (e) => {
      if (sortWrapRef.current && !sortWrapRef.current.contains(e.target)) {
        setSortMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [sortMenuOpen]);


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

  // Sort incidents
  const sorted = [...incidents].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'severity': {
        const order = ['P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW'];
        cmp = order.indexOf(a.classification?.severity) - order.indexOf(b.classification?.severity);
        break;
      }
      case 'date': {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        cmp = aTime - bTime;
        break;
      }
      case 'confidence': {
        cmp = (a.confidenceScore || 0) - (b.confidenceScore || 0);
        break;
      }
      case 'alpha': {
        const aTitle = (a.triageAnalysis?.headline || a.classification?.errorCategory || '').toLowerCase();
        const bTitle = (b.triageAnalysis?.headline || b.classification?.errorCategory || '').toLowerCase();
        cmp = aTitle.localeCompare(bTitle);
        break;
      }
    }
    return sortAsc ? cmp : -cmp;
  });

  const filtered = filter === 'all'
    ? sorted
    : sorted.filter((i) => i.classification?.severity === filter);

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
        <div className={styles.sortWrap} ref={sortWrapRef}>
          <button
            className={styles.sortBtn}
            onClick={() => setSortMenuOpen((prev) => !prev)}
          >
            <MaterialSymbol icon="sort" />
            {SORT_OPTIONS.find((o) => o.key === sortBy)?.label || 'Sort'}
            <MaterialSymbol icon={sortAsc ? 'arrow_upward' : 'arrow_downward'} className={styles.sortDir} />
          </button>
          {sortMenuOpen && (
            <div className={styles.sortMenu}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`${styles.sortMenuItem} ${sortBy === opt.key ? styles.sortMenuItemActive : ''}`}
                  onClick={() => {
                    if (sortBy === opt.key) {
                      setSortAsc((prev) => !prev);
                    } else {
                      setSortBy(opt.key);
                      setSortAsc(false);
                    }
                    setSortMenuOpen(false);
                  }}
                >
                  <MaterialSymbol icon={opt.key === 'severity' ? 'priority_high' : opt.key === 'date' ? 'calendar_today' : opt.key === 'alpha' ? 'sort_by_alpha' : 'trending_up'} />
                  {opt.label}
                  {sortBy === opt.key && (
                    <MaterialSymbol icon={sortAsc ? 'arrow_upward' : 'arrow_downward'} className={styles.sortActiveIcon} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
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
