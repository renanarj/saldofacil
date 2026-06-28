// ================================================
// SALDO FÁCIL — Firebase Configuration
// ================================================
// Replace the placeholder values below with your
// own Firebase project credentials.
//
// How to get your config:
//   1. Go to https://console.firebase.google.com
//   2. Create (or open) your project
//   3. Project Settings → General → Your apps → Add web app
//   4. Copy the firebaseConfig object here
//
// Required Firebase services to enable:
//   - Authentication (Email/Password + Google)
//   - Cloud Firestore
//   - Hosting
// ================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyD7P8vcLtLj61Fy8EZpB1SU9mg0zjZd2Gk",
  authDomain:        "saldo-facil-14e97.firebaseapp.com",
  projectId:         "saldo-facil-14e97",
  storageBucket:     "saldo-facil-14e97.firebasestorage.app",
  messagingSenderId: "796253943059",
  appId:             "1:796253943059:web:5c73feddbcd387360a96e6",
  measurementId:     "G-HTS74H97J6"
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
