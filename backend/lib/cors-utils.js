// backend/lib/cors-utils.js
// Shared CORS origin validation — used by both Express (index.js) and Socket.IO (socket.js)

/**
 * Check whether the given origin is allowed.
 * Accepts:
 *  - Any origin from the explicit list
 *  - Any localhost origin (any port)
 *  - Any Render .onrender.com domain
 *
 * @param {string} origin - The Origin header value
 * @param {string[]} extraAllowed - Additional explicit origins to allow
 * @returns {boolean}
 */
export function isOriginAllowed(origin, extraAllowed = []) {
  if (!origin) return true;

  const cleanOrigin = origin.replace(/\/+$/, '');

  // Exact match against explicit origins
  if (extraAllowed.includes(cleanOrigin)) return true;

  // Allow any localhost origin (any port)
  if (/^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin)) return true;

  // Allow Render production domains (random subdomain .onrender.com)
  try {
    const url = new URL(cleanOrigin);
    if (url.hostname.endsWith('.onrender.com')) return true;
  } catch {
    // Malformed URL — not allowed
  }

  return false;
}
