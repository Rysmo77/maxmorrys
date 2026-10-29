# Corrections n8n — Max-Morrys — 2026-10-29

Feu vert explicite du propriétaire (Max, 29/10/2026 : « Tu as mon feu vert pour n8n »). Base : audits du jour `2026-10-29-n8n-marketing.md` et `2026-10-29-editorial.md`.

Règles suivies :
- export JSON de chaque workflow avant toute modification ;
- une modification à la fois, relue par GET après chaque PUT ;
- statut actif vérifié après chaque PUT ;
- aucun post publié, aucun e-mail envoyé, aucune ligne NocoDB passée en `validé` ou `publié` ;
- les 28 posts du lot S45-S46 (`rédigé`) et les anciens `prêt_à_valider` n'ont pas été touchés.

**Sauvegardes** :
- `backups/n8n-corrections-20261029/<id>-<nom>.json` : les 37 workflows, état d'avant toute intervention, pris au premier GET ;
- `backups/n8n-corrections-20261029/archives/` : les 19 workflows archivés.

Instance : https://n8n.maxmorrys.me, n8n `2.28.6`. ⚠️ Dans `.env.local`, la première `N8N_API_KEY` (ligne 20) est celle de l'ancien Cloud (HTTP 401) ; la bonne est la seconde (ligne 61).

## Tableau de bord

| # | Action | État | Preuve |
|---|---|---|---|
| 1 | WF-SOCIAL-05 : `publié` seulement sur id réel + permalien | ✅ | voir §1 |
| 2 | Relances Gemini | ✅ (4 essais, **5 s** et non 30 s : plafond n8n) | §2 |
| 3 | WF-HEALTH | ✅ actif, testé de bout en bout | §3 |
| 4 | WF-08 désactivé | ✅ | `active=false` |
| 5 | WF-THEMES (fuseau → Dakar) et WF-PICKS-RELANCE désactivés | ✅ | `active=false`, `timezone=Africa/Dakar` |
| 6 | WF-07 : vraie attente de toutes les branches | ✅ testé (exéc. 20680) | §6 |
| 7 | WF-09 : source = articles publiés, sans cadence, un seul CTA | ✅ testé (exéc. 20682) | §7 |
| 8 | Export des workflows actifs + script | ✅ 14 fichiers dans `n8n/live/` | §8 |
| 9 | Archivage des inactifs inutiles | ✅ 19 archivés | §9 |
| 10 | gsc-pull → NocoDB, sur le VPS | ✅ | §10 |
| 11 | Tunnel cloudflared du Mac | ✅ coupé | §11 |
| 12 | Renommage des nœuds trompeurs | ✅ 14 workflows | §12 |
| 13 | Image épinglée + rétention de 30 jours | ✅ | §13 |
| 14 | Destination des sauvegardes | ✅ constat | §14 |
| 15 | Purge de `Config` | ✅ 5 clés | §15 |
| + | Bug trouvé : lectures NocoDB exécutées N fois (SOCIAL-07, SOCIAL-04) | ✅ corrigé | §16 |
| + | WF-SOCIAL-04 : `limit` passé de 2 à 6 (à la demande du coordinateur, filtre inchangé) | ✅ | §16 |

Rien n'a été refusé par un garde-fou de permission.

## 1. WF-SOCIAL-05 (`wrRa0I7tYAsPJSOA`)

Modifications du nœud Code « Publier — APIs natives » :
- `ok()` refuse un id vide : la ligne passe en `échec`, avec le motif « la plateforme n'a renvoyé aucun id » dans `Erreurs`.
- Instagram (image, reel, carrousel) :
  - on vérifie que le conteneur a bien un id ;
  - **plus aucun repli `pub.id || creationId`** : sans id renvoyé par `media_publish`, la ligne passe en `échec` (« media_publish sans id (conteneur …) ») ;
  - le permalien est ensuite lu par `GET /{id}?fields=permalink`.
- Facebook : on retient `post_id || id` ; si les deux manquent, la ligne passe en `échec`. Le permalien est lu par `GET /{id}?fields=permalink_url`.
- LinkedIn : le faux id `'posted'` disparaît, et l'URL devient `linkedin.com/feed/update/{urn}`. X : `x.com/i/web/status/{id}`. TikTok : un id est exigé.
- Le nœud « Status final » écrit désormais `Blotato_PublicUrl` en plus de l'id (`Blotato_PostSubmissionID`).
- Si la lecture du permalien échoue, on publie quand même : la ligne passe en `publié` avec l'id, et l'URL vide est journalisée dans `native_details`.
- Inchangé : créneaux et fenêtre de 15 min, garde `PUBLISH_ENABLED`, lecture des jetons dans Config.

