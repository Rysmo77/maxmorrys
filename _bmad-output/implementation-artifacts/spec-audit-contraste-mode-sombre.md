---
title: 'Audit 1/E2/C1 — texte illisible sur les surfaces claires en mode sombre'
type: 'bugfix'
created: '2026-11-03'
status: 'done'
baseline_commit: 'd38a519169b50eecdf17373c2db28c9d6b703df8'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/src/design-system/css/overrides/ad-22-surface-feuille.css']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En mode sombre, `--ink` passe à #ECF0F5 mais `--paper`, `--paper-2` et les pastels `--mm-*-c` restent clairs (AD-22, AD-27). Toute surface qui pose ces jetons bruts en fond affiche du texte clair sur fond clair : carte de réservation de /contact (1,1:1), entrée active du menu latéral Edu (1,17:1), conteneur du Club (1,07:1) — audit du 03/11/2026, constats 1, E2, C1 (P1).

**Approach:** Même correction qu'AD-22 : les fonds lisent des jetons qui changent avec le thème (`--surface-band`, `--surface-sheet`, `--fill-2`), jamais `--paper-*` brut. Une surcharge corrige les règles du kit généré ; les composants sont migrés ; un test bloque tout retour de `--paper-*` en fond.

</frozen-after-approval>

## Boundaries & Constraints

**Always:** ne jamais éditer `kit-v3/components.css` ni `tokens/*.css` (générés) — tout passe par `overrides/`. Le mode clair doit rester identique au pixel près (les jetons valent `--paper*` en clair).

**Never:** redéclarer `--paper`/`--paper-2` sous `.dk` (contredit AD-22) ; toucher `CoursePlayer.tsx` et `RysmoWidget.tsx` (modifs utilisateur non commitées) — signalés à part.

## Code Map

- `src/design-system/css/overrides/ad-29-papier-nuit.css` (nouveau, importé comme les autres overrides) : sous `.dk`, `.mm-app,.mm-dash,.mm-con,.mm-cm,.mm-tabs,.mm-lfoot,.mm-bm,.mm-step__vis,.mm-vid,.mm-browser__url` → `--surface-band` ; `.mm-surface,.mm-btn__arrow` → `--surface-sheet` ; survols, `kbd`, `.mm-theme [aria-pressed]`, `.mm-more`, `.mm-st.mute`, `.mm-cbtn[disabled]`, `.mm-ctabs a b`, `.mm-chk.n` → `--fill-2`.
- `overrides/passe2-chassis.css:50` : `.dk .mm-sidenav a[aria-current]` garde le pastel → fond `color-mix(--mm-bleu 22 %)` (violet pour Club, `--nav-on-bg` pour la console), texte `--ink`.
- Composants, fond `var(--paper-2)` → `var(--surface-band)` : Contact, Home, About, FAQ, Blog, BlogPost, MediaPole, Conception, hub/Compte, StudentLayout, Checkout, PaymentReturn, NotesTab, CoursesTab, DashboardTab, RysmoPage, QuizPage, MissionsPage, CohortePage, edu/g3 OfflineCard, QuizCard. `SiteBand tint="var(--paper)"` (ClubDigitos) → `var(--surface-page)`. Puce About:165 `color: var(--paper)` → `var(--surface-page)`.
- `tests/unit/dark-paper-guard.test.ts` (nouveau) : échoue si un `.tsx` de `src/` (commentaires retirés) pose `var(--paper)`, `--paper-2` ou `--paper-3` en fond hors liste blanche (les 2 fichiers exclus, les `color-mix` translucides) ; échoue si une règle de `kit-v3/components.css` met un `--paper*` en fond sans que son sélecteur figure dans `ad-29`.

## Tasks & Acceptance

- [x] Créer `ad-29-papier-nuit.css` et l'importer ; corriger `passe2-chassis.css`.
- [x] Migrer les composants listés.
- [x] Écrire le test de garde.

**AC1:** Given le thème sombre, when on ouvre /contact, le dashboard Edu et le fil du Club, then le texte des trois surfaces atteint ≥ 4,5:1.
**AC2:** Given le thème clair, when on compare avant/après, then aucun fond ne change de valeur.
**AC3:** Given un nouveau `bg-[color:var(--paper-2)]` dans un `.tsx`, when `npm test`, then le test de garde échoue.

## Implementation Notes

- Implémentation par sous-agent dev ; 4 fichiers admin hors liste migrés (exigés par la garde). `.mm[data-theme]` ajouté à ad-29 (règle partagée avec `.mm-surface`). Survols en `:not([aria-current])`.

## Review Triage Log

- Paires inversées du kit (`--ink` en fond, `--paper` en texte : `.mm-btn`, puce pressée, infobulle, badge du bandeau, flèches) — medium, vérifié dans `kit-v3/components.css` → patch.
- Pastels `--mm-*-c` sous encre claire (`.mm-numgrid`, NotesTab:120) — medium, même défaut qu'E2 → patch (jetons `--tint-*`).
- `edu-g1.css` en `--paper*` brut — medium, vérifié lignes 50/76/105/173 → patch.
- `color-mix` de `--paper` à 90 %/60 % (FormationCard, UserEditModal) — low, quasi opaque sous encre claire → patch.
- Garde : utilitaires `bg-paper*` non vus — low → patch ; `.css` hors kit non scannés — medium → patch ; correspondance par sous-chaîne (`.mm-cm` ⊂ `.mm-cmdk`) et corps non vérifié — medium → patch.
- Fichiers exclus (CoursePlayer) — medium, réel → defer (modifs utilisateur non commitées).
- Bandes `.dk` locales dans les pages claires — false : sous `.dk` local, `--ink` est déjà clair, ces fonds blancs étaient illisibles ; ils deviennent lisibles.
- Page entière en `--surface-band` — false : en clair, `--paper-2` servait déjà de fond de page ; le rapport fond/tuile est identique dans les deux modes.
- `.dk .mm[data-theme]` sur `data-theme="light"` — false : sélecteur inutilisé dans `src/`.
- `popupStyles.ts` — false : la seule occurrence est un commentaire.
- Regex inline cassée par une virgule — low, rejeté : aucune occurrence, correctif non trivial.
- Pas de test de ratio calculé — low, rejeté : ratios calculés à l'implémentation (≥ 10:1), test d'ampleur disproportionnée.
- Vérifié après correctifs de revue : typecheck, ds:check (0), build, 1138/1138 tests unitaires. Jetons `--tint-*` régénérés dans `tokens.generated.ts` (web et mobile) ; la valeur nuit est un `color-mix`, inutilisable en React Native — aucun écran mobile ne la lit aujourd'hui.
