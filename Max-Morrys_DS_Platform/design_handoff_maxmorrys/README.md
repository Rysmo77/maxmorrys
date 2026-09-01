# Transfert · Max-Morrys — plateforme web bilingue

## Vue d'ensemble

Plateforme de formation au digital opérée depuis Dakar par **une seule personne**, sous MY ONOMA SARL. Quatre lignes de produit, quatre territoires de couleur :

| Ligne | Modèle | Territoire |
|---|---|---|
| Formations | 95 000 / 200 000 FCFA, une fois, accès à vie | **Je te forme** — bleu `#0057BC` |
| Blog, FAQ | gratuit | **Je t'informe** — orange `#F38B0A` |
| Podcast, vidéos | gratuit | **Je te transforme** — violet `#6C23DD` |
| Club des Digitos | 19 900 FCFA/an ≈ 1 658/mois | **Je te transforme** — violet |
| Rysmo, assistant IA | quota 2/jour, packs 500–3 500 FCFA | **Je te transforme** — violet |
| Présence Digitale (TPE) | packs 250 000 / 450 000 / 750 000 FCFA | **Je te digitalise** — teal `#02AC9C` |
| Max-Morrys Agency | high-ticket, aucune grille publique | **hors territoire**, corail `#B4231F` |

**Cible : application web, mobile d'abord, bilingue FR/EN avec segments d'URL traduits.**

Trois contraintes de marché qui expliquent la plupart des décisions de conception :

1. **Le forfait est compté.** Le panier de données 2 Go coûte en médiane 4,2 % du revenu national brut par habitant en Afrique. Budget de première vue : **900 Ko, fontes comprises**. Le fond animé est du CSS pur — **0 octet** — parce qu'une vidéo d'arrière-plan coûterait 2 à 6 Mo.
2. **L'appareil est modeste.** `deviceMemory ≤ 2` est le profil courant, pas le cas limite. D'où le repli `.lowfi` (règle 5).
3. **Le paiement est local.** Wave et Orange Money, en francs CFA. C'est pour ça que l'application native est hors périmètre : Apple et Google prélèvent 15 à 30 % sur l'achat in-app, en carte, sans monnaie électronique locale — 14 250 à 28 500 F par formation vendue, et surtout la disparition du seul vrai avantage du produit. **La version installable (PWA) garde le paiement local.**

---

## Sémantique d'état : elle s'inverse aussi

`--ok`, `--warn` et `--stop` ont une variante nuit, exactement comme les quatre teintes du logo. En clair : `#0F7B52`, `#8A4B00`, `#B4231F`. En sombre, ces trois-là tombent à **3,4:1**, **4,1:1** et **2,6:1** sur `#0B0E13` — la portée `.dk` les remplace par `#4ADE9B`, `#FFB24D` et `#FF8A80` (**11,0:1**, **10,8:1**, **7,9:1**). C'est la famille qu'on oublie parce qu'elle ne fait pas partie de la marque.

---

## Trois noms, trois choses

La distinction la plus facile à casser du système, et elle l'a été une fois : les deux premiers noms ont longtemps été le même.

| Nom | Ce que c'est | Où il s'affiche |
|---|---|---|
| **Hello !** | le mot-symbole des **pages web** | barre haute et pied de page du site, en dégradé `#0057BC → #F38B0A → #02AC9C` — les trois couleurs qui portaient « Max », dans leur ordre |
| **Rysmo** | le nom de l'**application mobile** | écran de lancement, bannière d'installation, connexion, création de compte, `/403` |
| **Répétiteur** | le **répétiteur IA** qui vit dans l'application | barre d'onglets, en-tête de conversation, mémoire de profil |

**Le nom du répétiteur est un réglage, pas une constante.** « Répétiteur » est la valeur par défaut ; chaque personne peut le renommer, et le nom choisi remplace le mot **partout** — onglet, en-tête, première bulle, carte de reprise, écran de mémoire, ligne de suppression de compte, préférences. Dans les références, il vit dans une seule valeur partagée (`tutorNom()`, `reference/app-shell.js`) que treize emplacements lisent. **Un écran qui écrit le nom en dur casse le renommage sans que rien ne le signale** : côté production, ce nom vient du profil, jamais d'une constante de composant.

Deux chemins pour renommer, à dessein : le court est l'écran de mémoire du répétiteur — c'est là qu'on règle la relation, et c'est la première chose qu'on veut faire en y arrivant — le long est la section « Ton répétiteur » des préférences. Quatre suggestions sont proposées plutôt qu'un champ vide, qui fait hésiter.

