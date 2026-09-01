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

Le socle **et les écrans**. Il ne duplique toujours pas les 42 000 lignes du web : la logique
métier — Firestore, paiement, i18n — reste côté web, et l'application native consomme les mêmes
données par le SDK Firebase JavaScript, qui n'est pas encore branché.

```
mobile/
  ds/          24 primitives — jetons, maillage, verre, typographie, contrôles, données
  app/         34 routes, routées par expo-router
```

### Les 24 primitives

| Famille | Primitives |
|---|---|
| Fond et surfaces | `Mesh` `Surface` `Skeleton` `EmptyState` `TerritoryCard` |
| Typographie et nombres | `Display` `Body` `Eyebrow` `Num` |
| Actions | `Button` `Icon` |
| Formulaires | `Field` `Switch` `Segmented` `ChipRow` `PayOption` `StepDots` |
| Données | `Tag` `LessonRow` `ProgressBar` `QuotaMeter` `Avatar` `ChatBubble` `CheckLine` `DocLine` `PriceBlock` `StatTile` |

**Un écran importe depuis `../ds`, jamais d'un chemin profond** : le jour où une primitive
change de fichier, c'est l'écran qui casse sans que rien ne l'ait annoncé.

**Aucune couleur n'est écrite dans un écran.** `useToken()` est la seule source, et `veil()`
dérive un fond translucide de son encre plutôt que d'en figer les canaux — un `rgba` écrit à la
main garderait le vert du mode clair alors que `--ok` change en nuit. Ces trois règles sont
vérifiées par `tests/unit/mobile-ds.test.ts`, depuis la suite de la racine : ce dossier n'a pas
de lanceur de tests à lui, et n'en aura pas.

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

### Aucun écran ne simule de données

C'est la règle qui a le plus gouverné ces écrans. Aucune liste de démonstration : chaque écran
lit ses valeurs par `useLocalSearchParams()` ou **dit précisément ce qui n'est pas branché, et
le dommage qu'une simulation causerait**. Un cours inventé est un cours qu'on croit avoir ; un
message inventé dans le fil du Club porte le nom de quelqu'un qui ne l'a jamais écrit ; un
budget inventé fixe une attente de revenu.

Corollaire : **un nombre n'existe que s'il arrive avec sa date de relevé.** Sans elle, `<Num>`
écrit « non relevé ». Un zéro DATÉ, lui, s'affiche — c'est une information.

### Ce qui n'est pas encore branché

Le SDK Firebase, donc : l'authentification, la lecture des inscriptions, l'écriture d'une note,
le quota du répétiteur, les échanges. Là où le geste existe déjà sur le web, l'écran ouvre le
site dans le navigateur système avec la même session (`openAuthSessionAsync`), pour la même
raison qu'AD-11 : ne pas faire semblant d'avoir ce qu'on n'a pas.

`setTutorNom()` ne persiste pas, et **ne doit pas** persister localement : le nom du tuteur vit
dans le profil (`users/<uid>.tutorName`), comme au web. Un magasin local créerait une seconde
source de vérité à réconcilier. Ce module est un cache de session, à alimenter depuis le profil
au démarrage quand Firebase sera là.

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

Hors de la barre, **vingt-neuf routes de pile**, groupées par parcours :

| Parcours | Routes |
|---|---|
| Le chemin de l'argent | `catalogue` `formation` `paiement` `attente` `succes` `echec` |
| Apprentissage | `lecon` `notes` `certificat` |
| Le répétiteur | `memoire` — la conversation est l'onglet |
| Le Club | `club/` — `fil` `discussions` `agenda` `membre` `classement` `opportunites` `parrainage` `infos` |
| Compte | `connexion` `creation` `mot-de-passe` `preferences` `suppression` |
| États | `hors-connexion` `erreur` `interdit` `+not-found` |
| Média | `media` `episode` `video` |

`erreur` et `interdit` n'ont volontairement aucune entrée de menu : ce sont des DESTINATIONS,
atteintes par le code — comme `/403` au web. `+not-found` y renvoie tout lien profond périmé,
avec un motif réel plutôt qu'un « une erreur est survenue ».

**Le retour de paiement est routé.** Le tunnel ouvre le web puis revient sur `rysmo://paiement/retour` ;
ce retour n'avait aucun destinataire, et quelqu'un qui venait de valider dans Wave retombait sur
l'écran de paiement sans savoir si sa transaction était passée. Les trois issues sont désormais
traitées, et aucune n'est devinée : le verdict est LU dans l'URL de retour, et un navigateur
fermé mène à l'attente — la seule chose qu'on sache alors.

## Le jeu d'icônes est partagé, pas recopié (même raisonnement qu'AD-8)

`mobile/ds/Icon.tsx` rend `react-native-svg` à partir de `src/design-system/icons.ts` — le
module de DONNÉES que le composant DOM du web lit aussi. Les tracés vivaient auparavant dans
`react/brand/Icon.tsx`, un composant DOM que le natif ne peut pas importer ; la tentation
était alors de les retaper ici, et c'est ainsi qu'un jeu d'icônes dérive. Ajouter un glyphe le
fait désormais apparaître des deux côtés.

## ⚠️ Ce dossier n'avait jamais pu s'installer

`npm install` échouait en `ERESOLVE` : `react-native@0.87.1` exige `react@^19.2.3`, et le
`package.json` épinglait `19.2.0`. Aucun `npm run typecheck` n'avait donc jamais tourné ici,
et deux défauts avaient survécu à la relecture :

- `ds/Button.tsx` portait `accessibilityState={{ !!disabled }}` — une erreur de syntaxe, pas
  une erreur de type : le fichier ne se parsait pas.
- `tsconfig.json` n'incluait pas les modules partagés de `src/design-system/`.

L'épinglage est corrigé et les deux défauts avec. `npm run typecheck` est désormais
silencieux — et c'est la première fois.
