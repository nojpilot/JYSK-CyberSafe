const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

function ensureAnonSession(req, res, next) {
  let sessionId = req.cookies.cybersafe_sid;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('cybersafe_sid', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30
    });
  }

  const existing = db.prepare('SELECT session_id FROM sessions WHERE session_id = ?').get(sessionId);
  if (!existing) {
    db.prepare('INSERT INTO sessions (session_id) VALUES (?)').run(sessionId);
  }
  req.anonSessionId = sessionId;
  next();
}

module.exports = { ensureAnonSession };
