# Réconciliation — PRD × famille « audits » (13 août 2026)

_Établi le 29 août 2026._

**Sources réconciliées** : `docs/MAXMORRYS-CURRENT-STATE.md`, `docs/UX-AUDIT.md`, `docs/SEO-AUDIT.md`,
`docs/CONTENT-TODO.md`, `docs/MAXMORRYS-TRANSFORMATION-PLAN.md` — toutes datées du 13 août 2026.

**Cible** : `prd.md` (révision 2) et `addendum.md`.

## Méthode, et pourquoi elle est celle-là

Ces cinq documents ont seize jours et le code a bougé sous eux. Le PRD s'est déjà trompé deux
fois en leur faisant confiance plutôt qu'au dépôt — sur `npm test` en CI et sur le consentement
newsletter. **Aucun constat n'est repris ici sans avoir été rejoué contre le code**, avec le
fichier et la ligne. Un constat que le code contredit est classé périmé, pas passé sous silence :
savoir qu'un document ment est une information.

**Décompte.** 58 constats vérifiés. **27 tiennent encore et manquent au PRD** ; 18 tiennent encore
et sont déjà couverts ; **13 sont périmés** — dont **deux que le PRD propage encore** (FR-091,
seconde moitié de FR-085).

---

# I. Encore vrai dans le code, et manquant au PRD

## A. UX et contenu

### A-1 — Aucun module de vocabulaire d'appel à l'action

`src/i18n/locales/fr/common.json` n'a **pas** de clé `cta`. Le vocabulaire partagé
`common.cta.*` décidé par `UX-AUDIT §3` n'existe pas. Constat rejoué :

| Destination | Formulations distinctes | Emplacements |
|---|---|---|
| `/formations` | **6** | « Voir les formations » (`club.json:135`, `media.json:25`, `shared.json:81`, `blog.json:57`, `home.json:153`), « Explorer les formations » (`lms.json:157`, `lmsTabs.json:23,33`, `home.json:44`), « Découvrir toutes les formations » (`home.json:68`), « Trouve ta formation » (`home.json:107`), « Voir les nouveautés » (`home.json:56`), « Ou découvre mes formations » (`about.json:343`) |
| `/contact` | **5** | « Contacte-moi » (`nav.json:12`), « Me contacter » (`faq.json:16,20`, `media.json:47`), « Nous contacter » (`lms.json:121`), « Prendre rendez-vous » (`footer.json:21`, `contact.json:51`), « Prendre contact » (`about.json:342`, `home.json:154`) |
| WhatsApp | **3** | « En parler sur WhatsApp » (`presence.json:9,27`), « Poser ma question sur WhatsApp » (`presence.json:10`), « Continuer sur WhatsApp » (`presence.json:335,356`) |

Chaque libellé est une clé i18n isolée : **rien n'empêche structurellement la dérive**, et elle a
lieu. Le PRD pose le système de voix comme un actif produit (§3) sans jamais exiger sa
gouvernance. La dérive du vocabulaire est l'usure de cet actif.

### A-2 — Le titre SEO par défaut contredit le H1, dans les trois copies

`DEFAULT_TITLE = 'Max-Morrys | Maîtrisez le digital, accélérez votre croissance'` — vouvoiement —
dans `src/components/seo/seo-config.ts:5`, `worker/apps/site/src/constants.ts:11` et
`functions/src/prerender.ts:10`. Le H1 tutoie : `home.json:38` (« Maîtrise le ») et
`functions/src/prerender.ts:58` (`h1: 'Maîtrise le digital, accélère ta croissance'`).

**C'est la chaîne la plus vue du site** — le titre affiché en résultat de recherche — et c'est la
seule qui sorte du registre. Le PRD écrit « Toute exigence de ce PRD s'y conforme » sans constater
l'écart déjà en production. L'audit le qualifiait d'arbitrage éditorial, pas de correctif : c'est
exactement ce qu'un PRD doit trancher.

