/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES TROIS ESPACES ET LEURS ADRESSES — SOURCE UNIQUE (PRD rév. 6, §2.1).
 *
 *   maxmorrys.me        le hub : site, contenus, services, espace personnel général, /admin
 *   edu.maxmorrys.me    l'Edu : formations, espace apprenant, certificats
 *   club.maxmorrys.me   le Club des Digitos : pages publiques, onglets membres, parrainage
 *
 * Le code de l'application continue d'écrire des chemins LOGIQUES — ceux d'avant les
 * sous-domaines (`/formations/x`, `/mon-espace/cours`, `/club-des-digitos`). Cette table dit
 * où chacun vit désormais : sur quel hôte, à quel chemin PHYSIQUE. Les liens, le routeur, les
 * canonical, les 301 du Worker et les URL des e-mails la lisent tous ; aucun d'eux ne recopie
 * une adresse.
 *
 * ⚠️ MODULE PUR, PARTAGÉ AVEC LE WORKER. `worker/apps/site` et `worker/apps/api` l'importent
 * par chemin relatif : il ne doit dépendre ni du DOM, ni de Node, ni d'aucun autre module.
 * Tout y travaille sur des chemins FR canoniques, sans préfixe `/en` — la traduction des
 * segments reste à l'appelant, qui a sa table (`src/i18n/segments.ts` ou son miroir Worker).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type Espace = 'hub' | 'edu' | 'club';

export const ESPACES: readonly Espace[] = ['hub', 'edu', 'club'];

export interface Correspondance {
  /** Chemin logique (FR canonique). Son sous-arbre suit, sauf `exact`. */
  ancien: string;
  /** L'espace qui le sert. Une liste : le chemin existe sur chacun, le premier par défaut. */
  espace: Espace | readonly Espace[];
  /** Chemin physique sur l'hôte de l'espace. */
  nouveau: string;
  /** Le chemin seul, sans son sous-arbre. */
  exact?: boolean;
  /** Sens unique : un alias logique, jamais produit en retour depuis le chemin physique. */
  alias?: boolean;
  /** Espace privé : `Disallow` dans le `robots.txt` de l'hôte. */
  prive?: boolean;
}

/** Les onglets du Club qui ont une adresse — miroir de `src/lib/club/tabs.ts` + écrans. */
const ONGLETS_CLUB = [
  'fil', 'discussions', 'agenda', 'membres', 'classement', 'opportunites', 'infos',
  'parrainage', 'defis', 'live', 'publication',
] as const;

/**
 * LA TABLE « ANCIEN CHEMIN → NOUVELLE URL ».
 *
 * Tout chemin absent reste sur le hub, à la même adresse. L'ordre n'importe pas : la
 * correspondance la plus LONGUE l'emporte.
 */
export const CORRESPONDANCES: readonly Correspondance[] = [
  // ── Edu : public ──
  { ancien: '/apprendre', espace: 'edu', nouveau: '/', exact: true },
  { ancien: '/apprendre/methode', espace: 'edu', nouveau: '/methode' },
  { ancien: '/apprendre/assistant', espace: 'edu', nouveau: '/assistant' },
  { ancien: '/formations', espace: 'edu', nouveau: '/formations' },
  { ancien: '/verifier', espace: 'edu', nouveau: '/verifier' },
  { ancien: '/certificat', espace: 'edu', nouveau: '/certificat' },
  // ── Edu : achat ──
  { ancien: '/checkout', espace: 'edu', nouveau: '/checkout', prive: true },
  /* Le retour de paiement existe sur les deux hôtes qui vendent : Bictorys y ramène selon
     le produit (formation et quota d'assistant → Edu, adhésion → Club). */
  { ancien: '/paiement', espace: ['edu', 'club'], nouveau: '/paiement', prive: true },
  // ── Edu : espace apprenant ──
  { ancien: '/cours', espace: 'edu', nouveau: '/cours', prive: true },
  { ancien: '/mon-espace', espace: 'edu', nouveau: '/tableau-de-bord', exact: true, alias: true },
  { ancien: '/mon-espace/tableau-de-bord', espace: 'edu', nouveau: '/tableau-de-bord', prive: true },
  { ancien: '/mon-espace/cours', espace: 'edu', nouveau: '/mes-formations', prive: true },
  { ancien: '/mon-espace/notes', espace: 'edu', nouveau: '/notes', prive: true },
  { ancien: '/mon-espace/succes', espace: 'edu', nouveau: '/succes', prive: true },
  { ancien: '/mon-espace/agenda', espace: 'edu', nouveau: '/agenda', prive: true },
  { ancien: '/mon-espace/cohorte', espace: 'edu', nouveau: '/cohorte', prive: true },
  { ancien: '/mon-espace/missions', espace: 'edu', nouveau: '/missions', prive: true },
  { ancien: '/mon-espace/quiz', espace: 'edu', nouveau: '/quiz', prive: true },
  { ancien: '/mon-espace/hors-connexion', espace: 'edu', nouveau: '/hors-connexion', prive: true },
  // ── Club : public ──
  { ancien: '/club-des-digitos', espace: 'club', nouveau: '/', exact: true },
  { ancien: '/club-des-digitos/sessions', espace: 'club', nouveau: '/sessions' },
  { ancien: '/club-des-digitos/adhesion', espace: 'club', nouveau: '/adhesion' },
  /* Le lien de parrainage des maquettes : `club.maxmorrys.me/r/<code>`. */
  { ancien: '/r', espace: 'club', nouveau: '/r', prive: true },
  // ── Club : onglets des membres ──
  { ancien: '/mon-espace/club', espace: 'club', nouveau: '/fil', exact: true, alias: true },
  ...ONGLETS_CLUB.map((onglet): Correspondance => (
    { ancien: `/mon-espace/club/${onglet}`, espace: 'club', nouveau: `/${onglet}`, prive: true }
  )),
];

