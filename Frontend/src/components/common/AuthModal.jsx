import React, { useState } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import styles from './AuthModal.module.css';

export const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const { addToast } = useToast();
  const { signIn, signUp, passkeySignUp, passkeyOnlyLogin } = useAuth();
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'signup') {
      if (!form.name.trim()) {
        addToast('Please enter your name.', 'error');
        return;
      }
      if (form.password.length < 6) {
        addToast('Password must be at least 6 characters.', 'error');
        return;
      }
      if (form.password !== form.confirmPassword) {
        addToast('Passwords do not match.', 'error');
        return;
      }
    }

    if (!form.email.trim() || !form.password) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
        addToast('Signed in successfully.', 'success');
      } else {
        const result = await signUp(form.name.trim(), form.email, form.password);
        addToast('Account created successfully.', 'success');
      }
      setForm({ name: '', email: '', password: '', confirmPassword: '' });
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignUp = async () => {
    if (!form.name.trim()) {
      addToast('Please enter your name.', 'error');
      return;
    }
    setPasskeyLoading(true);
    try {
      await passkeySignUp(form.name.trim());
      addToast('Account created with passkey!', 'success');
      setForm({ name: '', email: '', password: '', confirmPassword: '' });
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handlePasskeyOnlyLogin = async () => {
    setPasskeyLoading(true);
    try {
      await passkeyOnlyLogin();
      addToast('Signed in with passkey.', 'success');
      setForm({ name: '', email: '', password: '', confirmPassword: '' });
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <MaterialSymbol icon="close" />
        </button>

        <div className={styles.iconWrap}>
          <MaterialSymbol icon={mode === 'login' ? 'lock' : 'person_add'} className={styles.modalIcon} />
        </div>

        <h2 className={styles.title}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className={styles.desc}>
          {mode === 'login'
            ? 'Sign in to your SecureOps Sync workspace.'
            : 'Set up your account to start managing incidents.'}
        </p>

        <form className={styles.form} onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}>
          {mode === 'signup' ? (
            <>
              {/* ── Passkey Signup (primary) ── */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-name">Name</label>
                <input
                  id="signup-name"
                  type="text"
                  className={styles.input}
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <button
                type="button"
                className={styles.passkeySignupBtn}
                onClick={handlePasskeySignUp}
                disabled={passkeyLoading || !form.name.trim()}
              >
                {passkeyLoading ? (
                  <>
                    <MaterialSymbol icon="autorenew" className={styles.spin} />
                    Scanning fingerprint…
                  </>
                ) : (
                  <>
                    <MaterialSymbol icon="fingerprint" />
                    Sign up with Passkey
                  </>
                )}
              </button>

              <div className={styles.divider}>
                <span>or</span>
              </div>

              {/* ── Traditional email/password signup ── */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  className={styles.input}
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  className={styles.input}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  minLength={6}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-confirm">Confirm Password</label>
                <input
                  id="signup-confirm"
                  type="password"
                  className={styles.input}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <>
                    <MaterialSymbol icon="autorenew" className={styles.spin} />
                    Creating account…
                  </>
                ) : (
                  <>
                    <MaterialSymbol icon="person_add" />
                    Create Account
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* ── Login mode ── */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className={styles.input}
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className={styles.input}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <>
                    <MaterialSymbol icon="autorenew" className={styles.spin} />
                    Signing in…
                  </>
                ) : (
                  <>
                    <MaterialSymbol icon="login" />
                    Sign In
                  </>
                )}
              </button>

              <div className={styles.passkeySection}>
                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className={styles.passkeyBtn}
                  onClick={handlePasskeyOnlyLogin}
                  disabled={passkeyLoading}
                >
                  {passkeyLoading ? (
                    <>
                      <MaterialSymbol icon="autorenew" className={styles.spin} />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <MaterialSymbol icon="fingerprint" />
                      Sign in with Passkey
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <p className={styles.switchText}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button className={styles.switchLink} onClick={() => { switchMode(); setPasskeyLoading(false); }}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className={styles.switchLink} onClick={() => { switchMode(); setPasskeyLoading(false); }}>
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
