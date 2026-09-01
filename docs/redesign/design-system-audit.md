# Audit du design system — Max-Morrys

**Phase 0 de la refonte. État mesuré du DS, aucune modification.**
_1er septembre 2026 · commit `a435bdb`._

---

## 1. Verdict

**Le design system n'est pas à construire. Il existe, il est porté, il est sous garde CI.**

C'est le constat qui doit réorienter la Phase 2 du brief de mission. Ce dépôt n'a pas le
problème habituel — « 47 nuances de bleu, aucun jeton ». Il a **l'inverse** : un système
rigoureux, documenté ligne à ligne, dont il manque **six composants** que l'application
réclame quotidiennement.

| | Attendu par le brief | Réalité mesurée |
|---|---|---|
| Jetons | À créer | **9 fichiers de jetons + 8 fichiers de marque**, copie littérale du kit |
| Primitives | À créer | **39 en React**, 26 en React Native |
| Adoption | 0 | **133 fichiers sur 184 (72 %)** |
| Garde automatique | À mettre en place | **`ds:check` en CI, 0 constat** |
| Palettes concurrentes | 47 échelles | **0** — vérifié sur 10 préfixes |

---

## 2. La couche de jetons

`src/design-system/css/styles.css` n'est qu'un point d'entrée d'`@import` et atteint
17 fichiers. Tout est copie littérale de
`Max-Morrys_DS_Platform/design_handoff_maxmorrys/css`, régénérable par `npm run ds:sync`.

| Couche | Fichiers | Contenu |
|---|---|---|
| `tokens/` | 9 | couleurs, sombre, fontes, verre, mouvement, rayons, sémantique, espacement, typographie |
| `brand/` | 8 | base, points de rupture, repli, interactions, maillage, mouvement, états, surfaces |
| `overrides/` | 6 | écarts délibérés, numérotés `ad-06` à `ad-23` |

### Ce que la configuration Tailwind fait remarquablement bien

`tailwind.config.js` **lit** les jetons, ne les redéfinit jamais : chaque couleur y est un
`var(--*)`. Trois décisions méritent d'être citées comme modèle :

1. **`neutral: undefined` et `teal: undefined`** — ces deux échelles sont dans la palette
   *par défaut* de Tailwind ; les retirer d'`extend` ne les retirerait de rien, et un
   `bg-neutral-400` oublié continuerait de rendre du gris **en silence**. Elles sont donc
   annulées explicitement, pour qu'un oubli **se voie**.
2. **L'échelle d'espacement du kit n'entre PAS dans l'espace de noms Tailwind.** Le
   commentaire explique pourquoi : Tailwind compte en rem (`p-4` = 16 px), le kit en pixels
   (`--sp-4` = 4 px). Partager la clé `4` aurait divisé par quatre 3 498 classes
   d'espacement, sans qu'aucun contrôle automatique ne le voie.
3. **Le thème est une portée CSS (`.dk`), pas une classe utilitaire.** Aucune classe
   `dark:` ne porte de couleur : les jetons basculent seuls.

C'est un niveau de discipline qu'on rencontre rarement. **La refonte doit s'appuyer dessus,
pas le remplacer.**

### La faille de la même famille, restée ouverte

Le raisonnement de la décision n°1 n'a pas été appliqué à `borderRadius`. `extend` **ajoute**
`s / m / l / xl / media / pill` mais **ne retire pas** l'échelle par défaut. Deux
conséquences :

**a. Collision silencieuse — ✅ CORRIGÉ le 01/09.** `rounded-s` est un utilitaire
directionnel Tailwind. La règle directionnelle était émise **après** et gagnait :
16 usages rendaient 4 px sur deux coins au lieu des 10 px du kit sur quatre.
*(`rounded-l` figurait à tort dans le constat initial — voir `audit-ux.md` §4.1.)*

Le jeton est renommé `s` → `xs`, le jeton `l` retiré de la table (il empêchait
`rounded-l-xl`), les 16 usages migrés. **Et la porte est posée** :
`tests/unit/tailwind-radius-collision.test.ts` compile la vraie configuration et échoue
si un jeton reprend un suffixe réservé — vérifié en réintroduisant le défaut.

**b. Deux échelles pour la même forme.**

| Écrit | Rend | Jeton équivalent |
|---|---|---|
| `rounded-full` × 82 | 9999 px | `rounded-pill` (999 px) × 24 |
| `rounded-2xl` × 30 | 16 px | = `rounded-m` |
| `rounded-3xl` × 2 | 24 px | = `rounded-l` |
| `rounded` × 35 | 4 px | **aucun** |
| `rounded-lg` × 21 | 8 px | **aucun** |
| `rounded-md` × 3 | 6 px | **aucun** |

