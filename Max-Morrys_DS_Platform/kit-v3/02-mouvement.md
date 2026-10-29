# Mouvement

Les interfaces bougent tout le temps, mais jamais pour rien. Chaque mouvement répond à une des quatre questions de la personne qui regarde l'écran — et chacune a sa durée.

| Question | Jeton | Durée | Courbe | Exemples |
|---|---|---|---|---|
| « M'as-tu entendu·e ? » | `t-tap` | 120 ms | `ease` | appui `scale(.975)`, pilule `.94` |
| « Qu'est-ce qui a changé ? » | `t-ui` | 220 ms | `ease` / `ease-out` | onglet, pouce qui glisse, filtre, interrupteur, flèche de bouton |
| « Qu'est-ce qui arrive ? » | `t-enter` | 380 ms | `ease-out` | cascade d'entrée (décalage `stagger` 70 ms), toast, palette, carte de carrousel |
| « La page se met en place » | `t-scene` | 700 ms | `ease-out` | titre sous masque (`stagger-line` 90 ms), anneaux et barres de progression, filet du pied de page |
| « Où suis-je ? » | `t-page` | 480 ms | `ease-in-out` puis `ease-out` | changement de page et d'espace (View Transitions) |

`ease-spring` est réservé aux **récompenses** : « j'aime », XP, badge, coche de validation. Jamais sur un état d'interface.

## Les règles

- `transform` et `opacity` seulement. Jamais `width`, `height`, `top`, `left` ; pas d'animation de hauteur d'accordéon — le contenu arrive, la liste se réorganise.
- Une scène se joue **une fois**, à l'entrée dans le champ (`MaxMorrys.play`, IntersectionObserver), jamais en boucle à chaque défilement.
- Boucles autorisées : dérive du maillage (25–38 s), bande défilante (30–44 s), ondulation des cartes flottantes du héros (6 s), pastille « en direct », anneaux d'attente de paiement. Rien d'autre ne boucle.
- Pas de défilement détourné, pas de parallaxe qui déplace le texte, pas d'information portée par un survol.
- Les compteurs ne roulent que vers une valeur **réelle** (`data-to`) ; un zéro ne roule pas.
- `prefers-reduced-motion` : tout passe à 1 ms, la bande défilante devient une rangée statique, les entrées apparaissent directement.
- `.lowfi` (mémoire ≤ 2 Go ou ≤ 4 cœurs) : flou coupé, maillage figé, ondulations coupées. C'est le profil du marché, pas un cas limite.

## Chorégraphie par surface

### Pages d'accueil (hub, edu., club.)
1. Maillage déjà en dérive (aucun délai).
2. Barre haute présente, pouce placé sans animation.
3. Sourcil, puis les trois lignes du titre qui montent sous masque, 90 ms entre elles.
4. Chapô et boutons en cascade, 70 ms.
5. Visuel du héros en `scale(.94)` → 1 ; cartes flottantes qui commencent à onduler.
6. Bande de relevé : compteurs mono jusqu'à leur valeur.
7. Au défilement, chaque section rejoue sa propre cascade une fois ; la grille numérotée s'encre au survol ; le pied de page déroule son filet puis lève le nom lettre par lettre.

### edu. — tableau de bord et lecteur
- Tuiles bento en cascade ; anneau de progression (1,4 s), barre aux quatre teintes, segments du quota Rysmo un à un, série qui s'empile en ressort.
- Carte de cours → fiche par View Transition (`view-transition-name: course-<slug>`).
- Cocher une leçon : la coche rebondit, « +20 XP » s'élève, la barre avance ; la leçon suivante entre par la droite.
- Rysmo : la réponse s'écrit mot à mot à vitesse de lecture ; trois points qui respirent pendant l'attente, jamais un rond qui tourne.
- Moment signature : **émission du certificat**, la brillance passe deux fois puis s'arrête — non rejouable.
- Moment signature : **attente de paiement**, deux anneaux autour du logo Wave ou Orange Money.

### club. — réseau social
- Fil : nouvelles publications insérées en haut avec un glissement de 12 px et une pastille « 3 nouvelles publications » qui ramène en haut sans saut.
- « J'aime » : cœur en ressort, éclat de six points, compteur qui change sans décaler la ligne.
- Sondage : barres qui se remplissent après le vote (700 ms), le choix de la personne marqué d'une coche.
- Rail : pouce violet qui glisse d'une icône à l'autre ; infobulle en 220 ms.
- Messages : bulle envoyée qui monte depuis le champ ; indicateur « en train d'écrire » ; accusé de lecture qui passe au violet.
- Activité « Aujourd'hui » : chaque nouvel élément entre depuis la gauche.
- Présence : point vert sur l'avatar ; pastille « en direct » qui pulse pendant une session.

### Console superadmin
- Sobre : cascade d'entrée des tuiles, courbes qui se dessinent **seulement s'il y a une série réelle**, journal d'audit dont les nouvelles lignes glissent depuis la gauche.
- Changer de filtre d'espace : pouce qui glisse, tuiles qui se fondent (220 ms) — pas de cascade rejouée à chaque filtre.

### Transversal
- Changement d'espace : pouce du sélecteur (220 ms), puis View Transition de la page (480 ms) ; le maillage change de couleurs en fondu.
- Palette ⌘K : voile en fondu, palette qui descend de 8 px.
- Toasts : entrée par le bas en 380 ms, minuterie visible de 5 s, sortie latérale.
- Champs : étiquette qui monte au focus, secousse unique en cas d'erreur, coche en ressort quand c'est valide.
- Squelettes : balayage 1,5 s, à la forme exacte du contenu.

## Implémentation

- Feuille : `components/bundle.css` (classes `rv`, `rv-s`, `rv-l`, `rv-x`, `play`, et chaque composant).
- Comportement : `components/bundle.js` → `window.MaxMorrys` : `init`, `play`, `countUp`, `thumb`, `marquee`, `carousel`, `like`, `toast`, `flip`, `transition`, `lowfi`.
- En React (site actuel, React 18) : envelopper ces fonctions dans des effets ; pas de bibliothèque d'animation ajoutée — Framer Motion ou GSAP ne sont pas nécessaires pour ce catalogue et pèseraient sur le budget NFR-04.
- Application Rysmo (React Native) : mêmes durées et courbes, via `Animated`/Reanimated, coupées sous « réduire les animations » (FR-231).
- **Maquettes (v4.5)** : la couche `motion` de `bundle.css` joue tout ce qui précède sans script — entrée de page, cascade du titre, barres, tuiles, barres et anneaux de progression, révélation au défilement par `animation-timeline: view()`. `opacity` et `translate`/`scale` seulement, images clés sans valeur finale, rien sur la racine.

### Rysmo — application mobile
- Écran poussé : glissement latéral de 36 px et fondu (iOS 480 ms `ease-out`) ; axe partagé de 30 px (Material 360 ms, courbe accentuée).
- Onglet : fondu de 220 ms, titre qui monte. Feuille : montée depuis le bas (420 ms), voile en fondu.
- Réponse : mot à mot (36 ms par mot) ; attente : trois points qui respirent. Dictée : vague qui ondule tant que le micro écoute, bouton qui pulse.
- Quota : segments un à un ; anneau qui se dessine (1,4 s). Révision : coche en ressort sur la bonne réponse, secousse unique sur la mauvaise, « +10 XP » qui s'élève.
- Paiement : double anneau autour du logo pendant l'attente, minuterie visible ; confirmation par coche dessinée et éclat de six points.
- Interrupteurs, segments, points de pagination : 220 ms. Appui : `scale(.975)` en 120 ms.
