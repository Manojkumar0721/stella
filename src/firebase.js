import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Real Stella Firebase production credentials with environment variable overrides
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAqK-zOhN_dM9NcEKCS9TzzUW_ePBpSrBc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stella-f1028.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stella-f1028",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stella-f1028.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "178492599201",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:178492599201:web:1a44a6744a421f6a6239e0"
};

// Initialize Firebase App & Services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
