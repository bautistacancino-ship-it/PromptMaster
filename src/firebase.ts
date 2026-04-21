import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigLegacy from '../firebase-applet-config.json';

// Use environment variables if present, otherwise fallback to legacy config (temporarily)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLegacy.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLegacy.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLegacy.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLegacy.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLegacy.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLegacy.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigLegacy.firestoreDatabaseId,
};

// Security check: Ensure we are not using placeholders
const isConfigValid = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PLACEHOLDER');

// Initialize Firebase
let app;
let dbInstance: any;

try {
  if (isConfigValid) {
    app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const db = dbInstance;
