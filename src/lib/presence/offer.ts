import type { AgencyPack, AgencyPlan, AgencyLeadStatus } from '../../types';
import { regimeDe, ventilerDepuisHT, type Ventilation } from '../tax/senegal';

/**
 * Grille tarifaire de l'offre « Digital Commerce Local » — SOURCE DE VÉRITÉ UNIQUE.
 *
 * Consommée par la page publique (`src/pages/PresenceDigitale.tsx`), le devis partageable
 * (`src/pages/PresenceDevis.tsx`) et la vue admin (`src/pages/admin/AdminAgencyLeads.tsx`).
 *
 * ⚠️ Cette offre n'est PAS Max-Morrys Agency. Elle vit sur `/presence-digitale` et cible les
 * commerces de proximité ; `/agence` porte la practice BUILD de MY ONOMA, high-ticket et sans
 * grille tarifaire publique. Voir `docs/AGENCY-POSITIONING.md §9`.
 *
 * ⚠️ Toute modification de montant doit être répercutée dans :
 *   - `CATALOGUE_REVISED_AT` ci-dessous (la date de relevé de TOUS les montants affichés)
 *   - `docs/OFFRE_AGENCE_TPE.md`        (référence commerciale)
 *   - `skills/commercial-kit/SKILL.md`  (mémoire des agents Sales)
 *   - `finance/model.py`                (projections 5 ans)
 *   - `worker/apps/site/src/prerender/static-pages.ts` (`/presence-digitale` : les cinq
 *     montants sont écrits en toutes lettres dans `description` ET `bodyText`, c'est-à-dire
 *     dans ce qu'un moteur lit. Ce miroir se déploie à la main, séparément du front.)
 *   - `android/app/src/main/java/me/maxmorrys/rysmo/ecrans/media/Commun.kt` (`TermesDeLOffre` :
 *     l'application native affiche le pack d'entrée, son prix et sa ventilation de taxe. Un
 *     module Gradle ne peut pas importer ce fichier ; ⭐ c'est le SEUL miroir de cette liste
 *     qui soit gardé — `tests/unit/natif-miroirs.test.ts` rougit si les deux divergent.)
 *
 * ⚠️ La ligne `functions/src/prerender.ts` a été retirée de cette liste : le répertoire
 * `functions/` n'existe plus depuis le 03/09/2026 et le prérendu vit dans le Worker. Un
 * pointeur mort envoie chercher le miroir au mauvais endroit — et le vrai reste non mis à jour.
 *
 * Montants en XOF (FCFA). Les libellés vivent dans les fichiers i18n `presence.json` :
 * ce module ne porte que des clés et des nombres, jamais de texte affichable.
 */

/** Nombre de puces de description dans l'i18n, par pack — évite un `returnObjects` non typé. */
export interface PackDefinition {
  /** Clé stable, alignée sur le type `AgencyPack` et sur les clés i18n `packs.<key>` */
  key: Exclude<AgencyPack, 'undecided'>;
  /** Prix public de la mise en place */
  price: number;
  /** Prix promotionnel de lancement, si applicable */
  promoPrice?: number;
  /** Prix plancher absolu — jamais affiché, sert de garde-fou au devis et à l'admin */
  floorPrice: number;
  /** Mise en avant : l'offre principale du catalogue */
  featured: boolean;
  /** Durée du support inclus, en jours */
  supportDays: number;
}

export interface PlanDefinition {
  /** Clé stable, alignée sur le type `AgencyPlan` et sur les clés i18n `plans.<key>` */
  key: Exclude<AgencyPlan, 'undecided' | 'aucun'>;
  /** Frais de mise en place de l'accompagnement */
  setupPrice: number;
  /** Abonnement mensuel */
  monthlyPrice: number;
  /** Durée d'engagement en mois, si l'offre en impose une */
  commitmentMonths?: number;
  featured: boolean;
}

export interface OptionDefinition {
  /** Clé i18n `options.<key>` */
  key: string;
  min: number;
  max: number;
  /** Unité de facturation — détermine le libellé affiché */
  unit: 'product' | 'page' | 'flat' | 'month';
}

