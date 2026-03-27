# Sprint 4 - Dashboard e Metas

## Requisitos entregues

- ✅ Tipos da Sprint 4 adicionados em `types/index.ts`
  - `PeriodFilter`
  - `DashboardSummary`
  - `CategoryBreakdown`
  - `PartnerSummary`
  - `CreateGoalInput`
- ✅ Serviço de dashboard em `lib/firestore/dashboard.ts`
  - `getSummary(familyId, filters)` - resumo de receitas/despesas/saldo
  - `getEntriesByCategory(familyId, filters)` - despesas agrupadas por categoria com percentuais
  - `getPartnerSummaries(familyId, filters)` - resumo individual de cada parceiro
- ✅ Serviço de metas em `lib/firestore/goals.ts`
  - `getGoals(familyId)` - listar metas
  - `createGoal(familyId, data)` - criar meta com validação de duplicação
  - `updateGoal(familyId, goalId, data)` - editar meta
  - `deleteGoal(familyId, goalId)` - excluir meta
- ✅ Hook `useDashboard(filters)` implementado
  - `summary`, `categoryBreakdown`, `partnerSummaries`, `loading`, `error`
  - `refresh()` - recarregamento manual
  - carregamento paralelo de dados (Promise.all)
- ✅ Hook `useGoals()` implementado
  - `goals`, `loading`, `error`
  - `createGoal`, `updateGoal`, `deleteGoal`
  - `refresh()` - recarregamento automático ao salvar/excluir
  - validação de categoria duplicada com mensagem amigável
- ✅ Componentes de dashboard criados
  - `PeriodSelector.tsx` - navegação por mês/ano
  - `SummaryCards.tsx` - cartões de receitas/despesas/saldo
  - `CategoryChart.tsx` - gráfico em pizza com Recharts
  - `GoalProgressList.tsx` - barras de progresso das metas
  - `PartnerBreakdown.tsx` - resumo individual de cada parceiro
- ✅ Tela `/dashboard` funcional
  - seletor de período (anterior/próxima)
  - cartões de resumo (receitas, despesas, saldo)
  - gráfico de despesas por categoria
  - barra de progresso das metas com cores
  - resumo individual de parceiros
  - carregamento com états de loading e erro
- ✅ Tela `/metas` funcional
  - listagem de metas cadastradas
  - modal de criar/editar meta
  - validação de categoria duplicada
  - exclusão com confirmação
  - filtro de categorias (apenas despesa)
  - botão de ação flutuante
- ✅ Dependência Recharts adicionada em `package.json`
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

## Fluxos de teste da Sprint 4

### 1) Visualizar Dashboard

1. Acessar `/dashboard`
2. Verificar período padrão (mês/ano atual)
3. Resultado esperado:
   - cartões de receitas, despesas e saldo aparecem com valores
   - gráfico de despesas por categoria renderiza (se houver despesas)
   - barra de progresso das metas aparece (se houver metas)
   - resumo individual de parceiros mostra receitas/despesas/participação

### 2) Navegar por períodos

1. Em `/dashboard`, clicar em `<` para voltar mês
2. Clicar em `>` para próximo mês
3. Resultado esperado:
   - período muda no header e seletor
   - dados agregados são recalculados
   - todos os componentes atualizam em tempo real

### 3) Criar meta

1. Acessar `/metas`
2. Clicar em "Nova meta"
3. Selecionar categoria de despesa
4. Informar limite mensal
5. Salvar
6. Resultado esperado:
   - meta aparece na listagem
   - erro se tentar criar meta duplicada para mesma categoria

### 4) Visualizar progresso da meta

1. Em `/dashboard`, observar seção "Progresso das metas"
2. Se despesas estiverem dentro do limite: barra azul até `spent/limit * 100`
3. Se excedem limite: barra vermelha até 100% com aviso
4. Resultado esperado:
   - barra mostra `R$ X.XX / R$ Y.YY` com percentual visual

### 5) Editar meta

1. Em `/metas`, clicar em "Editar" em uma meta
2. Alterar limite ou categoria
3. Salvar
4. Resultado esperado:
   - alterações persistidas
   - erro se nova categoria já tem meta

### 6) Excluir meta

1. Em `/metas`, clicar em "Excluir"
2. Confirmar na janela do navegador
3. Resultado esperado:
   - meta sai da listagem
   - progresso desaparece do dashboard

### 7) Gráfico de despesas

1. Ter lançamentos de despesa com categorias diferentes
2. Acessar `/dashboard`
3. Resultado esperado:
   - gráfico em pizza mostra cada categoria com cor diferente
   - legenda abaixo mostra nome, valor e percentual
   - tooltip on hover exibe valor formatado em BRL

### 8) Resumo individual (múltiplos parceiros)

1. Ter parceiro vinculado à conta
2. Ambos criarem lançamentos
3. Acessar `/dashboard`
4. Resultado esperado:
   - seção "Resumo por parceiro" mostra cada membro
   - exibe receitas, despesas e participação (%) nas despesas totais

---

## Regras de segurança relevantes para metas

Arquivo: `firestore.rules`

```js
match /goals/{goalId} {
  allow read, write: if isFamilyMember(familyId);
}
```

Resumo:
- Membros da família podem ler e escrever metas.
- Sem restrição de ownership (todos podem editar/excluir qualquer meta).

---

## Estrutura impactada na Sprint 4

```txt
app/
  (app)/
    dashboard/page.tsx
    metas/page.tsx

components/
  dashboard/
    PeriodSelector.tsx
    SummaryCards.tsx
    CategoryChart.tsx
    GoalProgressList.tsx
    PartnerBreakdown.tsx

hooks/
  useDashboard.ts
  useGoals.ts

lib/
  firestore/
    dashboard.ts
    goals.ts

types/
  index.ts

package.json
```

---

## Checklist de conclusão

- ✅ `npm run build` passa sem erros
- ✅ Dashboard renderiza com período selecionável
- ✅ Cartões de resumo (receita/despesa/saldo) funcionam
- ✅ Gráfico de despesas por categoria renderiza com Recharts
- ✅ Barra de progresso das metas aparece com cores (azul/vermelho)
- ✅ Resumo individual de parceiros mostra receitas/despesas/participação
- ✅ CRUD de metas funcional (criar/editar/excluir)
- ✅ Validação de categoria duplicada em metas
- ✅ Loading e mensagens de erro em português implementados
- ✅ Todas as agregações respeitam período (mês/ano)

---

## Observações

- Dashboard carrega dados em paralelo para performance (Promise.all).
- Gráfico renderiza vazio se não houver despesas no período.
- Formatação de moeda segue padrão pt-BR em toda a aplicação.
- Chart renderiza responsivo em todos os tamanhos de tela.
- Período navegável não tem limite (pode ir para passado/futuro).

---

**Próximas sprints:** Refinamentos, relatórios avançados ou exportação de dados.
