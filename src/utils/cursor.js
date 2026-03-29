/**
 * Cursor encode/decode for keyset pagination.
 * Cursor format: base64url-encoded JSON { c: created_at, i: id, d: direction }
 * Direction: "f" = forward (next page), "b" = backward (previous page)
 */

export function encodeCursor(createdAt, id, direction = 'f') {
  const json = JSON.stringify({ c: createdAt, i: id, d: direction });
  return Buffer.from(json).toString('base64url');
}

export function decodeCursor(cursorString) {
  if (!cursorString || typeof cursorString !== 'string') {
    throw new Error('Invalid cursor');
  }

  let parsed;
  try {
    const json = Buffer.from(cursorString, 'base64url').toString('utf8');
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid cursor');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof parsed.c !== 'string' ||
    typeof parsed.i !== 'number' ||
    !Number.isInteger(parsed.i)
  ) {
    throw new Error('Invalid cursor');
  }

  const direction = parsed.d === 'b' ? 'backward' : 'forward';

  return { createdAt: parsed.c, id: parsed.i, direction };
}