/** Mise en place — paiement unique. */
/**
 * LA DATE DE RÉVISION DE LA GRILLE — elle fait partie des montants.
 *
 * `<Num>` exige un `asOf` : ces prix ne viennent pas d'une requête, ils sont écrits juste en
 * dessous. La date de leur dernière révision est donc le seul relevé honnête — `new Date()`
 * prétendrait que le prix a été vérifié à l'instant où la page s'affiche.
 *
 * ⚠️ ELLE VIT ICI, AU CONTACT DES MONTANTS, ET C'EST TOUT L'INTÉRÊT. Elle était déclarée dans
 * `PresenceDigitale.tsx` — un fichier qu'on n'ouvre pas pour changer un prix — et recopiée EN
 * TOUTES LETTRES dans l'encart de vérité de la même page, en français et en anglais. Trois
 * copies, dont deux en prose : le premier changement de prix aurait daté la grille d'un jour
 * où elle n'existait plus, dans l'encart qui sert précisément à établir la confiance. Ici,
 * changer un montant sans toucher la ligne au-dessus se voit dans le même diff.
 */
/*
 * ⚠️ MIDI UTC, PAS MINUIT — c'est une date de calendrier rangée dans un instant.
 * `new Date('2026-08-02')` est parsé en MINUIT UTC, et `<Num>` le rend dans le fuseau du
 * visiteur : à New York, la provenance annonçait « relevé du 01/08/2026 », une date à laquelle
 * la grille n'a pas été révisée. Midi décale le point de bascule de douze heures et rend la
 * bonne date de UTC-11 à UTC+11 — le fuseau de tout le public de cette offre, Amériques
 * comprises. La primitive `<Num>` formate sans `timeZone` et ne se règle pas d'ici ; l'encart
 * de vérité, lui, qui ÉCRIT cette date en toutes lettres, la formate explicitement en UTC.
 */
export const CATALOGUE_REVISED_AT = new Date('2026-08-02T12:00:00Z');

export const PACKS: PackDefinition[] = [
  { key: 'presence', price: 295_000, promoPrice: 250_000, floorPrice: 225_000, featured: false, supportDays: 30 },
  { key: 'visible', price: 495_000, floorPrice: 400_000, featured: true, supportDays: 30 },
  { key: 'boutique', price: 895_000, floorPrice: 700_000, featured: false, supportDays: 60 },
];

/** Accompagnement — mise en place + abonnement mensuel. */
export const PLANS: PlanDefinition[] = [
  { key: 'croissance', setupPrice: 375_000, monthlyPrice: 175_000, featured: true },
  { key: 'commerce360', setupPrice: 750_000, monthlyPrice: 225_000, commitmentMonths: 6, featured: false },
];

/** Options à la carte — fourchettes publiques, affichées repliées. */
export const OPTIONS: OptionDefinition[] = [
  { key: 'products', min: 1_000, max: 3_500, unit: 'product' },
  { key: 'pages', min: 35_000, max: 75_000, unit: 'page' },
  { key: 'tracking', min: 75_000, max: 350_000, unit: 'flat' },
  { key: 'automation', min: 125_000, max: 250_000, unit: 'flat' },
  { key: 'maintenance', min: 45_000, max: 75_000, unit: 'month' },
  { key: 'seo', min: 125_000, max: 300_000, unit: 'month' },
];

/** Nombre de puces par pack et par formule dans l'i18n — pilote les boucles de rendu. */
export const PACK_FEATURE_COUNT: Record<PackDefinition['key'], number> = {
  presence: 6,
  visible: 7,
  boutique: 7,
};

export const PLAN_FEATURE_COUNT: Record<PlanDefinition['key'], number> = {
  croissance: 6,
  commerce360: 6,
};

/** Étapes du process commercial — clés i18n `process.<key>`. */
export const PROCESS_STEPS = ['diagnostic', 'priorities', 'proof', 'contract', 'delivery'] as const;

/** Le parcours du commerçant — colonne vertébrale de la page. Clés i18n `journey.<key>`. */
export const JOURNEY_STEPS = ['found', 'present', 'convert', 'measure', 'engage'] as const;

