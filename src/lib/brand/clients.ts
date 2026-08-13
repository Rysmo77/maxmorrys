/**
 * CLIENT WORK — produits construits pour des tiers.
 *
 * Séparation absolue avec `ventures.ts`. Un projet client n'appartient pas à MY ONOMA :
 * `owner` est le client, et seul un `role` est revendiqué. Aucune surface de l'application
 * ne doit mélanger les deux listes dans une même grille.
 *
 * ⚠️ Interdiction stricte : aucune donnée confidentielle, aucun secret métier, aucune
 * métrique non publique, aucune donnée utilisateur, aucune information contractuelle.
 * Tout ce qui figure ici est vérifiable publiquement.
 *
 * ⚠️ La publication d'une étude de cas suppose l'accord écrit du client — non obtenu à ce
 * jour. Voir `docs/CONTENT-TODO.md §5`.
 *
 * Miroir de `My-onoma/apps/web/src/lib/brand/clients.ts`.
 */

/** Capabilities mobilisables sur une mission. Clés i18n sous `work.capabilities.<key>`. */
export type ClientCapability =
  | 'productStrategy'
  | 'productDesign'
  | 'uxui'
  | 'engineering'
  | 'platformArchitecture'
  | 'designSystem'
  | 'aiAutomation'
  | 'securityRules'
  | 'seo';

export interface ClientProject {
  slug: string;
  name: string;
  /** Secteur ou catégorie produit. */
  category: string;
  /** Le client détient le produit. Jamais MY ONOMA, jamais Max-Morrys. */
  owner: 'client';
  website: string;
  /** Domaine affiché, sans protocole. */
  domain: string;
  /**
   * Capabilities mobilisées sur la mission.
   *
   * ⚠️ **Optionnel à dessein.** Le dépôt n'établit le rôle tenu que pour Amour Divin. Pour les
   * plateformes reprises de la page À propos, rien ne documente le détail des capabilities :
   * plutôt que de les inventer, le champ reste absent et la carte n'affiche pas le bloc.
   */
  capabilities?: readonly ClientCapability[];
  /** Stack réellement employée, vérifiable. Absente quand elle n'est pas documentée. */
  stack?: readonly string[];
  /**
   * Clé i18n de la description, sous `work.projects.<slug>.description` du namespace `agency`.
   * Absente quand aucune description validée n'existe.
   */
  descriptionKey?: string;
}

/**
 * Mention affichée sur les cartes client, en opposition à `VENTURE_RELATION`.
 * Les deux ne doivent jamais apparaître dans une même grille.
 */
export const CLIENT_RELATION = 'Client product';

