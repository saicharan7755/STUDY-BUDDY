import { verify } from 'jsonwebtoken';
import { parse } from 'cookie';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const cookieHeader = event.headers?.cookie || '';
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    return { statusCode: 200, body: JSON.stringify({ user: null }) };
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_secret';
  try {
    const payload = verify(accessToken, jwtSecret);
    const user = { id: payload.sub, email: payload.email };
    return { statusCode: 200, body: JSON.stringify({ user }) };
  } catch (err) {
    return { statusCode: 200, body: JSON.stringify({ user: null }) };
  }
};