### A-3 — La page 404 n'a ni en-tête ni pied de page

`src/App.tsx:344-351` monte `{ path: '*', element: <NotFound /> }` sous `AuthLayout`, qui ne rend
que `<MetaPixelTracker/>`, `<Outlet/>` et `<ScrollRestoration/>` (lignes 190-197). Aucune
navigation, aucun lien de sortie, aucun pied de page.

Sur une plateforme dont le moat déclaré n°2 est la distribution propriétaire par le référencement
(§1), **toute URL indexée devenue périmée aboutit à une impasse totale**. Le système de
redirections administrable (FR-008) traite les URL connues ; la 404 traite tout le reste, et elle
ne rend rien.

### A-4 — Les votes 👍/👎 de la FAQ n'écrivent rien

`src/pages/FAQ.tsx:43-48` :

```
const markHelpful = (id: string, helpful: boolean) => {
  if (!helpfulIds.includes(id)) {
    setHelpfulIds((prev) => [...prev, id]);
    addToast('success', helpful ? t('thanksPositive') : t('thanksNegative'));
  }
};
```

État local et notification. **Aucune écriture Firestore.** L'interface remercie pour un retour
qu'elle jette. Deux conséquences : une promesse d'action inexistante, et la perte du seul signal
de qualité disponible sur la FAQ — au moment précis où FR-095 veut donner une URL propre à chaque
question.

### A-5 — Un message de contact n'atteint jamais la boîte de son expéditeur

Trois points concordants, vérifiés séparément :

1. `src/pages/Contact.tsx:89-93` — `addDoc(collection(db, 'messages'), { ...payload, sentAt, status: 'new' })`. **Aucun `userId`**, y compris quand l'utilisateur est connecté.
2. `src/lib/firestore/certificates.ts:42` — `getUserMessages` interroge `where('userId', '==', userId)`.
3. `firestore.rules:203` — `allow read: if isOwner(resource.data.userId) || isAdminOrSupport();`

`src/pages/lms/tabs/MessagesTab.tsx:56` appelle `getUserMessages(userId)`. **Un apprenant connecté
qui écrit par le formulaire public ne reverra jamais son message dans son espace** — ni par la
requête, ni par la règle. Le champ n'est écrit nulle part.

### A-6 — Deux entrées de pied de page pour la même URL

`src/components/layout/Footer.tsx:35-36` : `links.contact` → `/contact` et `links.booking` →
`/contact`. Or `footer.json:21` libelle la seconde « Prendre rendez-vous ». Un libellé promet une
prise de rendez-vous et livre un formulaire générique.

### A-7 — La vidéo de fond en autoplay de l'accueil viole NFR-04, et le PRD ne le dit pas

`src/pages/Home.tsx:236-246` :

```
<video src="https://media.maxmorrys.me/Le%20Marketing%20en%20Pratique.mp4"
       poster={DEFAULT_OG_IMAGE} autoPlay muted loop playsInline preload="metadata" … />
```

Plein écran, `autoPlay`, **aucune condition de bande passante, aucun repli statique**, sur la
**seule page importée statiquement pour préserver le LCP**.

Le PRD pose NFR-04 (« Le poids en mégaoctets d'une page et d'un cours est une contrainte de
conception ») et établit en §2.1 que 2 Go/mois coûtent en médiane 4,2 % du RNB par habitant en
Afrique. **Il n'y a pas de violation plus visible de sa propre exigence, et il ne la nomme pas.**
Une NFR dont le contre-exemple le plus flagrant est la page d'accueil n'est pas opposable.

### A-8 — Aucun budget de performance n'est vérifié

`src/lib/web-vitals.ts:11,41` instrumente `onCLS`, `onINP`, `onLCP`, `onFCP`, `onTTFB` vers le
dataLayer. `.github/workflows/ci.yml` ne contient **aucune étape de seuil**. Les budgets déclarés
au README (FCP < 1,5 s · LCP < 2,5 s · TTI < 3,5 s · CLS < 0,1) ne sont opposables à rien.

