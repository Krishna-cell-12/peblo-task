// src/middleware/errorHandler.js
// ─────────────────────────────────────────────────────────────────
// Global Express error-handling middleware.
// Catches any error passed via next(err) and returns a consistent
// JSON response. Hides internal details in production.
// ─────────────────────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Log to console in all environments (in production, ship to a logger)
  console.error(`[ERROR] ${req.method} ${req.path} —`, err.message);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
