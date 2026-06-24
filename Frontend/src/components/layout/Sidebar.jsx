import React from 'react';
import { NavLink } from 'react-router-dom';
import { MaterialSymbol } from '../common/MaterialSymbol';
import styles from './Sidebar.module.css';

export const Sidebar = ({ isOpen = false }) => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/incidents', label: 'Incidents', icon: 'security' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/runbooks', label: 'Runbooks', icon: 'menu_book' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
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
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <MaterialSymbol icon={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className={styles.footer}>
        <button className={styles.onCallBtn}>On-call Status</button>
        <div className={styles.footerLinks}>
          <NavLink to="/support" className={styles.footerLink}>
            <MaterialSymbol icon="help" />
            <span>Support</span>
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