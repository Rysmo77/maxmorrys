# Tableaux de bord — espace apprenant et console admin

**24 pages** desktop **1440 × 900** : 5 pour l'espace apprenant, 19 pour la console. Ce dossier est autonome : rien à
installer, rien à servir. Ouvre `apercu.html` dans un navigateur.

```
apercu.html       les 24 pages, avec un sélecteur en bas
dashboards.jsx            les 2 coques + Mon espace + Tableau de bord
dashboards-app.jsx        les 4 autres pages de l'espace apprenant
dashboards-console.jsx    10 écrans de console (pilotage, commerce, contenu)
dashboards-console-2.jsx  8 écrans de console (Club, réglages)
components.jsx    les 30 composants utilisés, en clair
COMPOSANTS.md     leurs contrats de props, avec les raisons
css/              styles.css + 20 fichiers de jetons et de recettes
```

---

## Ce que ces deux vues sont, et ne sont pas

Ce sont des **maquettes de référence**, pas du code de production. Elles codent les données en
dur et gèrent l'état par `React.useState` local. Ce qu'il faut en reprendre : la **structure**,
les **valeurs de style** et l'**ordre des éléments**. Pas l'architecture.

`components.jsx` en revanche est du code réutilisable tel quel : chaque composant est une
fonction React ordinaire, aux styles en ligne lisant les variables CSS de `css/`. Aucune
dépendance npm.

**Un piège à connaître** : ces fichiers sont chargés par Babel Standalone, qui bascule en
modules CommonJS dès qu'il voit **un seul** `import` ou `export`. Le navigateur échoue alors sur
`exports is not defined`, la page affiche son cadre mais aucun contenu, et l'erreur en console
ne nomme pas le coupable. C'est pour ça que `components.jsx` n'en contient aucun. En production,
remets de vrais exports de module et supprime le `window.DS` de fin de fichier.

---

## Deux coques, pas vingt-quatre mises en page

`AppFrame` et `ConsoleFrame` portent les 24 pages. Une page qui aurait besoin d'une troisième
coque est une page qui sort du motif — c'est le signal qu'il faut se demander si elle a sa place.

`ConsoleFrame` rend le **pied obligatoire** : c'est la zone 3 du motif, celle qui dit ce que
l'écran ne couvre pas. Un écran d'administration sans elle finit en manœuvre manuelle non tracée.
Le panneau de droite, lui, est **optionnel** : sans contenu réel à y mettre, la colonne de travail
prend la place plutôt que d'afficher un panneau vide.

**Cinq écrans de console sont à zéro** — projets, défis, témoignages, notifications, rendez-vous.
Ils sont dessinés quand même : un écran vide qu'on ne dessine pas finit par afficher des données
d'exemple le jour où il se remplit. Chacun porte un zéro daté et **la raison** du zéro.

## 1 · Espace apprenant — `EspaceDesktop`

| Colonne | Largeur | Contenu |
|---|---|---|
| Navigation | `250px` | Les cinq entrées, pastille de territoire, progression en pied |
| Travail | fluide | Reprise, trois relevés, programme, paiements et notes |
| Répétiteur | `340px` | Conversation, quota, champ de saisie |

**La carte de reprise est le premier objet, et ça ne se négocie pas.** Le produit n'a aucun
canal d'envoi d'e-mail : la relance ne peut venir que de l'écran lui-même. L'élargir ne change
pas cette contrainte — c'est pourquoi la disposition desktop ne la déplace pas plus bas au
profit de statistiques.

**Le seul gain réel de la largeur** : le répétiteur passe d'une carte qu'on ouvre à un panneau
permanent, quota visible en continu. Le quota est affiché **avant** l'usage, jamais au moment du
refus — un refus au-delà du plafond est vécu comme une panne s'il n'a pas été annoncé.

Le nom « Répétiteur » est une **valeur par défaut renommable** par chaque personne. Ne l'écris
jamais en dur : lis-le depuis les préférences. *Rysmo* est le nom de l'application, pas celui du
répétiteur — les deux ont longtemps été confondus.

## 2 · Console admin — `ConsoleDesktop`

| Colonne | Largeur | Contenu |
|---|---|---|
| Les 19 écrans | `230px` | Groupés en cinq familles, avec leur compteur |
| Liste dense | fluide | Alerte, quatre relevés datés, pipeline, file « à traiter » |
| Détail | `380px` | Le prospect sélectionné, ses actions, son coût opérationnel |

L'opérateur est **une seule personne** qui publie, modère, qualifie et arbitre. La console n'est
pas un tableau de bord d'analyse : c'est une liste de choses à faire aujourd'hui, et elle
s'ouvre sur ce qui bloque.

