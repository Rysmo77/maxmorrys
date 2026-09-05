# UI kit — Applications natives iOS et Android

Le virage : deux applications natives, avec **la marque d'abord** — Android hérite du dessin,
pas des conventions Material. Décision prise, avec ses conséquences assumées.

## La règle qui décide tout : un corps, deux châssis

Le contenu d'un écran est **identique** sur les deux plateformes ; seul le châssis diffère.
Un écran qui aurait besoin de deux corps différents serait un écran où la marque a cédé aux
conventions — c'est un signal d'erreur, pas une exception à gérer.

`NativeShell.js` porte les deux châssis. `os="ios"` ou `os="android"` est le **seul**
commutateur.

### Ce qui diffère, exhaustivement

| | iOS · iPhone 13/14 | Android · Pixel 8 |
|---|---|---|
| Gabarit | `390 × 844` | `412 × 915` |
| Zone sûre haute | `47px` | `24px` |
| Zone sûre basse | `34px` | `24px` gestuel · `48px` trois boutons |
| Caméra | encoche large, attachée au bord | poinçon centré, détaché |
| Barre d'état | heure à gauche, triade à droite | heure **et** notifications à gauche, batterie **avec pourcentage** |
| Barre de navigation | `44px`, titre centré | `64px`, titre à gauche |
| Retour | chevron **+ libellé** | flèche seule |
| Barre basse | indicateur `134 × 5` | pilule `108 × 3` ou trois boutons |
| Flou | présent | **absent par défaut** |

Le retour mérite un mot : le libellé d'iOS dit *où* l'on revient. Android ne l'a pas, parce que
le retour système peut venir d'ailleurs — et un libellé faux est pire que pas de libellé.

### Ce qui ne diffère pas

Maillage, cartes territoire, typographie, règle du monospace, encarts de vérité, mouvement,
hauteur de la barre d'onglets, voix. Écrit une fois. La liste est plus longue que celle des
différences, et c'est le but.

### La barre d'onglets et la zone de geste

La marque impose ses **80 px** aux deux plateformes, et la zone sûre **s'ajoute** — 34 px sur
iOS, 24 ou 48 sur Android. Sans ça, l'indicateur d'accueil se dessine par-dessus les onglets et
les 34 px inférieurs de chaque cible tombent dans la zone où l'OS intercepte le glissement vers
le haut : la cible existe, mais le geste ne lui parvient pas.

Ça passe par la prop **`safeBottom`** de `TabBar`, et ça ne peut pas passer ailleurs :
`bottom:0` se résout au bas de la **boîte de rembourrage**, donc aucun `paddingBottom` sur un
ancêtre ne remonte un enfant en `absolute`. Une enveloppe rembourrée ne fait rien du tout —
elle se réduit à 34 px de vide pendant que la barre lui échappe. `NativeScreen` passe la valeur
au composant, et réserve `calc(var(--tabbar-h) + zone sûre)` en bas du corps défilant.

Une seule source pour la hauteur : **`--tabbar-h`** (`tokens/spacing.css`). Le kit natif a
brièvement eu son propre `--tabbar-native` à la même valeur — deux jetons identiques que rien
n'obligeait à bouger ensemble, donc une divergence programmée. Il a été supprimé.

## Le verre sur Android : le repli est le cas normal

`RenderEffect`, l'équivalent Android de `backdrop-filter`, demande **API 31+**. Or le marché
visé est bas de gamme — le système le dit déjà : le repli web se déclenche à
`deviceMemory ≤ 2`. Construire le verre sur une capacité que la moitié du parc n'a pas, c'est
concevoir pour l'autre moitié.

Donc **aucun flou par défaut sous Android** (`brand/native.css`, portée `.andro`). Les voiles
montent pour compenser. Le flou devient un bonus, activé par `.andro.blur-ok` quand l'appareil
le déclare — jamais une hypothèse.

Le maillage, lui, est identique : du dégradé et de la `transform`, gratuit partout. C'est
précisément ce qui permet à Android de perdre le flou **sans perdre l'identité**. Un système
dont l'identité reposait sur le flou seul n'aurait pas survécu à cette décision.

## Les neuf écrans propres au natif

`ScreensNatif.js` — les seuls écrans réellement nouveaux. Deux changent le produit :

