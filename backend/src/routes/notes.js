// src/routes/notes.js
// ─────────────────────────────────────────────────────────────────
// Notes CRUD + AI summary endpoint. All routes require JWT auth.
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, run, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { generateSummary } = require('../services/aiService');

const router = express.Router();

// All notes routes require authentication
router.use(authMiddleware);

// ── Helper: parse tags JSON safely ──────────────────────────────
const parseTags = (tagsStr) => {
  try { return JSON.parse(tagsStr); } catch { return []; }
};

// ── Helper: format note for API response ───────────────────────
const formatNote = (note) => ({
  ...note,
  tags: parseTags(note.tags),
  is_archived: note.is_archived === 1,
  is_public: note.is_public === 1,
});

// ── Helper: ensure note belongs to requesting user ─────────────
const findUserNote = (noteId, userId) =>
  get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]);

// ─────────────────────────────────────────────────────────────────
// GET /notes
// ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      q = '',
      tag = '',
      sort = 'updated_at',
      archived = 'false',
      page = 1,
      limit = 20,
    } = req.query;

    const showArchived = archived === 'true' ? 1 : 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const allowedSorts = ['updated_at', 'created_at', 'title'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'updated_at';

    let query = `
      SELECT * FROM notes
      WHERE user_id = ?
        AND is_archived = ?
    `;
    const params = [req.user.id, showArchived];

    if (q) {
      query += ` AND (title LIKE ? OR content LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    if (tag) {
      query += ` AND tags LIKE ?`;
      params.push(`%"${tag}"%`);
    }

    query += ` ORDER BY ${sortColumn} DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const notes = await all(query, params);
    const countRow = await get(`SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_archived = ?`, [req.user.id, showArchived]);
    const total = countRow.count;

    return res.json({
      notes: notes.map(formatNote),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /notes
// ─────────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { title = 'Untitled', content = '', tags = [] } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(`
      INSERT INTO notes (id, user_id, title, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, req.user.id, title, content, JSON.stringify(tags), now, now]);

    const note = await get('SELECT * FROM notes WHERE id = ?', [id]);
    return res.status(201).json({ note: formatNote(note) });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /notes/:id
// ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const note = await findUserNote(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ error: 'NotFound', message: 'Note not found.' });
    return res.json({ note: formatNote(note) });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /notes/:id
// ─────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const note = await findUserNote(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ error: 'NotFound', message: 'Note not found.' });

    const { title, content, tags, is_archived } = req.body;
    const now = new Date().toISOString();

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (content !== undefined) { fields.push('content = ?'); values.push(content); }
    if (tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (is_archived !== undefined) { fields.push('is_archived = ?'); values.push(is_archived ? 1 : 0); }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(req.params.id, req.user.id);

    await run(`UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);

    const updated = await get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    return res.json({ note: formatNote(updated) });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// DELETE /notes/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const note = await findUserNote(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ error: 'NotFound', message: 'Note not found.' });

    await run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /notes/:id/generate-summary
// ─────────────────────────────────────────────────────────────────
router.post('/:id/generate-summary', async (req, res, next) => {
  try {
    const note = await findUserNote(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ error: 'NotFound', message: 'Note not found.' });

    if (!note.content || note.content.trim().length < 20) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Note content is too short to summarize. Add more content first.',
      });
    }

    const result = await generateSummary(note.title, note.content);

    const usageId = uuidv4();
    await run(`
      INSERT INTO ai_usage (id, user_id, note_id, summary, action_items, suggested_title, model_used)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      usageId,
      req.user.id,
      note.id,
      result.summary,
      JSON.stringify(result.action_items),
      result.suggested_title,
      result.model_used
    ]);

    return res.json({
      note_id: note.id,
      summary: result.summary,
      action_items: result.action_items,
      suggested_title: result.suggested_title,
      model_used: result.model_used,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /notes/:id/share
// ─────────────────────────────────────────────────────────────────
router.post('/:id/share', async (req, res, next) => {
  try {
    const note = await findUserNote(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ error: 'NotFound', message: 'Note not found.' });

    const shareId = note.share_id || uuidv4();
    await run('UPDATE notes SET is_public = 1, share_id = ? WHERE id = ?', [shareId, note.id]);

    return res.json({
      message: 'Note is now public.',
      share_id: shareId,
      share_url: `/shared/${shareId}`,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /notes/:id/unshare
// ─────────────────────────────────────────────────────────────────
router.post('/:id/unshare', async (req, res, next) => {
  try {
    const note = await findUserNote(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ error: 'NotFound', message: 'Note not found.' });

    await run('UPDATE notes SET is_public = 0 WHERE id = ?', [note.id]);
    return res.json({ message: 'Note is now private.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
