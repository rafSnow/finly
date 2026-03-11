# Prompt de Engenharia — Finly FASE 1: Fundação

## Contexto do Agente

Você é um engenheiro sênior full-stack responsável por implementar o projeto **Finly** — uma plataforma web de gestão financeira pessoal e familiar. Você tem acesso completo ao SRS (requisitos), ao documento de arquitetura e ao roadmap do produto.

Os três documentos de referência são:

- `docs/Finly_SRS_v1.1.md` — Requisitos funcionais, não funcionais e regras de negócio
- `docs/Finly_Architecture_v1.0.md` — Arquitetura, stack, estrutura de pastas, modelagem de dados e Security Rules
- `docs/Finly_Roadmap_v1.0.md` — Fases, entregáveis e critérios de saída

---

## Missão desta sessão

Implementar **integralmente a FASE 1 — Fundação** do roadmap Finly.

A Fase 1 cobre os meses 1–2 do projeto e tem como objetivo construir toda a base técnica. Nenhuma feature de negócio visível ao usuário final é esperada nesta fase — o foco é infraestrutura, design system e autenticação.

---

## Trilhas de trabalho

Execute as trilhas **na ordem abaixo**. Conclua cada entregável completamente antes de avançar para o próximo. Para entregáveis independentes dentro de uma mesma trilha, você pode executá-los em paralelo.

---

### TRILHA 1 — Infraestrutura e Setup do Projeto

**Objetivo:** Criar o esqueleto do monorepo com todas as ferramentas configuradas.

#### Entregável 1.1 — Estrutura do monorepo

Crie a estrutura de pastas exata definida na seção 5 do documento de arquitetura:

```
finly/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── cadastro/
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── transacoes/
│   │   ├── contas/
│   │   ├── cartoes/
│   │   ├── orcamento/
│   │   ├── metas/
│   │   ├── relatorios/
│   │   ├── familia/
│   │   └── importar/
│   ├── api/
│   │   └── export/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── charts/
│   ├── forms/
│   └── layout/
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── firestore.ts
│   ├── ofx/
│   ├── finance/
│   └── utils.ts
├── hooks/
├── store/
├── types/
├── public/
│   ├── manifest.json
│   └── icons/
├── functions/
│   ├── src/
│   │   ├── ofx/
│   │   ├── recurrence/
│   │   ├── budget/
│   │   └── user/
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

Regras:

- Use Next.js 14+ com App Router
- TypeScript estrito em todo o projeto (`strict: true` no tsconfig)
- Tailwind CSS v3+

#### Entregável 1.2 — Configuração do Firebase Client SDK

Crie o arquivo `lib/firebase/client.ts` com:

- Inicialização do Firebase App (singleton — nunca instanciar duas vezes)
- Exportar instâncias de `auth` (Firebase Auth) e `db` (Firestore)
- Ler as credenciais exclusivamente de variáveis de ambiente (`NEXT_PUBLIC_FIREBASE_*`)
- Suportar dois ambientes via variáveis: `finly-dev` e `finly-prod`

Crie o arquivo `.env.local.example` documentando todas as variáveis necessárias:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Segurança:** Nunca hardcode credenciais. Adicione `.env.local` ao `.gitignore`.

#### Entregável 1.3 — Firebase Cloud Functions (TypeScript)

Configure o diretório `functions/` com:

- `package.json` com dependências: `firebase-functions`, `firebase-admin`, `typescript`
- `tsconfig.json` com target ES2020, strict mode
- `src/index.ts` como entry point exportando todas as functions (stubs iniciais)
- Região configurada como `southamerica-east1` em todas as functions

Crie stubs (funções vazias com estrutura correta) para:

- `fn-processOFX`
- `fn-recurrenceJob`
- `fn-budgetAlert`
- `fn-deleteUser`
- `fn-exportData`

#### Entregável 1.4 — Configuração do firebase.json e .firebaserc

```json
// firebase.json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "hosting": {
    "public": ".next",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

