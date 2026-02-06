const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/seed-content.json'), 'utf8'));

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
    phishing: 'Procvič modul „Phishing e-mail“. Zaměř se na kontrolu domény a nátlak v textu.',
    vishing: 'Procvič modul „Vishing“. Nikdy nesděluj hesla ani SMS kódy po telefonu.',
    usb: 'Procvič modul „USB zařízení“. Neznámé USB nepřipojuj a hned hlaste incident.',
    shared_pc: 'Procvič modul „Sdílený počítač“. Zamykat obrazovku při každém odchodu.',
    passwords: 'Posil hesla: dlouhá věta + jedinečné heslo pro každý účet.',
    privacy: 'Ochrana soukromí zákazníků: méně sdílet, nemluvit nahlas, nepoužívat soukromý mobil.',
    mobile: 'Bezpečný mobil: aktualizace + 2FA + opatrnost u odkazů.'
  };

  const uniq = [...new Set(wrongDetails.map((d) => d.question.topic_tag))];
  return uniq.map((t) => map[t]).filter(Boolean);
}

module.exports = {
  seed,
  getModules,
  getQuestions,
  scoreAnswers,
  recommendationsByTopics
};
