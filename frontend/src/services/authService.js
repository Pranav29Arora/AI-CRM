import { auth, db } from '../config/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { apiRequest } from './api.js';

/**
 * Maps Firebase Authentication error codes to clean, user-friendly messages.
 * Prevents leaking internal stack traces or configuration errors.
 */
export function mapAuthError(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or sign up.';
    case 'auth/wrong-password':
      return 'The email or password is incorrect. Please try again.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'The email or password is incorrect. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a password with at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily disabled. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please log in again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      if (err.message) {
        return err.message.replace(/^Firebase:\s*/, '').replace(/\s*\([^)]*\)\.?$/, '');
      }
      return 'An authentication error occurred. Please try again.';
  }
}

/**
 * Authentication service integrated with Firebase Authentication & Cloud Firestore.
 * Project: ai-crm-f73a5
 */
export const authService = {
  /**
   * Helper to write session token & user profile to persistent storage
   */
  setStoredSession(token, user, rememberMe = false) {
    if (token) {
      sessionStorage.setItem('aicrm_token', token);
      if (rememberMe) {
        localStorage.setItem('aicrm_token', token);
        localStorage.setItem('aicrm_remember_me', 'true');
      } else {
        localStorage.removeItem('aicrm_token');
        localStorage.removeItem('aicrm_remember_me');
      }
    }

    if (user) {
      sessionStorage.setItem('aicrm_user', JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem('aicrm_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('aicrm_user');
      }
    }
  },

  clearStoredSession() {
    sessionStorage.removeItem('aicrm_token');
    sessionStorage.removeItem('aicrm_user');
    localStorage.removeItem('aicrm_token');
    localStorage.removeItem('aicrm_user');
    localStorage.removeItem('aicrm_remember_me');
  },

  /**
   * Real user login via Firebase Authentication
   */
  async login(email, password, rememberMe = false) {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    try {
      // Use session persistence by default so closing browser logs out, unless user checked rememberMe
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      try {
        await setPersistence(auth, persistenceType);
      } catch (persistErr) {
        console.warn('[Firebase Auth] Persistence configuration notice:', persistErr.message);
      }

      console.log('[Firebase Auth] Authenticating with email:', email.trim());
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Retrieve or build user profile metadata
      let profile = {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'Wholesale Director',
        role: 'Wholesale & Retail Director',
        company: 'Apex Wholesale & Retail Enterprises',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          profile = { ...profile, ...userDoc.data(), id: user.uid, uid: user.uid };
        } else {
          // If first time login, store profile in Firestore
          await setDoc(doc(db, 'users', user.uid), profile);
        }
      } catch (err) {
        console.warn('[Firestore Profile Warning]:', err.message);
      }

      this.setStoredSession(token, profile, rememberMe);

      return {
        user: profile,
        token,
        message: 'Logged in via Firebase Authentication'
      };
    } catch (firebaseErr) {
      console.error('[Firebase Auth Error]:', firebaseErr.code, firebaseErr.message);
      throw new Error(mapAuthError(firebaseErr));
    }
  },

  /**
   * Real user sign-in via Google Authentication
   */
  async loginWithGoogle(rememberMe = false) {
    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      try {
        await setPersistence(auth, persistenceType);
      } catch (persistErr) {
        console.warn('[Firebase Google Auth] Persistence notice:', persistErr.message);
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      console.log('[Firebase Auth] Launching Google sign-in popup...');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();

      let profile = {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'Wholesale Director',
        role: 'Wholesale & Retail Director',
        company: 'Apex Wholesale & Retail Enterprises',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      };

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          profile = { ...profile, ...userDoc.data(), id: user.uid, uid: user.uid };
        } else {
          // If first time sign-in, save profile to Cloud Firestore
          await setDoc(doc(db, 'users', user.uid), profile);
        }
      } catch (err) {
        console.warn('[Firestore Profile Warning]:', err.message);
      }

      this.setStoredSession(token, profile, rememberMe);

      return {
        user: profile,
        token,
        message: 'Authenticated with Google via Firebase'
      };
    } catch (firebaseErr) {
      console.error('[Firebase Google Auth Error]:', firebaseErr.code, firebaseErr.message);
      throw new Error(mapAuthError(firebaseErr));
    }
  },

  /**
   * Real user registration via Firebase Authentication
   */
  async signup(name, email, password, company = '') {
    if (!name || !name.trim()) {
      throw new Error('Please enter your full name.');
    }
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    try {
      console.log('[Firebase Auth] Creating user account:', email.trim());
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      const user = userCredential.user;

      // Update user display name in Firebase Authentication
      await updateProfile(user, { displayName: name.trim() });
      const token = await user.getIdToken();

      // Create user profile in Firestore (NEVER store password)
      const profile = {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        role: 'Sales Executive',
        company: company.trim() || 'Retail & Wholesale Enterprise',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', user.uid), profile);
      } catch (err) {
        console.warn('[Firestore Profile Write Warning]:', err.message);
      }

      this.setStoredSession(token, profile, false);

      return {
        user: profile,
        token,
        message: 'Account created via Firebase Authentication'
      };
    } catch (firebaseErr) {
      console.error('[Firebase Auth Signup Error]:', firebaseErr.code, firebaseErr.message);
      throw new Error(mapAuthError(firebaseErr));
    }
  },

  /**
   * Password recovery using Firebase Authentication's sendPasswordResetEmail
   */
  async sendPasswordReset(email) {
    if (!email || !email.trim() || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    try {
      console.log('[Firebase Auth] Sending password reset email to:', email.trim());
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: 'Password reset link sent! Please check your email inbox and spam folder.'
      };
    } catch (err) {
      console.error('[Firebase Password Reset Error]:', err.code, err.message);
      if (err.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      if (err.code === 'auth/user-not-found') {
        // Return standard confirmation to prevent email enumeration attacks
        return {
          success: true,
          message: 'If an account exists for this email, a password reset link has been sent.'
        };
      }
      if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many password reset requests. Please wait a moment and try again.');
      }
      throw new Error(mapAuthError(err));
    }
  },

  /**
   * Sign out of Firebase Authentication
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Sign out notice:', err.message);
    }
    this.clearStoredSession();
  },

  /**
   * Retrieve current user profile
   */
  async getCurrentUser() {
    // Check Firebase Auth state
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const user = { ...userDoc.data(), id: auth.currentUser.uid, uid: auth.currentUser.uid };
          this.setStoredSession(null, user);
          return user;
        }
      } catch (err) {
        console.warn('Current user profile fetch warning:', err.message);
      }
      return {
        id: auth.currentUser.uid,
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Wholesale Director',
        role: 'Wholesale & Retail Director',
        company: 'Apex Wholesale & Retail Enterprises'
      };
    }

    const stored = this.getStoredUser();
    if (stored) return stored;

    return null;
  },

  /**
   * Verified demo credentials registered in Firebase Authentication
   */
  async getDemoCredentials() {
    return {
      credentials: null
    };
  },

  async resetData() {
    return await apiRequest('/auth/reset-data', { method: 'POST' });
  },

  getStoredUser() {
    try {
      const isSessionActive = sessionStorage.getItem('aicrm_user');
      if (isSessionActive) return JSON.parse(isSessionActive);
      const isRemembered = localStorage.getItem('aicrm_remember_me') === 'true';
      if (isRemembered) {
        const stored = localStorage.getItem('aicrm_user');
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    } catch {
      return null;
    }
  },

  getToken() {
    const sessionToken = sessionStorage.getItem('aicrm_token');
    if (sessionToken) return sessionToken;
    const isRemembered = localStorage.getItem('aicrm_remember_me') === 'true';
    if (isRemembered) {
      return localStorage.getItem('aicrm_token');
    }
    return null;
  }
};
