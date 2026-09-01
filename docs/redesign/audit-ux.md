# Audit UX/UI — maxmorrys.me

**Phase 0 de la refonte. Constat mesuré, aucune modification de code.**
_1er septembre 2026 · état du dépôt au commit `a435bdb`, branche `refonte/design-handoff`._

> Ce document remplace toute lecture antérieure. Les audits du 13 août
> (`docs/UX-AUDIT.md`, `docs/MAXMORRYS-CURRENT-STATE.md`) décrivent un dépôt qui a changé :
> la migration des jetons a été menée le 30 août et plusieurs de leurs constats sont
> aujourd'hui faux. Chaque chiffre ci-dessous a été rejoué contre le code.

---

## 0. Ce que cet audit corrige de sa propre première lecture

Deux mesures ont dû être refaites en cours de route. Elles sont consignées ici parce
qu'une refonte pilotée par le mauvais chiffre attaque le mauvais chantier.

| Mesure de départ | Mesure vérifiée | Ce que ça change |
|---|---|---|
| « 10 fichiers sur 333 consomment le design system » | **133 sur 184 (72 %)** | Le premier comptage cherchait le chemin `design-system`. Le dépôt importe par l'alias `@ds`. **La migration n'est pas à commencer, elle est à finir.** |
| « 36 fichiers restent sur les primitives héritées » | **81 imports hérités, dont 72 (89 %) faute d'équivalent** | Ce n'est pas une dette de migration, c'est un **trou de couverture** du DS. |

---

## 1. Inventaire des surfaces

Cinq surfaces, 70 entrées de route web, 37 écrans mobiles.

| Surface | Volume | Système de composants | État |
|---|---|---|---|
| **Site public** | 19 pages (`/`, formations, blog, podcasts, vidéos, agence, présence digitale, FAQ, à propos, contact) | `@ds` | Migré |
| **Auth & légal** | 3 pages auth + 5 pages légales | `@ds` + 3 imports hérités | Migré |
| **LMS connecté** | 12 routes + 12 onglets + 10 sous-onglets Club | `@ds` (29 fichiers) | Migré |
| **Admin / console** | 19 pages | `@ds` (31 fichiers) + 24 imports hérités | Migré, dépendant des trous |
| **Mobile (Expo)** | 37 écrans, 5 onglets, 24 primitives `mobile/ds` | `mobile/ds` (portage RN du même kit) | Migré, **non différencié par plateforme** |

Le site est **bilingue FR/EN avec segments d'URL traduits** (`src/i18n/segments.ts`,
10 espaces de noms de traduction). Les doublons apparents dans la table des routes
(`formations`, `faq`, `messages`, `podcasts`, `videos`, `temoignages`, `parametres`,
`notifications`) sont les paires FR/EN, pas des collisions.

---

## 2. Grille d'évaluation par surface

Score 1–5. Les notes basses sont adossées à une mesure, jamais à une impression.

| Critère | Public | LMS | Admin | Mobile | Fondement de la note |
|---|---|---|---|---|---|
| Clarté | 4 | 4 | 4 | 4 | — |
| Focus | 4 | 4 | 3 | 4 | — |
| Hiérarchie | 5 | 4 | 3 | 4 | Le kit impose une échelle typographique unique (13 tailles nommées), appliquée |
| Actions | 4 | 4 | 3 | 4 | `Button` du DS porte les tons ; l'admin garde 2 boutons hérités |
| Densité | 4 | 4 | 3 | 4 | — |
| Cohérence | 4 | 4 | 3 | 3 | **17 usages de rayon rendent une valeur qui n'est pas celle écrite** (§4.1) |
| Feedback | 3 | 4 | 4 | 3 | Le DS n'a **pas de Toast** : 30 fichiers dépendent du composant hérité |
| **Accessibilité** | 3 | 3 | 3 | 3 | Anneau de focus du système rétabli partout (§4.2) ; restent 4 `<div onClick>` et 3 `<img>` sans `alt` |
| Motion | 4 | 4 | 4 | 3 | `prefers-reduced-motion` référencé 33 fois — sérieux |
| Delight | 4 | 4 | 3 | 4 | — |

