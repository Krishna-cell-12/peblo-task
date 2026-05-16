// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────
// Authentication context — provides user state and auth actions
// (login, logout, register) throughout the component tree.
// Persists token and user in localStorage for session continuity.
// ─────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

const getAuthErrorMessage = (err, fallback) => {
  if (!err.response) {
    return 'Cannot reach the server. Start the backend (cd backend && npm run dev), or run both from the project root with npm run dev.';
  }
  return err.response?.data?.message || fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('peblo_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Persist auth state ────────────────────────────────────────
  const persistAuth = (token, userData) => {
    localStorage.setItem('peblo_token', token);
    localStorage.setItem('peblo_user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── Clear auth state ──────────────────────────────────────────
  const clearAuth = () => {
    localStorage.removeItem('peblo_token');
    localStorage.removeItem('peblo_user');
    setUser(null);
  };

  // ── Register ──────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await client.post('/auth/signup', { name, email, password });
      persistAuth(data.token, data.user);
      return { success: true };
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Registration failed. Please try again.');
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await client.post('/auth/login', { email, password });
      persistAuth(data.token, data.user);
      return { success: true };
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Invalid credentials.');
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuth();
  }, []);

  // ── Login with Token (OAuth) ──────────────────────────────────
  const loginWithToken = useCallback(async (token) => {
    setIsLoading(true);
    setError(null);
    try {
      // Set the token in localStorage first so the client can use it
      localStorage.setItem('peblo_token', token);
      
      // Fetch user profile to verify token and get user data
      const { data } = await client.get('/auth/me');
      
      persistAuth(token, data.user);
      return { success: true };
    } catch (err) {
      clearAuth();
      const msg = 'OAuth login failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = { user, isLoading, error, login, logout, register, loginWithToken, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
