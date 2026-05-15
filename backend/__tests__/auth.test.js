// __tests__/auth.test.js
// ─────────────────────────────────────────────────────────────────
// Integration tests for the Authentication API.
// Uses supertest to make real HTTP requests against the Express app.
// ─────────────────────────────────────────────────────────────────

const request = require('supertest');

// Use an in-memory test DB — override before requiring app
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const app = require('../src/server');

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };
  let authToken;

  // ── POST /auth/signup ──────────────────────────────────────────
  describe('POST /auth/signup', () => {
    it('should create a new user and return a JWT', async () => {
      const res = await request(app).post('/auth/signup').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
      authToken = res.body.token;
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app).post('/auth/signup').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ConflictError');
    });

    it('should reject signup with missing fields', async () => {
      const res = await request(app).post('/auth/signup').send({ email: 'a@b.com' });
      expect(res.status).toBe(400);
    });

    it('should reject short passwords', async () => {
      const res = await request(app).post('/auth/signup').send({ name: 'X', email: 'x@x.com', password: '123' });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /auth/login ───────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('should log in with correct credentials', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject wrong password', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'nobody@example.com',
        password: 'anything',
      });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /auth/me ───────────────────────────────────────────────
  describe('GET /auth/me', () => {
    it('should return user profile with valid token', async () => {
      const loginRes = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
