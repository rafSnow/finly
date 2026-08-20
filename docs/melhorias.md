# Sugestões de Melhorias e Evolução Técnica - Finly

Este documento mapeia oportunidades de melhoria para o projeto **Finly**, abordando escalabilidade, qualidade de código, experiência do usuário (UX) e segurança. Como o sistema base (MVP) já foi finalizado e estabilizado (PWA, offline, rotas dinâmicas adaptadas), os próximos passos focam em maturidade.

---

## 1. Qualidade de Código e Estabilidade

### A. Implementação de Testes Automatizados
Atualmente o projeto carece de uma suíte de testes.
- **Testes Unitários:** Configurar **Vitest** ou **Jest** em conjunto com **React Testing Library** para testar utilitários (`formatCurrency`, parsers de CSV/OFX) e componentes de UI isolados (modais, formulários).
- **Testes E2E (End-to-End):** Implementar o **Playwright** ou **Cypress** para simular os fluxos críticos (Login, Cadastro de Transação, Importação de OFX e Sincronização).

### B. Pre-commit Hooks (Husky + lint-staged)
- Evitar que código quebrado ou mal formatado chegue ao repositório.
- Rodar o ESLint, Prettier e TypeScript Compiler (`tsc --noEmit`) automaticamente a cada commit.

### C. Tipagem Mais Estrita (TypeScript Strict Mode)
- Substituir usos remanescentes de `any` por tipagens explícitas ou `unknown`.
- Ativar opções mais rigorosas no `tsconfig.json` (`strictNullChecks`, `noImplicitAny`).

---

## 2. Experiência do Usuário (UX) e Interface (UI)

### A. Feedback Visual e Skeleton Loadings
- Substituir textos genéricos como "Carregando..." por **Skeleton Screens** (componentes que imitam o layout sendo carregado, com animações de pulso). Isso diminui a "ansiedade" da espera, passando a sensação de um app mais veloz.

### B. Dark / Light Mode
- O projeto atual tem um tema majoritariamente escuro. Integrar completamente o suporte a temas no sistema utilizando o `next-themes` (já instalado), permitindo que o usuário alterne nas configurações (Ajustes).

### C. Acessibilidade (a11y)
- Garantir que todos os componentes do Radix UI (já em uso) e HTML nativo sejam completamente navegáveis por teclado (tabulação) e leitores de tela (`aria-labels`).

---

## 3. Desempenho e Funcionalidade PWA

### A. Background Sync (Sincronização em Segundo Plano)
- O app já conta com suporte a `IndexedDB` no Firebase. Como próxima evolução no PWA, pode-se usar o **Workbox Background Sync**. Isso garante que ações (como criar uma despesa) feitas totalmente offline não dependam de o usuário abrir o app com internet depois; o próprio *Service Worker* fará o reenvio assim que detectar conexão.

### B. Otimização do Bundle e Imagens
- Analisar o tamanho final do pacote JavaScript (`@next/bundle-analyzer`).
- Aplicar *Code Splitting* agressivo nas bibliotecas mais pesadas (ex: `jspdf`, `papaparse`, `@google/genai`) usando carregamento dinâmico (`next/dynamic`), evitando que o usuário baixe código que não vai usar na tela inicial.

---

## 4. Segurança e Integração

### A. Refinamento de Regras de Segurança (Firestore Security Rules)
- Revisar as regras do Firebase. Garantir de forma granular que usuários só possam ler, editar e deletar documentos que pertençam estritamente ao seu `familyId`, evitando falhas de segurança onde um usuário forja um ID.
- Configurar validações de schema no lado do Firebase (ex: garantir que campos obrigatórios existam no salvamento).

### B. Proteção do Consultor IA (Gemini)
- Como a chave do Gemini foi exposta para o cliente (`NEXT_PUBLIC_GEMINI_API_KEY`) devido à exportação estática, aplicar limites de cota rigorosos diretamente no console do Google Cloud (GCP) e restringir o uso da API Key apenas para os domínios autorizados (ex: `rafsnow.github.io` e `localhost`).

---

## 5. Novas Funcionalidades de Negócio

- **Fluxo de Caixa Projetado:** Um gráfico que mostra a evolução da conta até o fim do mês baseado nas recorrências ativas e parcelamentos (visão de futuro).
- **Relatórios Avançados Exportáveis:** Melhorar a exportação atual para gerar PDFs mais bem desenhados (com gráficos gerados por canvas) ou exportar planilhas Excel mais ricas (xlsx).
- **Modo Casal / Permissões:** Criar a visualização de "quem gastou" (já existe na estrutura, mas aprofundar na UI) e permitir que uma pessoa limite a visão da outra se desejado.
