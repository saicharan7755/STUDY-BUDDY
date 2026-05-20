import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { verify } = require('jsonwebtoken');

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers?.cookie);
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