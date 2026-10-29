# Audit automatisation marketing « 360 » — Max-Morrys — 2026-10-29

Audit en **lecture seule** : uniquement des GET (API n8n, NocoDB, Graph Meta, Telegram), `docker ps`, `systemctl`, CLI `paperclipai … list/get` (lecture), lecture de fichiers. Aucune mutation. Les seuls fichiers écrits sont mes dumps temporaires dans `/tmp` du VPS, supprimés à la fin, et ce rapport.

## TL;DR — le verdict en 6 lignes

1. **Le social ne publie plus rien depuis ~2,5 mois.** Côté plateformes, le dernier post visible date du **10/08/2026 sur Instagram** et du **20/07/2026 sur Facebook**. Le dernier passage « publié » dans NocoDB date du 13/08, et le dernier log de WF-SOCIAL-05 du 16/08.
2. **Les 4 workflows sociaux actifs tournent à vide et passent au vert** : 2 433 exécutions « success » sur 14 jours, qui n'ont rien produit. La table `Contenus` n'a reçu **aucune ligne depuis le 07/08** et **aucune modification depuis le 22/08**. Le statut `planifié` n'a plus aucune ligne, donc WF-SOCIAL-03 lit une file vide 7 fois par jour.
3. **Cause racine en amont** : WF-THEMES (le seul producteur automatique de thèmes) **échoue 2 vendredis sur 2** avec une erreur Gemini 503 « high demand ». Cette erreur correspond à la **clé gratuite**, que le ticket Paperclip MAX-14 « Upgrade Gemini au tier payant » attend de passer en payant depuis le 06/08. Le nœud n'a pas de nouvelle tentative (retry). Et **WF-TG-ROUTER n'a reçu aucun clic Telegram en 14 jours** : la boucle d'approbation humaine est à l'arrêt. 29 posts attendent en `prêt_à_valider` avec des dates prévues dépassées (24/08 → 11/09).
4. **Email (Brevo) et WhatsApp n'ont jamais été branchés** : workflows inactifs, tables `Emails` et `WhatsApp` à **0 ligne**. LinkedIn, TikTok et YouTube sont en skip (pas de jeton, ou YouTube non implémenté). Pour X, les clés OAuth1 sont présentes mais le dernier post date du 09/07.
5. **Paperclip ne boucle plus de manière coûteuse.** L'ancien agent en boucle, « n8n Ops », est en pause après **4 230 exécutions**. Mais 3 agents (Community, Designer, Email) se réveillent encore toutes les 12 h pour retomber sur des tickets `blocked`. Au total : **110 tickets, dont 28 ouverts, 16 en `in_review` pour la plupart abandonnés depuis juillet-août**.
6. **Recommandation : garder n8n comme couche d'exécution, mais la réduire à 5 workflows et la réparer (P0).** Mettre en veille Paperclip pour le marketing et faire porter la stratégie et la production par des skills BMad à la demande, qui écrivent dans NocoDB. Le détail est en §6.

---

## 1. Inventaire live des workflows n8n

**Preuve** : `GET https://n8n.maxmorrys.me/api/v1/workflows?limit=250` renvoie **37 workflows**, dont **15 actifs**. Version n8n `2.28.6` (image `n8nio/n8n:latest`), `TZ=Africa/Dakar`.

> ⚠️ **Fenêtre d'exécutions limitée à 14 jours, pas 30** : `EXECUTIONS_DATA_MAX_AGE=336` (en heures) sur le conteneur. L'API ne renvoie rien avant le 15/10 15:10. Les taux ci-dessous couvrent donc la période du 15/10 au 29/10, soit 2 462 exécutions récupérées via `GET /api/v1/executions?limit=250` paginé.

### Actifs (15)

