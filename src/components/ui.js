// ================================================
// SALDO FÁCIL — UI Components / Utilities
// ================================================

// ─── Toast Notifications ────────────────────────────

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'default', duration = 3500) {
  const container = getToastContainer();

  const icons = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    default: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'default' ? type : ''}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.default}</span>
    <span class="toast-text">${message}</span>
    <button class="toast-close" aria-label="Fechar">✕</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);

  const timer = setTimeout(() => removeToast(toast), duration);
  toast._timer = timer;
  return toast;
}

function removeToast(toast) {
  if (toast._timer) clearTimeout(toast._timer);
  toast.classList.add('removing');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// ─── Modal Management ───────────────────────────────

export function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Trap focus
  const firstInput = overlay.querySelector('input, button, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 300);
}

export function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

export function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => {
    m.classList.remove('active');
  });
  document.body.style.overflow = '';
}

// Close modal when clicking overlay background
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeAllModals();
  }
});

// ─── Loading Overlay ─────────────────────────────────

export function showLoading(message = '') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-logo">💰 Saldo Fácil</div>
      <div class="spinner"></div>
      ${message ? `<p style="color:var(--c-text-2);font-size:var(--fs-sm)">${message}</p>` : ''}
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
  }
}

// ─── Form Validation ─────────────────────────────────

export function validateForm(fields) {
  let valid = true;
  fields.forEach(({ input, rule, message }) => {
    const group = input.closest('.form-group');
    const error = group?.querySelector('.form-error');
    const passes = rule(input.value.trim());
    if (!passes) {
      group?.classList.add('has-error');
      if (error) error.textContent = message;
      valid = false;
    } else {
      group?.classList.remove('has-error');
    }
  });
  return valid;
}

export function clearFormErrors(formEl) {
  formEl.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
}

// ─── Currency Formatting ──────────────────────────────

export function formatCurrency(value, showSign = false) {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (showSign && value > 0) return `+R$ ${formatted}`;
  if (showSign && value < 0) return `-R$ ${formatted}`;
  return `R$ ${formatted}`;
}

export function parseCurrency(str) {
  return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// ─── Date Formatting ──────────────────────────────────

export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  const today    = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today))     return 'Hoje';
  if (isSameDay(d, yesterday)) return 'Ontem';

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

export function monthLabel(year, month) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ─── Debounce ─────────────────────────────────────────

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Confirm Dialog ───────────────────────────────────

export function confirmDialog(title, message) {
  return new Promise(resolve => {
    let overlay = document.getElementById('confirm-dialog');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'confirm-dialog';
      overlay.className = 'modal-overlay center';
      overlay.innerHTML = `
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <h3 class="modal-title" id="confirm-title"></h3>
          <p id="confirm-message" style="text-align:center;color:var(--c-text-2);margin-bottom:var(--sp-6);font-size:var(--fs-base)"></p>
          <div style="display:flex;gap:var(--sp-3)">
            <button id="confirm-cancel" class="btn btn-outline btn-full">Cancelar</button>
            <button id="confirm-ok"     class="btn btn-danger   btn-full">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    overlay.querySelector('#confirm-title').textContent = title;
    overlay.querySelector('#confirm-message').textContent = message;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    const ok = overlay.querySelector('#confirm-ok');
    const cancel = overlay.querySelector('#confirm-cancel');
    const bg = overlay;

    function cleanup(result) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      bg.removeEventListener('click', onBg);
      resolve(result);
    }

    function onOk()     { cleanup(true);  }
    function onCancel() { cleanup(false); }
    function onBg(e)    { if (e.target === bg) cleanup(false); }

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    bg.addEventListener('click', onBg);
  });
}
