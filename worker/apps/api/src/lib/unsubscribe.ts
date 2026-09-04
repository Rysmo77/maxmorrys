/**
 * LE DÉSABONNEMENT — la moitié qui manquait au consentement.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUE ÇA FERME
 *
 * Le formulaire d'inscription recueille un consentement explicite, horodaté, et la règle
 * Firestore l'exige côté serveur. Mais il n'existait AUCUN moyen de revenir dessus : ni
 * page, ni route, ni champ, ni lien. Recherche exhaustive sur `src/`, `worker/` et
 * `firestore.rules` — rien.
 *
 * Or la politique de confidentialité promet une conservation « jusqu'à ta désinscription »
 * (`legal.json`). Elle décrivait donc un mécanisme qui n'existait pas, exactement comme
 * l'article 4 des CGV promettait une facture quand aucun canal d'envoi n'existait.
 *
 * Sans cela, aucune campagne ne peut partir : ni légalement, ni techniquement — aucun relais
 * sérieux n'accepte d'envoyer sans lien de retrait.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️ LE LIEN N'EXPIRE JAMAIS, ET C'EST DÉLIBÉRÉ
 *
 * Les liens signés de ce dépôt portent tous une échéance — voir `handlers/gdpr.ts`, où le
 * lien de téléchargement d'export signe `${key}:${expiresAt}`. Celui-ci n'en porte pas.
 *
 * La raison est qu'un lien de désabonnement périmé est une FAUTE, pas une sécurité. Une
 * lettre se retrouve dans une boîte des mois plus tard, archivée, retrouvée par recherche ;
 * la personne clique et doit sortir. Lui répondre « ce lien a expiré » revient à lui refuser
 * un droit — et c'est aussi le plus sûr moyen de récolter une plainte pour spam, qui coûte
 * infiniment plus cher qu'un lien perpétuel.
 *
 * Le risque de l'absence d'échéance est qu'un tiers désabonne quelqu'un d'autre. C'est un
 * risque acceptable et asymétrique : le pire cas est qu'une personne cesse de recevoir une
 * lettre qu'elle peut redemander en dix secondes. Le pire cas inverse est une plainte
 * réglementaire.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SÉPARATION DE DOMAINE
 *
 * La clé `EXPORT_SIGNING_KEY` est réutilisée plutôt que d'en provisionner une seconde, mais
 * le message signé porte un PRÉFIXE distinct (`desabonnement:`). Sans lui, une signature
 * valable pour un export pourrait être rejouée ici, ou l'inverse — c'est la confusion de
 * protocole classique. Les deux espaces de messages ne se recoupent donc jamais.
 */
import type { Firestore } from '@mm/firestore-rest';
import { hmacSha256, verifyHmacSha256 } from '@mm/shared';

import type { Env } from '../env';

/** Préfixe de séparation de domaine. Voir l'en-tête. */
const PREFIXE = 'desabonnement:';

/** Normalise une adresse avant signature ET avant recherche : les deux doivent coïncider,
 *  sans quoi un lien signé sur « Awa@Example.com » ne retrouverait pas « awa@example.com ». */
export function normaliserAdresse(email: string): string {
  return email.trim().toLowerCase();
}

/** La signature d'une adresse. */
export async function signerAdresse(env: Env, email: string): Promise<string> {
  return hmacSha256(env.EXPORT_SIGNING_KEY as string, PREFIXE + normaliserAdresse(email));
}

/** Vérifie qu'une signature correspond bien à l'adresse. Temps constant (`crypto.subtle.verify`). */
export async function verifierAdresse(env: Env, email: string, signature: string): Promise<boolean> {
  return verifyHmacSha256(env.EXPORT_SIGNING_KEY as string, PREFIXE + normaliserAdresse(email), signature);
}

/**
 * Le lien à poser dans chaque courrier marketing.
 *
 * L'adresse voyage en clair dans l'URL, encodée. C'est assumé : la personne la connaît déjà
 * — c'est la sienne — et la voir dans le lien lui dit exactement quelle adresse elle est en
 * train de retirer, ce qui compte quand on en a plusieurs.
 */
export async function lienDesabonnement(env: Env, email: string): Promise<string> {
  const adresse = normaliserAdresse(email);
  const signature = await signerAdresse(env, adresse);
  return `${env.API_BASE_URL}/desabonnement?e=${encodeURIComponent(adresse)}&s=${signature}`;
}

export interface ResultatDesabonnement {
  ok: boolean;
  /** Nombre de documents `newsletter` marqués. Zéro n'est PAS une erreur : voir plus bas. */
  marques: number;
  /** Le compte lié, s'il existait, a-t-il été mis à jour ? */
  compteMisAJour: boolean;
}

/**
 * Retire une adresse de tous les canaux marketing.
 *
 * DEUX SURFACES, parce que le consentement en a deux : la collection `newsletter` (abonnés
 * sans compte) et `users/{uid}.preferences.newsletter` (membres). Ne traiter que l'une des
 * deux laisserait la personne inscrite par l'autre — et elle recliquerait, à raison.
 *
 * ZÉRO DOCUMENT MARQUÉ N'EST PAS UNE ERREUR. Une adresse déjà retirée, ou jamais inscrite,
 * doit répondre « c'est fait » et non « introuvable » : dire à quelqu'un qu'on ne le connaît
 * pas alors qu'il vient de recevoir un courrier de notre part est le meilleur moyen de
 * transformer un désabonnement en signalement.
 */
export async function desabonner(db: Firestore, email: string): Promise<ResultatDesabonnement> {
  const adresse = normaliserAdresse(email);
  const maintenant = new Date().toISOString();
  let marques = 0;

  const abonnes = await db.query({
    collection: 'newsletter',
    where: [{ field: 'email', op: '==', value: adresse }],
  });
  for (const abonne of abonnes) {
    if (abonne.data.unsubscribedAt) continue; // déjà sorti : on ne réécrit pas la date
    await db.update(abonne.path, { unsubscribedAt: maintenant });
    marques += 1;
  }

  let compteMisAJour = false;
  const comptes = await db.query({
    collection: 'users',
    where: [{ field: 'email', op: '==', value: adresse }],
    limit: 1,
  });
  if (comptes.length > 0) {
    const profil = comptes[0];
    const prefs = (profil.data.preferences ?? {}) as Record<string, unknown>;
    if (prefs.newsletter === true) {
      await db.update(profil.path, { preferences: { ...prefs, newsletter: false } });
      compteMisAJour = true;
    }
  }

  return { ok: true, marques, compteMisAJour };
}
