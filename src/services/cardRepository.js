import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createInitialSrsState } from '../utils/sm2';

const cardsCollection = (uid, sessionId) => collection(db, `users/${uid}/sessions/${sessionId}/cards`);

export const normalizeCardId = (topicId, card, index) => {
  if (card?.id) return String(card.id);
  const frontKey = String(card?.front || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${topicId}-${frontKey || index}`;
};

export const persistGeneratedCards = async ({ uid, sessionId, topicId, cards }) => {
  const writes = (cards || []).map((card, index) => {
    const cardId = normalizeCardId(topicId, card, index);
    const srs = createInitialSrsState();
    return setDoc(
      doc(db, `users/${uid}/sessions/${sessionId}/cards/${cardId}`),
      {
        cardId,
        userId: uid,
        sessionId,
        topicId,
        front: card.front,
        back: card.back,
        createdAt: serverTimestamp(),
        easinessFactor: srs.easinessFactor,
        interval: srs.interval,
        repetition: srs.repetition,
        nextReviewDate: Timestamp.fromDate(srs.nextReviewDate),
        lastReviewedAt: null,
      },
      { merge: true }
    );
  });

  await Promise.all(writes);
};

export const fetchDueCardsForTopic = async ({ uid, sessionId, topicId }) => {
  const now = Timestamp.now();
  const dueQuery = query(
    cardsCollection(uid, sessionId),
    where('topicId', '==', topicId),
    where('nextReviewDate', '<=', now),
    orderBy('nextReviewDate', 'asc')
  );
  const snapshot = await getDocs(dueQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const fetchAllCardsForTopic = async ({ uid, sessionId, topicId }) => {
  const allQuery = query(cardsCollection(uid, sessionId), where('topicId', '==', topicId));
  const snapshot = await getDocs(allQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const updateCardReview = async ({ uid, sessionId, cardId, srsUpdate }) => {
  const cardRef = doc(db, `users/${uid}/sessions/${sessionId}/cards/${cardId}`);
  await updateDoc(cardRef, {
    easinessFactor: srsUpdate.easinessFactor,
    interval: srsUpdate.interval,
    repetition: srsUpdate.repetition,
    nextReviewDate: Timestamp.fromDate(srsUpdate.nextReviewDate),
    lastReviewedAt: Timestamp.fromDate(srsUpdate.lastReviewedAt),
  });
};
