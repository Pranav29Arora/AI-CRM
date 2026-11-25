import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged, onIdTokenChanged, signOut } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is an active session in this tab/window, or explicit rememberMe
    const isSessionActive = !!sessionStorage.getItem('aicrm_token');
    const isRemembered = localStorage.getItem('aicrm_remember_me') === 'true';

    // If starting a fresh site visit without an active session or rememberMe:
    // clear any lingering persistent auth so user starts completely logged out on the Landing Page
    if (!isSessionActive && !isRemembered) {
      authService.clearStoredSession();
      signOut(auth).catch(() => {});
      setUser(null);
      setLoading(false);
      return;
    }

    // 1. Listen directly to Firebase Authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const freshToken = await firebaseUser.getIdToken();
          const currentUser = await authService.getCurrentUser();
          const profile = currentUser || {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Wholesale Director',
            role: 'Wholesale & Retail Director'
          };

          authService.setStoredSession(freshToken, profile, isRemembered);
          setUser(profile);
        } else {
          // Unauthenticated or logged out
          setUser(null);
          authService.clearStoredSession();
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
          authService.setStoredSession(freshToken, null, isRemembered);
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

  const login = async (email, password, rememberMe = false) => {
    const res = await authService.login(email, password, rememberMe);
    setUser(res.user);
    return res;
  };

  const loginWithGoogle = async (rememberMe = false) => {
    const res = await authService.loginWithGoogle(rememberMe);
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
    loginWithGoogle,
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
