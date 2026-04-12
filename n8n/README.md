# Ecosysteme n8n — maxmorrys.me

18 workflows d'automatisation pour le community management, la redaction web, la creation de cours LMS et la production de medias.

## Prerequisites

- Instance n8n (v1.x+) accessible avec API activee
- Cle API Google AI (Gemini) — [Google AI Studio](https://aistudio.google.com/)
- Google Custom Search API — [Console Google](https://console.cloud.google.com/)
- Compte Google avec acces Sheets et Drive
- Compte Firebase (projet `max-morrys`) avec Service Account

## Credentials a configurer dans n8n

Avant d'importer les workflows, creer ces credentials dans n8n (Settings > Credentials) :

| Nom dans n8n | Type | Description | Utilise par |
|---|---|---|---|
| `Gemini API` | Header Auth | Header: `x-goog-api-key`, Value: votre cle Google AI | WF-01 a WF-18 |
| `Google Custom Search` | Header Auth | Cle API Google Custom Search | WF-01, WF-07 |
| `Google Sheets` | Google Sheets OAuth2 | Acces aux spreadsheets de suivi | Tous |
| `Google Drive` | Google Drive OAuth2 | Upload des medias generes | WF-15 a WF-18 |
| `Firebase Service Account` | Google Service Account | JSON de la Service Account Firebase | WF-08, WF-14 |
| `SMTP` | SMTP | Serveur email (Brevo, SendGrid, etc.) | WF-06, WF-09 |

### Credentials reseaux sociaux (optionnel — placeholders)

| Nom | Type | Description |
|---|---|---|
| `Facebook Graph API` | Header Auth | Page Access Token Facebook | 
| `Instagram Graph API` | Header Auth | Via Facebook Business |
| `LinkedIn API` | OAuth2 | Publication LinkedIn |
| `Twitter API` | OAuth2 | Publication Twitter/X |

## Placeholders a remplacer

Apres import, rechercher et remplacer ces placeholders dans chaque workflow :

| Placeholder | Description | Exemple |
|---|---|---|
| `%%GOOGLE_AI_API_KEY%%` | Cle API Google AI (Gemini) | `AIzaSy...` |
| `%%GOOGLE_SEARCH_API_KEY%%` | Cle API Google Custom Search | `AIzaSy...` |
| `%%GOOGLE_SEARCH_CX%%` | ID du moteur de recherche Custom | `017576...` |
| `%%FIREBASE_PROJECT_ID%%` | ID du projet Firebase | `max-morrys` |
| `%%GOOGLE_SHEETS_ID%%` | ID du Google Sheet de suivi | `1BxiMVs...` |
| `%%GOOGLE_DRIVE_FOLDER_ID%%` | ID du dossier Drive pour les medias | `1abc...` |
| `%%N8N_BASE_URL%%` | URL de votre instance n8n | `https://n8n.example.com` |
| `%%SMTP_EMAIL%%` | Email d'envoi des notifications | `notifications@maxmorrys.me` |
| `%%ADMIN_EMAIL%%` | Email admin pour les validations | `hello@maxmorrys.me` |
| `%%FB_PAGE_ACCESS_TOKEN%%` | Token d'acces Page Facebook | `EAAG...` |
| `%%LINKEDIN_ACCESS_TOKEN%%` | Token OAuth2 LinkedIn | `AQV...` |
| `%%TWITTER_BEARER_TOKEN%%` | Bearer Token Twitter API v2 | `AAAA...` |

## Google Sheets a creer

Creer un Google Sheet avec ces onglets :

1. **Banque Idees Social** — Colonnes: Date, Sujet, Angle, Pertinence_Locale, Reseaux, Format, Score, Source, Hashtags_Locaux, Status
2. **Banque Idees Articles** — Colonnes: Date, Titre_SEO, Mot_Cle, Angle_Local, Volume_Estime, Score, Status
3. **Banque Idees Cours** — Colonnes: Date, Titre, Niveau, Audience, Besoin_Local, Duree, Score, Status
4. **Calendrier Editorial** — Colonnes: Semaine, Jour, Date, Heure_GMT, Reseau, Format, Rubrique, Sujet, Contenu, Media_URL, Hashtags, Status_Contenu, Status_Media, Status_Publication, URL_Post
5. **Cours en Production** — Colonnes: Cours, Module, Lecon, Type, Duree, Status_Contenu, Status_Quiz, Status_Media, Status_Publication, URL_LMS
6. **Interactions** — Colonnes: Date, Reseau, Post, Commentaire, Auteur, Sentiment, Reponse, Auto_Manuel
7. **Rapports Hebdo** — Colonnes: Semaine, Score, Reach, Engagement, Top_Posts, Recommandations
8. **Medias Generes** — Colonnes: Date, Type, Pour, Prompt, URL_Drive, Dimensions, Status

## Import des workflows

### Methode 1 : Script automatique

```bash
# Configurer les variables
export N8N_URL="https://votre-instance-n8n.com"
export N8N_API_KEY="votre-cle-api-n8n"

# Lancer l'import
chmod +x n8n/import.sh
./n8n/import.sh
```

### Methode 2 : Import manuel

1. Ouvrir n8n
2. Aller dans Workflows > Import from File
3. Importer chaque fichier JSON dans l'ordre :
   - Phase A : WF-15, WF-01, WF-07
   - Phase B : WF-02, WF-03, WF-08, WF-16, WF-17
   - Phase C : WF-10, WF-11, WF-12, WF-13, WF-18, WF-14
   - Phase D : WF-04, WF-05, WF-06, WF-09

## Ordre d'activation et tests

### Phase A — Fondations
1. **WF-15** (Images) — Tester : une image est generee et uploadee dans Drive
2. **WF-01** (Veille) — Tester : les idees arrivent dans Google Sheets
3. **WF-07** (Idees Articles) — Tester : les sujets sont pertinents et localises

### Phase B — Contenu
4. **WF-02** (Calendrier) — Tester : le planning est coherent et geolocalise
5. **WF-03** (Posts) — Tester : les posts sont adaptes a chaque reseau
6. **WF-08** (Articles) — Tester : l'article est dans Firestore avec status draft
7. **WF-16** (Carrousels) — Tester : les slides sont generees
8. **WF-17** (Reels) — Tester : le storyboard est complet

### Phase C — LMS Course Builder
9-14. WF-10 a WF-14 — Tester la chaine complete de creation de cours

### Phase D — Publication
15-18. WF-04 a WF-06, WF-09 — Activer avec supervision

## Architecture

```
WF-01 (Veille) --> WF-02 (Calendrier) --> WF-03 (Posts) --> WF-15 (Medias) --> WF-04 (Publication)

WF-07 (Idees) --> WF-08 (Articles) --> WF-03 (Posts promo) --> WF-15 (Image)

WF-10 (Recherche) --> WF-11 (Curriculum) --> WF-12 (Lecons) + WF-13 (Quiz) --> WF-18 (Visuels) --> WF-14 (Publication LMS)

WF-04 (Resultats) --> WF-05 (Reponses) --> WF-06 (Reporting)
```
