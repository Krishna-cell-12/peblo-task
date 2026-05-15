// src/middleware/auth.js
// ─────────────────────────────────────────────────────────────────
// JWT authentication middleware.
// Attaches the decoded user payload to req.user on success.
// Returns 401 if the token is missing or invalid.
// ─────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided. Include Authorization: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TokenExpired', message: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'InvalidToken', message: 'Token is invalid.' });
  }
};

module.exports = authMiddleware;
