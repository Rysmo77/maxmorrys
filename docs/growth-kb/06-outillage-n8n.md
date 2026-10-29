# 06 — Outillage : n8n, NocoDB, Telegram, Paperclip (état au 29/10/2026, après corrections)

> Sources : audit en lecture seule du 29/10/2026 (`docs/growth-kb/audits/2026-10-29-n8n-marketing.md`), puis
> **corrections appliquées le même jour** (`docs/growth-kb/audits/2026-10-29-corrections-n8n.md`).
> Revérifier l'état live avant d'agir : il bouge. Copie versionnée des workflows actifs : `n8n/live/`
> (régénérer avec `node scripts/n8n-export-live.mjs`).

## Répartition des rôles (décision du 29/10/2026)

| Couche | Outil | Rôle |
|---|---|---|
| **Stratégie et production** | Agents BMad `mm-agent-*` (Claude Code, à la demande) | stratégie, calendrier, rédaction, briefs visuels, articles, SEO, e-mails : **brouillons** |
| **Validation** | Humain (Max) | en session Claude Code (lot relu puis « je valide »), ou par ✅ sur Telegram |
| **Exécution** | n8n auto-hébergé (https://n8n.maxmorrys.me, VPS) | rendu visuel, notification Telegram, publication native FB/IG des lignes `validé`, alertes |
| **Données** | NocoDB (https://noco.maxmorrys.me, base « Max-Morrys ») | file `Contenus`, banque d'idées d'articles, SEO, logs |
| ~~Agents autonomes~~ | Paperclip « Maxmorrys Growth » | **à mettre en veille pour le marketing** (≈ 5 700 réveils sur le quota Claude Max pour un rendement nul depuis août) |

Pourquoi n8n reste : crons fiables (aucun raté en 14 jours), appels Meta et X déjà codés, boucle Telegram saine, rendu des visuels local. Ce qui casse, c'est la **création** confiée à une clé Gemini gratuite (erreurs 503) et un seul appel hebdomadaire : c'est ce maillon que les agents BMad remplacent.

## Circuit d'un post (social)

1. Un agent BMad écrit la ligne dans NocoDB `Contenus`, au statut **`rédigé`**, avec `Pilier`, `Serie`, `Offre`, `Cible`, `Reseau`, `Format_Post`, `Date_Publication_Prevue`, `Texte`, `Hashtags`, `Visual_Strategy`, **`Gabarit`** (famille de visuel, depuis le 29/10) et `Slides_JSON` (texte et données du visuel — une entrée par slide).
2. `WF-SOCIAL-04` lit `(Status,eq,rédigé)` (**6 lignes par passage** depuis le 29/10, 2 avant), rend le visuel (render-card, toutes les 2 h de 8 h à 20 h UTC ou par webhook `mm-run-visuel`), remplit `Visuels_URLs` et pose **`prêt_à_valider`** (`image_needed` si une carte manque).
   - **Circuit visuel (29/10)** : `Gabarit` rempli → charge `kit: 'ds'` (design system produit : Fraunces / Schibsted Grotesk / JetBrains Mono, maillage du territoire, familles affiche · etapes · question · chiffre · avant_apres · citation · coulisses · offre) construite par `construireCharges` (`scripts/growth/nayo.mjs`) ; `Gabarit` vide → ancien rendu, inchangé. `studio` = post phare fait dans le studio NAYO, carte DS provisoire en attendant. Détail : `11-visuels-nayo.md`.
   - ✅ **Constat du 29/10 au soir : le dépôt R2 fonctionne de nouveau** (14 stories rendues par WF-04, PNG en ligne, 200). Historique : ⛔ **Dépôt R2 en panne au 29/10** : `media-api.maxmorrys.me/internal/upload` → 404 (route absente du Worker déployé, présente seulement sur la branche `feat/cloudflare-exit-blaze`). Toute carte échoue → `image_needed`. Dernier rendu réussi : 22/08.
3. Validation humaine, au choix :
   - **en session** : l'agent présente le lot, Max dit explicitement qu'il valide, l'agent passe les lignes en `validé` avec `--human-approved "<qui, quand>"` ;
   - **par Telegram** : `WF-SOCIAL-07` envoie la carte, ✅ → `WF-TG-ROUTER` passe en `validé`.
     - **Carrousel (depuis le 29/10 soir)** : si `Visuels_URLs` contient plusieurs images, l'**album complet** part d'abord (`sendMediaGroup` par 10, légende « Carrousel — Id N · 1/7 »), puis la carte habituelle (texte + ✅/❌) **en réponse à l'album** (`reply_parameters`). Le `message_id` stocké dans `Blotato_PostSubmissionID` est celui de la **carte**. Album en échec → la carte part quand même, avec l'aperçu du 1er visuel. Un post à une image : carte strictement inchangée (vérifié à l'octet). Nœud : « Envoi — Telegram (album + carte) » (code, remplace l'ancien nœud HTTP ; une sortie par item, dans l'ordre, pour « Pair notif »).
     - Renvoyer une carte : vider `Blotato_PostSubmissionID` d'une ligne `prêt_à_valider` ; WF-07 la renotifie au passage suivant (10 min).
4. `WF-SOCIAL-05` (cron toutes les 15 min, 7 h-22 h) publie en API native les lignes `validé` dont la date est échue. Depuis le 29/10 : **`publié` seulement si la plateforme renvoie un `id` réel** (sinon `échec` + motif dans `Erreurs`) ; l'id va dans `Blotato_PostSubmissionID`, le permalien (IG `permalink`, FB `permalink_url`, X, LinkedIn) dans `Blotato_PublicUrl`.
   - **Stories (depuis le 29/10 soir)** : `Format_Post = story` a sa propre branche (avant, une story `validé` serait partie en post de **fil**). Instagram : conteneur `media_type=STORIES` + `image_url` (ou `video_url`) → attente de `status_code = FINISHED` (10 × 3 s pour une image) → `media_publish`. Facebook Page : `/photos` avec `published=false` → `photo_id` → `/photo_stories` (renvoie `post_id`) ; story vidéo FB non gérée (→ `échec` avec motif). Pas de légende ni de hashtag, aucun lien cliquable : le CTA est écrit sur le visuel (« réponds en message », « lien en bio »), et les sondages ne sont qu'**affichés** (l'API ne pose aucun autocollant interactif). Autres réseaux en story → `échec` avec motif. Testé sans publier le 29/10 : conteneur IG STORIES accepté (PNG) et passé `FINISHED` ; photo FB non publiée créée puis supprimée ; jeton porteur de `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, `business_management`, `instagram_content_publish`. **Jamais testés** (impossible sans publier) : `media_publish` d'une story, `/photo_stories`, et le permalien d'une story (peut revenir vide : le post reste `publié` si l'id est réel).
5. `WF-HEALTH` (9 h, Dakar) alerte sur Telegram si rien n'est publié depuis 72 h, si la file `validé` couvre moins de 7 jours, ou si des `prêt_à_valider` ont une date dépassée.

⛔ L'agent ne pose jamais `validé`, `en_publication` ni `publié` de lui-même ; il n'appelle jamais une API de plateforme ; il ne déclenche jamais `WF-SOCIAL-05` (qui n'a pas de webhook : c'est voulu).

## Outil local des agents : `scripts/growth/nocodb.mjs`

```
node scripts/growth/nocodb.mjs tables
node scripts/growth/nocodb.mjs schema contenus
node scripts/growth/nocodb.mjs stats contenus Status
node scripts/growth/nocodb.mjs list contenus --where "(Status,eq,prêt_à_valider)" --fields Id,Titre,Reseau,Date_Publication_Prevue
node scripts/growth/nocodb.mjs create contenus --file lot.json            # simulation
node scripts/growth/nocodb.mjs create contenus --file lot.json --apply    # écriture
node scripts/growth/nocodb.mjs update contenus --file maj.json --apply --human-approved "Max, 29/10, en session"
```
- Jeton : `NOCODB_TOKEN` dans `.env.local` (déjà présent). La table `Config` (secrets en clair) est refusée par l'outil.
- Les lots de travail des agents se rangent dans `_bmad-output/growth/` (un fichier JSON par lot, nommé `AAAA-MM-JJ-<objet>.json`) : la trace reste versionnable.

Tables utiles : `contenus` (file sociale), `idees-articles` (banque d'idées éditoriales, ~1 200 lignes, alimentée le lundi par WF-07), `seo` (**ré-alimentée chaque jour depuis le 29/10** par `gsc-pull` sur le VPS), `emails` et `whatsapp` (vides : canaux jamais branchés), `logs`.

## État des canaux (29/10/2026)

| Canal | État | À savoir |
|---|---|---|
| Instagram | ✅ prêt (dernier post le 10/08) | jeton de page dérivé de l'utilisateur système « MaxMorrys_SU », **sans expiration** (posé le 29/10 dans `Config.META_TOKEN`) ; conteneur de test accepté ; quota 100 publications / 24 h |
| Facebook | ✅ prêt (dernier post le 20/07) | même jeton ; brouillon non publié créé puis supprimé le 29/10 (droit de publication prouvé) |
| LinkedIn | ❌ pas de jeton | page entreprise : accès Community Management API à demander |
| X | ⚠️ clés présentes, inutilisées depuis le 09/07 | validité non vérifiée |
| TikTok | ❌ retiré de la grille le 06/08 | pas de jeton |
| YouTube | ❌ non implémenté dans `WF-SOCIAL-05` | — |
| WhatsApp Business | ❌ jamais en service | numéro +221 76 903 07 85 `CONNECTED`, qualité GREEN, palier 250, mais **vérification de code EXPIRED** et nom d'affichage non approuvé ; le compte WABA `555647320972170` n'est pas visible par l'utilisateur système (à lui attribuer dans le Business Manager) ; ⚠️ le numéro public du site est +221 77 604 19 85 |
| E-mail : transactionnel (Cloudflare) / marketing (Brevo) | ✅ transactionnel / ❌ marketing (fermé) | **Décision du 29/10/2026** : transactionnel → binding Cloudflare `EMAIL` ; lettre et séquences → **Brevo** (campagnes par lot + envoi unitaire), derrière `POST /marketing/campagne`. **Code prêt, non commité, non déployé** : le Worker en service (`4094a6eb`) envoie encore le certificat, les accusés de demande, la bienvenue n°1 et le panier par des modèles Brevo ; au déploiement ils passent sur Cloudflare. `BREVO_API_KEY` est posé ; `MARKETING_API_KEY` / `MARKETING_TEST_TO` absents ; envoi réel fermé par `MARKETING_ENVOI_REEL`. Workflows `WF-EMAIL-*` (Brevo appelé depuis n8n) restent archivés : WF-09 passe par la route — voir `08-emailing.md` |
| Telegram (validation) | ✅ technique / ❌ humain | 0 clic en 14 jours |

⚠️ **Le statut `publié` de NocoDB ne prouve pas la mise en ligne** : des identifiants de posts « publiés » sont introuvables chez Meta. Pour un bilan, vérifier sur la plateforme.

## Inventaire n8n (29/10/2026, après corrections)

**14 actifs** (n8n `2.28.6` épinglé, rétention des exécutions 30 jours) :

| Workflow | id | Déclencheur | Rôle |
|---|---|---|---|
| WF-SOCIAL-03 Rédaction | k9vnobzVadNeU3tk | toutes les 2 h 7-19 h + webhook | lit `planifié` (file vide : la rédaction passe aux agents) |
| WF-SOCIAL-04 Visuels | 774G38cqIvZsJUHm | toutes les 2 h 8-20 h + webhook `mm-run-visuel` | `rédigé` → rendu render-card → `prêt_à_valider` |
| WF-SOCIAL-05 Publication | wrRa0I7tYAsPJSOA | */15 min 7-22 h | `validé` échu → API natives (posts, carrousels, **stories IG/FB**) → `publié` (id réel) / `échec` |
| WF-SOCIAL-07 Notif validation | rKNtJULQL40QpgTn | */10 min 7-22 h + webhook | carte Telegram ✅/❌ pour `prêt_à_valider` ; carrousel = album complet puis carte en réponse |
| WF-TG-ROUTER | n0hquvVeQ7my7orT | webhook Telegram | ✅ → `validé`, ❌ → `rejeté`, commandes |
| **WF-HEALTH** (nouveau) | 6qGXtUTtR7XXAhSW | 9 h Dakar | alerte « file affamée » (voir circuit, étape 5) |
| WF-ERR | MMERRALERT0001 | errorTrigger | toute exception → Telegram |
| WF-07 Veille idées articles | 3kpXjWE4azageRz1 | lundi 5 h | RSS + messages/FAQ → **un** appel Gemini → banque d'idées (pas de rédaction) |
| WF-09 Lettre | i5EvGUGhVvzKIM2U | jeudi 8 h | `rss.xml` (articles publiés) → brouillon Gemini → **aperçu Telegram uniquement** (pas d'envoi) |
| WF-10 à WF-14 (LMS) | sqQM…, 2wR0…, 3pJ2…, HJIp…, OJMy… | lundi/dimanche | production de cours (hors marketing) |

**Désactivés, conservés** : WF-08 Rédaction d'articles (la rédaction passe aux agents BMad), WF-THEMES et WF-PICKS-RELANCE (la production sociale passe aux agents BMad), WF-WHATSAPP-NOTIFY (`NRZUUYjpvJzOSktj`) et WF-WHATSAPP-SEND (`6gusFWI5B5bzH6AC`) gardés pour le futur jeton Meta système.

**Archivés le 29/10** (19, export JSON dans `backups/n8n-corrections-20261029/archives/`, restaurables depuis l'interface n8n) : DIGEST ×2, EMAIL-NOTIFY ×2, EMAIL-SEND ×2 (Brevo abandonné au profit de Cloudflare Email), GOV-07 ×2, anciennes versions de SOCIAL-03/04/05/07 et TG-ROUTER, SOCIAL-01/02/06, WF-18, et le doublon le plus ancien de chaque WHATSAPP-*.

Réglages communs : tous les nœuds Gemini ont `retryOnFail` (4 essais, 5 s d'écart : **n8n plafonne l'attente à 5 000 ms**, les 30 s demandées sont impossibles en natif). Les nœuds « Airtable — … » s'appellent désormais « NocoDB — … » (lecture) ou « Aplatir — … » (code d'aplatissement), « Gemini Pro » est devenu « Gemini Flash », et les crons « quotidien » qui tournaient le lundi portent leur vrai libellé.

## Hors n8n (VPS / Mac)

- `gsc-pull` : tourne sur le VPS (`maxmorrys-gsc-pull.timer`, 07:15 Africa/Dakar ; script `/opt/maxmorrys-stack/gsc-pull.py`, clé `/opt/maxmorrys-stack/gsc-sa.json` en 600) et écrit dans NocoDB `SEO`. Idempotent par date. Le LaunchAgent Mac est renommé `.disabled`.
- Tunnel cloudflared `paperclip` du Mac : coupé (`com.maxmorrys.cloudflared.plist.disabled`) ; `paperclip.maxmorrys.me` est servi par Caddy sur le VPS (enregistrement A).
- Sauvegardes : `maxmorrys-backup.timer` (03:30) dump Postgres **n8n + NocoDB + Paperclip** → `/var/backups/maxmorrys/` (14 j) **et** R2 `maxmorrys-lms/backups/{n8n,nocodb,paperclip}/` (30 j). Aucun test de restauration fait.
- NocoDB `Config` : clés mortes purgées (`AIRTABLE_TABLE_*`, `BLOTATO_ACCOUNTS`, `GEMINI_MODEL_TEXT`), 40 clés restantes ; sauvegarde avant purge : `/root/nocodb-config-backup-20261029.json` (600, VPS).

## Ce qui reste à faire

**Humain**
1. ✅ Jeton d'utilisateur système posé le 29/10 (FB/IG prouvés sans publication). Reste à observer le premier vrai post FB et IG : c'est le seul moyen de voir si le nouveau contrôle `id`/permalien de WF-SOCIAL-05 fonctionne en conditions réelles.
2. Clé Gemini payante (ticket MAX-14) : les relances natives (4 × 5 s) ne suffiront pas contre un 503 prolongé.
3. Conserver `N8N_ENCRYPTION_KEY` hors du VPS (gestionnaire de mots de passe) : les dumps R2 sont inutilisables pour les credentials sans elle, et `/opt/maxmorrys-stack/.env` n'est pas sauvegardé hors site.
4. Faire un test de restauration d'un dump R2 (n8n et NocoDB) sur une base jetable.

**Technique (plus tard)**
5. Sortir les secrets de `Config` vers les credentials n8n, avec le futur jeton d'utilisateur système Meta, puis faire tourner les jetons.
6. Branchement de l'envoi de la lettre (WF-09) sur `POST /marketing/campagne` (transport Brevo, en préparation : route non déployée).
7. Paperclip : mettre en pause Community, Designer et Email ; trier les tickets `in_review`/`blocked`.
8. LinkedIn (jeton Community Management API) et YouTube (nœud natif) si la stratégie les garde.
9. Renommer le workflow WF-SOCIAL-04 (son nom parle encore de « Gemini 2.5 Flash Image » alors qu'il rend via render-card).
10. ⛔ Réparer le dépôt des visuels : redéployer `worker/apps/media` avec la route `/internal/upload` (commit `e3a1d7e`) et le secret `INTERNAL_UPLOAD_KEY` = `MEDIA_INTERNAL_KEY` de `/etc/render-card/env`. Sans ça, aucun visuel ne sort (`11-visuels-nayo.md` § 1).