| Workflow | id | Déclencheur | Exécutions sur 14 j | Dernière exécution | Dernier succès | Remarque |
|---|---|---|---|---|---|---|
| WF-SOCIAL-03 — Rédaction | k9vnobzVadNeU3tk | cron `0 7-19/2 * * *` + webhook | 98 ✅ / 0 ❌ | 29/10 15:00 | 29/10 | **à vide** (0 ligne `planifié`). Le nom du nœud dit « Mar/Jeu 7h », le cron réel tourne toutes les 2 h |
| WF-SOCIAL-04 — Visuels | 774G38cqIvZsJUHm | cron `0 8-20/2` + webhook | 97 ✅ / 0 ❌ | 29/10 14:00 | 29/10 | à vide ; rendu via `render-card` local (Satori), plus de Gemini Image |
| WF-SOCIAL-05 — Publication APIs natives | wrRa0I7tYAsPJSOA | cron `*/15 7-22` | 895 ✅ / 0 ❌ | 29/10 15:15 | 29/10 | à vide ; dernière publication loguée le 16/08 |
| WF-SOCIAL-07 — Notif validation Telegram | rKNtJULQL40QpgTn | cron `*/10 7-22` + webhook | 1 343 ✅ / 0 ❌ | 29/10 15:10 | 29/10 | à vide |
| WF-TG-ROUTER — Telegram | n0hquvVeQ7my7orT | telegramTrigger (webhook `…/webhook/maxmorrys-tg`) | **0** | — | — | aucun callback humain en 14 j ; webhook Telegram sain (`getWebhookInfo` : pending 0, aucune erreur) |
| WF-THEMES — Suggestions hebdo | KO5mTEtSvhiIMAwq | cron `0 17 * * 5` (tz workflow **Africa/Lagos**) | 0 ✅ / **2 ❌** | 23/10 16:00 | aucun en 14 j | Gemini 503, pas de retry |
| WF-PICKS-RELANCE | cf8XLce9QG8ZF3CU | cron sam. 10 h + dim. 9 h | 4 ✅ | 25/10 09:00 | 25/10 | relance Telegram « semaine non générée », restée sans réponse |
| WF-ERR — Alerte erreurs | MMERRALERT0001 | errorTrigger | 8 ✅ | 29/10 08:00 | 29/10 | fonctionne : chaque erreur part bien sur Telegram |
| WF-07 Idées articles *(éditorial, hors périmètre)* | 3kpXjWE4azageRz1 | cron | 0 ✅ / 2 ❌ | 26/10 | — | Gemini 503 malgré 2 retries |
| WF-08 Article SEO *(éditorial)* | 2JjbvTHuX2JPp7Fh | cron | 0 ✅ / 2 ❌ | 26/10 | — | Gemini 503 |
| WF-09 Newsletters *(éditorial)* | i5EvGUGhVvzKIM2U | cron | 0 ✅ / 2 ❌ | 29/10 | — | Gemini 503 |
| WF-10 → WF-14 (LMS) | sqQM…, 2wR0…, 3pJ2…, HJIp…, OJMy… | cron | 9 ✅ / 0 ❌ | 26/10 | 26/10 | hors marketing |

### Inactifs (22)

Doublons (deux versions du même nom, toutes deux inactives) :
- WF-DIGEST ×2 (`lK1klL7mAwEunCf9`, `Q9KEirYd5dp7kA6M`)
- WF-EMAIL-NOTIFY ×2 (`YndXipDk3gNQKtW6`, `0vqFvNvzCy4h2JBh`)
- WF-EMAIL-SEND ×2 (`tANGaf5G2QOeb5X0`, `3RuiCLE8imVvpk53`)
- WF-GOV-07 ×2 (`OgD9jnI0WcYc816e`, `Z11yy9roXewNe6Tt`)
- WF-WHATSAPP-NOTIFY ×2 (`hTPNvI5h6VZ9N2np`, `NRZUUYjpvJzOSktj`)
- WF-WHATSAPP-SEND ×2 (`qgs1PHwTgsRBu1Vh`, `6gusFWI5B5bzH6AC`)

Anciennes versions inactives de workflows actifs :
- WF-SOCIAL-03 (`E4ccWhKLKt4DmUyW`)
- WF-SOCIAL-04 (`VfzMklc4vrf16UM9`)
- WF-SOCIAL-05 (`JUveLoLaCRMdnjrM`)
- WF-SOCIAL-07 (`b5t5nhzOnspbIdii`)
- WF-TG-ROUTER (`kx2zNmzpelxHONWU`)

