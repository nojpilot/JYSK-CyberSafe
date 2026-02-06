const db = require('../config/db');

function requireAdmin(req, res, next) {
  if (process.env.DEMO_MODE === 'true') {
    req.admin = { username: 'demo' };
    return next();
  }

  const token = req.cookies.admin_session;
  if (!token) return res.redirect('/admin/login');

  const admin = db.prepare('SELECT username FROM admins WHERE username = ?').get(token);
  if (!admin) {
    res.clearCookie('admin_session');
    return res.redirect('/admin/login');
  }

  req.admin = admin;
  next();
}

module.exports = { requireAdmin };