**L'accessibilité était la colonne décisive, et elle est traitée.** Le handoff déclarait
« presque rien n'est atteignable au clavier » ; la mesure a montré autre chose — l'anneau
existait, trente classes l'écrasaient. Voir §4.2. Ce qui reste (`<div onClick>`, `alt`
manquants) est ponctuel, plus systémique.

---

## 3. Ce qui est déjà juste — et qu'il ne faut pas « réparer »

Un audit qui ne dit que le manque conduit à casser ce qui tient. Quatre acquis vérifiés :

1. **Les 47 échelles de couleur héritées ont réellement disparu.** Vérifié sur les dix
   préfixes (`brand-`, `accent-`, `plum-`, `morrys-`, `lagoon-`, `coral-`, `success-`,
   `warning-`, `error-`, `neutral-`) : **0 occurrence**. La configuration Tailwind ne
   redéfinit aucune couleur, elle pointe sur `var(--*)`.
2. **La barrière CI est vivante.** `npm run ds:check` rend
   « les six règles tiennent. 0 constat. », code de sortie 0.
3. **`ds:sync` n'est plus cassé.** La note projet qui le donnait pour rompu est périmée :
   le script pointe sur `Max-Morrys_DS_Platform/design_handoff_maxmorrys/css`, qui existe.
4. **Le problème des deux librairies d'icônes est presque résorbé.** Il reste
   **8 fichiers `lucide-react`** (dont le `Icon` du DS lui-même, qui est légitime) et
   **1 seul fichier phosphor** (`lms/tabs/club/_shared.tsx`). Aucun fichier ne mélange les deux.

---

## 4. Défauts mesurés, par gravité

### 4.1 ⛔ Critique — deux clés de rayon rendent autre chose que ce qui est écrit

**Le défaut le plus coûteux du dépôt, et il est invisible en revue.**

`tailwind.config.js` déclare `borderRadius: { s, m, l, xl, media, pill }`. Or Tailwind 3.3+
réserve déjà `rounded-s` et `rounded-l` aux **propriétés directionnelles** (côté *start*,
côté *left*). Les deux règles sont émises, et **la seconde gagne** par ordre de source.

Généré et vérifié au compilateur Tailwind :

```css
.rounded-s { border-radius: var(--r-s) }                    /* 10 px, 4 coins  — écrasée */
.rounded-s { border-start-start-radius: 0.25rem;
             border-end-start-radius:   0.25rem }           /* 4 px, 2 coins  — appliquée */

.rounded-l { border-radius: var(--r-l) }                    /* 24 px, 4 coins — écrasée */
.rounded-l { border-top-left-radius:    0.25rem;
             border-bottom-left-radius: 0.25rem }           /* 4 px, 2 coins  — appliquée */
```

**Exposition : 16 usages de `rounded-s`.**

> ⚠️ **Corrigé le 01/09 en appliquant le correctif.** Ce paragraphe annonçait
> « 17 usages, dont `rounded-l` × 1 ». Le `rounded-l` était un **faux positif** : la seule
> occurrence est `rounded-l-xl` dans `PhoneInput`, c'est-à-dire l'utilitaire directionnel
> *côté gauche, rayon `xl`* — un usage parfaitement légitime que ma recherche par
> frontière de mot avait attrapé par son préfixe. Le CSS de production le confirme :
> aucune règle `.rounded-l{}` n'y existe. **Seul `rounded-s` était cassé.**

| Fichier | Surface |
|---|---|
| `src/components/layout/AppShell.tsx` | coque de toute l'app connectée |
| `src/components/layout/AppSidebar.tsx` | navigation latérale |
| `src/pages/lms/tabs/club/ClubInfos.tsx` · `ClubFeed.tsx` · `ClubOpportunities.tsx` | Club |
| `src/pages/lms/tabs/TestimonialsTab.tsx` | LMS |
| `src/components/ui/PhoneInput.tsx` | formulaire (`rounded-l`) |

