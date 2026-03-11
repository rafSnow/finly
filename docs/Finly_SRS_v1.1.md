# FINLY — Documento de Requisitos de Sistema (SRS)
**Versão 1.1 — 2025 — Confidencial**

---

## Histórico de Revisões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2025 | Versão inicial |
| 1.1 | 2025 | Remoção do Open Finance, remoção do app mobile (substituído por PWA em Next.js), backend definido como Firebase, remoção de armazenamento de arquivos e observabilidade, múltiplos administradores familiares |

---

## 1. Introdução

### 1.1 Objetivo do Produto
O **Finly** é uma plataforma web de gestão financeira pessoal e familiar. Seu objetivo é empoderar indivíduos e famílias a controlar suas finanças de forma simples e centralizada, acessível via navegador com suporte a instalação como Progressive Web App (PWA).

### 1.2 Escopo
- Controle de receitas e despesas pessoais e familiares
- Gerenciamento de contas bancárias e cartões de crédito/débito
- Orçamento mensal com definição de metas financeiras
- Importação de extratos no formato OFX
- Gestão de grupo familiar com múltiplos membros e múltiplos administradores
- Relatórios e dashboards analíticos

### 1.3 Fora do Escopo
- Aplicativo mobile nativo (iOS/Android)
- Integração com Open Finance / APIs bancárias
- Armazenamento de arquivos e comprovantes
- Ferramentas de observabilidade (APM, rastreamento distribuído)

### 1.4 Definições e Siglas

| Sigla | Definição |
|-------|-----------|
| SRS | Software Requirements Specification |
| RF | Requisito Funcional |
| RNF | Requisito Não Funcional |
| RN | Regra de Negócio |
| PWA | Progressive Web App |
| OFX | Open Financial Exchange — formato padrão de extrato bancário |
| PFM | Personal Finance Management |
| LGPD | Lei Geral de Proteção de Dados (Lei 13.709/2018) |

### 1.5 Stakeholders

| Papel | Descrição |
|-------|-----------|
| Usuário individual | Gerencia suas próprias finanças |
| Administrador familiar | Gerencia o grupo e define permissões dos membros; pode haver mais de um |
| Membro do grupo | Acesso conforme permissões definidas pelos administradores |
| Equipe de desenvolvimento | Consome este documento para implementação |
| Equipe de QA | Utiliza os requisitos como base para casos de teste |

---

## 2. Personas e Casos de Uso Centrais

### 2.1 Persona 1 — Usuário Individual
- **Nome fictício:** Lucas, 28 anos, analista de TI
- **Objetivo:** Controlar gastos mensais e guardar dinheiro
- **Comportamento:** Usa o navegador no desktop e celular via PWA
- **Necessidade principal:** Visão clara de onde gasta e quanto pode poupar

### 2.2 Persona 2 — Administrador Familiar
- **Nome fictício:** Camila, 35 anos, contadora, casada, 2 filhos
- **Objetivo:** Controlar as finanças da família com outros administradores
- **Comportamento:** Acessa pelo navegador, frequentemente via desktop
- **Necessidade principal:** Visão consolidada da família e gestão de permissões

### 2.3 Casos de Uso Principais

| ID | Caso de Uso |
|----|-------------|
| UC01 | Cadastrar e autenticar usuário |
| UC02 | Criar e gerenciar grupo familiar |
| UC03 | Adicionar e categorizar transações manualmente |
| UC04 | Importar extrato OFX |
| UC05 | Criar e acompanhar orçamento mensal |
| UC06 | Visualizar dashboards e relatórios |
| UC07 | Gerenciar cartões de crédito |
| UC08 | Definir e monitorar metas financeiras |
| UC09 | Gerenciar membros e administradores do grupo familiar |

---

## 3. Requisitos Funcionais

> Prioridades: **Alta** = Must Have · **Média** = Should Have · **Baixa** = Could Have

### 3.1 Autenticação e Gestão de Usuários

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-01 | Autenticação | Cadastro com nome, e-mail e senha via Firebase Authentication | Alta |
| RF-02 | Autenticação | Login via e-mail/senha e OAuth (Google) via Firebase Authentication | Alta |
| RF-03 | Autenticação | Autenticação em dois fatores (2FA) opcional | Alta |
| RF-04 | Autenticação | Recuperação de senha via e-mail (Firebase Auth nativo) | Alta |
| RF-05 | Autenticação | Manutenção de sessão com token gerenciado pelo Firebase SDK | Alta |
| RF-06 | Usuário | Edição de perfil: nome, foto e moeda padrão | Média |
| RF-07 | Usuário | Exclusão de conta com anonimização de dados pessoais (LGPD) | Alta |

