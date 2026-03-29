import { decodeCursor, encodeCursor } from '../utils/cursor.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function resolvePageSize(pageSize) {
  if (pageSize === undefined || pageSize === null) return DEFAULT_PAGE_SIZE;
  const n = Number(pageSize);
  if (!Number.isInteger(n) || n < 1) return null;
  return Math.min(n, MAX_PAGE_SIZE);
}

export function buildFilterConditions({ search, tag, favorite }) {
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

  return { conditions, params };
}

export function buildCursorCondition(cursor) {
  if (!cursor) return { conditions: [], params: [], direction: 'forward' };

  const decoded = decodeCursor(cursor);
  const isBackward = cursor._direction === 'backward';

  if (isBackward) {
    return {
      conditions: ['(b.created_at > ? OR (b.created_at = ? AND b.id > ?))'],
      params: [decoded.createdAt, decoded.createdAt, decoded.id],
      direction: 'backward',
    };
  }

  return {
    conditions: ['(b.created_at < ? OR (b.created_at = ? AND b.id < ?))'],
    params: [decoded.createdAt, decoded.createdAt, decoded.id],
    direction: 'forward',
  };
}

export function parseCursorParam(cursorString) {
  if (!cursorString) return null;

  const decoded = decodeCursor(cursorString);
  return { raw: cursorString, createdAt: decoded.createdAt, id: decoded.id };
}

export function computeCursors(rows, direction) {
  if (rows.length === 0) return { nextCursor: null, prevCursor: null };

  const first = rows[0];
  const last = rows[rows.length - 1];

  return {
    nextCursor: encodeCursor(last.created_at, last.id),
    prevCursor: encodeCursor(first.created_at, first.id),
  };
}
