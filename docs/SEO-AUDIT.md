# Audit SEO — maxmorrys.me

Constat daté et actions retenues. _13 août 2026._

---

## 1. Architecture technique

Le site est une SPA Vite servie par Firebase Hosting, avec **prerender pour les robots** —
implémenté deux fois : `functions/src/prerender.ts` (Cloud Functions) et
`worker/apps/site/src/prerender/` (port Cloudflare, décrit dans le code comme « miroir exact »).

Le sitemap et le flux RSS sont générés **à la requête**, pas à la compilation. Il n'existe ni
`public/sitemap.xml`, ni script de génération.

### ⚠️ Le risque structurel n° 1 — six emplacements à synchroniser

Toute route ajoutée, renommée ou déplacée doit être répercutée dans :

```
1. src/i18n/segments.ts                          (segment FR → EN, valeur EN unique)
2. firebase.json                                 (rewrites de prerender, FR + /en)
3. worker/apps/site/src/routes.ts                (PRERENDER_EXACT / PRERENDER_PREFIXES)
4. functions/src/prerender.ts                    (métadonnées par route)
5. functions/src/sitemap.ts                      (STATIC_PAGES)
6. worker/apps/site/src/seo/sitemap.ts           (port Worker)
```

En oublier un ne produit **aucune erreur** : la page part simplement à l'origine sans prerender,
donc sans métadonnées pour les robots. La dérive est silencieuse.

### Le risque n° 2 — trois copies des défauts SEO

`SITE_URL`, `SITE_NAME`, `DEFAULT_TITLE`, `DEFAULT_DESCRIPTION` et `DEFAULT_OG_IMAGE` existent
en **trois exemplaires** : `src/components/seo/seo-config.ts`,
`worker/apps/site/src/constants.ts` et `functions/src/prerender.ts`.

Une refonte de marque qui n'en met à jour qu'une seule laisse l'edge servir l'ancienne aux
robots — c'est-à-dire exactement à qui elle est destinée.

---

## 2. Internationalisation

FR canonique et non préfixé, EN sous `/en`. La langue vient **uniquement du préfixe d'URL**.

`SEOHead` émet correctement les alternates `hreflang` fr / en / x-default, avec auto-référence.
Les slugs de contenu sont eux-mêmes localisés (`slug_en`), et `contentPath()` construit les URLs.

**Point fort à préserver** : le sitemap émet une **paire** d'entrées FR+EN par page, avec les
alternates partagés.

---

## 3. Données structurées

### Émises aujourd'hui

| Type | Page |
| --- | --- |
| `Organization`, `WebSite` + `SearchAction`, `Person` | Accueil |
| `Person` | À propos |
| `Course` + `Offer` + `AggregateRating` | Fiche formation |
| `ItemList` de `Course` | Catalogue |
| `Article` | Article de blog |
| `CollectionPage` | Blog, Vidéos |
| `PodcastSeries`, `PodcastEpisode` | Podcasts |
| `VideoObject` | Fiche vidéo |
| `FAQPage` | FAQ, `/agence` |
| `Service`, `ContactPage`, `LocalBusiness` | `/agence`, Contact |
| `BreadcrumbList` | Pages de détail uniquement |

### Manquants

- `BreadcrumbList` sur `/agence`, `/a-propos`, `/faq`, `/contact` → **ajouté**
- `ItemList` pour le blog, les vidéos et les podcasts → non traité, faible priorité

### ⚠️ Contrainte d'entité — la plus importante de cet audit

**Max-Morrys Agency est une marque commerciale, pas une personne morale.**

Il ne doit **jamais** exister de `Organization` autonome nommée « Max-Morrys Agency ». La forme
retenue pour `/agence` :

```
Service
  ├── name      : la prestation
  ├── brand     : "Max-Morrys Agency"
  └── provider  : Organization → MY ONOMA SARL (avec RCCM, adresse, pays)
```

De même, aucune affiliation MY ONOMA n'est ajoutée au `Person` de Max-Morrys : son rôle au sein
de la société n'est pas validé. Voir [CONTENT-TODO.md §4](./CONTENT-TODO.md).

Le `Service` existant, avec `areaServed` Dakar / Abidjan / Cotonou et une `Offer` chiffrée,
décrit l'offre TPE : il **suit** vers `/presence-digitale`.

---

## 4. Migration des URLs

| URL | Sort |
| --- | --- |
| `/agence`, `/en/agency` | **Conservée.** Seul le contenu change — c'est l'adresse déclarée par le dépôt corporate (`practices.build.externalUrl`) |
| `/agence/devis/:ref` | **Redirigée** vers `/presence-digitale/devis/:ref` — des liens circulent déjà sur WhatsApp |
| `/presence-digitale` | Nouvelle, segment EN `digital-presence` |

Le `bodyText` de prerender de `/agence` récitait l'intégralité de la grille tarifaire TPE
(« Packs à partir de 295 000 FCFA »). Il suit vers `/presence-digitale` et est remplacé par une
description high-ticket.

---

## 5. Correctifs de fond

| # | Constat | Action |
| --- | --- | --- |
| 1 | `/legal/cgu` absent de `STATIC_PAGES` alors que la page existe et est servie | **Ajouté** |
| 2 | Handle Twitter incohérent : `@maxmorrys` (`index.html:26`) vs `@max_morrys` (`seo-config.ts:8`) | **Aligné** sur `@max_morrys` |
| 3 | `robots.txt` bloque `/mon-espace`, `/checkout`, `/paiement` mais pas leurs équivalents `/en/` (`my-space`, `payment`, `checkout`) | **Ajoutés** |
| 4 | Le titre SEO par défaut vouvoie (« Maîtrisez le digital ») alors que le H1 de l'accueil tutoie | Signalé — arbitrage éditorial, voir [UX-AUDIT §4](./UX-AUDIT.md) |
| 5 | Trois copies des défauts SEO | Centralisées côté SPA sur `src/lib/brand/` ; les copies edge restent à synchroniser manuellement |

---

## 6. Contenu et indexation

- `/presence-digitale/devis/:ref` reste en `noIndex` — récapitulatif nominatif, comme aujourd'hui.
- Aucune page agence ne doit polluer les résultats de recherche éducatifs : la recherche
  interne (filtrage client-side + Typesense désactivé par flag) porte sur les formations,
  articles, podcasts et vidéos — `/agence` et `/presence-digitale` n'y sont pas indexées.
- Aucune donnée structurée n'a été créée à partir d'informations non vérifiables : ni
  `AggregateRating` sur l'agence, ni `Review`, ni compteur de clients.

---

## 7. Performance — constats non traités

Relevés pendant l'audit, hors périmètre de ce chantier :

- La page d'accueil charge une **vidéo de fond en autoplay** (`Le Marketing en Pratique.mp4`)
  servie depuis R2, non conditionnée à la bande passante. C'est le poste le plus lourd du site
  et il pénalise le LCP sur mobile — la cible étant précisément une audience mobile
  d'Afrique francophone.
- Les chunks manuels de `vite.config.ts` ne couvrent que `firebase/app|auth|firestore|storage` ;
  `firebase/functions` et `firebase/analytics` en sortent.
- `Home` est importée statiquement (choix délibéré pour le LCP), les autres pages sont en lazy.
- Budgets déclarés au README : FCP < 1,5 s · LCP < 2,5 s · TTI < 3,5 s · CLS < 0,1.
  `web-vitals` est instrumenté mais aucun seuil n'est vérifié en CI.

La nouvelle `/agence` est construite **sans image ni vidéo** : sa charge utile se limite au HTML,
au CSS déjà chargé et aux icônes déjà présentes dans le bundle.
