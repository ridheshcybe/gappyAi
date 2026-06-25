// backend/socket.js
let io;

function initialize(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
  });

  return io;
}

function emitIncident(incident) {
  if (!io) return;

  io.emit("incident_created", incident);
  // Also emit to incident-specific room
  io.to(`incident:${incident.id}`).emit("incident:update", incident);
}

function emitActivity(activity) {
  if (!io) return;

  // Emit to incident-specific room
  io.to(`incident:${activity.incidentId}`).emit("activity", activity);
  // Emit to global feed room
  io.to("feed").emit("feed:update", activity);
}

module.exports = {
  initialize,
  emitIncident,
  emitActivity,
};