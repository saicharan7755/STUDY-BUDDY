function clearCookie(name) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=0`;
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