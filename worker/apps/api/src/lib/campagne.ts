/**
 * LA CAMPAGNE — la lettre et les envois ponctuels, PAR BREVO, par lots, sans double envoi.
 *
 * Appelée par `marketingRoute.ts` (n8n WF-09, agents BMad). Le mode d'emploi est dans
 * `docs/growth-kb/08-emailing.md`. Aucun courrier de campagne ne passe par Cloudflare : la FAQ
 * d'Email Service le réserve au transactionnel (voir `brevo-send.ts`).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE PARCOURS D'UNE CAMPAGNE
 *
 *   1. `mode: "test"` — une épreuve part par l'envoi UNITAIRE Brevo vers une adresse de
 *      `MARKETING_TEST_TO`, objet préfixé « [TEST] », avec notre lien de retrait signé.
 *      Enregistre l'EMPREINTE du contenu testé dans `campaigns/{id}`. Exige Brevo configuré,
 *      PAS l'accord : tester est précisément ce qu'on fait avant de l'obtenir.
 *   2. `mode: "reel"` — n'accepte que le contenu EXACT qui a été testé (même empreinte), et
 *      seulement si l'accord est donné (`MARKETING_ENVOI_REEL = oui`). Chaque appel :
 *        a. fait remonter les retraits faits chez Brevo (`resynchroniserRetraits`) — si Brevo
 *           est illisible, RIEN ne part : on n'écrit pas sans connaître ses désinscriptions ;
 *        b. choisit un LOT (`taille`, 50 au plus) dans l'audience Firestore, hors déjà-traités ;
 *        c. réserve le lot sur le plafond journalier (300 sur le plan gratuit Brevo) ;
 *        d. crée une LISTE Brevo propre au lot, y place ces contacts, crée une CAMPAGNE Brevo
 *           sur cette liste avec le HTML de nos gabarits, et l'envoie (`sendNow`).
 *      La réponse dit combien il en reste ; l'appelant rappelle avec le même corps jusqu'à
 *      `restants: 0`. Une liste par lot, et non une liste par campagne vidée entre deux lots :
 *      Brevo fige les destinataires de manière asynchrone, vider la liste trop tôt priverait
 *      le lot précédent, la remplir trop tôt doublerait le suivant.
 *
 * Le retrait d'une campagne est celui de BREVO (`{{ unsubscribe }}` dans notre pied, et son
 * en-tête `List-Unsubscribe`) : c'est ce que ses CGU attendent d'une campagne, et c'est ce que
 * `resynchroniserRetraits` relit avant l'envoi suivant pour écrire `unsubscribedAt` chez nous.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'IDEMPOTENCE PORTE SUR LE COUPLE (campagne, adresse)
 *
 * Avant tout appel à Brevo, un document `campaign_sends/{id}__{empreinte adresse}` est CRÉÉ
 * avec la précondition « n'existe pas ». Deux appels concurrents ne peuvent donc pas écrire
 * tous les deux à la même personne. Si Brevo REFUSE la requête (réponse reçue, rien parti),
 * les traces du lot sont effacées et le quota rendu : l'appel suivant reprend le lot. Si l'on
 * ne SAIT PAS (coupure réseau pendant `sendNow`), le lot est marqué `echec` et n'est pas
 * retenté — un courrier manquant vaut mieux qu'un courrier en double, le seul des deux que le
 * destinataire remarque.
 */
import { FirestoreError, type Firestore } from '@mm/firestore-rest';
import { sha256Hex } from '@mm/shared';

import type { Env } from '../env';
import { filtrerAudience, rassemblerAudience, SEGMENTS, type Segment } from './audience';
import { blocsEnHtml, blocsEnTexte, compterBoutons, TYPES_DE_BLOC, type Bloc } from './blocs';
import { adressesRetireesChezBrevo, cheminTraceRetrait, resynchroniserRetraits } from './brevo-contacts';
import {
  brevoConfigure,
  creerCampagne,
  creerListe,
  ecrireContact,
  envoyerCampagneMaintenant,
  envoyerUnitaireBrevo,
  JETON_RETRAIT_BREVO,
  libererQuotaBrevo,
  listePrincipale,
  plafondJour,
  reserverQuotaBrevo,
} from './brevo-send';
import * as DS from './email-design';
import { canalMarketingOuvert, enTetesMarketing } from './envoi-modele';
import { fenetreJournaliere, incrementerBorne, UN_JOUR } from './rate-limit';
import { lienDesabonnement, normaliserAdresse } from './unsubscribe';

