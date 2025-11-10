// src/context/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { clearSession, markSessionStart } from '../api'; // ⬅️ make sure these are exported from api.ts

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

// keep in sync with api.ts
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const startedAtRaw = localStorage.getItem('sessionStartedAt');

      if (savedToken && savedUser) {
        let expired = false;

        if (startedAtRaw) {
          const startedAt = Number(startedAtRaw);
          if (Number.isFinite(startedAt)) {
            if (Date.now() - startedAt > SESSION_MAX_AGE_MS) {
              expired = true;
            }
          }
        }

        if (expired) {
          // too old → nuke everything
          clearSession();
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
      try {
        clearSession();
      } catch {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);

    // persist as before
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // start (or reset) the 7-day window
    markSessionStart();

    // used by your dashboard to show post-login stuff
    sessionStorage.setItem('__justLoggedIn', '1');
  };

  const logout = () => {
    // centralised cleanup (tokens + userId + sessionStartedAt)
    try {
      clearSession();
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionStartedAt');
    }

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
