import { getDatabase } from '../db/database.js';
import { normalizeTags } from '../utils/tags.js';

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function attachTags(db, bookmarkId, tags) {
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
  const linkTag = db.prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');

  for (const tagName of tags) {
    insertTag.run(tagName);
    const tag = getTagId.get(tagName);
    linkTag.run(bookmarkId, tag.id);
  }
}

function getTagsForBookmark(db, bookmarkId) {
  return db.prepare(`
    SELECT t.name FROM tags t
    JOIN bookmark_tags bt ON bt.tag_id = t.id
    WHERE bt.bookmark_id = ?
    ORDER BY t.name
  `).all(bookmarkId).map(row => row.name);
}

function formatBookmark(db, row) {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    is_favorite: row.is_favorite === 1,
    created_at: row.created_at,
    tags: getTagsForBookmark(db, row.id),
  };
}

export function create({ url, title, description, tags }) {
  if (!validateUrl(url)) {
    throw Object.assign(new Error('Invalid URL format'), { status: 400 });
  }
  if (!title || !title.trim()) {
    throw Object.assign(new Error('Title is required'), { status: 400 });
  }

  const db = getDatabase();
  const normalizedTags = normalizeTags(tags || []);

  const result = db.transaction(() => {
    const info = db.prepare(
      'INSERT INTO bookmarks (url, title, description) VALUES (?, ?, ?)'
    ).run(url.trim(), title.trim(), description ? description.trim() : null);

    const bookmarkId = info.lastInsertRowid;
    attachTags(db, bookmarkId, normalizedTags);
    return bookmarkId;
  })();

  return getById(result);
}

export function getAll({ search, tag, favorite } = {}) {
  const db = getDatabase();
  const conditions = [];
  const params = [];

  if (favorite) {
    conditions.push('b.is_favorite = 1');
  }

  if (tag) {
    conditions.push(`
      b.id IN (
        SELECT bt.bookmark_id FROM bookmark_tags bt
        JOIN tags t ON t.id = bt.tag_id
        WHERE t.name = ?
      )
    `);
    params.push(tag.toLowerCase());
  }

  if (search) {
    conditions.push('(b.title LIKE ? OR b.url LIKE ? OR b.description LIKE ?)');
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM bookmarks b ${where} ORDER BY b.created_at DESC`).all(...params);

  return rows.map(row => formatBookmark(db, row));
}

export function getById(id) {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
  if (!row) return null;
  return formatBookmark(db, row);
}

export function update(id, { url, title, description, tags }) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
  if (!existing) return null;

  if (url !== undefined && !validateUrl(url)) {
    throw Object.assign(new Error('Invalid URL format'), { status: 400 });
  }
  if (title !== undefined && (!title || !title.trim())) {
    throw Object.assign(new Error('Title is required'), { status: 400 });
  }

  db.transaction(() => {
    const updates = [];
    const params = [];

    if (url !== undefined) { updates.push('url = ?'); params.push(url.trim()); }
    if (title !== undefined) { updates.push('title = ?'); params.push(title.trim()); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description ? description.trim() : null); }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    if (tags !== undefined) {
      // Reconcile tags: remove all existing, re-attach normalized
      db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(id);
      const normalizedTags = normalizeTags(tags);
      attachTags(db, id, normalizedTags);
    }
  })();

  return getById(id);
}

export function remove(id) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
  if (!existing) return false;
  db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
  return true;
}

export function toggleFavorite(id) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
  if (!existing) return null;
  const newValue = existing.is_favorite === 1 ? 0 : 1;
  db.prepare('UPDATE bookmarks SET is_favorite = ? WHERE id = ?').run(newValue, id);
  return { id, is_favorite: newValue === 1 };
}
