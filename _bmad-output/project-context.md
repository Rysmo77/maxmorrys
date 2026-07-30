---
project_name: 'maxmorrys.me-main'
user_name: 'Rysmo'
date: '2026-07-20'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 166
optimized_for_llm: true
existing_patterns_found: 47
---

# Contexte projet pour les agents IA

_Ce fichier contient les règles et patterns critiques que les agents IA doivent suivre lorsqu'ils écrivent du code dans ce projet. Il se concentre sur les détails non évidents que les agents risquent de manquer._

---

## Stack technique & versions

### ⚠️ Frontières de version — là où l'a priori du modèle est faux

Ces majeures sont plus anciennes que ce qu'un LLM suppose par défaut. C'est la
source d'erreur n°1 sur ce repo, et la plupart ne lèvent aucune erreur de type.

| Réel | Ne pas écrire |
|---|---|
| **Tailwind 3.4.1** — config JS (`tailwind.config.js`) | ❌ syntaxe v4 : `@theme` en CSS, suppression du config JS. Casse silencieusement les ~47 tokens (`brand-*`, `morrys-*`, `plum-*`) |
| **React 18.3.1** | ❌ idiomes 19 : `use()`, form Actions, `ref` en prop |
| **React Router 7.13.1** — data router (`createBrowserRouter`) | ❌ framework mode, ❌ `<BrowserRouter>` déclaratif |
| **ESLint 9** — flat config (`eslint.config.js`) | ❌ `.eslintrc*` |
| **Vitest 2.1.9** | ❌ API v3 |
| **Cloud Functions v2** (`firebase-functions/v2/*`) | ❌ toute API v1 |

### Trois projets TypeScript indépendants — aucun fichier partageable

| Projet | Module | Target | Types | Typecheck |
|---|---|---|---|---|
| `src/` | ESM | ES2020 | DOM | `npm run typecheck` (`tsconfig.app.json`) |
| `functions/src/` | **CommonJS** | ES2017 | Node 22 | `cd functions && npx tsc --noEmit` |
| `worker/src/` | ESM | ES2022 | `@cloudflare/workers-types` seuls | jamais en CI |

`worker/` n'a ni DOM ni Node : pas de `process.env`, pas de `Buffer`.
`functions/` en CommonJS + ES2017 : pas de top-level await.

### Ancres de version