| | Écran | Ce qui s'y joue |
|---|---|---|
| 01 | Lancement | Aucun indicateur de progression. L'app s'appelle **Rysmo** |
| 02 | Onboarding | Trois écrans, passables, **aucun compte demandé** |
| 03 | **Permissions** | La notification poussée donne enfin le canal de relance que le web n'a pas |
| 04 | **Mur de paiement** | L'app ne vend rien : elle ouvre ce qui est déjà payé |
| 05 | Stockage | Poids en monospace, plafond auto-imposé, Wi-Fi seul par défaut |
| 06 | Lecteur plein écran | Paysage · le seul écran hors châssis partagé |
| 07 | Widget | La relance qui n'interrompt pas et ne demande aucune permission |
| 08 | Partage système | Ce qui part est le **lien de vérification**, pas une image |
| 09 | Biométrie | Après la première connexion, jamais avant |

### Permissions — le premier vrai gain du natif

La plateforme web n'a **aucun** canal d'envoi. Toute la conception s'est pliée à cette
contrainte : la carte de reprise est le premier objet de l'espace *parce que* la relance ne
pouvait venir que de l'écran lui-même. La notification poussée donne enfin ce canal, et le
widget en donne un second. À elle seule, cette permission justifie le virage natif.

L'écran explique **avant** d'ouvrir le dialogue système, parce qu'iOS ne le laisse poser
qu'une fois : un refus est définitif, et se rattrape seulement dans les Réglages, là où
personne ne va.

### Mur de paiement — ce qui évite le rejet en revue

Tu as demandé Wave et Orange Money en direct, hors magasins. **En l'état, ça fait rejeter
l'app** : App Store 3.1.1 et Play Payments imposent l'achat intégré pour du contenu numérique
consommé dans l'application.

L'écran dessiné est la seule forme qui survit : **l'app ne vend pas**, elle ouvre ce qui est
déjà payé. Le web reste la boutique, l'app est la salle de classe. Le module 1 reste regardable
sans payer, dans l'app — c'est ce qui rend le mur supportable, parce qu'on juge avant de sortir
de l'application.

Deux points restent à trancher avec toi :
- Le texte du mur nomme le magasin (`App Store` / `Google Play`). Certaines revues rejettent
  la mention explicite d'un moyen de paiement externe. Une variante plus neutre est possible.
- Le lien sortant est une **URL simple**. iOS propose un droit d'accès *External Purchase Link*
  qui autorise un lien d'achat déclaré ; sans lui, la revue peut refuser le bouton.

## Le portage — les 9 groupes couverts, 36 écrans

`ScreensNatifApp.js` porte **le chemin de l'argent** et **l'apprentissage** : sept écrans,
chacun écrit une fois et rendu dans les deux châssis (`natif-argent-apprentissage.html`).

Le motif est établi : le corps vient du web **sans modification de fond**, `NativeScreen`
remplace `Screen`, la barre haute du châssis remplace `AppBar`, et on vérifie aux deux
largeurs. Trois exceptions rencontrées, toutes documentées dans le fichier :

| Écran | Ce qui a changé, et pourquoi |
|---|---|
| Tunnel de paiement | **Non porté.** L'app n'encaisse rien : remplacé par le mur + lien sortant |
| Retour de paiement | « C'est à toi », pas « paiement accepté » — l'app constate, elle n'a rien encaissé |
| Mon espace | **Une addition** : la carte de notification, proposée une fois. Le web ne pouvait pas l'offrir |
| Mes notes | Bouton flottant **rond sur iOS, arrondi carré sur Android** — seule concession de forme du lot |
| Certificat | **Un** bouton de partage au lieu de deux : la feuille système remplace les deux actions web |

### Lot 2 — le répétiteur et les états transverses

`ScreensNatifEtats.js` — six écrans (`natif-repetiteur-etats.html`). Le lot 1 se portait
presque mécaniquement ; celui-ci contient **la plus grosse divergence du virage**.

**Le clavier.** Il n'existe pas en web mobile — le navigateur s'en occupe. En natif il mange
**291 px sur iOS, 268 sur Android**, et ce n'est pas une question de mise en page : c'est ce qui
décide où vit la barre de quota. Sur le web elle était en bas de page ; ici elle serait cachée
au moment exact où l'on tape sa question. Elle est donc **épinglée sous la barre de
navigation**, hors du flux défilant. Un refus au-delà du plafond est vécu comme une panne s'il
n'a pas été annoncé, et un quota caché n'a pas été annoncé.

