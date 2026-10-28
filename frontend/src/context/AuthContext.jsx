import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen directly to Firebase Authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const freshToken = await firebaseUser.getIdToken();
          localStorage.setItem('aicrm_token', freshToken);
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser || {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Wholesale Director',
            role: 'Wholesale & Retail Director'
          });
        } else {
          // Unauthenticated or logged out
          setUser(null);
          localStorage.removeItem('aicrm_token');
          localStorage.removeItem('aicrm_user');
        }
      } catch (err) {
        console.warn('[AuthContext] Auth state change warning:', err);
      } finally {
        setLoading(false);
      }
    });

    // 2. Token refresh listener
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const freshToken = await firebaseUser.getIdToken();
          localStorage.setItem('aicrm_token', freshToken);
        } catch (tokenErr) {
          console.warn('[AuthContext] Token refresh notice:', tokenErr);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  const login = async (email, password, rememberMe = true) => {
    const res = await authService.login(email, password, rememberMe);
    setUser(res.user);
    return res;
  };

  const signup = async (name, email, password, company) => {
    const res = await authService.signup(name, email, password, company);
    setUser(res.user);
    return res;
  };

  const sendPasswordReset = async (email) => {
    return await authService.sendPasswordReset(email);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    sendPasswordReset,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
