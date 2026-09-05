---
title: 'Composants du design system en natif — Compose (Android) puis SwiftUI (iOS)'
type: 'spec'
created: '2026-09-05'
status: 'draft'
autorite: 'DS_Final/ (le kit) > src/design-system/css/{tokens,overrides} (les jetons) > port RN supprimé (commit 9c22076)'
---

# Spécification des composants — Compose et SwiftUI

Ce document dit **quoi construire**, avec **les valeurs mesurées dans le kit**, pour la
réécriture de l'application Rysmo en Kotlin/Compose puis en Swift/SwiftUI.

Il ne remplace pas le kit : il le **traduit**. Chaque valeur citée porte son fichier et sa
ligne. Là où deux sources se contredisent, la contradiction est écrite, et **le kit tranche**.

---

## 0 · Comment lire ce document

### 0.1 L'ordre d'autorité, appliqué à la lettre

| Rang | Source | Ce qu'elle décide |
|---|---|---|
| 1 | `DS_Final/` — le kit | **Le rendu.** Géométrie, recettes de surface, hauteurs de chrome, ordre des éléments. |
| 2 | `src/design-system/css/tokens/` + `css/overrides/` | **Les valeurs de jeton.** C'est ce que `scripts/ds-tokens.mjs` lit et émet. |
| 3 | `git show 9c22076:mobile/ds/*` — le port React Native supprimé | **Les décisions déjà payées.** ~2 672 lignes, 44 fichiers, 41 composants. On en garde les raisonnements, jamais les valeurs, sauf preuve. |

Les documents d'audit du dépôt n'ont **aucune** autorité ici : chaque constat de ce fichier a
été rejoué contre le code.

### 0.2 Ce qui est déjà en place au moment où ce document est écrit

Un chantier parallèle a déjà branché l'émetteur Kotlin (`scripts/ds-emit-kotlin.mjs`, appelé
par `scripts/ds-tokens.mjs:15,166-179`). Il produit :

- `android/app/src/main/java/me/maxmorrys/rysmo/ds/Jetons.generated.kt`
  — `data class Palette` (**132 jetons dépendants du mode**), `PALETTE_CLAIRE`,
  `PALETTE_SOMBRE`, `object Metrique` (**93 jetons communs**) ;
- `android/app/src/main/res/values/couleurs.generated.xml` et `values-night/…`
  — les couleurs pures, pour le thème de fenêtre peint **avant** que Compose n'existe.

Total : **225 jetons**, dont **100 divergent** en mode sombre. Vérifié par lecture de
`src/design-system/tokens.generated.ts` (deux tables de 225 clés, 100 valeurs différentes).

⛔ **Trois types Kotlin sont RÉFÉRENCÉS par le fichier généré et n'existent nulle part** :
`Degrade`, `Ombre`, `Bordure`. Le projet Android ne compile pas tant qu'ils ne sont pas
écrits à la main. Leur définition exacte est en **§ D.1**.

---

## A · Inventaire des composants

### A.0 Le compte, et d'où il vient

Le kit publie **37 composants** (`DS_Final/components/**/*.jsx`, comptés : actions 3,
brand 3, data 12, forms 6, navigation 8, surfaces 5).

Les 36 écrans natifs du kit (`DS_Final/ui_kits/native/Screens*.js`, ligne 1 de chaque
fichier) n'en consomment que **30**. Les 7 restants — `LogoMark`, `TranslationNotice`,
`Breadcrumb`, `ReadingBar`, `SearchPill`, `SideNav`, `TopBar` — sont des surfaces web ou
desktop.

Le châssis natif (`DS_Final/ui_kits/native/NativeShell.js`) ajoute ce que le kit web n'a
pas : l'écran, les deux barres hautes, les barres système, les titres natifs. Les écrans
natifs ajoutent trois surfaces locales : le **bouton flottant**
(`ScreensNatifApp.js:286-295`, `ScreensNatifClub.js:50-58`), le **mini-lecteur**
(`ScreensNatifMedia.js:23-52`) et la **bande du Club** (`NativeShell.js:223-231`).

**Total à construire en Compose : 45 composables** (+ 4 hors périmètre natif, listés en
A.10 pour mémoire).

| Famille | Composables | Compte |
|---|---|---|
| Fond et châssis | `Mesh`, `Screen`, `NavBar`, `TabBar`, `MiniPlayer`, `BandeClub` | 6 |
| Surfaces | `Surface`, `Gradient`, `TerritoryCard`, `Skeleton`, `EmptyState`, `SansDonnees` | 6 |
| Marque | `Icon`, `Wordmark`, `LogoMark`, `GoogleMark`, `AppleMark` | 5 |
| Typographie | `Display`, `Body`, `Eyebrow`, `Num` | 4 |
| Actions | `Button`, `IconButton`, `PillButton`, `Fab` | 4 |
| Formulaires | `Field`, `Switch`, `Segmented`, `ChipRow`, `PayOption`, `StepDots` | 6 |
| Données | `Tag`, `LessonRow`, `ProgressBar`, `QuotaMeter`, `Avatar`, `ChatBubble`, `CheckLine`, `DocLine`, `PriceBlock`, `StatTile`, `MediaCard` | 11 |
| Navigation secondaire | `SubNav`, `Pipeline`, `Breadcrumb` | 3 |
| **Total** | | **45** |

### A.1 Conventions valables pour les 45

1. **Aucun composable ne prend de paramètre de thème.** Le mode est une portée
   (`CompositionLocal`), jamais une prop. `DS_Final/readme.md:191-197` : « une prop `dark`
   est un piège — elle doit être passée à la main partout, personne ne le fait, et le
   composant retombe silencieusement sur sa valeur claire ».
2. **Aucune couleur littérale**, sauf les trois exceptions nommées (`inkFixed`,
   `paperFixed`, et les marques tierces — § A.6).
3. **L'appui est le retour principal, et il y en a toujours un.**
   `scale(0.975)` sur un bouton (`pressScale`), `scale(0.94)` sur une pilule ou un rond
   (`pressScaleSm`), en `tTap` = 120 ms, courbe `ease`. Sur Android, l'ondulation
   (`indication = ripple`) s'ajoute, teintée de **l'encre du bouton** : une onde grise sur
   un fond de marque se lit comme une salissure (`9c22076:mobile/ds/Button.tsx:110-116`).
4. **Un contrôle désactivé n'a aucun retour au toucher** — ni `scale`, ni ondulation
   (`DS_Final/brand/interactions.css:7`, et `9c22076:mobile/ds/Switch.tsx:8-13`).
5. **`Modifier.blur` est interdit par défaut.** Voir § B.3.
6. **Tout composable qui n'a pas de texte porte un `contentDescription`**, et tout
   composable éteint porte l'état désactivé dans sa sémantique — pas seulement dans son
   opacité.

### A.2 Fond et châssis

| Composable | Rôle | Paramètres | Variantes / états | Dimensions | Jetons |
|---|---|---|---|---|---|
| **`Mesh`** | Le fond de toute l'application. | `territory`, `taille` | 5 territoires (`forme`, `informe`, `transforme`, `digitalise`, `nuit`), figé | lobes 340 dp (iOS) / 460 dp (Android) | § B.1 |
| **`Screen`** | Le châssis : maillage, zone sûre, barre haute, corps défilant, calque flottant. | `territory`, `dark`, `retour`, `onRetour`, `titre`, `droite`, `tabbar`, `center`, `scroll`, `gutter`, `overlay`, `content` | `dark` **ouvre une portée de thème**, pas une prop | gouttière 18 dp (`gutterScreen`) ; haut du corps 6 dp avec barre, 22 dp sans ; bas = `tabbarH`×`tabbar` + zone de geste + 24 dp | `gutterScreen`, `tabbarH`, `surfacePage`, `night` |
| **`NavBar`** | La barre haute. **Le seul endroit du produit où le contenu est écrit deux fois.** | `retour`, `onRetour`, `titre`, `droite` | iOS / Android | 44 dp / **64 dp** | § B.4 |
| **`TabBar`** | Barre d'onglets basse, 5 onglets. | `items`, `active`, `onSelect`, `safeBottom` | actif / inactif | **80 dp** (`tabbarH`), cible 48 dp, libellé 10 sp/600, écart glyphe-texte 3 dp, rembourrage `10 dp 8 dp 0` | `tabbarBg`, `tabbarBrd`, `tabbarHl`, `textBody` (actif) / `textFaint` (inactif), `glassBlurChrome` |
| **`MiniPlayer`** | Lecture audio persistante — **la surface que le web n'a pas**. | `titre`, `position`, `duree`, `enLecture`, `onPress`, `onToggle`, `tabbar` | en lecture / en pause | bas = `tabbarH` + zone de geste ; rembourrage 9 dp × 14 dp ; écart 11 dp ; pochette 38 dp r10 ; bouton 40 dp rond | `tabbarBg`, `tabbarBrd`, `actionPrimary`, `textOnPrimary`, `textBody`, `textMuted` |
| **`BandeClub`** | Les **huit** onglets du Club, en une seule bande défilante. | `actif`, `verrou` | verrouillé (cadenas sur les pilules inactives) | hauteur **44 dp** — plancher `touchAa`, parce que la bande **est** l'interaction de l'écran verrouillé | délègue à `ChipRow` |

⚠️ **`TabBar` : le `safeBottom` ne peut pas venir d'un rembourrage d'ancêtre.**
`DS_Final/components/navigation/TabBar.jsx:6-13` et `DS_Final/handoff_natif/README.md`
(§ « La barre d'onglets et la zone de geste ») : sans lui, l'indicateur d'accueil se dessine
par-dessus les onglets et **les 34 px inférieurs de chaque cible tombent dans la zone où
l'OS intercepte le glissement — la cible existe, le geste ne lui parvient pas.**
En Compose, la barre se pose en `Box(Modifier.align(Alignment.BottomCenter).padding(bottom = safeBottom))`,
et `safeBottom` vient de `WindowInsets.navigationBars`, jamais d'une constante.

⚠️ **La zone sûre se DEMANDE, elle ne se recopie pas.** Le kit code `47 / 34` et `24 / 24`
(`DS_Final/brand/native.css:11-15`) parce qu'il simule deux appareils dans un cadre fixe. En
Compose, c'est `WindowInsets.systemBars` / `.navigationBars`. Recopier 47 dp creuserait un
trou sur un appareil sans encoche (`9c22076:mobile/ds/Screen.tsx:19-21`).

⚠️ **`MiniPlayer` — le kit se contredit avec sa propre politique Android.**
`ScreensNatifMedia.js:29-30` pose `backdropFilter: blur(var(--glass-blur-chrome)) saturate(180%)`
**en style en ligne**, ce qu'aucune règle `.andro` ne peut retirer (elles visent
`.glass`, `.glass-hero`, `.glass-d`, `.truth` — `DS_Final/brand/native.css:37`). C'est
exactement le mode de panne que le kit documente lui-même pour `.mm-chrome`
(`DS_Final/components/navigation/TabBar.jsx:6-8` : « un flou déclaré en style inline échappe
à `.lowfi` »). **Décision retenue : la politique gagne sur la maquette** — pas de flou sur
Android par défaut, le voile `tabbarBg` seul, et l'élévation Material pour détacher. C'est
aussi ce qu'avait tranché le port RN (`9c22076:mobile/ds/MiniPlayer.tsx:21-25`).

⚠️ **La saturation en ligne ne vaut pas le jeton.** `TabBar.jsx:19` et
`ScreensNatifMedia.js:29` écrivent `saturate(180%)`, alors que `--glass-sat` vaut **170 %**
(`DS_Final/tokens/glass.css:12`). Le jeton gagne : `Metrique.glassSat = 1.7f`.

### A.3 Surfaces

| Composable | Rôle | Paramètres | Variantes / états | Dimensions | Jetons |
|---|---|---|---|---|---|
| **`Surface`** | Les 6 niveaux de verre. | `level`, `content` | `chrome`, `hero`, `flat`, `night`, `ink`, `truth` | rayons : `truth` → `rM` 16 dp, `hero` → `rXl` 30 dp, le reste → `rL` 24 dp ; `truth` a un rembourrage propre de 15 dp | § B.3 |
| **`Gradient`** | Rend un dégradé du système derrière n'importe quel contenu. | `arrets`, `angleDeg` (défaut 135), `rayon` | — | — | § B.2 |
| **`TerritoryCard`** | **La signature du système** : quatre cartes qui reconstruisent le M du logo. | `territory`, `layout`, `first`, `meta`, `title`, `titleSize`, `big`, `bigLabel`, `onPress`, `content` | `territory` ∈ {forme, informe, transforme, digitalise, **rose**} ; `layout` ∈ {stack, grid, row, plain} | rembourrages : stack `24/20/36`, grid `24/20/28`, row `26/20/30`, plain `20` ; chevauchement **−14 dp** (`stackOverlap`) ; chevron haut 18 dp débordant de 1 dp à gauche et à droite, sommet à −16 dp ; poignée 34 × 4 dp r3 à −7 dp | fond `linear-gradient(150deg, g<territory>1 0%, g<territory>2 100%)` ; `borderGlass`, `cardInk`, `cardInk2`, `cardHl`, `cardSh`, `cardGrip`, `rL`, `fsTtl` 26 sp, `lsTtl` −0.032em |
| **`Skeleton`** | La forme du contenu avant le contenu. **Jamais un rond qui tourne.** | `largeur`, `hauteur` (défaut 16 dp), `rayon` (défaut `rS`) | miroitement en boucle 1,5 s linéaire | — | `linear-gradient(100deg, fill1 30%, fill3 48%, fill1 62%)`, largeur de brosse 280 % |
| **`EmptyState`** | Un écran vide est une invitation à agir. | `glyph`, `glyphBackground`, `title`, `body`, `action` | — | carré de glyphe 64 dp r22 ; rembourrage 34 × 20 dp ; titre Fraunces 900 22 sp ls −0.03em lh 1.1 ; corps 13,5 sp lh 1.5, largeur max **34 caractères** ; action à 18 dp | `fill1`, `textMuted` |
| **`SansDonnees`** | Le **vide honnête** de la production : ce qui manque, d'où ça viendra, et le dommage qu'une simulation causerait. | `quoi`, `origine`, `degat`, `action`, `etat`, `hauteur` | 6 phases (`Etat<T>`, § A.9) | squelette à `hauteur` lignes | délègue à `Surface(level = truth)` et `Skeleton` |

**Le chevron de `TerritoryCard`** se découpe par un tracé, pas par une image
(`DS_Final/components/surfaces/TerritoryCard.jsx:22`) :
`polygon(0 100%, 22% 62%, 38% 18%, 50% 0, 62% 18%, 78% 62%, 100% 100%)`. En Compose, un
`Path` sur les mêmes fractions, peint avec **le même dégradé que la carte**, dessiné dans un
`Box` de 18 dp posé au-dessus de la carte (offset y = −16 dp), avec `clipToBounds = false`
sur le conteneur de la pile.

### A.4 Marque