export const clientProjects: readonly ClientProject[] = [
  {
    slug: 'amour-divin',
    name: 'Amour Divin',
    category: 'Consumer Product',
    owner: 'client',
    website: 'https://amourdivin.app',
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

  /*
   * Projets clients établis depuis leurs dépôts git (13 août 2026).
   *
   * ⚠️ RÈGLE DE DÉDUCTION — à respecter si de nouveaux projets sont ajoutés.
   * `stack` est lue dans les `package.json`, lockfiles et configs : c'est du vérifiable.
   * `capabilities` n'est posée que sur PREUVE dans le dépôt :
   *
   *   code applicatif                       → engineering
   *   firestore.rules                       → securityRules
   *   Worker Cloudflare ou monodépôt        → platformArchitecture
   *   dépendance LLM déclarée               → aiAutomation
   *
   * ⚠️ `productStrategy`, `productDesign`, `uxui` et `designSystem` NE SE DÉDUISENT PAS
   * d'un package.json. Elles restent absentes tant que rien ne les établit — ne pas les
   * ajouter au jugé. Voir `docs/CONTENT-TODO.md §5`.
   *
   * ⚠️ STEPS Magazine (stepsmag.com) ne figure PAS ici : il est détenu et opéré par
   * MY ONOMA SARL et vit dans `ventures.ts`. L'y ajouter le ferait apparaître deux fois
   * sur `/agence` avec deux relations contradictoires. Voir `docs/CONTENT-TODO.md §3`.
   *
   * ⚠️ Eyone Medical a été RETIRÉ : c'est l'employeur de Max-Morrys, pas un client.
   * Ne pas le réintroduire ici.
   */
  {
    slug: 'khanouss',
    name: 'Khanouss',
    category: 'E-commerce',
    owner: 'client',
    website: 'https://khanouss.shop/',
    domain: 'khanouss.shop',
    descriptionKey: 'khanouss',
    capabilities: ['engineering'],
    // Seul projet du lot sur Supabase plutôt que Firebase.
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Framer Motion', 'Zustand', 'React Router'],
  },
  {
    slug: 'loma',
    name: 'Loma',
    category: 'E-commerce',
    owner: 'client',
    website: 'https://loma-plateforme.web.app/',
    domain: 'loma-plateforme.web.app',
    descriptionKey: 'loma',
    capabilities: ['engineering', 'securityRules'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Zustand', 'React Router'],
  },
  {
    slug: 'holycash',
    name: 'HolyCash',
    category: 'Fintech',
    owner: 'client',
    website: 'https://holycash.net/',
    domain: 'holycash.net',
    descriptionKey: 'holycash',
    capabilities: ['engineering', 'securityRules'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Framer Motion', 'TanStack Query', 'React Router'],
  },
  {
    slug: 'english-lab',
    name: 'English Lab',
    category: 'Éducation',
    owner: 'client',
    website: 'https://yessienglish.com/',
    domain: 'yessienglish.com',
    descriptionKey: 'english-lab',
    capabilities: ['engineering'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Firebase', 'React Router'],
  },
  {
    slug: 'klio-pro',
    name: 'Klio Pro',
    category: 'Éducation',
    owner: 'client',
    website: 'https://kliopro.com/',
    domain: 'kliopro.com',
    descriptionKey: 'klio-pro',
    capabilities: ['engineering', 'securityRules', 'platformArchitecture'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Firebase Admin', 'Resend', 'Recharts'],
  },
  {
    slug: 'resho-konnexion',
    name: 'ResHo Konnexion',
    category: 'Communauté',
    owner: 'client',
    website: 'https://resho.vasesdhonneursenegal.com/',
    domain: 'resho.vasesdhonneursenegal.com',
    descriptionKey: 'resho-konnexion',
    capabilities: ['engineering', 'securityRules'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Firebase Admin'],
  },
  {
    slug: 'je-temoigne',
    name: 'Je Témoigne',
    category: 'Communauté',
    owner: 'client',
    website: 'https://temoignage.vasesdhonneursenegal.com/',
    domain: 'temoignage.vasesdhonneursenegal.com',
    descriptionKey: 'je-temoigne',
    capabilities: ['engineering', 'securityRules', 'platformArchitecture'],
    stack: ['React', 'Vite', 'TypeScript', 'Firebase', 'Firebase Admin', 'React Router'],
  },
  {
    slug: 'lauraverse',
    name: 'LauraVerse',
    category: 'Média',
    owner: 'client',
    // ⚠️ Domaine déduit du sous-domaine `img.lauraverse.blog` trouvé dans le dépôt,
    // pas d'une URL canonique. À confirmer.
    website: 'https://lauraverse.blog/',
    domain: 'lauraverse.blog',
    descriptionKey: 'lauraverse',
    capabilities: ['engineering', 'securityRules', 'platformArchitecture'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Firebase Admin'],
  },
  {
    slug: 'dunamis-holydays',
    name: 'Dunamis Holydays',
    category: 'Événementiel',
    owner: 'client',
    website: 'https://holydays.vasesdhonneursenegal.com/',
    domain: 'holydays.vasesdhonneursenegal.com',
    descriptionKey: 'dunamis-holydays',
    capabilities: ['engineering', 'securityRules'],
    // Site statique : aucun package.json dans le dépôt.
    stack: ['HTML', 'CSS', 'JavaScript', 'Firebase Hosting'],
  },
  {
    slug: 'jubile-de-grace',
    name: 'Jubilé de Grâce',
    category: 'Événementiel',
    owner: 'client',
    website: 'https://jubile-de-grace.com/',
    domain: 'jubile-de-grace.com',
    descriptionKey: 'jubile-de-grace',
    capabilities: ['engineering'],
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS'],
  },
  {
    slug: 'in-senegal',
    name: 'IN Sénégal 2026',
    category: 'Événementiel',
    owner: 'client',
    website: 'https://insenegal.web.app/',
    domain: 'insenegal.web.app',
    descriptionKey: 'in-senegal',
    capabilities: ['engineering'],
    // Site statique : aucun package.json dans le dépôt.
    stack: ['HTML', 'CSS', 'JavaScript', 'Firebase Hosting'],
  },
];

/** Retrouve un projet client par son slug. */
export function getClientProject(slug: string): ClientProject | undefined {
  return clientProjects.find((p) => p.slug === slug);
}

/**
 * Convertit une `category` (stockée en français) en clé i18n stable,
 * sous `work.categories.<clé>` du namespace `agency`.
 *
 * Les catégories vivent en clair dans les données parce qu'elles décrivent un marché ;
 * l'affichage passe par i18n plutôt que par le service de traduction à l'exécution,
 * pour que la barre de filtres ne dépende pas d'un appel réseau.
 *
 * « Événementiel » → « evenementiel » · « E-commerce » → « e-commerce »
 */
export function categoryKey(category: string): string {
  return category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/** Catégories réellement présentes, dans l'ordre d'apparition. */
export const clientCategories: readonly string[] = Array.from(
  new Set(clientProjects.map((p) => p.category)),
);
