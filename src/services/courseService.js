const db = require('../config/db');
const { getSeed } = require('./seedContent');

const seed = getSeed();

function getModules() {
  return db.prepare('SELECT * FROM modules ORDER BY sort_order ASC').all();
}

function getQuestions(category) {
  return db.prepare('SELECT * FROM questions WHERE category=? ORDER BY sort_order ASC').all(category);
}

function scoreAnswers(category, answers) {
  const questions = getQuestions(category);
  let score = 0;
  const details = [];

  questions.forEach((q) => {
    const selected = answers[q.key];
    const isCorrect = selected === q.correct_option;
    if (isCorrect) score += 1;
    details.push({ question: q, selected, isCorrect });
  });

  return { score, max: questions.length, details };
}

function recommendationsByTopics(wrongDetails) {
  const map = {
    phishing: 'Procvič modul „Phishing e‑mail o StoreFront“. Kontroluj doménu a nenech se tlačit na čas.',
    vishing: 'Procvič modul „Vishing“. Nikdy nesděluj hesla ani SMS kódy po telefonu.',
    usb: 'Procvič modul „Neznámé USB nebo QR“. USB/QR neotvírej a nahlas vedoucímu.',
    shared_pc: 'Procvič modul „Sdílený BO a pokladna“. Zamykat obrazovku při každém odchodu.',
    passwords: 'Posil hesla: dlouhá věta a jedinečné heslo pro každý účet.',
    privacy: 'Ochrana zákaznických údajů: sdílet minimum, nemluvit nahlas, nic neposílat do chatu.',
    mobile: 'Bezpečný mobil/WhatsApp: neinstalovat z odkazů, kódy nikdy nesdělovat.'
  };

  const uniq = [...new Set(wrongDetails.map((d) => d.question.topic_tag))];
  return uniq.map((t) => map[t]).filter(Boolean);
}

function getTeamProgress() {
  const summary = db.prepare(`
    SELECT COUNT(*) as sessions,
      SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed,
      ROUND(AVG(CASE WHEN improvement IS NOT NULL THEN improvement END), 2) as avg_improvement
    FROM sessions
  `).get();

  const sessions = summary.sessions || 0;
  const completed = summary.completed || 0;
  const avgImprovement = Math.max(0, summary.avg_improvement || 0);
  const completionRate = sessions ? completed / sessions : 0;
  const improvementScore = Math.min(avgImprovement, 3) / 3;
  const shieldScore = Math.round((completionRate * 0.6 + improvementScore * 0.4) * 100);

  let level = 1;
  if (completionRate >= 0.7 && avgImprovement >= 2.5) level = 5;
  else if (completionRate >= 0.55 && avgImprovement >= 2) level = 4;
  else if (completionRate >= 0.4 && avgImprovement >= 1.5) level = 3;
  else if (completionRate >= 0.25 && avgImprovement >= 1) level = 2;

  const levelLabels = {
    1: 'Rozjezd směny',
    2: 'Základy drží',
    3: 'Stabilní štít',
    4: 'Pevná obrana',
    5: 'Neprůstřelná směna'
  };

  return {
    sessions,
    completed,
    avgImprovement,
    completionRate,
    shieldScore,
    level,
    levelLabel: levelLabels[level]
  };
}

const badgeMap = {
  phishing: {
    title: 'Lovec phishingu',
    description: 'Poznáš podezřelé maily i v rušném ránu.',
    icon: '/static/badges/badge-phishing.svg'
  },
  vishing: {
    title: 'Stop telefonním podvodům',
    description: 'Nikomu nedáš kód ani vteřinu.',
    icon: '/static/badges/badge-vishing.svg'
  },
  usb: {
    title: 'USB ninža',
    description: 'Neznámý disk? Neexistuje.',
    icon: '/static/badges/badge-usb.svg'
  },
  shared_pc: {
    title: 'Strážce obrazovky',
    description: 'Zamykáš vždy a bez řečí.',
    icon: '/static/badges/badge-shared.svg'
  },
  privacy: {
    title: 'Ochránce údajů',
    description: 'Citlivé věci zůstávají v bezpečí.',
    icon: '/static/badges/badge-privacy.svg'
  },
  mobile: {
    title: 'Mobil v bezpečí',
    description: 'Aktualizace + 2FA = klid.',
    icon: '/static/badges/badge-mobile.svg'
  }
};

function getBadges(details) {
  const byTopic = new Map();
  details.forEach((d) => {
    const tag = d.question?.topic_tag;
    if (!tag) return;
    if (!byTopic.has(tag)) byTopic.set(tag, true);
    byTopic.set(tag, byTopic.get(tag) && d.isCorrect);
  });

  const badges = [];
  byTopic.forEach((ok, tag) => {
    if (ok && badgeMap[tag]) badges.push({ tag, ...badgeMap[tag] });
  });

  const flawless = details.length > 0 && details.every((d) => d.isCorrect);
  if (flawless) {
    badges.unshift({
      tag: 'flawless',
      title: 'Perfektní směna',
      description: 'Žádná chyba. To je level.',
      icon: '/static/badges/badge-perfect.svg'
    });
  }

  return badges;
}

module.exports = {
  seed,
  getModules,
  getQuestions,
  scoreAnswers,
  recommendationsByTopics,
  getTeamProgress,
  getBadges
};