Ni le typecheck, ni `ds:check`, ni la revue de code ne le voient : la classe existe, la
build passe, l'écran rend *un* rayon — simplement pas celui-là, et pas sur les bons coins.
Les primitives du DS ne sont pas touchées (elles lisent `var()` en style calculé) : le
défaut vit **uniquement dans les surfaces greffées à côté**, ce qui est exactement le motif
relevé lors de l'audit de fidélité du 31 août.

### 4.2 ✅ CORRIGÉ — l'anneau de focus existait, il était écrasé

> ⚠️ **Ce constat était faux, et corrigé le 01/09 en l'instruisant.** Il annonçait
> « 13 `focus-visible` contre 74 `focus:` » et « 14 fichiers posent `outline-none` sans
> rien remettre — régression nette par rapport au défaut du navigateur ». Les deux
> lectures étaient mauvaises.

**Le système a un anneau, et il est en production.** `brand/states.css` le déclare une
fois pour tout le produit, et le CSS bâti le confirme :

```css
:where(a,button,input,textarea,select,summary,[tabindex]):focus-visible{
  outline:none; box-shadow:0 0 0 2px var(--surface-page),0 0 0 4px var(--mm-bleu)}
```

Double anneau — un clair, un de marque — avec sa variante nuit et une variante
`.mm-on-color` pour les fonds colorés. **`outline-none` ne le tue donc pas** : l'anneau
est un `box-shadow`, et la règle pose elle-même `outline:none`.

**Le défaut réel était ailleurs, et il était plus grave.** Le sélecteur est en `:where()`,
donc à **spécificité zéro** : n'importe quelle classe le bat. **Trente sites** posaient un
`focus:ring-*`, remplaçant l'anneau du système par celui de Tailwind —
`rgb(59 130 246 / .5)`, une couleur absente de tout jeton qui ne bascule pas sous `.dk`.
**Seize d'entre eux sur `:focus` et non `:focus-visible`**, donc visibles aussi au clic
souris, ce que le système évite exprès.

Quatre de ces trente vivaient dans des fichiers **`.ts`** — que la mesure initiale, qui ne
scannait que `.tsx`, n'avait pas vus.

**Corrigé** : les trente sites sont retirés ; les surfaces sombres permanentes (les six
popups, la carte newsletter) passent par `mm-on-color`, posé **une seule fois** sur
`PopupSurface`, que `PopupManager` fait traverser à tous les popups. Le bundle ne contient
plus **aucun** anneau Tailwind.

**Une trouvaille au passage** : `ProfileTab.tsx:21` citait `focus:ring-2` **dans un
commentaire** expliquant son retrait — et le scanner de Tailwind, qui ne lit pas les
commentaires, **régénérait la règle dans le bundle**. Une classe documentée comme retirée
y survivait, morte mais présente.

`tests/unit/focus-ring.test.ts` interdit désormais toute troisième voie et vérifie que la
recette du kit est intacte.

**Ce qui reste vrai du constat initial** : la sémantique ARIA est sérieuse —
116 fichiers portent des attributs `aria-*` (101 `aria-label`, 111 `aria-hidden`,
23 `aria-current`, 9 `aria-live`), rôles posés (`dialog` 7, `alert` 6, `status` 8).

> ⚠️ **Les « 4 `<div onClick>` » et « 3 `<img>` sans alt » étaient aussi des faux
> positifs**, mesurés le 01/09 en dépouillant les commentaires : **zéro `<img>` sans
> `alt`** en code réel, et les trois `<div onClick>` restants sont des motifs légitimes —
> deux délégations d'événement sur `<a>` (`DsNavHost`, `BlogPost`, où l'entrée clavier
> déclenche un clic qui remonte, comme leurs commentaires l'expliquent) et un conteneur de
> dialogue qui ne ferme que sur lui-même, adossé à `useDialogA11y`.
>
> C'est le **cinquième** sur-comptage du même type dans ce document. Ils viennent tous de
> `grep` sans exclusion des commentaires, sur un dépôt qui documente abondamment le code
> qu'il a retiré.

