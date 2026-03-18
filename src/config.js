const config = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || 'data/linkstash.db',
  fetchTimeout: 5000,
};

export default config;
