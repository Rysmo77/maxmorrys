/**
 * L'HÔTE COURANT ET LES URL DES TROIS ESPACES — la couche navigateur de `./espaces.ts`.
 *
 * Une seule build SPA est servie sur maxmorrys.me, edu.maxmorrys.me et club.maxmorrys.me.
 * Ce module lit l'hôte, et convertit dans les deux sens :
 *
 *   · `hrefPour('/formations/x', 'fr')` → `/formations/x` sur l'Edu,
 *     `https://edu.maxmorrys.me/formations/x` depuis le hub ;
 *   · `toLogicalPath('/en/my-courses')` sur l'Edu → `/mon-espace/cours`, le chemin que le
 *     reste du code compare (barres, titres, onglets).
 *
 * Développement : `localhost:5173` est le hub, `edu.localhost:5173` et `club.localhost:5173`
 * les deux autres espaces (Chrome et Firefox résolvent `*.localhost` sans configuration).
 */
import { placer, cheminLogique, espaceDeHote, origineEspace, type Espace } from './espaces';
import { getLangFromPath, toCanonicalPath, type Lang } from '../i18n/routing';
import { localizeSegments } from '../i18n/segments';

export type { Espace } from './espaces';

/** L'espace de l'hôte qui sert la page. `hub` hors navigateur (tests). */
export function espaceCourant(): Espace {
  return typeof window === 'undefined' ? 'hub' : espaceDeHote(window.location.hostname);
}

function origineCourante(): string {
  return typeof window === 'undefined' ? 'https://maxmorrys.me' : window.location.origin;
}

/** L'origine d'un espace vue depuis la page courante. */
export function origineDe(espace: Espace): string {
  return origineEspace(espace, origineCourante());
}

/** Une URL désigne-t-elle une page de l'un de NOS trois espaces, sur un autre hôte ? */
export function estAutreEspace(href: string): boolean {
  try {
    const url = new URL(href, origineCourante());
    if (url.origin === origineCourante()) return false;
    return (['hub', 'edu', 'club'] as const).some((e) => origineDe(e) === url.origin);
  } catch {
    return false;
  }
}

function couper(path: string): { bare: string; suffix: string } {
  const cut = path.search(/[?#]/);
  return cut === -1 ? { bare: path, suffix: '' } : { bare: path.slice(0, cut), suffix: path.slice(cut) };
}

function prefixer(chemin: string, lang: Lang): string {
  const localise = localizeSegments(chemin, lang);
  if (lang === 'fr') return localise;
  return localise === '/' ? '/en' : `/en${localise}`;
}

/**
 * L'URL ABSOLUE d'un chemin logique (FR ou EN préfixé, requête et ancre comprises).
 *
 * Pour ce qui sort de la page : partages, liens de parrainage, canonical.
 */
export function urlAbsolue(logique: string, lang: Lang): string {
  const { bare, suffix } = couper(logique);
  const place = placer(toCanonicalPath(bare), espaceCourant());
  return `${origineDe(place.espace)}${prefixer(place.chemin, lang)}${suffix}`;
}

/**
 * Le `href` d'un lien interne : chemin relatif si la cible vit sur l'hôte courant, URL
 * absolue sinon. Le transfert de session des liens absolus est l'affaire de
 * `lib/sessionHandoff.ts`, qui écoute les clics.
 */
export function hrefPour(logique: string, lang: Lang): string {
  if (!logique.startsWith('/')) return logique;
  const { bare, suffix } = couper(logique);
  const courant = espaceCourant();
  const place = placer(toCanonicalPath(bare), courant);
  const chemin = prefixer(place.chemin, lang) + suffix;
  return place.espace === courant ? chemin : `${origineDe(place.espace)}${chemin}`;
}

/** Le chemin logique FR (sans `/en`) d'un `pathname` servi par l'hôte courant. */
export function toLogicalPath(pathname: string): string {
  return cheminLogique(espaceCourant(), toCanonicalPath(pathname));
}

/**
 * L'adresse où vit VRAIMENT la page demandée, si ce n'est pas celle-ci : une URL absolue
 * quand elle vit sur un autre hôte, un chemin quand elle a seulement changé de nom sur
 * l'hôte courant (`/mon-espace/cours` sur l'Edu → `/mes-formations`). `null` sinon.
 */
export function urlCorrigee(pathname: string, search = '', hash = ''): string | null {
  const courant = espaceCourant();
  const lang = getLangFromPath(pathname);
  const place = placer(toLogicalPath(pathname), courant);
  const chemin = prefixer(place.chemin, lang);
  if (place.espace !== courant) return `${origineDe(place.espace)}${chemin}${search}${hash}`;
  const actuel = pathname.replace(/\/+$/, '') || '/';
  return chemin === actuel ? null : `${chemin}${search}${hash}`;
}

/** L'accueil connecté de l'espace courant, en chemin logique. */
export function accueilConnecte(espace: Espace = espaceCourant()): string {
  return espace === 'club' ? '/mon-espace/club' : '/mon-espace';
}

/** L'accueil public de l'espace courant, en chemin logique. */
export function accueilPublic(espace: Espace = espaceCourant()): string {
  return espace === 'edu' ? '/apprendre' : espace === 'club' ? '/club-des-digitos' : '/';
}

