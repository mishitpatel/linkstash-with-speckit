import config from './config.js';
import { initDatabase } from './db/database.js';
import app from './app.js';

initDatabase();

app.listen(config.port, () => {
  console.log(`LinkStash running at http://localhost:${config.port}`);
});
