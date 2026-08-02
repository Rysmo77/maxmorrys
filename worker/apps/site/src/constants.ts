/**
 * Constantes partagées, reprises telles quelles des Cloud Functions.
 *
 * `SITE_URL` reste le domaine public canonique, indépendamment de l'hôte servi :
 * c'est ce qui rend les canonical et og:url identiques que la requête arrive par
 * `maxmorrys.me` ou par l'origine Firebase.
 */
export const SITE_URL = 'https://maxmorrys.me';
export const SITE_NAME = 'Max-Morrys';

export const DEFAULT_TITLE = 'Max-Morrys | Maîtrisez le digital, accélérez votre croissance';
export const DEFAULT_DESCRIPTION =
  "Formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l'IA. Par Max-Morrys depuis Dakar.";
export const DEFAULT_OG_IMAGE = 'https://media.maxmorrys.me/Je-te-forme/2252.jpg';
