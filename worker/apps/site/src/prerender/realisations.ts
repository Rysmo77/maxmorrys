import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../constants';
import { enPath } from './segments';
import type { PageMeta } from './types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES FICHES DE RÉALISATION — `/conception/realisations/:slug`.
 *
 * `routes.ts` envoie ce préfixe au pré-rendu ; sans producteur, les onze fiches
 * tomberaient dans `unknownRouteMeta` : `noindex, nofollow`, sous le titre et l'image de
 * la page d'accueil. C'est le défaut exact qu'avaient les questions de la FAQ et les
 * certificats avant `faq.ts` et `certificat.ts` — une route routée sans rien au bout.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UNE COPIE, ET PAS UN IMPORT.
 *
 * La source est `src/lib/brand/clients.ts`, un module TypeScript de l'application. Le
 * Worker ne peut pas importer le code du frontend — c'est la même contrainte qui a produit
 * `prerender/segments.ts` et `SOCIAL_URLS`. La donnée est donc recopiée, et la copie est
 * tenue par `test/realisations.test.ts`, qui compare champ par champ.
 *
 * ⚠️ CE QUI N'EST PAS RECOPIÉ, ET C'EST VOULU. Les descriptions rédigées vivent en i18n
 * (`realisations.projects.<slug>.description`), donc hors de portée d'ici. Le corps
 * pré-rendu est construit des seuls FAITS que `clients.ts` établit : le nom, le secteur, le
 * rôle tenu, la pile et le domaine en ligne.
 *
 * ⛔ NI DURÉE NI RÉSULTAT. `duration` et `outcome` existent dans la source, vides sur les
 * onze projets : l'accord de publication couvre le nom, le rôle, la pile et le lien, et
 * exclut « aucun résultat, aucun chiffre de croissance ». Rien ici ne doit les inventer —
 * une fiche de portfolio est exactement l'endroit où la tentation est la plus forte.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Miroir de `ClientCapability` (`src/lib/brand/clients.ts`). */
export type Capability =
  | 'productStrategy'
  | 'productDesign'
  | 'uxui'
  | 'engineering'
  | 'platformArchitecture'
  | 'designSystem'
  | 'aiAutomation'
  | 'securityRules'
  | 'seo';

export interface Realisation {
  slug: string;
  name: string;
  /** Secteur, stocké en français dans la source. */
  category: string;
  /** Domaine affiché, sans protocole. */
  domain: string;
  /** Rôle réellement tenu — absent quand le dépôt ne l'établit pas. */
  capabilities?: readonly Capability[];
  /** Pile vérifiable, lue dans les dépôts. Absente quand elle n'est pas documentée. */
  stack?: readonly string[];
}

