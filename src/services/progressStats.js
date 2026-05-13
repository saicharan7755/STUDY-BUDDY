const STORAGE_PREFIX = 'study-progress-';
const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dayDiff = (currentKey, previousKey) => {
  if (!previousKey) return null;
  const [y1, m1, d1] = currentKey.split('-').map(Number);
  const [y2, m2, d2] = previousKey.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1).getTime();
  const date2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((date1 - date2) / DAY_MS);
};

const createDefaultStats = () => ({
  version: 1,
  sessions: {
    total: 0,
    startedSessionIds: [],
  },
  flashcards: {
    correct: 0,
    attempted: 0,
  },
  topics: {},
  dailyCounts: {},
  currentStreak: 0,
  lastStudyDate: null,
});

const getStorageKey = (uid) => `${STORAGE_PREFIX}${uid}`;

const parseStored = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to parse progress stats from storage', e);
    return null;
  }
};

const dispatchProgressUpdate = (uid) => {
  window.dispatchEvent(new CustomEvent('study-progress-updated', { detail: { uid } }));
};

export const loadStudyProgress = (uid) => {
  if (!uid || typeof window === 'undefined') return createDefaultStats();
  const raw = window.localStorage.getItem(getStorageKey(uid));
  const stored = parseStored(raw);
  if (!stored || typeof stored !== 'object') return createDefaultStats();
  return {
    ...createDefaultStats(),
    ...stored,
    sessions: {
      ...createDefaultStats().sessions,
      ...(stored.sessions || {}),
    },
    flashcards: {
      ...createDefaultStats().flashcards,
      ...(stored.flashcards || {}),
    },
    topics: { ...(stored.topics || {}) },
    dailyCounts: { ...(stored.dailyCounts || {}) },
    currentStreak: Number(stored.currentStreak) || 0,
    lastStudyDate: stored.lastStudyDate || null,
  };
};

export const saveStudyProgress = (uid, stats) => {
  if (!uid || typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(uid), JSON.stringify(stats));
  dispatchProgressUpdate(uid);
};

export const getStudyProgressKey = (uid) => getStorageKey(uid);

const updateStreak = (stats, todayKey) => {
  const previousDateKey = stats.lastStudyDate;
  const diff = dayDiff(todayKey, previousDateKey);

  if (previousDateKey === todayKey || diff === 0) {
    stats.currentStreak = Math.max(stats.currentStreak, 1);
  } else if (diff === 1) {
    stats.currentStreak = Math.max(stats.currentStreak, 0) + 1;
  } else {
    stats.currentStreak = 1;
  }

  stats.lastStudyDate = todayKey;
};

const recordLocalActivity = (stats) => {
  const todayKey = toDateKey();
  stats.dailyCounts[todayKey] = (Number(stats.dailyCounts[todayKey]) || 0) + 0;
  updateStreak(stats, todayKey);
  return stats;
};

export const recordStudySessionStart = (uid, sessionId) => {
  if (!uid || !sessionId) return null;
  const stats = loadStudyProgress(uid);
  if (!stats.sessions.startedSessionIds.includes(sessionId)) {
    stats.sessions.startedSessionIds.push(sessionId);
    stats.sessions.total += 1;
  }
  recordLocalActivity(stats);
  saveStudyProgress(uid, stats);
  return stats;
};

export const recordFlashcardResult = (uid, topicTitle, isCorrect) => {
  if (!uid) return null;
  const stats = loadStudyProgress(uid);
  const todayKey = toDateKey();
  const topicKey = topicTitle?.trim() || 'General';

  stats.flashcards.attempted += 1;
  if (isCorrect) stats.flashcards.correct += 1;

  stats.dailyCounts[todayKey] = (Number(stats.dailyCounts[todayKey]) || 0) + 1;

  const topic = stats.topics[topicKey] || { studied: 0, correct: 0, lastStudied: null };
  topic.studied += 1;
  if (isCorrect) topic.correct += 1;
  topic.lastStudied = todayKey;
  stats.topics[topicKey] = topic;

  updateStreak(stats, todayKey);
  saveStudyProgress(uid, stats);
  return stats;
};

export const buildLast7DaysSeries = (dailyCounts = {}) => {
  const points = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * DAY_MS);
    const key = toDateKey(date);
    points.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      count: Number(dailyCounts[key]) || 0,
    });
  }
  return points;
};

export const getTodayStudyCount = (stats) => {
  const todayKey = toDateKey();
  return Number(stats.dailyCounts[todayKey]) || 0;
};

export const getOverallAccuracy = (stats) => {
  if (!stats.flashcards.attempted) return 0;
  return Math.round((stats.flashcards.correct / stats.flashcards.attempted) * 100);
};

export const getTopicList = (stats) =>
  Object.entries(stats.topics)
    .map(([topic, data]) => ({
      topic,
      studied: data.studied,
      correct: data.correct,
      accuracy: data.studied ? Math.round((data.correct / data.studied) * 100) : 0,
      lastStudied: data.lastStudied,
    }))
    .sort((a, b) => b.studied - a.studied);
