import React from 'react';
import { NavLink } from 'react-router-dom';
import { MaterialSymbol } from '../common/MaterialSymbol';
import { ContextualTooltip } from '../Walkthrough/ContextualTooltip';
import styles from './Sidebar.module.css';

export const Sidebar = ({ isOpen = false }) => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard', tooltip: 'Real-time view of active incidents, severity counts, and the most critical ongoing issue.' },
    { path: '/incidents', label: 'Incidents', icon: 'security', tooltip: 'Full list of all incidents with AI triage, severity filters, and detail views.' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics', tooltip: 'KPIs, reliability scores, incident trends, and executive overview dashboards.' },
    { path: '/runbooks', label: 'Runbooks', icon: 'menu_book', tooltip: 'Automated remediation procedures that can be attached to incidents by severity.' },
    { path: '/submit', label: 'Submit Incident', icon: 'add_circle', tooltip: 'Manually ingest a raw alert for AI-driven triage and runbook generation.' },
    { path: '/settings', label: 'Settings', icon: 'settings', tooltip: 'Configure notifications, theme, integrations, API keys, and team settings.' },
  ];

  return (
    <nav className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.brand}>
        <div className={styles.avatar}>U</div>
        <div>
          <div className={styles.brandName}>SecureOps Sync</div>
          <div className={styles.brandSub}>Incident Response</div>
        </div>
      </div>

      <div className={styles.navList}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
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

      <div className={styles.footer}>
        <div className={styles.footerLinks}>
          <NavLink to="/landing" className={styles.footerLink}>
            <MaterialSymbol icon="open_in_new" />
            <span>Landing Page</span>
          </NavLink>
          <NavLink to="/logout" className={styles.footerLink}>
            <MaterialSymbol icon="logout" />
            <span>Logout</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};