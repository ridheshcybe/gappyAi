import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || '';
const USER_KEY = 'secureops_auth_user';
const TOKEN_KEY = 'secureops_auth_token';

/**
 * Get the stored auth token (for use by api.js without React hooks).
 */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Get the stored user (for use by api.js without React hooks).
 */
export function getStoredUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [online, setOnline] = useState(() => {
    try {
      const stored = localStorage.getItem('secureops_online');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  // Persist user + token to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // Persist online status
  useEffect(() => {
    localStorage.setItem('secureops_online', JSON.stringify(online));
  }, [online]);

  // Listen for session-expired events from api.js
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('secureops:session-expired', handler);
    return () => window.removeEventListener('secureops:session-expired', handler);
  }, []);

  // Validate stored token on mount
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.user) {
            // Token invalid — clear session
            setUser(null);
            setToken(null);
          }
        })
        .catch(() => {
          // Backend unavailable — keep session as-is
        });
    }
  }, []); // only on mount



  /**
   * Register a new passkey for the currently signed-in user.
   * 1. Gets registration options from backend
   * 2. Triggers browser's WebAuthn create prompt (Touch ID / Face ID)
   * 3. Sends the response back to complete registration
   */
  const registerPasskey = useCallback(async (emailOverride, nameOverride, tokenOverride) => {
    const activeEmail = emailOverride || user?.email;
    const activeName = nameOverride || user?.name;
    const activeToken = tokenOverride || token;
    if (!activeEmail || !activeToken) {
      throw new Error('You must be signed in to register a passkey');
    }

    // Step 1: Get registration options
    const beginRes = await fetch(`${API_URL}/api/auth/passkey/register/begin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({ email: activeEmail, name: activeName }),
    });
    const beginData = await beginRes.json();
    if (!beginRes.ok || !beginData.success) {
      throw new Error(beginData.error || 'Failed to start passkey registration');
    }

    // Step 2: Trigger browser WebAuthn prompt
    const regResponse = await startRegistration({ optionsJSON: beginData.options });

    // Step 3: Complete registration
    const completeRes = await fetch(`${API_URL}/api/auth/passkey/register/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({ email: activeEmail, response: regResponse }),
    });
    const completeData = await completeRes.json();
    if (!completeRes.ok || !completeData.success) {
      throw new Error(completeData.error || 'Passkey registration failed');
    }

    return true;
  }, [user, token]);

  /**
   * Sign up using only a passkey (no email/password needed).
   * 1. Sends name to backend to get registration options
   * 2. Triggers browser's WebAuthn prompt (fingerprint/face/Touch ID)
   * 3. Sends the response back to complete registration
   * 4. Receives JWT + user data
   */
  const passkeySignUp = useCallback(async (name) => {
    // Step 1: Get registration options
    const beginRes = await fetch(`${API_URL}/api/auth/passkey/signup/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const beginData = await beginRes.json();
    if (!beginRes.ok || !beginData.success) {
      throw new Error(beginData.error || 'Failed to start passkey signup');
    }

    // Step 2: Trigger browser WebAuthn prompt (fingerprint/Touch ID)
    const regResponse = await startRegistration({ optionsJSON: beginData.options });

    // Step 3: Complete registration (creates the user account)
    const completeRes = await fetch(`${API_URL}/api/auth/passkey/signup/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: beginData.email, response: regResponse }),
    });
    const completeData = await completeRes.json();
    if (!completeRes.ok || !completeData.success) {
      throw new Error(completeData.error || 'Passkey signup failed');
    }

    setToken(completeData.token);
    setUser(completeData.user);
    // Persist immediately so api.js can read from localStorage on the next tick
    try { localStorage.setItem(TOKEN_KEY, completeData.token); } catch {}
    try { localStorage.setItem(USER_KEY, JSON.stringify(completeData.user)); } catch {}
    return completeData.user;
  }, []);

  /**
   * Sign in with passkey WITHOUT requiring an email (uses discoverable credentials).
   * The browser will present a list of available passkeys for the user to choose from.
   */
  const passkeyOnlyLogin = useCallback(async () => {
    // Step 1: Get authentication options WITHOUT email (discoverable credentials)
    const beginRes = await fetch(`${API_URL}/api/auth/passkey/login/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const beginData = await beginRes.json();
    if (!beginRes.ok || !beginData.success) {
      throw new Error(beginData.error || 'No passkey available');
    }

    // Step 2: Trigger browser WebAuthn prompt (browser shows available passkeys)
    const authResponse = await startAuthentication({ optionsJSON: beginData.options });

    // Step 3: Complete authentication with the session key
    const completeRes = await fetch(`${API_URL}/api/auth/passkey/login/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: authResponse,
        sessionKey: beginData.sessionKey,
      }),
    });
    const completeData = await completeRes.json();
    if (!completeRes.ok || !completeData.success) {
      throw new Error(completeData.error || 'Passkey authentication failed');
    }

    setToken(completeData.token);
    setUser(completeData.user);
    try { localStorage.setItem(TOKEN_KEY, completeData.token); } catch {}
    try { localStorage.setItem(USER_KEY, JSON.stringify(completeData.user)); } catch {}
    return completeData.user;
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    // Clear localStorage immediately so api.js stops sending stale tokens
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    try { localStorage.removeItem(USER_KEY); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, online, setOnline, signOut, passkeySignUp, passkeyOnlyLogin, registerPasskey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
