# FINLY — Roadmap de Produto
**Versão 1.0 — 2025 — Confidencial**

---

## Histórico de Revisões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2025 | Versão inicial do roadmap — baseado no SRS v1.1 e arquitetura v1.0 |

---

## 1. Visão do Produto

> **"Dar a qualquer pessoa ou família controle total sobre suas finanças, de forma simples, acessível de qualquer dispositivo e sem precisar de um contador."**

O roadmap está dividido em **4 fases** que cobrem desde a fundação técnica até a expansão do produto após o lançamento. As fases são sequenciais, mas algumas trilhas podem avançar em paralelo dentro de uma mesma fase.

---

## 2. Visão Geral das Fases

```
2025
 │
 ├── FASE 1 — Fundação          (Meses 1–2)   ████████████░░░░░░░░░░░░░░
 │   Setup, infraestrutura, auth, design system
 │
 ├── FASE 2 — MVP               (Meses 3–5)   ░░░░░░░░░░░░████████████░░
 │   Módulos core: contas, cartões, transações, família, dashboard
 │
 ├── FASE 3 — Lançamento        (Meses 6–7)   ░░░░░░░░░░░░░░░░░░░░████░░
 │   OFX, orçamento, metas, PWA, beta fechado → lançamento público
 │
 └── FASE 4 — Expansão          (Meses 8–12)  ░░░░░░░░░░░░░░░░░░░░░░░░██
     Relatórios avançados, split, exportação, melhorias de produto
```

---

## 3. FASE 1 — Fundação `Meses 1–2`

> **Objetivo:** Construir toda a base técnica sobre a qual o produto será desenvolvido. Nenhuma feature de produto visível ao usuário final nesta fase.

### 3.1 Infraestrutura e Setup

| # | Entregável | Prioridade |
|---|-----------|------------|
| 1.1 | Criação do projeto Firebase (`finly-prod` e `finly-dev`) com região `southamerica-east1` | Alta |
| 1.2 | Repositório GitHub com estrutura de monorepo (Next.js + Functions) | Alta |
| 1.3 | Setup Next.js 14+ com App Router, TypeScript e Tailwind CSS | Alta |
| 1.4 | Configuração do Firebase Client SDK e inicialização no Next.js | Alta |
| 1.5 | Configuração das Firebase Cloud Functions com TypeScript | Alta |
| 1.6 | Pipeline CI/CD: GitHub Actions + Vercel + Firebase CLI | Alta |
| 1.7 | Ambientes separados: `dev` (branch develop) e `prod` (branch main) | Alta |
| 1.8 | ESLint, Prettier, Husky (pre-commit hooks) | Média |

### 3.2 Design System e UI Base

| # | Entregável | Prioridade |
|---|-----------|------------|
| 1.9 | Definição de tokens de design: cores, tipografia, espaçamento | Alta |
| 1.10 | Criação dos componentes base: Button, Input, Modal, Card, Badge, Toast | Alta |
| 1.11 | Layout base autenticado: Sidebar (desktop) + BottomNav (mobile) | Alta |
| 1.12 | Configuração do manifest.json e ícones PWA | Média |

### 3.13 Autenticação (RF-01 ao RF-07)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 1.13 | Tela de cadastro com e-mail/senha via Firebase Auth | Alta |
| 1.14 | Tela de login com e-mail/senha e Google OAuth | Alta |
| 1.15 | Recuperação de senha por e-mail | Alta |
| 1.16 | Proteção de rotas com middleware Next.js | Alta |
| 1.17 | Tela e lógica de edição de perfil (nome, foto, moeda) | Média |
| 1.18 | Firestore Security Rules — versão inicial e testes com `@firebase/rules-unit-testing` | Alta |

### Critério de Saída da Fase 1
- [ ] CI/CD funcionando com deploy automático nos dois ambientes
- [ ] Usuário consegue se cadastrar, logar, recuperar senha e ver a tela principal
- [ ] Security Rules básicas testadas e aprovadas
- [ ] Design System documentado e componentes base criados

---

## 4. FASE 2 — MVP `Meses 3–5`

> **Objetivo:** Entregar os módulos financeiros centrais do produto — tudo que um usuário precisa para começar a controlar sua vida financeira hoje.

### 4.1 Gestão Familiar (RF-08 ao RF-15)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 2.1 | Criar grupo familiar com nome | Alta |
| 2.2 | Convite de membros por e-mail com link de acesso | Alta |
| 2.3 | Perfis: Administrador, Editor, Visualizador | Alta |
| 2.4 | Suporte a múltiplos Administradores com permissões iguais | Alta |
| 2.5 | Tela de gerenciamento de membros (listar, alterar perfil, remover) | Alta |
| 2.6 | Regra: último admin não pode sair sem promover outro membro (RN-10) | Alta |

### 4.2 Contas Bancárias (RF-16 ao RF-20)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 2.7 | Cadastro manual de conta (banco, tipo, saldo inicial) | Alta |
| 2.8 | Listagem de contas com saldo calculado em tempo real | Alta |
| 2.9 | Edição e arquivamento de contas | Média |
| 2.10 | Transferência entre contas (lançamento duplo automático — RN-05) | Alta |

