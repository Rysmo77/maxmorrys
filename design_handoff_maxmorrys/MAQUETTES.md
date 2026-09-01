# Où se trouve chaque maquette

Chaque planche est **autonome** : ouvre-la dans un navigateur, elle se rend sans serveur ni
build. Elle charge, dans l'ordre : `../css/styles.css` → `_components.jsx` (les 37 composants
en clair) → `board.js` (la coque de colonnes) → `app-shell.jsx` (le cadre 390 px) → les
modules d'écran.

**Pour recréer un écran**, tu as besoin de trois fichiers, pas de treize :
1. `_components.jsx` — le composant que l'écran assemble
2. `app-shell.jsx` — `Screen`, `AppBar`, `Display`, `Eyebrow`, `Lede`, `BackButton`, `MediaBlock`
3. le module d'écran nommé ci-dessous

`Screen`, `AppBar`, `Display`, `Eyebrow` et `Lede` sont des **globales** dans les modules
d'écran, sans import : elles viennent de `app-shell.jsx`, chargé avant. C'est une commodité de
maquette — en production, importe-les.

**Les modules d'écran ne sont PAS du code de production.** Ils cassent volontairement une règle
du système : ils appellent l'état par `React.useState` local plutôt que par un magasin, et
codent les données en dur. Ce qu'il faut en reprendre : la **structure**, les **valeurs de
style** et l'**ordre des éléments**. Pas l'architecture.

| Planche | Écrans | Modules à charger |
|---|---|---|
| `agence-deux-ecrans.html`<br>Max-Morrys Agency | `Agence` · `AgenceEnvoye` | `app-shell.jsx` `screens-agence.jsx` |
| `apprentissage-cinq-ecrans.html`<br>Apprentissage et certificat | `Espace` · `Lecteur` · `MesNotes` · `Certificat` · `Verification` | `app-shell.jsx` `screens-public.jsx` `screens-pay.jsx` `screens-space.jsx` `screens-notes.jsx` |
| `apropos-deux-ecrans.html`<br>À propos et contact | `Apropos` · `Contact` | `app-shell.jsx` `screens-apropos.jsx` |
| `bilingue.html`<br>FR / EN côte à côte | *(rendu direct)* | `site-shell.jsx` `pages-core.jsx` `pages-en.jsx` |
| `club-huit-onglets.html`<br>Club des Digitos | `Club` · `ClubFil` · `ClubDiscussions` · `ClubAgenda` · `ClubMembre` · `ClubClassement` · `ClubOpportunites` · `ClubParrainage` | `app-shell.jsx` `screens-public.jsx` `screens-space.jsx` `screens-club.jsx` |
| `club-public-trois-ecrans.html`<br>Club, page publique | `Club` · `ClubGaranti` · `ClubPourQui` | `app-shell.jsx` `screens-public.jsx` `screens-space.jsx` `screens-club.jsx` |
| `compte-cinq-ecrans.html`<br>Compte | `Connexion` · `Creation` · `MotDePasse` · `Preferences` · `Suppression` | `app-shell.jsx` `screens-compte.jsx` |
| `console-motif.html`<br>Le motif et cinq instances | `MotifConsole` · `DashboardOps` · `PublierFormation` · `TransactionsOps` · `ProspectsOps` · `ContenuOps` · `PipelinesRestants` | `console-shell.jsx` `screens-motif.jsx` |
| `editorial-trois-ecrans.html`<br>Je t'informe | `BlogIndex` · `Article` · `FaqQuestion` | `app-shell.jsx` `screens-editorial.jsx` |
| `etats-cinq-ecrans.html`<br>États transverses | `Chargement` · `Vide` · `Erreur` · `HorsConnexion` | `app-shell.jsx` `screens-etats.jsx` |
| `index.html`<br>Espace apprenant | *(rendu direct)* | `app-shell.jsx` `screens-public.jsx` `screens-pay.jsx` `screens-pay-end.jsx` `screens-space.jsx` `screens-rysmo.jsx` |
| `media-quatre-ecrans.html`<br>Pôle média | `MediaPole` · `MediaVideos` · `MediaEpisode` · `MediaVideo` | `app-shell.jsx` `screens-media.jsx` |
| `mode-sombre.html`<br>Mode sombre | `Accueil` · `Fiche` · `Lecteur` · `Club` · `Espace` · `Rysmo` · `Paiement` · `Attente` · `Certificat` · `ClubFil` · `Article` · `MediaPole` | `app-shell.jsx` `screens-public.jsx` `screens-catalogue.jsx` `screens-pay.jsx` `screens-pay-end.jsx` `screens-space.jsx` `screens-club.jsx` `screens-editorial.jsx` `screens-media.jsx` |
| `paiement-quatre-ecrans.html`<br>Chemin de l'argent | `Paiement` · `Attente` · `Echec` · `Succes` | `app-shell.jsx` `screens-public.jsx` `screens-pay.jsx` `screens-pay-end.jsx` |
| `planche-micro-interactions.html`<br>Micro-interactions | *(rendu direct)* |  |
| `planche-moments.html`<br>Les deux moments scénarisés | *(rendu direct)* |  |
| `planche-mouvement.html`<br>Système de mouvement | *(rendu direct)* |  |
| `planche-systeme.html`<br>Planche du système | *(rendu direct)* |  |
| `planche-transitions.html`<br>Transitions de navigation | *(rendu direct)* |  |
| `points-de-rupture.html`<br>Tablette et desktop | *(rendu direct)* | `responsive.jsx` |
| `prototype-argent.html`<br>Prototype cliquable | *(rendu direct)* | `app-shell.jsx` `screens-public.jsx` `screens-catalogue.jsx` `screens-pay.jsx` `screens-pay-end.jsx` `screens-space.jsx` `proto.jsx` |
| `pwa-quatre-ecrans.html`<br>Version installable (PWA) | `PwaInvitation` · `PwaHorsConnexion` · `PwaNotifications` · `PwaLancement` | `app-shell.jsx` `screens-pwa.jsx` |
| `quatre-ecrans.html`<br>Quatre écrans | `Accueil` · `Catalogue` · `CataloguePlein` · `Fiche` | `app-shell.jsx` `screens-public.jsx` `screens-catalogue.jsx` |
| `rysmo-deux-ecrans.html`<br>Rysmo | `Rysmo` · `RysmoMemoire` | `app-shell.jsx` `screens-space.jsx` `screens-rysmo.jsx` |
| `site-public.html`<br>Site public | *(rendu direct)* | `site-shell.jsx` `pages-core.jsx` `pages.jsx` `pages-formations.jsx` `pages-utiles.jsx` |
| `tpe-trois-ecrans.html`<br>Présence Digitale | `PresenceOffre` · `DevisPartageable` · `GrilleComplete` | `app-shell.jsx` `screens-tpe.jsx` |

