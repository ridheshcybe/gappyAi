import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const sessions = new Map();
const SESSIONS_KEY = 'sessions:all';
const SESSIONS_FILE = path.resolve(__dirname, '../data/sessions.json');
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function ensureDataDir() {
  try {
    fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
  } catch {}
}

function loadFromFile() {
  try {
    ensureDataDir();
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const now = new Date();
      for (const sess of parsed) {
        if (new Date(sess.expiresAt) >= now) {
          sessions.set(sess.id, sess);
        }
      }
    }
  } catch {}
}

function saveToFile() {
  try {
    ensureDataDir();
    const arr = Array.from(sessions.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(arr, null, 2));
  } catch {}
}

function init() {
  loadFromFile();
  console.log('Session store initialized, sessions in memory:', sessions.size);
}

function persist() {
  saveToFile();
}

export function createSession(user) {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const session = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  sessions.set(sessionId, session);
  persist();
  console.log('Session created:', sessionId, 'for user:', user.email);
  return session;
}

export function getSession(sessionId) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  console.log('getSession:', sessionId, '->', session ? 'found' : 'not found', 'total sessions:', sessions.size);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    sessions.delete(sessionId);
    persist();
    return null;
  }
  session.lastActive = new Date().toISOString();
  return session;
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
  persist();
}

export function deleteUserSessions(userId) {
  for (const [id, sess] of sessions.entries()) {
    if (sess.userId === userId) sessions.delete(id);
  }
  persist();
}

export function getUserSessions(userId) {
  const result = [];
  for (const [, sess] of sessions.entries()) {
    if (sess.userId === userId) result.push({ ...sess });
  }
  return result;
}

export function getAllSessions() {
  const result = [];
  for (const [, sess] of sessions.entries()) {
    result.push({ ...sess });
  }
  return result;
}

export function cleanupExpired() {
  const now = new Date();
  for (const [id, session] of sessions.entries()) {
    if (new Date(session.expiresAt) < now) {
      sessions.delete(id);
    }
  }
  persist();
}

let _cleanupInterval = null;

export function startCleanup() {
  if (_cleanupInterval) return;
  _cleanupInterval = setInterval(cleanupExpired, 60 * 60 * 1000);
}

init();
