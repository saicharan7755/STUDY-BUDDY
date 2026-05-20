import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const url = req.url || '';

    // Extract endpoint from URL: /api/ai/study-plan -> study-plan
    const endpoint = url.split('/api/ai/')[1]?.split('?')[0];

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    const response = await callGemini(endpoint, body);
    return res.status(200).json(response);

  } catch (error) {
    console.error('AI handler error:', error);
    return res.status(500).json({ error: error.message || 'AI request failed' });
  }
}

async function callGemini(endpoint, body) {
  switch (endpoint) {
    case 'chat': {
      const topic = body.topic || '';
      const messages = Array.isArray(body.messages) ? body.messages : [];

      const systemPrompt = `You are an expert tutor helping a student study for an upcoming exam. The current topic is "${topic}". Keep answers concise and focused. Use markdown.`;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am ready to tutor.' }] },
        ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      ];

      const result = await ai.models.generateContent({ model: GEMINI_MODEL, contents });
      return { text: String(result.text || '').trim() };
    }

    case 'study-plan': {
      const syllabus = body.syllabus || '';
      const timeAvailable = body.timeAvailable || '';
      const difficulty = body.difficulty || '';

      const prompt = `Create a JSON study plan for a student with ${timeAvailable} available at ${difficulty} difficulty level.
Syllabus: ${syllabus}

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "id": "1",
      "title": "Topic Title",
      "priority": "High",
      "timeAllocation": "2 hours",
      "subtopics": ["subtopic 1", "subtopic 2"]
    }
  ]
}`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(result.text);
      return parsed;
    }

    case 'summary': {
      const topic = body.topic || '';
      const prompt = `Create a concise study summary for: ${topic}. Return ONLY valid JSON:
{"summary": "markdown summary text", "keyPoints": ["point1", "point2"]}`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      return JSON.parse(result.text);
    }

    case 'flashcards': {
      const topic = body.topic || '';
      const count = body.count || 10;
      const prompt = `Create ${count} flashcards for: ${topic}. Return ONLY valid JSON:
{"flashcards": [{"id": "1", "front": "question", "back": "answer"}]}`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      return JSON.parse(result.text);
    }

    case 'quiz': {
      const topic = body.topic || '';
      const count = body.count || 5;
      const prompt = `Create ${count} multiple choice quiz questions for: ${topic}. Return ONLY valid JSON:
{"questions": [{"id": "1", "question": "q?", "options": ["a","b","c","d"], "correctAnswer": "a", "explanation": "why"}]}`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      return JSON.parse(result.text);
    }

    case 'true-false': {
      const topic = body.topic || '';
      const count = body.count || 5;
      const prompt = `Create ${count} true/false questions for: ${topic}. Return ONLY valid JSON:
{"questions": [{"id": "1", "statement": "statement", "answer": true, "explanation": "why"}]}`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      return JSON.parse(result.text);
    }

    case 'eli5': {
      const topic = body.topic || '';
      const prompt = `Explain ${topic} like I'm 5 years old. Return ONLY valid JSON:
{"explanation": "simple explanation", "analogy": "fun analogy"}`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      return JSON.parse(result.text);
    }

    case 'deeper': {
      const topic = body.topic || '';
      const currentSummary = body.currentSummary || '';
      const prompt = `Give a deeper explanation of ${topic}. Current summary: ${currentSummary}. Return ONLY valid JSON:
{"explanation": "detailed markdown explanation", "keyInsights": ["insight1"]}`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      return JSON.parse(result.text);
    }

    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}