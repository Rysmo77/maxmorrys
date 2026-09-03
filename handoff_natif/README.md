# Applications natives iOS et Android — 36 écrans

Ce dossier est autonome : rien à installer, rien à servir. Ouvre `apercu.html` dans un
navigateur, choisis un écran en bas — il se rend **dans les deux châssis à la fois**.

```
apercu.html          les 36 écrans, sélecteur en bas
native-shell.jsx     les deux châssis — c'est le fichier à lire en premier
screens-natif.jsx    9 écrans propres au natif
screens-app.jsx      argent + apprentissage (7)
screens-etats.jsx    répétiteur + 4 états transverses (6) + le clavier
screens-compte.jsx   compte, préférences, Club (7)
screens-media.jsx    média, TPE, console support (7) + le mini-lecteur
components.jsx       les 37 composants du système, en clair
COMPOSANTS.md        leurs contrats de props, avec les raisons
css/                 styles.css + 17 fichiers de jetons et de recettes
assets/icons/        le logo Google, référencé par les écrans de connexion
```

---

## La règle qui décide tout : un corps, deux châssis

**Le contenu d'un écran est identique sur les deux plateformes ; seul le châssis diffère.**
Un écran qui aurait besoin de deux corps différents serait un écran où la marque a cédé aux
conventions — c'est un signal d'erreur, pas une exception à gérer.

`os="ios"` ou `os="android"` est le **seul** commutateur. Sur 36 écrans, exactement **deux**
divergent par leur contenu, et les deux à cause d'une règle de magasin (voir plus bas).

### Ce qui diffère, exhaustivement

| | iOS · iPhone 13/14 | Android · Pixel 8 |
|---|---|---|
| Gabarit | `390 × 844` | `412 × 915` |
| Zone sûre haute / basse | `47` / `34` | `24` / `24` (ou `48` en trois boutons) |
| Caméra | encoche large, attachée au bord | poinçon centré, détaché |
| Barre d'état | heure à gauche, triade à droite | heure **et** notifications à gauche, batterie **avec pourcentage** |
| Barre de navigation | `44px`, titre centré | `64px`, titre à gauche |
| Retour | chevron **+ libellé** | flèche seule |
| Barre basse | indicateur `134 × 5` | pilule `108 × 3` ou trois boutons |
| Clavier | `291px`, touches à capuchon blanc | `268px`, lettres nues sur fond plat |
| Flou | présent | **absent par défaut** |

Android est plus large **et** plus haut : un écran qui ne survit pas aux deux largeurs n'est
pas portable. Les deux se testent ensemble, jamais l'un après l'autre.

Le retour mérite un mot : le libellé d'iOS dit *où* l'on revient. Android ne l'a pas, parce que
le retour système peut venir d'ailleurs — et un libellé faux est pire que pas de libellé.

### Ce qui ne diffère pas

Maillage, cartes territoire, typographie, règle du monospace, encarts de vérité, mouvement,
hauteur de la barre d'onglets, voix. Écrit une fois. La liste est plus longue que celle des
différences, et c'est le but.

---

## Trois règles de magasin qui dessinent des écrans

Aucune n'est un détail juridique. Chacune change un écran, et deux créent la seule divergence
de *contenu* du kit.

| Règle | Conséquence |
|---|---|
| **App Store 3.1.1 / Play Payments** | **L'app ne vend rien.** Wave et Orange Money en direct dans l'app font rejeter l'app. Le mur de paiement ouvre ce qui est déjà payé et renvoie au site — même prix, mêmes moyens. Le module 1 reste regardable sans payer, dans l'app : c'est ce qui rend le mur supportable |
| **App Store 4.8** | « Se connecter avec Apple » est **obligatoire** dès qu'on offre Google. Le bouton n'existe que dans le châssis iOS, et l'encart compte « trois moyens » d'un côté, « deux » de l'autre |
| **App Store 5.1.1(v)** | La suppression de compte doit se faire **dans** l'app ; un lien vers le site ne suffit pas |

### À trancher avant soumission

1. **L'asset officiel de la marque Apple** — Apple le fournit et impose son usage. L'emplacement
   est réservé dans `NatConnexion` et `NatCreation`, à remplir. Elle ne se redessine pas.
2. **Le texte du mur nomme le magasin** (`App Store` / `Google Play`). Certaines revues rejettent
   la mention explicite d'un moyen de paiement externe. Une variante plus neutre est possible.
3. **Le lien sortant est une URL simple.** iOS propose un droit d'accès *External Purchase Link*
   qui autorise un lien d'achat déclaré ; sans lui, la revue peut refuser le bouton.

---

## Le verre sur Android : le repli est le cas normal

`RenderEffect`, l'équivalent Android de `backdrop-filter`, demande **API 31+**. Or le marché
visé est bas de gamme — le système le dit déjà : le repli web se déclenche à
`deviceMemory ≤ 2`. Construire le verre sur une capacité que la moitié du parc n'a pas, c'est
concevoir pour l'autre moitié.

Donc **aucun flou par défaut sous Android** (`css/brand/native.css`, portée `.andro`). Les
voiles montent pour compenser :

| Niveau | iOS | Android par défaut |
|---|---|---|
| chrome | blanc `.62` + `blur(24px)` | blanc `.86`, aucun flou |
| héros | blanc `.72` | blanc `.90` |
| nuit | encre `.72` | encre `.92` |