Le clavier lui-même diverge, et c'est visible : iOS pose des **touches individuelles à capuchon
blanc** sur fond gris ; Gboard pose des **lettres nues** sur un fond plat, et intègre sa rangée
de suggestions au lieu de la poser au-dessus. C'est du chrome système, dessiné comme la barre
d'état.

**Hors connexion est meilleur en natif** — une des rares fois où le portage améliore l'écran au
lieu de le transposer. En web, c'est une requête qui échoue : l'écran apparaît après trente
secondes d'attente. En natif, le système annonce la perte de réseau **avant** qu'une requête
soit tentée, donc l'écran est juste dès la première image, et la file d'envoi devient un objet
permanent au lieu d'un rattrapage.

`NatMemoire` se porte **sans une ligne de différence**, et c'est un bon signe : cet écran ne
dépendait pas du support.

### Lot 3 — compte, préférences et le Club

`ScreensNatifCompte.js` — sept écrans (`natif-compte-club.html`). C'est le lot où **les
directives de publication décident du dessin, trois fois**, et où apparaît la première
divergence de *contenu* entre les deux plateformes.

| Règle | Conséquence sur l'écran |
|---|---|
| **App Store 4.8** — connexion tierce | « Se connecter avec Apple » est **obligatoire** dès qu'on offre Google. Le bouton n'existe que dans le châssis iOS, et l'encart compte « trois moyens » d'un côté, « deux » de l'autre |
| **App Store 5.1.1(v)** — suppression | Elle doit se faire **dans** l'app ; un lien vers le site ne suffit pas. Déjà le cas côté web, mais ça devient obligatoire au lieu d'être vertueux |
| **Achat intégré** | L'abonnement au Club est un achat numérique comme une formation : le mur renvoie au site, exactement comme celui des cours |

**La marque Apple ne se redessine pas.** L'asset officiel est fourni par Apple et son usage est
imposé par les mêmes directives. L'emplacement est réservé dans `NatConnexion` et
`NatCreation` — à remplir avant soumission.

**Les préférences gagnent ce que le web ne pouvait pas offrir** : une section de notifications
réelle, qui reflète l'état de la permission système et dit ce que l'app ne peut plus faire — si
la permission est coupée dans les réglages du téléphone, elle ne pourra pas reposer la question.
La ligne « par e-mail » reste grisée : **aucun canal d'envoi n'existe toujours**.

**L'agenda du Club est le seul écran du portage qui gagne une action native** : « ajouter à mon
agenda ». Une session dans l'agenda système survit à la désinstallation de l'app et ne dépend
d'aucune permission de notification. C'est le meilleur rappel possible, et il ne coûte rien.

Trois onglets du Club sur huit étaient dessinés à ce stade — le mur, le fil, l'agenda. Les
cinq autres ont été déclarés « portables à l'identique », ce qui était vrai de la mise en page
et **faux de la navigation** : voir le lot 5.

### Lot 4 — pôle média, Présence Digitale, console

`ScreensNatifMedia.js` — sept écrans (`natif-media-tpe-console.html`). Le portage est complet.

**Le gain décisif du virage est ici, et il n'a rien à voir avec l'apparence : dans un
navigateur, un podcast s'arrête quand on verrouille le téléphone.** En natif il continue. Pour
34 minutes écoutées dans un taxi, ce n'est pas une amélioration — c'est la différence entre
utilisable et inutilisable. Deux surfaces en découlent, sans équivalent web :

- **Le mini-lecteur** — persistant au-dessus de la barre d'onglets. Sur le site, quitter la page
  du podcast arrête le podcast ; ici la lecture continue pendant qu'on parcourt le catalogue.
- **L'écran verrouillé** — la surface la plus native du kit avec le widget, et un navigateur ne
  peut pas y écrire. Les deux plateformes la traitent différemment : iOS pose un lecteur pleine
  largeur sous une horloge géante centrée, Android une carte de notification média avec l'icône
  de l'app sous une horloge alignée à gauche.

**Présence Digitale ne porte aucune règle de magasin** : un pack se contracte hors application,
ce n'est pas du contenu numérique consommé dedans. Le devis part sur WhatsApp, comme sur le web.

### La console : sous-ensemble assumé, pas couverture partielle

