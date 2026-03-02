/*
  Simple SQL migration runner.

  - Reads DB config from ENV (preferred) or from .env (dotenv).
  - Applies migrations from /migrations in filename order.
  - Tracks applied migrations in table schema_migrations.

  Usage:
    node scripts/migrate.js

  ENV:
    ENV_FILE=/path/to/.env   (optional)
*/

const fs = require('fs');
const path = require('path');

// Load env
try {
  const dotenv = require('dotenv');
  const envFile = process.env.ENV_FILE || path.resolve(__dirname, '../.env');
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
} catch {}

const mysql = require('mysql2/promise');

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const host = required('SISPROIND_DB_HOST');
  const port = Number(process.env.SISPROIND_DB_PORT || 3306);
  const user = required('SISPROIND_DB_USER');
  const password = required('SISPROIND_DB_PASS');
  const database = required('SISPROIND_DB_NAME');

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  const migrationsDir = path.resolve(__dirname, '../migrations');
  const files = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    : [];

  const [rows] = await conn.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map(r => r.filename));

  let appliedCount = 0;

  for (const file of files) {
    if (applied.has(file)) continue;

    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf8');

    console.log(`[migrate] applying ${file}`);

    try {
      await conn.beginTransaction();
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      await conn.commit();
      appliedCount++;
    } catch (err) {
      await conn.rollback();
      console.error(`[migrate] FAILED ${file}:`, err.message || err);
      throw err;
    }
  }

  console.log(`[migrate] done. applied=${appliedCount}, total=${files.length}`);
  await conn.end();
}

main().catch((err) => {
  process.exitCode = 1;
});