Le flou est un bonus, activé par `.andro.blur-ok` quand l'appareil le déclare — jamais une
hypothèse. **Le maillage, lui, est identique** : du dégradé et de la `transform`, gratuit
partout. C'est précisément ce qui permet à Android de perdre le flou **sans perdre l'identité**.
Un système dont l'identité reposait sur le flou seul n'aurait pas survécu à cette décision.

---

## Ce que le natif apporte vraiment

Trois gains, et aucun n'est visuel.

**1 · Un canal de relance.** La plateforme web n'a **aucun** canal d'envoi. Toute la conception
s'est pliée à ça : la carte de reprise est le premier objet de l'espace *parce que* la relance
ne pouvait venir que de l'écran lui-même. La notification poussée donne enfin ce canal, et le
**widget** en donne un second — qui n'interrompt jamais et ne demande aucune permission.
L'écran de permissions explique **avant** d'ouvrir le dialogue système, parce qu'iOS ne le
laisse poser qu'une fois.

**2 · La lecture en arrière-plan.** Dans un navigateur, un podcast **s'arrête quand on
verrouille le téléphone**. En natif il continue. Pour 34 minutes écoutées dans un taxi, ce n'est
pas une amélioration — c'est la différence entre utilisable et inutilisable. Deux surfaces en
découlent : le **mini-lecteur** persistant au-dessus de la barre d'onglets, et l'**écran
verrouillé**, où un navigateur ne peut pas écrire.

**3 · Le hors connexion honnête.** En web, c'est une requête qui échoue : l'écran arrive après
trente secondes. En natif, le système annonce la coupure **avant** qu'une requête soit tentée —
l'écran est juste dès la première image, et la file d'envoi devient un objet permanent au lieu
d'un rattrapage.

---

## Deux pièges qui ont coûté cher, à connaître avant d'écrire

### La barre d'onglets et la zone de geste

La marque impose ses **80 px** aux deux plateformes, et la zone sûre **s'ajoute**. Ça passe par
la prop **`safeBottom`** de `TabBar`, et ça ne peut pas passer ailleurs : `bottom:0` se résout
au bas de la **boîte de rembourrage**, donc aucun `paddingBottom` sur un ancêtre ne remonte un
enfant en `absolute`. Une enveloppe rembourrée ne fait rien du tout.

Sans ça, l'indicateur d'accueil se dessine par-dessus les onglets et les 34 px inférieurs de
chaque cible tombent dans la zone où l'OS intercepte le glissement : **la cible existe, mais le
geste ne lui parvient pas.**

### Une seule déclaration de `padding` par objet de style

```jsx
// FAUX — le raccourci écrase paddingTop, en silence
style={{paddingTop:'73px', padding:'0 22px', marginTop:'73px', height:'100%'}}
// JUSTE
style={{boxSizing:'border-box', padding:'73px 22px 0', height:'100%'}}
```

Dans un objet JS, **la dernière clé gagne** : la propriété longue devient du code mort, sans
erreur ni avertissement. Le décalage se retrouve porté par `marginTop`, qui **déplace** la boîte
au lieu de la creuser — et avec `height:100%` elle déborde exactement de la marge.

Ce que ça a coûté : **35 % du lecteur de l'écran verrouillé sur iOS**, soit la rangée de
commandes entière, c'est-à-dire précisément la fonctionnalité qui justifiait l'écran. Trois
occurrences dans un même fichier, écrites à quelques minutes d'intervalle. `grep` sur
`paddingTop:[^,}]+,\s*padding:` et ses variantes.

---

## Ce qui n'est pas dans le kit, et pourquoi

Rien n'est oublié ; ce qui manque est un choix.

- **Cinq onglets de liste du Club sur huit.** Ils se portent à l'identique des trois dessinés
  (le mur, le fil, l'agenda) — les dessiner un par un n'apprendrait rien.
- **Quatorze écrans d'administration sur dix-neuf.** Seuls les **cinq du rôle support** sont
  portés : ceux qu'on traite debout. Les autres restent au **tableau de bord desktop 1440 px**,
  qui existe déjà — ils se travaillent au clavier sur deux ou trois colonnes, et les porter sur
  un téléphone serait une régression déguisée en couverture. C'est écrit dans le pied de
  l'écran de console lui-même, pas seulement ici.

---

## Ce que ces écrans sont, et ne sont pas

Ce sont des **maquettes de référence**, pas du code de production : elles codent les données en
dur et gèrent l'état par `React.useState` local. Reprends la **structure**, les **valeurs de
style** et l'**ordre des éléments**. Pas l'architecture.

`components.jsx` en revanche est réutilisable tel quel : chaque composant est une fonction React
ordinaire aux styles en ligne, lisant les variables CSS de `css/`. Aucune dépendance npm.

**Un piège de chargement à connaître** : ces fichiers passent par Babel Standalone, qui bascule
en modules CommonJS dès qu'il voit **un seul** `import` ou `export`. Le navigateur échoue alors
sur `exports is not defined`, la page affiche son cadre mais aucun contenu, et l'erreur en
console ne nomme pas le coupable. C'est pour ça que `components.jsx` n'en contient aucun. Si une
maquette rend son châssis mais pas son contenu, c'est la première chose à vérifier.
