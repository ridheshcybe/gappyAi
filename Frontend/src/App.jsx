import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Settings from './pages/Settings/Settings';
import SubmitIncident from './pages/SubmitIncident/SubmitIncident';
import Landing from './pages/Landing/Landing';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/submit" element={<SubmitIncident />} />
            <Route path="/landing" element={<Landing />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;