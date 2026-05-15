import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const STORAGE_KEY = 'cramAI_user';

  const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [user, setUserState] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  const setUser = (nextUser) => {
    setUserState(nextUser);
    if (typeof window === 'undefined') return;
    try {
      if (nextUser) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Unable to persist auth user', error);
    }
  };

  const fetchWithCreds = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
    return res;
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    const check = async () => {
      try {
        const res = await fetchWithCreds('/.netlify/functions/auth-me', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || storedUser);
        } else {
          setUser(storedUser);
        }
      } catch (err) {
        console.error('Error checking auth status', err);
        setUser(storedUser);
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
        const errorMessage = json.error || 'Sign in failed';
        const error = new Error(errorMessage);
        if (json.code) {
          error.code = json.code;
        } else if (/wrong password/i.test(errorMessage)) {
          error.code = 'auth/wrong-password';
        } else if (/user not found|no account/i.test(errorMessage)) {
          error.code = 'auth/user-not-found';
        } else if (/locked|too many attempts/i.test(errorMessage)) {
          error.code = 'auth/account-locked';
        }
        throw error;
      }

      const data = await res.json();
      setUser(data.user || null);
      return data.user;
    } catch (err) {
      console.error('Sign-in error', err);
      if (err instanceof TypeError) {
        const networkError = new Error('Connection issue. Please check your internet and try again.');
        networkError.code = 'auth/network-request-failed';
        throw networkError;
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error('Enter your email and a password.');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const user = { id: `user-${Date.now()}`, email: email.trim() };
    setUser(user);
    return user;
  };

  const signOut = async () => {
    try {
      await fetchWithCreds('/.netlify/functions/auth-logout', { method: 'POST' });
    } catch (err) {
      console.error('Error signing out', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        isAuthenticated: Boolean(user),
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
