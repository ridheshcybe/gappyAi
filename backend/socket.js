// backend/socket.js
let io;

import { Server } from "socket.io";
import { isOriginAllowed } from "./lib/cors-utils.js";

function getCorsOrigin() {
  const explicitOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const all = [
    ...explicitOrigins,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4321',
  ];

  return (origin, callback) => {
    callback(null, isOriginAllowed(origin, all));
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