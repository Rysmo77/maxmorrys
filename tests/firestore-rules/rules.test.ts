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
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, where, documentId,
} from 'firebase/firestore';
import { beforeAll, afterAll, afterEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-rules-test';
const ALICE = 'alice';
const BOB = 'bob';
const CAROL = 'carol';

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

describe('enrollments — repere maxProgress anti-farm XP', () => {
  const ENR = `${ALICE}_f1`;
  const base = {
    userId: ALICE, formationId: 'f1', progress: 0,
    completedLessons: [], certificateIssued: false, maxProgress: 0,
  };

  it('le proprietaire peut faire monter maxProgress', async () => {
    await seed(`enrollments/${ENR}`, base);
    const db = asUser(ALICE);
    await assertSucceeds(updateDoc(doc(db, 'enrollments', ENR), { progress: 40, maxProgress: 40 }));
  });

  it('maxProgress ne peut PAS redescendre — c est ce qui empeche de refarmer l XP', async () => {
    await seed(`enrollments/${ENR}`, { ...base, progress: 60, maxProgress: 60 });
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'enrollments', ENR), { progress: 20, maxProgress: 20 }));
  });

  it('progress peut redescendre pendant que maxProgress tient — decocher une lecon reste permis', async () => {
    await seed(`enrollments/${ENR}`, { ...base, progress: 60, maxProgress: 60 });
    const db = asUser(ALICE);
    await assertSucceeds(updateDoc(doc(db, 'enrollments', ENR), { progress: 20, maxProgress: 60 }));
  });

  it('maxProgress ne peut pas depasser 100', async () => {
    await seed(`enrollments/${ENR}`, base);
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'enrollments', ENR), { maxProgress: 140 }));
  });

  it('un tiers ne peut pas toucher au repere', async () => {
    await seed(`enrollments/${ENR}`, base);
    const db = asUser(BOB);
    await assertFails(updateDoc(doc(db, 'enrollments', ENR), { maxProgress: 100 }));
  });
});

describe('public_stats — le miroir qui rend un engagement verifiable', () => {
  const STATS = { liveSessionsHeld: 7, windowDays: 90, asOf: '2026-09-04T08:00:00.000Z' };

  it('un visiteur anonyme lit le releve, puisque c est tout son objet', async () => {
    await seed('public_stats/club', STATS);
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'public_stats', 'club')));
  });

  it('personne ne l ecrit depuis le client — pas meme un admin', async () => {
    await seed(`users/${CAROL}`, { role: 'admin' });
    const db = asUser(CAROL);
    await assertFails(setDoc(doc(db, 'public_stats', 'club'), STATS));
  });

  it('le releve reste immuable cote client', async () => {
    await seed('public_stats/club', STATS);
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'public_stats', 'club'), { liveSessionsHeld: 99 }));
  });

  it('l agenda dont il est tire, lui, reste ferme aux non-membres', async () => {
    await seed('club_events/e1', { title: 'Session de septembre', date: '2026-09-01', status: 'past' });
    const db = asUser(BOB);
    await assertFails(getDoc(doc(db, 'club_events', 'e1')));
  });
});

describe('certificate_lookups — verification publique par code', () => {
  const CODE = 'MM-ABCDEF1234';
  const LOOKUP = {
    certificateCode: CODE,
    formationTitle: 'SEO local',
    issuedAt: '2026-08-29T00:00:00.000Z',
    holderName: 'Alice Diop',
  };

  it('un visiteur anonyme peut verifier un certificat par son code', async () => {
    await seed(`certificate_lookups/${CODE}`, LOOKUP);
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'certificate_lookups', CODE)));
  });

  it('personne ne peut ecrire un miroir depuis le client — pas meme un admin', async () => {
    await seed(`users/${CAROL}`, { role: 'admin' });
    const db = asUser(CAROL);
    await assertFails(setDoc(doc(db, 'certificate_lookups', CODE), LOOKUP));
  });

  it('le miroir reste immuable cote client', async () => {
    await seed(`certificate_lookups/${CODE}`, LOOKUP);
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'certificate_lookups', CODE), { holderName: 'Quelqu un d autre' }));
  });

  it('le certificat prive, lui, reste ferme aux tiers', async () => {
    await seed('certificates/alice_f1', { userId: ALICE, certificateCode: CODE, formationTitle: 'SEO local' });
    const db = asUser(BOB);
    await assertFails(getDoc(doc(db, 'certificates', 'alice_f1')));
  });
});

