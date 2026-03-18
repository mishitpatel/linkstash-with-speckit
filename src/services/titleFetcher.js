import config from '../config.js';

export async function fetchTitle(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(config.fetchTimeout),
      headers: {
        'User-Agent': 'LinkStash/1.0',
      },
    });
    const html = await response.text();
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}