**Les vrais trous, trouvés en instruisant et corrigés le 01/09** :

| Surface | Défaut | Correctif |
|---|---|---|
| `ui/Sheet` | voile annoncé, dialogue sans nom ni rôle | `aria-hidden` sur le voile, `role="dialog"` + `aria-modal` + `aria-label` |
| `SearchOverlay` | idem | idem, nommé par `search.quickSearch` |
| `RysmoWidget` | **aucune sortie clavier** — Échap ne fermait pas | écouteur `Escape`, posé seulement à l'ouverture |
| `AppShell` (tiroir mobile) | **aucune sortie clavier** | idem |

### 4.3 ✅ CORRIGÉ — la première vue chargeait Firestore, dont l'accueil a besoin *après*

> ⚠️ **Le constat était en partie faux.** Il disait « Firebase et Motion, soit 156,5 Ko,
> pour des fonctions qu'une page publique n'appelle pas ». **L'accueil appelle bel et bien
> Firestore** — il lit les formations, les articles, les podcasts et les compteurs publics.
> Le SDK n'était donc pas inutile : il était chargé **trop tôt**, avant le premier pixel,
> au lieu d'en parallèle.
>
> Et `motion` est sur le chemin critique par décision documentée (`vite.config.ts`) :
> `PageTransition` et les nœuds `motion.*` de l'accueil. Il reste.

**Cinq arêtes tiraient Firestore dans le graphe statique de l'entrée**, aucune évidente :

| Arête | Pourquoi elle existait |
|---|---|
| `AuthContext` → `config/firebase` | le fichier exportait `db` |
| `Home` → `lib/firestore` | **le BARILLET** — `export *` sur quatorze modules |
| `LanguageContext` → `lib/firestore/users` | une écriture de profil au changement de langue |
| `PopupManager` → `lib/popups/settings` → `firestore/admin` | lecture des réglages |
| `Header` → `AnnouncementBanner` → `firestore/admin` | lecture des annonces |

Toutes ces lectures sont **asynchrones et postérieures au montage** : les passer en
`await import()` ne change rien au comportement, et le SDK descend désormais en parallèle
du premier rendu. `db` a quitté `config/firebase.ts` pour `config/db.ts`, et
`vite.config.ts` donne à Firestore son propre groupe — **les deux sont nécessaires** :
tant que Rollup les regroupe, le morceau dynamique voyage avec le morceau statique. La
mesure intermédiaire l'a montré, le total avait d'abord *augmenté* à 388,4 Ko.

| Première vue (gzip) | Avant | Après |
|---|---|---|
| `firebase` | 115,5 Ko | **53,6 Ko** (core+auth) + 3,7 (functions) |
| dont Firestore | *inclus* | **0 — chargé à la demande** |
| **Total** | **356,6 Ko** | **296,4 Ko** |

**−60,2 Ko, soit −17 %**, sur un marché où le panier de 2 Go coûte 4,2 % du revenu
national brut par habitant.

`tests/unit/first-view-graph.test.ts` marche le graphe d'imports **des sources** — pas de
`dist/`, donc pas besoin de build — et échoue en nommant la chaîne complète si l'arête
revient. Il vérifie aussi que `firebase/auth` reste bien statique, sans quoi il ne
prouverait rien.

### 4.4 ⚠ Élevé — une famille de fontes est chargée sans être utilisée nulle part

`index.html:41-42` précharge puis applique **Inter** (5 graisses).

Or les trois familles du kit sont **Fraunces**, **Schibsted Grotesk** et **JetBrains Mono**
(`src/design-system/css/tokens/fonts.css`), et `tailwind.config.js` fait pointer
`display` / `sans` / `mono` sur elles. **Recherche de « Inter » comme `font-family` dans
`src/design-system/css/`, `src/index.css` et `tailwind.config.js` : aucune occurrence** —
les seules correspondances textuelles sont le mot « IntersectionObserver ».

