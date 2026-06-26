import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIncidents } from '../../lib/api';
import IncidentCopilot from '../../components/IncidentCopilot';
import ActivityFeed from '../../components/ActivityFeed';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './IncidentDetail.module.css';

const SEV_COLORS = {
  P0_CRITICAL: { bg: '#ff6b6b', cls: 'p0' },
  P1_HIGH: { bg: '#fca311', cls: 'p1' },
  P2_MEDIUM: { bg: '#4cc9f0', cls: 'p2' },
  P3_LOW: { bg: '#8f909e', cls: 'p3' },
};

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getIncidents();
        const found = (data.incidents || []).find(
          (i) => i.incidentId === id || i.id === id
        );
        setIncident(found);
      } catch (err) {
        console.error('Failed to load incident:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Loading incident…
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className={styles.container}>
        <div className={styles.notfound}>
          <MaterialSymbol icon="search_off" className={styles.notfoundIcon} />
          <h2>Incident Not Found</h2>
          <p>No incident with ID <strong>{id}</strong> was found.</p>
          <Link to="/incidents" className={styles.backLink}>← Back to Incidents</Link>
        </div>
      </div>
    );
  }

  const severity = incident.classification?.severity || 'P3_LOW';
  const sevInfo = SEV_COLORS[severity] || SEV_COLORS.P3_LOW;

  return (
    <div className={styles.container}>
      <Link to="/incidents" className={styles.backNav}>
        <MaterialSymbol icon="arrow_back" /> All Incidents
      </Link>

      <div className={styles.header} style={{ borderLeftColor: sevInfo.bg }}>
        <div className={styles.headerTop}>
          <div className={styles.headerMeta}>
            <span className={`${styles.sevBadge} ${styles[sevInfo.cls]}`}>{severity}</span>
            <span className={styles.incidentId}>{incident.incidentId || incident.id}</span>
            {incident.confidenceScore !== undefined && (
              <span className={styles.confidence}>{incident.confidenceScore}% confidence</span>
            )}
          </div>
          <div className={styles.actions}>
            <button className={styles.actionBtn}>
              <MaterialSymbol icon="share" /> Share
            </button>
            <button className={styles.actionBtn}>
              <MaterialSymbol icon="more_vert" />
            </button>
          </div>
        </div>
        <h1 className={styles.title}>
          {incident.triageAnalysis?.headline || incident.classification?.errorCategory || 'Untriaged Incident'}
        </h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Classification</h3>
            <div className={styles.classGrid}>
              <div className={styles.classItem}>
                <span className={styles.classLabel}>Component</span>
                <span className={styles.classValue}>{incident.classification?.affectedComponent || 'Unknown'}</span>
              </div>
              <div className={styles.classItem}>
                <span className={styles.classLabel}>Error Category</span>
                <span className={styles.classValue}>{incident.classification?.errorCategory || 'N/A'}</span>
              </div>
              <div className={styles.classItem}>
                <span className={styles.classLabel}>User Impact</span>
                <span className={styles.classValue}>{incident.triageAnalysis?.userImpactDescription || 'N/A'}</span>
              </div>
              <div className={styles.classItem}>
                <span className={styles.classLabel}>Created</span>
                <span className={styles.classValue}>
                  {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Root Cause Analysis</h3>
            <div className={styles.analysisCard}>
              <div className={styles.analysisBar} />
              <p>{incident.triageAnalysis?.rootCauseInferred || 'No root cause analysis available.'}</p>
            </div>
          </section>

          {incident.remediationRunbook?.suggestedSteps?.length > 0 && (
            <section className={styles.section}>
              <div className={styles.runbookHeader}>
                <h3 className={styles.sectionTitle}>Remediation Runbook</h3>
                <span className={styles.suggestedBadge}>AI-Suggested</span>
              </div>
              <ol className={styles.runbookList}>
                {incident.remediationRunbook.suggestedSteps.map((step, i) => (
                  <li key={i} className={styles.runbookStep}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {incident.timeline?.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Timeline</h3>
              <div className={styles.timeline}>
                {incident.timeline.map((event, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineEvent}>{event.event}</span>
                      <span className={styles.timelineTime}>
                        {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sideSection}>
            <IncidentCopilot incidentId={incident.incidentId || incident.id} />
          </div>
          <div className={styles.sideSection}>
            <ActivityFeed incidentId={incident.incidentId || incident.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
