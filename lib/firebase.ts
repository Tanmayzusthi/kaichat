// Using compat layer for app initialization to resolve module resolution errors,
// while the rest of the app uses the modern modular API.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/auth';

import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD9BKTXxZTjKKoEzE7ExOm9iCZSabcOtd0",
  authDomain: "kaitalk-lite.firebaseapp.com",
  projectId: "kaitalk-lite",
  storageBucket: "kaitalk-lite.appspot.com",
  messagingSenderId: "366931430325",
  appId: "1:366931430325:web:847d87744bbc05dca567fc"
};

let app: firebase.app.App | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingKeys.length > 0) {
    console.warn(`⚠️ Firebase config missing. Please set environment variables in .env.local. Missing keys: ${missingKeys.join(', ')}`);
} else {
  try {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
    
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);

  } catch (error) {
    console.error("🚨 Firebase initialization failed:", error);
    app = null;
    db = null;
    storage = null;
    auth = null;
  }
}

export { app, db, storage, auth };
