# Saldo Fácil — Instruções para o GitHub Copilot

## O que é este projeto

**Saldo Fácil** é um aplicativo PWA (Progressive Web App) de finanças pessoais, sem framework JS (Vanilla JS puro), usando Firebase como backend. Funciona 100% no navegador.

## Stack

- **Frontend:** HTML, CSS, JavaScript (ES Modules, sem bundler)
- **Backend:** Firebase (Firestore + Authentication + Hosting)
- **Gráficos:** Chart.js (via CDN)
- **PWA:** Service Worker + manifest.json

## Estrutura de arquivos

```
index.html              → Página de login/registro/recuperação de senha
app.html                → Aplicação principal (pós-login)
service-worker.js       → PWA offline-first
manifest.json           → Configuração PWA (ícones, shortcuts)
firebase.json           → Configuração Firebase Hosting

src/
  pages/
    auth.js             → Controlador de autenticação (login, registro, Google, recuperação)
    app.js              → Controlador principal da aplicação (1200+ linhas)
  services/
    auth.service.js     → Firebase Authentication (registerUser, loginUser, loginWithGoogle, logoutUser, resetPassword, observeAuth)
    firestore.service.js → CRUD Firestore (transações, metas, cartões, contas fixas)
    notification.service.js → Notificações push
  components/
    ui.js               → Utilitários de UI (toast, modal, formatCurrency, formatDate, confirmDialog, debounce)
  firebase/
    config.js           → Firebase SDK inicializado (credenciais já configuradas)
  styles/
    main.css            → CSS completo (2000+ linhas, design tokens, tema claro/escuro, responsivo)
```

## Funcionalidades já implementadas (não reimplementar)

### app.html — 7 seções
- **dashboard** — saldo total, receitas/gastos do mês, transações recentes
- **history** — histórico completo de transações com filtros
- **goals** — metas financeiras com barra de progresso
- **cards** — cartões de crédito com limite e controle de fatura
- **bills** — contas fixas/recorrentes
- **reports** — gráficos (Chart.js): por categoria, evolução mensal, receitas vs gastos
- **more** — configurações, tema escuro/claro, notificações, logout

### Modais existentes
- Modal de transação (receita/despesa)
- Modal de meta
- Modal de cartão de crédito
- Modal de conta fixa

### Autenticação (index.html + auth.js)
- Login com e-mail/senha
- Registro com nome/e-mail/senha
- Google Sign-In
- Recuperação de senha

## Padrões do código

- **Imports:** ES Modules nativos (`type="module"` nas scripts, sem webpack/vite)
- **Firebase:** versão 10.x via CDN (`https://www.gstatic.com/firebasejs/10.12.2/...`)
- **CSS:** variáveis CSS (`--color-primary`, `--color-background`, etc.), tema escuro via classe `dark` no `<body>`
- **Estado:** variáveis globais no topo de `app.js` (`currentUser`, `currentSection`, `balanceVisible`, `darkMode`)
- **Categorias de despesa:** food, market, transport, fuel, home, health, leisure, education, shopping, pet, streaming, other
- **Categorias de receita:** salary, freelance, invest, gift, rent, other
- **Formas de pagamento:** pix, card, cash
- **Formatação de moeda:** sempre usar `formatCurrency()` de `ui.js`
- **Formatação de data:** sempre usar `formatDate()` / `formatDateInput()` de `ui.js`
- **Notificações:** sempre usar `showToast()` de `ui.js`
- **Confirmações destrutivas:** sempre usar `confirmDialog()` de `ui.js`

## Regras importantes ao fazer alterações

1. **Não recriar** arquivos que já existem — sempre editar o existente
2. **Não instalar dependências** — o projeto não usa npm/bundler; tudo via CDN ou módulos nativos
3. **Não mudar a estrutura de pastas** sem motivo explícito
4. **Não alterar** `firebase/config.js` — credenciais já configuradas corretamente
5. **Manter compatibilidade PWA** — qualquer novo arquivo de asset deve ser adicionado ao cache no `service-worker.js`
6. **CSS:** novas classes devem seguir o padrão de variáveis CSS já definido em `main.css`
7. **Firestore:** dados do usuário sempre ficam em `users/{uid}/colecao` — nunca misturar dados de usuários

## Como rodar localmente

```bash
npm install -g firebase-tools
firebase serve
```

## Como fazer deploy

```bash
firebase deploy
```

## URL do projeto online

Projeto hospedado no Firebase Hosting. Acesse via `firebase hosting:channel:list` para ver a URL ativa.
