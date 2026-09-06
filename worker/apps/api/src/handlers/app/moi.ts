import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appMoi` — QUI EST LA PERSONNE, du point de vue de l'application native.
 *
 * ⚠️ CE HANDLER LIT AVEC UN COMPTE DE SERVICE, DONC IL CONTOURNE `firestore.rules`. Le
 * contrôle que la règle `match /users/{userId}` ferait — « on ne lit que son propre
 * document » — est refait ici, et la seule façon de le tenir est de prendre l'uid dans le
 * JETON, jamais dans la charge utile. C'est la différence entre un handler et une faille.
 *
 * ── UNE VUE, PAS UN DOCUMENT ─────────────────────────────────────────────────────────
 * On ne renvoie pas `users/{uid}` tel quel. L'écran a besoin d'un prénom, d'une initiale
 * et d'une date lisible ; le document porte un `displayName` complet et un `createdAt` ISO.
 * Faire la découpe ici plutôt que dans l'écran garde la logique à un seul endroit — et
 * surtout, ça évite d'envoyer au téléphone des champs dont il n'a pas l'usage.
 *
 * `releveA` accompagne la réponse : c'est lui qui alimente `<Num asOf>`, et sans lui les
 * écrans continueraient de citer une date en dur.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « 2026-08-12T… » → « 12 août ». L'année est omise : elle n'apprend rien à l'écran. */
function enClair(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
}

export async function appMoi(_data: unknown, context: CallContext): Promise<Reponse<'appMoi'>> {
  const auth = requireAuth(context);

  const document = await context.db.get(`users/${auth.uid}`);
  if (!document) return { vue: null, releveA: new Date().toISOString() };

  const nom = asText(document.data.displayName) ?? '';
  const prenom = nom.trim().split(/\s+/)[0] ?? '';

  return {
    vue: {
      prenom,
      nom,
      // L'initiale est calculée, jamais stockée : un nom qui change doit la changer.
      initiale: (prenom.charAt(0) || '?').toUpperCase(),
      email: asText(document.data.email) ?? auth.email ?? null,
      ouvertureCompte: enClair(asText(document.data.createdAt)),
      /* Le nom du répétiteur vit dans le profil, pas sur l'appareil : `ds/tutor.ts` le dit,
         et un stockage local en ferait une seconde source de vérité. */
      tuteur: asText(document.data.tutorName) ?? null,
      role: asText(document.data.role) ?? 'student',
      xp: toNumber(document.data.xp, 0),
    },
    releveA: new Date().toISOString(),
  };
}
