import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';

const TEST_DB = 'data/test-bookmark-service.db';
process.env.DB_PATH = TEST_DB;

let db;

beforeAll(async () => {
  mkdirSync('data', { recursive: true });
  const { initDatabase, getDatabase } = await import('../../src/db/database.js');
  initDatabase();
  db = getDatabase();
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

describe('bookmarkService', () => {
  let bookmarkService;

  beforeAll(async () => {
    bookmarkService = await import('../../src/services/bookmarkService.js');
  });

  describe('create', () => {
    it('should create a bookmark and return it', () => {
      const result = bookmarkService.create({
        url: 'https://example.com',
        title: 'Example',
        description: 'Test description',
        tags: ['dev', 'test'],
      });

      expect(result.id).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(result.title).toBe('Example');
      expect(result.description).toBe('Test description');
      expect(result.is_favorite).toBe(false);
      expect(result.tags).toEqual(['dev', 'test']);
    });

    it('should normalize tags (lowercase, dedup)', () => {
      const result = bookmarkService.create({
        url: 'https://example.com',
        title: 'Test',
        tags: ['Web Dev', 'web dev', '  TESTING  '],
      });

      expect(result.tags).toEqual(['testing', 'web dev']);
    });

    it('should throw on invalid URL', () => {
      expect(() => bookmarkService.create({
        url: 'not-valid',
        title: 'Test',
      })).toThrow('Invalid URL format');
    });

    it('should throw on missing title', () => {
      expect(() => bookmarkService.create({
        url: 'https://example.com',
        title: '',
      })).toThrow('Title is required');
    });

    it('should throw on ftp protocol', () => {
      expect(() => bookmarkService.create({
        url: 'ftp://files.com/doc',
        title: 'Test',
      })).toThrow('Invalid URL format');
    });
  });

  describe('getAll', () => {
    it('should return bookmarks sorted newest first', () => {
      bookmarkService.create({ url: 'https://a.com', title: 'A' });
      db.prepare(
        "INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, datetime('now', '+1 second'))"
      ).run('https://b.com', 'B');

      const all = bookmarkService.getAll();
      expect(all.length).toBe(2);
      expect(all[0].title).toBe('B');
      expect(all[1].title).toBe('A');
    });

    it('should return empty array when no bookmarks', () => {
      const all = bookmarkService.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return bookmark by id', () => {
      const created = bookmarkService.create({
        url: 'https://example.com',
        title: 'Test',
      });

      const found = bookmarkService.getById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Test');
    });

    it('should return null for non-existent id', () => {
      expect(bookmarkService.getById(9999)).toBeNull();
    });
  });

  describe('update', () => {
    it('should update bookmark fields', () => {
      const created = bookmarkService.create({
        url: 'https://example.com',
        title: 'Original',
        tags: ['old'],
      });

      const updated = bookmarkService.update(created.id, {
        title: 'Updated',
        tags: ['new'],
      });

      expect(updated.title).toBe('Updated');
      expect(updated.url).toBe('https://example.com');
      expect(updated.tags).toEqual(['new']);
    });

    it('should reconcile tags in a transaction', () => {
      const created = bookmarkService.create({
        url: 'https://example.com',
        title: 'Test',
        tags: ['a', 'b', 'c'],
      });

      const updated = bookmarkService.update(created.id, {
        tags: ['b', 'd'],
      });

      expect(updated.tags).toEqual(['b', 'd']);
    });

    it('should return null for non-existent id', () => {
      expect(bookmarkService.update(9999, { title: 'Nope' })).toBeNull();
    });

    it('should throw on invalid URL', () => {
      const created = bookmarkService.create({
        url: 'https://example.com',
        title: 'Test',
      });

      expect(() => bookmarkService.update(created.id, {
        url: 'bad-url',
      })).toThrow('Invalid URL format');
    });
  });

  describe('remove', () => {
    it('should delete a bookmark', () => {
      const created = bookmarkService.create({
        url: 'https://example.com',
        title: 'To Delete',
      });

      expect(bookmarkService.remove(created.id)).toBe(true);
      expect(bookmarkService.getById(created.id)).toBeNull();
    });

    it('should return false for non-existent id', () => {
      expect(bookmarkService.remove(9999)).toBe(false);
    });
  });
});
