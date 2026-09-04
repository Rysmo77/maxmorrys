/**
 * Constantes partagées, reprises telles quelles des Cloud Functions.
 *
 * `SITE_URL` reste le domaine public canonique, indépendamment de l'hôte servi :
 * c'est ce qui rend les canonical et og:url identiques que la requête arrive par
 * `maxmorrys.me` ou par l'origine Firebase.
 */
export const SITE_URL = 'https://maxmorrys.me';
export const SITE_NAME = 'Max-Morrys';

export const DEFAULT_TITLE = 'Max-Morrys | Maîtrise le digital, accélère ta croissance';
export const DEFAULT_DESCRIPTION =
  "Formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l'IA. Par Max-Morrys depuis Dakar.";
export const DEFAULT_OG_IMAGE = 'https://media.maxmorrys.me/Je-te-forme/2252.jpg';
/**
 * Dimensions MESURÉES de l'image ci-dessus (`curl` + `sips`, 03/09/2026) : 1500×1000, soit
 * 3:2 — et non le 1.91:1 que la sortie annonçait.
 *
 * Ces deux nombres ne sont pas décoratifs : Facebook et LinkedIn dimensionnent la carte
 * d'après eux AVANT de télécharger l'image, puis recadrent ce qu'ils reçoivent au format
 * annoncé. Annoncer 1200×630 pour une image 3:2 faisait donc recadrer le haut et le bas sur
 * chaque partage de l'accueil et de toutes les pages statiques.
 *
 * ⚠️ À remesurer si `DEFAULT_OG_IMAGE` change. Une image de partage recadrée ne produit
 * aucune erreur : elle produit un aperçu moins bon, et rien ne le dit.
 */
export const DEFAULT_OG_IMAGE_WIDTH = 1500;
export const DEFAULT_OG_IMAGE_HEIGHT = 1000;

/**
 * Ce que MONTRE l'image ci-dessus — pas le titre de la page qui la partage.
 *
 * Un `alt` d'image de partage a deux lecteurs : les lecteurs d'écran, et toute personne dont
 * l'image ne charge pas — cas courant sur un forfait compté. Y recopier le titre de la page
 * ne leur apprend rien qu'ils n'aient déjà dans le titre juste à côté.
 */
export const DEFAULT_OG_IMAGE_ALT =
  'Un formateur commente une courbe de croissance au paperboard devant deux participants, en salle de formation.';

/**
 * LES PROFILS SOCIAUX, POUR `sameAs`.
 *
 * ⚠️ MIROIR DE `src/lib/brand/company.ts`, dont le commentaire dit « profils publics,
 * VÉRIFIÉS ». Le Worker ne peut pas importer le code de l'application ;
 * `tests/unit/social-links-sync.test.ts` empêche les deux listes de diverger.
 *
 * CE QUI ÉTAIT ÉCRIT AVANT, ET POURQUOI C'ÉTAIT FAUX. Le JSON-LD de l'accueil déclarait deux
 * adresses écrites à la main : `linkedin.com/in/maxmorrys` et `youtube.com/@maxmorrys`. La
 * seconde répond **404** (vérifié le 03/09/2026) — la vraie chaîne est `@maxmorrys-me`. Or
 * `sameAs` sert exactement à dire à un moteur « ces comptes sont la même entité que ce
 * site » : y déclarer une adresse morte n'est pas une coquille, c'est une affirmation fausse
 * sur l'identité de la marque, et elle affaiblit précisément ce qu'elle prétend établir.
 */
export const SOCIAL_URLS = [
  'https://www.linkedin.com/in/max-morrys-eyoum/',
  'https://www.facebook.com/maxmorrys.me/',
  'https://www.instagram.com/maxmorrys.me',
  'https://www.youtube.com/@maxmorrys-me',
  'https://www.tiktok.com/@maxmorrys.me',
  'https://x.com/max_morrys',
];

/**
 * Le compte X du site.
 *
 * ⚠️ La sortie pré-rendue annonçait `@maxmorrys`, qui n'est pas le compte : `lib/brand`
 * déclare `https://x.com/max_morrys`, et c'est aussi ce que porte `index.html`. Les deux
 * balises cohabitaient donc dans chaque page, la fausse en premier — l'attribution de la
 * carte X partait à un compte qui n'est pas celui de la marque.
 */
export const TWITTER_HANDLE = '@max_morrys';
