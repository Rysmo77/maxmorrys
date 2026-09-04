# Rysmo — application native iOS et Android

Projet Expo **autonome**. Il a son propre `package.json` et son propre verrou : la racine du
dépôt n'a pas de champ `workspaces`, et n'en aura pas (AD-9). La chaîne qui déploie le
site — `vite build` → `dist/` → Firebase Hosting → origin-pull Cloudflare — ne doit rien
savoir de ce dossier.

```bash
cd mobile && npm install
npm run start        # Expo Go, ou une build de développement
npm run typecheck
```

## Les trois décisions qui gouvernent ce dossier

### 1 · Une seule source de jetons, et elle est en CSS (AD-8)

React Native n'a ni CSS, ni cascade, ni `var()`. La tentation, à ce moment-là, est de retaper
les valeurs dans un objet JavaScript — et c'est ainsi qu'une palette dérive : pas d'un coup,
mais une valeur à la fois, sans que rien ne le signale.

`../src/design-system/tokens.generated.ts` est **généré** depuis les fichiers CSS du design
system, avec tous les `var()` déjà aplatis. Le natif n'importe que ce fichier. Il ne l'édite
jamais ; `npm run ds:check` à la racine échoue s'il est désynchronisé de sa source.

```ts
import { token } from '@tokens';
token('mmBleu');          // '#0057BC'
token('mmBleu', 'dark');  // '#6FB1FF'
```

Le mode sombre n'est **pas** un filtre appliqué au mode clair : sur les 206 jetons, **78
changent de valeur**, et les quatre teintes de marque sont redéclarées parce qu'une palette ne
se transpose pas d'un fond à l'autre. Le bleu `#0057BC` tombe à 2,84:1 sur `#0B0E13` et le
violet `#6C23DD` à 2,69:1 — tous deux interdits en texte. C'est l'inverse exact du mode clair,
où ce sont l'orange et le teal qui sont interdits.

### 2 · Le verre et le maillage ont un ÉQUIVALENT, pas une copie (AD-10)

| Web | Natif | Pourquoi |
|---|---|---|
| Maillage à trois lobes en dérive, `filter: blur(52px)`, animé en `transform` | Trois `RadialGradient` SVG **figés** | `filter` n'existe pas ; une dérive émulée coûterait un rendu par image, sur le profil d'appareil visé — 2 Go de mémoire, 4 cœurs |
| `.glass`, `backdrop-filter: blur(24px) saturate(170%)` | `BlurView` d'`expo-blur`, **uniquement sur le chrome fixe** | Même règle qu'au web : une seule catégorie de surface y a droit, celle sous laquelle le contenu passe réellement |
| `.glass-flat`, voile .78 sans flou | `View` opaque au voile de `--glass-a-flat` | Identique, et c'est le cas courant : tout ce qui défile |

Les équivalences sont déclarées ici, une fois. Elles ne se décident pas écran par écran.

### 3 · Aucun achat dans l'application (AD-11)

C'est la décision qui a failli empêcher cette application d'exister, et elle mérite d'être
comprise plutôt que subie.

Apple et Google prélèvent **15 à 30 %** sur tout achat de contenu numérique fait dans
l'application — en carte, sans Wave ni Orange Money. Sur une formation à 95 000 FCFA, c'est
**14 250 à 28 500 F par vente**. Et surtout : le paiement en monnaie électronique locale, qui
est le seul vrai avantage du produit sur ce marché, disparaît de l'écran d'achat.

Le tunnel natif s'arrête donc à la sélection du moyen de paiement, et **ouvre l'URL de
paiement du web dans le navigateur système** (`expo-web-browser`). Le montant débité reste
celui recalculé côté serveur, jamais celui transmis par le client.

> ⚠️ **Hypothèse non levée.** Ceci suppose que la revue Apple accepte ce renvoi au titre de
> l'App Store Review Guideline 3.1.1. **Ce n'est pas vérifié.** À trancher avant toute
> soumission. Le repli connu : retirer tout achat de l'application native et la cantonner à
> la consultation — les leçons, le répétiteur, le certificat.

## Ce que ce dossier contient aujourd'hui

