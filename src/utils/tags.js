/**
 * Normalize a tag: lowercase, strip to alphanumeric + hyphens + spaces, trim, collapse spaces.
 * Returns null for empty/invalid tags.
 */
export function normalizeTag(tag) {
  if (typeof tag !== 'string') return null;
  const normalized = tag
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || null;
}

/**
 * Normalize and deduplicate an array of tags.
 * Removes nulls and duplicates.
 */
export function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const result = [];
  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}
