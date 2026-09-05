# Max-Morrys — système de design

Système de design de la plateforme **maxmorrys.me**, opérée par **MY ONOMA SARL** depuis Dakar.
Il est dérivé, valeur par valeur, des trois kits de design fournis et du PRD révision 4 du
30 août 2026. **Les kits sont la source de vérité** : quand une valeur d'ici diffère d'une
convention de bibliothèque connue, c'est le kit qui gagne.

## 1. Le produit, en bref

Max-Morrys est une plateforme d'éducation au marketing digital, au SEO et à l'IA, destinée aux
francophones d'Afrique de l'Ouest et à leur diaspora. Elle est déployée, bilingue FR/EN, et
outillée pour cinq lignes de revenu :

| Ligne | Prix | Territoire de marque |
|---|---|---|
| Formations (LMS) | 95 000–200 000 FCFA, achat unique | **Je te forme** — bleu |
| Contenu gratuit écrit (blog, FAQ) | gratuit | **Je t'informe** — orange |
| Podcast et vidéos | gratuit | **Je te transforme** — violet |
| Club des Digitos | 19 900 FCFA/an ≈ 1 658/mois | **Je te transforme** — violet |
| Le répétiteur IA | packs 500–3 500 · abos 3 000/7 500 FCFA | **Je te transforme** — violet |
| Présence Digitale (TPE) | packs 250 000 / 450 000 / 750 000 FCFA | **Je te digitalise** — teal |
| Max-Morrys Agency | high-ticket, aucune grille publique | hors territoire — pas de couleur propre |

**Ce que le système doit porter, et qui n'est pas cosmétique.** Au relevé du 30 août 2026, la
plateforme n'a jamais encaissé un franc, son catalogue ne contient aucune formation publiée,
et 46 articles sont publiés. Le produit est **construit et déployé, jamais exploité**. Le
système de design en tient comppartout : pas de preuve sociale inventée, pas de nombre non
sourcé, des états vides qui disent la vérité plutôt que de la maquiller.

### Surfaces représentées

**Le rangement des territoires.** Le blog et la FAQ donnent une **méthode** : c'est « Je t'informe ». Le podcast et les vidéos donnent une **voix** — quelqu'un qui raconte ce qu'il a fait — et ils vivent sous « Je te transforme », au même étage que le Club : *tu écoutes gratuitement ceux qui l'ont fait, puis tu rejoins ceux qui le font.* Ce territoire mêle donc du gratuit ouvert et du payant fermé ; trois garde-fous lèvent l'ambiguïté — une sous-navigation en tête (`SubNav`), le mot « gratuit » dans le premier écran, et le passage vers le Club en bas de page, jamais devant.

**Deux tableaux de bord, deux rôles.** L'**espace apprenant** (`Espace`) et la **console
admin** (`DashboardOps`) existent en 390 px dans leurs kits respectifs, et en **1440 px** dans
`ui_kits/responsive/tableaux-de-bord.html` — trois colonnes chacun. Ce que la largeur apporte
est différent de chaque côté : côté apprenant, le répétiteur passe d'une carte qu'on ouvre à un
panneau permanent ; côté console, le détail d'un prospect cesse d'être un écran séparé, donc la
file reste visible pendant qu'on traite. Dans les deux cas la largeur sert la **navigation**,
jamais la longueur de ligne.

Trois rôles n'existent pas, à dessein : pas de tableau de bord **formateur** (Max-Morrys opère
seul, il *est* l'administrateur), pas d'**espace client TPE** (le devis est consultable par URL
sans compte — lui donner un espace obligerait à créer des comptes pour des gens qui n'en
veulent pas), et **aucun graphique** dans la console, qui répond à « qu'est-ce qui bloque
aujourd'hui » et non à « comment ça évolue » : avec 5 comptes et 0 certificat, une courbe
serait du décor.

1. **Plateforme, espace apprenant** — application web mobile (390 px) : 20 routes publiques,
   10 onglets d'espace, lecteur de cours, tunnel d'achat, certificat.
2. **Site public** — les mêmes routes en desktop (1280 px), quinze pages entières : navigation, sections, pied de page. L'**agence vit hors des quatre verbes** — séparateur dans la barre haute, entrée en corail : elle ne se range pas sous « Je te digitalise », c'est une autre promesse et un autre client.
3. **Console d'administration** — 19 écrans, verre nuit sur maillage sombre, dont 5 ouverts au
   rôle `support`.

Il n'y a **pas d'application mobile native** (hors périmètre) et pas de modèle de présentation :
aucun deck n'a été fourni, aucun n'est produit ici.

## 2. Sources reçues

