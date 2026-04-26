import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { setAccessToken, clearAuth } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'song_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('song:auth-expired', handleExpired);
    return () => window.removeEventListener('song:auth-expired', handleExpired);
  }, []);

  const setAuth = useCallback((accessToken: string, newUser: User) => {
    setAccessToken(accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
