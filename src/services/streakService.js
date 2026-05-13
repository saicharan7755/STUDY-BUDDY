import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dayDiff = (a, b) => {
  const first = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const second = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((second - first) / DAY_MS);
};

export const recordStudyActivity = async (uid) => {
  const userRef = doc(db, `users/${uid}`);
  const snapshot = await getDoc(userRef);
  const current = snapshot.exists() ? snapshot.data() : {};

  const now = new Date();
  const todayKey = toDateKey(now);
  const lastStudyDateRaw = current.lastStudyDate?.toDate ? current.lastStudyDate.toDate() : null;

  let currentStreak = Number(current.currentStreak) || 0;
  if (!lastStudyDateRaw) {
    currentStreak = 1;
  } else {
    const diff = dayDiff(lastStudyDateRaw, now);
    if (diff === 0) {
      currentStreak = currentStreak || 1;
    } else if (diff === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  }

  const dailyStudyCounts = { ...(current.dailyStudyCounts || {}) };
  dailyStudyCounts[todayKey] = (Number(dailyStudyCounts[todayKey]) || 0) + 1;

  await setDoc(
    userRef,
    {
      currentStreak,
      lastStudyDate: Timestamp.fromDate(now),
      dailyStudyCounts,
    },
    { merge: true }
  );

  return { currentStreak, dailyStudyCounts };
};

export const buildLast7DaysSeries = (dailyStudyCounts = {}) => {
  const points = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * DAY_MS);
    const key = toDateKey(date);
    points.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      count: Number(dailyStudyCounts[key]) || 0,
    });
  }
  return points;
};
