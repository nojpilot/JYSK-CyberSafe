const db = require('../config/db');
const { seedDb } = require('../services/seedDb');

const keepAdmins = process.env.KEEP_ADMINS !== '0';

try {
  db.exec(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    q1 TEXT NOT NULL,
    q2 TEXT NOT NULL,
    q3 TEXT NOT NULL,
    q4 TEXT NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
  );`);

  db.transaction(() => {
    db.prepare('DELETE FROM answers').run();
    db.prepare('DELETE FROM feedback').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM audit_logs').run();
    db.prepare('DELETE FROM admin_sessions').run();
    db.prepare('DELETE FROM questions').run();
    db.prepare('DELETE FROM modules').run();
    if (!keepAdmins) db.prepare('DELETE FROM admins').run();
  })();

  const r = seedDb({ mode: 'force' });
  db.exec('VACUUM');

  console.log(`Reset completed. Modules: ${r.modules}, Questions: ${r.questions}, Keep admins: ${keepAdmins}`);
} catch (err) {
  if (err.code === 'SQLITE_READONLY') {
    console.error('Database is read-only. If the file was created by Docker, fix ownership:');
    console.error('  sudo chown -R $(id -un):$(id -gn) data');
    console.error('Or run the reset inside the container:');
    console.error('  docker compose exec app node src/scripts/resetDb.js');
  }
  console.error(err);
  process.exit(1);
}
