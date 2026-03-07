import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { isUnauthenticatedError } from '@/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        if (isUnauthenticatedError(error)) {
          setUser(null);
        } else {
          console.error('Unexpected auth error', error);
          setUser(null);
        }
      }
    };
    fetchUser();
  }, [location]);

  const refreshAuth = React.useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        setUser(null);
      } else {
        console.error('Unexpected auth error', error);
        setUser(null);
      }
    }
  }, []);

  const clearAuth = React.useCallback(() => {
    setUser(null);
  }, []);

  const value = {
    user,
    isDemoMode: user === null,
    isFullMode: user !== null,
    refreshAuth,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
