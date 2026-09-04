import { describe, expect, it } from 'vitest';

import {
  FENETRE_RENOUVELLEMENT_JOURS,
  PENDING_PERIME_MINUTES,
  choisirAbonnementCourant,
  deciderRenouvellement,
  echeanceApres,
  type AbonnementLu,
} from '../src/lib/rysmo-subscription';

/**
 * Ce module décide de deux choses qui coûtent de l'argent quand elles sont fausses : à qui on
 * accorde un quota, et à partir de quand court un mois payé. Les cas ci-dessous sont ceux qui
 * n'existaient pas avant le renouvellement anticipé — donc ceux que rien ne couvrait.
 */

const MAINTENANT = new Date('2026-09-04T12:00:00.000Z');

/** Une échéance à N jours de `MAINTENANT`. Négatif = déjà passée. */
function dans(jours: number): string {
  const d = new Date(MAINTENANT);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString();
}

/** Un instant situé N minutes avant `MAINTENANT`. */
function minutesAvant(minutes: number): string {
  return new Date(MAINTENANT.getTime() - minutes * 60_000).toISOString();
}

function abo(data: Record<string, unknown>, id = 'a'): AbonnementLu {
  return { path: `rysmoSubscriptions/${id}`, data };
}

describe('choisirAbonnementCourant', () => {
  it('ne retient rien quand il n’y a rien', () => {
    expect(choisirAbonnementCourant([], MAINTENANT)).toBeNull();
  });

  it('ignore ce qui n’est pas actif', () => {
    const docs = [
      abo({ status: 'pending', expiresAt: dans(30) }, 'p'),
      abo({ status: 'cancelled', expiresAt: dans(30) }, 'c'),
      abo({ status: 'expired', expiresAt: dans(30) }, 'e'),
    ];
    expect(choisirAbonnementCourant(docs, MAINTENANT)).toBeNull();
  });

  it('ignore un actif dont le terme est passé', () => {
    expect(choisirAbonnementCourant([abo({ status: 'active', expiresAt: dans(-1) })], MAINTENANT)).toBeNull();
  });

  /*
   * LE CAS QUI MOTIVE TOUT LE MODULE. Pendant les cinq derniers jours d'un mois renouvelé,
   * deux documents sont `active`. `limit: 1` sans `orderBy` en rendait un au hasard, et si
   * c'était l'ancien fraîchement expiré, la personne perdait le quota qu'elle venait de payer.
   */
  it('retient le terme le plus lointain quand deux abonnements se chevauchent', () => {
    const ancien = abo({ status: 'active', expiresAt: dans(2) }, 'ancien');
    const nouveau = abo({ status: 'active', expiresAt: dans(32) }, 'nouveau');
    expect(choisirAbonnementCourant([ancien, nouveau], MAINTENANT)?.path).toBe('rysmoSubscriptions/nouveau');
    // L'ordre de la requête n'est pas garanti : le résultat ne doit pas en dépendre.
    expect(choisirAbonnementCourant([nouveau, ancien], MAINTENANT)?.path).toBe('rysmoSubscriptions/nouveau');
  });

  it('retient le vivant quand l’ancien vient d’expirer', () => {
    const mort = abo({ status: 'active', expiresAt: dans(-1) }, 'mort');
    const vivant = abo({ status: 'active', expiresAt: dans(27) }, 'vivant');
    expect(choisirAbonnementCourant([mort, vivant], MAINTENANT)?.path).toBe('rysmoSubscriptions/vivant');
  });

  /* Même lecture que le garde historique : sans terme, l'abonnement est réputé valide. */
  it('un actif sans terme l’emporte', () => {
    const sansTerme = abo({ status: 'active' }, 'sansTerme');
    const borne = abo({ status: 'active', expiresAt: dans(30) }, 'borne');
    expect(choisirAbonnementCourant([sansTerme, borne], MAINTENANT)?.path).toBe('rysmoSubscriptions/sansTerme');
  });
});

