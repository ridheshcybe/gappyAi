import React, { useState } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import styles from './AuthModal.module.css';

export const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const { signIn, signUp } = useAuth();
  const { addToast } = useToast();

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
        await signUp(form.name.trim(), form.email, form.password);
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

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Your name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={mode === 'signup' ? 6 : 1}
            />
          </div>

          {mode === 'signup' && (
            <div className={styles.field}>
              <label className={styles.label}>Confirm Password</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <MaterialSymbol icon="autorenew" className={styles.spin} />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              <>
                <MaterialSymbol icon={mode === 'login' ? 'login' : 'person_add'} />
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

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