**Max-Morrys** survit, mais seulement comme **personne** : la page « Je suis Max-Morrys », la signature d'article, les mentions légales, et « Max-Morrys Agency » qui est un nom de practice. Ce n'est plus un nom de produit — d'où le variant `signature` du composant `Wordmark` plutôt qu'une suppression.

Sur `hello`, `color` est déclaré **avant** `WebkitTextFillColor` : là où le remplissage transparent n'est pas compris, le texte reste lisible en bleu au lieu de disparaître.

---

## À propos des fichiers de ce paquet

Les fichiers de `reference/` sont des **références de conception écrites en HTML** — des prototypes qui montrent l'aspect et le comportement voulus. **Ce n'est pas du code de production à copier.**

Le travail consiste à **recréer ces écrans dans l'environnement du dépôt cible** (React, Vue, Svelte, Astro…) avec ses conventions et ses bibliothèques. Si aucun environnement n'existe encore, choisissez celui qui convient au projet et implémentez-y les écrans.

**En revanche, `css/` est directement utilisable.** Ce sont les jetons et les recettes réels du système, pas une approximation : liez `css/styles.css` et vous avez la totalité des variables, des maillages, du verre, du mouvement et des replis. C'est la partie du paquet qu'il faut adopter telle quelle plutôt que réécrire.

## Fidélité

**Haute fidélité.** Couleurs, typographie, espacements, durées et courbes sont définitifs et mesurés. Les valeurs numériques du kit source ont été reprises **verbatim** — si le kit dit 5 px, c'est 5 px, pas 4. Ne les arrondissez pas sur une grille de 4 ou 8.

Trois réserves honnêtes, détaillées en fin de document : les composants n'ont **aucun champ de formulaire réel** (ce sont des `<div>`), **presque rien n'est atteignable au clavier**, et le budget de flou est dépassé sur la plupart des écrans. Ce sont des maquettes ; la production doit corriger ces trois points.

---

## 1 · Jetons

`css/styles.css` est un point d'entrée : **uniquement des `@import`**, jamais de règle. Il atteint 17 fichiers.

```
css/
  styles.css                  ← liez celui-ci, et rien d'autre
  tokens/
    fonts.css                 3 familles via Google Fonts (voir « Fontes »)
    colors.css                teintes de marque, encres, sémantiques, versions texte
    typography.css            échelles, mesures, classes .mm-num et .mm-prose
    spacing.css               échelle canonique + valeurs du kit
    radius.css                5 rayons
    motion.css                4 durées, 2 courbes
    glass.css                 4 niveaux de verre
    semantic.css              alias — c'est PAR EUX que les composants lisent
    dark.css                  portée .dk — l'inversion complète
  brand/
    base.css                  reset, prose, classes utilitaires
    mesh.css                  les 4 maillages + nuit, animation comprise
    surfaces.css              les recettes de verre
    fallback.css              les 3 conditions de repli
    motion.css                scènes d'entrée, images-clés
    interactions.css          l'appui à 120 ms
    states.css                ← AJOUTÉ POUR CE TRANSFERT (voir § 3)
```

### Couleur — la règle qui ne se transpose pas

**Deux des quatre teintes du logo sont interdites en texte sur fond clair. Les deux autres sont interdites sur fond sombre.** Ce n'est pas symétrique, et une palette ne se transpose pas d'un fond à l'autre : les variantes nuit sont des **jetons distincts**, pas un filtre.

| Teinte | Sur blanc | Verdict clair | Variante nuit | Sur `#0B0E13` |
|---|---|---|---|---|
| Bleu `#0057BC` | 6,8:1 | ✅ | `--mm-bleu-n` `#6FB1FF` | 8,66:1 |
| Violet `#6C23DD` | 7,19:1 | ✅ | `--mm-violet-n` `#B98CFF` | 7,60:1 |
| Orange `#F38B0A` | **2,47:1** | 🔴 **interdit** → `--mm-orange-t` `#8A4B00` | `--mm-orange-n` `#FFB24D` | 10,79:1 |
| Teal `#02AC9C` | **2,84:1** | 🔴 **interdit** → `--mm-teal-t` `#00695E` | `--mm-teal-n` `#3FD9C6` | 11:1 |

En mode sombre, **le bleu et le violet du logo tombent à 2,84:1 et 2,69:1** : interdits tels quels. Utilisez les variantes nuit.

Encres : `--ink` `#0E1116` (18,91:1) · `--ink-2` `#5A6472` (6:1) · `--ink-3` `#98A1AE`.
Nuit : `#ECF0F5` · `#A2ADBB` · `#77828F`.

