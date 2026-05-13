import { sanitizeText } from '../../lib/stringSanitize.js';

const API_TIMEOUT_MS = 30000;

const timeoutFetch = async (resource, options = {}) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const postAi = async (endpoint, body) => {
  let response;
  try {
    response = await timeoutFetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('The AI request timed out after 30 seconds. Please try again.', {
        cause: e,
      });
    }
    if (e instanceof TypeError) {
      throw new Error('Network connection error. Check your internet connection and try again.', {
        cause: e,
      });
    }
    throw e;
  }

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        throw e;
      }
    }

    const rawMessage = parsedError?.error || errorText || 'AI request failed.';
    if (/quota/i.test(rawMessage)) {
      throw new Error('API quota exceeded. Please wait before trying again.');
    }

    throw new Error(rawMessage);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Empty or invalid AI response. Please try again.');
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
    throw new Error('Received empty or invalid AI response. Please try again.');
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
