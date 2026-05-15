// src/routes/shared.js
// ─────────────────────────────────────────────────────────────────
// Public share routes — no authentication required.
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const { get } = require('../config/database');

const router = express.Router();

// ── GET /shared/:shareId ─────────────────────────────────────────
router.get('/:shareId', async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const note = await get('SELECT * FROM notes WHERE share_id = ? AND is_public = 1', [shareId]);

    if (!note) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'This note does not exist or is no longer shared publicly.',
      });
    }

    // Fetch the note author's name
    const author = await get('SELECT name FROM users WHERE id = ?', [note.user_id]);

    let tags = [];
    try { tags = JSON.parse(note.tags); } catch { tags = []; }

    return res.json({
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        tags,
        author: author ? author.name : 'Anonymous',
        updated_at: note.updated_at,
        created_at: note.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