describe('transactions — client creation restricted to free courses', () => {
  /** Une vente a zero, telle que le client l'ecrit. */
  const GRATUITE = (formationId: string) => ({
    userId: ALICE, formationId, status: 'completed', paymentMethod: 'free', amount: 0,
  });

  it('user can create a free (amount 0) completed transaction', async () => {
    await seed('formations/f-free', { status: 'published', price: 0, createdAt: '2026-01-01' });
    await assertSucceeds(setDoc(doc(asUser(ALICE), 'transactions', 't1'), GRATUITE('f-free')));
  });

  it('user CANNOT create a paid transaction client-side', async () => {
    const db = asUser(ALICE);
    await assertFails(
      setDoc(doc(db, 'transactions', 't2'), {
        userId: ALICE, status: 'completed', paymentMethod: 'bictorys', amount: 5000,
      }),
    );
  });

  /*
   * Le trou que ces trois cas ferment : les trois affirmations verifiees par l'ancienne
   * regle (`completed`, `free`, `amount: 0`) etaient toutes fournies par l'ECRIVAIN. Le
   * prix reel de la formation n'etait lu nulle part, donc une vente inventee a zero
   * pouvait se poser sur le produit le plus cher du catalogue et entrait dans le chiffre
   * d'affaires de la console comme une vraie.
   */
  it('une transaction « gratuite » sur une formation PAYANTE est refusee', async () => {
    await seed('formations/f-payante', { status: 'published', price: 75000, createdAt: '2026-01-01' });
    await assertFails(setDoc(doc(asUser(ALICE), 'transactions', 't3'), GRATUITE('f-payante')));
  });

  it('sans `formationId`, la gratuite n est pas verifiable — donc refusee', async () => {
    await assertFails(setDoc(doc(asUser(ALICE), 'transactions', 't4'), {
      userId: ALICE, status: 'completed', paymentMethod: 'free', amount: 0,
    }));
  });

  it('un `promoPrice` a zero rend la transaction recevable — le predicat suit le prix effectif', async () => {
    await seed('formations/f-promo0', {
      status: 'published', price: 50000, promoPrice: 0, createdAt: '2026-01-01',
    });
    await assertSucceeds(setDoc(doc(asUser(ALICE), 'transactions', 't5'), GRATUITE('f-promo0')));
  });
});

describe('engagement_leads — formulaire de qualification /agence', () => {
  /** Demande valide type. Le formulaire est public : aucune authentification requise. */
  const LEAD = (extra: Record<string, unknown> = {}) => ({
    name: 'Awa Ndiaye',
    company: 'Baobab Labs',
    email: 'awa@baobablabs.sn',
    projectType: 'product',
    budget: 'medium',
    timeline: 'quarter',
    description:
      'Nous voulons construire une plateforme de gestion pour nos agences regionales.',
    status: 'new',
    createdAt: '2026-08-13T10:00:00.000Z',
    ...extra,
  });

  /** Firestore handle for an anonymous visitor. */
  function asVisitor() {
    return testEnv.unauthenticatedContext().firestore();
  }

  it('un visiteur anonyme peut soumettre une demande valide', async () => {
    const db = asVisitor();
    await assertSucceeds(setDoc(doc(db, 'engagement_leads', 'l1'), LEAD()));
  });

  it('accepte le marqueur de routage Growth', async () => {
    const db = asVisitor();
    await assertSucceeds(
      setDoc(doc(db, 'engagement_leads', 'l2'), LEAD({ routedTo: 'MY_ONOMA_GROW' })),
    );
  });

  /**
   * Le cas le plus proche du plafond : TOUS les champs optionnels remplis (`website`, `via`)
   * ET routage Growth declenche. C'est ce que soumet un prospect arrive par un credit
   * d'agence, qui donne son site et decrit un besoin d'acquisition — 13 cles, soit
   * exactement le plafond de la regle.
   */
  it('accepte le payload MAXIMAL (tous champs optionnels + routage + provenance)', async () => {
    const db = asVisitor();
    await assertSucceeds(
      setDoc(
        doc(db, 'engagement_leads', 'lmax'),
        LEAD({
          website: 'https://baobablabs.sn',
          routedTo: 'MY_ONOMA_GROW',
          locale: 'fr',
          via: 'eyone',
        }),
      ),
    );
  });

  it('refuse une provenance surdimensionnee', async () => {
    // `via` vient de la barre d'adresse : il ne doit pas devenir un champ de stockage libre.
    const db = asVisitor();
    await assertFails(setDoc(doc(db, 'engagement_leads', 'lvia'), LEAD({ via: 'x'.repeat(65) })));
  });

  it('refuse un statut autre que "new"', async () => {
    const db = asVisitor();
    await assertFails(setDoc(doc(db, 'engagement_leads', 'l3'), LEAD({ status: 'won' })));
  });

  it('refuse des notes internes posees par le prospect', async () => {
    const db = asVisitor();
    await assertFails(
      setDoc(doc(db, 'engagement_leads', 'l4'), LEAD({ notes: 'lead chaud' })),
    );
  });

  it('refuse une description trop courte pour etre qualifiable', async () => {
    const db = asVisitor();
    await assertFails(setDoc(doc(db, 'engagement_leads', 'l5'), LEAD({ description: 'salut' })));
  });

  it('refuse une valeur de routage inventee', async () => {
    const db = asVisitor();
    await assertFails(
      setDoc(doc(db, 'engagement_leads', 'l6'), LEAD({ routedTo: 'SOMEWHERE_ELSE' })),
    );
  });

  it('refuse le bourrage de document', async () => {
    const db = asVisitor();
    const stuffed: Record<string, unknown> = LEAD();
    for (let i = 0; i < 10; i++) stuffed[`junk${i}`] = 'x';
    await assertFails(setDoc(doc(db, 'engagement_leads', 'l7'), stuffed));
  });

  it('un utilisateur ordinaire ne peut pas relire les demandes', async () => {
    await seed('engagement_leads/l8', LEAD());
    const db = asUser(ALICE);
    await assertFails(getDoc(doc(db, 'engagement_leads', 'l8')));
  });
});

