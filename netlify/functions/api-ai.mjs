/**
 * Netlify Function — proxies /api/ai/* so GEMINI_API_KEY stays server-side only.
 * Set GEMINI_API_KEY and ALLOWED_ORIGINS in Netlify Site settings → Environment variables.
 */
import { GoogleGenAI } from '@google/genai';
import { AiRouteError, dispatchGemini } from '../../lib/geminiAiHandlers.js';

function parseAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(requestOrigin) {
  const allowed = parseAllowedOrigins();
  const origin =
    requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : allowed[0] || '*';

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
    'Access-Control-Max-Age': '86400',
  };
}

function parsePathname(event) {
  const tryParse = (value) => {
    if (!value) return '';
    try {
      return new URL(value).pathname;
    } catch {
      try {
        return new URL(value, 'https://placeholder.netlify.app').pathname;
      } catch {
        return '';
      }
    }
  };

  // Original client path is most reliable when `/api/*` is rewritten to this function.
  const fromRaw = tryParse(event.rawUrl);
  if (fromRaw) return fromRaw;

  const headerPaths = [
    event.headers['x-netlify-original-pathname'],
    event.headers['X-Netlify-Original-Pathname'],
  ];

  for (const h of headerPaths) {
    if (h) return String(h);
  }

  return event.path || '';
}

function extractEndpoint(pathname) {
  const candidates = [pathname, pathname?.split?.('?')[0]].filter(Boolean);
  for (const p of candidates) {
    const m = String(p).match(/\/api\/ai\/([^/?#]+)/);
    if (m) return m[1];
  }
  return null;
}

function jsonResponse(statusCode, body, headers) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || '';
  const headers = corsHeaders(requestOrigin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const pathname = parsePathname(event);

  if (event.httpMethod === 'GET' && /\/api\/health\/?$/.test(pathname)) {
    return jsonResponse(200, { status: 'ok' }, headers);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' }, headers);
  }

  const allowed = parseAllowedOrigins();
  if (allowed.length && requestOrigin && !allowed.includes(requestOrigin)) {
    const publicKey = process.env.PUBLIC_API_KEY;
    const sentKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
    if (!publicKey || sentKey !== publicKey) {
      return jsonResponse(403, { error: 'Origin is not allowed.' }, headers);
    }
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY for Netlify function');
    return jsonResponse(503, { error: 'AI service is not configured.' }, headers);
  }

  let parsedBody;
  try {
    parsedBody = event.body ? JSON.parse(event.body) : {};
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' }, headers);
  }

  const endpoint = extractEndpoint(pathname);
  if (!endpoint) {
    return jsonResponse(404, { error: 'Not found.' }, headers);
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    const payload = await dispatchGemini(ai, endpoint, parsedBody);
    return jsonResponse(200, payload, headers);
  } catch (error) {
    if (error instanceof AiRouteError) {
      return jsonResponse(error.statusCode, { error: error.message }, headers);
    }
    console.error(`Netlify AI route ${endpoint} failed`, error);
    return jsonResponse(500, { error: 'Unable to process the request right now.' }, headers);
  }
};
