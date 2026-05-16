// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { v4: uuidv4 } = require('uuid');
const { get, run } = require('./database');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value.toLowerCase();
      const googleId = profile.id;
      const name = profile.displayName;

      // 1. Try to find user by google_id
      let user = await get('SELECT * FROM users WHERE google_id = ?', [googleId]);
      
      if (user) {
        return done(null, user);
      }

      // 2. Try to find user by email (maybe they signed up with password before)
      user = await get('SELECT * FROM users WHERE email = ?', [email]);

      if (user) {
        // Link google_id to existing account
        await run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
        user.google_id = googleId;
        return done(null, user);
      }

      // 3. Create new user
      const id = uuidv4();
      await run(
        'INSERT INTO users (id, name, email, google_id) VALUES (?, ?, ?, ?)',
        [id, name, email, googleId]
      );
      
      const newUser = { id, name, email, google_id: googleId };
      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }
));

// These are required for passport session support but we are using JWTs
// so they won't be heavily used, but passport expects them.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