**Cinq écrans sur dix-neuf** sont portés — ceux du rôle support, ceux qu'on traite debout. Les
quatorze écrans d'administration restent au **tableau de bord desktop 1440 px** : ils se
travaillent au clavier sur deux ou trois colonnes, et les porter sur un téléphone serait une
régression déguisée en couverture. C'est un choix, et il est écrit dans le pied de l'écran de
console lui-même — pas seulement dans ce fichier.

### Lot 5 — le Club au complet, et l'écran verrouillé

`ScreensNatifClub.js` — sept écrans (`natif-club-huit-onglets.html`). Le lot 3 avait déclaré
les cinq onglets restants « portables à l'identique ». Deux manques se cachaient derrière
cette phrase.

**La bande des huit, et pas des quatre.** Le web posait des bandes de quatre valeurs,
différentes d'un onglet à l'autre. En natif la barre basse occupe déjà le bas de l'écran : la
navigation interne du Club n'a plus qu'un endroit possible, juste sous la barre haute, et elle
doit porter les **huit** noms — sinon cinq onglets sur huit ne sont atteignables par aucun
geste. Elle vit donc dans `NativeShell.js` (`BandeClub`), pas dans un fichier d'écrans : neuf
écrans répartis sur deux lots la portent, et une bande recopiée par fichier dérive. Elle est
servie à **44 px**, le plancher de cible tactile — sur l'écran verrouillé, cette bande *est*
l'interaction principale. Le fil et l'agenda du lot 3 y ont été réalignés.

**Publier : deux emplacements, une action.** Android pose un bouton flottant au-dessus de la
barre d'onglets ; iOS met l'action en haut à droite de la barre haute, et sa barre reste vide
côté Android — deux entrées pour un même geste donneraient deux chemins. C'est la seule
divergence d'affordance du lot, et elle vient des deux conventions, pas de nous.

**L'écran verrouillé n'est pas le mur d'abonnement.** Le mur (écran 18) s'adresse à un visiteur
du site public ; celui-ci s'adresse à quelqu'un qui a **déjà un compte**, qui est dans l'app, et
qui vient de toucher un onglet précis. C'est la seule information qu'on ait en plus, et l'écran
est construit autour d'elle : un composant, huit contenus.

- **Aucun contenu flouté.** Un flou dit « il y a foule là-dedans, fais-nous confiance » ; le
  Club a ouvert cette année et ne peut pas dire ça. À la place, les compteurs réels de ce qui
  est derrière et un élément complet, non tronqué. Effet secondaire heureux : **c'est le seul
  écran du kit qui ne dépend d'aucun repli de flou** — sur Android, où le flou demande API 31+,
  un mur de vente bâti dessus tomberait précisément là où il doit convaincre.
- **La bande reste cliquable.** Masquer la navigation d'un espace verrouillé, c'est vendre une
  boîte fermée.
- **Le bouton n'achète pas** (App Store 3.1.1 · Play Payments) : 19 900 F encaissés dans l'app
  imposeraient le paiement du magasin, qui ne connaît ni Wave ni Orange Money. Il renvoie au
  site, sous une phrase qui nomme le magasin — quatrième apparition de la règle dans le kit,
  et la seule différence de fond entre cet écran et sa version web.

Deux onglets gagnent un canal que le web n'avait pas : le **digest** (Informations) et une
**mission publiée** (Opportunités) arrivent en notification. Par e-mail, toujours rien. Et le
parrainage gagne la **feuille de partage système** — le web ne pouvait que copier le code.

### Le compte final

**43 écrans dans les deux châssis** : 9 propres au natif, 34 portés. Ce qui reste hors du kit
est explicite, pas oublié — les quatorze écrans d'administration, qui appartiennent au desktop.

**Une réserve sur la console admin**, à trancher avant de la porter : dix-neuf écrans
d'administration sur un téléphone, pour un opérateur unique qui travaille au clavier. Le tableau
de bord desktop 1440 px existe déjà et répond mieux au même besoin. Porter la console en natif
demanderait de choisir un sous-ensemble — probablement les cinq écrans du rôle support, qui sont
les seuls qu'on traite debout.

## Fichiers

