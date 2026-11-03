/**
 * JOURNAL D'AUDIT DE LA CONSOLE — audit UI/UX du 03/11/2026, A1 (P1).
 *
 *   npm run test:rules
 *
 * Fichier à part, avec son PROPRE projet d'émulateur : `rules.test.ts` vide la base après
 * chaque test, et vitest exécute les fichiers en parallèle — un même projectId ferait
 * s'effacer les données de l'un sous les pieds de l'autre.
 *
 * Ce que ces portes tiennent :
 *   · `audit_log` est en ajout seul — ni update, ni delete, pour personne ;
 *   · l'acteur est l'appelant, le rôle celui lu en base, l'heure celle du serveur ;
 *   · un non-staff n'écrit ni ne lit le journal ;
 *   · une suppression sensible et un changement de rôle sans entrée sont REFUSÉS ;
 *     avec leur entrée dans le même lot, ils passent.
 */
import { readFileSync } from 'fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { beforeAll, afterAll, afterEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-rules-audit';
const ADMIN = 'adminUid';
const SUPPORT = 'supportUid';
const STUDENT = 'studentUid';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => { await testEnv?.cleanup(); });
afterEach(async () => { await testEnv.clearFirestore(); });

const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();

async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

async function seedStaff() {
  await seed(`users/${ADMIN}`, { uid: ADMIN, role: 'admin' });
  await seed(`users/${SUPPORT}`, { uid: SUPPORT, role: 'support' });
  await seed(`users/${STUDENT}`, { uid: STUDENT, role: 'student' });
}

const entry = (uid: string, role: string, extra: Record<string, unknown> = {}) => ({
  actorUid: uid,
  actorRole: role,
  action: 'blog.delete',
  targetCollection: 'blog',
  targetId: 'p1',
  at: serverTimestamp(),
  ...extra,
});

describe('audit_log — ajout seul, acteur non usurpable', () => {
  it('un admin journalise sa propre action', async () => {
    await seedStaff();
    await assertSucceeds(setDoc(doc(as(ADMIN), 'audit_log', 'e1'), entry(ADMIN, 'admin', { space: 'hub', summary: 'x' })));
  });

  it('le support journalise aussi sa propre action', async () => {
    await seedStaff();
    await assertSucceeds(setDoc(doc(as(SUPPORT), 'audit_log', 'e1'), entry(SUPPORT, 'support')));
  });

  it("USURPATION : un admin ne peut pas écrire au nom d'un autre", async () => {
    await seedStaff();
    await assertFails(setDoc(doc(as(ADMIN), 'audit_log', 'e1'), entry(SUPPORT, 'support')));
  });

  it("le support ne peut pas se déclarer admin", async () => {
    await seedStaff();
    await assertFails(setDoc(doc(as(SUPPORT), 'audit_log', 'e1'), entry(SUPPORT, 'admin')));
  });

  it("l'horodatage est celui du serveur, jamais une date du client", async () => {
    await seedStaff();
    await assertFails(setDoc(doc(as(ADMIN), 'audit_log', 'e1'),
      entry(ADMIN, 'admin', { at: Timestamp.fromDate(new Date('2026-01-01')) })));
  });

  it('les champs sont fermés (hasOnly) et bornés', async () => {
    await seedStaff();
    await assertFails(setDoc(doc(as(ADMIN), 'audit_log', 'e1'), entry(ADMIN, 'admin', { extra: 1 })));
    await assertFails(setDoc(doc(as(ADMIN), 'audit_log', 'e2'), entry(ADMIN, 'admin', { summary: 'x'.repeat(301) })));
    await assertFails(setDoc(doc(as(ADMIN), 'audit_log', 'e3'), entry(ADMIN, 'admin', { action: 'DROP TABLE' })));
    await assertFails(setDoc(doc(as(ADMIN), 'audit_log', 'e4'), entry(ADMIN, 'admin', { space: 'mars' })));
  });

  it('un non-staff ne peut ni écrire ni lire le journal', async () => {
    await seedStaff();
    await assertFails(setDoc(doc(as(STUDENT), 'audit_log', 'e1'), entry(STUDENT, 'student')));
    await seed('audit_log/old', { actorUid: ADMIN, actorRole: 'admin', action: 'blog.delete', targetCollection: 'blog', targetId: 'p', at: Timestamp.now() });
    await assertFails(getDoc(doc(as(STUDENT), 'audit_log', 'old')));
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'audit_log', 'old')));
  });

  it("le support ne lit que ses propres traces ; l'admin lit tout", async () => {
    await seedStaff();
    await seed('audit_log/old', { actorUid: ADMIN, actorRole: 'admin', action: 'blog.delete', targetCollection: 'blog', targetId: 'p', at: Timestamp.now() });
    await assertFails(getDoc(doc(as(SUPPORT), 'audit_log', 'old')));
    await assertSucceeds(getDoc(doc(as(ADMIN), 'audit_log', 'old')));
  });

  it("APPEND-ONLY : personne, pas même l'admin, ne modifie ni n'efface une entrée", async () => {
    await seedStaff();
    await seed('audit_log/old', { actorUid: ADMIN, actorRole: 'admin', action: 'blog.delete', targetCollection: 'blog', targetId: 'p', at: Timestamp.now() });
    await assertFails(updateDoc(doc(as(ADMIN), 'audit_log', 'old'), { summary: 'réécrit' }));
    await assertFails(deleteDoc(doc(as(ADMIN), 'audit_log', 'old')));
    // Ni en recréant le même identifiant par-dessus.
    await assertFails(setDoc(doc(as(ADMIN), 'audit_log', 'old'), entry(ADMIN, 'admin')));
  });
});