describe('newsletter — consentement explicite exige cote serveur', () => {
  function asVisitor() {
    return testEnv.unauthenticatedContext().firestore();
  }

  it('accepte une inscription avec consentement', async () => {
    const db = asVisitor();
    await assertSucceeds(
      setDoc(doc(db, 'newsletter', 'n1'), {
        email: 'awa@example.com',
        subscribedAt: '2026-08-13T10:00:00.000Z',
        source: 'footer',
        consent: true,
        consentAt: '2026-08-13T10:00:00.000Z',
      }),
    );
  });

  it('refuse une inscription sans champ de consentement', async () => {
    const db = asVisitor();
    await assertFails(
      setDoc(doc(db, 'newsletter', 'n2'), {
        email: 'awa@example.com',
        subscribedAt: '2026-08-13T10:00:00.000Z',
        source: 'footer',
      }),
    );
  });

  it('refuse un consentement a false', async () => {
    const db = asVisitor();
    await assertFails(
      setDoc(doc(db, 'newsletter', 'n3'), {
        email: 'awa@example.com',
        consent: false,
      }),
    );
  });
});

describe('redirects — table servie au bord, reservee a l administration', () => {
  const ENTRY = {
    source: '/via/eyone',
    target: '/agence',
    code: 302,
    kind: 'via',
    active: true,
    createdAt: '2026-08-25T10:00:00.000Z',
  };

  async function asAdmin() {
    await seed(`users/${CAROL}`, { role: 'admin' });
    return asUser(CAROL);
  }

  it('un administrateur gere la table', async () => {
    const db = await asAdmin();
    await assertSucceeds(setDoc(doc(db, 'redirects', 'r1'), ENTRY));
    await assertSucceeds(getDoc(doc(db, 'redirects', 'r1')));
    await assertSucceeds(updateDoc(doc(db, 'redirects', 'r1'), { active: false }));
  });

  it('un utilisateur ordinaire ne lit pas la table', async () => {
    // Aucune lecture publique n'est necessaire : le Worker lit par compte de service,
    // donc hors de ces regles.
    await seed('redirects/r2', ENTRY);
    const db = asUser(ALICE);
    await assertFails(getDoc(doc(db, 'redirects', 'r2')));
  });

  it('un utilisateur ordinaire ne peut pas detourner une redirection', async () => {
    await seed('redirects/r3', ENTRY);
    const db = asUser(ALICE);
    await assertFails(updateDoc(doc(db, 'redirects', 'r3'), { target: '/autre' }));
  });

  it('un visiteur anonyme ne peut rien creer', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'redirects', 'r4'), ENTRY));
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * `formations` — CE QU'UNE REQUETE PAR IDENTIFIANTS FAIT REELLEMENT.
 *
 * Ces cas ont ete SONDES contre l'emulateur avant d'etre ecrits, parce que l'intuition se
 * trompe ici, et qu'elle avait deja produit un correctif qui ne corrigeait rien.
 *
 * Sur un `where(documentId(), 'in', [...])`, Firestore n'applique pas le raisonnement
 * habituel « la requete doit prouver qu'elle ne demande que du lisible ». Il evalue la regle
 * DOCUMENT PAR DOCUMENT, comme une rafale de `get`. Consequences, toutes verifiees ci-dessous :
 *
 *   · si tous les documents demandes sont lisibles, la requete passe — meme SANS filtre ;
 *   · un seul brouillon parmi eux la refuse ENTIEREMENT ;
 *   · un identifiant qui ne correspond a AUCUN document la refuse aussi (`resource` est nul) ;
 *   · ajouter `where('status','==','published')` NE RATTRAPE NI L'UN NI L'AUTRE.
 *
 * C'est pourquoi `getFormationsByIds` ne fait plus de requete groupee : il lit chaque
 * formation separement, pour qu'une formation dépubliée ou supprimee disparaisse de la liste
 * au lieu de faire disparaitre TOUTES les inscriptions de l'espace eleve.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
