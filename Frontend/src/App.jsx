import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalkthroughProvider } from './context/WalkthroughContext';
import { Walkthrough } from './components/Walkthrough/Walkthrough';
import { ToastProvider } from './components/common/Toast';
import { AuthModal } from './components/common/AuthModal';
import { MaterialSymbol } from './components/common/MaterialSymbol';
import Dashboard from './pages/Dashboard/Dashboard';
import Incidents from './pages/Incidents/Incidents';
import Analytics from './pages/Analytics/Analytics';
import IncidentDetail from './pages/IncidentDetail/IncidentDetail';
import Settings from './pages/Settings/Settings';
import SubmitIncident from './pages/SubmitIncident/SubmitIncident';
import ProcessingBar from './components/ProcessingBar';

// ── Auth gate: shows branded auth page when not signed in ──
function AppShell() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Listen for global open-auth event (e.g. from Settings page)
  useEffect(() => {
    const handler = () => setAuthModalOpen(true);
    window.addEventListener('secureops:open-auth', handler);
    return () => window.removeEventListener('secureops:open-auth', handler);
  }, []);

  // ── Not authenticated — show branded auth landing ──
  if (!isAuthenticated) {
    return (
      <div className="auth-landing">
        <div className="auth-landing-inner">
          <div className="auth-landing-brand">
            <div className="auth-landing-logo">U</div>
            <h1>SecureOps Sync</h1>
            <p>Incident Response Platform</p>
          </div>
          <button className="auth-landing-btn" onClick={() => setAuthModalOpen(true)}>
            <MaterialSymbol icon="login" />
            Sign In to Continue
          </button>
          <p className="auth-landing-hint">
            Sign in with your passkey to access the dashboard.
          </p>
        </div>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  // ── Authenticated — full app layout ──
  return (
    <>
      {/* Floating hamburger (visible on mobile only) */}
      <button
        className="app-hamburger"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <MaterialSymbol icon="menu" />
      </button>

      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/submit" element={<SubmitIncident />} />
          </Routes>
        </main>
      </div>

      <Walkthrough />
      <ProcessingBar />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WalkthroughProvider>
            <AppShell />
          </WalkthroughProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
