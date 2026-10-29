/**
 * LES TROIS HÔTES AU BORD — maxmorrys.me, edu.maxmorrys.me, club.maxmorrys.me.
 *
 * Le Worker sert les trois depuis la même origine Firebase Hosting (une seule build SPA). Ce
 * module lit la table UNIQUE de l'application (`src/lib/espaces.ts`, importée telle quelle)
 * et en tire ce que le bord doit faire :
 *
 *   · le chemin LOGIQUE d'une requête (`/` sur l'Edu → `/apprendre`) : le pré-rendu, la table
 *     de routage et le cache des métas continuent de parler ce langage-là ;
 *   · la 301 due quand une page est demandée sur le mauvais hôte (anciens chemins du hub,
 *     chemin du hub demandé sur edu. ou club.), requête conservée ;
 *   · l'URL PUBLIQUE de toute adresse que le pré-rendu écrit en `https://maxmorrys.me/…`
 *     (canonical, hreflang, JSON-LD, sitemap) ;
 *   · le `robots.txt` des deux sous-domaines.
 */
import {
  cheminLogique,
  cheminsPrives,
  espaceDeHote,
  origineEspace,
  placer,
  type Espace,
} from '../../../../src/lib/espaces';
import { SITE_URL } from './constants';
import { canonicalizeSegments, enPath } from './prerender/segments';
import type { PageMeta } from './prerender/types';
import { normalizePath } from './routes';

export type { Espace };

export interface Demande {
  espace: Espace;
  lang: 'fr' | 'en';
  /** Chemin logique FR, sans `/en`. */
  logiqueFr: string;
  /** Chemin logique dans la langue de la requête (`/en/…` en anglais) — celui des tables. */
  logique: string;
}

function dansLaLangue(cheminFr: string, lang: 'fr' | 'en'): string {
  return lang === 'en' ? enPath(cheminFr) : cheminFr;
}

/** Ce que demande une URL, ramené au langage logique. */
export function analyser(url: URL): Demande {
  const espace = espaceDeHote(url.hostname);
  const path = normalizePath(url.pathname);
  const lang: 'fr' | 'en' = path === '/en' || path.startsWith('/en/') ? 'en' : 'fr';
  const sansEn = lang === 'en' ? (path === '/en' ? '/' : path.slice(3)) : path;
  const fr = lang === 'en' ? canonicalizeSegments(sansEn) || '/' : sansEn;
  const logiqueFr = cheminLogique(espace, fr);
  return { espace, lang, logiqueFr, logique: dansLaLangue(logiqueFr, lang) };
}

/**
 * Une page ? Les fichiers (un point dans le dernier segment), les assets, les cartes, le
 * gestionnaire d'authentification Firebase et `.well-known` ne changent jamais d'hôte : la
 * même origine les sert partout.
 */
function estPage(pathname: string): boolean {
  if (/^\/(__|\.well-known|assets|og)(\/|$)/.test(pathname)) return false;
  const dernier = pathname.split('/').pop() ?? '';
  return !dernier.includes('.');
}

/** La 301 due par une requête de page, ou `null`. */
export function redirectionEspace(url: URL): string | null {
  if (!estPage(url.pathname)) return null;
  const d = analyser(url);
  const place = placer(d.logiqueFr, d.espace);
  const cible = dansLaLangue(place.chemin, d.lang);
  if (place.espace === d.espace && cible === normalizePath(url.pathname)) return null;
  return `${origineEspace(place.espace, url.origin)}${cible}${url.search}`;
}

/** L'URL publique d'un chemin logique (FR, ou EN préfixé). */
export function urlPublique(chemin: string): string {
  const lang: 'fr' | 'en' = chemin === '/en' || chemin.startsWith('/en/') ? 'en' : 'fr';
  const sansEn = lang === 'en' ? (chemin === '/en' ? '/' : chemin.slice(3)) : chemin;
  const fr = lang === 'en' ? canonicalizeSegments(sansEn) || '/' : sansEn;
  const place = placer(normalizePath(fr));
  return `${origineEspace(place.espace, SITE_URL)}${dansLaLangue(place.chemin, lang)}`;
}

/** Réécrit une URL `https://maxmorrys.me/…` vers l'hôte de son espace ; le reste passe. */
export function publier(url: string): string {
  // L'URL nue du site (`url` d'une Organization) reste telle quelle : c'est le hub.
  if (!url.startsWith(`${SITE_URL}/`)) return url;
  const reste = url.slice(SITE_URL.length) || '/';
  const cut = reste.search(/[?#]/);
  const chemin = cut === -1 ? reste : reste.slice(0, cut);
  if (!estPage(chemin)) return url;
  return `${urlPublique(chemin)}${cut === -1 ? '' : reste.slice(cut)}`;
}

function publierProfond(valeur: unknown): unknown {
  if (typeof valeur === 'string') return publier(valeur);
  if (Array.isArray(valeur)) return valeur.map(publierProfond);
  if (valeur && typeof valeur === 'object') {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, publierProfond(v)]));
  }
  return valeur;
}

/** Les adresses d'une méta, sur leurs hôtes publics. Appliqué APRÈS le cache. */
export function publierMeta(meta: PageMeta): PageMeta {
  return {
    ...meta,
    canonical: publier(meta.canonical),
    altFr: meta.altFr ? publier(meta.altFr) : meta.altFr,
    altEn: meta.altEn ? publier(meta.altEn) : meta.altEn,
    jsonLd: meta.jsonLd ? (publierProfond(meta.jsonLd) as PageMeta['jsonLd']) : meta.jsonLd,
    breadcrumbs: meta.breadcrumbs?.map((b) => ({ ...b, url: publier(b.url) })),
  };
}

/**
 * Le `robots.txt` d'edu. ou de club. Celui du hub reste le fichier de l'hébergement
 * (`public/robots.txt`). Les chemins privés viennent de la table (`prive: true`).
 */
export function robotsTxt(espace: Espace, origine: string): string {
  const prives = [...cheminsPrives(espace), '/403'];
  const lignes = ['User-agent: *', 'Allow: /'];
  for (const p of prives) lignes.push(`Disallow: ${p}`);
  for (const p of prives) lignes.push(`Disallow: ${enPath(p)}`);
  lignes.push(`Sitemap: ${origine}/sitemap.xml`);
  return `${lignes.join('\n')}\n`;
}