24 variantes de rayon distinctes dans `src/`, pour **6 jetons** au kit.

---

## 3. ✅ Les six trous — comblés le 01/09

81 imports subsistaient vers `src/components/ui/`. **Le dossier n'existe plus.**

| Composant | Imports | Destination | Ce que le portage a corrigé |
|---|---|---|---|
| **Toast** | 30 | `ds/surfaces` | texte à **1,5:1** — `color-mix(…30%, transparent)` copié depuis le voile de fond |
| **ConfirmDialog** | 16 | `ds/surfaces` | bouton destructif à **2,28:1** en mode sombre ; survol sans effet |
| **Pagination** | 12 | `ds/navigation` | `dark:` de couleur (AD-3), rayon de 30 px sur une case de 36, `text-white` |
| **Modal** | 7 | `ds/surfaces` | `id="modal-title"` **en dur** — deux modales = deux `id` identiques |
| **ImageInput** | 5 | `components/forms` | dépend de `lib/storage` → composant d'application |
| **RichEditor** | 2 | `components/forms` | dépend de `lib/markdown` → composant d'application |

**Deux des six n'avaient rien à faire dans le design system**, et c'est le portage qui
l'a montré : `ImageInput` appelle le service de dépôt de médias, `RichEditor` la
bibliothèque markdown maison. Les mettre dans le kit aurait inversé la dépendance et
rendu le kit inutilisable hors de ce dépôt — le même raisonnement qui garde
`useDialogA11y` côté application. Ils sont relocalisés, pas portés.

Les neuf doublons ont suivi : `Badge`→`Tag`, `Button`→`Button`, `Card`→`GlassPanel`,
`Input`→`Field`, `Sheet`→`ds/surfaces`, `PhoneInput` et `NotificationDropdown` relocalisés.

### Ce que le portage a fait apparaître

**AD-24 — le kit n'a pas de ton d'action destructive.** Cinq fonds d'action, aucun qui
dise « ce bouton supprime ». L'écart passe par `overrides/`, avec des contrastes mesurés
(6,56:1 en clair, 8,28:1 en nuit) et **aucune couleur inventée** : ce sont les teintes
d'état du kit, avec le rôle qui manquait.

**Le design system ne connaît pas i18next, et ne doit pas.** Les composants hérités
lisaient leurs libellés dans `t('ui.…')` ; 35 appels s'y fiaient. `components/dialogs/`
est une couche d'adaptation de trente lignes qui les injecte. Le kit reste portable —
c'est ce qui permet à `mobile/ds` d'en partager les jetons.

## 4. Couverture face à la liste de la Phase 2 du brief

| Catégorie | Couvert | Manquant |
|---|---|---|
| Primitifs | Button, IconButton, PillButton, Field, Switch, Segmented, ChipRow, Tag, Avatar, Icon, Skeleton, ProgressBar, StepDots | Select/Combobox, Checkbox, Radio, Slider, **Tooltip**, Popover, Divider |
| Composés | GlassPanel, TerritoryCard, TruthPanel, EmptyState, Mesh | **Modal**, Drawer, **Toast**, Alert/Banner, Dropdown, Tabs, Accordion, **Palette de commandes**, page 500 |
| Mise en page | Mesh, GlassPanel | Container, Stack, Split, Grid |
| Navigation | TopBar, SideNav, SubNav, TabBar, Breadcrumb, SearchPill, Pipeline, ReadingBar | **Pagination** |
| Données | StatTile, Num, PriceBlock, QuotaMeter, MediaCard, LessonRow, DocLine, CheckLine, ChatBubble | **Table**, DataGrid, Timeline, graphiques |
| Formulaires | Field, PayOption | **RichEditor**, **ImageInput**, sélecteur de date, dépôt de fichier |

**`Num` mérite d'être signalé.** Ce n'est pas un composant de style : il déclare **d'où vient
un nombre** (`source: 'db'`, avec date de relevé). C'est une primitive de véracité, pas de
présentation — un actif original du système, qui a déjà empêché les CGV d'annoncer un tarif
que le code ne pratiquait plus. **À préserver et à étendre**, pas à normaliser.

---

## 5. Parité web ↔ mobile

| | Nombre |
|---|---|
| Communs aux deux | **23** |
| Web uniquement | 16 |
| Mobile uniquement | 3 |

**La divergence est en grande partie justifiée**, et c'est une bonne nouvelle :

- **Web uniquement** : `TopBar`, `TabBar`, `SideNav`, `SubNav`, `Breadcrumb`, `SearchPill`,
  `ReadingBar`, `Pipeline` — du chrome de navigation, qui *doit* différer par plateforme.
  Restent de vrais écarts : `GlassPanel`, `IconButton`, `PillButton`, `MediaCard`,
  `LogoMark`, `Wordmark`, `TranslationNotice`, `TruthPanel`.
