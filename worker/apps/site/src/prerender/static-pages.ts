import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
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
      "Max-Morrys propose des formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l'IA. Plateforme éducative basée à Dakar, dédiée à la croissance digitale en Afrique francophone.",
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        sameAs: ['https://www.linkedin.com/in/maxmorrys', 'https://www.youtube.com/@maxmorrys'],
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
    canonical: `${SITE_URL}/podcasts`,
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
    canonical: `${SITE_URL}/videos`,
    h1: 'Vidéos Marketing Digital',
    bodyText:
      'Les vidéos Max-Morrys : tutoriels marketing digital, analyses SEO, démonstrations IA, growth hacking. Contenu pratique en français pour entrepreneurs africains.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Vidéos', url: `${SITE_URL}/videos` },
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
  '/agence': {
    title: `Je digitalise ton commerce — Site, Google Maps, WhatsApp | ${SITE_NAME}`,
    description:
      'Ton commerce visible 24h/24, trouvé sur Google Maps et présent sur WhatsApp. Mise en place et accompagnement mensuel pour les commerces de Dakar, Abidjan et Cotonou. Packs à partir de 295 000 FCFA.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/agence`,
    h1: 'Tes clients te cherchent en ligne',
    bodyText:
      "J'installe la présence digitale complète de ton commerce : site web, fiche Google Business Profile, catalogue produits sur WhatsApp, Facebook, Instagram et Google Merchant, mesure des visites et référencement local. Trois packs de mise en place : Présence Locale à 295 000 FCFA, Commerce Visible à 495 000 FCFA, Boutique Digitale à 895 000 FCFA. Ensuite, un accompagnement mensuel qui publie pour toi, tient ton catalogue à jour et t'envoie un rapport chaque mois : Croissance Automatisée à 375 000 FCFA puis 175 000 FCFA par mois, ou Commerce 360 à 750 000 FCFA puis 225 000 FCFA par mois. Basé à Dakar, pour les commerces du Sénégal et d'Afrique de l'Ouest.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Agence', url: `${SITE_URL}/agence` },
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
