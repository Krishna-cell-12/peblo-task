// src/api/notes.js
// ─────────────────────────────────────────────────────────────────
// Notes API wrapper functions.
// Each function maps directly to a backend endpoint.
// ─────────────────────────────────────────────────────────────────

import client from './client';

export const notesApi = {
  /** Fetch all notes with optional filters */
  list: (params = {}) => client.get('/notes', { params }),

  /** Get a single note by ID */
  get: (id) => client.get(`/notes/${id}`),

  /** Create a new note */
  create: (data) => client.post('/notes', data),

  /** Partially update a note (auto-save friendly) */
  update: (id, data) => client.patch(`/notes/${id}`, data),

  /** Delete a note */
  remove: (id) => client.delete(`/notes/${id}`),

  /** Trigger AI summary generation */
  generateSummary: (id) => client.post(`/notes/${id}/generate-summary`),

  /** Make note public, returns share_id */
  share: (id) => client.post(`/notes/${id}/share`),

  /** Make note private */
  unshare: (id) => client.post(`/notes/${id}/unshare`),
};

/** Public shared note — no auth required */
export const getSharedNote = (shareId) => client.get(`/shared/${shareId}`);

/** Productivity insights */
export const getInsights = () => client.get('/insights');
