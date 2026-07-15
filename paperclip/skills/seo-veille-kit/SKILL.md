# Skill — SEO & Veille Max-Morrys (carte de l'infra + GSC)

Carte de l'infra SEO **déjà en place** (excellente) + les leviers restants. Pour Ivan (audit + veille) et Nadia (mesure).

## Infra SEO existante (ne pas réinventer)
- **Prerender / SSR** pour les pages clés.
- **Sitemap bilingue** avec **hreflang FR/EN** (URLs anglaises localisées).
- **JSON-LD** : 6 types de données structurées exposés (Organization, Course, Article, Breadcrumb, FAQ, etc.).
- **Champs SEO Firestore** par contenu (`meta_title`, `meta_description`, mots-clés).
- **web-vitals → GA4** (LCP/INP/CLS suivis).
- Workflows LMS/blog n8n (WF-07..WF-14, WF-18) pour idées/rédaction SEO.

## Google Search Console (LIVE)
- Propriété **domaine** : `sc-domain:maxmorrys.me`. Service account `firebase-adminsdk-fbsvc@max-morrys.iam.gserviceaccount.com` a accès `siteFullUser`.
- **Pull quotidien** (07:15) : script local `scripts/gsc-pull.py` → écrit la table Airtable **`SEO`** (`tblhLk66jOUsEhi7G`) : query / page / clics / impressions / position (28 j).
- Lis cette table pour prioriser : requêtes à fort volume + **CTR faible** (→ retravailler meta/titres), positions 5-15 (→ quasi-podium, gains rapides), pages sans impressions (→ indexation/contenu).

## Méthode d'audit (Ivan)
1. Lot de pages (formations/articles/pages) → vérifier meta (≤60 / ≤160), mots-clés, alt, JSON-LD, canonical, hreflang, maillage interne.
2. Croiser avec GSC (opportunités CTR/position).
3. Correctifs **contenu** (meta d'un article) → avec Zara. Correctifs **techniques** (code) → **PR git board-gated** (`npm run build`, jamais de merge/deploy direct).

## Veille (Ivan)
Tendances ed-tech / IA / formation en Afrique francophone, concurrents, SERP, hashtags, dates clés → 3 idées concrètes injectées dans le `Calendrier_Editorial` pour Zara.

## Gaps / priorités
Le n°1 historique = exploitation **GSC** (fait). Ensuite : CTR des pages à impressions, clusters de mots-clés par métier/compétence, indexation des nouvelles URLs.