export interface DemandeCampagne {
  id: string;
  objet: string;
  preheader: string;
  langue: 'fr' | 'en';
  /** Fragment HTML de la carte — jamais un document complet. Exclusif de `blocs`. */
  html?: string;
  /** Version texte. Obligatoire avec `html`, déduite des blocs sinon. */
  texte?: string;
  /** Contenu structuré, mis en page par le design system. Exclusif de `html`. */
  blocs?: Bloc[];
  segment: Segment;
  /** Restreint le segment à ces identifiants (`users/{uid}` ou `newsletter/{id}`). */
  ids?: string[];
  mode: 'test' | 'reel';
  adresseTest?: string;
  taille: number;
}

export const TAILLE_MAX = 50;
const TAILLE_DEFAUT = 25;
const PLAFOND_TESTS_JOUR = 30;

/* ─────────────────────────────────────────────────────────────────────────────
   LA VOIX — ce qu'aucune campagne ne peut dire
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Les interdits de la voix, vérifiés sur TOUT le texte d'une campagne (objet, aperçu, corps).
 *
 * · Remboursement et garantie : les CGV (art. 6) n'en prévoient pas. Une lettre qui en promet
 *   crée une obligation que l'entreprise n'a pas.
 * · Emoji : aucun, nulle part (design system).
 * · Gabarits non remplis : `{{…}}`, `[à écrire]` — le brouillon parti tel quel.
 */
const INTERDITS: Array<[RegExp, string]> = [
  [/rembours/i, 'promesse de remboursement (CGV art. 6 : aucun remboursement)'],
  [/\bgaranti/i, 'promesse de garantie'],
  [/\brefund/i, 'refund promise (no refunds, terms art. 6)'],
  [/money[- ]back|\bguarantee/i, 'guarantee promise'],
  [/\p{Extended_Pictographic}/u, 'emoji'],
  [/\{\{|\}\}/, 'variable de gabarit non remplie'],
  [/\[(?:à écrire|a ecrire|to write|TODO)\]|lorem ipsum/i, 'texte provisoire'],
];

export function controlerVoix(textes: string[]): string[] {
  const tout = textes.join('\n');
  return INTERDITS.filter(([motif]) => motif.test(tout)).map(([, raison]) => raison);
}

/* ─────────────────────────────────────────────────────────────────────────────
   VALIDATION
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Le fragment HTML fourni par l'appelant.
 *
 * L'appelant est authentifié — ce n'est pas un champ public — mais le HTML part chez des
 * centaines de personnes sous notre domaine signé DKIM. On refuse donc ce qui n'a rien à faire
 * dans un courrier : script, formulaire, cadre, gestionnaire d'événement, lien non chiffré,
 * et un document complet (qui casserait l'enveloppe du design system).
 */
