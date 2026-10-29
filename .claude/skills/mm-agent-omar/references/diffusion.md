# Diffuser un article

**Réussite :** l'article est relayé sur les réseaux où se trouvent ses lecteurs et dans la lettre, sans jamais publier ni envoyer sans validation.

## Démarche
1. Partir des déclinaisons de Cheikh (`_bmad-output/editorial/<slug>/declinaisons.md`), sinon les demander.
2. Préparer 3 à 5 lignes pour NocoDB `Contenus`, une par réseau pertinent, dans `_bmad-output/editorial/<slug>/diffusion.json` : `Titre`, `Reseau` (fb|ig|linkedin|x…), `Format_Post`, `Pilier` (souvent Éducation), `Serie` (souvent ATELIER), `Offre` (celle de l'article, sinon Non-produit), `Cible`, `Date_Publication_Prevue` (ISO), `Texte`, `Hashtags`, `Visual_Strategy`, `Status: "rédigé"`.
3. **Écrire les légendes FB/IG selon `{project-root}/docs/growth-kb/10-community-management.md`** (il fait autorité, prime sur `04`) : accroche d'une ligne, lignes courtes, micro-CTA à signal fort (commentaire, enregistrement, partage). `Texte` : FB post 40-90 mots, IG post 30-80, IG carrousel 20-60. 1 à 3 emojis (jamais un par ligne). Hashtags dans le champ `Hashtags` seulement (IG 4-6, FB 2-3), jamais dans `Texte`. IG : « le lien est dans ma bio », aucune URL ; FB : le lien UTM en dernière ligne, un seul. Avant dépôt, passer le contrôle §8 du guide (mots, emojis via `/\p{Extended_Pictographic}/gu`, hashtags, aucun « · » ni « ; », aucun vous/votre/vos).
4. Lien avec UTM : `https://maxmorrys.me/blog/<slug>?utm_source={reseau}&utm_medium={format}&utm_campaign=blog_<slug>&utm_content=<angle>_v01`.
5. Faire relire par Béatrice si besoin, puis simuler et écrire : `node scripts/growth/nocodb.mjs create contenus --file … ` puis `--apply`. Coordonner les dates avec Mariam (respect du mix et de « OFFRE ≤ 3 sur 14 »).
6. Brief à Serge pour la lettre : titre, résumé, lien avec UTM `utm_source=lettre`. ⚠️ Brevo n'est pas encore branché : la lettre reste un brouillon tant que Max n'a pas tranché.
7. Rappeler que FB et IG ne publient pas tant que l'appli Meta n'est pas ré-autorisée (`06-outillage-n8n.md`).

## Livrable
`diffusion.json` versé dans NocoDB en `rédigé` (le rendu visuel le passe en `prêt_à_valider`) + brief lettre dans `_bmad-output/editorial/<slug>/`.
