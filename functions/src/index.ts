import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

admin.initializeApp();

const REGION = 'southamerica-east1';

// fn-processOFX
export const processOFX = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }
  // TODO: Implementar parse de OFX na Fase 3
  return { toImport: [], duplicates: [] };
});

// fn-recurrenceJob
export const recurrenceJob = onSchedule(
  { region: REGION, schedule: 'every day 00:05' },
  async () => {
    // TODO: Implementar criação automática de transações recorrentes na Fase 2
    console.log('recurrenceJob executed');
  }
);

// fn-budgetAlert
export const budgetAlert = onDocumentWritten(
  { region: REGION, document: 'families/{familyId}/transactions/{transactionId}' },
  async () => {
    // TODO: Implementar alerta de orçamento na Fase 3
    console.log('budgetAlert triggered');
  }
);

// fn-deleteUser
export const deleteUser = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }
  // TODO: Implementar anonimização LGPD e exclusão de conta
  const uid = request.auth.uid;
  console.log(`deleteUser called for uid: ${uid}`);
  return { success: true };
});

// fn-exportData
export const exportData = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }
  // TODO: Implementar exportação de dados do usuário (LGPD)
  return { data: {} };
});