Le coût exact dépend du fait que les binaires ne sont tirés que si une règle correspond ;
ici aucune ne correspond, donc la perte est la feuille de style, le `preconnect` et la
place occupée dans la file de chargement — pas les cinq fichiers de fonte. **C'est
néanmoins une requête bloquante pour zéro pixel rendu.**

Second point, structurel : `fonts.css` charge les vraies fontes par `@import url(...)`
**depuis l'intérieur du CSS**. La chaîne est sérialisée — HTML → `index.css` → découverte
de l'URL Google → feuille Google → `woff2`. Trois allers-retours avant le premier texte
dans la bonne fonte, sur des appareils dont le profil courant est `deviceMemory ≤ 2`.

### 4.5 ◐ Moyen — deux systèmes de points de rupture coexistent

| Origine | Points | Usages |
|---|---|---|
| Kit | `stack` (700 px), `wide` (1080 px) | **210** |
| Tailwind par défaut | `sm` 640, `md` 768, `lg` 1024, `xl` 1280 | **129** |

`sm:` (640) et `stack:` (700) produisent une bande de 60 px où deux règles de mise en page
basculent à des moments différents. `md:` n'est utilisé que 6 fois — assez pour créer une
exception, pas assez pour constituer une intention.

### 4.6 ◐ Moyen — la palette Tailwind par défaut reste atteignable

`tailwind.config.js` annule explicitement `neutral` et `teal` (`undefined`) pour qu'un
oubli **se voie à l'écran**. Le reste de la palette par défaut n'a pas été annulé :

> ⚠️ **Corrigé le 01/09 en appliquant le correctif.** Ce paragraphe annonçait
> **9 occurrences**. C'était un sur-comptage : huit d'entre elles vivaient dans des
> **commentaires** qui documentaient des retraits *déjà faits* (`ProfileTab`,
> `RysmoStoreTab`, `RysmoWidget` expliquent tous pourquoi telle couleur est partie).
>
> **Une seule occurrence réelle** subsistait : `SEOPanel.tsx:339`, le vert d'un résultat
> Google dans l'aperçu SERP — une **exemption légitime et annotée**, une marque tierce ne
> se recolorant pas au jeton.
>
> Le chantier était donc quasi gratuit, et il est fait : la couleur SERP est passée en
> valeur littérale (rendu identique — `green-500` valait exactement `#22c55e`) et les
> **vingt-deux échelles** de la palette Tailwind par défaut sont annulées, `white`,
> `black`, `transparent`, `current` et `inherit` exceptés. Un oubli rend désormais
> *visiblement rien*, ce qui était l'intention d'AD-2 depuis le début.

### 4.7 ◐ Moyen — 68 valeurs de pixel arbitraires, dont il faut trier le légitime

`[18px]` × 79, `[14px]` × 75, `[10px]` × 49, `[22px]` × 37… **68 valeurs distinctes.**

**Attention au faux positif.** Le handoff est explicite : « si le kit dit 5 px, c'est 5 px,
pas 4. Ne les arrondissez pas sur une grille de 4 ou 8. » Une part de ces valeurs est donc
de la **fidélité voulue**, pas de la dérive. Le tri reste à faire, valeur par valeur, contre
`css/tokens/spacing.css`. C'est un chantier de vérification, pas de normalisation.

### 4.8 ○ Faible — trois primitives héritées sont mortes

`Breadcrumbs`, `Skeleton` et `Toggle` dans `src/components/ui/` : **0 import**. Le DS
fournit `Breadcrumb`, `Skeleton` et `Switch`. Suppression sans risque.

---

## 5. États critiques — la couverture est meilleure que la moyenne du secteur