⚠️ **Réserve mesurée.** Ces ratios sont calculés sur **blanc pur**. Sur le fond réel — verre par-dessus le voile 42 % par-dessus un lobe de maillage — l'encre tertiaire tombe à **1,48:1** et l'encre secondaire à **3,4:1**. Voir « Ce qui reste à trancher ».

### Typographie

| Famille | Rôle | Règle |
|---|---|---|
| **Fraunces** 900 | display | **jamais sous 22 px**, `letter-spacing` −.028 à −.04em, `line-height` .88–1.02 |
| **Schibsted Grotesk** 400–700 | texte | corps 15 px/1.45 · chapô 14 px/1.5 · prose 15,5 px/1.68 |
| **JetBrains Mono** 400/700 | données | **règle 6** : uniquement des nombres vérifiables |

Colonne de lecture : `--measure-prose` = **68 caractères**. Elle ne s'élargit jamais (voir § 6).

### Espacement

Échelle canonique — la seule à employer dans du code neuf : **4 · 8 · 12 · 16 · 20 · 24 · 32 · 40**.

Les valeurs intermédiaires (6 · 10 · 14 · 18 · 22 · 26 · 30 · 36 · 44) existent parce que **le kit source les pratique**. Ne les arrondissez pas, n'en introduisez aucune nouvelle.

Repères : marge d'écran mobile **18** · panneau **20** · héros **22** · chevauchement du M **−14** · barre d'onglets **80** · bouton pleine largeur **54**.

**Cibles tactiles :** `--touch-aa` **44 px** (plancher exigé), `--touch-gap` **8 px**. Le kit dessine son chrome rond à **42 px** (`--touch-min`) — écart assumé dans les maquettes, **à ne pas reproduire en production**. `states.css` fournit `.mm-touch-extend` pour garder le dessin à 42 et la cible à 44.

---

## 2 · Les quatre maillages — `brand/mesh.css`

Le fond du produit. **Trois lobes flous par territoire**, en dérive désynchronisée. C'est ce qui remplace la vidéo d'arrière-plan : **0 octet**.

| Maillage | Lobes | Durée |
|---|---|---|
| `.m-forme` | bleu → violet → teal | 26 / 31 / 35 s |
| `.m-informe` | orange → corail → bleu | 27 / 33 / 36 s |
| `.m-transforme` | violet → bleu → orange | 25 / 32 / 34 s |
| `.m-digitalise` | teal → bleu → orange | 26 / 30 / 37 s |
| `.m-nuit` | bleu → violet → orange sur `#0A0D11` | 29 / 34 / 38 s |

Structure : `<div class="mesh m-forme"><b></b><b></b><b></b></div>`.
Lobes de **340 px** sur mobile, 460–520 sur écran large. `filter: blur(52px)`. Chaque lobe porte **sa propre image-clé** avec des valeurs littérales — aucune propriété personnalisée hors des portées de jetons, pour que la dérive reste animable en `transform` seul.

**Voile de lisibilité** — sans lui le maillage remonte sous le texte : blanc **42 %** en haut → **72 %** à mi-hauteur → **90 %** en bas. En sombre, encre **42 %** → **94 %**.

### Les trois conditions de repli — `brand/fallback.css`

1. `@supports not (backdrop-filter)` → blanc 92 %, liseré conservé, aucun saut de mise en page.
2. `prefers-reduced-transparency` → blanc 94 %, flou coupé. Réglage système, respecté sans condition.
3. **Appareil modeste**, détecté en JS → classe `.lowfi` : flou coupé partout, **dérive figée**.

```js
const m = navigator.deviceMemory, c = navigator.hardwareConcurrency;
if ((m && m <= 2) || (c && c <= 4)) document.documentElement.classList.add('lowfi');
```

**Le repli connaît le thème** (règle 5) : sans les trois lignes `.lowfi .dk`, un téléphone d'entrée de gamme en mode sombre affiche toutes ses surfaces de verre en blanc.

---

## 3 · Verre et états des composants

### Quatre niveaux — `tokens/glass.css`, `brand/surfaces.css`

| Niveau | Opacité | Flou | Usage |
|---|---|---|---|
| `.glass` | `--glass-a` **.62** | 24–26 px, `saturate(170–180%)` | **chrome fixe uniquement** — barre haute, barre d'onglets |
| `.glass-hero` | `--glass-a-hero` **.58** | **aucun** | héros — prix, formulaire principal |
| `.glass-flat` | `--glass-a-flat` **.78** | **aucun** | listes, fils, grilles, encarts |
| `.glass-d` | `--glass-d-a` **.72** sur encre | **aucun** | nuit |

