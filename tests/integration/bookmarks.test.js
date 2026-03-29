import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { mkdirSync, rmSync } from 'node:fs';

// Setup test database before importing app
const TEST_DB = 'data/test-bookmarks.db';
process.env.DB_PATH = TEST_DB;

let app;
let db;

beforeAll(async () => {
  mkdirSync('data', { recursive: true });
  const { initDatabase, getDatabase } = await import('../../src/db/database.js');
  initDatabase();
  db = getDatabase();
  const mod = await import('../../src/app.js');
  app = mod.default;
});

afterAll(() => {
  if (db) db.close();
  try { rmSync(TEST_DB); } catch { /* ignore */ }
});

beforeEach(() => {
  db.exec('DELETE FROM bookmark_tags');
  db.exec('DELETE FROM tags');
  db.exec('DELETE FROM bookmarks');
});

describe('POST /api/bookmarks', () => {
  it('should create a bookmark with valid data', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({
        url: 'https://example.com',
        title: 'Example Site',
        description: 'A test bookmark',
        tags: ['web dev', 'reference'],
      });

    expect(res.status).toBe(201);
    expect(res.body.bookmark).toBeDefined();
    expect(res.body.bookmark.url).toBe('https://example.com');
    expect(res.body.bookmark.title).toBe('Example Site');
    expect(res.body.bookmark.description).toBe('A test bookmark');
    expect(res.body.bookmark.is_favorite).toBe(false);
    expect(res.body.bookmark.tags).toEqual(['reference', 'web dev']);
    expect(res.body.bookmark.id).toBeDefined();
    expect(res.body.bookmark.created_at).toBeDefined();
  });

  it('should reject invalid URL', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'not-a-url', title: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid URL format');
  });

  it('should reject ftp URL', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'ftp://files.example.com', title: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid URL format');
  });

  it('should reject missing title', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title is required');
  });

  it('should create bookmark without optional fields', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Minimal' });

    expect(res.status).toBe(201);
    expect(res.body.bookmark.description).toBeNull();
    expect(res.body.bookmark.tags).toEqual([]);
  });
});

describe('GET /api/bookmarks', () => {
  it('should return empty list when no bookmarks', async () => {
    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks).toEqual([]);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.next_cursor).toBeNull();
    expect(res.body.pagination.prev_cursor).toBeNull();
  });

  it('should return bookmarks sorted by newest first', async () => {
    // Create bookmarks with slight delay for ordering
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://first.com', title: 'First' });

    // Insert second with a later timestamp
    db.prepare(
      "INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, datetime('now', '+1 second'))"
    ).run('https://second.com', 'Second');

    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(2);
    expect(res.body.bookmarks[0].title).toBe('Second');
    expect(res.body.bookmarks[1].title).toBe('First');
    expect(res.body.pagination.total).toBe(2);
  });
});

describe('GET /api/bookmarks/:id', () => {
  it('should return a bookmark by id', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Test', tags: ['dev'] });

    const id = createRes.body.bookmark.id;
    const res = await request(app).get(`/api/bookmarks/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.bookmark.id).toBe(id);
    expect(res.body.bookmark.title).toBe('Test');
    expect(res.body.bookmark.tags).toEqual(['dev']);
  });

  it('should return 404 for non-existent bookmark', async () => {
    const res = await request(app).get('/api/bookmarks/9999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Bookmark not found');
  });
});

describe('PUT /api/bookmarks/:id', () => {
  it('should update bookmark fields', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Original', tags: ['old'] });

    const id = createRes.body.bookmark.id;
    const res = await request(app)
      .put(`/api/bookmarks/${id}`)
      .send({ title: 'Updated', description: 'New desc', tags: ['new'] });

    expect(res.status).toBe(200);
    expect(res.body.bookmark.title).toBe('Updated');
    expect(res.body.bookmark.description).toBe('New desc');
    expect(res.body.bookmark.url).toBe('https://example.com');
    expect(res.body.bookmark.tags).toEqual(['new']);
  });

  it('should validate URL on update', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Test' });

    const id = createRes.body.bookmark.id;
    const res = await request(app)
      .put(`/api/bookmarks/${id}`)
      .send({ url: 'not-valid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid URL format');
  });

  it('should reconcile tags on update', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Test', tags: ['a', 'b', 'c'] });

    const id = createRes.body.bookmark.id;
    const res = await request(app)
      .put(`/api/bookmarks/${id}`)
      .send({ tags: ['b', 'd'] });

    expect(res.status).toBe(200);
    expect(res.body.bookmark.tags).toEqual(['b', 'd']);
  });

  it('should return 404 for non-existent bookmark', async () => {
    const res = await request(app)
      .put('/api/bookmarks/9999')
      .send({ title: 'Nope' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/bookmarks/:id', () => {
  it('should delete a bookmark', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'To Delete', tags: ['temp'] });

    const id = createRes.body.bookmark.id;
    const res = await request(app).delete(`/api/bookmarks/${id}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/bookmarks/${id}`);
    expect(getRes.status).toBe(404);
  });

  it('should cascade delete bookmark_tags', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Tagged', tags: ['cascade-test'] });

    const id = createRes.body.bookmark.id;
    await request(app).delete(`/api/bookmarks/${id}`);

    const rows = db.prepare('SELECT * FROM bookmark_tags WHERE bookmark_id = ?').all(id);
    expect(rows.length).toBe(0);
  });

  it('should return 404 for non-existent bookmark', async () => {
    const res = await request(app).delete('/api/bookmarks/9999');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/bookmarks/:id/favorite', () => {
  it('should toggle favorite on', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Test' });

    const id = createRes.body.bookmark.id;
    const res = await request(app).patch(`/api/bookmarks/${id}/favorite`);

    expect(res.status).toBe(200);
    expect(res.body.bookmark.id).toBe(id);
    expect(res.body.bookmark.is_favorite).toBe(true);
  });

  it('should toggle favorite off', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Test' });

    const id = createRes.body.bookmark.id;

    // Toggle on
    await request(app).patch(`/api/bookmarks/${id}/favorite`);
    // Toggle off
    const res = await request(app).patch(`/api/bookmarks/${id}/favorite`);

    expect(res.status).toBe(200);
    expect(res.body.bookmark.is_favorite).toBe(false);
  });

  it('should return 404 for non-existent bookmark', async () => {
    const res = await request(app).patch('/api/bookmarks/9999/favorite');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/bookmarks?favorite=true', () => {
  it('should filter to only favorites', async () => {
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://fav.com', title: 'Fav' });
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://nonfav.com', title: 'Non-Fav' });

    // Make first one a favorite
    const allRes = await request(app).get('/api/bookmarks');
    const favId = allRes.body.bookmarks.find(b => b.title === 'Fav').id;
    await request(app).patch(`/api/bookmarks/${favId}/favorite`);

    const res = await request(app).get('/api/bookmarks?favorite=true');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(1);
    expect(res.body.bookmarks[0].title).toBe('Fav');
  });
});

describe('Tag assignment on create/update', () => {
  it('should assign tags on create', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Tagged', tags: ['alpha', 'beta'] });

    expect(res.body.bookmark.tags).toEqual(['alpha', 'beta']);
  });

  it('should replace tags on update', async () => {
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com', title: 'Test', tags: ['old'] });

    const id = createRes.body.bookmark.id;
    const res = await request(app)
      .put(`/api/bookmarks/${id}`)
      .send({ tags: ['new1', 'new2'] });

    expect(res.body.bookmark.tags).toEqual(['new1', 'new2']);
  });
});
