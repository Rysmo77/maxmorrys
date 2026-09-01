# Parcours utilisateurs critiques — maxmorrys.me

**Phase 0 de la refonte. Frictions mesurées dans le code, aucune modification.**
_1er septembre 2026 · commit `a435bdb`._

> Chaque friction ci-dessous cite le fichier et la ligne qui la produit. Aucune n'est
> déduite d'une impression de navigation.

---

## Parcours 1 — Visiteur → achat d'une formation ⛔

**C'est le parcours qui porte le chiffre d'affaires, et il perd son client au moment précis
où l'intention est maximale.**

### Le chemin réel

| # | Étape | Ce qui se passe |
|---|---|---|
| 1 | `/` → `/formations` | SPA |
| 2 | `/formations/:slug` | SPA. Le prix s'affiche via `PriceBlock`, source `db`, daté |
| 3 | **Clic sur « S'inscrire »** | `FormationDetail.tsx:263` |
| 4 | → `/connexion` | **Rechargement complet de la page** |
| 5 | Connexion | — |
| 6 | → `/mon-espace` | **Ce n'est pas la destination voulue** |
| 7 | Retrouver la formation à la main | 2 à 3 clics de plus |
| 8 | `/checkout/:slug` | 3 étapes, `StepDots` |
| 9 | Page de paiement hébergée | Wave / Orange Money, choisis là-bas |

### Les trois pertes, qui se cumulent

**a. L'intention d'achat est jetée.**

```tsx
// src/pages/FormationDetail.tsx:263
href={user ? path(`/checkout/${formation.slug}`) : path('/connexion')}
```

Aucun état de retour n'accompagne le renvoi vers `/connexion`.

Or **le dépôt sait déjà faire** — `ProtectedRoute.tsx:32` le fait correctement :

```tsx
return <Navigate to={localizedPath('/connexion', lang)} replace state={{ from: location }} />;
```

…et `Login.tsx:43` le lit :

```tsx
const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/mon-espace';
```

La page de vente est le **seul** endroit qui court-circuite ce mécanisme. Résultat : le
repli `?? '/mon-espace'` s'applique, et l'acheteur atterrit sur son tableau de bord.

**b. La navigation est un rechargement complet.**

`Button` rend un `<a href>` brut (`design-system/react/actions/Button.tsx:97`). Le choix
est délibéré et juste pour l'accessibilité — « une action qui NAVIGUE est un lien ». Mais
employé pour une destination *interne*, il quitte la SPA : les **356,6 Ko de première vue
sont retéléchargés** et Firebase se réinitialise, au clic le plus cher du site.
`LocalizedLink` existe précisément pour ce cas et n'est pas utilisé ici.

**c. Le retour se fait à la main.** Rien ne ramène vers la formation.

### Objectif chiffré

| | Aujourd'hui | Après |
|---|---|---|
| Clics de la fiche au paiement (visiteur déconnecté) | **6 à 7** | **3** |
| Rechargements complets | **1** (356,6 Ko) | **0** |
| Taux d'arrivée sur la bonne destination post-connexion | **0 %** | **100 %** |

**Correctif de principe** (à instruire en Phase 3, pas ici) : pointer le CTA sur
`/checkout/:slug` sans condition et laisser `ProtectedRoute` faire l'aller-retour — le
mécanisme correct existe déjà et est testé sur les autres routes.

---

## Parcours 2 — Inscription → première valeur ✅

**Le parcours le mieux traité du produit.**

| # | Étape | Détail |
|---|---|---|
| 1 | `/inscription` | **4 champs** : nom, e-mail, mot de passe, confirmation |
| 2 | `/onboarding` étape 0 | Profil — **passable** (`onboarding.skipStep`) |
| 3 | étape 1 | Explorer les formations — retour arrière possible |
| 4 | étape 2 | Prêt |
| 5 | `/mon-espace` | — |

Conforme aux principes de la Phase 3.2 du brief : divulgation progressive, rien de
bloquant, barre de progression et pastilles d'étape. **4 champs est bas** pour une
plateforme de formation, et c'est un acquis à ne pas dégrader.

**Réserve** : les trois étapes précèdent toute valeur concrète. Le temps de première
valeur ne se mesure pas ici mais au premier contenu réellement consommé — mesure absente.

---

## Parcours 3 — Découverte du Club → abonnement ◐

`ClubSubscriptionGate.tsx` présente 6 fonctions avant le mur, avec `Num` pour le prix
(19 900 FCFA/an) et `clubReferralPrice` pour le tarif parrainé. Le mur est **informatif
avant d'être bloquant** — bon motif.

**Friction** : le Club est un onglet parmi 12 dans le LMS, puis 10 sous-onglets une fois
entré. La profondeur est de 3 niveaux (`/mon-espace` → Club → sous-onglet) sans fil
d'Ariane systématique ni palette de commandes.

---

## Parcours 4 — Rysmo : quota atteint → achat de pack ◐

`RYSMO_BASE_DAILY = 2` (`src/lib/rysmo/quota.ts:25`), avec bonus Club.

Le fichier porte un avertissement utile : la valeur est dupliquée dans le Worker
(`worker/apps/api/src/lib/rysmo-quota.ts`) et un test lit les deux pour empêcher la dérive.
**Discipline exemplaire, à citer comme modèle** pour les autres constantes partagées.