NFR-04 est une intention sans mécanisme, sur un marché où la donnée mobile est le poste de coût du
lecteur.

---

## B. Données structurées et référencement

### B-1 — `BreadcrumbList` manque toujours sur `/a-propos`, `/faq`, `/contact`

L'audit SEO déclarait le correctif « **ajouté** » sur quatre pages. Le code n'en porte qu'une.

`grep -rln BreadcrumbList src/` → `Agence.tsx`, `BlogPost.tsx`, `FormationDetail.tsx`,
`PodcastDetail.tsx`, `VideoDetail.tsx`. **Aucune occurrence** dans `About.tsx`, `FAQ.tsx`,
`Contact.tsx` — ni dans `PresenceDigitale.tsx`, que l'audit ne listait pas et qui est une page
commerciale de premier rang.

C'est le cas d'école de ce dossier : l'audit affirme un correctif au passé, un seul quart a été
livré, et le PRD ne mentionne ni la page traitée ni les trois restantes.

### B-2 — `ItemList` n'existe que sur `/formations`

`src/pages/Formations.tsx:146` est la seule occurrence. Les trois autres index n'émettent qu'un
conteneur sans éléments : `Blog.tsx:86` (`CollectionPage`), `Videos.tsx:105` (`CollectionPage`),
`Podcasts.tsx:99` (`PodcastSeries`).

Trois index de contenu gratuit — **le socle exact du moat de distribution du §1** — sans liste
d'éléments exploitable par un moteur. L'audit classait le point « faible priorité » ; sur un
produit dont l'avantage revendiqué est l'acquisition organique, la priorité mérite d'être rejugée.

### B-3 — Le `Person` déclare deux employeurs différents

- `src/pages/About.tsx:251` → `worksFor: { '@type': 'Organization', name: 'Eyone Medical' }`
- `src/pages/Home.tsx:228` → `worksFor: { '@type': 'Organization', name: SITE_NAME }`

Le code porte lui-même l'aveu, `Home.tsx:226` : « ⚠️ `worksFor` diverge de /a-propos, qui déclare
Eyone Medical. C'est une question [ouverte] ».

Même personne, mêmes `sameAs`, deux entités employeuses publiées. Le PRD identifie le fondateur
comme **à la fois le moat et le point de rupture** (R-07) sans traiter la définition de son entité
là où les moteurs la lisent. Le `jobTitle` est aligné des deux côtés (« Marketing & Growth
Manager ») : c'est le seul volet du correctif qui a abouti.

### B-4 — Le `Person` n'expose ni `alumniOf` ni `hasOccupation`

Constat de `CONTENT-TODO §3bis.e`, toujours vrai. La page publie deux masters et environ
5 500 caractères d'expériences qui ne servent à rien en référencement. Faible priorité, coût nul.

---

## C. Juridique et preuve — le manque le plus lourd du dossier

### C-1 — Douze organisations tierces nommées publiquement sans accord écrit

`src/lib/brand/clients.ts` publie douze noms sur `/agence` : **Amour Divin, Khanouss, Loma,
HolyCash, English Lab, Klio Pro, ResHo Konnexion, Je Témoigne, LauraVerse, Dunamis Holydays,
Jubilé de Grâce, IN Sénégal 2026.**

L'en-tête du fichier l'écrit lui-même, lignes 12-13 :

> ⚠️ La publication d'une étude de cas suppose l'accord écrit du client — **non obtenu à ce jour**.
> Voir `docs/CONTENT-TODO.md §5`.

**Le PRD ne mentionne ni ces douze noms, ni l'accord manquant, ni CONTENT-TODO §5.** Pour un
document explicitement destiné à un lecteur externe — investisseur, associé, développeur — c'est
une exposition d'un rang comparable à R-08 (objet social), et elle est absente du registre des
risques comme des exigences. Un acquéreur qui découvre douze noms de tiers publiés sans accord ne
lit pas cela comme une négligence de documentation.