| Source | Chemin | Ce qu'on en a tiré |
|---|---|---|
| PRD, révision 4 (30/08/2026) | `uploads/prd.md` | Contexte, lignes de revenu, voix de marque, contraintes de contraste et de poids, inventaire des écrans |
| Kit de design v2 | `uploads/maxmorrys-kit-design-v2.html` | **Tous les jetons**, les 4 maillages, les 5 niveaux de verre, le mouvement, 13 écrans |
| Kit lot 3 | `uploads/maxmorrys-kit-lot3.html` | Champs, interrupteur, segments, fil d'Ariane, prose, listes d'administration, états, 24 écrans |
| Kit lot 4 | `uploads/maxmorrys-kit-lot4.html` | Mode sombre (`.dk`), tablette, paires FR/EN, 11 écrans |
| Icône de marque | `uploads/icone-mm.png` → `assets/logo-mm-icon.png` | Le seul fichier de logo existant |

Aucun dépôt Git, aucun fichier Figma, aucun binaire de fonte n'a été fourni. Les liens et chemins
ci-dessus sont conservés au cas où le lecteur y a accès.

## 3. Fondamentaux de contenu

**Le système de voix est un actif produit, pas un ton de voix.** Toute la navigation publique est
construite au tutoiement autour de « Je te… » : *Je suis Max-Morrys · Je te forme · Je t'informe ·
Je te transforme · Je te digitalise · Contacte-moi*. Chaque territoire de couleur porte un de ces
verbes. Toute copie nouvelle s'y conforme.

- **Tutoiement, sans exception.** « Tu paies en Wave », « Crée ton compte », « Écris-moi ».
  Le vouvoiement résiduel des titres par défaut est une **dette** (FR-110), pas une variante.
- **Première personne du singulier.** C'est une personne qui parle, pas une entreprise :
  « Je préfère te le dire que te faire cliquer dans le vide », « C'est moi qui lis ».
- **Casse.** Titres d'écran en capitales quand ils font trois lignes courtes
  (`JE TE FORME / AU DIGITAL. / DEPUIS DAKAR.`), en casse normale quand ils sont une phrase
  (`Comment tu paies ?`). Sourcils en capitales monospace. Boutons en casse de phrase, sauf la
  pilule « MENU » du chrome.
- **La règle du monospace.** Un nombre affiché en JetBrains Mono vient de la base ou d'une source
  citée. Un nombre estimé ne s'affiche pas. C'est la règle de contenu la plus contraignante du
  système, et elle vient d'un fait : les chiffres de façade (98 % de complétion, 1 486 étudiants,
  45 M XOF) étaient contredits par la base de production.
- **L'encart de vérité remplace la preuve sociale.** Chaque écran de vente porte un bloc
  « Ce que je peux te prouver » / « Ce que je n'affiche pas » qui nomme ce qui manque :
  *« Je n'affiche ni note ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai rien
  d'honnête à en dire. »* C'est un composant (`GlassPanel level="truth"`), pas une figure de style.
- **Les états vides invitent à agir.** « Aucune formation n'est encore en ligne. » puis l'action.
  Jamais « oups », jamais d'excuse, jamais de rond qui tourne à la place d'une explication.
- **Ce qu'on ne promet pas.** Aucun « préviens-moi par e-mail » : le produit n'a **aucun canal
  d'envoi** (R-14). Un interrupteur désactivé et une ligne grisée le disent, au lieu de le cacher.
- **Prix toujours cadrés.** 19 900 F/an s'écrit `1 658 FCFA / mois` avec la mention annuelle en
  dessous. 95 000 F s'écrit « Une fois, accès à vie ». Le prix d'entrée TPE réellement pratiqué est
  250 000, pas 295 000.
- **Aucun emoji, nulle part.** Les glyphes sont des SVG à trait ; les unicodes décoratifs sont
  limités au point médian `·` (séparateur de métadonnée) et aux guillemets français.
- **Anglais : réécrit, pas traduit.** L'anglais n'a pas de tutoiement ; la familiarité passe par la
  contraction et le verbe à particule : *I'll train you · I'll keep you posted · I'll push you
  further · I'll get you online · Talk to me*. Les titres d'affichage sont **écrits par langue**,
  avec leurs propres coupures de ligne (le français court ~18 % plus long).

## 4. Fondations visuelles

**L'idée directrice : la couleur devient l'espace, le contenu flotte dessus.** Les quatre teintes
du logo ne sont pas des aplats posés sur du blanc — elles *sont* le fond, sous forme d'un maillage
de dégradés en dérive lente, sur lequel toute l'interface flotte en verre dépoli.

### Couleur

