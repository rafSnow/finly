# Finly - Gestão Financeira Pessoal & Familiar

Plataforma web progressiva (PWA) para gestão financeira pessoal e familiar com suporte offline, categorização automática e dashboards visuais.

## Stack Tecnológica

- **Framework**: Next.js 16 (App Router) + React 19
- **Linguagem**: TypeScript (strict mode)
- **Estilos**: Tailwind CSS v4
- **Estado**: Zustand
- **Formulários**: React Hook Form + Zod
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Testes**: Jest + ts-jest
- **CI/CD**: GitHub Actions + Vercel (hosting) + Firebase (functions)

## Pré-requisitos

- Node.js 20+
- npm 10+
- Firebase CLI (`npm install -g firebase-tools`)

## Configuração Local

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd finly

# 2. Instalar dependências
npm install
cd functions && npm install && cd ..

# 3. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Preencha as variáveis com as credenciais do Firebase Console
```

### Variáveis de Ambiente

Copie `.env.local.example` para `.env.local` e preencha:

| Variável                                   | Descrição                                 |
| ------------------------------------------ | ----------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | API Key do projeto Firebase               |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Auth domain (ex: projeto.firebaseapp.com) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | ID do projeto Firebase                    |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Storage bucket                            |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID do Cloud Messaging              |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | App ID do Firebase                        |

## Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint com correção automática
npm run format       # Formata código com Prettier
npm run type-check   # Verificação de tipos TypeScript
npm test             # Executa testes unitários
npm run test:rules   # Executa testes de regras Firestore (requer emulador)
```

## Estrutura do Projeto

```
finly/
├── app/                    # Next.js App Router
│   ├── (app)/              # Rotas autenticadas (dashboard, transações, etc.)
│   ├── (auth)/             # Rotas de autenticação (login, cadastro)
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # Componentes base (Button, Input, Modal, etc.)
│   └── layout/             # Componentes de layout (Sidebar, BottomNav, Header)
├── hooks/                  # Custom hooks (useAuth)
├── lib/
│   ├── firebase/           # Configuração e helpers Firebase
│   └── utils.ts            # Utilitários gerais
├── store/                  # Zustand stores (auth, toast)
├── types/                  # Schemas Zod e tipos
├── tests/
│   ├── unit/               # Testes unitários
│   └── firestore-rules/    # Testes de regras de segurança
├── functions/              # Firebase Cloud Functions
│   └── src/                # Código-fonte das functions
├── .github/workflows/      # CI/CD pipelines
├── firestore.rules         # Regras de segurança do Firestore
└── firestore.indexes.json  # Índices compostos do Firestore
```

## Testes de Regras Firestore

Os testes de segurança do Firestore requerem o emulador Firebase:

```bash
# Iniciar emulador
firebase emulators:start --only firestore

# Em outro terminal, executar testes
npm run test:rules
```

## Deploy

### GitHub Actions Secrets

Configure os seguintes secrets no repositório GitHub:

| Secret                                | Descrição                            |
| ------------------------------------- | ------------------------------------ |
| `VERCEL_TOKEN`                        | Token de API da Vercel               |
| `VERCEL_ORG_ID`                       | ID da organização na Vercel          |
| `VERCEL_PROJECT_ID`                   | ID do projeto na Vercel              |
| `FIREBASE_SERVICE_ACCOUNT_FINLY_DEV`  | Service account JSON do projeto dev  |
| `FIREBASE_SERVICE_ACCOUNT_FINLY_PROD` | Service account JSON do projeto prod |

### Pipelines

- **CI** (`ci.yml`): Roda em todo push — lint, type-check, build, testes
- **Preview** (`preview.yml`): Roda em PRs para `main` — deploy preview na Vercel
- **Deploy** (`deploy.yml`): Roda em push para `main` — deploy produção (Vercel + Firebase Functions)

## Roadmap

Consulte [docs/Finly_Roadmap_v1.0.md](docs/Finly_Roadmap_v1.0.md) para o planejamento completo das fases:

- **Fase 1** - Fundação (infraestrutura, design system, auth, PWA)
- **Fase 2** - Gestão Financeira Core (transações, contas, orçamento)
- **Fase 3** - Inteligência & Colaboração (importação OFX, família, relatórios)
- **Fase 4** - Metas & Recorrências
- **Fase 5** - Polimento & Lançamento

## Licença

Projeto privado — todos os direitos reservados.
