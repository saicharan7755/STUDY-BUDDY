import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export const AuthContext = createContext(undefined);

const AUTH_EVENT_KEY = 'cramAI_auth_event';
const AUTH_CHECK_ENDPOINT = '/.netlify/functions/auth-me';
const AUTH_LOGIN_ENDPOINT = '/.netlify/functions/auth-login';
const AUTH_LOGOUT_ENDPOINT = '/.netlify/functions/auth-logout';
const AUTH_REFRESH_ENDPOINT = '/.netlify/functions/auth-refresh';
const TOKEN_REFRESH_MS = 12 * 60 * 1000; // refresh 3 minutes before expiry

const broadcastAuthState = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify({ ts: Date.now() }));
  } catch (error) {
    console.warn('Unable to broadcast auth state to other tabs', error);
  }

  window.dispatchEvent(new CustomEvent('cramAuthStateChanged'));
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const error = new Error(errorBody || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const AuthProvider = ({ children }) => {
  // The auth state starts in loading and never assumes unauthenticated.
  // This prevents route wrappers from redirecting before the backend auth check completes.
  const [authStatus, setAuthStatus] = useState('loading');
  const [user, setUserState] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [accountDisabled, setAccountDisabled] = useState(false);
  const [authError, setAuthError] = useState(null);
  const refreshTimerRef = useRef(null);
  const userRef = useRef(null);

  const setUser = useCallback((nextUser) => {
    userRef.current = nextUser;
    setUserState(nextUser);
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const refreshAuthToken = useCallback(async () => {
    try {
      const response = await fetch(AUTH_REFRESH_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Unable to refresh session');
      }

      return true;
    } catch (error) {
      console.error('Token refresh failed', error);
      setSessionExpired(true);
      return false;
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer();

    refreshTimerRef.current = window.setTimeout(async () => {
      const ok = await refreshAuthToken();
      if (ok) {
        scheduleRefresh();
      }
    }, TOKEN_REFRESH_MS);
  }, [clearRefreshTimer, refreshAuthToken]);

  const fetchAuthStatus = useCallback(async () => {
    if (authStatus !== 'loading') {
      setAuthStatus('loading');
    }

    setAuthError(null);

    try {
      const data = await fetchJson(AUTH_CHECK_ENDPOINT, { method: 'GET' });

      if (data?.user) {
        setUser(data.user);
        setAccountDisabled(false);
        setAuthStatus('authenticated');
        scheduleRefresh();
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      if (error.status === 403) {
        setUser(null);
        setAccountDisabled(true);
        setAuthStatus('unauthenticated');
        return;
      }

      console.error('Auth status check failed', error);
      setAuthError(error.message || 'Unable to verify auth status.');
      setAuthStatus('loading');
    }
  }, [authStatus, scheduleRefresh]);

  useEffect(() => {
    fetchAuthStatus();

    const handleAuthStateChanged = () => {
      fetchAuthStatus();
    };

    const handleStorageEvent = (event) => {
      if (event.key === AUTH_EVENT_KEY) {
        fetchAuthStatus();
      }
    };

    const handleSessionExpired = () => {
      setSessionExpired(true);
    };

    window.addEventListener('cramAuthStateChanged', handleAuthStateChanged);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('cramSessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('cramAuthStateChanged', handleAuthStateChanged);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('cramSessionExpired', handleSessionExpired);
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, fetchAuthStatus]);

  const login = useCallback(
    async (email, password) => {
      if (!email?.trim() || !password) {
        throw new Error('Enter your email and password.');
      }

      try {
        const data = await fetchJson(AUTH_LOGIN_ENDPOINT, {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        });

        setUser(data.user || null);
        setAuthStatus('authenticated');
        setAccountDisabled(false);
        setAuthError(null);
        scheduleRefresh();
        broadcastAuthState();
        return data.user;
      } catch (error) {
        console.error('Login failed', error);
        if (error instanceof TypeError) {
          const networkError = new Error('Connection issue. Please check your internet and try again.');
          networkError.code = 'auth/network-request-failed';
          throw networkError;
        }

        const err = new Error(error.message || 'Sign in failed');
        if (error.status === 401) {
          err.code = 'auth/wrong-password';
        }
        throw err;
      }
    },
    [scheduleRefresh]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(AUTH_LOGOUT_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      clearRefreshTimer();
      setUser(null);
      setAuthStatus('unauthenticated');
      broadcastAuthState();
    }
  }, [clearRefreshTimer]);

  const signup = useCallback(async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error('Enter your email and a password.');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    // Demo-only sign-up flow. Replace with a real registration endpoint when available.
    const newUser = { id: `user-${Date.now()}`, email: email.trim() };
    setUser(newUser);
    setAuthStatus('authenticated');
    setAccountDisabled(false);
    setAuthError(null);
    scheduleRefresh();
    broadcastAuthState();
    return newUser;
  }, [scheduleRefresh]);

  const retryAuth = useCallback(() => {
    setAuthError(null);
    setAuthStatus('loading');
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authStatus,
      isLoading: authStatus === 'loading',
      isAuthenticated: authStatus === 'authenticated',
      sessionExpired,
      accountDisabled,
      authError,
      login,
      logout,
      signup,
      retryAuth,
      clearSessionExpired,
      signInWithEmail: login,
      signUpWithEmail: signup,
      signIn: async () => {
        throw new Error('Google sign-in is currently unavailable. Please use email login.');
      },
    }),
    [accountDisabled, authError, authStatus, clearSessionExpired, login, logout, retryAuth, sessionExpired, signup, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
