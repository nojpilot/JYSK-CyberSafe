const express = require('express');
const argon2 = require('argon2');
const { z } = require('zod');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

function logAction(user, action, detail) {
  db.prepare('INSERT INTO audit_logs (admin_username, action, detail) VALUES (?, ?, ?)').run(user, action, detail);
}

router.get('/login', (req, res) => {
  res.render('admin/login', { error: null, demoMode: process.env.DEMO_MODE === 'true' });
});

router.post('/login', async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.redirect('/admin');

  const schema = z.object({ username: z.string().min(3), password: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.render('admin/login', { error: 'Neplatné přihlášení.', demoMode: false });

  const admin = db.prepare('SELECT * FROM admins WHERE username=?').get(parsed.data.username);
  if (!admin) return res.render('admin/login', { error: 'Neplatné přihlašovací údaje.', demoMode: false });
  const ok = await argon2.verify(admin.password_hash, parsed.data.password);
  if (!ok) return res.render('admin/login', { error: 'Neplatné přihlašovací údaje.', demoMode: false });

  res.cookie('admin_session', admin.username, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  });
  logAction(admin.username, 'login', 'Admin logged in');
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  if (req.admin) logAction(req.admin.username, 'logout', 'Admin logged out');
  res.clearCookie('admin_session');
  res.redirect('/admin/login');
});

router.use(requireAdmin);

router.get('/', (req, res) => {
  const summary = db.prepare(`
    SELECT COUNT(*) as sessions,
      SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed,
      ROUND(AVG(CASE WHEN improvement IS NOT NULL THEN improvement END), 2) as avg_improvement
    FROM sessions
  `).get();

  const topWrong = db.prepare(`
    SELECT question_key, COUNT(*) as mistakes
    FROM answers
    WHERE phase='post' AND is_correct=0
    GROUP BY question_key
    ORDER BY mistakes DESC
    LIMIT 5
  `).all();

  const recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10').all();

  res.render('admin/dashboard', { summary, topWrong, recentLogs, demoMode: process.env.DEMO_MODE === 'true' });
});

router.get('/questions', (req, res) => {
  const questions = db.prepare('SELECT * FROM questions ORDER BY category, sort_order').all();
  res.render('admin/questions', { questions, demoMode: process.env.DEMO_MODE === 'true' });
});

router.post('/questions', (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.status(403).send('DEMO režim: pouze čtení');
  const schema = z.object({
    category: z.enum(['pre', 'post']),
    key: z.string().min(1),
    question_text: z.string().min(5),
    option_a: z.string().min(1),
    option_b: z.string().min(1),
    option_c: z.string().min(1),
    correct_option: z.enum(['A', 'B', 'C']),
    explanation: z.string().min(2),
    topic_tag: z.string().min(2),
    sort_order: z.coerce.number().int().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).send('Neplatná data otázky.');
  db.prepare(`
    INSERT INTO questions (category,key,question_text,option_a,option_b,option_c,correct_option,explanation,topic_tag,sort_order)
    VALUES (@category,@key,@question_text,@option_a,@option_b,@option_c,@correct_option,@explanation,@topic_tag,@sort_order)
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
  `).run(parsed.data);

  logAction(req.admin.username, 'question_upsert', `${parsed.data.category}:${parsed.data.key}`);
  res.redirect('/admin/questions');
});

router.post('/questions/:id/delete', (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.status(403).send('DEMO režim: pouze čtení');
  db.prepare('DELETE FROM questions WHERE id=?').run(req.params.id);
  logAction(req.admin.username, 'question_delete', `id:${req.params.id}`);
  res.redirect('/admin/questions');
});

router.get('/modules', (req, res) => {
  const modules = db.prepare('SELECT * FROM modules ORDER BY sort_order').all();
  res.render('admin/modules', { modules, demoMode: process.env.DEMO_MODE === 'true' });
});

router.post('/modules', (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.status(403).send('DEMO režim: pouze čtení');
  const schema = z.object({
    slug: z.string().min(2),
    title: z.string().min(3),
    story: z.string().min(10),
    correct_action: z.string().min(5),
    tip1: z.string().min(5),
    tip2: z.string().min(5),
    sort_order: z.coerce.number().int().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).send('Neplatná data modulu.');
  db.prepare(`
    INSERT INTO modules (slug,title,story,correct_action,tip1,tip2,sort_order)
    VALUES (@slug,@title,@story,@correct_action,@tip1,@tip2,@sort_order)
    ON CONFLICT(slug) DO UPDATE SET
      title=excluded.title,
      story=excluded.story,
      correct_action=excluded.correct_action,
      tip1=excluded.tip1,
      tip2=excluded.tip2,
      sort_order=excluded.sort_order,
      updated_at=CURRENT_TIMESTAMP
  `).run(parsed.data);
  logAction(req.admin.username, 'module_upsert', parsed.data.slug);
  res.redirect('/admin/modules');
});

router.post('/modules/:id/delete', (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.status(403).send('DEMO režim: pouze čtení');
  db.prepare('DELETE FROM modules WHERE id=?').run(req.params.id);
  logAction(req.admin.username, 'module_delete', `id:${req.params.id}`);
  res.redirect('/admin/modules');
});

router.get('/stats.csv', (req, res) => {
  const rows = db.prepare('SELECT created_at, pre_score, post_score, improvement, completed_at FROM sessions ORDER BY id DESC').all();
  const csv = ['created_at,pre_score,post_score,improvement,completed_at'];
  rows.forEach((r) => csv.push(`${r.created_at},${r.pre_score ?? ''},${r.post_score ?? ''},${r.improvement ?? ''},${r.completed_at ?? ''}`));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cybersafe-statistiky.csv"');
  res.send(csv.join('\n'));
});

module.exports = router;
