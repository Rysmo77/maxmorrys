# Script de Reel ou de Story vidéo (15 à 30 s)

**Réussite :** Max peut tourner la vidéo seul, au téléphone, en moins de 20 minutes, sans matériel ni figurant, et elle apprend une chose concrète dès les 3 premières secondes.

## Contraintes de tournage
- Un lieu, la lumière du jour, le téléphone tenu ou posé ; Max face caméra, ou ses mains et l'écran de son téléphone. Aucun figurant, aucun client, aucune enseigne identifiable sans accord.
- Sous-titres incrustés au montage (beaucoup regardent sans le son), en phrases courtes ; aucun emoji dans les sous-titres.
- Musique : seulement celle proposée par l'application au moment de publier (droits) ; jamais une musique ajoutée au montage.
- Aucun chiffre sans source, aucun prix de mémoire, paiement cité en entier (Wave, Orange Money ou carte).

## Formes qui marchent
| Forme | Accroche (0-3 s) | Corps | Fin |
|---|---|---|---|
| **Le réglage en 20 s** | « Ce réglage WhatsApp, active-le ce soir. » | écran filmé, 3 gestes | « Enregistre pour le refaire. » |
| **L'erreur en 2 temps** | « Tu fais ça ? » (l'erreur montrée) | « Fais plutôt ça » (la bonne version) | « Envoie-le à un ami commerçant. » |
| **Mythe en 15 s** | « On t'a dit qu'il faut poster tous les jours ? » | la réalité, une raison | « Mythe ou réalité, dis-moi en commentaire. » |
| **Le mot du digital** | le mot à l'écran, Max le prononce | définition en une phrase + exemple d'ici | « Tu connaissais ? » |
| **La conversation jouée** | « Le client écrit : "C'est combien ?" » | la mauvaise réponse, puis la bonne | « Copie-colle ma réponse. » |

## Format de dépôt (NocoDB `Contenus`)
- `Format_Post = reel`, `Reseau = ig` (Facebook accepte aussi les Reels), **`Status = planifié`**, `Date_Publication_Prevue` = un créneau du soir.
- `Brief` = le script, avec obligatoirement :
  ```
  DURÉE : 25 s
  LIEU : bureau, lumière du jour · MATÉRIEL : téléphone, trépied si possible
  PLAN 1 (0-3 s) : … — à l'écran : « … » — Max dit : « … »
  PLAN 2 (3-12 s) : …
  PLAN 3 (12-22 s) : …
  PLAN 4 (22-25 s) : appel à l'action — « … »
  SOUS-TITRES : oui, phrases de 6 mots au plus
  ```
- `Texte` = la légende (règles de `10-community-management.md` : accroche, 1 à 3 emojis, un seul appel à l'action), `Hashtags` selon le réseau.
- `Slides_JSON` et `Gabarit` : vides. `Visuels_URLs` : vide — Max y pose l'URL de la vidéo après tournage, puis valide.
- `qa-lot.mjs` vérifie le statut, la ligne DURÉE (15 à 30 s) et au moins 3 lignes PLAN.