### Le flou n'a droit qu'au chrome en position fixe

**`backdrop-filter` exige `position: fixed` ou `sticky`.** Partout ailleurs, c'est un défaut — aucun quota à compter, aucun jugement à rendre. En pratique : la barre haute du site et la barre d'onglets basse de l'application, sous lesquelles le contenu passe réellement. Tout le reste est en faux verre.

La règle autorisait d'abord « deux surfaces, dont un héros ». Son second volet — « zéro flou sur ce qui défile » — l'a simplifiée : **sur mobile, tout défile**, héros compris.

Le défaut ne se cachait pas dans les écrans mais dans **huit composants** portant chacun un flou en ligne, légitime seul et fatal cumulé : `ChatBubble` (répétée **et** défilante), `Button` ton `ghost`, `IconButton`, `PillButton`, `MediaCard`, `SearchPill`, `GlassPanel` niveau `hero`, et l'encart `.truth`. Les voiles ont été relevés pour compenser la perte du flou : `.glass-hero` .45 → **.58**, `.glass-d` .62 → **.72**, `.truth` .5 → **.72**, `--btn-ghost-bg` .6 → **.74**, et les quatre voiles nuit d'environ deux points.

Mesuré : Club site **21 → 2**, FAQ **8 → 2**, pôle média **6 → 1**, les huit onglets du Club mobile **7 → 1 au total**, la console **6 par écran → 0**. Zéro surface floutée défilante nulle part.

**La leçon de revue :** un flou n'est jamais coûteux à l'endroit où on l'écrit. Il le devient là où le composant est **répété** — et l'auteur du composant ne voit pas cet endroit. La règle se vérifie donc par écran assemblé, jamais par composant isolé, et sur **les deux kits**.

En sombre, le verre descend à **7,5 % de blanc** : sur fond sombre un voile léger suffit à détacher une surface, un voile épais la fait flotter comme un carton. **Le liseré de lumière de 1 px en haut ne change pas — c'est lui qui porte l'effet**, avec la bordure blanche à 55 % et `saturate(170%)`. Sans la saturation, le flou délave le maillage et tout devient gris.

### Les états — `brand/states.css` ⚠️ AJOUTÉ POUR CE TRANSFERT

Les composants du système sont écrits en **styles inline** (React), et un style inline ne peut exprimer ni `:focus-visible`, ni `:active`, ni `:disabled`. Ces états n'existaient donc pas. `states.css` les fournit :

| État | Traitement |
|---|---|
| **repos** | verre selon le niveau |
| **survol** | `brightness(1.03)`, **seulement** sur `(hover: hover) and (pointer: fine)`. Ne porte jamais d'information — sur mobile le survol n'existe pas |
| **focus visible** | **anneau double**, clair + `--mm-bleu`, sur `:focus-visible` et non `:focus`. Variante blanche sur surface colorée. **N'existait pas avant ce paquet** — défaut d'accessibilité le plus grave relevé |
| **actif** | `scale(.975)` en **120 ms** — `.94` sur les cibles rondes. Ni rebond, ni couleur |
| **désactivé** | opacité `.42`, `cursor: default` (jamais `not-allowed` : le curseur barré lit comme une erreur). Un interrupteur désactivé n'a **aucun** retour au toucher |
| **chargement** | bouton : libellé conservé + liseré qui balaie. Liste : **squelette à la forme exacte du contenu**, pour que rien ne saute. Jamais de rond qui tourne |
| **erreur** | bordure `--stop` + message **sous le champ**, fondu 220 ms. **Pas de secousse** : elle ajoute du stress et ne dit pas ce qui est faux |

---

## 4 · Mouvement — `tokens/motion.css`, `brand/motion.css`

**Quatre durées, deux courbes, rien d'autre.** Le piège est d'animer tout avec la même durée : ça se voit, et ça donne l'impression d'un thème appliqué plutôt que d'une intention.

| Jeton | Durée | Courbe | Ce que ça dit |
|---|---|---|---|
| `--t-tap` | **120 ms** | `cubic-bezier(.2,.7,.2,1)` | « j'ai senti ton doigt » — `scale(.975)` |
| `--t-ui` | **220 ms** | `cubic-bezier(.2,.7,.2,1)` | « l'état a changé » — filtre, radio, interrupteur, quota, statut |
| `--t-enter` | **380 ms** | `cubic-bezier(.16,1,.3,1)` | « ceci vient d'arriver » — +16 px et opacité, **70 ms** entre voisins |
| `--t-scene` | **700 ms** | `cubic-bezier(.16,1,.3,1)` | « la page se met en place » — titre sous masque **ligne par ligne à 90 ms**, barre qui se remplit |