describe('formations — la requete par identifiants est evaluee document par document', () => {
  const PUBLIEE = { title: 'Publiee', status: 'published', price: 0, createdAt: '2026-01-01' };

  async function seedCatalogue() {
    await seed('formations/f1', PUBLIEE);
    await seed('formations/f2', PUBLIEE);
    await seed('formations/f3', { ...PUBLIEE, title: 'Brouillon', status: 'draft' });
  }

  it('accepte le list par identifiants quand tout le lot est publie, meme sans filtre', async () => {
    await seedCatalogue();
    await assertSucceeds(getDocs(query(
      collection(asUser(ALICE), 'formations'),
      where(documentId(), 'in', ['f1', 'f2']),
    )));
  });

  it('mais UN SEUL brouillon dans le lot refuse la requete entiere', async () => {
    await seedCatalogue();
    await assertFails(getDocs(query(
      collection(asUser(ALICE), 'formations'),
      where(documentId(), 'in', ['f1', 'f3']),
    )));
  });

  it("et le filtre `status == published` ne la rattrape PAS — c'est le piege", async () => {
    await seedCatalogue();
    await assertFails(getDocs(query(
      collection(asUser(ALICE), 'formations'),
      where(documentId(), 'in', ['f1', 'f3']),
      where('status', '==', 'published'),
    )));
  });

  it('un identifiant sans document refuse tout autant — `resource` y est nul', async () => {
    // Le cas de production : une formation achetee puis SUPPRIMEE. L'inscription lui survit.
    await seedCatalogue();
    await assertFails(getDocs(query(
      collection(asUser(ALICE), 'formations'),
      where(documentId(), 'in', ['f1', 'jamais-existe']),
    )));
  });

  it('lue seule, la formation publiee reste lisible — le repli document par document tient', async () => {
    await seedCatalogue();
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'formations', 'f1')));
  });

  it('un brouillon demande explicitement reste refuse', async () => {
    await seedCatalogue();
    await assertFails(getDoc(doc(asUser(ALICE), 'formations', 'f3')));
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * COMING SOON — UNE FORMATION PUBLIEE MAIS PAS ENCORE OUVERTE.
 *
 * Le drapeau `comingSoon` vit sur une formation `status: 'published'`, pour que les regles de
 * lecture et toutes les requetes du produit restent inchangees. Le prix de ce choix est ici :
 * il faut fermer explicitement l'AUTO-INSCRIPTION, qui ne regardait que `status` et le prix.
 *
 * Sans la garde, une formation a venir affichee a 0 F etait auto-inscriptible par n'importe
 * quel compte connecte — qui atterrissait dans un lecteur sans une seule lecon a ouvrir.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
describe('formations — une Coming Soon gratuite ne s inscrit pas toute seule', () => {
  const GRATUITE = { title: 'Gratuite', status: 'published', price: 0, createdAt: '2026-01-01' };

  /** L'inscription telle que le client l'ecrit : meme forme, meme identifiant composite. */
  function inscription(db: ReturnType<typeof asUser>, uid: string, formationId: string) {
    return setDoc(doc(db, 'enrollments', `${uid}_${formationId}`), {
      userId: uid,
      formationId,
      progress: 0,
      completedLessons: [],
      enrolledAt: '2026-09-03',
    });
  }

  it('refuse l auto-inscription a une formation a venir, meme a prix nul', async () => {
    await seed('formations/f-venir', { ...GRATUITE, comingSoon: true });
    await assertFails(inscription(asUser(ALICE), ALICE, 'f-venir'));
  });

  it('refuse aussi quand c est `promoPrice` qui rend la formation gratuite', async () => {
    await seed('formations/f-promo', { ...GRATUITE, price: 50000, promoPrice: 0, comingSoon: true });
    await assertFails(inscription(asUser(ALICE), ALICE, 'f-promo'));
  });

  it('NON-REGRESSION : une formation gratuite ouverte reste auto-inscriptible', async () => {
    await seed('formations/f-ouverte', GRATUITE);
    await assertSucceeds(inscription(asUser(ALICE), ALICE, 'f-ouverte'));
  });

  it("NON-REGRESSION : l absence du champ vaut « ouverte » pour tout l existant", async () => {
    // Aucune formation anterieure ne porte `comingSoon`. Si son absence bloquait, tout le
    // catalogue gratuit deja en ligne cesserait d etre inscriptible du jour du deploiement.
    await seed('formations/f-legacy', GRATUITE);
    await assertSucceeds(inscription(asUser(BOB), BOB, 'f-legacy'));
  });

  it('une formation a venir reste LISIBLE — c est tout l interet du drapeau', async () => {
    await seed('formations/f-lisible', { ...GRATUITE, comingSoon: true });
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'formations', 'f-lisible')));
  });

  it('et le list du catalogue la rend, sans que la requete ait a la connaitre', async () => {
    await seed('formations/f-a', GRATUITE);
    await seed('formations/f-b', { ...GRATUITE, comingSoon: true });
    await assertSucceeds(getDocs(query(
      collection(asUser(ALICE), 'formations'),
      where('status', '==', 'published'),
    )));
  });
});

/*
 * `waitlist` — ecriture serveur uniquement, lecture bornee a sa propre entree.
 *
 * S'inscrire incremente aussi `formations/{id}.waitlistCount`, un document en ecriture admin :
 * une ecriture client ne pourrait donc pas tenir le compteur, et l'ouvrir reviendrait a ouvrir
 * `formations` a tout le monde. Le `list` reste ferme parce qu'il livrerait les adresses de
 * toute la liste ; l'identifiant determinist rend le `get` suffisant.
 */