Le socle **et les 52 écrans** — les 36 du transfert `handoff_natif/`, plus les écrans que ce
transfert déclare volontairement absents (les cinq onglets de liste du Club, les cinq écrans du
rôle support) et le tunnel de paiement que le web transmet. Il ne duplique toujours pas les
42 000 lignes du web : la logique métier — Firestore, paiement, i18n — reste côté web.

```
mobile/
  ds/          36 primitives — châssis, jetons, maillage, verre, typographie, contrôles, données
  app/         52 routes, routées par expo-router
  contenu/     le contenu de RÉFÉRENCE du transfert, cité et daté — une seule porte
```

### Les 36 primitives

| Famille | Primitives |
|---|---|
| **Châssis natif** | `Screen` `NavBar` |
| Fond et surfaces | `Mesh` `Surface` `Gradient` `Skeleton` `EmptyState` `TerritoryCard` |
| Typographie et nombres | `Display` `Body` `Eyebrow` `Num` |
| Actions | `Button` `Icon` `IconButton` `Fab` |
| Marque | `Wordmark` `GoogleMark` `AppleMark` |
| Formulaires | `Field` `Switch` `Segmented` `ChipRow` `PayOption` `StepDots` |
| Données | `Tag` `LessonRow` `ProgressBar` `QuotaMeter` `Avatar` `ChatBubble` `CheckLine` `DocLine` `PriceBlock` `StatTile` `MediaCard` |
| Navigation et lecture | `SubNav` `Pipeline` `MiniPlayer` |

### 4 · Le châssis porte la différence, et lui seul (AD-12)

`Screen` est la transposition de `NativeScreen` du transfert, et c'est la pièce qui fait tenir
sa thèse : **le corps d'un écran est écrit UNE fois.** Ce qui diffère d'une plateforme à
l'autre est court, et il est tout entier dans `Screen` et `NavBar` :

