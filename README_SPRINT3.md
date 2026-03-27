# Sprint 3 - Controle Financeiro para Casais

## Requisitos entregues

- ✅ Serviço de lançamentos em `lib/firestore/entries.ts`
  - `getEntries(familyId, filters)`
  - `createEntry(familyId, data)`
  - `createRecurringEntries(familyId, data, interval, count)`
  - `updateEntry(familyId, entryId, data)`
  - `updateRecurringEntries(familyId, entry, scope, data)`
  - `deleteEntry(familyId, entryId)`
  - `deleteRecurringEntries(familyId, entry, scope)`
  - `getEntryById(familyId, entryId)` (apoio para edição)
- ✅ Hook `useEntries(filters)` implementado
  - `entries`, `loading`, `error`
  - `createEntry`, `createRecurringEntries`, `updateEntry`, `deleteEntry`
  - recarregamento automático ao mudar filtros
- ✅ Tipos da Sprint 3 adicionados em `types/index.ts`
  - `EntryFilters`
  - `CreateEntryInput`
  - `RecurringScope`
- ✅ Componentes de lançamentos criados
  - `components/lancamentos/EntryForm.tsx`
  - `components/lancamentos/EntryList.tsx`
  - `components/lancamentos/EntryItem.tsx`
  - `components/lancamentos/RecurringScopeModal.tsx`
- ✅ Tela `/lancamentos` funcional
  - filtros por mês/ano, tipo e categoria
  - listagem agrupada por data
  - estado vazio com CTA
  - ações de editar/excluir
  - exclusão recorrente com escopo
  - botão flutuante para novo lançamento
- ✅ Tela `/lancamentos/novo` funcional
  - formulário completo
  - criação simples e recorrente
- ✅ Tela `/lancamentos/[id]/editar` funcional
  - carregamento por ID
  - edição com modal de escopo para recorrentes
- ✅ Build de produção validado (`npm run build`)

---

## Como rodar o projeto localmente

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure o Firebase
Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Publicar regras do Firestore
```bash
firebase deploy --only firestore:rules
```

### 4. Iniciar aplicação
```bash
npm run dev
```

### 5. Acessar
[http://localhost:3000](http://localhost:3000)

---

## Fluxos de teste da Sprint 3

### 1) Criar lançamento simples

1. Acessar `/lancamentos/novo`
2. Preencher: tipo, valor, categoria e data
3. Deixar "Recorrente?" desmarcado
4. Clicar em "Salvar"
5. Resultado esperado:
   - redireciona para `/lancamentos`
   - item aparece na lista do mês selecionado

### 2) Criar lançamento recorrente

1. Acessar `/lancamentos/novo`
2. Preencher os campos obrigatórios
3. Marcar "Recorrente?"
4. Selecionar intervalo e repetições (2 a 60)
5. Salvar
6. Resultado esperado:
   - N documentos criados com mesmo `recurrenceId`
   - `recurrenceIndex` sequencial
   - itens aparecem na listagem conforme as datas calculadas

### 3) Filtrar listagem

1. Acessar `/lancamentos`
2. Alterar mês com botões `<` e `>`
3. Trocar filtro de tipo (Todos, Despesas, Receitas)
4. Aplicar filtro de categoria
5. Resultado esperado:
   - lista atualiza respeitando todos os filtros

### 4) Editar lançamento não recorrente

1. Em `/lancamentos`, clicar em "Editar" num item não recorrente
2. Alterar campos
3. Salvar
4. Resultado esperado:
   - alterações persistidas
   - sem modal de escopo

### 5) Editar lançamento recorrente

1. Clicar em "Editar" num item com ícone `🔁`
2. Alterar dados e salvar
3. Selecionar escopo no modal
4. Resultado esperado:
   - `this`: altera apenas o documento atual
   - `this_and_following`: altera índices maiores/iguais ao atual
   - `all`: altera todos da recorrência

### 6) Excluir lançamento

1. Em `/lancamentos`, clicar em "Excluir"
2. Não recorrente: confirmar exclusão simples
3. Recorrente: selecionar escopo
4. Resultado esperado:
   - remoção conforme o escopo escolhido

### 7) Permissões entre parceiros

1. Conta A cria lançamento
2. Conta B visualiza na listagem da mesma família
3. Conta B tenta editar/excluir lançamento da Conta A
4. Resultado esperado:
   - leitura permitida
   - edição/exclusão bloqueada pelas rules
   - erro tratado na UI

---

## Regras de segurança relevantes para lançamentos

Arquivo: `firestore.rules`

```js
match /entries/{entryId} {
  allow read, create: if request.auth.uid in
    get(/databases/$(database)/documents/families/$(familyId)).data.memberIds;
  allow update, delete: if isFamilyMember(familyId)
    && resource.data.ownerId == request.auth.uid;
}
```

Resumo:
- Membros da família podem ler e criar lançamentos.
- Apenas o dono (`ownerId`) pode editar/excluir.

---

## Estrutura impactada na Sprint 3

```txt
app/
  (app)/
    lancamentos/
      page.tsx
      novo/page.tsx
      [id]/editar/page.tsx

components/
  lancamentos/
    EntryForm.tsx
    EntryList.tsx
    EntryItem.tsx
    RecurringScopeModal.tsx

hooks/
  useEntries.ts

lib/
  firestore/
    entries.ts

types/
  index.ts
```

---

## Checklist de conclusão

- ✅ `npm run build` passa sem erros
- ✅ Criação de lançamento simples funcionando
- ✅ Criação recorrente com lote funcionando
- ✅ Filtros por mês, tipo e categoria funcionando
- ✅ Edição individual funcionando
- ✅ Modal de escopo em edição recorrente funcionando
- ✅ Exclusão simples e recorrente funcionando
- ✅ Leitura entre parceiros funcionando
- ✅ Edição/exclusão restritas ao `ownerId`
- ✅ Loading e mensagens de erro em português implementados

---

## Observações

- Em cenários de filtros compostos (`date + type + category`), o Firestore pode exigir índice composto.
- Se aparecer erro de índice, criar pelo link sugerido no console e repetir o teste.
- Toda lógica de recorrência roda no cliente, sem Cloud Functions.

---

**Próxima sprint:** Dashboard financeiro (resumos, gráficos e visão individual/combinada).