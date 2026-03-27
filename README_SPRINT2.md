# Sprint 2 - Controle Financeiro para Casais

## Requisitos entregues

- ✅ Firebase Security Rules completas para `families`, subcolecoes e `invites`
- ✅ Servico de familias em `lib/firestore/families.ts`
  - `getFamilyByMember`
  - `createFamily`
  - `addMemberToFamily`
  - `removeMemberFromFamily`
- ✅ Servico de convites em `lib/firestore/invites.ts`
  - `createInvite`
  - `getInviteByCode`
  - `getInviteByEmail`
  - `acceptInvite`
  - expiracao de convites no momento da leitura
- ✅ Servico de categorias em `lib/firestore/categories.ts`
  - listar, criar, editar, excluir (com bloqueio por lancamentos vinculados)
  - criacao automatica de categorias padrao
- ✅ Hook `useFamily` completo
  - `family`, `partner`, `pendingInvite`, `receivedInvite`, `loading`
  - `sendInvite`, `acceptInvite`, `removePartner`, `cancelPendingInvite`, `declineReceivedInvite`
- ✅ Tela de Categorias funcional (`/categorias`)
  - listagem por tipo
  - modal de criar/editar
  - exclusao com confirmacao e validacao
- ✅ Tela de Ajustes funcional (`/ajustes`)
  - edicao de nome
  - alteracao de senha
  - envio/aceite/recusa/cancelamento de convite
  - remocao de parceiro
  - logout e exclusao de conta
- ✅ Fluxo de cadastro garantindo criacao e vinculo de familia
- ✅ Correcoes de permissao para leitura de parceiro e aceite de convite

---

## Como rodar o projeto localmente

### 1. Instale as dependencias
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

### 3. Publicar regras do Firestore (obrigatorio na Sprint 2)
```bash
firebase deploy --only firestore:rules
```

### 4. Iniciar aplicacao
```bash
npm run dev
```

### 5. Acessar
[http://localhost:3000](http://localhost:3000)

---

## Fluxos de teste da Sprint 2

### 1) Convite de parceiro

1. Conta A acessa `/ajustes`
2. Em "Meu parceiro", informa o e-mail da Conta B e clica em "Enviar convite"
3. Conta B faz login e acessa `/ajustes`
4. Conta B visualiza convite recebido com nome/e-mail do remetente
5. Conta B clica em "Aceitar convite"
6. Resultado esperado:
   - `invites/{code}` muda para `status: accepted`
   - Conta B entra em `memberIds` da familia da Conta A
   - tela de parceiro passa a exibir parceiro vinculado

### 2) Recusar ou cancelar convite

1. Conta B pode clicar em "Recusar"
2. Conta A pode clicar em "Cancelar convite"
3. Resultado esperado:
   - convite sai de `pending` (marcado como `expired`)
   - card de convite pendente desaparece

### 3) Categorias

1. Acessar `/categorias`
2. Se a familia nao tiver categorias, o sistema cria padrao automaticamente
3. Criar nova categoria no modal
4. Editar uma categoria existente
5. Excluir categoria sem lancamentos vinculados
6. Resultado esperado:
   - listagem agrupada por Despesas, Receitas e Ambos
   - erro amigavel ao tentar excluir categoria com lancamentos vinculados

### 4) Ajustes da conta

1. Editar nome e salvar
2. Alterar senha no modal
3. Fazer logout
4. Reautenticar e confirmar atualizacoes

---

## Regras de seguranca implementadas

Arquivo: `firestore.rules`

- `families/{familyId}`:
  - leitura por membros da familia
  - criacao por usuario autenticado com proprio UID em `memberIds`
  - update por membro e por fluxo seguro de auto-entrada ao aceitar convite
- `entries`:
  - leitura/criacao por membros
  - update/delete apenas pelo `ownerId`
- `categories` e `goals`:
  - leitura e escrita por membros da familia
- `invites`:
  - leitura por remetente ou destinatario
  - criacao pelo remetente autenticado
  - update por remetente ou destinatario
- `users`:
  - leitura do proprio usuario e entre membros da mesma familia
  - escrita apenas no proprio documento

---

## Estrutura impactada na Sprint 2

```txt
app/
  (app)/
    ajustes/page.tsx
    categorias/page.tsx
  (auth)/
    register/page.tsx

hooks/
  useAuth.ts
  useFamily.ts

lib/
  firestore/
    families.ts
    invites.ts
    categories.ts

firestore.rules
```

---

## Checklist de conclusao

- ✅ Build de producao passando (`npm run build`)
- ✅ Regras do Firestore atualizadas e publicadas
- ✅ Convite entre parceiros funcionando
- ✅ Aceite de convite sem erro de permissao
- ✅ Leitura de parceiro funcionando em Ajustes
- ✅ CRUD de categorias funcional
- ✅ Fluxo de conta (nome/senha/logout/exclusao) funcional

---

## Observacoes

- Convites antigos (criados antes do ajuste de metadados `fromName`/`fromEmail`) podem aparecer com fallback de remetente.
- Se houver erro de permissao apos alteracoes de regras, confirmar novo deploy com `firebase deploy --only firestore:rules`.

---

**Proxima sprint:** Lancamentos (formulario completo, filtros e recorrencia).