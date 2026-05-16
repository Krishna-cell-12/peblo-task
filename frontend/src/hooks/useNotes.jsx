// src/hooks/useNotes.jsx
// ─────────────────────────────────────────────────────────────────
// Custom hook for notes list management.
// Implements optimistic UI updates for create/delete operations.
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { notesApi } from '../api/notes';

export const useNotes = () => {
  const [notes, setNotes]       = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState(null);
  const abortRef                = useRef(null);

  // ── Fetch notes with filters ──────────────────────────────────
  const fetchNotes = useCallback(async (params = {}) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await notesApi.list(params);
      setNotes(data.notes);
      return data;
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.response?.data?.message || 'Failed to load notes.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create note with optimistic UI update pattern.
   * 
   * Why Optimistic Updates?: We immediately add a temporary note to the list
   * with a temp ID before the API responds. This makes the UI feel instant and
   * responsive. If the API succeeds, we replace the temp note with real data.
   * If it fails, we remove the temp note and throw the error to be handled.
   * 
   * This pattern is critical for good UX in modern web apps where users expect
   * immediate visual feedback on actions.
   * 
   * @param {Object} data - Note data with title, content, tags
   * @returns {Promise} The created note from the server
   */
  const createNote = useCallback(async (data = {}) => {
    // Optimistic placeholder
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      title: data.title || 'Untitled',
      content: data.content || '',
      tags: data.tags || [],
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_archived: false,
      is_public: false,
      _optimistic: true,
    };
    setNotes((prev) => [optimistic, ...prev]);

    try {
      const { data: res } = await notesApi.create(data);
      // Replace optimistic entry with real data
      setNotes((prev) => prev.map((n) => (n.id === tempId ? res.note : n)));
      return res.note;
    } catch (err) {
      // Roll back on failure
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      throw err;
    }
  }, []);

  // ── Update note in local state ────────────────────────────────
  const updateNoteLocally = useCallback((id, changes) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...changes, updated_at: new Date().toISOString() } : n))
    );
  }, []);

  // ── Delete note (optimistic) ──────────────────────────────────
  const deleteNote = useCallback(async (id) => {
    const snapshot = [...notes];
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await notesApi.remove(id);
    } catch (err) {
      setNotes(snapshot); // roll back
      throw err;
    }
  }, [notes]);

  return { notes, isLoading, error, fetchNotes, createNote, updateNoteLocally, deleteNote, setNotes };
};
