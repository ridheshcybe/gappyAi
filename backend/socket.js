// backend/socket.js
let io;

import { Server } from "socket.io";

function getCorsOrigin() {
  const explicitOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const hardcoded = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4321',
  ];
  const all = [...explicitOrigins, ...hardcoded];

  return (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Exact match against explicit + hardcoded origins
    if (all.includes(origin)) return callback(null, true);
    // Allow any localhost origin in development (handle trailing slash too)
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (/^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  };
}

export function initialize(server) {

  io = new Server(server, {
    cors: {
      origin: getCorsOrigin(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
}

export function emitIncident(incident) {
  if (!io) return;

  io.emit("incident_created", incident);
  // Also emit to incident-specific room
  io.to(`incident:${incident.incidentId || incident.id}`).emit("incident:update", incident);
}

export function emitActivity(activity) {
  if (!io) return;

  // Emit to incident-specific room
  io.to(`incident:${activity.incidentId}`).emit("activity", activity);
  // Emit to global feed room
  io.to("feed").emit("feed:update", activity);
}

export function emitTriageProgress(alertId, stage, progress, message) {
  if (!io) return;

  io.emit("triage:progress", {
    alertId,
    stage,
    progress,
    message,
    timestamp: new Date().toISOString(),
  });
}