### 3.2 Gestão Familiar (Multi-usuário)

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-08 | Família | Criação de grupo familiar com nome personalizado | Alta |
| RF-09 | Família | Convite de membros via e-mail | Alta |
| RF-10 | Família | Definição de perfis: **Administrador**, **Editor** ou **Visualizador** | Alta |
| RF-11 | Família | O grupo familiar pode ter **múltiplos Administradores**; todos têm visibilidade total da família | Alta |
| RF-12 | Família | Todos os Administradores podem convidar membros, alterar permissões e remover membros | Alta |
| RF-13 | Família | Cada membro acessa visão individual e visão consolidada da família | Alta |
| RF-14 | Família | Administradores podem remover membros e revogar acessos | Média |
| RF-15 | Família | Log de ações por membro para auditoria interna | Baixa |

### 3.3 Contas Bancárias

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-16 | Contas | Cadastro manual de contas: banco, agência, conta e saldo inicial | Alta |
| RF-17 | Contas | Tipos suportados: corrente, poupança, carteira digital | Alta |
| RF-18 | Contas | Arquivamento ou exclusão de contas | Média |
| RF-19 | Contas | Exibição de saldo atual calculado com base nas transações | Alta |
| RF-20 | Contas | Transferência entre contas do mesmo usuário ou grupo familiar | Alta |

### 3.4 Cartões de Crédito

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-21 | Cartões | Cadastro de cartão: nome, bandeira, limite e data de fechamento da fatura | Alta |
| RF-22 | Cartões | Cálculo automático da fatura do mês com base nas transações associadas | Alta |
| RF-23 | Cartões | Exibição do limite disponível em tempo real | Alta |
| RF-24 | Cartões | Suporte a parcelamento com distribuição automática nas faturas futuras | Alta |
| RF-25 | Cartões | Registro de pagamento total ou parcial da fatura | Alta |
| RF-26 | Cartões | Alerta quando a fatura estiver próxima do vencimento | Média |

### 3.5 Transações (Receitas e Despesas)

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-27 | Transações | Lançamento manual com: valor, data, tipo, categoria, conta e descrição | Alta |
| RF-28 | Transações | Transações recorrentes (diário, semanal, mensal, anual) com criação automática | Alta |
| RF-29 | Transações | Categorização hierárquica (ex: Alimentação > Restaurante) | Alta |
| RF-30 | Transações | Edição e exclusão de qualquer transação lançada manualmente | Alta |
| RF-31 | Transações | Split de despesas entre membros do grupo familiar | Média |
| RF-32 | Transações | Tags personalizadas nas transações | Baixa |

### 3.6 Importação de Extrato OFX

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-33 | OFX | Importação de arquivos OFX de qualquer banco | Alta |
| RF-34 | OFX | Preview das transações antes de confirmar a importação | Alta |
| RF-35 | OFX | Detecção e alerta sobre transações duplicadas durante a importação | Alta |
| RF-36 | OFX | Mapeamento automático de categorias para transações importadas | Média |
| RF-37 | OFX | Histórico de importações realizadas | Baixa |

### 3.7 Orçamento e Metas

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-38 | Orçamento | Criação de orçamentos mensais por categoria com valor máximo | Alta |
| RF-39 | Orçamento | Exibição do progresso do orçamento em tempo real | Alta |
| RF-40 | Orçamento | Notificação ao atingir 80% e 100% de um orçamento | Alta |
| RF-41 | Metas | Criação de metas de economia: nome, valor alvo, prazo e conta vinculada | Alta |
| RF-42 | Metas | Projeção de atingimento da meta com base no histórico | Média |
| RF-43 | Metas | Registro de aportes manuais nas metas | Alta |

### 3.8 Relatórios e Dashboards

| ID | Módulo | Descrição | Prioridade |
|----|--------|-----------|------------|
| RF-44 | Dashboard | Dashboard principal: saldo total, fluxo do mês, gastos por categoria e progresso do orçamento | Alta |
| RF-45 | Relatórios | Relatório de fluxo de caixa por período (diário, semanal, mensal, anual) | Alta |
| RF-46 | Relatórios | Gráfico de evolução patrimonial ao longo do tempo | Média |
| RF-47 | Relatórios | Relatório de gastos por categoria com comparativo entre períodos | Alta |
| RF-48 | Relatórios | Exportação de relatórios em CSV | Média |
| RF-49 | Dashboard | Dashboard familiar com visão consolidada e por membro | Alta |

