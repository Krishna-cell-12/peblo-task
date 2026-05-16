// src/components/NoteEditor.jsx
// ─────────────────────────────────────────────────────────────────
// The main note editing panel. Features:
//  - Editable title and content
//  - Markdown preview toggle (Ctrl+M)
//  - Auto-save with debounce (1500ms) + visual indicator
//  - Tag management (add/remove inline)
//  - AI summary trigger panel
//  - Public share link generation
//  - Keyboard shortcuts: Ctrl+S (save now), Ctrl+M (markdown preview)
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import {
  Save, Eye, EyeOff, Sparkles, Globe, Lock,
  Plus, X, CheckCircle, Loader2, Copy, Check,
  Mic, Volume2,
} from 'lucide-react';
import { notesApi } from '../api/notes';
import { useDebounce } from '../hooks/useDebounce';

const NoteEditor = ({ note, onUpdate, onShare }) => {
  const [title, setTitle]     = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags]       = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const [isPreview, setIsPreview]   = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [aiPanel, setAiPanel]       = useState(null);   // null | 'loading' | { summary, action_items, suggested_title }
  const [shareInfo, setShareInfo]   = useState(
    note?.is_public ? { share_id: note.share_id, is_public: true } : null
  );
  const [copied, setCopied] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const contentRef = useRef(null);
  const titleRef   = useRef(null);
  const isSaving   = useRef(false);
  const recognition = useRef(null);
  const utteranceRef = useRef(null);

  // Sync state when note changes (different note selected)
  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setTags(note?.tags || []);
    setAiPanel(null);
    setSaveStatus('idle');
    setShareInfo(note?.is_public ? { share_id: note.share_id, is_public: true } : null);
  }, [note?.id]);

  // ── Auto-save via debounce ────────────────────────────────────
  /**
   * **Why Debounce for Auto-save?**: We delay API calls by 1.5 seconds while the user is
   * editing. This prevents hammering the backend with requests on every keystroke.
   * Only after 1.5 seconds of inactivity do we actually save. This balances responsiveness
   * (user feels their edits are being persisted) with efficiency (minimal network load).
   * 
   * The `isSaving.current` ref prevents concurrent save requests even if multiple
   * debounced updates trigger rapidly.
   */
  const debouncedTitle   = useDebounce(title, 1500);
  const debouncedContent = useDebounce(content, 1500);

  const saveNote = useCallback(async (overrideTitle, overrideContent, overrideTags) => {
    if (!note?.id || isSaving.current) return;
    isSaving.current = true;
    setSaveStatus('saving');
    try {
      const updates = {
        title:   overrideTitle   ?? title,
        content: overrideContent ?? content,
        tags:    overrideTags    ?? tags,
      };
      const { data } = await notesApi.update(note.id, updates);
      onUpdate?.(data.note);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      isSaving.current = false;
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [note?.id, title, content, tags, onUpdate]);

  // Trigger auto-save when debounced values change
  useEffect(() => {
    if (note?.id && (debouncedTitle !== note.title || debouncedContent !== note.content)) {
      saveNote(debouncedTitle, debouncedContent);
    }
  }, [debouncedTitle, debouncedContent]);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setIsPreview((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveNote]);

  // ── Tag management ────────────────────────────────────────────
  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      setTags(newTags);
      saveNote(title, content, newTags);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    saveNote(title, content, newTags);
  };

  // ── Trigger confetti celebration ──────────────────────────────
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
    });
  }, []);

  // ── Voice Dictation (Speech Recognition) ───────────────────────
  const handleDictate = useCallback(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert('Speech Recognition not supported in your browser.');
      return;
    }

    if (!recognition.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.language = 'en-US';

      recognition.current.onstart = () => setIsDictating(true);
      recognition.current.onend = () => setIsDictating(false);
      recognition.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setContent((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
      };
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsDictating(false);
      };
    }

    if (isDictating) {
      recognition.current.stop();
      setIsDictating(false);
    } else {
      recognition.current.start();
    }
  }, [isDictating]);

  // ── Text-to-Speech (Read Aloud) ────────────────────────────────
  const handleReadAloud = useCallback((text) => {
    if (!window.speechSynthesis) {
      alert('Text-to-Speech not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = 1;
    utteranceRef.current.pitch = 1;
    utteranceRef.current.volume = 1;

    utteranceRef.current.onstart = () => setIsSpeaking(true);
    utteranceRef.current.onend = () => setIsSpeaking(false);
    utteranceRef.current.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utteranceRef.current);
  }, [isSpeaking]);

  // ── AI Summary ────────────────────────────────────────────────
  const handleGenerateSummary = async () => {
    setAiPanel('loading');
    try {
      const { data } = await notesApi.generateSummary(note.id);
      setAiPanel(data);
      // Trigger confetti on successful AI summary generation
      triggerConfetti();
    } catch (err) {
      setAiPanel({ error: err.response?.data?.message || 'AI generation failed.' });
    }
  };

  const applyTitle = () => {
    if (aiPanel?.suggested_title) {
      setTitle(aiPanel.suggested_title);
      saveNote(aiPanel.suggested_title, content);
    }
  };

  // ── Share ─────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      const { data } = await notesApi.share(note.id);
      setShareInfo({ share_id: data.share_id, is_public: true });
      onShare?.(note.id, data.share_id);
    } catch {
      alert('Failed to generate share link. Please try again.');
    }
  };

  const handleUnshare = async () => {
    try {
      await notesApi.unshare(note.id);
      setShareInfo(null);
      onShare?.(note.id, null);
    } catch {
      alert('Failed to make note private. Please try again.');
    }
  };

  const shareUrl = shareInfo ? `${window.location.origin}/shared/${shareInfo.share_id}` : '';

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center mx-auto mb-3">
            <Eye size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium">Select a note to start editing</p>
          <p className="text-xs mt-1">or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3
                      border-b border-gray-100 dark:border-dark-600
                      bg-white dark:bg-dark-800">
        <div className="flex items-center gap-1">
          {/* Preview toggle */}
          <button
            onClick={() => setIsPreview((p) => !p)}
            id="btn-toggle-preview"
            className={`editor-btn flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium
                        ${isPreview ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : ''}`}
            title="Toggle markdown preview (Ctrl+M)"
          >
            {isPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            {isPreview ? 'Edit' : 'Preview'}
          </button>

          {/* Dictate button */}
          <button
            onClick={handleDictate}
            id="btn-dictate"
            className={`editor-btn flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium
                        transition-all duration-200 ${isDictating ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`}
            title="Click to dictate and add text via microphone"
          >
            <Mic size={13} className={isDictating ? 'animate-pulse' : ''} />
            {isDictating ? 'Listening...' : 'Dictate'}
          </button>

          {/* AI Summary */}
          <button
            onClick={handleGenerateSummary}
            id="btn-ai-summary"
            disabled={aiPanel === 'loading'}
            className="editor-btn flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium
                       text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30"
            title="Generate AI summary"
          >
            {aiPanel === 'loading'
              ? <Loader2 size={13} className="animate-spin" />
              : <Sparkles size={13} />}
            AI Summary
          </button>

          {/* Share toggle */}
          {shareInfo ? (
            <button
              onClick={handleUnshare}
              id="btn-unshare"
              className="editor-btn flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium
                         text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <Globe size={13} /> Public
            </button>
          ) : (
            <button
              onClick={handleShare}
              id="btn-share"
              className="editor-btn flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium"
              title="Share note publicly"
            >
              <Lock size={13} /> Share
            </button>
          )}
        </div>

        {/* Save status indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-gray-400 animate-pulse-soft">
              <Loader2 size={12} className="animate-spin" /> Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-500 animate-fade-in">
              <CheckCircle size={12} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-500">Save failed</span>
          )}
          <button
            onClick={() => saveNote()}
            id="btn-save-now"
            className="editor-btn flex items-center gap-1 px-2 py-1 rounded text-xs"
            title="Save now (Ctrl+S)"
          >
            <Save size={12} /> <span className="kbd">Ctrl+S</span>
          </button>
        </div>
      </div>

      {/* ── Main editor area ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-white dark:bg-dark-800">
        {/* Title */}
        <input
          ref={titleRef}
          id="note-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title…"
          className="w-full text-2xl font-bold text-gray-900 dark:text-white
                     bg-transparent border-none outline-none
                     placeholder-gray-300 dark:placeholder-dark-400 mb-3"
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {tags.map((tag) => (
            <span key={tag} className="tag-badge">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
              placeholder="Add tag…"
              id="tag-input"
              className="text-xs bg-transparent border-none outline-none
                         text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600
                         w-20 focus:w-28 transition-all duration-200"
            />
            {tagInput && (
              <button onClick={addTag} className="text-brand-500 hover:text-brand-600">
                <Plus size={12} />
              </button>
            )}
          </div>
        </div>

        <hr className="border-gray-100 dark:border-dark-600 mb-4" />

        {/* Content: editor or preview */}
        {isPreview ? (
          <div className="prose prose-dark max-w-none animate-fade-in">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || '*Nothing to preview yet. Switch back to edit mode and write something.*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={contentRef}
            id="note-content-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing… Supports **Markdown**"
            className="w-full h-[calc(100vh-22rem)] resize-none bg-transparent border-none outline-none
                       text-sm text-gray-700 dark:text-gray-300 leading-7 font-mono
                       placeholder-gray-300 dark:placeholder-dark-400"
          />
        )}
      </div>

      {/* ── Share link bar ───────────────────────────────────── */}
      {shareInfo && (
        <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20
                        border-t border-emerald-200 dark:border-emerald-800/50
                        flex items-center gap-3 animate-slide-up">
          <Globe size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex-shrink-0">Share link:</span>
          <code className="text-xs text-emerald-800 dark:text-emerald-300 flex-1 truncate">{shareUrl}</code>
          <button
            onClick={copyShareUrl}
            id="btn-copy-share-link"
            className="flex-shrink-0 text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      {/* ── AI Summary Panel ─────────────────────────────────── */}
      {aiPanel && aiPanel !== 'loading' && (
        <div className="border-t border-gray-100 dark:border-dark-600
                        bg-gradient-to-b from-brand-50/50 dark:from-brand-900/10 to-transparent
                        px-6 py-4 animate-slide-up max-h-56 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-brand-500" />
            <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">AI Summary</span>
            {!aiPanel.error && aiPanel.summary && (
              <button
                onClick={() => handleReadAloud(aiPanel.summary)}
                id="btn-listen-summary"
                className={`editor-btn flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ml-auto mr-2
                            ${isSpeaking ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                title={isSpeaking ? 'Stop reading' : 'Read aloud'}
              >
                <Volume2 size={12} className={isSpeaking ? 'animate-pulse' : ''} />
                {isSpeaking ? 'Listening...' : 'Listen'}
              </button>
            )}
            <button onClick={() => setAiPanel(null)} className="ml-auto editor-btn">
              <X size={13} />
            </button>
          </div>

          {aiPanel.error ? (
            <p className="text-sm text-red-500">{aiPanel.error}</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Summary</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiPanel.summary}</p>
              </div>

              {aiPanel.action_items?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Action Items</p>
                  <ul className="space-y-1">
                    {aiPanel.action_items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400
                                         text-xs flex items-center justify-center mt-0.5 flex-shrink-0">{i + 1}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiPanel.suggested_title && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Suggested title:</p>
                  <code className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
                                   px-2 py-0.5 rounded flex-1">{aiPanel.suggested_title}</code>
                  <button
                    onClick={applyTitle}
                    id="btn-apply-title"
                    className="text-xs btn-primary py-1 px-2"
                  >Apply</button>
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-600">
                Model: {aiPanel.model_used}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
