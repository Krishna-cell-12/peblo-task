// src/server.js
// ─────────────────────────────────────────────────────────────────
// Peblo Notes — Express server entry point.
// Sets up middleware, mounts all route modules, and starts listening.
// ─────────────────────────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialise DB (runs CREATE TABLE IF NOT EXISTS on startup)
const { initDb } = require('./config/database');
initDb().catch(err => console.error('Database initialization failed:', err));

const authRoutes    = require('./routes/auth');
const notesRoutes   = require('./routes/notes');
const sharedRoutes  = require('./routes/shared');
const insightsRoutes = require('./routes/insights');
const errorHandler  = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body Parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'peblo-backend', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────────
app.use('/auth',     authRoutes);
app.use('/notes',    notesRoutes);
app.use('/shared',   sharedRoutes);
app.use('/insights', insightsRoutes);

// ── 404 for unknown routes ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'The requested endpoint does not exist.' });
});

// ── Global error handler (must be last) ──────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Peblo backend running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Database    : ${process.env.DATABASE_URL || './data/peblo.db'}`);
    console.log(`   AI Provider : ${process.env.LLM_API_KEY ? 'Gemini (live)' : 'Mock (no key)'}\n`);
  });
}

module.exports = app; // exported for testing