describe('waitlist — le client lit son entree, il n en ecrit aucune', () => {
  const ENTREE = (uid: string) => ({
    userId: uid,
    formationId: 'f1',
    email: `${uid}@exemple.test`,
    language: 'fr',
    createdAt: '2026-09-03T10:00:00.000Z',
  });

  it('refuse toute ecriture client, meme conforme et pour soi-meme', async () => {
    await assertFails(setDoc(doc(asUser(ALICE), 'waitlist', `${ALICE}_f1`), ENTREE(ALICE)));
  });

  it('refuse la modification d une entree existante', async () => {
    await seed(`waitlist/${ALICE}_f1`, ENTREE(ALICE));
    await assertFails(updateDoc(doc(asUser(ALICE), 'waitlist', `${ALICE}_f1`), { notifiedAt: 'x' }));
  });

  it('laisse chacun verifier s il est deja inscrit', async () => {
    await seed(`waitlist/${ALICE}_f1`, ENTREE(ALICE));
    await assertSucceeds(getDoc(doc(asUser(ALICE), 'waitlist', `${ALICE}_f1`)));
  });

  it("refuse la lecture de l entree de quelqu un d autre", async () => {
    await seed(`waitlist/${ALICE}_f1`, ENTREE(ALICE));
    await assertFails(getDoc(doc(asUser(BOB), 'waitlist', `${ALICE}_f1`)));
  });

  it('refuse le list a un compte ordinaire — il livrerait toutes les adresses', async () => {
    await seed(`waitlist/${ALICE}_f1`, ENTREE(ALICE));
    await seed(`waitlist/${BOB}_f1`, ENTREE(BOB));
    await assertFails(getDocs(query(
      collection(asUser(ALICE), 'waitlist'),
      where('formationId', '==', 'f1'),
    )));
  });

  it("l administration liste les inscrits d une formation", async () => {
    await seed(`users/${CAROL}`, { uid: CAROL, role: 'admin' });
    await seed(`waitlist/${ALICE}_f1`, ENTREE(ALICE));
    await assertSucceeds(getDocs(query(
      collection(asUser(CAROL), 'waitlist'),
      where('formationId', '==', 'f1'),
    )));
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * AUDIT DE SECURITE DU 03/09/2026 — les cas qui suivent couvrent les regles durcies ce
 * jour-la. Chaque bloc dit d'abord ce qui etait ouvert, puis verifie que le parcours
 * legitime tient toujours : un durcissement qui casse le produit se remarque ici, pas en
 * production.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/*
 * `coupons` — la regle disait « everyone can read active coupons to validate them ».
 * Personne ne les validait cote client : `validateCoupon` (aujourd'hui dans
 * `worker/apps/api/src/lib/checkout.ts`, alors dans les Cloud Functions) les relit par un
 * compte de service, qui contourne ces regles. Ce que la lecture ouverte offrait vraiment,
 * c'etait le catalogue des reductions en cours a qui savait ecrire `where('active','==',true)`.
 */
describe('coupons — les codes promo ne sont plus servis au public', () => {
  const COUPON = { code: 'BLACKFRIDAY', type: 'percentage', value: 40, active: true, createdAt: '2026-01-01' };

  it('un visiteur anonyme ne peut plus moissonner les codes actifs', async () => {
    await seed('coupons/c1', COUPON);
    await assertFails(getDocs(query(
      collection(testEnv.unauthenticatedContext().firestore(), 'coupons'),
      where('active', '==', true),
    )));
  });

  it('un compte connecte ordinaire non plus', async () => {
    await seed('coupons/c1', COUPON);
    await assertFails(getDocs(query(
      collection(asUser(ALICE), 'coupons'),
      where('active', '==', true),
    )));
  });

  it('et le get direct d un code devine reste ferme', async () => {
    await seed('coupons/c1', COUPON);
    await assertFails(getDoc(doc(asUser(ALICE), 'coupons', 'c1')));
  });

  it('NON-REGRESSION : la console administre toujours les coupons', async () => {
    await seed(`users/${CAROL}`, { uid: CAROL, role: 'admin' });
    await seed('coupons/c1', COUPON);
    await assertSucceeds(getDoc(doc(asUser(CAROL), 'coupons', 'c1')));
  });
});

/*
 * `users` — l'ancienne regle ne verrouillait que `role` et `uid`. Tout le reste du document
 * etait libre, y compris des champs que le SERVEUR relit comme des gardes.
 */
describe('users — le proprietaire n ecrit que les champs de son profil', () => {
  const PROFIL = (extra: Record<string, unknown> = {}) => ({
    uid: ALICE, email: 'alice@exemple.test', displayName: 'Alice',
    role: 'student', createdAt: '2026-01-01', ...extra,
  });

  it("`referralRewarded` est hors d'atteinte — c'est la seule garde anti-double-recompense", async () => {
    // `onReferralConversion` s'arrete sur ce drapeau. Le reposer a `false` rouvrirait la
    // porte que le serveur croit fermee.
    await seed(`users/${ALICE}`, PROFIL({ referredByCode: 'BOB123', referralRewarded: true }));
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { referralRewarded: false }));
  });

  it('ni `email` ni `createdAt` ne se reecrivent depuis le client', async () => {
    await seed(`users/${ALICE}`, PROFIL());
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { email: 'autre@exemple.test' }));
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { createdAt: '2020-01-01' }));
  });

  it('un champ inconnu ne se glisse pas dans le document', async () => {
    await seed(`users/${ALICE}`, PROFIL());
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { isPremium: true }));
  });

  it("on ne recopie pas le code de parrainage d un tiers pour capter ses filleuls", async () => {
    // La recompense part a `where('referralCode','==',code).limit(1)` : deux porteurs du
    // meme code, et c'est le premier document rendu qui encaisse.
    await seed(`users/${ALICE}`, PROFIL({ referralCode: 'ALI777' }));
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { referralCode: 'BOB123' }));
  });

  it('on ne change pas de parrain apres coup', async () => {
    await seed(`users/${ALICE}`, PROFIL({ referredByCode: 'BOB123' }));
    await assertFails(updateDoc(doc(asUser(ALICE), 'users', ALICE), { referredByCode: 'CAR456' }));
  });

  it('NON-REGRESSION : poser son code de parrainage la premiere fois reste permis', async () => {
    // `getOrCreateReferralCode()` n'ecrit que si le champ est absent — la regle dit pareil.
    await seed(`users/${ALICE}`, PROFIL());
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'users', ALICE), { referralCode: 'ALI777' }));
  });

  it("NON-REGRESSION : accepter un parrainage a l inscription reste permis", async () => {
    await seed(`users/${ALICE}`, PROFIL());
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'users', ALICE), { referredByCode: 'BOB123' }));
  });

  it('NON-REGRESSION : le profil complet reste editable par son proprietaire', async () => {
    await seed(`users/${ALICE}`, PROFIL());
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'users', ALICE), {
      displayName: 'Alice N.', firstName: 'Alice', lastName: 'Ndiaye', bio: 'Bonjour',
      phone: '+221770000000', city: 'Dakar', tutorName: 'Coach', onboardingCompleted: true,
      preferences: { theme: 'dark', language: 'fr', newsletter: true, aiMemoryConsent: true },
    }));
  });

  it("NON-REGRESSION : l inscription ecrit toujours le document initial", async () => {
    await assertSucceeds(setDoc(doc(asUser(BOB), 'users', BOB), {
      uid: BOB, email: 'bob@exemple.test', displayName: 'Bob',
      role: 'student', createdAt: '2026-09-03',
      preferences: { theme: 'system', language: 'fr', newsletter: false, aiMemoryConsent: true },
    }));
  });

  it("NON-REGRESSION : l administration garde la main sur le document entier", async () => {
    await seed(`users/${CAROL}`, { uid: CAROL, role: 'admin' });
    await seed(`users/${ALICE}`, PROFIL());
    await assertSucceeds(updateDoc(doc(asUser(CAROL), 'users', ALICE), { role: 'support' }));
  });
});

