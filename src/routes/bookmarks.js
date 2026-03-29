import { Router } from 'express';
import * as bookmarkService from '../services/bookmarkService.js';
import { fetchTitle } from '../services/titleFetcher.js';

const router = Router();

// GET /api/bookmarks - List bookmarks with cursor-based pagination
router.get('/', (req, res) => {
  try {
    const { search, tag, favorite, cursor, page_size } = req.query;

    if (page_size !== undefined) {
      const n = Number(page_size);
      if (!Number.isInteger(n) || n < 1) {
        return res.status(400).json({ error: 'Invalid page size: must be a positive integer' });
      }
    }

    const result = bookmarkService.getPaginated({
      search,
      tag,
      favorite: favorite === 'true',
      cursor: cursor || null,
      pageSize: page_size !== undefined ? Number(page_size) : undefined,
    });
    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid cursor') {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookmarks/fetch-title - Auto-fetch page title
router.get('/fetch-title', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const title = await fetchTitle(url);
  res.json({ title });
});

// GET /api/bookmarks/:id - Get single bookmark
router.get('/:id', (req, res) => {
  try {
    const bookmark = bookmarkService.getById(Number(req.params.id));
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.json({ bookmark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookmarks - Create bookmark
router.post('/', (req, res) => {
  try {
    const { url, title, description, tags } = req.body;
    const bookmark = bookmarkService.create({ url, title, description, tags });
    res.status(201).json({ bookmark });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// PUT /api/bookmarks/:id - Update bookmark
router.put('/:id', (req, res) => {
  try {
    const { url, title, description, tags } = req.body;
    const bookmark = bookmarkService.update(Number(req.params.id), { url, title, description, tags });
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.json({ bookmark });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/bookmarks/:id - Delete bookmark
router.delete('/:id', (req, res) => {
  try {
    const deleted = bookmarkService.remove(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookmarks/:id/favorite - Toggle favorite
router.patch('/:id/favorite', (req, res) => {
  try {
    const result = bookmarkService.toggleFavorite(Number(req.params.id));
    if (!result) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.json({ bookmark: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
