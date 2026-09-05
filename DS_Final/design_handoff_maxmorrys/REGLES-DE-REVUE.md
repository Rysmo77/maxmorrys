# Règles de revue de code — Max-Morrys

Six règles. Elles ne sont pas des préférences : chacune corrige un défaut qui a été
**observé** dans le rendu, pas anticipé sur le papier. Une entrée qui en viole une est
refusée, quel que soit le rendu visuel.

---

## 1 · Une seule surface floutée : le chrome qui ne défile pas.

> **Note sur l'énoncé.** Le brief demandait « jamais plus de **deux** surfaces floutées ». Cette
> règle est plus stricte, et ce n'est pas un durcissement arbitraire : c'est le **second volet du
> brief** — « jamais de flou sur un élément qui défile » — poussé jusqu'au bout. Sur mobile, tout
> défile, panneau héros compris. Il ne reste donc qu'une famille debout, et **plus aucun quota à
> compter** : le prédicat est binaire, donc vérifiable sans jugement.

**La règle.** `backdrop-filter` n'a droit qu'aux surfaces qui **ne défilent pas avec le
contenu**. **Zéro** flou sur un élément situé dans un conteneur qui défile.

Cette règle autorisait d'abord « deux surfaces, dont un héros ». Le second volet l'a absorbée :
sur mobile, tout défile — héros compris. Il ne reste donc qu'une famille, et **plus aucun quota
à compter**.

**Comment vérifier.** À la main, en console, sur chaque écran :

```js
[...document.querySelectorAll('*')].filter(e => {
  const f = getComputedStyle(e).backdropFilter;
  return f && f !== 'none' && e.getBoundingClientRect().height > 0;
}).length                                     // doit être ≤ 2

// Et : aucune de ces surfaces ne doit avoir un ancêtre en overflow-y: auto|scroll.
```

**Pourquoi.** Le poids réseau d'un flou est nul, donc il n'apparaît dans aucun audit de
poids. Mais `backdrop-filter` sur un conteneur défilant force un recompositing **par
image** de toute la pile derrière lui. Sur le profil d'appareil visé — 2 Go de mémoire,
4 cœurs — c'est le poste le plus coûteux du produit.

**Ce qu'on utilise à la place.** Le **faux verre** : `--surface-card-flat`, blanc à 78 %,
**aucun flou**. Visuellement quasi identique sur un maillage flou ; gratuit à faire défiler.
Toute liste, tout fil, toute grille de cartes l'utilise.

### Le flou n'a droit qu'au chrome en position fixe

La première version de cette règle autorisait « deux surfaces ». En la faisant appliquer, le
second volet l'a rendue plus simple : **sur mobile, tout défile** — y compris le panneau
héros. « Zéro flou sur un élément qui défile » ne laisse donc qu'une seule catégorie debout.

> **Le flou n'a droit qu'à une surface qui NE DÉFILE PAS avec le contenu.**
> En production, cela veut dire `position: fixed` ou `sticky`. Dans les maquettes à cadre de
> 390 × 844, la barre d'onglets est en `absolute` dans le cadre et la barre haute du site en
> `relative` dans une page qui ne défile pas — même résultat, et c'est le résultat qui compte,
> pas le mot-clé. Partout ailleurs, c'est un défaut : aucun quota à compter.

En pratique, deux surfaces seulement y ont droit : la **barre haute** du site et la **barre
d'onglets basse** de l'application. Le contenu passe réellement dessous — c'est le seul
endroit où le flou porte du sens plutôt que du décor.

Tout le reste est en **faux verre** : voile plus couvrant, aucun flou. Les voiles ont été
relevés pour compenser, parce que le flou adoucissait le maillage et que sans lui il remonte :

| Surface | Voile avant | Après | Était |
|---|---|---|---|
| `.glass-hero` | `.45` | **`.58`** | `blur(30px)` |
| `.glass-d` (nuit) | `.62` | **`.72`** | `blur(22px)` |
| `.truth` | `.5` | **`.72`** | `blur(10px)` |
| `--btn-ghost-bg` | `.6` | **`.74`** | `blur(14px)` |
| `.dk .glass` / `-hero` / `-flat` / `.truth` | `.075 / .055 / .055 / .045` | **`.09 / .08 / .07 / .06`** | — |

