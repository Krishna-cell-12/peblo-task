-- ─────────────────────────────────────────────────────────────────
-- Peblo Notes — Sample Database Dump (SQLite compatible SQL)
-- This represents a typical populated state for demo/testing.
-- To restore: sqlite3 peblo.db < sample_dump.sql
-- ─────────────────────────────────────────────────────────────────

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Schema ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled',
  content     TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '[]',
  is_archived INTEGER NOT NULL DEFAULT 0,
  is_public   INTEGER NOT NULL DEFAULT 0,
  share_id    TEXT UNIQUE,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id         TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  summary         TEXT,
  action_items    TEXT NOT NULL DEFAULT '[]',
  suggested_title TEXT,
  model_used      TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id    ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_share_id   ON notes(share_id);

-- ── Sample Data ───────────────────────────────────────────────────

-- Users (password_hash = bcrypt of "password123")
INSERT INTO users VALUES
  ('usr-001', 'John Doe',   'john@example.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAkCmSYM7bRIQiY6', '2026-05-10T09:00:00Z'),
  ('usr-002', 'Jane Smith', 'jane@example.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAkCmSYM7bRIQiY6', '2026-05-11T10:00:00Z');

-- Notes for John
INSERT INTO notes VALUES
  ('note-001', 'usr-001', 'Sprint Planning Notes',
   '## Sprint Goals

This sprint we are focusing on:
- Finalise the REST API design
- Set up CI/CD with GitHub Actions
- Write unit tests for auth module
- Schedule design review meeting

**Deadline:** End of next week
**Team size:** 5 devs',
   ''["work","planning","sprint"]'', 0, 1, 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
   '2026-05-10T10:00:00Z', '2026-05-14T12:05:30Z'),

  ('note-002', 'usr-001', 'Research: AI Integration Patterns',
   '## AI Integration Options

### Option 1: Gemini 1.5 Flash
- Fast inference
- Free tier available
- Good JSON output mode

### Option 2: OpenAI GPT-4o-mini
- Reliable
- Cost-effective
- Strong instruction following

**Recommendation:** Start with Gemini, switch if needed.',
   '["research","ai","backend"]', 0, 0, NULL,
   '2026-05-12T14:00:00Z', '2026-05-12T16:45:00Z'),

  ('note-003', 'usr-001', 'Meeting Notes — May 13',
   '## Weekly Sync

**Attendees:** John, Jane, Bob

### Action Items
- [ ] John: Update API docs by Thursday
- [ ] Jane: Review PR #42
- [ ] Bob: Deploy staging environment

### Blockers
- Waiting on design assets from Figma',
   '["meeting","team"]', 0, 0, NULL,
   '2026-05-13T09:00:00Z', '2026-05-13T09:30:00Z'),

  ('note-004', 'usr-001', 'Old Ideas (Archived)',
   'Some ideas from last quarter that are no longer relevant.',
   '["archive"]', 1, 0, NULL,
   '2026-04-01T10:00:00Z', '2026-04-15T12:00:00Z');

-- AI usage records
INSERT INTO ai_usage VALUES
  ('ai-001', 'usr-001', 'note-001',
   'Weekly project planning discussion focusing on sprint deliverables for the backend and frontend teams.',
   '["Review API design documentation","Set up CI/CD pipeline","Write unit tests for auth module","Schedule design review meeting"]',
   'Sprint Planning Notes — Week Deliverables',
   'gemini-1.5-flash',
   '2026-05-14T12:10:00Z'),

  ('ai-002', 'usr-001', 'note-002',
   'Research note comparing AI integration options including Gemini and OpenAI, with recommendation to start with Gemini.',
   '["Prototype Gemini integration","Evaluate cost at scale","Document decision rationale"]',
   'AI Provider Comparison — Integration Research',
   'gemini-1.5-flash',
   '2026-05-12T17:00:00Z');
