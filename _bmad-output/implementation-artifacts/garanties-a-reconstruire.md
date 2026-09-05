---
date: '2026-09-05'
statut: 'dette ouverte — à solder au lot 6 de la réécriture native'
---

# Les garanties perdues avec React Native, et ce qu'elles tenaient

Treize suites de test disparaissent avec `mobile/` : **2 448 lignes, 110 cas**. Elles étaient
écrites en TypeScript et lisaient des fichiers TypeScript avec des expressions régulières —
aucune ne survit à un changement de langage.

Ce fichier existe pour qu'on ne les réécrive pas **de mémoire**. Trois d'entre elles ont
attrapé des défauts réels que ni le compilateur ni la relecture ne voyaient, et ces défauts se
reproduiront : ce ne sont pas des accidents de React Native, ce sont des accidents d'humains
qui construisent une interface.

## ⭐ Les trois qui ont mordu pour de vrai

### 1 · `mobile-controles-morts.test.ts` — 231 lignes, 6 cas

**Ce qu'elle tenait :** aucun contrôle ne fait semblant. Tout composant portant un libellé
d'accessibilité doit porter un gestionnaire, sauf s'il est explicitement éteint.

**Ce qu'elle a attrapé :** six boutons parfaitement morts — l'envoi au répétiteur, l'export
RGPD, « Tout effacer », « Signaler », et quatre boutons d'icône. Puis, après durcissement :
deux sélecteurs à choix sans `onChange` (langue et apparence du profil), un filtre de
catalogue inerte, et deux `Pressable` de plein écran qui s'animaient sous le doigt avec un
`onPress` valant `undefined`.

**Les deux pièges de sa propre écriture, à ne pas refaire :**
- borner une signature par `[^)]*` échoue sur `onPress?: () => void`, qui contient des
  parenthèses ;
- n'examiner que le CORPS d'une fabrique, jamais sa signature — sinon le marqueur `onPress?:`
  satisfait lui-même le motif de dérivation, et la porte se laisse convaincre par la
  déclaration du problème.

**Équivalent natif :** règle Detekt maison sur les `@Composable` qui portent
`contentDescription` sans `onClick`, plus un test d'instrumentation qui parcourt l'arbre
sémantique et refuse un nœud cliquable sans action.

### 2 · `mobile-routes.test.ts` — 126 lignes, 3 cas

**Ce qu'elle tenait :** tout lien mène à un écran qui existe, et tout écran est atteignable.

**Ce qu'elle a attrapé :** trois des quatre cartes du premier écran pointaient vers des routes
du SITE (`/formations`, `/blog`, `/presence`) qui n'existent pas dans l'application — et le
typecheck était vert.

⛔ **Son angle mort, mesuré, à ne surtout pas reproduire :** elle cherchait toute chaîne
littérale commençant par `/` dans n'importe quel fichier. Or la planche d'atelier
(`apercu.tsx`) écrivait les 48 adresses en dur. **Toute route y était donc « citée », et le
test restait vert alors qu'aucun écran de production ne menait à onze d'entre elles** — dont
l'écran de lancement, point d'entrée conçu de l'application.

**Équivalent natif :** les destinations de Navigation Compose sont typées ; le compilateur
tient le premier sens. Pour le second, une règle qui exclut explicitement toute planche de
revue avant de compter les citations.

### 3 · `mobile-ds.test.ts` — 319 lignes, 15 cas

**Ce qu'elle tenait :** aucune couleur écrite en dur (les jetons sont la seule source), aucun
import profond dans le design system, et rien ne sort du dossier natif.

**Ce qu'elle a attrapé :** trois fichiers importaient au-dessus du dossier natif. TypeScript
résolvait ces chemins — typecheck vert — mais Metro refusait de sortir de la racine du projet :
**l'application ne pouvait ni se bundler, ni se construire, depuis le début.**

**Équivalent natif :** Detekt pour l'interdiction des littéraux de couleur, plus une règle
d'architecture (module Gradle séparé pour le design system, dépendances déclarées).

## Les dix autres, et ce qu'elles tenaient

| Suite | L. | Ce qui n'est plus gardé |
|---|---:|---|
| `mobile-fontes.test.ts` | 502 | La table des graisses identique des deux côtés ; les binaires commités ne peuvent pas diverger du kit |
| `mobile-reseau.test.ts` | 211 | L'échec de transport n'a pas une seule phrase : trois causes, trois messages |
| `mobile-verrou.test.ts` | 200 | Le verrou biométrique : paquet, chaîne d'usage, module, écran, racine, cohérence du profil |
| `mobile-app-config.test.ts` | 147 | ⭐ **Les six clés Firebase présentes à l'export** — c'est ce qui empêchait un build incomplet d'atteindre un magasin. Icône 1024² sans pixel translucide. Tout greffon déclaré a son paquet |
| `mobile-legal.test.ts` | 119 | Les quatre textes légaux existent VRAIMENT dans le routage du site ; la suppression de compte supprime ; l'export n'est pas un bouton mort |
| `mobile-liens-profonds.test.ts` | 116 | ⭐ Les deux plateformes ouvrent **exactement** les mêmes chemins ; le Team ID et `eas.json` se remplissent ensemble |
| `mobile-store-achats.test.ts` | 113 | ⭐ Aucun achat dans l'application ; aucun écran ne nomme un magasin ni n'invite à acheter |
| `mobile-confidentialite.test.ts` | 90 | ⭐ Le manifeste de confidentialité dit ce que l'application collecte réellement, et chaque type déclaré est justifié dans l'inventaire versé |
| `mobile-atelier-garde.test.ts` | 76 | La garde d'atelier tient : la console et la planche sont hors du paquet de production |
| `mobile-identite.test.ts` | 63 | Le chemin d'identité |

## ⚠️ Les quatre qui gardaient une exigence de MAGASIN

Elles ne sont pas facultatives : ce sont des motifs de rejet, et rien ne les garde plus.

1. **Aucun achat dans l'application** — le tunnel a été supprimé, et trois portes le
   verrouillaient dont un grep du paquet construit. Il n'en reste aucune.
2. **Le manifeste de confidentialité** — il déclarait `[]` (« ne collecte rien ») alors que
   l'application collecte six types de données. Corrigé le 05/09, désormais non gardé.
3. **Les liens profonds déclarés des deux côtés** — un chemin promis d'un côté seulement
   s'ouvre dans une application qui ne sait qu'en faire.
4. **Les six clés Firebase à l'export** — sans elles, l'application se construit et ne peut
   rien lire.

Ces quatre-là doivent revenir **avant la première soumission**, pas avant la fin du lot 6.