**Le plancher de `.45` n'a pas été abaissé — il a été recalculé.** Il avait été mesuré *avec*
le flou ; sans lui, il faut `.58` pour le même contraste. Le jeton reste obligatoire.

### Où le défaut se cachait vraiment

Les 21 surfaces de la page du Club ne venaient pas des écrans : elles venaient de **huit
composants** qui portaient chacun un flou en ligne, légitime seul, fatal cumulé.

| Composant | Était | Pourquoi il l'a perdu |
|---|---|---|
| `ChatBubble` | `blur(14px)` | **Répétée ET dans un fil qui défile** : elle violait les deux volets à elle seule. |
| `Button` ton `ghost` | `blur(14px)` | Trois boutons fantômes suffisaient à saturer le budget sans qu'aucune carte soit en cause. |
| `IconButton` | `blur(14px) saturate(160%)` | Deux à trois par écran, 42 px de diamètre. |
| `PillButton` | `blur(12px)` | Idem. |
| `MediaCard` | `blur(24px)` | Carte de **grille** : un flou par carte, par image. |
| `SearchPill` | `blur(24px)` | Ce n'est pas du chrome fixe — rien ne passe dessous. |
| `GlassPanel` niveau `hero` | `blur(30px)` | Il défile. |
| `.truth` (encart de vérité) | `blur(10px)` | Présent sur une quarantaine d'écrans. À 10 px il n'apportait rien. |

**La leçon de revue :** un flou n'est jamais coûteux à l'endroit où on l'écrit. Il le devient
à l'endroit où le composant est **répété**, et l'auteur du composant ne voit pas cet endroit.
La règle se vérifie donc **par écran assemblé**, jamais par composant isolé — et sur les
**deux** kits, pas seulement sur celui qu'on vient de toucher.

### État mesuré

Comptage sur écrans assemblés : surfaces à `backdrop-filter` non nul, de hauteur > 0.

| Écran | Avant | Après | dont défilantes |
|---|---|---|---|
| Site — Club des Digitos | **21** | **2** | 0 |
| Site — FAQ | **8** | **2** | 0 |
| Site — Accueil, Contact, Présence, Fiche | 2 à 3 | **1 à 2** | 0 |
| Site — Pôle média | **6** | **1** | 0 |
| App — Club, 8 onglets | jusqu'à **7**, dont 5 défilantes | **1** au total sur les 8 | **0** |
| App — Rysmo, 2 écrans | 3, dont 2 défilantes | **1** | **0** |
| App — mode sombre, 12 écrans | — | **4** au total | **0** |
| Console — 7 écrans | jusqu'à 6 par écran | **0** | **0** |

Les correctifs vivent dans les composants et dans `tokens/`, donc ils valent pour les
**quarante-deux écrans** d'un coup. Aucun écran n'a été redessiné.

---

## 2 · Plancher d'opacité du verre clair : 0,58. Jeton obligatoire.

> **Note sur l'énoncé.** Le brief demandait **0,45**, et c'était la bonne valeur au moment où il
> a été écrit. Le plancher n'a pas été assoupli — il a été **recalculé** quand le panneau héros a
> perdu son flou (règle 1) : `.45` suffisait tant que le flou adoucissait le maillage sous le
> texte. Sans lui, le lobe remonte, et il faut **`.58`** pour le même contraste mesuré. Le
> plancher est une conséquence de la règle 1, pas une préférence.

**La règle.** Aucune valeur d'opacité de verre écrite à la main. Uniquement :

| Jeton | Valeur | Usage |
|---|---|---|
| `--glass-a` | `.62` | **chrome uniquement** — barre haute, barre d'onglets. La seule surface qui garde le flou. |
| `--glass-a-hero` | `.58` | héros — carte de prix, formulaire principal. **Sans flou** : il défile. |
| `--glass-a-flat` | `.78` | faux verre — listes, fils, grilles, encarts, panneaux |
| `--glass-d-a` | `.72` | verre nuit (sur encre), **sans flou** |

En mode sombre, la recette s'inverse : le verre nuit descend à **7,5 % de blanc**. Sur fond
sombre, un voile léger suffit à détacher une surface ; un voile épais la fait flotter comme
un carton.

