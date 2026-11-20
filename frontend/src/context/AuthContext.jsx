import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../api/authApi.js';
import { UNAUTHORIZED_EVENT, USER_KEY, tokenStorage } from '../api/client.js';

const AuthContext = createContext(null);

function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [user, setUser] = useState(() => (tokenStorage.get() ? readCachedUser() : null));
  const [isInitializing, setIsInitializing] = useState(() => Boolean(tokenStorage.get()));
  const [sessionNotice, setSessionNotice] = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const persistSession = useCallback((nextToken, nextUser) => {
    tokenStorage.set(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setSessionNotice('');
    setLogoutMessage('');
  }, []);

  const clearSession = useCallback((notice = '', logoutNotice = '') => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setWelcomeMessage('');
    if (notice) setSessionNotice(notice);
    setLogoutMessage(logoutNotice);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const storedToken = tokenStorage.get();

    if (!storedToken) {
      setIsInitializing(false);
      return undefined;
    }

    getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        setUser(me);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 401) {
          clearSession('Your session has expired. Please sign in again.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession('Your session has expired. Please sign in again.');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      const { token: nextToken, user: nextUser } = await loginUser(credentials);
      persistSession(nextToken, nextUser);
      setWelcomeMessage(`Welcome back, ${nextUser?.name || 'User'}`);
      return nextUser;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const { token: nextToken, user: nextUser } = await registerUser(payload);
      persistSession(nextToken, nextUser);
      return nextUser;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession('', 'Logged out successfully');
  }, [clearSession]);

  const clearSessionNotice = useCallback(() => {
    setSessionNotice('');
    setLogoutMessage('');
  }, []);

  const clearWelcomeMessage = useCallback(() => {
    setWelcomeMessage('');
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isInitializing,
    sessionNotice,
    logoutMessage,
    welcomeMessage,
    clearSessionNotice,
    clearWelcomeMessage,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
