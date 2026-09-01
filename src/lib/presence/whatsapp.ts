import { computeTotals, depositAmount, findPack, findPlan } from './offer';
import { WHATSAPP_BASE_URL } from '../../components/seo/seo-config';
import type { AgencyPack, AgencyPlan } from '../../types';

/**
 * Construit une URL wa.me, avec message pré-rempli optionnel.
 * Le numéro vient de `seo-config` — jamais de littéral ici ni ailleurs.
 */
export function whatsappUrl(message?: string): string {
  return message
    ? `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`
    : WHATSAPP_BASE_URL;
}

/**
 * Longueur maximale du message libre repris dans le récapitulatif.
 *
 * Les URL `wa.me` deviennent instables au-delà d'environ 2 000 caractères une fois
 * encodées — et les accents comptent triple en `encodeURIComponent`. On borne donc
 * la seule partie non maîtrisée : ce que le prospect a saisi.
 */
const MAX_QUOTE_EXCERPT = 300;

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Libellés injectés par l'appelant, déjà traduits et déjà formatés. */
export interface WhatsAppMessageLabels {
  /** « Bonjour Max-Morrys 👋 » */
  greeting: string;
  /** « Je viens de remplir ma demande sur ta page Agence. » */
  intro: string;
  /** Nom du pack retenu, ou undefined */
  packName?: string;
  /** Nom de la formule retenue, ou undefined */
  planName?: string;
  /** Libellé du secteur d'activité */
  sectorLabel?: string;
  /** « puis {{price}} par mois » — déjà interpolé */
  monthlySuffix?: string;
  /** « Total mise en place » */
  upfrontLabel: string;
  /** « 60% à la commande » */
  depositLabel: string;
  /** « Mon récap » */
  quoteLabel: string;
}

export interface WhatsAppMessageInput {
  businessName: string;
  city: string;
  pack: AgencyPack;
  plan: AgencyPlan;
  /** Message libre saisi par le prospect */
  message?: string;
  /** URL absolue du récapitulatif partageable */
  quoteUrl?: string;
  /** Formateur de montant fourni par l'appelant (locale-aware) */
  formatPrice: (n: number) => string;
  labels: WhatsAppMessageLabels;
}

/**
 * Compose le message pré-rempli qui ouvre la conversation WhatsApp.
 *
 * Fonction pure : aucun accès au DOM, aucun état. Tous les montants proviennent de
 * `computeTotals` / `depositAmount` — jamais recalculés ici, sous peine de diverger
 * de la grille tarifaire.
 *
 * Chaque bloc est omis proprement quand sa donnée est absente : un prospect qui n'a
 * choisi ni pack ni accompagnement obtient un message court mais cohérent, sans
 * ligne vide ni « undefined ».
 */
export function buildWhatsAppMessage(input: WhatsAppMessageInput): string {
  const { businessName, city, pack, plan, message, quoteUrl, formatPrice, labels } = input;
  const totals = computeTotals(pack, plan);
  const lines: string[] = [labels.greeting, '', labels.intro, ''];

  // Identité du commerce
  const identity = [businessName.trim(), city.trim()].filter(Boolean).join(' — ');
  if (identity) lines.push(`🏪 ${identity}`);
  if (labels.sectorLabel) lines.push(`🛍️ ${labels.sectorLabel}`);
  if (identity || labels.sectorLabel) lines.push('');

  // Offre retenue
  if (findPack(pack) && labels.packName) {
    lines.push(`📦 ${labels.packName} — ${formatPrice(totals.packPrice)}`);
  }
  if (findPlan(plan) && labels.planName) {
    const monthly = labels.monthlySuffix ? ` ${labels.monthlySuffix}` : '';
    lines.push(`🔁 ${labels.planName} — ${formatPrice(totals.planSetup)}${monthly}`);
  }

  /* Montants — seulement s'il y a quelque chose à payer, et JAMAIS la somme des deux.
     Ce message part au prospect : il annonce la mise en place, qui est ce qui se signe
     maintenant. L'accompagnement est déjà listé au-dessus avec sa propre mise en place et son
     mensuel ; l'additionner ici annoncerait une facture de première année que le modèle
     setup-first ne demande pas (`docs/OFFRE_AGENCE_TPE.md` § 4 et § 149). */
  if (totals.setupDue > 0) {
    lines.push(
      `💰 ${labels.upfrontLabel} : ${formatPrice(totals.setupDue)} ` +
      `(${labels.depositLabel} : ${formatPrice(depositAmount(totals.setupDue))})`,
    );
  }
  if (findPack(pack) || findPlan(plan)) lines.push('');

  if (quoteUrl) {
    lines.push(`📄 ${labels.quoteLabel} : ${quoteUrl}`, '');
  }

  if (message?.trim()) {
    lines.push(`« ${truncate(message, MAX_QUOTE_EXCERPT)} »`);
  }

  // Normalise : jamais plus d'une ligne vide d'affilée, jamais de blanc terminal.
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Message court pour les boutons « En parler sur WhatsApp » posés sur les cartes.
 * Le prospect n'a rien rempli : on ne transmet que le contexte du clic.
 */
export function buildQuickMessage(intro: string, offerName: string, price: string): string {
  return `${intro}\n\n📦 ${offerName} — ${price}`;
}