/** Conditions commerciales — clés i18n `terms.items.<key>`. */
export const TERMS = [
  'payment', 'revisions', 'exclusions', 'extras', 'seoCommitment', 'humanReview', 'maintenance', 'ownership',
] as const;

/** Secteurs d'activité proposés au formulaire — clés i18n `form.sectors.<key>`. */
export const SECTOR_KEYS = [
  'restaurant', 'mode', 'beaute', 'sante', 'commerce', 'education', 'autre',
] as const;

export const PACK_KEYS: AgencyPack[] = ['presence', 'visible', 'boutique', 'undecided'];
export const PLAN_KEYS: AgencyPlan[] = ['croissance', 'commerce360', 'aucun', 'undecided'];

/**
 * Étapes du pipeline commercial, dans l'ordre d'avancement.
 * Partagé par la liste des prospects et par les analyses — une seule définition.
 */
export const PIPELINE_STAGES: AgencyLeadStatus[] = ['new', 'qualified', 'quoted', 'signed', 'lost'];

// ── Recherche par clé ────────────────────────────────────────────────────────

export function findPack(key: AgencyPack | undefined): PackDefinition | undefined {
  return PACKS.find((p) => p.key === key);
}

export function findPlan(key: AgencyPlan | undefined): PlanDefinition | undefined {
  return PLANS.find((p) => p.key === key);
}

/**
 * LE PRIX RÉELLEMENT PRATIQUÉ — l'unique chemin vers le montant d'un pack.
 *
 * Un pack porte DEUX montants : `price`, le prix de liste, et `promoPrice`, la promotion de
 * lancement quand elle existe. `docs/OFFRE_AGENCE_TPE.md` ligne 258 tranche lequel est
 * encaissé : « Présence Locale 295 000 / 225 000 (promo lancement 250 000) ». C'est
 * `promoPrice` qu'on facture, `price` qui se fait barrer.
 *
 * La page de l'offre l'avait compris et affichait 250 000 ; `computeTotals()` lisait `price`
 * et en annonçait 295 000 sur le devis ouvert derrière le même bouton. Le commerçant cliquait
 * sur un prix et recevait l'autre — sur la page dont la promesse tient en quatre mots : « les
 * prix sont affichés ». Les deux lectures passent désormais ici.
 *
 * Le barré reste une affaire d'affichage : il lit `promoPrice` et `price` séparément, parce
 * que montrer d'où vient la remise n'est pas la même chose que la facturer.
 */
export function packEffectivePrice(pack: PackDefinition): number {
  return pack.promoPrice ?? pack.price;
}

// ── Sélecteur « Trouvez votre pack en 3 questions » ───────────────────────────

/** Réponses possibles à chaque question. L'ordre définit l'ordre d'affichage. */
export const SELECTOR_QUESTIONS = [
  { key: 'site', options: ['none', 'outdated', 'working'] },
  { key: 'products', options: ['services', 'few', 'many', 'online'] },
  { key: 'publishing', options: ['nobody', 'myself', 'irregular'] },
] as const;

export type SelectorAnswers = {
  site?: 'none' | 'outdated' | 'working';
  products?: 'services' | 'few' | 'many' | 'online';
  publishing?: 'nobody' | 'myself' | 'irregular';
};

export interface Recommendation {
  pack: Exclude<AgencyPack, 'undecided'>;
  plan: Exclude<AgencyPlan, 'undecided'>;
  /** Clé i18n justifiant la recommandation — on explique toujours pourquoi. */
  reasonKey: string;
}

/**
 * Recommande UN pack et UNE formule à partir des trois réponses.
 *
 * Règles, dans cet ordre de priorité :
 *  1. Vouloir encaisser en ligne impose Boutique Digitale — rien d'autre ne le permet.
 *  2. Un catalogue fourni (> 20 réf.) justifie Commerce Visible, qui porte le catalogue Meta.
 *  3. Un site qui fonctionne déjà rend la mise en place lourde inutile : on vend
 *     l'accompagnement seul, sans refaire ce qui existe.
 *  4. Sinon, Présence Locale suffit à démarrer.
 *
 * La formule d'accompagnement suit la capacité à publier : personne aux commandes ou
 * publication irrégulière → Croissance Automatisée. Le commerçant qui publie lui-même
 * régulièrement n'a pas besoin qu'on le remplace.
 */
