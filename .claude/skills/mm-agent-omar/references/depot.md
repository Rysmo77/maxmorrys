# Déposer un article validé en brouillon

**Réussite :** un brouillon correct dans Firestore `blog/`, et Max sait exactement quoi faire pour le publier.

## Préalables
- `content/blog/<slug>.md` relu par Béatrice (`relecture.md` sans point bloquant), validé par Aminata, **et accord explicite de Max** pour le dépôt.

## Démarche
1. Simulation : `npm run blog:publish -- content/blog/<slug>.md`. Le script relance `blog:lint` et refuse s'il reste une ERREUR. Montrer l'aperçu à Max.
2. Après accord : `npm run blog:publish -- content/blog/<slug>.md --apply`. Le script vérifie que ni le slug ni le `slug_en` ne sont pris, puis crée le brouillon (`status: 'draft'`, `updatedAt`, `slug_en`, `author: 'Max-Morrys'`, `publishedAt` vide pour que l'admin pose la date du jour).
3. Pour corriger un brouillon déjà déposé : `--apply --update <docId>` (refusé si l'article n'est plus un brouillon).
4. Dire à Max : ouvrir `/admin/articles`, relire le brouillon, cliquer « Publier » (ce qui notifie les abonnés via `notifyOnPublish`).

## À surveiller
- ⚠️ La vérification d'unicité et l'écriture Firestore par compte de service n'ont **pas encore été testées en réel** : au premier `--apply`, vérifier le document dans l'admin (champs, rendu Markdown) avant toute publication et signaler toute anomalie.
- Le compte de service est le fichier `max-morrys-*.json` à la racine (jamais commité).

## Livrable
Identifiant du brouillon et consignes de publication, notés dans `_bmad-output/editorial/<slug>/relecture.md`.
