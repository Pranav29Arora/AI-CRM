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
  browserSessionPersistence
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
   * Real user login via Firebase Authentication
   */
  async login(email, password, rememberMe = true) {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    try {
      // Set persistence based on remember me choice
      try {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
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

      localStorage.setItem('aicrm_token', token);
      localStorage.setItem('aicrm_user', JSON.stringify(profile));

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

      localStorage.setItem('aicrm_token', token);
      localStorage.setItem('aicrm_user', JSON.stringify(profile));

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
    localStorage.removeItem('aicrm_token');
    localStorage.removeItem('aicrm_user');
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
          localStorage.setItem('aicrm_user', JSON.stringify(user));
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
      credentials: {
        email: 'demo@aicrm.com',
        password: 'demo123',
        role: 'Wholesale & Retail Director',
        description: 'Active Firebase Authentication account with pre-seeded products in Cloud Firestore.'
      }
    };
  },

  async resetData() {
    return await apiRequest('/auth/reset-data', { method: 'POST' });
  },

  getStoredUser() {
    try {
      const stored = localStorage.getItem('aicrm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('aicrm_token');
  }
};
