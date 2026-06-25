// backend/services/metrics-service.js
import incidentStore from '../stores/datastore.js';

function getSeverity(inc) {
  return inc.classification?.severity || inc.severity || 'P3';
}

function getService(inc) {
  return inc.classification?.affectedComponent || inc.service || 'unknown';
}

class MetricsService {
  async compute() {
    const all = await incidentStore.query({}) || [];
    const incidents = Array.isArray(all) ? all : Object.values(all);
    const open = incidents.filter(i => i.status === 'open');
    const resolved = incidents.filter(i => i.status === 'resolved');

    const bySeverity = { P0: 0, P1: 0, P2: 0, P3: 0 };
    incidents.forEach(i => {
      const sev = getSeverity(i);
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
    });

    const byService = {};
    incidents.forEach(i => {
      const s = getService(i);
      byService[s] = (byService[s] || 0) + 1;
    });

    const topServices = Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service, count]) => ({ service, count }));

    const avgResolution = resolved.length > 0
      ? Math.round(resolved.reduce((s, i) => s + (i.resolutionTimeMin || 0), 0) / resolved.length)
      : 0;

    // MTTR by severity
    const mttrBySeverity = {};
    ['P0', 'P1', 'P2', 'P3'].forEach(sev => {
      const subset = resolved.filter(i => getSeverity(i) === sev);
      mttrBySeverity[sev] = subset.length
        ? Math.round(subset.reduce((s, i) => s + (i.resolutionTimeMin || 0), 0) / subset.length)
        : 0;
    });

    // Reliability score: weighted inverse of incidents by severity
    const weights = { P0: 10, P1: 5, P2: 2, P3: 1 };
    const penalty = incidents.reduce((sum, i) => sum + (weights[getSeverity(i)] || 0), 0);
    const reliabilityScore = Math.max(0, 100 - Math.min(100, penalty));

    // Revenue impact estimate (configurable)
    const revenuePerMinBySev = { P0: 5000, P1: 1000, P2: 200, P3: 50 };
    const revenueImpact = incidents.reduce((sum, i) => {
      const min = i.resolutionTimeMin || 30;
      return sum + min * (revenuePerMinBySev[getSeverity(i)] || 0);
    }, 0);

    // 7-day trend
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = incidents.filter(i => new Date(i.createdAt).getTime() >= sevenDaysAgo);
    const trend = this.computeTrend(recent);

    return {
      totalIncidents: incidents.length,
      openIncidents: open.length,
      resolvedIncidents: resolved.length,
      bySeverity,
      topServices,
      avgResolutionMin: avgResolution,
      mttrBySeverity,
      reliabilityScore,
      revenueImpactUsd: revenueImpact,
      trend7d: trend,
      computedAt: new Date().toISOString()
    };
  }

  computeTrend(incidents) {
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days[d] = { date: d, count: 0, P0: 0, P1: 0, P2: 0, P3: 0 };
    }
    incidents.forEach(inc => {
      const d = inc.createdAt?.slice(0, 10);
      if (d && days[d]) {
        const sev = getSeverity(inc);
        days[d].count++;
        days[d][sev] = (days[d][sev] || 0) + 1;
      }
    });
    return Object.values(days);
  }
}

export default new MetricsService();
