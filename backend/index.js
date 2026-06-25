import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initLemma } from './lemma-config.js';
dotenv.config();

import { ingestAlert } from "./input-handler.js";
import { triageIncident } from "./triage-pipeline.js";
import incidentStore from "./stores/datastore.js";
import { initialize as initializeSocket } from "./socket.js";
import escalationService from "./services/escalation-service.js";
import { prometheusWebhook } from './api/webhooks.js';

const app = express();

// Define allowed origins BEFORE using them in CORS
const allowedOrigin = ['http://localhost:5173', 'http://localhost:3000'];

// Start escalation service
escalationService.start();

app.use(express.json());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigin.indexOf(origin) !== -1) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer(app);
const io = initializeSocket(httpServer);
app.set('io', io);

// POST /api/ingest
app.post("/api/ingest", async (req, res) => {
  try {
    const { source, payload } = req.body;
    const alertId = await ingestAlert({ source, payload });
    res.json({ success: true, alertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/triage/:alertId
app.post("/api/triage/:alertId", async (req, res) => {
  try {
    const result = await triageIncident(req.params.alertId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/incidents
app.get("/api/incidents", async (req, res) => {
  const incidents = await incidentStore.query({});
  res.json({ success: true, incidents });
});

// GET /api/incidents/:id
app.get("/api/incidents/:id", async (req, res) => {
  const incident = await incidentStore.fetch(req.params.id);
  res.json({ success: true, incident });
});

// GET /api/incidents/:id/history
app.get("/api/incidents/:incidentId/history", async (req, res) => {
  const { getHistory } = await import('./api/history.js');
  await getHistory(req, res);
});

// Copilot endpoints
app.post("/api/copilot/chat", async (req, res) => {
  const { copilotChat } = await import('./api/copilot.js');
  await copilotChat(req, res);
});

app.get("/api/copilot/conversation/:incidentId", async (req, res) => {
  const { getConversation } = await import('./api/copilot.js');
  await getConversation(req, res);
});

// Activity endpoints
app.get("/api/activity", async (req, res) => {
  const { getFeed } = await import('./api/activity.js');
  await getFeed(req, res);
});

app.get("/api/activity/:incidentId", async (req, res) => {
  const { getIncidentActivity } = await import('./api/activity.js');
  await getIncidentActivity(req, res);
});

app.post("/api/activity", async (req, res) => {
  const { postActivity } = await import('./api/activity.js');
  await postActivity(req, res);
});

// Assignment endpoints
app.get("/api/incidents/:incidentId/assignee", async (req, res) => {
  const { recommendAssignee } = await import('./api/assignment.js');
  await recommendAssignee(req, res);
});

app.post("/api/incidents/:incidentId/assign", async (req, res) => {
  const { assignIncident } = await import('./api/assignment.js');
  await assignIncident(req, res);
});

// Topology endpoint
app.get('/api/topology', async (req, res) => {
  const { getTopology } = await import('./api/topology.js');
  await getTopology(req, res);
});

// Real Webhooks
app.post('/api/webhooks/prometheus', prometheusWebhook);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "SecureOps Sync",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 4321;

// Initialize Lemma before starting the server
initLemma().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize:", err);
  // Still start server in degraded mode
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (degraded mode)`);
  });
});

export default app;