Vérifications :
- GET après PUT : code présent, aucun repli restant ; contrôle syntaxique du code ; `active=true`.
- Les exécutions suivantes (20677, 20684) sont en succès. La file `validé` est vide, donc ces exécutions ne publient rien.
- **Non testé en réel** : il faudrait publier un vrai post (interdit ici), et le jeton Meta doit de toute façon être ré-autorisé avant.

## 2. Relances Gemini

**Plafond découvert** dans `n8n-core/dist/execution-engine/workflow-execute.js` (n8n 2.28.6) :

`maxTries = Math.min(5, Math.max(2, …))` ; `waitBetweenTries = Math.min(5000, …)`

Les 30 s demandées sont donc ramenées à 5 s par le moteur. Réglage posé : `retryOnFail: true, maxTries: 4, waitBetweenTries: 5000` sur les **17 nœuds** `googleGemini` :

| Workflow | Nœuds |
|---|---|
| WF-07 | 1 |
| WF-09 | 1 |
| WF-THEMES | 1 |
| WF-SOCIAL-03 | 1 |
| TG-ROUTER | 3 |
| WF-10 à WF-13 | 1 chacun |
| WF-14 | 2 |
| WF-08 | 4 |

Chaque PUT a été relu par GET, et le statut actif conservé.

Limite : 4 essais × 5 s ne couvrent qu'une vingtaine de secondes. Contre les 503 « high demand », la vraie correction reste la clé payante (MAX-14). Une attente plus longue demanderait une boucle Wait/IF, non faite.

## 3. WF-HEALTH (nouveau, `6qGXtUTtR7XXAhSW`, actif)

Enchaînement des nœuds : cron `0 9 * * *` (tz du workflow : Africa/Dakar) + « Test manuel » → NocoDB Config (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) → aplatir → NocoDB `Contenus` (`publié`, `validé` et `prêt_à_valider` ; champs dont `UpdatedAt` ; `executeOnce`) → aplatir → Code « Santé — Analyser la file » → HTTP `sendMessage`.

L'envoi suit la même méthode que WF-SOCIAL-07 : jeton lu dans Config, puis POST à l'API Telegram. `errorWorkflow` = WF-ERR.

Règles :
- (a) le dernier `UpdatedAt` d'une ligne `publié` date de plus de 72 h ;
- (b) l'horizon des `validé` à venir couvre moins de 7 jours ;
- (c) au moins un `prêt_à_valider` a une date passée.

S'il n'y a aucune alerte, rien n'est envoyé.

Test de bout en bout par la CLI (`n8n execute`, sur un port de broker alternatif) : succès, message Telegram `message_id` 2227 reçu par Max. Contenu :

> Rien de publié depuis 72 h (dernier : 13/08, il y a 77 j) · 0 post `validé` à venir · 29 `prêt_à_valider` dont la date est passée.

Le premier essai comptait 216 lignes au lieu de 108, d'où le défaut du §16.

## 4-5. Désactivations

- WF-08 (`2JjbvTHuX2JPp7Fh`), WF-THEMES (`KO5mTEtSvhiIMAwq`) et WF-PICKS-RELANCE (`cf8XLce9QG8ZF3CU`) sont passés en `active=false`. Aucun n'a été supprimé.
- Le fuseau de WF-THEMES est passé d'`Africa/Lagos` à `Africa/Dakar` avant la désactivation.

## 6. WF-07 (`3kpXjWE4azageRz1`)

Les **28 branches** qui aboutissaient directement sur le nœud Code « Merge — Compiler les données » passent maintenant par :
- 3 nœuds Merge v3.2 en mode `append` : « Attendre — branches A (10) », « B (10) » et « C (8) » ;
- puis un Merge final, « Attendre — toutes les branches (3) », branché sur le nœud Code (code inchangé).

En mode `append`, Merge v3 a `requiredInputs: 1` : une branche vide ne le bloque pas.

Autres changements :
- les 12 sources RSS v1.1 sans gestion d'erreur reçoivent `onError: continueRegularOutput`, pour qu'un flux mort ne tue plus la veille ;
- ajout d'un déclencheur « Test manuel ».

Le workflow reste une veille : il écrit des idées dans la banque NocoDB et ne rédige rien.

Test : exécution 20680 (CLI), en succès.