/*
 * `club_posts` / `club_infos` — `likes` et `reposts` sont des TABLEAUX d'identifiants
 * (`arrayUnion` / `arrayRemove`), pas des compteurs. `hasOnly(['likes'])` disait quel champ
 * bougeait, jamais comment : le tableau entier passait, dans les deux sens.
 */
describe('club — un like est une bascule, et seulement sur son propre nom', () => {
  const MEMBRE = (uid: string) => seed(`club_subscriptions/${uid}`, { status: 'active' });
  const POST = (extra: Record<string, unknown> = {}) => ({
    userId: BOB, content: 'Bonjour le Club', likes: [] as string[], reposts: [] as string[],
    commentsCount: 0, createdAt: '2026-09-01', ...extra,
  });

  it('NON-REGRESSION : un membre aime un post', async () => {
    await MEMBRE(ALICE);
    await seed('club_posts/p1', POST());
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'club_posts', 'p1'), { likes: [ALICE] }));
  });

  it('NON-REGRESSION : et retire son like', async () => {
    await MEMBRE(ALICE);
    await seed('club_posts/p1', POST({ likes: [ALICE, CAROL] }));
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'club_posts', 'p1'), { likes: [CAROL] }));
  });

  it('mais il ne peut pas aimer AU NOM de quelqu un d autre', async () => {
    await MEMBRE(ALICE);
    await seed('club_posts/p1', POST());
    await assertFails(updateDoc(doc(asUser(ALICE), 'club_posts', 'p1'), { likes: [CAROL] }));
  });

  it('ni effacer les likes d un post qui le derange', async () => {
    await MEMBRE(ALICE);
    await seed('club_posts/p1', POST({ likes: [BOB, CAROL] }));
    await assertFails(updateDoc(doc(asUser(ALICE), 'club_posts', 'p1'), { likes: [] }));
  });

  it('ni s en inventer mille d un coup', async () => {
    await MEMBRE(ALICE);
    await seed('club_posts/p1', POST());
    const faux = Array.from({ length: 1000 }, (_, i) => `fantome-${i}`);
    await assertFails(updateDoc(doc(asUser(ALICE), 'club_posts', 'p1'), { likes: faux }));
  });

  it("l auteur du post ne gonfle pas ses propres compteurs", async () => {
    // Il en avait le droit : la premiere branche lui ouvrait le document entier.
    await MEMBRE(BOB);
    await seed('club_posts/p1', POST());
    await assertFails(updateDoc(doc(asUser(BOB), 'club_posts', 'p1'), { likes: [ALICE, CAROL] }));
  });

  it("et il ne transfere pas la propriete de son post — `userId` porte le droit de suppression", async () => {
    await MEMBRE(BOB);
    await seed('club_posts/p1', POST());
    await assertFails(updateDoc(doc(asUser(BOB), 'club_posts', 'p1'), { userId: ALICE }));
  });

  it('NON-REGRESSION : l auteur corrige toujours le texte de son post', async () => {
    await MEMBRE(BOB);
    await seed('club_posts/p1', POST());
    await assertSucceeds(updateDoc(doc(asUser(BOB), 'club_posts', 'p1'), { content: 'Corrige' }));
  });

  it('NON-REGRESSION : le compteur de commentaires bouge toujours de un', async () => {
    await MEMBRE(ALICE);
    await seed('club_posts/p1', POST());
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'club_posts', 'p1'), { commentsCount: 1 }));
  });

  it('un compteur de commentaires ne saute pas a une valeur inventee', async () => {
    await MEMBRE(ALICE);
    await seed('club_posts/p1', POST());
    await assertFails(updateDoc(doc(asUser(ALICE), 'club_posts', 'p1'), { commentsCount: 500 }));
  });

  it('les infos exclusives se likent aux memes conditions', async () => {
    await MEMBRE(ALICE);
    await seed('club_infos/i1', { title: 'Info', likes: [BOB], createdAt: '2026-09-01' });
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'club_infos', 'i1'), { likes: [BOB, ALICE] }));
    await assertFails(updateDoc(doc(asUser(ALICE), 'club_infos', 'i1'), { likes: [] }));
  });
});