**Pourquoi 0,58 et pas moins.** En dessous, le texte secondaire passe sous 3:1 sur un lobe
de maillage saturé. Le plancher n'est pas esthétique, il est mesuré — et il a été **recalculé**
quand le héros a perdu son flou : `.45` suffisait tant que le flou adoucissait le maillage.

**Ce que le flou ne fait pas.** Ce qui fait qu'un verre a l'air d'un verre n'est pas le
flou, c'est le **liseré de lumière de 1 px** en haut (`--glass-hl`), la bordure blanche à
55 % et le `saturate(170%)`. Sans la saturation, le flou délave le maillage et tout devient
gris. Ne retirez jamais `saturate()` en croyant optimiser.

---

## 3 · `transform` et `opacity` seulement.

**La règle.** Une animation ou une transition ne porte que sur `transform` et `opacity`.
Animer `width`, `height`, `top`, `left`, `margin`, `padding` fait échouer la revue.

**Comment vérifier.**

```bash
# Doit ne rien renvoyer :
grep -rnE '(transition|animation)[^;]*\b(width|height|top|left|margin|padding|inset)\b' src/
```

**L'exception unique, déjà écrite.** Le remplissage d'une barre de progression et le curseur
du fil de lecture animent `width` — c'est le seul cas où `transform: scaleX()` déformerait
le contenu. Les deux vivent dans `brand/motion.css` (`@keyframes barfill`, `.prog-fill`),
sont bornés à un élément de 3 à 8 px de haut sans enfant, et n'ont pas à être réécrits.
Aucune nouvelle exception.

**Interdits associés.** Aucun détournement du défilement. Aucune information portée par le
survol seul — sur mobile, le survol n'existe pas ; il ne fait que confirmer une cible, sur
pointeur fin.

---

## 4 · `prefers-reduced-motion` et `prefers-reduced-transparency` : une fois, globalement.

**La règle.** Ces deux requêtes média sont câblées **une seule fois**, dans
`brand/fallback.css`, et ne sont **jamais** réintroduites dans un composant.

`prefers-reduced-motion` ramène **toutes** les durées à `1ms`, dérive du maillage comprise.
Les jetons `--t-tap`, `--t-ui`, `--t-enter`, `--t-scene` sont réécrits à la racine : un
composant qui lit le jeton hérite du réglage sans le savoir.

**Comment vérifier.**

```bash
# Doit renvoyer exactement un fichier : brand/fallback.css
grep -rln 'prefers-reduced-motion\|prefers-reduced-transparency\|@supports not ((backdrop' src/
```

**État constaté à la revue :** la règle était violée **quatre fois** — `prefers-reduced-motion`
et `prefers-reduced-transparency` étaient déclarés dans `brand/base.css` **et** dans
`brand/fallback.css`, `@supports not (backdrop-filter)` dans `brand/surfaces.css` **et** dans
`fallback.css`, et le bloc `.lowfi` dans les deux. Les valeurs différaient (`.92` contre `.94`,
`.9` contre `.88`) : c'est l'ordre des `@import` qui tranchait. Tout est consolidé dans
`fallback.css` ; `base.css` est revenu à son rôle de réglages de document.

### Un repli ne compense QUE ce qui se perd

Deuxième erreur de la même famille : les trois blocs listaient encore `.glass-hero`, `.truth`
et `.glass-d`, qui n'ont plus de flou. Leur opacité de repli compensait donc une perte
inexistante, et la compensation comptait **double** : sur un appareil à 2 Go — *le* profil du
marché — la carte de prix passait de 58 % à 90 % de blanc, l'encart de vérité de 72 % à 88 %.

**La translucidité de ces surfaces est désormais une décision de conception, plus un artefact
du flou : elle doit survivre au repli.** Les trois blocs ne touchent donc plus que `.glass`.

Une nuance retenue : `prefers-reduced-transparency` **densifie quand même** les surfaces sans
flou, parce que la personne demande explicitement moins de transparence — c'est une demande,
pas une compensation. `.lowfi`, lui, est une mesure de **performance** : il coupe le flou et
fige la dérive, et laisse les voiles de conception intacts.