```json
// .firebaserc
{
  "projects": {
    "default": "finly-dev",
    "production": "finly-prod"
  }
}
```

#### Entregável 1.5 — ESLint, Prettier e Husky

Configure:

- ESLint com `eslint-config-next` + regras TypeScript strict
- Prettier com: `semi: true`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: "es5"`
- `.prettierignore` cobrindo `node_modules`, `.next`, `functions/lib`
- Husky com pre-commit hook executando: `eslint --fix` + `prettier --write` + `tsc --noEmit`
- `lint-staged` para aplicar apenas nos arquivos staged

#### Entregável 1.6 — Pipeline CI/CD (GitHub Actions)

Crie os workflows em `.github/workflows/`:

**`ci.yml`** — Executado em push para qualquer branch:

```yaml
jobs:
  lint-and-test:
    - checkout
    - setup Node.js 20
    - npm ci (root + functions)
    - eslint
    - tsc --noEmit
    - jest (unit tests)
```

**`preview.yml`** — Executado em Pull Request para `main`:

```yaml
jobs:
  preview:
    - tudo do ci.yml
    - build Next.js
    - Vercel Preview Deploy
    - firebase deploy --only firestore:rules (ambiente dev)
```

**`deploy.yml`** — Executado em push/merge para `main`:

```yaml
jobs:
  production:
    - build Next.js
    - Vercel Production Deploy
    - firebase deploy --only functions,firestore:rules,firestore:indexes
```

Secrets necessários (documentar no README):

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_FINLY_DEV`
- `FIREBASE_SERVICE_ACCOUNT_FINLY_PROD`

---

### TRILHA 2 — Design System e UI Base

**Objetivo:** Criar todos os componentes reutilizáveis e o layout base do produto.

#### Entregável 2.1 — Tokens de Design (Tailwind)

Configure `tailwind.config.ts` com os tokens do Finly:

```typescript
// Paleta de cores principal
colors: {
  brand: {
    50:  '#EBF2FF',
    100: '#C3D8FF',
    500: '#1A56DB',  // Cor primária (theme_color do PWA)
    600: '#1548C2',
    700: '#0F3A9E',
    900: '#0A2464',
  },
  success: {
    500: '#0E9F6E',
    100: '#DEF7EC',
  },
  danger: {
    500: '#E02424',
    100: '#FDE8E8',
  },
  warning: {
    500: '#C27803',
    100: '#FDF6B2',
  },
  neutral: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    600: '#4B5563',
    800: '#1F2937',
    900: '#111827',
  }
}

// Tipografia
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui'],
}

// Breakpoints (Mobile-First)
screens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
}
```

#### Entregável 2.2 — Componentes Base (`components/ui/`)

Implemente os seguintes componentes, todos com:

- Props com TypeScript (`interface` explícita)
- Variantes via `class-variance-authority` (CVA) ou equivalente
- Acessibilidade WCAG 2.1 AA (roles, aria-labels, focus visible)
- Export nomeado

**`Button`**

- Variantes: `primary`, `secondary`, `ghost`, `danger`
- Tamanhos: `sm`, `md`, `lg`
- Estado `loading` com spinner integrado
- Estado `disabled`

**`Input`**

- Label flutuante ou estática
- Estado de erro com mensagem
- Ícone prefixo/sufixo
- Variante `password` com toggle show/hide

**`Modal`**

- Overlay com blur
- Animação de entrada/saída (`framer-motion` ou CSS transition)
- Trap de foco acessível
- Fechamento com Escape e clique no overlay
- Slots: `header`, `body`, `footer`

**`Card`**

- Variantes: `default`, `elevated`, `outlined`
- Padding configurável

**`Badge`**

- Variantes de cor mapeadas para categorias financeiras
- Tamanhos: `sm`, `md`

