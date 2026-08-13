# État des lieux — maxmorrys.me

Constat daté, établi avant toute modification de positionnement. Ce document décrit ce qui
**existe**, pas ce qui devrait exister. Il n'est pas mis à jour au fil de l'implémentation :
c'est un point de départ.

_Audit réalisé le 13 août 2026, sur la branche `feature/repositionnement-agency`._

---

## 1. Stack et architecture

| Couche | Technologie |
| --- | --- |
| Front | React **18.3.1** · TypeScript strict · Vite **5.4.2** |
| Routage | React Router **7.13.1**, data router (`createBrowserRouter`) |
| Styles | Tailwind **3.4.1** (config JS, `darkMode: 'class'`) + `@tailwindcss/typography` |
| État / fetching | `useState`/`useEffect` majoritaire · TanStack Query dans **6 fichiers** seulement |
| i18n | i18next **26.3.2**, FR canonique, EN sous `/en`, **22 namespaces** bundlés statiquement |
| Backend | Firebase (Auth, Firestore) · Cloud Functions **v2** · Cloudflare Workers |
| Médias | Cloudflare R2 via `media.maxmorrys.me` — **pas** `firebase/storage` |
| Paiement | **Bictorys uniquement** (Wave, Orange Money, Free Money, carte via page hébergée) |
| IA | Google Generative AI (Gemini) — assistant Rysmo |
| Observabilité | Sentry · web-vitals · GTM + GA4 + Meta Pixel |

**Trois projets TypeScript indépendants** : `src/` (ESM/ES2020/DOM), `functions/src/`
(CommonJS/ES2017/Node), `worker/src/` (ESM/ES2022/workers-types). Aucun fichier partageable
entre eux.

### Le double montage de routes

L'arbre est monté **deux fois** : une fois en français (canonique, non préfixé), une fois sous
`/en` via `localizeRouteTree()`. Les segments d'URL eux-mêmes sont traduits par
`src/i18n/segments.ts`.

> ⚠️ **Ajouter une route = deux éditions.** Le `path` français dans `App.tsx`, **et** son
> segment dans `segments.ts`. Sans le second, `/en` sert silencieusement l'URL française.
> Chaque valeur EN doit par ailleurs être unique sur toute la map.

---

## 2. Cartographie des routes

### Public — `PublicLayout`

`/` · `/a-propos` · `/blog` · `/blog/:slug` · `/formations` · `/formations/:slug` · `/podcasts` ·
`/podcasts/:slug` · `/videos` · `/videos/:slug` · `/faq` · `/contact` · **`/agence`** ·
**`/agence/devis/:ref`** · `/legal/{mentions-legales,confidentialite,cgv,cgu,cookies}`

Toutes les pages sont en `lazyWithReload()` sauf **`Home`, `Forbidden403` et `NotFound`**,
importées statiquement.

### LMS — `LmsLayout` + `ProtectedRoute`

`/mon-espace/{tableau-de-bord,cours,notes,messages,succes,profil,parametres,club,rysmo,temoignages}`
· `/cours/:slug` · `/checkout/:slug` · `/paiement/retour`

### Auth et divers — `AuthLayout`

`/connexion` · `/inscription` · `/mot-de-passe-oublie` · `/certificat/:code` (public, vérification)
· `/403` · `*` → 404

> ⚠️ Le catch-all 404 vit **dans `AuthLayout`** : les pages 404 s'affichent donc **sans en-tête
> ni pied de page**.

### Admin — `AdminRoute` (rôles `admin` et `support`)

17 écrans, dont `/admin/prospects-agence`.

**Une seule redirection dans tout le routeur** : `/mon-espace` → `/mon-espace/tableau-de-bord`.
Aucune redirection d'URL héritée.

---

## 3. Positionnement actuel

### Navigation

| Entrée | Libellé FR | Destination |
| --- | --- | --- |
| about | « Je suis Max-Morrys » | `/a-propos` |
| formations | « Je te forme » | `/formations` |
| blog | « Je t'informe » | `/blog` |
| transform ▾ | « Je te transforme » | `/podcasts`, `/videos` |
| agency | **« Je te digitalise »** | `/agence` |
| contact | « Contacte-moi » | `/contact` |

Système de voix cohérent au **tutoiement**, construit autour de « Je te… ». Il n'existe **aucun
bouton plein** d'appel à l'action dans l'en-tête : l'agence est un simple lien de navigation.

### Page d'accueil — 12 sections

