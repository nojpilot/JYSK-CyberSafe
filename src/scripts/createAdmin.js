const argon2 = require('argon2');
const db = require('../config/db');

async function run() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Usage: npm run create-admin -- <username> <password>');
    process.exit(1);
  }

  const hash = await argon2.hash(password);
  const stmt = db.prepare(`
    INSERT INTO admins (username, password_hash)
    VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash
  `);
  stmt.run(username, hash);
  console.log(`Admin user ${username} created/updated.`);
}

run();
