// ================================================
// SALDO FÁCIL — Main App Controller
// ================================================

import { observeAuth, logoutUser } from '../services/auth.service.js';
import {
  addTransaction, updateTransaction, deleteTransaction, getTransactionsByMonth, getTransactions,
  addGoal, updateGoal, deleteGoal, getGoals,
  addCard, updateCard, deleteCard, getCards,
  addFixedBill, updateFixedBill, deleteFixedBill, getFixedBills
} from '../services/firestore.service.js';
import {
  showToast, openModal, closeModal, closeAllModals, confirmDialog,
  formatCurrency, formatDate, formatDateInput, formatDateShort, monthLabel
} from '../components/ui.js';
import {
  areNotificationsEnabled, enableNotifications, disableNotifications, 
  initNotifications, setupNotificationHandler
} from '../services/notification.service.js';
import { Timestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ─── Categories ──────────────────────────────────────
const EXPENSE_CATEGORIES = [
  { id: 'food',      emoji: '🍔', label: 'Alimentação' },
  { id: 'market',    emoji: '🛒', label: 'Mercado'     },
  { id: 'transport', emoji: '🚗', label: 'Transporte'  },
  { id: 'fuel',      emoji: '⛽', label: 'Combustível' },
  { id: 'home',      emoji: '🏠', label: 'Casa'        },
  { id: 'health',    emoji: '💊', label: 'Saúde'       },
  { id: 'leisure',   emoji: '🎮', label: 'Lazer'       },
  { id: 'education', emoji: '📚', label: 'Estudos'     },
  { id: 'shopping',  emoji: '🛍', label: 'Compras'     },
  { id: 'pet',       emoji: '🐶', label: 'Pet'         },
  { id: 'streaming', emoji: '📺', label: 'Streaming'   },
  { id: 'other',     emoji: '📌', label: 'Outros'      }
];

const INCOME_CATEGORIES = [
  { id: 'salary',    emoji: '💼', label: 'Salário'     },
  { id: 'freelance', emoji: '💻', label: 'Freelance'   },
  { id: 'invest',    emoji: '📈', label: 'Investimentos'},
  { id: 'gift',      emoji: '🎁', label: 'Presente'    },
  { id: 'rent',      emoji: '🏢', label: 'Aluguel'     },
  { id: 'other',     emoji: '💰', label: 'Outros'      }
];

// ─── Payment Methods ──────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'pix',    emoji: '💳', label: 'Pix'      },
  { id: 'card',   emoji: '🏦', label: 'Cartão'   },
  { id: 'cash',   emoji: '💵', label: 'Dinheiro' }
];

// ─── App State ───────────────────────────────────────
let currentUser = null;
let currentSection = 'dashboard';
let balanceVisible = true;
let darkMode = false;

// Transactions
let allTransactions = [];
let historyMonth = new Date().getMonth() + 1;
let historyYear  = new Date().getFullYear();
let histFilter   = 'all';

// Reports
let repMonth = new Date().getMonth() + 1;
let repYear  = new Date().getFullYear();
let mainChart = null;
let currentChartType = 'by-category';

// ─── Auth Guard ──────────────────────────────────────
observeAuth(async (user) => {
  if (!user) {
    window.location.replace('/index.html');
    return;
  }
  currentUser = user;
  await initApp();
  hideLoadingOverlay();
});

// ─── Init ────────────────────────────────────────────
async function initApp() {
  // Load persisted preferences
  darkMode = localStorage.getItem('sf-dark') === 'true';
  applyTheme();

  // Populate UI with user info
  const name = currentUser.displayName || 'Usuário';
  document.getElementById('user-greeting').textContent = name.split(' ')[0];
  document.getElementById('profile-name').textContent  = name;
  document.getElementById('profile-email').textContent = currentUser.email || '';
  document.getElementById('profile-avatar').textContent = name.charAt(0).toUpperCase();

  // Set current month label
  document.getElementById('dash-month-label').textContent = monthLabel(historyYear, historyMonth);

  // Sync dark mode toggle
  document.getElementById('toggle-dark-mode').checked = darkMode;

  // Sync notifications toggle
  const notificationsEnabled = areNotificationsEnabled();
  document.getElementById('toggle-notifications').checked = notificationsEnabled;

  // Set today's date on transaction form
  document.getElementById('tx-date').value = formatDateInput(new Date());

  // Build category grid for expense (default)
  buildCategoryGrid('expense');

  // Initialize notifications
  initNotifications();
  setupNotificationHandler();

  // Load data
  await Promise.all([loadDashboard(), loadGoals()]);
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
  }
}

// ═══════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════

const navItems = document.querySelectorAll('.nav-item');
const sections = {
  dashboard: document.getElementById('section-dashboard'),
  history:   document.getElementById('section-history'),
  goals:     document.getElementById('section-goals'),
  reports:   document.getElementById('section-reports'),
  more:      document.getElementById('section-more'),
  cards:     document.getElementById('section-cards'),
  bills:     document.getElementById('section-bills')
};

function showSection(name) {
  // Hide all
  Object.values(sections).forEach(s => s.classList.add('hidden'));
  // Show target
  sections[name]?.classList.remove('hidden');
  currentSection = name;

  // Update nav active state (only for main nav items)
  const mainSections = ['dashboard', 'history', 'goals', 'reports', 'more'];
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === name);
  });

  // Show/hide FAB
  const hideFab = ['more', 'cards', 'bills'].includes(name);
  document.getElementById('fab-add').style.display = hideFab ? 'none' : '';

  // Lazy-load section data
  if (name === 'history') loadHistory();
  if (name === 'reports') loadReports();
  if (name === 'goals')   renderGoalsList();
  if (name === 'cards')   loadCards();
  if (name === 'bills')   loadBills();
}

