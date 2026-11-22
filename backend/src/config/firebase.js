import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config();

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCUEUQhK_ipy4-fqq1Y2vLqimoE3gHgdRU",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "ai-crm-f73a5.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "ai-crm-f73a5",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "ai-crm-f73a5.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "579902862267",
  appId: process.env.FIREBASE_APP_ID || "1:579902862267:web:57b2eab6141b3f2d3f8a9e",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-RB5LBLGBCC"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize backend service authentication
export const initBackendAuth = async () => {
  const email = process.env.FIREBASE_SERVICE_EMAIL || "system-backend@ai-crm.internal";
  const password = process.env.FIREBASE_SERVICE_PASSWORD || "BackendSystemSecret2026!";
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`[Firebase Auth] Backend service authenticated (UID: ${cred.user.uid})`);
    return cred.user;
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        console.log(`[Firebase Auth] Backend service account created (UID: ${cred.user.uid})`);
        return cred.user;
      } catch (createErr) {
        console.warn(`[Firebase Auth] Account creation note:`, createErr.message);
      }
    } else {
      console.warn(`[Firebase Auth] Backend authentication note:`, err.message);
    }
    return null;
  }
};

console.log(`[Firebase] Initialized with Project ID: ${firebaseConfig.projectId}`);
