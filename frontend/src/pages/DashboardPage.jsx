// src/pages/DashboardPage.jsx
// ─────────────────────────────────────────────────────────────────
// Main workspace page: two-pane layout (notes list + editor).
//
// Left pane:  search bar, tag filter, notes list with NoteCard
// Right pane: NoteEditor for the selected/active note
//
// Features:
//  - Real-time keyword + tag filtering
//  - Optimistic note creation
//  - Auto-selects newly created note
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Tag, SlidersHorizontal } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import { useNotes } from '../hooks/useNotes';
import { useDebounce } from '../hooks/useDebounce';
import { notesApi } from '../api/notes';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  
  // ── Handle Google OAuth redirect token ───────────────────────
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Login with the provided token
      loginWithToken(token).then((res) => {
        if (res.success) {
          // Remove token from URL for security and cleanliness
          searchParams.delete('token');
          setSearchParams(searchParams, { replace: true });
        }
      });
    }
  }, [searchParams, loginWithToken, setSearchParams]);

  const isArchived = searchParams.get('archived') === 'true';

  const { notes, isLoading, fetchNotes, createNote, updateNoteLocally, deleteNote, setNotes } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeTag, setActiveTag]           = useState('');
  const [showTagFilter, setShowTagFilter]   = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // Collect all unique tags from loaded notes
  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))].slice(0, 20);

  // ── Load notes whenever filters or tab changes ───────────────
  useEffect(() => {
    fetchNotes({
      q: debouncedSearch,
      tag: activeTag,
      archived: isArchived ? 'true' : 'false',
    });
  }, [debouncedSearch, activeTag, isArchived]);

  // ── Selected note object ─────────────────────────────────────
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // ── Create new note ──────────────────────────────────────────
  const handleNewNote = async () => {
    try {
      const note = await createNote({ title: 'Untitled', content: '', tags: [] });
      setSelectedNoteId(note.id);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // ── Handle note update from editor ──────────────────────────
  const handleNoteUpdate = (updatedNote) => {
    updateNoteLocally(updatedNote.id, updatedNote);
  };

  // ── Handle share state change from editor ────────────────────
  const handleShare = (noteId, shareId) => {
    updateNoteLocally(noteId, {
      is_public: !!shareId,
      share_id: shareId,
    });
  };

  // ── Archive note ─────────────────────────────────────────────
  const handleArchive = async (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    const newArchived = !note?.is_archived;
    updateNoteLocally(noteId, { is_archived: newArchived });
    try {
      await notesApi.update(noteId, { is_archived: newArchived });
      // Remove from current view since archived state changed
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNoteId === noteId) setSelectedNoteId(null);
    } catch {
      updateNoteLocally(noteId, { is_archived: !newArchived }); // rollback
    }
  };

  // ── Delete note ──────────────────────────────────────────────
  const handleDelete = async (noteId) => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      await deleteNote(noteId);
      if (selectedNoteId === noteId) setSelectedNoteId(null);
    } catch {
      alert('Failed to delete note. Please try again.');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-900">
      {/* ── Left: Sidebar ─────────────────────────────────────── */}
      <Sidebar onNewNote={handleNewNote} />

      {/* ── Middle: Notes List ────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col h-full
                      bg-white dark:bg-dark-800
                      border-r border-gray-100 dark:border-dark-600">
        {/* Search bar */}
        <div className="p-3 border-b border-gray-100 dark:border-dark-600">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              className="input pl-8 pr-8 text-xs h-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Tag filter toggle */}
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => setShowTagFilter((p) => !p)}
              id="btn-tag-filter"
              className={`btn-ghost text-xs py-1 ${showTagFilter ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600' : ''}`}
            >
              <Tag size={12} />
              Tags
              {activeTag && <span className="ml-1 tag-badge">{activeTag}</span>}
            </button>
            {activeTag && (
              <button onClick={() => setActiveTag('')} className="btn-ghost text-xs py-1 text-red-500">
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Tag pills */}
          {showTagFilter && allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 animate-fade-in">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  className={`tag-badge cursor-pointer hover:bg-brand-200 dark:hover:bg-brand-800
                              ${activeTag === tag ? 'bg-brand-300 dark:bg-brand-700' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes count */}
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-600">
            {isArchived ? 'Archived' : 'Notes'} · {notes.length}
          </span>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {isLoading && notes.length === 0 && (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-dark-700 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-600">
              <p className="text-sm font-medium">No notes found</p>
              <p className="text-xs mt-1">
                {searchQuery || activeTag ? 'Try a different search' : 'Create your first note!'}
              </p>
            </div>
          )}

          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={note.id === selectedNoteId}
              onClick={() => setSelectedNoteId(note.id)}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      </div>

      {/* ── Right: Note Editor ────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <NoteEditor
          note={selectedNote}
          onUpdate={handleNoteUpdate}
          onShare={handleShare}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
