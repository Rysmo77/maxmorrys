/**
 * LES URL DU SITE DANS LES E-MAILS ET LES RETOURS DE PAIEMENT — sur le bon hôte.
 *
 * Depuis les sous-domaines (PRD rév. 6, §2.1), une formation vit sur edu.maxmorrys.me et le
 * Club sur club.maxmorrys.me. La table qui le dit est UNIQUE et vit côté application
 * (`src/lib/espaces.ts`) ; ce module la lit, et la traduction anglaise des segments vient du
 * miroir du Worker du site. Aucune adresse n'est recopiée ici.
 */
import { origineEspace, placer, type Espace } from '../../../../../src/lib/espaces';
import { enPath } from '../../../site/src/prerender/segments';

export type { Espace };

/**
 * L'URL publique d'un chemin LOGIQUE FR (requête et ancre comprises), dans la langue voulue.
 *
 *   urlSite('https://maxmorrys.me', '/formations/seo', 'en') → 'https://edu.maxmorrys.me/en/courses/seo'
 */
export function urlSite(base: string, cheminFr: string, langue: 'fr' | 'en'): string {
  const cut = cheminFr.search(/[?#]/);
  const bare = cut === -1 ? cheminFr : cheminFr.slice(0, cut);
  const suffixe = cut === -1 ? '' : cheminFr.slice(cut);
  const place = placer(bare);
  const chemin = langue === 'en' ? enPath(place.chemin) : place.chemin;
  return `${origineEspace(place.espace, base)}${chemin}${suffixe}`;
}

/** L'origine d'un espace (`https://club.maxmorrys.me`), vue depuis la base du site. */
export function origineSite(base: string, espace: Espace): string {
  return origineEspace(espace, base);
}
