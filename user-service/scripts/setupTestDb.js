const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function run() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const migrationPath = path.resolve(__dirname, '..', 'migrations', 'create_tables.sql');

  const sql = fs.readFileSync(migrationPath, 'utf8');

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  try {
    await conn.query(sql);
    console.log('Test DB migrated');
  } finally {
    await conn.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
