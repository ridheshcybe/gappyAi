import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MaterialSymbol } from '../common/MaterialSymbol';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../common/AuthModal';
import { ContextualTooltip } from '../Walkthrough/ContextualTooltip';
import styles from './TopNav.module.css';

export const TopNav = ({ onToggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  // Close user menu on Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [userMenuOpen]);

  // Listen for global open-auth event (e.g. from Settings page)
  useEffect(() => {
    const handler = () => setAuthModalOpen(true);
    window.addEventListener('secureops:open-auth', handler);
    return () => window.removeEventListener('secureops:open-auth', handler);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/incidents', label: 'Incidents' },
    { path: '/settings', label: 'Settings' },
  ];

  const handleSignOut = () => {
    setUserMenuOpen(false);
    signOut();
  };

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

        <span className={styles.iconBtnWrapper}>
          <button className={styles.iconBtn}>
            <MaterialSymbol icon="notifications" />
          </button>
          <ContextualTooltip title="Notifications" placement="bottom">
            Real-time alerts for new incidents, status changes, and assigned items.
          </ContextualTooltip>
        </span>

        <span className={styles.iconBtnWrapper}>
          <button className={styles.iconBtn} onClick={toggleTheme}>
            <MaterialSymbol icon={darkMode ? 'dark_mode' : 'light_mode'} />
          </button>
          <ContextualTooltip title="Theme Toggle" placement="bottom">
            Switch between dark and light interface themes.
          </ContextualTooltip>
        </span>

        {isAuthenticated ? (
          <span className={styles.iconBtnWrapper} ref={userMenuRef}>
            <button
              className={`${styles.iconBtn} ${userMenuOpen ? styles.iconBtnActive : ''}`}
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <MaterialSymbol icon="account_circle" />
            </button>
            <ContextualTooltip title="User Profile" placement="bottom">
              Your account, on-call status, and login session.
            </ContextualTooltip>

            {userMenuOpen && (
              <div className={styles.userMenu}>
                <div className={styles.userMenuHeader}>
                  <div className={styles.userAvatar}>
                    <MaterialSymbol icon="account_circle" />
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user?.name || 'User'}</span>
                    <span className={styles.userEmail}>{user?.email || ''}</span>
                  </div>
                </div>
                <div className={styles.userMenuBody}>
                  <div className={styles.userStatus}>
                    <span className={styles.statusDot} />
                    <span>On-Call — Incident Response</span>
                  </div>
                  <Link
                    to="/settings"
                    className={styles.userMenuItem}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <MaterialSymbol icon="settings" />
                    Settings
                  </Link>
                  <button
                    className={styles.userMenuItem}
                    onClick={handleSignOut}
                  >
                    <MaterialSymbol icon="logout" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </span>
        ) : (
          <span className={styles.iconBtnWrapper}>
            <button className={styles.signInBtn} onClick={() => setAuthModalOpen(true)}>
              <MaterialSymbol icon="login" />
              Sign In
            </button>
          </span>
        )}
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
};