**Pourquoi.** Une deuxième déclaration locale gagne par spécificité ou par ordre, et
rétablit silencieusement l'animation pour l'utilisateur qui l'a explicitement refusée. Le
défaut est invisible pour qui n'a pas activé le réglage — donc pour toute l'équipe.

---

## 5 · Le repli « appareil modeste » coupe le flou, fige le maillage, **et connaît le thème**.

**La règle.** La détection est en JS, une seule fois, au plus tôt :

```js
const m = navigator.deviceMemory, c = navigator.hardwareConcurrency;
if ((m && m <= 2) || (c && c <= 4)) document.documentElement.classList.add('lowfi');
```

`.lowfi` coupe `backdrop-filter` partout et fige la dérive du maillage
(`.lowfi .mesh b { animation: none }`).

**Le point qui a été manqué une fois.** Le repli **doit lire le thème**. Une règle qui force
un fond blanc à 90 % sans regarder le mode affiche, sur un téléphone d'entrée de gamme en
mode sombre, **toutes ses surfaces de verre en blanc**. Les trois lignes qui corrigent ça
sont dans `brand/fallback.css` :

```css
.lowfi .dk .glass, .lowfi .dk .glass-hero { background: rgba(255,255,255,.11) !important }
.lowfi .dk .glass-flat, .lowfi .dk .truth { background: rgba(255,255,255,.09) !important }
.lowfi .dk .tabbar, .lowfi .dk .search    { background: rgba(20,25,32,.96)   !important }
```

Toute nouvelle surface de verre doit avoir **son pendant `.lowfi .dk`**. Une surface sans
pendant est un carton blanc en mode sombre sur l'appareil le plus courant du marché visé.

Ce n'est pas un cas limite : `deviceMemory ≤ 2` **est** le profil du marché.

**Dans les maquettes de référence, ce repli est du code mort** — seules deux planches
(`planche-mouvement.html`, `mode-sombre.html`) posent la classe. C'est assumé : une maquette
n'a pas de budget de performance. **En production, la détection est obligatoire**, et elle doit
tourner au plus tôt : posée après le premier rendu, elle laisse passer une image floutée sur
l'appareil qu'elle est censée protéger.

**Un repli ne compense que ce qui se perd.** Les trois blocs ne touchent que `.glass` et
`.mm-chrome`. Y laisser une surface déjà sans flou comptait la compensation deux fois : la carte
de prix passait de 58 % à 90 % de blanc sur le profil du marché, sans aucune raison technique.
La translucidité du héros, du faux verre et du verre nuit est une **décision de conception**, pas
un artefact du flou : elle survit au repli.

**Et un flou en style inline échappe aux trois blocs.** La barre d'onglets déclarait le sien en
ligne : aucun sélecteur ne l'atteignait, donc le repli ne coupait rien sur la seule surface encore
concernée. Elle porte pour cela la classe `mm-chrome`. Toute nouvelle surface floutée doit avoir
une classe d'accroche.

---

## 6 · Un nombre en monospace vient de la base ou d'une source citée.

**La règle.** La fonte monospace (`--f-mono`, classe `.mm-num`) est réservée aux nombres
**vérifiables**. Un nombre qui ne peut pas prendre cette fonte **ne s'affiche pas**.

**Ce qui découle de la règle :**

- **Un zéro daté est une valeur.** « 0 certificat émis · relevé du 30/08 » s'affiche.
  Un tiret, un « — », un « N/A » n'en sont pas.
- **Aucun chiffre de démonstration, même en placeholder.** Un faux nombre finit toujours en
  production.
- **Toute case de relevé porte sa date.** Une case sans date affiche « non relevé », jamais
  une estimation.
- **Interdits absolus, sans exception** : note en étoiles, nombre d'avis, nombre d'élèves ou
  d'inscrits, taux de réussite, témoignage, logo client, « rejoint par N personnes ». Ce
  n'est pas une préférence de ton : ces chiffres se vérifient en trente secondes, et un
  visiteur qui les prend en défaut ne revient pas.
- **Le montant débité est celui recalculé côté serveur**, jamais celui transmis par le
  navigateur. Un prix affiché est un affichage ; un prix débité est une décision serveur.

