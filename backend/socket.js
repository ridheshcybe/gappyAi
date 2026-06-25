// backend/socket.js
let io;

import { Server } from "socket.io";

function getAllowedOrigins() {
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  origins.push(
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4321',
  );
  return origins;
}

export function initialize(server) {

  io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
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