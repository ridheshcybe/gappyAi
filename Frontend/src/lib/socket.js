import { io } from "socket.io-client";

// Socket connects to the API backend (same origin as frontend)
// In development, VITE_API_URL can be used if needed
const SOCKET_URL =
  import.meta.env.VITE_API_URL || window.location.origin;

export const socket = io(SOCKET_URL);