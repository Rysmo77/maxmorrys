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
    /*
     * ── L'ACCUEIL N'AIGUILLE PLUS VERS SIX PORTES, MAIS VERS DEUX PISTES ──────────────
     *
     * Ce `bodyText` décrivait « six portes, du gratuit au sur-mesure », dont « l'Agence sur
     * cadrage écrit » — une page qui n'existe plus. Le CDC du 14/09/2026 refait l'accueil sur
     * cinq blocs : la personne, les DEUX pistes à poids égal, la preuve datée, les dernières
     * publications, le renvoi vers MY ONOMA. Il ne vend plus rien directement.
     *
     * ⚠️ LES TROIS MOYENS DE PAIEMENT SONT OBLIGATOIRES ICI. `proof:check` règle 9 compare
     * l'ENSEMBLE des marques de paiement citées par ce bloc avec celles de `hero.lede` de
     * `fr/home.json`. Les robots et les humains doivent lire la même promesse : en retirer un
     * d'un seul côté fait tomber la barrière, et c'est exactement ce qu'elle existe pour
     * attraper — le défaut s'est produit le 04/09/2026.
     *
     * ⚠️ AUCUN CHIFFRE ICI (AD-5). La page compte ses publications EN BASE, à l'affichage,
     * avec leur date de relevé. Un nombre écrit en dur dans ce miroir serait faux le
     * lendemain, et rien ne le dirait.
     */
    h1: 'Max-Morrys, conception web et formation',
    bodyText:
      "Max-Morrys conçoit des sites et des plateformes web, et forme au digital — référencement, marketing, intelligence artificielle. Une seule personne, à Dakar, pour le marché francophone d'Afrique de l'Ouest.\n\n" +
      "Deux pistes, et aucune n'est l'antichambre de l'autre. La piste Conception se fait POUR vous : mise en ligne d'un commerce ou d'une TPE avec des formules bornées et des prix publiés, et projets sur mesure sur devis — sites corporate, plateformes, portails métier, systèmes de design. La piste Apprendre se fait PAR vous : formations, blog, podcast et vidéos, et le Club des Digitos.\n\n" +
      "Ce qui s'achète ici se paie en francs CFA, avec Wave, Orange Money ou une carte : la carte reste facultative, pas de conversion, pas de compte à l'étranger.\n\n" +
      /*
       * ⚠️ DEUX PHRASES ONT ÉTÉ RETIRÉES D'ICI LE 18/09/2026, ET C'EST UNE CORRECTION DE VÉRITÉ.
       *
       * 1. « chaque leçon a une transcription » et « le poids de chaque vidéo est annoncé » :
       *    le produit dit aujourd'hui l'inverse, en toutes lettres et de son plein gré —
       *    `fr/media.json` porte « Il n'est pas encore mesuré à l'enregistrement » et « La
       *    transcription n'est pas encore produite pour cet épisode ». Le miroir promettait
       *    donc aux moteurs ce que la page refuse d'affirmer à un humain. Ne pas les remettre
       *    tant que le poids n'est pas relevé à l'enregistrement.
       *
       * 2. L'exemple « Cosmétique Almadies » est rendu à la piste Apprendre
       *    (`apprendre:entries.blog.body`), où il vit devant le blog qu'il décrit. L'accueil
       *    ne vend rien (CDC §4.1) : il présente et il aiguille.
       */
      "Le blog, le podcast et les vidéos s'ouvrent sans compte et sans rien payer. Rien ne se télécharge avant qu'une lecture soit lancée, parce qu'un forfait mobile se compte.\n\n" +
      "Le seul chiffre affiché sur cette page est une DATE : celle de la dernière publication, lue en base au moment de l'affichage. Le décompte de ce qui a été publié — articles, épisodes, vidéos, formations montées — est relevé et daté sur la page « Je suis Max-Morrys ». Ni abonnés, ni vues, ni nombre d'élèves, ni taux de réussite, nulle part.\n\n" +
      "La direction marketing, la stratégie de marque et l'acquisition ne sont pas vendues ici : elles sont portées par MY ONOMA SARL, la société qui les contracte.",
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
      "Concepteur web, formateur et créateur de contenu digital basé à Dakar. Je cadre les projets, j'écris les articles, je monte les formations, j'anime le Club, et je réponds aux messages.\n\n" +
      "Deux pistes, un seul interlocuteur. Je conçois des sites et des plateformes web pour des commerces, des TPE et des organisations ; et je forme au digital — référencement, marketing, intelligence artificielle — par des formations, un blog, un podcast et une communauté.\n\n" +
      "Max-Morrys est la marque de conception web et de formation ; MY ONOMA SARL est la société qui contracte les missions de direction marketing. Max-Morrys Agency est le nom sous lequel les missions de conception sont contractées : c'est une marque, pas une personne morale distincte.\n\n" +
      /*
       * ⚠️ AUCUN NOMBRE EN DUR ICI (AD-5). Les quatre comptes sont lus en base à l'affichage :
       * les écrire dans ce miroir les rendrait faux dès la publication suivante, et rien ne
       * le signalerait — c'est exactement le défaut que `proof:check` existe pour attraper.
       * Cette page est la SEULE à les porter depuis le 18/09/2026 ; l'accueil n'en garde que
       * la date de dernière parution et renvoie ici.
       */
      "Cette page porte les chiffres de production de la plateforme : articles publiés, formations montées, épisodes de podcast, vidéos. Ils sont comptés en base au moment de l'affichage, et datés. Ce sont des chiffres de production, pas d'audience — ni élèves, ni vues, ni chiffre d'affaires.",
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
      "Le podcast et les vidéos de Max-Morrys : des gens d'Afrique de l'Ouest racontent ce qu'ils ont fait pour vendre en ligne. Gratuit, sans compte, avec une transcription quand elle existe.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/podcast-et-videos`,
    h1: 'Écouter & regarder',
    bodyText:
      "Le blog donne des méthodes ; ici, des gens racontent ce qu'ils ont fait. Épisodes de podcast et vidéos réunis sur une seule page, gratuits et sans compte, avec une transcription quand elle existe.",
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
  /*
   * ═══════════════════════════════════════════════════════════════════════════════
   * LA PISTE CONCEPTION — page mère. C'est l'ancienne entrée `/agence`, à son adresse
   * neuve (CDC §3.3 : la page agence est supprimée, son URL est une 301 vers ici).
   *
   * ⚠️ CE QUI A ÉTÉ RETIRÉ DU TEXTE, ET POURQUOI. L'ancienne prose vendait
   * « Brand & Executive Presence (positionnement, écosystème digital, architecture de
   * contenu) ». Le CDC en fait un point de recette explicite : aucune prestation de
   * direction marketing, de stratégie de marque ou d'acquisition n'est proposée à la
   * vente sur maxmorrys.me — ces missions sont portées par MY ONOMA, on renvoie, on ne
   * vend pas. Le paragraphe de renvoi en fin de corps EST cette frontière.
   *
   * ⚠️ Aucun tarif ici : la grille publique appartient à `/conception/commerces-et-tpe`,
   * et les projets sur mesure n'affichent aucun prix.
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  '/conception': {
    title: `Conception de sites web et de plateformes numériques | ${SITE_NAME}`,
    description:
      "Studio de conception web et de plateformes numériques à Dakar. Deux niveaux d'engagement : une offre bornée pour les commerces et les TPE, des projets sur mesure sur devis.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/conception`,
    h1: 'Conception de sites web et de plateformes numériques',
    bodyText:
      "Max-Morrys conçoit des sites web et des plateformes numériques depuis Dakar. Le studio prend le projet au cadrage et le rend en service : conception d'interface, développement, mise en ligne, documentation d'exploitation. Une seule équipe, du premier écrit à la recette.\n\n" +
      "Deux niveaux d'engagement, et aucun des deux n'est caché. L'offre commerces et TPE est productisée : des formules bornées, des prix publiés en francs CFA, un paiement par Wave, Orange Money ou carte, pour les commerces et TPE d'Afrique de l'Ouest. Les projets sur mesure se traitent sur devis : sites corporate et bilingues, plateformes, portails métier, systèmes de design, intégrations.\n\n" +
      "La méthode tient en quatre étapes : cadrer, concevoir, construire, exploiter. Chaque étape se termine sur un livrable que vous relisez, et le jalon suivant ne démarre pas sans votre accord. La recette, la maintenance et la réversibilité se traitent au niveau des projets sur mesure, où elles sont contractuelles.\n\n" +
      "Les garanties sont techniques, donc vérifiables : des budgets de performance tenus et mesurés, une accessibilité conforme au niveau AA, la propriété du code et du dépôt qui vous revient, une documentation d'exploitation livrée avec le site. La réversibilité est comprise : vous repartez avec ce que vous avez payé, sans dépendance à notre outillage.\n\n" +
      "Les réalisations publiées décrivent chacune le rôle réellement tenu, le périmètre technique et la pile logicielle, avec le lien du site en ligne. Aucune n'est mise en ligne sans l'autorisation écrite du client, et aucune n'affiche de résultat commercial : cet accord ne les couvre pas.\n\n" +
      "La direction marketing, la stratégie de marque et l'acquisition ne sont pas vendues ici : elles sont portées par MY ONOMA, la société à laquelle le studio appartient, et opérées par sa practice croissance. Pour un projet intégré, MY ONOMA coordonne la stratégie marketing et le lot technique. Les prestations contractualisées sous MY ONOMA sont réalisées par MY ONOMA SARL, à Dakar.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Conception', url: `${SITE_URL}/conception` },
    ],
    /*
     * CE BALISAGE EXISTAIT DÉJÀ — CÔTÉ REACT, DONC POUR PERSONNE.
     *
     * `src/pages/Agence.tsx` posait `Service` et `Brand` via Helmet. Sur une route
     * prérendue, le Worker écrit le `<head>` que lisent les robots, et React ne repasse
     * qu'après hydratation : aucun crawler ne voyait ce bloc. La page commerciale la plus
     * chère du site n'avait donc, pour les moteurs, aucune donnée structurée.
     *
     * ⚠️ `provider` = MY ONOMA SARL, `brand` = Max-Morrys Agency. Max-Morrys Agency est une
     * MARQUE, pas une personne morale : il ne doit jamais exister d'`Organization` autonome
     * portant ce nom. Miroir de `src/lib/brand/company.ts` et `practices.ts`, tenu par
     * `tests/unit/pages-commerciales-miroir.test.ts`.
     */
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Conception de sites web et de plateformes numériques',
        serviceType: 'Conception web · Plateformes numériques · Portails métier · Systèmes de design',
        description:
          "Studio de conception web et de plateformes numériques à Dakar. Deux niveaux d'engagement : une offre bornée pour les commerces et les TPE, des projets sur mesure sur devis.",
        url: `${SITE_URL}/conception`,
        areaServed: "Afrique de l'Ouest",
        brand: { '@type': 'Brand', name: 'Max-Morrys Agency' },
        provider: {
          '@type': 'Organization',
          name: 'MY ONOMA SARL',
          url: 'https://myonoma.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Quartier Ouakam, Cité Batrain, Lot 384',
            addressLocality: 'Dakar',
            addressCountry: 'SN',
          },
        },
      },
    ],
  },
  /*
   * L'étage PRODUITISÉ de la piste Conception — ancienne `/presence-digitale`, redirigée
   * ici en 301. Le contenu est repris À L'IDENTIQUE : le CDC l'ordonne (« c'est le contenu
   * actuel de la présence digitale, borné et assumé ») et cette page convertit.
   *
   * SEULE ADDITION : le bandeau de segment. C'est le détail qui règle le problème de
   * registre pour un coût nul — il dit au visiteur corporate qu'il n'est pas sur la bonne
   * page, et laquelle l'est. Il doit exister DANS LE CORPS PRÉRENDU, pas seulement à
   * l'écran : un moteur qui indexe cette page sur une requête corporate doit lire à quel
   * segment elle s'adresse.
   *
   * ⚠️ Le TUTOIEMENT est conservé, et c'est une décision, pas un oubli : le contrat de
   * refonte dit que cette page « garde son ton direct MAIS porte le bandeau de segment ».
   *
   * ⚠️ Les montants doivent rester alignés sur src/lib/presence/offer.ts.
   */
  '/conception/commerces-et-tpe': {
    title: `Je digitalise ton commerce — Site, Google Maps, WhatsApp | ${SITE_NAME}`,
    description:
      "Ton commerce visible 24h/24, trouvé sur Google Maps et présent sur WhatsApp. Mise en place et accompagnement mensuel pour les commerces et TPE d'Afrique de l'Ouest. Packs à partir de 295 000 FCFA.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/conception/commerces-et-tpe`,
    h1: 'Tes clients te cherchent en ligne',
    bodyText:
      "Offre commerces et TPE — Afrique de l'Ouest. Pour un site corporate, une plateforme ou un portail métier, la page des projets sur mesure est la bonne porte.\n\n" +
      "J'installe la présence digitale complète de ton commerce : site web, fiche Google Business Profile, catalogue produits sur WhatsApp, Facebook, Instagram et Google Merchant, mesure des visites et référencement local. Trois packs de mise en place : Présence Locale à 295 000 FCFA, Commerce Visible à 495 000 FCFA, Boutique Digitale à 895 000 FCFA. Ensuite, un accompagnement mensuel qui publie pour toi, tient ton catalogue à jour et t'envoie un rapport chaque mois : Croissance Automatisée à 375 000 FCFA puis 175 000 FCFA par mois, ou Commerce 360 à 750 000 FCFA puis 225 000 FCFA par mois. Basé à Dakar, pour les commerces du Sénégal et d'Afrique de l'Ouest.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Conception', url: `${SITE_URL}/conception` },
      { name: 'Commerces et TPE', url: `${SITE_URL}/conception/commerces-et-tpe` },
    ],
    /*
     * Même constat que pour `/conception` : `Service` et `OfferCatalog` étaient posés par
     * `src/pages/PresenceDigitale.tsx`, donc jamais lus par un moteur.
     *
     * ⚠️ LES MONTANTS SONT UN MIROIR DE `src/lib/presence/offer.ts`, ET C'EST LE SECOND :
     * `bodyText` juste au-dessus les écrit déjà en toutes lettres, sans que rien ne le
     * vérifie. `tests/unit/pages-commerciales-miroir.test.ts` tient désormais les deux.
     *
     * Le prix émis est le prix EFFECTIF (`promoPrice ?? price`), pas le prix de liste :
     * c'est ce que la personne paie, et c'est ce que `Offer.price` désigne. Le pack
     * « Présence Locale » est donc à 250 000, pendant que la prose annonce 295 000 barré —
     * l'écart est voulu et suit `packEffectivePrice()`.
     *
     * Aucun `aggregateRating` : le produit n'a pas d'avis collectés, et en fabriquer un
     * serait le premier des six interdits.
     */
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Je digitalise ton commerce — Site, Google Maps, WhatsApp',
        description:
          "Ton commerce visible 24h/24, trouvé sur Google Maps et présent sur WhatsApp. Mise en place et accompagnement mensuel pour les commerces et TPE d'Afrique de l'Ouest.",
        areaServed: "Afrique de l'Ouest",
        url: `${SITE_URL}/conception/commerces-et-tpe`,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Packs de mise en place',
          itemListElement: [
            { '@type': 'Offer', name: 'Présence Locale', price: 250000, priceCurrency: 'XOF' },
            { '@type': 'Offer', name: 'Commerce Visible', price: 495000, priceCurrency: 'XOF' },
            { '@type': 'Offer', name: 'Boutique Digitale', price: 895000, priceCurrency: 'XOF' },
          ],
        },
      },
    ],
  },
  /*
   * L'ÉTAGE SUR DEVIS. Vouvoiement strict — le CDC en fait un point de recette :
   * « la page Projets sur mesure ne contient aucun tutoiement ».
   *
   * ⚠️ AUCUN PRIX, ET AUCUN `Offer`. Le CDC l'écrit deux fois (« sur devis », « aucun prix
   * affiché »), et le contrat de refonte le redit : sur cette piste, une fourchette nomme
   * une FORME D'ENGAGEMENT — durée, équipe — jamais une somme. Un `Offer` sans `price`
   * n'existe pas en schema.org ; en poser un avec un montant inventé serait la première
   * chose qu'un moteur afficherait, et elle serait fausse.
   */
  '/conception/projets-sur-mesure': {
    title: `Projets sur mesure — Sites, plateformes et portails | ${SITE_NAME}`,
    description:
      "Sites corporate et bilingues, plateformes, portails métier, systèmes de design et intégrations. Parcours d'engagement, recette, maintenance et réversibilité. Sur devis, depuis Dakar.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/conception/projets-sur-mesure`,
    h1: 'Projets sur mesure',
    bodyText:
      "Nous concevons et développons des sites corporate et bilingues, des plateformes, des portails métier, des systèmes de design et les intégrations qui les relient à vos outils existants. Chaque projet est traité sur devis : le périmètre est écrit avant le premier jour de travail.\n\n" +
      /*
       * ⚠️ CE PARAGRAPHE DÉCRIVAIT UNE SECONDE MÉTHODE. La page mère porte la méthode de
       * TRAVAIL (cadrer, concevoir, construire, exploiter) ; celle-ci porte le parcours
       * d'ENGAGEMENT, de la première conversation au contrat. Les deux existaient en quatre
       * étapes numérotées, rendues par le même code, et se lisaient comme une répétition.
       */
      "Le parcours d'engagement tient en quatre étapes, et aucune n'engage la suivante. Une conversation, sans engagement, pour savoir si le studio est le bon interlocuteur. Un cadrage écrit qui établit le périmètre, les hypothèses et ce qui n'est pas inclus. Une proposition chiffrée sur ce cadrage, avec ce qui relève d'un avenant et la durée de validité. Puis un contrat, qui reprend le cadrage sans le réécrire et fixe la date de démarrage.\n\n" +
      "Après la mise en service, la maintenance couvre les correctifs, les mises à jour de sécurité et l'évolution du périmètre convenu. Vous recevez une documentation d'exploitation et les accès à votre dépôt de code.\n\n" +
      "La réversibilité fait partie du contrat : le code, les contenus et les données vous appartiennent, et ils sont exportables sans notre intervention. Aucune de nos réalisations ne dépend d'un outillage que nous serions seuls à savoir opérer.\n\n" +
      "Nous répondons à vos questions techniques avant le devis : budgets de performance, accessibilité, hébergement, sauvegardes, propriété du code. Pour la direction marketing, la stratégie de marque et l'acquisition, la demande revient à MY ONOMA.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Conception', url: `${SITE_URL}/conception` },
      { name: 'Projets sur mesure', url: `${SITE_URL}/conception/projets-sur-mesure` },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Projets sur mesure',
        serviceType: 'Sites corporate · Plateformes · Portails métier · Systèmes de design',
        description:
          "Sites corporate et bilingues, plateformes, portails métier, systèmes de design et intégrations. Parcours d'engagement, recette, maintenance et réversibilité. Sur devis.",
        url: `${SITE_URL}/conception/projets-sur-mesure`,
        areaServed: "Afrique de l'Ouest",
        brand: { '@type': 'Brand', name: 'Max-Morrys Agency' },
        provider: {
          '@type': 'Organization',
          name: 'MY ONOMA SARL',
          url: 'https://myonoma.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Quartier Ouakam, Cité Batrain, Lot 384',
            addressLocality: 'Dakar',
            addressCountry: 'SN',
          },
        },
      },
    ],
  },
  /*
   * LE PORTFOLIO TECHNIQUE. Index seul : les fiches vivent en base et passent par
   * `getContentMeta`, comme un article ou une formation.
   *
   * ⚠️ AUCUN `ItemList` JSON-LD ici. Une liste structurée devrait énumérer des fiches, et
   * ce fichier ne sait pas lesquelles existent — les écrire en dur les ferait mentir au
   * premier ajout. Le fil d'Ariane suffit, comme sur `/blog` et `/formations`.
   *
   * ⛔ NI DURÉE NI RÉSULTAT — ET LA PROMESSE A DÛ ÊTRE RETIRÉE D'ICI.
   *
   * Le CDC §4.2 demande « durée, résultat mesurable » sur chaque fiche. Ce texte le
   * recopiait. Mais `src/lib/brand/clients.ts` porte les deux champs VIDES sur les onze
   * projets, et son en-tête dit pourquoi : l'accord de publication obtenu des clients
   * couvre le nom, le rôle, la pile et le lien — et exclut « aucun résultat, aucun chiffre
   * de croissance ». La prose annonçait donc aux moteurs un contenu que la page ne peut pas
   * rendre, et que le contrat interdit d'obtenir.
   *
   * C'est le défaut exact que `proof:check` traque — une phrase qui décrit une donnée sans
   * en être dérivée — sauf que sa règle ne couvre pas encore cette page. Ne pas réintroduire
   * la durée ni le résultat ici tant que `ClientEvidence` n'est pas renseignée ET l'accord
   * élargi : les deux conditions sont cumulatives.
   */
  '/conception/realisations': {
    title: `Réalisations — Portfolio technique | ${SITE_NAME}`,
    description:
      "Les projets menés par le studio : le rôle réellement tenu, le périmètre technique, la pile logicielle et le site en ligne. Publiés avec l'autorisation écrite du client.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/conception/realisations`,
    h1: 'Réalisations',
    bodyText:
      "Les projets que nous avons menés, décrits par ce qui se vérifie : le rôle que nous avons réellement tenu, le périmètre technique, la pile logicielle employée, et le site en ligne que vous pouvez ouvrir.\n\n" +
      "Chaque fiche est publiée dans les limites de l'autorisation écrite du client : son nom, notre rôle, la pile et le lien. Les résultats commerciaux et les chiffres de croissance n'y figurent pas — cet accord ne les couvre pas, et nous préférons le dire plutôt que de publier ce que personne ne pourrait vérifier.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Conception', url: `${SITE_URL}/conception` },
      { name: 'Réalisations', url: `${SITE_URL}/conception/realisations` },
    ],
  },
  /*
   * LA PISTE APPRENDRE — page mère. Ossature seule : le CDC est explicite (« contenu et
   * voix inchangés, les modifications portent uniquement sur l'ossature »).
   *
   * ⚠️ TUTOIEMENT, et c'est la frontière de registre du site : la piste Conception
   * vouvoie, celle-ci tutoie. Un corps prérendu qui vouvoierait ici annoncerait aux
   * moteurs une page que le visiteur ne reconnaîtrait pas en arrivant.
   *
   * ⚠️ Aucun chiffre d'audience — ni abonnés, ni épisodes, ni certificats délivrés. Le CDC
   * les veut datés et exacts, et aucune de ces valeurs n'est disponible ici : elles vivent
   * en base, et une valeur gelée dans ce fichier serait fausse le mois suivant.
   */
  '/apprendre': {
    title: `Apprendre — Lire, écouter, se former, rejoindre | ${SITE_NAME}`,
    description:
      "La piste média et formation de Max-Morrys : le blog, le podcast et les vidéos, les formations en ligne et le Club des Digitos. En français, pour l'Afrique de l'Ouest.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/apprendre`,
    h1: 'Apprendre',
    bodyText:
      "Quatre entrées, et une logique simple : on lit, on écoute, on se forme, on rejoint. Tu peux entrer par n'importe laquelle — elles mènent au même endroit, à des rythmes différents.\n\n" +
      "On lit : le blog publie chaque semaine des méthodes de marketing digital, de SEO et d'IA. Les exemples sont pris ici : « Cosmétique Almadies », pas « organic skincare Brooklyn » — les mots que tapent réellement les clients d'un commerce d'Afrique de l'Ouest.\n\n" +
      "On écoute : le podcast et les vidéos réunissent des gens d'Afrique de l'Ouest qui racontent ce qu'ils ont fait. Gratuit, sans compte, avec une transcription quand elle existe.\n\n" +
      "On se forme : les formations en ligne ajoutent des missions, un suivi et un certificat vérifiable par un tiers depuis son code. Paiement en francs CFA, par Wave, Orange Money ou carte.\n\n" +
      "On rejoint : le Club des Digitos est l'étage en groupe fermé — sessions en direct, missions qui circulent, et une réponse de moi dans les discussions.",
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Apprendre', url: `${SITE_URL}/apprendre` },
    ],
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description:
      "Écrire à Max-Morrys : une formation ou la communauté, un site ou une plateforme à cadrer. La direction marketing, elle, est portée par MY ONOMA. Dakar, Sénégal.",
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/contact`,
    h1: 'Contact',
    /*
     * LE FORMULAIRE S'OUVRE SUR UNE QUESTION D'AIGUILLAGE (CDC §4.5), ET LA TROISIÈME
     * BRANCHE NE COLLECTE RIEN. Quelqu'un qui arrive ici depuis un moteur avec une demande de
     * direction marketing doit l'apprendre AVANT d'écrire : c'est l'objectif O3 du CDC — on
     * renvoie, on ne recopie pas une demande à la main d'un site à l'autre.
     */
    bodyText:
      "Écrire à Max-Morrys par formulaire, par e-mail (hello@maxmorrys.me), par téléphone (+221 77 604 19 85) ou par WhatsApp.\n\n" +
      "Le formulaire commence par une question : de quoi s'agit-il ? Une formation ou la communauté — un cours, un accès, le Club des Digitos, le blog, un épisode. Un site ou une plateforme — un commerce à mettre en ligne, un projet sur mesure à cadrer. Ces deux demandes se déposent ici, et c'est Max-Morrys qui lit et qui répond.\n\n" +
      "Une direction marketing — de l'acquisition, du revenu, une stratégie de marque à piloter — n'est pas portée par Max-Morrys : cette demande s'écrit directement chez MY ONOMA, qui la contracte. Rien n'est recueilli ici pour être recopié là-bas.\n\n" +
      /* Le pied de page mène désormais explicitement au créneau d'appel (`/contact?rdv=1`) ;
         même adresse canonique, donc aucune réécriture à ajouter — mais le miroir ne disait
         nulle part que ce canal existe. */
      "Un créneau d'appel peut aussi être réservé depuis cette page, le soir, heure de Dakar. La demande est enregistrée puis confirmée à la main : rien n'est confirmé automatiquement.",
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
