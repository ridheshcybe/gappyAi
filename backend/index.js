import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initLemma } from './lemma-config.js';
import { isOriginAllowed } from './lib/cors-utils.js';
import { startCleanup as startSessionCleanup, createSession, getSession, deleteSession, deleteUserSessions } from './stores/session-store.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { ingestAlert } from "./input-handler.js";
import { triageIncident } from "./triage-pipeline.js";
import incidentStore from "./stores/datastore.js";
import { initialize as initializeSocket } from "./socket.js";
import escalationService from "./services/escalation-service.js";
import { prometheusWebhook } from './api/webhooks.js';
import { users } from './stores/user-store.js';
import {
  beginPasskeyRegistration,
  completePasskeyRegistration,
  beginPasskeyLogin,
  completePasskeyLogin,
  beginPasskeySignup,
  completePasskeySignup,
  listPasskeyCredentials,
  deletePasskeyCredential,
} from './api/auth-passkey.js';

const app = express();

// ── Build allowed origins from env + defaults ──
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [
  ...CORS_ORIGINS,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4321',
];

// Start escalation service
escalationService.start();

// Start session cleanup (hourly)
startSessionCleanup();

app.use(express.json({ limit: '1mb' }));

// ── CORS must run BEFORE auth so CORS headers are set on every response ──
app.use(cors({
  origin: (origin, cb) => {
    cb(null, isOriginAllowed(origin, ALLOWED_ORIGINS));
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

// Serve static files from frontend build
app.use(express.static(join(__dirname, '..', 'Frontend', 'dist')));

// ── In-memory user store for auth (shared with passkey module) ──
// users is imported from './stores/user-store.js'

// ── Passkey Auth Routes (no JWT required) ──
app.post("/api/auth/passkey/signup/begin", beginPasskeySignup);
app.post("/api/auth/passkey/signup/complete", completePasskeySignup);
app.post("/api/auth/passkey/register/begin", beginPasskeyRegistration);
app.post("/api/auth/passkey/register/complete", completePasskeyRegistration);
app.post("/api/auth/passkey/login/begin", beginPasskeyLogin);
app.post("/api/auth/passkey/login/complete", completePasskeyLogin);
// ── Auth Routes (session-based) ──
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const id = `user_${Date.now()}`;
    const user = { id, name, email, password };
    users.push(user);
    const { password: _, ...safeUser } = user;
    const session = createSession(user);
    res.json({ success: true, user: safeUser, token: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const { password: _, ...safeUser } = found;
    const session = createSession(found);
    res.json({ success: true, user: safeUser, token: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Session Authentication Middleware (replaces JWT) ──
function requireSession(req, res, next) {
  // Skip auth for health check, webhooks, and static frontend routes
  if (req.path === '/api/health' || req.path.startsWith('/api/webhooks/') || !req.path.startsWith('/api/')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const sessionId = authHeader.slice(7);
  console.log('Session middleware: checking session', sessionId, 'for path:', req.path);
  const session = getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.user = session;
  next();
}

// Session auth middleware
app.use(requireSession);

app.get("/api/auth/me", async (req, res) => {
  const session = req.user;
  if (!session) {
    return res.json({ success: true, user: null });
  }
  const found = users.find(u => u.id === session.userId);
  if (!found) {
    return res.json({ success: true, user: null });
  }
  const { password: _, ...safeUser } = found;
  res.json({ success: true, user: safeUser });
});

app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    deleteSession(authHeader.slice(7));
  }
  res.json({ success: true });
});

// ── Passkey Credential Management Routes (protected by session middleware) ──
app.get("/api/passkey/credentials", listPasskeyCredentials);
app.delete("/api/passkey/credential/:idx", deletePasskeyCredential);

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

// SPA fallback: serve index.html for all non-API GET requests
app.get(/^(?!\/api\/).*/, (req, res) => {
  // For all non-API GET requests, serve the frontend index.html
  res.sendFile(join(__dirname, '..', 'Frontend', 'dist', 'index.html'));
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
