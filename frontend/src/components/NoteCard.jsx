// src/components/NoteCard.jsx
// ─────────────────────────────────────────────────────────────────
// Single note card shown in the notes list panel.
// Displays title, content preview, tags, timestamp, and public badge.
// ─────────────────────────────────────────────────────────────────

import React from 'react';
import { Globe, Trash2, Archive } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';

const NoteCard = ({ note, isSelected, onClick, onDelete, onArchive }) => {
  const contentPreview = note.content?.replace(/[#*`>]/g, '').slice(0, 120) || 'No content yet…';

  return (
    <div
      className={`note-card group ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      id={`note-card-${note.id}`}
    >
      {/* Header: title + public badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate flex-1">
          {note.title || 'Untitled'}
          {note._optimistic && (
            <span className="ml-2 text-xs text-gray-400 font-normal animate-pulse-soft">saving…</span>
          )}
        </h3>
        {note.is_public && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Globe size={11} />
            Public
          </span>
        )}
      </div>

      {/* Content preview */}
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
        {contentPreview}
      </p>

      {/* Footer: tags + timestamp + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {note.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-badge">{tag}</span>
          ))}
          {note.tags?.length > 3 && (
            <span className="text-xs text-gray-400">+{note.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onArchive && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(note.id); }}
              className="editor-btn"
              title={note.is_archived ? 'Unarchive' : 'Archive'}
            >
              <Archive size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              className="editor-btn hover:text-red-500"
              title="Delete note"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">
        {formatDistanceToNow(note.updated_at)}
      </div>
    </div>
  );
};

export default NoteCard;
