# Guide de configuration des tokens réseaux sociaux — Maxmorrys Growth

> **But** : récupérer, pour chaque plateforme, le **token + les IDs avec les bons scopes**, et me les
> donner. Toi = clics dans le dashboard (5 min/plateforme). Moi = je range chaque valeur dans un
> **credential n8n chiffré** ou la table **Config** Airtable, je câble le workflow et je **teste**.
>
> **Règle d'or** : le problème n'est jamais « l'app », c'est **les scopes du token**. Un token sans le bon
> scope ne pourra rien faire (c'est ce qui bloquait jusqu'ici).
>
> Convention : `CLE = valeur` → ce sont les clés que tu me donnes (je gère le stockage).

---

## ✅ Déjà configuré (rien à faire)
Telegram (bot + approbations), Google Search Console (SEO), Brevo (email), Cloudflare (tunnel),
n8n, Airtable. → on se concentre ci-dessous sur **la publication réseaux sociaux + WhatsApp**.

---

## 1) Meta — Instagram + Facebook (publication organique)
**Le plus important. Un seul token Meta couvre IG + FB.**

### Prérequis (à vérifier une fois)
- Ton compte **Instagram** doit être **Business** ou **Creator** (Réglages Instagram → Compte → passer en pro).
- Il doit être **lié à une Page Facebook** (Réglages Instagram → Page → lier ta Page Max-Morrys).
- Avoir une **app Meta** (developers.facebook.com → tu en as déjà : app id `2773198259741067`).

### Étapes (Graph API Explorer — la voie rapide)
1. Va sur **https://developers.facebook.com/tools/explorer**
2. En haut à droite : sélectionne ton **app** (Meta App).
3. Menu **« User or Page »** → laisse **User Token**.
4. Clique **« Add permissions »** (Permissions) et coche **exactement** :
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
5. Clique **« Generate Access Token »** → accepte le consentement (choisis ta Page + ton compte IG).
6. Copie le **token** affiché.

### Ce que tu me donnes
- `META_USER_TOKEN = EAAxxxxx...` (le token généré ci-dessus)

> **Ce que je fais ensuite (automatique)** : j'échange ton token contre un **token de Page longue durée**
> (60 j, renouvelable) et je récupère seul `FB_PAGE_ID` + `IG_USER_ID`. Donc **tu ne donnes que le token**.
> Je remplis : `META_TOKEN`, `FB_PAGE_ID`, `IG_USER_ID` dans Config.

---

## 2) WhatsApp Business (broadcasts + 1:1)
⚠️ **Différent des tokens Ads/CAPI** (ceux-là ne marchent pas pour WhatsApp). Il faut le token de la
**page WhatsApp**.

### Prérequis
- Dans ton app Meta → **Ajouter le produit « WhatsApp »** (s'il n'y est pas).
- Numéro `+221 77 604 19 85` ajouté et **vérifié** dans WhatsApp.

### Étapes
1. Meta → ton app → **WhatsApp → Configuration de l'API (API Setup)**.
2. Cette page affiche **ensemble** 3 choses :
   - le **token** (temporaire 24 h — OK pour tester ; voir note permanent),
   - **Identifiant du numéro de téléphone** = `PHONE_NUMBER_ID`,
   - **Identifiant du compte WhatsApp Business** = `WABA_ID`.
3. Crée/valide **1 template** (ex. message de bienvenue) → onglet **Message Templates** → attends « Approuvé ».

### Ce que tu me donnes
- `WHATSAPP_TOKEN = EAAxxxxx...` (celui de la page API Setup)
- `PHONE_NUMBER_ID = 123456...`
- `WABA_ID = 123456...`
- + le **nom + langue** d'un template approuvé (sinon je teste avec `hello_world`)

> **Token permanent** (recommandé pour la prod) : Business Settings → **Système → Utilisateurs système** →
> crée un System User → **assigne-lui le WhatsApp Business Account** → génère un token avec
> `whatsapp_business_messaging` + `whatsapp_business_management`. Ce token **n'expire pas**.
> (Le token CAPI « Conversions API System User » que tu m'as donné n'a PAS de WABA assigné → inutilisable ici.)

---

## 3) TikTok (Content Posting)
### Prérequis
- App sur **developers.tiktok.com** + produit **Content Posting API** activé.
- ⚠️ **App review obligatoire** pour publier (Direct Post) — délai côté TikTok.

### Étapes
1. developers.tiktok.com → ton app → **Content Posting API** → demande l'accès (audit).
2. Configure le **Login Kit** (OAuth) avec scope `video.publish`.
3. Génère un **access token** utilisateur (OAuth) avec `video.publish`.