Le périmètre s'est par ailleurs élargi deux fois selon CONTENT-TODO, ce qui indique qu'il
s'élargira encore : c'est une règle qu'il faut, pas un rattrapage.

### C-2 — La seule preuve de `/agence` dépend de deux services tiers gratuits

`src/components/agency/SitePreview.tsx:24,29` :

```
https://s.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=820     // bureau
https://api.microlink.io/?url=${encodeURIComponent(url)}                // mobile
```

Utilisé par `ClientWorkIndex.tsx:118,135` et `VentureCard.tsx:29` — c'est-à-dire sur **toute la
section Réalisations**, la seule preuve vérifiable de la page high-ticket. Ni disponibilité, ni
fraîcheur, ni contrat. Le repli textuel sur le nom de domaine existe, ce qui rend la panne
silencieuse plutôt que visible.

Le PRD identifie R-06 (« la seule preuve de `/presence-digitale` repose sur une zone de donnée
vide ») et manque le symétrique : **la seule preuve de `/agence` repose sur deux API gratuites de
tiers**.

### C-3 — Les portraits générés par IA sont sur trois surfaces, pas deux

L'audit en listait deux. Le code en a trois :

- `src/pages/Home.tsx:30` — `PROFILE_IMG`
- `src/pages/About.tsx:337`
- `src/pages/Podcasts.tsx:42` — **non relevé par l'audit**

Tous trois pointent vers `media.maxmorrys.me/A-propos/ChatGPT Image 14 mai 2026…`. FR-084 sous-
estime le périmètre à corriger, et le fait que l'image se soit propagée depuis l'audit montre
qu'elle continuera de le faire tant qu'aucune photographie réelle n'existe au dépôt.

### C-4 — Une quatrième coordonnée publique diverge, et elle est fautive

FR-085 vise deux adresses. Il y en a davantage :

| Valeur | Emplacement |
|---|---|
| `contact@maxmorrys.me` | `legal.json` (6 occurrences FR + 6 EN) — texte contractuel |
| `hello@maxmorrys.me` | `brand/company.ts:94`, `prerender.ts:218`, `rysmo.ts:76`, `worker/apps/api/src/lib/rysmo-knowledge.ts:24` |
| `contact@myonoma.com` | `brand/company.ts:60` — entité légale, légitime |
| **`contact@maxmorrys.com`** | **`src/pages/admin/AdminSettings.tsx:52`** — **mauvais domaine de premier niveau** |

`AdminSettings.tsx:53` porte de surcroît `contactPhone: '+221 77 000 00 00'`, valeur d'espace
réservé, dans un écran administrable qui alimente la façade. FR-085 doit couvrir les quatre, pas
les deux.

---

## D. Qualités du produit à préserver que le PRD a oubliées

Le PRD reprend correctement : le système de voix « Je te… » (§3), la séparation des données de
devis (FR-050, NFR-08), la rigueur du webhook (FR-018, NFR-02), la discipline i18n (FR-065,
NFR-06), le tunnel LMS complet, la contrainte de contraste `lagoon` (NFR-09). Il en oublie sept.

### D-1 — La contrainte d'entité de marque, « la plus importante de l'audit SEO »

`src/pages/Agence.tsx:203-227` implémente exactement la forme prescrite :

```
Service
  ├── brand    : Brand("Max-Morrys Agency")
  └── provider : Organization(MY ONOMA SARL, avec PostalAddress)
```

avec en commentaire, ligne 205 : « il ne doit jamais exister d'`Organization` autonome portant ce
nom ».

**C'est un invariant juridique** — Max-Morrys Agency est une marque commerciale, pas une personne
morale — **traduit en données structurées**. Rien dans le PRD ne l'énonce. Une future exigence
peut donc le casser sans qu'aucun document ne s'y oppose, et le casser publie une société qui
n'existe pas.

