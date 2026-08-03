// Firestore rules unit tests for the security audit changes.
// Run via: firebase emulators:exec --only firestore "node scripts/rules.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

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

console.log('agency_leads — public quote form, admin-only pipeline');
const anon = testEnv.unauthenticatedContext().firestore();
const validLead = {
  businessName: 'Restaurant Le Baobab',
  contactName: 'Aminata Diop',
  phone: '+221770000000',
  city: 'Dakar, Point E',
  sector: 'restaurant',
  pack: 'visible',
  plan: 'croissance',
  status: 'new',
  createdAt: 't0',
};
await check('anonymous visitor submits a valid lead is ALLOWED', assertSucceeds(
  setDoc(doc(anon, 'agency_leads', 'lead_ok'), validLead),
));
await check('lead created with a status other than "new" is DENIED', assertFails(
  setDoc(doc(anon, 'agency_leads', 'lead_signed'), { ...validLead, status: 'signed' }),
));
await check('lead carrying internal notes is DENIED', assertFails(
  setDoc(doc(anon, 'agency_leads', 'lead_notes'), { ...validLead, notes: 'injected' }),
));
// Retire réellement la clé : `phone: undefined` ferait échouer le SDK, pas les règles.
const { phone: _omittedPhone, ...leadWithoutPhone } = validLead;
await check('lead missing the phone number is DENIED', assertFails(
  setDoc(doc(anon, 'agency_leads', 'lead_nophone'), leadWithoutPhone),
));
await check('lead with an oversized message is DENIED', assertFails(
  setDoc(doc(anon, 'agency_leads', 'lead_spam'), { ...validLead, message: 'x'.repeat(2001) }),
));
await check('student reading the agency pipeline is DENIED', assertFails(
  getDoc(doc(alice, 'agency_leads', 'lead_ok')),
));
await check('student qualifying a lead is DENIED', assertFails(
  updateDoc(doc(alice, 'agency_leads', 'lead_ok'), { status: 'signed' }),
));

console.log('agency_quotes — lien public, mais aucune donnée personnelle');
const validQuote = {
  businessName: 'Restaurant Le Baobab',
  city: 'Dakar, Point E',
  pack: 'visible',
  plan: 'croissance',
  packPrice: 495000,
  planSetup: 375000,
  planMonthly: 175000,
  locale: 'fr',
  createdAt: 't0',
  expiresAt: 't30',
};
const REF = 'DV-0123456789AB';

await check('anonymous creates a quote without PII is ALLOWED', assertSucceeds(
  setDoc(doc(anon, 'agency_quotes', REF), validQuote),
));
await check('anonymous reads a quote by exact reference is ALLOWED', assertSucceeds(
  getDoc(doc(anon, 'agency_quotes', REF)),
));

// Le coeur du dispositif : un devis est un document a lien public. Si l'une de ces
// quatre assertions casse, un numero de telephone devient accessible a qui a l'URL.
const PII_FIELDS = [
  ['phone', '+221770000000'],
  ['email', 'client@example.com'],
  ['contactName', 'Aminata Diop'],
  ['message', 'je vends des tissus'],
];
for (const [i, [field, value]] of PII_FIELDS.entries()) {
  await check(`quote carrying "${field}" is DENIED`, assertFails(
    setDoc(doc(anon, 'agency_quotes', `DV-LEAK0000000${i}`), { ...validQuote, [field]: value }),
  ));
}

await check('anonymous listing all quotes is DENIED', assertFails(
  getDocs(collection(anon, 'agency_quotes')),
));
await check('quote with an out-of-range amount is DENIED', assertFails(
  setDoc(doc(anon, 'agency_quotes', 'DV-BADAMOUNT01'), { ...validQuote, packPrice: 99999999 }),
));
await check('rewriting an issued quote is DENIED', assertFails(
  updateDoc(doc(anon, 'agency_quotes', REF), { packPrice: 1 }),
));

await testEnv.cleanup();
console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
