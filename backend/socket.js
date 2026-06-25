// backend/socket.js
let io;

import { Server } from "socket.io";
export function initialize(server) {

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
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