import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [selectedSource, setSelectedSource] = useState('email');

  // Fetch all incidents on load
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function fetchIncidents() {
    try {
      const response = await axios.get('http://localhost:3000/api/incidents');
      setIncidents(response.data.incidents || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawInput.trim()) return;

    setLoading(true);
    try {
      // Step 1: Ingest alert
      const ingestResponse = await axios.post('http://localhost:3000/api/ingest', {
        source: selectedSource,
        payload: rawInput
      });
      const alertId = ingestResponse.data.alertId;

      // Step 2: Trigger triage
      await axios.post(`http://localhost:3000/api/triage/${alertId}`);

      // Step 3: Refresh incidents
      await fetchIncidents();
      setRawInput('');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process incident');
    } finally {
      setLoading(false);
    }
  }

  const severityColor = {
    P0_CRITICAL: '#ff4444',
    P1_HIGH: '#ff8800',
    P2_MEDIUM: '#ffbb00',
    P3_LOW: '#00aa00'
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>🔧 SecureOps Sync</h1>
        <p>AI-powered incident triage & remediation</p>
      </header>

      <section className="input-section">
        <h2>Report an Incident</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Source:</label>
            <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
              <option value="email">Email</option>
              <option value="discord">Discord</option>
              <option value="slack">Slack</option>
              <option value="log">Log</option>
            </select>
          </div>

          <div className="form-group">
            <label>Raw Alert Text:</label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste error log, email, or message here..."
              rows="4"
            ></textarea>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Analyze & Triage'}
          </button>
        </form>
      </section>

      <section className="incidents-section">
        <h2>Active Incidents ({incidents.length})</h2>

        {incidents.length === 0 ? (
          <p className="empty">No incidents yet. Submit one above to get started.</p>
        ) : (
          <div className="incidents-list">
            {incidents.map((incident) => (
              <div key={incident.incidentId} className="incident-card" 
                   style={{ borderLeft: `4px solid ${severityColor[incident.classification.severity]}` }}>
                <div className="incident-header">
                  <h3>{incident.incidentId}</h3>
                  <span className={`severity ${incident.classification.severity.toLowerCase()}`}>
                    {incident.classification.severity}
                  </span>
                </div>

                <p className="headline">{incident.triageAnalysis.headline}</p>

                <div className="incident-details">
                  <div>
                    <strong>Component:</strong> {incident.classification.affectedComponent}
                  </div>
                  <div>
                    <strong>Category:</strong> {incident.classification.errorCategory}
                  </div>
                  <div>
                    <strong>Impact:</strong> {incident.triageAnalysis.userImpactDescription}
                  </div>
                </div>

                <div className="runbook">
                  <strong>Remediation Steps:</strong>
                  <ol>
                    {incident.remediationRunbook.suggestedSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <p className="notification">
                  <strong>Status Update:</strong> {incident.remediationRunbook.draftedNotification}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
