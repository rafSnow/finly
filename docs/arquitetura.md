# Arquitetura — Controle Financeiro para Casais
**Stack:** Next.js + Firebase · **Versão:** 1.0

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Roteamento por pasta, layouts aninhados, Server Components |
| Linguagem | TypeScript | Tipagem de modelos de domínio (Entry, Goal, Category, Family) |
| Estilização | Tailwind CSS | Utilitário, sem CSS custom extenso, produtivo para time pequeno |
| Autenticação | Firebase Auth | E-mail/senha, OAuth Google, reset de senha sem backend próprio |
| Banco de dados | Firestore | NoSQL em tempo real, Security Rules nativas, sem servidor |
| Hospedagem | Vercel | Melhor integração com Next.js, previews por branch, Edge nativo |
| Gráficos | Recharts | Leve, declarativo, React-friendly |
| Estado global | React Context + useReducer | Suficiente para a escala do app, sem over-engineering |

---

## 2. Estrutura de Pastas

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
  (app)/                        # rotas protegidas — layout com bottom nav
    dashboard/page.tsx
    lancamentos/
      page.tsx                  # listagem
      novo/page.tsx             # formulário
      [id]/editar/page.tsx
    metas/page.tsx
    categorias/page.tsx
    ajustes/page.tsx
  layout.tsx                    # root layout — providers
  middleware.ts                 # redirect para /login se não autenticado

components/
  ui/                           # Button, Input, Select, Modal, Card...
  dashboard/                    # SummaryCard, CategoryChart, GoalBar
  lancamentos/                  # EntryForm, EntryList, EntryItem
  metas/                        # GoalCard, GoalForm
  categorias/                   # CategoryList, CategoryForm
  layout/                       # BottomNav, Header

lib/
  firebase.ts                   # init app, auth, db
  firestore/
    entries.ts                  # CRUD de lançamentos
    categories.ts
    goals.ts
    families.ts
    invites.ts

hooks/
  useAuth.ts
  useFamily.ts
  useEntries.ts
  useGoals.ts

types/
  index.ts                      # Entry, Goal, Category, Family, Invite
```

---

## 3. Modelagem do Firestore

Toda a informação financeira fica dentro do documento da família (`families/{familyId}`), garantindo isolamento por casal e simplificando as Security Rules.

### 3.1 `families / {familyId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `memberIds` | `string[]` | UIDs dos dois parceiros (máx. 2) |
| `createdAt` | `Timestamp` | Data de criação da família |
| `createdBy` | `string` | UID de quem criou |

---

### 3.2 `families/{id}/entries / {entryId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `type` | `income \| expense` | Tipo do lançamento |
| `value` | `number` | Valor em reais (ex.: 150.00) |
| `categoryId` | `string` | Referência à categoria |
| `date` | `Timestamp` | Data do lançamento |
| `description` | `string?` | Descrição opcional (máx. 200 chars) |
| `ownerId` | `string` | UID do usuário que criou |
| `recurrenceId` | `string?` | ID do grupo de recorrência (se recorrente) |
| `recurrenceIndex` | `number?` | Posição dentro da série (0, 1, 2...) |
| `isRecurring` | `boolean` | Flag de lançamento recorrente |
| `createdAt` | `Timestamp` | Data de criação do documento |

---

### 3.3 `families/{id}/categories / {categoryId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | `string` | Nome da categoria (ex.: Alimentação) |
| `type` | `income \| expense \| both` | Tipo de lançamento associado |
| `createdAt` | `Timestamp` | Data de criação |
| `isDefault` | `boolean` | Se é uma categoria padrão do sistema |

---

### 3.4 `families/{id}/goals / {goalId}`

| Campo | Tipo | Descrição |
|---|---|---|
| `categoryId` | `string` | Referência à categoria alvo |
| `limit` | `number` | Valor limite mensal (ex.: 500.00) |
| `period` | `monthly` | Período da meta (v1: apenas mensal) |
| `createdAt` | `Timestamp` | Data de criação |

---

### 3.5 `invites / {code}`

| Campo | Tipo | Descrição |
|---|---|---|
| `fromUid` | `string` | UID de quem enviou o convite |
| `toEmail` | `string` | E-mail do parceiro convidado |
| `familyId` | `string` | Família que será compartilhada |
| `status` | `pending \| accepted \| expired` | Estado atual do convite |
| `expiresAt` | `Timestamp` | Data de expiração (createdAt + 7 dias) |
| `createdAt` | `Timestamp` | Data de criação |

> 📌 **Estratégia de recorrência:** ao salvar um lançamento recorrente, gerar N documentos de Entry no Firestore com o mesmo `recurrenceId`. Não usar Cloud Functions agendadas na v1.

---

## 4. Firebase Security Rules

Regra central: apenas membros listados em `families/{familyId}.memberIds` podem ler e escrever nas subcoleções daquela família.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Família — só membros leem e escrevem
    match /families/{familyId} {
      allow read, write: if request.auth.uid in resource.data.memberIds;

      match /entries/{entryId} {
        allow read: if request.auth.uid in
                    get(/databases/$(database)/documents/families/$(familyId)).data.memberIds;
        allow create: if request.auth.uid in
                    get(/databases/$(database)/documents/families/$(familyId)).data.memberIds;
        // Edição/exclusão: apenas o dono do lançamento
        allow update, delete: if resource.data.ownerId == request.auth.uid;
      }

      match /categories/{categoryId} {
        allow read, write: if request.auth.uid in
                    get(/databases/$(database)/documents/families/$(familyId)).data.memberIds;
      }

      match /goals/{goalId} {
        allow read, write: if request.auth.uid in
                    get(/databases/$(database)/documents/families/$(familyId)).data.memberIds;
      }
    }

    // Convites — remetente lê/escreve; destinatário (por e-mail) aceita
    match /invites/{code} {
      allow read: if request.auth.uid == resource.data.fromUid
                  || request.auth.token.email == resource.data.toEmail;
      allow create: if request.auth.uid == request.resource.data.fromUid;
      allow update: if request.auth.token.email == resource.data.toEmail;
    }

  }
}
```

---

## 5. Autenticação

### 5.1 Proteção de Rotas — `middleware.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('firebase-token')?.value;
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
                   || req.nextUrl.pathname.startsWith('/register');

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 5.2 `useAuth` Hook