export function recommend(answers: SelectorAnswers): Recommendation | null {
  const { site, products, publishing } = answers;
  if (!site || !products || !publishing) return null;

  const needsHelp = publishing === 'nobody' || publishing === 'irregular';
  const plan: Recommendation['plan'] = needsHelp ? 'croissance' : 'aucun';

  if (products === 'online') {
    return { pack: 'boutique', plan: needsHelp ? 'commerce360' : 'aucun', reasonKey: 'online' };
  }
  if (products === 'many') {
    return { pack: 'visible', plan, reasonKey: 'many' };
  }
  if (site === 'working') {
    // Le site existe et tient la route : inutile de le refaire, on vend le pilotage.
    return { pack: 'presence', plan: 'croissance', reasonKey: 'working' };
  }
  if (site === 'outdated' || products === 'few') {
    return { pack: 'visible', plan, reasonKey: 'outdated' };
  }
  return { pack: 'presence', plan, reasonKey: 'starting' };
}

// ── Devis ─────────────────────────────────────────────────────────────────────

/** Validité commerciale d'un devis, en jours. */
export const QUOTE_VALIDITY_DAYS = 30;

const QUOTE_PREFIX = 'DV';

/**
 * Génère une référence de devis non devinable.
 *
 * Reprend le motif maison des certificats (`functions/src/certificates.ts` → `MM-XXXXXXXXXX`)
 * mais sur 12 caractères, car cette référence sert d'URL publique : ~2,8×10¹⁴ combinaisons,
 * hors de portée d'une énumération face aux quotas Firestore.
 */
export function generateQuoteRef(): string {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  return `${QUOTE_PREFIX}-${hex}`;
}

/** Valide la forme d'une référence avant toute lecture Firestore (évite un aller-retour inutile). */
export function isValidQuoteRef(ref: string): boolean {
  return /^DV-[0-9A-F]{12}$/.test(ref);
}

/**
 * ── LES DEUX MONTANTS NE S'ADDITIONNENT PAS À LA SIGNATURE ────────────────────────────────
 *
 * Le champ `upfront` valait `packPrice + planSetup` et portait le libellé « Total à la mise
 * en place », avec l'échéancier 60/40 calculé dessus. Cas réel produit par le sélecteur :
 * pack Boutique 895 000 + mise en place Commerce 360 750 000 = **1 645 000 F annoncés à la
 * signature**, avant 225 000/mois sur six mois d'engagement.
 *
 * Cela contredit les deux sources qui font autorité, et qui disent la même chose :
 *
 *   • `docs/OFFRE_AGENCE_TPE.md` ligne 4 — « Modèle : **setup-first** — mise en place vendue
 *     seule, accompagnement mensuel vendu ensuite », et ligne 149 : « Le moment décisif est
 *     **J+30**, à la fin du support inclus : c'est là que se joue la conversion vers
 *     l'accompagnement. » Le « 60 % à la commande / 40 % avant mise en ligne » porte sur la
 *     MISE EN PLACE, pas sur une facture qui contiendrait déjà l'abonnement.
 *   • La maquette `GrilleComplete` (`reference/screens-tpe.jsx`) — « Un pack se paie une
 *     fois. Un accompagnement se décide après la mise en ligne, jamais dans le même
 *     mouvement : additionner les deux au moment de la vente, c'est annoncer une facture de
 *     première année que la plupart des commerces ne peuvent pas financer. »
 *
 * D'où trois champs distincts au lieu d'un. Le total combiné n'a pas disparu — il sert au
 * pipeline commercial, où il est juste — mais il ne s'appelle plus « dû à la signature » et
 * n'est plus montré à un prospect.
 */