| Nœud | Exécutions | Items |
|---|---|---|
| Chaque Merge | 1 | — |
| Code de compilation | 1 | 1 (451 sources) |
| Gemini | **1 seul appel** | — |
| Parse | 1 | 5 |
| Écriture NocoDB | 1 | 5 |
| Log | 1 | — |

Effet de bord accepté : 5 idées ajoutées à `idees-articles` et une ligne dans `logs`.

## 7. WF-09 (`i5EvGUGhVvzKIM2U`)

Changements :
- Lectures des banques d'idées (articles et cours) **supprimées**. Elles faisaient aussi deux appels Gemini par exécution (même pseudo-fusion que WF-07).
- Nouvelle source : nœud RSS sur `https://maxmorrys.me/rss.xml`.
- « Préparer » dédoublonne, trie par date et garde les 5 derniers articles. Le premier devient l'article principal.
- Prompt :
  - mission réécrite, sans « hebdomadaire », « chaque semaine » ni « de la semaine » ;
  - interdiction explicite de toute cadence ;
  - **un seul CTA**, « Lis l'article complet », vers l'URL exacte de l'article ;
  - le bloc cours, le CTA générique de conclusion et la « question de lecteur » inventée sont retirés, et les chiffres inventés interdits.
- **Bug trouvé** : « Parse — Newsletter » lisait `candidates[0]…`, alors que le nœud Gemini v1.1 renvoie `content.parts[0].text`.
  - Conséquence : la lettre retombait toujours sur ses valeurs par défaut (« Newsletter Max-Morrys », corps vide).
  - Correction : la lecture accepte désormais les deux formats et retire les balises de code.
- `maxOutputTokens` passé de 4096 à 8192 : la réponse était coupée (`finishReason: MAX_TOKENS`).
- La chaîne s'arrête toujours à l'aperçu Telegram. Brevo n'est pas branché.

Tests : exécutions 20681 (avant la correction du Parse) et 20682 (après). Résultat de 20682 :
- objet : « Vendre en ligne légalement : protège ton business ! » ;
- un seul `href` (vers `/blog/vendre-en-ligne-afrique-francophone-lois-2026`), aucune mention de cadence, `finishReason: STOP`.

**2 aperçus Telegram** ont été envoyés à Max pendant ces tests.

## 8. Export des workflows actifs

Nouveau script : `scripts/n8n-export-live.mjs`.
- Il vise https://n8n.maxmorrys.me et prend la dernière `N8N_API_KEY` de `.env.local`.
- Il retire les métadonnées serveur, `staticData` et `pinData`.
- Il scanne chaque JSON à la recherche de secrets (EAA, AIza, xkeysib, jeton de bot, sk-, PAT Airtable, Bearer) et refuse d'écrire s'il en trouve.
- Il supprime de `n8n/live/` les fichiers qui ne correspondent plus à un workflow actif.

Résultat : 14 fichiers écrits, `WF-THEMES.json` retiré (workflow désactivé).

| Fichiers | État |
|---|---|
| WF-SOCIAL-03, WF-SOCIAL-04, WF-TG-ROUTER | mis à jour |
| WF-07, WF-09, WF-10 à WF-14, WF-ERR, WF-HEALTH, WF-SOCIAL-05, WF-SOCIAL-07 | nouveaux |

Un scan regex indépendant ne trouve rien dans `n8n/live/*.json` ni dans `backups/n8n-corrections-20261029/`.

L'ancien `scripts/n8n-snapshot-live.py` (4 workflows, lit `N8N_URL`) est conservé, mais rendu obsolète par ce script.

## 9. Archivage

L'API n8n 2.x expose `POST /workflows/{id}/archive`. Les 19 workflows ont été archivés (`isArchived=true`, restaurables), et non supprimés :

| Catégorie | ids |
|---|---|
| DIGEST | lK1klL7mAwEunCf9, Q9KEirYd5dp7kA6M |
| EMAIL-NOTIFY | YndXipDk3gNQKtW6, 0vqFvNvzCy4h2JBh |
| EMAIL-SEND | tANGaf5G2QOeb5X0, 3RuiCLE8imVvpk53 |
| GOV-07 | OgD9jnI0WcYc816e, Z11yy9roXewNe6Tt |
| Anciennes versions de SOCIAL-03/04/05/07 et TG-ROUTER | E4ccWhKLKt4DmUyW, VfzMklc4vrf16UM9, JUveLoLaCRMdnjrM, b5t5nhzOnspbIdii, kx2zNmzpelxHONWU |
| SOCIAL-01, 02, 06 | Y0eoqwZU0h5m9feB, 1X9KnrQSHw8NE1x0, SVlmmALxNwLTh2vo |
| WF-18 | v3isJvdiTZ3yrLi0 |
| WHATSAPP-NOTIFY, version du 28/06 | hTPNvI5h6VZ9N2np |
| WHATSAPP-SEND, version du 28/06 | qgs1PHwTgsRBu1Vh |