Classes de scène : `.rv` (entrée simple) · `.rv-s` (avec échelle) · `.rv-l` (ligne de titre sous masque `clip-path`), pilotées par `--i` et déclenchées par `.play` sur l'ancêtre.

### Transitions de navigation

| Transition | Durée | Ce qui bouge | Ce qui **ne** bouge **pas** |
|---|---|---|---|
| Entrer dans un détail | 260 ms | le détail entre de la droite, la liste recule de 22 % et s'estompe | **le maillage** — c'est le repère de continuité |
| Revenir | 260 ms | le même mouvement, **inversé** | le maillage, **la position de défilement** |
| Changer de territoire | 500 ms | fondu croisé du maillage | la barre d'onglets |
| Ouvrir une feuille | 300 ms | la feuille monte, voile 0 → 30 % | l'écran derrière, **visible et flou** |
| Changer d'onglet | 180 ms | **fondu croisé, aucune translation** — une barre qui glisse crée une géographie fausse | tout le reste |
| Valider une action | 120 ms | l'enfoncement, puis l'état **sur place** | l'écran |

### Les deux seuls moments scénarisés

1. **Attente de paiement** — deux anneaux concentriques, `scale` 1 → 1,85, opacité .5 → 0, **2,6 s**, le second décalé de **1,3 s**, en boucle. C'est la seule chose qui dit « la transaction est vivante » à quelqu'un qui a quitté l'app pour valider dans Wave. **Pas de compte à rebours** : la durée dépend de Wave, et un compteur qui se termine sans réponse est pire que rien.
2. **Émission du certificat** — brillance diagonale, blanc 85 % sur 12 % de largeur, 102°, **deux passages** puis arrêt définitif. Départ à 0,9 s, 2,4 s par passage. Un seul passage se rate ; trois transforment la récompense en chargement.

**Il n'y en a pas de troisième.** Réussite de paiement, série, montée de niveau, fin de formation : aucune mise en scène.

`prefers-reduced-motion` ramène **tout** à 1 ms, dérive comprise — **une fois, globalement** (règle 4).

---

## 5 · Points de rupture

| Largeur | Cartes territoire | Navigation | Verre |
|---|---|---|---|
| **< 700 px** | **empilées**, chevauchement `--stack-overlap` **−14 px**, chevron actif | barre d'onglets basse, 80 px | chrome fixe uniquement |
| **700 → 1080** | **grille 2 × 2**, chevron **conservé**, chevauchement **supprimé** | latérale **250 px** en verre, quatre verbes + pastille | latérale + chrome |
| **> 1080 px** | **rangée de quatre** — la silhouette du M se lit horizontalement, comme dans le logo | supérieure **flottante**, détachée des bords, chaque verbe souligné de sa couleur | barre flottante + panneaux |

Jetons : `--bp-stack` **700px**, `--bp-wide` **1080px**.

**Pourquoi le chevron survit et le chevauchement disparaît.** Au-delà de 700 px, une encoche prise dans une carte large et isolée ne rappelle plus rien — c'est un accident graphique. Mais quatre chevrons côte à côte redonnent exactement la silhouette du logo. Le composant porte les deux axes séparément : prop `layout` = `stack` | `grid` | `row` | `plain`.

**LA RÈGLE QUI NE SE NÉGOCIE PAS.** La colonne de texte ne s'élargit **jamais**. Un article ou une leçon reste à **68 caractères** par ligne quelle que soit la place disponible. L'espace gagné va à la marge et à la navigation, **jamais à la longueur de ligne**. À 1400 px comme à 390, `--measure-prose` est identique ; les 400 px gagnés partent au sommaire et aux marges.

---

## 6 · Bilingue — `i18n/routes.js`

L'arbre de routes est monté **deux fois**, avec des segments traduits. **Chaque valeur anglaise doit être unique sur toute la table** : deux entrées qui collident produisent une page inatteignable dans une langue et pas dans l'autre, **sans erreur de compilation pour le signaler**. Le fichier vérifie l'unicité au chargement et journalise une collision.