| | iOS | Android |
|---|---|---|
| Barre de navigation | `44 px`, titre centré | `64 px`, titre à gauche |
| Retour | chevron **+ libellé** (il dit OÙ l'on revient) | flèche seule |
| Barre d'onglets | translucide et floutée | opaque, détachée par son élévation |
| Transition | `slide_from_right`, 260 ms | `fade_from_bottom`, 200 ms |
| Bouton flottant | rond | arrondi carré |
| Zones sûres | **demandées au système**, jamais écrites | idem |

Le transfert code `47 / 34` et `24 / 24` parce qu'il simule deux appareils dans un cadre fixe.
En vrai, la zone sûre se DEMANDE : recopier 47 px creuserait un trou sur un Pixel 4a.

**Deux écrans divergent par leur CONTENU, et les deux à cause d'une règle de magasin** — la
connexion et la création : « Se connecter avec Apple » est obligatoire dès qu'on offre Google
(App Store 4.8), donc l'encart compte « trois moyens » d'un côté et « deux » de l'autre.

### 5 · Le contenu de référence est une DONNÉE, pas trente écrans qui inventent

Le transfert code ses valeurs en dur, et le dit : « ce sont des maquettes de référence, pas du
code de production […] reprends la structure, les valeurs de style et l'ordre des éléments.
Pas l'architecture. » Recopier ces valeurs DANS les écrans reproduirait exactement
l'architecture qu'on nous dit de ne pas reprendre.

`contenu/demo.ts` les porte donc **une fois**, avec sa source citée et sa date de relevé — et
**derrière un interrupteur fermé par défaut** :

```ts
// contenu/mode.ts
export const DEMO = process.env.EXPO_PUBLIC_CONTENU_DEMO === '1' || __DEV__;
```

| Profil | `EXPO_PUBLIC_CONTENU_DEMO` | Ce que l'application affiche |
|---|---|---|
| serveur Metro (`npm run start`) | — (`__DEV__`) | le contenu du transfert |
| `development` · `preview` | `1`, déclaré dans `eas.json` | le contenu du transfert |
| **`production`** | **absent** | **rien d'inventé** — chaque écran dit ce qu'il ne sait pas |

**Le mécanisme n'est pas une promesse.** `contenu/demo.ts` type ses 33 sorties `T | null` ou
`readonly []` : un écran qui ne traite pas l'absence **ne compile pas**. C'est le compilateur
qui tient la garantie d'exécution, pas la vigilance de qui relit.

Les variables `EXPO_PUBLIC_*` étant inlinées à la construction, la condition devient
littéralement `false` en production et le minifieur retire la plus grande partie du contenu :
**3,4 Ko de moins**, et les textes du transfert n'y sont plus. ⚠️ L'élimination n'est
cependant **pas totale** — quelques codes courts survivent au repliage. Ils sont inatteignables
à l'exécution, mais lisibles par qui décompresse le paquet : la garantie qui compte est celle
de l'exécution, celle du paquet est un bonus partiel. (Mesuré, pas supposé.)

Ce qui NE passe pas par l'interrupteur : `contenu/portee.ts`, la carte des cinq écrans du rôle
support. **Ce qui route reste, ce qui raconte disparaît** — sinon `/console` et `/403`
annonceraient cinq écrans sans pouvoir en ouvrir un.

La règle 6 n'est pas contournée — `<Num>` exige toujours une source et une date, et il écrit
« non relevé » sans elles. Brancher Firestore, c'est remplacer ce module ; les écrans ne
changent pas. Un paramètre de route prime toujours sur la référence : le jour où le catalogue
arrive du serveur, il transmet ses valeurs et rien d'autre ne bouge.

`tests/unit/mobile-ds.test.ts` refuse qu'un build `production` porte le drapeau, qu'une sortie
du module échappe à l'interrupteur, ou qu'un écran recopie une valeur en contournant la porte.

**Un écran importe depuis `../ds`, jamais d'un chemin profond** : le jour où une primitive
change de fichier, c'est l'écran qui casse sans que rien ne l'ait annoncé.

**Aucune couleur n'est écrite dans un écran.** `useToken()` est la seule source, et `veil()`
dérive un fond translucide de son encre plutôt que d'en figer les canaux — un `rgba` écrit à la
main garderait le vert du mode clair alors que `--ok` change en nuit. Ces trois règles sont
vérifiées par `tests/unit/mobile-ds.test.ts`, depuis la suite de la racine : ce dossier n'a pas
de lanceur de tests à lui, et n'en aura pas.

**Trois fichiers font exception, et chacun pour une raison écrite** : `ds/theme.tsx` (le pont
de jetons), `ds/Surface.tsx` (il convertit les voiles du système en couleurs opaques) et
`ds/BrandMarks.tsx` — les marques tierces. Ce dernier renverse la règle : Google impose ses
quatre couleurs et Apple son noir, et les faire suivre notre thème serait une infraction à
leurs directives, sur l'écran de connexion. Une valeur figée y est la bonne réponse.

⚠️ **La pomme d'Apple est un EMPLACEMENT RÉSERVÉ.** Son usage impose l'asset officiel qu'Apple
fournit ; le glyphe actuel tient la place, la taille et l'alignement. **À remplacer avant toute
soumission** — c'est l'un des trois points que le transfert liste comme à trancher.

### Les deux moments scénarisés sont ici

Le système n'accorde une mise en scène qu'à deux endroits du produit, et les deux sont portés :

- **L'attente de paiement** (`app/attente.tsx`) — deux anneaux, `scale` 1 → 1,85, opacité .5 → 0,
  2,6 s, le second décalé de 1,3 s, en boucle. `useNativeDriver: true` : `scale` et `opacity`
  sont les deux propriétés que le pilote natif accepte, et exactement les deux que la règle 3
  autorise. **Pas de compte à rebours** — la durée dépend de Wave.
- **L'émission du certificat** (`app/certificat.tsx`) — brillance diagonale, deux passages, puis
  arrêt définitif. Non rejouable.

Les deux respectent `AccessibilityInfo.isReduceMotionEnabled()`, et n'y répondent pas en
ramenant les durées à 1 ms — ce qui ferait tourner une boucle à plein régime pour un résultat
immobile — mais en **ne lançant aucune animation**.

### Le contenu de démonstration, et l'interrupteur qui le retient

Le port d'origine ne simulait rien. **Le portage du transfert a levé cette règle** — un kit de
36 écrans ne se juge pas sur 36 états vides — et la première version l'a levée SANS filet : un
APK a circulé où quelqu'un voyait une formation qu'il n'avait pas achetée, un certificat au nom
d'une autre, et des messages du Club signés par des gens qui ne les avaient jamais écrits.

Deux fichiers affirmaient encore, à ce moment-là, qu'aucune donnée n'était simulée. **C'était
le vrai défaut** : pas le contenu de démonstration, mais la documentation qui le niait.

L'interrupteur ci-dessus règle les deux. En production, `contenu/demo.ts` ne rend rien et
`<SansDonnees>` prend le relais, en trois temps : ce qui manque, d'où ça vient, et **pourquoi
rien n'est inventé à la place**. Un composant plutôt qu'une phrase recopiée — à 27 écrans, une
phrase recopiée devient 27 formulations qui divergent, et la troisième ligne est la première à
sauter.

⚠️ **Une garantie qui n'en était pas une, pour mémoire.** Chaque nombre porte sa source
(`{cite:'handoff_natif — kit de référence'}`), et cette citation avait été présentée comme une
protection. Elle n'en est pas une : `<Num>` la reçoit et la jette (`void source; void asOf;`).
Elle sert la revue de code, pas la personne qui tient le téléphone. **Une provenance invisible
n'est pas une provenance** — seul l'interrupteur l'est.

Corollaire toujours vrai : **un nombre n'existe que s'il arrive avec sa date de relevé.** Sans
elle, `<Num>` écrit « non relevé ». Un zéro DATÉ, lui, s'affiche — c'est une information.

### Ce qui n'est pas encore branché

**Chaque écran concerné le DIT chez lui**, en nommant le paquet manquant et ce que brancher
changerait. Aucun n'est un bouton mort : ils rendent le geste, et disent où il s'arrête.

| Ce qui manque | Le paquet | Les écrans concernés |
|---|---|---|
| La lecture audio en fond | `expo-audio` + `UIBackgroundModes` / service de premier plan | `media` `episode` `verrouille` — c'est le chantier n° 1, et l'argument même du virage natif |
| La notification poussée | `expo-notifications` + un serveur qui envoie | `permissions` `profil` — ⚠️ le profil AFFIRMAIT « Autorisées sur cet appareil », coche verte, pour une permission que rien ne demandait |
| L'écriture dans l'agenda | `expo-calendar` | `club/agenda` — ⚠️ le `.ics` qu'il proposait N'EXISTAIT PAS : mesuré, `maxmorrys.me/club/agenda.ics` répond `200` avec `content-type: text/html`, c'est-à-dire la coquille SPA. Le bouton a été retiré |
| La biométrie | `expo-local-authentication` | `biometrie` `profil` |
| L'orientation paysage | `expo-screen-orientation` | `plein-ecran` — il TIENT en portrait en attendant |
| L'état du réseau | `expo-network` | `hors-connexion`, aujourd'hui une destination |
| Le widget d'accueil | WidgetKit / Glance, hors React Native | `widget` en est l'écran d'INSTALLATION, pas une imitation |

### ✅ Les trois fontes SONT chargées, aux neuf graisses du kit

Cette table portait une ligne « Les trois fontes », et elle est retirée plutôt que laissée à
quelqu'un qui la croirait. Les neuf fichiers déclarés par le kit (Fraunces 400/700/900,
Schibsted Grotesk 400/500/600/700, JetBrains Mono 400/700) vivent dans `assets/fonts/` et
arrivent par DEUX chemins, dont aucun ne remplace l'autre :

