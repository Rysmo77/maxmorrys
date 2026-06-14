/**
 * Firestore Security Rules tests (run against the Firestore emulator).
 *
 *   npm run test:rules
 *
 * Focus of this first suite: validate the Sprint-0 hardening of the
 * `gamification` rule (bounded XP/badge writes) plus a few core invariants
 * (users role immutability, enrollment progress bounds, client transaction
 * creation restricted to free courses). See audit/AUDIT_SECURITY.md §S2.
 */
import { readFileSync } from 'fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { beforeAll, afterAll, afterEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-rules-test';
const ALICE = 'alice';
const BOB = 'bob';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

/** Firestore handle for an authenticated user. */
function asUser(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}

/** Seed a document bypassing rules. */
async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

const GAMI = (xp: number, extra: Record<string, unknown> = {}) => ({
  xp,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  badges: [] as string[],
  ...extra,
});

describe('gamification — bounded client writes (Sprint 0)', () => {
  it('owner can create a default profile', async () => {
    const db = asUser(ALICE);
    await assertSucceeds(setDoc(doc(db, 'gamification', ALICE), GAMI(0)));
  });

  it('owner can create with a small initial XP (<= 500)', async () => {
    const db = asUser(ALICE);
    await assertSucceeds(setDoc(doc(db, 'gamification', ALICE), GAMI(200)));
  });

  it('owner CANNOT create with arbitrary huge XP', async () => {
    const db = asUser(ALICE);
    await assertFails(setDoc(doc(db, 'gamification', ALICE), GAMI(999999)));
  });

  it('owner CANNOT create with multiple badges at once', async () => {
    const db = asUser(ALICE);
    await assertFails(
      setDoc(doc(db, 'gamification', ALICE), GAMI(0, { badges: ['a', 'b', 'c'] })),
    );
  });

  it('a non-owner CANNOT write someone else\'s profile', async () => {
    const db = asUser(BOB);
    await assertFails(setDoc(doc(db, 'gamification', ALICE), GAMI(0)));
  });

  it('owner can add a bounded XP increment (legit addXP)', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100, { level: 2 }));
    const db = asUser(ALICE);
    await assertSucceeds(updateDoc(doc(db, 'gamification', ALICE), { xp: 300, level: 2 }));
  });

  it('owner CANNOT jump XP to an arbitrary value', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100, { level: 2 }));
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'gamification', ALICE), { xp: 999999, level: 10 }));
  });

  it('owner CANNOT decrease XP', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100, { level: 2 }));
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'gamification', ALICE), { xp: 50 }));
  });

  it('owner can append a single badge (legit awardBadge)', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100, { badges: [] }));
    const db = asUser(ALICE);
    await assertSucceeds(updateDoc(doc(db, 'gamification', ALICE), { badges: ['contributeur'] }));
  });

  it('owner CANNOT inject many badges at once', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100, { badges: [] }));
    const db = asUser(ALICE);
    await assertFails(
      updateDoc(doc(db, 'gamification', ALICE), { badges: ['a', 'b', 'c', 'd', 'e'] }),
    );
  });

  it('owner can reset a streak (legit updateStreak after a break)', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100, { currentStreak: 5 }));
    const db = asUser(ALICE);
    await assertSucceeds(
      updateDoc(doc(db, 'gamification', ALICE), { currentStreak: 1, lastActiveDate: '2026-06-14' }),
    );
  });
});

describe('users — role immutability', () => {
  it('owner can update a non-role field', async () => {
    await seed(`users/${ALICE}`, { uid: ALICE, role: 'student', displayName: 'Alice' });
    const db = asUser(ALICE);
    await assertSucceeds(updateDoc(doc(db, 'users', ALICE), { displayName: 'Alicia' }));
  });

  it('owner CANNOT promote themselves to admin', async () => {
    await seed(`users/${ALICE}`, { uid: ALICE, role: 'student', displayName: 'Alice' });
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'users', ALICE), { role: 'admin' }));
  });
});

describe('enrollments — progress bounds', () => {
  const ENR = `${ALICE}_f1`;
  const base = { userId: ALICE, formationId: 'f1', progress: 0, completedLessons: [], certificateIssued: false };

  it('owner can update progress within [0,100]', async () => {
    await seed(`enrollments/${ENR}`, base);
    const db = asUser(ALICE);
    await assertSucceeds(updateDoc(doc(db, 'enrollments', ENR), { progress: 50 }));
  });

  it('owner CANNOT set progress above 100', async () => {
    await seed(`enrollments/${ENR}`, base);
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'enrollments', ENR), { progress: 150 }));
  });
});

describe('transactions — client creation restricted to free courses', () => {
  it('user can create a free (amount 0) completed transaction', async () => {
    const db = asUser(ALICE);
    await assertSucceeds(
      setDoc(doc(db, 'transactions', 't1'), {
        userId: ALICE, status: 'completed', paymentMethod: 'free', amount: 0,
      }),
    );
  });

  it('user CANNOT create a paid transaction client-side', async () => {
    const db = asUser(ALICE);
    await assertFails(
      setDoc(doc(db, 'transactions', 't2'), {
        userId: ALICE, status: 'completed', paymentMethod: 'bictorys', amount: 5000,
      }),
    );
  });
});
