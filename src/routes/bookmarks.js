import { Router } from 'express';
import * as bookmarkService from '../services/bookmarkService.js';
import { fetchTitle } from '../services/titleFetcher.js';

const router = Router();

// GET /api/bookmarks - List all bookmarks with optional filters
router.get('/', (req, res) => {
  try {
    const { search, tag, favorite } = req.query;
    const bookmarks = bookmarkService.getAll({
      search,
      tag,
      favorite: favorite === 'true',
    });
    res.json({ bookmarks });
  } catch (err) {
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
