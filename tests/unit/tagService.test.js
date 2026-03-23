import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';

const TEST_DB = 'data/test-tag-service.db';
process.env.DB_PATH = TEST_DB;

let db;
let tagService;
let bookmarkService;

beforeAll(async () => {
  mkdirSync('data', { recursive: true });
  const { initDatabase, getDatabase } = await import('../../src/db/database.js');
  initDatabase();
  db = getDatabase();
  tagService = await import('../../src/services/tagService.js');
  bookmarkService = await import('../../src/services/bookmarkService.js');
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

describe('tagService', () => {
  describe('getAllWithCounts', () => {
    it('should return tags with correct counts', () => {
      bookmarkService.create({ url: 'https://a.com', title: 'A', tags: ['js', 'web'] });
      bookmarkService.create({ url: 'https://b.com', title: 'B', tags: ['js'] });

      const tags = tagService.getAllWithCounts();
      expect(tags.length).toBe(2);

      const js = tags.find(t => t.name === 'js');
      const web = tags.find(t => t.name === 'web');
      expect(js.count).toBe(2);
      expect(web.count).toBe(1);
    });

    it('should exclude orphan tags', () => {
      const bookmark = bookmarkService.create({
        url: 'https://a.com',
        title: 'A',
        tags: ['orphan'],
      });
      bookmarkService.remove(bookmark.id);

      const tags = tagService.getAllWithCounts();
      expect(tags.find(t => t.name === 'orphan')).toBeUndefined();
    });

    it('should return empty array with no tags', () => {
      expect(tagService.getAllWithCounts()).toEqual([]);
    });
  });
});
