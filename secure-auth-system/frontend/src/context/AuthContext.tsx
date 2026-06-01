import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setAccessToken } from '../services/api.js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Silent token refresh check on mount
  const checkActiveSession = async () => {
    try {
      const res = await api.post('/auth/refresh');
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      
      // Fetch verified user profile details
      const profileRes = await api.get('/user/profile');
      setUser(profileRes.data.user);
    } catch (e) {
      // Refresh token absent or expired, user is guest
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveSession();

    // Catch session invalidations from Axios interceptors
    const handleExpiredSession = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth-session-expired', handleExpiredSession);
    return () => {
      window.removeEventListener('auth-session-expired', handleExpiredSession);
    };
  }, []);

  // 2. Background Token Rotations (Interval triggers silent refresh every 14 mins)
  useEffect(() => {
    if (!user) return;

    const rotationInterval = setInterval(async () => {
      try {
        const res = await api.post('/auth/refresh');
        setAccessToken(res.data.accessToken);
      } catch (e) {
        // If refresh fails in background, invalidate session
        setUser(null);
        setAccessToken(null);
      }
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(rotationInterval);
  }, [user]);

  // -------------------------------------------------------------
  // Authentication Action Implementations
  // -------------------------------------------------------------

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = res.data;
    setAccessToken(accessToken);
    setUser(userData);
  };

  const register = async (email: string, name: string, password: string) => {
    await api.post('/auth/register', { email, name, password });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (token: string, password: string) => {
    await api.post('/auth/reset-password', { token, password });
  };

  const verifyEmail = async (token: string) => {
    await api.get(`/auth/verify-email?token=${token}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be invoked within an AuthProvider context.');
  }
  return context;
};
