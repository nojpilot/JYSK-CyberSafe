const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const seedPath = path.join(__dirname, '../data/seed-content.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const upsertModule = db.prepare(`
INSERT INTO modules (slug, title, story, correct_action, tip1, tip2, sort_order, updated_at)
VALUES (@slug, @title, @story, @correctAction, @tip1, @tip2, @sort_order, CURRENT_TIMESTAMP)
ON CONFLICT(slug) DO UPDATE SET
title=excluded.title,
story=excluded.story,
correct_action=excluded.correct_action,
tip1=excluded.tip1,
tip2=excluded.tip2,
sort_order=excluded.sort_order,
updated_at=CURRENT_TIMESTAMP
`);

const upsertQuestion = db.prepare(`
INSERT INTO questions (category, key, question_text, option_a, option_b, option_c, correct_option, explanation, topic_tag, sort_order, updated_at)
VALUES (@category, @key, @question_text, @option_a, @option_b, @option_c, @correct_option, @explanation, @topic_tag, @sort_order, CURRENT_TIMESTAMP)
ON CONFLICT(category,key) DO UPDATE SET
question_text=excluded.question_text,
option_a=excluded.option_a,
option_b=excluded.option_b,
option_c=excluded.option_c,
correct_option=excluded.correct_option,
explanation=excluded.explanation,
topic_tag=excluded.topic_tag,
sort_order=excluded.sort_order,
updated_at=CURRENT_TIMESTAMP
`);

db.transaction(() => {
  seed.modules.forEach((m, i) => upsertModule.run({ ...m, sort_order: i + 1 }));
  seed.questions.forEach((q) => upsertQuestion.run(q));
})();

console.log('Seed completed.');
