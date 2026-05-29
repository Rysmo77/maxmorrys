// Firestore rules unit tests for the security audit changes.
// Run via: firebase emulators:exec --only firestore "node scripts/rules.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const UID = 'user_alice';
const OTHER = 'user_bob';
const FID = 'formation_x';
const ENID = `${UID}_${FID}`;

let passed = 0;
let failed = 0;
async function check(name, promise) {
  try {
    await promise;
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name} — ${e?.message ?? e}`);
    failed++;
  }
}

const testEnv = await initializeTestEnvironment({
  projectId: 'max-morrys',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
});

// Seed data bypassing rules.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users', UID), { uid: UID, role: 'student', email: 'a@x.co' });
  await setDoc(doc(db, 'users', OTHER), { uid: OTHER, role: 'student', email: 'b@x.co' });
  await setDoc(doc(db, 'enrollments', ENID), {
    id: ENID, userId: UID, formationId: FID, progress: 50,
    completedLessons: ['l1'], certificateIssued: false, lastActivityAt: 't0',
  });
  await setDoc(doc(db, 'gamification', UID), { userId: UID, xp: 100 });
  await setDoc(doc(db, 'gamification', OTHER), { userId: OTHER, xp: 999 });
});

const alice = testEnv.authenticatedContext(UID).firestore();
const bob = testEnv.authenticatedContext(OTHER).firestore();

console.log('VULN-001 — certificates: client cannot self-issue');
await check('client create certificate is DENIED', assertFails(
  setDoc(doc(alice, 'certificates', ENID), {
    userId: UID, formationId: FID, formationTitle: 'X',
    issuedAt: 't', certificateCode: 'MM-FAKE',
  }),
));

console.log('VULN-003 — enrollments update field whitelist');
await check('owner updates completedLessons+progress is ALLOWED', assertSucceeds(
  updateDoc(doc(alice, 'enrollments', ENID), { completedLessons: ['l1', 'l2'], progress: 80, lastActivityAt: 't1' }),
));
await check('owner may DECREASE progress (un-complete) is ALLOWED', assertSucceeds(
  updateDoc(doc(alice, 'enrollments', ENID), { progress: 10 }),
));
await check('owner writing an arbitrary field is DENIED', assertFails(
  updateDoc(doc(alice, 'enrollments', ENID), { hacked: true }),
));
await check('owner changing userId is DENIED', assertFails(
  updateDoc(doc(alice, 'enrollments', ENID), { userId: OTHER }),
));
await check('progress > 100 is DENIED', assertFails(
  updateDoc(doc(alice, 'enrollments', ENID), { progress: 9999 }),
));
await check('non-owner updating the enrollment is DENIED', assertFails(
  updateDoc(doc(bob, 'enrollments', ENID), { progress: 100 }),
));

console.log('VULN-002 — gamification read scope');
await check('owner reads own gamification is ALLOWED', assertSucceeds(
  getDoc(doc(alice, 'gamification', UID)),
));
await check("reading another user's gamification is DENIED", assertFails(
  getDoc(doc(alice, 'gamification', OTHER)),
));

await testEnv.cleanup();
console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
