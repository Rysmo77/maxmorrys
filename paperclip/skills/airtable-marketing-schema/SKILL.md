# Skill — Schéma de la base marketing Max-Morrys (NocoDB)

> ⚠️ **Airtable n'est plus la base.** Migration effectuée le **2026-08-06** : n8n tourne sur
> **NocoDB auto-hébergé**, 90 nœuds NocoDB et 0 nœud Airtable. Airtable est **gelé**, conservé en
> rollback jusqu'au ~2026-09-06 puis résilié. **Toute écriture qui y partirait serait perdue** —
> personne ne lit plus cette base. *(Le slug de ce skill reste `airtable-marketing-schema` : le
> renommer créerait un doublon côté Paperclip.)*

NocoDB est **la mémoire partagée** de la flotte.
UI : **`https://noco.maxmorrys.me`** · workspace `wpaxkizo` · base « Max-Morrys » `ph7ugup4mggzj2y`.
Credential n8n : **`MMNOCODBCRED001` « NocoDB Max-Morrys »**. Dates ISO, langue FR/EN.

## Trois pièges propres à NocoDB

1. **Le nœud NocoDB rend `{id, fields:{…}}`**, là où l'ancien nœud Airtable rendait `{id, …champs}`
   à plat. Chaque lecture est donc doublée : un nœud `<nom> (NocoDB)` suivi d'un nœud Code portant
   le **nom d'origine** qui aplatit — les expressions `$('<nom>').json.<Champ>` restent valables.
2. **`upsert` = PATCH si `id`, POST sinon.** NocoDB **ne matche pas sur une clé métier** comme le
   faisait Airtable. Toute écriture d'une clé `Config` doit résoudre son `id` par expression contre
   une lecture amont de la même table. Sans ça : une ligne créée à chaque passage, en silence.