Hero vidéo → Manifeste → Chiffres → Catalogue formations → **Agence** → Quiz → Podcast &
YouTube → Blog → Offre phare → Témoignages → Newsletter → CTA final.

L'agence apparaît **une seule fois**, en position 5, sous l'accroche « Tu as un commerce ? / Je
le digitalise pour toi ».

### Page À propos

Construite comme un **CV/portfolio personnel**, pas comme une page de marque. JSON-LD
`Person`, `jobTitle: 'Marketing & Growth Manager'`, `worksFor: Eyone Medical`. Récit en dix
sections, frise de 11 jalons de 2014 à 2025.

### `/agence` — « Digital Commerce Local »

C'est le cœur de l'écart avec le positionnement cible.

| Élément | Valeur |
| --- | --- |
| Accroche | « Tes clients te cherchent en ligne. » |
| Sur-titre | « Pour les commerces » |
| Cible | Commerce physique, 1 à 15 salariés, CA mensuel 800 000 – 5 000 000 XOF |
| Zone | Dakar, Abidjan, Cotonou |
| Registre | Tutoiement |
| Packs | Présence Locale 295 000 · **Commerce Visible 495 000** · Boutique Digitale 895 000 XOF |
| Accompagnement | Croissance Automatisée 375 000 + 175 000/mois · Commerce 360 750 000 + 225 000/mois (6 mois) |
| Conversion | Formulaire → écriture Firestore → **transfert WhatsApp** + devis partageable |

12 sections, dont un sélecteur « Trouve ton pack en 3 questions », une preuve Google Maps
interactive, une grille tarifaire complète et un tunnel de devis.

**Aucun témoignage, aucun logo client, aucun compteur** sur cette page — la seule preuve est la
démonstration Google Maps.