```ts
// hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const fam = await getFamilyByMember(u.uid);
        setFamily(fam);
      }
      setLoading(false);
    });
  }, []);

  return { user, family, loading };
}
```

---

## 6. Lógica de Recorrência

Ao salvar um lançamento recorrente, a função `createRecurringEntries` calcula as N datas e salva todos os documentos em uma operação `batch` no Firestore.

```ts
// lib/firestore/entries.ts
async function createRecurringEntries(
  base: Omit<Entry, 'id'>,
  interval: 'weekly' | 'monthly' | 'yearly',
  count: number
) {
  const batch = writeBatch(db);
  const recurrenceId = crypto.randomUUID();

  for (let i = 0; i < count; i++) {
    const date = addInterval(base.date, interval, i);
    const ref = doc(collection(db, `families/${base.familyId}/entries`));

    batch.set(ref, {
      ...base,
      date,
      recurrenceId,
      recurrenceIndex: i,
      isRecurring: true,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

function addInterval(base: Date, interval: string, n: number): Date {
  const d = new Date(base);
  if (interval === 'weekly')  d.setDate(d.getDate() + 7 * n);
  if (interval === 'monthly') d.setMonth(d.getMonth() + n);
  if (interval === 'yearly')  d.setFullYear(d.getFullYear() + n);
  return d;
}
```

---

## 7. Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> 📌 Todas as variáveis Firebase são públicas por design (`NEXT_PUBLIC_`). O controle de acesso real é feito pelas Security Rules no Firestore, não pelo ocultamento das chaves.

---

## 8. Decisões Técnicas e Tradeoffs

| Decisão | Justificativa |
|---|---|
| Recorrência: gerar N docs no save | Mais simples, sem Cloud Functions. Tradeoff: editar "todos os seguintes" requer query + batch update. |
| Sem Redux / Zustand | React Context é suficiente para a escala do app. Adicionar lib de estado seria over-engineering. |
| Firestore em vez de Realtime Database | Queries mais ricas, subcoleções, Security Rules mais expressivas. |
| Vercel em vez de Firebase Hosting | Melhor integração com Next.js, previews automáticos por branch, Edge Functions nativas. |
| Edição de lançamento só pelo dono | Parceiro não edita/exclui lançamentos do outro. Evita conflitos e simplifica as Rules. |
| Sem Cloud Functions na v1 | Reduz complexidade e custo. Toda lógica roda no cliente. Functions entram na v2 para notificações. |
