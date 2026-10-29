# Articles du blog (versionnés)

Chaque article du blog naît ici, en Markdown, avant d'être déposé dans Firestore `blog/` **en brouillon**.
Le texte garde ainsi un historique git, et la charte est contrôlée par du code avant toute publication.

| Étape | Qui | Commande |
|---|---|---|
| Idée, recherche sourcée, brief SEO | `mm-agent-thierry`, `mm-agent-rokia` | — (briefs dans `_bmad-output/editorial/`) |
| Rédaction | `mm-agent-cheikh` | copier `_modele.md` en `<slug>.md` |
| Contrôle de charte | `mm-agent-beatrice` | `npm run blog:lint -- content/blog/<slug>.md` |
| Dépôt en brouillon (accord de Max) | `mm-agent-omar` | `npm run blog:publish -- content/blog/<slug>.md --apply` |
| **Mise en ligne** | **Max**, dans l'admin | `/admin/articles` → Publier (notifie les abonnés) |
| Contrôle d'indexation, diffusion | `mm-agent-omar` | voir `docs/growth-kb/07-editorial-seo.md` |

Règles complètes : `docs/growth-kb/03-charte-voix.md` et `docs/growth-kb/07-editorial-seo.md`.
Les 46 articles publiés avant le 29/10/2026 ne sont pas encore ici : ils vivent seulement dans Firestore.
