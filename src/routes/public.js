const express = require('express');
const { z } = require('zod');
const db = require('../config/db');
const { seed, getModules, getQuestions, scoreAnswers, recommendationsByTopics } = require('../services/courseService');
const { createCertificate } = require('../services/certificateService');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('public/landing', { course: seed.course });
});

router.get('/pre-test', (req, res) => {
  res.render('public/test', { title: 'Pre-test', phase: 'pre', questions: getQuestions('pre') });
});

router.post('/pre-test', (req, res) => {
  const { score, details } = scoreAnswers('pre', req.body);
  const insertAnswer = db.prepare('INSERT INTO answers (session_id, phase, question_key, selected_option, is_correct) VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => {
    db.prepare('DELETE FROM answers WHERE session_id = ? AND phase = ?').run(req.anonSessionId, 'pre');
    details.forEach((d) => {
      insertAnswer.run(req.anonSessionId, 'pre', d.question.key, d.selected || 'A', d.isCorrect ? 1 : 0);
    });
    db.prepare('UPDATE sessions SET pre_score=? WHERE session_id=?').run(score, req.anonSessionId);
  })();

  res.redirect('/kurz/1');
});

router.get('/kurz/:step', (req, res) => {
  const modules = getModules();
  const step = Number(req.params.step);
  if (step < 1 || step > modules.length) return res.redirect('/post-test');
  res.render('public/module', { module: modules[step - 1], step, total: modules.length });
});

router.get('/post-test', (req, res) => {
  res.render('public/test', { title: 'Post-test', phase: 'post', questions: getQuestions('post') });
});

router.post('/post-test', (req, res) => {
  const { score, details, max } = scoreAnswers('post', req.body);
  const insertAnswer = db.prepare('INSERT INTO answers (session_id, phase, question_key, selected_option, is_correct) VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => {
    db.prepare('DELETE FROM answers WHERE session_id = ? AND phase = ?').run(req.anonSessionId, 'post');
    details.forEach((d) => {
      insertAnswer.run(req.anonSessionId, 'post', d.question.key, d.selected || 'A', d.isCorrect ? 1 : 0);
    });

    const pre = db.prepare('SELECT pre_score FROM sessions WHERE session_id=?').get(req.anonSessionId)?.pre_score || 0;
    db.prepare('UPDATE sessions SET post_score=?, improvement=?, completed_at=CURRENT_TIMESTAMP WHERE session_id=?')
      .run(score, score - pre, req.anonSessionId);
  })();

  req.app.locals.lastResult = { score, max, details };
  res.redirect('/vysledek');
});

router.get('/vysledek', (req, res) => {
  const s = db.prepare('SELECT pre_score, post_score, improvement FROM sessions WHERE session_id=?').get(req.anonSessionId);
  if (!s || s.post_score == null) return res.redirect('/post-test');

  const postQuestions = getQuestions('post');
  const answerRows = db.prepare('SELECT question_key, selected_option, is_correct FROM answers WHERE session_id=? AND phase="post"').all(req.anonSessionId);
  const details = answerRows.map((a) => {
    const question = postQuestions.find((q) => q.key === a.question_key);
    return { question, selected: a.selected_option, isCorrect: a.is_correct === 1 };
  });

  const recommendations = recommendationsByTopics(details.filter((d) => !d.isCorrect));
  res.render('public/result', { session: s, recommendations });
});

router.get('/certifikat', (req, res) => {
  res.render('public/certificate-form');
});

router.post('/certifikat', (req, res) => {
  const schema = z.object({ displayName: z.string().max(40).optional() });
  const parsed = schema.safeParse(req.body);
  const displayName = parsed.success ? parsed.data.displayName : '';
  return createCertificate(res, displayName);
});

router.get('/bezpecne-i-doma', (req, res) => {
  res.render('public/home-safe', { tips: seed.course.homeTips });
});

module.exports = router;
