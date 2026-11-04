# Déposer un article validé en brouillon

**Réussite :** un brouillon correct dans Firestore `blog/`, soumis à Max : sa carte Telegram (✅ Publier / ❌ Refuser) est partie.

## Préalables
- `content/blog/<slug>.md` relu par Béatrice (`relecture.md` sans point bloquant), validé par Aminata, **et accord explicite de Max** pour le dépôt.

## Démarche
0. Couverture : si `coverImage` est vide, `npm run blog:publish -- content/blog/<slug>.md --cover-only`. La commande rend la couverture (render-card, kit DS, 1200×630) et écrit `coverImage` (et `coverFond`) dans l'en-tête. **Regarder le PNG** (`--out <dossier>`) avant de continuer. Si elle a été refaite après un changement de titre, utiliser `--force` : la photo de `coverFond` est réutilisée. Si la photo n'a pas pu être générée, la couverture sort typographique : le dire à Max. ⛔ Les personnes de la photo sont fictives : ne jamais les présenter comme un client, un élève ou Max.
1. Simulation : `npm run blog:publish -- content/blog/<slug>.md`. Le script relance `blog:lint` et refuse s'il reste une ERREUR. Montrer l'aperçu à Max.
2. Après accord : `npm run blog:publish -- content/blog/<slug>.md --apply`. Le script vérifie que ni le slug ni le `slug_en` ne sont pris, crée le brouillon (`status: 'draft'`, `updatedAt`, `slug_en`, `author: 'Max-Morrys'`, `publishedAt` vide) **soumis à validation** (`pretAValider: true`), puis réveille n8n WF-BLOG-NOTIFY : la carte « article à valider » part dans Telegram (couverture, résumé, article complet en pièce jointe HTML, ✅ Publier / ❌ Refuser). Le script dit si la carte est partie tout de suite ou partira au prochain passage (≤ 30 min ; c'est toujours le cas sur le VPS, qui n'a pas la clé du webhook). `--sans-carte` : brouillon de travail, non soumis.
3. Pour corriger un brouillon déjà déposé (ou refusé) : `--apply --update <docId>` (refusé si l'article n'est plus un brouillon) — une nouvelle carte part.
4. Dire à Max : « la carte est dans Telegram ; ✅ publie et prévient les abonnés, la page est vérifiée 6 min après ; ❌ le laisse en brouillon ». L'admin (`/admin/articles` → Publier) reste possible.
5. Après un ❌ : lire le motif (`node scripts/growth/decision.mjs liste --motifs --depuis 14`, ou `refusReason` sur le brouillon), corriger, puis repasser par Béatrice avant `--update`.

## À surveiller
- L'écriture par compte de service et la carte ont été testées le 04/11/2026 sur un article `test: true` ; le chemin ✅ réel (publication + notification) n'a été vérifié qu'en simulation et par tests unitaires : au **premier vrai article**, contrôler la réponse du routeur (lien, nombre d'abonnés) et le message de vérification à 6 min.
- ⛔ Jamais `test: true` sur un vrai article (il ne serait jamais publiable), jamais un faux article sans `test: true`.
- Le compte de service est le fichier `max-morrys-*.json` à la racine (jamais commité).

## Livrable
Identifiant du brouillon et consignes de publication, notés dans `_bmad-output/editorial/<slug>/relecture.md`.
