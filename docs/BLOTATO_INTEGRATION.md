# Guide d'intégration Blotato — Max-Morrys Social

**Dernière mise à jour** : 2026-04-23 (refactor granularité 1 row = 1 Reseau × 1 Format)
**Scope** : WF-SOCIAL-01 à WF-SOCIAL-06 (pipeline social n8n)
**Plateformes** : Facebook (`fb`), Instagram (`ig`), TikTok (`tiktok`), YouTube (`youtube`), LinkedIn (`linkedin`), X/Twitter (`x`)

## 0. Modèle Airtable — 1 ligne = 1 Reseau × 1 Format

Chaque row de `Contenus` représente **une publication unique** (pas une idée qui se décline). WF-SOCIAL-01 Idéation explose chaque idée en 1 à 3 rows selon les déclinaisons choisies par Gemini.

**Champs actifs** :
- `Titre` — partagé entre les déclinaisons d'une même idée
- `Reseau` — singleSelect : `fb` / `ig` / `tiktok` / `youtube` / `linkedin` / `x`
- `Format_Post` — singleSelect : `post` / `story` / `thread` / `reel` / `carrousel` / `short` / `community_post` / `live`
- `Pilier`, `Thematique`, `Brief`, `Mots_Cles` — communs
- `Texte` — unique par row (rempli par WF-SOCIAL-03)
- `Hashtags` — adapté au réseau de la row
- `Visuels_URLs` — JSON array
- `Blotato_PostSubmissionID` — singleLineText (1 submission par row)
- `Blotato_PublicUrl` — url

**Champs dépréciés** (présents mais plus utilisés) : `Reseaux_Cibles`, `Plateforme_Principale`, `Texte_Facebook/Instagram/LinkedIn/X/TikTok/YouTube`, `Blotato_PostSubmissionIDs`, `Blotato_PublicUrls`. Les laisser ou les supprimer manuellement dans Airtable UI.

---

## 1. Architecture

```
 Contenus (Airtable)              n8n Workflows
 ┌──────────────┐              ┌──────────────────┐
 │ Status flow  │              │                  │
 │              │              │  Lun 6h          │
 │  idée        │◀─── crée ────│  WF-SOCIAL-01    │ Idéation (Gemini 2.5 Pro)
 │     │        │              │                  │
 │     ▼        │              │  Dim 20h         │
 │  planifié    │◀── update ───│  WF-SOCIAL-02    │ Planification
 │     │        │              │                  │
 │     ▼        │              │  Mar/Jeu 7h      │
 │  rédigé      │◀── update ───│  WF-SOCIAL-03    │ Rédaction Texte unique (selon Reseau de la row)
 │     │        │              │                  │
 │     ▼        │              │  /2h 8-20h       │
 │ image_needed │              │  WF-SOCIAL-04    │ Visuels Gemini 3 Pro Image
 │     │        │              │                  │
 │     ▼        │              │                  │
 │prêt_à_valider│◀── update ───│                  │
 │     │        │              │                  │
 │     ▼        │              │  (humain)        │
 │  validé      │◀─── humain ─ │  Airtable UI     │
 │     │        │              │                  │
 │     ▼        │              │  /15min 7-22h    │
 │en_publication│◀── update ───│  WF-SOCIAL-05    │ Publication via Blotato
 │     │        │              │                  │
 │     ▼        │              │  /30min 8-22h    │
 │   publié     │◀── update ───│  WF-SOCIAL-06    │ Tracking Blotato
 │     │        │              │                  │
 │     ▼        │              └──────────────────┘
 │   échec      │
 └──────────────┘
```

**Principe** : Blotato est l'UNIQUE canal de publication. Plus d'appels directs à Facebook Graph / Instagram Graph / LinkedIn / X API.

## 2. Credentials

### n8n
| Credential | Type | ID n8n |
|---|---|---|
| `Blotato API` | HTTP Header Auth (`blotato-api-key`) | `LUdzToALNXHeRdgj` |
| `Airtable Max-Morrys` | Airtable Personal Access Token | `ik5KqgcooeDvHpFb` |
| `Google AI Max-Morrys LMS` | Google Palm API (pour Gemini) | `wQPLkug1dt6DGOt4` |
| `Cloudflare R2 Max-Morrys` | S3 | `1jkvWRlxegNgpKto` |
| `Max-Morrys LMS Notifications Telegram` | Telegram | `k1sYsv0qUTCbCfRN` |

