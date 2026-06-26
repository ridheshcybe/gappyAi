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

// ── Build allowed origins from env + defaults ──
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
ALLOWED_ORIGINS.push(
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4321',
);

// Start escalation service
escalationService.start();

app.use(express.json({ limit: '1mb' }));

// ── CORS must run BEFORE auth so CORS headers are set on every response ──
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // Allow any localhost origin in development
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (/^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin)) return cb(null, true);
    cb(new Error(`Origin "${origin}" not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
  credentials: true,
}));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── Security Headers ──
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ── API Key Authentication (runs AFTER CORS so auth errors get CORS headers) ──
const API_KEY = process.env.API_KEY || '';

function requireAuth(req, res, next) {
  // Skip auth for health check (used by load balancers)
  if (req.path === '/api/health') return next();
  // Skip auth for GET read-only endpoints
  if (req.method === 'GET') return next();
  // Require valid API key for all write operations
  const provided = req.headers['x-api-key'];
  if (API_KEY && provided !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use(requireAuth);

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

// ── Global Error Handler (sanitizes internal details) ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message
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