const refreshEndpoint = '/api/auth-refresh';

const dispatchSessionExpiry = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cramSessionExpired'));
  }
};

export default async function fetchWithAuth(resource, options = {}) {
  const controller = options.signal || new AbortController();
  const opts = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    signal: controller.signal,
  };

  let res;

  try {
    res = await fetch(resource, opts);
  } catch (error) {
    dispatchSessionExpiry();
    throw error;
  }

  if (res.status === 401) {
    try {
      const refreshRes = await fetch(refreshEndpoint, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        res = await fetch(resource, opts);
      } else {
        dispatchSessionExpiry();
      }
    } catch (e) {
      dispatchSessionExpiry();
      console.error('Refresh failed', e);
    }
  }

  if (res.status === 401) {
    dispatchSessionExpiry();
  }

  return res;
}