Conservés, inactifs : WHATSAPP-NOTIFY `NRZUUYjpvJzOSktj` et WHATSAPP-SEND `6gusFWI5B5bzH6AC` (versions du 04/07).

## 10. gsc-pull

- `scripts/gsc-pull.py` est réécrit pour NocoDB `SEO` (`mysghf7takowmb1`), via l'API v2 par lots de 50.
- Le script est idempotent par date : s'il existe déjà des lignes pour le jour, il ne fait rien ; `--force` les remplace.
- Configuration par `NOCODB_URL` / `NOCODB_TOKEN_FILE` / `NOCODB_TOKEN` / `GSC_SA_FILE`. Plus aucune référence à Airtable.

Installation sur le VPS :
- script : `/opt/maxmorrys-stack/gsc-pull.py` (700) ;
- clé : `/opt/maxmorrys-stack/gsc-sa.json` (600, root), copiée par scp ;
- planification : **timer systemd** `maxmorrys-gsc-pull.timer`, avec `OnCalendar=*-*-* 07:15:00 Africa/Dakar` (prochaine exécution : 30/10 08:15 CET, soit 07:15 à Dakar).
- Le timer remplace le cron demandé : le VPS est en `Europe/Berlin`, donc un cron système dériverait d'une heure au changement d'heure.

Vérifications :
- première exécution : « GSC pull OK : 21 lignes écrites dans NocoDB SEO (date 2026-10-29) » ;
- 21 lignes du 29/10 lues dans NocoDB ;
- seconde exécution : « 21 lignes déjà présentes, rien écrit ».

Côté Mac : `launchctl unload`, puis plist renommé `~/Library/LaunchAgents/com.maxmorrys.gsc-pull.plist.disabled`. Airtable n'est plus écrit.

## 11. Tunnel cloudflared du Mac

Vérification préalable :
- `dig paperclip.maxmorrys.me A` donne `158.220.124.185` (le VPS), sans CNAME vers un tunnel ;
- `curl -I` répond `server: Caddy` (401, authentification basique).

Action : `launchctl unload`, puis plist renommé `com.maxmorrys.cloudflared.plist.disabled`. Plus aucun processus cloudflared ne tourne, et Paperclip répond toujours (401 Caddy).

`~/.cloudflared/config.yml` est laissé en place.

## 12. Renommages

Appliqués sur 14 workflows (11 actifs, plus WF-08 et les deux WHATSAPP conservés). Les références `$('…')` et `$node[…]` des expressions et du code ont été réécrites, et la cohérence des connexions vérifiée.

| Avant | Après |
|---|---|
| « Airtable — X (NocoDB) » | « NocoDB — X » |
| nœud Code d'aplatissement « Airtable — X » | « Aplatir — X » |
| autres « Airtable — … » | « NocoDB — … » |
| « Gemini Pro — … » (tous en `gemini-2.5-flash`) | « Gemini Flash — … » |

Crons renommés :

| Workflow | Avant | Après |
|---|---|---|
| SOCIAL-03 | « Mar/Jeu 7h » | « Toutes 2h 7-19h » |
| WF-08 | « Articles 9h quotidien » | « Lundi 9h » |
| WF-11 à WF-14 | « … quotidien » (alors que le cron tourne le lundi) | « … lundi … » |

Seul reste un commentaire de TG-ROUTER qui cite « Airtable — Lire Config », sans effet.

Preuve : exécutions réelles d'après renommage, 20683 (SOCIAL-07) et 20684 (SOCIAL-05), en succès sur les nouveaux noms de nœuds.