- **le greffon `expo-font`** (`app.json`) les lie au projet natif. C'est lui qui rend les
  graisses sur Android : une famille XML par nom, un `app:fontWeight` par graisse, enregistrée
  par `addCustomFont` — le seul chemin qu'Android consulte avant sa case NORMAL ;
- **`ds/Fontes.ts`** les charge à l'exécution. C'est lui qui pose, sur iOS, l'alias sans espace
  (`SchibstedGrotesk`) que les écrans écrivent et que la vraie famille (« Schibsted Grotesk »)
  ne fournit pas.

`app/_layout.tsx` ne rend rien tant que la question n'est pas tranchée, pour qu'aucun premier
écran ne parte en police système avant de sauter à la marque ; un échec de chargement rend
quand même, et le dit. `tests/unit/mobile-fontes.test.ts` (17 vérifications) tient toute la
chaîne : `fonts.css` → `ds/Fontes.ts` → `assets/fonts/` → `app.json` → les octets eux-mêmes,
dont il lit les tables `OS/2` et `name` plutôt que de croire les noms de fichiers.

**Ce qui reste approximé** : sur iOS, les deux familles dont le vrai nom porte une espace
passent par l'alias, qui ne rend qu'UNE fonte — leurs 500/600/700 s'y ramènent au 400. Le
fermer demanderait de renommer la famille dans les trente-neuf fichiers qui la citent.

