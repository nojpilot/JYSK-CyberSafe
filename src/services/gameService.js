function buildProgress(stepIndex, totalModules) {
  const totalSteps = totalModules + 2;
  const progress = Math.round(((stepIndex - 1) / totalSteps) * 100);
  return { progress, stepIndex, totalSteps };
}

function parseGameResults(raw) {
  if (!raw) return null;
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    return null;
  }

  const topics = parsed && typeof parsed.topics === 'object' && parsed.topics ? parsed.topics : {};
  const normalizedTopics = {};
  let score = 0;
  let max = 0;

  Object.keys(topics).forEach((tag) => {
    const item = topics[tag] || {};
    const found = Math.max(0, Number(item.found) || 0);
    const total = Math.max(0, Number(item.total) || 0);
    normalizedTopics[tag] = { found, total };
    score += found;
    max += total;
  });

  if (!max) {
    const fallbackScore = Math.max(0, Number(parsed.score) || 0);
    const fallbackMax = Math.max(0, Number(parsed.max) || 0);
    score = fallbackScore;
    max = fallbackMax || fallbackScore;
  }

  return {
    score,
    max,
    miss: Math.max(0, Number(parsed.miss) || 0),
    topics: normalizedTopics
  };
}

function detailsFromTopics(topics) {
  return Object.entries(topics)
    .filter(([, v]) => v && v.total > 0)
    .map(([tag, v]) => ({
      question: { topic_tag: tag },
      isCorrect: v.found >= v.total
    }));
}

module.exports = {
  buildProgress,
  parseGameResults,
  detailsFromTopics
};
