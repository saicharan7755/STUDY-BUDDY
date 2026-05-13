import { useCallback, useEffect, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';

const SRS_STORAGE_KEY = 'study-spaced-repetition';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const toDate = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const cardKey = (deckId, cardId) => `${deckId}::${cardId}`;

const getCardId = (card, index) => String(card?.id || `${index}-${card?.front || 'card'}`);

const createInitialState = (baseDate = new Date()) => ({
  repetitions: 0,
  easeFactor: 2.5,
  interval: 0,
  nextReviewDate: baseDate.toISOString(),
  lastReviewedAt: null,
});

const qualityByRating = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

const calculateSm2Schedule = (rating, currentState = {}, baseDate = new Date()) => {
  const quality = qualityByRating[rating] ?? 0;
  let repetitions = Number(currentState.repetitions) || 0;
  let interval = Number(currentState.interval) || 0;
  let easeFactor = Number(currentState.easeFactor) || 2.5;

  /*
   * SM-2 treats each answer as a quality score from 0-5.
   * Scores below 3 mean the learner did not recall the card well enough, so
   * the repetition streak resets and the card comes back tomorrow. Passing
   * scores increase the repetition streak: first success reviews in 1 day,
   * second success in 6 days, then later intervals multiply by the ease factor.
   * The ease factor moves down for difficult cards and up slightly for easy
   * cards, but it never drops below 1.3 so cards still spread out over time.
   */
  easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
    }
  }

  const nextReviewDate = new Date(baseDate.getTime() + interval * ONE_DAY_MS);

  return {
    repetitions,
    easeFactor,
    interval,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewedAt: baseDate.toISOString(),
  };
};

export const formatReviewDistance = (dateValue, now = new Date()) => {
  const nextDate = toDate(dateValue);
  const today = startOfToday();
  const targetDay = new Date(nextDate);
  targetDay.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((targetDay.getTime() - today.getTime()) / ONE_DAY_MS);

  if (nextDate <= now) return 'today';
  if (dayDiff <= 0) return 'later today';
  if (dayDiff === 1) return 'in 1 day';
  return `in ${dayDiff} days`;
};

const useSpacedRepetition = (decks = []) => {
  const [schedule, setSchedule] = useLocalStorage(SRS_STORAGE_KEY, {});

  const cards = useMemo(
    () =>
      decks.flatMap((deck) =>
        (deck.cards || []).map((card, index) => {
          const id = getCardId(card, index);
          const key = cardKey(deck.id, id);
          const srs =
            schedule[key] ||
            createInitialState(card.createdAt ? toDate(card.createdAt) : new Date());
          return {
            ...card,
            id,
            cardId: id,
            deckId: deck.id,
            deckName: deck.name,
            srsKey: key,
            repetitions: Number(srs.repetitions) || 0,
            easeFactor: Number(srs.easeFactor) || 2.5,
            interval: Number(srs.interval) || 0,
            nextReviewDate: srs.nextReviewDate,
            lastReviewedAt: srs.lastReviewedAt,
          };
        })
      ),
    [decks, schedule]
  );

  useEffect(() => {
    if (!decks.length) return;

    setSchedule((current) => {
      let changed = false;
      const next = { ...current };

      decks.forEach((deck) => {
        (deck.cards || []).forEach((card, index) => {
          const key = cardKey(deck.id, getCardId(card, index));
          if (!next[key]) {
            next[key] = createInitialState(card.createdAt ? toDate(card.createdAt) : new Date());
            changed = true;
          }
        });
      });

      return changed ? next : current;
    });
  }, [decks, setSchedule]);

  const dueCards = useMemo(() => {
    const dueThrough = endOfToday();
    return cards
      .filter((card) => toDate(card.nextReviewDate) <= dueThrough)
      .sort((a, b) => toDate(a.nextReviewDate).getTime() - toDate(b.nextReviewDate).getTime());
  }, [cards]);

  const reviewCard = useCallback(
    (card, rating) => {
      if (!card?.srsKey) return null;
      const nextState = calculateSm2Schedule(rating, schedule[card.srsKey]);
      setSchedule((current) => ({
        ...current,
        [card.srsKey]: nextState,
      }));
      return nextState;
    },
    [schedule, setSchedule]
  );

  const getCardSchedule = useCallback(
    (deckId, cardId) => schedule[cardKey(deckId, cardId)] || createInitialState(),
    [schedule]
  );

  return {
    cards,
    dueCards,
    dueCount: dueCards.length,
    estimatedMinutes: Math.max(1, Math.ceil(dueCards.length * 0.75)),
    reviewCard,
    getCardSchedule,
    formatNextReview: formatReviewDistance,
  };
};

export default useSpacedRepetition;
