import { Router } from 'express';
import * as tagService from '../services/tagService.js';

const router = Router();

// GET /api/tags - List all tags with bookmark counts
router.get('/', (_req, res) => {
  try {
    const tags = tagService.getAllWithCounts();
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
