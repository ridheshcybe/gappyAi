import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents } from '../../lib/api';
import { socket } from '../../lib/socket';
import { mergeIncidents } from '../../lib/simulate-incident';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import { Button } from '../../components/common/Button';
import { ContextualTooltip } from '../../components/Walkthrough/ContextualTooltip';
import styles from './Dashboard.module.css';

const SEV_MAP = {
  P0_CRITICAL: { label: 'P0_CRITICAL', cls: 'p0' },
  P1_HIGH: { label: 'P1_HIGH', cls: 'p1' },
  P2_MEDIUM: { label: 'P2_MEDIUM', cls: 'p2' },
  P3_LOW: { label: 'P3_LOW', cls: 'p3' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter] = useState('all');


  useEffect(() => {
    async function load() {
      try {
        const data = await getIncidents();
        setIncidents(mergeIncidents(data.incidents || []));
      } catch (err) {
        // If API fails, still try to show demo incidents
        setIncidents(mergeIncidents([]));
      }
    }
    load();
    const interval = setInterval(load, 10000);

    const handleDemoIncident = (e) => {
      setIncidents((prev) => {
        const demo = e.detail;
        const exists = prev.some((i) => (i.incidentId || i.id) === (demo.incidentId || demo.id));
        return exists ? prev : [demo, ...prev];
      });
    };

    socket.on('incident_created', (incident) => {
      setIncidents((prev) => mergeIncidents([incident, ...prev]));
    });

    window.addEventListener('walkthrough:incident-created', handleDemoIncident);

    return () => {
      clearInterval(interval);
      socket.off('incident_created');
      window.removeEventListener('walkthrough:incident-created', handleDemoIncident);
    };
  }, [mergeIncidents]);

  const p0Count = incidents.filter((i) => i.classification?.severity === 'P0_CRITICAL').length;
  const p1Count = incidents.filter((i) => i.classification?.severity === 'P1_HIGH').length;

  // Sort by severity order for display
  const sorted = [...incidents].sort((a, b) => {
    const order = ['P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW'];
    return order.indexOf(a.classification?.severity) - order.indexOf(b.classification?.severity);
  });

  const displayed = filter === 'all' ? sorted : sorted.filter(
    (i) => i.classification?.severity === filter
  );

  const getSevInfo = (severity) => SEV_MAP[severity] || SEV_MAP.P3_LOW;

  const openDetail = (incident) => {
    navigate(`/incidents/${incident.incidentId || incident.id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Active Incidents</h1>
          <p className={styles.subtitle}>{incidents.length} total incidents tracked</p>
        </div>
        <div className={styles.filters}>
          {['all', 'P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW'].map((f) => (
            <span key={f} className={styles.filterWrap}>
              <button
                className={`${styles.filterPill} ${filter === f ? styles.filterPillActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
              {f !== 'all' && (
                <ContextualTooltip title={`${f.replace('_', ' ')} Filter`} placement="top">
                  Show only incidents with {f.replace('_', ' ')} severity. This helps you focus on the most critical issues.
                </ContextualTooltip>
              )}
            </span>
          ))}
          <Button variant="secondary" className={styles.sortBtn}>
            <MaterialSymbol icon="sort" className={styles.sortIcon} /> Sort
          </Button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.p0}`}>
          <div className={styles.statLabel}>
            P0 Incidents
            <ContextualTooltip title="P0 Critical" placement="top">
              Highest severity incidents requiring immediate response. Every minute of downtime can cost $500+.
            </ContextualTooltip>
          </div>
          <div className={`${styles.statNumber} ${styles.p0}`}>{p0Count}</div>
        </div>
        <div className={`${styles.statCard} ${styles.p1}`}>
          <div className={styles.statLabel}>
            P1 Incidents
            <ContextualTooltip title="P1 High" placement="top">
              High-severity incidents that need urgent attention but are not actively causing data loss.
            </ContextualTooltip>
          </div>
          <div className={`${styles.statNumber} ${styles.p1}`}>{p1Count}</div>
        </div>

        {sorted[0] && (
          <div className={styles.featuredCard} onClick={() => openDetail(sorted[0])}>
            <div className={styles.featuredBg}></div>
            <div className={styles.featuredContent}>
              <div>
                <div className={styles.featuredMeta}>
                  <span className={`${styles.severityBadge} ${styles[sorted[0].classification?.severity === 'P0_CRITICAL' ? 'p0' : 'p1']}`}>
                    {sorted[0].classification?.severity || 'N/A'}
                  </span>
                  <ContextualTooltip title="Severity Badge" placement="top">
                    Shows the incident severity level. P0_CRITICAL = system-down event, P1_HIGH = severe degradation.
                  </ContextualTooltip>
                  <span className={styles.incidentId}>{sorted[0].incidentId || sorted[0].id}</span>
                  <span className={styles.pulseDot}></span>
                </div>
                <h2 className={styles.featuredTitle}>
                  {sorted[0].triageAnalysis?.headline || sorted[0].classification?.errorCategory || 'Untriaged Incident'}
                </h2>
                <div className={styles.featuredComponent}>
                  <MaterialSymbol icon="account_tree" /> Component: {sorted[0].classification?.affectedComponent || 'Unknown'}
                </div>
              </div>
              <div className={styles.featuredRight}>
                {sorted[0].confidenceScore !== undefined && (
                  <>
                    <div className={styles.ttrLabel}>Confidence</div>
                    <div className={styles.ttrValue}>{sorted[0].confidenceScore}%</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.incidentList}>
        {displayed.slice(0, 10).map((incident) => {
          const sev = incident.classification?.severity || 'P3_LOW';
          const sevInfo = getSevInfo(sev);
          return (
            <div
              key={incident.incidentId || incident.id}
              className={`${styles.incidentItem} ${styles[sevInfo.cls]}`}
              onClick={() => openDetail(incident)}
            >
              <div className={styles.incidentInfo}>
                <div className={styles.incidentMeta}>
                  <span className={`${styles.severityBadge} ${styles[sevInfo.cls]}`}>
                    {sev}
                  </span>
                  <span className={styles.incidentId}>{incident.incidentId || incident.id}</span>
                </div>
                <h3 className={styles.incidentTitle}>
                  {incident.triageAnalysis?.headline || incident.classification?.errorCategory || 'Untriaged'}
                </h3>
                <div className={styles.incidentComponent}>
                  Component: {incident.classification?.affectedComponent || 'Unknown'}
                </div>
              </div>
              <div className={styles.incidentRight}>
                <span className={styles.incidentTime}>
                  {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : ''}
                </span>
              </div>
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className={styles.empty}>
            <MaterialSymbol icon="shield" />
            <span>No incidents match this filter</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
