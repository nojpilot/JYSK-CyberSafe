const express = require('express');
const { z } = require('zod');
const db = require('../config/db');
const {
  seed,
  getModules,
  recommendationsByTopics,
  getTeamProgress,
  getBadges
} = require('../services/courseService');
const { createCertificate } = require('../services/certificateService');
const { buildProgress, parseGameResults, detailsFromTopics } = require('../services/gameService');

const router = express.Router();

function toWebImagePath(path) {
  if (!path) return path;
  if (path.startsWith('/static/images/')) return path.replace('/static/images/', '/images/');
  if (path.startsWith('/static/badges/')) return path.replace('/static/badges/', '/badges/');
  return path;
}

router.get('/landing', (req, res) => {
  const modules = getModules().map((m) => ({ ...m, image: toWebImagePath(m.image) }));
  const team = getTeamProgress();
  res.json({ course: seed.course, modules, team });
});

router.get('/game/:phase', (req, res) => {
  const modules = getModules();
  const phase = req.params.phase;
  const game = seed.games?.[phase];

  if (!game) return res.status(404).json({ error: 'Game not found' });

  let progress = null;
  if (phase === 'pre') progress = buildProgress(1, modules.length);
  if (phase === 'post') progress = buildProgress(modules.length + 2, modules.length);

  res.json({ game, progress });
});

router.post('/game/:phase', (req, res) => {
  const phase = req.params.phase;
  const results = parseGameResults(req.body);
  if (!results) return res.status(400).json({ error: 'Invalid game results' });

  const details = detailsFromTopics(results.topics);
  const insertAnswer = db.prepare('INSERT INTO answers (session_id, phase, question_key, selected_option, is_correct) VALUES (?, ?, ?, ?, ?)');

  if (phase === 'pre') {
    db.transaction(() => {
      db.prepare('DELETE FROM answers WHERE session_id = ? AND phase = ?').run(req.anonSessionId, 'pre');
      details.forEach((d) => {
        insertAnswer.run(req.anonSessionId, 'pre', d.question.topic_tag, 'A', d.isCorrect ? 1 : 0);
      });
      db.prepare('UPDATE sessions SET pre_score=? WHERE session_id=?').run(results.score, req.anonSessionId);
    })();
    return res.json({ ok: true });
  }

  if (phase === 'post') {
    db.transaction(() => {
      db.prepare('DELETE FROM answers WHERE session_id = ? AND phase = ?').run(req.anonSessionId, 'post');
      details.forEach((d) => {
        insertAnswer.run(req.anonSessionId, 'post', d.question.topic_tag, 'A', d.isCorrect ? 1 : 0);
      });

      const pre = db.prepare('SELECT pre_score FROM sessions WHERE session_id=?').get(req.anonSessionId)?.pre_score || 0;
      db.prepare('UPDATE sessions SET post_score=?, improvement=?, completed_at=CURRENT_TIMESTAMP WHERE session_id=?')
        .run(results.score, results.score - pre, req.anonSessionId);
    })();
    return res.json({ ok: true });
  }

  return res.status(400).json({ error: 'Unsupported phase' });
});

router.get('/modules/:step', (req, res) => {
  const modules = getModules();
  const step = Number(req.params.step);
  if (!step || step < 1 || step > modules.length) return res.status(404).json({ error: 'Not found' });

  const progress = buildProgress(step + 1, modules.length);
  const module = { ...modules[step - 1], image: toWebImagePath(modules[step - 1].image) };
  res.json({ module, step, total: modules.length, progress });
});

router.get('/result', (req, res) => {
  const s = db.prepare('SELECT pre_score, post_score, improvement FROM sessions WHERE session_id=?').get(req.anonSessionId);
  if (!s || s.post_score == null) return res.status(404).json({ error: 'Not completed' });

  const answerRows = db.prepare('SELECT question_key, is_correct FROM answers WHERE session_id=? AND phase="post"').all(req.anonSessionId);
  const details = answerRows.map((a) => ({
    question: { topic_tag: a.question_key },
    isCorrect: a.is_correct === 1
  }));

  const recommendations = recommendationsByTopics(details.filter((d) => !d.isCorrect));
  const badges = getBadges(details).map((b) => ({ ...b, icon: toWebImagePath(b.icon) }));
  const team = getTeamProgress();
  const modules = getModules();
  const progress = { progress: 100, stepIndex: modules.length + 2, totalSteps: modules.length + 2 };

  res.json({ session: s, recommendations, badges, team, progress });
});

router.post('/feedback', (req, res) => {
  const options = {
    q1: ['Velmi užitečný', 'Spíše užitečný', 'Spíše méně', 'Nepřínosný'],
    q2: ['Velmi srozumitelný', 'Spíše srozumitelný', 'Místy nejasný', 'Těžko srozumitelný'],
    q3: ['Velmi reálné', 'Spíše reálné', 'Spíše umělé', 'Nereálné'],
    q4: ['Klikací scénáře', 'Krátké moduly', 'Oboje', 'Nevyhovuje']
  };

  const schema = z.object({
    q1: z.enum(options.q1),
    q2: z.enum(options.q2),
    q3: z.enum(options.q3),
    q4: z.enum(options.q4),
    comment: z.string().max(500).optional().or(z.literal(''))
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid feedback' });

  db.transaction(() => {
    db.prepare('DELETE FROM feedback WHERE session_id=?').run(req.anonSessionId);
    db.prepare('INSERT INTO feedback (session_id, q1, q2, q3, q4, comment) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.anonSessionId, parsed.data.q1, parsed.data.q2, parsed.data.q3, parsed.data.q4, parsed.data.comment || null);
  })();

  return res.json({ ok: true });
});

router.post('/certificate', (req, res) => {
  const schema = z.object({ displayName: z.string().max(40).optional() });
  const parsed = schema.safeParse(req.body);
  const displayName = parsed.success ? parsed.data.displayName : '';
  return createCertificate(res, displayName);
});

router.get('/home-tips', (req, res) => {
  res.json({ tips: seed.course.homeTips || [] });
});

module.exports = router;
