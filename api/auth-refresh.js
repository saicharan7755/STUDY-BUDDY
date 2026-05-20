import { verify, sign } from 'jsonwebtoken';
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