### D-2 — La règle de déduction des capabilities

`clients.ts` ne publie `productStrategy`, `productDesign`, `uxui` ni `designSystem` pour aucun des
onze projets repris de la page À propos. Le champ est `capabilities?` — optionnel à dessein — avec
en commentaire : « plutôt que de les inventer, le champ reste absent et la carte n'affiche pas le
bloc ». Seul Amour Divin les porte, parce qu'elles étaient déjà sourcées.

C'est **exactement la discipline anti-preuve-inventée que le PRD revendique** en D-03 et FR-053,
appliquée à un endroit qu'il ne cite pas. La nommer la rend défendable ; la taire la rend
révocable par le premier qui trouvera la page trop maigre.

### D-3 — Le système d'univers colorés par section

`src/lib/sectionThemes.ts` : cinq teintes de section (blog, podcasts/Club, Rysmo, offre TPE,
identité personnelle) en classes littérales, contrainte de purge Tailwind. L'état des lieux le
qualifie de « vrai système, pas une préférence ». Le PRD et l'addendum n'en retiennent que la
contrainte de contraste — c'est-à-dire la limite, pas l'actif.

### D-4 — Les acquis d'accessibilité au-delà du contraste

Vérifiés : lien d'évitement (`App.tsx:163`, `nav.json:23`), coupe-circuit global
`prefers-reduced-motion` (`src/index.css:157`) honoré par `useReducedMotion()` dans les presets
d'animation, piège de focus et restauration du `Modal`, `aria-invalid` / `aria-describedby` /
`role="alert"` sur `Input`, `role="switch"` sur `Toggle`, cibles tactiles à 36/44/48 px.

NFR-09 se réduit au contraste `lagoon`. Sept mécanismes tiennent aujourd'hui et ne sont protégés
par aucune exigence.

### D-5 — Le rechargement automatique sur chunk périmé

`src/App.tsx:15` — `lazyWithReload()`, appliqué à toutes les pages sauf `Home`, `Forbidden403` et
`NotFound`. Sur une audience qui garde des onglets ouverts en réseau intermittent, c'est ce qui
évite l'écran blanc après chaque déploiement. Aucune NFR ne le protège, et il disparaîtrait sans
bruit d'un refactor du routeur.

### D-6 — Le lien WhatsApp du devis est un vrai `<a href>`, jamais `window.open()`

`src/pages/PresenceDigitale.tsx:778` documente le choix : « C'est un VRAI lien, pas un
`window.open()` : après l'`await`, Safari/iOS bloquerait l'ouverture. »

Piège de régression classique : un relecteur « corrigera » ce code pour l'uniformiser s'il n'est
pas protégé par écrit, et cassera le seul point de bascule vers la conversation commerciale de la
ligne TPE, sur la plateforme où elle se joue.

### D-7 — La navigation ne tient qu'à 1280 px, et elle est pleine

`src/components/layout/Header.tsx:369` — `<nav className="hidden xl:flex …">`. En dessous de `xl`,
toute la navigation bascule en menu replié. Le plan de transformation §4 avertit : les six
libellés FR longs ont imposé de compacter le padding des items, le rappel `⌘K` et la gouttière de
la rangée ; **« un septième libellé imposerait une nouvelle compensation »**.

Le PRD ouvre des lignes de service sans connaître le budget d'entrées de navigation restant. Il
est de zéro.

---

## E. Ce que le plan de transformation prévoit et que le PRD ignore

### E-1 — FR-068 demande de construire ce qui existe déjà

Constat rejoué, et il contredit la formulation de l'exigence.

**Le tunnel d'achat EST instrumenté de bout en bout** : `trackViewItem` (`FormationDetail.tsx:58`),
`trackAddToCart` (`FormationDetail.tsx:131`), `trackBeginCheckout` (`Checkout.tsx:47`),
`trackPurchase` (`Checkout.tsx`, `PaymentReturn.tsx:52`) — câblés sur GA4 et Meta Pixel.

