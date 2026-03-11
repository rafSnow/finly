# FINLY — Documento de Arquitetura de Sistema (SAD)
**Versão 1.0 — 2025 — Confidencial**

---

## Histórico de Revisões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2025 | Versão inicial — arquitetura baseada em Next.js PWA + Firebase |

---

## 1. Visão Geral

O Finly é uma aplicação web de gestão financeira pessoal e familiar. Toda a infraestrutura de backend é provida pelo **Firebase (Google Cloud)**, eliminando a necessidade de servidores próprios. O frontend é uma aplicação **Next.js** com suporte a **PWA**, hospedada na **Vercel**.

### 1.1 Princípios Arquiteturais

| Princípio | Descrição |
|-----------|-----------|
| **Serverless-first** | Nenhum servidor gerenciado pela equipe; toda a lógica de backend roda em Firebase Cloud Functions |
| **Security by Rules** | O acesso aos dados é controlado exclusivamente pelas Firestore Security Rules, não por middleware customizado |
| **Offline-ready** | A PWA utiliza Service Worker para cache local, permitindo leitura offline das últimas transações |
| **Mobile-First** | A UI é projetada para telas pequenas e escalada para desktop |
| **Data-local** | Todos os dados financeiros residem no Brasil — Firebase região `southamerica-east1` (São Paulo) |

---

## 2. Diagrama de Contexto (C4 — Nível 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                           │
│              (Browser Desktop / Browser Mobile / PWA)           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FINLY (Next.js PWA)                         │
│                      Hospedado na Vercel                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  App Router (RSC + Client Components + Service Worker)  │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────┬───────────────────────┬────────────────────────────┘
             │ Firebase SDK          │ HTTPS (REST/gRPC)
             ▼                       ▼
┌────────────────────┐   ┌──────────────────────────────────────┐
│  Firebase Auth     │   │         Firebase Cloud Functions      │
│  (Autenticação)    │   │  (Lógica de negócio, OFX, Scheduler) │
└────────────────────┘   └──────────────┬───────────────────────┘
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │   Cloud Firestore         │
                         │   (Banco de dados)        │
                         │   região: southamerica-   │
                         │   east1 (São Paulo)       │
                         └──────────────────────────┘
