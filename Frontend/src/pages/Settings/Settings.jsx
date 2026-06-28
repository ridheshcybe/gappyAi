import React, { useState, useEffect, useCallback } from 'react';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import { Toggle } from '../../components/common/Toggle';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';
import { useWalkthrough } from '../../context/WalkthroughContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Settings.module.css';

const Settings = () => {
  const [onCall, setOnCall] = useState(true);
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Ridhesh', email: 'ridhesh@secureops.dev', role: 'Primary Responder', onCall: true },
    { id: 2, name: 'Alex M.', email: 'alex@secureops.dev', role: 'Backup Responder', onCall: false },
    { id: 3, name: 'Samir K.', email: 'samir@secureops.dev', role: 'Engineering Lead', onCall: false },
    { id: 4, name: 'Jordan W.', email: 'jordan@secureops.dev', role: 'SRE — Observability', onCall: true },
  ]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });
  const [confirmRemove, setConfirmRemove] = useState(null);

  const handleInviteChange = (field, value) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;
    const newMember = {
      id: Date.now(),
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      role: inviteForm.role.trim() || 'Member',
      onCall: false,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setInviteForm({ name: '', email: '', role: '' });
    setInviteOpen(false);
  };

  const handleRemoveMember = (id) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    setConfirmRemove(null);
  };
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const { user, isAuthenticated, signOut } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { startWalkthrough } = useWalkthrough();

  // Listen for permission changes from browser
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'unsupported') {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handlePushToggle = useCallback(async () => {
    if (!('Notification' in window)) {
      return;
    }

    // If already denied, show a message explaining how to re-enable
    if (Notification.permission === 'denied') {
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    setPushPermission(permission);

    if (permission === 'granted') {
      setPushEnabled(true);

      // Show a sample notification
      try {
        const notif = new Notification('SecureOps Sync', {
          body: 'P0 incident detected — DB Connection Pool Exhausted on Payments API.',
          icon: '/favicon.svg',
          tag: 'secureops-test',
        });
        setTimeout(() => notif.close(), 5000);
      } catch {
        // Notification might not support icon
        new Notification('SecureOps Sync', {
          body: 'Desktop notifications are now active. You\'ll receive real-time alerts for incidents.',
          tag: 'secureops-test',
        });
      }
    }
  }, []);

  const handlePushDisable = useCallback(() => {
    setPushEnabled(false);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>
          Manage your workspace — account, integrations, API keys, and team.
        </p>
      </div>

      <div className={styles.sections}>

        {/* ═══════════════ General ═══════════════ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MaterialSymbol icon="tune" className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>General</h2>
              <p className={styles.sectionDesc}>Account availability, notifications, and display preferences.</p>
            </div>
          </div>

          <div className={styles.cardGrid}>
            {/* On-Call Status */}
            <div className={styles.card}>
              <div className={styles.cardRow}>
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
            </div>

            {/* Desktop Push Notifications */}
            <div className={styles.card}>
              <h4>
                <MaterialSymbol icon="notifications_active" className={styles.iconPrimary} />
                Desktop Push Notifications
              </h4>
              <p>Receive real-time browser notifications when incidents are detected.</p>
              <div className={styles.pushSection}>
                <div className={styles.pushRow}>
                  <div className={styles.pushInfo}>
                    <span className={styles.pushLabel}>
                      {pushPermission === 'granted'
                        ? pushEnabled
                          ? 'Push notifications are active'
                          : 'Push notifications are paused'
                        : pushPermission === 'denied'
                          ? 'Push notifications are blocked'
                          : pushPermission === 'unsupported'
                            ? 'Browser notifications not supported'
                            : 'Push notifications are off'}
                    </span>
                    <span className={styles.pushDesc}>
                      {pushPermission === 'granted'
                        ? 'You will receive alerts for P0/P1 incidents in real time.'
                        : pushPermission === 'denied'
                          ? 'Blocked by browser. Enable via site permissions in your browser settings.'
                          : pushPermission === 'unsupported'
                            ? 'Your browser does not support the Notification API.'
                            : 'Click "Enable" to allow desktop notifications.'}
                    </span>
                  </div>
                  <div className={styles.pushAction}>
                    {pushPermission === 'granted' ? (
                      <button
                        className={`${styles.pushBtn} ${pushEnabled ? styles.pushBtnActive : styles.pushBtnInactive}`}
                        onClick={pushEnabled ? handlePushDisable : handlePushToggle}
                      >
                        <MaterialSymbol icon={pushEnabled ? 'notifications_active' : 'notifications_off'} />
                        {pushEnabled ? 'Active' : 'Paused'}
                      </button>
                    ) : pushPermission === 'denied' ? (
                      <span className={styles.pushBlocked}>
                        <MaterialSymbol icon="block" />
                        Blocked
                      </span>
                    ) : (
                      <button className={styles.pushBtn} onClick={handlePushToggle}>
                        <MaterialSymbol icon="notifications_active" />
                        Enable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interface Theme */}
            <div className={styles.card}>
              <h4>
                <MaterialSymbol icon="palette" className={styles.iconPrimary} />
                Interface Theme
              </h4>
              <p>Choose between dark and light appearance.</p>
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
                <label className={styles.themeOption}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={!darkMode}
                    onChange={toggleTheme}
                  />
                  <div>
                    <div className={styles.themePreviewLight}></div>
                    <div>
                      <span className={styles.themeDotDisabled}></span>
                      <span>Light Mode</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Product Tour */}
            <div className={styles.card}>
              <h4>
                <MaterialSymbol icon="explore" className={styles.iconPrimary} />
                Product Tour
              </h4>
              <p>Replay the onboarding walkthrough to get familiar with the interface.</p>
              <div className={styles.tourRow}>
                <Button variant="secondary" onClick={startWalkthrough}>
                  <MaterialSymbol icon="play_arrow" /> Replay Tour
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ Account ═══════════════ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MaterialSymbol icon="manage_accounts" className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>Account</h2>
              <p className={styles.sectionDesc}>Manage your profile, email, and sign-in settings.</p>
            </div>
          </div>

          {isAuthenticated ? (
            <div className={styles.cardGrid}>
              <div className={styles.card}>
                <h4>
                  <MaterialSymbol icon="person" className={styles.iconPrimary} />
                  Profile
                </h4>
                <div className={styles.accountFields}>
                  <div className={styles.accountField}>
                    <span className={styles.accountLabel}>Name</span>
                    <span className={styles.accountValue}>{user?.name || '—'}</span>
                  </div>
                  <div className={styles.accountField}>
                    <span className={styles.accountLabel}>Email</span>
                    <span className={styles.accountValue}>{user?.email || '—'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h4>
                  <MaterialSymbol icon="lock" className={styles.iconPrimary} />
                  Session
                </h4>
                <p>You are currently signed in. Sign out to switch accounts.</p>
                <div className={styles.accountActions}>
                  <Button variant="secondary" onClick={signOut}>
                    <MaterialSymbol icon="logout" /> Sign Out
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.accountSignInPrompt}>
              <MaterialSymbol icon="account_circle" className={styles.accountPromptIcon} />
              <p>Sign in to manage your account settings.</p>
              <Button variant="primary" onClick={() => window.dispatchEvent(new CustomEvent('secureops:open-auth'))}>
                <MaterialSymbol icon="login" /> Sign In
              </Button>
            </div>
          )}
        </section>

        {/* ═══════════════ Integrations ═══════════════ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MaterialSymbol icon="extension" className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>Integrations</h2>
              <p className={styles.sectionDesc}>Connect external tools to your SecureOps Sync workspace.</p>
            </div>
          </div>

          <div className={styles.integrationGrid}>
            <div className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <MaterialSymbol icon="contact_emergency" />
                </div>
                <div className={styles.disconnectedBadge}>
                  <MaterialSymbol icon="radio_button_unchecked" />
                  Disconnected
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

            <div className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <MaterialSymbol icon="sms" />
                </div>
                <div className={styles.disconnectedBadge}>
                  <MaterialSymbol icon="radio_button_unchecked" />
                  Disconnected
                </div>
              </div>
              <h4>Slack</h4>
              <p>Post incident alerts and runbook updates to your team channels.</p>
              <div className={styles.integrationFooter}>
                <button className={styles.connectBtn}>Connect</button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ API Keys ═══════════════ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MaterialSymbol icon="key" className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>API Keys</h2>
              <p className={styles.sectionDesc}>Manage credentials for programmatic access to the incident pipeline.</p>
            </div>
          </div>

          <div className={styles.apiKeys}>
            <div className={styles.apiKeyCard}>
              <div className={styles.apiKeyHeader}>
                <div className={styles.apiKeyInfo}>
                  <span className={styles.apiKeyName}>Production Access</span>
                  <span className={styles.apiKeyEnv}>env: production</span>
                </div>
                <span className={styles.apiKeyBadge}>Active</span>
              </div>
              <div className={styles.apiKeyRow}>
                <code className={styles.apiKeyValue}>sk‑so‑prod‑a7f3…c9e2</code>
                <button className={styles.apiKeyAction}>
                  <MaterialSymbol icon="visibility" /> Show
                </button>
              </div>
              <div className={styles.apiKeyMeta}>
                <span>Created: 12 Jan 2026</span>
                <span>Last used: 28 Jun 2026</span>
              </div>
            </div>

            <div className={styles.apiKeyCard}>
              <div className={styles.apiKeyHeader}>
                <div className={styles.apiKeyInfo}>
                  <span className={styles.apiKeyName}>Staging Access</span>
                  <span className={styles.apiKeyEnv}>env: staging</span>
                </div>
                <span className={`${styles.apiKeyBadge} ${styles.apiKeyBadgeWarn}`}>Expiring</span>
              </div>
              <div className={styles.apiKeyRow}>
                <code className={styles.apiKeyValue}>sk‑so‑stg‑b4d1…f7a8</code>
                <button className={styles.apiKeyAction}>
                  <MaterialSymbol icon="visibility" /> Show
                </button>
              </div>
              <div className={styles.apiKeyMeta}>
                <span>Created: 15 Mar 2026</span>
                <span>Expires: 15 Jul 2026</span>
              </div>
            </div>

            <div className={styles.apiKeyEmpty}>
              <MaterialSymbol icon="add_circle" className={styles.apiKeyEmptyIcon} />
              <p>Need a new key? Generate one with scoped permissions.</p>
              <Button variant="secondary">
                <MaterialSymbol icon="add" /> Generate Key
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════ Team ═══════════════ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MaterialSymbol icon="groups" className={styles.sectionIcon} />
            <div>
              <h2 className={styles.sectionTitle}>Team</h2>
              <p className={styles.sectionDesc}>Invite and manage your incident response team members.</p>
            </div>
          </div>

          <div className={styles.teamHeader}>
            <span className={styles.teamCount}>{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
            <button className={styles.inviteBtn} onClick={() => setInviteOpen(true)}>
              <MaterialSymbol icon="person_add" />
              Invite Member
            </button>
          </div>

          {/* Invite form */}
          {inviteOpen && (
            <form className={styles.inviteForm} onSubmit={handleInviteSubmit}>
              <div className={styles.inviteFields}>
                <input
                  type="text"
                  placeholder="Name"
                  className={styles.inviteInput}
                  value={inviteForm.name}
                  onChange={(e) => handleInviteChange('name', e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email address"
                  className={styles.inviteInput}
                  value={inviteForm.email}
                  onChange={(e) => handleInviteChange('email', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Role (optional)"
                  className={styles.inviteInput}
                  value={inviteForm.role}
                  onChange={(e) => handleInviteChange('role', e.target.value)}
                />
              </div>
              <div className={styles.inviteActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setInviteOpen(false); setInviteForm({ name: '', email: '', role: '' }); }}>
                  Cancel
                </button>
                <button type="submit" className={styles.sendInviteBtn}>
                  <MaterialSymbol icon="send" />
                  Send Invite
                </button>
              </div>
            </form>
          )}

          <div className={styles.teamList}>
            {teamMembers.map((member) => (
              <div key={member.id} className={styles.teamMember}>
                <div className={styles.teamMemberAvatar}>
                  <MaterialSymbol icon="account_circle" />
                </div>
                <div className={styles.teamMemberInfo}>
                  <div className={styles.teamMemberTop}>
                    <span className={styles.teamMemberName}>{member.name}</span>
                    <span className={styles.teamMemberEmail}>{member.email}</span>
                  </div>
                  <span className={styles.teamMemberRole}>{member.role}</span>
                </div>
                <span className={styles.teamMemberStatus}>
                  <span className={member.onCall ? styles.teamStatusDot : styles.teamStatusDotOff}></span>
                  {member.onCall ? 'On-Call' : 'Off-Call'}
                </span>
                <button
                  className={styles.removeBtn}
                  onClick={() => setConfirmRemove(member.id)}
                  title={`Remove ${member.name}`}
                >
                  <MaterialSymbol icon="remove_circle" />
                </button>

                {/* Confirm remove overlay */}
                {confirmRemove === member.id && (
                  <div className={styles.confirmOverlay}>
                    <div className={styles.confirmBox}>
                      <p>Remove <strong>{member.name}</strong> from the team?</p>
                      <div className={styles.confirmActions}>
                        <button className={styles.cancelBtn} onClick={() => setConfirmRemove(null)}>Keep</button>
                        <button className={styles.confirmRemoveBtn} onClick={() => handleRemoveMember(member.id)}>
                          <MaterialSymbol icon="remove_circle" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ Save ═══════════════ */}
        <div className={styles.saveRow}>
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
