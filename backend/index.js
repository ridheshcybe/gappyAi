const express = require('express');
const cors = require('cors');

require('dotenv').config();

const { ingestAlert } = require('./input-handler');
const { triageIncident } = require('./triage-pipeline');
const { incidentStore } = require('./lemma-setup');

const app = express();
app.use(express.json());
app.use(express.static(`${process.cwd()}/../Frontend/dist`))
app.use(cors({
  origin: ['*'],
  credentials: true
}));

app.get('/', (req,res)=>{
  res.sendFile(`${process.cwd()}/../Frontend/dist`)
})

// Endpoint 1: Ingest a raw alert
app.post('/api/ingest', async (req, res) => {
  try {
    const { source, payload } = req.body;

    if (!source || !payload) {
      return res.status(400).json({ error: 'Missing source or payload' });
    }

    const alertId = await ingestAlert({ source, payload });
    res.json({ success: true, alertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Trigger triage for an alert
app.post('/api/triage/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const incident = await triageIncident(alertId);
    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 3: Fetch all incidents (for dashboard)
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await incidentStore.query({});
    res.json({ success: true, incidents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 4: Fetch single incident
app.get('/api/incidents/:incidentId', async (req, res) => {
  try {
    const { incidentId } = req.params;
    const incident = await incidentStore.fetch(incidentId);
    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SecureOps Sync backend running on http://localhost:${PORT}`);
});
