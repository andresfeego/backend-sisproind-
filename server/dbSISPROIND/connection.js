const mysql = require('mysql2');

// SISPROIND DB connection (MariaDB/MySQL)
// Expected env vars:
// - SISPROIND_DB_HOST (default 127.0.0.1)
// - SISPROIND_DB_PORT (default 3306)
// - SISPROIND_DB_USER
// - SISPROIND_DB_PASS
// - SISPROIND_DB_NAME

const pool = mysql.createPool({
  host: process.env.SISPROIND_DB_HOST || '127.0.0.1',
  port: Number(process.env.SISPROIND_DB_PORT || 3306),
  user: process.env.SISPROIND_DB_USER,
  password: process.env.SISPROIND_DB_PASS,
  database: process.env.SISPROIND_DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.SISPROIND_DB_POOL || 10),
  queueLimit: 0,
  charset: 'utf8mb4',
});

module.exports = pool;