## Les six couches retirées du paquet

Les maquettes d'origine passaient par cinq indirections qui n'existaient **que** pour le
compilateur du projet de design. Elles ont été retirées :

| Retiré | Ce que c'était | Pourquoi |
|---|---|---|
| `_bundle.js` (1 Mo) | les composants **minifiés**, plus 21 modules d'écran dupliqués | illisible : impossible de savoir ce que `GlassPanel` rend. Remplacé par `_components.jsx`, 39 Ko en clair |
| `_guard.js` (7,5 Ko) | un `Proxy` sur `window.DS`, résolution des composants au rendu | contournait le fait que le bundle s'initialisait paresseusement. Sans bundle, inutile |
| garde de quiescence dans `board.js` | attente de trois images sans nouvelle signature | contournait les doublons de nom créés par le compilateur. Hors du projet, il n'y a pas de doublon |
| `window.MMSIGN` | signatures d'exécution des modules | idem |
| extension `.js` sur du JSX | 29 fichiers | tout analyseur, éditeur ou formateur échouait à la première balise. Passés en `.jsx` |
| mots-clés de module dans les composants | un `export const` oublié | Babel Standalone bascule en CommonJS dès qu'il en voit **un seul**, et le navigateur échoue sur « exports is not defined ». Toutes les maquettes se vidaient d'un coup |

Le dernier point mérite d'être retenu : **un seul `export` oublié dans un fichier `text/babel`
vide toutes les maquettes**, avec une seule erreur en console qui ne nomme pas le coupable.
Si une maquette rend son cadre mais pas son contenu, c'est la première chose à vérifier.
