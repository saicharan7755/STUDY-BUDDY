const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const clampQuality = (quality) => Math.max(0, Math.min(5, Number(quality) || 0));

export const createInitialSrsState = (baseDate = new Date()) => ({
  easinessFactor: 2.5,
  interval: 0,
  repetition: 0,
  nextReviewDate: new Date(baseDate),
  lastReviewedAt: null,
});

export const calculateNextReview = (quality, currentState = {}) => {
  const q = clampQuality(quality);
  let repetition = Number(currentState.repetition) || 0;
  let interval = Number(currentState.interval) || 0;
  let easinessFactor = Number(currentState.easinessFactor) || 2.5;

  easinessFactor += 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  easinessFactor = Math.max(1.3, Number(easinessFactor.toFixed(2)));

  if (q < 3) {
    repetition = 0;
    interval = 1;
  } else {
    repetition += 1;
    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * easinessFactor));
    }
  }

  const now = new Date();
  const nextReviewDate = new Date(now.getTime() + interval * ONE_DAY_MS);

  return {
    easinessFactor,
    interval,
    repetition,
    nextReviewDate,
    lastReviewedAt: now,
  };
};

export const gradeToQuality = (grade) => {
  if (grade === 'easy') return 5;
  if (grade === 'good') return 4;
  if (grade === 'hard') return 3;
  return 0;
};