| État | Couverture |
|---|---|
| Vide | `EmptyState` du DS importé **29 fois** depuis `@ds` (+ 8 via `_shared`) |
| Chargement | `Skeleton` du DS importé **39 fois** (+ 6 `ConsoleListSkeleton`, + 1 `components/states`) |
| Hors ligne | `OfflineBanner` + `useOnline` (`src/components/states/`), route `/hors-connexion` |
| 404 | `NotFound.tsx` |
| 403 | `Forbidden403.tsx` |
| Quota | `QuotaMeter` (DS) — quotas Rysmo |
| Erreur applicative | ✅ **un `errorElement` par route** + `ErrorBoundary` en dernier recours |
| 500 | ✅ `ErrorScreen`, partagé par les deux filets |

> ✅ **Corrigé le 01/09.** Le dépôt n'avait qu'**une** frontière d'erreur, autour des
> fournisseurs, pour **70 routes** : le plantage d'un écran emportait l'en-tête, la
> navigation et le pied avec lui, et ne laissait que le rechargement comme sortie.
>
> `withRouteErrors()` annote l'arbre entier par récursion — écrit une fois plutôt que sur
> soixante-dix objets, où la première route ajoutée aurait été oubliée sans que rien ne le
> signale. React Router fait remonter l'erreur à la frontière la plus proche : l'écran
> fautif est remplacé **dans l'`<Outlet>` de son gabarit**, la coquille reste debout.
>
> `RouteError` distingue le **404 du 500** — `errorElement` attrape aussi les réponses du
> routeur, et afficher « le code a échoué » sur une adresse inexistante serait un faux
> motif. Le 404 n'est pas remonté à la télémétrie : ce n'est pas un incident.
>
> Le dessin est extrait dans `ErrorScreen`, partagé par les deux filets — le recopier
> aurait donné deux écrans d'erreur à faire diverger.

Le reste était déjà en place, et bien mieux traité que dans la plupart des applications de
cette taille.

---

## 6. Mesures manquantes, à faire sur le terrain

Cet audit est un audit de code. Trois chiffres ne s'en déduisent pas et manquent au dossier :

1. **Poids réel des fontes** — la mesure a échoué (réseau sortant bloqué). Sans elle,
   impossible de dire si le budget de 900 Ko tient. C'est la mesure la plus urgente.
2. **Lighthouse / Core Web Vitals par page** — aucun relevé.
3. **Passe axe DevTools** — la mesure §4.2 est statique ; elle compte des classes, pas des
   violations constatées au rendu.

⚠️ Toute mesure au navigateur sur ce projet doit tenir compte des pièges déjà consignés
(défilement, chrome fixe, thème, Firestore) — voir la note projet sur la sonde Chrome/CDP.

---

## 7. Priorités

| # | Chantier | Gravité | Effort | Pourquoi ce rang |
|---|---|---|---|---|
| 1 | Fermer la collision `rounded-s` / `rounded-l` | ⛔ | Faible | 17 écrans rendent faux, en silence, dans la coque de l'app |
| 2 | ~~Anneau de focus systématique~~ ✅ fait le 01/09 | ⚠ | — | 30 anneaux concurrents retirés, garde posée |
| 3 | ~~Sortir Firebase de la première vue~~ ✅ fait le 01/09 | ⚠ | — | −60,2 Ko gzip (−17 %) ; Motion reste, il est sur le chemin critique |
| 4 | Retirer Inter, dé-sérialiser les fontes | ⚠ | Faible | Requête bloquante pour zéro pixel |
| 5 | Combler les 6 trous du DS (§ `design-system-audit.md`) | ◐ | Élevé | Débloque 72 des 81 imports hérités |
| 6 | Unifier les points de rupture | ◐ | Moyen | 60 px d'incohérence sur tout le responsive |
| 7 | Annuler le reste de la palette par défaut | ◐ | Faible | Ferme AD-2 pour de bon |
| 8 | ~~Page 500 + `ErrorBoundary` par surface~~ ✅ fait le 01/09 | ◐ | — | un `errorElement` par route, 404 distingué du 500 |
| 9 | Trier les 68 valeurs arbitraires | ○ | Élevé | Vérification, pas normalisation |
| 10 | Supprimer les 3 primitives mortes | ○ | Trivial | — |
