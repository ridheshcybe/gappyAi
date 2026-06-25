// backend/services/topology-service.js
import incidentStore from '../stores/datastore.js';

// Static topology map for the demo
const TOPOLOGY = {
  nodes: [
    { id: 'cdn', label: 'Cloudflare CDN', type: 'edge', group: 'edge' },
    { id: 'gateway', label: 'API Gateway', type: 'gateway', group: 'core' },
    { id: 'auth', label: 'Auth Service', type: 'service', group: 'core' },
    { id: 'payments', label: 'Payments API', type: 'service', group: 'core' },
    { id: 'orders', label: 'Orders API', type: 'service', group: 'core' },
    { id: 'db-postgres', label: 'PostgreSQL', type: 'database', group: 'data' },
    { id: 'redis', label: 'Redis Cache', type: 'cache', group: 'data' }
  ],
  edges: [
    { source: 'cdn', target: 'gateway', id: 'e-cdn-gateway' },
    { source: 'gateway', target: 'auth', id: 'e-gateway-auth' },
    { source: 'gateway', target: 'payments', id: 'e-gateway-payments' },
    { source: 'gateway', target: 'orders', id: 'e-gateway-orders' },
    { source: 'auth', target: 'db-postgres', id: 'e-auth-db' },
    { source: 'auth', target: 'redis', id: 'e-auth-redis' },
    { source: 'payments', target: 'db-postgres', id: 'e-payments-db' },
    { source: 'orders', target: 'db-postgres', id: 'e-orders-db' },
    { source: 'orders', target: 'redis', id: 'e-orders-redis' }
  ]
};

class TopologyService {
  async getIncidentMap() {
    // Fetch all incidents
    const all = await incidentStore.query({}) || [];
    const incidents = Array.isArray(all) ? all : Object.values(all);
    const impactedServices = new Set();
    const incidentMap = {};

    // Map incidents to topology nodes
    incidents.forEach(inc => {
      const services = [
        (inc.classification?.affectedComponent || inc.service || '').toLowerCase().replace(/\s/g, '-'),
        ...(inc.rootCause?.affectedComponents || []).map(c => c.toLowerCase().replace(/\s/g, '-'))
      ];

      services.forEach(s => {
        if (s && TOPOLOGY.nodes.find(n => n.id === s)) {
          impactedServices.add(s);
          if (!incidentMap[s]) incidentMap[s] = [];
          incidentMap[s].push({
            id: inc.incidentId || inc.id,
            title: inc.triageAnalysis?.headline || inc.title,
            severity: inc.classification?.severity || inc.severity
          });
        }
      });
    });

    return {
      topology: TOPOLOGY,
      impactedServices: Array.from(impactedServices),
      incidentMap
    };
  }
}

export default new TopologyService();