describe('audit_log — une suppression sensible exige son entrée dans le même lot', () => {
  it('suppression SANS entrée : refusée', async () => {
    await seedStaff();
    await seed('blog/p1', { status: 'draft', title: 'x' });
    await assertFails(deleteDoc(doc(as(ADMIN), 'blog', 'p1')));
  });

  it('suppression AVEC son entrée déterministe dans le même lot : acceptée', async () => {
    await seedStaff();
    await seed('blog/p1', { status: 'draft', title: 'x' });
    const db = as(ADMIN);
    const b = writeBatch(db);
    b.delete(doc(db, 'blog', 'p1'));
    b.set(doc(db, 'audit_log', 'delete__blog__p1'), entry(ADMIN, 'admin'));
    await assertSucceeds(b.commit());
  });

  it("une entrée qui décrit AUTRE CHOSE ne couvre pas la suppression", async () => {
    await seedStaff();
    await seed('formations/f1', { status: 'draft' });
    const db = as(ADMIN);
    const b = writeBatch(db);
    b.delete(doc(db, 'formations', 'f1'));
    b.set(doc(db, 'audit_log', 'delete__formations__f1'), entry(ADMIN, 'admin', { targetCollection: 'formations', targetId: 'autre', action: 'formations.delete' }));
    await assertFails(b.commit());
  });

  it("une entrée ANCIENNE (autre requête) ne couvre pas une nouvelle suppression", async () => {
    await seedStaff();
    await seed('redirects/r1', { source: '/a', target: '/b', code: 301, kind: 'seo', active: true });
    await seed('audit_log/delete__redirects__r1', {
      actorUid: ADMIN, actorRole: 'admin', action: 'redirects.delete', targetCollection: 'redirects', targetId: 'r1', at: Timestamp.now(),
    });
    await assertFails(deleteDoc(doc(as(ADMIN), 'redirects', 'r1')));
  });
});

describe('audit_log — un changement de rôle exige son entrée (auditRef)', () => {
  it('rôle changé SANS entrée : refusé, même pour un admin', async () => {
    await seedStaff();
    await assertFails(updateDoc(doc(as(ADMIN), 'users', STUDENT), { role: 'support' }));
  });

  it('rôle changé AVEC entrée users.role dans le même lot : accepté', async () => {
    await seedStaff();
    const db = as(ADMIN);
    const b = writeBatch(db);
    b.set(doc(db, 'users', STUDENT), { role: 'support', auditRef: 'r1' }, { merge: true });
    b.set(doc(db, 'audit_log', 'r1'), entry(ADMIN, 'admin', { action: 'users.role', targetCollection: 'users', targetId: STUDENT }));
    await assertSucceeds(b.commit());
  });

  it("une entrée qui vise un AUTRE compte ne couvre pas le changement", async () => {
    await seedStaff();
    const db = as(ADMIN);
    const b = writeBatch(db);
    b.set(doc(db, 'users', STUDENT), { role: 'support', auditRef: 'r1' }, { merge: true });
    b.set(doc(db, 'audit_log', 'r1'), entry(ADMIN, 'admin', { action: 'users.role', targetCollection: 'users', targetId: SUPPORT }));
    await assertFails(b.commit());
  });

  it('un admin modifie toujours un champ hors rôle sans entrée (non-régression)', async () => {
    await seedStaff();
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'users', STUDENT), { displayName: 'Élève' }));
  });

  it("un élève ne change toujours pas son rôle, même avec une entrée", async () => {
    await seedStaff();
    const db = as(STUDENT);
    const b = writeBatch(db);
    b.set(doc(db, 'users', STUDENT), { role: 'admin', auditRef: 'r1' }, { merge: true });
    b.set(doc(db, 'audit_log', 'r1'), entry(STUDENT, 'student', { action: 'users.role', targetCollection: 'users', targetId: STUDENT }));
    await assertFails(b.commit());
  });
});

describe('waitlist — se retirer quand il n y a rien a decrementer', () => {
  const ENTREE = { userId: STUDENT, formationId: 'f1', email: 's@x.io', createdAt: '2026-11-01T00:00:00.000Z' };

  it('formation supprimee : l entree se retire seule', async () => {
    await seed(`waitlist/${STUDENT}_f1`, ENTREE);
    await assertSucceeds(deleteDoc(doc(as(STUDENT), 'waitlist', `${STUDENT}_f1`)));
  });

  it('compteur absent ou a zero : l entree se retire seule', async () => {
    await seed('formations/f1', { status: 'published', comingSoon: true });
    await seed(`waitlist/${STUDENT}_f1`, ENTREE);
    await assertSucceeds(deleteDoc(doc(as(STUDENT), 'waitlist', `${STUDENT}_f1`)));
    await seed('formations/f2', { status: 'published', comingSoon: true, waitlistCount: 0 });
    await seed(`waitlist/${STUDENT}_f2`, { ...ENTREE, formationId: 'f2' });
    await assertSucceeds(deleteDoc(doc(as(STUDENT), 'waitlist', `${STUDENT}_f2`)));
  });

  it("NON-REGRESSION : compteur positif, la suppression seule reste refusee ; et jamais l'entree d'autrui", async () => {
    await seed('formations/f1', { status: 'published', comingSoon: true, waitlistCount: 3 });
    await seed(`waitlist/${STUDENT}_f1`, ENTREE);
    await assertFails(deleteDoc(doc(as(STUDENT), 'waitlist', `${STUDENT}_f1`)));
    await seed(`waitlist/${ADMIN}_f9`, { ...ENTREE, userId: ADMIN, formationId: 'f9' });
    await assertFails(deleteDoc(doc(as(STUDENT), 'waitlist', `${ADMIN}_f9`)));
  });
});
