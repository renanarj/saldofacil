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
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
