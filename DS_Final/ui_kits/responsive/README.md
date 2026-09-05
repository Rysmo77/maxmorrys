# UI kit — Desktop 1440 px

Deux surfaces : l'**espace apprenant** (26 pages) et la **console** (24 pages).

```
espace-desktop.html      les 26 pages de l'espace apprenant, sélecteur en haut
toutes-les-pages.html    les 24 pages de console
tableaux-de-bord.html    les deux tableaux de bord, côte à côte
index.html               les points de rupture

Dashboards.js            Fenetre · AppFrame · ConsoleFrame · EspaceDesktop · DashboardOps
DashboardsApp.js         cours, répétiteur, Club (v1), profil
DashboardsEspace.js      lecteur, notes, paiements, certificats, fiche formation
DashboardsClub.js        ClubFrame + fil, discussions, membres, agenda
DashboardsClub2.js       classement, opportunités, informations, parrainage
DashboardsClubVerrou.js  le Club verrouillé — un composant, les huit mêmes contextes
DashboardsConsole.js     10 écrans de console
DashboardsConsole2.js    8 écrans de console
```

## La règle d'élargissement

**L'espace gagné va à la marge et à la navigation, jamais à la longueur de ligne.** Ces pages
ajoutent des colonnes ; aucune n'étire un bloc de texte. La prose reste bornée par
`--measure-prose`.

Deux coques portent tout : `AppFrame` (navigation 250 px · travail · panneau optionnel 340 px)
et `ConsoleFrame`. Une page qui aurait besoin d'une troisième coque est une page qui sort du
motif — c'est le signal qu'il faut se demander si elle a sa place.

## Le Club des Digitos : huit onglets, pas une page

Le Club n'avait **qu'une** page desktop pour huit onglets, et ce n'était pas un manque
cosmétique : le Club est un produit dans le produit — un fil, un annuaire, un agenda, un
classement, une bourse de missions. Le réduire à une page revenait à le vendre pour ce qu'il
n'est pas.

`ClubFrame` est une **sous-coque** : la navigation latérale de l'espace reste (le Club est une
section, pas une application séparée) et une bande de huit onglets s'ajoute sous le titre.

### Le vrai gain de la largeur

En 390 px, le **bilan d'abonnement** devait être le premier objet du fil : la seule façon de
garantir qu'un abonné annuel le voie avant d'oublier son prix. Il entrait donc en concurrence
avec le contenu, et n'était visible que sur un onglet sur huit.

Ici il passe dans le rail de droite et devient **visible en permanence sur les huit onglets**.
C'est ça, le gain : pas plus de contenu par rangée, mais une information permanente qui n'a plus
à voler la première place. Corollaire : le rail porte le bilan puis **au plus une** chose
contextuelle — un rail à quatre cartes est un rail qu'on ne lit plus.

### Ce que chaque onglet règle

| Onglet | La décision qu'il porte |
|---|---|
| **Fil** | Commence enfin par du contenu, le bilan étant passé dans le rail |
| **Discussions** | Classé par **sujet**, jamais par date · deux colonnes pour ne pas produire de lignes de 90 caractères |
| **Membres** | Annuaire et fiche ensemble : on parcourt sans perdre la fiche ouverte. En 390 px, deux écrans successifs |
| **Agenda** | Le **calendrier du mois** — la seule vraie addition du desktop, il ne tenait pas en 390 px |
| **Classement** | **Aucun classement général absolu.** Deux vues côte à côte : ta vague, et toi contre toi-même. La largeur permet de montrer qu'aucune des deux n'est un palmarès |
| **Opportunités** | Liste et détail ensemble · les budgets ne sont **pas vérifiés**, et c'est écrit sous la liste |
| **Informations** | Le digest hebdomadaire, ici et en notification — **jamais par e-mail**, aucun canal n'existe |
| **Parrainage** | « Rien en argent » est un **titre de section**, pas une note en bas de page |

### Le neuvième écran : le Club verrouillé

Les huit onglets supposent tous une abonnée. Il manquait l'écran de la personne qui a un
**compte** et pas d'abonnement : elle a cliqué « Le Club » dans la navigation latérale.

Ce n'est pas le mur d'abonnement. Le mur s'adresse à quelqu'un qui ne s'est pas inscrit ; ici la
personne est identifiée, dans son espace, et **on sait quel onglet elle a demandé**. C'est la
seule information qu'on ait en plus, et l'écran est bâti autour d'elle : `ClubVerrouilleDesktop`
est un composant, huit contenus.

Ce que la largeur change, et c'est beaucoup :

- **Le prix quitte la fin du défilement.** En 390 px il vient après le contenu — l'ordre est
  juste (montrer avant de demander) mais il oblige à parier que la personne défile. Ici il vit
  dans le rail, **permanent sur les huit contextes**, exactement à l'emplacement où une abonnée
  a son bilan. Même gain, même mécanique.
- **Les huit onglets se lisent d'un coup.** La bande passe à la ligne au lieu de défiler : la
  forme complète de ce qui serait acheté est visible en une vue. En 390 px, il fallait faire
  glisser la bande pour découvrir les quatre derniers.
- **Compteurs et élément entier tiennent côte à côte.** Sur téléphone ils s'empilent, et le
  second demande un défilement de plus.

Ce qui ne change pas : **aucun contenu flouté**. Un flou dit « il y a foule là-dedans,
fais-nous confiance » ; le Club a ouvert cette année, il ne peut pas le dire, et la personne le
vérifierait au premier écran après avoir payé. À la place : les compteurs réels de ce qui est
derrière, et un élément complet, non tronqué. La bande reste **cliquable** — masquer la
navigation d'un espace verrouillé, c'est vendre une boîte fermée.

**Une différence de fond avec la version native, et une seule : ici le bouton achète.** Le site
n'est pas une application de magasin, donc Wave et Orange Money restent possibles. C'est le même
écran ; c'est la règle App Store 3.1.1 qui coupe l'autre en deux.

## Les cinq pages d'espace qui manquaient

L'espace avait cinq pages desktop, mais pas celles où la personne passe son temps.

**Le lecteur de leçon** est l'écran le plus important du produit — celui qui est ouvert le soir
— et il manquait. C'est justement là que la largeur change l'usage : la transcription et les
notes tiennent à côté de la vidéo, avec l'horodatage. **En 390 px, prendre une note obligeait à
quitter la vidéo. Ici, non.**

**Mes paiements** est l'écran d'historique que le web n'avait pas : l'acheteur devait écrire pour
savoir où en était son paiement. Le tiret sur « confirmé le » n'est pas un bug d'affichage — le
prestataire n'a pas renvoyé de date, et un tiret est plus honnête qu'une date inventée.

**Mes certificats** affiche zéro, daté, plus un **aperçu grisé** de l'objet à venir. Un écran
vide qu'on ne dessine pas finit par afficher des données d'exemple le jour où il se remplit.

## Un piège de planche

Les pages de documentation de ce dossier portent leurs sélecteurs d'élément en **enfant direct**
(`.wrap > h1`). Un sélecteur nu atteindrait les `<h1>` que `AppFrame` rend dans les maquettes
montées dans la page, écraserait leur héritage de thème, et mettrait un titre blanc sur fond
clair — mesuré à **1,32:1**. Si tu ajoutes du style à une page qui monte des maquettes,
porte-le.
