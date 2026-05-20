import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { verify, sign } = require('jsonwebtoken');

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}

function createCookie(name, value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${value}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

const ACCESS_TOKEN_EXP = 15 * 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers?.cookie);
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