const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');

require('./scripts/migrate');

const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const { ensureAnonSession } = require('./middleware/session');

const app = express();
const port = process.env.PORT || 3000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      styleSrc: ["'self'"],
      styleSrcAttr: ["'unsafe-inline'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"]
    }
  },
  hsts: process.env.NODE_ENV === 'production' ? undefined : false
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));

const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

app.use(publicLimiter);
app.use(ensureAnonSession);

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api', apiRoutes);

const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' } });
app.use('/admin', adminLimiter, csrfProtection, (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
}, adminRoutes);

app.use((req, res) => {
  res.status(404).send('Not found');
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') return res.status(403).send('Neplatný CSRF token.');
  console.error(err);
  res.status(500).send('Server error');
});

app.listen(port, () => {
  console.log(`JYSK CyberSafe running on ${port}`);
});
