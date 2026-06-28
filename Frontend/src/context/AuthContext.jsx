import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const STORAGE_KEY = 'secureops_auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const signIn = useCallback((email, password) => {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        try {
          const users = JSON.parse(localStorage.getItem('secureops_users') || '[]');
          const found = users.find((u) => u.email === email && u.password === password);
          if (found) {
            const { password: _, ...safeUser } = found;
            setUser(safeUser);
            resolve(safeUser);
          } else {
            // Auto-create account on first sign-in for demo convenience
            const newUser = { name: email.split('@')[0], email, password };
            users.push(newUser);
            localStorage.setItem('secureops_users', JSON.stringify(users));
            const { password: __, ...safeUser } = newUser;
            setUser(safeUser);
            resolve(safeUser);
          }
        } catch {
          reject(new Error('Failed to sign in'));
        }
      }, 600);
    });
  }, []);

  const signUp = useCallback((name, email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const users = JSON.parse(localStorage.getItem('secureops_users') || '[]');
          if (users.some((u) => u.email === email)) {
            reject(new Error('An account with this email already exists'));
            return;
          }
          const newUser = { name, email, password };
          users.push(newUser);
          localStorage.setItem('secureops_users', JSON.stringify(users));
          const { password: _, ...safeUser } = newUser;
          setUser(safeUser);
          resolve(safeUser);
        } catch {
          reject(new Error('Failed to create account'));
        }
      }, 600);
    });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
