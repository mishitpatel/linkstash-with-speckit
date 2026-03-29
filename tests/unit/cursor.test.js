import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor } from '../../src/utils/cursor.js';

describe('encodeCursor', () => {
  it('should produce a valid base64url string', () => {
    const cursor = encodeCursor('2026-03-24T10:00:00', 42);
    expect(typeof cursor).toBe('string');
    expect(cursor.length).toBeGreaterThan(0);
    // base64url should not contain +, /, or =
    expect(cursor).not.toMatch(/[+/=]/);
  });

  it('should encode direction in the cursor', () => {
    const forward = encodeCursor('2026-03-24T10:00:00', 42, 'f');
    const backward = encodeCursor('2026-03-24T10:00:00', 42, 'b');
    expect(forward).not.toBe(backward);
  });
});

describe('decodeCursor', () => {
  it('should round-trip correctly', () => {
    const cursor = encodeCursor('2026-03-24T10:00:00', 42, 'f');
    const decoded = decodeCursor(cursor);
    expect(decoded.createdAt).toBe('2026-03-24T10:00:00');
    expect(decoded.id).toBe(42);
    expect(decoded.direction).toBe('forward');
  });

  it('should decode backward direction', () => {
    const cursor = encodeCursor('2026-03-24T10:00:00', 42, 'b');
    const decoded = decodeCursor(cursor);
    expect(decoded.direction).toBe('backward');
  });

  it('should reject null', () => {
    expect(() => decodeCursor(null)).toThrow('Invalid cursor');
  });

  it('should reject empty string', () => {
    expect(() => decodeCursor('')).toThrow('Invalid cursor');
  });

  it('should reject non-base64 string', () => {
    expect(() => decodeCursor('not-valid!!!')).toThrow('Invalid cursor');
  });

  it('should reject valid base64 with invalid JSON', () => {
    const notJson = Buffer.from('not json').toString('base64url');
    expect(() => decodeCursor(notJson)).toThrow('Invalid cursor');
  });

  it('should reject JSON with missing fields', () => {
    const missingId = Buffer.from(JSON.stringify({ c: 'date' })).toString('base64url');
    expect(() => decodeCursor(missingId)).toThrow('Invalid cursor');
  });

  it('should reject JSON with wrong types', () => {
    const wrongType = Buffer.from(JSON.stringify({ c: 123, i: 'not-number' })).toString('base64url');
    expect(() => decodeCursor(wrongType)).toThrow('Invalid cursor');
  });

  it('should reject non-integer id', () => {
    const floatId = Buffer.from(JSON.stringify({ c: 'date', i: 1.5 })).toString('base64url');
    expect(() => decodeCursor(floatId)).toThrow('Invalid cursor');
  });
});