navItems.forEach(item => {
  item.addEventListener('click', () => showSection(item.dataset.section));
});

// Quick actions on dashboard
document.querySelectorAll('.quick-action').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'expense') openTransactionModal('expense');
    else if (action === 'income') openTransactionModal('income');
    else if (action === 'history') showSection('history');
    else if (action === 'reports') showSection('reports');
  });
});

document.getElementById('btn-see-all-tx').addEventListener('click', () => showSection('history'));

// Sub-section navigation
document.getElementById('btn-goto-cards').addEventListener('click', () => showSection('cards'));
document.getElementById('btn-goto-bills').addEventListener('click', () => showSection('bills'));
document.getElementById('btn-back-from-cards').addEventListener('click', () => showSection('more'));
document.getElementById('btn-back-from-bills').addEventListener('click', () => showSection('more'));

// ═══════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════

async function loadDashboard() {
  try {
    allTransactions = await getTransactions(currentUser.uid);
    updateDashboardStats();
    renderRecentTransactions();
    renderInsights();
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function updateDashboardStats() {
  const now = new Date();
  const monthTx = allTransactions.filter(tx => {
    const d = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const income  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0);
  const balance = allTransactions.reduce((s, t) => t.type === 'income' ? s + t.value : s - t.value, 0);
  const net     = income - expense;

  const balanceEl = document.getElementById('balance-amount');
  balanceEl.textContent = balanceVisible ? formatCurrency(balance) : '••••••';
  balanceEl.classList.toggle('negative', net < 0);
  document.getElementById('dash-income').textContent    = formatCurrencyShort(income);
  document.getElementById('dash-expense').textContent   = formatCurrencyShort(expense);
  document.getElementById('dash-net').textContent       = formatCurrencyShort(net);
}

function formatCurrencyShort(v) {
  if (Math.abs(v) >= 1000) return `R$ ${(v/1000).toFixed(1)}k`;
  return formatCurrency(v);
}

function renderRecentTransactions() {
  const container = document.getElementById('recent-transactions');
  const recent = allTransactions.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--sp-8) var(--sp-4)">
        <div class="empty-state-icon">💸</div>
        <p class="empty-state-desc">Nenhum lançamento ainda. Registre seu primeiro gasto!</p>
      </div>`;
    return;
  }

  container.innerHTML = recent.map(tx => renderTransactionItem(tx)).join('');
  attachTransactionEvents(container);
}

function renderTransactionItem(tx) {
  const cats = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const cat  = cats.find(c => c.id === tx.category) || { emoji: '📌', label: tx.category || 'Outros' };
  const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
  const sign = tx.type === 'income' ? '+' : '-';
  const cls  = tx.type === 'income' ? 'income' : 'expense';
  
  // Get payment method info for expenses
  const paymentMethod = tx.type === 'expense' && tx.paymentMethod 
    ? PAYMENT_METHODS.find(m => m.id === tx.paymentMethod) 
    : null;

  return `
    <div class="transaction-item" data-id="${tx.id}">
      <div class="transaction-icon">${cat.emoji}</div>
      <div class="transaction-info">
        <div class="transaction-category">${cat.label}</div>
        <div class="transaction-desc">${tx.description || ''}</div>
        ${paymentMethod ? `<div class="transaction-payment-method">${paymentMethod.emoji} ${paymentMethod.label}</div>` : ''}
      </div>
      <div class="transaction-right">
        <div class="transaction-value ${cls}">${sign}${formatCurrency(tx.value)}</div>
        <div class="transaction-date">${formatDateShort(date)}</div>
      </div>
    </div>`;
}

// ─── Balance Toggle ──────────────────────────────────
document.getElementById('btn-toggle-balance').addEventListener('click', () => {
  balanceVisible = !balanceVisible;
  document.getElementById('btn-toggle-balance').textContent = balanceVisible ? '👁️' : '🙈';
  updateDashboardStats();
});

// ═══════════════════════════════════════════════════
//  INSIGHTS (Financial Intelligence)
// ═══════════════════════════════════════════════════

function renderInsights() {
  const container = document.getElementById('insights-container');
  const insights  = generateInsights();
  if (insights.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = insights.map(i => `
    <div class="insight-card ${i.type}">
      <span class="insight-icon">${i.icon}</span>
      <span class="insight-text">${i.message}</span>
    </div>`).join('');
}

function generateInsights() {
  const now = new Date();
  const thisMonth = allTransactions.filter(tx => {
    const d = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const lastMonth = allTransactions.filter(tx => {
    const d = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
  });

  const insights = [];
  const expenses = thisMonth.filter(t => t.type === 'expense');
  const incomes  = thisMonth.filter(t => t.type === 'income');
  const totalExp = expenses.reduce((s, t) => s + t.value, 0);
  const totalInc = incomes.reduce((s, t) => s + t.value, 0);
  const balance  = allTransactions.reduce((s, t) => t.type === 'income' ? s + t.value : s - t.value, 0);

  // Days left
  const daysLeft   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const dailySpend = totalExp / (now.getDate() || 1);
  if (balance > 0 && dailySpend > 0) {
    const daysMoneyLasts = Math.floor(balance / dailySpend);
    insights.push({
      type: 'default',
      icon: '📅',
      message: `Seu dinheiro deve durar aproximadamente <strong>${daysMoneyLasts} dias</strong> no ritmo atual.`
    });
  }

  // Category with most spending
  const byCat = {};
  expenses.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.value; });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const cats = EXPENSE_CATEGORIES;
    const cat  = cats.find(c => c.id === topCat[0]) || { emoji: '📌', label: topCat[0] };
    insights.push({
      type: 'warning',
      icon: cat.emoji,
      message: `Seu maior gasto este mês é <strong>${cat.label}</strong>: ${formatCurrency(topCat[1])}.`
    });
  }

  // Compare with last month
  const lastExp = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0);
  if (lastExp > 0 && totalExp > 0) {
    const diff = ((totalExp - lastExp) / lastExp) * 100;
    if (Math.abs(diff) >= 10) {
      insights.push({
        type: diff > 0 ? 'warning' : 'success',
        icon: diff > 0 ? '📈' : '📉',
        message: diff > 0
          ? `Você gastou <strong>${diff.toFixed(0)}% a mais</strong> do que no mês passado.`
          : `Você gastou <strong>${Math.abs(diff).toFixed(0)}% a menos</strong> do que no mês passado. Ótimo! 🎉`
      });
    }
  }

  return insights;
}

// ═══════════════════════════════════════════════════
//  TRANSACTION MODAL
// ═══════════════════════════════════════════════════

let selectedType     = 'expense';
let selectedCategory = 'food';
let selectedPaymentMethod = 'pix';
let editingTxId      = null;

document.getElementById('fab-add').addEventListener('click', () => openTransactionModal('expense'));
document.getElementById('modal-tx-close').addEventListener('click', () => closeModal('modal-transaction'));

function openTransactionModal(type = 'expense', txData = null) {
  editingTxId = txData?.id || null;
  selectedType = type;
  selectedCategory = txData?.category || (type === 'expense' ? 'food' : 'salary');
  selectedPaymentMethod = txData?.paymentMethod || 'pix';

  // Set title
  document.getElementById('modal-tx-title').textContent = txData ? 'Editar lançamento' : 'Registrar';

  // Set type
  document.getElementById('type-expense').classList.toggle('active-expense', type === 'expense');
  document.getElementById('type-expense').classList.remove('active-income');
  document.getElementById('type-income').classList.toggle('active-income', type === 'income');
  document.getElementById('type-income').classList.remove('active-expense');

  // Set values
  document.getElementById('tx-value').value       = txData?.value || '';
  document.getElementById('tx-description').value = txData?.description || '';
  document.getElementById('tx-date').value        = txData
    ? formatDateInput(txData.date instanceof Timestamp ? txData.date.toDate() : new Date(txData.date))
    : formatDateInput(new Date());
  document.getElementById('tx-id').value = txData?.id || '';

  buildCategoryGrid(type, selectedCategory);
  buildPaymentMethodGrid(selectedPaymentMethod);
  document.getElementById('payment-method-group').style.display = (type === 'expense' ? 'block' : 'none');
  openModal('modal-transaction');

  // Focus value input after modal opens
  setTimeout(() => document.getElementById('tx-value').focus(), 350);
}

// Type toggle
document.getElementById('type-expense').addEventListener('click', () => {
  selectedType = 'expense';
  document.getElementById('type-expense').classList.add('active-expense');
  document.getElementById('type-expense').classList.remove('active-income');
  document.getElementById('type-income').classList.remove('active-income', 'active-expense');
  selectedCategory = 'food';
  buildCategoryGrid('expense', 'food');
  document.getElementById('payment-method-group').style.display = 'block';
  buildPaymentMethodGrid('pix');
});

document.getElementById('type-income').addEventListener('click', () => {
  selectedType = 'income';
  document.getElementById('type-income').classList.add('active-income');
  document.getElementById('type-income').classList.remove('active-expense');
  document.getElementById('type-expense').classList.remove('active-expense', 'active-income');
  selectedCategory = 'salary';
  buildCategoryGrid('income', 'salary');
  document.getElementById('payment-method-group').style.display = 'none';
});

function buildCategoryGrid(type, selected = null) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const sel  = selected || cats[0].id;
  selectedCategory = sel;

  const grid = document.getElementById('category-grid');
  grid.innerHTML = cats.map(cat => `
    <div class="category-item ${cat.id === sel ? 'selected' : ''}" data-id="${cat.id}" role="button" tabindex="0">
      <span class="category-emoji">${cat.emoji}</span>
      <span class="category-label">${cat.label}</span>
    </div>`).join('');

  grid.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      grid.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selectedCategory = item.dataset.id;
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
}

function buildPaymentMethodGrid(selected = 'pix') {
  const grid = document.getElementById('payment-method-grid');
  if (!grid) return;

  selectedPaymentMethod = selected;

  grid.innerHTML = PAYMENT_METHODS.map(method => `
    <div class="payment-method-item ${method.id === selected ? 'selected' : ''}" data-id="${method.id}" role="button" tabindex="0">
      <span class="payment-emoji">${method.emoji}</span>
      <span class="payment-label">${method.label}</span>
    </div>`).join('');

  grid.querySelectorAll('.payment-method-item').forEach(item => {
    item.addEventListener('click', () => {
      grid.querySelectorAll('.payment-method-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selectedPaymentMethod = item.dataset.id;
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
}

// Save transaction
document.getElementById('btn-save-tx').addEventListener('click', async () => {
  const value = parseFloat(document.getElementById('tx-value').value);
  const description = document.getElementById('tx-description').value.trim();
  const dateStr = document.getElementById('tx-date').value;
  const btn = document.getElementById('btn-save-tx');

  if (!value || value <= 0) {
    showToast('Informe um valor válido.', 'error');
    document.getElementById('tx-value').focus();
    return;
  }
  if (!selectedCategory) {
    showToast('Selecione uma categoria.', 'error');
    return;
  }
  if (!dateStr) {
    showToast('Informe uma data.', 'error');
    return;
  }

  btn.disabled = true;
  btn.classList.add('btn-loading');

  try {
    const date = Timestamp.fromDate(new Date(dateStr + 'T12:00:00'));
    const data = { 
      type: selectedType, 
      value, 
      category: selectedCategory, 
      description, 
      date,
      ...(selectedType === 'expense' && { paymentMethod: selectedPaymentMethod })
    };

    if (editingTxId) {
      await updateTransaction(currentUser.uid, editingTxId, data);
      showToast('Lançamento atualizado!', 'success');
    } else {
      await addTransaction(currentUser.uid, data);
      showToast(selectedType === 'expense' ? '💸 Gasto registrado!' : '💰 Receita registrada!', 'success');
    }

    closeModal('modal-transaction');
    await loadDashboard();
    if (currentSection === 'history') loadHistory();
    if (currentSection === 'reports') loadReports();

  } catch (err) {
    console.error('Save tx error:', err);
    showToast('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
});

// ═══════════════════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════════════════

async function loadHistory() {
  try {
    const txs = await getTransactionsByMonth(currentUser.uid, historyYear, historyMonth);
    renderHistoryList(txs);

    // Update totals
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0);
    document.getElementById('hist-income-total').textContent  = formatCurrency(income);
    document.getElementById('hist-expense-total').textContent = formatCurrency(expense);
    document.getElementById('hist-month-display').textContent = monthLabel(historyYear, historyMonth);
  } catch (err) {
    console.error('Error loading history:', err);
  }
}

function renderHistoryList(txs) {
  const container = document.getElementById('history-list');
  const filtered  = histFilter === 'all' ? txs : txs.filter(t => t.type === histFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3 class="empty-state-title">Nenhum lançamento</h3>
        <p class="empty-state-desc">Não há transações neste período.</p>
      </div>`;
    return;
  }

  // Group by date
  const groups = {};
  filtered.forEach(tx => {
    const d    = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
    const key  = d.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  let html = '';
  Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).forEach(([dateKey, items]) => {
    const d = new Date(dateKey + 'T12:00:00');
    const total = items.reduce((s, t) => t.type === 'income' ? s + t.value : s - t.value, 0);
    html += `
      <div class="date-group-header">
        <span>${formatDate(d)}</span>
        <span class="date-group-total ${total >= 0 ? 'text-success' : 'text-danger'}">
          ${total >= 0 ? '+' : ''}${formatCurrency(total)}
        </span>
      </div>
      <div class="card" style="margin-bottom:var(--sp-3)">
        ${items.map(tx => renderTransactionItem(tx)).join('')}
      </div>`;
  });

  container.innerHTML = html;
  container.querySelectorAll('.transaction-item').forEach(item => {
    item.addEventListener('click', () => editTransaction(item.dataset.id, filtered));
    addLongPressDelete(item, item.dataset.id);
  });
}

function attachTransactionEvents(container) {
  container.querySelectorAll('.transaction-item').forEach(item => {
    item.addEventListener('click', () => editTransaction(item.dataset.id, allTransactions));
    addLongPressDelete(item, item.dataset.id);
  });
}

function addLongPressDelete(el, id) {
  let timer;
  el.addEventListener('pointerdown', () => {
    timer = setTimeout(async () => {
      const ok = await confirmDialog('Excluir lançamento', 'Esta ação não pode ser desfeita.');
      if (!ok) return;
      await deleteTransaction(currentUser.uid, id);
      showToast('Lançamento excluído.', 'success');
      await loadDashboard();
      if (currentSection === 'history') loadHistory();
      if (currentSection === 'reports') loadReports();
    }, 600);
  });
  el.addEventListener('pointerup',   () => clearTimeout(timer));
  el.addEventListener('pointerleave', () => clearTimeout(timer));
}

async function editTransaction(id, txList) {
  const tx = txList.find(t => t.id === id);
  if (!tx) return;
  openTransactionModal(tx.type, tx);
}

// Month navigation — History
document.getElementById('hist-prev-month').addEventListener('click', () => {
  if (histMonth === 1) { histMonth = 12; histYear--; }
  else histMonth--;
  loadHistory();
});
document.getElementById('hist-next-month').addEventListener('click', () => {
  if (histMonth === 12) { histMonth = 1; histYear++; }
  else histMonth++;
  loadHistory();
});

// Filter chips
document.querySelectorAll('#hist-filter-bar .filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#hist-filter-bar .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    histFilter = chip.dataset.filter;
    loadHistory();
  });
});