| Page | Français | Anglais |
|---|---|---|
| Accueil | `/` | `/en` |
| Formations | `/formations` | `/courses` |
| Blog | `/blog` | `/blog` |
| Podcast | `/podcast` | `/podcast` |
| Vidéos | `/videos` | `/videos` |
| Club des Digitos | `/club-des-digitos` | `/digitos-club` |
| Présence Digitale | `/presence-digitale` | `/local-presence` |
| Agence | `/agence` | `/agency` |
| À propos | `/a-propos` | `/about` |
| Questions | `/faq` | `/faq` |
| Contact | `/contact` | `/contact` |
| Vérifier | `/verifier` | `/verify` |
| Mon espace | `/mon-espace` | `/my-learning` |
| Connexion | `/connexion` | `/sign-in` |

### Ce que la traduction ne résout pas

**Toute la voix repose sur le tutoiement, et l'anglais n'en a pas.** La familiarité doit être portée par autre chose : la **contraction** (« I'll », « you're », « doesn't ») et le **verbe à particule** (« show up », « get you online », « keep you posted »).

| Français | Anglais | Ce qu'on évite |
|---|---|---|
| Je suis Max-Morrys | **I'm Max-Morrys** | « I am » — la contraction porte le registre |
| Je te forme | **I'll train you** | « I educate you », qui met une estrade entre nous |
| Je t'informe | **I'll keep you posted** | « I inform you », qui sonne administratif |
| Je te transforme | **I'll push you further** | 🔴 « I transform you » — publicité de coach de vie |
| Je te digitalise | **I'll get you online** | 🔴 « I digitize you » — « digitize » se dit de documents, pas de commerces |
| Contacte-moi | **Talk to me** | « Contact us », qui invente une équipe |

**Les titres d'affichage ne sont pas traduits, ils sont ÉCRITS par langue**, avec leurs propres coupures de ligne. Le français court environ **18 % plus long** : un titre calé sur trois lignes en français en fait deux en anglais, et le bloc perd sa masse.

```
FR : JE TE FORME (11) / AU DIGITAL. (11) / DEPUIS DAKAR. (13)
EN : I'LL TRAIN YOU (14) / TO GO DIGITAL. (14) / FROM DAKAR. (11)
```

**Ne laissez jamais un titre d'affichage se replier tout seul.**

Séparateur de milliers : espace insécable en français (`95 000 F`), virgule en anglais (`95,000 F`).

### Bandeau obligatoire sur tout article traduit

La traduction est générée au pré-rendu **et mise en cache**. Une correction du français n'atteint la page anglaise qu'à l'expiration du cache, et **il n'y a pas d'invalidation manuelle**. D'où, en tête de corps — jamais en pied, où un avertissement n'avertit plus :

> **Machine-translated on [date]** — The French version is the one I wrote, and the one I keep up to date. *Read the original →*

Composant : `components/data/TranslationNotice.jsx`.

---

## 7 · Composants

`components/` porte **six fichiers Markdown**, un par groupe. Chacun donne, pour chaque
composant : la note d'usage, le **contrat de props** (`.d.ts`, qui porte les raisons et pas
seulement les types) et l'**implémentation de référence** en JSX.

Les sources sont transcrites en Markdown plutôt que livrées en `.jsx` à dessein : ce ne sont
pas des fichiers à déposer dans votre dépôt, ce sont des spécifications à recréer dans votre
environnement. **Lisez les contrats de props : ils portent les décisions.**

| Fichier | Composants |
|---|---|
`components/actions.md` | `Button` (5 tons) · `IconButton` · `PillButton`
`components/brand.md` | `Icon` (36 glyphes) · `LogoMark` · `Wordmark`
`components/forms.md` | `Field` · `Switch` · `Segmented` · `ChipRow` · `PayOption` · `StepDots`
`components/data.md` | `Tag` · `ProgressBar` · `LessonRow` · `PriceBlock` · `QuotaMeter` · `Avatar` · `ChatBubble` · `CheckLine` · `MediaCard` · `TranslationNotice` · `DocLine` · `StatTile`
`components/surfaces.md` | `Mesh` · `GlassPanel` · `TerritoryCard` · `Skeleton` · `EmptyState`
`components/navigation.md` | `TabBar` · `TopBar` · `SideNav` · `SubNav` · `SearchPill` · `Breadcrumb` · `Pipeline` · `ReadingBar`

**Aucun composant ne prend de prop de thème.** Une prop `dark` est un piège : elle doit être passée à la main partout, personne ne le fait, et le composant retombe silencieusement sur sa valeur claire — un disque de chrome à 60 % de blanc sous un glyphe `#ECF0F5` donne **1,4:1**, sur tous les écrans à la fois. Le thème est une **portée CSS** (`.dk` + `data-mm-dark` sur `<html>`), et les surfaces lisent des jetons qui basculent seuls.