⚠️ **Le `prebuild` est la seule preuve** que les graisses sont liées côté natif : ni le
typecheck ni `expo export` n'exécutent les greffons. `npx expo prebuild --platform android
--clean --no-install`, puis lire `android/app/src/main/res/font/`.

### ✅ Le SDK Firebase, lui, EST branché — et voici jusqu'où

Cette section disait l'inverse. Elle est corrigée ici plutôt que laissée à quelqu'un qui
l'aurait crue : le vrai défaut de la fois précédente n'était pas le contenu simulé, c'était la
documentation qui le niait.

**Ce qui marche** : la connexion et la création de compte par e-mail, la réinitialisation du
mot de passe, la déconnexion, la suppression de compte (App Store 5.1.1(v)), l'export RGPD, et
sept vues de lecture — profil, reprise, catalogue, certificats, Club, notes, programme d'un
module.

**Deux décisions structurent tout le reste :**

- **`firebase/auth` seulement.** `firebase/firestore` n'entre pas dans `mobile/`. Ce que les
  écrans consomment est un modèle de VUE, pas un document : `FORMATION.arret`, `CLASSEMENT`,
  `CLUB.bilan` sont des jointures. Les refaire côté client réimplémenterait la logique métier
  sans test partagé, ferait payer les règles (`hasActiveClubSub()` fait un `get()` par lecture)
  et ajouterait ~250 Ko pour un cache hors-ligne qui, sur React Native, ne vit qu'en mémoire.
- **Les lectures passent par `api.maxmorrys.me`**, qui parle déjà le protocole `onCall`. Le
  serveur ESTAMPILLE chaque réponse (`releveA`), et c'est ce que `<Num asOf>` attendait : les
  écrans citaient jusqu'ici une date en dur du 2 septembre.

⚠️ **Ces vues lisent avec un compte de service, donc SANS `firestore.rules`.** Chaque handler
refait ses contrôles à la main, et `tests/unit/worker-vues-natives.test.ts` refuse un handler
Club qui ne revérifierait pas l'abonnement — sans quoi tout le contenu payant devient lisible
par n'importe quel compte gratuit.

**Ce qui reste à brancher** : le fil du Club et ses six onglets, le pôle média, le répétiteur,
la console support, l'écriture (notes, progression). Le mécanisme est posé : un handler, un
hook, un nom dans `MIGRATED`.

`setTutorNom()` ne persiste pas, et **ne doit pas** persister localement : le nom du tuteur vit
dans le profil (`users/<uid>.tutorName`), comme au web. Un magasin local créerait une seconde
source de vérité à réconcilier. `appMoi` le renvoie désormais ; ce module reste un cache de
session, alimenté au démarrage.

## Les écrans, et lesquels portent la barre

Le kit désigne cinq onglets, et le troisième n'a pas de nom fixe
(`reference/screens-space.jsx`, `mmTabItems`) :

| Onglet | Fichier | Territoire |
|---|---|---|
| Espace | `app/(tabs)/index.tsx` | forme |
| Cours | `app/(tabs)/cours.tsx` | forme |
| **`useTutorNom()`** — « Répétiteur » par défaut | `app/(tabs)/repetiteur.tsx` | transforme |
| Club | `app/(tabs)/club.tsx` | transforme |
| Profil | `app/(tabs)/profil.tsx` | informe |

**Le troisième onglet porte le nom que la personne a donné à son tuteur.** « Rysmo » est le nom
de CETTE APPLICATION ; « Répétiteur » est le nom par défaut du tuteur qu'elle contient. Les
confondre dans un libellé rendrait le renommage inintelligible — quelqu'un aurait renommé son
tuteur et lirait encore le nom du produit.

⚠️ **La barre lit `useTutorNom()`, pas `tutorNom()`.** L'accesseur simple ne redemande aucun
rendu : renommer depuis l'écran de mémoire changeait la valeur et laissait la barre sur
l'ancien nom, jusqu'au prochain rendu. C'est le défaut exact trouvé au web, où la barre haute
et le corps du même écran affichaient deux noms. `useTutorNom()` abonne au magasin ; le test
`mobile-ds` refuse qu'un composant affiche le nom autrement.

Hors de la barre, **quarante-sept routes de pile**, groupées comme le transfert les groupe :

| Parcours | Routes |
|---|---|
| Propres au natif | `lancement` `onboarding` `permissions` `biometrie` `telechargements` `plein-ecran` `widget` `partage` |
| Le chemin de l'argent | `formation` (le mur) `paiement` `attente` `succes` `echec` |
| Apprentissage | `lecon` `notes` `certificat` `certificats` |
| Le répétiteur | `memoire` — la conversation est l'onglet |
| Le Club | `club/` — `fil` `discussions` `agenda` `membre` `classement` `opportunites` `parrainage` `infos` |
| Compte | `connexion` `creation` `mot-de-passe` `suppression` — les préférences SONT l'onglet Profil |
| États | `chargement` `hors-connexion` `erreur` `interdit` `+not-found` |
| Média | `media` `episode` `video` `verrouille` |
| TPE et console | `presence` `devis` `console/` — `messages` `temoignages` `rendez-vous` `prospects` `projets` |
| La planche | `apercu` — les 52 écrans, dans l'ordre du transfert |

**`apercu` n'est pas un écran de démonstration : c'est ce qui referme la carte de navigation.**
Sept écrans du kit sont des ÉTATS ou des surfaces système — le chargement, l'erreur, le /403, le
widget, l'écran verrouillé, le plein écran, le partage. Aucun n'a de place dans un menu : on y
arrive par le code. Sans cette planche, ce sont sept routes qu'aucun lien n'ouvre — et sur un
routeur par fichiers, une route morte ne se voit pas manquer.

**`/catalogue` a disparu, absorbé par l'onglet `cours`.** Il rendait un SECOND catalogue, avec
sa propre liste et son propre état vide : deux écrans pour la même chose, dont un que plus rien
n'ouvrait une fois l'onglet en place. L'onglet a repris ses trois états — liste transmise, zéro
daté, rien de transmis — parce que c'est cette distinction-là qui valait d'être gardée.

`erreur` et `interdit` n'ont volontairement aucune entrée de menu : ce sont des DESTINATIONS,
atteintes par le code — comme `/403` au web. `+not-found` y renvoie tout lien profond périmé,
avec un motif réel plutôt qu'un « une erreur est survenue ».

**⚠️ LE TUNNEL DE PAIEMENT N'EXISTE PLUS.** Ce paragraphe décrivait le routage des trois issues
d'un retour de paiement. L'application est passée en CONSULTATION SEULE : elle ouvre ce qui est
déjà acquis et ne propose rien à l'achat. `paiement`, `attente`, `succes` et `echec` ont été
supprimés, et avec eux le renvoi vers la boutique du site.

C'est le repli que ce README nommait lui-même comme la sortie de l'hypothèse non levée sur
l'App Store 3.1.1 — appliqué. Ce qui a disparu n'est pas seulement le bouton : c'est aussi le
texte qui NOMMAIT le magasin. Une revue lit les chaînes autant que les contrôles, et citer la
règle qu'on contourne est un signal aussi net qu'un lien d'achat.

`presence` et `devis` gardent leurs prix : Présence Digitale est une prestation du MONDE RÉEL,
que la règle 3.1.5(a) exige justement de transacter hors du magasin.

## Le jeu d'icônes est partagé, pas recopié (même raisonnement qu'AD-8)

`mobile/ds/Icon.tsx` rend `react-native-svg` à partir de `src/design-system/icons.ts` — le
module de DONNÉES que le composant DOM du web lit aussi. Les tracés vivaient auparavant dans
`react/brand/Icon.tsx`, un composant DOM que le natif ne peut pas importer ; la tentation
était alors de les retaper ici, et c'est ainsi qu'un jeu d'icônes dérive. Ajouter un glyphe le
fait désormais apparaître des deux côtés.

## Construire un binaire : où on en est exactement

Le projet **passe `npx expo-doctor` sur 21 vérifications sur 21**, **génère ses projets natifs**
(`npx expo prebuild` écrit `ios/` et `android/`, tous deux ignorés par git — ils se régénèrent)
et **se bundle pour les deux plateformes** :

```
npx expo export --platform ios --platform android
  › ios bundles      entry.hbc   2,8 Mo
  › android bundles  entry.hbc   3,1 Mo