// ═══════════════════════════════════════════════════
//  GOALS
// ═══════════════════════════════════════════════════

let goals = [];

document.getElementById('btn-add-goal').addEventListener('click',   () => openGoalModal());
document.getElementById('btn-add-goal-2').addEventListener('click', () => openGoalModal());
document.getElementById('modal-goal-close').addEventListener('click', () => closeModal('modal-goal'));

function openGoalModal(goal = null) {
  document.getElementById('modal-goal-title').textContent = goal ? 'Editar meta' : 'Nova Meta';
  document.getElementById('goal-id').value        = goal?.id      || '';
  document.getElementById('goal-name').value      = goal?.name    || '';
  document.getElementById('goal-target').value    = goal?.target  || '';
  document.getElementById('goal-current').value   = goal?.current || '';
  document.getElementById('goal-deadline').value  = goal?.deadline
    ? formatDateInput(goal.deadline instanceof Timestamp ? goal.deadline.toDate() : new Date(goal.deadline))
    : '';
  openModal('modal-goal');
}

document.getElementById('btn-save-goal').addEventListener('click', async () => {
  const name    = document.getElementById('goal-name').value.trim();
  const target  = parseFloat(document.getElementById('goal-target').value) || 0;
  const current = parseFloat(document.getElementById('goal-current').value) || 0;
  const deadline = document.getElementById('goal-deadline').value;
  const id      = document.getElementById('goal-id').value;
  const btn     = document.getElementById('btn-save-goal');

  const nameGroup = document.getElementById('goal-name').closest('.form-group');
  const tgtGroup  = document.getElementById('goal-target').closest('.form-group');
  nameGroup.classList.toggle('has-error', !name);
  tgtGroup.classList.toggle('has-error', !target || target <= 0);
  if (!name || !target) return;

  btn.disabled = true;
  btn.classList.add('btn-loading');

  try {
    const data = {
      name, target, current,
      deadline: deadline ? Timestamp.fromDate(new Date(deadline + 'T12:00:00')) : null
    };
    if (id) {
      await updateGoal(currentUser.uid, id, data);
      showToast('Meta atualizada!', 'success');
    } else {
      await addGoal(currentUser.uid, data);
      showToast('🎯 Meta criada!', 'success');
    }
    closeModal('modal-goal');
    await loadGoals();
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar meta.', 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
});

async function loadGoals() {
  goals = await getGoals(currentUser.uid);
  renderGoalsList();
}

function renderGoalsList() {
  const container = document.getElementById('goals-list');
  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <h3 class="empty-state-title">Nenhuma meta</h3>
        <p class="empty-state-desc">Crie um objetivo financeiro e acompanhe seu progresso.</p>
        <button class="btn btn-primary" id="btn-add-goal-empty" style="margin-top:var(--sp-4)">Criar meta</button>
      </div>`;
    document.getElementById('btn-add-goal-empty')?.addEventListener('click', () => openGoalModal());
    return;
  }

  container.innerHTML = goals.map(goal => {
    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100)) || 0;
    const progressClass = pct >= 100 ? 'success' : '';
    const deadline = goal.deadline
      ? (goal.deadline instanceof Timestamp ? goal.deadline.toDate() : new Date(goal.deadline))
      : null;
    return `
      <div class="goal-card">
        <div class="goal-header">
          <div>
            <div class="goal-name">${goal.name}</div>
            <div class="goal-amounts text-muted">
              ${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}
              ${deadline ? ` · Prazo: ${formatDateShort(deadline)}` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--sp-2)">
            <span class="goal-pct">${pct}%</span>
            <div style="display:flex;gap:var(--sp-2)">
              <button class="btn-icon" data-goal-edit="${goal.id}" aria-label="Editar meta">✏️</button>
              <button class="btn-icon" data-goal-delete="${goal.id}" aria-label="Excluir meta">🗑️</button>
            </div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${progressClass}" style="width:${pct}%"></div>
        </div>
        ${pct >= 100 ? '<p style="text-align:center;color:var(--c-success);font-weight:700;margin-top:var(--sp-3)">🎉 Meta atingida!</p>' : ''}
      </div>`;
  }).join('');

  // Edit buttons
  container.querySelectorAll('[data-goal-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goal = goals.find(g => g.id === btn.dataset.goalEdit);
      if (goal) openGoalModal(goal);
    });
  });

  // Delete buttons
  container.querySelectorAll('[data-goal-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog('Excluir meta', 'Esta ação não pode ser desfeita.');
      if (!ok) return;
      await deleteGoal(currentUser.uid, btn.dataset.goalDelete);
      showToast('Meta excluída.', 'success');
      await loadGoals();
    });
  });
}

// ═══════════════════════════════════════════════════
//  REPORTS / CHARTS
// ═══════════════════════════════════════════════════

async function loadReports() {
  try {
    const txs = await getTransactionsByMonth(currentUser.uid, repYear, repMonth);
    document.getElementById('rep-month-display').textContent = monthLabel(repYear, repMonth);
    renderChart(txs, currentChartType);
  } catch (err) {
    console.error('Error loading reports:', err);
  }
}

function renderChart(txs, type) {
  const ctx = document.getElementById('main-chart');
  if (mainChart) { mainChart.destroy(); mainChart = null; }

  if (type === 'by-category') renderByCategoryChart(ctx, txs);
  else if (type === 'monthly') renderMonthlyChart(ctx);
  else if (type === 'income-vs-expense') renderIncomeVsExpenseChart(ctx, txs);
  else if (type === 'by-payment-method') renderByPaymentMethodChart(ctx, txs);
}

function renderByCategoryChart(ctx, txs) {
  const expenses = txs.filter(t => t.type === 'expense');
  const byCat = {};
  expenses.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.value; });

  const cats  = Object.keys(byCat);
  const vals  = cats.map(c => byCat[c]);
  const total = vals.reduce((s, v) => s + v, 0);

  const labels = cats.map(c => {
    const cat = EXPENSE_CATEGORIES.find(e => e.id === c) || { emoji: '📌', label: c };
    return `${cat.emoji} ${cat.label}`;
  });

  if (cats.length === 0) {
    document.getElementById('main-chart').closest('.card').innerHTML =
      '<div class="empty-state" style="padding:var(--sp-8)"><div class="empty-state-icon">📊</div><p class="empty-state-desc">Nenhum gasto neste mês.</p></div>';
    document.getElementById('chart-breakdown').innerHTML = '';
    return;
  }

  const COLORS = ['#2563EB','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6366F1','#14B8A6'];

  mainChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: vals, backgroundColor: COLORS.slice(0, vals.length), borderWidth: 2, borderColor: getComputedStyle(document.body).getPropertyValue('--c-surface') }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 }, color: getComputedStyle(document.body).getPropertyValue('--c-text-2') } },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${((ctx.raw/total)*100).toFixed(1)}%)` } }
      }
    }
  });

  // Breakdown table
  const breakdown = document.getElementById('chart-breakdown');
  breakdown.innerHTML = cats.map((c, i) => {
    const cat = EXPENSE_CATEGORIES.find(e => e.id === c) || { emoji: '📌', label: c };
    const pct = total ? ((vals[i] / total) * 100).toFixed(1) : 0;
    return `
      <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) 0;border-bottom:1px solid var(--c-border)">
        <div class="color-dot" style="background:${COLORS[i % COLORS.length]}"></div>
        <span style="font-size:20px">${cat.emoji}</span>
        <span style="flex:1;font-weight:500">${cat.label}</span>
        <span style="color:var(--c-text-2);font-size:var(--fs-sm)">${pct}%</span>
        <span style="font-weight:700">${formatCurrency(vals[i])}</span>
      </div>`;
  }).join('');
}

