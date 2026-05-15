import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWithCreds = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
    return res;
  };

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetchWithCreds('/.netlify/functions/auth-me', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking auth status', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  const signInWithEmail = async (email, password) => {
    try {
      const res = await fetchWithCreds('/.netlify/functions/auth-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Sign in failed');
      }
      const data = await res.json();
      setUser(data.user || null);
      return data.user;
    } catch (err) {
      console.error('Sign-in error', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fetchWithCreds('/.netlify/functions/auth-logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Error signing out', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signOut, isAuthenticated: Boolean(user) }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