describe('deciderRenouvellement', () => {
  it('autorise quand la personne n’a jamais souscrit, et part de maintenant', () => {
    const d = deciderRenouvellement([], MAINTENANT);
    expect(d.autorise).toBe(true);
    if (d.autorise) expect(d.depart).toEqual(MAINTENANT);
  });

  it('refuse tant que le terme est hors fenêtre', () => {
    const d = deciderRenouvellement([abo({ status: 'active', expiresAt: dans(FENETRE_RENOUVELLEMENT_JOURS + 1) })], MAINTENANT);
    expect(d.autorise).toBe(false);
    if (!d.autorise) expect(d.motif).toBe('actif');
  });

  it('autorise au premier jour de la fenêtre, et chaîne sur le terme', () => {
    const terme = dans(FENETRE_RENOUVELLEMENT_JOURS);
    const d = deciderRenouvellement([abo({ status: 'active', expiresAt: terme })], MAINTENANT);
    expect(d.autorise).toBe(true);
    if (d.autorise) expect(d.depart.toISOString()).toBe(terme);
  });

  it('autorise la veille du terme, et chaîne encore', () => {
    const terme = dans(1);
    const d = deciderRenouvellement([abo({ status: 'active', expiresAt: terme })], MAINTENANT);
    expect(d.autorise).toBe(true);
    if (d.autorise) expect(d.depart.toISOString()).toBe(terme);
  });

  /*
   * Un terme dépassé ne se chaîne PAS : offrir un mois qui démarre dans le passé reviendrait
   * à vendre des jours déjà consommés.
   */
  it('repart de maintenant quand le terme est déjà passé', () => {
    const d = deciderRenouvellement([abo({ status: 'active', expiresAt: dans(-3) })], MAINTENANT);
    expect(d.autorise).toBe(true);
    if (d.autorise) expect(d.depart).toEqual(MAINTENANT);
  });

  it('refuse un actif sans terme, qu’il n’y a pas lieu de renouveler', () => {
    const d = deciderRenouvellement([abo({ status: 'active' })], MAINTENANT);
    expect(d.autorise).toBe(false);
    if (!d.autorise) expect(d.motif).toBe('actif');
  });

  /* La garde que le Club avait et que Rysmo n'avait pas : deux liens de paiement ouverts sur
     la même échéance sont deux débits possibles pour un seul mois. */
  it('refuse tant qu’un paiement est en attente', () => {
    const d = deciderRenouvellement([abo({ status: 'pending', expiresAt: dans(30) })], MAINTENANT);
    expect(d.autorise).toBe(false);
    if (!d.autorise) expect(d.motif).toBe('enAttente');
  });

  it('le paiement en attente l’emporte sur un terme dans la fenêtre', () => {
    const docs = [
      abo({ status: 'active', expiresAt: dans(2) }, 'actif'),
      abo({ status: 'pending', expiresAt: dans(32) }, 'attente'),
    ];
    const d = deciderRenouvellement(docs, MAINTENANT);
    expect(d.autorise).toBe(false);
    if (!d.autorise) expect(d.motif).toBe('enAttente');
  });

  /*
   * ── LA PÉREMPTION DE L'ATTENTE ───────────────────────────────────────────────────────
   * Sans elle, la garde `pending` est un piège : le document est écrit AVANT que la personne
   * n'arrive sur la page de paiement, et un onglet fermé sans payer l'empêcherait de
   * s'abonner à vie. Bictorys ne notifie pas un abandon.
   */
  it('un paiement en attente frais bloque', () => {
    const frais = minutesAvant(PENDING_PERIME_MINUTES - 1);
    const d = deciderRenouvellement([abo({ status: 'pending', createdAt: frais })], MAINTENANT);
    expect(d.autorise).toBe(false);
  });

  it('un paiement en attente périmé ne bloque plus', () => {
    const vieux = minutesAvant(PENDING_PERIME_MINUTES + 1);
    const d = deciderRenouvellement([abo({ status: 'pending', createdAt: vieux })], MAINTENANT);
    expect(d.autorise).toBe(true);
  });

  /*
   * ⚠️ LE PIÈGE QUE LE CHAÎNAGE INTRODUIT. Sur un renouvellement anticipé, `startedAt` est
   * dans le FUTUR — dater le document avec lui rendrait tout `pending` éternellement frais.
   * `createdAt` doit donc l'emporter.
   */
  it('date l’attente sur createdAt, jamais sur un startedAt futur', () => {
    const docs = [
      abo({ status: 'pending', createdAt: minutesAvant(PENDING_PERIME_MINUTES + 1), startedAt: dans(3) }),
    ];
    expect(deciderRenouvellement(docs, MAINTENANT).autorise).toBe(true);
  });

  /* Les documents antérieurs au champ n'ont que `startedAt`, qui valait alors la création. */
  it('retombe sur startedAt pour les documents antérieurs à createdAt', () => {
    const vieux = minutesAvant(PENDING_PERIME_MINUTES + 1);
    expect(deciderRenouvellement([abo({ status: 'pending', startedAt: vieux })], MAINTENANT).autorise).toBe(true);
    const frais = minutesAvant(PENDING_PERIME_MINUTES - 1);
    expect(deciderRenouvellement([abo({ status: 'pending', startedAt: frais })], MAINTENANT).autorise).toBe(false);
  });

  it('sans aucune date, l’attente bloque — c’est le côté sûr', () => {
    expect(deciderRenouvellement([abo({ status: 'pending' })], MAINTENANT).autorise).toBe(false);
  });
});

describe('echeanceApres', () => {
  it('ajoute un mois calendaire', () => {
    expect(echeanceApres(new Date('2026-09-04T12:00:00.000Z')).toISOString()).toBe('2026-10-04T12:00:00.000Z');
  });

  /*
   * `setMonth` reporte sur le mois suivant quand le quantième n'existe pas — le 31 janvier
   * donne le 3 mars. C'est le comportement d'origine de `createRysmoSubscriptionCharge`, et
   * on le fige ici pour qu'un changement soit une décision plutôt qu'un accident.
   */
  it('reporte quand le quantième n’existe pas au mois suivant', () => {
    expect(echeanceApres(new Date('2026-01-31T00:00:00.000Z')).toISOString()).toBe('2026-03-03T00:00:00.000Z');
  });

  it('chaîne sans perdre de jour sur un renouvellement anticipé', () => {
    // Terme le 10, reprise le 5 : le nouveau mois court du 10 au 10, pas du 5 au 5.
    const terme = new Date('2026-09-10T00:00:00.000Z');
    expect(echeanceApres(terme).toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });
});