async function renderMonthlyChart(ctx) {
  try {
    const months = [];
    const incomes = [];
    const expenses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(repYear, repMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const txs = await getTransactionsByMonth(currentUser.uid, y, m);
      months.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
      incomes.push(txs.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0));
      expenses.push(txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0));
    }

    mainChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Receitas', data: incomes,  borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.1)', fill: true, tension: .4 },
          { label: 'Gastos',   data: expenses, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,.1)',  fill: true, tension: .4 }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
        },
        scales: {
          y: { ticks: { callback: v => `R$ ${(v/1000).toFixed(0)}k` } }
        }
      }
    });
    document.getElementById('chart-breakdown').innerHTML = '';
  } catch (err) {
    console.error(err);
  }
}

function renderIncomeVsExpenseChart(ctx, txs) {
  const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0);

  mainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Gastos', 'Saldo'],
      datasets: [{
        data: [income, expense, income - expense],
        backgroundColor: ['rgba(16,185,129,.8)', 'rgba(239,68,68,.8)', income - expense >= 0 ? 'rgba(37,99,235,.8)' : 'rgba(239,68,68,.8)'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw)}` } }
      },
      scales: {
        y: { ticks: { callback: v => `R$ ${(v/1000).toFixed(0)}k` } }
      }
    }
  });
  document.getElementById('chart-breakdown').innerHTML = '';
}

function renderByPaymentMethodChart(ctx, txs) {
  const expenses = txs.filter(t => t.type === 'expense');
  const byPayment = {};
  
  expenses.forEach(t => {
    const method = t.paymentMethod || 'cash';
    byPayment[method] = (byPayment[method] || 0) + t.value;
  });

  const methods = Object.keys(byPayment);
  const vals = methods.map(m => byPayment[m]);
  const total = vals.reduce((s, v) => s + v, 0);

  const labels = methods.map(m => {
    const method = PAYMENT_METHODS.find(p => p.id === m) || { emoji: '💵', label: m };
    return `${method.emoji} ${method.label}`;
  });

  if (methods.length === 0) {
    document.getElementById('main-chart').closest('.card').innerHTML =
      '<div class="empty-state" style="padding:var(--sp-8)"><div class="empty-state-icon">💳</div><p class="empty-state-desc">Nenhum gasto neste mês.</p></div>';
    document.getElementById('chart-breakdown').innerHTML = '';
    return;
  }

  const COLORS = ['#06B6D4', '#8B5CF6', '#F59E0B'];

  mainChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: vals, backgroundColor: COLORS.slice(0, vals.length), borderWidth: 2, borderColor: getComputedStyle(document.body).getPropertyValue('--c-surface') }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 }, color: getComputedStyle(document.body).getPropertyValue('--c-text-2') } },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${((ctx.raw/total)*100).toFixed(1)}%)` } }
      }
    }
  });

  // Breakdown table
  const breakdown = document.getElementById('chart-breakdown');
  breakdown.innerHTML = methods.map((m, i) => {
    const method = PAYMENT_METHODS.find(p => p.id === m) || { emoji: '💵', label: m };
    const pct = total ? ((vals[i] / total) * 100).toFixed(1) : 0;
    return `
      <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) 0;border-bottom:1px solid var(--c-border)">
        <div class="color-dot" style="background:${COLORS[i % COLORS.length]}"></div>
        <span style="font-size:20px">${method.emoji}</span>
        <span style="flex:1;font-weight:500">${method.label}</span>
        <span style="color:var(--c-text-2);font-size:var(--fs-sm)">${pct}%</span>
        <span style="font-weight:700">${formatCurrency(vals[i])}</span>
      </div>`;
  }).join('');
}