/** Miroir de `clientProjects`, dans l'ordre de la source. */
export const REALISATIONS: readonly Realisation[] = [
  {
    slug: 'amour-divin',
    name: 'Amour Divin',
    category: 'Consumer Product',
    domain: 'amourdivin.app',
    capabilities: [
      'productStrategy',
      'productDesign',
      'uxui',
      'engineering',
      'platformArchitecture',
      'designSystem',
      'securityRules',
    ],
    stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Firebase',
      'Cloudflare Workers',
      'Cloudflare R2',
    ],
  },
  {
    slug: 'khanouss',
    name: 'Khanouss',
    category: 'E-commerce',
    domain: 'khanouss.shop',
    capabilities: ['engineering'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Framer Motion', 'Zustand', 'React Router'],
  },
  {
    slug: 'loma',
    name: 'Loma',
    category: 'E-commerce',
    domain: 'loma-plateforme.web.app',
    capabilities: ['engineering', 'securityRules'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Zustand', 'React Router'],
  },
  {
    slug: 'holycash',
    name: 'HolyCash',
    category: 'Fintech',
    domain: 'holycash.net',
    capabilities: ['engineering', 'securityRules'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Framer Motion', 'TanStack Query', 'React Router'],
  },
  {
    slug: 'english-lab',
    name: 'English Lab',
    category: 'Éducation',
    domain: 'yessienglish.com',
    capabilities: ['engineering'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Firebase', 'React Router'],
  },
  {
    slug: 'klio-pro',
    name: 'Klio Pro',
    category: 'Éducation',
    domain: 'kliopro.com',
    capabilities: ['engineering', 'securityRules', 'platformArchitecture'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Firebase Admin', 'Resend', 'Recharts'],
  },
  {
    slug: 'resho-konnexion',
    name: 'ResHo Konnexion',
    category: 'Communauté',
    domain: 'resho.vasesdhonneursenegal.com',
    capabilities: ['engineering', 'securityRules'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Firebase Admin'],
  },
  {
    slug: 'je-temoigne',
    name: 'Je Témoigne',
    category: 'Communauté',
    domain: 'temoignage.vasesdhonneursenegal.com',
    capabilities: ['engineering', 'securityRules', 'platformArchitecture'],
    stack: ['React', 'Vite', 'TypeScript', 'Firebase', 'Firebase Admin', 'React Router'],
  },
  {
    slug: 'lauraverse',
    name: 'LauraVerse',
    category: 'Média',
    domain: 'lauraverse.blog',
    capabilities: ['engineering', 'securityRules', 'platformArchitecture'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Firebase Admin'],
  },
  {
    slug: 'dunamis-holydays',
    name: 'Dunamis Holydays',
    category: 'Événementiel',
    domain: 'holydays.vasesdhonneursenegal.com',
    capabilities: ['engineering', 'securityRules'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Firebase Hosting'],
  },
  {
    slug: 'in-senegal',
    name: 'IN Sénégal 2026',
    category: 'Événementiel',
    domain: 'insenegal.web.app',
    capabilities: ['engineering'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Firebase Hosting'],
  },
];

/**
 * Les rôles, en toutes lettres.
 *
 * ⚠️ Ce sont les libellés que porte l'i18n (`realisations.capabilities.<clé>`), recopiés :
 * le corps pré-rendu ne peut pas lire un catalogue de traduction. Ils décrivent un rôle,
 * pas un résultat — c'est précisément ce que l'accord de publication autorise.
 */
const CAPABILITY_LABELS: Record<Capability, string> = {
  productStrategy: 'stratégie produit',
  productDesign: 'conception produit',
  uxui: 'UX et interface',
  engineering: 'développement',
  platformArchitecture: 'architecture de plateforme',
  designSystem: 'système de design',
  aiAutomation: 'IA et automatisation',
  securityRules: 'règles de sécurité',
  seo: 'référencement',
};

const BY_SLUG = new Map(REALISATIONS.map((item) => [item.slug, item]));

function labels(project: Realisation): string[] {
  return (project.capabilities ?? []).map((key) => CAPABILITY_LABELS[key]);
}

/** « a, b et c » — une énumération lisible, pas une liste à puces aplatie. */
function enumerate(items: readonly string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

/**
 * La méta d'une fiche, ou `null` si le slug n'existe pas.
 *
 * `null` compte : l'appelant retombe alors sur `unknownRouteMeta`, donc sur un `noindex`.
 * Une adresse de fiche inventée ne doit pas produire une page indexable sous le titre du
 * site — c'est ce que faisait l'origine avant ce module.
 */
export function getRealisationMeta(slug: string, lang: 'fr' | 'en'): PageMeta | null {
  const project = BY_SLUG.get(slug);
  if (!project) return null;

  const roles = labels(project);
  const stack = project.stack ?? [];
  const frUrl = `${SITE_URL}/conception/realisations/${project.slug}`;
  const enUrl = `${SITE_URL}${enPath(`/conception/realisations/${project.slug}`)}`;

  /*
   * La description tient sous les deux cents caractères que Google affiche : le rôle y est
   * tronqué à deux éléments et la pile à trois, le corps porte les listes entières. Un
   * extrait coupé au milieu d'un mot vaut moins qu'une phrase complète.
   *
   * ⚠️ Les bornes ne sont pas décoratives : quatre des onze projets vivent sous un
   * sous-domaine de `vasesdhonneursenegal.com`, qui coûte à lui seul trente-quatre
   * caractères. `test/realisations.test.ts` mesure les onze.
   */
  const shortRoles = enumerate(roles.slice(0, 2));
  const shortStack = stack.slice(0, 3).join(', ');

  return {
    title: `${project.name} — ${project.category} | ${SITE_NAME}`,
    description:
      `${project.name} — ${project.category}.` +
      (shortRoles ? ` Rôle tenu : ${shortRoles}.` : '') +
      (shortStack ? ` Pile : ${shortStack}.` : '') +
      ` Produit du client, en ligne sur ${project.domain}.`,
    ogType: 'website',
    // `withShareImage` y substitue la carte générée. Aucune capture d'écran n'est déclarée :
    // l'accord de publication ne couvre pas les visuels du produit.
    ogImage: DEFAULT_OG_IMAGE,
    canonical: lang === 'en' ? enUrl : frUrl,
    h1: project.name,
    bodyText:
      `${project.name} — ${project.category}. Le produit appartient à son client ; il est en ligne sur ${project.domain}.\n\n` +
      (roles.length > 0
        ? `Rôle réellement tenu par le studio : ${enumerate(roles)}.\n\n`
        : "Le détail du rôle tenu n'est pas documenté publiquement pour ce projet, et n'est donc pas revendiqué ici.\n\n") +
      (stack.length > 0 ? `Pile logicielle employée : ${stack.join(', ')}.\n\n` : '') +
      "Cette fiche est publiée dans les limites de l'autorisation écrite du client : le nom, le rôle, la pile et le lien. Aucun résultat commercial, aucun chiffre de croissance et aucun témoignage n'y figurent — l'accord ne les couvre pas.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Conception', url: `${SITE_URL}/conception` },
      { name: 'Réalisations', url: `${SITE_URL}/conception/realisations` },
      { name: project.name, url: frUrl },
    ],
    lang,
    altFr: frUrl,
    altEn: enUrl,
  };
}
