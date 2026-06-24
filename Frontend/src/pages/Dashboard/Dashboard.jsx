import React, { useState } from 'react';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const incidents = [
    {
      id: 'INC-4721',
      severity: 'P0',
      severityLabel: 'CRITICAL',
      title: 'Payment gateway down',
      component: 'Payment Gateway',
      time: 'Opened 1h ago',
      lead: 'Sarah Jenkins',
      impacted: '~4,200/min',
      description:
        'Automated analysis detects a complete failure of the primary Stripe webhook endpoint starting at 14:02 UTC. Initial logs indicate a connection timeout connecting to the internal auth service. Traffic is currently blackholing.',
      log: 'ERR [14:02:11] connection_timeout auth.svc.cluster.local:5050\nFTL [14:02:12] gateway panic: auth resolution failed',
      runbook: [
        { step: '1. Verify Auth Service Health', detail: 'Check pod metrics for auth.svc.cluster.local' },
        { step: '2. Restart Gateway Pods', detail: 'kubectl rollout restart deploy/payment-gateway' },
        { step: '3. Failover to Secondary DB (If Step 1 fails)', detail: 'Requires senior engineer approval' },
      ],
    },
    {
      id: 'INC-4720',
      severity: 'P1',
      severityLabel: 'HIGH',
      title: 'Database latency spike in EU-West',
      component: 'PostgreSQL Cluster',
      time: 'Opened 45m ago',
    },
    {
      id: 'INC-4718',
      severity: 'P2',
      severityLabel: 'MEDIUM',
      title: 'API rate limit errors for Tenant B',
      component: 'API Gateway',
      time: 'Opened 2h ago',
    },
  ];

  const openDetail = (incident) => {
    setSelectedIncident(incident);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedIncident(null);
  };

  const severityClass = (sev) => {
    const map = { P0: styles.p0, P1: styles.p1, P2: styles.p2, P3: styles.p3 };
    return map[sev] || styles.p3;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Active Incidents</h1>
        <div className={styles.filters}>
          <select className={styles.filterSelect}>
            <option>All Severities</option>
            <option>P0 Critical</option>
            <option>P1 High</option>
            <option>P2 Medium</option>
            <option>P3 Low</option>
          </select>
          <select className={styles.filterSelect}>
            <option>Status: Open</option>
            <option>Status: Investigating</option>
            <option>Status: Resolved</option>
          </select>
          <Button variant="secondary" className={styles.sortBtn}>
            <MaterialSymbol icon="sort" className={styles.sortIcon} /> Sort
          </Button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.p0}`}>
          <div className={styles.statLabel}>P0 Incidents</div>
          <div className={`${styles.statNumber} ${styles.p0}`}>1</div>
        </div>
        <div className={`${styles.statCard} ${styles.p1}`}>
          <div className={styles.statLabel}>P1 Incidents</div>
          <div className={`${styles.statNumber} ${styles.p1}`}>3</div>
        </div>

        <div className={styles.featuredCard} onClick={() => openDetail(incidents[0])}>
          <div className={styles.featuredBg}></div>
          <div className={styles.featuredContent}>
            <div>
              <div className={styles.featuredMeta}>
                <span className={`${styles.severityBadge} ${styles.p0}`}>P0_CRITICAL</span>
                <span className={styles.incidentId}>INC-4721</span>
                <span className={styles.pulseDot}></span>
              </div>
              <h2 className={styles.featuredTitle}>Payment gateway down</h2>
              <div className={styles.featuredComponent}>
                <MaterialSymbol icon="account_tree" /> Component: Payment Gateway
              </div>
            </div>
            <div className={styles.featuredRight}>
              <div className={styles.ttrLabel}>TTR Objective</div>
              <div className={styles.ttrValue}>14m 22s</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.incidentList}>
        {incidents.slice(1).map((incident) => (
          <div
            key={incident.id}
            className={styles.incidentItem}
            onClick={() => openDetail(incident)}
          >
            <div className={styles.incidentInfo}>
              <div className={styles.incidentMeta}>
                <span className={styles.severityBadge}>
                  {incident.severity}_{incident.severityLabel}
                </span>
                <span className={styles.incidentId}>{incident.id}</span>
              </div>
              <h3 className={styles.incidentTitle}>{incident.title}</h3>
              <div className={styles.incidentComponent}>
                Component: {incident.component}
              </div>
            </div>
            <div className={styles.incidentRight}>
              <div className={styles.avatarGroup}>
                <img
                  className={styles.avatar}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCleb2T0qBMq44ght7iqaXupTlYgtywzJVI57MfgWUYNbfk9VrOTbrLKD8fc4gO30m6AQTVO98xEN-JS54mqJdCDKDR4c5QCSvVVEMBof60mL2JeWconYWGNuNxO-ce4BLAN9sOkm5bFnBRpW7n-mVeiUu_3_V-en07XTtTKmBAAunQJQ_CZET3_5GKWibJrXC955qMnZtkWoQmxsA7TE3pNj0Y3j_cnxwjbzneVh6o6pqfPhY2czMewmpwMbvQaD3UCR-BP8IJ-SFX"
                  alt="avatar"
                />
              </div>
              <span className={styles.incidentTime}>{incident.time}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isDetailOpen} onClose={closeDetail}>
        {selectedIncident && (
          <>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalMeta}>
                  <span className={`${styles.severityBadge} ${severityClass(selectedIncident.severity)}`}>
                    {selectedIncident.severity}_{selectedIncident.severityLabel}
                  </span>
                  <span className={styles.incidentId}>{selectedIncident.id}</span>
                </div>
                <h2 className={styles.modalTitle}>{selectedIncident.title}</h2>
              </div>
              <button className={styles.modalClose} onClick={closeDetail}>
                <MaterialSymbol icon="close" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <h3 className={styles.sectionLabel}>Classification</h3>
                <div className={styles.classificationGrid}>
                  <div>
                    <div className={styles.fieldLabel}>Component</div>
                    <div className={styles.fieldValue}>
                      <MaterialSymbol icon="account_tree" /> {selectedIncident.component}
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>Environment</div>
                    <div className={styles.fieldValue}>Production (US-East)</div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>Lead Responder</div>
                    <div className={styles.fieldValue}>
                      <img
                        className={styles.leadAvatar}
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV2RprT_bxJELCT2LGa9D3znzadyHxF6vW99ura1F3tUpMiEx8aMC6NSiYXp1Ed0MN9XjTNNw7GeNNfrd0webDxLhEvQY9dVWMgwm1dWTg--sY1cdGUa0DUMpS74L-1E5cCTwK467SU1ChJezcy5g50E9EbcSvwGx13hga3v9zw4EbZ0pHcwVMBSxig8NovquIo21pq8kThTedIKWb2B7us1F33hG_HyebONR5sD4wIR4KB84i92D5wq4Z8y-_eCzvxhxNveV39oV-"
                        alt="lead"
                      />
                      {selectedIncident.lead}
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>Impacted Users</div>
                    <div className={`${styles.fieldValue} ${styles.impacted}`}>
                      {selectedIncident.impacted}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={styles.sectionLabel}>Triage Analysis</h3>
                <div className={styles.analysisBox}>
                  <div className={styles.analysisBar}></div>
                  <p>{selectedIncident.description}</p>
                  <pre className={styles.logBlock}>{selectedIncident.log}</pre>
                </div>
              </div>

              <div>
                <div className={styles.runbookHeader}>
                  <h3 className={styles.sectionLabel}>Remediation Runbook</h3>
                  <span className={styles.suggestedBadge}>Suggested</span>
                </div>
                <div className={styles.runbookList}>
                  {selectedIncident.runbook.map((item, idx) => (
                    <label key={idx} className={styles.runbookItem}>
                      <input type="checkbox" />
                      <div>
                        <div className={styles.runbookStep}>{item.step}</div>
                        <div className={styles.runbookDetail}>{item.detail}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <h3 className={styles.sectionLabel}>Draft Status Update</h3>
              <textarea
                className={styles.statusTextarea}
                rows="3"
                defaultValue="We are currently investigating an issue impacting payment processing. Engineers are engaged and working to restore service. Next update in 15 minutes."
              />
              <div className={styles.footerActions}>
                <Button variant="secondary" onClick={closeDetail}>
                  Cancel
                </Button>
                <Button variant="primary" className={styles.sendBtn}>
                  <MaterialSymbol icon="send" /> Send Update
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;