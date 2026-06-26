import React, { useState } from 'react';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import { Toggle } from '../../components/common/Toggle';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';
import styles from './Settings.module.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [onCall, setOnCall] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: false,
  });
  const { darkMode, toggleTheme } = useTheme();

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'api', label: 'API Keys' },
    { id: 'team', label: 'Team' },
    { id: 'billing', label: 'Billing' },
  ];

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <nav className={styles.sidebar}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.active : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'general' && (
            <div className={styles.tabPanel}>
              <div className={styles.tabHeader}>
                <h3>General Settings</h3>
                <p>Manage your account availability and global display preferences.</p>
              </div>

              <section className={styles.card}>
                <div className={styles.cardDecor}></div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLeft}>
                    <h4>
                      <MaterialSymbol icon="phone_in_talk" className={styles.iconPrimary} />
                      Active On-Call Status
                    </h4>
                    <p>
                      When enabled, you will receive immediate paging for P0 and P1 incidents
                      based on your escalation policy.
                    </p>
                  </div>
                  <Toggle
                    id="onCallToggle"
                    checked={onCall}
                    onChange={() => setOnCall(!onCall)}
                  />
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.statusDot}>
                    <span className={styles.statusPing}></span>
                    <span className={styles.statusStatic}></span>
                  </span>
                  <span className={styles.statusText}>
                    Current Shift: Primary Responder (Ends in 4h 23m)
                  </span>
                </div>
              </section>

              <section className={styles.card}>
                <h4>
                  <MaterialSymbol icon="notifications_active" className={styles.iconPrimary} />
                  Notification Routing
                </h4>
                <p>Select where you want to receive alerts for low-priority (P2/P3) updates.</p>
                <div className={styles.checkboxGroup}>
                  {[
                    { key: 'email', label: 'Email Summaries', desc: 'Sent to alex.m@secureops.internal' },
                    { key: 'desktop', label: 'Desktop Push Notifications', desc: 'Requires browser permission' },
                  ].map((item) => (
                    <label key={item.key} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={() => handleNotificationChange(item.key)}
                      />
                      <div>
                        <span>{item.label}</span>
                        <span>{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section className={styles.card}>
                <h4>
                  <MaterialSymbol icon="palette" className={styles.iconPrimary} />
                  Interface Theme
                </h4>
                <div className={styles.themeGrid}>
                  <label className={styles.themeOption}>
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={darkMode}
                      onChange={toggleTheme}
                    />
                    <div>
                      <div className={styles.themePreviewDark}></div>
                      <div>
                        <span className={styles.themeDot}></span>
                        <span>Dark Mode</span>
                      </div>
                    </div>
                  </label>

                  <label className={`${styles.themeOption} ${styles.disabled}`}>
                    <input type="radio" name="theme" value="light" disabled />
                    <div>
                      <div className={styles.themePreviewLight}></div>
                      <div>
                        <span className={styles.themeDotDisabled}></span>
                        <span>Light Mode</span>
                      </div>
                    </div>
                  </label>
                </div>
              </section>

              <div className={styles.saveRow}>
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className={styles.tabPanel}>
              <div className={styles.tabHeader}>
                <h3>Connected Services</h3>
                <p>Manage external tools linked to your SecureOps Sync workspace.</p>
              </div>

              <div className={styles.integrationGrid}>
                <div className={styles.integrationCard}>
                  <div className={styles.integrationHeader}>
                    <div className={styles.integrationIcon}>
                      <MaterialSymbol icon="contact_emergency" />
                    </div>
                  </div>
                  <h4>PagerDuty</h4>
                  <p>Sync escalation policies and trigger on-call routing automatically.</p>
                  <div className={styles.integrationFooter}>
                    <button className={styles.connectBtn}>Connect</button>
                  </div>
                </div>

                <div className={styles.integrationCard}>
                  <div className={styles.integrationHeader}>
                    <div className={styles.integrationIcon}>
                      <MaterialSymbol icon="code" />
                    </div>
                    <div className={styles.connectedBadge}>
                      <MaterialSymbol icon="check_circle" />
                      Connected
                    </div>
                  </div>
                  <h4>GitHub Enterprise</h4>
                  <p>Link commits to incidents and automate runbook execution.</p>
                  <div className={styles.integrationFooter}>
                    <span>Org: secureops-inc</span>
                    <button className={styles.manageBtn}>Manage</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;