**Le tunnel agence l'est aussi**, exactement comme le prévoit le plan §14 : `agency_view`,
`agency_form_start`, `agency_form_submit`, `agency_cta_click` ×2, `agency_capability_view`,
`growth_referral_click` ×2 (`Agence.tsx:120,135,179,282,371,548,789,825`).

Or FR-068 écrit : « Aujourd'hui l'endroit où se perd le prospect est supposé, pas mesuré. »
**C'est inexact au sens strict, et c'est une inexactitude coûteuse** : elle fera refaire un
chantier livré. Ce qui manque réellement est en trois points, et mérite d'être écrit ainsi :

1. **L'exploitation** des événements déjà émis — personne ne les a lus ;
2. **La redirection vers Bictorys**, seul saut du tunnel sans événement de part et d'autre ;
3. **Le délai jusqu'à la première leçon ouverte** — c'est M-11, qui n'a pas d'événement source.

### E-2 — Le désalignement délibéré entre vocabulaire d'interface et vocabulaire de base

`agency_leads` et `agency_quotes` conservent leurs noms alors que l'offre s'appelle désormais
Présence Digitale (`src/lib/firestore/agency.ts:21-22,38,56`) ; la ligne high-ticket vit dans
`engagement_leads` (`src/lib/firestore/missions.ts:2,48`). Le plan §9 le justifie : renommer
casserait données de production, règles et écran d'administration.

Le glossaire du PRD fixe « Prospect » et « Devis » sans dire que **le vocabulaire d'interface et
le vocabulaire de base sont volontairement désalignés**. C'est précisément le genre d'écart qu'un
développeur qui arrive « corrige ».

### E-3 — MY ONOMA n'apparaît que sur trois surfaces, et trois seulement

Plan §12 : `/agence` section 06, une section de `/a-propos`, le pied de page et les pages légales.
« MY ONOMA ne devient **pas** une co-marque omniprésente. »

Le PRD §3 dessine l'arbre de marque sans poser cette limite — qui est pourtant ce qui empêche
l'extension, et ce qui protège la marque personnelle identifiée comme moat.

### E-4 — `/ressources` n'est pas créée, délibérément

CONTENT-TODO §6 et plan §7 : le dépôt ne contient aucune ressource téléchargeable — ni fichier, ni
collection, ni segment d'URL (vérifié : aucune entrée `ressources` dans `src/i18n/segments.ts`).
La page serait vide.

Le §10 « Hors périmètre » du PRD ne la liste pas. Rien n'empêche de la redemander au prochain
tour, et rien ne rappellera pourquoi elle a été refusée.

---

# II. Périmé — à ne plus propager

### Déjà neutralisé par le PRD ou l'addendum

