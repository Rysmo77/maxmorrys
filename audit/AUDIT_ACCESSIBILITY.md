# AUDIT ACCESSIBILITÉ (WCAG 2.1) — maxmorrys.me

> Estimation par analyse statique du code (classes Tailwind, attributs ARIA, structure). **Non validé** par lecteur d'écran / axe-core / Lighthouse runtime. À confirmer par un test outillé.

## 1. Synthèse

Base correcte : **109** usages `aria-*`, **77** `alt=` pour **70** `<img>` (bonne couverture des images), composants UI structurés, skeletons de chargement. Mais des **lacunes récurrentes** empêchent une conformité AA : libellés de formulaires non systématiquement liés, boutons icône sans nom accessible, tables sans sémantique d'en-tête, états d'accordéon non annoncés, *focus management* des modales non confirmé, et états signalés par la couleur seule.

**Score : 62/100 (Moyen).**

## 2. Problèmes par principe WCAG

### Perceptible

| ID | Problème | Fichiers | Critère | Criticité |
|---|---|---|---|---|
| A1 | États signalés par la **couleur seule** (badges de statut, sélections) | listes admin, badges | 1.4.1 | Majeur |
| A2 | Contrastes à vérifier sur texte secondaire `neutral-400/500` sur fond clair | global (tokens) | 1.4.3 | Majeur |
| A3 | Certaines images décoratives sans `aria-hidden` ; icônes SVG verbeuses | `Videos.tsx` (YtIcon), divers | 1.1.1 | Mineur |
| A4 | Fallback d'image manquant (ratio qui s'effondre) | `Podcasts.tsx:256`, cartes | 1.1.1 | Mineur |

### Utilisable

| ID | Problème | Fichiers | Critère | Criticité |
|---|---|---|---|---|
| A5 | **Boutons icône sans `aria-label`** (supprimer, fermer, actions de table) | pages admin (`AdminArticles`, `AdminVideos`…), divers | 4.1.2 | **Bloquant** |
| A6 | **Focus trap des modales non confirmé** (`Modal.tsx`, `Sheet.tsx`) ; retour de focus à la fermeture | `components/ui/Modal.tsx`, `Sheet.tsx` | 2.4.3 / 2.1.2 | **Bloquant** |
| A7 | Notation par **étoiles non navigable au clavier** | `TestimonialsTab.tsx:222-227` | 2.1.1 | Majeur |
| A8 | Accordéons sans `aria-expanded`/`aria-controls` | `FAQ.tsx`, modale booking `Contact.tsx` | 4.1.2 | Majeur |
| A9 | Zones cliquables potentiellement < 44px (boutons compacts, icônes) | admin, carrousels | 2.5.5 | Mineur |
| A10 | Ordre de focus non vérifié sur overlays (SearchOverlay) | `SearchOverlay.tsx` | 2.4.3 | Mineur |

### Compréhensible

| ID | Problème | Fichiers | Critère | Criticité |
|---|---|---|---|---|
| A11 | **Labels non liés** au contrôle (`htmlFor`/`id`) | `UserEditModal` (select rôle), `NewsletterForm:50` | 1.3.1 / 3.3.2 | Majeur |
| A12 | Messages d'erreur non associés au champ (`aria-describedby`) | `Contact.tsx:417+`, formulaires | 3.3.1 | Majeur |
| A13 | Validation front absente → feedback tardif | Contact, Newsletter | 3.3.1 | Mineur |

### Robuste

| ID | Problème | Fichiers | Critère | Criticité |
|---|---|---|---|---|
| A14 | **Tables sans `scope="col"`/`<th scope>`/`role`** | `AdminUsers.tsx:64-128`, autres tables admin | 1.3.1 / 4.1.2 | Majeur |
| A15 | Hiérarchie de titres à vérifier (sauts h1→h3) | pages longues (`About`, `Home`) | 1.3.1 | Mineur |
| A16 | Régions live non utilisées pour les toasts/maj dynamiques | `Toast.tsx`, accordéons | 4.1.3 | Mineur |

## 3. Synthèse de criticité

| Niveau | Count | Exemples |
|---|---|---|
| **Bloquant** | 2 | A5 (boutons icône sans nom), A6 (focus trap modales) |
| **Majeur** | 8 | A1, A2, A7, A8, A11, A12, A14 |
| **Mineur** | 6 | A3, A4, A9, A10, A13, A15, A16 |

## 4. Impact utilisateur

- **Lecteurs d'écran** : boutons icône « bouton » sans intitulé (A5), tables non navigables par en-têtes (A14), erreurs non annoncées (A12) → tâches admin et formulaires difficilement réalisables.
- **Navigation clavier** : modales sans piégeage de focus (A6), étoiles non focusables (A7) → blocages.
- **Basse vision / daltonisme** : statut par couleur seule (A1), contrastes faibles (A2).

## 5. Recommandations (priorisées)

| Priorité | Action | Critère | Effort |
|---|---|---|---|
| P1 | Ajouter `aria-label` à **tous** les boutons icône (helper `<IconButton label>`); fermer modales par Échap + retour focus | 4.1.2 / 2.4.3 | Faible-Moy. |
| P1 | Vérifier/installer un **focus trap** dans `Modal.tsx`/`Sheet.tsx` (ou `focus-trap-react`) | 2.1.2 | Moyen |
| P1 | Tables admin : `<th scope="col">`, `<caption>` ou `aria-label` sur `<table>` | 1.3.1 | Faible |
| P2 | Lier chaque label à son contrôle (`htmlFor`/`id`) ; `aria-describedby` pour les erreurs | 3.3.2 / 3.3.1 | Faible |
| P2 | Accordéons accessibles (`aria-expanded`, `aria-controls`, bouton focusable) | 4.1.2 | Faible |
| P2 | Notation étoiles : `role="radiogroup"` + navigation clavier | 2.1.1 | Moyen |
| P2 | Ne pas signaler un état par la couleur seule (icône/texte en complément) | 1.4.1 | Faible |
| P3 | Audit de contraste des tokens `neutral-400/500` ; ajuster si < 4.5:1 | 1.4.3 | Faible |
| P3 | `aria-live="polite"` pour les toasts ; vérifier la hiérarchie des titres | 4.1.3 / 1.3.1 | Faible |

## 6. Méthode de validation recommandée
- Passer **axe-core / Lighthouse** sur les écrans clés (Home, Login, FormationDetail, CoursePlayer, AdminUsers, ClubPage).
- Test **clavier seul** sur les parcours auth, achat, modales, formulaires.
- Test **lecteur d'écran** (VoiceOver/NVDA) sur les tables admin et la messagerie.
