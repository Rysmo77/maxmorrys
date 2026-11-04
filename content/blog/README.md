# Articles du blog (versionnés)

Chaque article du blog naît ici, en Markdown, avant d'être déposé dans Firestore `blog/` **en brouillon**, puis validé par Max sur une carte Telegram.
Le texte garde ainsi un historique git, et la charte est contrôlée par du code avant toute publication.

| Étape | Qui | Commande |
|---|---|---|
| Idée, recherche sourcée, brief SEO | `mm-agent-thierry`, `mm-agent-rokia` | — (briefs dans `_bmad-output/editorial/`) |
| Rédaction | `mm-agent-cheikh` | copier `_modele.md` en `<slug>.md` |
| Contrôle de charte | `mm-agent-beatrice` | `npm run blog:lint -- content/blog/<slug>.md` |
| Couverture (si `coverImage` vide) | `mm-agent-omar` | `npm run blog:publish -- content/blog/<slug>.md --cover-only` |
| Dépôt en brouillon + carte Telegram | `mm-agent-omar` | `npm run blog:publish -- content/blog/<slug>.md --apply` |
| **Mise en ligne** | **Max** | **✅ Publier** sous la carte Telegram (couverture, résumé, article complet en pièce jointe), ou `/admin/articles` → Publier — notifie les abonnés |
| Refus | **Max** | **❌ Refuser** : reste en brouillon, motif en un clic ; corriger puis `--apply --update <docId>` renvoie une carte |
| Contrôle d'indexation, diffusion | `mm-agent-omar` | voir `docs/growth-kb/07-editorial-seo.md` |

La couverture est rendue par render-card (kit DS, 1200×630, couleur du pôle) : laisser `coverImage` vide dans l'en-tête. `--cover-only` la produit et l'écrit dans le fichier, `--fond <url>` impose une photo, `--sans-photo` donne la version typographique. Photos : des personnes fictives, jamais présentées comme un client, un élève ou Max. Détails : `docs/growth-kb/07-editorial-seo.md` § Couverture.

Un article de test porte `test: true` dans l'en-tête : il reçoit une carte « 🧪 TEST » et ne peut jamais être publié (le Worker simule).

Règles complètes : `docs/growth-kb/03-charte-voix.md` et `docs/growth-kb/07-editorial-seo.md` (§ Validation Telegram).
Les 46 articles publiés avant le 29/10/2026 ne sont pas encore ici : ils vivent seulement dans Firestore.
