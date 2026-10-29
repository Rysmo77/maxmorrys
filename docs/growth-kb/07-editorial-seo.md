# 07 — Chaîne éditoriale et SEO du blog (état au 29/10/2026)

> Source : audit en lecture seule du 29/10/2026, versé dans `docs/growth-kb/audits/2026-10-29-editorial.md`.

## Décision : la rédaction sort de n8n

- Les 46 articles en ligne viennent **tous** de n8n WF-08 (brouillons Gemini relus et publiés dans l'admin), écrits entre le 15/04 et le 22/05/2026. **Rien n'a été produit depuis.**
- WF-07, 08 et 09 échouent chaque semaine (Gemini 503, aucune relance). Même réparés, ils ne produiraient rien : WF-08 ne lit que 100 idées sur 1 202, personne ne valide les idées (1 141 en `nouveau`), WF-07 appelle Gemini une fois par branche, WF-09 bâtit la lettre depuis des brouillons.
- Le prompt de WF-08 fabrique les écarts de charte : il impose un H1 dans le corps, tolère des emojis, demande « 5 statistiques » sans recherche web (donc inventées), ajoute plusieurs CTA.
- **Nouvelle chaîne** : agents BMad (salle de rédaction) → Markdown versionné dans `content/blog/` → contrôle de charte par code → dépôt en brouillon dans Firestore → **mise en ligne par Max dans l'admin**.
- n8n ne garderait, une fois réparé, que la veille planifiée (sans rédaction), la lettre construite depuis les articles publiés et la diffusion sociale d'un nouvel article. Voir « Reste à n8n » plus bas.

## La chaîne, étape par étape

| # | Étape | Agent | Livrable |
|---|---|---|---|
| 1 | Ligne éditoriale, calendrier, choix des sujets | `mm-agent-aminata` | `_bmad-output/editorial/AAAA-MM-calendrier.md` |
| 2 | Veille et recherche **sourcée** (recherche web, GSC, documents primaires) | `mm-agent-thierry` | dossier de sources : URL, date, citation |
| 3 | Mot-clé, intention, concurrence de la page de résultats, plan, maillage | `mm-agent-rokia` | brief SEO |
| 4 | Rédaction à la voix de Max-Morrys | `mm-agent-cheikh` | `content/blog/<slug>.md` |
| 5 | Secrétariat de rédaction : charte, faits, prix, typographie | `mm-agent-beatrice` | `npm run blog:lint` sans erreur + rapport de relecture |
| 6 | Validation finale | `mm-agent-aminata` puis **Max** | accord explicite |
| 7 | Dépôt en brouillon, puis contrôles après mise en ligne | `mm-agent-omar` | `npm run blog:publish -- … --apply` |
| 8 | **Mise en ligne** | **Max** | `/admin/articles` → Publier (notifie les abonnés) |
| 9 | Diffusion : posts sociaux, lettre | `mm-agent-omar` → `mm-agent-mariam`, `mm-agent-serge` | lignes NocoDB `prêt_à_valider` |

Briefs, dossiers de sources et rapports de relecture : `_bmad-output/editorial/<slug>/`.

## Stockage et rendu (ce que le code fait vraiment)

- Firestore `blog/{id}`, type `BlogPost` (`src/types/index.ts:156-186`) : `title`, `slug`, `slug_en`, `excerpt`, `content` (Markdown accepté, rendu par `markdownToHtml`), `coverImage`, `category`, `tags`, `author`, `publishedAt`, `updatedAt`, `readTime`, `featured`, `status`, `metaTitle`, `metaDescription`, `focusKeyword`, `og*`, `noIndex`, `canonicalUrl`.
- `status` : `draft` ou `published`. ⚠️ `scheduled` existe dans le type mais n'est pas implémenté, et une `publishedAt` future publie immédiatement.
- L'anglais n'est pas stocké, sauf `slug_en`. Le corps est traduit à la volée par Gemini (Worker `api`, cache `translations/`). Pour les robots, le Worker traduit les métadonnées, le H1 et les 2 000 premiers caractères.
- Prérendu par le Worker `site` : title = `metaTitle || title` + « | Max-Morrys », description, JSON-LD `Article` + `BreadcrumbList`, hreflang fr/en/x-default, canonique. Sitemap apparié FR/EN, RSS `/rss.xml` (FR). En ligne en moins de 5 min ; sitemap et RSS en moins d'1 h.
- Catégorie = un des six pôles (`src/lib/blogCategories.ts`) : SEO & Visibilité · Publicité en ligne · Réseaux sociaux & Influence · E-commerce & Vente en ligne · IA & Automatisation · Business & Gestion.
- La page porte son propre CTA de fin (« Tu veux qu'on le fasse pour toi ? / Voir les packs ») : le texte n'en ajoute pas.

## Règles d'un article (appliquées par `npm run blog:lint`)

**Erreurs bloquantes**
- Tutoiement et « je » (le blog est piste Apprendre). Une parole rapportée qui vouvoie s'encadre de « ».
- Aucun emoji. Aucun H1 dans le corps : on commence au niveau `##`.
- Titre SEO (`metaTitle` ou `title`) ≤ 47 caractères ; `metaDescription` ≤ 155.
- Catégorie parmi les six pôles ; slug normalisé, identique au nom du fichier ; `slug_en` normalisé.
- Un pourcentage ⇒ une source dans le même paragraphe (lien, « Source : … » ou « selon … »).
- Aucune promesse de remboursement ou de garantie, aucune promesse de cadence (« chaque semaine »…), aucune route morte (`/agence`, `/presence-digitale`), aucune offre fantôme (coaching, consulting, « toutes les formations par abonnement »), aucune faute de marque (« My Onoma », « Max-Morrys Agency »).

**Avertissements** (levés à la main par Béatrice, décision notée dans le rapport) : montant sans source, preuve sociale chiffrée, date écrite, jargon commerçant, moyens de paiement incomplets, CTA de fin, moins de 600 ou plus de 2 200 mots, moins de 3 intertitres, moins de 2 liens internes, mot-clé absent du titre ou de l'introduction, année dans le slug.

**Ce que le code ne voit pas** (relecture humaine) : la justesse des faits, la fraîcheur des sources (moins de 2 ans, sinon le dire), l'exactitude des prix des offres (relire `src/lib/club/pricing.ts`, `src/lib/presence/offer.ts`, `worker/apps/api/src/lib/bictorys.ts`), l'absence de client identifiable, le registre des citations, la cannibalisation avec un article existant.

**Forme recommandée** : 900 à 1 600 mots ; introduction avec une situation locale et la promesse de l'article ; 3 à 6 `##` formulés comme des requêtes ; un exemple local par idée (Dakar, Abidjan, Cotonou, diaspora) ; un encadré « À retenir » ; une FAQ de 3 à 5 questions réelles (tirées des « Autres questions » de Google ou des messages reçus) ; 2 à 5 liens internes ; liens externes vers les sources primaires.

## État SEO du blog (29/10/2026)

- Search Console, 90 jours : **2 clics, 87 impressions** pour le blog (site : 4 clics, 135 impressions, position moyenne 12). Seuls 11 articles sur 46 ont eu au moins une impression. Le seul article qui fait des clics : `rentabiliser-50000-fcfa-publicite-facebook-afrique`.
- Requêtes vues : « booster tiktok afrique », « publicité facebook ads sénégal » (position 5), « blog marketing digital dakar » (position 20).
- Indexation (25 articles inspectés) : 15 indexés, 5 « découverts, non indexés », 5 inconnus de Google.
- **Doublons** : trois slugs publiés deux fois (`vendre-en-ligne-afrique-francophone-lois-2026`, `algorithme-instagram-2026-vues-strategie`, `materiel-video-entrepreneur-guide-2026`) ; paires cannibales « 50 000 FCFA publicité Facebook » et « algorithme Instagram ».
- 15 titres font 71 à 76 caractères avec le suffixe. 11 slugs contiennent « 2026 ».
- Aucune page pilier, aucune carte mots-clés → URL, aucun suivi de positions. 3 liens seulement vers `/formations`.
- GSC : un vieux `sitemap_index.xml` de 2025 est encore déclaré ; une variante `www` a été indexée.
- ⚠️ La table NocoDB `seo` est figée au 06/08 ; `scripts/gsc-pull.py` écrit encore chaque matin dans **Airtable** depuis le Mac.

## Défauts côté site à corriger (code, hors agents)

- **P0** : fusionner ou rediriger les trois doublons de slug ; retirer « le blog paraît chaque semaine » (`src/i18n/locales/fr/formations.json:234`, `worker/apps/site/src/prerender/static-pages.ts:560`).
- **P1** : `mainEntityOfPage.@id` faux en anglais (`worker/apps/site/src/prerender/content.ts:160`) ; repli français des métadonnées anglaises mis en cache 300 s quand Gemini sature (`translate.ts:180`, `prerender/index.ts:179-184`) ; l'admin n'écrit jamais `updatedAt` (`useArticles.ts:170-193`) ; nettoyer le corps des 46 articles (H1, emojis, vouvoiement, CTA de fin, chiffres non sourcés) ; nettoyer GSC.
- **P2** : fil d'Ariane anglais, RSS non dédoublonné, statut `scheduled`, `skills/seo-kit` (références `functions/` mortes).

## Reste à n8n (si on le garde, après réparation)

| Workflow | Nouveau rôle | Corrections nécessaires |
|---|---|---|
| WF-07 | veille du lundi (RSS, questions du site) → banque d'idées NocoDB, **sans rédaction** | vrais nœuds `Merge` au lieu du nœud Code ; relances Gemini (3 à 5 essais, 30 à 60 s) ou suppression de l'étape Gemini |
| WF-08 | **à désactiver** (la rédaction passe aux agents) | — |
| WF-09 | lettre construite depuis `/rss.xml` ou Firestore `published`, envoyée par Brevo après ✅ Telegram | changer la source ; retirer « hebdomadaire » ; un seul CTA ; brancher WF-EMAIL-SEND |
| nouveau | diffusion sociale d'un article publié (sondage du RSS) → lignes NocoDB `prêt_à_valider` | à créer, ou laisser `mm-agent-omar` créer ces lignes à la main |

Tous : exporter le JSON de production dans `n8n/live/` (la copie du dépôt date du 12/04) ; renommer les nœuds « Airtable — … » et « Gemini Pro » ; supprimer les doublons inactifs.
