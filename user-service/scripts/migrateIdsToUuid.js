const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const database = process.env.DB_DATABASE || 'user_service_db';

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
  try {
    // Check presence of numeric ids
    const [rows] = await conn.query("SELECT COUNT(*) as cnt FROM users WHERE user_id REGEXP '^[0-9]+$'");
    const count = rows[0].cnt || 0;
    if (!count) {
      console.log('No numeric user_id values found. Nothing to migrate.');
      return;
    }

    const sql = fs.readFileSync(path.resolve(__dirname, '..', 'migrations', 'migrate_int_ids_to_uuid.sql'), 'utf8');
    console.log('Applying migration script...');
    await conn.query(sql);
    console.log('Migration applied. Please verify tables and drop backups (users_bak, etc.) manually when ready.');
  } finally {
    await conn.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