`QuotaMeter` existe au DS. **À vérifier en Phase 3** : le passage quota épuisé → pack
d'achat est-il un état conçu, ou un message d'erreur ? Non déterminable statiquement.

---

## Parcours 5 — Administration quotidienne ◐

> ⚠️ **Correction du 1er septembre.** Ce paragraphe affirmait d'abord « aucune palette de
> commandes, aucune recherche globale ». **C'est faux.** `AppShell.tsx:100-103` installe un
> raccourci global `Cmd/Ctrl+K` et monte un `SearchOverlay`, et **`AdminLayout` comme
> `StudentLayout` passent tous deux par `AppShell`** : les deux surfaces en héritent.

L'admin est **mono-utilisateur** : la plateforme est opérée par une seule personne. Le
levier n'est donc pas la clarté pour un nouvel arrivant, mais la **vitesse pour quelqu'un
qui connaît déjà les 19 pages par cœur**. La palette existe ; ce qui manque est ailleurs.

**Ce qui manque réellement — vérifié :** `AppSidebar` expose une prop `badge` par entrée
(`AppSidebar.tsx:45`, rendue ligne 173), et la navigation est **déjà groupée en cinq
familles** par `AdminLayout`. Mais **aucun compteur n'est passé**. L'opérateur lit
« Transactions » sans savoir qu'une attend, « Articles » sans savoir que 47 sont en
brouillon. La capacité est là, inutilisée.

C'est aussi la surface où l'absence d'anneau de focus coûte le plus cher.

C'est également la surface qui concentre **24 des 81 imports hérités**, presque tous dus
aux six trous du DS (`Toast`, `ConfirmDialog`, `Pagination`, `Modal`, `ImageInput`,
`RichEditor`) — les composants exacts dont une console d'administration se sert le plus.

---

## Parcours 6 — Application mobile (Expo) ◐

5 onglets : **Espace · Cours · {nom du répétiteur} · Club · Profil**.

Le troisième onglet porte un nom **renommable par chaque personne**, lu par `useTutorNom()`
et non par une constante — la barre se redessine au renommage. C'est une finesse rare, et
`mobile/app/(tabs)/_layout.tsx` documente précisément pourquoi.

Le châssis est soigné : `useSafeAreaInsets` ajouté à `--tabbar-h` (29 fichiers gèrent la
zone sûre), flou `expo-blur` réservé au chrome fixe, thème sombre par `useColorScheme`,
attributs `accessibilityLabel` / `Role` / `State` / `Value` présents.

**Le défaut est ailleurs, et il est structurel** :

| Mesure | Valeur |
|---|---|
| `Platform.OS` / `Platform.select` | **0** |
| Retour haptique | **0** |

**L'application présentait exactement la même interface sur iOS et sur Android.**

> ✅ **Première passe faite le 01/09.** `mobile/ds/platform.ts` porte ce qui doit différer,
> et rien d'autre — les jetons, les teintes, la typographie et l'ordre des écrans ne
> bougent pas, c'est la marque.
>
> | Ce qui diffère désormais | iOS | Android |
> |---|---|---|
> | Mouvement de navigation | `slide_from_right`, 260 ms | fondu axe Z, 200 ms |
> | Geste de retour au bord | oui | non — concurrent du retour prédictif |
> | Barre d'onglets | translucide **et floutée** | opaque, élévation 3 |
> | Retour au toucher | enfoncement `scale(.975)` | ondulation partant du doigt |
>
> ⚠️ **Une trouvaille en chemin** : `(tabs)/_layout.tsx` documentait un flou posé « par
> `expo-blur` sur `tabBarBackground` » — **qui n'existait nulle part dans le fichier**. Or
> `--tabbar-bg` vaut `rgba(255,255,255,.62)` : la barre laissait donc voir le texte
> défiler dessous sans le flouter, c'est-à-dire exactement le défaut que la règle 1
> nomme, dans le fichier qui prétendait l'éviter. Le flou est posé, et seulement sur iOS.

**Ce qui reste** : le retour **haptique** (0 usage). Il demande `expo-haptics`, donc une
entrée de plus dans `mobile/package.json` — fichier en cours de modification pour le
passage aux builds natifs EAS. À poser quand ce chantier sera stabilisé. Restent aussi
le FAB et la snackbar Material, qui supposent des décisions de conception, pas seulement
de plateforme.

---

## Synthèse des priorités de parcours

| # | Parcours | Gravité | Effort | Gain attendu |
|---|---|---|---|---|
| 1 | Achat d'une formation | ⛔ | **Faible** | 6-7 clics → 3, un rechargement supprimé, destination correcte |
| 2 | Différenciation iOS / Android | ⚠ | **Élevé** | Conformité HIG + Material 3 sur un produit vivant |
| 3 | Compteurs dans la navigation admin | ◐ | Faible | La prop `badge` existe et n'est pas passée |
| 4 | Profondeur du Club | ◐ | Moyen | 3 niveaux sans fil d'Ariane |
| 5 | Quota Rysmo → pack | ◐ | Faible | À qualifier au navigateur d'abord |
| 6 | Inscription / onboarding | ✅ | — | **Ne rien changer** |

**Le parcours n°1 est le meilleur rapport gain/effort du dossier** : le mécanisme correct
existe déjà dans le dépôt et est utilisé partout ailleurs. Une seule page l'ignore, et
c'est celle qui vend.
