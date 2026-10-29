# Remise à niveau des 46 articles existants

**Réussite :** un plan priorisé, article par article, qui transforme le stock hors charte en stock utile, sans rien casser en production.

## Matière
- `07-editorial-seo.md` (état SEO, doublons, cannibales) et l'audit `docs/growth-kb/audits/2026-10-29-editorial.md`.
- Constats : 29/46 avec emojis, 46/46 avec un H1 dans le corps, 10/46 qui vouvoient, chiffres et exemples non sourcés, CTA de fin concurrents, promesses de cadence, 15 titres au-delà de 47 caractères (+ suffixe), 11 slugs avec « 2026 ».
- Doublons publiés : `vendre-en-ligne-afrique-francophone-lois-2026`, `algorithme-instagram-2026-vues-strategie`, `materiel-video-entrepreneur-guide-2026` ; paires cannibales « 50 000 FCFA publicité Facebook » et « algorithme Instagram ».

## Démarche
1. Classer chaque article : **garder et corriger**, **fusionner** (avec redirection 301 de l'URL perdue), **dépublier** (si sans valeur et sans trafic).
2. Priorité 1 : doublons et cannibales (décision de fusion, URL conservée = celle qui a des impressions dans GSC).
3. Priorité 2 : les articles qui ont des impressions (`rentabiliser-50000-fcfa-publicite-facebook-afrique`, `mistral-ai-marketing…`, `tiktok-ads-afrique-guide-pme`…) : retirer les chiffres non sourcés ou les sourcer (Thierry), retirer H1, emojis, vouvoiement, CTA de fin, raccourcir les titres (Rokia).
4. Méthode de correction : l'article est d'abord ramené dans `content/blog/<slug>.md` (Cheikh), corrigé, passé à `blog:lint` (Béatrice), puis **Max applique la correction dans l'admin** ou décide explicitement d'une autre voie. Le script de dépôt refuse de toucher un article publié : c'est voulu.
5. Les redirections et le retrait des doublons sont des changements de code ou de données : les décrire pour Max, ne pas les exécuter.

## Livrable
`_bmad-output/editorial/remise-a-niveau.md` : tableau (slug, impressions GSC si connues, décision, corrections, responsable, statut).
