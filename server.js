import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { AiRouteError, dispatchGemini, GEMINI_MODEL } from './lib/geminiAiHandlers.js';

dotenv.config();

const app = express();
app.set('trust proxy', true);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Missing required environment variable: GEMINI_API_KEY');
  process.exit(1);
}

console.warn(`Gemini model: ${GEMINI_MODEL}`);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const isBotUserAgent = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') {
    return true;
  }

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /headless/i,
    /puppeteer/i,
    /phantom/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
};

const validateOrigin = (req) => {
  const originHeader = req.headers.origin || req.headers.referer;
  if (!originHeader) {
    return true;
  }

  try {
    const origin = new URL(originHeader).origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
      return true;
    }
  } catch {
    return false;
  }

  return Boolean(PUBLIC_API_KEY && req.headers['x-api-key'] === PUBLIC_API_KEY);
};

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.google.com'],
        fontSrc: ["'self'", 'data:'],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'];

  if (!userAgent) {
    return res.status(400).json({ error: 'User-Agent header is required.' });
  }

  if (isBotUserAgent(userAgent)) {
    return res.status(403).json({ error: 'Automated traffic is not allowed.' });
  }

  if (!validateOrigin(req)) {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }

  next();
});

app.use('/api/ai', apiLimiter);

const AI_ENDPOINTS = ['chat', 'study-plan', 'summary', 'flashcards', 'quiz', 'eli5', 'deeper'];

for (const path of AI_ENDPOINTS) {
  app.post(`/api/ai/${path}`, async (req, res) => {
    try {
      const payload = await dispatchGemini(ai, path, req.body);
      return res.json(payload);
    } catch (error) {
      if (error instanceof AiRouteError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(`AI route /api/ai/${path} failed`, error);
      return res.status(500).json({ error: 'Unable to process the request right now.' });
    }
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile(new URL('./dist/index.html', import.meta.url).pathname);
  });
}

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.info(`Server listening on http://localhost:${port}`);
});

