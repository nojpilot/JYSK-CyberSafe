const db = require('../config/db');
const { getSeed } = require('./seedContent');

function seedDb({ mode = 'force' } = {}) {
  const seed = getSeed();
  const modules = Array.isArray(seed.modules) ? seed.modules : [];
  const questions = Array.isArray(seed.questions) ? seed.questions : [];

  const moduleCount = db.prepare('SELECT COUNT(*) as c FROM modules').get().c || 0;
  const questionCount = db.prepare('SELECT COUNT(*) as c FROM questions').get().c || 0;

  const wantModules = mode === 'force' || moduleCount === 0;
  const wantQuestions = mode === 'force' || questionCount === 0;

  if (!wantModules && !wantQuestions) {
    return { seeded: false, modules: 0, questions: 0 };
  }

  const upsertModule = db.prepare(`
INSERT INTO modules (slug, title, story, correct_action, tip1, tip2, image, sort_order, updated_at)
VALUES (@slug, @title, @story, @correctAction, @tip1, @tip2, @image, @sort_order, CURRENT_TIMESTAMP)
ON CONFLICT(slug) DO UPDATE SET
  title=excluded.title,
  story=excluded.story,
  correct_action=excluded.correct_action,
  tip1=excluded.tip1,
  tip2=excluded.tip2,
  image=excluded.image,
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

  const toInsertModules = wantModules ? modules.length : 0;
  const toInsertQuestions = wantQuestions ? questions.length : 0;

  db.transaction(() => {
    if (wantModules) modules.forEach((m, i) => upsertModule.run({ ...m, sort_order: i + 1 }));
    if (wantQuestions) questions.forEach((q) => upsertQuestion.run(q));
  })();

  return { seeded: true, modules: toInsertModules, questions: toInsertQuestions };
}

module.exports = { seedDb };

