import { verify, sign } from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

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

  const cookieHeader = event.headers?.cookie || '';
  const cookies = parse(cookieHeader || '');
  const refreshToken = cookies.refreshToken;

  if (!refreshToken) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No refresh token' }) };
  }

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';
  const jwtSecret = process.env.JWT_SECRET || 'dev_secret';

  try {
    const payload = verify(refreshToken, refreshSecret);
    const userId = payload.sub;

    const newAccess = sign({ sub: userId }, jwtSecret, { expiresIn: ACCESS_TOKEN_EXP });

    const cookie = createCookie('accessToken', newAccess, ACCESS_TOKEN_EXP);
    return { statusCode: 200, headers: { 'Set-Cookie': cookie }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid refresh token' }) };
  }
};
