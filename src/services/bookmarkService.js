import { getDatabase } from '../db/database.js';
import { normalizeTags } from '../utils/tags.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { buildFilterConditions, resolvePageSize } from './paginationHelper.js';

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

export function getPaginated({ search, tag, favorite, cursor, pageSize } = {}) {
  const db = getDatabase();
  const limit = resolvePageSize(pageSize);
  const { conditions: filterConds, params: filterParams } = buildFilterConditions({ search, tag, favorite });

  let direction = 'forward';
  const cursorConds = [];
  const cursorParams = [];

  if (cursor) {
    const decoded = decodeCursor(cursor);
    direction = decoded.direction;
    if (direction === 'backward') {
      cursorConds.push('(b.created_at > ? OR (b.created_at = ? AND b.id > ?))');
    } else {
      cursorConds.push('(b.created_at < ? OR (b.created_at = ? AND b.id < ?))');
    }
    cursorParams.push(decoded.createdAt, decoded.createdAt, decoded.id);
  }

  const allConditions = [...filterConds, ...cursorConds];
  const allParams = [...filterParams, ...cursorParams];
  const where = allConditions.length > 0 ? `WHERE ${allConditions.join(' AND ')}` : '';
  const orderBy = direction === 'backward'
    ? 'ORDER BY b.created_at ASC, b.id ASC'
    : 'ORDER BY b.created_at DESC, b.id DESC';

  const rows = db.prepare(
    `SELECT * FROM bookmarks b ${where} ${orderBy} LIMIT ?`
  ).all(...allParams, limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  if (direction === 'backward') pageRows.reverse();

  const countWhere = filterConds.length > 0 ? `WHERE ${filterConds.join(' AND ')}` : '';
  const total = db.prepare(
    `SELECT COUNT(*) as count FROM bookmarks b ${countWhere}`
  ).get(...filterParams).count;

  const bookmarks = pageRows.map(row => formatBookmark(db, row));

  let nextCursor = null;
  let prevCursor = null;

  if (pageRows.length > 0) {
    const first = pageRows[0];
    const last = pageRows[pageRows.length - 1];

    if (direction === 'forward') {
      if (hasMore) nextCursor = encodeCursor(last.created_at, last.id, 'f');
      if (cursor) prevCursor = encodeCursor(first.created_at, first.id, 'b');
    } else {
      const moreAfter = db.prepare(
        `SELECT 1 FROM bookmarks b ${filterConds.length > 0 ? 'WHERE ' + filterConds.join(' AND ') + ' AND ' : 'WHERE '}(b.created_at < ? OR (b.created_at = ? AND b.id < ?)) LIMIT 1`
      ).get(...filterParams, last.created_at, last.created_at, last.id);
      if (moreAfter) nextCursor = encodeCursor(last.created_at, last.id, 'f');
      if (hasMore) prevCursor = encodeCursor(first.created_at, first.id, 'b');
    }
  }

  return {
    bookmarks,
    pagination: { next_cursor: nextCursor, prev_cursor: prevCursor, total, page_size: limit },
  };
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
