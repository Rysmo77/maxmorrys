# Design system mobile — recommandations pour Rysmo

> Complément de [`AUDIT_UI_UX_MOBILE_COMPLET.md`](AUDIT_UI_UX_MOBILE_COMPLET.md), § 4 et § 11. Le kit `DS_Final/` reste la source de vérité du **rendu** ; ce document dit comment le **porter** de façon systématique dans `mobile/ds/`.

## 0. État des lieux chiffré

| Domaine | Mesure | Verdict |
|---|---|---|
| Couleurs | 225 jetons générés depuis le CSS, **0 hexadécimal dans `app/`** | ✅ exemplaire |
| Thème | clair / sombre réels, `ThemeScope`, `userInterfaceStyle: automatic` | ✅ |
| Mouvement | 4 durées et 2 courbes lues dans les jetons, pilote natif | ✅ (voir le fichier motion) |
| Typographie | **301** tailles en dur (23 valeurs), 4 lectures de jeton, 200 surcharges de `Body`, 48 tailles numériques de `Display`, **74 textes < 12 pt** | ❌ |
| Graisses iOS | Schibsted 500/600/700 → **400** (alias de famille, `ds/Fontes.ts:83-86`) | ❌ |
| Espacements | **743** marges en dur, 26 valeurs, 2 appels à `useSpace` | ❌ |
| Rayons | 21 valeurs littérales pour 6 jetons | ⚠️ |
| Ombres | jetons `sh*` en CSS sans convertisseur ; 1 ombre écrite à la main | ⚠️ |
| Surfaces | rgba en dur dans `Surface` (`:83-87`) qui divergent des jetons | ⚠️ |
| Composants manquants | feuille, confirmation, bandeau, liste virtualisée, haptique, indicateur de réflexion | ❌ |

## 1. Palette

**Conserver** les jetons générés (AD-8). **Ajouter** au générateur `ds:tokens` :

