// ================================================
// SALDO FÁCIL — Firestore Service
// CRUD operations for all data models
// ================================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from '../firebase/config.js';

// ─── Helpers ────────────────────────────────────────
function txCol(uid)      { return collection(db, 'transactions', uid, 'items'); }
function goalCol(uid)    { return collection(db, 'goals',        uid, 'items'); }
function cardCol(uid)    { return collection(db, 'cards',        uid, 'items'); }
function billCol(uid)    { return collection(db, 'fixedBills',   uid, 'items'); }

// Convert Firestore doc to plain object
function docToObj(snap) {
  return { id: snap.id, ...snap.data() };
}

// ═══════════════════════════════════════════════════
//  TRANSACTIONS
// ═══════════════════════════════════════════════════

export async function addTransaction(uid, data) {
  const ref = await addDoc(txCol(uid), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateTransaction(uid, id, data) {
  const ref = doc(txCol(uid), id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTransaction(uid, id) {
  await deleteDoc(doc(txCol(uid), id));
}

export async function getTransactions(uid) {
  const q = query(txCol(uid), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToObj);
}

export async function getTransactionsByMonth(uid, year, month) {
  // month is 1-indexed
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month,     1);
  const q = query(
    txCol(uid),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<',  Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToObj);
}

// ═══════════════════════════════════════════════════
//  GOALS
// ═══════════════════════════════════════════════════

export async function addGoal(uid, data) {
  const ref = await addDoc(goalCol(uid), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateGoal(uid, id, data) {
  await updateDoc(doc(goalCol(uid), id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGoal(uid, id) {
  await deleteDoc(doc(goalCol(uid), id));
}

export async function getGoals(uid) {
  const snap = await getDocs(goalCol(uid));
  return snap.docs.map(docToObj);
}

// ═══════════════════════════════════════════════════
//  CREDIT CARDS
// ═══════════════════════════════════════════════════

export async function addCard(uid, data) {
  const ref = await addDoc(cardCol(uid), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateCard(uid, id, data) {
  await updateDoc(doc(cardCol(uid), id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCard(uid, id) {
  await deleteDoc(doc(cardCol(uid), id));
}

export async function getCards(uid) {
  const snap = await getDocs(cardCol(uid));
  return snap.docs.map(docToObj);
}

// ═══════════════════════════════════════════════════
//  FIXED BILLS
// ═══════════════════════════════════════════════════

export async function addFixedBill(uid, data) {
  const ref = await addDoc(billCol(uid), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateFixedBill(uid, id, data) {
  await updateDoc(doc(billCol(uid), id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteFixedBill(uid, id) {
  await deleteDoc(doc(billCol(uid), id));
}

export async function getFixedBills(uid) {
  const snap = await getDocs(billCol(uid));
  return snap.docs.map(docToObj);
}

// ═══════════════════════════════════════════════════
//  USER PROFILE
// ═══════════════════════════════════════════════════

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}
