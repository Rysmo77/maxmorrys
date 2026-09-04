import { toDate } from './values';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA FENÊTRE DE RENOUVELLEMENT DE RYSMO+ — logique pure, deux lecteurs.
 *
 * ── LE DÉFAUT QUE CE MODULE EXISTE POUR FERMER ─────────────────────────────────
 *
 * Rysmo+ est un abonnement MENSUEL sur des rails de paiement qui ne prélèvent pas
 * (voir `renewal.ts` pour le pourquoi : ni Bictorys, ni Wave n'offrent de mandat).
 * Il ne recevait par ailleurs AUCUN rappel d'échéance — le cron ne balayait que
 * `club_subscriptions`. Un abonnement mensuel sans prélèvement et sans rappel meurt
 * au trentième jour, en silence, et c'est ce qui se passait.
 *
 * Mais poser le rappel seul aurait produit pire que rien : un courrier qui mène à une
 * porte fermée. `createRysmoSubscriptionCharge` REFUSAIT tant qu'un abonnement actif
 * non expiré existait, et l'écran de vente désactive son bouton sur le même critère.
 * Prévenir quelqu'un cinq jours avant en l'envoyant sur un bouton mort, c'est
 * transformer une échéance oubliée en échéance frustrée.
 *
 * D'où ce module : la fenêtre pendant laquelle on PEUT reprendre son abonnement, et
 * elle est exactement celle pendant laquelle on est PRÉVENU.
 *
 * ── UN SEUL NOMBRE, ET C'EST DÉLIBÉRÉ ─────────────────────────────────────────
 *
 * `rysmo-renewal.ts` importe `FENETRE_RENOUVELLEMENT_JOURS` comme préavis au lieu de
 * déclarer le sien. Deux constantes « qu'il faut garder égales » auraient divergé au
 * premier ajustement, et la divergence aurait été invisible : le courrier serait parti
 * un jour où le bouton refusait encore, ou l'inverse. Le seul rapport honnête entre
 * ces deux dates est l'identité, donc il n'y a qu'un nombre.
 *
 * ── POURQUOI CINQ JOURS, ET PAS QUINZE ────────────────────────────────────────
 *
 * Les quinze jours de `PREAVIS_JOURS` sont écrits pour l'ANNUEL : ils viennent de
 * l'article 5 des CGV, qui parle du Club. Quinze jours sur un cycle de trente, c'est
 * la moitié du terme — le message se lirait comme une relance commerciale au milieu
 * d'un mois déjà payé, et la date serait oubliée quand elle arriverait.
 *
 * Cinq jours couvrent un week-end plus deux jours ouvrés, ce qu'un paiement Wave fait
 * à la main demande réellement. C'est un sixième du terme, la même proportion que
 * quinze jours sur trois mois.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Nombre de jours avant l'échéance où le renouvellement s'ouvre — et où le rappel part.
 *
 * ⚠️ Changer ce nombre déplace LES DEUX. C'est le but ; ne pas le contourner en
 * introduisant une seconde constante.
 */
export const FENETRE_RENOUVELLEMENT_JOURS = 5;

/**
 * Au-delà, un paiement resté « en attente » ne bloque plus rien.
 *
 * ⚠️ SANS CETTE PÉREMPTION, LA GARDE `pending` EST UN PIÈGE. Le document est écrit AVANT que
 * la personne n'arrive sur la page de paiement ; si elle ferme l'onglet sans payer, rien ne
 * repasse derrière — Bictorys ne notifie pas un abandon, seulement un échec. Le document
 * resterait `pending` pour toujours, et la personne serait définitivement empêchée de
 * s'abonner, sans message qui l'explique.
 *
 * `club_subscriptions` porte exactement le même défaut aujourd'hui (`payments.ts:157`).
 * Sur un abonnement annuel il se manifeste une fois par an ; sur un mensuel, douze fois plus
 * — c'est pour ça qu'il se corrige ici et pas là-bas, et c'est à reporter sur le Club.
 *
 * Une heure : largement au-delà d'un paiement Wave ou Orange Money mené à son terme, et bien
 * en deçà du délai où quelqu'un revient essayer.
 */
export const PENDING_PERIME_MINUTES = 60;

/** Ce que ce module a besoin de savoir d'un abonnement. Volontairement minimal. */
export interface AbonnementLu {
  path: string;
  data: Record<string, unknown>;
}

/**
 * L'abonnement qui fait foi aujourd'hui, parmi ceux d'une même personne.
 *
 * ⚠️ CE N'EST PAS UN DÉTAIL DE CONFORT, C'EST UN CORRECTIF. `getActiveRysmoSubscription`
 * requêtait avec `limit: 1` sur `userId == … && status == 'active'`. Tant qu'il n'existait
 * qu'un seul abonnement à la fois, la question ne se posait pas. Dès qu'on autorise le
 * renouvellement anticipé, DEUX documents sont `active` en même temps pendant cinq jours —
 * l'ancien qui court encore et le nouveau qui prend la suite — et Firestore n'ordonne pas
 * une requête sans `orderBy` : `limit: 1` en rendait un AU HASARD.
 *
 * Une fois sur deux, c'était l'ancien. Et si l'ancien venait d'expirer, la fonction rendait
 * `null` : la personne perdait son quota le lendemain du jour où elle avait payé pour le
 * garder. Le défaut n'aurait été visible que d'elle.
 *
 * On retient donc l'échéance la PLUS LOINTAINE encore valide — celle qui décrit réellement
 * le droit ouvert.
 */
export function choisirAbonnementCourant(
  abonnements: AbonnementLu[],
  maintenant: Date,
): AbonnementLu | null {
  let retenu: AbonnementLu | null = null;
  let borne = -Infinity;

  for (const abonnement of abonnements) {
    if (abonnement.data.status !== 'active') continue;

    const fin = toDate(abonnement.data.expiresAt);
    /*
     * Sans date d'expiration, l'abonnement est réputé valide — même lecture que le garde
     * historique de `createRysmoSubscriptionCharge`. Il l'emporte sur tout le reste, parce
     * qu'un droit sans terme ne peut pas être dépassé par un droit qui en a un.
     */
    if (!fin) return abonnement;
    if (fin <= maintenant) continue;

    if (fin.getTime() > borne) {
      borne = fin.getTime();
      retenu = abonnement;
    }
  }

  return retenu;
}

/**
 * Ce paiement en attente est-il assez vieux pour être oublié ?
 *
 * ⚠️ `createdAt` D'ABORD, `startedAt` EN REPLI — et l'ordre compte. Depuis le chaînage,
 * `startedAt` porte la date d'OUVERTURE DU DROIT, qui est dans le futur sur un renouvellement
 * anticipé : s'en servir pour dater le document rendrait tout `pending` éternellement frais.
 * `createdAt` est écrit à la création et ne bouge pas. Les documents antérieurs à ce champ
 * n'ont que `startedAt`, qui valait alors l'instant de création — le repli est donc juste
 * pour eux, et pour eux seulement.
 */
function attentePerimee(abonnement: AbonnementLu, maintenant: Date): boolean {
  const ne = toDate(abonnement.data.createdAt) ?? toDate(abonnement.data.startedAt);
  // Sans date du tout, on ne peut pas dire qu'il est périmé — il bloque, et c'est le côté sûr.
  if (!ne) return false;
  return maintenant.getTime() - ne.getTime() > PENDING_PERIME_MINUTES * 60_000;
}

/** Nombre de jours calendaires UTC entre deux instants. Même unité que `estAEcheance`. */
function ecartEnJours(fin: Date, maintenant: Date): number {
  const jour = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((jour(fin) - jour(maintenant)) / 86_400_000);
}

/**
 * Peut-on souscrire, et à partir de quand le nouveau mois court-il ?
 *
 * `depart` porte tout le sens de ce module : c'est l'échéance de l'abonnement en cours, pas
 * l'instant de l'achat. **Renouveler cinq jours à l'avance ne doit pas coûter cinq jours.**
 * Sans ce chaînage, le rappel serait une invitation à se faire amputer d'un sixième de mois,
 * et la personne aurait raison d'attendre le dernier jour — donc de rater l'échéance, donc
 * de subir exactement ce que le rappel existe pour éviter.
 */
export type DecisionRenouvellement =
  | { autorise: true; depart: Date }
  | { autorise: false; motif: 'actif' | 'enAttente'; expiresAt: string | null };

export function deciderRenouvellement(
  abonnements: AbonnementLu[],
  maintenant: Date,
): DecisionRenouvellement {
  /*
   * ⚠️ LA GARDE `pending` MANQUAIT, ET C'EST UN DÉFAUT PRÉEXISTANT.
   *
   * `createClubCharge` refuse une seconde souscription tant qu'une première est en attente
   * de paiement ; Rysmo n'avait pas l'équivalent. On pouvait donc empiler N documents
   * `pending` en cliquant N fois, dont chacun deviendrait `active` si son paiement aboutit.
   * Le renouvellement anticipé rend ce défaut visible : deux liens de paiement ouverts sur
   * la même échéance sont deux débits possibles pour un seul mois.
   */
  const enAttente = abonnements.find(
    (a) => a.data.status === 'pending' && !attentePerimee(a, maintenant),
  );
  if (enAttente) {
    return {
      autorise: false,
      motif: 'enAttente',
      expiresAt: typeof enAttente.data.expiresAt === 'string' ? enAttente.data.expiresAt : null,
    };
  }

  const courant = choisirAbonnementCourant(abonnements, maintenant);
  if (!courant) return { autorise: true, depart: maintenant };

  const fin = toDate(courant.data.expiresAt);
  // Actif sans terme : rien à renouveler, et rien à chaîner.
  if (!fin) return { autorise: false, motif: 'actif', expiresAt: null };

  if (ecartEnJours(fin, maintenant) > FENETRE_RENOUVELLEMENT_JOURS) {
    return { autorise: false, motif: 'actif', expiresAt: fin.toISOString() };
  }

  /*
   * Dans la fenêtre : le nouveau mois part de l'ancienne échéance, pas d'aujourd'hui.
   * Si l'échéance est déjà passée (un abonnement expiré que rien n'a nettoyé), on repart de
   * maintenant — chaîner sur une date morte offrirait un mois déjà consommé.
   */
  return { autorise: true, depart: fin > maintenant ? fin : maintenant };
}

/** L'échéance du mois souscrit à partir de `depart`. Un mois calendaire, comme à l'achat. */
export function echeanceApres(depart: Date): Date {
  const fin = new Date(depart);
  fin.setMonth(fin.getMonth() + 1);
  return fin;
}