Workflows abandonnés :
- WF-SOCIAL-01 Idéation (`Y0eoqwZU0h5m9feB`)
- WF-SOCIAL-02 Planification (`1X9KnrQSHw8NE1x0`)
- WF-SOCIAL-06 Tracking Blotato (`SVlmmALxNwLTh2vo`)
- WF-18 (`v3isJvdiTZ3yrLi0`, seul workflow encore lié à la credential **Airtable**)

### Erreurs récurrentes

**Preuve** : `GET /api/v1/executions/{id}?includeData=true` sur les 8 exécutions en erreur. Les 8 sont toutes la même erreur :

> `Service unavailable … This model is currently experiencing high demand` sur `models/gemini-2.5-flash`

Elle touche WF-THEMES (16/10 et 23/10), WF-07 et WF-08 (19/10 et 26/10), et WF-09 (22/10 et 29/10). Le **même modèle passe** sur WF-11 à WF-14 (prompts plus courts, autres heures). C'est cohérent avec une **clé gratuite dépriorisée** : le ticket Paperclip MAX-14 « [FIX-A] Upgrade Gemini API key au tier payant » est en `backlog` depuis le 06/08. MAX-17 « [FIX-C] retry logic sur les nœuds Gemini » est aussi en `backlog`. **Non vérifié** : le tier réel de la clé (cela demande la console Google AI).

---

## 2. Par canal : est-ce que ça publie ?

Sources :
- table NocoDB `Contenus` (154 lignes) et table `Logs` ;
- Graph API Meta v21.0 en GET : `debug_token`, `/{ig}/media`, `/{page}/published_posts`, `/{page}/photos` ;
- Telegram `getMe` et `getWebhookInfo` ;
- code du nœud « Publier — APIs natives » de WF-SOCIAL-05.