- **Mobile uniquement** : `Surface`, `Type`, `theme` — React Native n'a pas de cascade CSS,
  ces primitives explicites sont la bonne pratique, pas une dérive.

**Le vrai défaut mobile n'est pas la parité des composants, c'est l'absence de
différenciation de plateforme** : `Platform.OS` et `Platform.select` sont utilisés
**0 fois**, le retour haptique **0 fois**. Voir `user-journeys.md` §6.

---

## 6. Machinerie d'adhérence

| Outil | État |
|---|---|
| `npm run ds:sync` | ✅ Source présente (`Max-Morrys_DS_Platform/design_handoff_maxmorrys/css`) |
| `npm run ds:tokens` | Génère `tokens.generated.ts` (partagé avec `mobile/`) |
| `npm run ds:barrel` | Génère l'index `@ds` |
| `npm run ds:check` | ✅ **« les six règles tiennent. 0 constat. »**, sortie 0 |
| Étape CI | ✅ Ajoutée dans `.github/workflows/ci.yml` |
| Ignore ESLint | ✅ `Max-Morrys_DS_Platform` |

⚠️ **La note projet qui donne `ds:sync` et `ds:check` pour cassés par le renommage du
dossier est périmée.** Le renommage a bien eu lieu, et le correctif aussi.

**Le point aveugle de cette machinerie** : `ds:check` valide les six règles et la copie
littérale du kit. Il ne compare pas les jetons à ce que **Tailwind génère réellement** —
c'est exactement l'angle mort par lequel la collision `rounded-s` passe, avec 0 constat.

---

## 7. Benchmark — état honnête

> ⚠️ **Non réalisé sur le terrain.** Le réseau sortant est bloqué dans cet environnement ;
> je n'ai pas visité les produits concurrents. Ce qui suit est un repère de motifs, pas une
> observation. **À rejouer avant toute décision de direction artistique.**

Repères à observer, choisis pour leur pertinence sur ce produit précis :

| Référence | Ce qu'il faut aller y mesurer |
|---|---|
| **Linear** | Palette de commandes et vitesse perçue — le manque n°1 de la surface admin |
| **Stripe Dashboard** | Table et DataGrid — deux trous du DS, sur la surface qui en a le plus besoin |
| **Circle / Skool** | Profondeur de navigation d'une communauté — le Club est à 3 niveaux |
| **Systeme.io** | Concurrent direct sur l'espace francophone formation + tunnel de vente |
| Plateformes edtech africaines | **Le vrai repère** : contrainte de forfait et de terminal, que les références occidentales n'ont pas |

**La dernière ligne est la plus importante et la moins documentée.** Aucune des références
de qualité citées par le brief — Linear, Vercel, Arc, Cash App — ne conçoit sous un budget
de 900 Ko toutes fontes comprises, pour un terminal à `deviceMemory ≤ 2`. **Copier leurs
motifs de motion et de verre, c'est importer leurs hypothèses matérielles.** Le fond animé
de ce projet est en CSS pur, à 0 octet, là où une vidéo coûterait 2 à 6 Mo : c'est cette
discipline-là qui est la vraie signature du système, et elle n'a pas d'équivalent dans le
panel de références.

---

## 8. Ce que la Phase 2 doit devenir

Le brief prévoit « construire le design system complet AVANT de toucher aux écrans ». Il est
construit. La Phase 2 se réduit donc à :

| # | Action | État |
|---|---|---|
| 1 | Fermer la collision de rayons | ✅ `a03e3f2` — `s`→`xs`, `l`→`card`, garde posée |
| 2 | Les 6 composants manquants | ✅ 4 portés au DS, 2 relocalisés (dépendances d'application) |
| 3 | Migrer les 9 doublons | ✅ `components/ui/` n'existe plus |
| 4 | Supprimer les 3 fichiers morts | ✅ `a03e3f2` |
| 5 | `Table`, `Tooltip`, page 500 | page 500 ✅ `81840b6` · palette de commandes **existait déjà** · `Table`/`Tooltip` restent |
| 6 | Étendre `ds:check` au CSS **généré** | ✅ par test — `tailwind-radius-collision`, `focus-ring`, `first-view-graph` |
| 7 | Annuler le reste de la palette Tailwind | ✅ `a03e3f2` — 22 échelles |

**Aucune de ces sept actions ne demande une nouvelle direction artistique.** C'est le
constat central de la Phase 0, et il rend la Phase 1 du brief — proposer 2-3 moodboards —
sans objet dans son état actuel : la direction est prise, mesurée et livrée. La question
qui reste ouverte est de savoir si vous voulez la **tenir** ou la **rouvrir**.
