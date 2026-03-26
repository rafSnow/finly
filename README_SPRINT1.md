# Sprint 1 - Controle Financeiro para Casais

## Requisitos entregues

- ✅ Estrutura de pastas conforme especificação
- ✅ Firebase (Auth + Firestore) configurado
- ✅ Tipos TypeScript completos (User, Family, Entry, Category, Goal, Invite, RecurrenceInterval)
- ✅ Hook `useAuth` com autenticação, login/signup/logout/reset senha
- ✅ Middleware de proteção de rotas com cookie `firebase-token`
- ✅ Telas de auth: login, register, forgot-password
- ✅ Layout protegido com Header e BottomNav
- ✅ 5 páginas principais: Dashboard, Lançamentos, Metas, Categorias, Ajustes
- ✅ Rotas dinâmicas: `/lancamentos/novo`, `/lancamentos/[id]/editar`
- ✅ Componentes UI: Button, Input, Card, Select, Modal
- ✅ Hooks de negócio: useFamily, useEntries, useGoals (tipados, com funções CRUD)

## Como rodar o projeto localmente

### 1. Instale as dependências:
```bash
npm install
```

### 2. Configure o Firebase:
Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu projeto Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**⚠️ Importante:** No console do Firebase, certifique-se de que:
- **Authentication** (E-mail/Senha) está ativado
- **Firestore Database** está criado em modo teste (ou com regras apropriadas)

### 3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### 4. Acesse:
[http://localhost:3000](http://localhost:3000)

---

## Fluxo de teste: Login → Dashboard → Logout

### ✅ Fluxo esperado:

1. **Acesse [http://localhost:3000](http://localhost:3000)**
   - Você é redirecionado para `/login` automaticamente (autenticado: `/dashboard`)

2. **Crie uma conta em `/register`**
   - Preencha: Nome, E-mail, Senha (mín. 6 caracteres), Confirmar Senha
   - Clique em "Criar conta"
   - ✅ Você é redirecionado para `/dashboard`

3. **No Dashboard**
   - Veja o Header exibindo "Dashboard"
   - BottomNav fixo na base com 5 abas
   - Clique nas abas para navegar entre as páginas

4. **Navegação entre telas**
   - 🏠 **Dashboard** → página principal
   - 💸 **Lançamentos** → lista de transações (Sprint 2)
   - 🎯 **Metas** → metas de gastos (Sprint 2)
   - 🏷️ **Categorias** → gerenciar categorias (Sprint 2)
   - ⚙️ **Ajustes** → configurações (Sprint 2)

5. **Logout (em Ajustes - Sprint 2)**
   - ✅ Você é redirecionado para `/login`
   - Cookie `firebase-token` é removido

### ❌ Comportamentos bloqueados:

- Tentar acessar `/dashboard` sem login → redireciona para `/login`
- Tentar acessar `/login` autenticado → redireciona para `/dashboard`

---

## Arquitetura

### Pastas principais:

```
app/
  (auth)/           # Rotas públicas
  (app)/            # Rotas protegidas (require autenticação)
components/
  ui/               # Componentes base (Button, Input, etc.)
  layout/           # Header, BottomNav
  [feature]/        # Componentes de feature (sprint futura)
hooks/
  useAuth.ts        # Autenticação e contexto do usuário
  useFamily.ts      # CRUD de famílias
  useEntries.ts     # CRUD de lançamentos
  useGoals.ts       # CRUD de metas
lib/
  firebase.ts       # Inicialização do Firebase
  firestore/        # Serviços de Firestore (sprint futura)
types/
  index.ts          # Tipos TypeScript
```

### Fluxo de autenticação:

1. `useAuth` escuta `onAuthStateChanged`
2. Ao login, token é salvo em cookie `firebase-token`
3. `middleware.ts` valida token em cada requisição
4. Rotas `(auth)` são públicas
5. Rotas `(app)` requerem autenticação
6. Layout `(app)/layout.tsx` verifica `useAuth` e redireciona se necessário

---

## Stack tecnológico

- **Next.js 14+** (App Router)
- **TypeScript** (sem `any`)
- **Tailwind CSS** (sem CSS modules/styled-components)
- **Firebase** (Auth + Firestore)
- **Vercel** (deployment)

---

## Checklist de conclusão

- ✅ Projeto instala e roda sem erros (`npm run dev`)
- ✅ Login/Register funcionam
- ✅ Fluxo autenticado → dashboard funciona
- ✅ Middleware bloqueia rotas não autenticadas
- ✅ BottomNav navega entre as 5 telas
- ✅ TypeScript sem `any`, código limpo
- ✅ Tailwind CSS em todos os componentes

---

**Próximas sprints:** Dashboard com resumo financeiro, CRUD completo de lançamentos, metas com alertas, categorias, convites, recorrências.