Quatre teintes, une par territoire : bleu `#0057BC`, orange `#F38B0A`, violet `#6C23DD`,
teal `#02AC9C`, plus un corail `#FF6E7F` réservé aux maillages et aux cartes rose. Encre
`#0E1116`, papier `#FFFFFF`. Trois états : `#0F7B52`, `#8A4B00`, `#B4231F`.
Le violet a aussi une version texte, `#5A17BE`, introduite par la page publique du Club pour les prix et les coches sur verre clair. **La sémantique d'état s'inverse de la même façon** : `--ok` `#0F7B52`, `--warn` `#8A4B00` et `--stop` `#B4231F` tombent à 3,4:1, 4,1:1 et 2,6:1 sur `#0B0E13` — la portée `.dk` les remplace par `#4ADE9B`, `#FFB24D` et `#FF8A80` (11,0:1, 10,8:1, 7,9:1). C'est le même piège que les quatre teintes du logo, sur une famille qu'on oublie parce qu'elle ne fait pas partie de la marque. Deux contraintes dures : **le teal atteint 2,6:1 sur blanc et est interdit pour du texte**
(versions texte `#00695E` et `#8A4B00`), et **sur fond noir le bleu tombe à 2,84:1, le violet à
2,69:1** (versions nuit `#6FB1FF` et `#B98CFF`). Maximum deux fonds par écran : le maillage, et le
verre. Pas de troisième couleur de surface.

### Fonds

Un **maillage** par territoire : trois lobes de 340 px (520 sur écran large), `filter: blur(52px)`,
en dérive désynchronisée sur 25 à 37 secondes, animés en `transform` uniquement. Chacun mêle la
teinte du territoire à deux voisines **prises dans le logo** — jamais une couleur venue d'ailleurs.
Par-dessus, un voile de lisibilité qui monte de 42 % en haut à 90 % en bas : *le texte du bas de
page est toujours sur un fond presque blanc, la couleur reste en haut où il n'y a que des titres.*
Poids : **0 octet** — c'est ce qui remplace la vidéo d'accueil en autoplay de 2 à 6 Mo (FR-109).
Pas de photographie de fond, pas de motif répété, pas de texture, pas de grain, pas
d'illustration : le dépôt n'en contient aucune.

### Transparence et flou — budgétés, pas interdits

Six niveaux : **chrome** (le seul à porter un flou, `saturate(170–180%)`), **héros** — prix et
formulaire principal, **faux verre** — listes, fils et grilles, **nuit**, **encre**, et
l'**encart de vérité**.

La distinction **nuit / encre** vaut d'être retenue : `night` est un *voile* et suppose une page
déjà sombre ; posé sur une page claire il compose avec elle et remonte à un gris moyen où aucun
texte ne tient. `ink` est *opaque* et ouvre sa propre portée `.dk` — c'est ce qu'il faut pour une
carte sombre sur une page claire, comme le bilan d'abonnement du Club. Les quatre derniers n'ont aucun flou : leur voile est plus couvrant à la place.

**Les opacités et les flous ne sont écrits qu'à un seul endroit**, `tokens/glass.css` et
`brand/surfaces.css`. Ils ne sont volontairement répétés nulle part ailleurs — six fichiers les
redisaient en prose, et quatre avaient dérivé du CSS réel au fil des corrections. Pour les lire,
ouvrez la fiche **« Niveaux de verre »** : elle les **sonde** dans la feuille de styles appliquée,
en mode normal et sous `.lowfi`.

Ce qui fait qu'un verre a l'air d'un verre n'est pas le flou : c'est le liseré de lumière de 1 px
en haut, la bordure blanche à 55 %, et la saturation — sans elle, le flou délave le maillage et
tout devient gris. C'est pour ça que quatre niveaux sur cinq s'en passent sans rien perdre.

### Le mode sombre n'est pas une transposition

Fond `#0B0E13`. Texte `#ECF0F5` / `#A2ADBB` / `#77828F`. Le verre garde **exactement la même
recette** — bordure, liseré, flou, saturation — et **effondre son opacité : blanc à 7,5 % au lieu
de 62 %**. Sur fond sombre un voile léger suffit à détacher une surface ; un voile épais la fait
flotter comme un carton. Le liseré de lumière de 1 px, lui, ne change pas : c'est lui qui porte
l'effet, dans les deux modes.

**Le piège.** Deux des quatre teintes du logo deviennent illisibles : le bleu `#0057BC` tombe à
**2,84:1** et le violet `#6C23DD` à **2,69:1** — interdits en texte. C'est *l'inverse exact* du
mode clair, où ce sont l'orange (2,47:1) et le teal (2,84:1) qui sont interdits. Les quatre
variantes nuit — `#6FB1FF` (8,66:1), `#B98CFF` (7,60:1), `#FFB24D` (10,79:1), `#3FD9C6` (11:1) —
sont donc des **jetons distincts déclarés en valeur** dans `.dk`, pas un filtre appliqué à la
palette claire. Une palette ne se transpose pas d'un fond à l'autre.