Front — React 18.3.1 (`jsx: react-jsx`, pas d'`import React`) · Vite 5.4.2 · Tailwind 3.4.1 ·
TanStack Query 5.101.1 · i18next 26.3.2 · framer-motion 12.38.0 · TipTap 3.22.3 · DOMPurify 3.3.3
Back — Firebase JS SDK 12.9.0 · firebase-functions ^6 · firebase-admin ^12 · `@google/genai` ^2.7
Cartes sociales — satori + satori-html + @resvg/resvg-js

**Ces numéros sont des ancres, pas un inventaire.** `package.json` fait foi pour le courant ;
il n'utilise que des carets. Reproductibilité = lockfile : **`npm ci`, jamais `npm install`**
(un `npm install` déplace le lockfile).

### Statuts

- ✅ **Décision assumée** — Functions v2 exclusivement · Typesense en search-only côté client
  (la clé admin est un secret Functions) · aucun formateur dans le repo (pas de Prettier :
  calquer le style du fichier voisin)
- ⚠️ **Accident toléré** — **Deux libs d'icônes** : `lucide-react` (site public, admin) et
  `@phosphor-icons/react` (Club/LMS). Strokes et grilles optiques différents → couture visible
  au passage site↔Club. Règle actuelle : suivre le fichier environnant. Ne pas propager à une
  nouvelle zone. *(à confirmer : accident historique, pas intention de design)*
- ⚠️ **Accident toléré** — Node : CI en 20, runtime Functions en 22, aucun `engines` à la racine.
  Aucun incident connu à ce jour. Ne pas s'appuyer sur des API Node > 20.
- ❌ **Directive périmée** — `.bolt/prompt` interdit toute lib d'icônes hors `lucide-react`.
  Ne plus l'appliquer telle quelle.

### Pièges de build

- **Chunks manuels figés** (`vite.config.ts:25-30`) : le chunk `firebase` ne couvre que
  app/auth/firestore/storage. `firebase/functions` et `firebase/analytics` en sortent.
- **`sharp` + `svgo`** sont des binaires natifs requis par ViteImageOptimizer à chaque build :
  une install cassée casse `npm run build`, pas seulement les images.
- **Typesense feature-flaggé off** (`src/lib/search.ts`) : inactif tant que `VITE_TYPESENSE_HOST`
  + `VITE_TYPESENSE_SEARCH_KEY` sont absents. **Une recherche existe déjà** — filtrage
  client-side dans les pages. Ne pas en construire une seconde.

## Règles d'implémentation critiques

### Règles TypeScript

**Compilateur — ces flags produisent des erreurs, pas des warnings** (`tsconfig.app.json:18-21`)
`strict` · `noUnusedLocals` · `noUnusedParameters` · `noFallthroughCasesInSwitch`
→ un import mort ou une variable inutilisée **casse `npm run typecheck`, donc la CI**.
L'exemption TS par underscore ne vaut que pour les *paramètres* ; un *local* nommé `_foo`
échoue quand même.

**Portée du typecheck** — `include: ["src"]` uniquement.
`tests/`, `functions/`, `worker/`, `scripts/` n'y sont **pas**. Vitest transpile sans vérifier :
une erreur de type dans un `.test.ts` est invisible partout. Ne jamais s'y fier comme filet.

**Imports**
- Alias `@/*` → `src/*`, défini deux fois et à garder synchronisé
  (`tsconfig.app.json:22-23` et `vite.config.ts:19`).
- `isolatedModules` + `moduleDetection: force` → **les ré-exports de types exigent `export type`**.
- Les types s'importent toujours en `import type` ou avec le spécificateur inline `type`.
- Pas d'`import React` (`jsx: react-jsx`).

**Variables inutilisées — préfixe `_`** (`eslint.config.js:28-31`)
`@typescript-eslint/no-unused-vars` est relevé en **error**, avec `^_` autorisé pour les
arguments, variables et erreurs capturées. Ce n'est pas cosmétique : certains paramètres sont
volontairement ignorés côté client parce que le serveur les redérive
(`lib/firestore/certificates.ts:22`). **Ne pas « corriger » un `_param` en le supprimant.**

**Gestion d'erreur**
- Forme canonique : `catch (error: unknown)`. **Jamais `catch (error: any)`.**
- Le narrowing se fait par cast, pas par `instanceof` :
  `const code = (error as { code?: string })?.code ?? ''`
- `catch { }` nu est réservé aux échecs délibérément ignorés (télémétrie non bloquante),
  et porte alors un commentaire qui le dit.
- ⚠️ **Ne jamais appeler `Sentry.captureException` directement.** Passer par
  `captureError(error, { context })` (`src/lib/sentry.ts:26`) — il retombe sur `console.error`
  sans DSN et Sentry est désactivé en dev. Convention de `context` :
  `` `nomFonction(arg)` `` dans `lib/firestore`, phrase anglaise (`'Save article failed'`) ailleurs.

**Conventions de types**
- Props : `interface XProps`, **non exportée**, déclarée au-dessus du composant.
  71 occurrences, zéro `type XProps` — ne pas introduire la forme `type`.
  Étendre les types DOM quand c'est pertinent : `interface ButtonProps extends
  ButtonHTMLAttributes<HTMLButtonElement>`.
- `export interface` est réservé aux types **consommés par un autre fichier**.
- Entités métier → `src/types/index.ts`. Types locaux/UI → colocalisés.
- ⚠️ Pièges d'emplacement : `Note` vit dans `src/lib/firestore/notes.ts:9`, pas dans `types/`.
  `src/types/gamification.ts` exporte aussi des **valeurs runtime** (`BADGES`, `XP_REWARDS`,
  `getLevelFromXP`) — ce n'est pas un fichier de types pur.

**Barrel `lib/firestore`** — `index.ts` fait `export *` sur 14 fichiers.
→ **Tout nom exporté doit être unique sur l'ensemble des 14.** Un doublon casse le build,
sans namespace pour te protéger.

**Langue** — les commentaires du code sont en français. Les fonctions exportées de `lib/`
portent des blocs JSDoc. Plusieurs fichiers `src/lib/*` contiennent des blocs `⚠️` qui encodent
de vraies contraintes (`segments.ts:8`, `sectionThemes.ts:14`, `search.ts:11`) : les lire avant
d'éditer le fichier.

⚠️ **Warnings ESLint** — `npm run lint` n'a pas de `--max-warnings` : aucun warning ne fait
jamais échouer la CI. Le README affiche pourtant « ESLint : pas de warnings » comme règle maison.
*(à confirmer : règle vivante ou directive périmée ?)*

### Structure des composants

- **`export default function ComponentName()`** — déclaration de fonction, systématiquement.
  Zéro `React.FC`, zéro composant en arrow function dans tout le repo. Ne pas en introduire.
- Composants secondaires dans le même fichier : `export function` nommé.
- Fichiers multi-exports (pas de default) : uniquement quand c'est intentionnel —
  `ui/Typography.tsx`, `ui/Toast.tsx`, `routing/ProtectedRoute.tsx`, `lms/tabs/club/_shared.tsx`.
- Nommage : composants et pages en **PascalCase.tsx** ; hooks en **camelCase `useX.ts`** (pas `.tsx`) ;
  `lib/firestore/*` en **minuscule, un mot** ; modules partagés privés à un dossier préfixés `_`.
  `src/lib/*` est mixte : camelCase par défaut, kebab-case seulement quand ça calque un nom
  externe (`meta-pixel.ts`, `web-vitals.ts`).
- ⚠️ **`lms/routes/*Page.tsx` et `lms/tabs/*Tab.tsx` ne sont pas des doublons.** Les `*Page` sont
  des adaptateurs de ~15 lignes qui lisent `useOutletContext<StudentLayoutContext>()` et le
  répandent dans le `*Tab` présentationnel. Ajouter une prop à un Tab = la faire passer par
  `StudentLayoutContext` **et** par l'adaptateur Page.
- ⚠️ `pages/admin/components/Club*Tab.tsx` et `pages/lms/tabs/club/Club*.tsx` sont **deux features
  différentes** (CRUD admin vs UI membre) sur les mêmes collections. Pas des copies.

### Accès aux données

- **Toujours importer depuis le barrel `lib/firestore`**, jamais depuis un sous-module.
- Pas de classe repository, pas de `withConverter()`. Les documents sont castés :
  `{ id: d.id, ...d.data() } as T`.
- `helpers.ts` détient le CRUD générique et **ré-exporte `db` et `serverTimestamp`** — les modules
  de `lib/firestore` ne réimportent jamais `config/firebase`.
- `content.ts` contient podcasts + vidéos + FAQ + rendez-vous + témoignages. Ne pas créer `podcasts.ts`.
- Accès Firestore direct depuis un composant : toléré uniquement quand la primitive n'est pas
  exposée par la lib (`writeBatch`, `onSnapshot`, `addDoc`, bootstrap auth). Ces fichiers importent
  `db` depuis `config/firebase`.
- ⚠️ **Écritures privilégiées = callables Cloud Functions, jamais Firestore.** Les règles refusent
  l'écriture client sur `certificates`, `referrals`, `leaderboard`, `analytics`, `activity_logs`.
- `httpsCallable` se déclare **au niveau module**, avec génériques requête/réponse explicites —
  jamais dans le corps du composant.
- ⚠️ **Ne pas importer `firebase/storage`.** Les médias passent par Cloudflare R2 via
  `uploadMedia()` (`src/lib/storage.ts`, XHR pour la progression). URLs publiques sur
  `media.maxmorrys.me`.
- ⚠️ `updateUserProfile` **jette silencieusement** tout champ absent de `ALLOWED_PROFILE_FIELDS`
  (`lib/firestore/users.ts:16-30`). Ajouter un champ à `User` ne suffit pas à le rendre enregistrable.

### État & fetching — le partage est délibéré

- `@tanstack/react-query` n'est utilisé que dans **6 fichiers** : `Blog`, `Formations`, `Videos`,
  `Podcasts`, `useStudentData`, `useAdminUsers`. Tout le reste est `useState` + `useEffect` +
  `try/catch/finally` avec un booléen `loadingX` et `addToast('error', …)`. **Ne pas migrer
  spontanément** l'un vers l'autre.
- ⚠️ **`useMutation` n'est jamais utilisé** (zéro occurrence) et **`invalidateQueries` jamais appelé.**
  Les écritures sont des handlers `async` qui appellent `lib/firestore` puis `refetch()` ou
  patchent via `queryClient.setQueryData`.
- **Les query keys viennent de l'objet `queryKeys`** (`src/lib/queryClient.ts:23-31`). Zéro littéral
  inline dans le repo. Ajouter un `useQuery` = ajouter sa clé là-bas.
- Defaults volontairement frugaux pour limiter les lectures Firestore : `staleTime` 5 min,
  `gcTime` 30 min, `refetchOnWindowFocus: false`, `retry: 1`. Ne pas surcharger sans raison.
- Déstructuration toujours aliasée vers les noms legacy :
  `const { data: posts = [], isLoading: loading, isError: error, refetch } = useQuery(...)`
- Requêtes conditionnelles : `enabled: !!userId` **plus** un `loadingX = !!userId && isLoading`,
  pour que le spinner ne clignote pas pour un visiteur déconnecté.
- Le temps réel passe par `onSnapshot` (`subscribeCollection`, `listenMessages`), jamais react-query.

### i18n & routing — la zone la plus piégeuse

- **FR non préfixé et canonique ; EN sous `/en`.** La langue vient **uniquement du préfixe d'URL**
  (`getLangFromPath`), jamais de l'état i18next.
- ⚠️ **L'arbre de routes est monté deux fois** : `appChildren()` puis `localizeRouteTree(…, 'en')`.
  **Ajouter une route = deux éditions** — le `path` en **français** dans `App.tsx`, et son segment
  dans `src/i18n/segments.ts`. Sans le second, `/en` sert silencieusement l'URL française.
- ⚠️ **Chaque valeur de segment EN doit être unique sur toute la map** (le mapping inverse
  `EN_TO_FR` en dépend) — `segments.ts:13` documente la collision `formations→courses` /
  `cours→learn`.
- Navigation via `LocalizedLink` / `useLocalizedPath()` / `localizedPath()`.
  Un `<Link to="/blog">` brut sort de `/en`.
- ⚠️ **Ajouter un namespace i18n = 4 éditions dans `src/i18n/index.ts`** (import, `NAMESPACES`,
  `resources.fr`, `resources.en`). Les 21 namespaces sont bundlés statiquement, rien n'est
  auto-découvert : créer le JSON seul ne fait rien.
- Consommation : `useTranslation('<ns>')` avec **un seul** namespace, puis clés pointées nues.
  **La syntaxe `ns:key` n'est utilisée nulle part.**
- Clés : leaf camelCase sous une section camelCase (`login.successToast`). SEO sous `seo.*`.
- ⚠️ **`throw new Error('errors.xxx')` depuis `AuthContext` est une clé de traduction**, résolue par
  `localizeAuthError(error, t)` contre le namespace **`auth`** — alors qu'un namespace `errors`
  distinct existe et ne contient que les pages 404/403. Piège réel.
- **Le contenu Firestore n'est pas dans les JSON** : traduit à la volée FR→EN par le callable
  `translateContent` (batch 60 ms, max 60 textes, cache mémoire). Consommer via
  `useTranslatedText` / `useTranslatedList` / `useTranslatedContent`.
- ⚠️ **Ne jamais appeler le hook `useTranslatedText` dans un `.map()`** — utiliser le composant
  `<TranslatedText text={…} as="h3" />` (contrainte documentée dans le fichier).
- Slugs localisés : `contentPath(kind, item, lang)` pour construire les URLs ; `getPostBySlug`
  essaie `slug_en` d'abord.
- `LanguageProvider` doit être rendu **à l'intérieur du Router** (il utilise `useLocation`).
- Deux clés localStorage aux sémantiques différentes : `mm-lang` (réécrite à chaque page) et
  `mm-lang-explicit` (bascules utilisateur seulement).

### Styling

- ⚠️ **`cn()` n'est PAS `clsx` + `tailwind-merge`.** C'est un `filter(Boolean).join(' ')`
  (`src/lib/utils.ts:3`) : **aucune résolution de conflit**. Deux `bg-*` concurrents sont
  départagés par l'ordre source CSS, pas par l'ordre d'appel. Toujours concaténer `className` en dernier.
- Primitives `components/ui/` : **maps de variantes** au niveau module (`const variants = {...}`),
  jamais de chaînes conditionnelles. Pas de CVA. Les pages, elles, utilisent des `className` inline
  longs — les deux styles coexistent légitimement.
- **Chaque utilitaire de couleur porte son pendant `dark:`.** `darkMode: 'class'`.
- ⚠️ **Ne jamais construire un nom de classe Tailwind par concaténation** — le purge les supprime.
  Les classes de `src/lib/sectionThemes.ts` sont écrites littéralement pour cette raison.
- Identité par section centralisée dans `sectionThemes.ts` (`universeThemes.blog`, `.formations`…),
  lue au niveau module : `const theme = universeThemes.blog`.
- ⚠️ **`morrys-600` et `plum-600` partagent le même hex `#8a3de8` — collision intentionnelle**
  (`tailwind.config.js:125-128`). `morrys` = identité Max-Morrys, `plum` = Club Digitos.
  Choisir **par le sens**, pas par la couleur. Ne pas dédupliquer.
- Presets de motion dans `src/lib/animations.ts`, à honorer avec `useReducedMotion()`.

### Auth, guards & providers

- **`role` vit sur `userData` (Firestore), pas sur `user` (Firebase Auth).** Rôles :
  `'student' | 'admin' | 'support'`. Nouvel inscrit = `'student'`.
- `ProtectedRoute` exige `user` ; `AdminRoute` autorise `['admin', 'support']`.
  Les redirections passent toujours par `localizedPath(…, lang)` avec `lang` dérivé de l'URL —
  jamais un `/connexion` en dur.
- ⚠️ **`admin` et `support` ne sont pas équivalents en aval** : seul `admin` peut accorder le rôle
  `admin`, et `AdminLayout` branche séparément sur `isAdmin` / `isSupport`.
  Les contrôles client **reflètent** les règles Firestore, ils ne les remplacent pas.
- Ordre des providers, porteur de sens (`App.tsx:342-354`) :
  `ErrorBoundary > HelmetProvider > ThemeProvider > AuthProvider > QueryClientProvider >
  ToastProvider > RouterProvider`, puis `LanguageProvider` **dans** le router.
  → `useLanguage` est indisponible hors du router (donc pas dans `ToastProvider`).
- ⚠️ **Toute nouvelle route lazy doit utiliser `lazyWithReload`** (`App.tsx:7-22`), pas
  `React.lazy` nu : il recharge la page une fois, gardé par `mm-chunk-reload`, quand un chunk
  périmé après déploiement échoue.
- Toasts : `addToast(type, message)` — **messages déjà traduits**, le provider ne traduit que son
  bouton de fermeture.
- ⚠️ `config/firebase.ts` **throw à l'import** si l'une des 6 `VITE_FIREBASE_*` manque.
  Les callables tapent la **prod** en dev sauf `VITE_USE_FUNCTIONS_EMULATOR=true`.
- Contenu Firestore rendu en HTML : toujours via `markdownToHtml()` (DOMPurify).
  Jamais de `dangerouslySetInnerHTML` brut.

### Tests

**Toujours passer par les scripts npm.** `vitest.config.ts:7` inclut `tests/**/*.test.ts`
globalement : un `vitest run` nu tenterait de lancer les tests de règles sans émulateur et
resterait bloqué.

| Commande | Portée | Prérequis |
|---|---|---|
| `npm test` | `tests/unit` uniquement | — |
| `npm run test:rules` | `tests/firestore-rules` via émulateur Firestore | **Java** |
| `npm run typecheck` | `src/` uniquement | — |

⚠️ **`npm test` porte `--passWithNoTests`** : une suite vide ou mal nommée passe en silence.
Un fichier hors `tests/unit/*.test.ts` n'est jamais exécuté et ne le signale pas.

**Ce que la CI vérifie réellement** — à ne pas surestimer :
- ❌ **`npm test` n'est jamais exécuté en CI.** Aucun job ne l'invoque.
- ⚠️ **Les tests de règles ne bloquent pas le déploiement** — choix explicite (`ci.yml:54`,
  « so it doesn't gate deploys while the suite grows »). Une règle cassée peut partir en prod.
- ✅ Bloquants sur PR : `npm run lint`, `npm run typecheck`, `npm run build`, plus le build des
  functions (`npx tsc --noEmit` + `npm run build`).
- ⚠️ `tests/` n'est **pas typechecké** (`tsconfig.app.json` n'inclut que `src`) et Vitest transpile
  sans vérifier : une erreur de type dans un test est invisible partout.

**Tests de règles Firestore** — `tests/firestore-rules/rules.test.ts` fait foi.
- `PROJECT_ID = 'demo-rules-test'`, aligné sur le `--project` du script. Le préfixe `demo-` est ce
  qui garantit qu'aucun appel ne sort vers un vrai projet.
- Charge le **vrai `firestore.rules`** depuis le disque : le test porte sur le fichier de prod.
- `afterEach` → `clearFirestore()`. Helpers : `asUser(uid)` et `seed(path, data)` via
  `withSecurityRulesDisabled`.
- `fileParallelism: false` est **obligatoire** — les suites partagent un seul émulateur.
- Timeouts relevés pour l'émulateur : test 15 s, hooks 30 s.
- Couvre : bornes XP/badges gamification, immutabilité du rôle, bornes de progression
  d'inscription, création client de transaction limitée aux cours gratuits.
  Adosse ses cas à `audit/AUDIT_SECURITY.md §S2`.

⚠️ **`scripts/rules.test.mjs` est un orphelin legacy.** Référencé par aucun script npm, il
duplique une partie de la suite Vitest, compte ses succès à la main, et utilise
`projectId: 'max-morrys'` — **le vrai identifiant de projet, sans préfixe `demo-`**.
Ne pas l'étendre, ne pas s'en inspirer. La suite Vitest est la référence.

**Couverture** — aucune configuration, aucun seuil, aucune dépendance `@vitest/coverage-*`.
Il n'y a pas d'objectif chiffré à atteindre. L'attente réelle : **toute modification de
`firestore.rules` s'accompagne d'un test dans `tests/firestore-rules`.**

⚠️ **Il n'existe aucun test de composant.** 147 fichiers `.tsx`, zéro test de rendu, et
`@testing-library/*` n'est pas installé. Ne pas écrire de test de composant en supposant que le
harnais existe — il faudrait d'abord ajouter la dépendance et l'environnement `jsdom`, ce qui est
une décision à prendre, pas un détail d'implémentation.

### Qualité & style

**Aucun formateur dans le repo** — pas de Prettier, pas de script `format`, pas d'`.editorconfig`.
Le style se calque sur le fichier voisin. Ne pas reformater un fichier existant en passant.

**Portée réelle d'ESLint** (`eslint.config.js`)
- `eslint .` n'ignore que `dist`. **`functions/`, `worker/` et `scripts/` sont donc lintés**,
  alors qu'aucune config Node ne leur est appliquée : `globals.browser` est déclaré globalement
  et il n'existe pas d'override par dossier. Des faux positifs sur les globales Node y sont normaux.
- Config `tseslint.configs.recommended` **sans type-checking** — les règles nécessitant le type
  ne tournent pas. Ne pas supposer qu'une erreur de typage sera attrapée par le lint.
- ⚠️ **Warning toléré** : `react-refresh/only-export-components` (`allowConstantExport: true`).
  Mélanger un export non-composant dans un fichier de composant avertit sans bloquer — c'est
  assumé dans `contexts/` et `ui/`.
- `react-hooks/exhaustive-deps` est en **error**. Certains `eslint-disable-next-line` sont
  délibérés parce que les deps sont calées sur une chaîne jointe
  (`hooks/useTranslatedContent.ts:73,99`). **Ne pas les « corriger ».**

**Commentaires & documentation**
- Commentaires en **français**, réservés à la logique non évidente (règle README).
- JSDoc attendu sur les fonctions exportées de `src/lib/`.
- Sections longues balisées par des séparateurs : `// ── Club des Digitos ───`.
- ⚠️ Les blocs `⚠️` dans `src/lib/*` encodent de vraies contraintes, pas des remarques :
  `segments.ts:8` (unicité des segments EN), `sectionThemes.ts:14` (classes littérales,
  purge Tailwind), `search.ts:11` (clé search-only). À lire avant d'éditer le fichier.

**Tokens de design — contraignants** (`DESIGN_BRIEF.md`, source de vérité `tailwind.config.js`)
- Police unique **Inter** 300-900. Titres en weight 900 avec `letter-spacing: -0.02em`,
  corps en 400-500.
- Palettes : `brand` (bleu `#0c93e7`), `accent` (ambre), `success`, `warning`, `error`, `neutral`,
  `coral` (Blog), `plum` (Club), `teal` (Rysmo), `morrys` (identité Max-Morrys).
- **Le dark mode natif est requis**, pas optionnel.
- Rayons généreux (`rounded-xl`/`2xl`, boutons `rounded-full`), ombres douces,
  glow bleu signature `0 0 20px rgba(12,147,231,0.15)`.
- **Le code couleur par section est un système**, pas une préférence — défini dans
  `src/lib/sectionThemes.ts` : Formations=bleu, Blog=corail, Podcasts/Club=violet, Vidéos=rouge,
  À propos=violet Morrys.
- Échelle typo custom : `text-heading-hero|heading-section|heading-card|heading-sub|body-lg|body-sm|caption`.
  Utilitaires custom : `shadow-soft`, `shadow-glow`, `rounded-4xl`,
  `animate-fade-in|slide-up|slide-down|scale-in|spin-slow`.
- ❌ **Directive périmée** : `DESIGN_BRIEF.md` indique « français exclusivement ».
  L'i18n FR/EN est livrée — cette ligne ne s'applique plus.

**Budgets de performance** (README) — FCP < 1,5 s · LCP < 2,5 s · TTI < 3,5 s · CLS < 0,1.
`web-vitals` est instrumenté dans l'app.

**Dossiers à ne jamais éditer**

| Chemin | Raison |
|---|---|
| `dist/` | Sortie de build **et** répertoire public Firebase Hosting. Régénérer via `npm run build`. |
| `functions/lib/` | Sortie compilée, **commitée dans git** (54 fichiers). Éditer `functions/src/` puis rebuild, et committer le `lib` régénéré. |
| `.firebase/` | Cache de déploiement CLI. |
| `backups/` | Archive historique n8n/Airtable, en lecture seule. |
| `audit/` | Rapports datés. Ce sont des constats à une date donnée — **ne pas les « mettre à jour » pour coller au code actuel**. Beaucoup d'items Sprint 0 sont déjà traités. |
| `node_modules/` ×3 | — |

### Workflow

**Git**
- ✅ **Conventional Commits, rédigés en français** — c'est la pratique réelle :
  `feat(paperclip): appel direct n8n`, `fix(functions): renderSocialCard — …`,
  `refactor(search): …`, `chore: …`, `test: …`, `perf: …`, `audit: …`
- Branches typées par intention : `audit/sprint-0-quickwins`, `feature/<nom>`. PR vers `main`.
- ❌ **Directive périmée** : le README prescrit le format `'Add: ma feature'`.
  Suivre l'historique git, pas le README.

**Ce que la CI fait — et ne fait pas**
- Sur PR : `lint` → `typecheck` → `build` → build des functions. Tous bloquants.
  Les tests de règles tournent dans un job séparé, **non bloquant**. `npm test` n'est pas exécuté.
- ⚠️ **Le job de déploiement ne pousse QUE le hosting.** Règles Firestore, index, règles Storage
  et Cloud Functions sont buildés mais **jamais déployés par la CI**.
- ⚠️ **Le canal de preview des PR se déploie sur le projet de PRODUCTION** — éphémère, mais
  branché sur les vraies données.

**Déploiement — tout vise la prod**

⚠️ `.firebaserc` ne déclare qu'un projet (`max-morrys`). **Aucun alias de staging.**
Tout `firebase deploy` local touche la production.

Ce que la CI ne couvre pas doit être fait à la main, après build :

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
firebase deploy --only functions
cd worker && npx wrangler deploy   # entièrement hors CI
```

**Une modification de `firestore.rules` mergée dans `main` est dans git, pas en ligne.**

**Régions des Cloud Functions — ne pas les uniformiser**
- `europe-west1` : `prerender`, `sitemap`, `catalog`, `rss`, `renderSocialCard`.
  C'est exactement l'ensemble câblé aux rewrites de hosting.
  ⚠️ **Changer la région d'une de ces fonctions casse son rewrite.**
- `us-central1` : tout le reste (admin, paiement, proxy, search, cv, RGPD, certificats, rysmo…).

**Secrets**
- Secret Manager via `defineSecret` : `GOOGLE_AI_API_KEY`, `BICTORYS_API_KEY`,
  `BICTORYS_WEBHOOK_SECRET`, `TYPESENSE_URL`, `TYPESENSE_ADMIN_KEY`, `YOUTUBE_API_KEY`,
  `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `META_ACCESS_TOKEN`.
  Posés par `firebase functions:secrets:set`.
- ⚠️ **Chaque fonction doit lister ses secrets dans ses options runtime**, sinon elle reçoit une
  valeur vide à l'exécution — sans erreur au déploiement.
- Config non secrète via `defineString` (`BICTORYS_API_URL`, `APP_BASE_URL`).
- ⚠️ **`functions/.env.max-morrys` est tracké dans git.** Ne jamais y écrire un secret.
- ⚠️ **Ne jamais lire, afficher ni committer** : `max-morrys-*.json` (clé privée de compte de
  service GCP) et `.env.local`. Tous deux gitignorés — le rester.

**Modifications qui exigent une édition ailleurs**

| Changement | Édition supplémentaire obligatoire |
|---|---|
| Nouvelle route SEO publique | Liste de rewrites `prerender` dans `firebase.json`, **en FR et en `/en`** — sinon la route tombe sur le shell SPA sans HTML serveur |
| Nouveau script / iframe / appel réseau tiers | CSP `firebase.json:42`. ⚠️ **Aucune CSP en dev** : ça marche en local et casse en prod |
| Nouvelle requête multi-champs ordonnée | `firestore.indexes.json`. L'émulateur ne proteste pas, la prod si |
| Nouvelle collection Firestore | Règle explicite : le catch-all final refuse tout par défaut |
| Changement d'origine média | **4 endroits à garder cohérents** : `worker/wrangler.toml` (`ALLOWED_ORIGINS`), CSP `connect-src`, CSP `media-src`, `VITE_MEDIA_API_URL`. Aucune source partagée |
| Modification de `firestore.rules` | Test dans `tests/firestore-rules` + déploiement manuel |

**Contraintes d'outillage locales**
- `npm ci`, jamais `npm install` (le lockfile fait foi).
- `npm run test:rules` exige **Java** installé.
- ⚠️ Les scripts BMad (`_bmad/scripts/*.py`) exigent **Python ≥ 3.11** (`tomllib`).
  Le `python3` du système est plus ancien : les invoquer via `uv run --python 3.11 …`,
  sinon ils sortent en erreur 3.

**Modèle de sécurité Firestore — à connaître avant d'écrire du code client**
- Les rôles vivent dans les **documents Firestore**, pas dans des custom claims :
  chaque `isAdmin()` coûte un `get()` (facturé + latence).
- Les IDs d'inscription sont composites et porteurs de sens : `{uid}_{formationId}`.
- Collections **serveur uniquement** (`allow write: if false`) : `certificates`, `referrals`,
  `leaderboard`, `analytics`, `activity_logs`, `rysmoProfiles`, `rysmoConversations`,
  `webhook_events`, `_ratelimits`. Y ouvrir une écriture client exige une Cloud Function,
  pas une modification de règle.
- ⚠️ `COOP` est volontairement en `same-origin-allow-popups` (`firebase.json`) —
  requis par la connexion Google en popup. **Ne pas « durcir » en `same-origin`.**
- ⚠️ Le HMAC du webhook Bictorys se calcule sur les **octets bruts** ; le parsing de corps de
  `firebase-functions` interfère. Ne pas refactoriser cette gestion de requête (`payment.ts:568`).

### Pièges critiques — à lire en premier

**Les 5 qui frappent le plus souvent**

1. **Tailwind est en v3, pas v4.** Écrire `@theme` en CSS ou supprimer `tailwind.config.js`
   casse silencieusement tout le thème. Aucune erreur de type.
2. **`cn()` ne fusionne pas les classes Tailwind.** Pas de `tailwind-merge`.
   Deux `bg-*` concurrents sont départagés par l'ordre source CSS. `className` en dernier.
3. **Ajouter une route = 2 fichiers** (`App.tsx` en français + `i18n/segments.ts`),
   et le segment EN doit être unique sur toute la map. Sinon `/en` sert l'URL française.
4. **Ajouter un namespace i18n = 4 éditions** dans `src/i18n/index.ts`.
   Créer le fichier JSON seul ne fait rien.
5. **Un import mort casse la CI.** `noUnusedLocals` + `noUnusedParameters` sont des erreurs
   de compilation, pas des warnings.

**Les 4 qui coûtent le plus cher**

6. **Une règle Firestore mergée n'est pas déployée.** La CI ne pousse que le hosting.
   Corriger une faille et s'arrêter au merge ne corrige rien.
7. **Tout `firebase deploy` vise la production.** Aucun staging. Les previews de PR aussi.
8. **La CSP ne casse qu'en prod** — il n'y en a aucune en dev. Tout nouveau domaine tiers
   passe en local et échoue en ligne.
9. **Ne jamais lire ni committer** `max-morrys-*.json` (clé privée GCP) ni `.env.local`.

**Ne pas « corriger » — c'est intentionnel**

- Les paramètres préfixés `_` ignorés dans `certificates.ts` (le serveur les redérive).
- Les `eslint-disable exhaustive-deps` de `useTranslatedContent.ts` (deps sur chaîne jointe).
- `morrys-600` et `plum-600` au même hex (deux identités de marque distinctes).
- `COOP: same-origin-allow-popups` (requis par l'auth Google en popup).
- Le traitement de requête brut du webhook Bictorys (HMAC sur octets bruts).
- `functions/lib/` commité dans git (ne pas l'ajouter au `.gitignore`).
- `lms/routes/*Page.tsx` vs `lms/tabs/*Tab.tsx` (adaptateurs, pas doublons).
- `pages/admin/components/Club*` vs `pages/lms/tabs/club/Club*` (deux features).

**Code mort et bruit — ne pas s'en inspirer**

- ⚠️ **`src/lib/mockData.ts` n'est importé nulle part.** Il ressemble aux données de seed
  de l'application. Il ne l'est pas.
- ⚠️ **`scripts/rules.test.mjs`** — orphelin legacy pointant sur le **vrai** `projectId`.
  Ne pas l'étendre.
- `firestore-debug.log`, `.DS_Store` — résidus non trackés, ignorer.
- ❌ Directives périmées : `.bolt/prompt` (icônes), README (format de commit),
  `DESIGN_BRIEF.md` (« français exclusivement »).

**Sécurité**

- Les contrôles de rôle côté client **reflètent** les règles Firestore, ils ne les appliquent pas.
  L'autorité est dans `firestore.rules` et les Cloud Functions.
- `admin` ≠ `support` en aval : seul `admin` peut accorder le rôle `admin`.
- Tout contenu Firestore rendu en HTML passe par `markdownToHtml()` (DOMPurify).
  Jamais de `dangerouslySetInnerHTML` brut.
- Uploads : politique par dossier dans le Worker (`FOLDER_RULES`) — `uploads/`, `club_events/`,
  `club_sessions/` réservés admin ; `avatars/` propriétaire 2 Mo ; `club_media/`,
  `testimonial_media/` propriétaire 100 Mo. Le contrôle de propriété exige la forme de clé
  `<prefix><uid>/<fichier>`.
- ⚠️ **Les sourcemaps partent en production.** `sourcemap: 'hidden'` génère les `.map` dans
  `dist/` et `firebase.json` ne les exclut pas : elles sont publiquement récupérables.
  Ne pas y laisser fuiter de logique sensible.

**Performance**

- Les defaults TanStack Query sont volontairement frugaux (`staleTime` 5 min,
  pas de refetch au focus) pour limiter les lectures Firestore facturées. Ne pas les desserrer.
- Chaque `isAdmin()` dans les règles coûte un `get()` facturé.
- Utiliser `getCountFromServer` pour les compteurs, jamais un fetch complet.
- Budgets : FCP < 1,5 s · LCP < 2,5 s · TTI < 3,5 s · CLS < 0,1.

---

## Comment utiliser ce fichier

**Pour les agents IA**
- Lire ce fichier **avant** d'écrire du code dans ce projet.
- Commencer par « Pièges critiques » puis remonter vers la section concernée.
- En cas de doute, choisir l'option la plus restrictive.
- Les marqueurs ont un sens : ✅ décision assumée · ⚠️ accident toléré ou piège ·
  ❌ directive périmée à ne plus appliquer.
- Ce fichier prime sur `.bolt/prompt`, le README et `DESIGN_BRIEF.md` en cas de contradiction.

**Pour les humains**
- Le garder sec : il ne documente que le **non évident**. Ce qu'un agent déduit du code n'a pas
  sa place ici.
- Le principe directeur : ne pas décrire la stack, mais **cartographier les écarts entre ce repo
  et ce qu'un modèle suppose par défaut**. Les numéros de version sont des ancres au service des
  frontières, pas un inventaire — `package.json` fait foi pour le courant.
- À mettre à jour lors d'un changement de majeure, d'un déplacement de convention, ou quand une
  règle devient évidente (auquel cas : la supprimer).
- Points laissés ouverts, à trancher : statut des deux libs d'icônes (accident ou décision) ;
  la règle « zéro warning ESLint » du README est-elle encore vivante.

Dernière mise à jour : 2026-07-20
