// __tests__/notes.test.js
// ─────────────────────────────────────────────────────────────────
// Integration tests for the Notes API (CRUD + search).
// ─────────────────────────────────────────────────────────────────

const request = require('supertest');

process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const app = require('../src/server');

describe('Notes API', () => {
  let token;
  let noteId;

  beforeAll(async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Notes Tester',
      email: `notes-${Date.now()}@example.com`,
      password: 'password123',
    });
    token = res.body.token;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  // ── POST /notes ────────────────────────────────────────────────
  describe('POST /notes', () => {
    it('should create a note', async () => {
      const res = await request(app)
        .post('/notes')
        .set(auth())
        .send({ title: 'Test Note', content: 'Hello world content', tags: ['work', 'test'] });
      expect(res.status).toBe(201);
      expect(res.body.note.title).toBe('Test Note');
      expect(res.body.note.tags).toEqual(['work', 'test']);
      noteId = res.body.note.id;
    });

    it('should require auth', async () => {
      const res = await request(app).post('/notes').send({ title: 'Test' });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /notes ─────────────────────────────────────────────────
  describe('GET /notes', () => {
    it('should list notes for the user', async () => {
      const res = await request(app).get('/notes').set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notes)).toBe(true);
      expect(res.body.notes.length).toBeGreaterThan(0);
    });

    it('should filter notes by keyword', async () => {
      const res = await request(app).get('/notes?q=Hello').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.notes.some((n) => n.content.includes('Hello'))).toBe(true);
    });

    it('should filter notes by tag', async () => {
      const res = await request(app).get('/notes?tag=work').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.notes.every((n) => n.tags.includes('work'))).toBe(true);
    });
  });

  // ── PATCH /notes/:id ──────────────────────────────────────────
  describe('PATCH /notes/:id', () => {
    it('should update a note', async () => {
      const res = await request(app)
        .patch(`/notes/${noteId}`)
        .set(auth())
        .send({ title: 'Updated Title', tags: ['work', 'updated'] });
      expect(res.status).toBe(200);
      expect(res.body.note.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent note', async () => {
      const res = await request(app)
        .patch('/notes/non-existent-id')
        .set(auth())
        .send({ title: 'x' });
      expect(res.status).toBe(404);
    });
  });

  // ── Share / Unshare ────────────────────────────────────────────
  describe('POST /notes/:id/share', () => {
    it('should make a note public and return a share_id', async () => {
      const res = await request(app).post(`/notes/${noteId}/share`).set(auth());
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('share_id');
    });
  });

  // ── DELETE /notes/:id ─────────────────────────────────────────
  describe('DELETE /notes/:id', () => {
    it('should delete a note', async () => {
      const res = await request(app).delete(`/notes/${noteId}`).set(auth());
      expect(res.status).toBe(200);
    });

    it('should return 404 after deletion', async () => {
      const res = await request(app).get(`/notes/${noteId}`).set(auth());
      expect(res.status).toBe(404);
    });
  });
});
