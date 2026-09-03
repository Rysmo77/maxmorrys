# Écarts délibérés au design system

Les fichiers de `../tokens/` et `../brand/` sont des **copies littérales** du design system
(AD-1) : `npm run ds:check` échoue si l'un d'eux diverge d'un octet. Tout écart voulu par le
produit vit donc **ici**, dans un fichier par décision, importé en dernier.

C'est ce qui permet, à tout moment, de répondre à la question « qu'est-ce qui, dans le rendu,
ne vient pas du kit ? » — la réponse est ce dossier, et rien d'autre.

| Fichier | Décision | Pourquoi |
|---|---|---|
| `ad-18-voile.css` | AD-18 | Le point A du handoff : le voile de lisibilité remonte pour que `--ink-2` tienne 4,5:1 sur le fond réel. Mesuré, pas estimé. |
| `ad-06-etats.css` | AD-6 | **Réduit** : le kit livre désormais `brand/states.css`. Ne restent que l'erreur sur un champ réel, le saut au contenu, le texte indicatif, les jetons AD-2, et une cible tactile mesurée meilleure. Ceux d'AD-3 sont partis dans `ad-23-hello-arc.css` avec la peinture du mot-symbole. |
| `ad-22-surface-feuille.css` | AD-22 | `--paper` est le blanc de RÉFÉRENCE et ne bascule pas sous `.dk` ; l'encre, si. Toute surface opaque qui le lisait donnait **1,06:1** en mode sombre. `--surface-sheet` bascule. Mesuré. |
| `ad-20-corail-texte.css` | AD-20 | Le DS donne au corail un rôle de **texte** (l'entrée « agence » de la barre haute) mais aucune version lisible : `#FF6E7F` fait 2,70:1 sur blanc. Mesuré. |
| `ad-21-radio-epaisseur.css` | AD-21 | `brand/states.css` transitionne `border-width` sur `.mm-radio` — une propriété de mise en page, ce qu'AD-16 interdit. La copie littérale (AD-1) ne peut pas être corrigée sur place : l'écart la neutralise par une transition de couleur. |
| `ad-23-arc.css` | AD-23 | Un remplissage de gauche à droite sur du texte, et ses **deux** usages. Le mot-symbole « Hello ! » devient une cible (`--ink-2` au repos, l'arc au survol) ; un fragment de chaque titre de page se remplit **au survol du titre** (`.mm-arc-host`), ornement assumé qui n'existe pas sur mobile — rien de ce que la page doit dire n'en dépend. L'arc tourne pour démarrer sur la teinte de la page. Remplace les jetons AD-3 d'`ad-06-etats.css`. |

## Un écart qui ne vit pas dans ce dossier — AD-24

`ds:sync` ne copie que du **CSS** : les composants de `src/design-system/react/` sont portés à
la main, et un écart qui les concerne n'a pas de fichier à écrire ici. Il est noté quand même,
parce que la question à laquelle ce dossier répond — « qu'est-ce qui, dans le rendu, ne vient
pas du kit ? » — ne s'arrête pas à la frontière des feuilles de style.

**AD-24 · `MediaCard` accepte une photographie.** Le kit l'interdisait en toutes lettres
(« Dégradé de la vignette. Par défaut celui du format. **Aucune photographie.** ») au nom d'un
argument qui tient : *la silhouette dit le format*, et une forme se lit là où le mot « Podcast »
se perd. Mais `Video.thumbnailUrl` et `Podcast.coverImage` sont des champs **obligatoires**,
remplis automatiquement par les imports YouTube et Spotify, et la fiche vidéo affichait déjà sa
miniature une page plus loin. La carte était le seul endroit du parcours qui les jetait.

L'écart **garde l'argument** au lieu de le rembourser : la photo remplit la vignette, l'onde et
le cadre 16:9 se redessinent **par-dessus**, sur un voile sombre qui les tient lisibles quelle
que soit l'image. Le dégradé n'est pas retiré — il devient le **repli** : pochette absente, URL
cassée, image encore en vol, c'est lui qu'on voit.

Ce qui n'a pas été repris de la maquette : le `backdrop-filter: blur(8px)` qu'elle pose sur le
badge (`uploads/maxmorrys-pole-media.html:442`). Une carte de média vit en grille — c'est la
règle 1, et `ds:check` la fait respecter.

Le détail du raisonnement est en tête de
[`react/data/MediaCard.tsx`](../../react/data/MediaCard.tsx), au plus près du code qu'il régit.

## Deux écarts RETIRÉS par la révision reçue

Le dossier `design_handoff_maxmorrys/` livre une révision du kit qui rembourse deux des
écarts que ce dossier portait. Ils sont supprimés plutôt que gardés « au cas où » : un
override qui ne dévie plus de rien est un mensonge sur ce qui, dans le rendu, ne vient pas
du kit — et c'est exactement la question à laquelle ce dossier doit répondre.

**`ad-19-etats-nuit.css` — supprimé.** Il existait parce que `tokens/dark.css` redéclarait
les quatre teintes de marque et **oubliait** `--ok`, `--warn`, `--stop`. La révision les
livre. Deux des trois valeurs sont identiques au caractère près (`--warn:#FFB24D`,
`--stop:#FF8A80`). La troisième diffère, et **le kit gagne sur les deux critères qu'AD-19
avait lui-même nommés** — mesuré sur `#0B0E13` :

| | contraste | teinte | écart au teal nuit `#3FD9C6` (173°) |
|---|---|---|---|
| kit `--ok:#4ADE9B` | **11,24:1** | 153° | **20°** |
| AD-19 `--ok:#2BD18B` | 9,75:1 | 155° | 18° |

AD-19 voulait un vert « franchement vert pour ne pas se confondre avec le teal nuit ». Le
vert du kit est **plus contrasté et plus loin du teal** que celui qu'AD-19 avait choisi
contre lui. L'écart n'avait plus d'argument.

**`.mm-focus-invert` — renommé `.mm-on-color`.** Le kit nomme lui-même l'anneau de focus sur
surface colorée, et son sélecteur couvre en plus les DESCENDANTS de la surface
(`:where(.mm-on-color) :focus-visible`). Deux noms pour une chose est précisément la dérive
que ce dossier sert à empêcher : c'est le vocabulaire du kit qui reste.

## Deux pièges du kit à ne pas déclencher

**`.bar-fill` n'est pas un remplissage de barre de progression.** `brand/motion.css` la
déclare ainsi :

```css
.play .bar-fill{animation:barfill 3.4s var(--ease-out) forwards}
@keyframes barfill{from{width:8%}to{width:38%}}
```

Elle anime de **8 % à 38 %, quelle que soit la valeur réelle**. C'est une animation de
démonstration pour la planche de mouvement. La poser sur une vraie barre afficherait une
progression **inventée** — un chiffre faux, rendu par du CSS au lieu d'être écrit dans le
JSX, donc invisible à toute relecture. Les règles de revue et AD-16 nomment `.prog-fill`
comme l'exception admise ; c'est ce nom-là que porte le curseur réel, et que `ds:check`
reconnaît.

**~~Le kit nomme un fichier qu'il ne livre pas.~~ CORRIGÉ.** La révision précédente décrivait
`brand/states.css` comme « AJOUTÉ POUR CE TRANSFERT » sans le livrer, et `ad-06-etats.css`
le remplaçait, écrit d'après le tableau. **Le dossier `design_handoff_maxmorrys/` le livre
pour de bon**, avec `brand/breakpoints.css` en plus. Les deux sont désormais des copies
littérales (AD-1) ; `ad-06-etats.css` est réduit à ce qu'elles ne couvrent pas.
