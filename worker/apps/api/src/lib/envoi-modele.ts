/**
 * L'ENVOI PAR GABARIT — deux régimes, deux transports.
 *
 *  · `transactionnel` → Cloudflare Email Service (binding `EMAIL`, `email.ts`), depuis
 *    `facture@mail.maxmorrys.me`. Certificat, accusés, bienvenue n°1, panier.
 *  · `marketing` → Brevo, envoi unitaire (`brevo-send.ts`), depuis `BREVO_SENDER_EMAIL`
 *    (`lettre@lettre.maxmorrys.me`). Bienvenue n°2/n°3 et les gabarits sans déclencheur.
 *
 * La FAQ Cloudflare réserve Email Service au transactionnel (« transactional email only ») :
 * aucun courrier marketing ne doit passer par le binding, et aucun transactionnel par Brevo
 * (un incident marketing ne doit jamais retenir une facture). Le choix du transport découle
 * du régime déclaré dans `modeles.ts` — l'appelant ne le choisit pas.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️ LE RÉGIME EST VÉRIFIÉ ICI, PAS À L'APPEL
 *
 * Un courrier `marketing` ne part PAS :
 *   · tant que `MARKETING_ENVOI_REEL` ne vaut pas exactement `oui` (issue `canalFerme`) —
 *     c'est l'accord de Max, fermé par défaut ;
 *   · tant que Brevo n'est pas configuré (issue `nonConfigure`) ;
 *   · sans consentement vérifié en base (issue `sansConsentement`) ;
 *   · sans lien de retrait signé (issue `nonConfigure` si la clé de signature manque) ;
 *   · au-delà du plafond journalier Brevo (issue `plafondAtteint`).
 * Les appelants sont dispersés — un webhook, un cron, une callable — et il suffirait d'en
 * oublier un pour écrire à quelqu'un qui n'a rien demandé. Un seul endroit décide.
 *
 * Un courrier `transactionnel` ne porte NI lien de retrait NI `List-Unsubscribe` : proposer
 * de se désabonner d'une facture laisserait croire qu'on peut la refuser.
 */
import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { blocsEnHtml, blocsEnTexte } from './blocs';
import * as DS from './email-design';
import { sendEmail } from './email';
import { brevoConfigure, envoyerUnitaireBrevo, plafondJour, reserverQuotaBrevo } from './brevo-send';
import { MODELES, regimeDe, type CleModele, type Langue, type Params } from './modeles';
import { lienDesabonnement, normaliserAdresse } from './unsubscribe';

export { MODELES };
export type { CleModele, Langue };

export interface Envoi {
  modele: CleModele;
  to: string;
  langue: Langue;
  /** Variables du gabarit. Converties en texte, échappées au rendu. */
  params: Record<string, unknown>;
}

export type IssueEnvoi = 'envoye' | 'sansConsentement' | 'canalFerme' | 'nonConfigure' | 'plafondAtteint' | 'echec';

export interface Resultat {
  issue: IssueEnvoi;
  erreur?: string;
}

export interface Rendu {
  subject: string;
  html: string;
  text: string;
}

/**
 * L'ACCORD de Max pour l'envoi marketing réel. Seule la valeur exacte `oui` l'ouvre ; il ne
 * suffit pas — Brevo doit aussi être configuré (`brevoConfigure`), les deux sont vérifiés.
 */
export function canalMarketingOuvert(env: Pick<Env, 'MARKETING_ENVOI_REEL'>): boolean {
  return env.MARKETING_ENVOI_REEL === 'oui';
}

/**
 * Les en-têtes d'un courrier marketing.
 *
 * `List-Unsubscribe` en HTTPS seul — pas de `mailto:` : aucune boîte n'est routée pour le
 * recevoir, et un retrait qui tombe dans le vide est pire que pas de retrait. Le
 * `List-Unsubscribe-Post` déclare le retrait EN UN CLIC (RFC 8058) : Gmail et Yahoo
 * l'exigent des expéditeurs en volume. Ces en-têtes vont dans le champ `headers` de l'envoi
 * unitaire Brevo ; une CAMPAGNE Brevo pose les siens. `unsubscribeRoute.ts` répond au POST.
 */
