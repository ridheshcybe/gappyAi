import incidentStore from './datastore.js';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const _users = [];
const USERS_KEY = 'users:all';
const USERS_FILE = path.resolve(__dirname, '../data/users.json');

function ensureDataDir() {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  } catch {}
}

function loadFromFile() {
  try {
    ensureDataDir();
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      _users.push(...parsed);
    }
  } catch {}
}

function saveToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(_users, null, 2));
  } catch {}
}

function init() {
  try {
    loadFromFile();
  } catch {
    // Start empty
  }
}

function persist() {
  try {
    saveToFile();
  } catch {
    // Best effort
  }
}

const originalPush = _users.push.bind(_users);
_users.push = function (item) {
  const result = originalPush(item);
  persist();
  return result;
};

init();

export { _users as users };
