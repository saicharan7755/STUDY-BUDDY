#!/usr/bin/env node

/**
 * Generates Vercel API functions used by the production build.
 * Run: node setup-vercel.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, 'api');

if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
  console.info('Created api directory');
}

// Auth Refresh
fs.writeFileSync(path.join(apiDir, 'auth-refresh.js'), `import { verify, sign } from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const ACCESS_TOKEN_EXP = 15 * 60; // 15 minutes
function createCookie(name, value, maxAge) {
  return serialize(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookieHeader = req.headers?.cookie || '';
  const cookies = parse(cookieHeader || '');
  const refreshToken = cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';
  const jwtSecret = process.env.JWT_SECRET || 'dev_secret';

  try {
    const payload = verify(refreshToken, refreshSecret);
    const userId = payload.sub;

    const newAccess = sign({ sub: userId }, jwtSecret, { expiresIn: ACCESS_TOKEN_EXP });

    const cookie = createCookie('accessToken', newAccess, ACCESS_TOKEN_EXP);
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}
`);
console.info('Created api/auth-refresh.js');

// Auth Login
fs.writeFileSync(path.join(apiDir, 'auth-login.js'), `import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';

const ACCESS_TOKEN_EXP = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXP = 7 * 24 * 60 * 60; // 7 days

function createCookie(name, value, maxAge) {
  return serialize(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { email, password } = body;

  // Simple demo authentication - replace with real user validation
  const demoEmail = process.env.DEMO_USER_EMAIL || 'user@example.com';
  const demoPass = process.env.DEMO_USER_PASSWORD || 'password123';

  if (email !== demoEmail || password !== demoPass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_secret';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';

  const user = { id: 'demo-user', email };

  const accessToken = sign({ sub: user.id, email: user.email }, jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXP,
  });

  const refreshToken = sign({ sub: user.id }, refreshSecret, {
    expiresIn: REFRESH_TOKEN_EXP,
  });

  const cookies = [
    createCookie('accessToken', accessToken, ACCESS_TOKEN_EXP),
    createCookie('refreshToken', refreshToken, REFRESH_TOKEN_EXP),
  ];

  res.setHeader('Set-Cookie', cookies);
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ user });
}
`);
console.info('Created api/auth-login.js');

// Auth Logout
fs.writeFileSync(path.join(apiDir, 'auth-logout.js'), `import { serialize } from 'cookie';

function clearCookie(name) {
  return serialize(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = [clearCookie('accessToken'), clearCookie('refreshToken')];
  res.setHeader('Set-Cookie', cookies);
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ ok: true });
}
`);
console.info('Created api/auth-logout.js');

// Auth Me
fs.writeFileSync(path.join(apiDir, 'auth-me.js'), `import { verify } from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookieHeader = req.headers?.cookie || '';
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return res.status(200).json({ user: null });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_secret';
  try {
    const payload = verify(accessToken, jwtSecret);
    const user = { id: payload.sub, email: payload.email };
    return res.status(200).json({ user });
  } catch {
    return res.status(200).json({ user: null });
  }
}
`);
console.info('Created api/auth-me.js');

// Log Error (for ErrorBoundary)
fs.writeFileSync(path.join(apiDir, 'log-error.js'), `/**
 * Vercel API function to log frontend errors
 * Called by ErrorBoundary when React errors occur
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, stack, componentStack } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing error message' });
  }

  console.error('[Frontend Error Log]', {
    message,
    stack,
    componentStack,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({ ok: true, logged: true });
}
`);
console.info('Created api/log-error.js');

console.info('\nAll Vercel API functions created successfully.');
