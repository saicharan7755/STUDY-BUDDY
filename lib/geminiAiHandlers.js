/**
 * Shared Gemini AI route logic for Express (local/production Node) and Netlify Functions.
 * Model and sanitization live here so behavior stays identical across hosts.
 */

import { sanitizeText as sanitizeTextInner } from './stringSanitize.js';
import {
  STUDY_PLAN_PROMPT,
  SUMMARY_PROMPT,
  FLASHCARD_PROMPT,
  QUIZ_PROMPT,
  ELI5_PROMPT,
  DEEPER_EXPLANATION_PROMPT,
  parseGeminiResponse
} from './prompts.js';

/**
 * Default: gemini-1.5-flash (typically higher free-tier daily quota than 2.5-flash).
 * Override via GEMINI_MODEL in env if Google deprecates or renames the id.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';

export class AiRouteError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   */
  constructor(statusCode, message) {
    super(message);
    this.name = 'AiRouteError';
    this.statusCode = statusCode;
  }
}

export const sanitizeText = sanitizeTextInner;

export const sanitizeMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const role = message.role === 'user' ? 'user' : 'model';
  const text = sanitizeText(message.text, 2000);

  if (!text) {
    return null;
  }

  return { role, parts: [{ text }] };
};

export const parseJSONResponse = (text, expectedType) => {
  try {
    return parseGeminiResponse(text, expectedType);
  } catch (error) {
    console.error('Failed to parse and validate AI response', error);
    throw new Error('Invalid AI response format.', { cause: error });
  }
};

/**
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {{ contents: unknown, expectJson?: boolean }} options
 */
export const callGemini = async (ai, { contents, expectJson = false }) => {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    ...(expectJson ? { config: { responseMimeType: 'application/json' } } : {}),
  });
  return response;
};

/**
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {string} endpoint
 * @param {Record<string, unknown>} body
 * @returns {Promise<Record<string, unknown>>}
 */
export async function dispatchGemini(ai, endpoint, body) {
  if (!body || typeof body !== 'object') {
    throw new AiRouteError(400, 'Invalid JSON body.');
  }

  switch (endpoint) {
    case 'chat': {
      const topic = sanitizeText(body.topic, 200);
      const rawMessages = Array.isArray(body.messages) ? body.messages : [];
      const messages = rawMessages.map(sanitizeMessage).filter(Boolean);

      if (!topic || messages.length === 0) {
        throw new AiRouteError(400, 'Missing or invalid chat payload.');
      }

      const systemPrompt = `You are an expert tutor helping a student study for an upcoming exam. The current topic of focus is "${topic}". Keep your answers concise, encouraging, and highly focused on this topic. Use markdown.`;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am ready to tutor.' }] },
        ...messages,
      ];

      const response = await callGemini(ai, { contents, expectJson: false });
      return { text: String(response.text || '').trim() };
    }

    case 'study-plan': {
      const syllabus = sanitizeText(body.syllabus, 2000) || 'See attached image.';
      const timeAvailable = sanitizeText(body.timeAvailable, 100);
      const difficulty = sanitizeText(body.difficulty, 100);
      const image = body.image;

      if (!difficulty || !timeAvailable) {
        throw new AiRouteError(400, 'Missing required study plan inputs.');
      }

      const promptText = `${STUDY_PLAN_PROMPT.replace('{time}', timeAvailable).replace('{difficulty}', difficulty)}\n\nSyllabus/Topics:\n${syllabus}`;
      const contents = [{ role: 'user', parts: [{ text: promptText }] }];

      if (image && typeof image.data === 'string' && typeof image.mimeType === 'string') {
        contents[0].parts.push({
          inlineData: {
            data: sanitizeText(image.data, 100000),
            mimeType: sanitizeText(image.mimeType, 100),
          },
        });
      }

      const response = await callGemini(ai, { contents, expectJson: true });
      return parseJSONResponse(response.text, 'study-plan');
    }

    case 'summary': {
      const topic = sanitizeText(body.topic, 200);
      if (!topic) {
        throw new AiRouteError(400, 'Missing summary topic.');
      }
      const prompt = SUMMARY_PROMPT.replace('{topic}', topic);
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const response = await callGemini(ai, { contents, expectJson: true });
      return parseJSONResponse(response.text, 'summary');
    }

    case 'flashcards': {
      const topic = sanitizeText(body.topic, 200);
      const count = typeof body.count === 'number' ? body.count : 10;
      if (!topic) {
        throw new AiRouteError(400, 'Missing flashcard topic.');
      }
      const prompt = FLASHCARD_PROMPT.replace('{topic}', topic).replace('{count}', count);
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const response = await callGemini(ai, { contents, expectJson: true });
      return parseJSONResponse(response.text, 'flashcards');
    }

    case 'quiz': {
      const topic = sanitizeText(body.topic, 200);
      const count = typeof body.count === 'number' ? body.count : 5;
      if (!topic) {
        throw new AiRouteError(400, 'Missing quiz topic.');
      }
      const prompt = QUIZ_PROMPT.replace('{topic}', topic).replace('{count}', count);
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const response = await callGemini(ai, { contents, expectJson: true });
      return parseJSONResponse(response.text, 'quiz');
    }

    case 'eli5': {
      const topic = sanitizeText(body.topic, 200);
      if (!topic) {
        throw new AiRouteError(400, 'Missing ELI5 topic.');
      }
      const prompt = ELI5_PROMPT.replace('{topic}', topic);
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const response = await callGemini(ai, { contents, expectJson: true });
      return parseJSONResponse(response.text, 'eli5');
    }

    case 'deeper': {
      const topic = sanitizeText(body.topic, 200);
      const currentSummary = sanitizeText(body.currentSummary, 2000);
      if (!topic || !currentSummary) {
        throw new AiRouteError(400, 'Missing deeper explanation inputs.');
      }
      const prompt = DEEPER_EXPLANATION_PROMPT.replace('{topic}', topic).replace('{currentSummary}', currentSummary);
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const response = await callGemini(ai, { contents, expectJson: true });
      return parseJSONResponse(response.text, 'deeper');
    }

    default:
      throw new AiRouteError(404, 'Unknown AI endpoint.');
  }
}
