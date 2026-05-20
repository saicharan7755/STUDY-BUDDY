import { sign } from 'jsonwebtoken';
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