function erreursHtml(html: string): string[] {
  const e: string[] = [];
  if (/<\s*(?:!doctype|html|head|body)\b/i.test(html)) e.push('html : fragment attendu, pas un document complet (le gabarit pose l’enveloppe)');
  if (/<\s*(?:script|style|iframe|form|object|embed|input|button)\b/i.test(html)) e.push('html : balise interdite (script, style, iframe, form, object, embed, input, button)');
  if (/\son[a-z]+\s*=/i.test(html)) e.push('html : gestionnaire d’événement interdit');
  if (/(?:href|src)\s*=\s*["']?\s*(?:javascript:|data:|http:)/i.test(html)) e.push('html : lien non HTTPS ou javascript:/data: interdit');
  return e;
}

function texteBorne(v: unknown, min: number, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length >= min && s.length <= max ? s : null;
}

function validerBlocs(brut: unknown, e: string[]): Bloc[] | undefined {
  if (!Array.isArray(brut) || brut.length === 0 || brut.length > 40) {
    e.push('blocs : tableau de 1 à 40 blocs attendu');
    return undefined;
  }
  const blocs: Bloc[] = [];
  brut.forEach((b: unknown, i) => {
    const o = (b ?? {}) as Record<string, unknown>;
    const type = o.type as string;
    if (!(TYPES_DE_BLOC as readonly string[]).includes(type)) { e.push(`blocs[${i}] : type inconnu`); return; }
    const t = (k: string, max = 2000) => texteBorne(o[k], 1, max);
    switch (type) {
      case 'filet': blocs.push({ type: 'filet' }); return;
      case 'bouton': {
        const libelle = t('libelle', 40); const url = t('url', 500);
        if (!libelle || !url || !/^https:\/\//.test(url)) { e.push(`blocs[${i}] : bouton avec libelle (≤ 40) et url https attendus`); return; }
        if (libelle === libelle.toUpperCase() && /[A-Z]{3}/.test(libelle)) { e.push(`blocs[${i}] : bouton en casse de phrase, pas en capitales`); return; }
        blocs.push({ type: 'bouton', libelle, url }); return;
      }
      case 'encart': {
        const surTitre = t('surTitre', 40); const valeur = t('valeur', 60);
        if (!surTitre || !valeur) { e.push(`blocs[${i}] : encart avec surTitre et valeur attendus`); return; }
        const note = texteBorne(o.note, 1, 200) ?? undefined;
        blocs.push({ type: 'encart', surTitre, valeur, note }); return;
      }
      case 'titre': {
        const texte = t('texte', 80);
        if (!texte) { e.push(`blocs[${i}] : titre de 1 à 80 caractères`); return; }
        blocs.push({ type: 'titre', texte }); return;
      }
      default: {
        const texte = t('texte');
        if (!texte) { e.push(`blocs[${i}] : texte attendu`); return; }
        if (type === 'paragraphe') blocs.push({ type: 'paragraphe', texte, sourdine: o.sourdine === true });
        else blocs.push({ type: type as 'surTitre' | 'mention' | 'encadre', texte });
      }
    }
  });
  if (compterBoutons(blocs) > 1) e.push('blocs : un seul bouton par courrier (CTA unique)');
  return blocs;
}

export function validerDemande(brut: unknown): { ok: true; demande: DemandeCampagne } | { ok: false; erreurs: string[] } {
  const o = (brut ?? {}) as Record<string, unknown>;
  const e: string[] = [];

  const id = typeof o.id === 'string' && /^[a-z0-9][a-z0-9-]{2,63}$/.test(o.id) ? o.id : null;
  if (!id) e.push('id : 3 à 64 caractères [a-z0-9-], stable d’un appel à l’autre (ex. lettre-2026-11-05)');
  const objet = texteBorne(o.objet, 3, 90);
  if (!objet) e.push('objet : 3 à 90 caractères');
  const preheader = texteBorne(o.preheader, 3, 140);
  if (!preheader) e.push('preheader : 3 à 140 caractères');
  const langue = o.langue === 'en' ? 'en' : o.langue === undefined || o.langue === 'fr' ? 'fr' : null;
  if (!langue) e.push('langue : fr ou en');
  const mode = o.mode === 'test' || o.mode === 'reel' ? o.mode : null;
  if (!mode) e.push('mode : test ou reel');
  const segment = (o.segment ?? 'lettre') as Segment;
  if (!SEGMENTS.includes(segment)) e.push(`segment : ${SEGMENTS.join(', ')}`);

  let ids: string[] | undefined;
  if (o.ids !== undefined) {
    if (!Array.isArray(o.ids) || o.ids.length > 500 || !o.ids.every((x) => typeof x === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(x))) {
      e.push('ids : tableau de 500 identifiants au plus');
    } else ids = o.ids as string[];
  }

  const taille = o.taille === undefined ? TAILLE_DEFAUT : Number(o.taille);
  if (!Number.isInteger(taille) || taille < 1 || taille > TAILLE_MAX) e.push(`taille : entier de 1 à ${TAILLE_MAX}`);

  let html: string | undefined;
  let texte: string | undefined;
  let blocs: Bloc[] | undefined;
  if (o.html !== undefined && o.blocs !== undefined) e.push('html et blocs sont exclusifs : fournir l’un OU l’autre');
  else if (o.html !== undefined) {
    html = texteBorne(o.html, 1, 100_000) ?? undefined;
    texte = texteBorne(o.texte, 1, 50_000) ?? undefined;
    if (!html) e.push('html : fragment non vide attendu');
    else e.push(...erreursHtml(html));
    if (!texte) e.push('texte : version texte obligatoire avec html');
  } else if (o.blocs !== undefined) {
    blocs = validerBlocs(o.blocs, e);
  } else e.push('contenu : fournir html + texte, ou blocs');

  const adresseTest = typeof o.adresseTest === 'string' ? normaliserAdresse(o.adresseTest) : undefined;

  if (e.length === 0) {
    const voix = controlerVoix([objet!, preheader!, html ?? '', texte ?? '', blocs ? blocsEnTexte(blocs) : '']);
    e.push(...voix.map((v) => `voix : ${v}`));
  }
  if (e.length) return { ok: false, erreurs: e };

  return {
    ok: true,
    demande: { id: id!, objet: objet!, preheader: preheader!, langue: langue!, html, texte, blocs, segment, ids, mode: mode!, adresseTest, taille },
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   RENDU
   ────────────────────────────────────────────────────────────────────────── */

/** L'empreinte du CONTENU et de la CIBLE — ce qui doit être identique entre test et réel. */
export async function empreinteCampagne(d: DemandeCampagne): Promise<string> {
  return sha256Hex(JSON.stringify([d.objet, d.preheader, d.langue, d.html ?? null, d.texte ?? null, d.blocs ?? null, d.segment, d.ids ?? null]));
}

export function rendreCampagne(d: DemandeCampagne, urlRetrait: string): { subject: string; html: string; text: string } {
  const contenu = d.blocs ? blocsEnHtml(d.blocs) : (d.html as string);
  const corpsTexte = d.blocs ? blocsEnTexte(d.blocs, d.langue) : (d.texte as string);
  return {
    subject: d.objet,
    html: DS.page({ langue: d.langue, apercu: d.preheader, contenu, desabonnement: urlRetrait }),
    text: `${corpsTexte}\n\n${DS.piedTexte(d.langue, urlRetrait)}`,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXÉCUTION
   ────────────────────────────────────────────────────────────────────────── */

export type ErreurCampagne =
  | 'canalFerme'
  | 'nonConfigure'
  | 'adresseTestNonAutorisee'
  | 'testRequis'
  | 'plafondTests'
  | 'brevoIndisponible';

export type BilanCampagne =
  | { ok: false; erreur: ErreurCampagne; detail: string }
  | {
      ok: true;
      mode: 'test';
      campagne: string;
      envoyeA: string;
      envoye: boolean;
      erreurEnvoi?: string;
      /** Combien de personnes recevraient la campagne en mode réel, aujourd'hui. */
      audiencePrevue: number;
    }
  | {
      ok: true;
      mode: 'reel';
      campagne: string;
      audience: number;
      dejaTraites: number;
      envoyes: number;
      echecs: number;
      ignores: number;
      restants: number;
      plafondAtteint: boolean;
      statut: 'enCours' | 'terminee';
      /** Retraits faits chez Brevo et repris dans Firestore juste avant ce lot. */
      retraitsRepris: number;
      /** Identifiant de la campagne Brevo du lot, s'il en a été créé une. */
      campagneBrevo?: number;
    };

function adressesTest(env: Env): string[] {
  return (env.MARKETING_TEST_TO ?? '').split(',').map((a) => normaliserAdresse(a)).filter((a) => a.includes('@'));
}

function dejaExistant(error: unknown): boolean {
  return error instanceof FirestoreError && (error.status === 'ALREADY_EXISTS' || error.status === 'FAILED_PRECONDITION' || error.httpStatus === 409);
}

const NON_CONFIGURE = 'Brevo non configuré : BREVO_API_KEY (secret), BREVO_LIST_ID et BREVO_SENDER_EMAIL (wrangler.jsonc)';

export async function executerCampagne(db: Firestore, env: Env, d: DemandeCampagne, maintenant = new Date()): Promise<BilanCampagne> {
  if (!brevoConfigure(env)) return { ok: false, erreur: 'nonConfigure', detail: NON_CONFIGURE };
  const empreinte = await empreinteCampagne(d);
  const chemin = `campaigns/${d.id}`;
  const iso = maintenant.toISOString();

  /* ── TEST : une épreuve, par l'envoi unitaire Brevo ───────────────────── */
  if (d.mode === 'test') {
    if (!env.EXPORT_SIGNING_KEY) {
      return { ok: false, erreur: 'nonConfigure', detail: 'EXPORT_SIGNING_KEY absente : le lien de retrait de l’épreuve ne peut pas être signé' };
    }
    const autorisees = adressesTest(env);
    if (autorisees.length === 0) return { ok: false, erreur: 'nonConfigure', detail: 'MARKETING_TEST_TO vide' };
    const cible = d.adresseTest ?? autorisees[0];
    if (!autorisees.includes(cible)) {
      return { ok: false, erreur: 'adresseTestNonAutorisee', detail: 'adresseTest doit figurer dans MARKETING_TEST_TO' };
    }
    const borne = await incrementerBorne(db, `_ratelimits/marketing_tests_${fenetreJournaliere()}`, PLAFOND_TESTS_JOUR, 2 * UN_JOUR);
    if (!borne.autorise) return { ok: false, erreur: 'plafondTests', detail: `${PLAFOND_TESTS_JOUR} tests par jour au plus` };
    if ((await reserverQuotaBrevo(db, 1, plafondJour(env))) < 1) {
      return { ok: false, erreur: 'plafondTests', detail: `plafond journalier Brevo atteint (${plafondJour(env)} envois) : reprendre demain` };
    }

    const audiencePrevue = filtrerAudience(await rassemblerAudience(db), d).length;
    const retrait = `${await lienDesabonnement(env, cible)}&l=${d.langue}`;
    const rendu = rendreCampagne(d, retrait);
    const r = await envoyerUnitaireBrevo(env, {
      to: cible,
      ...rendu,
      subject: `[TEST] ${rendu.subject}`,
      headers: enTetesMarketing(retrait),
      tags: ['epreuve', d.id],
    });

    await db.set(chemin, {
      objet: d.objet,
      langue: d.langue,
      segment: d.segment,
      ...(r.sent ? { empreinteTestee: empreinte, testeeLe: iso, testeePar: cible } : {}),
      majLe: iso,
    }, { merge: true });

    return { ok: true, mode: 'test', campagne: d.id, envoyeA: cible, envoye: r.sent, erreurEnvoi: r.error, audiencePrevue };
  }

  /* ── RÉEL : un lot, une liste, une campagne Brevo ─────────────────────── */
  if (!canalMarketingOuvert(env)) {
    return {
      ok: false,
      erreur: 'canalFerme',
      detail: 'MARKETING_ENVOI_REEL ≠ "oui" : l’envoi réel attend l’accord de Max (voir docs/growth-kb/08-emailing.md). Le mode test reste ouvert.',
    };
  }

  const fiche = await db.get(chemin);
  if (!fiche || fiche.data.empreinteTestee !== empreinte) {
    return { ok: false, erreur: 'testRequis', detail: 'Ce contenu exact n’a pas été envoyé en mode test : envoie d’abord le même corps avec mode "test".' };
  }

  // a. Les retraits faits chez Brevo d'abord — sans eux, on pourrait écrire à un désinscrit.
  const retraits = await resynchroniserRetraits(db, env, maintenant);
  if (!retraits.ok) return { ok: false, erreur: 'brevoIndisponible', detail: retraits.erreur };

  // b. Le lot.
  const audience = filtrerAudience(await rassemblerAudience(db), d);
  const traces = await db.query({ collection: 'campaign_sends', where: [{ field: 'campagne', op: '==', value: d.id }] });
  const traitees = new Set(traces.map((t) => String(t.data.email ?? '')));
  const restantsAvant = audience.filter((x) => !traitees.has(x.email));

  const bilan = { envoyes: 0, echecs: 0, ignores: 0 };
  let lot = restantsAvant.slice(0, d.taille);
  let plafondAtteint = false;
  let campagneBrevo: number | undefined;

  // c. Le plafond.
  if (lot.length > 0) {
    const accorde = await reserverQuotaBrevo(db, lot.length, plafondJour(env));
    plafondAtteint = accorde < lot.length;
    lot = lot.slice(0, accorde);
  }

  // Les traces, AVANT tout appel à Brevo : c'est elles qui interdisent le double envoi.
  const retenus: Array<{ email: string; trace: string }> = [];
  for (const dest of lot) {
    const trace = `campaign_sends/${d.id}__${(await sha256Hex(dest.email)).slice(0, 32)}`;
    try {
      await db.commit([{ ...db.buildWrite(trace, { campagne: d.id, email: dest.email, statut: 'enCours', creeLe: iso }, { mask: false }), currentDocument: { exists: false } }]);
      retenus.push({ email: dest.email, trace });
    } catch (error: unknown) {
      if (dejaExistant(error)) { bilan.ignores += 1; continue; }
      throw error;
    }
  }
  // Un appel concurrent a pris une partie du lot : le quota correspondant lui revient.
  await libererQuotaBrevo(db, lot.length - retenus.length);

  /** Brevo a refusé : rien n'est parti. On efface les traces et on rend le quota. */
  const annuler = async (qui: Array<{ trace: string }>, detail: string): Promise<BilanCampagne> => {
    for (const r of qui) await db.delete(r.trace);
    await libererQuotaBrevo(db, qui.length);
    return { ok: false, erreur: 'brevoIndisponible', detail };
  };

  // d. La liste du lot, les contacts, la campagne, l'envoi.
  if (retenus.length > 0) {
    const liste = await creerListe(env, `${d.id} · lot ${iso}`);
    if (!liste.ok) return annuler(retenus, `liste du lot non créée : ${liste.erreur}`);

    const reprises = await adressesRetireesChezBrevo(db);
    const places: typeof retenus = [];
    for (const r of retenus) {
      // Réabonnement explicite après un retrait repris de Brevo : seule levée de liste noire permise.
      const reabonnement = reprises.has(r.email);
      const e = await ecrireContact(env, { email: r.email, listIds: [listePrincipale(env), liste.id], ...(reabonnement ? { bloque: false } : {}) });
      if (e.ok) {
        if (reabonnement) await db.delete(await cheminTraceRetrait(r.email));
        places.push(r);
      } else {
        // Contact refusé par Brevo (adresse invalide pour lui) : échec définitif, pas de reprise.
        bilan.echecs += 1;
        await db.update(r.trace, { statut: 'echec', erreur: String(e.erreur ?? '').slice(0, 300) });
      }
    }

    if (places.length > 0) {
      const rendu = rendreCampagne(d, JETON_RETRAIT_BREVO);
      const campagne = await creerCampagne(env, { nom: `${d.id} · ${iso}`, objet: d.objet, preheader: d.preheader, html: rendu.html, listeId: liste.id, tag: d.id });
      if (!campagne.ok) return annuler(places, `campagne non créée : ${campagne.erreur}`);
      campagneBrevo = campagne.id;

      const envoi = await envoyerCampagneMaintenant(env, campagne.id);
      if (!envoi.ok && !envoi.reseau) return annuler(places, `envoi refusé par Brevo : ${envoi.erreur}`);
      const fin = new Date().toISOString();
      for (const r of places) {
        await db.update(r.trace, envoi.ok
          ? { statut: 'envoye', envoyeLe: fin, campagneBrevo: campagne.id, listeBrevo: liste.id }
          : { statut: 'echec', erreur: `issue inconnue (réseau) : ${String(envoi.erreur ?? '').slice(0, 200)}`, campagneBrevo: campagne.id });
      }
      if (envoi.ok) bilan.envoyes += places.length;
      else bilan.echecs += places.length;
    }
  }

  const restants = Math.max(0, restantsAvant.length - lot.length);
  const statut = restants === 0 ? 'terminee' : 'enCours';
  await db.set(chemin, {
    statut,
    audience: audience.length,
    majLe: new Date().toISOString(),
    ...(campagneBrevo ? { derniereCampagneBrevo: campagneBrevo } : {}),
    ...(statut === 'terminee' ? { termineeLe: new Date().toISOString() } : {}),
  }, { merge: true });

  return {
    ok: true,
    mode: 'reel',
    campagne: d.id,
    audience: audience.length,
    dejaTraites: traitees.size,
    ...bilan,
    restants,
    plafondAtteint,
    statut,
    retraitsRepris: retraits.repris,
    ...(campagneBrevo ? { campagneBrevo } : {}),
  };
}
