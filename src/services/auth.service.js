// ================================================
// SALDO FÁCIL — Authentication Service
// ================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { auth, db, googleProvider } from '../firebase/config.js';

// ─── Register ──────────────────────────────────────
export async function registerUser(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update display name
  await updateProfile(user, { displayName: name });

  // Save user profile to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    createdAt: serverTimestamp()
  });

  return user;
}

// ─── Login ──────────────────────────────────────────
export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ─── Google Sign-In ──────────────────────────────────
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Create profile doc only on first login
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name:      user.displayName || 'Usuário',
      email:     user.email,
      createdAt: serverTimestamp()
    });
  }

  return user;
}

// ─── Logout ─────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ─── Password Reset ──────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ─── Auth State Observer ─────────────────────────────
export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── Get Current User ────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser;
}