Ligne documentée dans `docs/OFFRE_AGENCE_TPE.md` (modèle setup-first, plafond estimé ~20M XOF/an,
KPI central : conversion vers l'accompagnement ≥ 40 % à J+30) et modélisée dans `finance/model.py`.

---

## 4. Architecture de marque existante

Le dépôt connaît déjà **un seul niveau** de relation :

```
My Onoma SARL  (société opératrice, myonoma.com)
      └── Max-Morrys  (marque)
            └── /agence  « Digital Commerce Local »
```

| Emplacement | Contenu |
| --- | --- |
| `src/components/layout/Footer.tsx:156-164` | « Max-Morrys est une marque opérée par **My Onoma SARL** » + lien `https://myonoma.com` **codé en dur** |
| `src/i18n/locales/fr/legal.json` | Éditeur, RCCM, NINEA, capital, partie aux CGV, propriété intellectuelle |
| `src/pages/About.tsx:224-228` | Expérience « My Onoma — Digital Marketer Freelance, jan.–oct. 2023 » |
| `about.json` (`milestones.m2023Onoma`) | « **Co-création de My Onoma** » |
| `BUSINESS_PLAN.md:3` | « Société exploitante : My Onoma SARL · Marque : Max-Morrys » |

**Absents du dépôt avant ce chantier** : Cléa Growth Office (0 occurrence), DOVEN (0), NAYO (0),
Amour Divin (0), et toute notion de piliers BUILD/GROW/OWN.

**STEPS** apparaît une fois — `src/pages/About.tsx:59` — mais comme *plateforme maintenue par
Max-Morrys*, non comme venture MY ONOMA.

---

## 5. LMS et paiement — à ne pas casser

### Le tunnel

```
/formations → /formations/:slug → /checkout/:slug → Bictorys (page hébergée)
           → /paiement/retour?transactionId=… → enrollment → /cours/:slug
           → progression → /certificat/:code
```

- Cours gratuit : `writeBatch` client (`transactions` + `enrollments/{uid}_{formationId}`).
- Cours payant : callable `createBictorysCharge`, prix **relu côté serveur**, puis redirection.
- Webhook : dédoublonnage via `webhook_events/{chargeId}`, contrôle du montant, effet de bord
  **avant** le passage en `completed`.
- Certificat émis par callable à 100 % de progression.

### Points de couplage critiques

> ⚠️ **`/paiement/retour` est codé en dur** dans `functions/src/payment.ts:38` et
> `worker/apps/api/src/lib/bictorys.ts:38`. Renommer ce segment ferait atterrir **tout paiement
> en cours** sur une 404.

Le renommage d'un segment public impose une mise à jour coordonnée de **six** emplacements :
`src/i18n/segments.ts`, `firebase.json` (31 rewrites FR + EN), `worker/apps/site/src/routes.ts`,
`functions/src/prerender.ts`, `functions/src/sitemap.ts`, `worker/apps/site/src/seo/sitemap.ts`.

### État de la migration Cloudflare

Le Worker implémente les paiements mais ils **ne sont pas** dans la liste `MIGRATED` de
production : charges et webhook tournent encore sur Cloud Functions. Le port existe et est
activé en préversion — à l'exception de `createClubCharge`, absent de la liste de préversion
alors qu'il est implémenté.

---

## 6. Design system

**Palettes** (Tailwind, échelles 50→950) : `brand` (bleu `#0c93e7`), `accent` (ambre), `success`,
`warning`, `error`, `neutral`, `coral` (blog), `plum` (podcasts + Club), `teal` (Rysmo),
`lagoon` (agence), `morrys` (identité personnelle).

Identité par section centralisée dans `src/lib/sectionThemes.ts`, en **classes littérales**
(contrainte de purge Tailwind).

### Contraintes documentées à respecter

- **`lagoon-500` sur blanc = 2,6:1 → interdit pour du texte.** Utiliser `lagoon-700` sur fond
  clair, `lagoon-400` sur fond sombre.
- `morrys-600` et `plum-600` partagent volontairement le même hex `#8a3de8`. Choisir **par le
  sens**, pas par la couleur.
- `cn()` **n'est pas** `clsx` + `tailwind-merge` : c'est un `filter(Boolean).join(' ')`, sans
  résolution de conflit. Toujours concaténer `className` en dernier.

### Primitives disponibles

`Button` (5 variantes × 3 tailles) · `Card` · `Badge` (9 variantes, **sans `lagoon`**) ·
`Typography` · `Input`/`Textarea` · `Tabs` · `Modal` · `Sheet` · `Toast` · `ConfirmDialog` ·
`Skeleton` · `Breadcrumbs` · `Pagination` · `Toggle` · `PhoneInput` · `ImageInput` · `RichEditor`

Blocs éditoriaux : `EditorialHeading` (+ `CircularBadge`), `CountUp`, `AnimatedIcon`,
`ParallaxImage`, `ArticleCard`, `VideoCard`, `NewsletterForm`, `FormationCTA`, `LocalizedLink`.

> Il n'existe **ni `Section`, ni `Container`, ni `SectionHeader`**. La mise en page est
> reconstruite à la main, selon une convention stable :
> `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`, sections `py-20 lg:py-24` alternant
> `bg-white dark:bg-neutral-950` et `bg-neutral-50 dark:bg-neutral-900`.

L'échelle typographique custom (`text-heading-hero`, `text-heading-section`…) existe mais est
**quasiment inutilisée** : les pages écrivent `text-5xl lg:text-6xl font-black tracking-tight`.

---

## 7. Contenu — écarts constatés

Ces points sont détaillés dans [CONTENT-TODO.md](./CONTENT-TODO.md).

| # | Constat |
| --- | --- |
| 1 | **Chiffres contradictoires** — `+340 %` de trafic (accueil) vs `+1 790 %` (À propos) ; « +5 plateformes » alors que 6 sont listées ; `50+ étudiants`, `94 % de réussite`, `10+ cours` sans source |
| 2 | **Portraits générés par IA** — les deux visuels de Max-Morrys sont des fichiers `ChatGPT Image 14 mai 2026….png` ; aucune photographie réelle dans le dépôt |
| 3 | **STEPS** présenté comme plateforme maintenue ici, comme venture MY ONOMA là-bas |
| 4 | **Aucune ressource téléchargeable** — la rubrique « Ressources » de l'IA cible n'a rien à afficher |
| 5 | Les quatre `.webp` de `public/` sont des banques d'images génériques, licence non tracée |

### Vocabulaire d'appel à l'action

Six formulations pour la même destination `/formations` (« Explorer », « Découvrir toutes »,
« Voir », « Trouve ta », « Voir les nouveautés », « Ou découvre mes »), cinq pour le contact,
dix sur la seule page agence — dont quatre variantes WhatsApp.

**Mélange tu/vous** : le site tutoie partout, mais `faq.ctaButton` dit « Nous contacter »,
`formations.business.cta` dit « Discutons de votre projet », et le titre SEO par défaut vouvoie
(« Maîtrisez le digital ») alors que le H1 tutoie (« Maîtrise le digital »).

Il n'existe **aucun module de vocabulaire CTA partagé** : chaque libellé est une clé i18n isolée.

---

## 8. Écarts techniques et juridiques

| # | Constat | Emplacement |
| --- | --- | --- |
| 1 | **Club : CGV 10 000 FCFA/an vs code 19 900 FCFA** | `legal.json:126` vs `payment.ts:249` |
| 2 | **Newsletter sans consentement** — pas de case, pas de lien politique, aucun champ stocké ; la règle Firestore plafonne à 3 clés | `NewsletterForm.tsx:25-29`, `firestore.rules` |
| 3 | **Deux e-mails publiés** — `contact@maxmorrys.me` (légal) vs `hello@maxmorrys.me` (site) | `legal.json` vs `seo-config.ts:22` |
| 4 | **Adresse légale réduite** à « Dakar, Sénégal » ; forme juridique absente | `legal.json` |
| 5 | **Trois copies des défauts SEO** qui divergent silencieusement | `seo-config.ts`, `worker/apps/site/src/constants.ts`, `functions/src/prerender.ts` |
| 6 | **`npm test` n'est jamais exécuté en CI** — les 28 tests qui gardent la cohérence des prix n'ont aucune couverture | `.github/workflows/ci.yml` |
| 7 | **`navigate()` non localisés** — envoient un visiteur `/en` dans l'arbre FR | `FormationDetail.tsx:123,133`, `Checkout.tsx:54`, `Register.tsx:74,87` |
| 8 | Handle Twitter incohérent : `@maxmorrys` vs `@max_morrys` | `index.html:26` vs `seo-config.ts:8` |
| 9 | `/legal/cgu` absent du sitemap | `functions/src/sitemap.ts:70-84` |
| 10 | Les votes 👍/👎 de la FAQ ne sont **jamais écrits** | `FAQ.tsx:43-48` |
| 11 | Le pied de page code en dur e-mail, téléphone et ville, malgré les constantes prévues | `Footer.tsx:137-146` |
| 12 | Deux entrées de pied de page pointent vers la même URL `/contact` | `Footer.tsx:18-39` |
| 13 | Les messages de contact anonymes n'ont pas de `userId` → invisibles dans la boîte utilisateur | `Contact.tsx:81-101` |

### Ce que la CI vérifie réellement

Bloquants sur PR : `lint`, `typecheck`, `build`, plus le build des Cloud Functions et le
typecheck/test du Worker. **Non bloquants ou absents** : `npm test` (jamais lancé), tests de
règles Firestore (job séparé, hors `needs` du déploiement).

Le job de déploiement **ne pousse que le hosting**. Règles Firestore, index, Cloud Functions et
Workers sont buildés mais **jamais déployés** par la CI.

État à l'audit : `typecheck` ✅ · `lint` ✅ (0 erreur, 24 warnings `exhaustive-deps`
préexistants) · `npm test` ✅ (236 tests, 6 fichiers).

