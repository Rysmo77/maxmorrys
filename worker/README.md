# Workers Cloudflare — maxmorrys.me

Monorepo npm workspaces regroupant les Workers de la plateforme. Il remplace
progressivement les Cloud Functions Firebase (voir le plan de migration).

```
packages/                 code partagé, sans binding
  gcp-auth/               JWT RS256 WebCrypto + access tokens OAuth (remplace l'auth de firebase-admin)
  firestore-rest/         client Firestore via l'API REST (remplace firebase-admin/firestore)
  firebase-auth-rest/     vérification d'ID token + Identity Toolkit admin
  shared/                 CORS, WebCrypto (SHA-256/HMAC), helpers de réponse

apps/                     un Worker déployable par dossier
  media/                  maxmorrys-media — upload R2 (media-api.maxmorrys.me)
  site/                   maxmorrys-site — SEO au bord, devant Firebase Hosting
  api/                    maxmorrys-api  — callables onCall (api.maxmorrys.me)
```

## Le worker `api`

Il réimplémente le protocole `onCall` sur `api.maxmorrys.me`. Le frontend bascule
d'une seule ligne — `getFunctions(app, VITE_FUNCTIONS_ORIGIN || 'us-central1')` —
parce que le SDK accepte un domaine personnalisé à la place d'une région et
appelle alors `${domaine}/${nom}`. Les 33 sites `httpsCallable` sont intouchés.

Tout nom absent de la variable `MIGRATED` est **relayé vers Cloud Functions**.
La migration se fait donc une callable à la fois.

Trois interrupteurs, du plus fin au plus large :

| Levier | Portée | Rollback |
|---|---|---|
| retirer un nom de `MIGRATED` | une callable | `wrangler deploy`, ~15 s |
| vider `VITE_FUNCTIONS_ORIGIN` | les 33 | un build du frontend |
| supprimer le domaine `api.maxmorrys.me` | tout | immédiat |

### Vérifier la parité avec Cloud Functions

Le chemin non authentifié se teste au `curl` ; le chemin authentifié porte le
vrai risque. Le harnais crée un compte de test éphémère, compare les réponses
des deux côtés, puis **supprime le compte** — y compris en cas d'échec :

```bash
GOOGLE_APPLICATION_CREDENTIALS=../max-morrys-<id>.json \
FIREBASE_API_KEY=<clé web> \
node scripts/callable-parity.mjs https://api.maxmorrys.me \
  https://us-central1-max-morrys.cloudfunctions.net
```

À relancer après chaque lot migré, **avant** d'ajouter les noms à `MIGRATED`.

## Le worker `site`

Il se place sur `maxmorrys.me/*` (route Cloudflare — la zone est déjà proxifiée,
aucun changement DNS) et reprend au bord ce que `firebase.json` envoyait à des
Cloud Functions : `/sitemap.xml`, `/rss.xml`, `/catalog.csv` et le prerender SEO
d'une trentaine de routes. **Tout le reste est relayé à l'origine**
`max-morrys.web.app`.

Deux filets de sécurité, volontairement redondants :

1. toute erreur du Worker retombe sur l'origine, qui sait encore répondre tant
   que les rewrites Firebase sont en place ;
2. supprimer la route Cloudflare rend la main à Firebase Hosting en quelques
   secondes, sans propagation DNS.

⚠️ Ne jamais faire pointer `ORIGIN` sur `maxmorrys.me` : le Worker se rappellerait
lui-même (erreurs 1015 / 508). L'origine doit rester hors zone.

### Avant le premier déploiement

```bash
npx wrangler kv namespace create SEO          # reporter l'id dans wrangler.jsonc
cd apps/site
npx wrangler secret put GCP_SA_JSON < ../../../max-morrys-<id>.json
npx wrangler secret put GOOGLE_AI_API_KEY
npm run deploy:preview                        # workers.dev, sans toucher au domaine
```

## Commandes

```bash
npm install            # à la racine de worker/, installe tous les workspaces
npm run typecheck      # tsc --noEmit sur packages/ et apps/
npm test               # deux projets : `packages` sous Node, `site` sous workerd

npm -w @mm/media-worker run dev
npm -w @mm/media-worker run deploy
```

Le typecheck et les tests tournent en CI dans le job `workers`.

### Valider le codec sur la production

Un test d'intégration lit des documents réels (**en lecture seule**) et vérifie
que `encode(decode(doc))` ne perd rien. Il est ignoré tant que la variable n'est
pas définie, donc silencieux en CI :

```bash
GOOGLE_APPLICATION_CREDENTIALS=../max-morrys-<id>.json npm test
```

À relancer après toute modification de `packages/firestore-rest/src/value.ts`.

### Vérifier la parité avant/après bascule

```bash
# L'origine Firebase Hosting sert-elle bien la même chose que le domaine public ?
node scripts/origin-parity.mjs https://maxmorrys.me https://max-morrys.web.app

# Après mise en place du Worker : n'a-t-il rien changé ?
node scripts/origin-parity.mjs https://max-morrys.web.app https://maxmorrys.me
```

## Pourquoi pas `firebase-admin`

`firebase-admin` dépend de gRPC/http2 et des streams Node : il ne fonctionne pas
sur Workers. `packages/firestore-rest` parle donc à l'API REST Firestore, avec un
JWT de compte de service signé en WebCrypto.

Deux conséquences à garder en tête :

1. **L'accès REST par compte de service contourne `firestore.rules`**, exactement
   comme `firebase-admin` aujourd'hui. Chaque handler doit refaire ses contrôles
   d'autorisation explicitement.
2. **Le codec de valeurs est le point sensible.** Une conversion approximative ne
   lève aucune erreur : elle change le type stocké. Les invariants sont figés par
   les tests de `packages/firestore-rest/test/` — ne pas les contourner.

## Secrets

Jamais dans `[vars]` de `wrangler.toml`, toujours `wrangler secret put`. Le JSON
du compte de service GCP (`max-morrys-*.json`, ignoré par git) s'injecte ainsi :

```bash
npm -w @mm/<app> exec -- wrangler secret put GCP_SA_JSON < ../../../max-morrys-<id>.json
```