/*
 * `notifications/{uid}/items` — « mark as read » ouvrait le document entier, donc le titre,
 * le lien et la date de ce que le serveur avait envoye.
 */
describe('notifications — on marque comme lue, on ne reecrit pas le message', () => {
  const NOTIF = { title: 'Ta formation t attend', link: '/mes-formations', read: false, createdAt: '2026-09-01' };

  it('NON-REGRESSION : marquer comme lue reste permis', async () => {
    await seed(`notifications/${ALICE}/items/n1`, NOTIF);
    await assertSucceeds(updateDoc(doc(asUser(ALICE), `notifications/${ALICE}/items`, 'n1'), { read: true }));
  });

  it('mais on ne reecrit pas le contenu recu', async () => {
    await seed(`notifications/${ALICE}/items/n1`, NOTIF);
    await assertFails(updateDoc(doc(asUser(ALICE), `notifications/${ALICE}/items`, 'n1'), {
      title: 'Autre chose', link: 'https://ailleurs.test',
    }));
  });
});

/*
 * `appointments` — le formulaire est public. Il l'etait sans plafond de champs, contrairement
 * a `engagement_leads` et `agency_leads` qui bornent deja le bourrage de document.
 */
describe('appointments — formulaire public borne', () => {
  const RDV = (extra: Record<string, unknown> = {}) => ({
    name: 'Awa Ndiaye', email: 'awa@exemple.test', date: '2026-09-20',
    type: 'decouverte', status: 'pending', ...extra,
  });

  it('NON-REGRESSION : un visiteur anonyme prend toujours rendez-vous', async () => {
    await assertSucceeds(setDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'appointments', 'a1'), RDV(),
    ));
  });

  it('refuse le bourrage de document par un robot', async () => {
    const bourrage: Record<string, unknown> = RDV();
    for (let i = 0; i < 30; i++) bourrage[`champ${i}`] = 'x';
    await assertFails(setDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'appointments', 'a2'), bourrage,
    ));
  });

  it('un visiteur ne se declare pas confirme', async () => {
    await assertFails(setDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'appointments', 'a3'),
      RDV({ status: 'confirmed' }),
    ));
  });

  /*
   * Audit du 03/09/2026 — ce document DICTE UN ENVOI D'E-MAIL.
   *
   * `acknowledgeAppointment` le relit et envoie un courrier signe SPF/DKIM a l'adresse
   * qu'il porte, en y recopiant `name`, `date`, `time` et `subject`. La creation etant
   * publique — et elle doit le rester —, ces regles sont le SEUL endroit ou se decide ce
   * qui peut entrer dans un courrier sortant. Les quatre cas ci-dessous sont les quatre
   * trous par lesquels un attaquant fabriquait un hameconnage credible.
   */
  it('NON-REGRESSION : le formulaire complet passe toujours', async () => {
    await assertSucceeds(setDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'appointments', 'a4'),
      RDV({
        phone: '+221770000000', time: '18:30', subject: 'Audit de presence digitale',
        message: 'Bonjour, je souhaite un premier echange.',
        createdAt: new Date().toISOString(),
      }),
    ));
  });

  it("refuse une adresse qui n'en est pas une", async () => {
    // L'ancienne regle ne verifiait que la LONGUEUR : « aaaaa » etait une adresse valide.
    await assertFails(setDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'appointments', 'a5'),
      RDV({ email: 'aaaaa' }),
    ));
  });

  it('refuse un objet trop long pour tenir dans un intitule', async () => {
    // `subject` n'apparaissait dans AUCUNE contrainte, et il finit dans le corps du mail.
    await assertFails(setDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'appointments', 'a6'),
      RDV({ subject: 'x'.repeat(400) }),
    ));
  });

  it('refuse un champ hors de la liste, meme peu nombreux', async () => {
    // Le plafond `keys().size() <= 12` bornait le NOMBRE de champs, jamais lesquels.
    await assertFails(setDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'appointments', 'a7'),
      RDV({ acknowledgedAt: '2026-01-01T00:00:00.000Z' }),
    ));
  });
});

