import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, '../../firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'finly-test',
    firestore: { rules },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

function getAuthContext(uid: string): RulesTestContext {
  return testEnv.authenticatedContext(uid);
}

function getUnauthContext(): RulesTestContext {
  return testEnv.unauthenticatedContext();
}

// ── Auth — /users/{userId} ───────────────────────────────────

describe('/users/{userId}', () => {
  test('✓ usuário autenticado lê seu próprio documento', async () => {
    const ctx = getAuthContext('user1');
    // Seed data using admin
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'users/user1'), {
        name: 'Test User',
        email: 'test@test.com',
        currency: 'BRL',
        createdAt: new Date(),
      });
    });
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'users/user1')));
  });

  test('✗ usuário autenticado lê documento de outro usuário', async () => {
    const ctx = getAuthContext('user1');
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'users/user2'), {
        name: 'Other User',
        email: 'other@test.com',
        currency: 'BRL',
        createdAt: new Date(),
      });
    });
    await assertFails(getDoc(doc(ctx.firestore(), 'users/user2')));
  });

  test('✓ usuário cria seu próprio documento com campos válidos', async () => {
    const ctx = getAuthContext('user1');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'users/user1'), {
        name: 'Test User',
        email: 'test@test.com',
        currency: 'BRL',
        createdAt: new Date(),
      })
    );
  });

  test('✗ usuário cria documento com userId diferente do seu', async () => {
    const ctx = getAuthContext('user1');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'users/user2'), {
        name: 'Test User',
        email: 'test@test.com',
        currency: 'BRL',
        createdAt: new Date(),
      })
    );
  });

  test('✗ usuário não autenticado lê qualquer documento', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'users/user1'), {
        name: 'Test User',
        email: 'test@test.com',
        currency: 'BRL',
        createdAt: new Date(),
      });
    });
    const ctx = getUnauthContext();
    await assertFails(getDoc(doc(ctx.firestore(), 'users/user1')));
  });

  test('✗ usuário deleta seu próprio documento', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'users/user1'), {
        name: 'Test User',
        email: 'test@test.com',
        currency: 'BRL',
        createdAt: new Date(),
      });
    });
    const ctx = getAuthContext('user1');
    await assertFails(deleteDoc(doc(ctx.firestore(), 'users/user1')));
  });
});

// ── Família — /families/{familyId} ───────────────────────────

describe('/families/{familyId}', () => {
  const familyData = {
    name: 'Família Silva',
    createdAt: new Date(),
    members: [
      { userId: 'admin1', role: 'admin', joinedAt: new Date() },
      { userId: 'editor1', role: 'editor', joinedAt: new Date() },
      { userId: 'viewer1', role: 'viewer', joinedAt: new Date() },
    ],
  };

  async function seedFamily() {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'families/fam1'), familyData);
    });
  }

  test('✓ membro lê o documento da família', async () => {
    await seedFamily();
    const ctx = getAuthContext('editor1');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'families/fam1')));
  });

  test('✗ não-membro lê o documento da família', async () => {
    await seedFamily();
    const ctx = getAuthContext('outsider');
    await assertFails(getDoc(doc(ctx.firestore(), 'families/fam1')));
  });

  test('✓ admin atualiza o documento da família', async () => {
    await seedFamily();
    const ctx = getAuthContext('admin1');
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), 'families/fam1'), { name: 'Família Silva Atualizada' })
    );
  });

  test('✗ editor tenta atualizar o documento da família', async () => {
    await seedFamily();
    const ctx = getAuthContext('editor1');
    await assertFails(updateDoc(doc(ctx.firestore(), 'families/fam1'), { name: 'Não autorizado' }));
  });
});

// ── Subcoleções — /families/{familyId}/accounts ─────────────

describe('/families/{familyId}/accounts', () => {
  const familyData = {
    name: 'Família Teste',
    createdAt: new Date(),
    members: [
      { userId: 'admin1', role: 'admin', joinedAt: new Date() },
      { userId: 'editor1', role: 'editor', joinedAt: new Date() },
      { userId: 'viewer1', role: 'viewer', joinedAt: new Date() },
    ],
  };

  async function seedFamily() {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'families/fam1'), familyData);
    });
  }

  const accountData = {
    name: 'Conta Corrente',
    bank: 'Banco do Brasil',
    type: 'corrente',
    initialBalance: 1000,
    archivedAt: null,
    createdBy: 'editor1',
    createdAt: new Date(),
  };

  test('✓ editor cria uma conta na família', async () => {
    await seedFamily();
    const ctx = getAuthContext('editor1');
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'families/fam1/accounts/acc1'), accountData));
  });

  test('✓ admin cria uma conta na família', async () => {
    await seedFamily();
    const ctx = getAuthContext('admin1');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'families/fam1/accounts/acc1'), {
        ...accountData,
        createdBy: 'admin1',
      })
    );
  });

  test('✗ viewer tenta criar uma conta na família', async () => {
    await seedFamily();
    const ctx = getAuthContext('viewer1');
    await assertFails(setDoc(doc(ctx.firestore(), 'families/fam1/accounts/acc1'), accountData));
  });

  test('✗ não-membro tenta ler contas da família', async () => {
    await seedFamily();
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'families/fam1/accounts/acc1'), accountData);
    });
    const ctx = getAuthContext('outsider');
    await assertFails(getDoc(doc(ctx.firestore(), 'families/fam1/accounts/acc1')));
  });
});