---

## 9. SEO

**Données structurées émises** : `Organization`, `WebSite` + `SearchAction`, `Person`, `Course`,
`ItemList`, `Article`, `CollectionPage`, `PodcastSeries`, `PodcastEpisode`, `VideoObject`,
`FAQPage`, `Service`, `ContactPage`, `LocalBusiness`, `BreadcrumbList` (sur les pages de détail
uniquement).

**Manquants** : `BreadcrumbList` sur `/agence`, `/a-propos`, `/faq`, `/contact` ; aucun
`ItemList` pour le blog, les vidéos ou les podcasts.

Le sitemap est généré à la requête (Cloud Function + port Worker), avec paires FR/EN et
alternates `hreflang`. Il n'existe **pas** de `public/sitemap.xml` ni de script de génération.

`robots.txt` bloque `/admin`, `/mon-espace`, `/checkout`, `/paiement`, `/403` — mais **pas**
leurs équivalents `/en/` (`my-space`, `payment`).

---

## 10. Ce qui fonctionne bien et doit être préservé

- L'**identité éditoriale** « Je te… » : rare, mémorable, cohérente sur tout le territoire LEARN.
- Le **système d'univers colorés** par section : un vrai système, pas une préférence.
- Le **tunnel LMS complet** : catalogue, achat, inscription, lecture, progression, certificat.
- La **rigueur du webhook de paiement** : dédoublonnage, contrôle de montant, ordre des effets.
- La **discipline i18n** : la copie marketing est à 100 % dans les fichiers de langue, aucune
  chaîne accentuée codée en dur dans les pages.
- La **séparation des données du devis TPE** : `agency_quotes` ne contient aucune donnée
  personnelle, et les règles Firestore l'imposent explicitement.
