# Roadmap — Controle Financeiro para Casais
**Stack:** Next.js + Firebase · **Versão:** 1.0 · **Duração estimada:** ~12 semanas (6 sprints de 2 semanas)

---

> 📌 Estimativas para um desenvolvedor solo. Com dois devs em paralelo o prazo pode cair até 40%.

---

## Marcos Principais

| Marco | Entregável | Sprint |
|---|---|---|
| M1 — Fundação pronta | Autenticação, parceria e categorias funcionando | Sprint 2 |
| M2 — Core financeiro pronto | Lançamentos completos com recorrência | Sprint 3 |
| M3 — Inteligência financeira | Metas e dashboard com gráficos | Sprint 5 |
| M4 — MVP lançável | Ajustes, polimento e deploy em produção | Sprint 6 |

---

## Sprint 1 · Semanas 1–2 · Fundação do Projeto

| Tarefa | Estimativa |
|---|---|
| Criar projeto Next.js com App Router e TypeScript | 0,5 dia |
| Configurar Tailwind CSS e estrutura de pastas | 0,5 dia |
| Criar projeto Firebase (Auth, Firestore, Hosting) | 0,5 dia |
| Configurar variáveis de ambiente (.env.local) | 0,5 dia |
| Implementar telas de Login e Cadastro | 2 dias |
| Implementar fluxo de recuperação de senha | 1 dia |
| Criar layout base com bottom navigation (5 abas) | 2 dias |
| Criar contexto de autenticação (AuthContext) | 1 dia |
| Configurar rotas protegidas (middleware Next.js) | 1 dia |
| Deploy inicial no Firebase Hosting ou Vercel | 0,5 dia |

**Total estimado:** ~9,5 dias

---

## Sprint 2 · Semanas 3–4 · Parceria e Categorias

| Tarefa | Estimativa |
|---|---|
| Modelar coleção `families` no Firestore | 0,5 dia |
| Implementar envio de convite por e-mail com código único | 2 dias |
| Implementar fluxo de aceite de convite | 1,5 dia |
| Tela de Categorias — listagem e CRUD completo | 2 dias |
| Criar categorias padrão no onboarding | 0,5 dia |
| Configurar Firebase Security Rules (isolamento por família) | 2 dias |
| Tela de Ajustes — nome, senha, parceiro, logout | 1,5 dia |

**Total estimado:** ~10 dias

---

## Sprint 3 · Semanas 5–6 · Lançamentos

| Tarefa | Estimativa |
|---|---|
| Formulário de novo lançamento (campos básicos) | 2 dias |
| Lógica de lançamento recorrente (gerar N documentos) | 2 dias |
| Listagem de lançamentos com filtro por mês e tipo | 2 dias |
| Edição de lançamento individual | 1 dia |
| Exclusão de lançamento com confirmação | 0,5 dia |
| Edição em lote para recorrentes (este / este e seguintes / todos) | 2 dias |

**Total estimado:** ~9,5 dias

---

## Sprint 4 · Semanas 7–8 · Dashboard (Parte 1)

| Tarefa | Estimativa |
|---|---|
| Estrutura base do Dashboard com seletor de período | 1 dia |
| Cards de resumo: receitas, despesas, saldo | 1,5 dia |
| Gráfico de despesas por categoria (biblioteca de charts) | 2 dias |
| Resumo individual por parceiro | 1,5 dia |
| Percentual de contribuição de cada parceiro | 1 dia |
| Testes e ajustes de performance (Firestore queries) | 3 dias |

**Total estimado:** ~10 dias

---

## Sprint 5 · Semanas 9–10 · Metas e Dashboard (Parte 2)

| Tarefa | Estimativa |
|---|---|
| CRUD de metas por categoria | 2 dias |
| Cálculo de progresso das metas em tempo real | 1,5 dia |
| Barras de progresso das metas no Dashboard | 1 dia |
| Alertas visuais ao atingir 80% e 100% da meta | 1 dia |
| Integrar metas na tela de Metas com listagem | 1,5 dia |
| Testes de integração Metas × Lançamentos | 3 dias |

**Total estimado:** ~10 dias

---

## Sprint 6 · Semanas 11–12 · Polimento e Lançamento

| Tarefa | Estimativa |
|---|---|
| Excluir conta com remoção completa de dados (Firestore + Auth) | 1,5 dia |
| Revisão geral de UX — feedback de erros, loading states | 2 dias |
| Testes em múltiplos dispositivos (mobile e desktop) | 2 dias |
| Configurar Firebase Security Rules finais e auditoria | 1,5 dia |
| Configurar domínio customizado (se aplicável) | 0,5 dia |
| Deploy de produção com variáveis de ambiente corretas | 0,5 dia |
| Monitoramento: Firebase Performance + Analytics | 1 dia |

**Total estimado:** ~9 dias

---

## Pós-MVP — Versão 2 (Candidatos)

- Importação de extratos bancários (CSV / OFX)
- Metas anuais ou por período customizado
- Relatórios exportáveis em PDF
- Notificações push para metas atingidas
- Login com Google e outros provedores OAuth
- Múltiplos perfis financeiros (ex.: conta pessoal + conta conjunta)
- Integração com Open Finance / Pluggy
- Aplicativo mobile nativo (React Native ou PWA instalável)