Corollaires : les versions « texte » du mode clair (`#00695E`, `#8A4B00`, `#5A17BE`) sont des
teintes *foncées* et pointent, en sombre, sur la variante nuit correspondante. Les cartes
territoire gardent leurs couples de teintes portés à leur version profonde (`#12294D → #241C4E`
pour Forme, etc.) et **leur encre s'inverse avec eux** — d'où les jetons `--card-ink` et
`--card-ink-2` : aucune couleur de texte n'est codée en dur dans `TerritoryCard`. Le maillage
garde ses lobes et inverse son voile : encre à **42 %** en haut, **94 %** en bas.

Le thème est une **portée CSS** (`.dk`), jamais une variante de composant : aucun écran n'est
redessiné. `data-mm-dark` sur `<html>` décline la totalité du produit.

**Aucun composant ne prend de prop de thème.** Une prop `dark` est un piège : elle doit être
passée à la main partout, personne ne le fait, et le composant retombe silencieusement sur sa
valeur claire — un disque de chrome à 60 % de blanc sous un glyphe `#ECF0F5` donne **1,4:1**, dans
les douze écrans à la fois. Les surfaces de chrome et de contrôle lisent donc des jetons qui
basculent seuls : `--chrome-bg`, `--tabbar-bg`, `--ctl-off-bg`, `--field-bg`, `--pill-bg`,
`--bubble-bg`, `--nav-on-bg`, `--seg-on-bg`.

Même règle pour les **remplissages neutres** — pistes de barres, puits d'icônes, points d'étape,
anneaux « à faire », tirets de document, squelettes. En clair ce sont des teintes d'**encre**, en
sombre des teintes de **lumière** : d'où l'échelle `--fill-1` à `--fill-5` (+ `--fill-tag`), qui
s'inverse sous `.dk`. Une valeur `rgba(14,17,22,…)` écrite en dur dans un composant est un défaut
de mode sombre garanti : elle disparaît sur `#0B0E13`. Trois exceptions assumées, toutes sur des
surfaces **colorées** qui ne changent pas de mode : le curseur blanc de l'interrupteur, le bouton
de lecture de `MediaCard`, et la pastille blanche de `LogoMark`.

**Le flou n'a droit qu'au chrome en position fixe** — barre haute du site, barre d'onglets
basse, sous lesquelles le contenu passe réellement. `backdrop-filter` exige `position: fixed`
ou `sticky` ; partout ailleurs c'est un défaut. La règle autorisait d'abord deux surfaces dont
un héros, mais son second volet l'a simplifiée : **sur mobile tout défile**, héros compris.

Huit composants portaient un flou en ligne, légitime pris seul et fatal cumulé — `ChatBubble`
(répétée *et* défilante), `Button` ton `ghost`, `IconButton`, `PillButton`, `MediaCard`,
`SearchPill`, `GlassPanel` niveau `hero`, l'encart `.truth`. Tous l'ont perdu, voiles relevés
pour compenser : `--glass-a-hero` .45 → **.58**, `--glass-d-a` .62 → **.72**, `.truth` .5 →
**.72**, `--btn-ghost-bg` .6 → **.74**. Mesuré : Club site **21 → 2**, les huit onglets du Club
mobile **7 → 1 au total**, console **0**. Un flou n'est jamais coûteux là où on l'écrit — il le
devient là où le composant est répété, et l'auteur du composant ne voit pas cet endroit.

Deux règles de revue, et la seconde a absorbé la première : **jamais de flou sur un élément qui
défile** — or sur mobile tout défile, donc il ne reste **qu'une** surface floutée par écran, le
chrome fixe. Il n'y a plus de quota à compter. Et une détection
d'appareil modeste (`deviceMemory ≤ 2` ou `hardwareConcurrency ≤ 4`) pose `.lowfi` sur la racine,
qui coupe le flou et fige le maillage. C'est le profil d'appareil du marché visé — 24 % de
possession de smartphone, coût de la donnée à 4,2 % du RNB par habitant — pas un cas limite.

**Un repli ne compense que ce qui se perd.** Les trois blocs ne touchent que `.glass` et
`.mm-chrome`, les seules surfaces floutées. Le héros, le faux verre et le verre nuit gardent leur
voile de conception même sur appareil modeste : leur translucidité n'est plus un artefact du flou,
c'est une décision. Le détail des valeurs vit dans la fiche « Planche du système », qui les **lit
dans la feuille de styles appliquée** au lieu de les recopier — une spécification qui se décrit
elle-même ne peut plus dériver du code.

