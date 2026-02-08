const { seedDb } = require('../services/seedDb');

const r = seedDb({ mode: 'force' });
console.log(r.seeded ? `Seed completed. (modules: ${r.modules}, questions: ${r.questions})` : 'Seed skipped.');