/**
 * Les chemins servis par CHAQUE hôte, sur place : on se connecte là où l'on est, parce que
 * Firebase Auth range la session par origine.
 */
export const CHEMINS_PARTAGES: readonly string[] = ['/connexion', '/inscription', '/mot-de-passe-oublie', '/403'];

/** Domaine de production du hub. */
export const DOMAINE = 'maxmorrys.me';

function espacesDe(c: Correspondance): readonly Espace[] {
  return typeof c.espace === 'string' ? [c.espace] : c.espace;
}

/** `chemin` est-il `base` ou sous `base` (frontière de segment) ? */
function sous(chemin: string, base: string, exact?: boolean): boolean {
  if (chemin === base) return true;
  if (exact) return false;
  return base === '/' ? true : chemin.startsWith(`${base}/`);
}

function remplacer(chemin: string, depuis: string, vers: string): string {
  const reste = chemin.slice(depuis.length);
  if (!reste) return vers;
  return vers === '/' ? reste : `${vers}${reste}`;
}

function normaliser(chemin: string): string {
  const s = chemin.replace(/\/+$/, '');
  return s === '' ? '/' : s;
}

/**
 * Où vit un chemin logique (FR canonique, sans `/en`, sans requête).
 *
 * `courant` départage les chemins servis par plusieurs espaces : un chemin partagé reste sur
 * l'hôte courant.
 */
export function placer(logique: string, courant: Espace = 'hub'): { espace: Espace; chemin: string } {
  const chemin = normaliser(logique);
  if (CHEMINS_PARTAGES.some((p) => sous(chemin, p))) return { espace: courant, chemin };

  let meilleure: Correspondance | null = null;
  for (const c of CORRESPONDANCES) {
    if (!sous(chemin, c.ancien, c.exact)) continue;
    if (!meilleure || c.ancien.length > meilleure.ancien.length) meilleure = c;
  }
  if (!meilleure) return { espace: 'hub', chemin };

  const espaces = espacesDe(meilleure);
  const espace = espaces.includes(courant) ? courant : espaces[0];
  return { espace, chemin: remplacer(chemin, meilleure.ancien, meilleure.nouveau) };
}

/**
 * Le chemin logique que sert un chemin physique sur un espace — l'inverse de `placer`.
 *
 * Un chemin qu'aucune correspondance ne revendique est rendu tel quel : c'est alors une
 * adresse logique demandée au mauvais endroit (`/blog` sur l'Edu), que `placer` renverra
 * vers son hôte.
 */
export function cheminLogique(espace: Espace, physique: string): string {
  const chemin = normaliser(physique);
  let meilleure: Correspondance | null = null;
  for (const c of CORRESPONDANCES) {
    if (c.alias || !espacesDe(c).includes(espace)) continue;
    if (!sous(chemin, c.nouveau, c.exact || c.nouveau === '/')) continue;
    if (!meilleure || c.nouveau.length > meilleure.nouveau.length) meilleure = c;
  }
  return meilleure ? remplacer(chemin, meilleure.nouveau, meilleure.ancien) : chemin;
}

/** Les préfixes physiques privés d'un espace (pour son `robots.txt`). */
export function cheminsPrives(espace: Espace): string[] {
  return [...new Set(
    CORRESPONDANCES.filter((c) => c.prive && !c.alias && espacesDe(c).includes(espace)).map((c) => c.nouveau),
  )].sort();
}

/** L'espace servi par un nom d'hôte (`edu.maxmorrys.me`, `club.localhost`…). */
export function espaceDeHote(hostname: string): Espace {
  const h = hostname.toLowerCase();
  if (h.startsWith('edu.')) return 'edu';
  if (h.startsWith('club.')) return 'club';
  return 'hub';
}

/**
 * L'origine d'un espace, vue depuis une origine de référence.
 *
 *   ('edu',  'https://maxmorrys.me')        → 'https://edu.maxmorrys.me'
 *   ('hub',  'http://club.localhost:5173')  → 'http://localhost:5173'
 *
 * En développement, `*.localhost` résout vers la machine (Chrome, Firefox) : le port suit.
 * Toute autre origine (aperçus Firebase, workers.dev) renvoie vers la production, faute de
 * sous-domaines à elle.
 */
export function origineEspace(espace: Espace, origineReference: string): string {
  let url: URL;
  try {
    url = new URL(origineReference);
  } catch {
    url = new URL(`https://${DOMAINE}`);
  }
  const h = url.hostname.toLowerCase();
  const prefixe = espace === 'hub' ? '' : `${espace}.`;
  if (h === 'localhost' || h.endsWith('.localhost')) {
    return `${url.protocol}//${prefixe}localhost${url.port ? `:${url.port}` : ''}`;
  }
  return `https://${prefixe}${DOMAINE}`;
}