**Comment vérifier.** À la revue, pour chaque `.mm-num` : nommer la requête ou la source qui
produit la valeur. Si personne ne sait, la valeur sort de l'écran.

---

## Ce que ces six règles ont en commun

Aucune ne se voit sur une capture d'écran. Le flou de trop, le repli qui ignore le thème,
la durée réintroduite localement, le chiffre inventé : tous rendent correctement sur la
machine de qui les écrit. Ils ne se manifestent que sur l'appareil, le thème, le réglage
d'accessibilité ou le fuseau de quelqu'un d'autre.

C'est pour ça qu'elles sont dans un fichier de revue et pas dans une note de style.

---

## 7 · Une seule déclaration de `padding` par objet de style

**La règle.** Ne jamais déclarer une propriété longue puis son raccourci dans le même objet de
style React. Et `boxSizing:'border-box'` dès qu'une boîte combine `height:100%` et du
rembourrage.

```jsx
// REFUSÉ — le raccourci écrase paddingTop, en silence
style={{paddingTop:'73px', padding:'0 22px', marginTop:'73px', height:'100%'}}
// ACCEPTÉ
style={{boxSizing:'border-box', padding:'73px 22px 0', height:'100%'}}
```

**Pourquoi.** Dans un objet JS, la dernière clé gagne : la propriété longue devient du code
mort, sans erreur ni avertissement. Le décalage se retrouve alors porté par une `marginTop`,
qui **déplace** la boîte au lieu de la creuser — et avec `height:100%`, elle déborde de la
marge exactement. Le contenu du bas est coupé par l'`overflow:hidden` du cadre.

**Ce que ça a coûté.** Sur l'écran verrouillé du kit natif, 35 % du lecteur sur iOS et 21 % sur
Android : la rangée de commandes `−15 / ⏸ / +15`, entièrement hors cadre. C'est-à-dire
précisément la fonctionnalité qui justifiait l'écran.

**Comment le repérer.** `grep` sur `paddingTop:[^,}]+,\s*padding:` et ses variantes
(`marginTop`/`margin`, `background`/`backgroundColor`). Trois occurrences existaient dans un
même fichier de 27 écrans, écrites à quelques minutes d'intervalle : c'est une faute qui se
répète tant qu'on ne la nomme pas.

---

## 8 · Ne jamais recopier un composant pour changer une seule chose

**La règle.** Si un composant du système fait presque ce dont vous avez besoin, **ajoutez-lui la
prop qui manque** ; ne le réimplémentez pas en ligne. Une réimplémentation ne diverge jamais sur
la seule valeur qui motivait la copie.

**Ce que ça a coûté ici.** `ChipRow` a été recopié à la main dans trois écrans, chaque fois pour
obtenir un débordement différent (défilement horizontal en mobile, passage à la ligne en
desktop) que le composant ne proposait pas. Les trois copies ont dérivé sur des valeurs qui
n'avaient rien à voir avec le motif de la copie :

| | Hauteur | Écart | Rembourrage | Fonte |
|---|---|---|---|---|
| `ChipRow` | 40 | 8 (`--touch-gap`) | 16 | 13 |
| Club verrouillé (mobile) | **34** | **6** | **13** | **12,5** |
| `ClubFrame` (desktop) | **38** | **6** | **15** | 13 |
| Suggestions de nom | 40 | 8 | **15** | 13 |

Le cas mobile était le plus grave : **34 px sous un plancher de cible tactile de 44**, sur une
bande d'onglets qui était l'interaction principale de l'écran. Aucune des trois valeurs de
hauteur — 34, 38 — n'existe ailleurs dans le système.

**Le remède.** Une prop `layout: 'clip' | 'scroll' | 'wrap'` sur `ChipRow`, et les trois écrans
l'appellent. Un choix à trois issues nommées plutôt que deux drapeaux qui peuvent se
contredire — `scroll` et `wrap` ensemble n'aurait aucun sens.

**Comment le repérer.** `grep` sur `borderRadius:'var(--r-pill)'` suivi de `height:'` dans le
même objet de style : une pilule dont la hauteur est écrite à la main est presque toujours un
composant recopié. Dans un projet qui **est** le design system, une divergence de composant à
l'intérieur de son propre kit est exactement ce que le système existe pour empêcher.
