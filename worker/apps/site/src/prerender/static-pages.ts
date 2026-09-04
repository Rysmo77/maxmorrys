import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  SOCIAL_URLS,
} from '../constants';
import type { PageMeta } from './types';

/**
 * Port verbatim de la table `staticPages` de `functions/src/prerender.ts`.
 *
 * Toute modification de contenu doit rester alignée avec la source tant que la
 * Cloud Function est déployée, sinon le test de parité échoue — ce qui est le
 * comportement voulu.
 */
export const staticPages: Record<string, PageMeta> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/`,
    h1: 'Maîtrise le digital, accélère ta croissance',
    bodyText:
      "Max-Morrys propose des formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l'IA. Plateforme éducative basée à Dakar, dédiée à la croissance digitale en Afrique francophone.\n\n" +
      "SEO, marketing et intelligence artificielle, expliqués pour le marché ouest-africain. Le paiement se fait avec Wave, Orange Money ou avec ta carte, en francs CFA : la carte reste facultative, pas de conversion, pas de compte à l'étranger.\n\n" +
      "Six portes, du gratuit au sur-mesure, et chacune annonce son prix avant le clic : les formations (SEO, marketing, IA, accès à vie), le blog publié chaque semaine, le podcast et les vidéos où des gens d'ici racontent ce qu'ils ont fait, le Club des Digitos sur une année en groupe fermé, la présence digitale pour les commerces de proximité, et l'Agence sur cadrage écrit.\n\n" +
      "Les exemples sont pris ici : « Cosmétique Almadies », pas « organic skincare Brooklyn » — ce que tapent tes clients, dans les mots qu'ils emploient. Le poids de chaque vidéo est annoncé avant lecture et chaque leçon a une transcription, parce qu'un forfait mobile se compte.\n\n" +
      "Formateur, consultant et créateur de contenu digital basé à Dakar. J'écris les articles, je monte les formations, j'anime le Club et je réponds aux messages : il n'y a personne d'autre derrière cette plateforme.",
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        // Les profils VÉRIFIÉS. Les deux adresses écrites à la main ici en désignaient un
        // qui répond 404 — voir `SOCIAL_URLS`.
        sameAs: SOCIAL_URLS,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: 'fr',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/blog?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  },
  '/a-propos': {
    title: `À propos de Max-Morrys — Formateur en Marketing Digital | ${SITE_NAME}`,
    description:
      "Découvrez le parcours de Max-Morrys, formateur et consultant en marketing digital basé à Dakar. Expertise SEO, growth marketing et stratégie digitale pour l'Afrique.",
    ogType: 'profile',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/a-propos`,
    /*
     * `og:type: profile` sans balisage `Person` : la page annonçait une personne aux réseaux
     * sociaux et n'en décrivait aucune aux moteurs. C'est la seule page du site dont le sujet
     * EST quelqu'un — et celle que Google consulte pour rattacher la marque à un auteur, ce
     * dont dépend l'`author` déclaré sur chaque article.
     */
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Max-Morrys',
      url: `${SITE_URL}/a-propos`,
      image: DEFAULT_OG_IMAGE,
      jobTitle: 'Formateur et consultant en marketing digital',
      worksFor: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
      sameAs: SOCIAL_URLS,
    },
    h1: 'Je suis Max-Morrys',
    bodyText:
      "Formateur, consultant et créateur de contenu digital basé à Dakar. J'aide les entreprises et entrepreneurs francophones à maîtriser le marketing digital, le SEO et l'IA pour accélérer leur croissance.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'À propos', url: `${SITE_URL}/a-propos` },
    ],
  },
  '/blog': {
    title: `Blog Marketing Digital — Articles et Conseils | ${SITE_NAME}`,
    description:
      'Articles, analyses et conseils pratiques en marketing digital, SEO, IA et stratégie de croissance. Par Max-Morrys depuis Dakar.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/blog`,
    h1: 'Blog Marketing Digital',
    bodyText:
      "Retrouvez ici tous les articles de Max-Morrys sur le marketing digital, le SEO, l'IA, le growth marketing et la stratégie digitale. Conseils pratiques pour entrepreneurs et entreprises africaines.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Blog', url: `${SITE_URL}/blog` },
    ],
  },
  '/formations': {
    title: `Formations Marketing Digital | ${SITE_NAME}`,
    description:
      "Formations pratiques en marketing digital, SEO et IA pour accélérer ta croissance. Cours en ligne accessibles depuis l'Afrique et le monde entier.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/formations`,
    h1: 'Formations Marketing Digital',
    bodyText:
      'Découvre les formations Max-Morrys : marketing digital, SEO, growth, IA, contenu. Programmes pratiques avec missions, certificats et accompagnement personnalisé.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Formations', url: `${SITE_URL}/formations` },
    ],
  },
  '/podcasts': {
    title: `Podcasts Marketing Digital | ${SITE_NAME}`,
    description:
      'Écoute le podcast de Max-Morrys : stratégies marketing digital, SEO, IA et croissance en Afrique. Disponible sur Spotify, Apple Podcasts et Deezer.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/podcast-et-videos`,
    h1: 'Podcasts Marketing Digital',
    bodyText:
      "Le podcast Max-Morrys décrypte les stratégies marketing digital, le SEO, l'IA et la croissance des marques en Afrique francophone. Nouveaux épisodes chaque semaine.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Podcasts', url: `${SITE_URL}/podcasts` },
    ],
  },
  '/videos': {
    title: `Vidéos Marketing Digital | ${SITE_NAME}`,
    description:
      "Regarde les vidéos de Max-Morrys sur le marketing digital, le SEO et l'IA. Tutoriels pratiques et analyses sur YouTube.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/podcast-et-videos`,
    h1: 'Vidéos Marketing Digital',
    bodyText:
      'Les vidéos Max-Morrys : tutoriels marketing digital, analyses SEO, démonstrations IA, growth hacking. Contenu pratique en français pour entrepreneurs africains.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Vidéos', url: `${SITE_URL}/videos` },
    ],
  },
  /*
   * LE PÔLE MÉDIA — une adresse pour les deux formats, sous « Je te transforme ».
   * `/podcasts` et `/videos` redirigent ici ; leurs entrées ci-dessus gardent une méta pour
   * les robots qui les visitent encore, mais pointent leur canonique SUR CETTE PAGE.
   */
  '/podcast-et-videos': {
    title: `Podcast & vidéos — Écouter et regarder, gratuitement | ${SITE_NAME}`,
    description:
      "Le podcast et les vidéos de Max-Morrys : des gens d'Afrique de l'Ouest racontent ce qu'ils ont fait pour vendre en ligne. Gratuit, sans compte, avec transcription.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/podcast-et-videos`,
    h1: 'Écouter & regarder',
    bodyText:
      "Le blog donne des méthodes ; ici, des gens racontent ce qu'ils ont fait. Épisodes de podcast et vidéos réunis sur une seule page, gratuits et sans compte, avec une transcription pour qui compte son forfait.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Podcast & vidéos', url: `${SITE_URL}/podcast-et-videos` },
    ],
  },
  /*
   * LE CLUB — l'étage payant et fermé du même territoire. Sa page de vente, elle, est
   * publique. AUCUN nombre de membres, ici comme à l'écran : le Club a ouvert cette année,
   * le chiffre serait faible, et il se vérifie au premier écran après paiement.
   */
  '/club-des-digitos': {
    title: `Le Club des Digitos — Une année avec moi | ${SITE_NAME}`,
    description:
      "Sessions en direct, missions qui circulent et une réponse de moi dans les discussions. 1 658 FCFA par mois, facturé 19 900 FCFA une fois par an. Wave, Orange Money ou carte.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/club-des-digitos`,
    h1: 'Le Club des Digitos',
    bodyText:
      "Le Club des Digitos est une communauté annuelle payante, animée depuis Dakar. L'abonnement ouvre huit onglets — fil, discussions, membres, agenda, classement, opportunités, informations, parrainage — deux sessions en direct par mois, les ateliers en présentiel à Dakar, et un répétiteur porté à cinq questions par jour. 19 900 FCFA pour douze mois, soit 1 658 FCFA par mois. À l'échéance, l'accès s'arrête : rien n'est prélevé automatiquement.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Le Club des Digitos', url: `${SITE_URL}/club-des-digitos` },
    ],
  },
  /*
   * LA VÉRIFICATION D'UN CODE. Son public n'est pas l'apprenante mais un TIERS — employeur,
   * client, jury — qui a un document entre les mains et cherche une réponse binaire. D'où le
   * ton neutre, et rien à vendre sur cette page.
   */
  '/verifier': {
    title: `Vérifier un certificat | ${SITE_NAME}`,
    description:
      "Contrôle l'authenticité d'un certificat Max-Morrys à partir de son code. Sans compte, sans inscription : la page répond à un code, et à un seul.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/verifier`,
    h1: 'Vérifier un certificat',
    bodyText:
      "Colle le code figurant sur le document pour savoir s'il a été émis par Max-Morrys, MY ONOMA SARL, Dakar. La page affiche le titulaire, la formation, la date d'émission et le code. Elle ne liste pas les certificats émis et ne remonte à aucun compte.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Vérifier un certificat', url: `${SITE_URL}/verifier` },
    ],
  },
  '/faq': {
    title: `FAQ — Questions Fréquentes | ${SITE_NAME}`,
    description:
      'Retrouve les réponses aux questions les plus fréquentes sur les formations, le coaching et les services de Max-Morrys.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/faq`,
    h1: 'Questions fréquentes',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'FAQ', url: `${SITE_URL}/faq` },
    ],
  },
  // Max-Morrys Agency — practice BUILD de MY ONOMA, offre high-ticket.
  // ⚠️ Aucun tarif ici : la grille publique appartient à /presence-digitale.
  '/agence': {
    title: `Max-Morrys Agency — Produit, IA, Technologie & Marque | ${SITE_NAME}`,
    description:
      'Nous concevons les produits numériques, systèmes IA et expériences digitales dont les entreprises ont besoin pour avancer. Practice Product, AI, Technology & Brand de MY ONOMA, depuis Dakar.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/agence`,
    h1: 'Nous construisons les produits numériques qui font avancer les entreprises',
    bodyText:
      "Max-Morrys Agency est la practice Product, AI, Technology & Brand de MY ONOMA. Nous intervenons sur quatre expertises : Digital Product (SaaS, plateformes métier, applications web, marketplaces, portails, outils internes, MVP), AI Systems & Automation (automatisation de workflows, agents et assistants métier, intégrations LLM, produits augmentés par l'IA), Technology & Infrastructure (architecture applicative et données, APIs et intégrations, authentification, paiement, tableaux de bord) et Brand & Executive Presence (positionnement, écosystème digital, architecture de contenu). Nous travaillons avec des fondateurs, des PME, des scale-ups, des institutions et des marques personnelles premium. Les missions de Growth, Revenue et Operations sont portées par Cléa Growth Office, practice sœur au sein de MY ONOMA. Les prestations contractualisées sous MY ONOMA sont réalisées par MY ONOMA SARL, à Dakar.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Agence', url: `${SITE_URL}/agence` },
    ],
  },
  // Offre « Digital Commerce Local » — déplacée depuis /agence, à contenu constant.
  // ⚠️ Les montants doivent rester alignés sur src/lib/presence/offer.ts.
  '/presence-digitale': {
    title: `Je digitalise ton commerce — Site, Google Maps, WhatsApp | ${SITE_NAME}`,
    description:
      'Ton commerce visible 24h/24, trouvé sur Google Maps et présent sur WhatsApp. Mise en place et accompagnement mensuel pour les commerces de Dakar, Abidjan et Cotonou. Packs à partir de 295 000 FCFA.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/presence-digitale`,
    h1: 'Tes clients te cherchent en ligne',
    bodyText:
      "J'installe la présence digitale complète de ton commerce : site web, fiche Google Business Profile, catalogue produits sur WhatsApp, Facebook, Instagram et Google Merchant, mesure des visites et référencement local. Trois packs de mise en place : Présence Locale à 295 000 FCFA, Commerce Visible à 495 000 FCFA, Boutique Digitale à 895 000 FCFA. Ensuite, un accompagnement mensuel qui publie pour toi, tient ton catalogue à jour et t'envoie un rapport chaque mois : Croissance Automatisée à 375 000 FCFA puis 175 000 FCFA par mois, ou Commerce 360 à 750 000 FCFA puis 225 000 FCFA par mois. Basé à Dakar, pour les commerces du Sénégal et d'Afrique de l'Ouest.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Présence Digitale', url: `${SITE_URL}/presence-digitale` },
    ],
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description:
      'Contacte Max-Morrys pour du coaching personnalisé, des formations en marketing digital, ou un partenariat. Basé à Dakar, Sénégal.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/contact`,
    h1: 'Contact',
    bodyText:
      'Contactez Max-Morrys par formulaire, email (hello@maxmorrys.me), téléphone (+221 77 604 19 85) ou WhatsApp pour discuter de coaching, formations sur-mesure ou partenariats.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Contact', url: `${SITE_URL}/contact` },
    ],
  },
  '/legal/mentions-legales': {
    title: `Mentions légales | ${SITE_NAME}`,
    description:
      'Mentions légales de Max-Morrys : éditeur, hébergeur et informations légales du site.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/mentions-legales`,
    h1: 'Mentions légales',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Mentions légales', url: `${SITE_URL}/legal/mentions-legales` },
    ],
  },
  '/legal/confidentialite': {
    title: `Politique de confidentialité | ${SITE_NAME}`,
    description:
      'Politique de confidentialité et protection des données personnelles de Max-Morrys (RGPD).',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/confidentialite`,
    h1: 'Politique de confidentialité',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Confidentialité', url: `${SITE_URL}/legal/confidentialite` },
    ],
  },
  '/legal/cgv': {
    title: `Conditions Générales de Vente | ${SITE_NAME}`,
    description: 'Conditions Générales de Vente des formations et services Max-Morrys.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/cgv`,
    h1: 'Conditions Générales de Vente',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'CGV', url: `${SITE_URL}/legal/cgv` },
    ],
  },
  /*
   * LES CGU — l'entrée qui manquait, et ce qu'elle coûtait.
   *
   * La page existe (`/legal/cgu`, route montée dans `App.tsx`), `sitemap.ts` la DÉCLARE aux
   * moteurs, et `routes.ts` l'envoie au pré-rendu par le préfixe `/legal/`. Mais aucune
   * entrée ici : elle tombait dans `unknownRouteMeta`, donc servie en
   * `noindex, nofollow` sous le titre générique du site. Le sitemap demandait de l'indexer
   * pendant que la page elle-même l'interdisait — une contradiction qu'aucune porte ne voit,
   * parce que les deux fichiers sont justes séparément.
   *
   * Vérifié en production le 03/09/2026 : `/legal/cgu` répondait 200 avec le titre de
   * l'accueil et `robots: noindex, nofollow`, quand `/legal/cgv` répondait correctement.
   *
   * Les textes reprennent `cgu.seoTitle` / `cgu.seoDescription` de `locales/fr/legal.json`,
   * pour que le robot et le visiteur lisent la même promesse.
   */
  '/legal/cgu': {
    title: `Conditions d'utilisation | ${SITE_NAME}`,
    description:
      "Conditions générales d'utilisation de la plateforme Max-Morrys et de l'assistant IA Rysmo.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/cgu`,
    h1: "Conditions d'utilisation",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: "Conditions d'utilisation", url: `${SITE_URL}/legal/cgu` },
    ],
  },
  '/legal/cookies': {
    title: `Politique de cookies | ${SITE_NAME}`,
    description: 'Politique de gestion des cookies et traceurs sur le site Max-Morrys.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/cookies`,
    h1: 'Politique de cookies',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Cookies', url: `${SITE_URL}/legal/cookies` },
    ],
  },
};