/*
 * `users` — la creation etait la moitie non gardee d'une porte dont la mise a jour, elle,
 * avait recu une liste blanche exacte. Un profil se cree une fois par compte : il suffisait
 * de s'inscrire pour poser n'importe quel champ, y compris ceux que le SERVEUR relit comme
 * des gardes.
 *
 * L'abus concret, verifie contre `worker/apps/api/src/lib/referral.ts` : la recompense de
 * parrainage cherchait le parrain par `where('referralCode','==',code)` avec `limit: 1`, une
 * requete sans `orderBy` que Firestore resout par `__name__` croissant. Poser a l'inscription
 * le code d'un tiers, avec un UID qui trie plus bas, detournait toutes ses conversions
 * futures. Le Worker refuse desormais d'arbitrer un code ambigu ; cette regle-ci empeche
 * l'ambiguite d'exister.
 */
describe('users — la creation est bornee comme la mise a jour', () => {
  const PROFIL = (extra: Record<string, unknown> = {}) => ({
    uid: ALICE, email: 'alice@exemple.test', displayName: 'Alice', role: 'student',
    createdAt: new Date().toISOString(),
    preferences: { theme: 'system', language: 'fr', newsletter: false },
    ...extra,
  });

  it("NON-REGRESSION : l'inscription normale cree toujours le profil", async () => {
    // Miroir exact de ce que pose AuthContext.tsx a l'inscription par e-mail.
    await assertSucceeds(setDoc(doc(asUser(ALICE), 'users', ALICE), PROFIL()));
  });

  it('NON-REGRESSION : le profil Google passe aussi', async () => {
    await assertSucceeds(setDoc(
      doc(asUser(ALICE), 'users', ALICE),
      PROFIL({ photoURL: 'https://exemple.test/a.png' }),
    ));
  });

  it("refuse de poser un code de parrainage a l'inscription", async () => {
    await assertFails(setDoc(
      doc(asUser(ALICE), 'users', ALICE),
      PROFIL({ referralCode: 'CODEVOLE' }),
    ));
  });

  it("refuse de poser la garde anti-double-recompense a l'inscription", async () => {
    await assertFails(setDoc(
      doc(asUser(ALICE), 'users', ALICE),
      PROFIL({ referralRewarded: false }),
    ));
  });

  it('refuse tout champ hors de la liste', async () => {
    await assertFails(setDoc(
      doc(asUser(ALICE), 'users', ALICE),
      PROFIL({ xp: 100000 }),
    ));
  });

  it("NON-REGRESSION : le role reste verrouille a 'student'", async () => {
    await assertFails(setDoc(
      doc(asUser(ALICE), 'users', ALICE),
      PROFIL({ role: 'admin' }),
    ));
  });
});

/*
 * `videos` — le compteur de vues etait incrementable sur un brouillon, ce qui revient a
 * confirmer son existence. `blog` posait deja la condition ; ici elle manquait.
 */
describe('videos — le compteur de vues ne parle que des videos publiees', () => {
  it('NON-REGRESSION : une vue sur une video publiee compte toujours', async () => {
    await seed('videos/v1', { title: 'V', status: 'published', views: 10 });
    await assertSucceeds(updateDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'videos', 'v1'), { views: 11 },
    ));
  });

  it('un brouillon ne voit pas son compteur monter', async () => {
    await seed('videos/v2', { title: 'V', status: 'draft', views: 0 });
    await assertFails(updateDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'videos', 'v2'), { views: 1 },
    ));
  });

  it('et la vue reste un increment de un, pas une valeur choisie', async () => {
    await seed('videos/v3', { title: 'V', status: 'published', views: 10 });
    await assertFails(updateDoc(
      doc(testEnv.unauthenticatedContext().firestore(), 'videos', 'v3'), { views: 99999 },
    ));
  });
});

/*
 * `gamification` — les bornes ne portaient que sur cinq champs ; rien n'empechait d'en poser
 * un sixieme dans un document que le serveur relit pour le classement et les badges.
 */
describe('gamification — la forme du document est fermee', () => {
  it('un champ inconnu ne se glisse pas dans le profil', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100));
    await assertFails(updateDoc(doc(asUser(ALICE), 'gamification', ALICE), { rangSecret: 1 }));
  });

  it('NON-REGRESSION : un increment legitime passe toujours', async () => {
    await seed(`gamification/${ALICE}`, GAMI(100));
    await assertSucceeds(updateDoc(doc(asUser(ALICE), 'gamification', ALICE), { xp: 150, level: 2 }));
  });
});
