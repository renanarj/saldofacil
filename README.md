# 💰 Saldo Fácil

> **Controle seu dinheiro em menos de 10 segundos por dia.**

Um SaaS de controle financeiro pessoal — simples, bonito e extremamente fácil de usar.

---

## ✨ Funcionalidades

| # | Recurso | Status |
|---|---------|--------|
| 1 | Autenticação (e-mail, senha, Google, recuperação) | ✅ |
| 2 | Dashboard com saldo atual e resumo mensal | ✅ |
| 3 | Registrar gastos com categorias e ícones | ✅ |
| 4 | Registrar receitas (salário, freelance…) | ✅ |
| 5 | Histórico com filtro por mês e categoria | ✅ |
| 6 | Gráficos: por categoria, evolução mensal, receitas vs gastos | ✅ |
| 7 | Metas financeiras com barra de progresso | ✅ |
| 8 | Contas fixas (internet, energia, streaming…) | ✅ |
| 9 | Cartões de crédito (limite, fatura, vencimento) | ✅ |
| 10 | Inteligência financeira (insights automáticos) | ✅ |
| 11 | Modo escuro | ✅ |
| 12 | PWA instalável no celular | ✅ |

---

## 🛠️ Tecnologias

- **HTML5 + CSS3 + JavaScript ES6+** — sem frameworks
- **Firebase Authentication** — e-mail/senha + Google
- **Cloud Firestore** — banco de dados em tempo real
- **Firebase Hosting** — deploy com CDN
- **Chart.js** — gráficos interativos
- **PWA** — Service Worker + Web Manifest

---

## 🚀 Como configurar

### 1. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative os serviços:
   - **Authentication** → Provedores: E-mail/senha e Google
   - **Cloud Firestore** → Modo de produção
   - **Hosting**

### 2. Configurar credenciais

Edite o arquivo `src/firebase/config.js` e substitua os valores de placeholder pelas credenciais do seu projeto:

```js
const firebaseConfig = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "seu-projeto.firebaseapp.com",
  projectId:         "seu-projeto",
  storageBucket:     "seu-projeto.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId:             "SEU_APP_ID"
};
```

> Encontre essas informações em: **Project Settings → General → Suas aplicações → Configuração web**

### 3. Regras de segurança do Firestore

Copie as regras abaixo em **Firestore → Regras**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Perfis de usuário
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Transações
    match /transactions/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Metas
    match /goals/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Cartões de crédito
    match /cards/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Contas fixas
    match /fixedBills/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Deploy no Firebase Hosting

```bash
# Instalar Firebase CLI (se necessário)
npm install -g firebase-tools

# Fazer login
firebase login

# Inicializar (se ainda não fez)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### 5. Desenvolvimento local

Sirva os arquivos com qualquer servidor HTTP estático:

```bash
# Usando Python
python3 -m http.server 5000

# Usando Node.js (npx)
npx serve . -p 5000

# Usando VS Code
# Instale a extensão "Live Server" e clique em "Go Live"
```

Acesse: `http://localhost:5000`

---

## 📁 Estrutura do projeto

```
saldofacil/
├── index.html              # Página de autenticação
├── app.html                # Aplicação principal (SPA)
├── manifest.json           # PWA manifest
├── service-worker.js       # Service Worker (offline)
├── firebase.json           # Configuração Firebase Hosting
├── .firebaserc             # Projeto Firebase
├── src/
│   ├── styles/
│   │   └── main.css        # Estilos globais (mobile-first)
│   ├── firebase/
│   │   └── config.js       # Inicialização Firebase
│   ├── services/
│   │   ├── auth.service.js       # Autenticação
│   │   └── firestore.service.js  # Operações no banco
│   ├── pages/
│   │   ├── auth.js         # Controller da página de login
│   │   └── app.js          # Controller do app principal
│   └── components/
│       └── ui.js           # Toasts, modais, formatação
└── public/
    └── icons/              # Ícones do PWA
```

---

## 🎨 Identidade Visual

| Token | Cor | Uso |
|-------|-----|-----|
| `--c-primary` | `#2563EB` | Azul principal — botões, links |
| `--c-primary-light` | `#3B82F6` | Azul secundário — gradientes |
| `--c-success` | `#10B981` | Verde — receitas, metas concluídas |
| `--c-danger` | `#EF4444` | Vermelho — gastos, alertas |
| `--c-bg` | `#F3F7FC` | Fundo da aplicação |

Fonte: **Inter** (Google Fonts)

---

## 📱 PWA — Instalar no celular

1. Abra o app no Chrome (Android) ou Safari (iOS)
2. Toque em **"Adicionar à tela inicial"**
3. O app será instalado como um aplicativo nativo

---

## 📊 Estrutura do banco de dados (Firestore)

```
users/{uid}
  └── name, email, createdAt

transactions/{uid}/items/{id}
  └── type (expense|income), value, category, description, date

goals/{uid}/items/{id}
  └── name, target, current, deadline

cards/{uid}/items/{id}
  └── name, limit, bill, dueDay

fixedBills/{uid}/items/{id}
  └── name, value, dueDay, category
```

---

## 📄 Licença

MIT — use, modifique e distribua livremente.