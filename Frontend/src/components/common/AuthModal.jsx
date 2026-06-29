import React, { useState } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { useAuth } from '../../context/AuthContext';
import { useWalkthrough } from '../../context/WalkthroughContext';
import { useToast } from './Toast';
import styles from './AuthModal.module.css';

export const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { passkeySignUp, passkeyOnlyLogin } = useAuth();
  const { startWalkthrough } = useWalkthrough();

  if (!isOpen) return null;

  const handlePasskeySignUp = async () => {
    if (!name.trim()) {
      addToast('Please enter your name.', 'error');
      return;
    }
    setLoading(true);
    try {
      await passkeySignUp(name.trim());
      addToast('Account created with passkey!', 'success');
      setName('');
      onClose();
      // Show the walkthrough tutorial after signup
      startWalkthrough();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
      await passkeyOnlyLogin();
      addToast('Signed in with passkey.', 'success');
      setName('');
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setName('');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <MaterialSymbol icon="close" />
        </button>

        <div className={styles.iconWrap}>
          <MaterialSymbol icon="fingerprint" className={styles.modalIcon} />
        </div>

        <h2 className={styles.title}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className={styles.desc}>
          {mode === 'login'
            ? 'Sign in with your passkey — no password needed.'
            : 'Create an account using your device passkey.'}
        </p>

        {mode === 'signup' ? (
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="signup-name">Name</label>
              <input
                id="signup-name"
                type="text"
                className={styles.input}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <button
              type="button"
              className={styles.passkeyBtnPrimary}
              onClick={handlePasskeySignUp}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <MaterialSymbol icon="autorenew" className={styles.spin} />
                  Creating account…
                </>
              ) : (
                <>
                  <MaterialSymbol icon="fingerprint" />
                  Sign Up with Passkey
                </>
              )}
            </button>
          </div>
        ) : (
          <div className={styles.form}>
            <button
              type="button"
              className={styles.passkeyBtnPrimary}
              onClick={handlePasskeyLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <MaterialSymbol icon="autorenew" className={styles.spin} />
                  Authenticating…
                </>
              ) : (
                <>
                  <MaterialSymbol icon="fingerprint" />
                  Sign In with Passkey
                </>
              )}
            </button>
          </div>
        )}

        <p className={styles.switchText}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button className={styles.switchLink} onClick={switchMode}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className={styles.switchLink} onClick={switchMode}>
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
