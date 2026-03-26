# Requisitos — Controle Financeiro para Casais
**Stack:** Next.js + Firebase · **Versão:** 1.0

---

> **Legenda de prioridade**
> - 🔴 **Obrigatório** — sem isso o app não funciona
> - 🟡 **Importante** — deve estar na v1 se possível
> - 🟢 **Desejável** — agrega valor, candidato à v1 ou v2

---

## 1. Visão Geral

Aplicativo web para casais gerenciarem finanças de forma conjunta e individual. Permite lançar receitas e despesas, definir metas por categoria, visualizar resumos combinados e individuais, e gerenciar o vínculo entre parceiros.

---

## 2. Autenticação e Identidade

### 2.1 Acesso
- 🔴 Cadastro com e-mail e senha via Firebase Auth
- 🔴 Login com e-mail e senha
- 🔴 Recuperação de senha por e-mail
- 🟡 Login com Google (OAuth)

### 2.2 Perfil do Usuário
- 🔴 Atualizar nome de exibição
- 🔴 Alterar senha com confirmação da senha atual
- 🔴 Fazer logout da sessão
- 🔴 Excluir conta com confirmação por senha (remove todos os dados do usuário)

---

## 3. Gerenciamento de Parceiro

### 3.1 Convite
- 🔴 Enviar convite ao parceiro por e-mail com link ou código único
- 🔴 Aceitar convite e vincular as contas em uma mesma família
- 🔴 Um usuário só pode ter um parceiro ativo por vez
- 🟡 Notificação (e-mail ou push) quando o convite for aceito
- 🟢 Prazo de expiração para o convite (ex.: 7 dias)

### 3.2 Desvínculo
- 🟡 Opção de remover parceiro — desvincula as contas; dados de cada um permanecem intactos

> 📌 **Decisão necessária:** ao desvincular, os lançamentos e metas compartilhados permanecem com o usuário que os criou.

---

## 4. Categorias

### 4.1 CRUD de Categorias
- 🔴 Criar categoria com nome e tipo (despesa / receita / ambos)
- 🔴 Editar nome e tipo da categoria
- 🔴 Excluir categoria — bloquear exclusão se houver lançamentos vinculados
- 🔴 Listar todas as categorias do casal
- 🟡 Categorias padrão pré-criadas no primeiro acesso (Alimentação, Transporte, Saúde, Lazer, Moradia, Educação)
- 🟢 Ícone ou cor identificadora para cada categoria

> 📌 **Escopo:** categorias são compartilhadas entre o casal — não há categorias individuais.

---

## 5. Lançamentos

### 5.1 Campos do Formulário

| Campo | Tipo | Obrigatoriedade |
|---|---|---|
| Tipo | Toggle — Despesa / Receita | Obrigatório |
| Valor | Numérico decimal | Obrigatório |
| Categoria | Select — filtrado pelo tipo selecionado | Obrigatório |
| Data | Date picker | Obrigatório |
| Descrição | Texto livre (máx. 200 caracteres) | Opcional |
| Recorrente? | Checkbox | Opcional |
| Intervalo | Select — Semanal / Mensal / Anual | Se recorrente |
| Repetições | Número inteiro (quantidade de ocorrências) | Se recorrente |

### 5.2 Comportamento
- 🔴 Ao salvar lançamento recorrente, gerar N documentos no Firestore calculando datas automaticamente
- 🔴 Botões Salvar e Cancelar em todas as ações de criação e edição
- 🔴 Editar lançamento individual
- 🔴 Excluir lançamento individual com confirmação
- 🟡 Ao editar recorrente: opção de alterar só este, este e seguintes, ou todos
- 🟡 Listar lançamentos com filtro por mês/período, tipo e categoria
- 🟡 Paginação ou scroll infinito na listagem
- 🟢 Busca por descrição do lançamento

> 📌 **Decisão necessária:** lançamento pertence ao usuário que criou, mas aparece no dashboard combinado. Definir se o parceiro pode editar ou excluir lançamentos do outro.

---

## 6. Metas por Categoria

- 🔴 Definir valor-limite de gastos por categoria e por período mensal
- 🔴 Editar e excluir metas existentes
- 🔴 Meta é compartilhada — considera lançamentos de ambos os parceiros
- 🟡 Exibir percentual utilizado (ex.: 68% de R$ 500,00)
- 🟡 Destaque visual quando a meta ultrapassar 80% ou 100% do limite
- 🟢 Notificação ao atingir 80% ou 100% da meta

> 📌 **Escopo inicial:** metas mensais. Metas por período customizado são candidatas para a versão 2.

---

## 7. Dashboard

### 7.1 Visão Combinada do Casal
- 🔴 Total de receitas do período selecionado
- 🔴 Total de despesas do período selecionado
- 🔴 Saldo resultante (receitas menos despesas)
- 🔴 Gráfico de despesas por categoria (pizza ou barras horizontais)
- 🟡 Progresso das metas com barra de porcentagem por categoria
- 🟡 Seletor de período — mês atual, mês anterior, customizado

### 7.2 Visão Individual
- 🔴 Resumo de receitas e despesas de cada parceiro separadamente
- 🟡 Percentual de contribuição de cada um no total de despesas do período

> 📌 **Período padrão ao abrir:** mês corrente. O seletor de mês deve estar visível no topo da tela.

---

## 8. Tela de Ajustes

- 🔴 Exibir nome e e-mail do usuário logado
- 🔴 Atualizar nome de exibição
- 🔴 Alterar senha
- 🔴 Seção do parceiro: exibir nome se vinculado, ou botão para enviar/aceitar convite
- 🔴 Botão Sair (logout)
- 🔴 Botão Excluir Conta com confirmação por senha

---

## 9. Fora do Escopo — Versão 1

- Múltiplos parceiros ou grupos financeiros
- Importação de extratos bancários (CSV / OFX)
- Integração com Open Finance
- Relatórios exportáveis em PDF
- Aplicativo mobile nativo (iOS / Android)
- Metas anuais ou por período customizado
- Notificações push