| # | Constat périmé | Preuve au code |
|---|---|---|
| **P-1** | « `npm test` n'est jamais exécuté en CI » (CURRENT-STATE §8.6) | `.github/workflows/ci.yml:33-34` — étape « Unit tests : `npm test` » dans `lint-and-build`, **bloquante** |
| **P-2** | « Newsletter sans consentement » (CURRENT-STATE §8.2, UX §4.4) | `NewsletterForm.tsx:28` (`useState(false)`), `:37` (refus), `:47-48` (`consent`, `consentAt`), `firestore.rules:365-370` (le serveur l'exige) |
| **P-10** | « Les chunks manuels ne couvrent que `firebase/app\|auth\|firestore\|storage` » | `vite.config.ts:30-33` — `/(@firebase\|firebase)\//` groupe **tout**, commentaire explicite à l'appui |

### ⚠️ Périmé, et le PRD le propage encore — à corriger dans le PRD

| # | Constat périmé | Preuve au code | Effet sur le PRD |
|---|---|---|---|
| **P-3** | « `robots.txt` ne bloque pas les équivalents `/en/` » | `public/robots.txt` contient `Disallow: /en/admin`, `/en/my-space`, `/en/checkout`, `/en/payment`, `/en/403`, avec commentaire justificatif | **FR-091 est déjà livrée.** À retirer ou à barrer comme FR-083, identifiant conservé vide |
| **P-4** | « Le pied de page code en dur e-mail, téléphone et ville » | `Footer.tsx:143-152` lit `contact.email`, `contact.phoneDisplay`, `contact.city`, `contact.country` depuis `src/lib/brand/company.ts` ; `corporateUrl` remplace le lien codé en dur | **La seconde moitié de FR-085 est fausse.** Seule tient la divergence des adresses — et elle est plus large que décrite (voir C-4) |

### Correctifs livrés depuis l'audit

| # | Constat périmé | Preuve au code |
|---|---|---|
| **P-5** | « `/legal/cgu` absent du sitemap » | `functions/src/sitemap.ts:84` et `worker/apps/site/src/seo/sitemap.ts:103` |
| **P-6** | « Handle Twitter incohérent `@maxmorrys` vs `@max_morrys` » | `index.html:31` et `seo-config.ts:10` portent tous deux `@max_morrys` |
| **P-7** | « `Badge` n'a pas de variante `lagoon` » | `Badge.tsx:6` (union de types) et `:21-22` (texte en `-700`, contraste documenté) |
| **P-8** | « La FAQ mélange trois registres » | `faq.json` harmonisé au tutoiement — « Tu ne trouves pas ta réponse ? », « Me contacter » ×2. *Réserve : « Nous contacter » subsiste ailleurs (`lms.json:121`), voir A-1* |
| **P-9** | « Aucune redirection d'URL héritée ; une seule redirection dans tout le routeur » | `App.tsx:239` redirige `/agence/devis/:ref` → `/presence-digitale/devis/:ref` ; `App.tsx:382` monte un écran `admin/redirections` pilotant un système administrable (FR-008) |
| **P-11** | « `Agence/hero.webp` et `process.webp` renvoient 404 en permanence » | Déposés, et suivis vers l'offre TPE : `PresenceDigitale.tsx:51-52`. *Réserve opérationnelle : le préfixe `Agence/` reste absent des `FOLDER_RULES` de `worker/apps/media/src/index.ts:61-68` — un envoi applicatif serait rejeté, le remplacement passe par `wrangler r2 object put`* |
| **P-12** | Tout le §1 de l'audit UX : « l'agence est un lien ordinaire », « elle apparaît une fois en position 5 », « elle s'appelle Je te digitalise », « le seul appel B2B mène à `/contact` » | Intégralement implémenté : `nav.json` porte `agency: "Agence"` et `presence: "Je te digitalise"` → `/presence-digitale` (`Header.tsx:502`) ; `home.agency.eyebrow` = « Max-Morrys Agency » ; `home.presence.cta` = « Voir les packs et les tarifs » ; `About.tsx:314-321` fait pointer « Travaillons ensemble » vers `/agence` ; le renvoi est réciproque (`Agence.tsx:840` ↔ `PresenceDigitale.tsx:997`) |
| **P-13** | « Aucun retour serveur sur les erreurs de formulaire — toute la validation est côté client » | **Partiellement périmé.** `firestore.rules:207-213` valide bien côté serveur (champs requis, bornes de taille). Ce qui manque est le **retour de champ** à l'utilisateur, pas la validation |

---

# III. Déjà couvert par le PRD — vérifié, rien à ajouter

| Constat d'audit | Exigence PRD | Vérification |
|---|---|---|
| Trois copies des défauts SEO | FR-087 | `seo-config.ts:5`, `constants.ts:11`, `prerender.ts:10` — confirmé |
| Six emplacements à synchroniser par route | NFR-03, addendum §3 | Confirmé |
| `/paiement/retour` codé en dur côté serveur | NFR-03 | Confirmé |
| Prix du Club : CGV 10 000 vs code 19 900 | FR-030, NFR-01, addendum §2 | Aligné le 13/08 |
| `+340 %` vs `+1 790 %`, `50+`, `94 %` non sourcés | D-03, FR-069, FR-070 | Toujours publiés : `Home.tsx:33`, `About.tsx:295,439`, `about.json:41,251`, `home.json:58` |
| Portraits générés par IA | FR-084 | Toujours là — **périmètre à corriger, voir C-3** |
| Deux e-mails publiés | FR-085 | Vrai — **périmètre à étendre, voir C-4 ; seconde moitié fausse, voir P-4** |
| Tests de règles hors chaîne bloquante | FR-088 | Job `firestore-rules` séparé ; `deploy` a `needs: lint-and-build` seul |
| La CI ne déploie que l'hébergement | R-11, addendum §4 | Le job `deploy` n'exécute que `action-hosting-deploy` |
| `navigate()` non localisés | FR-090 | Confirmé |
| Redirection `/agence/devis/:ref` | FR-056 | `App.tsx:239` |
| Contrainte de contraste `lagoon` 2,6:1 | NFR-09 | Confirmé |
| Séparation devis / données personnelles | FR-050, NFR-08 | `agency.ts:21-22`, règles à l'appui |
| `cn()` sans `tailwind-merge`, classes littérales | addendum §6 | Confirmé |
| Aucune preuve inventée sur `/agence` | FR-053, D-03 | Aucun témoignage, logo ni compteur |
| Pas de grille tarifaire sur `/agence` | FR-053 | Confirmé |
| Leads `growth` orientés vers Cléa | FR-054 | `growth_referral_click` ×2, tag `MY_ONOMA_GROW` |
| Un garde de route est du code client | NFR-07, addendum §9 | Confirmé |

---

# IV. Ce qui mérite de devenir une exigence

Par ordre d'urgence décroissante.

1. **Accord écrit des douze organisations nommées sur `/agence`** (C-1) — le code porte lui-même
   la mention « non obtenu à ce jour ». Exposition juridique et de crédibilité de rang R-08, absente
   du PRD. À poser en risque **et** en exigence bloquante avant toute diffusion externe du document
   ou de la page.

2. **Corriger les deux exigences que le PRD propage à tort** (P-3, P-4) — FR-091 est livrée ;
   la seconde moitié de FR-085 décrit un code qui n'existe plus. Un PRD qui redemande du travail
   fait perd la confiance qu'il vient de gagner en Partie A.

3. **`BreadcrumbList` sur `/a-propos`, `/faq`, `/contact`, `/presence-digitale` et `ItemList` sur
   les trois index** (B-1, B-2) — l'audit affirmait le premier « ajouté » ; un quart l'est. Sur un
   produit dont le moat déclaré est l'acquisition organique, c'est la dette la moins chère à
   rembourser.

4. **La vidéo de fond en autoplay de l'accueil, et un budget de performance opposable** (A-7, A-8)
   — NFR-04 est aujourd'hui violée par la page d'accueil et vérifiée par rien. Nommer la violation
   et brancher un seuil en CI.

5. **Un message de contact doit atteindre la boîte de son expéditeur** (A-5) — trois points du code
   concordent pour garantir que non. Un `userId` manquant, une promesse d'espace membre non tenue.

6. **Un vocabulaire d'appel à l'action partagé, et la voix du titre SEO** (A-1, A-2) — le PRD
   érige le système de voix en actif produit ; six libellés pour une destination et un titre de
   recherche au vouvoiement sont l'usure mesurable de cet actif.

7. **Reformuler FR-068** (E-1) — l'instrumentation existe des deux côtés. Ce qui manque est son
   exploitation, la redirection Bictorys et le délai jusqu'à la première leçon.

8. **Inscrire les sept qualités à préserver** (D-1 à D-7) — au premier rang la contrainte d'entité
   `Service`/`brand`/`provider`, qui est un invariant juridique et que rien n'oppose aujourd'hui à
   une future exigence.
