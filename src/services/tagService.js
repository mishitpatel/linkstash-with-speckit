import { getDatabase } from '../db/database.js';

export function getAllWithCounts() {
  const db = getDatabase();
  return db.prepare(`
    SELECT t.id, t.name, COUNT(bt.bookmark_id) as count
    FROM tags t
    JOIN bookmark_tags bt ON bt.tag_id = t.id
    GROUP BY t.id, t.name
    HAVING count > 0
    ORDER BY t.name
  `).all();
}
