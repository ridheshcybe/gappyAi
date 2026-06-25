// frontend/components/ExecutiveDashboard.jsx
import { useEffect, useState } from 'react';
import { getExecutiveMetrics } from '../lib/api';

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await getExecutiveMetrics();
        setMetrics(response);
      } catch (error) {
        console.error('Failed to fetch executive metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30_000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div className="loading">Loading metrics…</div>;

  return (
    <div className="exec-dashboard">
      <h2>Executive Overview</h2>

      <div className="kpi-grid">
        <KPI label="Open Incidents" value={metrics.openIncidents} accent="red" />
        <KPI label="Avg Resolution" value={`${metrics.avgResolutionMin}m`} accent="blue" />
        <KPI label="Reliability Score" value={`${metrics.reliabilityScore}/100`} accent="green" />
        <KPI label="Revenue Impact" value={`$${metrics.revenueImpactUsd.toLocaleString()}`} accent="amber" />
      </div>

      <div className="exec-row">
        <div className="exec-card">
          <h3>Incidents by Severity</h3>
          {Object.entries(metrics.bySeverity).map(([sev, count]) => (
            <div key={sev} className="bar-row">
              <span className={`sev-badge sev-${sev.toLowerCase()}`}>{sev}</span>
              <div className="bar"><div className="bar-fill" style={{ width: `${count * 10}%` }} /></div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </div>

        <div className="exec-card">
          <h3>Top Affected Services</h3>
          {metrics.topServices.map(s => (
            <div key={s.service} className="service-row">
              <span>{s.service}</span>
              <strong>{s.count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="exec-card">
        <h3>7-Day Trend</h3>
        <div className="trend-chart">
          {metrics.trend7d.map(d => (
            <div key={d.date} className="trend-bar" title={`${d.date}: ${d.count} incidents`}>
              <div className="trend-stack">
                <div className="trend-seg p0" style={{ height: `${d.P0 * 10}px` }} />
                <div className="trend-seg p1" style={{ height: `${d.P1 * 10}px` }} />
                <div className="trend-seg p2" style={{ height: `${d.P2 * 10}px` }} />
                <div className="trend-seg p3" style={{ height: `${d.P3 * 10}px` }} />
              </div>
              <span className="trend-label">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, accent }) {
  return (
    <div className={`kpi kpi-${accent}`}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
