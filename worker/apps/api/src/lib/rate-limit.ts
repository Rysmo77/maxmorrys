import type { Firestore } from '@mm/firestore-rest';
import { sha256Hex } from '@mm/shared';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES PLAFONDS DES APPELANTS ANONYMES.
 *
 * `_ratelimits/` existait déjà, mais uniquement indexé par `uid` : rysmo, parseCv,
 * joinWaitlist. Trois endpoints du Worker n'ont volontairement aucune authentification
 * — `acknowledgeAppointment`, `translateContent`, `popupEvent` — et n'avaient donc AUCUN
 * plafond, faute d'identifiant sur lequel compter.
 *
 * L'identifiant de repli est l'adresse IP, prise dans `CF-Connecting-IP`. Ce choix mérite
 * d'être justifié, parce qu'un en-tête d'IP est d'ordinaire la dernière chose à laquelle
 * se fier : celui-ci est posé par Cloudflare lui-même sur le chemin de la requête, et
 * **écrase** toute valeur envoyée par le client. Un attaquant ne peut pas la falsifier
 * depuis son navigateur. Il peut en revanche en changer, et c'est la limite honnête de
 * ce garde-fou : il transforme une campagne en une nuisance, il ne la supprime pas.
 * C'est pourquoi les appelants de ce module posent DEUX plafonds — un par appelant, et
 * un global — plutôt qu'un seul.
 *
 * L'IP n'est jamais écrite en clair : la clé porte son empreinte SHA-256 tronquée. Un
 * compteur d'abus n'a pas besoin de savoir QUI, seulement COMBIEN — et une collection de
 * mesure ne doit pas devenir un journal d'adresses.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Empreinte non réversible de l'appelant, utilisable comme segment de chemin. */
export async function empreinteAppelant(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'inconnue';
  return (await sha256Hex(ip)).slice(0, 32);
}

/** Fenêtre horaire `AAAA-MM-JJTHH`, en UTC — une seule échelle de temps côté serveur. */
export function fenetreHoraire(): string {
  return new Date().toISOString().slice(0, 13);
}

/** Fenêtre journalière `AAAA-MM-JJ`, en UTC. */
export function fenetreJournaliere(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface Verdict {
  /** `false` dès que le plafond est dépassé. */
  autorise: boolean;
  /** Valeur du compteur APRÈS incrément — utile pour journaliser un franchissement. */
  compte: number;
}

/**
 * Incrémente un compteur et dit si le plafond est franchi.
 *
 * ⚠️ L'incrément a lieu **même quand l'appel est refusé**, et c'est délibéré : un
 * appelant bloqué qui cesserait d'être compté verrait son quota se reconstituer à
 * chaque refus. La fenêtre ne se rouvre qu'avec le temps, jamais avec l'échec.
 *
 * ⚠️ Transactionnel, parce que le cas qui compte est précisément celui de dix requêtes
 * simultanées : c'est la forme que prend un abus, jamais une file bien rangée.
 *
 * `expireAt` est posé pour qu'une politique TTL Firestore puisse purger ces documents.
 * Elle n'est pas configurée à ce jour — les compteurs s'accumulent donc, à raison d'un
 * document par appelant et par fenêtre. C'est peu, mais ce n'est pas zéro : à câbler sur
 * le champ `expireAt` de la collection `_ratelimits` quand l'occasion se présente.
 */
export async function incrementerBorne(
  db: Firestore,
  cle: string,
  plafond: number,
  dureeMs: number,
): Promise<Verdict> {
  return db.runTransaction<Verdict>(async (tx) => {
    const snapshot = await tx.get(cle);
    const compte = (Number(snapshot?.data.count) || 0) + 1;
    tx.set(
      cle,
      { count: compte, expireAt: new Date(Date.now() + dureeMs).toISOString() },
      { merge: true },
    );
    return { autorise: compte <= plafond, compte };
  });
}

export const UNE_HEURE = 60 * 60 * 1000;
export const UN_JOUR = 24 * UNE_HEURE;
