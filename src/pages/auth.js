// ================================================
// SALDO FÁCIL — Auth Page Controller
// ================================================

import { registerUser, loginUser, loginWithGoogle, resetPassword, observeAuth } from '../services/auth.service.js';
import { showToast } from '../components/ui.js';

// ─── Auth State Guard ────────────────────────────────
observeAuth((user) => {
  if (user) {
    // Already logged in — go straight to app
    window.location.replace('/app.html');
  }
});

// ─── Tab Switching ────────────────────────────────────
const tabs      = document.querySelectorAll('.auth-tab');
const viewLogin    = document.getElementById('view-login');
const viewRegister = document.getElementById('view-register');
const viewForgot   = document.getElementById('view-forgot');
const authTabs     = document.getElementById('auth-tabs');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    viewLogin.classList.toggle('hidden', target !== 'login');
    viewRegister.classList.toggle('hidden', target !== 'register');
  });
});

// ─── Show/Hide Forgot ────────────────────────────────
document.getElementById('btn-goto-forgot').addEventListener('click', () => {
  viewLogin.classList.add('hidden');
  viewRegister.classList.add('hidden');
  viewForgot.classList.remove('hidden');
  authTabs.classList.add('hidden');
});

document.getElementById('btn-back-to-login').addEventListener('click', () => {
  viewForgot.classList.add('hidden');
  viewLogin.classList.remove('hidden');
  authTabs.classList.remove('hidden');
  tabs[0].classList.add('active');
  tabs[1].classList.remove('active');
});

// ─── Password Toggle ─────────────────────────────────
function setupToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁️' : '🙈';
  });
}
setupToggle('toggle-login-pw', 'login-password');
setupToggle('toggle-reg-pw',   'reg-password');

// ─── Helpers ─────────────────────────────────────────
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('btn-loading', loading);
}

function getErrorMessage(code) {
  const messages = {
    'auth/user-not-found':       'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password':       'Senha incorreta. Tente novamente.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password':        'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-email':        'E-mail inválido.',
    'auth/too-many-requests':    'Muitas tentativas. Tente novamente mais tarde.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/invalid-credential':   'E-mail ou senha incorretos.',
  };
  return messages[code] || 'Ocorreu um erro. Tente novamente.';
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

// ─── Login Form ──────────────────────────────────────
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('btn-login');

  // Validate
  let valid = true;
  const emailGroup = document.getElementById('login-email').closest('.form-group');
  const pwGroup    = document.getElementById('login-password').closest('.form-group');

  emailGroup.classList.toggle('has-error', !isValidEmail(email));
  pwGroup.classList.toggle('has-error', !password);
  if (!isValidEmail(email) || !password) return;

  setLoading(btn, true);
  try {
    await loginUser(email, password);
    // Auth observer will redirect
  } catch (err) {
    showToast(getErrorMessage(err.code), 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ─── Register Form ───────────────────────────────────
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const btn      = document.getElementById('btn-register');

  // Validate
  const nameGroup    = document.getElementById('reg-name').closest('.form-group');
  const emailGroup   = document.getElementById('reg-email').closest('.form-group');
  const pwGroup      = document.getElementById('reg-password').closest('.form-group');
  const confirmGroup = document.getElementById('reg-confirm').closest('.form-group');

  nameGroup.classList.toggle('has-error', !name);
  emailGroup.classList.toggle('has-error', !isValidEmail(email));
  pwGroup.classList.toggle('has-error', password.length < 6);
  confirmGroup.classList.toggle('has-error', password !== confirm);

  if (!name || !isValidEmail(email) || password.length < 6 || password !== confirm) return;

  setLoading(btn, true);
  try {
    await registerUser(name, email, password);
    // Auth observer will redirect
  } catch (err) {
    showToast(getErrorMessage(err.code), 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ─── Forgot Password Form ─────────────────────────────
document.getElementById('form-forgot').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const btn   = document.getElementById('btn-forgot');

  const emailGroup = document.getElementById('forgot-email').closest('.form-group');
  emailGroup.classList.toggle('has-error', !isValidEmail(email));
  if (!isValidEmail(email)) return;

  setLoading(btn, true);
  try {
    await resetPassword(email);
    showToast('Link de recuperação enviado! Verifique seu e-mail.', 'success');
    document.getElementById('form-forgot').reset();
  } catch (err) {
    showToast(getErrorMessage(err.code), 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ─── Google Sign-In ───────────────────────────────────
async function handleGoogleLogin(btnId) {
  const btn = document.getElementById(btnId);
  setLoading(btn, true);
  try {
    await loginWithGoogle();
    // Auth observer will redirect
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showToast(getErrorMessage(err.code), 'error');
    }
  } finally {
    setLoading(btn, false);
  }
}

document.getElementById('btn-google-login').addEventListener('click',    () => handleGoogleLogin('btn-google-login'));
document.getElementById('btn-google-register').addEventListener('click', () => handleGoogleLogin('btn-google-register'));
