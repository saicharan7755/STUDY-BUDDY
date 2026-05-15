const refreshEndpoint = '/.netlify/functions/auth-refresh';

export default async function fetchWithAuth(resource, options = {}) {
  const controller = options.signal || new AbortController();
  const opts = { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options, signal: controller.signal };

  let res = await fetch(resource, opts);

  if (res.status === 401) {
    // Try to refresh the access token
    try {
      const refreshRes = await fetch(refreshEndpoint, { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        // retry original request once
        res = await fetch(resource, opts);
      }
    } catch (e) {
      // ignore and fall through to return the 401
      console.error('Refresh failed', e);
    }
  }

  return res;
}
