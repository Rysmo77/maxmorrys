/**
 * MY ONOMA Product Lab — les produits que le studio détient et opère (pilier OWN).
 *
 * `operator`, `owner` et `status` sont volontairement séparés : une venture doit pouvoir
 * devenir une société indépendante sans refonte. Rien ici ne présuppose que
 * « DOVEN = MY ONOMA pour toujours ».
 *
 * ⚠️ Ces produits ne sont JAMAIS présentés comme appartenant personnellement à Max-Morrys,
 * ni comme des services de l'agence. Sur maxmorrys.me, ils n'apparaissent que dans un bloc
 * explicitement intitulé « Products built inside MY ONOMA ».
 *
 * ⚠️ Interdiction stricte : aucun chiffre d'utilisateurs, de revenus, de traction, de levée
 * ni de partenaire. Les descriptions sont sourcées des sites publics des produits.
 *
 * Miroir de `My-onoma/apps/web/src/lib/brand/ventures.ts`.
 */

export type VentureStatus = 'live' | 'beta' | 'building';

export interface Venture {
  slug: string;
  name: string;
  /** Catégorie produit, en anglais : c'est un descripteur de marché. */
  category: string;
  /** Entité qui exploite le produit au quotidien. */
  operator: string;
  /** Entité qui détient le produit. Peut diverger de `operator` un jour. */
  owner: string;
  status: VentureStatus;
  website: string;
  /** Domaine affiché, sans protocole. */
  domain: string;
}

const MY_ONOMA = 'MY ONOMA SARL';

/**
 * Mention de relation affichée sur les cartes venture. Constante volontairement :
 * c'est une signature, pas une phrase traduisible.
 *
 * Son pendant est `CLIENT_RELATION` dans `clients.ts` — les deux ne doivent jamais
 * apparaître dans une même grille.
 */
export const VENTURE_RELATION = 'A MY ONOMA Venture';

export const ventures: readonly Venture[] = [
  {
    slug: 'doven',
    name: 'DOVEN',
    category: 'Social Technology',
    operator: MY_ONOMA,
    owner: MY_ONOMA,
    status: 'live',
    website: 'https://doven.app',
    domain: 'doven.app',
  },
  {
    slug: 'nayo',
    name: 'NAYO',
    category: 'Creative Production OS',
    operator: MY_ONOMA,
    owner: MY_ONOMA,
    status: 'live',
    website: 'https://nayo.pro',
    domain: 'nayo.pro',
  },
  {
    slug: 'steps',
    name: 'STEPS',
    category: 'Media',
    operator: MY_ONOMA,
    owner: MY_ONOMA,
    status: 'live',
    website: 'https://stepsmag.com',
    domain: 'stepsmag.com',
  },
];

/** Retrouve une venture par son slug. */
export function getVenture(slug: string): Venture | undefined {
  return ventures.find((v) => v.slug === slug);
}