// Chart tabs
document.querySelectorAll('.chart-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentChartType = tab.dataset.chart;
    loadReports();
  });
});

// Month navigation — Reports
document.getElementById('rep-prev-month').addEventListener('click', () => {
  if (repMonth === 1) { repMonth = 12; repYear--; }
  else repMonth--;
  loadReports();
});
document.getElementById('rep-next-month').addEventListener('click', () => {
  if (repMonth === 12) { repMonth = 1; repYear++; }
  else repMonth++;
  loadReports();
});

// ═══════════════════════════════════════════════════
//  CREDIT CARDS
// ═══════════════════════════════════════════════════

let cards = [];

document.getElementById('btn-add-card').addEventListener('click',   () => openCardModal());
document.getElementById('btn-add-card-2').addEventListener('click', () => openCardModal());
document.getElementById('modal-card-close').addEventListener('click', () => closeModal('modal-card'));

function openCardModal(card = null) {
  document.getElementById('modal-card-title').textContent = card ? 'Editar cartão' : 'Novo Cartão';
  document.getElementById('card-id').value      = card?.id      || '';
  document.getElementById('card-name').value    = card?.name    || '';
  document.getElementById('card-limit').value   = card?.limit   || '';
  document.getElementById('card-bill').value    = card?.bill    || '';
  document.getElementById('card-due-day').value = card?.dueDay  || '';
  openModal('modal-card');
}

