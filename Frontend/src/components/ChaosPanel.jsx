// frontend/components/ChaosPanel.jsx
import { useState } from 'react';
import api from '../api/client';
import { toast } from 'sonner';

const SCENARIOS = [
  {
    id: 'payments',
    name: 'DB Pool Exhausted',
    service: 'Payments API',
    icon: '💸',
    severity: 'P0',
    desc: 'Connection pool maxed out, 5xx errors spiking',
    payload: {
      source: 'chaos-panel',
      title: 'DB Connection Pool Exhausted',
      service: 'Payments API',
      severity: 'P0',
      symptoms: ['High latency on checkout', '500 errors spiking', 'Postgres connections maxed']
    }
  },
  {
    id: 'auth',
    name: 'Auth Gateway Down',
    service: 'Auth Service',
    icon: '🚪',
    severity: 'P0',
    desc: '100% packet loss to auth gateway, no logins possible',
    payload: {
      source: 'chaos-panel',
      title: 'Auth Gateway 100% Packet Loss',
      service: 'Auth Service',
      severity: 'P0',
      symptoms: ['Users cannot log in', 'Tokens not refreshing']
    }
  },
  {
    id: 'redis',
    name: 'Redis OOM Killed',
    service: 'Orders API',
    icon: '⚡',
    severity: 'P1',
    desc: 'Cache memory limit hit, OOM killer terminating process',
    payload: {
      source: 'chaos-panel',
      title: 'Redis Cache OOM Killed',
      service: 'Orders API',
      severity: 'P1',
      symptoms: ['Cache miss rate 100%', 'DB read load doubling']
    }
  }
];

export default function ChaosPanel() {
  const [loading, setLoading] = useState(null);

  const triggerChaos = async (scenario) => {
    setLoading(scenario.id);
    try {
      await api.post('/alerts', scenario.payload);
      toast.success(`Chaos Triggered: ${scenario.name}`);
    } catch (err) {
      toast.error('Failed to trigger chaos');
    } finally {
      setTimeout(() => setLoading(null), 1000);
    }
  };

  return (
    <div className="chaos-panel">
      <h3>🎛️ Chaos Engineering Control</h3>
      <p className="chaos-desc">Trigger live incident scenarios to test the AI pipeline.</p>

      <div className="chaos-grid">
        {SCENARIOS.map(scn => (
          <button
            key={scn.id}
            className={`chaos-card sev-${scn.severity.toLowerCase()}`}
            onClick={() => triggerChaos(scn)}
            disabled={loading !== null}
          >
            <div className="chaos-header">
              <span className="chaos-icon">{scn.icon}</span>
              <span className={`sev-badge sev-${scn.severity.toLowerCase()}`}>{scn.severity}</span>
            </div>
            <div className="chaos-title">{scn.name}</div>
            <div className="chaos-meta">{scn.service}</div>
            <div className="chaos-desc-sm">{scn.desc}</div>
            {loading === scn.id ? <div className="chaos-loading">Triggering...</div> : <div className="chaos-cta">Inject Fault →</div>}
          </button>
        ))}
      </div>
    </div>
  );
}