### 4.3 Cartões de Crédito (RF-21 ao RF-26)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 2.11 | Cadastro de cartão (nome, bandeira, limite, fechamento, vencimento) | Alta |
| 2.12 | Cálculo automático da fatura do mês | Alta |
| 2.13 | Exibição do limite disponível (RN-04) | Alta |
| 2.14 | Parcelamento: distribuição automática nas faturas futuras (RN-03) | Alta |
| 2.15 | Tela de fatura mensal com listagem de transações do cartão | Alta |
| 2.16 | Registro de pagamento total/parcial da fatura | Alta |

### 4.4 Transações (RF-27 ao RF-32)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 2.17 | Lançamento manual de receita e despesa | Alta |
| 2.18 | Categorias hierárquicas (sistema + personalizadas) | Alta |
| 2.19 | Listagem de transações com filtros (data, categoria, conta, tipo) | Alta |
| 2.20 | Edição e exclusão de transações manuais | Alta |
| 2.21 | Transações recorrentes com Cloud Scheduler (`fn-recurrenceJob`) | Alta |

### 4.5 Dashboard Principal (RF-44, RF-49)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 2.22 | Cards de resumo: saldo total, receitas do mês, despesas do mês | Alta |
| 2.23 | Gráfico de pizza: gastos por categoria no mês | Alta |
| 2.24 | Gráfico de barras: fluxo receitas vs. despesas (últimos 6 meses) | Alta |
| 2.25 | Dashboard familiar: visão consolidada + seletor por membro | Alta |

### Critério de Saída da Fase 2
- [ ] Usuário consegue criar uma família, adicionar membros e definir permissões
- [ ] Usuário consegue cadastrar contas, cartões e lançar transações
- [ ] Dashboard principal exibe dados reais do usuário
- [ ] Transações recorrentes sendo criadas automaticamente
- [ ] Cobertura de testes ≥ 80% nos módulos financeiros críticos

---

## 5. FASE 3 — Lançamento `Meses 6–7`

> **Objetivo:** Completar o produto com os módulos de planejamento e importação, finalizar a PWA e realizar o lançamento público.

### 5.1 Importação OFX (RF-33 ao RF-37)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 3.1 | Cloud Function `fn-processOFX`: parse de arquivo OFX | Alta |
| 3.2 | Tela de upload com preview das transações antes da importação | Alta |
| 3.3 | Detecção e sinalização de duplicatas na UI (RN-12, RN-13) | Alta |
| 3.4 | Confirmação seletiva: usuário escolhe quais transações importar | Alta |
| 3.5 | Mapeamento automático de categorias por descrição | Média |

### 5.2 Orçamento (RF-38 ao RF-40)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 3.6 | Criação de orçamento mensal por categoria (RN-14) | Alta |
| 3.7 | Barra de progresso em tempo real no dashboard e na tela de orçamentos | Alta |
| 3.8 | Cloud Function `fn-budgetAlert`: alerta ao atingir 80% e 100% | Alta |
| 3.9 | Notificações in-app via Firestore real-time listener | Alta |

### 5.3 Metas Financeiras (RF-41 ao RF-43)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 3.10 | Criação de metas com nome, valor alvo, prazo e conta vinculada (RN-16) | Alta |
| 3.11 | Tela de detalhe da meta com progresso e aportes manuais | Alta |
| 3.12 | Projeção de atingimento com base no histórico de aportes | Média |

### 5.4 PWA — Finalização (RNF-14, RNF-15)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 3.13 | Service Worker com estratégia de cache por tipo de recurso | Alta |
| 3.14 | Funcionalidade offline: leitura de transações e saldo (cache local) | Alta |
| 3.15 | Banner de instalação PWA na UI | Média |
| 3.16 | Validação de Lighthouse Score: PWA ≥ 90, Performance ≥ 80 | Alta |

### 5.5 Qualidade e Lançamento

| # | Entregável | Prioridade |
|---|-----------|------------|
| 3.17 | Auditoria de Security Rules com cenários de ataque | Alta |
| 3.18 | Testes de aceitação com grupo beta fechado (20–50 usuários) | Alta |
| 3.19 | Tela de exclusão de conta e exportação de dados (LGPD — RNF-11, RNF-12) | Alta |
| 3.20 | Landing page pública com SEO | Média |
| 3.21 | Lançamento público (beta aberto) | Alta |

### Critério de Saída da Fase 3
- [ ] Importação OFX funcionando com detecção de duplicatas
- [ ] Orçamentos e metas criados e acompanhados no dashboard
- [ ] PWA instalável com funcionamento offline básico
- [ ] Lighthouse PWA Score ≥ 90
- [ ] LGPD: exportação e exclusão de dados funcionando
- [ ] Produto lançado publicamente

---

## 6. FASE 4 — Expansão `Meses 8–12`

> **Objetivo:** Evoluir o produto com base no feedback dos primeiros usuários, adicionar funcionalidades avançadas e preparar a base para crescimento.