### Ce que tu me donnes
- `TIKTOK_TOKEN = act.xxxxx...`

---

## 4) YouTube (Data API v3)
### Prérequis
- Projet Google Cloud (tu as `max-morrys`) → **API YouTube Data v3** activée.
- Écran de consentement OAuth + **OAuth Client ID** (type « Desktop » ou « Web »).

### Étapes
1. Google Cloud Console → APIs → active **YouTube Data API v3**.
2. **Identifiants** → crée un **OAuth Client ID**.
3. Fais le flux OAuth une fois (scope `https://www.googleapis.com/auth/youtube.upload`) → récupère un
   **refresh token** (via OAuth Playground : developers.google.com/oauthplayground, coche le scope youtube.upload, échange).

### Ce que tu me donnes
- `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`

> Note : `videos.insert` coûte ~1600 unités de quota/vidéo (quota par défaut OK pour quelques vidéos/jour).

---

## 5) LinkedIn (Posts API)
### Prérequis
- App sur **linkedin.com/developers** + produit **« Share on LinkedIn »** / **« Community Management »**.
- Scope `w_member_social` (post au nom du membre) — ou page entreprise (scopes org).

### Étapes
1. linkedin.com/developers → ton app → **Products** → demande « Share on LinkedIn ».
2. **Auth** → génère un access token avec scope `w_member_social`.
3. Récupère ton **URN** : `GET https://api.linkedin.com/v2/userinfo` → champ `sub` → `urn:li:person:{sub}`.

### Ce que tu me donnes
- `LINKEDIN_TOKEN = AQXxxxxx...`
- `LINKEDIN_AUTHOR_URN = urn:li:person:xxxx` (ou `urn:li:organization:xxxx` pour la page)

---

## 6) X / Twitter (API v2)
### Prérequis
- ⚠️ **Tier payant** (Basic ~100 $/mo) pour pouvoir **écrire** (`POST /2/tweets`). Le free ne poste pas.
- App sur **developer.x.com** avec **OAuth 2.0** (Read+Write) ou OAuth 1.0a.

### Étapes
1. developer.x.com → Project & App → active **Read and Write**.
2. Génère un **OAuth 2.0 access token** (avec `tweet.write tweet.read users.read offline.access`) ou les clés OAuth 1.0a.

### Ce que tu me donnes
- `X_TOKEN = ...` (Bearer OAuth2 user, ou je m'adapte aux 4 clés OAuth1.0a si tu préfères)

---

## 7) (Bonus) Meta Ads — Conversions API & gestion pub
Pour l'agent **Paid** plus tard (pas de la publication organique) :
- `META_ADS_TOKEN = EAAxxxxx...` (scopes `ads_management, ads_read, read_insights`)
- `META_AD_ACCOUNT_ID = act_xxxxx`
> Tu m'as déjà donné un token Ads valide (~60 j). Pour du permanent → token **System User** avec ces scopes.

---

## Récap — clés finales (table Config Airtable / credentials n8n)
| Plateforme | Tu donnes | Je remplis (Config) |
|---|---|---|
| Meta IG+FB | `META_USER_TOKEN` | `META_TOKEN`, `IG_USER_ID`, `FB_PAGE_ID` |
| WhatsApp | `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, `WABA_ID` | + credential n8n |
| TikTok | `TIKTOK_TOKEN` | `TIKTOK_TOKEN` |
| YouTube | `YT_CLIENT_ID/SECRET/REFRESH_TOKEN` | idem |
| LinkedIn | `LINKEDIN_TOKEN`, `LINKEDIN_AUTHOR_URN` | idem |
| X | `X_TOKEN` | `X_TOKEN` |
| Paid (bonus) | `META_ADS_TOKEN`, `META_AD_ACCOUNT_ID` | idem |
| **Activation** | — | `PUBLISH_ENABLED=true` (quand prêt) |

## Ordre recommandé
1. **Meta IG+FB** (1 token couvre 2 canaux, cœur d'audience) → recette §1, la plus rapide.
2. **WhatsApp** (3 valeurs API Setup) → §2.
3. Puis LinkedIn / YouTube / TikTok / X selon ta priorité.

## Sécurité
- Ne mets **jamais** ces tokens dans un commit. Donne-les moi dans le chat (puis **régénère-les** en fin de
  setup si tu veux durcir). Je stocke les secrets en **credential n8n chiffré** ou Config (jamais en clair
  dans un workflow). Les clés privées (ex. service account) restent **hors Airtable**.
- Tokens Meta « longue durée » = 60 j → je documenterai le renouvellement (ou System User = permanent).
