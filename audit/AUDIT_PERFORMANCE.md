# AUDIT PERFORMANCE — maxmorrys.me

> Basé sur l'exécution réelle de `npm run build` (Vite 5, 2026-06-14) + analyse statique. Core Web Vitals **estimés** (non mesurés en runtime).

## 1. Résultat de build (réel)

`npm run build` → **succès en 8,30 s**, optimisation d'images activée (gain ~40 %, −254 kB sur 5 assets dont `icone-mm.png` −85 %).

⚠️ Avertissement Vite : *« Some chunks are larger than 500 kB after minification. »*

### Plus gros chunks (minifié │ gzip)

| Chunk | Taille | Gzip | Commentaire |
|---|---|---|---|
| `firebase` | **538 kB** | 126 kB | SDK Firebase complet (Auth+Firestore+Storage+Functions) |
| `ClubPage` | **272 kB** | 65 kB | **Anormalement lourd pour une page** — à investiguer/splitter |
| `router` | **234 kB** | 76 kB | react-router-dom 7 (volumineux ; cf. aussi vuln S1) |
| `index` | 191 kB | 57 kB | Entrée app |
| `motion` | 146 kB | 49 kB | Framer Motion |
| `AdminClubDigitos` | 55 kB | 11 kB | Page admin Club |
| `icons` | 53 kB | 10 kB | lucide-react |
| `About` | 44 kB | 12 kB | Page monolithique (1218 lignes) |

> Les pages sont lazy-loadées (bon), mais le **chemin critique** charge `firebase` + `router` + `index` + `motion` ≈ **300 kB gzip** avant interactivité.

## 2. Problèmes de performance

### [PE1] Chunk `ClubPage` 272 kB — **MOYENNE / P1**
- `dist/assets/ClubPage-*.js` 272 kB (65 kB gzip) : la page Club agrège feed, infos, membres, leaderboard, opportunités, discussions, DM, sondages dans un seul chunk.
- **Reco** : lazy-loader les onglets Club (`React.lazy` par sous-onglet), externaliser les libs lourdes éventuelles. Cible : < 100 kB par chunk de page.

### [PE2] Chunk `firebase` 538 kB — **MOYENNE / P1**
- Import du SDK Firebase regroupé. Firebase 12 est modulaire : seuls les sous-modules utilisés devraient être inclus.
- **Reco** : vérifier les imports (`firebase/firestore`, `firebase/auth`, … et **pas** de barrel), confirmer le tree-shaking ; envisager de différer `firebase/functions`/`firebase/storage` jusqu'au besoin.

### [PE3] Pas de cache de données → lectures répétées — **MOYENNE / P1**
- Firestore SDK appelé à chaque montage (cf. DATA_FLOW). Pages re-fetchent à chaque navigation.
- **Impact** : latence perçue, coût Firestore (lectures facturées), INP dégradé sur navigations répétées.
- **Reco** : React Query avec `staleTime` raisonnable + `invalidateQueries` ciblé.

### [PE4] Requêtes serveur planifiées non bornées — **MOYENNE / P2**
- `streakReminder` (`gamification` complet), `media-stats` (`videos`/`podcasts` complets) — cf. BACKEND §B2. Coût et latence côté Functions à l'échelle.

### [PE5] `router` 234 kB — **FAIBLE-MOYENNE / P2**
- react-router-dom 7 est lourd ; le bump de sécurité (S1) est l'occasion de revérifier la taille.

### [PE6] Composants monolithiques re-render — **FAIBLE / P2**
- `About.tsx` (1218), `Home.tsx` (809), `ClubPage`, `AdminClubDigitos` : gros arbres ; risque de re-renders larges. `useMemo` déjà appliqué sur Blog/Videos/AdminUsers (cf. mémoire projet).
- **Reco** : découper + mémoïser les sous-sections coûteuses.

### [PE7] Listes non virtualisées — **FAIBLE / P3**
- Tables admin (`AdminUsers`, `AdminTransactions`) et feed Club : pas de virtualisation. OK à petite échelle, à surveiller au-delà de quelques centaines d'items.

## 3. Points forts performance

- **Code-splitting Vite** (`manualChunks`: firebase/router/motion/icons) + lazy-loading des pages (`lazyWithReload`).
- **Optimisation d'images au build** (`vite-plugin-image-optimizer` : WebP/AVIF, −40 %).
- **Cache HTTP** : `index.html` no-cache, assets hashés `immutable` 1 an (`firebase.json`).
- **SSR/prerender** pour le SEO (sitemap/rss/catalog/prerender) — bénéfique LCP des pages publiques.
- `getCountFromServer` pour les stats admin (évite de tout lire).
- `web-vitals` intégré (collecte possible).

## 4. Core Web Vitals — estimation (non mesurée)

| Métrique | Estimation | Justification |
|---|---|---|
| **LCP** | 🟡 Moyen | Pages publiques prerendues (bon), mais payload JS critique ~300 kB gzip |
| **INP** | 🟡 Moyen | Re-fetch sans cache + gros composants ; mitigé par lazy-loading |
| **CLS** | 🟢 Probablement bon | Images dimensionnées, skeletons présents |

> À **mesurer** réellement (Lighthouse / PageSpeed / collecte `web-vitals` en prod) avant d'agir finement.

## 5. Plan d'optimisation

**Quick wins**
1. Splitter `ClubPage` par onglet (lazy). (PE1)
2. Vérifier/forcer les imports Firebase modulaires. (PE2)
3. Borner les jobs planifiés. (PE4)

**Moyen terme**
4. Introduire React Query (cache + invalidation). (PE3)
5. Découper `About`/`Home`/`AdminClubDigitos` + mémoïsation ciblée. (PE6)
6. Mesurer les CWV en prod et fixer des budgets de bundle (`build.chunkSizeWarningLimit`, budgets CI).

**Avancé**
7. Virtualisation des longues listes (react-window). (PE7)
8. Différer `firebase/functions`/`storage` au premier usage.
9. Précharger (`modulepreload`) les chunks du parcours probable post-login.
