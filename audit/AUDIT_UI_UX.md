# AUDIT UI / UX — maxmorrys.me

> Analyse écran par écran (notes indicatives sur 10). Évaluation statique du code + design tokens ; pas de test utilisateur réel.

## 1. Système de design (constats)

**Forces** : 11 palettes de tokens cohérentes (`brand` bleu, `accent` orange, `plum/morrys` Club, sémantiques success/warning/error), typographie fluide `clamp` (`heading-hero/section/card`), bibliothèque de 18 primitives (`Button`, `Input`, `Modal`, `Sheet`, `Toast`, `Badge`, `Tabs`, `Pagination`, `Breadcrumbs`…), dark mode, micro-interactions Framer Motion, feedback toast généralisé, skeletons.

**Faiblesses** : design-system **non appliqué partout** — boutons natifs et couleurs en dur subsistent (`bg-[#FF0000]`, `bg-neutral-900 dark:bg-white`) → états hover/focus/disabled incohérents ; quelques *placeholder* en prod ; hiérarchie de CTA inégale.

## 2. Analyse écran par écran

| Écran | UX | UI | Problèmes clés | Quick wins |
|---|---|---|---|---|
| **Home** | 8 | 8 | CTA secondaires en couleur en dur ; fichier monolithique | Uniformiser boutons ; découper en sections |
| **About** | 7 | 8 | 1218 lignes ; previews Microlink qui peuvent échouer en silence | Fallback visuel ; découper |
| **Blog / BlogPost** | 8 | 8 | boutons « Réessayer » natifs ; feedback de copie discret | `<Button>` ; toast « copié » |
| **Formations** | 7 | 8 | sélecteurs de niveau en classes brutes (pas de focus) | `<Button variant>` segmenté |
| **FormationDetail** | 6 | 7 | **placeholder « programme bientôt disponible »** sur page de vente ; CTA inscription sans loading | Masquer si vide ; loading |
| **Podcasts / Videos** | 7 | 7 | clé carrousel = index ; placeholders « bientôt » ; pas de fallback image | clé stable ; masquer sections vides |
| **FAQ** | 7 | 7 | accordéon sans `aria-expanded` ; coquille « Reessayer » | a11y accordéon ; correction texte |
| **Contact** | 6 | 7 | double-submit booking ; validation email faible ; erreurs non liées | disable submit ; validation ; `aria-describedby` |
| **Login / Register** | 8 | 8 | liens internes en `target="_blank"` ; refCode non validé | `<Link>` ; valider refCode |
| **Legal/*** | 8 | 7 | contenu dense (acceptable) | sommaire ancré |
| **Dashboard (LMS)** | 8 | 8 | XP/streak engageants ; pas d'état d'erreur stats | `ErrorState` |
| **CoursePlayer** | 7 | 8 | progression non temps réel ; toggles modules sans `aria-expanded` ; certificat silencieux | sync ; a11y ; toast certif |
| **Checkout / PaymentReturn** | 7 | 7 | coupon sans feedback inline ; pas de guidage retry ; tracking dupliqué | feedback coupon ; retry ; dédup |
| **Club (feed/infos/membres/leaderboard/DM)** | 7 | 8 | **likes/votes/reposts optimistes sans rollback** ; chunk 272 kB | rollback+toast ; lazy onglets |
| **Rysmo (widget + store)** | 7 | 8 | quota parfois périmé ; `plan` toujours `null` (logique morte) | rafraîchir quota ; corriger logique |
| **Profil / Settings** | 8 | 8 | export RGPD sans gestion d'expiration ; signOut même si delete échoue | gérer erreurs critiques |
| **Témoignages** | 7 | 8 | notation étoiles non clavier | `role=radiogroup` |
| **Admin (CRUD)** | 7 | 7 | optimistic sans rollback ; tables a11y ; `support` voit des actions inopérantes | rollback ; `scope` ; gating support |
| **AdminClubDigitos** | 6 | 7 | 55 kB ; dense ; non entièrement audité | découper par onglet |

**Moyenne indicative : UX ≈ 7,2 / UI ≈ 7,6.**

## 3. Quick wins UX (fort impact / faible effort)

1. Retirer le *placeholder* « programme détaillé bientôt disponible » (FormationDetail).
2. Désactiver les boutons pendant l'envoi (anti double-submit) partout.
3. Rollback + toast d'erreur sur les actions Club optimistes.
4. Uniformiser tous les boutons sur `<Button>` (cohérence + a11y + états).
5. Feedback de copie explicite (toast) sur BlogPost.
6. Masquer les sections vides au lieu d'afficher « Bientôt… ».
7. Feedback inline sur le coupon (valide/invalide) au Checkout.
8. Corriger les coquilles (« Réessayer », « réussie »).

## 4. Refontes nécessaires (effort moyen)

- **Page Club** : architecture par onglets lazy + état partagé fiable (temps réel) — résout perf + persistance.
- **FormationDetail** : section programme pilotée par la donnée, CTA d'achat avec états complets.
- **Tables admin** : composant `DataTable` accessible et responsive (scroll horizontal, `scope`, tri, pagination, virtualisation optionnelle).
- **Formulaires** : hook `useForm` partagé (validation + erreurs liées + états) pour Contact/Newsletter/admin.

## 5. Composants UI à standardiser

| Composant | Action |
|---|---|
| `Button` | Bannir tout `<button>` natif et couleur en dur ; variantes officielles |
| `IconButton` (à créer) | Bouton icône avec `aria-label` obligatoire |
| `DataTable` (à créer) | Table accessible/responsive réutilisable (admin) |
| `ErrorState` / `EmptyState` (à créer) | États standardisés (remplacer placeholders ad hoc) |
| `Form`/`Field` | Label lié + message d'erreur + `aria-describedby` |
| `Modal`/`Sheet` | Focus trap + Échap + retour focus garantis |

## 6. Parcours à simplifier

- **Achat** : réduire la friction coupon (validation inline) et clarifier l'état post-paiement (succès/échec sans ambiguïté).
- **Onboarding étudiant** : guider vers la première formation depuis le dashboard (l'Onboarding existe — le rendre systématique).
- **Support (rôle)** : ne montrer que ce que `support` peut réellement faire (cf. ROLES).