export function enTetesMarketing(urlRetrait: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${urlRetrait}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

function enTexte(params: Record<string, unknown>): Params {
  const sortie: Params = {};
  for (const [k, val] of Object.entries(params)) {
    sortie[k] = val === undefined || val === null ? '' : String(val);
  }
  return sortie;
}

/**
 * Rend un gabarit. Pur : aucun réseau, aucune base — c'est ce que testent les tests de rendu
 * et ce qu'écrit le script d'aperçu.
 *
 * `desabonnement` n'est accepté QUE pour un gabarit marketing, et il y est obligatoire.
 */
export function rendreModele(cle: CleModele, langue: Langue, params: Record<string, unknown>, desabonnement?: string): Rendu {
  const marketing = regimeDe(cle) === 'marketing';
  if (marketing && !desabonnement) throw new Error(`Gabarit marketing ${cle} sans lien de retrait`);
  if (!marketing && desabonnement) throw new Error(`Gabarit transactionnel ${cle} avec un lien de retrait`);

  const contenu = MODELES[cle][langue](enTexte(params));
  const html = DS.page({ langue, apercu: contenu.apercu, contenu: blocsEnHtml(contenu.blocs), desabonnement });
  const text = `${blocsEnTexte(contenu.blocs, langue)}\n\n${DS.piedTexte(langue, desabonnement)}`;
  return { subject: contenu.sujet, html, text };
}

/**
 * Le contact a-t-il consenti au marketing ?
 *
 * DEUX SOURCES : la collection `newsletter` (abonnés sans compte) et
 * `users.preferences.newsletter`. Un désabonnement sur l'une vaut refus, même si l'autre dit
 * oui — dans le doute, on n'envoie pas.
 */
export async function aConsenti(db: Firestore, email: string): Promise<boolean> {
  const adresse = normaliserAdresse(email);

  const abonnes = await db.query({
    collection: 'newsletter',
    where: [{ field: 'email', op: '==', value: adresse }],
  });
  if (abonnes.some((a) => a.data.unsubscribedAt)) return false;
  if (abonnes.some((a) => a.data.consent === true)) return true;

  const comptes = await db.query({
    collection: 'users',
    where: [{ field: 'email', op: '==', value: adresse }],
    limit: 1,
  });
  const prefs = (comptes[0]?.data.preferences ?? {}) as Record<string, unknown>;
  return prefs.newsletter === true;
}

/**
 * Envoie un gabarit.
 *
 * NE LÈVE JAMAIS — plusieurs appelants sont sur le chemin de l'argent (le webhook de
 * paiement). Faire échouer un webhook parce qu'un envoi a hoqueté transformerait un incident
 * sans conséquence en rejeu d'un paiement déjà encaissé.
 *
 * `db` n'est requis que pour les gabarits marketing, dont il faut vérifier le consentement.
 */
export async function envoyerModele(env: Env, envoi: Envoi, db?: Firestore): Promise<Resultat> {
  if (!envoi.to || !envoi.to.includes('@')) return { issue: 'echec', erreur: 'destinataire invalide' };

  try {
    if (regimeDe(envoi.modele) === 'marketing') {
      if (!canalMarketingOuvert(env)) return { issue: 'canalFerme' };
      if (!db) return { issue: 'echec', erreur: 'consentement invérifiable : db absente' };
      if (!brevoConfigure(env)) return { issue: 'nonConfigure', erreur: 'Brevo non configuré' };
      if (!env.EXPORT_SIGNING_KEY) return { issue: 'nonConfigure', erreur: 'EXPORT_SIGNING_KEY absente : retrait impossible à signer' };
      if (!(await aConsenti(db, envoi.to))) return { issue: 'sansConsentement' };
      if ((await reserverQuotaBrevo(db, 1, plafondJour(env))) < 1) return { issue: 'plafondAtteint' };

      const retrait = `${await lienDesabonnement(env, envoi.to)}&l=${envoi.langue}`;
      const rendu = rendreModele(envoi.modele, envoi.langue, envoi.params, retrait);
      const b = await envoyerUnitaireBrevo(env, { to: envoi.to, ...rendu, headers: enTetesMarketing(retrait), tags: [envoi.modele] });
      return b.sent ? { issue: 'envoye' } : { issue: 'echec', erreur: b.error };
    }

    // Transactionnel : le binding Cloudflare, et lui seul.
    const rendu = rendreModele(envoi.modele, envoi.langue, envoi.params);
    const r = await sendEmail(env, { to: envoi.to, ...rendu });
    if (r.sent) return { issue: 'envoye' };
    if (r.error === 'binding EMAIL absent') return { issue: 'nonConfigure', erreur: r.error };
    return { issue: 'echec', erreur: r.error };
  } catch (error: unknown) {
    return { issue: 'echec', erreur: error instanceof Error ? error.message : String(error) };
  }
}
