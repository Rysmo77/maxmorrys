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
| **Accessibilité** | **2** | **2** | **2** | 3 | **13 `focus-visible` contre 74 `focus:`** ; 14 fichiers neutralisent l'`outline` sans rien remettre (§5) |
| Motion | 4 | 4 | 4 | 3 | `prefers-reduced-motion` référencé 33 fois — sérieux |
| Delight | 4 | 4 | 3 | 4 | — |

**La colonne qui décide de la refonte est l'accessibilité.** C'est le seul critère sous 3
sur trois surfaces sur quatre, et le handoff le déclare lui-même : « presque rien n'est
atteignable au clavier ». Ce n'est pas un défaut de goût, c'est un défaut de fonction.

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

**Exposition : 17 usages.** `rounded-s` × 16, `rounded-l` × 1.

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

### 4.2 ⚠ Élevé — l'accessibilité au clavier n'est pas outillée

| Mesure | Valeur |
|---|---|
| `focus-visible:` | **13** |
| `focus:` (sans `-visible`) | **74** |
| Fichiers posant `outline-none` **sans** aucun `focus-visible` | **14** |
| `<div onClick>` (cible non atteignable au clavier) | 4 |
| `<img>` sans `alt` | 3 |

Le rapport 13 contre 74 dit le fond : l'état de focus est traité comme un effet de survol,
pas comme un repère de navigation. Et 14 fichiers **retirent** l'anneau du navigateur sans
en fournir un autre — c'est une régression nette par rapport au défaut du navigateur.

À l'inverse, la sémantique ARIA est sérieuse et ne demande qu'à être complétée :
116 fichiers portent des attributs `aria-*` (101 `aria-label`, 111 `aria-hidden`,
23 `aria-current`, 9 `aria-live`), et les rôles sont posés (`dialog` 7, `alert` 6,
`status` 8, `switch` 4, `progressbar` 3).

### 4.3 ⚠ Élevé — la première vue charge 156 Ko dont un visiteur anonyme n'a pas besoin

Mesure du build présent (`dist/`, 1er sept. 20:46), **en octets réellement transférés (gzip)** :

| Ressource préchargée | gzip |
|---|---|
| `index.js` | 102,8 Ko |
| `firebase.js` | **115,5 Ko** |
| `vendor-react.js` | 44,5 Ko |
| `motion.js` | **41,0 Ko** |
| `router.js` | 31,4 Ko |
| `index.css` | 21,4 Ko |
| **Total code, première vue** | **356,6 Ko** |

Les six sont en `modulepreload` dans `dist/index.html` : **quelqu'un qui lit l'accueil
télécharge tout le SDK Firebase et Framer Motion avant de pouvoir interagir**, soit
156,5 Ko — **44 % du budget code** — pour des fonctions qu'une page publique n'appelle pas.

Le budget déclaré est de **900 Ko, fontes comprises**, sur un marché où le panier de 2 Go
coûte 4,2 % du revenu national brut par habitant. 356,6 Ko de code laissent ~543 Ko aux
fontes et aux images. **La marge n'a jamais été mesurée** (voir §6, mesure manquante).

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

`green` 2 · `amber` 3 · `blue` 1 · `orange` 1 · `purple` 1 · `pink` 1 — **9 occurrences.**

Deux d'entre elles portent une conséquence de contraste réelle :
`dark:text-green-500` et `dark:text-amber-400` court-circuitent `--ok` et `--warn`, dont
le kit a précisément calculé les variantes nuit (`#4ADE9B` à 11,0:1, `#FFB24D` à 10,8:1).
La règle AD-3 — aucune classe `dark:` ne porte de couleur — est tenue à 18 exceptions près
sur 70, dont 17 sont des `color-mix` légitimes.

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
| Erreur applicative | **`ErrorBoundary` : 2 fichiers seulement** |
| 500 | **absent** |

**Deux trous réels** : pas de page 500, et deux `ErrorBoundary` pour 70 routes. Le reste
est en place et bien mieux traité que dans la plupart des applications de cette taille.

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
| 2 | Anneau de focus systématique | ⚠ | Moyen | Seul critère sous 3 sur 3 surfaces ; bloque WCAG AA |
| 3 | Sortir Firebase et Motion de la première vue | ⚠ | Moyen | 156 Ko rendus à un visiteur qui ne s'en sert pas |
| 4 | Retirer Inter, dé-sérialiser les fontes | ⚠ | Faible | Requête bloquante pour zéro pixel |
| 5 | Combler les 6 trous du DS (§ `design-system-audit.md`) | ◐ | Élevé | Débloque 72 des 81 imports hérités |
| 6 | Unifier les points de rupture | ◐ | Moyen | 60 px d'incohérence sur tout le responsive |
| 7 | Annuler le reste de la palette par défaut | ◐ | Faible | Ferme AD-2 pour de bon |
| 8 | Page 500 + `ErrorBoundary` par surface | ◐ | Faible | 70 routes, 2 filets |
| 9 | Trier les 68 valeurs arbitraires | ○ | Élevé | Vérification, pas normalisation |
| 10 | Supprimer les 3 primitives mortes | ○ | Trivial | — |