**Corollaire pour les remplissages neutres.** En clair ce sont des teintes d'**encre**, en sombre des teintes de **lumière** : d'où `--fill-1` à `--fill-5`. Une valeur `rgba(14,17,22,…)` écrite en dur dans un composant est un défaut de mode sombre garanti — elle ne blanchit pas, elle **disparaît**.

---

## 8 · Ce qui reste à trancher

Trois points ouverts, mesurés, qui demandent une décision avant la mise en ligne.

**A · Contraste sur le fond réel.** Les ratios de la palette sont calculés sur blanc pur. Sur la pile réelle — lobe → voile 42 % → verre — l'encre tertiaire `#98A1AE` tombe à **1,48:1** et l'encre secondaire `#5A6472` à **3,4:1**. En nuit, le secondaire `#A2ADBB` tombe à **2,11:1**. Deux issues : remonter le voile en haut d'écran, ou assombrir les encres secondaires et tertiaires. **Le choix appartient au produit ; le statu quo n'est pas conforme.**

**B · Aucun champ de formulaire réel.** `Field` rend un `<div>`, pas un `<input>`. Zéro `<input>`, `<textarea>`, `<select>` dans tout le système ; les `<label>` existent sans `for` et sans contrôle à cibler. Acceptable pour une maquette, **bloquant en production** : rien n'est atteignable au clavier ni annoncé par un lecteur d'écran, et aucun clavier mobile adapté ne s'ouvre.

**C · Presque rien n'est focalisable.** Barre d'onglets, navigation latérale, sous-navigation, fil d'Ariane sont des `<a>` **sans `href`** ; pilules, segments, options de paiement, lignes cliquables et boutons flottants sont des `<span>` sans `tabindex` ni `role`. À l'implémentation : éléments natifs (`<button>`, `<a href>`, `<input>`) partout, `aria-label` sur toute cible sans texte.

