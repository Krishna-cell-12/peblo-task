// src/api/client.js
// ─────────────────────────────────────────────────────────────────
// Axios client instance with:
//   - Base URL from environment variable (falls back to /api proxy)
//   - Request interceptor: injects JWT Authorization header
//   - Response interceptor: redirects to /login on 401
// ─────────────────────────────────────────────────────────────────

import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor — attach JWT ────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('peblo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ─────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth and redirect to login
      localStorage.removeItem('peblo_token');
      localStorage.removeItem('peblo_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
