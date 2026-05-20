/**
 * Vercel API function to log frontend errors
 * Called by ErrorBoundary when React errors occur
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, stack, componentStack } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing error message' });
  }

  console.error('[Frontend Error Log]', {
    message,
    stack,
    componentStack,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({ ok: true, logged: true });
}