3. **NocoDB REFUSE toute valeur hors options d'un `SingleSelect`** (`Invalid option(s) … provided
   for column`), là où le `typecast` d'Airtable la créait à la volée. **Avant d'écrire dans un
   SingleSelect, vérifier que TOUTES les valeurs possibles sont déclarées dans les options.**
   Il n'y a pas non plus de `typecast` : les champs se mappent **explicitement**, un par un — un
   champ absent du mapper n'est pas écrit, sans erreur.

Les filtres s'écrivent en `options.where`, pas en `filterByFormula` :
`(Status,eq,planifié)` · `(X,is,blank)` · combinés par `~and` / `~or`.

> ⚠️ **Le champ s'appelle `Status`, pas `Statut`.** C'est le nom réel en base et celui qu'utilise le
> code n8n (`WF-SOCIAL-03/04/05`, `WF-TG-ROUTER`). Toute écriture sur `Statut` est perdue en silence.

## Tables clés (IDs NocoDB réels)

- **`Contenus`** (`m3wim4coagaoot7`) — **le pipeline social**. Une ligne = **1 `Reseau` × 1 `Format_Post`** ; pour décliner une idée sur deux réseaux, créer deux lignes. Champs pivots :
  - **`Status`** (singleSelect) — **options réelles, relevées sur la base le 2026-08-06** :
    `idée` → `planifié` → `rédigé` → `image_needed` → **`prêt_à_valider`** → `validé` →
    `en_publication` → `publié`, plus `échec` et `rejeté`.
    ⚠️ `visuel prêt` **n'existe pas** — l'écrire ferait échouer le nœud (NocoDB refuse toute valeur
    hors options). **Les agents ne dépassent jamais `prêt_à_valider`** (le reste appartient au garde-fou).
  - **`Reseau`** (singleSelect) : `fb` / `ig` / `linkedin` / `x` / `tiktok` / `youtube`.
    ⚠️ `tiktok` et `youtube` ne sont **plus programmés** (décision board 2026-08-06 : pas de vidéo pour l'instant). Les valeurs restent, on ne les utilise pas.
  - **`Format_Post`** (singleSelect) : `post` / `carrousel` / `story` / `community_post` / `thread` / `reel` / `short` / `live`. ⚠️ `reel`, `short` et `live` ne sont plus programmés.
  - **`Pilier`** (singleSelect) : **Autorité / Éducation / Inspiration / Produit / Communauté / Autre**.
    ⚠️ La liste `Formations / Contenus / Communauté / IA / Accompagnement` est **périmée** — ces valeurs sont validées en dur dans `WF-TG-ROUTER` (nœud `TH — Parse posts`), ne pas les renommer.
  - **`Serie`** (singleSelect) *(nouveau 2026-08)* : `RADAR` / `ATELIER` / `PREUVE` / `COULISSES` / `CERCLE` / `OFFRE`.
  - **`Offre`** (singleSelect) *(nouveau 2026-08)* : `Formations` / `Club Digitos` / `Rysmo` / `Agence` / `Accompagnement` / `Non-produit`.
  - **`Cible`** (singleSelect) *(nouveau 2026-08)* : `Apprenants` / `Commerçants` / `Mixte`.
  - **`Outil`** (**texte libre**) *(nouveau 2026-08)* : l'outil traité par un contenu `Serie=ATELIER`.
    ⚠️ **Surtout pas un `singleSelect`** : NocoDB **refuse** toute valeur absente des options,
    ce qui refermerait la porte qu'on vient d'ouvrir — la série ATELIER doit pouvoir accueillir
    n'importe quel outil du moment. Sert l'anti-répétition (les 80 dernières lignes ATELIER sont
    relues avant chaque proposition) et le suivi de performance.
  - **`Thematique`** (singleSelect) — ⚠️ **liste FERMÉE** : `Marketing digital`, `SEO`, `Social media`,
    `Entrepreneuriat`, `E-commerce`, `IA & automatisation`, `Branding`, `Growth`, `Autre`,
    `Contenu de la semaine`. `TH — Créer posts` replie sur `Contenu de la semaine` toute valeur hors
    liste. **Le thème hebdomadaire n'y entre donc pas** : il vit dans `Brief` (texte libre).
  - **`Brief`** (LongText) — porte le thème de la semaine, puis l'outil ou la tendance imposés.
    C'est ce que lit WF-SOCIAL-03 pour rédiger.
  - **`Titre`**, **`Mots_Cles`**, **`Texte`**, **`Hashtags`**, **`Date_Publication_Prevue`**.
  - **`Visuels_URLs`** : URL(s) de la ou des créas composées `renderSocialCard` (jamais le fond IA brut ; **plusieurs URLs dans l'ordre = carrousel**).
  - **`Blotato_PostSubmissionID`** : trace de notification/publication (rempli par les workflows — ne pas écraser).
  - **Champs dépréciés** (présents mais inutilisés) : `Reseaux_Cibles`, `Plateforme_Principale`, `Texte_Facebook/Instagram/LinkedIn/X/TikTok/YouTube`, `Blotato_PublicUrls`.
- **`Config`** (`mo6ubcgxi9x4u7d`) — clés runtime lues par les workflows : `PUBLISH_ENABLED`, `META_TOKEN`, `IG_USER_ID`, `FB_PAGE_ID`, `TIKTOK_TOKEN`, `LINKEDIN_TOKEN`, `LINKEDIN_AUTHOR_URN`, `X_TOKEN`, `GEMINI_MODEL_TEXT`, `GEMINI_MODEL_IMAGE`, tokens Telegram, etc. **Ne pas y écrire de contenu** — c'est de la config.
- **`Emails`** (`ml6zyrbi30de7d4`) — `Subject`, `Preview`, `HTML`, `ListId`, `Status` (dont `prêt_à_valider`), `TG_MsgId`, `CampaignId`.
- **`WhatsApp`** (`mntnzprdk1m1jg2`) — `To`, `TemplateName`, `TemplateLang`, `Preview`, `Status`, `TG_MsgId`, `MessageId`.
- **`Logs`** (`m460m48wd0qnzsu`) — journal des publications et des runs.
- **`SEO`** — alimentée par le pull Google Search Console quotidien (query/page/impressions/clics/position).
  Lue par Ivan & Nadia. **ID NocoDB non relevé** : cette table n'est référencée par aucun workflow
  n8n (le pull est le script Python `scripts/gsc-pull.py`) — à lire dans l'UI NocoDB, ne pas deviner.
- **`Calendrier_Editorial`** — plan hebdo cadré par Aïcha, alimenté par Zara (idées) & Ivan (angles de veille). *(Tables legacy : certains `Statut` sont en texte libre — préférer `Contenus` pour le pipeline actif.)*

> ⚠️ **Les quatre champs `Serie`, `Offre`, `Cible` et `Outil` se créent dans l'UI NocoDB** (ou par
> l'API NocoDB) — pas depuis n8n. Tant qu'ils n'existent pas, les workflows qui les écrivent
> échouent : **NocoDB rejette un champ inconnu**, il ne l'ignore pas silencieusement comme Airtable.
> Et pour les trois `SingleSelect`, **toutes les options doivent être déclarées** — sinon la
> première valeur non prévue fait échouer le nœud.

## Les clés d'état des menus Telegram (table `Config`)

Le rituel du vendredi se déroule en trois clics : entre chacun, l'état vit dans `Config`
(`Cle` / `Valeur` / `Type`).

| Clé | Contenu |
|---|---|
| `THEMES_CURRENT` | les 4 thèmes proposés |
| `PICK_THEME` | le thème retenu |
| `TOOLS_CURRENT` / `TOOLS_PICKED` | les outils proposés (JSON) / les index cochés (CSV) |
| `TRENDS_CURRENT` / `TRENDS_PICKED` | les tendances proposées / les index cochés |

> ⚠️ **Deux pièges se cumulent sur ces clés.**
> 1. Elles doivent figurer dans le **`options.where`** du nœud `Airtable — Lire Config (NocoDB)` de
>    WF-TG-ROUTER. Une clé absente de ce filtre est **invisible pour tout le workflow**, sans la
>    moindre erreur — c'est ce qui fait perdre le thème cliqué (`THEMES_CURRENT` n'y était pas, et
>    l'expansion retombait sur « Contenu de la semaine »). La migration a repris le filtre verbatim,
>    donc le bug a survécu ; il est corrigé dans les workflows générés.
> 2. Chaque écriture doit **résoudre son `id`** contre cette lecture
>    (`$('Airtable — Lire Config').all().find(r => r.json.Cle === '…')?.json.id`), sinon NocoDB
>    crée une ligne au lieu de mettre à jour la sienne.

⚠️ **`TOOLS_PICKED` contient des index dans la liste complète de `TOOLS_CURRENT`.** Ne jamais
réduire `TOOLS_CURRENT` aux seuls outils retenus : les index se décaleraient et l'expansion
piocherait le mauvais outil, sans erreur.

## Règles
- Respecter les consentements avant tout envoi lifecycle (Flora).
- Ne jamais écraser un champ rempli par un workflow (`Blotato_PostSubmissionID`, `TG_MsgId`, `CampaignId`, `MessageId`).
- Ne jamais passer un `Status` à `validé`/`publié` — c'est le rôle du garde-fou (skill `approval-protocol`).
- **Renseigner les quatre étiquettes** (`Pilier`, `Serie`, `Offre`, `Cible`) sur chaque contenu créé :
  sans elles, impossible de piloter le mix ni de savoir quelle ligne de revenu la communication sert
  (skill `content-strategy`).
- Journaliser les KPIs notables (Nadia) dans la table analytics / `KPIs_Logs`.
