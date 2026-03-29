import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { mkdirSync, rmSync } from 'node:fs';

const TEST_DB = 'data/test-search.db';
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

beforeEach(async () => {
  db.exec('DELETE FROM bookmark_tags');
  db.exec('DELETE FROM tags');
  db.exec('DELETE FROM bookmarks');

  // Seed test data
  await request(app).post('/api/bookmarks').send({
    url: 'https://nodejs.org',
    title: 'Node.js Official',
    description: 'JavaScript runtime',
    tags: ['javascript', 'backend'],
  });
  await request(app).post('/api/bookmarks').send({
    url: 'https://react.dev',
    title: 'React Documentation',
    description: 'Frontend library',
    tags: ['javascript', 'frontend'],
  });
  await request(app).post('/api/bookmarks').send({
    url: 'https://python.org',
    title: 'Python Official',
    description: 'Programming language',
    tags: ['python'],
  });

  // Make Node.js a favorite
  const allRes = await request(app).get('/api/bookmarks');
  const nodeBookmark = allRes.body.bookmarks.find(b => b.title === 'Node.js Official');
  await request(app).patch(`/api/bookmarks/${nodeBookmark.id}/favorite`);
});

describe('GET /api/bookmarks?search=X', () => {
  it('should search by title', async () => {
    const res = await request(app).get('/api/bookmarks?search=Official');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(2);
  });

  it('should search by URL', async () => {
    const res = await request(app).get('/api/bookmarks?search=react.dev');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(1);
    expect(res.body.bookmarks[0].title).toBe('React Documentation');
  });

  it('should search by description', async () => {
    const res = await request(app).get('/api/bookmarks?search=runtime');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(1);
    expect(res.body.bookmarks[0].title).toBe('Node.js Official');
  });

  it('should be case-insensitive', async () => {
    const res = await request(app).get('/api/bookmarks?search=PYTHON');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(1);
  });

  it('should return empty for no matches', async () => {
    const res = await request(app).get('/api/bookmarks?search=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks).toEqual([]);
  });
});

describe('Combined filters', () => {
  it('should combine search + tag', async () => {
    const res = await request(app).get('/api/bookmarks?search=Official&tag=javascript');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(1);
    expect(res.body.bookmarks[0].title).toBe('Node.js Official');
  });

  it('should combine search + favorite', async () => {
    const res = await request(app).get('/api/bookmarks?search=Official&favorite=true');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(1);
    expect(res.body.bookmarks[0].title).toBe('Node.js Official');
  });

  it('should combine search + tag + favorite', async () => {
    const res = await request(app).get('/api/bookmarks?search=node&tag=javascript&favorite=true');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(1);
    expect(res.body.bookmarks[0].title).toBe('Node.js Official');
  });

  it('should return empty when combined filters exclude all', async () => {
    const res = await request(app).get('/api/bookmarks?search=react&favorite=true');
    expect(res.status).toBe(200);
    expect(res.body.bookmarks).toEqual([]);
  });
});
