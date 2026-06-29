import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { getIncidents } from '../../lib/api';
import { socket } from '../../lib/socket';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import { useToast } from '../../components/common/Toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import styles from './Analytics.module.css';

const SEV_COLORS = { P0_CRITICAL: '#ef4444', P1_HIGH: '#f97316', P2_MEDIUM: '#22d3ee', P3_LOW: '#6b7280' };
const SEV_ORDER = ['P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW'];

const TREND_UP = 'up';
const TREND_DOWN = 'down';
const TREND_FLAT = 'flat';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className={styles.tooltipRow} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [sortBy, setSortBy] = useState('severity');
  const [sortAsc, setSortAsc] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortWrapRef = useRef(null);
  const { addToast } = useToast();

  // Close sort menu on outside click and Escape
  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleClick = (e) => {
      if (sortWrapRef.current && !sortWrapRef.current.contains(e.target)) setSortMenuOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setSortMenuOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [sortMenuOpen]);

  useEffect(() => {
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
    load();
    const interval = setInterval(load, 15000);
    socket.on('incident_created', (inc) => setIncidents((prev) => [inc, ...prev]));
    return () => { clearInterval(interval); socket.off('incident_created'); };
  }, []);

  // ── Filter incidents by date range ──
  function filterByRange(data, daysBack) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    return data.filter((i) => i.createdAt && new Date(i.createdAt) >= cutoff);
  }

  // ── Compute metrics for a given set of incidents ──
  function computeMetrics(data) {
    const p0 = data.filter((i) => i.classification?.severity === 'P0_CRITICAL').length;
    const p1 = data.filter((i) => i.classification?.severity === 'P1_HIGH').length;
    const open = data.filter((i) => i.status === 'open' || !i.status).length;
    const avgConfidence = data.length > 0
      ? Math.round(data.reduce((s, i) => s + (i.confidenceScore || 0), 0) / data.length) : 0;
    const triageTimes = data
      .map((i) => {
        const arr = i.timeline || [];
        const alertEv = arr.find((e) => e.event === 'Alert Received');
        const triageEv = arr.find((e) => e.event === 'AI Triage Complete');
        if (alertEv && triageEv) return (new Date(triageEv.timestamp).getTime() - new Date(alertEv.timestamp).getTime()) / 60000;
        return null;
      }).filter(Boolean);
    const avgTriage = triageTimes.length > 0 ? Math.round(triageTimes.reduce((s, t) => s + t, 0) / triageTimes.length) : 0;
    return { total: data.length, p0, p1, open, avgConfidence, avgTriage };
  }

  // ── Derived metrics with trends ──
  const { severityData, trendData, componentData, confidenceData, statusData, kpis, previousTotal } = useMemo(() => {
    const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;

    // Filter current period
    const currentData = filterByRange(incidents, daysBack);
    const current = computeMetrics(currentData);

    // Filter previous period (same length before current period)
    const prevCutoff = new Date();
    prevCutoff.setDate(prevCutoff.getDate() - daysBack);
    const prevStart = new Date(prevCutoff);
    prevStart.setDate(prevStart.getDate() - daysBack);
    const prevData = incidents.filter((i) => {
      if (!i.createdAt) return false;
      const d = new Date(i.createdAt);
      return d >= prevStart && d < prevCutoff;
    });
    const previous = computeMetrics(prevData);

    // Compute trend direction and percentage for each KPI
    // For 'good when up' metrics (confidence): higher is better → up is green
    // For 'good when down' metrics (p0, p1, open, triage): lower is better → down is green
    function computeTrend(currentVal, prevVal, higherIsBetter) {
      if (prevVal === 0) {
        if (currentVal === 0) return { direction: TREND_FLAT, pct: 0 };
        return { direction: TREND_UP, pct: 100 };
      }
      const pct = Math.round(((currentVal - prevVal) / prevVal) * 100);
      if (pct === 0) return { direction: TREND_FLAT, pct: 0 };
      const isUp = pct > 0;
      const isGood = higherIsBetter ? isUp : !isUp;
      return { direction: isUp ? TREND_UP : TREND_DOWN, pct: Math.abs(pct), isGood };
    }

    // Severity data (current period only)
    const sevCounts = {};
    SEV_ORDER.forEach((s) => { sevCounts[s] = 0; });
    currentData.forEach((i) => { const s = i.classification?.severity || 'P3_LOW'; sevCounts[s] = (sevCounts[s] || 0) + 1; });
    const severityData = SEV_ORDER.filter((s) => sevCounts[s] > 0).map((s) => ({ name: s.replace('_', ' '), value: sevCounts[s], color: SEV_COLORS[s] }));

    // Trend data - group by date (current period only)
    const dateBuckets = {};
    const now = new Date();
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dateBuckets[key] = { date: key, P0: 0, P1: 0, P2: 0, P3: 0, total: 0 };
    }
    currentData.forEach((inc) => {
      if (!inc.createdAt) return;
      const key = inc.createdAt.slice(0, 10);
      if (dateBuckets[key]) {
        const sev = inc.classification?.severity || 'P3_LOW';
        if (sev === 'P0_CRITICAL') dateBuckets[key].P0++;
        else if (sev === 'P1_HIGH') dateBuckets[key].P1++;
        else if (sev === 'P2_MEDIUM') dateBuckets[key].P2++;
        else dateBuckets[key].P3++;
        dateBuckets[key].total++;
      }
    });
    const trendData = Object.values(dateBuckets).map((d) => ({ ...d, label: d.date.slice(5) }));

    // Top affected components (current period)
    const compCounts = {};
    currentData.forEach((i) => {
      const c = i.classification?.affectedComponent || 'Unknown';
      compCounts[c] = (compCounts[c] || 0) + 1;
    });
    const componentData = Object.entries(compCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], idx) => ({ name, value, color: `hsl(${220 + idx * 20}, 70%, ${55 + idx * 3}%)` }));

    // Confidence buckets (current period)
    const buckets = { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };
    currentData.forEach((i) => {
      const cs = i.confidenceScore ?? 50;
      if (cs <= 20) buckets['0-20%']++;
      else if (cs <= 40) buckets['21-40%']++;
      else if (cs <= 60) buckets['41-60%']++;
      else if (cs <= 80) buckets['61-80%']++;
      else buckets['81-100%']++;
    });
    const confidenceData = Object.entries(buckets).map(([name, value], idx) => ({
      name, value, color: `hsl(${140 + idx * 30}, 70%, 50%)`,
    }));

    // Status breakdown (current period)
    const statusCounts = {};
    currentData.forEach((i) => { const s = i.status || 'unknown'; statusCounts[s] = (statusCounts[s] || 0) + 1; });
    const statusColors = { open: '#ef4444', resolved: '#22c55e', acknowledged: '#f97316', investigating: '#22d3ee', unknown: '#6b7280' };
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: statusColors[name] || '#6b7280',
    }));

    // KPIs with trend indicators
    const kpis = [
      { label: 'Total Incidents', value: current.total, icon: 'monitoring', color: '#788cff', trend: computeTrend(current.total, previous.total, false) },
      { label: 'Critical (P0)', value: current.p0, icon: 'warning', color: '#ef4444', trend: computeTrend(current.p0, previous.p0, false) },
      { label: 'High (P1)', value: current.p1, icon: 'priority_high', color: '#f97316', trend: computeTrend(current.p1, previous.p1, false) },
      { label: 'Open', value: current.open, icon: 'error', color: '#fbbf24', trend: computeTrend(current.open, previous.open, false) },
      { label: 'Avg Confidence', value: `${current.avgConfidence}%`, icon: 'fact_check', color: '#22d3ee', trend: computeTrend(current.avgConfidence, previous.avgConfidence, true) },
      { label: 'Avg Triage', value: `${current.avgTriage}m`, icon: 'timer', color: '#a78bfa', trend: computeTrend(current.avgTriage, previous.avgTriage, false) },
    ];

    return { severityData, trendData, componentData, confidenceData, statusData, kpis, previousTotal: previous.total };
  }, [incidents, timeRange]);

  // ── Sorted incident list ──
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'severity': { const o = ['P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW']; cmp = o.indexOf(a.classification?.severity) - o.indexOf(b.classification?.severity); break; }
        case 'date': { cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0); break; }
        case 'confidence': { cmp = (a.confidenceScore || 0) - (b.confidenceScore || 0); break; }
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [incidents, sortBy, sortAsc]);

  // ── Export Report ──
  const handleExport = useCallback(() => {
    const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const currentData = filterByRange(incidents, daysBack);

    const report = {
      exportedAt: new Date().toISOString(),
      timeRange,
      period: daysBack + 'd',
      kpis: kpis.map((k) => ({
        label: k.label,
        value: k.value,
        trend: k.trend ? { direction: k.trend.direction, pct: k.trend.pct, isGood: k.trend.isGood } : null,
      })),
      summary: {
        totalIncidents: incidents.length,
        incidentsInPeriod: currentData.length,
      },
      severityDistribution: severityData,
      trend: trendData,
      topComponents: componentData,
      confidenceDistribution: confidenceData,
      statusBreakdown: statusData,
      incidents: sortedIncidents.map((inc) => ({
        id: inc.incidentId || inc.id,
        severity: inc.classification?.severity,
        status: inc.status,
        component: inc.classification?.affectedComponent,
        headline: inc.triageAnalysis?.headline,
        confidenceScore: inc.confidenceScore,
        createdAt: inc.createdAt,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secureops-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Analytics report exported as JSON.', 'success');
  }, [incidents, timeRange, kpis, severityData, trendData, componentData, confidenceData, statusData, sortedIncidents, addToast]);

  // ── Copy Summary to Clipboard ──
  const handleCopySummary = useCallback(() => {
    const lines = [
      `SecureOps Sync — Analytics Report (${timeRange})`,
      `Exported: ${new Date().toLocaleString()}`,
      `---`,
      `Total Incidents (all time): ${incidents.length}`,
      ...kpis.map((k) => `${k.label}: ${k.value}${k.trend ? ` (${k.trend.direction === 'up' ? '↑' : k.trend.direction === 'down' ? '↓' : '→'} ${k.trend.pct}%)` : ''}`),
      `---`,
      `Severity: ${severityData.map((s) => `${s.name}=${s.value}`).join(', ')}`,
      `Status: ${statusData.map((s) => `${s.name}=${s.value}`).join(', ')}`,
      `Top Components: ${componentData.slice(0, 3).map((c) => `${c.name}=${c.value}`).join(', ')}`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      addToast('Summary copied to clipboard.', 'success');
    }).catch(() => {
      addToast('Failed to copy.', 'error');
    });
  }, [incidents, timeRange, kpis, severityData, statusData, componentData, addToast]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading analytics…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Real-time incident metrics and visualizations</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.controls}>
            {['24h', '7d', '30d'].map((r) => (
              <button key={r} className={`${styles.timeBtn} ${timeRange === r ? styles.timeActive : ''}`} onClick={() => setTimeRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <div className={styles.exportGroup}>
            <button className={styles.exportBtn} onClick={handleExport} title="Export full report as JSON">
              <MaterialSymbol icon="download" /> Export
            </button>
            <button className={styles.copyBtn} onClick={handleCopySummary} title="Copy summary to clipboard">
              <MaterialSymbol icon="content_copy" />
            </button>
          </div>
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} /> Live
          </span>
        </div>
      </div>

      {/* ── KPI Cards with Trend Indicators ── */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className={styles.kpiCard} style={{ '--kpi-accent': kpi.color }}>
            <div className={styles.kpiIcon}><MaterialSymbol icon={kpi.icon} /></div>
            <div className={styles.kpiValue}>
              {kpi.value}
              {kpi.trend && kpi.trend.direction !== TREND_FLAT && (
                <span className={`${styles.kpiTrend} ${kpi.trend.isGood ? styles.kpiTrendGood : styles.kpiTrendBad}`}>
                  <MaterialSymbol icon={kpi.trend.direction === TREND_UP ? 'trending_up' : 'trending_down'} />
                  {kpi.trend.pct}%
                </span>
              )}
              {kpi.trend && kpi.trend.direction === TREND_FLAT && (
                <span className={`${styles.kpiTrend} ${styles.kpiTrendFlat}`}>
                  <MaterialSymbol icon="remove" />
                  0%
                </span>
              )}
            </div>
            <div className={styles.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div className={styles.chartsGrid}>

        {/* Severity Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <MaterialSymbol icon="donut_large" /> Severity Distribution
            </h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={800}
                  animationBegin={100}
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.chartLegend}>
              {severityData.map((s) => (
                <div key={s.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  <span className={styles.legendLabel}>{s.name}</span>
                  <span className={styles.legendValue}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend Over Time */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <MaterialSymbol icon="trending_up" /> Incident Trend
            </h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {SEV_ORDER.map((s) => (
                    <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SEV_COLORS[s]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={SEV_COLORS[s]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {SEV_ORDER.map((s) => (
                  <Area
                    key={s}
                    type="monotone"
                    dataKey={s === 'P0_CRITICAL' ? 'P0' : s === 'P1_HIGH' ? 'P1' : s === 'P2_MEDIUM' ? 'P2' : 'P3'}
                    stackId="1"
                    stroke={SEV_COLORS[s]}
                    fill={`url(#grad-${s})`}
                    strokeWidth={1.5}
                    name={s.replace('_', ' ')}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Affected Components */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <MaterialSymbol icon="account_tree" /> Affected Components
            </h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={componentData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#a0a0b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={600} animationBegin={200}>
                  {componentData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <MaterialSymbol icon="checklist" /> Status Breakdown
            </h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={800}
                  animationBegin={300}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.chartLegend}>
              {statusData.map((s) => (
                <div key={s.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  <span className={styles.legendLabel}>{s.name}</span>
                  <span className={styles.legendValue}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <MaterialSymbol icon="fact_check" /> Confidence Distribution
            </h3>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={confidenceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#6b6b80', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={600} animationBegin={150}>
                  {confidenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <MaterialSymbol icon="summarize" /> Summary
            </h3>
          </div>
          <div className={styles.chartBody}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#788cff' }} />
                <div>
                  <div className={styles.summaryValue}>{incidents.length}</div>
                  <div className={styles.summaryLabel}>Total Incidents</div>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#ef4444' }} />
                <div>
                  <div className={styles.summaryValue}>{kpis[1].value}</div>
                  <div className={styles.summaryLabel}>Critical (P0)</div>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#22d3ee' }} />
                <div>
                  <div className={styles.summaryValue}>{kpis[4].value}</div>
                  <div className={styles.summaryLabel}>Avg Confidence</div>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#a78bfa' }} />
                <div>
                  <div className={styles.summaryValue}>{kpis[5].value}</div>
                  <div className={styles.summaryLabel}>Avg Triage Time</div>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#22c55e' }} />
                <div>
                  <div className={styles.summaryValue}>{trendData.reduce((s, d) => s + d.total, 0)}</div>
                  <div className={styles.summaryLabel}>Total (Period)</div>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#f97316' }} />
                <div>
                  <div className={styles.summaryValue}>{kpis[2].value}</div>
                  <div className={styles.summaryLabel}>High (P1)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Raw Incident Data ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <MaterialSymbol icon="list_alt" /> Incident Log
          </h2>
          <div className={styles.sectionControls}>
            <div className={styles.sortWrap} ref={sortWrapRef}>
              <button className={styles.sortBtn} onClick={() => setSortMenuOpen((prev) => !prev)}>
                <MaterialSymbol icon="sort" />
                {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                <MaterialSymbol icon={sortAsc ? 'arrow_upward' : 'arrow_downward'} className={styles.sortDir} />
              </button>
              {sortMenuOpen && (
                <div className={styles.sortMenu}>
                  {['severity', 'date', 'confidence'].map((k) => (
                    <button
                      key={k}
                      className={`${styles.sortMenuItem} ${sortBy === k ? styles.sortMenuItemActive : ''}`}
                      onClick={() => { if (sortBy === k) setSortAsc((p) => !p); else { setSortBy(k); setSortAsc(false); } setSortMenuOpen(false); }}
                    >
                      <MaterialSymbol icon={k === 'severity' ? 'priority_high' : k === 'date' ? 'calendar_today' : 'trending_up'} />
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                      {sortBy === k && <MaterialSymbol icon={sortAsc ? 'arrow_upward' : 'arrow_downward'} className={styles.sortActiveIcon} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className={styles.incidentCount}>{incidents.length} total</span>
          </div>
        </div>
        <div className={styles.dataTable}>
          <div className={styles.dataTableHeader}>
            <span className={styles.colId}>ID</span>
            <span className={styles.colTitle}>Headline</span>
            <span className={styles.colSev}>Severity</span>
            <span className={styles.colStatus}>Status</span>
            <span className={styles.colComp}>Component</span>
            <span className={styles.colDate}>Created</span>
          </div>
          <div className={styles.dataTableBody}>
            {sortedIncidents.map((inc) => {
              const sev = inc.classification?.severity || 'P3_LOW';
              return (
                <div key={inc.incidentId || inc.id} className={styles.dataRow}>
                  <span className={styles.colId}>{inc.incidentId || inc.id}</span>
                  <span className={styles.colTitle}>{inc.triageAnalysis?.headline || inc.classification?.errorCategory || 'Untriaged'}</span>
                  <span className={styles.colSev}>
                    <span className={styles.sevBadge} style={{ background: SEV_COLORS[sev] + '22', color: SEV_COLORS[sev], border: `1px solid ${SEV_COLORS[sev]}44` }}>
                      {sev}
                    </span>
                  </span>
                  <span className={styles.colStatus}>
                    <span className={styles.statusBadge} style={{
                      background: (inc.status === 'open' ? '#ef4444' : inc.status === 'resolved' ? '#22c55e' : '#6b7280') + '22',
                      color: inc.status === 'open' ? '#ef4444' : inc.status === 'resolved' ? '#22c55e' : '#6b7280',
                    }}>
                      {inc.status || 'open'}
                    </span>
                  </span>
                  <span className={styles.colComp}>{inc.classification?.affectedComponent || '—'}</span>
                  <span className={styles.colDate}>{inc.createdAt ? formatDate(inc.createdAt) : '—'}</span>
                </div>
              );
            })}
            {sortedIncidents.length === 0 && (
              <div className={styles.empty}>No incidents recorded yet</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
