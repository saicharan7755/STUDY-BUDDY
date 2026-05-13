import { sanitizeText } from '../../lib/stringSanitize.js';

const postAi = async (endpoint, body) => {
  const response = await fetch(`/api/ai/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const parsed = JSON.parse(errorText);
      if (parsed && typeof parsed.error === 'string') {
        throw new Error(parsed.error);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        /* plain text body */
      } else {
        throw e;
      }
    }
    throw new Error(errorText || 'AI request failed.');
  }

  return response.json();
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

export const generateFlashcards = async (topic) => {
  const payload = sanitizePayload({ topic });
  return postAi('flashcards', payload);
};

export const generateQuiz = async (topic) => {
  const payload = sanitizePayload({ topic });
  return postAi('quiz', payload);
};

export const generateELI5 = async (topic) => {
  const payload = sanitizePayload({ topic });
  return postAi('eli5', payload);
};

export const generateDeeperExplanation = async (topic, currentSummary) => {
  const payload = sanitizePayload({ topic, currentSummary });
  return postAi('deeper', payload);
};
