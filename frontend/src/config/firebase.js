import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCUEUQhK_ipy4-fqq1Y2vLqimoE3gHgdRU",
  authDomain: "ai-crm-f73a5.firebaseapp.com",
  projectId: "ai-crm-f73a5",
  storageBucket: "ai-crm-f73a5.firebasestorage.app",
  messagingSenderId: "579902862267",
  appId: "1:579902862267:web:57b2eab6141b3f2d3f8a9e",
  measurementId: "G-RB5LBLGBCC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