```

---

## 3. Diagrama de Containers (C4 — Nível 2)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FIREBASE PROJECT — finly-prod                                           │
│                                                                          │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────────┐  │
│  │ Firebase Auth   │   │  Cloud Firestore │   │  Cloud Functions      │  │
│  │                 │   │                 │   │                       │  │
│  │ - Email/Senha   │   │ - /users        │   │ fn-processOFX         │  │
│  │ - Google OAuth  │   │ - /families     │   │ fn-recurrenceJob      │  │
│  │ - 2FA           │   │ - /families/*/  │   │ fn-budgetAlert        │  │
│  │ - Token mgmt    │   │   accounts      │   │ fn-deleteUser         │  │
│  └────────┬────────┘   │   cards         │   │ fn-exportData         │  │
│           │            │   transactions  │   └───────────────────────┘  │
│           │            │   budgets       │                               │
│           │            │   goals         │   ┌───────────────────────┐  │
│           │            │   auditLogs     │   │  Cloud Scheduler      │  │
│           │            └─────────────────┘   │  (Cron Jobs)          │  │
│           │                                  │ - recurrências diárias │  │
│           │                                  │ - alertas de orçamento │  │
│           │                                  └───────────────────────┘  │
└───────────┼──────────────────────────────────────────────────────────────┘
            │
            │ Firebase SDK (client-side)
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  NEXT.JS APP — Vercel                                                    │
│                                                                          │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  App Router    │  │  Service Worker  │  │  Firebase Client SDK     │  │
│  │  (RSC + CC)    │  │  (PWA / Offline) │  │  (Auth + Firestore SDK)  │  │
│  └────────────────┘  └─────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Stack Tecnológica Detalhada

### 4.1 Frontend

| Tecnologia | Versão Mín. | Finalidade |
|------------|-------------|------------|
| Next.js | 14+ | Framework React com App Router e SSR/RSC |
| TypeScript | 5+ | Tipagem estática em todo o projeto |
| Tailwind CSS | 3+ | Estilização utilitária Mobile-First |
| next-pwa / Workbox | latest | Geração de Service Worker e manifest PWA |
| React Query (TanStack) | 5+ | Cache e sincronização de estado do servidor |
| Zustand | 4+ | Estado global leve no cliente |
| Recharts | 2+ | Gráficos dos dashboards e relatórios |
| React Hook Form + Zod | latest | Formulários com validação tipada |
| date-fns | 3+ | Manipulação de datas |

### 4.2 Backend (Firebase)

| Serviço Firebase | Plano | Finalidade |
|------------------|-------|------------|
| Authentication | Blaze | Cadastro, login, OAuth Google, 2FA, tokens |
| Cloud Firestore | Blaze | Banco de dados NoSQL principal |
| Cloud Functions | Blaze | Lógica server-side, OFX, recorrências, alertas |
| Cloud Scheduler | Blaze | Cron jobs (recorrências, alertas de orçamento) |
| Firebase Hosting | Blaze | Hospedagem de assets estáticos (alternativa à Vercel) |

> **Atenção:** O plano Blaze (pay-as-you-go) é obrigatório para uso de Cloud Functions.

### 4.3 Infraestrutura e DevOps

| Ferramenta | Finalidade |
|------------|------------|
| Vercel | Hospedagem e deploy automático do Next.js |
| Firebase CLI | Deploy de Functions, Firestore Rules e índices |
| GitHub Actions | Pipeline CI/CD (lint, testes, build, deploy) |
| Jest + Testing Library | Testes unitários e de componentes |
| firebase-admin + @firebase/rules-unit-testing | Testes das Firestore Security Rules |
| ESLint + Prettier | Qualidade e padronização de código |

---

## 5. Estrutura de Pastas — Next.js

```
finly/
├── app/                          # App Router (Next.js 14+)
│   ├── (auth)/                   # Route group — páginas públicas
│   │   ├── login/
│   │   └── cadastro/
│   ├── (app)/                    # Route group — páginas autenticadas
│   │   ├── layout.tsx            # Layout autenticado com sidebar
│   │   ├── dashboard/
│   │   ├── transacoes/
│   │   ├── contas/
│   │   ├── cartoes/
│   │   ├── orcamento/
│   │   ├── metas/
│   │   ├── relatorios/
│   │   ├── familia/
│   │   └── importar/
│   ├── api/                      # Route Handlers (Next.js API)
│   │   └── export/               # Endpoint de exportação CSV
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                       # Componentes base (Button, Input, Modal…)
│   ├── charts/                   # Wrappers dos gráficos Recharts
│   ├── forms/                    # Formulários de transação, conta, cartão…
│   └── layout/                   # Sidebar, Header, BottomNav (mobile)
│
├── lib/
│   ├── firebase/
│   │   ├── client.ts             # Inicialização do Firebase Client SDK
│   │   ├── auth.ts               # Helpers de autenticação
│   │   └── firestore.ts          # Helpers de leitura/escrita no Firestore
│   ├── ofx/
│   │   └── parser.ts             # Parser OFX (chamado via Cloud Function)
│   ├── finance/
│   │   ├── balance.ts            # Cálculo de saldo
│   │   ├── installments.ts       # Lógica de parcelamento
│   │   └── duplicates.ts         # Detecção de duplicidade OFX
│   └── utils.ts
│
├── hooks/                        # Custom hooks React
├── store/                        # Zustand stores
├── types/                        # Tipos TypeScript globais
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # Ícones PWA (192x192, 512x512…)
│
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── ofx/
│   │   │   └── processOFX.ts
│   │   ├── recurrence/
│   │   │   └── recurrenceJob.ts
│   │   ├── budget/
│   │   │   └── budgetAlert.ts
│   │   └── user/
│   │       ├── deleteUser.ts
│   │       └── exportData.ts
│   ├── package.json
│   └── tsconfig.json
│
├── firestore.rules               # Firestore Security Rules
├── firestore.indexes.json        # Índices compostos do Firestore
├── firebase.json
├── .firebaserc
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 6. Modelagem de Dados — Firestore

