// src/config/database.js
// ─────────────────────────────────────────────────────────────────
// Initialises the SQLite database using the 'sqlite3' driver.
// Wraps operations in promises for easier async/await usage.
// ─────────────────────────────────────────────────────────────────

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DATABASE_URL || './data/peblo.db';

// Ensure the data directory exists
const dir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    // console.log('Connected to SQLite database');
  }
});

// Helper to run commands
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Helper to get a single row
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to get all rows
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ─── Schema Definition ────────────────────────────────────────────
const initDb = async () => {
  // Use a transaction-like sequence
  db.serialize(() => {
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at  TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
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
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS ai_usage (
        id             TEXT PRIMARY KEY,
        user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        note_id        TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        summary        TEXT,
        action_items   TEXT NOT NULL DEFAULT '[]',
        suggested_title TEXT,
        model_used     TEXT,
        created_at     TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_share_id ON notes(share_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_ai_usage_note_id ON ai_usage(note_id)');
  });
};

// Export the helpers and the database object
module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