---

## 4. Requisitos Não Funcionais

### 4.1 Desempenho

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF-01 | Performance | O carregamento inicial da aplicação (LCP) deve ser inferior a 3 segundos em conexão 4G |
| RNF-02 | Performance | O tempo de resposta das operações de leitura no Firestore deve ser inferior a 500ms |
| RNF-03 | Escalabilidade | A arquitetura Firebase (Firestore + Auth + Functions) deve suportar crescimento de usuários sem intervenção manual de infraestrutura |
| RNF-04 | Disponibilidade | A disponibilidade do sistema é herdada do SLA do Firebase (99,95%) |

### 4.2 Segurança

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF-05 | Segurança | Todas as comunicações devem ser criptografadas via TLS 1.2+ (garantido pelo Firebase) |
| RNF-06 | Segurança | As regras de segurança do Firestore (Security Rules) devem ser o único mecanismo de controle de acesso aos dados |
| RNF-07 | Segurança | Um usuário jamais deve acessar dados de outro usuário ou família sem permissão explícita nas Security Rules |
| RNF-08 | Segurança | Tokens de autenticação Firebase devem ser validados em todas as operações nas Firebase Functions |
| RNF-09 | Segurança | O sistema deve implementar proteção contra as vulnerabilidades OWASP Top 10 no frontend |

### 4.3 Conformidade e Privacidade

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF-10 | LGPD | O sistema deve estar em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018) |
| RNF-11 | LGPD | O usuário deve poder exportar todos os seus dados pessoais em formato legível (portabilidade) |
| RNF-12 | LGPD | O usuário deve poder solicitar exclusão total de seus dados (direito ao esquecimento) |
| RNF-13 | Auditoria | O sistema deve manter logs de ações relevantes no Firestore por no mínimo 5 anos |

### 4.4 Usabilidade e Acessibilidade

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF-14 | PWA | A aplicação deve ser instalável como PWA em dispositivos móveis e desktop (manifest.json + Service Worker) |
| RNF-15 | PWA | A aplicação deve funcionar offline para visualização das últimas transações e saldo (cache via Service Worker) |
| RNF-16 | Responsividade | A interface deve ser totalmente responsiva (Mobile-First) |
| RNF-17 | Acessibilidade | A aplicação deve estar em conformidade com WCAG 2.1 nível AA |
| RNF-18 | Internacionalização | O sistema deve suportar i18n, iniciando com Português (BR) |

### 4.5 Manutenibilidade

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF-19 | Arquitetura | O frontend Next.js deve adotar App Router com separação clara entre componentes de servidor e cliente |
| RNF-20 | Testes | Cobertura mínima de 80% para lógicas críticas (cálculo de saldo, parcelamento, duplicidade OFX) |
| RNF-21 | CI/CD | O projeto deve ter pipeline de integração e entrega contínua com deploy automatizado (ex: Vercel + Firebase CLI) |

---

## 5. Regras de Negócio

### 5.1 Financeiras
- **RN-01:** O saldo de uma conta é: `Saldo Inicial + Σ Receitas - Σ Despesas`
- **RN-02:** Transações de cartão de crédito não afetam o saldo da conta até o registro do pagamento da fatura
- **RN-03:** Uma despesa parcelada gera N transações futuras, uma por mês, pelo número de parcelas informadas
- **RN-04:** Limite disponível do cartão = `Limite Total - Valor total das faturas abertas`
- **RN-05:** Uma transferência entre contas gera dois lançamentos: débito na origem e crédito no destino

### 5.2 Familiar
- **RN-06:** Um grupo familiar pode ter **um ou mais Administradores**; todos têm visibilidade e permissão total sobre os dados da família
- **RN-07:** Qualquer Administrador pode convidar membros, alterar perfis e remover membros do grupo
- **RN-08:** O perfil Editor pode lançar e editar transações; o Visualizador só pode consultar dados
- **RN-09:** Um usuário pode pertencer a no máximo um grupo familiar por vez
- **RN-10:** Se o último Administrador tentar sair do grupo, o sistema deve obrigá-lo a promover outro membro antes

