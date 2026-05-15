import { serialize } from 'cookie';

function clearCookie(name) {
  return serialize(name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const cookies = [clearCookie('accessToken'), clearCookie('refreshToken')];
  return { statusCode: 200, headers: { 'Set-Cookie': cookies, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
};
