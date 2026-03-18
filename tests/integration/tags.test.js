import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { mkdirSync, rmSync } from 'node:fs';

const TEST_DB = 'data/test-tags.db';
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

describe('GET /api/tags', () => {
  it('should return tags with bookmark counts', async () => {
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://a.com', title: 'A', tags: ['web dev', 'reference'] });
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://b.com', title: 'B', tags: ['web dev'] });

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags.length).toBe(2);

    const webDev = res.body.tags.find(t => t.name === 'web dev');
    const reference = res.body.tags.find(t => t.name === 'reference');

    expect(webDev.count).toBe(2);
    expect(reference.count).toBe(1);
  });

  it('should exclude orphan tags', async () => {
    // Create bookmark with tag, then delete bookmark
    const createRes = await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://a.com', title: 'A', tags: ['orphan-tag'] });

    const id = createRes.body.bookmark.id;
    await request(app).delete(`/api/bookmarks/${id}`);

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    const orphan = res.body.tags.find(t => t.name === 'orphan-tag');
    expect(orphan).toBeUndefined();
  });

  it('should return empty array when no tags', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });
});

describe('GET /api/bookmarks?tag=X', () => {
  it('should filter bookmarks by tag', async () => {
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://a.com', title: 'A', tags: ['javascript'] });
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://b.com', title: 'B', tags: ['python'] });
    await request(app)
      .post('/api/bookmarks')
      .send({ url: 'https://c.com', title: 'C', tags: ['javascript', 'python'] });

    const res = await request(app).get('/api/bookmarks?tag=javascript');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(2);
    const titles = res.body.bookmarks.map(b => b.title).sort();
    expect(titles).toEqual(['A', 'C']);
  });
});
