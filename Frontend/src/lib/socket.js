import { io } from "socket.io-client";

// Socket connects to the API backend (same as REST API)
// In production, VITE_API_URL must be set to the backend URL
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  window.location.origin;

export const socket = io(SOCKET_URL);