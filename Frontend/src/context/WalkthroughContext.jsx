import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { simulateIncident } from '../lib/simulate-incident';
import { useAuth } from './AuthContext';

const WalkthroughContext = createContext();

const WALKTHROUGH_KEY = 'secureops_walkthrough_completed';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Interactive walkthrough context.
 * Auto-shows tour on first auth (not first visit).
 */
export const WalkthroughProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(() => {
    return localStorage.getItem(WALKTHROUGH_KEY) === 'true';
  });
  const [currentAction, setCurrentAction] = useState(null);
  const [actionResolved, setActionResolved] = useState(false);
  const [sampleIncidentTriggered, setSampleIncidentTriggered] = useState(false);

  // Auto-show walkthrough on first sign-in (not first visit, since landing page shows first)
  useEffect(() => {
    if (isAuthenticated && !hasSeenWalkthrough) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasSeenWalkthrough]);

  const startWalkthrough = useCallback(() => {
    setIsOpen(true);
    setActionResolved(false);
    setCurrentAction(null);
    setSampleIncidentTriggered(false);
  }, []);

  const completeWalkthrough = useCallback(() => {
    setIsOpen(false);
    setHasSeenWalkthrough(true);
    setCurrentAction(null);
    setActionResolved(false);
    localStorage.setItem(WALKTHROUGH_KEY, 'true');
  }, []);

  const dismissWalkthrough = useCallback(() => {
    setIsOpen(false);
    setHasSeenWalkthrough(true);
    setCurrentAction(null);
    setActionResolved(false);
    localStorage.setItem(WALKTHROUGH_KEY, 'true');
  }, []);

  const resetWalkthrough = useCallback(() => {
    setHasSeenWalkthrough(false);
    setSampleIncidentTriggered(false);
    localStorage.removeItem(WALKTHROUGH_KEY);
    setIsOpen(true);
  }, []);

  // Called when a walkthrough step requires an action on a target element
  const registerAction = useCallback((stepId, targetSelector) => {
    setCurrentAction({ stepId, targetSelector });
    setActionResolved(false);
  }, []);

  // Called when the user performs the required action
  const resolveAction = useCallback(() => {
    setActionResolved(true);
    setCurrentAction(null);
  }, []);

  const clearAction = useCallback(() => {
    setCurrentAction(null);
    setActionResolved(false);
  }, []);

  // Trigger a sample incident (via API or simulated)
  const triggerSampleIncident = useCallback(async () => {
    if (sampleIncidentTriggered) return;
    setSampleIncidentTriggered(true);

    const samplePayload = {
      source: 'walkthrough',
      title: 'Payment Gateway Timeout – High Latency on Checkout',
      service: 'Payments API',
      severity: 'P0',
      symptoms: [
        'Checkout endpoint returning 503 for 80% of requests',
        'Postgres connection pool exhausted',
        'Payment processing latency > 30s',
      ],
      timestamp: new Date().toISOString(),
    };

    // Try the real API first — include JWT token
    try {
      const token = (() => { try { return localStorage.getItem('secureops_auth_token'); } catch { return null; } })();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(samplePayload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alertId) {
          const triageHeaders = {};
          if (token) triageHeaders['Authorization'] = `Bearer ${token}`;
          fetch(`${API_URL}/api/triage/${data.alertId}`, {
            method: 'POST',
            headers: triageHeaders,
          }).catch(() => {});
        }
        return;
      }
    } catch {
      // API unavailable, fall through to simulation
    }

    // Use the shared simulateIncident helper
    simulateIncident({
      title: samplePayload.title,
      service: samplePayload.service,
      severity: samplePayload.severity,
      symptoms: samplePayload.symptoms,
    });
  }, [sampleIncidentTriggered]);

  return (
    <WalkthroughContext.Provider
      value={{
        isOpen,
        hasSeenWalkthrough,
        currentAction,
        actionResolved,
        startWalkthrough,
        completeWalkthrough,
        dismissWalkthrough,
        resetWalkthrough,
        registerAction,
        resolveAction,
        clearAction,
        triggerSampleIncident,
        sampleIncidentTriggered,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useWalkthrough = () => {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};
