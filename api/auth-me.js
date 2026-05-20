import { verify } from 'jsonwebtoken';
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
