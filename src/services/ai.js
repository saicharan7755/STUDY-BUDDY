import { sanitizeText } from '../../lib/stringSanitize.js';
import fetchWithAuth from '../utils/fetchWithAuth';
import { AI_ERROR_MESSAGES, AUTH_ERROR_MESSAGES } from '../constants/errorMessages';

const API_TIMEOUT_MS = 16000;
const MAX_WORDS = 1200;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const parseRetryAfterHeader = (value) => {
  if (!value) return 60;
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric;
  }

  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.round((date - Date.now()) / 1000));
  }

  return 60;
};

const createAppError = (message, options = {}) => {
  const error = new Error(message);
  if (options.type) error.type = options.type;
  if (options.status) error.status = options.status;
  if (options.retryAfter !== undefined) error.retryAfter = options.retryAfter;
  if (options.maxWords !== undefined) error.maxWords = options.maxWords;
  return error;
};

const timeoutFetch = async (resource, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetchWithAuth(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const readErrorMessage = async (response) => {
  const errorText = await response.text();

  try {
    const parsedError = JSON.parse(errorText);
    return parsedError?.error || errorText;
  } catch {
    return errorText;
  }
};

const postAi = async (endpoint, body) => {
  const hasValue = Object.values(body).some((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });

  if (!hasValue) {
    throw createAppError(AI_ERROR_MESSAGES.emptyInput, {
      type: 'EMPTY_INPUT',
      status: 400,
    });
  }

  let response;
  try {
    const url = `${API_BASE_URL}/ai/${endpoint}`;
    response = await timeoutFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw createAppError(AI_ERROR_MESSAGES.timeout, {
        type: 'TIMEOUT',
        status: 408,
      });
    }
    if (e instanceof TypeError) {
      throw createAppError(AUTH_ERROR_MESSAGES.networkError, {
        type: 'NETWORK_ERROR',
      });
    }
    throw e;
  }

  if (!response.ok) {
    const retryAfter = parseRetryAfterHeader(response.headers.get('Retry-After'));
    const rawMessage = (await readErrorMessage(response)) || `AI request failed with status ${response.status}.`;

    if (response.status === 429) {
      throw createAppError(AI_ERROR_MESSAGES.rateLimit(retryAfter), {
        type: 'RATE_LIMIT',
        status: 429,
        retryAfter,
      });
    }

    if (response.status === 503) {
      throw createAppError(AI_ERROR_MESSAGES.serviceUnavailable, {
        type: 'SERVICE_UNAVAILABLE',
        status: 503,
      });
    }

    if (response.status === 413 || /length|word|long/i.test(rawMessage)) {
      throw createAppError(AI_ERROR_MESSAGES.contentTooLong(MAX_WORDS), {
        type: 'CONTENT_TOO_LONG',
        status: 413,
        maxWords: MAX_WORDS,
      });
    }

    if (/quota/i.test(rawMessage)) {
      throw createAppError(AI_ERROR_MESSAGES.rateLimit(retryAfter), {
        type: 'RATE_LIMIT',
        status: 429,
        retryAfter,
      });
    }

    throw createAppError(rawMessage, {
      status: response.status,
    });
  }

  try {
    return await response.json();
  } catch {
    throw createAppError('Empty or invalid AI response. Please try again.', {
      type: 'INVALID_RESPONSE',
    });
  }
};

const sanitizePayload = (payload) => {
  const sanitized = {};

  for (const key in payload) {
    if (typeof payload[key] === 'string') {
      sanitized[key] = sanitizeText(payload[key], 2000);
    } else {
      sanitized[key] = payload[key];
    }
  }

  return sanitized;
};

export const generateChatReply = async (topic, messages) => {
  const sanitizedTopic = sanitizeText(topic, 200);
  const sanitizedMessages = Array.isArray(messages)
    ? messages.map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        text: sanitizeText(message.text, 2000),
      }))
    : [];

  const result = await postAi('chat', {
    topic: sanitizedTopic,
    messages: sanitizedMessages,
  });

  return result.text;
};

export const generateStudyPlan = async (syllabus, timeAvailable, difficulty, image = null) => {
  const payload = sanitizePayload({
    syllabus,
    timeAvailable,
    difficulty,
    image,
  });

  return postAi('study-plan', payload);
};

export const generateSummary = async (topic, difficulty) => {
  const payload = sanitizePayload({ topic, difficulty });
  return postAi('summary', payload);
};

export const generateFlashcards = async (topic, count = 10) => {
  const payload = sanitizePayload({ topic, count });
  const result = await postAi('flashcards', payload);

  if (!result || !Array.isArray(result.flashcards) || result.flashcards.length === 0) {
    throw createAppError('Received empty or invalid AI response. Please try again.', {
      type: 'INVALID_RESPONSE',
    });
  }

  return result;
};

export const generateQuiz = async (topic, count = 5) => {
  const payload = sanitizePayload({ topic, count });
  return postAi('quiz', payload);
};

export const generateTrueFalseQuiz = async (topic, count = 5) => {
  const payload = sanitizePayload({ topic, count });
  return postAi('true-false', payload);
};

export const generateELI5 = async (topic) => {
  const payload = sanitizePayload({ topic });
  return postAi('eli5', payload);
};

export const generateDeeperExplanation = async (topic, currentSummary) => {
  const payload = sanitizePayload({ topic, currentSummary });
  return postAi('deeper', payload);
};
