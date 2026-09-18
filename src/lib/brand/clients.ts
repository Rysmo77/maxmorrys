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
 *
 * ⚠️ ÉCART ASSUMÉ AVEC LE MIROIR (14/09/2026) : `duration`, `outcome`, `ClientEvidence` et les
 * deux listes `CLIENT_PUBLICATION_*` n'existent pas côté My-onoma. Ce sont des STRUCTURES, pas
 * des données — aucune valeur nouvelle n'est entrée dans ce fichier. Elles servent la fiche
 * `/conception/realisations/:slug` demandée par le CDC du 14/09/2026 §4.2 ; sur une divergence
 * de donnée corporate, My-onoma fait toujours foi.
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
   * Clé i18n de la description, sous `projects.<slug>.description` du namespace
   * `realisations`. Absente quand aucune description validée n'existe.
   *
   * ⚠️ Elle vivait sous `work.projects.<slug>.description` du namespace `agency`, supprimé
   * avec `/agence` le 17/09/2026. Le préfixe `work.` est parti avec lui : le namespace
   * `realisations` ne sert QUE cette page, il n'a plus besoin de se cloisonner.
   */
  descriptionKey?: string;
  /**
   * Durée réelle de la mission.
   *
   * ⚠️ **Aucun projet n'en porte à ce jour, et c'est le point.** Le CDC du 14/09/2026 (§4.2)
   * demande une durée sur chaque fiche ; le dépôt ne la documente nulle part — ni dans les
   * dépôts git d'où `stack` et `capabilities` ont été déduites, ni dans un contrat, qui serait
   * de toute façon une information contractuelle interdite ici.
   *
   * Le champ existe quand même, VIDE, pour trois raisons : il donne à la donnée manquante un
   * emplacement au lieu d'une intention ; il rend l'absence greppable (`grep -n 'duration'`) ;
   * et il oblige la valeur future à passer par `ClientEvidence`, donc par une source citée —
   * ce qu'AD-5 exige de tout chiffre affiché. Voir `docs/CONTENT-TODO.md §5`.
   */
  duration?: ClientEvidence;
  /**
   * Résultat mesurable de la mission.
   *
   * ⚠️ Vide partout, pour la même raison que `duration` — plus une seconde, plus dure :
   * l'accord de publication obtenu des clients ne couvre AUCUN résultat et AUCUN chiffre de
   * croissance (voir `CLIENT_PUBLICATION_WITHHELD`). Une valeur ne pourra donc entrer ici
   * qu'à deux conditions cumulées : être publiquement vérifiable — un relevé qu'un tiers peut
   * refaire, pas un chiffre d'analytics — et être couverte par un accord écrit élargi.
   *
   * `cite` est obligatoire dans `ClientEvidence` précisément pour que la première condition
   * ne puisse pas être oubliée en chemin.
   */
  outcome?: ClientEvidence;
}

/**
 * Un chiffre affichable sur une fiche de réalisation : sa valeur, son unité, sa source et
 * sa date de relevé.
 *
 * C'est la forme d'appel de `<Num source asOf>` (`@ds`), rendue obligatoire par le type :
 * AD-5 pose que « un nombre en monospace vient de la base ou d'une source citée », et que
 * celui qui ne peut pas citer la sienne ne s'affiche pas. Un chiffre de réalisation ne vient
 * d'aucune base — il vient donc forcément d'une citation, d'où `cite` en champ requis.
 */
export interface ClientEvidence {
  value: number;
  /** Clé i18n de l'unité, sous `units.<clé>` du namespace `realisations`. */
  unitKey: string;
  /** La source, telle qu'elle s'affichera au survol du nombre. */
  cite: string;
  /** Date du relevé, en ISO `AAAA-MM-JJ`. */
  asOf: string;
}

/**
 * CE QUE L'ACCORD DE PUBLICATION COUVRE — et ce qu'il ne couvre pas.
 *
 * Les accords clients ont été obtenus ; leur périmètre était écrit en tête de
 * `src/pages/Agence.tsx`, page supprimée par la refonte en deux pistes : « ces produits
 * appartiennent à leurs clients. La page nomme le
 * rôle tenu et donne un lien qu'on peut ouvrir. Aucun résultat, aucun chiffre de croissance,
 * aucun témoignage — les interdits du § 13 ne dépendaient pas de l'accord. »
 *
 * Cette phrase vivait dans un commentaire, donc nulle part : aucune surface ne pouvait la
 * rendre, et rien n'empêchait une fiche d'afficher plus que ce qui est autorisé. Les deux
 * listes ci-dessous en font une donnée — `/conception/realisations/:slug` les rend, et la
 * mention d'autorisation cesse d'être une promesse tenue par la discipline de qui écrit.
 *
 * Les libellés vivent en i18n (`authorization.granted.*` / `authorization.withheld.*`) ;
 * ici ne vit que le FAIT.
 */
export type ClientPublicationGranted = 'name' | 'role' | 'stack' | 'liveLink';
export type ClientPublicationWithheld = 'results' | 'growthFigures' | 'testimonials' | 'contractTerms';

export const CLIENT_PUBLICATION_GRANTED: readonly ClientPublicationGranted[] = [
  'name',
  'role',
  'stack',
  'liveLink',
];

export const CLIENT_PUBLICATION_WITHHELD: readonly ClientPublicationWithheld[] = [
  'results',
  'growthFigures',
  'testimonials',
  'contractTerms',
];

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
 * Convertit une `category` (stockée en français) en clé i18n stable, sous
 * `realisations.categories.<clé>` du namespace `shared`.
 *
 * ⚠️ Les deux copies précédentes — `realisations:categories.*` et `conception:work.categories.*`
 * — portaient les sept mêmes paires clé/valeur à l'octet près. `shared` est un namespace
 * toujours chargé : la page mère de la piste peut donc lire les libellés sans avoir à déclarer
 * un namespace paresseux de plus.
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