Trois défauts moindres, également mesurés : le **budget de flou est dépassé** sur 7 écrans sur 8 (jusqu'à 7 surfaces dont 5 défilantes) ; **`assets/logo-mm-icon.png` pèse 273 Ko en 1254 × 1254** pour un rendu à 42–92 px, soit 30 % du budget — remplacez-le par un SVG ou par le composant `Wordmark`, qui rend la même marque en type pur pour 0 octet ; et l'**écran de mot de passe oublié promet un e-mail** que le produit ne peut pas envoyer.

---

## 9 · Les six règles de revue

Voir **`REGLES-DE-REVUE.md`** — à lire avant la première entrée, et à faire appliquer à chaque revue :

**Deux règles ont un énoncé plus strict que le brief, et le fichier explique pourquoi dans chaque cas.** La règle 1 passe de « deux surfaces floutées » à « une seule, qui ne défile pas » : c'est le second volet du brief poussé jusqu'au bout, puisque sur mobile tout défile. La règle 2 passe d'un plancher de `.45` à `.58` : la valeur n'a pas été assouplie, elle a été recalculée quand le héros a perdu son flou — `.45` supposait un flou qui adoucissait le maillage.

1. Jamais plus de **deux** surfaces en `backdrop-filter` visibles ; **jamais** de flou sur ce qui défile.
2. Plancher d'opacité du verre clair : **0,45**. Valeur libre interdite, jeton obligatoire.
3. Animations en **`transform` et `opacity` seulement**.
4. `prefers-reduced-motion` et `prefers-reduced-transparency` câblés **une fois, globalement**, jamais réintroduits localement.
5. La détection d'appareil modeste coupe le flou, fige le maillage, **et connaît le thème**.
6. Un nombre en monospace vient de la base ou d'une source citée. **Sinon il ne s'affiche pas.**

Aucune de ces six règles ne se voit sur une capture d'écran. C'est précisément pourquoi elles sont écrites.

---

## 10 · Fontes

Trois familles, chargées depuis Google Fonts par `tokens/fonts.css` : **Fraunces** (variable, opsz 9..144, graisses 400/700/900), **Schibsted Grotesk** (400/500/600/700), **JetBrains Mono** (400/700).

**Aucun binaire n'a été fourni** : il n'y a pas de `@font-face` local. Estimation du poids par Google Fonts : **~200 à 220 Ko**, soit près d'un quart du budget de 900 Ko.

👉 **À décider :** si la production auto-héberge ses fontes — recommandé, l'`@import` crée une chaîne de requêtes sérialisée — visez **≤ 95 Ko** : sous-ensemble latin + latin-ext, deux graisses par famille, `.woff2`, et remplacez l'`@import` par des `@font-face` locales avec `font-display: swap`.

---

## 11 · Assets

- `assets/icons/` — **29 SVG** à trait, 7,8 Ko au total (274 octets en moyenne). Trait 2–2,4, `stroke-linecap: round`, boîte 24 × 24. Deux glyphes pleins seulement : `play` et `star`.
- Le composant `Icon` porte **36 glyphes** en ligne, dont ceux-ci. Deux sont des **emprunts déclarés à Lucide** (`heart`, `repeat`) : le kit source ne les dessine pas. À valider ou remplacer.
- **Aucune image bitmap décorative dans tout le système.** Pas de photo, pas de vignette, pas de texture — les emplacements de photographie sont des dégradés portant une étiquette « Photographie réelle à faire ». C'est ce qui tient le budget de 900 Ko.
- Le logo n'existe qu'en PNG surdimensionné (voir § 8). `Wordmark` rend la marque en type pur, sans fichier.

---

## 12 · Fichiers de référence

`reference/` — 26 fichiers HTML, avec les modules JS et le bundle qu'ils chargent. Ouvrez-les
directement dans un navigateur : ils sont autonomes, hormis les CDN React et Babel.
Le CSS y pointe sur `../css/styles.css`, donc les jetons du paquet.

**Écrans du produit**

| Fichier | Contenu |
|---|---|
`quatre-ecrans.html` | accueil, catalogue vide, catalogue plein, fiche formation |
`paiement-quatre-ecrans.html` | moyen de paiement, attente, échec, succès |
`apprentissage-cinq-ecrans.html` | espace, lecteur, notes, certificat, vérification publique |
`club-huit-onglets.html` | les huit onglets du Club |
`club-public-trois-ecrans.html` | Club, page publique mobile |
`media-quatre-ecrans.html` | pôle média |
`rysmo-deux-ecrans.html` | conversation et mémoire de profil |
`tpe-trois-ecrans.html` | Présence Digitale : offre, devis, grille |
`agence-deux-ecrans.html` | agence, confirmation |
`editorial-trois-ecrans.html` | blog, article, FAQ |
`compte-cinq-ecrans.html` | connexion, création, mot de passe, préférences, suppression |
`etats-cinq-ecrans.html` | chargement, vide, erreur, hors connexion, 403 |
`apropos-deux-ecrans.html` | à propos, contact |
`pwa-quatre-ecrans.html` | version installable |
`mode-sombre.html` | douze écrans en nuit |
`prototype-argent.html` | **prototype cliquable** — accueil → certificat, transitions réelles |
`points-de-rupture.html` | tablette 1000, desktop 1400, et la règle des 68 caractères |
`site-public.html` | site public, quinze pages |
`bilingue.html` | FR / EN côte à côte, article anglais, table des routes |
`console-motif.html` | console admin : le motif et cinq instances |

**Planches de référence**

`planche-systeme.html` (jetons + 19 composants) · `planche-mouvement.html` (quatre durées, exemples manipulables) · `planche-transitions.html` (six transitions en images clés) · `planche-micro-interactions.html` (huit micro-interactions en avant/pendant/après) · `planche-moments.html` (les deux moments scénarisés).

---

## 13 · Voix — l'essentiel en dix lignes

- **Tutoiement intégral, première personne du singulier.** « Je » est une personne réelle, pas une marque. Jamais de « nous » : il inventerait une équipe.
- **Nommer la contrainte plutôt que la masquer.** « Je préfère te le dire que te faire cliquer dans le vide. »
- **Aucune preuve sociale, jamais.** Ni note, ni nombre d'élèves, ni taux de réussite, ni témoignage, ni logo client. Ces chiffres se vérifient en trente secondes.
- **Les zéros s'affichent, datés.** « 0 certificat émis · relevé du 30/08 » est une information ; un tiret n'en est pas une.
- **Un message d'erreur ne s'excuse pas :** motif réel, conséquence, sortie. Dans cet ordre.
- **Un écran vide est une invitation à agir**, pas une excuse.
- **Le prix est toujours cadré au mois ET à l'année.** Mensualisé il relève de l'achat impulsif, annualisé il franchit un seuil de délibération.
- **Aucun emoji, nulle part.** Les glyphes sont des SVG ; les unicodes décoratifs se limitent au point médian `·` et aux guillemets français.
- **Ne jamais promettre un e-mail :** le produit n'a aucun canal d'envoi. « Préviens-moi », « on t'envoie », « tu recevras » sont à traquer.
- **Français d'ici, pas de plaquette.** « Cosmétique Almadies », pas « solution innovante ».
