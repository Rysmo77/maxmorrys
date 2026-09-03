import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import * as DS from './email-design';
import { sendEmail } from './email';
import { estAEcheance } from './renewal';
import { asText } from './values';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA RELANCE DE DEVIS — un devis expirait en silence.
 *
 * Les devis Présence Digitale portent une validité de 30 jours, écrite sur le document et
 * affichée au prospect. Personne n'était prévenu de sa fin : le devis se périmait tout seul,
 * et le commerçant qui rouvrait son lien trois semaines plus tard découvrait une échéance
 * dont il n'avait plus le souvenir.
 *
 * C'est la relance la plus légitime que ce produit puisse écrire : elle porte une échéance
 * RÉELLE, elle vise la seule offre high-ticket qui encaisse, et elle s'adresse à quelqu'un
 * qui a demandé un prix de lui-même. Rien à inventer, rien à promettre.
 *
 * ⚠️ L'ADRESSE N'EST PAS SUR LE DEVIS, ET C'EST VOULU. `agency_quotes` est lisible par
 * quiconque a le lien : il ne porte donc AUCUNE donnée de contact (voir `saveAgencyLead`, qui
 * énumère ses champs un par un précisément pour ça). Le couple se refait ici, côté serveur,
 * via `agency_leads` — admin-only — et sa clé `quoteRef`.
 *
 * ⚠️ BEAUCOUP DE PROSPECTS N'ONT PAS D'ADRESSE. `AgencyLead.email` est optionnel : l'ICP de
 * cette offre traite son commerce sur WhatsApp, et le formulaire n'exige que le téléphone.
 * Ceux-là sont COMPTÉS et journalisés, jamais relancés en silence par un autre canal — le
 * produit ne sait pas envoyer de WhatsApp automatiquement, et prétendre le contraire serait
 * la faute habituelle. Le bilan dit combien ils sont : c'est le chiffre qui justifierait
 * d'ouvrir ce canal un jour.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Préavis avant l'expiration d'un devis. Un devis vaut 30 jours ; une semaine laisse agir. */
export const PREAVIS_DEVIS_JOURS = 7;

type Langue = 'fr' | 'en';

const T = {
  fr: {
    sujet: (ref: string) => `Ton devis ${ref} expire dans ${PREAVIS_DEVIS_JOURS} jours`,
    apercu: 'Le tarif de ton devis est garanti jusqu’à cette date.',
    surTitre: 'Devis bientôt échu',
    titre: 'Encore une semaine',
    bonjour: (nom: string) => (nom ? `Bonjour ${nom},` : 'Bonjour,'),
    intro: (commerce: string) =>
      `Le devis établi pour ${commerce} arrive à échéance. Passé cette date, la grille de prix peut changer — d’ici là, celle de ton devis reste garantie.`,
    ref: 'Référence',
    echeance: 'Valable jusqu’au',
    bouton: 'Revoir mon devis',
    apres: 'Si tu veux ajuster le pack ou poser une question, réponds simplement sur WhatsApp.',
    pied: 'Tu reçois ce message parce que tu as demandé un devis sur maxmorrys.me.',
  },
  en: {
    sujet: (ref: string) => `Your quote ${ref} expires in ${PREAVIS_DEVIS_JOURS} days`,
    apercu: 'The price on your quote is held until that date.',
    surTitre: 'Quote expiring',
    titre: 'One week left',
    bonjour: (nom: string) => (nom ? `Hello ${nom},` : 'Hello,'),
    intro: (commerce: string) =>
      `The quote drawn up for ${commerce} is about to expire. After that date the price list may change — until then, the one on your quote is held.`,
    ref: 'Reference',
    echeance: 'Valid until',
    bouton: 'Review my quote',
    apres: 'If you want to adjust the pack or ask a question, just reply on WhatsApp.',
    pied: 'You are receiving this because you requested a quote on maxmorrys.me.',
  },
} as const;