| Jeton | Rôle | Pourquoi |
|---|---|---|
| `meshFixe{Bleu,Violet,Orange,Teal,Corail}` | teintes **saturées fixes** des lobes du maillage, identiques en sombre | en sombre, les lobes prennent les pastels nuit à 0,9 et le texte posé dessus tombe à ~2,4:1 |
| `onViolet` | encre fixe sombre (`#0E1116`) sur `mmViolet` nuit | blanc sur #B98CFF = 2,54:1 (bulles « moi », avatars) |
| `danger` / `dangerInk` | ton de bouton destructif | aujourd'hui « Supprimer mon compte » est en encre neutre |
| `actionDigitaliseAccessible` | dégradé *digitalise* recalé (départ plus sombre que #02AC9C) | blanc sur #02AC9C = 2,84:1 |

**Règles** :
- `textFaint` / `ink3` ne portent **jamais** de texte (AD-18) — à garder par une règle de lint ou un test.
- Toute bordure d'affordance (pilule inactive, champ) ≥ 3:1 contre son fond (WCAG 1.4.11) : `ctlOffBrd` clair est à ≈ 1:1, remplacer par `borderHair` / `fill3`.

## 2. Typographie

### 2.1 Échelle (13 rôles)

| Rôle | Taille / interligne | Famille et graisse | Plafond police système |
|---|---|---|---|
| `display-xl` | 41 / 0,92 | Fraunces 900, capitales | 1,3 |
| `display-l` | 30 / 0,95 | Fraunces 900 | 1,3 |
| `display-m` (titre d'écran) | **28** / 0,98 | Fraunces 900 | 1,3 |
| `display-s` (minimum) | 23 / 1,02 | Fraunces 900 | 1,3 |
| `title` | 19 / 1,2 | Schibsted 600 | 1,5 |
| `headline` | 16 / 1,3 | Schibsted 600 | 1,6 |
| `body` | 15 / 1,45 | Schibsted 400 | 2,0 |
| `prose` (leçon) | 15,5 / 1,68 | Schibsted 400 | 2,0 |
| `callout` | 14 / 1,45 | Schibsted 400/600 | 2,0 |
| `meta` | 13 / 1,4 | Schibsted 400 | 1,8 |
| `caption` | 12,5 / 1,4 | Schibsted 400 | 1,8 |
| `small` (plancher du texte) | 11,5 / 1,35 | Schibsted 500 | 1,6 |
| `eyebrow` | 10,5, capitales, +0,14 em | JetBrains 400 | 1,4 |
| `num` | hérite du rôle | JetBrains 700, chiffres tabulaires | — |

**Disparaissent** : 9,5 · 10 · 11 · 12 · 13,5 · 14,5 et tout `Display` < 22. Les 26–31 se ramènent à `display-m` (28).

### 2.2 Primitive `<Texte>`

```tsx
<Texte variant="body" tone="muted" weight="600" numberOfLines={2} header>…</Texte>
```
- `variant` : un des 13 rôles (taille, interligne, famille, plafond).
- `tone` : `body | muted | link | ok | warn | stop | onArt | onViolet` — jamais `faint`.
- `weight` : résolu en **nom de famille par graisse et par plateforme** (iOS : `SchibstedGrotesk-SemiBold`, etc.) → corrige le retour au 400 et permet de supprimer `useFonts` (≈ 850 Ko rechargés au démarrage pour rien).
- `header` : pose `accessibilityRole="header"`.
- `Display` devient `<Texte variant="display-*">` avec ses lignes, **un seul** élément accessible (`accessibilityLabel={lignes.join(' ')}`, rôle `header`), et le `style` posé sur le bloc, pas sur chaque ligne.

### 2.3 Migration
Script de codemod : `fontSize: 12.5` → `variant="caption"`, etc. ; les valeurs orphelines vers le rôle le plus proche ; revue visuelle écran par écran. Garde de CI : 0 `fontSize:` numérique dans `app/` (exceptions nommées).

## 3. Espacements et grille

| Échelle | 2 · 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 |
|---|---|
| Sémantique | `inline` 8 · `group` 12 · `block` 16 · `section` 24 · `screen-top` 24 |
| Gouttière | 18 dp — **exception de marque**, lue depuis `gutterScreen` (aujourd'hui `18` en dur dans `Screen`) |
| Colonne | max **600 dp**, centrée au-delà (tablettes Android) |

**Primitives** :
```tsx
<Pile gap="block">…</Pile>           // vertical
<Rangee gap="inline" align="center" wrap>…</Rangee>
<Section eyebrow="Le programme" titre="…">…</Section>
```
Elles remplacent les 743 `marginTop`/`padding` libres. Les valeurs 6, 7, 9, 10, 11, 13, 14, 15, 17, 19, 22 disparaissent.

## 4. Rayons

| Jeton | Valeur | Usage |
|---|---:|---|
| `xs` | 6 | barres, pastilles |
| `s` | 10 | tuiles d'icône, puces carrées |
| `m` | 16 | champs, options, ligne courante |
| `l` | 24 | cartes |
| `xl` | 30 | héros |
| `pill` | 999 | boutons, pilules |

Règle d'imbrication : **rayon intérieur = rayon extérieur − rembourrage**.

## 5. Élévations

Générées par `ds:tokens` depuis les jetons `sh*` (flou CSS ÷ 2 = rayon React Native).

| Niveau | Usage | iOS | Android |
|---|---|---|---|
| `e0` | cartes de verre | aucune | aucune |
| `e1` | chrome (barre, onglets) | filet 1 px | `elevation 3` |
| `e2` | flottant (FAB, mini-lecteur) | y 8, rayon 12, 0,2, teinte du territoire | `elevation 6` |
| `e3` | feuille | y −6, rayon 24, 0,2 | `elevation 12` + voile 30 % |

## 6. Composants

### 6.1 À corriger

| Composant | Correctifs |
|---|---|
| `Button` | `sm` à 44 pt de cible (dessin 42 + `hitSlop`) ; ton `danger` ; prop `confirmation` (« Copié », « Place réservée ») avec retour à 1,4 s ; `numberOfLines` + `adjustsFontSizeToFit` décidés |
| `Field` v2 | `forwardRef` ; `autoComplete` ; `textContentType` (`username`, `newPassword`, `oneTimeCode`) ; `autoCorrect` ; `autoCapitalize="characters"` ; `returnKeyType` + `onSubmitEditing` (chaînage) ; `autoFocus` ; état de focus visible (`focusRing`, 220 ms) ; erreur en région vivante ; aide neutre distincte de l'erreur |
| `Switch` | cible 44 (`hitSlop`) ; fond actif en **dégradé** du kit ; ligne entière pressable quand il est dans une `LessonRow` |
| `ChipRow` v2 | hauteur 44 ; indicateur qui **glisse** (`translateX` 220 ms) ; `scrollTo` vers l'actif ; prop `bleed` (débord jusqu'au bord) ; prop `icon` (cadenas) ; rôles `tablist`/`tab` ; libellé lu une fois |
| `Segmented` v2 | pastille en `translateX` 220 ms ; 44 pt ; `numberOfLines={1}` ; `tablist` |
| `Skeleton` | pulsation **partagée** (une valeur animée par groupe) ; `SkeletonGroup label="Chargement de ton espace"` (une annonce) ; rayon par jeton |
| `ChatBubble` | locuteur dans le libellé ; `selectable` ; appui long « Copier » ; rendu Markdown ; `typing` remplacé par `IndicateurDeReflexion` |
| `QuotaMeter` | barre continue au-delà de 10 ; segment « réservé » à l'envoi |
| `LessonRow` | état exposé (`fait`, `en cours`, `à faire`) ; méta en Schibsted (mono réservé aux nombres) ; icône `check` prioritaire sur `play` |
| `Num` | prop `afficherReleve` (« relevé le 05/10 ») ; libellé vocal (« 95 000 francs ») |
| `Surface` | lire `surfaceCard` / `surfaceCardFlat` au lieu des rgba en dur |
| `Avatar` | décoratif quand le nom est rendu à côté ; initiales ≥ 12 pt |
| `PayOption` | rôle `radio` + état `checked` ; bordure et radio en 220 ms simultanés |
| `Icon` | erreur en développement si le nom est inconnu (pas de repli silencieux sur `check`) |
| Barre d'onglets | libellés Schibsted 600 11,5 ; teinte active du territoire (220 ms, deux icônes superposées) ; pilule M3 sur Android ; position absolue si le flou est voulu, sinon retirer le rembourrage `tabbar` en double |

### 6.2 À créer (API proposée)

| Composant | API | Remplace / apporte |
|---|---|---|
| `Feuille` | `<Feuille visible onClose titre detents={['auto','large']} voile>` — via `presentation: 'formSheet'` d'expo-router, sinon `Modal` animé (300 ms, voile 30 %, poignée, geste de fermeture, `accessibilityViewIsModal`, clavier) | publier, signaler, agenda, filtres, saisie de note |
| `Confirmer` | `<Confirmer titre corps action="Supprimer" destructif onConfirm>` (feuille) | les `Alert` de confirmation hors système |
| `Bandeau` | `<Bandeau tone="info|ok|warn|stop" action onClose vivant>` (région vivante polie) | ~22 `Alert` de succès/erreur |
| `useConfirmation` | `const { confirme, etat } = useConfirmation(1400)` | « Copié », « Débloqué », « Place réservée » |
| `haptique` | `.selection()`, `.leger()`, `.succes()`, `.erreur()`, `.attention()` ; sans effet si désactivé ou « réduire » ; `expo-haptics` | retour tactile absent |
| `IndicateurDeReflexion` | `<IndicateurDeReflexion actif nom />` (3 barres, voir le fichier motion § 7) | attente IA muette |
| `Liste` | `<Liste data renderItem cascade={6} onRefresh refreshing vide={…} etat>` (FlatList, `RefreshControl` à la teinte du territoire, `Revele` sur les premiers éléments) | 0 FlatList, 0 rafraîchissement |
| `Discussion` | FlatList inversée, défilement automatique, annonces | répétiteur |
| `Colonne` | largeur max 600 dp centrée | tablettes Android |
| `ReadingBar`, `SearchPill`, `TranslationNotice` | d'après `handoff_natif/COMPOSANTS.md` | manques du catalogue |

### 6.3 À ne pas créer
- **`Toast`** : interdit par le kit (« une notification flottante apparaît là où la personne ne regarde pas »). Utiliser `useConfirmation` (sur place) ou `Bandeau` (en ligne).

## 7. États standard (contrat)

Chaque écran de données passe **toujours** son état à `SansDonnees` :

| Phase | Rendu | Interdit |
|---|---|---|
| `restauration` / `charge` | squelette à la forme du contenu | un titre qui affirme une absence (« N'EST PAS ARRIVÉ ») |
| `panne` | motif + ce qui est gardé + « Réessayer » | « 0 … », « vide », « le filtre marche » |
| `vide` (servi, daté) | phrase utile + une action | — |
| `vide && ferme` | corps verrouillé (Club) | « réservé aux membres » pendant un chargement |
| `anonyme` | « Connecte-toi pour… » | — |
| `servie` | contenu ; `Num` peut s'afficher | — |

Garde de CI proposée : tout `SansDonnees` dans `app/` reçoit `etat=` (exceptions nommées).

## 8. Règles responsive

1. Pas de `height` fixe sur un conteneur de texte : `minHeight`.
2. Plafond de police système par rôle (`maxFontSizeMultiplier`).
3. Toute ligne unique décide explicitement : `numberOfLines` + réduction, ou repli sur deux lignes.
4. Tester à 320, 360, 390, 412, 430, 480 dp × police 100 / 130 / 200 %.
5. `Screen` gère le clavier (`automaticallyAdjustKeyboardInsets` ou `react-native-keyboard-controller`) ; tester en bord-à-bord Android SDK 57.
6. Colonne max 600 dp ; exclure les tablettes Android du Play Store tant qu'elles ne sont pas traitées.
7. Paysage déverrouillé pour le seul lecteur vidéo (`expo-screen-orientation`).

## 9. Gouvernance

- **Une source** : le CSS du kit → `ds:tokens` → jetons natifs (AD-8). Ajouter élévations, rôles typographiques et teintes fixes au générateur.
- **Des gardes, pas des conventions** : tests de CI sur `fontSize` numérique, `textFaint` en texte, `SansDonnees` sans `etat`, animations hors pilote natif (existe), `Alert.alert` de succès.
- **La planche d'atelier** (`app/apercu.tsx`) sert de catalogue vivant ; y ajouter `/acces` et les nouveaux composants.