Non fait : renommer le *workflow* WF-SOCIAL-04 (« fond IA Gemini 2.5 Flash Image », alors qu'il rend via render-card).

## 13. Image et rétention

Sauvegardes préalables : `docker-compose.yml.bak-20261029` et `.env.bak-20261029`, dans `/opt/maxmorrys-stack/`.

Changements :
- `docker tag n8nio/n8n:latest n8nio/n8n:2.28.6` (même digest `sha256:f3284c9a…`, aucun téléchargement) ;
- `image: n8nio/n8n:2.28.6` ;
- `EXECUTIONS_DATA_MAX_AGE: "720"` ;
- `docker compose up -d n8n`.

Vérifications après redémarrage :
- conteneur `running` sur l'image 2.28.6, variable à 720 ;
- **14 workflows actifs**, la liste attendue ;
- `getWebhookInfo` : URL `…/webhook/maxmorrys-tg-router/webhook`, 0 en attente, aucune erreur ;
- un POST vide sur le webhook renvoie 403 (secret Telegram manquant : la route existe).

## 14. Sauvegardes (constat, sans restauration)

`maxmorrys-backup.timer` lance `/usr/local/bin/maxmorrys-backup.py` chaque jour à 03:30. Configuration : `/etc/maxmorrys-backup.env`.

Ce qui est sauvegardé :
- `pg_dump` des bases **n8n** et **nocodb** (conteneur `maxmorrys-postgres`), plus le dump Paperclip ;
- copie locale dans `/var/backups/maxmorrys/` (purge à 14 j) ;
- **copie hors site sur R2**, bucket `maxmorrys-lms`, préfixes `backups/n8n/`, `backups/nocodb/`, `backups/paperclip/` (purge à 30 j).

Exécution du 29/10 : n8n 8,7 Mo, nocodb 1,2 Mo, paperclip 39 Mo, tous en HTTP 200.

`/opt/maxmorrys-stack/sauvegardes/` est vide parce qu'il ne sert pas.

⚠️ `N8N_ENCRYPTION_KEY` vit dans `/opt/maxmorrys-stack/.env`, qui **n'est pas sauvegardé hors site**. Sans cette clé, les credentials du dump n8n sont indéchiffrables.

## 15. Purge de la table `Config`

Sauvegarde préalable, sur le VPS uniquement : `/root/nocodb-config-backup-20261029.json` (600), 45 lignes.

Avant suppression, on a vérifié qu'aucun workflow non archivé, ni `worker/`, ni `scripts/growth` ne référence ces clés.

Lignes supprimées par l'API v2 :

| Id | Clé |
|---|---|
| 2 | `AIRTABLE_TABLE_SEO` |
| 3 | `AIRTABLE_TABLE_EMAILS` |
| 9 | `GEMINI_MODEL_TEXT` |
| 17 | `AIRTABLE_TABLE_WHATSAPP` |
| 30 | `BLOTATO_ACCOUNTS` |

Résultat : **40 clés** restantes, plus aucune `AIRTABLE_*`, `BLOTATO_*` ni `GEMINI_MODEL_TEXT`. Les secrets Meta, X et Telegram n'ont pas été touchés (prévu plus tard).

## 16. Défauts trouvés en route

**Lectures NocoDB exécutées N fois.**
- Dans n8n, un nœud de recherche placé après un nœud qui sort N items s'exécute N fois.
- WF-SOCIAL-07 (Config, 2 lignes → « Lire à valider ») envoyait donc **chaque carte Telegram en double**.
- WF-SOCIAL-04 (Config Render, 2 lignes → VALIDATION_MODE → « Lire rédigés ») lisait les `rédigé` en double et les rendait deux fois.
- Correctif : `executeOnce: true` sur ces nœuds. Preuve : à l'exécution 20679, VALIDATION_MODE sort 1 item, contre 2 à l'exécution 20651.
- WF-SOCIAL-05 avait déjà `executeOnce` sur « Lire validés » : pas de double publication par ce chemin.

**WF-SOCIAL-04 : `limit` passé de 2 à 6** (filtre `(Status,eq,rédigé)` inchangé), pour écouler les 28 posts du lot S45-S46 en 5 passages au lieu de 14. Le timeout par carte reste de 100 s.

**Déclencheurs « Test manuel »** ajoutés à WF-HEALTH, WF-07 et WF-09 : la commande `n8n execute` exige un déclencheur manuel. Ils sont sans effet en production.

## Ce qui n'a pas été fait ou reste ouvert

- Pas de test réel de publication (WF-SOCIAL-05). Il faut d'abord ré-autoriser l'appli Meta : c'est à l'humain.
- Relances de 30 s impossibles en natif (plafond de 5 s) ; seule la clé Gemini payante règle le fond.
- Aucun test de restauration des sauvegardes.
- Clé de chiffrement n8n absente de la sauvegarde hors site.
- `backups/` n'est pas ignoré par git. Les exports ne contiennent pas de secret (scan fait), mais il faut décider de les versionner ou de les ignorer.
- `scripts/brevo-templates.mjs` apparaît supprimé dans `git status` : ce n'est pas de mon fait (autre agent).
