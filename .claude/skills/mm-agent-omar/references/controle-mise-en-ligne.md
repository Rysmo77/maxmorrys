# Check-list après mise en ligne

**Réussite :** la preuve que l'article est correctement servi aux lecteurs et aux moteurs, en français et en anglais.

## Démarche
1. Sous 5 minutes (cache des métadonnées de 300 s) :
   - `curl -s -A Googlebot https://maxmorrys.me/blog/<slug>` : `<title>` = titre SEO + « | Max-Morrys », meta description, canonique, alternates fr/en/x-default, JSON-LD `Article` et `BreadcrumbList`, un seul `<h1>`.
   - `curl -s -A Googlebot https://maxmorrys.me/en/blog/<slug_en>` : titre et description **en anglais** (⚠️ si Gemini sature, le repli français est mis en cache 300 s : revérifier plus tard avant de conclure) ; noter que `mainEntityOfPage.@id` y est faux (défaut connu).
2. Sous 1 heure : présence dans `https://maxmorrys.me/sitemap.xml` (paire FR/EN) et `https://maxmorrys.me/rss.xml`.
3. `npm run seo:check` : aucune contradiction nouvelle.
4. Demander à Max l'inspection d'URL et la demande d'indexation dans la Search Console (FR et EN).
5. À J+7 et J+30 : statut d'indexation et premières impressions (export Search Console fourni par Max).

## Livrable
Section « Mise en ligne » dans `_bmad-output/editorial/<slug>/relecture.md` (horodatée, avec les résultats).