### 6.1 Estrutura de Coleções

```
/users/{userId}
  name:        string
  email:       string
  currency:    string          // "BRL"
  photoURL:    string | null
  createdAt:   timestamp

/families/{familyId}
  name:        string
  createdAt:   timestamp
  members:     array<MemberRef>
    - userId:  string
    - role:    "admin" | "editor" | "viewer"
    - joinedAt: timestamp

/families/{familyId}/accounts/{accountId}
  name:          string
  bank:          string
  type:          "corrente" | "poupanca" | "digital"
  initialBalance: number
  archivedAt:    timestamp | null
  createdBy:     string        // userId
  createdAt:     timestamp

/families/{familyId}/transactions/{transactionId}
  amount:        number        // positivo = receita, negativo = despesa
  date:          timestamp
  type:          "income" | "expense" | "transfer"
  categoryId:    string
  accountId:     string
  cardId:        string | null
  description:   string
  source:        "manual" | "ofx"
  tags:          array<string>
  recurrenceId:  string | null
  installmentRef: { total: number, current: number } | null
  createdBy:     string
  createdAt:     timestamp

/families/{familyId}/cards/{cardId}
  name:          string
  brand:         "visa" | "mastercard" | "elo" | "amex" | "outro"
  limit:         number
  closingDay:    number        // 1–28
  dueDay:        number        // 1–28
  linkedAccountId: string      // conta para pagamento da fatura
  createdBy:     string
  createdAt:     timestamp

/families/{familyId}/budgets/{budgetId}
  categoryId:    string
  month:         string        // "2025-06"
  maxAmount:     number
  createdBy:     string
  createdAt:     timestamp

/families/{familyId}/goals/{goalId}
  name:          string
  targetAmount:  number
  deadline:      timestamp
  linkedAccountId: string
  contributions: array<{ amount: number, date: timestamp, userId: string }>
  createdBy:     string
  createdAt:     timestamp

/families/{familyId}/auditLogs/{logId}
  action:        string        // "transaction.create", "member.remove"…
  performedBy:   string        // userId
  targetId:      string | null // id do documento afetado
  metadata:      map
  createdAt:     timestamp

/families/{familyId}/recurrences/{recurrenceId}
  templateTransaction: map     // cópia do template da transação
  frequency:     "daily" | "weekly" | "monthly" | "yearly"
  nextDue:       timestamp
  endDate:       timestamp | null
  active:        boolean
  createdBy:     string
  createdAt:     timestamp
```

### 6.2 Categorias (Coleção Global)

```
/categories/{categoryId}
  name:          string
  icon:          string
  parentId:      string | null  // null = categoria raiz
  type:          "income" | "expense" | "both"
  isSystem:      boolean        // true = padrão do sistema, false = custom do usuário
  userId:        string | null  // null = categoria global do sistema
```

---