**`Toast`**

- Tipos: `success`, `error`, `warning`, `info`
- Auto-dismiss configurável (padrão: 4s)
- Posicionamento: canto superior direito (desktop), centro inferior (mobile)
- Usar `zustand` para o store de toasts

#### Entregável 2.3 — Layout Base Autenticado (`components/layout/`)

**`Sidebar`** (Desktop — visible em `lg:`)

- Logo Finly no topo
- Itens de navegação com ícone + label:
  - Dashboard (`/dashboard`)
  - Transações (`/transacoes`)
  - Contas (`/contas`)
  - Cartões (`/cartoes`)
  - Orçamento (`/orcamento`)
  - Metas (`/metas`)
  - Relatórios (`/relatorios`)
  - Família (`/familia`)
  - Importar (`/importar`)
- Indicador de rota ativa
- Avatar do usuário + nome no rodapé
- Botão de logout

**`BottomNav`** (Mobile — visible abaixo de `lg:`)

- Máximo 5 itens (mais usados): Dashboard, Transações, Contas, Cartões, Mais
- Ícones sem label ou com label curta
- Item ativo destacado com cor `brand-500`

**`Header`** (Mobile)

- Título da página atual
- Botão de notificações (badge com contador)
- Avatar do usuário

**`app/(app)/layout.tsx`**

- Combina Sidebar (desktop) + BottomNav + Header (mobile)
- Verifica autenticação (redirecionar para `/login` se não autenticado)
- Injeta o usuário no contexto via React Context ou Zustand

---

### TRILHA 3 — Autenticação (RF-01 ao RF-07)

**Objetivo:** Implementar o fluxo completo de autenticação com Firebase Auth.

#### Entregável 3.1 — Helpers de autenticação (`lib/firebase/auth.ts`)

Implemente e exporte as seguintes funções tipadas:

```typescript
signUpWithEmail(name: string, email: string, password: string): Promise<UserCredential>
signInWithEmail(email: string, password: string): Promise<UserCredential>
signInWithGoogle(): Promise<UserCredential>
signOut(): Promise<void>
sendPasswordReset(email: string): Promise<void>
onAuthStateChange(callback: (user: User | null) => void): Unsubscribe
updateUserProfile(displayName: string, photoURL?: string): Promise<void>
```

Regras:

- Após `signUpWithEmail`, criar documento em `/users/{uid}` no Firestore com: `name`, `email`, `currency: "BRL"`, `createdAt`
- Centralizar tratamento de erros Firebase em mensagens PT-BR amigáveis
- Nunca expor códigos de erro internos do Firebase para o usuário

#### Entregável 3.2 — Hook `useAuth`

Crie `hooks/useAuth.ts`:

