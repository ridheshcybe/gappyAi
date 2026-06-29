// backend/api/auth-passkey.js
// WebAuthn / Passkey authentication using SimpleWebAuthn

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import jwt from "jsonwebtoken";
import { users } from '../stores/user-store.js';
import { createSession } from '../stores/session-store.js';
import incidentStore from '../stores/datastore.js';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const CREDENTIALS_FILE = path.resolve(__dirname, '../data/passkey-credentials.json');
const CHALLENGES_FILE = path.resolve(__dirname, '../data/passkey-challenges.json');

const CREDENTIALS_KEY = 'passkey:credentials';
const CHALLENGES_KEY = 'passkey:challenges';

// In-memory credential store: email -> [{ id, publicKey, counter, transports, credentialDeviceType, credentialBackedUp }]
const credentials = new Map();

// In-memory challenge store: userId (for registration) or session (for auth) -> challenge
const challengeStore = new Map();

function ensureDataDir() {
  try {
    fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
  } catch {}
}

function loadFromFile(filePath) {
  try {
    ensureDataDir();
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveToFile(filePath, data) {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch {}
}

function loadCredentials() {
  try {
    const fileData = loadFromFile(CREDENTIALS_FILE);
    if (fileData && typeof fileData === 'object') {
      for (const [email, creds] of Object.entries(fileData)) {
        credentials.set(email, creds);
      }
      return;
    }
  } catch {}

  // Fallback to incidentStore asynchronously (best effort)
  if (incidentStore.fetch) {
    incidentStore.fetch(CREDENTIALS_KEY).then((stored) => {
      if (stored && typeof stored === 'object') {
        for (const [email, creds] of Object.entries(stored)) {
          credentials.set(email, creds);
        }
      }
    }).catch(() => {});
  }
}

function persistCredentials() {
  const obj = {};
  for (const [email, creds] of credentials.entries()) {
    obj[email] = creds;
  }
  incidentStore.save(CREDENTIALS_KEY, obj).catch(() => {});
  saveToFile(CREDENTIALS_FILE, obj);
}

function persistChallenges() {
  const obj = {};
  for (const [key, val] of challengeStore.entries()) {
    obj[key] = val;
  }
  incidentStore.save(CHALLENGES_KEY, obj).catch(() => {});
  saveToFile(CHALLENGES_FILE, obj);
}

loadCredentials();

const JWT_SECRET = process.env.JWT_SECRET || "secureops-dev-secret-change-in-production";
const RP_NAME = "SecureOps Sync";

// Helper to get hostname from request (without port)
function getHostnameFromReq(req) {
  const host = req.headers.host || '';
  return host.split(':')[0];
}

// Helper to get origin from request (using the Origin header sent by browser)
function getOriginFromReq(req) {
  const origin = req.headers.origin;
  if (origin) {
    return origin;
  }
  // Fallback: construct from request (should not happen in browser context)
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('Host') || '';
  return `${protocol}://${host}`;
}

/**
 * Get the authenticated user's email from the session middleware.
 */
function getUserEmail(req) {
  return req.user?.email || req.body?.email || null;
}

/**
 * GET /api/auth/passkey/credentials
 * Lists all passkey credentials for the authenticated user.
 */
export async function listPasskeyCredentials(req, res) {
  try {
    console.log('listPasskeyCredentials called, req.user:', req.user);
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userCreds = credentials.get(email) || [];
    // Return safe metadata (no publicKey material)
    const safe = userCreds.map((cred, idx) => ({
      id: cred.id,
      idx,
      deviceType: cred.credentialDeviceType || 'unknown',
      backedUp: cred.credentialBackedUp || false,
      transports: cred.transports || [],
      createdAt: cred.createdAt || null,
    }));

    res.json({ success: true, credentials: safe });
  } catch (err) {
    console.error("List passkey credentials error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/auth/passkey/credential/:idx
 * Deletes a passkey credential by index for the authenticated user.
 */
export async function deletePasskeyCredential(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const idx = parseInt(req.params.idx, 10);
    const userCreds = credentials.get(email) || [];

    if (isNaN(idx) || idx < 0 || idx >= userCreds.length) {
      return res.status(404).json({ error: "Credential not found" });
    }

    userCreds.splice(idx, 1);
    if (userCreds.length === 0) {
      credentials.delete(email);
    } else {
      credentials.set(email, userCreds);
    }
    persistCredentials();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete passkey credential error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/passkey/signup/begin
 * Generates registration options for a NEW passkey-only account (no email/password required).
 */
export async function beginPasskeySignup(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Derive a unique email from the name for the user record
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const email = `passkey_${slug}_${Date.now()}@passkey.local`;

    const opts = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: getHostnameFromReq(req),
      userName: email,
      userDisplayName: name.trim(),
      attestationType: "none",
      excludeCredentials: [],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },
    });

    // Store the challenge keyed by the derived email
    challengeStore.set(`signup:${email}`, { challenge: opts.challenge, name: name.trim(), email });

    res.json({ success: true, options: opts, email });
  } catch (err) {
    console.error("Passkey signup begin error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/passkey/signup/complete
 * Verifies the browser's registration response and creates a new user account.
 */
export async function completePasskeySignup(req, res) {
  try {
    const { email, response } = req.body;
    if (!email || !response) {
      return res.status(400).json({ error: "Email and response required" });
    }

    const stored = challengeStore.get(`signup:${email}`);
    if (!stored) {
      return res.status(400).json({ error: "No signup challenge found. Start again." });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: getOriginFromReq(req),
      expectedRPID: getHostnameFromReq(req),
    });

    if (!verification.verified) {
      return res.status(400).json({ error: "Passkey verification failed" });
    }

    const { registrationInfo } = verification;

    // Store the credential
    const userCreds = credentials.get(email) || [];
    userCreds.push({
      id: normalizeCredId(registrationInfo.credential.id),
      publicKey: Buffer.from(registrationInfo.credential.publicKey).toString('base64'),
      counter: registrationInfo.credential.counter,
      transports: response.response?.transports || ["internal"],
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
    });
    credentials.set(email, userCreds);
    persistCredentials();

    // Create the user account
    const id = `user_passkey_${Date.now()}`;
    const userEntry = { id, name: stored.name, email };
    users.push(userEntry);
    const { password: _, ...safeUser } = userEntry;

    // Generate session token
    const session = createSession(userEntry);

    // Clean up challenge
    challengeStore.delete(`signup:${email}`);
    persistChallenges();

    console.log('Passkey signup complete:', { email, sessionId: session.id });
    res.json({ success: true, user: safeUser, token: session.id });
  } catch (err) {
    console.error("Passkey signup complete error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/passkey/register/begin
 * Generates registration options for the authenticated user to create a passkey.
 */
export async function beginPasskeyRegistration(req, res) {
  try {
    const email = getUserEmail(req);
    const name = req.body.name;
    if (!email) {
      return res.status(400).json({ error: "Email required. Sign in first." });
    }

    const opts = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: getHostnameFromReq(req),
      userName: email,
      userDisplayName: name || email,
      attestationType: "none",
      // Exclude already-registered credentials for this user
      excludeCredentials: (credentials.get(email) || []).map((cred) => ({
        id: cred.id,
        type: "public-key",
        transports: cred.transports || ["internal"],
      })),
      authenticatorSelection: {
        // Prefer platform authenticators (built-in fingerprint/face) over cross-platform
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },
    });

    // Store the challenge for verification later
    challengeStore.set(email, opts.challenge);

    res.json({ success: true, options: opts });
  } catch (err) {
    console.error("Passkey registration begin error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/passkey/register/complete
 * Verifies the browser's registration response and stores the credential.
 */
export async function completePasskeyRegistration(req, res) {
  try {
    const email = getUserEmail(req);
    const { response } = req.body;
    if (!email || !response) {
      return res.status(400).json({ error: "Email and response required" });
    }

    const expectedChallenge = challengeStore.get(email);
    if (!expectedChallenge) {
      return res.status(400).json({ error: "No registration challenge found. Start again." });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOriginFromReq(req),
      expectedRPID: getHostnameFromReq(req),
    });

    if (!verification.verified) {
      return res.status(400).json({ error: "Passkey verification failed" });
    }

    const { registrationInfo } = verification;
    // Store the credential
    const userCreds = credentials.get(email) || [];
    userCreds.push({
      id: normalizeCredId(registrationInfo.credentialID),
      publicKey: registrationInfo.credentialPublicKey,
      counter: registrationInfo.counter,
      transports: response.response.transports || ["internal"],
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
    });
    credentials.set(email, userCreds);
    persistCredentials();

    // Clean up challenge
    challengeStore.delete(email);
    persistChallenges();

    res.json({ success: true, verified: true });
  } catch (err) {
    console.error("Passkey registration complete error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Normalize a credential ID for comparison.
 * Server-side IDs are Buffers/Uint8Arrays, client-side IDs are base64url strings.
 */
function normalizeCredId(id) {
  if (typeof id === 'string') return id;
  if (Buffer.isBuffer(id)) return id.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (id instanceof Uint8Array) return Buffer.from(id).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return String(id);
}

/**
 * Find the email associated with a credential ID by searching all stored credentials.
 */
function findEmailByCredentialId(credId) {
  const targetId = normalizeCredId(credId);
  for (const [email, creds] of credentials.entries()) {
    const match = creds.find((c) => normalizeCredId(c.id) === targetId);
    if (match) return email;
  }
  return null;
}

/**
 * Generate a temporary session key for email-less authentication.
 */
let _anonSessionCounter = 0;
function nextAnonSessionKey() {
  return `anon_auth_${++_anonSessionCounter}_${Date.now()}`;
}

/**
 * POST /api/auth/passkey/login/begin
 * Generates authentication options for a passkey login.
 * If email is provided, restricts to that user's credentials.
 * If email is NOT provided, uses discoverable credentials (browser picks the identity).
 */
export async function beginPasskeyLogin(req, res) {
  try {
    const { email } = req.body;

    let opts;
    if (email) {
      const userCreds = credentials.get(email);
      if (!userCreds || userCreds.length === 0) {
        return res.status(404).json({ error: "No passkey found for this account. Register one first." });
      }
      opts = await generateAuthenticationOptions({
        rpID: getHostnameFromReq(req),
        allowCredentials: userCreds.map((cred) => ({
          id: cred.id,
          type: "public-key",
          transports: cred.transports || ["internal"],
        })),
        userVerification: "preferred",
      });
      challengeStore.set(`auth:${email}`, opts.challenge);
    } else {
      // No email — list ALL known credentials so the browser can match any passkey.
      // This works with both discoverable and non-discoverable credentials,
      // unlike allowCredentials: [] which only works with resident keys.
      const allCreds = [];
      for (const [, creds] of credentials.entries()) {
        for (const cred of creds) {
          allCreds.push({
            id: cred.id,
            type: "public-key",
            transports: cred.transports || ["internal"],
          });
        }
      }
      opts = await generateAuthenticationOptions({
        rpID: getHostnameFromReq(req),
        allowCredentials: allCreds.length > 0 ? allCreds : [],
        userVerification: "preferred",
      });
      const sessionKey = nextAnonSessionKey();
      challengeStore.set(sessionKey, opts.challenge);
      // Return the session key so the client can pass it back
      return res.json({ success: true, options: opts, sessionKey });
    }

    res.json({ success: true, options: opts });
  } catch (err) {
    console.error("Passkey login begin error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/passkey/login/complete
 * Verifies the authentication response and issues a JWT.
 * Supports both email-based and email-less (discoverable credential) flows.
 */
export async function completePasskeyLogin(req, res) {
  try {
    const { email, response, sessionKey } = req.body;
    if (!response) {
      return res.status(400).json({ error: "Response required" });
    }

    let expectedChallenge;
    let resolvedEmail = email;

    if (sessionKey) {
      // Email-less flow: look up challenge by session key
      expectedChallenge = challengeStore.get(sessionKey);
      if (!expectedChallenge) {
        return res.status(400).json({ error: "No authentication challenge found. Start again." });
      }
      // Resolve email by looking up the credential across all stored credentials
      const credId = response.id || response.rawId;
      resolvedEmail = findEmailByCredentialId(credId);
      if (!resolvedEmail) {
        return res.status(404).json({ error: "Passkey not recognized. Sign up first." });
      }
      challengeStore.delete(sessionKey);
      persistChallenges();
    } else {
      // Email-based flow
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      expectedChallenge = challengeStore.get(`auth:${email}`);
      if (!expectedChallenge) {
        return res.status(400).json({ error: "No authentication challenge found. Start again." });
      }
      challengeStore.delete(`auth:${email}`);
      persistChallenges();
    }

    const userCreds = credentials.get(resolvedEmail);
    if (!userCreds || userCreds.length === 0) {
      return res.status(404).json({ error: "No passkey found for this account." });
    }

    // Find the credential the user authenticated with
    // Prefer response.id (base64url string) over rawId (may be serialized to {})
    const targetId = normalizeCredId(response.id || response.rawId);
    const authCred = userCreds.find((cred) => normalizeCredId(cred.id) === targetId);
    if (!authCred) {
      return res.status(400).json({ error: "Credential not recognized" });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOriginFromReq(req),
      expectedRPID: getHostnameFromReq(req),
      credential: {
        id: authCred.id,
        publicKey: Buffer.from(authCred.publicKey, 'base64'),
        counter: authCred.counter,
        transports: authCred.transports,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ error: "Passkey authentication failed" });
    }

    // Update the credential counter
    authCred.counter = verification.authenticationInfo.newCounter;
    persistCredentials();

    // Find or create the user in the shared user store
    let userEntry = users.find((u) => u && u.email === resolvedEmail);
    if (!userEntry) {
      const id = `user_passkey_${Date.now()}`;
      userEntry = { id, name: resolvedEmail.split("@")[0], email: resolvedEmail };
      users.push(userEntry);
    }
    const { password: _, ...safeUser } = userEntry;

    // Create session for the authenticated user
    const session = createSession(userEntry);

    res.json({ success: true, user: safeUser, token: session.id });
  } catch (err) {
    console.error("Passkey login complete error:", err);
    res.status(500).json({ error: err.message });
  }
}
