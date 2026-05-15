// src/routes/insights.js
// ─────────────────────────────────────────────────────────────────
// Productivity Insights route — requires JWT auth.
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const { get, all } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── GET /insights ────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Total active notes count
    const { total_notes } = await get(`SELECT COUNT(*) as total_notes FROM notes WHERE user_id = ? AND is_archived = 0`, [userId]);

    // 2. Total archived notes
    const { archived_notes } = await get(`SELECT COUNT(*) as archived_notes FROM notes WHERE user_id = ? AND is_archived = 1`, [userId]);

    // 3. Recently edited notes (last 5)
    const recently_edited = (await all(`
        SELECT id, title, updated_at, tags
        FROM notes
        WHERE user_id = ? AND is_archived = 0
        ORDER BY updated_at DESC
        LIMIT 5
      `, [userId])).map((n) => ({ ...n, tags: (() => { try { return JSON.parse(n.tags); } catch { return []; } })() }));

    // 4. Most-used tags
    const allTagRows = await all(`SELECT tags FROM notes WHERE user_id = ? AND is_archived = 0`, [userId]);

    const tagCounts = {};
    allTagRows.forEach((row) => {
      let tags = [];
      try { tags = JSON.parse(row.tags); } catch { return; }
      tags.forEach((tag) => {
        if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const most_used_tags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // 5. AI usage count
    const { ai_summaries_generated } = await get(`SELECT COUNT(*) as ai_summaries_generated FROM ai_usage WHERE user_id = ?`, [userId]);

    // 6. Activity chart data
    const activity_last_7_days = await all(`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM notes
        WHERE user_id = ?
          AND created_at >= date('now', '-6 days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `, [userId]);

    // 7. Total public notes
    const { public_notes } = await get(`SELECT COUNT(*) as public_notes FROM notes WHERE user_id = ? AND is_public = 1`, [userId]);

    return res.json({
      total_notes,
      archived_notes,
      public_notes,
      ai_summaries_generated,
      recently_edited,
      most_used_tags,
      activity_last_7_days,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
