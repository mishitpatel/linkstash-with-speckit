import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { mkdirSync, rmSync } from 'node:fs';

const TEST_DB = 'data/test-pagination.db';
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

function seedBookmarks(count) {
  const stmt = db.prepare(
    "INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, datetime('now', ? || ' seconds'))"
  );
  for (let i = 0; i < count; i++) {
    stmt.run(`https://example.com/${i}`, `Bookmark ${i}`, String(-count + i));
  }
}

function seedTaggedBookmarks(tag, count, offset = 0) {
  const insertBookmark = db.prepare(
    "INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, datetime('now', ? || ' seconds'))"
  );
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
  const linkTag = db.prepare('INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');

  insertTag.run(tag);
  const tagId = getTagId.get(tag).id;

  for (let i = 0; i < count; i++) {
    const info = insertBookmark.run(
      `https://tagged-${tag}.com/${i}`,
      `${tag} Bookmark ${i}`,
      String(-(count + offset) + i)
    );
    linkTag.run(info.lastInsertRowid, tagId);
  }
}

describe('Cursor-based pagination', () => {
  it('should return first page with default page size of 20', async () => {
    seedBookmarks(25);
    const res = await request(app).get('/api/bookmarks');

    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(20);
    expect(res.body.pagination.total).toBe(25);
    expect(res.body.pagination.page_size).toBe(20);
    expect(res.body.pagination.next_cursor).toBeTruthy();
    expect(res.body.pagination.prev_cursor).toBeNull();
  });

  it('should navigate forward with next_cursor', async () => {
    seedBookmarks(25);
    const page1 = await request(app).get('/api/bookmarks');
    const page2 = await request(app)
      .get(`/api/bookmarks?cursor=${page1.body.pagination.next_cursor}`);

    expect(page2.status).toBe(200);
    expect(page2.body.bookmarks.length).toBe(5);
    expect(page2.body.pagination.next_cursor).toBeNull();
    expect(page2.body.pagination.prev_cursor).toBeTruthy();
    expect(page2.body.pagination.total).toBe(25);
  });

  it('should navigate backward with prev_cursor', async () => {
    seedBookmarks(25);
    const page1 = await request(app).get('/api/bookmarks');
    const page2 = await request(app)
      .get(`/api/bookmarks?cursor=${page1.body.pagination.next_cursor}`);
    const backToPage1 = await request(app)
      .get(`/api/bookmarks?cursor=${page2.body.pagination.prev_cursor}`);

    expect(backToPage1.status).toBe(200);
    expect(backToPage1.body.bookmarks.length).toBe(20);
    expect(backToPage1.body.pagination.prev_cursor).toBeNull();
    expect(backToPage1.body.pagination.next_cursor).toBeTruthy();
  });

  it('should return all bookmarks when fewer than page size', async () => {
    seedBookmarks(5);
    const res = await request(app).get('/api/bookmarks');

    expect(res.body.bookmarks.length).toBe(5);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.next_cursor).toBeNull();
    expect(res.body.pagination.prev_cursor).toBeNull();
  });

  it('should return empty list for empty collection', async () => {
    const res = await request(app).get('/api/bookmarks');

    expect(res.body.bookmarks).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.next_cursor).toBeNull();
    expect(res.body.pagination.prev_cursor).toBeNull();
  });

  it('should not produce duplicates when paginating through entire collection', async () => {
    seedBookmarks(45);
    const allIds = new Set();
    let cursor = null;

    // Paginate through all pages
    for (let i = 0; i < 10; i++) {
      const url = cursor
        ? `/api/bookmarks?cursor=${cursor}`
        : '/api/bookmarks';
      const res = await request(app).get(url);
      for (const bm of res.body.bookmarks) {
        expect(allIds.has(bm.id)).toBe(false);
        allIds.add(bm.id);
      }
      cursor = res.body.pagination.next_cursor;
      if (!cursor) break;
    }

    expect(allIds.size).toBe(45);
  });

  it('should return 400 for malformed cursor', async () => {
    const res = await request(app).get('/api/bookmarks?cursor=not-valid-base64!');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid cursor');
  });
});

