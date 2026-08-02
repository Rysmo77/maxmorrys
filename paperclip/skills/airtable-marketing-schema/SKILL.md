# Skill — Schéma Airtable Marketing Max-Morrys

Airtable est **la mémoire partagée** de la flotte. Base : `AIRTABLE_MARKETING_BASE_ID` = **`apppkEbepilHCYiso`** (PAT `AIRTABLE_PAT`). Tu lis/écris via l'API Airtable. Convention : `Statut` en singleSelect, dates ISO, langue FR/EN.

## Tables clés (IDs réels)

- **`Contenus`** (`tblPYoyzcZLdtBTO3`) — **le pipeline social**, ~20 champs (singleSelect là où il faut). Champs pivots connus :
  - **`Statut`** (singleSelect) : `idée` → `planifié` → `rédigé` → `visuel prêt` → **`prêt_à_valider`** → `validé` → `publié`. **Les agents ne dépassent jamais `prêt_à_valider`** (le reste appartient au garde-fou).
  - **`Pilier`** (singleSelect) : Formations / Contenus / Communauté / IA / Accompagnement.
  - **`Visuels_URLs`** : URL(s) de la ou des créas composées `renderSocialCard` (jamais le fond IA brut ; plusieurs URLs = carrousel).
  - **`Blotato_PostSubmissionID`** : trace de notification/publication (rempli par les workflows — ne pas écraser).
  - + canal(aux), caption/copy, hashtags, date planifiée, agent… (voir la base live pour la liste exacte des champs).
- **`Config`** (`tblQqVRtboYFSGNt8`) — clés runtime lues par les workflows : `PUBLISH_ENABLED`, `META_TOKEN`, `IG_USER_ID`, `FB_PAGE_ID`, `TIKTOK_TOKEN`, `LINKEDIN_TOKEN`, `LINKEDIN_AUTHOR_URN`, `X_TOKEN`, `GEMINI_MODEL_TEXT`, `GEMINI_MODEL_IMAGE`, tokens Telegram, etc. **Ne pas y écrire de contenu** — c'est de la config.
- **`Emails`** (`tblLRoGu0rek1ekJE`) — `Subject`, `Preview`, `HTML`, `ListId`, `Status` (dont `prêt_à_valider`), `TG_MsgId`, `CampaignId`.
- **`WhatsApp`** (`tblUINpCqqw20bfBg`) — `To`, `TemplateName`, `TemplateLang`, `Preview`, `Status`, `TG_MsgId`, `MessageId`.
- **`SEO`** (`tblhLk66jOUsEhi7G`) — alimentée par le pull Google Search Console quotidien (query/page/impressions/clics/position). Lue par Ivan & Nadia.
- **`Calendrier_Editorial`** — plan hebdo cadré par Aïcha, alimenté par Zara (idées) & Ivan (angles de veille). *(Tables legacy : certains `Statut` sont en texte libre — préférer `Contenus` pour le pipeline actif.)*

## Règles
- Respecter les consentements avant tout envoi lifecycle (Flora).
- Ne jamais écraser un champ rempli par un workflow (`Blotato_PostSubmissionID`, `TG_MsgId`, `CampaignId`, `MessageId`).
- Ne jamais passer un `Statut` à `validé`/`publié` — c'est le rôle du garde-fou (skill `approval-protocol`).
- Journaliser les KPIs notables (Nadia) dans la table analytics / `KPIs_Logs`.