### Airtable Config table
Table `Config` dans base `Max-Morrys PB` (`apppkEbepilHCYiso`). Rangées clés :
- `BLOTATO_ACCOUNTS` — JSON des `accountId` + `pageId` par plateforme (**à remplir**)
- `GEMINI_MODEL_TEXT = gemini-2.5-pro`
- `GEMINI_MODEL_IMAGE = gemini-3-pro-image-preview`
- `R2_PUBLIC_BASE = https://pub-98fc057dc71948c7bd129a674b4bcec8.r2.dev`
- `BRAND_NAME = Max-Morrys`

## 3. Setup Blotato (à faire côté my.blotato.com)

### Étape 1 — Créer le compte
1. S'inscrire sur https://blotato.com avec l'email pro
2. Souscrire au plan payant (requis pour l'API)

### Étape 2 — Connecter les 6 comptes
Dans **Settings > Social Accounts**, connecter :
- Facebook (Page business Max-Morrys)
- Instagram (Business account lié à la Page FB)
- TikTok
- YouTube
- LinkedIn (Page entreprise)
- X (Twitter)

### Étape 3 — Générer l'API Key
`Settings > API > Generate API Key` → **déjà fait** : `blt_H55utNrNKqlXMC+eemc1xLRk7wKkQO3GV4XNT/50nrQ=` (stockée dans le credential n8n `Blotato API`).

### Étape 4 — Récupérer les Account IDs
```bash
curl -X GET https://backend.blotato.com/v2/users/me/accounts \
  -H "blotato-api-key: blt_H55utNrNKqlXMC+eemc1xLRk7wKkQO3GV4XNT/50nrQ="
```
Noter l'`accountId` pour chaque plateforme.

### Étape 5 — Récupérer les Sub-Account IDs (Facebook Page, LinkedIn Page)
Pour chaque `accountId` :
```bash
curl -X GET "https://backend.blotato.com/v2/users/me/accounts/ACCOUNT_ID/subaccounts" \
  -H "blotato-api-key: blt_H55utNrNKqlXMC+eemc1xLRk7wKkQO3GV4XNT/50nrQ="
```

### Étape 6 — Mettre à jour Airtable Config
Dans `Config` table, ligne `BLOTATO_ACCOUNTS`, remplacer le JSON par :
```json
{
  "facebook":  { "accountId": "<REAL>", "pageId": "<REAL>" },
  "instagram": { "accountId": "<REAL>" },
  "tiktok":    { "accountId": "<REAL>" },
  "youtube":   { "accountId": "<REAL>" },
  "linkedin":  { "accountId": "<REAL>", "pageId": "<REAL>" },
  "twitter":   { "accountId": "<REAL>" }
}
```
Tant que les accountId contiennent `__FILL_ME__`, le WF-SOCIAL-05 skipera silencieusement ces plateformes (pas de crash).

## 4. Structure des payloads par plateforme

WF-SOCIAL-05 construit automatiquement le payload via le Code node `Build — Payloads Blotato`. Détail des `target` envoyés :

**Facebook** : `{ "targetType": "facebook", "pageId": "..." }`
**Instagram** : `{ "targetType": "instagram" }` (plusieurs `mediaUrls` → carrousel auto)
**LinkedIn** : `{ "targetType": "linkedin", "pageId": "..." }`
**X/Twitter** : `{ "targetType": "twitter" }`
**TikTok** : `{ "targetType": "tiktok", "isYourBrand":false, "autoAddMusic":true, "privacyLevel":"PUBLIC_TO_EVERYONE", "isAiGenerated":true, ... }`
**YouTube** : `{ "targetType": "youtube", "title":"...", "privacyStatus":"public", "isAiGenerated":true }`

## 5. Mode d'emploi opérateur

### Créer un post manuellement (hors pipeline auto)
1. Ouvrir Airtable base `Max-Morrys PB` > table `Contenus`
2. Nouvelle ligne par réseau :
   - `Titre` : interne (peut être partagé entre plusieurs rows si la même idée est déclinée sur plusieurs réseaux)
   - `Reseau` : un seul (`fb`, `ig`, `tiktok`, `youtube`, `linkedin`, `x`)
   - `Format_Post` : `story` / `post` / `carrousel` / `reel` / `short` / `thread` / …
   - `Date_Publication_Prevue` : ISO avec TZ +01:00
   - `Texte` : texte final du post pour ce réseau (rédigé auto par WF-SOCIAL-03 si vide)
   - `Hashtags` : adapté au réseau
   - `Visuels_URLs` : JSON array d'URLs publiques
   - `Status` : `validé` (pour publier directement) ou `planifié` (pour passer par rédaction/visuels)

Si tu veux décliner une même idée sur LinkedIn + Instagram : **crée 2 rows distinctes** avec le même `Titre` mais des `Reseau` / `Format_Post` / `Texte` différents.

### Valider un post avant publication
Une fois `Status = prêt_à_valider`, vérifier `Visuels_URLs` et les `Texte_X`. Si OK → passer `Status = validé`.

WF-SOCIAL-05 tournant toutes les 15min détectera les posts `validé` dont `Date_Publication_Prevue ≤ NOW() + 15min` et les postera via Blotato.

### Suivre les publications
- `Blotato_PostSubmissionID` : id unique rempli par WF-SOCIAL-05 (1 submission par row)
- `Blotato_PublicUrl` : URL publique remplie par WF-SOCIAL-06 quand le post passe `published`
- `Status = publié` : publication OK
- `Status = échec` : Blotato a renvoyé `failed` (voir `Erreurs`)

Dashboard visuel Blotato : https://my.blotato.com (Calendar + Failed)

## 6. Dimensions des visuels (WF-SOCIAL-04)

Le node Gemini V3 applique ce tableau automatiquement selon `Format_Post` × `Plateforme_Principale` :

| Format | FB | IG | TikTok | YouTube | LinkedIn | X |
|---|---|---|---|---|---|---|
| story | 1080×1920 | 1080×1920 | — | — | — | — |
| post | 1080×1350 | 1080×1350 | — | — | 1200×1500 | 1600×900 |
| post carré | 1080×1080 | 1080×1080 | — | — | 1080×1080 | 1080×1080 |
| reel cover | 1080×1920 | 1080×1920 | — | — | — | — |
| short cover | — | — | — | 1080×1920 | — | — |
| carrousel | 1080×1350 | 1080×1350 | — | — | 1080×1080 | — |
| community_post | — | 1080×1080 | — | 1080×1080 | — | — |
| live cover | 1920×1080 | 1080×1350 | — | 1920×1080 | 1920×1080 | — |

Résolution : 2K par défaut.
Anti-dérive ajouté à chaque prompt : `AVOID: tribal patterns, generic corporate, distorted text, stock photo style, saturated neon gradients.`

## 7. Troubleshooting

| Symptôme | Cause probable | Fix |
|---|---|---|
| WF-SOCIAL-05 ne poste rien | Aucun `Status = validé` dans la fenêtre horaire | Vérifier `Date_Publication_Prevue` et `Status` |
| Blotato HTTP 401 | API key invalide | Regénérer dans my.blotato.com > Settings > API, mettre à jour le credential n8n |
| `accountId __FILL_ME__` | Config pas encore remplie | Exécuter les curl de l'Étape 4, mettre à jour `Config.BLOTATO_ACCOUNTS` |
| Instagram refuse le post | Compte pas Business, ou ratio image invalide | Vérifier config IG Business + dimensions (320×320 min) |
| TikTok refuse | TikTok n'accepte que les vidéos | Ne cibler TikTok que pour `Format_Post = reel/short` |
| YouTube refuse | Idem TikTok, vidéos only | idem |
| Rate limit Blotato | > 30 posts/min | Baisser la fréquence du cron WF-SOCIAL-05 ou réduire la fenêtre de validés |
| Post en `failed` | JSON malformé / URL inaccessible | Consulter https://my.blotato.com/failed + `Contenus.Erreurs` |

## 8. Monitoring

- **Blotato Calendar** : https://my.blotato.com/queue/calendar
- **Blotato Failed** : https://my.blotato.com/failed
- **n8n executions** : dashboard n8n, filtrer par workflow WF-SOCIAL-*
- **Airtable Logs** : table `Logs`, filtrer `Status = error`
- **Telegram** : canal `934156307` reçoit les notifications clés (idées générées, planning fait)

## 9. Rollback

Les 9 anciens workflows sociaux sont **archivés** (désactivés + renommés `[ARCHIVED] WF-XX`). Pour réactiver un ancien :
1. Dans n8n UI, retirer `[ARCHIVED]` du nom
2. `PATCH /workflows/{id}/activate`

Backups JSON locaux : `/Users/macbookair/maxmorrys.me-main/backups/n8n-social-20260423/`

## 10. Références n8n workflows

| Code | n8n ID | Trigger |
|---|---|---|
| WF-SOCIAL-01 Idéation | `wJDQo9PjaT7RSJkw` | `0 6 * * 1` |
| WF-SOCIAL-02 Planification | `5ynAS12PX2x4o2BV` | `0 20 * * 0` |
| WF-SOCIAL-03 Rédaction | `k9vnobzVadNeU3tk` | `0 7 * * 2,4` |
| WF-SOCIAL-04 Visuels | `774G38cqIvZsJUHm` | `0 8-20/2 * * *` |
| WF-SOCIAL-05 Publication | `wrRa0I7tYAsPJSOA` | `*/15 7-22 * * *` |
| WF-SOCIAL-06 Tracking | `TLnJDukLRM3zyL65` | `*/30 8-22 * * *` |
