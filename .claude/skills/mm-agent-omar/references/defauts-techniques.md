# Suivi des défauts techniques du blog

**Réussite :** une liste tenue à jour des défauts techniques connus, avec leur impact et leur état, prête à être confiée à un développeur (`bmad-agent-dev`) ou à Max.

## Défauts connus au 29/10/2026 (`07-editorial-seo.md`)
- `mainEntityOfPage.@id` faux sur les pages anglaises (`worker/apps/site/src/prerender/content.ts:160`).
- Repli français des métadonnées anglaises mis en cache 300 s quand Gemini sature (`worker/packages/shared/src/translate.ts:180`, `worker/apps/site/src/prerender/index.ts:179-184`).
- L'admin n'écrit jamais `updatedAt` (`src/pages/admin/articles/useArticles.ts:170-193`) → `dateModified` = `publishedAt`.
- Trois slugs publiés en double ; RSS non dédoublonné.
- Statut `scheduled` présent dans le type mais non implémenté ; une `publishedAt` future publie immédiatement.
- « Le blog paraît chaque semaine » encore écrit (`fr/formations.json:234`, `static-pages.ts:560`).
- GSC : vieux `sitemap_index.xml` déclaré, variante `www` indexée.

## Démarche
1. Revérifier chaque défaut avant de le signaler (le code bouge).
2. Pour chaque défaut : impact SEO ou lecteur, correction proposée, effort, priorité.
3. Transmettre à Max ; ne pas modifier le code soi-même.

## Livrable
`_bmad-output/editorial/defauts-techniques.md`.