| Canal | Implémenté dans SOCIAL-05 | Jeton (Config NocoDB) | Dernier « publié » NocoDB | Dernier post **visible en ligne** | Verdict |
|---|---|---|---|---|---|
| **Instagram** (@maxmorrys.me) | oui (image, carrousel, reel) | `META_TOKEN` présent, **valide** | 13/08 12:00 (25 publiés, 8 échecs, 13 en attente) | **10/08/2026 17:45** (`/media`, `media_count=8`) | ❌ arrêté depuis 2,5 mois |
| **Facebook** (page 585922641265463) | oui (photo, feed) | idem | 12/08 09:00 (18 publiés) | **20/07/2026** (`published_posts` et `photos`) | ❌ arrêté |
| LinkedIn | oui | **absent** (`LINKEDIN_TOKEN` n'est pas dans Config) | 15/07 (21 publiés, période Blotato) | non vérifié | ❌ skip (7 échecs « token absent ») |
| TikTok | oui (vidéo PULL_FROM_URL) | **absent** | 27/05 | non vérifié | ❌ retiré de la grille S2 par le board le 06/08 |
| X | oui (thread OAuth1) | 4 clés OAuth1 présentes | 09/07 (6 publiés) | non vérifié : contrôler le jeton exige une requête signée, non faite | ⚠️ inutilisé depuis juillet |
| YouTube | **non** (`fail('YouTube = noeud n8n natif requis')`) | — | 12/07 (période Blotato) | non vérifié | ❌ non implémenté |
| WhatsApp (Cloud API) | WF-WHATSAPP-* **inactifs** | `WHATSAPP_TOKEN` valide (USER) | table `WhatsApp` = **0 ligne** | `GET /{PHONE_NUMBER_ID}` renvoie **HTTP 500** | ❌ jamais en service |
| Email Brevo | WF-EMAIL-* **inactifs** | credential n8n « Brevo Max-Morrys » (non testée) | table `Emails` = **0 ligne** | — | ❌ jamais en service |
| Telegram (canal d'approbation) | SOCIAL-07, TG-ROUTER, THEMES, PICKS, ERR | bot `@MaxMorrys_notif_bot` OK (`getMe`) | — | alertes WF-ERR envoyées (8 sur 14 j) | ✅ canal technique OK ; ❌ aucun retour humain |

### ⚠️ Écart grave entre NocoDB et la réalité

Les identifiants de publication enregistrés dans NocoDB pour les derniers posts « publiés » sont introuvables via l'API :
- IG `18066641492742218`, `17915172318438142`, `18150872125519352` : `GET /{id}` répond « Object does not exist » ;
- FB `585922641265463_122198838344755358` : même réponse.

Côté plateformes, IG n'expose que 8 médias, contre 25 marqués « publié ».

Explications possibles :
- les posts ont été supprimés à la main ;
- ou le code stocke `pub.id || creationId`, donc un **identifiant de conteneur** quand `media_publish` ne renvoie rien. Le post est alors noté « publié » sans être en ligne.

Cette question reste **à trancher** : l'historique d'activité Meta Business Suite le dira. Quoi qu'il en soit, le statut `publié` de NocoDB n'est pas une preuve de publication.

### Jetons Meta

`debug_token` (GET) donne :

| Jeton | is_valid | type | expires_at | data_access_expires_at |
|---|---|---|---|---|
| `META_TOKEN` | true | PAGE | 0 (n'expire jamais) | **2026-09-26**, déjà passé |
| `WHATSAPP_TOKEN` | true | USER | 0 | 2026-09-26 |

Les GET de lecture fonctionnent encore. **Non vérifié** : la capacité à publier, qui exigerait un POST. L'expiration de l'accès aux données (Data Access Expiration) est un risque réel. Il faut ré-autoriser l'application (re-login du propriétaire) avant de relancer la publication.

---

## 3. NocoDB — base « Max-Morrys » (`ph7ugup4mggzj2y`)

**Preuve** : depuis le VPS, avec le jeton lu dans `/opt/maxmorrys-stack/.nocodb-api-token` :
- `GET http://127.0.0.1:8091/api/v2/meta/bases/…/tables` ;
- puis `GET /api/v2/tables/{id}/records` paginé.

| Table | Lignes | Par `Status` | Dernière création | Dernière modification |
|---|---|---|---|---|
| **Contenus** | 154 | publié 79 · prêt_à_valider 29 · rejeté 28 · échec 18 · **planifié 0** | **07/08/2026** | 22/08/2026 |
| Config | 45 (clé/valeur) | — | 06/08 | 21/08 |
| Logs | 285 | success 285 (260 WF-07, 25 WF-SOCIAL-05) | 19/10 (WF-07) | — |
| SEO | 265 | — | **06/08** (date de la migration, plus jamais alimentée) | 06/08 |
| Emails | **0** | — | — | — |
| WhatsApp | **0** | — | — | — |
| Banque Idees Articles *(éditorial)* | 1 202 | nouveau 1 141 · produit_draft 43 · valide 5 | 19/10 | — |
| Banque Idees Cours *(LMS)* | 572 | nouveau 568 | 25/10 | — |
| Cours en Production *(LMS)* | 57 | — | 05/08 | 06/08 |

Constats sur la table Config :
- **Secrets en clair dans une table** : `META_TOKEN`, `WHATSAPP_TOKEN`, `TELEGRAM_BOT_TOKEN`, `X_API_KEY/SECRET`, `X_ACCESS_TOKEN/SECRET`, `CF_ACCESS_CLIENT_SECRET`, `RENDER_KEY`, `N8N_TRIGGER_TOKEN`. Toute personne ou tout jeton NocoDB qui lit Config les obtient. Je ne les ai pas affichés : seule leur longueur a été lue.
- **Clés mortes** : `AIRTABLE_TABLE_SEO`, `AIRTABLE_TABLE_EMAILS`, `AIRTABLE_TABLE_WHATSAPP`, `BLOTATO_ACCOUNTS` (`__FILL_ME__`), `GEMINI_MODEL_TEXT=gemini-2.5-pro` (ignorée : tous les nœuds codent `models/gemini-2.5-flash` en dur).
- `PUBLISH_ENABLED=true`, `VALIDATION_MODE=telegram`.
- `PICK_THEME` et `THEMES_CURRENT` sont figés sur des thèmes d'août.
- `PAPERCLIP_BASE=https://paperclip.maxmorrys.me`.
- `Contenus` traîne encore les colonnes `Airtable_Record_ID`, `Blotato_*` et `_DEPRECATED_*`.

---

## 4. Paperclip — « Maxmorrys Growth » (company 29055790…)

**Preuve** : `systemctl is-active paperclip-maxmorrys` répond `active` depuis le 18/10. Ensuite, CLI en lecture contre `http://127.0.0.1:3112` : `paperclipai agent list`, `issue list`, `cost summary`, `cost by-agent`, `activity list` (avec `-C 29055790… --json`). Remarque : `dashboard get` renvoie « 404 Agent not found » (bug ou mauvais contexte CLI, sans importance).

### Agents

| Agent | Statut | Dernier heartbeat | Heartbeat | Exécutions (abonnement Claude Max) | Tokens en sortie |
|---|---|---|---|---|---|
| Community | **idle (actif)** | 29/10 06:09 | toutes les 12 h + réveil à la demande | 189 | 0,18 M |
| Designer | **idle (actif)** | 29/10 09:30 | 12 h + réveil à la demande | 345 | 1,24 M |
| Email | **idle (actif)** | 29/10 08:09 | 12 h + réveil à la demande | 349 | 0,85 M |
| CMO | paused | 05/10 | off | 340 | 2,33 M |
| Copywriter | paused | 19/10 | off | 239 | 1,75 M |
| SEO Tech | paused | 13/08 | off | 63 | 0,96 M |
| n8n Ops | paused | 06/08 | off | **4 230** (la boucle historique) | 1,09 M — **430 M de tokens d'entrée en cache** |
| Analytics, Strategist, Paid | terminated | — | — | 1-2 | — |

Coût facturé en API : 4,46 $ sur un budget de 50 $. **Le vrai coût, c'est le quota de l'abonnement Claude Max** : environ 5 700 exécutions et environ 1,1 milliard de tokens d'entrée en cache, cumulés.

### Signes de boucle

Plus de boucle intense. Mais le motif « réveil → ticket bloqué → re-blocage » continue. Le 29/10 :
- MAX-26 a été rouvert par un utilisateur à 08:08, puis repassé en `blocked` par l'agent Email à 08:09 ;
- MAX-48 a reçu un commentaire utilisateur à 09:30, et l'agent Designer a répondu à 09:30.

Sur 14 jours, l'activité se résume à environ 45 cycles `lease_acquired`/`released`, soit environ 3 réveils par jour. Ils ne produisent rien de livrable.

### Tickets

110 au total : done 80 · **in_review 16** · **blocked 7** · backlog 5 · cancelled 2.

- **Bloqués** :
  - MAX-26 Séquence de bienvenue
  - MAX-48 3 Reels S3
  - MAX-4 Reels TikTok
  - MAX-6 Réponses commentaires
  - MAX-109 Sweep n8n
  - MAX-79 Push GitHub
  - MAX-94 Gemini 429 crédits épuisés
- **En revue depuis juillet-août sans suite** : MAX-7 (plan paid), MAX-8 (KPI), MAX-21, MAX-22, MAX-24 (Meilisearch), MAX-27, MAX-28 (WhatsApp), MAX-30, MAX-31, MAX-33, MAX-47, MAX-91, MAX-96, MAX-100, MAX-103.
- **Backlog lié au problème actuel** :
  - MAX-14 (Gemini en payant)
  - MAX-16 (modèles dépréciés)
  - MAX-17 (retry Gemini)

Le board memo hebdomadaire (CMO) a cessé le 05/10, quand le CMO est passé en pause.

---

## 5. Dette et risques

| # | Constat | Preuve |
|---|---|---|
| D1 | **Pipeline affamé mais au vert** : rien n'alerte quand 0 ligne est traitée pendant des semaines. WF-ERR ne se déclenche qu'en cas d'exception. | 2 433 « success » sur 14 j pour SOCIAL-03/04/05/07, 0 ligne créée depuis le 07/08 |
| D2 | **Point de défaillance unique en amont** : la production repose sur un seul appel Gemini hebdomadaire (THEMES) puis sur un clic Telegram. SOCIAL-01/02 (idéation et planification) sont inactifs. | inventaire §1 |
| D3 | **Clé Gemini gratuite + nœuds sans retry** sur le chemin marketing (THEMES, SOCIAL-03, TG-ROUTER ×3, WF-08, WF-09). | `retryOnFail` absent ; MAX-14 en backlog |
| D4 | **« publié » non fiable** (identifiants introuvables) | §2 |
| D5 | **12 doublons et anciennes versions inactives** (22 workflows inactifs au total), d'où confusion et risque d'activer la mauvaise version | §1 |
| D6 | **Airtable encore écrit depuis le Mac** : `scripts/gsc-pull.py`, lancé chaque jour à 7 h 15 par **launchd** (`com.maxmorrys.gsc-pull`), écrit dans Airtable `apppkEbepilHCYiso/tblhLk66jOUsEhi7G` (dernier log : « GSC pull OK: 21 lignes écrites (date 2026-10-29) »). Pendant ce temps, la table NocoDB `SEO` est figée au 06/08. **Contradiction avec « Airtable n'est plus écrit ».** | `~/Library/LaunchAgents/com.maxmorrys.gsc-pull.plist`, `~/.cloudflared/gsc-pull.log` |
| D7 | Références Airtable restantes dans n8n : uniquement des **noms de nœuds et des commentaires** (« Airtable — Lire validés (NocoDB) »), plus la credential `Airtable Max-Morrys` sur WF-18 (inactif) et des clés `AIRTABLE_*` dans Config. Fonctionnellement migré, mais trompeur. | scan JSON des 37 workflows |
| D8 | **Dépendance au Mac** : (a) gsc-pull (D6) ; (b) un **tunnel cloudflared `paperclip` reste en KeepAlive sur le Mac** vers `127.0.0.1:3100`, où rien n'écoute. `paperclip.maxmorrys.me` est en réalité servi par Caddy sur le VPS (`server: Caddy`, basic auth), donc ce tunnel est un **vestige**. S'il est encore rattaché au DNS ou à un connecteur, il peut provoquer des 502 intermittentes. | `~/.cloudflared/config.yml`, `launchctl list`, `curl -I` |
| D9 | **Secrets en clair** dans la table NocoDB `Config` (cf. §3), et non dans les credentials n8n. Aucun secret en clair trouvé dans les JSON n8n live ni dans `n8n/`, `paperclip/`, `docs/` du dépôt (scan regex EAA/AIza/xkeysib/bot-token/PAT). | §3 |
| D10 | **Copies du dépôt en dérive** : `n8n/live/WF-SOCIAL-04.json` a 18 nœuds contre 14 en live (le live est passé à render-card). **WF-SOCIAL-05 et WF-SOCIAL-07, les deux workflows qui publient et notifient, n'ont aucune copie dans le dépôt.** Dernier commit sur `n8n/live` : 25/08. | comparaison des noms de nœuds |
| D11 | **Modèles Gemini** : seuls `models/gemini-2.5-flash` et `gemini-2.5-flash-image-preview` (WF-08, WF-14, ancien SOCIAL-04) sont référencés, ce qui est **valide**. Les chaînes « gemini-native », « gemini-pro---r » ou « gemini-enhance » sont des **identifiants ou noms de nœuds**, pas des modèles. Les nœuds s'appellent « Gemini Pro — … » mais tournent en Flash (trompeur). `GEMINI_MODEL_TEXT=gemini-2.5-pro` dans Config n'est lu par personne. | regex `models/…` |
| D12 | Image n8n `n8nio/n8n:latest`, non épinglée : une mise à jour au redémarrage peut tout casser sans prévenir. | `docker inspect` |
| D13 | WF-THEMES a un fuseau `Africa/Lagos` (UTC+1) alors que l'instance est en `Africa/Dakar` (UTC+0) : décalage d'une heure. | settings du workflow |
| D14 | La rétention de 14 jours des exécutions empêche tout bilan à 30 jours. | `EXECUTIONS_DATA_MAX_AGE=336` |
| D15 | Coûts : n8n auto-hébergé, coût marginal à peu près nul (VPS de 47 Go de RAM partagé avec Khanouss et Steps : 37 conteneurs). Gemini gratuit, donc instable. Paperclip consomme le **quota Claude Max** (environ 5 700 exécutions cumulées) pour un rendement quasi nul depuis août. | §4 |
| D16 | Sauvegarde : `maxmorrys-backup.timer` s'est exécuté le 29/10 à 03:30, mais `/opt/maxmorrys-stack/sauvegardes/` est vide. La destination réelle **n'a pas été vérifiée**. | `systemctl list-timers` |

---

## 6. Verdict et plan

### Verdict : GARDER n8n comme couche d'exécution, mais réduite et instrumentée. BMad (skills Claude Code à la demande) devient la couche stratégie et production. Paperclip passe en veille pour le marketing.

Arguments :
- **Ce que n8n fait bien, et qu'il fait déjà** : crons fiables (aucun raté en 14 j), appels API natifs Meta et X déjà codés et testés en juillet-août, boucle Telegram ✅/❌ opérationnelle techniquement (webhook sain), rendu des visuels local (render-card renvoie 200), alertes d'erreur fonctionnelles. Le refaire ailleurs coûterait des semaines sans gain.
- **Ce que n8n fait mal** : la *création* (idéation, rédaction, choix de thèmes) via une clé Gemini gratuite et un seul appel hebdomadaire. C'est précisément le maillon cassé. Un humain + Claude Code (skills BMad dans le dépôt, lancés quand Max le décide) produit un lot de 2 semaines de posts en une session et l'écrit directement dans NocoDB en `validé`. Cela supprime en même temps la dépendance à THEMES, à PICKS et au clic Telegram.
- **Paperclip** : un modèle « agents autonomes à heartbeat » qui a brûlé environ 5 700 exécutions Claude Max pour 16 tickets en revue que personne ne relit. Le goulot est l'**attention humaine**, pas la capacité de production. Il faut des outils à la demande, pas des agents qui se réveillent seuls.
- **Simplifier davantage** (tout supprimer et passer par un SaaS comme Buffer ou Metricool) serait possible pour FB/IG. Mais on perdrait le contrôle NocoDB et Telegram, et on ajouterait un abonnement. Ce n'est pas justifié tant que FB et IG sont les seuls canaux actifs.

Architecture cible :
- **Production (à la demande, Claude Code + skills BMad)** : thèmes du mois, rédaction, visuels. Le résultat est écrit dans NocoDB `Contenus` avec `Status=validé` et `Date_Publication_Prevue`.
- **Exécution (n8n, 5 workflows)** : SOCIAL-04 (rendu des visuels), SOCIAL-05 (publication), SOCIAL-07 + TG-ROUTER (validation optionnelle), WF-ERR, plus un nouveau **WF-HEALTH** de surveillance « rien publié depuis N jours ».

### Corrections priorisées

**P0 — relancer la publication (environ 1 jour)**

| # | Action | Effort |
|---|---|---|
| P0-1 | Ré-autoriser l'application Meta (re-login du propriétaire, puis nouveau jeton de page longue durée) : `data_access_expires_at` est passé depuis le 26/09. Ensuite, tester un post FB et IG réel (POST, à faire par l'humain). | 1 h |
| P0-2 | Trancher l'écart « publié mais introuvable » (Meta Business Suite). Corriger SOCIAL-05 : ne passer en `publié` **que si `media_publish` renvoie un `id`**, puis vérifier par `GET /{id}?fields=permalink` et stocker le permalink dans `Blotato_PublicUrl`. | 2 h |
| P0-3 | Vider les 29 `prêt_à_valider` périmés : les re-dater ou les rejeter. Remettre une file de 2 semaines (production manuelle avec Claude, écrite dans NocoDB). | 2 h |
| P0-4 | Créer **WF-HEALTH** (cron quotidien) : alerte Telegram si aucune ligne `publié` depuis 72 h, ou si la file `validé` est vide pour 7 jours. Cela ferme le « vert à vide » (D1). | 1-2 h |
| P0-5 | Passer la clé Gemini en payant (MAX-14) **ou** retirer Gemini du chemin critique marketing. Ajouter `retryOnFail` (3 essais, 30 s d'attente) sur tous les nœuds Gemini restants (MAX-17). | 30 min + coût |

**P1 — assainir (environ 1 à 2 jours)**

| # | Action | Effort |
|---|---|---|
| P1-1 | Archiver ou supprimer les 22 workflows inactifs (doublons, SOCIAL-01/02/06, WF-18), après export JSON dans le dépôt. | 1 h |
| P1-2 | Exporter les **workflows live** (dont SOCIAL-05 et 07, absents du dépôt) vers `n8n/live/`, retirer `n8n/strategy-2026` s'il est redondant, et ajouter un script d'export reproductible. | 1-2 h |
| P1-3 | Sortir les secrets de NocoDB `Config` vers des credentials n8n (Meta, X, Telegram, CF Access, render key), puis faire tourner les jetons exposés. | 3-4 h |
| P1-4 | gsc-pull : le migrer sur le VPS (cron ou n8n) avec écriture dans NocoDB `SEO`, couper l'écriture Airtable et décharger le LaunchAgent Mac. Supprimer le tunnel cloudflared `paperclip` du Mac (vestige). | 2-3 h |
| P1-5 | Paperclip marketing : passer Community, Designer et Email en `paused` (heartbeat off), puis clore ou annuler les 16 `in_review` et 7 `blocked` après tri humain. | 1 h |
| P1-6 | Décider du sort de **Email Brevo** et **WhatsApp** : soit les brancher (workflows prêts mais inactifs, tables vides, et le numéro WA renvoie HTTP 500 : à investiguer côté WABA), soit les retirer de la promesse « 360 ». | décision, puis 0,5-1 j si on branche |

**P2 — confort et robustesse**

| # | Action | Effort |
|---|---|---|
| P2-1 | Épingler la version de l'image n8n (`2.28.6`). Porter la rétention à 30 jours (`EXECUTIONS_DATA_MAX_AGE=720`). | 15 min |
| P2-2 | Renommer les nœuds « Airtable — … » et « Gemini Pro — … » en noms réels. Purger les clés mortes de Config (`AIRTABLE_*`, `BLOTATO_ACCOUNTS`, `GEMINI_MODEL_TEXT`) et les colonnes `_DEPRECATED_*`. | 1-2 h |
| P2-3 | Corriger le fuseau de WF-THEMES (Lagos vers Dakar) et le nom du cron de SOCIAL-03 (« Mar/Jeu 7h » alors qu'il tourne toutes les 2 h). Si la production passe en manuel, désactiver THEMES et PICKS-RELANCE. | 15 min |
| P2-4 | Créer les skills BMad marketing dans le dépôt (`.claude/skills/mm-social-batch`, `mm-themes-mois`, `mm-email-sequence`) qui lisent `docs/STRATEGIE_COMMUNICATION_2026.md` et écrivent dans NocoDB via l'API (avec dry-run par défaut). | 1-2 j |
| P2-5 | LinkedIn : obtenir le jeton (la page entreprise demande l'accès Community Management API). YouTube : le nœud natif. Seulement si la stratégie les maintient. | 0,5-1 j chacun |
| P2-6 | Vérifier la destination réelle de `maxmorrys-backup.service` (NocoDB et Postgres n8n), puis faire un test de restauration. | 1 h |

### Non vérifié (aurait exigé une écriture ou un accès absent)

- La capacité réelle à publier sur Meta (POST).
- La validité des jetons X (requête OAuth1 signée).
- La credential Brevo.
- La cause du HTTP 500 sur le numéro WhatsApp.
- Le tier de la clé Gemini.
- La destination des sauvegardes.
- Les taux de succès au-delà de 14 jours (purgés).