**Et un repli doit connaître le thème.** Les trois replis (`@supports`,
`prefers-reduced-transparency`, `.lowfi`) sont déclarés **deux fois chacun** dans
`brand/fallback.css` : une fois pour le mode clair, une fois pour `.dk`. Une règle qui force un
blanc opaque sans regarder le mode fait afficher **toutes** les surfaces de verre en blanc sur un
téléphone d'entrée de gamme réglé en sombre — exactement le profil du marché visé. En sombre, le
repli bascule sur du blanc à **11 %**.
`prefers-reduced-motion` et `prefers-reduced-transparency` sont câblés une fois, globalement.

### Typographie

- **Fraunces 900** pour l'affichage : interlettrage de −.028 à −.045em, interlignage de .9 à 1.02.
  74 / 64 px en desktop, 41 / 30 / 23 px en mobile, 26 px pour les titres de carte territoire.
- **Schibsted Grotesk** pour le corps : 15 px / 1,45 en écran, 14 px / 1,5 pour les chapôs
  (en `--ink-2`), 15,5 px / 1,68 en prose.
- **JetBrains Mono** pour les nombres vérifiés, les sourcils (10,5 px, +.14em, capitales) et les
  métadonnées. Tabulaire, toujours.
- **La colonne de lecture ne dépasse jamais 68 caractères**, quelle que soit la largeur d'écran.
  C'est la seule règle de mise en page non négociable ; l'espace gagné va à la marge.

### Formes, cartes, ombres

Rayons : 10 · 16 · 24 · 30, 26 pour les médias, pilule pour tout ce qui se touche. Les **cartes
territoire** sont la signature : dégradé à deux arrêts, liseré de lumière intérieur en haut, ombre
portée `0 10px 28px rgba(14,17,22,.10)`, un **chevron** découpé en haut qui s'emboîte dans la carte
précédente avec un chevauchement de −14 px — quatre cartes empilées reconstruisent la silhouette du
M du logo en défilant. Au-delà de 700 px de large, l'empilement passe en grille et le chevauchement
disparaît ; au-delà de 1080 px, une rangée de quatre.

Ombres : une seule famille douce et large pour les surfaces (`0 6px 18px` à `0 18px 44px`), plus
des **ombres colorées** sous les boutons dégradés (`0 8px 24px rgba(0,87,188,.34)` et ses variantes
par territoire). Aucune ombre dure, aucun contour marqué, aucun effet de bordure gauche colorée.

### Mouvement

Quatre durées, deux courbes, et rien d'autre : `--t-tap` 120 ms (« j'ai senti ton doigt »),
`--t-ui` 220 ms (« l'état a changé »), `--t-enter` 380 ms (« ceci vient d'arriver »),
`--t-scene` 700 ms (« la page se met en place »). Courbes : `cubic-bezier(.2,.7,.2,1)` pour les
états, `cubic-bezier(.16,1,.3,1)` pour les entrées. Entrée orchestrée en cascade avec 70 ms de
décalage entre voisines, 90 ms entre lignes de titre ; les titres montent sous un masque
(`clip-path`).

