import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MaterialSymbol } from '../common/MaterialSymbol';
import { useTheme } from '../../context/ThemeContext';
import styles from './TopNav.module.css';

export const TopNav = ({ onToggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/incidents', label: 'Incidents' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onToggleSidebar}>
          <MaterialSymbol icon="menu" />
        </button>
        <Link to="/" className={styles.logo}>
          SecureOps Sync
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${
                location.pathname === item.path ? styles.active : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <MaterialSymbol icon="search" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search incidents..."
            className={styles.searchInput}
          />
        </div>

        <button className={styles.iconBtn}>
          <MaterialSymbol icon="notifications" />
        </button>

        <button className={styles.iconBtn} onClick={toggleTheme}>
          <MaterialSymbol icon={darkMode ? 'dark_mode' : 'light_mode'} />
        </button>

        <button className={styles.iconBtn}>
          <MaterialSymbol icon="account_circle" />
        </button>
      </div>
    </header>
  );
};