### 6.1 Relatórios Avançados (RF-45 ao RF-48)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 4.1 | Relatório de fluxo de caixa com filtros por período | Alta |
| 4.2 | Gráfico de evolução patrimonial ao longo do tempo | Média |
| 4.3 | Relatório comparativo de gastos por categoria entre dois períodos | Alta |
| 4.4 | Exportação de transações em CSV | Média |

### 6.2 Funcionalidades Sociais e Familiares

| # | Entregável | Prioridade |
|---|-----------|------------|
| 4.5 | Split de despesas entre membros do grupo familiar (RF-31) | Média |
| 4.6 | Tela de balanço do split: quem deve quanto a quem | Média |
| 4.7 | Log de auditoria familiar visível para Administradores (RF-15) | Baixa |

### 6.3 Melhorias de Usabilidade

| # | Entregável | Prioridade |
|---|-----------|------------|
| 4.8 | Tags personalizadas em transações (RF-32) | Baixa |
| 4.9 | Busca global de transações por descrição | Média |
| 4.10 | Atalhos rápidos: lançar transação com gestos ou botão flutuante | Média |
| 4.11 | Tema escuro (dark mode) | Baixa |
| 4.12 | Histórico de importações OFX realizadas (RF-37) | Baixa |

### 6.4 Autenticação em Dois Fatores (RF-03)

| # | Entregável | Prioridade |
|---|-----------|------------|
| 4.13 | 2FA via TOTP (Google Authenticator, Authy) no Firebase Auth | Alta |
| 4.14 | Fluxo de ativação/desativação do 2FA nas configurações de conta | Alta |

### 6.5 Qualidade e Performance

| # | Entregável | Prioridade |
|---|-----------|------------|
| 4.15 | Testes E2E com Playwright cobrindo os fluxos críticos | Alta |
| 4.16 | Otimização de consultas Firestore (revisão de índices) | Média |
| 4.17 | Revisão de acessibilidade WCAG 2.1 AA com ferramenta automatizada | Alta |

### 6.6 Backlog Futuro (Won't Have por ora)

> Itens que podem entrar no roadmap de 2026 com base em demanda dos usuários.

- Integração com Open Finance (requer credenciamento no Banco Central)
- Módulo de controle de investimentos
- Suporte a múltiplas moedas
- App mobile nativo (React Native) caso o PWA não atenda a casos de uso específicos
- Notificações push via Firebase Cloud Messaging (FCM)
- Integração com assistentes de IA para análise financeira

---

## 7. Cronograma Visual

```
         Jan   Fev   Mar   Abr   Mai   Jun   Jul   Ago   Set   Out   Nov   Dez
         ───────────────────────────────────────────────────────────────────────
FASE 1   ██████████
  Setup  ████
  Auth         ██████

FASE 2               ██████████████████
  Família             ████
  Contas/Cartões           ██████
  Transações                    ████
  Dashboard                         ████

FASE 3                                   ████████████
  OFX                                    ████
  Orçamento/Metas                             ████
  PWA                                              ██
  Lançamento                                         ██

FASE 4                                                   ████████████████████
  Relatórios                                             ████
  Split/Auditoria                                             ████
  Usabilidade                                                      ████████
  2FA / Testes E2E                                                          ████
```

---

## 8. Métricas de Sucesso

### 8.1 Técnicas (por fase)

| Métrica | Meta — Fase 3 | Meta — Fase 4 |
|---------|--------------|--------------|
| Lighthouse Performance | ≥ 80 | ≥ 90 |
| Lighthouse PWA Score | ≥ 90 | ≥ 95 |
| Cobertura de testes (críticos) | ≥ 80% | ≥ 85% |
| Tempo médio de resposta Firestore | < 500ms | < 300ms |
| Cold start Cloud Functions | < 3s | < 2s |

### 8.2 Produto (após lançamento — Fase 3+)

| Métrica | Meta 30 dias | Meta 90 dias |
|---------|-------------|-------------|
| Usuários cadastrados | 200 | 1.000 |
| Usuários ativos (semana) | 50 | 300 |
| Grupos familiares criados | 20 | 150 |
| Retenção D30 | — | ≥ 30% |
| NPS (survey) | — | ≥ 40 |

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Complexidade das Security Rules causa bug de acesso | Média | Alto | Cobertura de testes com `@firebase/rules-unit-testing` antes de cada deploy |
| Cold start das Cloud Functions degrada UX | Baixa | Médio | `minInstances: 1` para `fn-processOFX` em produção |
| Custo Firebase escala inesperadamente | Baixa | Médio | Alertas de budget no Google Cloud Console; revisão de índices e queries |
| Formato OFX de banco específico não compatível | Média | Médio | Testar com extratos dos 10 maiores bancos brasileiros antes do lançamento |
| Baixa adoção do PWA (usuários não instalam) | Média | Baixo | Fluxo de onboarding com instrução de instalação; banner contextual |
| Atraso no lançamento por débito técnico | Média | Alto | MVP enxuto na Fase 2; features Should Have empurradas para Fase 4 |

---

*Finly © 2025 — Documento Confidencial — Versão 1.0*
