const db = require('../config/db');

function requireAdmin(req, res, next) {
  if (process.env.DEMO_MODE === 'true') {
    req.admin = { username: 'demo' };
    return next();
  }

  const token = req.cookies.admin_session;
  if (!token) return res.redirect('/admin/login');

  // Opportunistic cleanup to keep the table small.
  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP').run();

  const admin = db
    .prepare('SELECT username FROM admin_sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP')
    .get(token);
  if (!admin) {
    res.clearCookie('admin_session', { path: '/admin' });
    return res.redirect('/admin/login');
  }

  req.admin = admin;
  next();
}

module.exports = { requireAdmin };