export interface QuoteTotals {
  /** Mise en place du pack retenu (0 si aucun pack) */
  packPrice: number;
  /** Frais de mise en place de l'accompagnement (0 si aucun) */
  planSetup: number;
  /** Abonnement mensuel (0 si aucun) */
  planMonthly: number;
  /**
   * DÛ À LA SIGNATURE — la mise en place du pack, et elle seule. C'est le montant sur lequel
   * porte l'échéancier 60/40, et le seul qu'un prospect voie annoncé comme exigible.
   */
  setupDue: number;
  /**
   * Valeur commerciale de l'affaire si l'accompagnement est pris : mise en place du pack +
   * mise en place de l'accompagnement. **Usage interne — pipeline et prévision.** Ne jamais
   * l'afficher à un prospect ni le passer à `depositAmount()` : ce n'est pas une échéance.
   */
  pipelineValue: number;
  /** Engagement en mois, si la formule en impose un */
  commitmentMonths?: number;
  /** Coût total sur la durée d'engagement, quand elle existe */
  commitmentTotal?: number;

  /*
   * ── LA TAXE ────────────────────────────────────────────────────────────────
   *
   * Tous les montants ci-dessus sont HORS TAXES. C'est ce que dit désormais l'article 5.1
   * des CGV — il annonçait « toutes taxes comprises » jusqu'au 03/09/2026, et cette
   * rédaction était en contradiction avec la façon dont les prix ont été fixés.
   *
   * Les deux ventilations qui suivent portent les montants RÉELLEMENT EXIGIBLES. Ce sont
   * elles qu'un prospect doit voir avant de valider, parce que l'article 5.1 l'exige
   * explicitement : « le montant total toutes taxes comprises est présenté avant la
   * validation de la commande ».
   */

  /** Ventilation du montant dû à la signature. `ttc` est ce que le client paie. */
  setupDueTax: Ventilation;
  /** Ventilation de l'abonnement mensuel. `ttc` est ce qui sera prélevé chaque mois. */
  monthlyTax: Ventilation;
}

/** Calcule les montants d'un devis. Un pack et/ou une formule peuvent être absents. */
export function computeTotals(pack: AgencyPack, plan: AgencyPlan): QuoteTotals {
  const p = findPack(pack);
  const a = findPlan(plan);

  // `packEffectivePrice` et non `p.price` : le devis, le message WhatsApp, la fiche prospect
  // et l'acompte 60/40 doivent tous porter le montant que la page a annoncé.
  const packPrice = p ? packEffectivePrice(p) : 0;
  const planSetup = a?.setupPrice ?? 0;
  const planMonthly = a?.monthlyPrice ?? 0;

  const setupDue = packPrice;
  const pipelineValue = packPrice + planSetup;

  const commitmentMonths = a?.commitmentMonths;
  const commitmentTotal = commitmentMonths
    ? planSetup + planMonthly * commitmentMonths
    : undefined;

  /*
   * L'offre agence est assujettie au taux normal. Le régime vit dans `REGIME.agence` et
   * nulle part ailleurs : l'affichage, le devis, le message WhatsApp et la facture lisent
   * tous cette même table, exactement comme `packEffectivePrice` est la seule source du
   * prix affiché. Deux sources de taux divergeraient au premier changement de taux.
   */
  const regime = regimeDe('agence');

  return {
    packPrice,
    planSetup,
    planMonthly,
    setupDue,
    pipelineValue,
    commitmentMonths,
    commitmentTotal,
    setupDueTax: ventilerDepuisHT(setupDue, regime),
    monthlyTax: ventilerDepuisHT(planMonthly, regime),
  };
}

/**
 * Échéancier du kit : 60 % à la commande, 40 % avant mise en ligne.
 * Il porte sur `setupDue` — la mise en place du pack — et sur rien d'autre. Lui passer
 * `pipelineValue` remettrait l'abonnement dans l'acompte.
 */
export const DEPOSIT_RATE = 0.6;

export function depositAmount(setupDue: number): number {
  return Math.round(setupDue * DEPOSIT_RATE);
}

export function balanceAmount(setupDue: number): number {
  return setupDue - depositAmount(setupDue);
}
