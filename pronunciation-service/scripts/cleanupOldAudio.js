const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const RETENTION_DAYS = 3;

function resolvePath(p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

async function run() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'pronunciation_service_db',
    connectionLimit: 5
  });

  const [rows] = await pool.execute(
    `SELECT id, audioPath
     FROM evaluations
     WHERE audioPath IS NOT NULL
       AND createdAt < (NOW() - INTERVAL ? DAY)`,
    [RETENTION_DAYS]
  );

  const idsToClear = [];

  for (const row of rows) {
    const abs = resolvePath(row.audioPath);
    if (abs && fs.existsSync(abs)) {
      try {
        fs.unlinkSync(abs);
      } catch (_) {
        // ignore individual file errors
      }
    }
    idsToClear.push(row.id);
  }

  if (idsToClear.length > 0) {
    await pool.execute(
      `UPDATE evaluations SET audioPath = NULL WHERE id IN (${idsToClear.map(() => '?').join(',')})`,
      idsToClear
    );
  }

  await pool.end();
  console.log(`Cleanup done. Files removed: ${idsToClear.length}`);
}

run().catch(err => {
  console.error('cleanup failed:', err);
  process.exit(1);
});