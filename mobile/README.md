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

Le socle et le chemin principal. Il **ne duplique pas** les 42 000 lignes du web : la logique
métier — Firestore, paiement, i18n — reste côté web, et l'application native consomme les
mêmes données par le SDK Firebase JavaScript.

```
mobile/
  ds/          port natif des primitives — jetons, maillage, verre, typographie
  app/         écrans, routés par expo-router
```

## Les écrans, et lesquels portent la barre

Le kit désigne cinq onglets, et le troisième n'a pas de nom fixe
(`ui_kits/plateforme/ScreensSpace.js`, `mmTabItems`) :

| Onglet | Fichier | Territoire |
|---|---|---|
| Espace | `app/(tabs)/index.tsx` | forme |
| Cours | `app/(tabs)/cours.tsx` | forme |
| **`tutorNom()`** — « Répétiteur » par défaut | `app/(tabs)/repetiteur.tsx` | transforme |
| Club | `app/(tabs)/club.tsx` | transforme |
| Profil | `app/(tabs)/profil.tsx` | informe |

Hors de la barre, en écrans de pile : `app/lecon.tsx` (le lecteur) et `app/paiement.tsx`.

**Le troisième onglet porte le nom que la personne a donné à son tuteur.** « Rysmo » est le
nom de CETTE APPLICATION ; « Répétiteur » est le nom par défaut du tuteur qu'elle contient.
Les confondre dans un libellé rendrait le renommage par personne inintelligible — quelqu'un
aurait renommé son tuteur et lirait encore le nom du produit. D'où `mobile/ds/tutor.ts`, lu
par la barre **et** par l'écran, jamais recopié.

**Aucun écran ne simule de données.** Les quatre nouveaux disent explicitement ce qui n'est
pas encore branché plutôt que d'afficher une liste de démonstration : un cours inventé est un
cours qu'on croit avoir, un message inventé dans le fil du Club est attribué à quelqu'un.

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
