# Controle Financeiro do Casal
> Sistema web compartilhado de controle de despesas — Next.js + Firebase

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos Funcionais](#requisitos-funcionais)
3. [Requisitos Não Funcionais](#requisitos-não-funcionais)
4. [Arquitetura](#arquitetura)
5. [Modelo de Dados](#modelo-de-dados)
6. [Roadmap](#roadmap)

---

## Visão Geral

### Contexto
Sistema de controle financeiro privado para uso exclusivo de um casal. Ambos têm acesso total ao sistema, podendo lançar, editar e excluir qualquer despesa sem restrições.

### Premissas
- Apenas **2 usuários fixos** (marido e esposa)
- Finanças **mistas** — algumas despesas são compartilhadas, outras individuais
- Controle apenas de **despesas** (receitas fora do escopo)
- Interface **mobile-first**, acessível pelo navegador do celular
- Dados em **tempo real** — o que um lança, o outro vê instantaneamente

### Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14+ (App Router) |
| Estilização | Tailwind CSS |
| Autenticação | Firebase Auth (Google) |
| Banco de Dados | Firebase Firestore |
| Hospedagem | Firebase Hosting ou Vercel |
| Gráficos | Recharts ou Chart.js |

---

## Requisitos Funcionais

### RF-01 — Autenticação

- O sistema deve permitir login exclusivamente via **conta Google** (Firebase Auth)
- Apenas os **2 e-mails pré-cadastrados** têm acesso; qualquer outro e-mail deve ser bloqueado com mensagem de erro
- A sessão deve ser **persistente** — o usuário não precisa fazer login toda vez
- O perfil do Google (nome e foto) deve ser exibido na interface para identificação

---

### RF-02 — Lançamento de Despesas

O formulário de nova despesa deve conter os seguintes campos:

| Campo | Tipo | Obrigatório | Detalhe |
|---|---|---|---|
| Valor | Número decimal | Sim | Formato R$ |
| Categoria | Seleção | Sim | Lista fixa de categorias |
| Rótulo | Seleção | Sim | `Compartilhado` ou `Individual` |
| Data | Data | Sim | Default = data atual |
| Descrição | Texto livre | Não | Campo opcional |
| Tipo | Seleção | Sim | `Normal`, `Recorrente` ou `Parcelado` |

- Qualquer um dos dois usuários pode lançar, editar ou excluir **qualquer** despesa
- O campo **"Quem lançou"** é preenchido automaticamente com o usuário logado

---

### RF-03 — Categorias

Lista fixa de categorias (sem hierarquia):

```
Alimentação | Moradia | Transporte | Saúde | Lazer
Educação | Vestuário | Assinaturas | Outros
```

---

### RF-04 — Rótulos

Cada despesa deve ter um rótulo identificando sua natureza:

- **Compartilhado** — despesa do casal (ex: mercado, aluguel, conta de luz)
- **Individual** — despesa pessoal de um dos dois (ex: roupa, curso)

---

### RF-05 — Lançamentos Recorrentes

- O usuário pode marcar uma despesa como **recorrente mensal**
- O sistema deve gerar automaticamente a despesa nos meses seguintes
- Cada ocorrência pode ser **editada individualmente** sem afetar as demais
- O usuário pode **cancelar as ocorrências futuras** a partir de um determinado mês
- Exemplos de uso: aluguel, financiamento, assinaturas (Netflix, Spotify)

---

### RF-06 — Parcelamentos (Cartão de Crédito)

- O usuário informa: **valor total da compra** + **número de parcelas**
- O sistema calcula automaticamente o **valor de cada parcela** (`total ÷ parcelas`)
- Cada parcela é **vinculada ao seu respectivo mês** — a 1ª no mês atual, a 2ª no próximo, e assim por diante
- Na listagem, cada parcela aparece com a identificação: `Nome da compra (2/6)`
- O usuário pode **cancelar as parcelas restantes** a partir de qualquer mês

---

### RF-07 — Dashboard (Tela Principal)

Tela inicial, aberta com frequência diária. Deve exibir:

- **Mês atual** com navegação entre meses (← →)
- **Total gasto no mês** em destaque
- **Divisão por rótulo**: total Compartilhado vs. total Individual
- **Gráfico de pizza** com gastos por categoria
- **Comparativo entre os dois usuários**: quanto cada um lançou no mês
- **Lista dos últimos lançamentos** com scroll (data, descrição, valor, categoria, rótulo)

---

### RF-08 — Visão Mensal Detalhada

Tela de detalhe com todos os lançamentos de um mês:

- Lista completa de despesas do mês selecionado
- **Filtros combinados**: por categoria, por rótulo, por usuário
- **Totais por categoria** do mês
- Acesso a qualquer mês do histórico

---

### RF-09 — Edição e Exclusão

- Qualquer despesa pode ser **editada** por qualquer um dos dois usuários
- Despesas **recorrentes**: ao editar, perguntar se altera só aquela ocorrência ou todas as futuras
- Despesas **parceladas**: ao excluir, perguntar se cancela só aquela parcela ou todas as restantes
- Despesas **normais**: edição e exclusão simples, sem confirmação adicional

---

## Requisitos Não Funcionais

### RNF-01 — Usabilidade
- Interface **mobile-first**, funcionando bem em telas a partir de 360px
- Fluxo de lançamento de despesa em **no máximo 3 toques**
- Feedback visual imediato em todas as ações (loading, sucesso, erro)

### RNF-02 — Performance
- Dashboard deve carregar em **menos de 2 segundos**
- Usar **onSnapshot** do Firestore para sincronização em tempo real entre os dois usuários

### RNF-03 — Segurança
- **Firestore Security Rules** bloqueando acesso a qualquer UID que não seja um dos 2 autorizados
- Nenhum dado sensível exposto no frontend

### RNF-04 — Disponibilidade
- Hospedagem com **deploy contínuo** via Vercel ou Firebase Hosting
- Sem necessidade de backend próprio — 100% serverless

### RNF-05 — Manutenibilidade
- Código organizado em módulos (componentes, hooks, services)
- Tipagem com **TypeScript**
- Variáveis de ambiente para configurações sensíveis (Firebase keys)

---

## Arquitetura

### Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENTE                          │
│                    (Next.js / Browser)                  │
│                                                         │
│   ┌──────────┐   ┌──────────┐   ┌─────────────────┐   │
│   │Dashboard │   │Formulário│   │  Visão Mensal   │   │
│   │          │   │de Gasto  │   │  + Filtros      │   │
│   └────┬─────┘   └────┬─────┘   └────────┬────────┘   │
│        └──────────────┴──────────────────┘             │
│                        │                               │
│              ┌──────────▼──────────┐                   │
│              │   Camada de Serviço │                   │
│              │  (hooks + services) │                   │
│              └──────────┬──────────┘                   │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │           FIREBASE            │
          │                               │
          │  ┌─────────┐  ┌───────────┐  │
          │  │  Auth   │  │ Firestore │  │
          │  │ Google  │  │ (Database)│  │
          │  └─────────┘  └───────────┘  │
          └───────────────────────────────┘
```

### Estrutura de Pastas (Next.js)

```
/
├── app/
│   ├── layout.tsx              # Layout raiz com AuthProvider
│   ├── page.tsx                # Redireciona para /dashboard ou /login
│   ├── login/
│   │   └── page.tsx            # Tela de login com Google
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard principal
│   └── month/
│       └── [year]/[month]/
│           └── page.tsx        # Visão mensal detalhada
│
├── components/
│   ├── ui/                     # Componentes genéricos (Button, Input, Modal...)
│   ├── transaction/
│   │   ├── TransactionForm.tsx         # Formulário de nova despesa
│   │   ├── TransactionList.tsx         # Lista de despesas
│   │   ├── TransactionItem.tsx         # Item individual da lista
│   │   └── TransactionFilters.tsx      # Filtros da visão mensal
│   └── dashboard/
│       ├── MonthSummary.tsx            # Total e divisão por rótulo
│       ├── CategoryChart.tsx           # Gráfico de pizza
│       └── UserComparison.tsx          # Comparativo entre usuários
│
├── hooks/
│   ├── useAuth.ts              # Autenticação e usuário logado
│   ├── useTransactions.ts      # CRUD de transações (onSnapshot)
│   └── useMonthSummary.ts      # Cálculos e agregações do mês
│
├── services/
│   ├── firebase.ts             # Inicialização do Firebase
│   ├── auth.ts                 # Funções de autenticação
│   └── transactions.ts         # Operações no Firestore
│
├── types/
│   └── index.ts                # Tipos TypeScript globais
│
└── constants/
    └── index.ts                # Categorias, rótulos, e-mails autorizados
```

### Fluxo de Autenticação

```
Usuário acessa o sistema
        │
        ▼
  Tem sessão ativa?
   /           \
 Sim           Não
  │             │
  ▼             ▼
Dashboard    Tela de Login
              │
              ▼
         Login Google
              │
              ▼
    E-mail está na whitelist?
       /              \
      Sim             Não
       │               │
       ▼               ▼
   Dashboard     Erro + Logout
```

### Fluxo de Lançamento Parcelado

```
Usuário informa valor total + nº de parcelas
              │
              ▼
   Sistema gera installmentGroupId (UUID)
              │
              ▼
   Para cada parcela (1 até N):
   - amount = total ÷ N
   - date = mês atual + (i - 1) meses
   - installmentIndex = i
   - installmentTotal = N
              │
              ▼
   N documentos gravados no Firestore
   cada um vinculado ao seu mês
```

---

## Modelo de Dados

### Coleção: `transactions`

```typescript
interface Transaction {
  id: string;                         // Firestore document ID

  // Dados principais
  amount: number;                     // Valor em R$
  category: Category;                 // Enum de categorias
  label: 'shared' | 'individual';     // Rótulo
  description?: string;               // Descrição opcional
  date: string;                       // 'YYYY-MM-DD'

  // Usuário
  userId: string;                     // UID do usuário que lançou
  userName: string;                   // Nome para exibição

  // Tipo de lançamento
  type: 'normal' | 'recurring' | 'installment';

  // Recorrente (type === 'recurring')
  recurringId?: string;               // UUID do grupo
  frequency?: 'monthly';

  // Parcelado (type === 'installment')
  installmentGroupId?: string;        // UUID do grupo
  installmentIndex?: number;          // Ex: 2
  installmentTotal?: number;          // Ex: 6

  // Metadados
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Coleção: `users`

```typescript
interface User {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: Timestamp;
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Apenas os 2 e-mails autorizados têm acesso
    function isAuthorized() {
      return request.auth != null &&
        request.auth.token.email in [
          'email-marido@gmail.com',
          'email-esposa@gmail.com'
        ];
    }

    match /transactions/{txId} {
      allow read, write: if isAuthorized();
    }

    match /users/{userId} {
      allow read, write: if isAuthorized();
    }
  }
}
```

---

## Roadmap

### Fase 1 — MVP (Semanas 1–3)

**Objetivo:** sistema funcional para lançar e visualizar despesas normais.

| # | Tarefa |
|---|---|
| 1.1 | Setup do projeto Next.js + Firebase + Tailwind |
| 1.2 | Configuração do Firebase Auth com whitelist de e-mails |
| 1.3 | Tela de login com Google |
| 1.4 | Guard de rota — redireciona para login se não autenticado |
| 1.5 | Formulário de nova despesa (tipo Normal) |
| 1.6 | Listagem de despesas com scroll |
| 1.7 | Edição e exclusão de despesas normais |
| 1.8 | Dashboard com total do mês e lista dos últimos lançamentos |
| 1.9 | Navegação entre meses (← →) |
| 1.10 | Deploy no Vercel ou Firebase Hosting |

**Entregável:** os dois conseguem lançar, ver e editar despesas.

---

### Fase 2 — Recorrentes e Parcelamentos (Semanas 4–5)

**Objetivo:** automatizar despesas que se repetem.

| # | Tarefa |
|---|---|
| 2.1 | Lógica de criação de despesas recorrentes mensais |
| 2.2 | Edição individual de uma ocorrência recorrente |
| 2.3 | Cancelamento de ocorrências futuras |
| 2.4 | Lógica de parcelamento (gerar N documentos por mês) |
| 2.5 | Exibição da parcela com índice: `Nome (2/6)` |
| 2.6 | Cancelamento das parcelas restantes |

**Entregável:** aluguel, assinaturas e parcelamentos funcionando automaticamente.

---

### Fase 3 — Filtros, Gráficos e Comparativo (Semanas 6–7)

**Objetivo:** enriquecer a visualização e análise dos dados.

| # | Tarefa |
|---|---|
| 3.1 | Gráfico de pizza por categoria no Dashboard |
| 3.2 | Comparativo de gastos entre os dois usuários |
| 3.3 | Divisão visual: Compartilhado vs. Individual |
| 3.4 | Tela de visão mensal detalhada |
| 3.5 | Filtros por categoria, rótulo e usuário |
| 3.6 | Totais por categoria na visão mensal |
| 3.7 | Histórico navegável de meses anteriores |

**Entregável:** visão completa e filtrada de qualquer mês.

---

### Fase 4 — Polimento (Semana 8)

**Objetivo:** experiência refinada e pronta para uso diário.

| # | Tarefa |
|---|---|
| 4.1 | Otimização mobile (gestos, espaçamentos, tipografia) |
| 4.2 | Estados de loading e feedback de ações |
| 4.3 | Tratamento de erros (offline, falha de rede) |
| 4.4 | PWA — instalar como app no celular |
| 4.5 | Testes manuais completos dos dois usuários |

**Entregável:** sistema pronto para uso diário como app no celular.

---

### Visão do Roadmap

```
Semana  1   2   3   4   5   6   7   8
        ├───────────┤
Fase 1  │    MVP    │
                    ├───────┤
Fase 2              │Recorr.│
                            ├───────┤
Fase 3                      │Filtros│
                                    ├───┤
Fase 4                              │PWA│
```

---

## Fora do Escopo

Os itens abaixo foram deliberadamente excluídos para manter o sistema simples:

| Item | Motivo |
|---|---|
| Controle de receitas | Não é necessidade do casal |
| Múltiplas carteiras ou contas | Desnecessário para 2 pessoas |
| Importação de extrato bancário | Alta complexidade técnica |
| Notificações push | Sobrecarga desnecessária |
| Relatórios avançados / exportação | Fora do uso diário |
| App mobile nativo (iOS/Android) | Next.js responsivo + PWA resolve |
| Categorias com hierarquia | Adiciona complexidade sem ganho |