describe('Configurable page size', () => {
  it('should respect custom page_size', async () => {
    seedBookmarks(15);
    const res = await request(app).get('/api/bookmarks?page_size=5');

    expect(res.body.bookmarks.length).toBe(5);
    expect(res.body.pagination.page_size).toBe(5);
    expect(res.body.pagination.total).toBe(15);
  });

  it('should silently cap page_size at 100', async () => {
    seedBookmarks(5);
    const res = await request(app).get('/api/bookmarks?page_size=200');

    expect(res.status).toBe(200);
    expect(res.body.pagination.page_size).toBe(100);
  });

  it('should return 400 for page_size=0', async () => {
    const res = await request(app).get('/api/bookmarks?page_size=0');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid page size');
  });

  it('should return 400 for negative page_size', async () => {
    const res = await request(app).get('/api/bookmarks?page_size=-1');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid page size');
  });

  it('should return 400 for non-numeric page_size', async () => {
    const res = await request(app).get('/api/bookmarks?page_size=abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid page size');
  });

  it('should accept page_size=1', async () => {
    seedBookmarks(3);
    const res = await request(app).get('/api/bookmarks?page_size=1');

    expect(res.body.bookmarks.length).toBe(1);
    expect(res.body.pagination.page_size).toBe(1);
  });

  it('should default to 20 when page_size not specified', async () => {
    seedBookmarks(25);
    const res = await request(app).get('/api/bookmarks');
    expect(res.body.pagination.page_size).toBe(20);
  });
});

describe('Performance', () => {
  it('should load first page in under 1 second with 10,000 bookmarks', async () => {
    const insert = db.prepare(
      "INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, datetime('now', ? || ' seconds'))"
    );
    const insertMany = db.transaction((count) => {
      for (let i = 0; i < count; i++) {
        insert.run(`https://perf-test.com/${i}`, `Perf Bookmark ${i}`, String(-count + i));
      }
    });
    insertMany(10000);

    const start = Date.now();
    const res = await request(app).get('/api/bookmarks');
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(20);
    expect(res.body.pagination.total).toBe(10000);
    expect(elapsed).toBeLessThan(1000);
  });
});

describe('Pagination with filters', () => {
  it('should paginate tag-filtered results correctly', async () => {
    seedTaggedBookmarks('design', 12);
    seedBookmarks(10);

    const allDesign = [];
    let cursor = null;

    for (let i = 0; i < 5; i++) {
      const url = cursor
        ? `/api/bookmarks?tag=design&page_size=5&cursor=${cursor}`
        : '/api/bookmarks?tag=design&page_size=5';
      const res = await request(app).get(url);
      allDesign.push(...res.body.bookmarks);
      expect(res.body.pagination.total).toBe(12);
      cursor = res.body.pagination.next_cursor;
      if (!cursor) break;
    }

    expect(allDesign.length).toBe(12);
    const uniqueIds = new Set(allDesign.map(b => b.id));
    expect(uniqueIds.size).toBe(12);
  });

  it('should paginate search-filtered results', async () => {
    seedBookmarks(30);
    // Add some with specific search term
    for (let i = 0; i < 8; i++) {
      db.prepare(
        "INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, datetime('now', ? || ' seconds'))"
      ).run(`https://searchable.com/${i}`, `Searchable Item ${i}`, String(i + 1));
    }

    const res = await request(app).get('/api/bookmarks?search=Searchable&page_size=5');
    expect(res.body.pagination.total).toBe(8);
    expect(res.body.bookmarks.length).toBe(5);
    expect(res.body.pagination.next_cursor).toBeTruthy();
  });

  it('should paginate favorite-filtered results', async () => {
    seedBookmarks(10);
    // Mark some as favorites
    const all = db.prepare('SELECT id FROM bookmarks LIMIT 4').all();
    for (const row of all) {
      db.prepare('UPDATE bookmarks SET is_favorite = 1 WHERE id = ?').run(row.id);
    }

    const res = await request(app).get('/api/bookmarks?favorite=true&page_size=2');
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.bookmarks.length).toBe(2);
    expect(res.body.bookmarks.every(b => b.is_favorite)).toBe(true);
  });

  it('should reflect filtered count not global count', async () => {
    seedBookmarks(20);
    seedTaggedBookmarks('react', 5, 20);

    const res = await request(app).get('/api/bookmarks?tag=react');
    expect(res.body.pagination.total).toBe(5);
  });
});
