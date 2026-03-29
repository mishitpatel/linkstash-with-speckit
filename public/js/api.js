const BASE = '/api';

async function request(method, path, body) {
  const options = {
    method,
    headers: {},
  };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, options);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function getBookmarks(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.tag) query.set('tag', params.tag);
  if (params.favorite) query.set('favorite', 'true');
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.page_size) query.set('page_size', String(params.page_size));
  const qs = query.toString();
  return request('GET', `/bookmarks${qs ? '?' + qs : ''}`);
}

export function getBookmark(id) {
  return request('GET', `/bookmarks/${id}`);
}

export function createBookmark(data) {
  return request('POST', '/bookmarks', data);
}

export function updateBookmark(id, data) {
  return request('PUT', `/bookmarks/${id}`, data);
}

export function deleteBookmark(id) {
  return request('DELETE', `/bookmarks/${id}`);
}

export function toggleFavorite(id) {
  return request('PATCH', `/bookmarks/${id}/favorite`);
}

export function fetchTitle(url) {
  return request('GET', `/bookmarks/fetch-title?url=${encodeURIComponent(url)}`);
}

export function getTags() {
  return request('GET', '/tags');
}