**Deux seuls moments scénarisés dans tout le produit**, parce que le mouvement y porte du sens :
l'**attente de paiement** (deux anneaux concentriques en boucle, qui disent « la transaction est
vivante » à quelqu'un revenu de l'app Wave) et l'**émission du certificat** (une brillance balaie
la carte deux fois, puis s'arrête définitivement — non rejouable). Interdits : animer `width`,
`height`, `top`, `left` ; détourner le défilement ; faire porter une information à un survol
(sur mobile, le survol n'existe pas).

### États d'interaction

- **Appui** : `scale(.975)` sur les boutons, `.94` sur les pilules et boutons ronds, `.985` sur
  une ligne de paiement. C'est le retour principal — il y en a toujours un.
- **Survol** : réservé au desktop et au chrome. Un filet de couleur qui apparaît sous une entrée de
  navigation, une opacité qui monte. Jamais de déplacement, jamais d'agrandissement.
- **Focus** : liseré `#0057BC` + anneau `0 0 0 3px rgba(0,87,188,.16)`. Erreur : liseré `#B4231F` +
  anneau rouge, et l'aide du champ passe en rouge.
- **Sélection** : encre pleine (chip actif, radio à bordure de 7 px), jamais une teinte pastel.
- **Désactivé** : fond `rgba(14,17,22,.1)`, texte `--ink-3`, pointeur neutre. Sur un interrupteur,
  l'état désactivé est **porteur de sens** : il déclare une promesse non tenue.

### Imagerie

Aucune photographie n'existe au dépôt, et les portraits du fondateur sont générés par IA — ils
doivent être remplacés (FR-084). En attendant, **les emplacements d'image sont des dégradés de la
marque**, portant une étiquette qui dit ce qui doit venir là (« Photographie à faire · FR-084 »).
Les avatars sont des initiales sur dégradé violet→bleu. Aucune illustration, aucune icône en PNG,
aucune image de banque non tracée.

## 5. Iconographie

- **Un jeu unique, à trait.** 27 glyphes, boîte de 24, `fill: none`, `stroke: currentColor`,
  trait **2,2 px** (2,4 px pour la loupe, le cadenas et les chevrons ; 3,4 px pour la coche),
  caps et jointures rondes. Tailles d'usage : 13–14 px dans une puce de liste, 17–19 px dans un
  bouton rond, 21 px dans la barre d'onglets.
- **D'où ils viennent.** Le kit source dessine ses SVG **en ligne**, sans police d'icônes, sans
  sprite et sans fichiers. Ils ont été extraits verbatim vers `assets/icons/*.svg` (27 fichiers) et
  emballés dans le composant `Icon`. **Aucun glyphe n'a été redessiné.**
- **Substitution déclarée.** Le jeu correspond au style de **Lucide** (même boîte, même trait, mêmes
  caps rondes). Pour un glyphe absent du jeu, prendre Lucide — `https://unpkg.com/lucide-static` —
  et le poser à 2,2 px de trait. Ne pas mélanger deux familles d'icônes sur un même écran.
- **Deux glyphes pleins seulement** : `play` et `star`.
- **Huit glyphes de plus** (`list`, `calendar`, `case`, `info`, `plus` de la page publique du Club ; `chevron` de la page contact ; `globe` de l'accueil) extraits verbatim comme les autres.
- **Deux emprunts déclarés à Lucide** : `heart` et `repeat`, pour les interactions du Club (aimer, republier) — le kit source ne les dessine pas. À valider ou à remplacer.
- **Marques tierces**, en couleurs officielles et jamais recolorées : le logo Google du bouton
  d'authentification (`assets/icons/google.svg`). Wave et Orange Money sont représentés par leur
  **sigle typographique** sur un carré en dégradé (« W » sur `#3FD8FF→#009FE3`, « OM » sur
  `#FFA030→#FF5A00`) — c'est le choix du kit source, aucun logo officiel n'a été fourni.
- **Aucun emoji, aucun caractère unicode utilisé comme icône.**

## 6. Marque et logo

Le seul fichier fourni est `assets/logo-mm-icon.png` : un **M sérif découpé en quatre teintes**
(bleu, orange, teal, violet), 1240 px, fond blanc, **sans transparence**. Il n'existe **ni SVG, ni
version monochrome, ni logotype horizontal, ni version nuit**. Partout où une signature horizontale
est attendue, le kit source rend le nom **en typographie** : `Max` coloré lettre par lettre, puis
`-Morrys` en encre — c'est le composant `Wordmark`. Sur fond sombre, il passe aux teintes nuit.
Sur fond coloré, l'icône PNG doit être posée sur une pastille blanche arrondie (`LogoMark plate`).

**Rien n'a été redessiné ni reconstruit de mémoire.** Si un SVG du logo existe, il remplace le PNG
sans autre changement.

## 7. Fontes — substitution à confirmer

Les trois familles (**Fraunces**, **Schibsted Grotesk**, **JetBrains Mono**) sont celles du kit
source, qui les charge depuis Google Fonts. **Aucun binaire de fonte n'a été fourni** : il n'y a
donc pas de règle `@font-face` locale, et `tokens/fonts.css` importe Google Fonts.
👉 **À confirmer :** si la production doit auto-héberger ses fontes (budget de poids NFR-04 :
≤ 95 Ko, sous-ensemble latin + latin-ext, deux graisses par famille), fournir les fichiers `.woff2`
et remplacer l'`@import` par des `@font-face` locales.

## 8. Index du dépôt

| Fichier / dossier | Contenu |
|---|---|
| `styles.css` | Point d'entrée unique. Uniquement des `@import` |
| `tokens/` | `colors` · `typography` · `spacing` · `radius` · `motion` · `glass` · `semantic` · `dark` · `fonts` |
| `brand/` | `base` (garde-fous) · `mesh` (les 5 maillages) · `surfaces` (les 5 verres) · `fallback` (les 3 replis, **par thème**) · `motion` (entrées, brillance, anneaux) · `interactions` (états d'appui) |
| `components/actions/` | `Button` · `IconButton` · `PillButton` |
| `components/forms/` | `Field` · `Switch` · `Segmented` · `ChipRow` · `PayOption` · `StepDots` |
| `components/surfaces/` | `Mesh` · `GlassPanel` · `TerritoryCard` · `Skeleton` · `EmptyState` |
| `components/data/` | `Tag` · `ProgressBar` · `LessonRow` · `PriceBlock` · `QuotaMeter` · `Avatar` · `ChatBubble` · `CheckLine` · `MediaCard` · `TranslationNotice` · `DocLine` · `StatTile` |
| `components/navigation/` | `TabBar` · `TopBar` · `SideNav` · `SubNav` · `SearchPill` · `Breadcrumb` · `Pipeline` · `ReadingBar` |
| `components/brand/` | `Wordmark` · `LogoMark` · `Icon` |
| `ui_kits/plateforme/` | Espace apprenant, 10 écrans cliquables (390 px), le prototype du chemin de l'argent, et `mode-sombre.html` (12 écrans, bascule clair/sombre) |
| `ui_kits/responsive/` | Desktop 1440 px : espace apprenant (18 pages, dont les **8 onglets du Club**) et console (24 pages) |
| `ui_kits/native/` | Applications natives iOS et Android : deux châssis, un corps, 36 écrans (9 propres au natif, 27 portés) |
| `ui_kits/site-public/` | Site public, **15 pages** en pleine largeur (1280 px) : accueil, catalogue, fiche formation, blog, article, pôle média, FAQ, Club, Présence Digitale, agence, à propos, contact, vérification, connexion, CGV. Trois fichiers : `PagesCore.js` (les six pages des quatre verbes), `Pages.js` (territoire violet), `PagesUtiles.js` (pages transverses) |
| `ui_kits/console/` | Console d'administration, 6 écrans (390 px, nuit) |
| `ui_kits/responsive/` | Points de rupture : catalogue tablette, accueil et article desktop, **et les deux tableaux de bord en 1440 px** — espace apprenant et console admin, trois colonnes chacun |
| `templates/ecran-mobile/` | Point de départ : écran d'app mobile (Design Component) |
| `templates/page-site/` | Point de départ : page du site public en 1280 px (Design Component) |
| `guidelines/*.card.html` | 19 fiches de fondation — couleurs, type, espacement, marque |
| `assets/` | `logo-mm-icon.png` · `icons/` (29 SVG + logo Google ; 8 glyphes supplémentaires vivent dans le composant `Icon`) |
| `SKILL.md` | Enveloppe Agent Skill pour usage hors de ce projet |

## 9. Ajouts intentionnels

Trois composants n'existent pas comme tels dans les kits ; ils emballent un motif que les kits
répètent en ligne. Rien d'autre n'a été ajouté, et aucune famille « qu'un système a
habituellement » n'a été inventée.

- **`Icon`** — le kit dessine ses SVG en ligne. Le composant expose le même jeu, extrait verbatim, plus deux emprunts Lucide signalés (`heart`, `repeat`).
- **`Wordmark`** — le kit répète la même suite de `<span>` colorés à sept endroits.
- **`StatTile`** — la case de relevé de la console, répétée à l'identique sur trois écrans.
- **`CheckLine`** — la ligne à coche de la page publique du Club, répétée seize fois entre desktop et mobile.
- **`MediaCard`** — la carte de podcast ou de vidéo, dont la silhouette dit le format et qui affiche toujours le poids.
- **`SubNav`** — la sous-navigation de territoire, qui sépare le gratuit ouvert du payant fermé.
- **`TranslationNotice`** — le bandeau de traduction automatique, obligatoire en tête de tout article anglais.

## 11 · BILINGUE

L'arbre de routes est monté **deux fois**, avec des segments traduits (`ui_kits/site-public/routes.js`).
Chaque valeur anglaise doit être **unique sur toute la table** : deux entrées qui collident
produisent une page inatteignable dans une langue et pas dans l'autre, sans erreur de compilation
pour le signaler — d'où la vérification exécutée au chargement du fichier.

| Page | Français | Anglais |
|---|---|---|
| Accueil | `/` | `/en` |
| Formations | `/formations` | `/courses` |
| Club des Digitos | `/club-des-digitos` | `/digitos-club` |
| Présence Digitale | `/presence-digitale` | `/local-presence` |
| Agence | `/agence` | `/agency` |
| À propos | `/a-propos` | `/about` |
| Vérifier | `/verifier` | `/verify` |
| Mon espace | `/mon-espace` | `/my-learning` |
| Connexion | `/connexion` | `/sign-in` |
| Blog · Podcast · Vidéos · FAQ · Contact | identiques | identiques, listés explicitement |

**Ce que la traduction ne résout pas.** Toute la voix repose sur le tutoiement, et l'anglais n'en a
pas. La familiarité est portée par la **contraction** (« I'll », « you're », « doesn't ») et le
**verbe à particule** (« show up », « get you online », « keep you posted »). Les six libellés de
navigation ne sont pas traduits, ils sont **écrits** :

| Français | Anglais | Ce qu'on évite |
|---|---|---|
| Je suis Max-Morrys | **I'm Max-Morrys** | « I am » — la contraction porte le registre |
| Je te forme | **I'll train you** | « I educate you », qui met une estrade entre nous |
| Je t'informe | **I'll keep you posted** | « I inform you », qui sonne administratif |
| Je te transforme | **I'll push you further** | « I transform you » — publicité de coach de vie |
| Je te digitalise | **I'll get you online** | « I digitize you » — « digitize » se dit de documents |
| Contacte-moi | **Talk to me** | « Contact us », qui invente une équipe |

**Les titres d'affichage sont écrits par langue, jamais traduits.** Le français court environ 18 %
plus long : un titre calé sur trois lignes en français en fait deux en anglais, et le bloc perd sa
masse. `JE TE FORME` (11) · `AU DIGITAL.` (11) · `DEPUIS DAKAR.` (13) devient
`I'LL TRAIN YOU` (14) · `TO GO DIGITAL.` (14) · `FROM DAKAR.` (11) — trois lignes de part et
d'autre, même masse, et l'anglais reprend son libellé de navigation mot pour mot. **Ne jamais
laisser un titre d'affichage se replier tout seul.**

Séparateur de milliers : espace insécable en français (`95 000 F`), virgule en anglais
(`95,000 F`). La règle du monospace ne change pas.

## 12 · POINTS DE RUPTURE

| Largeur | Cartes territoire | Navigation |
|---|---|---|
| < 700 px | empilées, chevauchement −14 px, chevron actif | barre d'onglets basse, 80 px |
| 700 → 1080 px | **grille 2 × 2**, chevron conservé, aucun chevauchement | latérale 250 px en verre |
| > 1080 px | **rangée de quatre** — la silhouette du M lue horizontalement | supérieure flottante, verbes soulignés |

`TerritoryCard` porte cette bascule par sa prop `layout` (`stack` / `grid` / `row` / `plain`).
Le chevron **n'est pas supprimé** au-delà de 700 px : c'est le chevauchement qui disparaît, parce
qu'une encoche prise dans une carte large et isolée ne rappelle plus rien.

**La règle qui ne se négocie pas :** la colonne de texte ne s'élargit **jamais**. Un article ou une
leçon reste à **68 caractères** par ligne (`--measure-prose`) quelle que soit la place. L'espace
gagné va à la marge et à la navigation, jamais à la longueur de ligne.

## 13 · VERSION INSTALLABLE (PWA)

L'application mobile native est **hors périmètre**, et pas seulement par manque de moyens : Apple et
Google prélèvent 15 à 30 % sur tout achat de contenu numérique fait dans l'application, en carte,
sans Wave ni Orange Money. Sur une formation à 95 000 FCFA, c'est **14 250 à 28 500 F par vente** —
et surtout, c'est le paiement en monnaie électronique locale, le seul vrai avantage du produit, qui
disparaît de l'écran d'achat. La version installable garde le paiement local et coûte quelques jours.

**Le seul argument d'installation qui vaille sur ce marché, c'est le forfait et le réseau.** Pas la
vitesse, pas les notifications. L'invitation dit « Garde tes leçons hors connexion. », jamais
« installe notre app » — elle est discrète, posée en bas d'écran après la deuxième visite, et jamais
en modale : une modale interrompt exactement ce qu'on était venu faire.

Quatre écrans propres : invitation, hors connexion (chaque ressource avec **son poids en mono**),
centre de notifications — **le seul canal sortant du produit**, cinq types : inscription, certificat,
contenu, club, système — et l'écran de lancement, le seul endroit où le maillage est **figé** sans
que l'appareil l'exige : au lancement, le processeur sert à démarrer l'application.

## 10. Ce qui manque, et qu'aucune invention ne remplace

- Aucune **photographie** : les emplacements sont des dégradés étiquetés (FR-084).
- Aucun **logo SVG**, aucune version monochrome ni nuit du M.
- Aucun **binaire de fonte** (voir § 7).
- Aucune **illustration**, aucune texture, aucun motif : le dépôt n'en contient pas.
- Aucun **modèle de présentation** : aucun deck n'a été fourni.
- Aucune **échelle d'espacement déclarée** dans la source : celle de `tokens/spacing.css` est
  relevée sur les valeurs réellement utilisées, non arrondie sur une grille de 4/8.
