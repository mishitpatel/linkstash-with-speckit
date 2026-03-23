import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('titleFetcher', () => {
  let fetchTitle;

  beforeEach(async () => {
    vi.restoreAllMocks();
    // Re-import to get fresh module
    const mod = await import('../../src/services/titleFetcher.js');
    fetchTitle = mod.fetchTitle;
  });

  it('should extract title from HTML response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve('<html><head><title>Hello World</title></head></html>'),
    }));

    const title = await fetchTitle('https://example.com');
    expect(title).toBe('Hello World');
  });

  it('should return null when no title tag found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve('<html><body>No title here</body></html>'),
    }));

    const title = await fetchTitle('https://example.com');
    expect(title).toBeNull();
  });

  it('should return null on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const title = await fetchTitle('https://example.com');
    expect(title).toBeNull();
  });

  it('should handle title with whitespace', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      text: () => Promise.resolve('<title>  Spaced Title  </title>'),
    }));

    const title = await fetchTitle('https://example.com');
    expect(title).toBe('Spaced Title');
  });
});
