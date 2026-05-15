import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const CONTENT_TYPES = {
  FLASHCARDS: 'flashcards',
  QUIZ: 'quiz',
  SUMMARY: 'summary',
};

export const CONTENT_ERROR_TYPES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',
  INVALID_CONTENT_DATA: 'INVALID_CONTENT_DATA',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

const allowedTypes = new Set(Object.values(CONTENT_TYPES));

const createContentId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const contentCollection = (userId) => collection(db, `users/${userId}/content`);
const contentDocument = (userId, contentId) => doc(db, `users/${userId}/content/${contentId}`);

const createError = (type, message, cause) => ({
  type,
  message,
  code: cause?.code || null,
});

const normalizeFirestoreError = (error, fallbackMessage) => {
  if (error?.type && error?.message) return error;

  if (error?.code === 'permission-denied') {
    return createError(
      CONTENT_ERROR_TYPES.PERMISSION_DENIED,
      'You do not have permission to access this content.',
      error
    );
  }

  if (error?.code) {
    return createError(CONTENT_ERROR_TYPES.DATABASE_ERROR, fallbackMessage, error);
  }

  return createError(
    CONTENT_ERROR_TYPES.UNKNOWN_ERROR,
    error?.message || fallbackMessage,
    error
  );
};

const assertValidUser = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw createError(CONTENT_ERROR_TYPES.AUTH_REQUIRED, 'A signed-in user is required.');
  }
};

const assertValidType = (contentType) => {
  if (!allowedTypes.has(contentType)) {
    throw createError(
      CONTENT_ERROR_TYPES.INVALID_CONTENT_TYPE,
      'Content type must be flashcards, quiz, or summary.'
    );
  }
};

const getSourceText = (contentData) => {
  const sourceText = contentData?.sourceText;
  if (typeof sourceText !== 'string' || !sourceText.trim()) {
    throw createError(
      CONTENT_ERROR_TYPES.INVALID_CONTENT_DATA,
      'Content source text is required before saving.'
    );
  }
  return sourceText.trim();
};

const getGeneratedContent = (contentData) => {
  const content = contentData?.content;
  if (!content || typeof content !== 'object') {
    throw createError(
      CONTENT_ERROR_TYPES.INVALID_CONTENT_DATA,
      'Generated content must be an object.'
    );
  }
  return content;
};

const buildTitle = (sourceText) => {
  const title = sourceText.replace(/\s+/g, ' ').trim().slice(0, 50);
  return title || 'Untitled content';
};

const countWords = (value) => {
  if (typeof value === 'string') {
    return value.trim() ? value.trim().split(/\s+/).length : 0;
  }
  if (Array.isArray(value)) return value.reduce((total, item) => total + countWords(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((total, item) => total + countWords(item), 0);
  }
  return 0;
};

const getArrayLength = (content, keys) => {
  for (const key of keys) {
    if (Array.isArray(content?.[key])) return content[key].length;
  }
  return Array.isArray(content) ? content.length : 0;
};

const buildMetadata = (contentType, content) => {
  if (contentType === CONTENT_TYPES.FLASHCARDS) {
    return { cardCount: getArrayLength(content, ['flashcards', 'cards']) };
  }

  if (contentType === CONTENT_TYPES.QUIZ) {
    return { questionCount: getArrayLength(content, ['questions', 'quiz']) };
  }

  return { wordCount: countWords(content?.summary || content?.text || content) };
};

const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
};

const normalizeContentItem = (item) => ({
  ...item,
  createdAt: normalizeTimestamp(item.createdAt),
  updatedAt: normalizeTimestamp(item.updatedAt),
});

const buildContentItem = (userId, contentType, contentData, existing = {}) => {
  const sourceText = getSourceText(contentData);
  const content = getGeneratedContent(contentData);
  const now = new Date().toISOString();

  return {
    id: existing.id || contentData.id || createContentId(),
    userId,
    type: contentType,
    title: buildTitle(sourceText),
    content,
    sourceText,
    createdAt: normalizeTimestamp(existing.createdAt) || contentData.createdAt || now,
    updatedAt: now,
    metadata: buildMetadata(contentType, content),
  };
};

export const saveContent = async (userId, contentType, contentData) => {
  try {
    assertValidUser(userId);
    assertValidType(contentType);
    const item = buildContentItem(userId, contentType, contentData);

    await runTransaction(db, async (transaction) => {
      transaction.set(contentDocument(userId, item.id), item);
    });

    return { data: item, error: null };
  } catch (error) {
    return {
      data: null,
      error: normalizeFirestoreError(error, 'Failed to save generated content.'),
    };
  }
};

export const getUserContent = async (userId) => {
  try {
    assertValidUser(userId);
    const contentQuery = query(contentCollection(userId), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(contentQuery);
    const items = snapshot.docs.map((item) => normalizeContentItem({ id: item.id, ...item.data() }));

    return { data: items, error: null };
  } catch (error) {
    return {
      data: null,
      error: normalizeFirestoreError(error, 'Failed to load your generated content.'),
    };
  }
};

export const deleteContent = async (userId, contentId) => {
  try {
    assertValidUser(userId);
    if (!contentId) {
      throw createError(CONTENT_ERROR_TYPES.INVALID_CONTENT_DATA, 'Content id is required.');
    }

    const itemRef = contentDocument(userId, contentId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(itemRef);
      if (!snapshot.exists()) {
        throw createError(CONTENT_ERROR_TYPES.NOT_FOUND, 'Content item was not found.');
      }
      if (snapshot.data()?.userId !== userId) {
        throw createError(
          CONTENT_ERROR_TYPES.PERMISSION_DENIED,
          'You do not have permission to delete this content.'
        );
      }
      transaction.delete(itemRef);
    });

    return { data: { id: contentId }, error: null };
  } catch (error) {
    return {
      data: null,
      error: normalizeFirestoreError(error, 'Failed to delete generated content.'),
    };
  }
};

export const updateContent = async (userId, contentId, updatedData) => {
  try {
    assertValidUser(userId);
    if (!contentId) {
      throw createError(CONTENT_ERROR_TYPES.INVALID_CONTENT_DATA, 'Content id is required.');
    }

    let updatedItem = null;
    const itemRef = contentDocument(userId, contentId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(itemRef);
      if (!snapshot.exists()) {
        throw createError(CONTENT_ERROR_TYPES.NOT_FOUND, 'Content item was not found.');
      }

      const existing = snapshot.data();
      if (existing.userId !== userId) {
        throw createError(
          CONTENT_ERROR_TYPES.PERMISSION_DENIED,
          'You do not have permission to update this content.'
        );
      }

      const nextType = updatedData?.type || existing.type;
      assertValidType(nextType);
      updatedItem = buildContentItem(
        userId,
        nextType,
        {
          ...existing,
          ...updatedData,
          sourceText: updatedData?.sourceText || existing.sourceText,
          content: updatedData?.content || existing.content,
        },
        { id: contentId, createdAt: existing.createdAt }
      );
      transaction.set(itemRef, updatedItem);
    });

    return { data: normalizeContentItem(updatedItem), error: null };
  } catch (error) {
    return {
      data: null,
      error: normalizeFirestoreError(error, 'Failed to update generated content.'),
    };
  }
};