**Le motif des trois zones**, valable pour les 19 écrans :

1. **Filtre par statut, jamais par date.** Un opérateur unique cherche « ce qui attend », pas
   « ce qui s'est passé mardi ».
2. **Liste dense, un état et UNE action par ligne.** Deux actions par ligne, c'est une
   hésitation par ligne.
3. **Un pied qui dit ce que l'écran ne couvre pas.** Le non-dit d'un écran d'administration
   finit toujours en manœuvre manuelle non tracée.

**Ce que la largeur apporte** : le détail cesse d'être un écran séparé. La file reste visible
pendant qu'on traite.

**Les zéros s'affichent, datés.** `0 F` encaissé, `0` certificat, `5` comptes dont le dernier
remonte au 10 mars. Un zéro daté est une information ; un tiret n'en est pas une, et une donnée
d'exemple est un mensonge qu'on oublie de retirer.

---

## Trois règles que ces vues appliquent

**Le flou n'a droit qu'à une surface qui ne défile pas** — `fixed` ou `sticky` en production.
Partout ailleurs c'est un défaut : aucun quota à compter. Ici, l'espace apprenant a **une** seule
surface floutée et la console **zéro**. Tout le reste utilise `GlassPanel level="flat"`, un voile
plus couvrant sans `backdrop-filter`. Un flou n'est jamais coûteux là où on l'écrit — il le
devient là où le composant est répété.

**Un fond ne peut pas lire un jeton que sa propre portée retourne.** `level="ink"` applique
`.dk` sur l'élément qu'il peint : si son fond lisait `--ink`, ce jeton basculerait à sa valeur
nuit et la carte se peindrait en blanc cassé pendant que ses textes deviennent clairs eux aussi —
titre à **1,00:1**. D'où `--surface-ink`, déclaré **à l'identique** dans `:root` et dans `.dk`.
Toute surface qui ouvre sa propre portée de thème a besoin d'un jeton invariant pour son fond.

**Une carte sombre sur une page claire doit être opaque.** `GlassPanel level="night"` est un
voile à 72 % : sur une page sombre il reste sombre, sur une page claire il compose avec elle et
remonte à `rgb(80,81,86)` — un gris moyen où aucun texte nuit ne tient. Utilisez
`level="ink"` : la carte est opaque **et** ouvre sa propre portée `.dk`, donc les jetons de
texte basculent seuls et il n'y a plus de gris à choisir.

**Les deux échelles d'encre comptent trois crans, et le plus faible est le plancher — clair
comme nuit.** En nuit : `#ECF0F5` (16,9:1), `#A2ADBB` (8,5:1), `#77828F` (**4,95:1**). En clair :
`#0E1116` (18,9:1), `#5A6472` (6,0:1), `#68727F` (**4,88:1**). Un quatrième gris plus sombre écrit à la main tombe sous 4,5:1 — et c'est
précisément ce gris-là qui attire la copie explicative, celle qui justifie chaque décision
d'écran. Si une note de bas d'écran a besoin d'être plus discrète que `--text-faint`, c'est
qu'elle est de trop, pas qu'elle doit être plus pâle.

**Un nombre en monospace vient de la base ou d'une source citée.** La classe `.mm-num` est un
engagement, pas une décoration. Un nombre qui ne peut pas prendre cette fonte ne s'affiche pas.

**L'espace gagné va à la marge et à la navigation, jamais à la longueur de ligne.** Ces deux
vues ajoutent des colonnes ; elles n'étirent aucun bloc de texte.

---

## Un piège de mise en page, rencontré ici

`apercu.html` porte ses propres styles de documentation. Ses sélecteurs d'élément sont **portés
par `.wrap`**, et c'est délibéré : un sélecteur nu comme `h1{color:#fff}` atteint aussi les
`<h1>` des maquettes montées dans la page, écrase leur héritage de thème, et met un titre blanc
sur un fond clair — mesuré à **1,32:1**. Si tu ajoutes du style à une page qui monte des
maquettes, porte-le.

---

## Trois rôles absents, volontairement

- **Pas de tableau de bord formateur.** Max-Morrys opère seul : il *est* l'administrateur.
- **Pas d'espace client TPE.** Le devis est consultable par URL, sans compte et sans donnée
  personnelle. Lui donner un espace obligerait à créer des comptes pour des gens qui n'en veulent pas.
- **Aucun graphique dans la console.** Elle répond à « qu'est-ce qui bloque aujourd'hui », pas à
  « comment ça évolue ». Avec 5 comptes et 0 certificat, une courbe serait du décor.