### 5.3 OFX
- **RN-11:** Transações importadas via OFX são marcadas com origem e apenas a categoria pode ser editada; o valor e a data são imutáveis
- **RN-12:** Duplicidade é detectada por: mesma data + mesmo valor + mesma conta em um intervalo de 24 horas
- **RN-13:** Em caso de duplicidade detectada, o sistema prioriza a transação manual sobre a importada

### 5.4 Orçamento e Metas
- **RN-14:** O mesmo usuário não pode ter dois orçamentos para a mesma categoria no mesmo mês
- **RN-15:** O progresso do orçamento é calculado em tempo real sobre as transações do mês corrente
- **RN-16:** Uma meta financeira não pode ter prazo inferior a 30 dias

---

## 6. Restrições e Premissas

### 6.1 Restrições Técnicas
- O sistema **não realiza movimentações financeiras reais**; é exclusivamente um agregador e visualizador
- O suporte a OFX é limitado ao formato padrão OFX 1.x e 2.x
- Não há armazenamento de arquivos de comprovantes; apenas dados estruturados no Firestore
- Todo o backend reside no Firebase: Firestore, Authentication, Cloud Functions e Hosting

### 6.2 Restrições Regulatórias
- O produto deve estar em conformidade com a LGPD antes do lançamento
- Os dados financeiros devem respeitar os prazos de retenção definidos pelas normas aplicáveis

### 6.3 Premissas
- O usuário terá acesso à internet para sincronização; funcionalidades offline são limitadas a leitura via cache PWA
- O produto será lançado inicialmente apenas no mercado brasileiro (moeda BRL)
- O Firebase será utilizado no plano Blaze (pay-as-you-go) para suportar Cloud Functions

---

## 7. Mapa de Prioridades — MoSCoW

| Prioridade | Módulos e Funcionalidades |
|------------|--------------------------|
| **Must Have** | Autenticação (Firebase Auth), Contas, Cartões, Transações manuais, Importação OFX, Orçamento, Grupo familiar com múltiplos administradores, Dashboard principal |
| **Should Have** | Metas financeiras, Notificações de orçamento, Categorização automática OFX, Relatórios avançados, Parcelamento, PWA offline |
| **Could Have** | Split de despesas, Tags personalizadas, Log de auditoria familiar, Histórico de importações, Exportação CSV |
| **Won't Have (por ora)** | Open Finance, App mobile nativo, Armazenamento de arquivos, Gestão de investimentos, Multi-moeda |

---

## 8. Considerações de Arquitetura

### 8.1 Stack Definida

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js (App Router) + TypeScript |
| PWA | next-pwa ou Workbox (Service Worker + manifest.json) |
| Estilização | Tailwind CSS |
| Backend | Firebase Cloud Functions (Node.js) |
| Banco de Dados | Firebase Firestore (NoSQL) |
| Autenticação | Firebase Authentication |
| Hospedagem Frontend | Vercel |
| Hospedagem Functions | Firebase Hosting / Cloud Functions |

### 8.2 Modelagem de Dados — Firestore (Alto Nível)

```
/users/{userId}
  - name, email, currency, createdAt

/families/{familyId}
  - name, createdAt
  - members: [{ userId, role: "admin" | "editor" | "viewer" }]

/families/{familyId}/accounts/{accountId}
  - name, bank, type, initialBalance, archivedAt

/families/{familyId}/transactions/{transactionId}
  - amount, date, type, categoryId, accountId, description
  - source: "manual" | "ofx"
  - createdBy, recurrenceId

/families/{familyId}/cards/{cardId}
  - name, brand, limit, closingDay, dueDay

/families/{familyId}/budgets/{budgetId}
  - categoryId, month, maxAmount

/families/{familyId}/goals/{goalId}
  - name, targetAmount, deadline, linkedAccountId, contributions[]
```

### 8.3 Pontos de Atenção
- As **Firestore Security Rules** são a principal camada de segurança e devem ser cobertas por testes automatizados com `firebase-admin` e `@firebase/rules-unit-testing`
- O processamento de arquivos OFX deve ocorrer em **Cloud Function** para não expor a lógica de parsing no client
- Transações recorrentes devem ser gerenciadas por **Cloud Scheduler + Cloud Function** para criação automática
- O controle de acesso familiar deve verificar o array `members` do documento `/families/{familyId}` em todas as Security Rules relevantes

---

*Finly © 2025 — Documento Confidencial — Versão 1.1*
