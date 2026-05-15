// src/pages/SharedNotePage.jsx
// ─────────────────────────────────────────────────────────────────
// Public shared note page — accessible without authentication.
// Renders the note content with markdown, author name, and tags.
// Clean, minimal, print-friendly layout.
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Globe, Loader2, AlertCircle } from 'lucide-react';
import { getSharedNote } from '../api/notes';
import { formatDate } from '../utils/date';

const SharedNotePage = () => {
  const { shareId } = useParams();
  const [note, setNote]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getSharedNote(shareId);
        setNote(data.note);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'This note is not available or is no longer public.'
            : 'Failed to load the shared note.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [shareId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50/20
                    dark:from-dark-900 dark:to-dark-800 py-12 px-4">
      {/* Header bar */}
      <div className="max-w-2xl mx-auto mb-8 flex items-center justify-between animate-fade-in">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          Peblo Notes
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Globe size={13} />
          Public Note
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        )}

        {error && (
          <div className="glass-card p-8 text-center animate-fade-in">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">{error}</p>
            <Link to="/" className="btn-primary mt-5 inline-flex">Go Home</Link>
          </div>
        )}

        {note && (
          <article className="glass-card p-8 animate-slide-up">
            {/* Tags */}
            {note.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {note.tags.map((tag) => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
              {note.title || 'Untitled'}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-6
                            pb-4 border-b border-gray-100 dark:border-dark-600">
              <span>By <strong className="text-gray-600 dark:text-gray-400">{note.author}</strong></span>
              <span>·</span>
              <span>Updated {formatDate(note.updated_at)}</span>
            </div>

            {/* Content */}
            <div className="prose-dark">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content || '_This note has no content._'}
              </ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-dark-600">
              <p className="text-xs text-gray-400">
                Shared via{' '}
                <Link to="/" className="text-brand-500 hover:underline">Peblo Notes</Link>
                {' '}— AI-powered collaborative workspace.
              </p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default SharedNotePage;