## 7. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ──────────────────────────────────────────────────
    function isAuth() {
      return request.auth != null;
    }

    function isFamilyMember(familyId) {
      return isAuth() &&
        exists(/databases/$(database)/documents/families/$(familyId)) &&
        request.auth.uid in
          get(/databases/$(database)/documents/families/$(familyId))
            .data.members.map(m => m.userId);
    }

    function getFamilyRole(familyId) {
      let members = get(/databases/$(database)/documents/families/$(familyId)).data.members;
      let match = members.filter(m => m.userId == request.auth.uid);
      return match.size() > 0 ? match[0].role : null;
    }

    function isFamilyAdmin(familyId) {
      return getFamilyRole(familyId) == 'admin';
    }

    function canEdit(familyId) {
      return getFamilyRole(familyId) == 'admin' ||
             getFamilyRole(familyId) == 'editor';
    }

    // ── Usuários ─────────────────────────────────────────────────
    match /users/{userId} {
      allow read:   if isAuth() && request.auth.uid == userId;
      allow create: if isAuth() && request.auth.uid == userId;
      allow update: if isAuth() && request.auth.uid == userId;
      allow delete: if false; // exclusão via Cloud Function apenas
    }

    // ── Famílias ──────────────────────────────────────────────────
    match /families/{familyId} {
      allow read:   if isFamilyMember(familyId);
      allow create: if isAuth();
      allow update: if isFamilyAdmin(familyId);
      allow delete: if false;

      // Subcoleções — leitura para todos os membros
      match /accounts/{docId} {
        allow read:   if isFamilyMember(familyId);
        allow write:  if canEdit(familyId);
      }
      match /transactions/{docId} {
        allow read:   if isFamilyMember(familyId);
        allow write:  if canEdit(familyId);
      }
      match /cards/{docId} {
        allow read:   if isFamilyMember(familyId);
        allow write:  if canEdit(familyId);
      }
      match /budgets/{docId} {
        allow read:   if isFamilyMember(familyId);
        allow write:  if canEdit(familyId);
      }
      match /goals/{docId} {
        allow read:   if isFamilyMember(familyId);
        allow write:  if canEdit(familyId);
      }
      match /auditLogs/{docId} {
        allow read:   if isFamilyAdmin(familyId);
        allow write:  if false; // escrita apenas via Cloud Function
      }
      match /recurrences/{docId} {
        allow read:   if isFamilyMember(familyId);
        allow write:  if canEdit(familyId);
      }
    }

    // ── Categorias globais ────────────────────────────────────────
    match /categories/{categoryId} {
      allow read:  if isAuth();
      allow write: if isAuth() &&
                      resource.data.isSystem == false &&
                      resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 8. Cloud Functions

### 8.1 Catálogo de Funções

| Função | Trigger | Descrição |
|--------|---------|-----------|
| `fn-processOFX` | HTTP (callable) | Recebe o conteúdo do arquivo OFX, faz o parse, detecta duplicatas e retorna as transações pré-processadas para confirmação do usuário |
| `fn-recurrenceJob` | Cloud Scheduler (diário, 00:05 BRT) | Verifica recorrências com `nextDue <= hoje`, cria as transações correspondentes e atualiza `nextDue` |
| `fn-budgetAlert` | Firestore trigger (onWrite em transactions) | Ao inserir/editar transação, recalcula o progresso do orçamento do mês; envia notificação se atingiu 80% ou 100% |
| `fn-deleteUser` | HTTP (callable) | Anonimiza dados pessoais do usuário no Firestore e deleta a conta no Firebase Auth (LGPD) |
| `fn-exportData` | HTTP (callable) | Gera e retorna o JSON completo dos dados do usuário para portabilidade (LGPD) |

### 8.2 Exemplo — fn-processOFX

```typescript
// functions/src/ofx/processOFX.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { parseOFX } from './parser';
import { detectDuplicates } from './duplicates';

export const processOFX = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login necessário');

    const { ofxContent, familyId, accountId } = data;

    // 1. Parse do OFX
    const transactions = parseOFX(ofxContent);

    // 2. Buscar transações existentes para detectar duplicatas
    const existing = await admin.firestore()
      .collection(`families/${familyId}/transactions`)
      .where('accountId', '==', accountId)
      .orderBy('date', 'desc')
      .limit(200)
      .get();

    // 3. Detectar duplicatas
    const result = detectDuplicates(transactions, existing.docs.map(d => d.data()));

    return result; // { toImport: [], duplicates: [] }
  });
```

---

## 9. PWA — Configuração

### 9.1 manifest.json

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
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 9.2 Estratégia de Cache (Service Worker)

| Recurso | Estratégia | TTL |
|---------|------------|-----|
| Assets estáticos (JS, CSS, fonts) | Cache First | Indefinido (hash no nome) |
| Páginas Next.js | Stale While Revalidate | 1 hora |
| Dados Firestore (últimas transações) | Cache First com background sync | 15 minutos |
| Cloud Functions (OFX, exportação) | Network Only | — |
| Autenticação Firebase | Network Only | — |

---

## 10. Fluxos Principais

### 10.1 Autenticação

```
Usuário → Login Page
    → Firebase Auth SDK (email/senha ou Google OAuth)
    → Token JWT emitido pelo Firebase
    → SDK armazena token automaticamente
    → Redirect para /dashboard
    → Firestore SDK usa token em todas as operações
```

### 10.2 Importação OFX

```
Usuário → Seleciona arquivo .ofx na UI
    → Frontend lê o arquivo como string (FileReader API)
    → Chama fn-processOFX via Firebase SDK (httpsCallable)
    → Cloud Function: parse → detecção de duplicatas → retorna preview
    → Frontend exibe tabela de preview com status (novo / duplicado)
    → Usuário confirma seleção
    → Frontend grava transações aprovadas em batch no Firestore
    → Firestore Security Rules validam permissão de escrita
```

### 10.3 Transações Recorrentes

```
Cloud Scheduler → dispara fn-recurrenceJob às 00:05 BRT
    → Busca /families/*/recurrences onde nextDue <= hoje e active == true
    → Para cada recorrência:
        → Cria nova transação no Firestore (cópia do template)
        → Atualiza nextDue para a próxima data
        → Se endDate definido e nextDue > endDate → seta active = false
```

### 10.4 Alerta de Orçamento

```
Usuário insere transação (despesa)
    → Firestore onWrite dispara fn-budgetAlert
    → Função busca orçamento da categoria no mês corrente
    → Soma todas as transações da categoria no mês
    → Se progresso >= 80%:
        → Grava notificação em /users/{userId}/notifications
        → Frontend exibe via Firestore real-time listener
```

---

## 11. Índices Firestore

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "accountId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "source", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "budgets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "month", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "recurrences",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "nextDue", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 12. Pipeline CI/CD

```
Push para branch feature/*
    → GitHub Actions: lint + type-check + testes unitários

Pull Request para main
    → GitHub Actions:
        → lint + type-check
        → testes unitários (Jest)
        → testes de Security Rules (@firebase/rules-unit-testing)
        → build Next.js
        → Vercel Preview Deploy (ambiente de preview)

Merge para main
    → GitHub Actions:
        → build Next.js
        → Vercel Production Deploy
        → firebase deploy --only functions,firestore:rules,firestore:indexes
```

---

## 13. Decisões Arquiteturais (ADRs)

### ADR-01 — Firebase como backend completo
**Decisão:** Utilizar o Firebase (Firestore + Auth + Functions) como única camada de backend.
**Motivação:** Elimina a necessidade de gerenciar servidores, autoscaling e infraestrutura. O SLA do Firebase (99,95%) atende aos requisitos de disponibilidade. O custo é proporcional ao uso real.
**Trade-off:** Vendor lock-in com o Google Cloud; migração futura exigiria reescrita do backend.

### ADR-02 — Next.js App Router com RSC
**Decisão:** Adotar o App Router do Next.js 14+ com React Server Components onde possível.
**Motivação:** Melhor performance (menos JS no cliente), SEO da landing page, e estrutura de rotas mais clara.
**Trade-off:** Curva de aprendizado maior; interações com Firebase Client SDK devem estar em Client Components (`'use client'`).

### ADR-03 — Firestore Security Rules como única barreira de autorização
**Decisão:** Não há middleware de autorização na API; toda autorização é feita nas Security Rules.
**Motivação:** Simplifica a arquitetura e evita inconsistências entre duas camadas de autorização. As Rules são testáveis e versionadas junto ao código.
**Trade-off:** As Rules precisam ser rigorosamente testadas; um erro pode expor dados ou bloquear usuários legítimos.

### ADR-04 — Processamento OFX em Cloud Function
**Decisão:** O parse e processamento do arquivo OFX ocorrem exclusivamente em Cloud Function, nunca no cliente.
**Motivação:** Evita expor a lógica de parsing no browser; permite futuras evoluções (ML para categorização) sem mudança no frontend.
**Trade-off:** Adiciona latência de cold start nas Functions; mitigado com `minInstances: 1` em produção se necessário.

### ADR-05 — Vercel para hospedagem do frontend
**Decisão:** Hospedar o Next.js na Vercel ao invés do Firebase Hosting.
**Motivação:** A Vercel oferece integração nativa com Next.js (ISR, Edge Functions, Preview Deploys), sem configuração adicional.
**Trade-off:** Mais um serviço externo; custo adicional em escala, mas justificado pela experiência de DX.

---

*Finly © 2025 — Documento Confidencial — Versão 1.0*