```
NativeShell.js                     les deux châssis + titres partagés
ScreensNatif.js                    les 9 écrans propres au natif
ScreensNatifApp.js                 lot 1 — 7 écrans (argent, apprentissage)
ScreensNatifEtats.js               lot 2 — 6 écrans (répétiteur, états) + le clavier
ScreensNatifCompte.js              lot 3 — 7 écrans (compte, préférences, Club)
ScreensNatifMedia.js               lot 4 — 7 écrans (média, TPE, console) + mini-lecteur
ScreensNatifClub.js                lot 5 — 7 écrans (6 onglets du Club + l'écran verrouillé)
chassis.html                       le même écran dans les deux châssis, annoté
natif-neuf-ecrans.html             les 9 écrans natifs, dans les deux châssis
natif-argent-apprentissage.html    lot 1, dans les deux châssis
natif-repetiteur-etats.html        lot 2, dans les deux châssis
natif-compte-club.html             lot 3, dans les deux châssis
natif-media-tpe-console.html       lot 4, dans les deux châssis
natif-club-huit-onglets.html       lot 5, dans les deux châssis
../../brand/native.css             zones sûres + politique de flou d'Android
```

## Un piège d'écriture, rencontré trois fois dans un même fichier

**Ne jamais déclarer une propriété longue puis son raccourci dans le même objet de style.**
Dans un objet JS, la dernière clé gagne :

```jsx
// FAUX — le raccourci remet le haut à zéro, en silence
style={{paddingTop:'73px', padding:'0 22px', marginTop:'73px', height:'100%'}}
// JUSTE — une seule déclaration, et le décalage DANS la boîte
style={{boxSizing:'border-box', padding:'73px 22px 0', height:'100%'}}
```

Le défaut ne lève aucune erreur et ne se voit pas à la lecture. Ici, `paddingTop` était mort,
donc c'est `marginTop` qui faisait le décalage — mais **une marge déplace la boîte au lieu de
la creuser**, et avec `height:100%` elle déborde d'autant. Sur l'écran verrouillé, ça coupait
**35 % du lecteur sur iOS** : exactement la rangée de commandes que la planche annonçait comme
le gain du natif.

Deux règles qui en découlent : une seule déclaration de `padding` par objet de style, et
`boxSizing:'border-box'` dès qu'une boîte combine `height:100%` et du rembourrage.

## Deux pièges de planche

Les pages de documentation de ce dossier portent leurs sélecteurs d'élément en **enfant
direct** (`.wrap > h1`), et c'est délibéré. Un sélecteur nu comme `.wrap h1{color:#fff}`
atteint aussi les `<h1>` que `NTitre` rend dans les maquettes montées dans la page, écrase
leur héritage de thème, et met un titre blanc sur fond clair — **1,00:1**, mesuré sur douze
cadres. Si tu ajoutes du style à une page qui monte des maquettes, porte-le.

**Quatorze maquettes par planche, pas vingt-six.** La planche du lot 5 en a d'abord monté
vingt-six — les huit contextes du cadenas en téléphones entiers. Chaque maquette porte trois
lobes de maillage floutés : à vingt-six, le fil principal était saturé en permanence et la page
ne répondait plus du tout.

La tentation est d'étaler le coût. Deux façons, toutes deux mauvaises, essayées dans cet ordre :

- **Observer l'entrée dans le champ** (`IntersectionObserver`) — l'intersection se calcule
  contre la fenêtre du document **racine**, et une planche rendue dans un cadre hors-écran
  n'intersecte jamais rien : **zéro** maquette montée.
- **Monter en file**, un cadre par image — la file n'accélère rien, elle attend son tour derrière
  les maillages déjà montés : **90 secondes** pour finir de dessiner, et une page inerte pendant
  ce temps. Le témoin est dans le dossier : `natif-compte-club.html`, quatorze cadres montés
  directement, remplit en **15 secondes**.

La correction n'est pas d'étaler le coût, c'est de **ne pas monter ce qui ne varie pas**. Les
huit contextes du cadenas partagent le même châssis, le même prix et le même encart : seuls le
titre, les trois compteurs et l'élément entier changent. Ils sont donc posés côte à côte **en
cartes**, pas en téléphones, et la planche revient à quatorze cadres — le compte éprouvé des
quatre autres.

## Le paquet de transfert

`handoff_natif/` — autonome, à télécharger et donner à un développeur. Il contient les
36 écrans avec un sélecteur (`apercu.html`), les six modules en `.jsx`, les 37 composants du
système en clair, leurs contrats de props, la fermeture CSS complète, et un README qui porte
les trois règles de magasin, les deux pièges d'écriture, et la liste de ce qui n'est
volontairement pas dans le kit.
