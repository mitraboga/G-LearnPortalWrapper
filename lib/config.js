const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "zsxdc3ROUTE66!",
  database: process.env.DB_NAME || "studentdb",
};

const sessionConfig = {
  cookieName: process.env.SESSION_COOKIE_NAME || "portal_session",
  ttlMs: Number(process.env.SESSION_TTL_MS) || 8 * 60 * 60 * 1000,
};

module.exports = {
  dbConfig,
  sessionConfig,
};