document.getElementById('btn-save-card').addEventListener('click', async () => {
  const name   = document.getElementById('card-name').value.trim();
  const limit  = parseFloat(document.getElementById('card-limit').value)  || 0;
  const bill   = parseFloat(document.getElementById('card-bill').value)   || 0;
  const dueDay = parseInt(document.getElementById('card-due-day').value)  || 0;
  const id     = document.getElementById('card-id').value;
  const btn    = document.getElementById('btn-save-card');

  const nameGroup = document.getElementById('card-name').closest('.form-group');
  nameGroup.classList.toggle('has-error', !name);
  if (!name) return;

  btn.disabled = true;
  btn.classList.add('btn-loading');
  try {
    const data = { name, limit, bill, dueDay };
    if (id) { await updateCard(currentUser.uid, id, data); showToast('Cartão atualizado!', 'success'); }
    else    { await addCard(currentUser.uid, data);         showToast('💳 Cartão adicionado!', 'success'); }
    closeModal('modal-card');
    await loadCards();
  } catch (err) {
    showToast('Erro ao salvar cartão.', 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
});

async function loadCards() {
  cards = await getCards(currentUser.uid);
  renderCards();
}

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#1a1a2e,#0f3460)',
  'linear-gradient(135deg,#16213e,#533483)',
  'linear-gradient(135deg,#0f3460,#e94560)',
  'linear-gradient(135deg,#27374D,#526D82)',
  'linear-gradient(135deg,#1B4332,#52B788)'
];

function renderCards() {
  const container = document.getElementById('cards-list');
  if (cards.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <h3 class="empty-state-title">Nenhum cartão</h3>
        <p class="empty-state-desc">Cadastre seus cartões e controle as faturas.</p>
        <button class="btn btn-primary" id="btn-add-card-empty" style="margin-top:var(--sp-4)">Adicionar cartão</button>
      </div>`;
    document.getElementById('btn-add-card-empty')?.addEventListener('click', openCardModal);
    return;
  }

  container.innerHTML = cards.map((card, i) => {
    const usagePct = card.limit > 0 ? Math.min(100, ((card.bill / card.limit) * 100).toFixed(1)) : 0;
    const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
    return `
      <div class="credit-card-visual" style="background:${gradient}">
        <div class="card-chip"></div>
        <div class="card-number">•••• •••• •••• ••••</div>
        <div class="card-footer">
          <div>
            <div class="card-label">Titular</div>
            <div class="card-value">${card.name}</div>
          </div>
          <div style="text-align:right">
            <div class="card-label">Limite</div>
            <div class="card-value">${formatCurrency(card.limit)}</div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div class="card-header">
          <h3 class="card-title">${card.name}</h3>
          <div style="display:flex;gap:var(--sp-2)">
            <button class="btn-icon" data-card-edit="${card.id}" aria-label="Editar cartão">✏️</button>
            <button class="btn-icon" data-card-delete="${card.id}" aria-label="Excluir cartão">🗑️</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-4)">
          <div>
            <p style="font-size:var(--fs-xs);color:var(--c-text-2);font-weight:600;text-transform:uppercase">Fatura atual</p>
            <p style="font-size:var(--fs-lg);font-weight:800;color:var(--c-danger)">${formatCurrency(card.bill)}</p>
          </div>
          <div>
            <p style="font-size:var(--fs-xs);color:var(--c-text-2);font-weight:600;text-transform:uppercase">Disponível</p>
            <p style="font-size:var(--fs-lg);font-weight:800;color:var(--c-success)">${formatCurrency(card.limit - card.bill)}</p>
          </div>
        </div>
        ${card.dueDay ? `<p style="font-size:var(--fs-sm);color:var(--c-text-2)">⏰ Vencimento: dia ${card.dueDay}</p>` : ''}
        <div class="progress-bar" style="margin-top:var(--sp-3)">
          <div class="progress-fill ${usagePct >= 80 ? '' : 'success'}" style="width:${usagePct}%;background:${usagePct >= 80 ? 'linear-gradient(90deg,#F59E0B,#EF4444)' : ''}"></div>
        </div>
        <p style="font-size:var(--fs-xs);color:var(--c-text-3);margin-top:4px">${usagePct}% do limite utilizado</p>
      </div>`;
  }).join('');

  container.querySelectorAll('[data-card-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = cards.find(c => c.id === btn.dataset.cardEdit);
      if (card) openCardModal(card);
    });
  });

  container.querySelectorAll('[data-card-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog('Excluir cartão', 'Esta ação não pode ser desfeita.');
      if (!ok) return;
      await deleteCard(currentUser.uid, btn.dataset.cardDelete);
      showToast('Cartão excluído.', 'success');
      await loadCards();
    });
  });
}

// ═══════════════════════════════════════════════════
//  FIXED BILLS
// ═══════════════════════════════════════════════════

let fixedBills = [];

document.getElementById('btn-add-bill').addEventListener('click',   () => openBillModal());
document.getElementById('btn-add-bill-2').addEventListener('click', () => openBillModal());
document.getElementById('modal-bill-close').addEventListener('click', () => closeModal('modal-bill'));

function openBillModal(bill = null) {
  document.getElementById('modal-bill-title').textContent   = bill ? 'Editar conta' : 'Nova Conta Fixa';
  document.getElementById('bill-id').value                  = bill?.id       || '';
  document.getElementById('bill-name').value                = bill?.name     || '';
  document.getElementById('bill-value').value               = bill?.value    || '';
  document.getElementById('bill-due-day').value             = bill?.dueDay   || '';
  document.getElementById('bill-category').value            = bill?.category || 'Outros';
  openModal('modal-bill');
}

document.getElementById('btn-save-bill').addEventListener('click', async () => {
  const name     = document.getElementById('bill-name').value.trim();
  const value    = parseFloat(document.getElementById('bill-value').value)   || 0;
  const dueDay   = parseInt(document.getElementById('bill-due-day').value)   || 0;
  const category = document.getElementById('bill-category').value;
  const id       = document.getElementById('bill-id').value;
  const btn      = document.getElementById('btn-save-bill');

  const nameGroup  = document.getElementById('bill-name').closest('.form-group');
  const valGroup   = document.getElementById('bill-value').closest('.form-group');
  const dueGroup   = document.getElementById('bill-due-day').closest('.form-group');
  nameGroup.classList.toggle('has-error', !name);
  valGroup.classList.toggle('has-error', !value || value <= 0);
  dueGroup.classList.toggle('has-error', !dueDay || dueDay < 1 || dueDay > 31);
  if (!name || !value || !dueDay) return;

  btn.disabled = true;
  btn.classList.add('btn-loading');
  try {
    const data = { name, value, dueDay, category };
    if (id) { await updateFixedBill(currentUser.uid, id, data); showToast('Conta atualizada!', 'success'); }
    else    { await addFixedBill(currentUser.uid, data);         showToast('📅 Conta fixa adicionada!', 'success'); }
    closeModal('modal-bill');
    await loadBills();
  } catch (err) {
    showToast('Erro ao salvar conta.', 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
});

async function loadBills() {
  fixedBills = await getFixedBills(currentUser.uid);
  renderBills();
}

const BILL_ICONS = {
  'Moradia': '🏠', 'Internet': '📶', 'Energia': '⚡', 'Água': '💧',
  'Streaming': '📺', 'Celular': '📱', 'Academia': '🏋️', 'Seguro': '🛡️', 'Outros': '📌'
};

function renderBills() {
  const container = document.getElementById('bills-list');
  if (fixedBills.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3 class="empty-state-title">Nenhuma conta fixa</h3>
        <p class="empty-state-desc">Cadastre suas despesas recorrentes.</p>
        <button class="btn btn-primary" id="btn-add-bill-empty" style="margin-top:var(--sp-4)">Adicionar conta</button>
      </div>`;
    document.getElementById('btn-add-bill-empty')?.addEventListener('click', openBillModal);
    return;
  }

  const total = fixedBills.reduce((s, b) => s + b.value, 0);

  container.innerHTML = `
    <div style="padding:0 var(--sp-5) var(--sp-3)">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <p style="font-size:var(--fs-xs);color:var(--c-text-2);font-weight:600;text-transform:uppercase">Total mensal</p>
            <p style="font-size:var(--fs-2xl);font-weight:800;color:var(--c-danger)">${formatCurrency(total)}</p>
          </div>
          <div style="font-size:36px">📋</div>
        </div>
      </div>
    </div>
    <div style="padding:0 var(--sp-5)">
      <div class="card">
        ${fixedBills.map(bill => `
          <div class="bill-item" data-bill-id="${bill.id}">
            <div class="bill-icon">${BILL_ICONS[bill.category] || '📌'}</div>
            <div class="bill-info">
              <div class="bill-name">${bill.name}</div>
              <div class="bill-due">Todo dia ${bill.dueDay} · ${bill.category}</div>
            </div>
            <div style="display:flex;align-items:center;gap:var(--sp-2)">
              <div class="bill-value">${formatCurrency(bill.value)}</div>
              <button class="btn-icon" data-bill-edit="${bill.id}" aria-label="Editar conta" style="font-size:16px">✏️</button>
              <button class="btn-icon" data-bill-delete="${bill.id}" aria-label="Excluir conta" style="font-size:16px">🗑️</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  container.querySelectorAll('[data-bill-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const bill = fixedBills.find(b => b.id === btn.dataset.billEdit);
      if (bill) openBillModal(bill);
    });
  });

  container.querySelectorAll('[data-bill-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog('Excluir conta fixa', 'Esta ação não pode ser desfeita.');
      if (!ok) return;
      await deleteFixedBill(currentUser.uid, btn.dataset.billDelete);
      showToast('Conta excluída.', 'success');
      await loadBills();
    });
  });
}

