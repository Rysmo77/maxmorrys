# UI kit — Plateforme, espace apprenant (mobile, 390 px)

Recréation cliquable du chemin principal de `maxmorrys.me` sur téléphone, composée à partir des
composants du système. Source : `uploads/maxmorrys-kit-design-v2.html` (écrans 01 à 11) et
`uploads/maxmorrys-kit-lot3.html`.

## Écrans

| Clé | Écran | Ce qui s'y joue |
|---|---|---|
| `accueil` | Accueil | Maillage Forme, empilement en M des quatre territoires |
| `catalogue` | Catalogue vide | L'état réel du produit : aucune formation publiée (FR-111, R-19) |
| `fiche` | Fiche formation | Prix cadré, encart de vérité à la place de la preuve sociale (D-03) |
| `paiement` | Tunnel, étape 2 | Wave, Orange Money, carte — montant relu serveur (FR-015, FR-016) |
| `attente` | Attente de paiement | Premier moment scénarisé : deux anneaux disent « c'est vivant » (FR-018, FR-068) |
| `certificat` | Certificat émis | Second moment scénarisé : une brillance passe deux fois (FR-024, FR-025) |
| `espace` | Mon espace | La reprise avant tout le reste (FR-022, FR-028) |
| `lecteur` | Lecteur de leçon | Faux verre partout, car ça défile |
| `rysmo` | Assistant Rysmo | Quota visible, citation d'une leçon du cours de la personne (FR-037, FR-040) |
| `club` | Club des Digitos | Tarif cadré au mois, 8 onglets (FR-030, FR-074) |

## Navigation

Intrinsèque : les cartes territoire, les boutons d'action et la barre d'onglets mènent à l'écran
suivant. Les flèches ← → parcourent la liste. Un appui sur l'heure de la barre d'état ouvre la
liste complète des écrans (aide de maquette, pas un élément de produit).

## Ce qui est volontairement absent

Aucun bouton « préviens-moi par e-mail » : le produit n'a aucun canal d'envoi (R-14). Aucun nombre
d'inscrits, aucune note, aucun taux de réussite (D-03). Aucun historique de paiement côté
apprenant hors de l'entrée d'espace — l'écran lui-même n'existe pas encore (FR-021 / FR-094).

## Le Club : huit onglets, et l'écran verrouillé

`club-huit-onglets-ouverts.html` — les huit sections, l'état d'un **membre**.
`club-verrouille.html` — les huit contextes de cadenas, l'état d'un **non-membre connecté**.

Deux manques que ces deux planches corrigent.

**« Informations » n'existait pas.** La planche mobile annonçait huit onglets mais en comptait
sept : le mur d'abonnement occupait le huitième créneau. Un onglet annoncé et non dessiné finit
par être livré à la va-vite, ou pas du tout. La section est le **digest hebdomadaire** — ici et
dans le centre de notifications, jamais par e-mail : aucun canal d'envoi n'existe.

**L'écran verrouillé n'est pas le mur d'abonnement.** Le mur s'adresse à un visiteur sur le site
public. L'écran verrouillé s'adresse à quelqu'un qui a **déjà un compte**, qui est dans
l'application, et qui vient de toucher « Club » dans la barre d'onglets. Ce n'est pas la même
personne, et lui servir la page de vente publique gâche la seule information qu'on ait en plus :
**elle est entrée, donc on sait quel onglet elle voulait.** D'où huit écrans, un par onglet, et
une bande d'onglets qui reste cliquable — masquer la navigation d'un espace verrouillé, c'est
vendre une boîte fermée.

### La décision : aucun contenu flouté

Le flou derrière un cadenas est le motif réflexe, et il est faux ici. Un flou dit *« il y a
foule là-dedans, fais-nous confiance »*. Le Club a ouvert cette année : il ne peut pas dire ça,
et la personne le vérifierait au premier écran après avoir payé.

Chaque onglet verrouillé montre donc **ses compteurs réels** et **un élément complet, non
tronqué**. Moins flatteur qu'un flou, et beaucoup plus solide : ce qui est promis est exactement
ce qui sera livré. Tous les nombres sont en monospace parce qu'ils viennent de la base — et
c'est sur un écran de vente que cette règle compte le plus.

| Onglet verrouillé | Ce qu'il annonce |
|---|---|
| Fil | 7 publications, 41 réponses · une publication entière |
| Discussions | 41 sujets, 3 catégories · un sujet entier |
| Membres | 6 fiches remplies sur 9 · une fiche entière |
| Agenda | 2 sessions ce mois, 4 places · une session entière |
| Classement | **0 classement absolu** — le zéro est l'argument |
| Opportunités | 3 missions, 180 000 à 450 000 F annoncés · une mission entière |
| Informations | 3 digests, **0 e-mail envoyé** |
| Parrainage | 15 % au filleul, **0 commission pour toi** |

Trois de ces huit compteurs sont des **zéros**, et ce sont les plus persuasifs : « 0 classement
absolu », « 0 e-mail », « 0 commission » disent ce que le produit refuse de faire. Un zéro daté
est une information ; un argument sans chiffre n'en est pas une.

Vérifié par sonde : **0 élément de texte flouté** sur les huit colonnes (les 24 flous de la page
sont les trois lobes de maillage par colonne).