```

⚠️ **AUCUN BINAIRE N'A ÉTÉ PRODUIT, et il ne peut pas l'être sur cette machine.**
`xcodebuild` pointe sur les Command Line Tools et non sur Xcode ; Java est en 8 quand React
Native 0.86 réclame 17 ou plus ; aucun SDK Android n'est installé. `eas.json` est écrit et
`eas` est là — la construction passera par le nuage, ou par un poste outillé.

Il manque alors deux choses qui ne sont pas du code : un **compte Apple Developer** (99 $/an)
avec son identifiant d'application enregistré, et un **compte Google Play** (25 $ une fois).

⚠️ **Deux délais qui ne se rattrapent pas, et qui doivent démarrer AVANT le code restant :**
en Organisation, l'inscription Apple exige un numéro D-U-N-S — 2 à 4 semaines pour une entité
sénégalaise. Et si le compte Play est personnel et créé après novembre 2023, Google exige
**12 testeurs pendant 14 jours consécutifs** avant même de pouvoir demander l'accès production.

La question sur la règle 3.1.1, elle, est TRANCHÉE : l'application ne vend plus rien, donc elle
ne se pose plus. Dividende direct — aucun accord « Paid Applications » à signer chez Apple, et
« financial features : non » chez Google.

Cinq profils EAS existent désormais, et deux comblent des trous qui coûtaient cher :
`preview-device` (l'ancien `preview` est `simulator: true`, il ne s'installe sur AUCUN iPhone)
et `release-candidate` — un build de production avec le contenu réel, **pour les captures
d'écran**. Des captures prises depuis `preview` montreraient Aïssatou Ndiaye et des messages
fabriqués : un état que la production ne rend jamais, donc un rejet 2.3.3 après avoir tout fait
juste par ailleurs.

### Le défaut qui rendait tout cela impossible, et que rien ne voyait

Trois fichiers de `ds/` importaient **au-dessus** de `mobile/` — `../../src/design-system/…`
pour les jetons et les tracés d'icônes. TypeScript résout ces chemins, donc le typecheck natif
était vert depuis le début. **Metro n'en résout aucun** : il ne sort pas de la racine du projet.

```
Error: Unable to resolve module ../../src/design-system/tokens.generated
```

L'application ne pouvait ni se bundler, ni tourner, ni se construire — et la seule porte qui
existait disait le contraire. L'intention était juste (une seule source de vérité, AD-8) ; le
mécanisme ne l'était pas. `npm run ds:tokens` écrit désormais les jetons **et** les tracés dans
`mobile/ds/*.generated.ts`. La source reste le CSS du système ; le dossier natif reste autonome
(AD-9). `tests/unit/mobile-ds.test.ts` refuse tout nouveau franchissement.

### L'icône est PROVISOIRE, et c'est une décision de marque

Le kit ne dessine aucune icône d'application. Celle-ci ne l'invente pas : elle reprend la seule
forme que le système nomme — « quatre chevrons en rangée, la silhouette du M, lue
horizontalement » (`reference/responsive.jsx:136`) — une couleur par territoire, dans l'ordre
des verbes. Aucune valeur hors système.

C'est une proposition, pas un choix arrêté. Une icône d'application se décide, elle ne se
déduit pas d'une planche : **à trancher avant toute soumission.**

L'écran de lancement, lui, est celui d'Expo par défaut : `expo-splash-screen` n'est pas
installé, et déclarer son greffon sans son paquet fait échouer le `prebuild`.

## ⚠️ Ce dossier n'avait jamais pu s'installer

`npm install` échouait en `ERESOLVE` : `react-native@0.87.1` exige `react@^19.2.3`, et le
`package.json` épinglait `19.2.0`. Aucun `npm run typecheck` n'avait donc jamais tourné ici,
et deux défauts avaient survécu à la relecture :

- `ds/Button.tsx` portait `accessibilityState={{ !!disabled }}` — une erreur de syntaxe, pas
  une erreur de type : le fichier ne se parsait pas.
- `tsconfig.json` n'incluait pas les modules partagés de `src/design-system/`.

L'épinglage est corrigé et les deux défauts avec. `npm run typecheck` est désormais
silencieux — et c'est la première fois.