// ═══════════════════════════════════════════════════
//  THEME / SETTINGS
// ═══════════════════════════════════════════════════

function applyTheme() {
  document.documentElement.dataset.theme = darkMode ? 'dark' : '';
  document.getElementById('btn-theme').textContent = darkMode ? '☀️' : '🌙';
}

document.getElementById('btn-theme').addEventListener('click', () => {
  darkMode = !darkMode;
  localStorage.setItem('sf-dark', darkMode);
  applyTheme();
  const toggle = document.getElementById('toggle-dark-mode');
  if (toggle) toggle.checked = darkMode;
});

document.getElementById('toggle-dark-mode').addEventListener('change', (e) => {
  darkMode = e.target.checked;
  localStorage.setItem('sf-dark', darkMode);
  applyTheme();
});

// Notifications toggle
document.getElementById('toggle-notifications').addEventListener('change', async (e) => {
  if (e.target.checked) {
    const granted = await enableNotifications();
    if (!granted) {
      e.target.checked = false;
      showToast('Permissão de notificações negada.', 'warning');
    } else {
      showToast('Notificações ativadas! Você receberá um lembrete às 8 da manhã.', 'success');
    }
  } else {
    disableNotifications();
    showToast('Notificações desativadas.', 'info');
  }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
  const ok = await confirmDialog('Sair da conta', 'Tem certeza que deseja sair?');
  if (!ok) return;
  await logoutUser();
  window.location.replace('/index.html');
});