| Composable | Rôle | Paramètres | Variantes / états | Dimensions | Jetons |
|---|---|---|---|---|---|
| **`Icon`** | **109 glyphes**, en données pures. | `name`, `size` (défaut 22 dp), `color`, `strokeWidth` | 2 glyphes pleins (`play`, `star`) ; les autres à trait | boîte 24 ; trait **2,2** par défaut, 2,4 (`search`, `lock`), 2,6 (`send`, `alert`), 3,4 (`check`), 2,0 pour les emprunts Lucide | encre courante par défaut |
| **`Wordmark`** | Le mot-symbole. | `brand`, `size` (défaut 22), `tail`, `night`, `short` | `rysmo` (l'application), `signature` (la personne) | Fraunces 900, ls **−0,045em** | `mmBleu`/`mmTeal` (rysmo) ; `mmBleu`/`mmOrange`/`mmTeal`/`mmViolet` (signature) ; variantes `…N` si `night` |
| **`LogoMark`** | L'icône de marque. **Un seul fichier existe, en PNG à fond blanc.** | `size`, `plate` | avec / sans pastille | pastille : rayon `round(size × 0.28)`, image à `round(size × 0.86)`, ombre `0 4 14 rgba(14,17,22,.12)` | `paperFixed` pour la pastille |
| **`GoogleMark`** | Le « G » officiel. | `size` (défaut 19) | — | 24 × 24 | **4 couleurs Google en dur, et c'est la règle** |
| **`AppleMark`** | ⚠️ **Emplacement réservé.** | `size` (défaut 19) | — | 24 × 24 | `paperFixed` |

⛔ **`Wordmark brand = "hello"` n'est PAS porté en natif.** Il repose sur
`background-clip: text` (`DS_Final/components/brand/Wordmark.jsx:24-31`), qui n'a pas
d'équivalent direct, et il ne sert qu'à la barre du **site**. Le natif n'a que `rysmo` et
`signature`, qui colorent lettre par lettre — ce que le kit fait déjà.

⛔ **Ne jamais confondre *Rysmo* (le nom de l'application) et le *Répétiteur* (l'IA qui vit
dedans).** Le second porte le nom que la personne lui a donné, lu dans les préférences,
jamais écrit en dur (`DS_Final/handoff_natif/COMPOSANTS.md`, § Wordmark ;
`9c22076:mobile/ds/tutor.ts`).

⛔ **Les marques tierces ne suivent pas le thème, et c'est la raison inverse de la règle
générale.** Une valeur figée est un défaut de mode sombre garanti **partout sauf ici** :
Google impose ses quatre couleurs, Apple impose son asset et son noir. Les faire basculer
serait un motif de rejet en revue, sur l'écran de connexion
(`9c22076:mobile/ds/BrandMarks.tsx:7-24`). La pomme dessinée dans le port RN **doit être
remplacée par l'asset officiel avant toute soumission**.

### A.5 Typographie

| Composable | Rôle | Paramètres | Dimensions | Jetons |
|---|---|---|---|---|
| **`Display`** | Titre d'affichage, Fraunces 900. **Jamais sous 22 sp.** | `size` (cran nommé **ou** nombre), `lines` **ou** `text` | crans : `xxl` 74, `xl` 64, `md` 41, `sm` 30, `xs` 23 ; interlettrage = **−0,035 × taille** ; interligne = **0,98 × taille** | `fsDsp*`, `lsDsp*`, `weightBlack`, `textBody` |
| **`Body`** | Corps, Schibsted Grotesk. | `muted`, `maxLines` | 15 sp / 1,45 ; chapô 14 sp / 1,5 en `textMuted` ; prose 15,5 sp / 1,68 bornée à **68 caractères** | `fsBody`, `lhBody`, `textBody`/`textMuted` |
| **`Eyebrow`** | Sourcil monospace, capitales. | — | 10,5 sp, interlettrage +0,14em | `fsEyebrow`, `lsEyebrow`, `textEyebrow` |
| **`Num`** | **Le seul chemin vers la monospace pour un chiffre.** | `value`, `source` (**obligatoire**), `asOf` (**obligatoire**), `unit`, `fallback`, `locale` | tabulaire, 700 ; prix 31 sp ; relevé 27 sp ; code de certificat 19 sp ls +0,06em | `fMono`, `textNum`, `lsNum` |

⛔ **La règle du monospace est une règle de contenu, et elle ne s'arrête pas à la frontière
de la plateforme.** « Un nombre en monospace vient de la base ou d'une source citée. Sinon
il ne s'affiche pas » (`DS_Final/design_handoff_maxmorrys/REGLES-DE-REVUE.md` § 6). D'où
`source` et `asOf` **obligatoires**. Et `value = null` ne rend **pas** un tiret : il rend le
repli, qui dit pourquoi la valeur manque — un tiret cache la différence entre « c'est zéro »
et « je ne sais pas », et cette différence **est** l'information
(`9c22076:mobile/ds/Num.tsx:8-17`).

⛔ **`Display` ne se replie jamais tout seul.** Les titres sont **écrits par langue**, ligne
par ligne : le français court ~18 % plus long, et un titre calé sur trois lignes en français
en fait deux en anglais — le bloc perd sa masse. D'où `lines: List<String>` rendu en
`Text(maxLines = 1)` par ligne (`9c22076:mobile/ds/Type.tsx:51-60`).

⚠️ **Les crochets des titres i18n sont porteurs.** `"AU [DIGITAL]."` : le fragment entre
crochets est celui que l'arc remplit au survol côté web. En natif il n'y a pas de survol —
mais **les retirer de la chaîne casse le web en silence**. Le natif doit les **enlever à
l'affichage**, jamais à la source.

### A.6 Actions

| Composable | Rôle | Paramètres | Variantes / états | Dimensions | Jetons |
|---|---|---|---|---|---|
| **`Button`** | L'action. | `tone`, `size`, `label`, `onPress`, `disabled`, `icon`, `trailing`, `leading`, `fullWidth` | 8 tons : `primary`, `forme`, `informe`, `transforme`, `digitalise`, `ghost`, `quiet`, `ink` · 2 tailles · repos / pressé / désactivé | `md` : hauteur min **54 dp** (`touchBtn`), rembourrage 22 dp, texte 15 sp/700 ; `sm` : **42 dp**, 17 dp, 13,5 sp/700 ; rayon `rPill` ; écart 8 dp ; glyphes 17/15 dp (tête) et 16/15 dp (queue) | § A.6.1 |
| **`IconButton`** | Le chrome rond de la barre haute. | `label` (**obligatoire**), `badge`, `onPress`, `disabled`, `content` | repos / pressé / désactivé (opacité 0,4) / pastille | **42 dp** (`touchMin`), rond ; glyphe 17–19 dp ; pastille 9 dp à `top 8 / end 9`, liseré 1,5 dp | `chromeBg`, `chromeBrd`, `chromeHl`, `textBody`, `mmOrange`, `surfacePage` |
| **`PillButton`** | La pilule d'encre du chrome — « MENU », et rien d'autre. | `label`, `onPress` | — | hauteur min **42 dp**, rembourrage 17 dp, 12 sp/700, interlettrage +0,08em, **capitales** | `pillBg`, `paperFixed`, `rPill` |
| **`Fab`** | Le bouton flottant. **La seule concession de forme du portage.** | `label`, `onPress`, `tabbar`, `territory`, `content` | — | **56 × 56 dp** ; rayon **28 dp sur iOS (rond), 18 dp sur Android (arrondi carré)** ; posé à `end 18 dp`, `bottom = tabbarH + zone de geste + 18 dp` | fond = dégradé d'action du territoire ; ombre `0 10 26 rgba(<teinte>, .38–.40)` |

#### A.6.1 La table des tons de `Button`, résolue

Source : `DS_Final/components/actions/Button.jsx:3-16`.

| Ton | Fond | Encre | Liseré | Ombre |
|---|---|---|---|---|
| `primary` | `actionPrimary` (aplat) | `textOnPrimary` | — | `shInk` `0 8 22 rgba(14,17,22,.24)` |
| `forme` | **dégradé** `actionForme` 135° `#0057BC → #6C23DD` | `paperFixed` | — | `shBleu` `0 8 24 rgba(0,87,188,.34)` |
| `informe` | **dégradé** `actionInforme` 135° `#F38B0A → #FF6E7F` | **`inkFixed` `#0E1116`** | — | `0 8 24 rgba(243,139,10,.32)` (⚠️ pas de jeton — § D.3) |
| `transforme` | **dégradé** `actionTransforme` 135° `#6C23DD → #0057BC` | `paperFixed` | — | `shViolet` `0 8 24 rgba(108,35,221,.34)` |
| `digitalise` | **dégradé** `actionDigitalise` 135° `#02AC9C → #0057BC` | `paperFixed` | — | `shTeal` `0 8 24 rgba(2,172,156,.32)` |
| `ghost` | `btnGhostBg` | `ink` | `btnGhostBrd` **1,5 dp** | — |
| `quiet` | `surfaceQuiet` | `ink` | `btnQuietBrd` **1 dp** | — |
| `ink` | `surfaceInk` (**invariant**) | `paperFixed` | — | — |
| *désactivé* | `btnOffBg` | `ink3` | — | — |

⛔ **`paperFixed`, et surtout pas `textOnPrimary`.** Les deux valent `#FFFFFF` en clair, ce
qui les rend interchangeables à l'œil — mais `textOnPrimary` **bascule en `#0B0E13`** en
mode sombre, parce que le ton `primary` inverse son fond. Les tons de territoire, eux,
gardent leur teinte saturée dans les deux modes : leur encre doit rester blanche
(`9c22076:mobile/ds/Button.tsx:60-70`).

⛔ **L'encre du ton orange est FIXE.** `inkFixed`, jamais `ink`, qui deviendrait blanc en
nuit et donnerait du blanc sur orange clair
(`DS_Final/components/actions/Button.jsx:6-7` ; `src/design-system/css/overrides/ad-06-etats.css:81-84`).

⛔ **La largeur suit la taille.** Un `md` remplit sa colonne (c'est l'action de l'écran), un
`sm` se dimensionne sur son texte (c'est une action de ligne). `fullWidth` ne sert qu'au cas
particulier — deux `sm` côte à côte, chacun à `weight(1f)`.

⚠️ **`Fab` : les deux appels du kit divergent sur leur position.**
`ScreensNatifApp.js:286` pose `right: 18px, bottom: NATIF[os].bottom + 96px` ;
`ScreensNatifClub.js:52` pose `right: 16px, bottom: calc(var(--tabbar-h) + 40px)`.
**Retenu : `end = 18.dp`, `bottom = tabbarH + navigationBars.bottom + 18.dp`** — la seule
formule qui tienne les deux réglages de navigation d'Android, et celle du port RN
(`9c22076:mobile/ds/Fab.tsx:33`). Le 96 px du premier appel est `24 + 80 − 8`, c'est-à-dire
la même intention écrite en constante.

⚠️ **`Fab` sur iOS n'existe pas dans le Club.** `FabClub` rend `null` si `os !== 'android'`
(`ScreensNatifClub.js:51`) : sur iOS, l'action « Publier » est dans la barre haute. Ce n'est
pas une variante de style, c'est **deux emplacements pour un geste**, et en poser deux
donnerait deux chemins pour la même action.

### A.7 Formulaires

| Composable | Rôle | Paramètres | Variantes / états | Dimensions | Jetons |
|---|---|---|---|---|---|
| **`Field`** | Champ de saisie, étiquette et aide. | `label`, `value`, `onValueChange`, `placeholder`, `hint`, `error`, `multiline`, `keyboardType`, `textContentType`, `secureTextEntry`, `autoCapitalize`, `trailing` | **3 états seulement** : repos, focus, erreur | hauteur min **54 dp** (96 dp en `multiline`) ; rembourrage 16 dp (14/16/0 en multiline) ; rayon `rM` 16 dp ; liseré **1,5 dp** ; étiquette 12,5 sp/600 à 6 dp ; aide 11,5 sp à 6 dp ; marge haute 14 dp | `fieldBg`, `borderField`, `fieldHl`, `textBody`/`textFaint`, `mmBleu` + `focusRing` (focus), `stop` + `errorRing` (erreur) |
| **`Switch`** | Interrupteur. **L'état désactivé est porteur de sens.** | `on`, `disabled`, `onPress`, `label` | actif / inactif / désactivé (opacité 0,4, **aucun retour**) | **48 × 29 dp**, rayon 16 dp ; curseur **23 dp** rond à `top 3 / start 3`, course **19 dp** ; ombre du curseur `0 2 6 rgba(14,17,22,.24)` | fond actif = **dégradé `actionForme`** ; inactif `fill4` ; curseur `paperFixed` |
| **`Segmented`** | 2 à 3 options courtes. Au-delà, `ChipRow`. | `options`, `value`, `onChange` | sélectionné / non | rembourrage 4 dp, écart 4 dp, segment 9 dp vertical, 13 sp/600, rayon `rPill` | piste `surfaceQuiet` ; actif `segOnBg` + `segOnSh` + `ink` ; inactif `textMuted` |
| **`ChipRow`** | Rangée de filtres en pilules. | `options`, `value`, `onChange`, `height`, `layout`, `icon` | `clip` / `scroll` / `wrap` ; actif = **encre pleine** | hauteur **40 dp** par défaut, **36 dp** dans un lecteur, **44 dp** quand la rangée est l'interaction principale ; écart **`touchGap` 8 dp, non paramétrable** ; rembourrage 16 dp ; 13 sp (600 actif / 500 inactif) ; rayon `rPill` | actif `ink` + `textOnPrimary` ; inactif `ctlOffBg` + `ctlOffBrd` + `textMuted` |
| **`PayOption`** | Ligne de choix exclusif à radio. | `logo`, `logoBackground`, `title`, `note`, `on`, `onPress` | sélectionné / non | hauteur min **68 dp** ; rembourrage 15 dp ; écart 13 dp ; rayon `rM` ; liseré 1,5 dp ; logo 44 dp r13 ; pastille radio **22 dp**, liseré **2 dp au repos → 7 dp sélectionné** | `ctlOffBg`, `ctlOffBrd`/`ctlSelBrd`, `ctlSelRing`, `ctlRadioBrd`, `ink` |
| **`StepDots`** | Avancement d'un tunnel court. | `total` (3), `current` (1) | — | barres à poids égal, **4 dp** de haut, r3, écart 5 dp | `ink` (franchi) / `fill3` |

⛔ **L'épaisseur du liseré radio ne s'anime pas.** Le kit transitionne `border-width`
(`DS_Final/components/forms/PayOption.jsx:20`), mais `border-width` est une propriété de
**mise en page** : elle déclenche un calcul de disposition à chaque changement d'état, sur
une pastille qui vit par trois ou par cinq. Le passage 2 → 7 dp reste **instantané** ; seule
la **couleur** s'interpole (`src/design-system/css/overrides/ad-21-radio-epaisseur.css:29`).
Le dessin final est identique au kit.

⛔ **`icon` ne s'affiche que sur les pilules INACTIVES de `ChipRow`.** Sur l'active, il
répéterait une information que l'état donne déjà — et sur une bande d'onglets verrouillés,
un cadenas sur l'onglet **ouvert** serait faux
(`DS_Final/components/forms/ChipRow.jsx:41-43`).

⚠️ **Le port RN a APLATI deux dégradés que le kit déclare.** `Switch` actif :
`9c22076:mobile/ds/Switch.tsx:39` pose `t('mmBleu')` là où le kit pose
`var(--action-forme)` (`DS_Final/components/forms/Switch.jsx:9`). Même défaut sur
`ChatBubble from = "me"` : `9c22076:mobile/ds/ChatBubble.tsx` pose `t('mmViolet')` là où le
kit pose `var(--action-transforme)` (`DS_Final/components/data/ChatBubble.jsx:17`).
**Le kit gagne : les deux sont des dégradés.**

### A.8 Données

| Composable | Rôle | Paramètres | Variantes / états | Dimensions | Jetons |
|---|---|---|---|---|---|
| **`Tag`** | Étiquette d'état. | `tone`, `label` | `ok`, `warn`, `stop`, `neutral`, **`art`** | hauteur **27 dp**, rembourrage 11 dp, 11 sp/600, rayon `rPill` | encre = `ok`/`warn`/`stop` ; fond = **voile dérivé de l'encre** à 0,13 / 0,18 / 0,13 ; `neutral` = `fillTag` + `textMuted` ; `art` = `paperFixed` + `inkFixed` |
| **`LessonRow`** | Ligne de liste dense. | `state`, `icon`, `iconBackground`, `title`, `meta`, `trailing`, `onPress`, `last` | `done`, `current`, `todo`, `plain` | rembourrage vertical 13 dp ; écart 12 dp ; puce `done` 25 dp, `todo` 26 dp liseré 2,5 dp, icône 34 dp r11 ; titre 14 sp/600 ls −0,01em ; méta 12 sp monospace ; `current` : fond `linear-gradient(135deg, rgba(0,87,188,.1), rgba(108,35,221,.1))`, rayon 14 dp, débordement latéral −18 dp | `borderHair`, `fill1`, `fill3`, `textBody`, `textFaint`, `ok` |
| **`ProgressBar`** | Progression. | `value`, `height` (8 dp) | remplissage animé à l'entrée (`tScene` 700 ms, `easeOut`) | rayon 5 dp | piste `fill2` ; remplissage `linear-gradient(90deg, #0057BC, #6C23DD, #F38B0A, #02AC9C)`, **brosse à 220 % de large** |
| **`QuotaMeter`** | Quota du répétiteur. **Le plafond est un choix de marge assumé, pas une limite honteuse.** | `used`, `total` (5), `label` | — | barres **15 × 5 dp** r3, écart 3 dp ; libellé 11,5 sp monospace ; écart 9 dp | `mmViolet` (consommé) / `fill3` ; `textMuted` |
| **`Avatar`** | Initiales sur dégradé. **Aucune photographie n'existe au dépôt.** | `initials`, `size` (42 dp), `background` | — | rond ; texte Fraunces 700 à `size / 3` ; liseré **1,5 dp** | fond `linear-gradient(135deg, mmViolet, mmBleu)` ; liseré `borderGlass` (⛔ pas un blanc figé : il descend à 13 % en nuit) ; texte `paperFixed` |
| **`ChatBubble`** | Bulle du répétiteur. | `from`, `typing`, `content` | `me` / `ai` / `typing` | largeur max **82 %** ; rembourrage 13 × 16 dp ; rayon 20 dp, **coin de queue 7 dp** ; `typing` : largeur 64 dp, 3 points de 6 dp, écart 4 dp, opacité 0,35, clignotement 1,25 s décalé de 0,18 s | `me` : **dégradé `actionTransforme`** + ombre `0 6 18 rgba(108,35,221,.28)` ; `ai` : `bubbleBg` + `bubbleBrd` |
| **`CheckLine`** | Ce qui est dû, un engagement par ligne. | `tone`, `dash`, `size` (12 dp), `content` | `violet`, `ok`, `neutre` ; `dash` = **renvoi, jamais une croix** | pastille 22 dp ronde ; écart 11 dp ; texte 14,5 sp lh 1.5 ; marge haute 10 dp ; trait 3,4 (coche) / 3,0 (tiret) | `violet` : fond `rgba(108,35,221,.15)`, trait `mmVioletT` ; `ok` : `rgba(15,123,82,.15)` + `ok` ; `neutre` : `fill2` + `ink2` |
| **`DocLine`** | Ligne de document. | `label`, `value`, `last` | — | rembourrage vertical 8 dp ; écart 12 dp ; 13,5 sp ; valeur en monospace 700 | filet `fill3` — ⚠️ **plein, pas pointillé** : Compose n'a pas de `border-style: dashed` fiable, un filet plein très clair rend le même service |
| **`PriceBlock`** | Prix. | `amount`, `source`, `asOf`, `currency` (FCFA), `strike`, `note`, `size` (31 sp) | avec / sans prix barré | montant monospace 700, ls −0,04em ; devise 14 sp/600 ; barré 14 sp ; note 12,5 sp à 4 dp | `textNum`, `textMuted` |
| **`StatTile`** | Case de relevé. **Un zéro daté est une valeur ; une estimation n'en est pas une.** | `label`, `value`, `source`, `asOf`, `foot` | — | rembourrage 16 dp ; libellé 11 sp ; valeur monospace 700 **27 sp** tabulaire ls `lsNum` ; pied 11 sp | délègue à `Surface` ; `textMuted`, `textFaint` |
| **`MediaCard`** | **La silhouette dit le format.** | `format`, `gradient`, `eyebrow`, `title`, `body`, `cost`, `badge`, `artHeight` (150 dp), `titleSize` (17 sp), `actions` | `audio` (onde) / `video` (cadre 16:9) | vignette 150 dp ; bouton de lecture **56 dp** rond, fond `rgba(255,255,255,.92)`, ombre `0 8 22 rgba(14,17,22,.24)`, triangle 19 dp ; onde = 16 barres de 3 dp, hauteurs `[16,30,44,24,38,14,33,44,20,36,26,42,18,30,40,22]`, écart 3 dp, blanc à 72 % ; cadre vidéo : liseré 2 dp blanc à 28 %, encart 14 dp, rayon 14 dp ; badge 25 dp r`rPill` 10,5 sp sur noir à 50 % ; corps 18 dp ; rayon `rL` | `surfaceCardFlat`, `borderGlass`, `glassHl`, `glassShFlat` ; art audio `linear-gradient(140deg, #6C23DD, #0057BC 62%, #02AC9C)`, art vidéo `linear-gradient(140deg, #0057BC, #6C23DD)` |

⛔ **Le voile d'un `Tag` d'état est DÉRIVÉ de son encre, jamais une seconde valeur.**
Recopier `rgba(15,123,82,.16)` créerait une valeur **qui ne basculerait pas** : en mode
sombre `ok` devient `#4ADE9B` et son voile doit suivre. Un `rgba` figé resterait le vert du
mode clair (`9c22076:mobile/ds/theme.tsx:84-99`). En Compose :
`couleurEncre.copy(alpha = 0.13f)`.

⛔ **Le ton `art` de `Tag` n'est pas décoratif.** C'est l'étiquette posée **sur un aplat de
marque** — le « Aperçu · 4 min gratuit » d'une vignette. Sa surface ne suit pas le mode : un
aplat de territoire est saturé dans les deux, donc l'étiquette reste papier fixe sur encre
fixe. Sans ce ton, `neutral` y écrivait du gris clair sur du blanc en mode sombre — **2,2:1,
sur le seul texte de la vignette** (`9c22076:mobile/ds/Tag.tsx:19-26`).

⚠️ **`MediaCard` accepte une photographie — c'est AD-24, un écart hors CSS.** Le kit
l'interdisait ; `Video.thumbnailUrl` et `Podcast.coverImage` sont pourtant des champs
**obligatoires**, remplis par les imports YouTube et Spotify. L'écart **garde l'argument** :
la photo remplit la vignette, l'onde et le cadre 16:9 se redessinent **par-dessus**, sur un
voile sombre. Le dégradé devient le **repli** — pochette absente, URL cassée, image en vol
(`src/design-system/css/overrides/README.md`, § AD-24). Le `backdrop-filter: blur(8px)` de
la maquette sur le badge **n'est pas repris** : une carte de média vit en grille.

### A.9 `Etat<T>` — le vocabulaire de ce qu'on sait

Ce n'est pas un composant, c'est le **type** dont `SansDonnees` se sert, et il porte une
décision de produit. À reprendre tel quel en `sealed interface` Kotlin
(`9c22076:mobile/ds/Etat.ts:42-76`).

| Phase | Ce qu'elle dit | Valeur |
|---|---|---|
| `restauration` | La session se restaure ; on ne sait pas encore qui regarde. | `null` |
| `charge` | La demande est partie. | `null` |
| `anonyme` | Personne n'est connecté. **Ni une panne ni un vide : une porte fermée.** | `null` |
| `nonBranche` | L'écran n'a pas encore de source serveur. Honnête, et voué à disparaître. | `null` |
| `panne` | Ça a échoué. `motif` est écrit **pour être lu**, pas pour être diagnostiqué. | `null` + `motif`, `reessayer` |
| `vide` | Le serveur a répondu, et il n'y a rien. **Daté, donc informatif.** | `null` + `source`, `asOf` |
| `servie` | Le serveur a répondu. | `T` + `source`, `asOf` |
| `replique` | Le contenu du transfert, en développement ou en revue. **Jamais en production.** | `T` + `source`, `asOf` |

⛔ **Une liste vide et une liste jamais lue ne s'affichent pas pareil.** « Tu n'as aucune
note » ne doit pas être écrit avec le même aplomb qu'on ait compté ou pas. C'est la même
règle que `Num` : un zéro **daté** est une information, un zéro sans date n'en est pas une.

### A.10 Hors périmètre natif — pour mémoire

`LogoMark` (utilisé seulement dans le châssis de connexion), `TranslationNotice`, `SearchPill`,
`ReadingBar`, `SideNav`, `TopBar` n'apparaissent dans **aucun** des 36 écrans natifs du kit.
`Breadcrumb` reste dans le tableau ci-dessus parce que la console support en a besoin.
Ne pas les porter tant qu'un écran ne les demande pas : un composant sans consommateur
dérive sans que rien ne le voie.

---

# B · Les quatre difficiles

---

## B.1 · `Mesh` — le fond de toute l'application

### B.1.1 Ce que c'est, et pourquoi ça compte

Cinq maillages — quatre territoires plus la nuit — de **trois lobes chacun**, sous un voile
de lisibilité vertical. Poids réseau : **0 octet**. C'est ce qui remplace la vidéo d'accueil
en autoplay de 2 à 6 Mo, sur un marché où le panier de données 2 Go coûte en médiane 4,2 %
du revenu national brut par habitant (`DS_Final/readme.md:124-132`).

**Sur natif, le maillage est FIGÉ.** La dérive de 25 à 38 s du web n'est pas portée, et ce
n'est pas une régression à rattraper : c'est la décision. Elle se rouvre si une mesure sur
appareil réel montre que ça tient — pas avant (`9c22076:mobile/ds/Mesh.tsx:19-20`).
Le maillage reste identique sur les deux plateformes : « c'est du dégradé et de la
`transform`, gratuit partout. C'est ce qui permet à Android de perdre le flou sans perdre
l'identité » (`DS_Final/brand/native.css:51-52`).

### B.1.2 ⛔ CORRECTION FACTUELLE — les lobes du kit sont des CERCLES, pas des ellipses

Cette spécification a été demandée en supposant des lobes elliptiques. **Le kit dit
l'inverse, et il gagne.**

`DS_Final/brand/mesh.css:6` :

```css
.mesh b{position:absolute;display:block;width:340px;height:340px;border-radius:50%;
        filter:blur(52px);opacity:.9;will-change:transform}
```

`width === height`, `border-radius: 50%` : **un disque**. Le composant ne fait que
substituer la même valeur aux deux dimensions
(`DS_Final/components/surfaces/Mesh.jsx:4` : `{width: size+'px', height: size+'px'}`), et
`NativeScreen` lui passe `size = 460` sur Android, `340` sur iOS
(`DS_Final/ui_kits/native/NativeShell.js:161`). Le `readme.md:125` confirme :
« trois lobes de 340 px (520 sur écran large), `filter: blur(52px)` ».

Vérifié par recherche exhaustive : **aucune occurrence de `ellipse` ni de `radial-gradient`**
dans `DS_Final/`, `src/`, `Max-Morrys_DS_Platform/` ni `handoff_natif/`.

**D'où vient alors l'ellipse ?** Du port React Native, et c'était un défaut.
`9c22076:mobile/ds/Mesh.tsx:84-91` posait chaque lobe en `<Rect>` dont la largeur **et** la
hauteur sont des **pourcentages** — donc résolus contre deux axes différents d'un écran non
carré — avec un `RadialGradient` en `objectBoundingBox` (`cx="50%" cy="50%" r="50%"`). Sur
412 × 915 avec `r = 0.62`, la boîte fait 511 × 1 135 px : le gradient s'y inscrit en
**ellipse de rayons 255 × 567**, soit un rapport de 2,2:1 là où le kit demande 1:1.

**Décision : on rend des cercles.** La mécanique elliptique est tout de même donnée en
B.1.6, parce qu'elle est nécessaire dès qu'un lobe doit couvrir une hauteur d'écran, et
parce que `Brush.radialGradient` de Compose ne sait faire que des cercles.

### B.1.3 Les valeurs exactes — cinq maillages, quinze lobes

Source unique : `DS_Final/brand/mesh.css:5-37`. Les positions sont les **arêtes** de la
boîte carrée du lobe, avant flou. `T` = distance au bord haut, `L`/`R` = au bord gauche/droit,
`B` = au bord bas. Les durées et retards sont donnés pour mémoire ; **le natif ne les
utilise pas** (maillage figé).

**`forme` — fond `#FBFCFE`**

| # | Teinte | Ancrage | Opacité | (dérive web) | ligne |
|---|---|---|---|---|---|
| 1 | `#0057BC` bleu | `T −120`, `L −110` | **0,90** | 26 s / 0 s | `mesh.css:8` |
| 2 | `#6C23DD` violet | `T −160`, `R −120` | **0,65** | 31 s / −6 s | `mesh.css:10` |
| 3 | `#02AC9C` teal | `T 120`, `R −160` | **0,50** | 35 s / −12 s | `mesh.css:12` |

**`informe` — fond `#FBFCFE`**

| # | Teinte | Ancrage | Opacité | (dérive web) | ligne |
|---|---|---|---|---|---|
| 1 | `#F38B0A` orange | `T −130`, `L −90` | **0,90** | 27 s / 0 s | `mesh.css:14` |
| 2 | `#FF6E7F` corail | `T −150`, `R −130` | **0,60** | 33 s / −8 s | `mesh.css:16` |
| 3 | `#0057BC` bleu | `T 150`, `R −170` | **0,34** | 36 s / −14 s | `mesh.css:18` |

**`transforme` — fond `#FBFCFE`**

| # | Teinte | Ancrage | Opacité | (dérive web) | ligne |
|---|---|---|---|---|---|
| 1 | `#6C23DD` violet | `T −120`, `L −120` | **0,90** | 25 s / 0 s | `mesh.css:20` |
| 2 | `#0057BC` bleu | `T −150`, `R −110` | **0,70** | 32 s / −7 s | `mesh.css:22` |
| 3 | `#F38B0A` orange | `T 140`, `R −180` | **0,42** | 34 s / −15 s | `mesh.css:24` |

**`digitalise` — fond `#FBFCFE`**

| # | Teinte | Ancrage | Opacité | (dérive web) | ligne |
|---|---|---|---|---|---|
| 1 | `#02AC9C` teal | `T −120`, `L −110` | **0,90** | 26 s / 0 s | `mesh.css:26` |
| 2 | `#0057BC` bleu | `T −160`, `R −120` | **0,60** | 30 s / −9 s | `mesh.css:28` |
| 3 | `#F38B0A` orange | `T 160`, `R −170` | **0,40** | 37 s / −16 s | `mesh.css:30` |

**`nuit` — fond `#0A0D11`** (`mesh.css:31`)

| # | Teinte | Ancrage | Opacité | (dérive web) | ligne |
|---|---|---|---|---|---|
| 1 | `#0057BC` bleu | `T −140`, `L −130` | **0,55** | 29 s / 0 s | `mesh.css:33` |
| 2 | `#6C23DD` violet | `T −170`, `R −120` | **0,45** | 34 s / −10 s | `mesh.css:35` |
| 3 | `#F38B0A` orange | **`B −180`**, `R −160` | **0,30** | 38 s / −18 s | `mesh.css:37` |

⛔ **Les quinze teintes sont écrites en HEXADÉCIMAL LITTÉRAL dans le kit, pas en `var()`.**
Elles ne basculent donc **pas** en mode sombre : `#0057BC` reste `#0057BC` sous `.dk`. C'est
délibéré — un lobe est une **peinture**, pas un texte : il n'a pas de plancher de contraste
à tenir, c'est le voile qui s'en charge. **Ne pas les lire par `mmBleu` / `mmViolet` /
`mmOrange` / `mmTeal`** : ces jetons deviendraient `#6FB1FF` / `#B98CFF` / `#FFB24D` /
`#3FD9C6` en nuit, et le maillage changerait de couleur. C'est exactement le contournement
qu'avait pris le port RN (`9c22076:mobile/ds/Mesh.tsx:27-53`, `hue: 'mmBleu'`) — **faux, et
mesurable.**

Le maillage `nuit` n'est pas « le maillage clair en sombre » : c'est un **cinquième
territoire**, déclaré en valeur, sélectionné par `Screen(dark = true)` ou par
`territory = "nuit"`.

### B.1.4 Le fond de la boîte et le voile

| Portée | Fond du maillage | Voile (haut → bas) | Source |
|---|---|---|---|
| Clair (kit) | `#FBFCFE` | `#FFFFFF` **0,42** 0 % → **0,72** 46 % → **0,90** 100 % | `mesh.css:5,41` |
| `.m-nuit` (kit) | `#0A0D11` | `#0A0D11` **0,50** 0 % → **0,78** 48 % → **0,92** 100 % | `mesh.css:31,42` |
| `.dk` (kit) | `#0B0E13` | `#0B0E13` **0,42** 0 % → **0,80** 48 % → **0,94** 100 % | `mesh.css:43,44` |
| Clair (**produit, AD-18**) | `#FBFCFE` | `#FFFFFF` **0,60** 0 % → **0,78** 46 % → **0,90** 100 % | `ad-18-voile.css:31-36` |
| `.m-nuit` (**produit**) | `#0A0D11` | `#0A0D11` **0,62** 0 % → **0,86** 48 % → **0,94** 100 % | `ad-18-voile.css:39-44` |
| `.dk` (**produit**) | `#0B0E13` | `#0B0E13` **0,62** 0 % → **0,86** 48 % → **0,94** 100 % | `ad-18-voile.css:47-52` |

⚠️ **CONTRADICTION KIT / PRODUIT, et ce n'est pas le port RN qui l'a inventée.**
`DS_Final/brand/mesh.css` dit 0,42 en haut. `src/design-system/css/overrides/ad-18-voile.css`
— un **écart délibéré du produit**, documenté, et l'une des deux sources d'autorité de ce
document — le remonte à 0,60, sur mesure :

```
voile .42 → --ink-2 #5A6472   3,93:1   ✗
voile .60 → --ink-2 #5A6472   4,51:1   ✓
voile .60 → --ink   #0E1116  14,21:1   ✓
```

La règle « le kit gagne » ne tranche pas ici : `overrides/` **est** la source des jetons du
produit, `ds-tokens.mjs:32,97` la lit, et le kit `DS_Final` a d'ailleurs déjà **absorbé**
l'autre écart de la même famille (AD-25 : `--ink-3` y vaut `#68727F`, pas `#98A1AE`) sans
absorber celui-ci. Ce sont deux versions du même kit à des dates différentes.

**Valeurs retenues pour le natif : celles d'AD-18** — 0,60 / 0,78 / 0,90 en clair,
0,62 / 0,86 / 0,94 en nuit. Le voile du kit échoue une mesure de contraste que le produit a
faite ; livrer 0,42 sur Android reproduirait un défaut déjà corrigé au web.
**À faire remonter au kit à la prochaine relivraison.**

⛔ **Le corollaire de mise en page est CONTRAIGNANT, et il vient avec le voile.**
« AUCUN TEXTE DE CORPS NE SE PLACE DANS LE PREMIER TIERS D'UN ÉCRAN À MAILLAGE »
(`ad-18-voile.css:24-28`). Le haut d'écran est réservé aux titres d'affichage — du grand
texte, seuil 3:1, tenu à 4,28:1. Un `Screen` qui pose du `Body` sous la barre haute est un
défaut de conception, pas un choix.

### B.1.5 Le rendu en Compose — un cercle flou sans `Modifier.blur`

`Modifier.blur` s'appuie sur `RenderEffect`, **API 31+**, et le marché visé est bas de gamme
(`DS_Final/brand/native.css:29-36`, `minSdk = 24` dans `android/app/build.gradle.kts`).
Il est donc **interdit ici**. On remplace le flou par un dégradé radial dont le profil
**est** celui du flou : c'est exact, et c'est gratuit — un `ShaderBrush` se compose une
fois, pas à chaque image.

**Le profil.** `filter: blur(σ)` en CSS applique une gaussienne d'écart-type σ = **52 px**.
Un disque plein de rayon `R` convolué par cette gaussienne a pour profil d'alpha, à distance
`r` du centre :

```
alpha(r) = 0,5 · erfc( (r − R) / (σ · √2) )
```

Le rayon utile s'arrête à `R + 2,5σ` (au-delà, alpha < 0,7 %). Pour Android
(`size = 460`, `R = 230`, `σ = 52`) : **`R_total = 360 px`**.

**Les arrêts, calculés pour `R = 230`, `σ = 52` :**

| position (fraction de `R_total`) | rayon | alpha |
|---|---|---|
| 0,000 | 0 | **1,000** |
| 0,300 | 108 | **0,990** |
| 0,450 | 162 | **0,904** |
| 0,550 | 198 | **0,730** |
| 0,639 (= `R / R_total`) | 230 | **0,500** |
| 0,700 | 252 | **0,336** |
| 0,800 | 288 | **0,133** |
| 0,900 | 324 | **0,036** |
| 1,000 | 360 | **0,000** |

⚠️ Ces neuf arrêts ne valent **que** pour `R / σ = 4,423`. Sur iOS (`size = 340`, `R = 170`,
`R_total = 300`, `R / σ = 3,27`) le profil est plus mou. **Ne pas recopier la table :
calculer.**

```kotlin
// ds/Mesh.kt

private const val SIGMA_FLOU = 52f          // px CSS — DS_Final/brand/mesh.css:6
private const val ARRETS = 12

/** Abramowitz & Stegun 7.1.26 — suffisante ici : l'erreur max est de 1,5e-7. */
private fun erf(x: Float): Float {
    val s = if (x < 0) -1f else 1f
    val a = kotlin.math.abs(x)
    val t = 1f / (1f + 0.3275911f * a)
    val y = 1f - (((((1.061405429f * t - 1.453152027f) * t) + 1.421413741f) * t
            - 0.284496736f) * t + 0.254829592f) * t * kotlin.math.exp(-a * a)
    return s * y
}

/** Le profil d'un disque de rayon R flouté à sigma, échantillonné sur [0, rTotal]. */
fun profilLobe(rayonDisque: Float, sigma: Float = SIGMA_FLOU): Pair<Float, List<Pair<Float, Float>>> {
    val rTotal = rayonDisque + 2.5f * sigma
    val k = sigma * kotlin.math.sqrt(2f)
    val arrets = (0 until ARRETS).map { i ->
        val f = i / (ARRETS - 1f)
        f to (0.5f * (1f - erf((f * rTotal - rayonDisque) / k)))
    }
    return rTotal to arrets
}
```

**Le composable.**

```kotlin
@Immutable
data class Lobe(
    val teinte: Color,          // littérale, jamais un jeton — voir B.1.3
    val opacite: Float,
    val ancrageX: Ancrage,      // Gauche(-110.dp) | Droite(-120.dp)
    val ancrageY: Ancrage,      // Haut(-120.dp)   | Bas(-180.dp)
)

@Composable
fun Mesh(
    territory: Territoire,
    modifier: Modifier = Modifier,
    taille: Dp = if (LocalPlateforme.current.estAndroid) 460.dp else 340.dp,
) {
    val d = LocalDensity.current
    val lobes = LOBES[territory]
    val fond = FONDS[territory]                // #FBFCFE, ou #0A0D11 (nuit), ou #0B0E13 (.dk)
    val voile = VOILES[territory]              // trois arrêts, § B.1.4

    Canvas(modifier.fillMaxSize()) {
        drawRect(fond)

        val cote = with(d) { taille.toPx() }
        val rayon = cote / 2f
        val (rTotal, arrets) = profilLobe(rayon)

        lobes.forEach { l ->
            val centre = Offset(
                x = l.ancrageX.resoudre(size.width, cote),
                y = l.ancrageY.resoudre(size.height, cote),
            )
            // ⛔ Un CERCLE. rayon == rayon sur les deux axes : c'est ce que dit le kit.
            drawCircle(
                brush = Brush.radialGradient(
                    colorStops = arrets
                        .map { (p, a) -> p to l.teinte.copy(alpha = a * l.opacite) }
                        .toTypedArray(),
                    center = centre,
                    radius = rTotal,
                ),
                radius = rTotal,
                center = centre,
            )
        }

        // Le voile de lisibilité. Sans lui, le maillage remonte sous le texte.
        drawRect(
            Brush.verticalGradient(
                0f to voile.haut, voile.milieuPos to voile.milieu, 1f to voile.bas,
            )
        )
    }
}
```

`Ancrage.resoudre` transcrit littéralement les quatre cas du CSS :

```kotlin
sealed interface Ancrage {
    val valeur: Dp
    fun resoudre(etendue: Float, cote: Float): Float
}
// left: -110px   -> centre = -110 + cote/2
// right: -120px  -> centre = etendue + 120 - cote/2
// top: -160px    -> centre = -160 + cote/2
// bottom: -180px -> centre = etendue + 180 - cote/2
```

⚠️ **Le maillage se dessine dans une portée qui rogne.** `.mesh` porte
`overflow: hidden; contain: paint; inset: 0` (`mesh.css:5`) : en Compose,
`Modifier.fillMaxSize().clipToBounds()`, posé **en premier enfant** du `Box` de l'écran,
avec le contenu au-dessus. Le maillage n'est **jamais** interactif ni annoncé :
`Modifier.clearAndSetSemantics {}` — trois formes vides annoncées à chaque écran seraient du
bruit (`src/design-system/react/surfaces/Mesh.tsx:32-34`).

### B.1.6 ⛔ Comment on obtient une ellipse, quand il en faut une

`Brush.radialGradient` **ne fait que des cercles** : sa signature n'a qu'un `radius: Float`.
Pour une ellipse de demi-axes `rx` et `ry`, on dessine **un cercle du plus grand des deux**
et on **écrase l'autre axe par une transformation d'échelle centrée sur le lobe** :

```kotlin
fun DrawScope.lobeElliptique(
    centre: Offset, rx: Float, ry: Float, brosse: (Float) -> Brush,
) {
    val r = maxOf(rx, ry)
    withTransform({ scale(scaleX = rx / r, scaleY = ry / r, pivot = centre) }) {
        drawCircle(brush = brosse(r), radius = r, center = centre)
    }
}
```

La transformation s'applique **au shader comme à la géométrie**, donc le dégradé se déforme
avec le disque — c'est ce qui fait la différence avec un simple `drawOval`, où le shader
resterait circulaire dans un ovale rogné.

Équivalent SwiftUI : le dégradé radial est également circulaire ; on empile
`.scaleEffect(x: rx / r, y: ry / r, anchor: .center)` sur un `Circle().fill(RadialGradient(...))`
posé dans un cadre de `2r`.

**Ce mécanisme ne doit PAS être utilisé pour les quinze lobes du kit** (`rx == ry`). Il est
écrit ici parce qu'il sera demandé le jour où un lobe devra couvrir une hauteur d'écran, et
pour que personne ne le réinvente en pourcentages — c'est la voie par laquelle le port RN a
produit des ellipses de 2,2:1 sans que rien ne le signale.

---

## B.2 · `Gradient` — l'angle CSS devient deux points Compose

### B.2.1 La conversion, et pourquoi la formule du port RN est fausse

Le CSS déclare un **angle** ; `Brush.linearGradient` veut un `start` et un `end` en pixels.
La règle CSS : l'angle est mesuré **depuis le haut, dans le sens horaire** (0° = vers le
haut, 90° = vers la droite, 135° = du haut-gauche vers le bas-droite), et les deux
extrémités sont les **projections des coins** sur la ligne de dégradé — de sorte que la
boîte entière soit couverte.

Pour une boîte `W × H` et un angle `A` :

```
dx = sin(A)                      (repère écran : x vers la droite, y vers le BAS)
dy = −cos(A)
L  = |W · dx| + |H · dy|         longueur de la ligne de dégradé
C  = (W/2, H/2)
start = C − (L/2)·(dx, dy)
end   = C + (L/2)·(dx, dy)
```

```kotlin
// ds/Degrade.kt
fun bornesDeAngle(angleDeg: Float, taille: Size): Pair<Offset, Offset> {
    val a = Math.toRadians(angleDeg.toDouble())
    val dx = kotlin.math.sin(a).toFloat()
    val dy = -kotlin.math.cos(a).toFloat()
    val l = kotlin.math.abs(taille.width * dx) + kotlin.math.abs(taille.height * dy)
    val c = Offset(taille.width / 2f, taille.height / 2f)
    val demi = Offset(dx, dy) * (l / 2f)
    return (c - demi) to (c + demi)
}
```

⚠️ **Le port RN normalisait par `max(|x|, |y|)`** (`9c22076:mobile/ds/Gradient.tsx:26-36`),
ce qui envoie le dégradé **de coin à coin de la boîte**. C'est exact pour un carré, et
**faux pour tout le reste** : un bouton pilule de 320 × 54 dp à 135° reçoit une rampe de
couleur sensiblement différente de celle du web. La formule ci-dessus est celle du CSS.

### B.2.2 Les six dégradés d'action, résolus

`useActionGradient()` du port RN exposait **six** entrées : les quatre territoires plus les
deux « arts » (`9c22076:mobile/ds/Gradient.tsx:82-93`). Les quatre premiers sont des
**jetons** ; les deux derniers sont écrits dans les composants.

| Nom | Angle | Arrêts (clair **et** sombre — identiques) | Source |
|---|---|---|---|
| `actionForme` | **135°** | `#0057BC` 0 % → `#6C23DD` 100 % | `tokens/semantic.css:77` |
| `actionInforme` | **135°** | `#F38B0A` 0 % → `#FF6E7F` 100 % | `tokens/semantic.css:78` |
| `actionTransforme` | **135°** | `#6C23DD` 0 % → `#0057BC` 100 % | `tokens/semantic.css:79` |
| `actionDigitalise` | **135°** | `#02AC9C` 0 % → `#0057BC` 100 % | `tokens/semantic.css:80` |
| `artMedia` (audio) | **140°** | `#6C23DD` 0 % → `#0057BC` **62 %** → `#02AC9C` 100 % | `components/data/MediaCard.jsx:7` |
| `artVideo` | **140°** | `#0057BC` 0 % → `#6C23DD` 100 % | `components/data/MediaCard.jsx:8` |

⛔ **Les quatre `--action-*` NE BASCULENT PAS en mode sombre.** Ils sont écrits en
hexadécimal littéral dans `tokens/semantic.css`, jamais en `var(--mm-*)`, et
`tokens/dark.css` ne les redéclare pas. Vérifié dans `tokens.generated.ts` : les quatre
valeurs sont **identiques** dans les deux tables.

⛔ **Et c'est exactement ce que le port RN cassait.** `useActionGradient()` renvoyait
`[t('mmBleu'), t('mmViolet')]` : en mode sombre, `mmBleu` vaut `#6FB1FF` et `mmViolet`
`#B98CFF`. Le bouton « Je te forme » rendait donc **bleu ciel → mauve pâle** en nuit là où
le kit demande **`#0057BC` → `#6C23DD`**. Le contournement était justifié dans un
commentaire (« même valeur, et le mode sombre suit sans parseur »,
`9c22076:mobile/ds/Gradient.tsx:78-81`) — **c'est faux, et c'est mesurable.**

### B.2.3 La deuxième famille : les six arcs

`src/design-system/css/overrides/ad-23-arc.css:69-73,77` déclare cinq arcs de territoire
plus un alias `--arc`. Eux sont écrits en `var(--mm-*)`, donc **ils basculent**.

| Nom | Angle | Clair | Sombre |
|---|---|---|---|
| `arc` (= `arcForme`) | **96°** | `#0057BC` 0 · `#6C23DD` 25 · `#FF6E7F` 50 · `#F38B0A` 75 · `#02AC9C` 100 | `#6FB1FF` · `#B98CFF` · `#FF6E7F` · `#FFB24D` · `#3FD9C6` |
| `arcInforme` | 96° | `#F38B0A` · `#02AC9C` · `#0057BC` · `#6C23DD` · `#FF6E7F` | `#FFB24D` · `#3FD9C6` · `#6FB1FF` · `#B98CFF` · `#FF6E7F` |
| `arcTransforme` | 96° | `#6C23DD` · `#FF6E7F` · `#F38B0A` · `#02AC9C` · `#0057BC` | `#B98CFF` · `#FF6E7F` · `#FFB24D` · `#3FD9C6` · `#6FB1FF` |
| `arcDigitalise` | 96° | `#02AC9C` · `#0057BC` · `#6C23DD` · `#FF6E7F` · `#F38B0A` | `#3FD9C6` · `#6FB1FF` · `#B98CFF` · `#FF6E7F` · `#FFB24D` |
| `arcAgence` | 96° | `#FF6E7F` · `#F38B0A` · `#02AC9C` · `#0057BC` · `#6C23DD` | `#FF6E7F` · `#FFB24D` · `#3FD9C6` · `#6FB1FF` · `#B98CFF` |

Positions dans tous les cas : **0 / 25 / 50 / 75 / 100 %**. Le corail `#FF6E7F` est le seul
arrêt qui ne bascule jamais — il n'a pas de variante nuit.

⚠️ **Les arcs sont un ornement de survol du site.** Ils n'ont **aucun consommateur natif**
tant qu'aucun écran ne les demande. Ils sont émis dans la `Palette` parce qu'ils sont des
jetons ; ne pas les câbler « pour faire joli ».

### B.2.4 Les dégradés qui ne sont pas des jetons

| Où | Angle | Arrêts | Source |
|---|---|---|---|
| `TerritoryCard` | **150°** | `g<territory>1` 0 % → `g<territory>2` 100 % (**bascule**) | `TerritoryCard.jsx:12` |
| `ProgressBar` | **90°** | `#0057BC` · `#6C23DD` · `#F38B0A` · `#02AC9C`, brosse à **220 %** | `ProgressBar.jsx:14-15` |
| `ReadingBar` | **90°** | `#F38B0A` · `#FF6E7F` · `#6C23DD` | `ReadingBar.jsx:8` |
| `Skeleton` | **100°** | `fill1` 30 % · `fill3` 48 % · `fill1` 62 %, brosse à **280 %** | `Skeleton.jsx:9-10` |
| `Avatar` (défaut) | **135°** | `mmViolet` → `mmBleu` (**bascule**) | `Avatar.jsx:4` |
| `LessonRow` état `current` | **135°** | `rgba(0,87,188,.1)` → `rgba(108,35,221,.1)` | `LessonRow.jsx:22` |
| `Wordmark` « hello » | 96° | `#0057BC` 0 · `#F38B0A` 52 · `#02AC9C` 100 (nuit : `#6FB1FF` · `#FFB24D` · `#3FD9C6`) | `Wordmark.jsx:5-8` — **non porté en natif** |
| `.sheen` (certificat) | **102°** | transparent 38 % · blanc 85 % 50 % · transparent 62 % | `brand/motion.css:12` |

⚠️ **`ProgressBar` et `Skeleton` posent une brosse PLUS LARGE que leur boîte** (220 % et
280 %), parce que le CSS l'anime par `background-position`. En Compose, cela se rend en
donnant à `bornesDeAngle` une largeur virtuelle `2,2 × W` (respectivement `2,8 × W`) et en
translatant la brosse — jamais en étirant la vue.

### B.2.5 L'API

```kotlin
@Immutable
data class Degrade(val angleDeg: Float, val arrets: List<Pair<Float, Color>>)

fun Degrade.brosse(taille: Size): Brush {
    val (debut, fin) = bornesDeAngle(angleDeg, taille)
    return Brush.linearGradient(colorStops = arrets.toTypedArray(), start = debut, end = fin)
}

/** Le modificateur d'usage : la taille n'est connue qu'au dessin. */
fun Modifier.fondDegrade(d: Degrade, forme: Shape = RectangleShape) =
    this.clip(forme).drawBehind { drawRect(d.brosse(size)) }
```

En SwiftUI, `LinearGradient(stops:startPoint:endPoint:)` prend des `UnitPoint` (fractions).
La même formule s'applique en divisant `start` et `end` par `(W, H)` — mais **il faut la
taille réelle**, donc un `GeometryReader` : les `UnitPoint` ne peuvent pas encoder la
dépendance au rapport d'aspect que le CSS impose.

---

## B.3 · `Surface` — six niveaux, dont un qui ouvre sa propre portée

### B.3.1 La règle qui décide tout

**Le flou n'a droit qu'à une surface qui NE DÉFILE PAS avec le contenu.**
`DS_Final/design_handoff_maxmorrys/REGLES-DE-REVUE.md` § 1 : « sur mobile, tout défile —
héros compris. Il ne reste donc qu'une famille debout, et **plus aucun quota à compter** :
le prédicat est binaire, donc vérifiable sans jugement. »

Mesuré au web, en retirant le flou de huit composants : Club site **21 → 2** surfaces
floutées, les huit onglets du Club mobile **7 → 1 au total**, console **0**
(`DS_Final/readme.md:212-217`).

Ce qui fait qu'un verre a l'air d'un verre **n'est pas le flou** : c'est le liseré de
lumière de 1 px en haut, la bordure blanche, et la saturation (`readme.md:150-152`).
C'est pour ça que quatre niveaux sur cinq s'en passent sans rien perdre — et c'est ce qui
permet à Android de perdre le flou **sans perdre l'identité**.

### B.3.2 Les six niveaux, résolus

Sources : `DS_Final/brand/surfaces.css:6-30`, `tokens/glass.css`, `tokens/semantic.css`,
`tokens/dark.css`, et l'override `ad-25-encre-plancher.css:50-55` pour `ink-card`.

| Niveau | Fond clair | Fond sombre | Liseré | Ombre | Rayon | Flou |
|---|---|---|---|---|---|---|
| **`chrome`** (`.glass`) | blanc **0,62** (`glassA`) | blanc **0,09** | `glassBrd` blanc 0,55 → nuit blanc 0,13 | `glassHl` + `glassSh` | `rL` 24 dp | **24 dp** (`glassBlur`), saturation **170 %** — le SEUL |
| **`hero`** (`.glass-hero`) | blanc **0,58** (`glassAHero`) | blanc **0,08** | blanc 0,62 → nuit blanc 0,16 | `inset 0 1 0 blanc .72` + `glassShHero` `0 18 44 rgba(14,17,22,.14)` | `rXl` **30 dp** | aucun |
| **`flat`** (`.glass-flat`) | blanc **0,78** (`glassAFlat`) | blanc **0,07** | blanc 0,70 → nuit blanc 0,09 | `glassHl` + `glassShFlat` `0 6 18 rgba(14,17,22,.07)` → **nuit : aucune** | `rL` 24 dp | aucun |
| **`night`** (`.glass-d`) | encre `rgba(14,17,22, 0,72)` (`glassDA`) | idem | blanc 0,14 | `inset 0 1 0 blanc .1` + `0 14 38 rgba(0,0,0,.4)` | `rL` 24 dp | aucun |
| **`ink`** (`.ink-card`) | **`surfaceInk` `#0E1116` OPAQUE** | **identique** | blanc 0,10 | `0 16 40 rgba(14,17,22,.28)` | `rL` 24 dp | aucun |
| **`truth`** (`.truth`) | blanc **0,72** | blanc **0,06** | blanc 0,60 → nuit blanc 0,11 | aucune | `rM` **16 dp** | aucun |

`truth` porte en plus un **rembourrage propre de 15 dp** (`surfaces.css:20`).

⚠️ Le tableau du handoff natif (`DS_Final/handoff_natif/README.md`, § « Le verre sur
Android ») annonce « héros | blanc .72 ». **C'est faux** : `--glass-a-hero` vaut **0,58**
(`tokens/glass.css:5`), et `0,72` est la valeur de `.truth`. Le README a confondu deux
lignes. Le CSS gagne — le kit le dit lui-même : « les opacités et les flous ne sont écrits
qu'à un seul endroit, `tokens/glass.css` et `brand/surfaces.css` »
(`DS_Final/readme.md:144-149`).

### B.3.3 ⛔ Les valeurs Android — la portée `.andro`

C'est le bloc que ce document existe pour ne pas laisser perdre.
`DS_Final/brand/native.css:29-49`.

> « Sur Android, le repli EST le cas normal — décision assumée, pas une dégradation.
> `RenderEffect` demande API 31+, et le marché visé est bas de gamme : construire le verre
> sur une capacité que la moitié du parc n'a pas, c'est concevoir pour l'autre moitié. »

| Sélecteur | Valeur | Ligne |
|---|---|---|
| `.andro .glass, .glass-hero, .glass-d, .truth` | `backdrop-filter: none` | `native.css:37` |
| `.andro .glass` | `rgba(255,255,255, .86)` | `native.css:38` |
| `.andro .glass-hero` | `rgba(255,255,255, .90)` | `native.css:39` |
| `.andro .glass-d` | `rgba(13,17,23, .92)` | `native.css:40` |
| `.andro .truth` | `rgba(255,255,255, .88)` | `native.css:41` |
| `.andro.dk .glass` | `rgba(255,255,255, .13)` | `native.css:42` |
| `.andro.dk .glass-hero` | `rgba(255,255,255, .16)` | `native.css:43` |
| `.andro.dk .truth` | `rgba(255,255,255, .11)` | `native.css:44` |
| `.andro.blur-ok .glass, …` | le flou **revient** : `blur(glassBlur) saturate(glassSat)` | `native.css:47-49` |

**Trois choses à ne pas rater dans ce bloc :**

1. **`.glass-flat` n'y figure PAS.** Le faux verre n'a jamais eu de flou : il garde
   `glassAFlat` 0,78 / nuit 0,055 sur les deux plateformes. Il n'y a **rien** à compenser.
2. **`.andro.dk .glass-d` n'existe pas non plus** — donc en Android + mode sombre, le verre
   nuit reste à `rgba(13,17,23, .92)` (la règle `.andro .glass-d`, plus spécifique en ordre
   de chargement que `.dk`). C'est cohérent : `glass-d` est **déjà** une surface de nuit.
3. **Les sélecteurs `.andro.dk` sont COMPOSÉS, pas descendants** — et c'est le contraire du
   défaut que le kit porte ailleurs. `brand/fallback.css:58` écrit `.lowfi .dk .glass`, un
   combinateur **descendant**, alors que les deux classes sont posées sur le **même**
   élément : le sélecteur ne peut jamais s'apparier, et sur un téléphone à 2 Go réglé en
   sombre la barre haute rendait **blanc à 90 %**
   (`src/design-system/css/overrides/README.md`, § « `.lowfi .dk` »). En Compose ce mode de
   panne n'existe pas — mais **il dit quel est le tableau qui compte** : celui à deux
   dimensions (plateforme × mode), et pas deux tables empilées.

**La table Compose complète, plateforme × mode :**

| Niveau | Android clair | Android sombre | iOS clair | iOS sombre |
|---|---|---|---|---|
| `chrome` | blanc **0,86**, aucun flou | blanc **0,13**, aucun flou | blanc 0,62 + flou 24 dp | blanc 0,09 + flou 24 dp |
| `hero` | blanc **0,90** | blanc **0,16** | blanc 0,58 | blanc 0,08 |
| `flat` | blanc 0,78 | blanc 0,055 | blanc 0,78 | blanc 0,055 |
| `night` | encre **0,92** | encre **0,92** | encre 0,72 | encre 0,72 |
| `ink` | `#0E1116` opaque | `#0E1116` opaque | `#0E1116` opaque | `#0E1116` opaque |
| `truth` | blanc **0,88** | blanc **0,11** | blanc 0,72 | blanc 0,06 |

Le bonus `blur-ok` : si `Build.VERSION.SDK_INT >= 31` **et** que l'appareil se déclare
capable (mémoire > 2 Go, > 4 cœurs — le miroir de la détection `.lowfi` du web,
`src/design-system/lowfi.ts`), la colonne Android bascule sur les valeurs iOS **et** le flou
revient. **Jamais une hypothèse : une déclaration.**

### B.3.4 ⛔ `ink` OUVRE SA PROPRE PORTÉE DE THÈME

C'est le point du niveau `ink`, et il ne se déduit d'aucun nom de prop.

Une carte **sombre** posée sur une page **claire** — le bilan d'abonnement du Club. Deux
propriétés la distinguent d'un simple fond foncé :

1. **Elle est OPAQUE.** Un voile composerait avec le fond clair et remonterait à
   `rgb(80,81,86)` : **2,61:1** sous un gris nuit
   (`DS_Final/brand/surfaces.css:12-16`). D'où `surfaceInk`.
2. **Elle ouvre une portée nuit.** Sans elle, chaque texte à l'intérieur serait un gris
   écrit à la main — et c'est précisément l'erreur que ce niveau existe pour empêcher
   (`DS_Final/components/surfaces/GlassPanel.jsx:5-9` : le composant ajoute la classe `.dk`).

⛔ **`surfaceInk` est INVARIANT par construction, et il ne doit JAMAIS être aliasé sur
`ink`.** Le fond et la portée vivent sur le **même** élément : si le fond lisait `ink`, il
basculerait avec les textes et la carte se peindrait en blanc cassé — titre à **1,00:1**
(`tokens/semantic.css:56-60`, `overrides/ad-25-encre-plancher.css:28-32`). Le jeton est
déclaré à l'identique dans `:root` **et** dans `.dk` ; les deux tables générées le
confirment : `surfaceInk = "#0E1116"` des deux côtés.

**En Compose, c'est un `CompositionLocal`, et le corps doit être un composable SÉPARÉ.**

```kotlin
val LocalPalette = staticCompositionLocalOf { PALETTE_CLAIRE }
val LocalMode = staticCompositionLocalOf { Mode.CLAIR }

@Composable
fun Surface(
    niveau: Niveau = Niveau.FLAT,
    modifier: Modifier = Modifier,
    contenu: @Composable () -> Unit,
) {
    if (niveau == Niveau.INK) {
        // La portée s'ouvre ICI, et le corps la LIT depuis l'intérieur.
        CompositionLocalProvider(
            LocalPalette provides PALETTE_SOMBRE,
            LocalMode provides Mode.SOMBRE,
        ) {
            CarteEncre(modifier, contenu)
        }
        return
    }
    …
}

/* ⛔ SÉPARÉ, et ce n'est pas de la coquetterie : un `LocalPalette.current` lu dans le
   composable qui POSE le fournisseur ne le voit pas. Écrit dans `Surface`, le liseré
   aurait pris l'encre du mode clair — un filet noir sur une carte nuit.
   (9c22076:mobile/ds/Surface.tsx:58-60 : le port RN avait déjà payé cette leçon.) */
@Composable
private fun CarteEncre(modifier: Modifier, contenu: @Composable () -> Unit) {
    val p = LocalPalette.current
    Box(
        modifier
            .clip(RoundedCornerShape(Metrique.rL))
            .background(p.surfaceInk)              // opaque, invariant
            .border(1.dp, p.borderHair, RoundedCornerShape(Metrique.rL))
    ) { contenu() }
}
```

La même mécanique porte `Screen(dark = true)` — la console et le `/403` sont sombres **sur
un téléphone en mode clair** — et le maillage `nuit`.

En SwiftUI : un `EnvironmentKey` (`\.palette`) fourni par `.environment(\.palette, .sombre)`
sur la carte. Même piège : le corps qui lit `@Environment(\.palette)` doit être une `View`
distincte, sinon il lit la valeur d'avant.

### B.3.5 Le liseré de lumière n'a pas d'équivalent Compose

`glassHl` vaut `inset 0 1px 0 rgba(255,255,255,.75)` — une ombre **intérieure**, que Compose
ne connaît pas. Elle se rend en **dessinant un filet de 1 dp en haut**, à l'intérieur du
rognage, après le fond :

```kotlin
drawLine(
    color = ombre.couleur,               // rgba(255,255,255,.75) en clair, .1 en nuit
    start = Offset(rayonPx, 0.5f.dp.toPx()),
    end = Offset(size.width - rayonPx, 0.5f.dp.toPx()),
    strokeWidth = 1.dp.toPx(),
)
```

C'est lui qui porte l'effet de verre, **dans les deux modes** : ne jamais le supprimer au
prétexte que le flou a disparu (`DS_Final/readme.md:150-152,160-164`).

---

## B.4 · `NavBar` — 64 dp, titre à gauche, flèche seule

### B.4.1 Vérification contre le kit

Trois sources concordent, sans exception.

| Fait | Kit | Ligne |
|---|---|---|
| Hauteur Android | **64 px** | `brand/native.css:20-21` (`--navbar-andro: 64px`) |
| Hauteur iOS | 44 px | `brand/native.css:20` (`--navbar-ios: 44px`) |
| Titre Android | **à gauche**, `flex: 1` | `NativeShell.js:136-137` |
| Titre iOS | centré | `NativeShell.js:124` |
| Retour Android | **flèche seule**, aucun libellé | `NativeShell.js:133-135` |
| Retour iOS | chevron **+ libellé** | `NativeShell.js:120-122` |
| Tableau récapitulatif | « Barre de navigation `44px`, titre centré / **`64px`, titre à gauche** ; Retour : chevron + libellé / **flèche seule** » | `handoff_natif/README.md`, § « Ce qui diffère » |

**Confirmé sur les trois points.** Aucune contradiction avec le port RN
(`9c22076:mobile/ds/NavBar.tsx:29,93-122`), qui les avait déjà repris.

### B.4.2 Les valeurs exactes de la barre Android

`DS_Final/ui_kits/native/NativeShell.js:129-142`.

| Élément | Valeur |
|---|---|
| Hauteur | **64 dp** (`--navbar-andro`) |
| Rembourrage du conteneur | **début 4 dp, fin 8 dp** |
| Écart entre éléments | **6 dp** |
| Bouton de retour | **48 × 48 dp**, rayon 24 dp (rond), centré |
| Glyphe de retour | `Icon(name = "back")`, **22 dp**, trait **2,4** |
| Encre du glyphe | `textBody` |
| Titre | **19 sp**, graisse **600**, interlettrage **−0,015em**, `textBody`, **1 ligne** |
| Rembourrage gauche du titre | **4 dp** avec bouton de retour, **12 dp** sans |
| Bloc de droite | à la fin, écart **6 dp** entre boutons |

⛔ **Pas de libellé de retour, mais le libellé reste DIT.** Material ne l'écrit pas à
l'écran, « parce que le retour système peut venir d'ailleurs et qu'un libellé faux est pire
que pas de libellé » (`NativeShell.js:112-114`). Un lecteur d'écran, lui, a besoin de savoir
où mène ce bouton : le paramètre `retour: String?` survit, et il alimente le
`contentDescription` — `"Retour à $retour"` — sans jamais être affiché
(`9c22076:mobile/ds/NavBar.tsx:101-103`).

⛔ **Le titre est aligné à gauche ET plus gros.** 19 sp contre 16 sp sur iOS. Ce ne sont pas
deux styles d'un même composant, ce sont **deux barres** : Material n'a pas de titre centré,
et uniformiser ferait paraître l'application étrangère des deux côtés à la fois.

### B.4.3 Ce qui va autour

```kotlin
val NAVBAR_H: Dp = if (estAndroid) 64.dp else 44.dp
```

- **L'élévation.** Une barre Material se détache par son élévation, pas par un flou :
  `Modifier.shadow(3.dp)` sur Android, `0.dp` sur iOS (`9c22076:mobile/ds/platform.ts:76-80`).
- **La transition d'écran.** iOS **pousse latéralement** — l'idiome de
  `UINavigationController`, dont dépend le geste de retour au bord : la page doit venir de la
  droite pour qu'on comprenne qu'on la renvoie à droite. Material décrit un **fondu sur
  l'axe Z**. D'où `slideInHorizontally` d'un côté et un fondu montant de l'autre, **260 ms**
  contre **200 ms** — « un fondu long se lit comme une latence, pas comme un mouvement »
  (`9c22076:mobile/ds/platform.ts:20-24,53-57`).
- **Le geste de retour au bord** est activé sur iOS seulement : sur Android, un geste de
  bord concurrent entre en conflit avec le retour prédictif du système.
- **La barre de statut** est peinte par le système, pas par le composant : le thème XML
  (`android/app/src/main/res/values/themes.xml`) la met en transparent et pose
  `windowLightStatusBar`. En mode sombre, `values-night/` inverse.

---

# C · Le mode sombre

## C.1 Ce n'est pas un filtre — c'est un second jeu, déclaré en valeur

**100 jetons sur 225 changent de valeur.** Vérifié en comparant clé à clé les deux tables de
`src/design-system/tokens.generated.ts` : 225 clés de chaque côté, 100 différences.

Le raisonnement est dans `tokens/dark.css:4-8` et `readme.md:156-170`, et il tient en une
mesure : sur `#0B0E13`, le bleu `#0057BC` tombe à **2,84:1** et le violet `#6C23DD` à
**2,69:1** — les deux **interdits en texte**. C'est *l'inverse exact* du mode clair, où ce
sont l'orange (2,47:1) et le teal (2,84:1) qui le sont. **Une palette ne se transpose pas
d'un fond à l'autre.**

Les quatre variantes nuit sont donc des **jetons distincts** :
`#6FB1FF` (8,66:1), `#B98CFF` (7,60:1), `#FFB24D` (10,79:1), `#3FD9C6` (11:1).

Trois corollaires, chacun un piège :

1. **La sémantique d'état s'inverse aussi**, et c'est la famille qu'on oublie parce qu'elle
   ne fait pas partie de la marque : `ok` `#0F7B52` → `#4ADE9B`, `warn` `#8A4B00` →
   `#FFB24D`, `stop` `#B4231F` → `#FF8A80` (`tokens/dark.css:23`).
2. **Les versions « texte » du mode clair sont des teintes FONCÉES** (`#00695E`, `#8A4B00`,
   `#5A17BE`, `#C22A3C`) : illisibles en nuit, elles pointent sur la variante nuit
   correspondante (`tokens/dark.css:27`, `overrides/ad-20-corail-texte.css:26`).
3. **L'échelle de remplissage neutre s'inverse de sens** : en clair ce sont des teintes
   d'**encre** (`rgba(14,17,22, …)`), en sombre des teintes de **lumière**
   (`rgba(255,255,255, …)`). `fill1`…`fill5` + `fillTag`. Une valeur `rgba(14,17,22,…)`
   écrite en dur dans un composant **est** un défaut de mode sombre garanti : elle disparaît
   sur `#0B0E13` (`readme.md:199-208`).

## C.2 Les trois exceptions assumées

Trois jetons sont déclarés **identiques** dans les deux portées, et c'est le sujet :

| Jeton | Valeur | Pourquoi |
|---|---|---|
| `surfaceInk` | `#0E1116` | Le fond et la portée `.dk` vivent sur le **même** élément (§ B.3.4). |
| `inkFixed` | `#0E1116` | Encre posée sur une surface **colorée** — bouton orange, pastels. `ink` deviendrait blanc. |
| `paperFixed` | `#FFFFFF` | Papier sur surface colorée — pastille du logo, curseur d'interrupteur, encre des tons de territoire. |

`inkFixed` et `paperFixed` sont déclarés dans un bloc `:root,.dk`
(`overrides/ad-06-etats.css:81-84`), forme que `ds-tokens.mjs:84,91-93` reconnaît
explicitement : « une valeur FIXE, identique dans les deux modes ; elle entre dans les deux
cartes ».

⚠️ **`paper` n'est PAS redéclaré sous `.dk`, et ce n'est pas un oubli** — c'est le blanc de
référence. C'est précisément ce qui a produit le défaut AD-22 : toute surface opaque qui
lisait `paper` donnait `#ECF0F5` sur `#FFFFFF` = **1,06:1** en mode sombre. La correction
n'est pas une prop de thème, c'est un **jeton qui bascule seul** : `surfaceSheet`
(`paper` → `night3` `#0F151B`) et `surfaceBand` (`paper2` → `night` `#0A0D11`)
(`overrides/ad-22-surface-feuille.css`).

## C.3 Comment le thème Compose porte les deux tables

`Jetons.generated.kt` sépare déjà correctement :

- **`data class Palette`** — les **132 jetons dépendants du mode** (101 couleurs, 10
  dégradés, 19 ombres, 2 bordures). Deux instances : `PALETTE_CLAIRE`, `PALETTE_SOMBRE`.
- **`object Metrique`** — les **93 jetons communs** (longueurs, typographie, mouvement,
  opacités de verre). Un seul objet, sans mode.

Cette séparation est **prouvée, pas supposée** : `scripts/ds-emit-kotlin.mjs:243-256`
échoue si un jeton de `Metrique` prend deux valeurs, et si un jeton de la `Palette` change
de **catégorie** entre les modes (couleur → dégradé, par exemple).

```kotlin
// ds/Theme.kt — écrit à la main, une fois.

enum class Mode { CLAIR, SOMBRE }

val LocalPalette = staticCompositionLocalOf<Palette> { error("RysmoTheme manquant") }
val LocalMode = staticCompositionLocalOf { Mode.CLAIR }

@Composable
fun RysmoTheme(
    mode: Mode = if (isSystemInDarkTheme()) Mode.SOMBRE else Mode.CLAIR,
    contenu: @Composable () -> Unit,
) {
    val palette = if (mode == Mode.SOMBRE) PALETTE_SOMBRE else PALETTE_CLAIRE
    CompositionLocalProvider(
        LocalPalette provides palette,
        LocalMode provides mode,
        LocalIndication provides ripple(),          // l'ondulation Android, jamais sur iOS
        contenu = contenu,
    )
}

/** Le seul accesseur. Un composable ne lit jamais PALETTE_CLAIRE en dur. */
val jetons: Palette
    @Composable @ReadOnlyComposable get() = LocalPalette.current
```

**Quatre règles qui vont avec :**

1. **Aucun composable ne prend de paramètre de mode.** Les seules exceptions sont les deux
   qui **ouvrent** une portée : `Surface(level = ink)` et `Screen(dark = true)`.
2. **`MaterialTheme.colorScheme` n'est jamais lu.** `material3` n'est là que pour ce que le
   design system ne réimplémente pas — ondulation, gestion du focus, échafaudage de test
   (`android/app/build.gradle.kts`, dépendances). Le rendu appartient au kit.
3. **La portée locale se force par `CompositionLocalProvider`**, jamais par une prop
   remontée. Et le composable qui **pose** le fournisseur ne peut pas lire ce qu'il fournit :
   il faut un enfant (§ B.3.4).
4. **Le thème de fenêtre est peint AVANT Compose.** `values/couleurs.generated.xml` et
   `values-night/…` existent pour ça : sans eux, l'application ouvre sur un rectangle blanc
   puis bascule, et le saut se voit à chaque lancement.

En SwiftUI, la transposition est directe : une `struct Palette`, deux constantes, un
`EnvironmentKey` `\.jetons` posé au sommet depuis `@Environment(\.colorScheme)`, et
`.environment(\.jetons, .sombre)` pour les portées locales. Même piège de lecture dans la
vue qui fournit.

---

# D · Les jetons non-couleur

Le générateur historique (`ds-tokens.mjs` d'avant le 5 septembre) émettait **des chaînes
CSS**. Le port React Native ne les parsait pas : il les **contournait**, en relisant les
teintes par leur jeton d'origine. **Ce contournement est mesurablement faux en mode sombre**
(§ B.2.2). Ce que le générateur doit savoir émettre est listé ci-dessous.

État au 5 septembre 2026 : l'émetteur Kotlin (`scripts/ds-emit-kotlin.mjs`) **parse déjà**
les quatre familles et **arrête la génération** sur une valeur qu'il ne sait pas classer.
Reste la cible **Swift**, à écrire sur le même modèle.

## D.1 Les trois types Kotlin manquants — à écrire à la main

⛔ `Jetons.generated.kt` référence `Degrade`, `Ombre` et `Bordure`, **qui n'existent nulle
part**. Le projet ne compile pas sans eux. Ils vivent dans `ds/Primitives.kt`, écrit une
fois, jamais généré :

```kotlin
package me.maxmorrys.rysmo.ds

@Immutable
data class Degrade(val angleDeg: Float, val arrets: List<Pair<Float, Color>>)

/** Un `box-shadow` CSS. `inset` = ombre INTÉRIEURE ; Compose n'en a pas, voir D.2. */
@Immutable
data class Ombre(
    val inset: Boolean,
    val dx: Dp, val dy: Dp,
    val flou: Dp,      // rayon CSS : l'écart-type gaussien vaut flou / 2
    val etale: Dp,     // spread
    val couleur: Color,
)

@Immutable
data class Bordure(val epaisseur: Dp, val couleur: Color)
```

Équivalents Swift : trois `struct` du même nom, `Color` → `SwiftUI.Color`, `Dp` → `CGFloat`.

## D.2 Les 19 ombres — valeurs résolues, et comment les rendre

`Modifier.shadow(elevation, shape)` **ne sait pas** exprimer un décalage, un rayon de flou
et une couleur indépendants : il ne prend qu'une élévation. Les ombres du kit se dessinent
donc à la main, sur le canevas natif, avec un `BlurMaskFilter`.

⛔ **Le rayon CSS n'est pas l'écart-type.** `box-shadow … 38px …` correspond à une gaussienne
d'écart-type **19** : `BlurMaskFilter(radius = flou / 2, NORMAL)`.

```kotlin
fun Modifier.ombre(o: Ombre?, forme: Shape): Modifier = if (o == null || o.inset) this else
    this.drawBehind {
        val chemin = forme.createOutline(
            Size(size.width + o.etale.toPx() * 2, size.height + o.etale.toPx() * 2),
            layoutDirection, this,
        )
        drawIntoCanvas { toile ->
            val p = Paint().asFrameworkPaint().apply {
                isAntiAlias = true
                color = o.couleur.toArgb()
                maskFilter = BlurMaskFilter(o.flou.toPx() / 2f, BlurMaskFilter.Blur.NORMAL)
            }
            toile.save()
            toile.translate(o.dx.toPx() - o.etale.toPx(), o.dy.toPx() - o.etale.toPx())
            toile.nativeCanvas.drawPath(chemin.toPath(), p)   // via Outline -> Path
            toile.restore()
        }
    }
```

**Les ombres `inset` se rendent autrement** : ce sont des **filets**, pas des ombres. Les
sept `inset 0 1px 0 …` du système sont tous un trait de 1 dp posé en haut, à l'intérieur du
rognage (§ B.3.5). Aucun n'a de flou (troisième valeur = 0).

| Jeton | Clair | Sombre | Bascule |
|---|---|---|---|
| `cardHl` | `inset 0 1 0 rgba(255,255,255,.6)` | `inset 0 1 0 rgba(255,255,255,.14)` | ✔ |
| `cardSh` | `0 10 28 rgba(14,17,22,.10)` | `0 10 28 rgba(0,0,0,.4)` | ✔ |
| `chromeHl` | `inset 0 1 0 rgba(255,255,255,.8)` | `inset 0 1 0 rgba(255,255,255,.12)` | ✔ |
| `ctlSelRing` | `0 0 0 3 rgba(14,17,22,.07)` | `0 0 0 3 rgba(255,255,255,.1)` | ✔ |
| `errorRing` | `0 0 0 3 rgba(180,35,31,.13)` | `0 0 0 3 rgba(255,138,128,.2)` | ✔ |
| `fieldHl` | `inset 0 1 0 rgba(255,255,255,.75)` | **`none`** | ✔ |
| `focusRing` | `0 0 0 3 rgba(0,87,188,.16)` | `0 0 0 3 rgba(111,177,255,.22)` | ✔ |
| `glassHl` | `inset 0 1 0 rgba(255,255,255,.75)` | `inset 0 1 0 rgba(255,255,255,.1)` | ✔ |
| `glassSh` | `0 14 38 rgba(14,17,22,.13)` | `0 14 38 rgba(0,0,0,.46)` | ✔ |
| `glassShFlat` | `0 6 18 rgba(14,17,22,.07)` | *identique* | — |
| `glassShHero` | `0 18 44 rgba(14,17,22,.14)` | *identique* | — |
| `menuSh` | `0 6 18 rgba(14,17,22,.07)` | `0 6 18 rgba(0,0,0,.38)` | ✔ |
| `navOnSh` | `0 2 10 rgba(14,17,22,.07)` | `0 2 10 rgba(0,0,0,.3)` | ✔ |
| `segOnSh` | `0 2 8 rgba(14,17,22,.10)` | `0 2 8 rgba(0,0,0,.34)` | ✔ |
| `shBleu` | `0 8 24 rgba(0,87,188,.34)` | *identique* | — |
| `shInk` | `0 8 22 rgba(14,17,22,.24)` | *identique* | — |
| `shTeal` | `0 8 24 rgba(2,172,156,.32)` | *identique* | — |
| `shViolet` | `0 8 24 rgba(108,35,221,.34)` | *identique* | — |
| `tabbarHl` | `inset 0 1 0 rgba(255,255,255,.8)` | `inset 0 1 0 rgba(255,255,255,.09)` | ✔ |

**14 des 19 basculent.** `fieldHl` change même de **forme** : `none` en nuit. C'est pour ça
que le type Kotlin est `Ombre?`, nullable — et que `ds-emit-kotlin.mjs:117` traduit `none`
en `null` plutôt qu'en ombre transparente.

⛔ **Les trois anneaux (`focusRing`, `errorRing`, `ctlSelRing`) sont des `0 0 0 3px` : ni
décalage ni flou, seulement de l'étalement.** Ce ne sont pas des ombres, ce sont des
**anneaux**. En Compose : `Modifier.border(3.dp, couleur, forme)` posé **à l'extérieur** de
la forme (via un `padding` négatif ou un second `Box`), jamais un `drawBehind` flouté.

## D.3 Les ombres qui NE SONT PAS des jetons

Onze valeurs d'ombre vivent dans les composants ou dans `brand/surfaces.css`, hors table.
**À porter en constantes nommées dans `ds/Ombres.kt`, et à faire remonter au kit** — chacune
est une valeur de rendu que rien ne garde aujourd'hui.

| Où | Valeur | Source |
|---|---|---|
| `Button` ton `informe` | `0 8 24 rgba(243,139,10,.32)` | `Button.jsx:7` |
| `IconButton` (en plus de `chromeHl`) | `0 4 14 rgba(14,17,22,.09)` | `IconButton.jsx:10` |
| `ChatBubble` `me` | `0 6 18 rgba(108,35,221,.28)` | `ChatBubble.jsx:17` |
| `MediaCard` bouton de lecture | `0 8 22 rgba(14,17,22,.24)` | `MediaCard.jsx:29` |
| `Switch` curseur | `0 2 6 rgba(14,17,22,.24)` | `Switch.jsx:11` |
| `LogoMark` pastille | `0 4 14 rgba(14,17,22,.12)` | `LogoMark.jsx:7` |
| `SubNav` actif | `0 4 14 rgba(14,17,22,.07)` | `SubNav.jsx:16` |
| `.glass-hero` liseré | `inset 0 1 0 rgba(255,255,255,.72)` (**≠ `glassHl` .75**) | `surfaces.css:7` |
| `.glass-d` | `inset 0 1 0 rgba(255,255,255,.1)` + `0 14 38 rgba(0,0,0,.4)` | `surfaces.css:11` |
| `.ink-card` | `0 16 40 rgba(14,17,22,.28)` | `ad-25-encre-plancher.css:53` |
| `Fab` | `0 10 26 rgba(0,87,188,.38)` / `rgba(108,35,221,.4)` | `ScreensNatifApp.js:292`, `ScreensNatifClub.js:56` |

## D.4 Les 10 dégradés — voir § B.2.2 et B.2.3

Forme cible Kotlin (émise) :

```kotlin
val actionForme: Degrade = Degrade(
    angleDeg = 135.0f,
    arrets = listOf(0.0f to Color(0xFF0057BC), 1.0f to Color(0xFF6C23DD)),
)
```

Forme cible Swift :

```swift
static let actionForme = Degrade(
    angleDeg: 135,
    arrets: [(0.0, Color(red: 0.0, green: 0.341, blue: 0.737)),
             (1.0, Color(red: 0.424, green: 0.137, blue: 0.867))]
)
```

⛔ **Compose veut de l'ARGB ; le CSS écrit du RGBA.** L'ordre s'inverse, et silencieusement
si on l'oublie : `rgba(14,17,22,.13)` devient `0x210E1116`, pas `0x0E111621`
(`ds-emit-kotlin.mjs:53-58`).

⛔ **`color-mix(in srgb, A p%, B)` doit être résolu à la génération.** Deux jetons de menu
s'en servent (`menuOnBg`, `menuOffBg`, `overrides/ad-26-menus-opaques.css:59-60`), et sans
ce cas la génération entière tombe. Le calcul est un mélange linéaire canal par canal,
alpha compris (`ds-emit-kotlin.mjs:41-48`).

## D.5 Les 2 bordures composites

| Jeton | Clair | Sombre |
|---|---|---|
| `btnGhostBrd` | `1.5px solid rgba(14,17,22,.9)` | `1.5px solid rgba(255,255,255,.32)` |
| `btnQuietBrd` | `1px solid rgba(14,17,22,.11)` | `1px solid rgba(255,255,255,.14)` |

`Bordure(epaisseur = 1.5.dp, couleur = Color(0xE60E1116))` →
`Modifier.border(b.epaisseur, b.couleur, forme)`.

## D.6 Les autres formes que le générateur doit classer

Pour mémoire, et parce qu'une valeur non classée doit **arrêter** la génération :

| Famille | Compte | Forme cible Kotlin | Forme cible Swift |
|---|---|---|---|
| Longueur | 39 | `Dp` (`16.dp`) | `CGFloat` |
| Taille de police (`fs*`) | 13 | **`TextUnit` en `sp`** | `CGFloat` + `Font` dynamique |
| Approche (`ls*`, en `em`) | 8 | **`TextUnit` en `em`** | `.tracking(taille × facteur)` |
| Interligne (`lh*`) | 8 | `Float` (multiplicateur) | `CGFloat` |
| Graisse (`weight*`) | 5 | `FontWeight(900)` | `Font.Weight` |
| Durée | 6 | `Int` (millisecondes) | `Double` (secondes) |
| Courbe | 2 | `CubicBezierEasing(.2f,.7f,.2f,1f)` | `Animation.timingCurve` |
| Police | 3 | `String` — ⚠️ voir § E.4 | `String` |
| Mesure (`ch`) | 2 | `Int` (caractères) | `Int` |
| Pourcentage | 1 | `Float` (`glassSat = 1.7f`) | `CGFloat` |

⛔ **`15px` de corps de texte n'est PAS `15px` de marge.** La première suit le réglage de
taille de police du système (`sp`), la seconde non (`dp`). Les confondre rend une application
qui ignore l'accessibilité, et **le défaut est invisible tant qu'on ne change pas le
réglage** (`ds-emit-kotlin.mjs:190-195`). Le discriminant retenu est le préfixe `fs`, plus
l'unité `em` pour les approches.

---

# E · La typographie et les neuf fontes

## E.1 Les trois familles, et leurs graisses — le kit décide

`DS_Final/tokens/fonts.css:4` charge exactement :

| Famille | Rôle | Graisses |
|---|---|---|
| **Fraunces** | Affichage. **Jamais sous 22 sp.** | 400, 700, **900** |
| **Schibsted Grotesk** | Corps. | 400, 500, 600, 700 |
| **JetBrains Mono** | **Les nombres vérifiables, et rien d'autre.** Plus les sourcils et les métadonnées. | 400, 700 |

**Neuf fichiers.** Toute modification passe par `fonts.css` — c'est le kit qui décide, pas
le port.

## E.2 ⚠️ `aapt2` REFUSE les majuscules dans `res/font/`

Un nom de fichier de ressource Android doit être composé **uniquement** de minuscules `a-z`,
de chiffres `0-9`, de `_` et de `.`, et ne pas commencer par un chiffre. `Fraunces_400Regular.ttf`
fait échouer la compilation avec :

```
error: invalid file name: must contain only lowercase letters, digits, '_', or '.'
```

Le défaut est **bloquant, pas silencieux** — mais il arrive tard, à l'étape `aapt2`, sur
neuf fichiers d'un coup. La table ci-dessous existe pour qu'il n'arrive pas.

### E.2.1 La table de renommage — source → nom Android légal

Fichiers d'origine : `9c22076:mobile/assets/fonts/` (les mêmes binaires, copiés des paquets
`@expo-google-fonts/*`).

| Fichier source | `android/app/src/main/res/font/` | Ressource Kotlin | Famille | Graisse |
|---|---|---|---|---|
| `Fraunces_400Regular.ttf` | `fraunces_400regular.ttf` | `R.font.fraunces_400regular` | Fraunces | `FontWeight.W400` |
| `Fraunces_700Bold.ttf` | `fraunces_700bold.ttf` | `R.font.fraunces_700bold` | Fraunces | `FontWeight.W700` |
| `Fraunces_900Black.ttf` | `fraunces_900black.ttf` | `R.font.fraunces_900black` | Fraunces | `FontWeight.W900` |
| `SchibstedGrotesk_400Regular.ttf` | `schibsted_grotesk_400regular.ttf` | `R.font.schibsted_grotesk_400regular` | Schibsted Grotesk | `FontWeight.W400` |
| `SchibstedGrotesk_500Medium.ttf` | `schibsted_grotesk_500medium.ttf` | `R.font.schibsted_grotesk_500medium` | Schibsted Grotesk | `FontWeight.W500` |
| `SchibstedGrotesk_600SemiBold.ttf` | `schibsted_grotesk_600semibold.ttf` | `R.font.schibsted_grotesk_600semibold` | Schibsted Grotesk | `FontWeight.W600` |
| `SchibstedGrotesk_700Bold.ttf` | `schibsted_grotesk_700bold.ttf` | `R.font.schibsted_grotesk_700bold` | Schibsted Grotesk | `FontWeight.W700` |
| `JetBrainsMono_400Regular.ttf` | `jetbrains_mono_400regular.ttf` | `R.font.jetbrains_mono_400regular` | JetBrains Mono | `FontWeight.W400` |
| `JetBrainsMono_700Bold.ttf` | `jetbrains_mono_700bold.ttf` | `R.font.jetbrains_mono_700bold` | JetBrains Mono | `FontWeight.W700` |

Règle de transformation, à automatiser plutôt qu'à appliquer à la main :
`PascalCase` → séparation sur les frontières de casse → `_` → tout en minuscules.
`SchibstedGrotesk_500Medium` → `schibsted_grotesk_500medium`.

⚠️ Sur iOS, **rien de tout ça** : les fichiers gardent leur nom, sont déclarés dans
`UIAppFonts` du `Info.plist`, et se retrouvent par leur **vraie** famille — « Fraunces »,
« Schibsted Grotesk » et « JetBrains Mono », **avec l'espace**. Les noms sans espace du port
RN étaient des **alias `expo-font`**, une contrainte de React Native qui disparaît avec lui.

## E.3 La correspondance avec les styles du kit

```kotlin
// ds/Typographie.kt
val Fraunces = FontFamily(
    Font(R.font.fraunces_400regular, FontWeight.W400),
    Font(R.font.fraunces_700bold,    FontWeight.W700),
    Font(R.font.fraunces_900black,   FontWeight.W900),
)
val SchibstedGrotesk = FontFamily(
    Font(R.font.schibsted_grotesk_400regular, FontWeight.W400),
    Font(R.font.schibsted_grotesk_500medium,  FontWeight.W500),
    Font(R.font.schibsted_grotesk_600semibold, FontWeight.W600),
    Font(R.font.schibsted_grotesk_700bold,    FontWeight.W700),
)
val JetBrainsMono = FontFamily(
    Font(R.font.jetbrains_mono_400regular, FontWeight.W400),
    Font(R.font.jetbrains_mono_700bold,    FontWeight.W700),
)
```

| Style du kit | Famille | Graisse | Taille | Interlettrage | Interligne | Jetons |
|---|---|---|---|---|---|---|
| Display xxl | Fraunces | 900 | 74 sp | −0,035em | 0,92 | `fsDspXxl`, `lsDspXxl`, `lhDspXxl` |
| Display xl | Fraunces | 900 | 64 sp | −0,038em | 0,90 | `fsDspXl`, `lsDspXl`, `lhDspXl` |
| Display md | Fraunces | 900 | **41 sp** | −0,038em | 0,90 | `fsDsp`, `lsDsp`, `lhDsp` |
| Display sm | Fraunces | 900 | 30 sp | −0,038em | 0,95 | `fsDspSm`, `lsDspSm`, `lhDspSm` |
| Display xs | Fraunces | 900 | 23 sp | −0,028em | 1,02 | `fsDspXs`, `lsDspXs`, `lhDspXs` |
| Titre de carte territoire | Fraunces | 900 | 26 sp | −0,032em | 1,00 | `fsTtl`, `lsTtl` |
| Corps | Schibsted | 400 | 15 sp | — | 1,45 | `fsBody`, `lhBody` |
| Chapô | Schibsted | 400 | 14 sp | — | 1,50 | `fsLede`, `lhLede` (en `textMuted`) |
| Prose | Schibsted | 400 | 15,5 sp | — | 1,68, **max 68 caractères** | `fsProse`, `lhProse`, `measureProse` |
| Méta | Schibsted | 400/600 | 13 / 12,5 sp | — | — | `fsMeta`, `fsMeta2` |
| Petit | Schibsted | 400 | 11,5 sp | — | — | `fsSmall` |
| Sourcil | **JetBrains Mono** | 400 | 10,5 sp | **+0,14em**, capitales | — | `fsEyebrow`, `lsEyebrow` |
| Nombre vérifié | **JetBrains Mono** | **700**, tabulaire | 31 / 27 / 19 sp | `lsNum` −0,02em | — | `lsNum` |

⛔ **L'interlettrage du système est RELATIF à la taille (`em`), pas une valeur fixe.**
−1,2 px sur un titre de 74 sp ne serre rien, et sur un titre de 23 sp il écrase. En Compose,
`TextUnit` en `em` fait le calcul ; si un cran est donné en nombre, il faut le calculer :
`letterSpacing = (-taille.value * 0.035f).sp` (`9c22076:mobile/ds/Type.tsx:45-48`).

⛔ **Le tabulaire n'est pas optionnel sur un nombre.** Sans lui, une colonne de nombres qui
se met à jour tressaute. En Compose :
`fontFeatureSettings = "tnum"` sur le `TextStyle`.

⛔ **La colonne de lecture ne dépasse JAMAIS 68 caractères**, quelle que soit la largeur
d'écran. C'est la seule règle de mise en page non négociable du système ; l'espace gagné va
à la marge (`DS_Final/readme.md:238-240`).

## E.4 ⚠️ Le jeton `fMono` ne peut pas servir de nom de ressource

`Metrique.fMono` vaut la chaîne **`"JetBrains Mono"`** — avec une majuscule et une espace.
Le commentaire de l'émetteur (`ds-emit-kotlin.mjs:172-175`) dit : « la chaîne sert de porte —
elle doit correspondre au nom de la ressource `res/font/` déposée ». **C'est impossible** :
`aapt2` refuse les deux.

Deux corrections possibles, à trancher :

- **(a)** L'émetteur produit, à côté de `fBody`/`fDisplay`/`fMono`, un identifiant
  normalisé (`fMonoRes = "jetbrains_mono"`) — la porte devient vérifiable.
- **(b)** Une porte de test JVM lit `Typographie.kt` et vérifie que chaque `FontFamily`
  couvre exactement les graisses de `fonts.css`. C'est l'équivalent Kotlin de
  `tests/unit/mobile-fontes.test.ts`, dont **les dix-sept assertions disparaissent avec
  `mobile/`** — dont celle qui lit `OS/2.usWeightClass` **dans les octets du fichier**,
  parce qu'un nom de fichier n'est pas une preuve
  (`_bmad-output/implementation-artifacts/spec-fontes-de-marque.md`, § Spec Change Log,
  « KEEP »).

**Recommandé : les deux.** (a) supprime la contradiction, (b) rattrape la garantie perdue.

## E.5 Ce que le port RN a payé, et qui ne se reproduit pas

`expo-font` au moment de l'exécution n'enregistre **qu'une face par nom** : `Type.tsx`
demandait `fontFamily: 'Fraunces'` + `fontWeight: '900'`, la face 900 était chargée sous
`Fraunces_900Black`, et n'était donc jamais choisie. **Toute la Fraunces — jamais demandée
en dessous de 700 — restait en police système sur Android, sur chaque écran, sans qu'aucune
porte ne le voie** (`spec-fontes-de-marque.md`, § Spec Change Log).

**Compose n'a pas ce défaut** : `FontFamily(Font(res, poids), …)` déclare explicitement la
correspondance graisse → fichier, et le système la respecte. C'est un des rares endroits où
la réécriture supprime un problème au lieu de le déplacer.

⚠️ Le port RN payait aussi **848 Ko en double** (les mêmes octets dans `res/font` et dans les
ressources du paquet JS). Ce coût disparaît : les neuf `.ttf` ne vivent qu'une fois, dans
`res/font/`. **Poids total attendu : ~848 Ko.**

---

# F · Ce que je n'ai pas pu déterminer

Écrit explicitement, parce qu'un trou nommé coûte moins cher qu'un trou comblé par une
invention.

## F.1 Les icônes en `ImageVector` — le générateur n'existe pas encore

`src/design-system/icons.ts` porte **109 glyphes** en données pures (`p` tracés, `c` cercles,
`r` rectangles, `w` épaisseur, `fill`/`solid` pour `play` et `star`). Le port RN les recevait
par une copie générée (`9c22076:mobile/ds/icons.generated.ts`).

`scripts/ds-tokens.mjs:173-175` porte le marqueur : « ⚠️ La copie native des 109 icônes est
retirée avec `mobile/`. Elles reviendront en `ImageVector` (Compose) et en `Path` (SwiftUI),
générées d'ici même. » **Ce générateur n'est pas écrit.**

Ce que je ne peux pas trancher sans mesure :
- **`ImageVector` construit à la compilation contre `PathParser` à l'exécution.** Le second
  est plus simple (les chaînes `d` passent telles quelles) mais analyse 109 chaînes au
  démarrage. Le premier demande un générateur qui traduise chaque commande SVG en appel
  `PathBuilder`. Je penche pour le second (les tracés sont courts, et seuls ceux affichés
  sont analysés si l'on mémoïse), **mais ça se mesure sur l'appareil visé, pas ici.**
- **Le kit ne connaît que 36 noms** (`components/brand/Icon.d.ts`), `icons.ts` en porte 109.
  Les 73 autres viennent du site et de la console. Je n'ai pas déterminé lesquels les 36
  écrans natifs utilisent réellement — l'inventaire demanderait de dépouiller les cinq
  fichiers `ScreensNatif*.js` glyphe par glyphe.

## F.2 La géométrie de `LogoMark` en natif

`assets/logo-mm-icon.png` est un PNG **à fond blanc**, 1 240 px, sans transparence — « il
n'existe ni version SVG, ni version monochrome, ni logotype horizontal »
(`components/brand/LogoMark.d.ts`). Le kit compense par une pastille blanche
(`plate`). Sur un maillage nuit ou un aplat de marque, **la pastille est obligatoire**.

Je n'ai pas pu déterminer si un asset transparent existe ailleurs (le PNG n'est pas dans
l'arbre `DS_Final/assets/` que j'ai lu). **Question ouverte pour l'humain.**

## F.3 Le seuil `blur-ok` d'Android

`.andro.blur-ok` existe (`brand/native.css:47-49`) mais **le kit ne dit pas ce qui l'active**
— seulement « quand l'appareil le déclare ». Le web utilise `deviceMemory ≤ 2` ou
`hardwareConcurrency ≤ 4` (`src/design-system/lowfi.ts`). Le miroir Android naturel serait
`ActivityManager.isLowRamDevice`, `MemoryInfo.totalMem` et `Runtime.availableProcessors()`,
avec `SDK_INT >= 31` en préalable. **Ce seuil n'est écrit nulle part et doit être décidé.**

## F.4 Les huit écrans que la console support demande

Le kit porte **cinq** des dix-neuf écrans d'administration, ceux du rôle `support`
(`handoff_natif/README.md`, § « Ce qui n'est pas dans le kit »). `Breadcrumb`, `Pipeline` et
`StatTile` y vivent. Je n'ai pas vérifié que les cinq écrans natifs de la console couvrent
tous les besoins du rôle `support` tel que `firestore.rules` le définit — **c'est un audit
de parcours, pas de design system.**

## F.5 Le rendu de `TranslationNotice` en natif

Le composant existe au kit et n'est monté par **aucun** écran natif. Or l'application est
bilingue et sert du contenu éditorial traduit automatiquement. Soit les écrans natifs ne
servent pas d'article traduit — soit le bandeau obligatoire manque. **Je n'ai pas pu
trancher** : cela demande de lire les 36 écrans, pas le design system.

## F.6 Le tracé du `M` de `TerritoryCard` empilée

Le chevron est donné en fractions (`polygon(0 100%, 22% 62%, …)`), et « quatre cartes
empilées reconstruisent la silhouette du M du logo en défilant » (`readme.md:246-250`).
Je n'ai **pas vérifié** que la silhouette obtenue en Compose, avec un `clipToBounds` sur la
pile, est identique — le CSS laisse le chevron **déborder de 1 px à gauche et à droite**
(`TerritoryCard.jsx:22`, `left:-1px;right:-1px`), ce qui suppose un conteneur qui ne rogne
pas. **À vérifier au premier rendu, en superposant une capture du kit.**

## F.7 La cible Swift du générateur

`scripts/ds-emit-kotlin.mjs` existe. **`ds-emit-swift.mjs` n'existe pas.** Les formes cibles
sont données en D.1 et D.4, mais je n'ai pas pu vérifier qu'elles compilent : il n'y a aucun
projet Xcode au dépôt.

## F.8 Ce que le mode sombre fait au maillage `nuit` sur un téléphone en mode clair

`Screen(dark = true)` ouvre une portée sombre **et** sélectionne le maillage `nuit`. Le CSS
distingue pourtant `.m-nuit::after` (voile `#0A0D11`) et `.dk .mesh::after` (voile
`#0B0E13`) — **deux voiles différents pour deux situations différentes**. Je retiens que
`territory = "nuit"` gagne sur le mode système, parce que c'est ce que fait la cascade CSS
(`.m-nuit::after` est déclaré après `.mesh::after` et avant `.dk .mesh::after`… qui est plus
spécifique). **Le cas « maillage nuit sur téléphone en mode sombre » n'est tranché par aucune
règle du kit** : les deux voiles y sont candidats, et ils diffèrent de 1 point sur le
premier arrêt. L'écart est invisible ; la règle manque quand même.

---

# Annexe · Les contradictions relevées, et comment elles ont été tranchées

| # | Sujet | Ce que dit A | Ce que dit B | Tranché |
|---|---|---|---|---|
| 1 | **Forme des lobes du maillage** | Kit : disques 340/460 px, `border-radius:50%`, `blur(52px)` (`mesh.css:6`) | Port RN : ellipses de rapport ~2,2:1, par des `<Rect>` en pourcentage sur deux axes (`Mesh.tsx:84-91`) | **Le kit.** Cercles. La mécanique elliptique est documentée en B.1.6 sans être employée. |
| 2 | **Teintes des lobes en mode sombre** | Kit : hexadécimaux **littéraux**, ne basculent pas (`mesh.css:8-37`) | Port RN : lus par `mmBleu`/`mmViolet`/… donc **basculent** (`Mesh.tsx:27-53`) | **Le kit.** Un lobe est une peinture, pas un texte. |
| 3 | **Voile de lisibilité du maillage** | Kit : 0,42 / 0,72 / 0,90 (`mesh.css:41`) | Produit AD-18 : 0,60 / 0,78 / 0,90, **mesuré** (`ad-18-voile.css:11-13`) | **AD-18.** `overrides/` est l'une des deux sources d'autorité, et le voile du kit échoue une mesure de contraste. À remonter au kit. |
| 4 | **Les 4 dégradés d'action en mode sombre** | Kit : hexadécimaux littéraux, **identiques** dans les deux modes (`semantic.css:77-80`) | Port RN : recomposés depuis `mmBleu`/`mmViolet`/… donc **différents** (`Gradient.tsx:82-93`) | **Le kit.** C'est le défaut que l'émetteur Kotlin existe pour supprimer. |
| 5 | **Conversion angle → offsets** | CSS : projections des coins, longueur `abs(W·sinA) + abs(H·cosA)` | Port RN : normalisation par `max(abs(x), abs(y))`, donc coin à coin (`Gradient.tsx:26-36`) | **Le CSS.** Exact seulement pour un carré chez le port RN. |
| 6 | **Voile du niveau `hero`** | `tokens/glass.css:5` : **0,58** | `handoff_natif/README.md` (tableau Android) : « héros \| blanc .72 » | **Le CSS.** 0,72 est la valeur de `.truth` ; le README a confondu deux lignes. |
| 7 | **Flou du `MiniPlayer` sur Android** | Maquette du kit : `backdrop-filter` **en style en ligne**, donc appliqué sur les deux plateformes (`ScreensNatifMedia.js:29`) | Politique du kit : « aucun flou par défaut sous `.andro` » (`native.css:34-36`) | **La politique.** Un flou en ligne échappe aux replis — c'est le mode de panne que le kit documente lui-même pour `.mm-chrome`. |
| 8 | **Saturation du verre** | `tokens/glass.css:12` : **170 %** | `TabBar.jsx:19`, `ScreensNatifMedia.js:29` : `saturate(180%)` en ligne | **Le jeton.** 170 %. |
| 9 | **`Switch` actif / `ChatBubble` `me`** | Kit : dégradés `--action-forme` / `--action-transforme` (`Switch.jsx:9`, `ChatBubble.jsx:17`) | Port RN : aplats `mmBleu` / `mmViolet` | **Le kit.** Des dégradés. |
| 10 | **Position du `Fab`** | `ScreensNatifApp.js:286` : `right 18`, `bottom = zone + 96` | `ScreensNatifClub.js:52` : `right 16`, `bottom = tabbarH + 40` | **Formule unique** : `end 18.dp`, `bottom = tabbarH + navigationBars + 18.dp`. Les deux écritures disent la même intention. |
| 11 | **`--ink-3`** | `DS_Final/tokens/colors.css:28` : `#68727F` | `Max-Morrys_DS_Platform/…/colors.css:23` : `#98A1AE` | **`#68727F`.** `DS_Final` a absorbé AD-25 ; le kit-plateforme est plus ancien. `#98A1AE` ne tient que **2,61:1** sur blanc. |
| 12 | **Transition de `border-width` du radio** | Kit : `transition: border-width` (`PayOption.jsx:20`) | AD-21 : seule la **couleur** s'interpole (`ad-21-radio-epaisseur.css:29`) | **AD-21.** Le dessin final est identique ; seule l'interpolation disparaît. |
| 13 | **`fMono` comme nom de ressource** | `ds-emit-kotlin.mjs:172-175` : « la chaîne sert de porte, elle doit correspondre au nom `res/font/` » | `aapt2` : minuscules, chiffres, `_` et `.` uniquement | **`aapt2`.** Il faut un second identifiant normalisé (§ E.4). |

---

# Ce qu'il faut avoir fait avant d'écrire le premier écran

1. **`ds/Primitives.kt`** — `Degrade`, `Ombre`, `Bordure`. Sans eux, `Jetons.generated.kt`
   ne compile pas.
2. **`ds/Theme.kt`** — `LocalPalette`, `LocalMode`, `RysmoTheme`. Deux tables, jamais une
   dérivation.
3. **`ds/Degrade.kt`** — `bornesDeAngle`, `Modifier.fondDegrade`.
4. **`ds/Ombres.kt`** — `Modifier.ombre` (`BlurMaskFilter`, rayon = flou / 2) et les onze
   ombres hors table de D.3.
5. **`res/font/` × 9**, renommées selon E.2.1, plus `ds/Typographie.kt`.
6. **`ds/Mesh.kt`** — quinze lobes en dur, profil `erfc`, voile AD-18.
7. **`ds/Surface.kt`** — six niveaux, table plateforme × mode de B.3.3, portée `ink`.
8. **`ds/NavBar.kt` + `ds/Screen.kt` + `ds/TabBar.kt`** — le châssis. Un corps, deux
   plateformes.
9. **Une porte de test JVM** qui rejoue ce que les treize suites supprimées tenaient :
   aucun littéral de couleur hors `Palette`/`BrandMarks`, chaque graisse de `fonts.css`
   couverte par une `FontFamily`, aucun contrôle porteur d'un `contentDescription` sans
   `onClick`. Le détail est dans
   `_bmad-output/implementation-artifacts/garanties-a-reconstruire.md`.
