const db = require('../config/db');

try {
  const moduleCount = db.prepare('SELECT COUNT(*) as c FROM modules').get().c;
  console.log(`Modules: ${moduleCount}`);
  if (moduleCount < 5) {
    throw new Error('Seed content missing');
  }
  console.log('Smoke test OK');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
