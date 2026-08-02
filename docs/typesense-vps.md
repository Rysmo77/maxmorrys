# Typesense auto-hébergé sur le VPS

Instance de recherche servant `reindexSearch` (indexation, côté serveur) et la
recherche du site (côté navigateur, clé restreinte en lecture).

```
Navigateur ──https──► typesense.maxmorrys.me ──► Caddy ──► maxmorrys-typesense:8108
                       (clé search-only)                    (volume typesense_data)
```

## Ce qui a été mis en place

| Élément | Valeur |
|---|---|
| Hôte | VPS Contabo `158.220.124.185` |
| Service | `maxmorrys-typesense`, dans `/opt/maxmorrys-stack/docker-compose.yml` |
| Image | `typesense/typesense:30.2` (version épinglée, pas `latest`) |
| Données | volume Docker `maxmorrys_typesense_data` |
| Réseaux | `internal` + `khanouss_default` (pour être joignable par Caddy) |
| Domaine | `typesense.maxmorrys.me`, A → VPS, **non proxifié** |
| TLS | Caddy, ACME HTTP-01 — même schéma que `n8n` et `paperclip` |

Le sous-domaine n'est volontairement pas proxifié par Cloudflare : c'est la
convention des autres services du VPS, et cela laisse Caddy gérer le certificat
sans configuration supplémentaire. Le mettre derrière Cloudflare apporterait du
cache et du rate limiting, mais impose de vérifier que le mode SSL de la zone est
« Full (strict) ».

## Les clés

Deux clés, deux usages, à ne jamais confondre :

- **Clé admin** — dans `/opt/maxmorrys-stack/.env` (`TYPESENSE_ADMIN_KEY`) et dans
  Secret Manager. Autorise tout. Ne doit **jamais** atteindre le navigateur.
- **Clé de recherche** — restreinte à l'action `documents:search`. Destinée au
  frontend via `VITE_TYPESENSE_SEARCH_KEY`, donc publique par construction.

En régénérer une :

```bash
ssh maxmorrys-vps
K=$(grep '^TYPESENSE_ADMIN_KEY=' /opt/maxmorrys-stack/.env | cut -d= -f2)
docker run --rm --network khanouss_default curlimages/curl -s -X POST \
  -H "X-TYPESENSE-API-KEY: $K" -H 'Content-Type: application/json' \
  -d '{"description":"Recherche publique","actions":["documents:search"],"collections":["*"]}' \
  http://maxmorrys-typesense:8108/keys
```

La valeur d'une clé n'est renvoyée **qu'à la création** — la noter tout de suite.

## Côté Firebase

`reindexSearch` déclare `TYPESENSE_URL` et `TYPESENSE_ADMIN_KEY` en secrets.

⚠️ **Leur absence bloquait tout déploiement de fonctions** — pas seulement celui
de `reindexSearch`. C'est la raison pour laquelle les Cloud Functions n'avaient
plus été déployées depuis la bascule Meilisearch → Typesense, et pourquoi la
production a servi pendant plusieurs semaines une version antérieure du
prerender et du sitemap.

```bash
printf 'https://typesense.maxmorrys.me' | firebase functions:secrets:set TYPESENSE_URL --data-file -
firebase functions:secrets:set TYPESENSE_ADMIN_KEY --data-file -   # valeur au clavier ou par tube
```

## Activer la recherche côté site

Elle reste inactive tant que `VITE_TYPESENSE_SEARCH_KEY` est vide — l'app retombe
sur sa recherche locale. Pour l'activer :

1. Lancer `reindexSearch` depuis l'administration (indexe `blog`, `formations`,
   `videos`, `podcasts`).
2. Vérifier que les collections sont peuplées.
3. Renseigner `VITE_TYPESENSE_SEARCH_KEY`, rebâtir et déployer le hosting.

## Exploitation

```bash
ssh maxmorrys-vps
docker compose -f /opt/maxmorrys-stack/docker-compose.yml logs -f typesense
curl -s https://typesense.maxmorrys.me/health          # {"ok":true}
```

Sauvegarde : le volume `maxmorrys_typesense_data` n'est pas sauvegardé — l'index
est entièrement reconstructible depuis Firestore via `reindexSearch`, donc ce
n'est pas une donnée de référence.

## Pistes de durcissement

- Restreindre les chemins d'administration au niveau de Caddy (n'exposer
  publiquement que `/health`, `/multi_search` et
  `/collections/*/documents/search`). Suppose que l'indexation atteigne Typesense
  par un autre chemin que l'internet public.
- Restreindre les origines CORS : `TYPESENSE_ENABLE_CORS` est actuellement à
  `true`, donc ouvert à toutes.
