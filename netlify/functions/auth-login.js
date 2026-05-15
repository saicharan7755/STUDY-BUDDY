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

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { email, password } = body;

  // Simple demo authentication - replace with real user validation
  const demoEmail = process.env.DEMO_USER_EMAIL || 'user@example.com';
  const demoPass = process.env.DEMO_USER_PASSWORD || 'password123';

  if (email !== demoEmail || password !== demoPass) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
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

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': cookies,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user }),
  };
};
