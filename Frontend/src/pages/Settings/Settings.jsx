import React, { useState, useEffect, useCallback } from 'react';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import { Toggle } from '../../components/common/Toggle';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';
import { useWalkthrough } from '../../context/WalkthroughContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { getPasskeyCredentials, deletePasskeyCredential } from '../../lib/api';
import styles from './Settings.module.css';

const Settings = () => {
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Ridhesh', email: 'ridhesh@secureops.dev', role: 'Engineer', onCall: true },
    { id: 2, name: 'Alex M.', email: 'alex@secureops.dev', role: 'SRE', onCall: false },
    { id: 3, name: 'Samir K.', email: 'samir@secureops.dev', role: 'Engineer', onCall: false },
    { id: 4, name: 'Jordan W.', email: 'jordan@secureops.dev', role: 'SRE', onCall: true },
  ]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [passkeys, setPasskeys] = useState([]);
  const [passkeysLoading, setPasskeysLoading] = useState(false);
  const [passkeyRegOpen, setPasskeyRegOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const { addToast } = useToast();
  const { user, isAuthenticated, online, setOnline, signOut, registerPasskey } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { startWalkthrough } = useWalkthrough();

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

  // Load passkeys
  const loadPasskeys = useCallback(async () => {
    setPasskeysLoading(true);
    try {
      const data = await getPasskeyCredentials();
      setPasskeys(data.credentials || []);
    } catch {
      setPasskeys([]);
    } finally {
      setPasskeysLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadPasskeys();
  }, [isAuthenticated, loadPasskeys]);

  const handleDeletePasskey = async (idx) => {
    try {
      await deletePasskeyCredential(idx);
      addToast('Passkey removed.', 'success');
      loadPasskeys();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

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
          Manage your workspace — account and team.
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
            {/* Online Status */}
            <div className={styles.card}>
              <div className={styles.cardRow}>
                <div className={styles.cardLeft}>
                  <h4>
                    <MaterialSymbol icon="wifi" className={styles.iconPrimary} />
                    Online Status
                  </h4>
                  <p>
                    When enabled, you appear online and available to receive incident alerts and pages.
                  </p>
                </div>
                <Toggle
                  id="onCallToggle"
                  checked={online}
                  onChange={() => setOnline(!online)}
                />
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.statusDot}>
                  <span className={styles.statusPing}></span>
                  <span className={styles.statusStatic}></span>
                </span>
                <span className={styles.statusText}>
                  {online ? 'Online' : 'Offline'}
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

              {/* ── Passkey Management ── */}
              <div className={styles.card}>
                <h4>
                  <MaterialSymbol icon="fingerprint" className={styles.iconPrimary} />
                  Passkeys
                </h4>
                <p>Manage your saved passkeys for password-free sign-in.</p>

                <div className={styles.passkeyList}>
                  {passkeysLoading ? (
                    <div className={styles.passkeyLoading}>
                      <MaterialSymbol icon="autorenew" className={styles.spin} />
                      Loading passkeys…
                    </div>
                  ) : passkeys.length === 0 ? (
                    <div className={styles.passkeyEmpty}>
                      <MaterialSymbol icon="fingerprint" />
                      <span>No passkeys registered yet.</span>
                    </div>
                  ) : (
                    passkeys.map((pk) => (
                      <div key={pk.idx} className={styles.passkeyItem}>
                        <div className={styles.passkeyIcon}>
                          <MaterialSymbol icon="fingerprint" />
                        </div>
                        <div className={styles.passkeyInfo}>
                          <span className={styles.passkeyDevice}>
                            {pk.deviceType === 'singleDevice' ? 'This Device' : 'Cross-Platform Device'}
                          </span>
                          <span className={styles.passkeyMeta}>
                            {pk.transports?.includes('internal') ? 'Platform authenticator' : 'External authenticator'}
                            {pk.backedUp ? ' · Backed up' : ''}
                          </span>
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleDeletePasskey(pk.idx)}
                          title="Remove passkey"
                        >
                          <MaterialSymbol icon="remove_circle" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.passkeyActions}>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await registerPasskey();
                        addToast('New passkey registered!', 'success');
                        loadPasskeys();
                      } catch (err) {
                        addToast(err.message, 'error');
                      }
                    }}
                  >
                    <MaterialSymbol icon="add" />
                    Register New Passkey
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
                  {member.onCall ? 'Online' : 'Offline'}
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
