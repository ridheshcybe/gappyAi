import React from 'react';
import { NavLink } from 'react-router-dom';
import { MaterialSymbol } from '../common/MaterialSymbol';
import { ContextualTooltip } from '../Walkthrough/ContextualTooltip';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './Sidebar.module.css';

export const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, online, isAuthenticated, signOut } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard', tooltip: 'Real-time view of active incidents, severity counts, and the most critical ongoing issue.' },
    { path: '/incidents', label: 'Incidents', icon: 'security', tooltip: 'Full list of all incidents with AI triage, severity filters, and detail views.' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics', tooltip: 'KPIs, reliability scores, incident trends, and executive overview dashboards.' },
    { path: '/submit', label: 'Submit Incident', icon: 'add_circle', tooltip: 'Manually ingest a raw alert for AI-driven triage.' },
    { path: '/settings', label: 'Settings', icon: 'settings', tooltip: 'Configure notifications, theme, and team settings.' },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <nav className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Close button (mobile) */}
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">
        <MaterialSymbol icon="close" />
      </button>

      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.avatar}>{userInitial}</div>
        <div className={styles.brandInfo}>
          <div className={styles.brandName}>{user?.name || 'SecureOps Sync'}</div>
          <div className={styles.brandSub}>{isAuthenticated ? 'Welcome back' : 'Incident Response'}</div>
          {isAuthenticated && (
            <div className={styles.statusRow}>
              <span className={`${styles.statusDot} ${online ? styles.statusDotOn : styles.statusDotOff}`} />
              <span className={styles.statusLabel}>{online ? 'Online' : 'Offline'}</span>
              <NavLink to="/settings" className={styles.statusSettings} title="Manage online status" onClick={handleNavClick}>
                <MaterialSymbol icon="tune" />
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Theme Toggle */}
      <button className={styles.themeToggle} onClick={toggleTheme}>
        <MaterialSymbol icon={darkMode ? 'dark_mode' : 'light_mode'} />
        <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
      </button>

      {/* Nav */}
      <div className={styles.navList}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            onClick={handleNavClick}
          >
            <MaterialSymbol icon={item.icon} />
            <span className={styles.navItemLabel}>{item.label}</span>
            {item.tooltip && (
              <ContextualTooltip title={item.label}>
                {item.tooltip}
              </ContextualTooltip>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {isAuthenticated && (
          <div className={styles.footerLinks}>
            <button className={styles.footerLinkBtn} onClick={signOut}>
              <MaterialSymbol icon="logout" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
