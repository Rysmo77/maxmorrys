# Répertoire des formats sociaux (04/11/2026)

> Demande de Max du 04/11/2026 : « pas toujours le même format — changer de format tout en restant fidèle à la charte ». Mesure du jour : sur les 50 posts à venir, quatre familles faisaient 42 posts (etapes 12, avant_apres 11, question 10, affiche 9).
> **Choisir le format par le GESTE attendu du lecteur**, pas par habitude : enregistrer, répondre, partager, se reconnaître, apprendre un mot.
> Données exactes de chaque famille (champs de `Slides_JSON`) : `docs/growth-kb/11-visuels-nayo.md` § 3 et § 3 ter. Aucun emoji à l'image ; tutoiement ; `[mot]` = couleur du territoire.

## 1. Les familles rendues par render-card (Gabarit)

| Format | `Gabarit` | Geste visé | Quand l'utiliser | Structure | Texte maxi à l'image | Rubrique / série qui lui va |
|---|---|---|---|---|---|---|
| **Mythe / réalité** | `mythe_realite` | partager, débattre | une idée reçue répandue chez les commerçants ou les apprenants | titre-question ; bandeau nuit « Mythe » barré ; carte du territoire « Réalité » | titre ≤ 8 mots ; mythe ≤ 18 mots ; réalité ≤ 25 mots | « Mythe ou réalité ? » (PREUVE), sondage en story la veille |
| ~~**Check-list à enregistrer**~~ ⛔ Écarté par Max le 04/11/2026 (planche d'essai, « tous sauf 2 et 5 ») : ne plus l'utiliser, `qa-lot` le refuse. | `checklist` | enregistrer | une vérification à refaire chez soi (« ta fiche est prête si… ») | fiche blanche, cases vides, signet « Enregistre-la » | titre ≤ 8 mots ; 3 à 7 cases de ≤ 9 mots | ATELIER, « L'outil à 0 F » |
| **Comparatif « ceci ou cela »** | `comparatif` | commenter (« moi c'est A ») | deux outils, deux canaux, deux façons de faire, sans perdant obligatoire | titre-question ; colonne A blanche, colonne B nuit, pastille VS ; verdict en une phrase | 2 à 4 lignes de ≤ 6 mots par colonne ; verdict ≤ 18 mots | RADAR, ATELIER |
| **Erreur fréquente → correction** | `erreur` | partager à un ami concerné | une pratique courante qui coûte des clients | l'erreur barrée (verre), flèche, « Fais plutôt » dans la carte du territoire, « Pourquoi » en une ligne | erreur ≤ 14 mots ; correction ≤ 18 mots ; pourquoi ≤ 15 mots | ATELIER, PREUVE |
| ~~**Glossaire « 1 mot = 1 définition »**~~ ⛔ Écarté par Max le 04/11/2026 (planche d'essai, « tous sauf 2 et 5 ») : ne plus l'utiliser, `qa-lot` le refuse. | `glossaire` | enregistrer, apprendre | un mot du métier que la cible entend sans le comprendre | entrée de dictionnaire : le mot en très grand, nature en mono, définition, exemple d'ici | mot ≤ 3 mots ; définition ≤ 30 mots ; exemple ≤ 25 mots | « Le mot du digital » (ATELIER), numéroté (`numero`) |
| **Quiz** | `quiz` | répondre en commentaire | vérifier un réflexe ; en carrousel : question slide 2, réponse slide 3 (`reponse`) | grille 2 × 2 de tuiles A-D ; avec `reponse`, la bonne tuile passe au territoire, les autres s'effacent, `explication` dessous | question ≤ 12 mots ; 2 à 4 réponses de ≤ 6 mots ; explication ≤ 25 mots | CERCLE ; story (réponse le lendemain) |
| **« 3 signes que… »** | `signes` | se reconnaître, commenter | un diagnostic simple (« ta page dort », « ton client va partir ») | grands chiffres Fraunces en colonne, filet du territoire | titre ≤ 9 mots ; 3 à 5 signes de ≤ 12 mots | PREUVE, ATELIER |
| **Conversation** | `conversation` | enregistrer, recopier | le bon message à envoyer (WhatsApp, Messenger), une objection client bien traitée | bulles client à gauche, réponse à droite, étiquette de scène (« Samedi · 11 h ») ; aucun logo de messagerie | 2 à 5 messages de ≤ 25 mots ; légende ≤ 18 mots | ATELIER (commerçants) |
| Affiche | `affiche` | arrêter le pouce | une idée forte, une accroche | titre en grand | titre ≤ 10 mots | RADAR |
| Étapes | `etapes` | refaire | une méthode en 2 à 5 étapes ordonnées | lignes de verre numérotées | ≤ 7 mots par étape | ATELIER |
| Question / sondage | `question` | répondre | une question ouverte au public | pilules A-D | ≤ 6 mots par option | CERCLE |
| Chiffre sourcé décrypté | `chiffre` | partager | un nombre **sourcé** qui change une décision | grand nombre mono + source obligatoire | titre ≤ 12 mots | « Le vrai prix de… » (PREUVE) |
| Avant / après | `avant_apres` | se projeter | une transformation concrète (fiche, bio, vitrine) | deux colonnes | ≤ 4 lignes de ≤ 6 mots | PREUVE |
| Citation | `citation` | partager | une phrase de Max, une question reçue (anonyme) | guillemet géant | ≤ 25 mots | « Ta question, ma réponse » |
| Coulisses | `coulisses` | s'attacher | le travail en vrai (photo fournie par Max) | fond nuit, photo réelle | titre ≤ 10 mots | COULISSES |
| Offre | `offre` | cliquer | 1 par semaine au plus, après avoir appris quelque chose | carte prix | prix du code, jamais de mémoire | OFFRE |

**Formats dans un carrousel** : chaque slide peut porter son `gabarit` (ex. slide 1 couverture, slide 2 `quiz` sans réponse, slide 3 `quiz` avec `reponse`, slide 4 `checklist`, slide 5 fin avec CTA). La progression « 02 / 05 » s'affiche d'elle-même. Une slide sans `gabarit` reste une slide classique.

**Formats rendus** : posts 4:5 (1080 × 1350), stories 9:16 (1080 × 1920). Le carré 1:1 n'est pas utilisé par le circuit Facebook / Instagram ; les familles denses (`checklist`, `erreur`, `comparatif`, `conversation`) n'y tiennent pas.

## 2. Formats sans nouvelle famille (mise en forme par les slides)

| Format | Comment le faire | Quand |
|---|---|---|
| **Capture annotée / tuto pas à pas** | carrousel : slide par écran, titre = l'action (« 2. Touche "Modifier le profil" »), `corps` = où toucher. Capture réelle seulement via `coulisses` + `photo` fournie par Max (jamais de capture d'un client) ; sinon l'écran est décrit | réglage d'une appli (WhatsApp Business, fiche Google, Meta Business Suite) |
| **Mini-histoire (scène locale en 4 slides)** | carrousel : 1. la scène (« Samedi, marché HLM, 11 h ») ; 2. le problème ; 3. ce que la commerçante change ; 4. la leçon + CTA. Personnages **fictifs**, jamais présentés comme des clients | faire comprendre un conseil sans le dire ; varier le ton |
| **« Avant de… »** | `etapes` titré « Avant de lancer ta pub, vérifie… » | geste préventif |
| **Chiffre sourcé décrypté** | `chiffre` en slide 1, puis 2 slides « ce que ça veut dire pour toi » | PREUVE, RADAR |

## 3. Formats vidéo courts (script, pas carte)

Reel ou story vidéo de **15 à 30 s**, tourné au téléphone par Max. Le script se dépose dans NocoDB `Contenus` avec `Format_Post = reel`, **`Status = planifié`** (WF-SOCIAL-04 ne le rend pas : sinon il partirait en image), le script dans `Brief`, la légende dans `Texte`. Max filme, pose l'URL de la vidéo dans `Visuels_URLs`, puis valide : WF-SOCIAL-05 publie alors un vrai Reel. Méthode : `script-video.md`. **Au moins un par semaine** (contrôlé par `qa-lot.mjs`).

## 4. Stories interactives

3 stories par semaine au plus (décision du 04/11/2026), **au moins 2 familles différentes** : `quiz`, `question`, `mythe_realite`, `signes`, `erreur`, `comparatif`. ⚠️ L'API Instagram ne pose pas les autocollants interactifs (sondage, quiz, curseur, question) : la carte appelle à répondre en message, ou Max ajoute l'autocollant à la main s'il publie lui-même. Méthode : `stories-interactives.md`.

## 5. Rotation

- Jamais la même famille deux fois de suite sur un réseau ; au plus 25 % de la semaine pour une famille ; **au moins 6 familles** pour 9-10 posts.
- Un format qui n'obtient ni enregistrement, ni commentaire, ni partage après trois essais sort de la rotation pour un mois (mesure : `mm-agent-yann`).
- Les rubriques gardent leur format signature (« Le mot du digital » → `affiche` : le mot en titre, la définition et l'exemple d'ici en corps — le `glossaire` est écarté depuis le 04/11 ; « Mythe ou réalité ? » → `mythe_realite`), le reste tourne.
