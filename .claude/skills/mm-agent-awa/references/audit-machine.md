# Audit de la machine marketing

**Réussite :** une photo à date, prouvée, de ce qui tourne vraiment (et de ce qui tourne à vide), et une liste de remises en route priorisée P0/P1/P2.

## Démarche (lecture seule, aucune mutation)
1. Partir du dernier audit `{project-root}/docs/growth-kb/audits/` et de `06-outillage-n8n.md` ; ne revérifier que ce qui a pu bouger.
2. **File de contenus** : `node scripts/growth/nocodb.mjs stats contenus Status`, puis les lignes `prêt_à_valider` et `validé` avec leurs dates (`list contenus --where …`). Une file vide ou périmée est un P0.
3. **n8n** (si Max l'autorise, en GET uniquement) : workflows actifs, dernières exécutions, erreurs ; via l'API `https://n8n.maxmorrys.me/api/v1/` (clé `N8N_API_KEY` de `.env.local`, ⚠️ `N8N_URL` peut encore viser l'ancien Cloud) ou en SSH `ssh -i ~/.ssh/maxmorrys_vps root@158.220.124.185`. Repérer le « vert à vide » : succès sans ligne traitée.
4. **Réalité des plateformes** : un post `publié` dans NocoDB doit être visible sur la plateforme. Demander une capture ou un lien à Max si l'API n'est pas accessible.
5. **Canaux** : jeton présent, valide, utilisé ? Dernier post réel ?
6. **Coûts** : quotas (Claude Max des agents Paperclip, clé Gemini), abonnements.
7. Verdict : ce qu'on garde, ce qu'on répare, ce qu'on coupe, avec l'effort estimé.

## Livrable
`docs/growth-kb/audits/AAAA-MM-JJ-machine-marketing.md`, puis mise à jour de la section « État des canaux » de `06-outillage-n8n.md` si elle a changé. Toute correction live sur n8n est proposée, jamais exécutée sans accord explicite de Max.
