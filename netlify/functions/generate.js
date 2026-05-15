/**
 * Netlify Function — proxies client requests to OpenAI securely.
 *
 * Requirements:
 * - Set `OPENAI_API_KEY` and `ALLOWED_ORIGINS` in Netlify Site settings → Environment variables.
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function parseAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(requestOrigin) {
  const allowed = parseAllowedOrigins();
  const origin = requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : allowed[0] || '*';

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function getClientIp(event) {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')?.[0] ||
    event.headers['remote_addr'] ||
    'unknown'
  );
}

const rateLimitStore = globalThis.__openai_rate_limit__ || new Map();
globalThis.__openai_rate_limit__ = rateLimitStore;

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const list = rateLimitStore.get(ip) || [];
  const filtered = list.filter((ts) => ts > windowStart);
  filtered.push(now);
  rateLimitStore.set(ip, filtered);
  return filtered.length > MAX_REQUESTS_PER_WINDOW;
}

async function callOpenAIChat(messages) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'OpenAI API error');
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content || choice?.text || '';
  return { content, raw: data };
}

export const handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || '';
  const headers = corsHeaders(requestOrigin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  const allowed = parseAllowedOrigins();
  if (allowed.length && requestOrigin && !allowed.includes(requestOrigin)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Origin is not allowed.' }) };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY for Netlify function');
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'AI service is not configured.' }) };
  }

  let parsedBody = {};
  try {
    parsedBody = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  const endpoint = parsedBody.endpoint || 'chat';
  const ip = getClientIp(event);
  if (isRateLimited(ip)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Rate limit exceeded.' }) };
  }

  try {
    if (endpoint === 'chat') {
      const messages = parsedBody.messages || [{ role: 'user', content: parsedBody.prompt || '' }];
      const { content, raw } = await callOpenAIChat(messages);

      // Try to parse JSON responses (for structured endpoints like flashcards)
      try {
        const parsed = JSON.parse(content);
        return { statusCode: 200, headers, body: JSON.stringify(parsed) };
      } catch {
        return { statusCode: 200, headers, body: JSON.stringify({ text: content, raw }) };
      }
    }

    // Generic handler for other endpoints: send serialized instruction to OpenAI
    const instruction = `Endpoint: ${endpoint}\nPayload: ${JSON.stringify(parsedBody)}`;
    const { content, raw } = await callOpenAIChat([{ role: 'user', content: instruction }]);

    try {
      const parsed = JSON.parse(content);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    } catch {
      return { statusCode: 200, headers, body: JSON.stringify({ text: content, raw }) };
    }
  } catch (error) {
    console.error('OpenAI proxy error', error?.message || error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unable to process the request.' }) };
  }
};
