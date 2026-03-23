import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import bookmarkRoutes from './routes/bookmarks.js';
import tagRoutes from './routes/tags.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/tags', tagRoutes);

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
