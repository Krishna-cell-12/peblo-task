// src/routes/auth.js
// ─────────────────────────────────────────────────────────────────
// Authentication routes:
//   POST /api/auth/signup  — register a new user
//   POST /api/auth/login   — log in and receive a JWT
//   GET  /api/auth/me      — return current user profile (protected)
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { get, run } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── Helper: issue a JWT ───────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── POST /auth/signup ────────────────────────────────────────────
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'ValidationError', message: 'name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    const password_hash = await bcrypt.hash(password, 12);

    // Check existing account (may be Google-only from OAuth)
    const existing = await get(
      'SELECT id, name, password_hash, google_id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing) {
      if (existing.password_hash) {
        return res.status(409).json({ error: 'ConflictError', message: 'An account with this email already exists.' });
      }
      // Link local password to an existing Google-only account
      await run(
        'UPDATE users SET name = ?, password_hash = ? WHERE id = ?',
        [trimmedName, password_hash, existing.id]
      );
      const user = { id: existing.id, name: trimmedName, email: normalizedEmail };
      const token = signToken(user);
      return res.status(201).json({
        message: 'Password linked to your account successfully.',
        token,
        user,
      });
    }

    const id = uuidv4();
    await run(
      'INSERT INTO users (id, name, email, password_hash, google_id) VALUES (?, ?, ?, ?, NULL)',
      [id, trimmedName, normalizedEmail, password_hash]
    );

    const user = { id, name: trimmedName, email: normalizedEmail };
    const token = signToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ─────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'ValidationError', message: 'email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'AuthError', message: 'Invalid email or password.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'AuthError',
        message: 'This account uses Google sign-in. Use Continue with Google or sign up to add a password.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'AuthError', message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/me ─────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'NotFound', message: 'User not found.' });
    }

    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ── Google OAuth Routes ──────────────────────────────────────────
require('../config/passport');
const passport = require('passport');

// Initiates the Google login
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

// Callback handler
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }

    const token = signToken(user);
    // Redirect to frontend with token in query param
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?token=${token}`);
  })(req, res, next);
});

module.exports = router;