export function buildQuoteExpiryNotice(
  quote: { ref: string; commerce: string; echeance: string },
  contactNom: string,
  langue: Langue,
  baseUrl: string,
): { subject: string; html: string; text: string } {
  const t = T[langue];
  const lien = `${baseUrl}${langue === 'en' ? '/en' : ''}/presence-digitale/devis/${quote.ref}`;

  const contenu = [
    DS.surTitre(t.surTitre),
    DS.titre(t.titre),
    DS.paragraphe(t.bonjour(contactNom)),
    DS.paragraphe(t.intro(quote.commerce)),
    DS.lignes([[t.ref, quote.ref], [t.echeance, quote.echeance]]),
    DS.bouton(t.bouton, lien),
    DS.filet(),
    DS.paragraphe(t.apres, true),
  ].join('');

  const text = [
    t.bonjour(contactNom), '', t.intro(quote.commerce), '',
    `${t.ref} : ${quote.ref}`, `${t.echeance} : ${quote.echeance}`, '',
    lien, '', t.apres,
  ].join('\n');

  return { subject: t.sujet(quote.ref), html: DS.page({ langue, apercu: t.apercu, contenu, pied: [t.pied] }), text };
}

export interface BilanDevis {
  envoyes: number;
  echecs: number;
  /** Devis à échéance dont le prospect n'a laissé aucune adresse — donc injoignables ici. */
  sansAdresse: number;
  examines: number;
}

/** Formate une date d'échéance dans la convention de la langue. */
function dateLisible(iso: string, langue: Langue): string {
  const d = new Date(iso);
  const j = d.getUTCDate();
  const m = d.getUTCMonth() + 1;
  const a = d.getUTCFullYear();
  return langue === 'fr'
    ? `${j}/${String(m).padStart(2, '0')}/${a}`
    : `${String(m).padStart(2, '0')}/${j}/${a}`;
}

export async function sendQuoteExpiryNotices(db: Firestore, env: Env): Promise<BilanDevis> {
  const maintenant = new Date();
  const devis = await db.query({ collection: 'agency_quotes', limit: 500 });

  const bilan: BilanDevis = { envoyes: 0, echecs: 0, sansAdresse: 0, examines: devis.length };

  for (const doc of devis) {
    const expiresAt = asText(doc.data.expiresAt);
    if (!expiresAt || !estAEcheance(expiresAt, maintenant, PREAVIS_DEVIS_JOURS)) continue;

    /* Idempotence portée par la DATE d'échéance visée, jamais par un booléen : un devis
       réémis pour la même affaire garde ainsi son droit à une relance. */
    if (asText(doc.data.expiryNoticeFor) === expiresAt) continue;

    const leads = await db.query({
      collection: 'agency_leads',
      where: [{ field: 'quoteRef', op: '==', value: doc.id }],
      limit: 1,
    });
    const email = asText(leads[0]?.data.email);
    if (!email) { bilan.sansAdresse += 1; continue; }

    const langue: Langue = asText(doc.data.locale) === 'en' ? 'en' : 'fr';
    const notice = buildQuoteExpiryNotice(
      {
        ref: doc.id,
        commerce: asText(doc.data.businessName) ?? '',
        echeance: dateLisible(expiresAt, langue),
      },
      asText(leads[0]?.data.contactName) ?? '',
      langue,
      env.APP_BASE_URL,
    );

    const envoi = await sendEmail(env, { to: email, ...notice });
    if (envoi.sent) {
      await db.update(`agency_quotes/${doc.id}`, { expiryNoticeFor: expiresAt });
      bilan.envoyes += 1;
    } else {
      /* Marqueur non posé : la passe du lendemain ne réessaiera pas, la fenêtre étant d'un
         jour exact. C'est assumé — un devis relancé à J-6 en disant « dans 7 jours » mentirait. */
      console.error('Relance de devis non envoyée pour', doc.id, '—', envoi.error);
      bilan.echecs += 1;
    }
  }

  return bilan;
}