```typescript
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

- Usar `onAuthStateChange` para reatividade
- Estado `loading: true` até a primeira resolução do Firebase
- Integrar com Zustand store para persistir o usuário globalmente

#### Entregável 3.3 — Tela de Cadastro (`app/(auth)/cadastro/page.tsx`)

Campos: Nome completo, E-mail, Senha, Confirmar senha

Validações (React Hook Form + Zod):

- Nome: mínimo 2 caracteres
- E-mail: formato válido
- Senha: mínimo 8 caracteres, ao menos 1 número e 1 letra maiúscula
- Confirmar senha: deve ser igual à senha

UX:

- Loading state no botão durante o cadastro
- Toast de erro em caso de falha (ex: e-mail já cadastrado)
- Redirect para `/dashboard` após sucesso
- Link para tela de login

#### Entregável 3.4 — Tela de Login (`app/(auth)/login/page.tsx`)

Campos: E-mail, Senha

Features:

- Login com e-mail/senha
- Botão "Entrar com Google" (OAuth)
- Link "Esqueci minha senha" abrindo modal de recuperação
- Loading state, tratamento de erros em PT-BR
- Redirect para `/dashboard` após sucesso
- Link para cadastro

#### Entregável 3.5 — Recuperação de Senha

Modal ou página separada (`/esqueci-senha`):

- Campo de e-mail
- `sendPasswordReset` do Firebase
- Feedbacks: sucesso ("verifique seu e-mail") e erro ("e-mail não encontrado")

#### Entregável 3.6 — Middleware de Proteção de Rotas

Crie `middleware.ts` na raiz do Next.js:

- Rotas sob `/(app)/*` → redirecionar para `/login` se não autenticado
- Rotas sob `/(auth)/*` → redirecionar para `/dashboard` se já autenticado
- Usar cookie de sessão do Firebase Auth (verificar token via `firebase-admin` no middleware ou usar o padrão de cookie de sessão do Firebase)

#### Entregável 3.7 — Tela de Perfil (`app/(app)/perfil/page.tsx`)

Campos editáveis:

- Nome
- Foto de perfil (upload de URL — sem storage de arquivo)
- Moeda padrão (seletor: BRL por padrão, mas estrutura para i18n futuro)

Ação de exclusão de conta:

- Modal de confirmação com campo de digitação "EXCLUIR"
- Chama `fn-deleteUser` Cloud Function (stub na Fase 1)
- Informar ao usuário sobre anonimização de dados (LGPD)

---

### TRILHA 4 — Firestore Security Rules (versão inicial)

**Objetivo:** Implementar as Security Rules básicas cobrindo autenticação e usuários.

#### Entregável 4.1 — `firestore.rules`

Implemente as regras completas conforme a seção 7 do documento de arquitetura, cobrindo:

```
/users/{userId}
  - read:   somente o próprio usuário autenticado
  - create: somente o próprio usuário autenticado, com campos válidos
  - update: somente o próprio usuário, campos permitidos: name, photoURL, currency
  - delete: false — exclusão apenas via Cloud Function (LGPD)

/families/{familyId}
  - helpers: isFamilyMember(), getFamilyRole(), isFamilyAdmin(), canEdit()
  - read:   apenas membros da família
  - create: qualquer usuário autenticado (cria sua própria família)
  - update: apenas admin
  - delete: apenas admin

/families/{familyId}/**
  - Subcoleções: aplicar regras de canEdit() para escrita, isFamilyMember() para leitura

/categories/{categoryId}
  - read:   qualquer usuário autenticado
  - write:  false (categorias gerenciadas pela equipe via admin SDK)
```

**Segurança obrigatória:**

- Nenhuma regra deve ter `allow read, write: if true`
- Validar tipos dos campos em operações de escrita (`request.resource.data`)
- Usar `request.auth.uid` — nunca confiar em campos do documento para identidade

#### Entregável 4.2 — Testes das Security Rules

Crie `tests/firestore-rules/` com testes usando `@firebase/rules-unit-testing` e Jest:

Cenários obrigatórios:

```
Auth — /users/{userId}
  ✓ usuário autenticado lê seu próprio documento
  ✗ usuário autenticado lê documento de outro usuário
  ✓ usuário cria seu próprio documento com campos válidos
  ✗ usuário cria documento com userId diferente do seu
  ✗ usuário não autenticado lê qualquer documento
  ✗ usuário deleta seu próprio documento

Família — /families/{familyId}
  ✓ membro lê o documento da família
  ✗ não-membro lê o documento da família
  ✓ admin atualiza o documento da família
  ✗ editor tenta atualizar o documento da família

Subcoleções — /families/{familyId}/accounts
  ✓ editor cria uma conta na família
  ✓ admin cria uma conta na família
  ✗ viewer tenta criar uma conta na família
  ✗ não-membro tenta ler contas da família
```

---

### TRILHA 5 — PWA Manifest (configuração inicial)

#### Entregável 5.1 — `public/manifest.json`

```json
{
  "name": "Finly — Gestão Financeira",
  "short_name": "Finly",
  "description": "Controle financeiro pessoal e familiar",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1A56DB",
  "orientation": "portrait-primary",
  "lang": "pt-BR",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### Entregável 5.2 — Configuração no `next.config.ts`

Adicionar referência ao manifest no root layout (`app/layout.tsx`):

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1A56DB" />
```

---

## Checklist de Conclusão da Fase 1

Antes de encerrar a sessão, valide cada item abaixo:

### Infraestrutura

- [ ] Estrutura de pastas criada conforme o documento de arquitetura
- [ ] `lib/firebase/client.ts` inicializa Firebase como singleton
- [ ] `.env.local.example` documentado com todas as variáveis
- [ ] `.env.local` no `.gitignore`
- [ ] `functions/` configurado com TypeScript e stubs das 5 Cloud Functions
- [ ] `firebase.json` e `.firebaserc` configurados com ambientes `dev` e `prod`
- [ ] ESLint, Prettier e Husky configurados
- [ ] Pre-commit hook funcionando
- [ ] Workflows GitHub Actions criados (ci.yml, preview.yml, deploy.yml)

### Design System

- [ ] Tokens de design no `tailwind.config.ts` (cores, tipografia)
- [ ] Componentes `Button`, `Input`, `Modal`, `Card`, `Badge`, `Toast` implementados
- [ ] Todos os componentes acessíveis (WCAG 2.1 AA)
- [ ] `Sidebar`, `BottomNav`, `Header` implementados
- [ ] Layout autenticado `app/(app)/layout.tsx` funcional

### Autenticação

- [ ] `lib/firebase/auth.ts` com todos os helpers tipados
- [ ] `hooks/useAuth.ts` com estado reativo
- [ ] Tela de cadastro com validação Zod
- [ ] Tela de login com Google OAuth
- [ ] Recuperação de senha funcionando
- [ ] Middleware de proteção de rotas ativo
- [ ] Tela de perfil com edição de nome, foto e moeda

### Security Rules

- [ ] `firestore.rules` cobrindo users, families e categories
- [ ] Nenhuma regra `allow read, write: if true`
- [ ] Todos os cenários de teste passando (`npm test`)

### PWA

- [ ] `manifest.json` configurado
- [ ] Meta tags no root layout

---

## Restrições e Padrões de Código

1. **TypeScript estrito:** Nenhum `any` implícito. Use tipos explícitos ou `unknown`.
2. **Componentes Server vs Client:** Components que usam hooks (`useState`, `useEffect`, Firebase SDK) devem ter `'use client'` no topo. Prefira Server Components onde possível.
3. **Segurança:** Nunca expor `process.env` sem prefixo `NEXT_PUBLIC_` no cliente.
4. **Nomenclatura:**
   - Arquivos de componente: `PascalCase.tsx`
   - Hooks: `camelCase.ts` com prefixo `use`
   - Utilitários: `camelCase.ts`
   - Constantes: `SCREAMING_SNAKE_CASE`
5. **Imports:** Usar alias `@/` mapeado para a raiz do projeto (`tsconfig.json` paths).
6. **Testes:** Cada utilitário crítico deve ter arquivo `*.test.ts` correspondente.
7. **Commits:** Seguir Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.

---

## Ao finalizar esta fase

Após concluir todos os entregáveis e validar o checklist:

1. Confirme que `npm run build` executa sem erros
2. Confirme que `npm test` passa todos os testes das Security Rules
3. Confirme que o pre-commit hook está bloqueando commits com erros de lint/tipo
4. Documente no `README.md` raiz: como rodar localmente, variáveis de ambiente necessárias e como fazer deploy

A próxima sessão iniciará a **FASE 2 — MVP**, que depende de toda esta fundação estar sólida.

---

_Este prompt foi gerado para o projeto Finly com base nos documentos SRS v1.1, Architecture v1.0 e Roadmap v1.0._
