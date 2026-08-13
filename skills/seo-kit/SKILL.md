---
name: seo-kit
description: >
  SEO Kit Max-Morrys — référence partagée des agents SEO. Carte de l'infra SEO RÉELLE
  (fichiers exacts), cible, règles i18n/hreflang, checklists technique/on-page/E-E-A-T,
  gaps à combler. À consulter avant toute action SEO (ne pas réinventer l'existant).
---

## Cible & positionnement
maxmorrys.me = e-learning + coach IA Rysmo + YouTube, **cible Afrique francophone**
(entrepreneurs/freelances/créateurs). Canonical = **FR** ; EN = préfixe `/en` + segments traduits.
Voix = brand kit (`skills/soc-brand-kit/SKILL.md`).

## Infra SEO existante (AGIR AU BON ENDROIT — déjà en prod)
| Domaine | Fichier(s) | État |
|---|---|---|
| Prerender SSR (meta+JSON-LD+hreflang, tous bots) | `functions/src/prerender.ts` | ✅ riche |
| Sitemap bilingue + images + hreflang | `functions/src/sitemap.ts` | ✅ |
| robots.txt | `public/robots.txt` | ✅ |
| RSS | `functions/src/rss.ts` | ✅ **FR only** (gap: EN) |
| Meta/OG/Twitter/canonical | `src/components/seo/SEOHead.tsx`, `seo-config.ts` | ✅ dynamique/page |
| JSON-LD | `src/components/seo/JsonLd.tsx` + prerender | ✅ Article/Course/Video/Podcast/Org/Breadcrumb/FAQ |
| i18n routing/segments | `src/i18n/{routing,segments}.ts`, `functions/src/segments.ts` | ✅ |
| slug_en (backfill Gemini) | `functions/src/backfillSlugEn.ts` | ✅ |
| Champs SEO Firestore | `src/types/index.ts` (BlogPost…) : `metaTitle, metaDescription, focusKeyword, ogImage, canonicalUrl, noIndex, slug_en` | ✅ |
| Perf / CWV | `src/lib/web-vitals.ts` (→GA4), `vite.config.ts` (splitting + image-optimizer + lazy) | ✅ partiel |
| Tracking | `src/lib/tracking.ts` (GTM/GA4 + Meta Pixel) | ✅ |
| Feeds | `functions/src/catalog.ts` (Meta/Google Merchant) | ✅ |
| Contenu SEO (n8n) | WF-07 `LOvoUdV3nKCsPd46` (idées géoloc, Google CSE+Gemini), WF-08 `OQMIBhbc7Y9OFQzL` (rédaction → Firestore blog draft) | ✅ |
| **Données GSC** | table NocoDB **SEO** (alimentée par `WF-SEO-GSC`) | ⏳ en cours |

## Gaps prioritaires (les chantiers)
RSS-EN · plus de JSON-LD (HowTo, QAPage, ItemList) · Lighthouse CI + LCP tuning ·
monitoring d'indexation (GSC) · Meilisearch à activer (`src/lib/search.ts`, `functions/src/search.ts`) ·
keyword-gap & topical map (GSC) · meta des pages fort-impressions/faible-CTR.

## Checklist technique
Indexation (couverture GSC, noindex involontaire, canonicals) · sitemap à jour & soumis ·
hreflang fr/en/x-default cohérent · données structurées valides (Rich Results Test) ·
Core Web Vitals (LCP<2.5s, INP<200ms, CLS<0.1) · mobile-friendly · pas de contenu dupliqué ·
liens internes/maillage · vitesse (images AVIF/WebP, preload LCP, code-splitting).

## Checklist on-page / E-E-A-T
1 intention par page · title unique <60c avec mot-clé · meta description <155c incitative ·
H1 unique + hiérarchie Hn · mot-clé focus + sémantique (entités) · maillage interne contextuel ·
preuves/auteur/date (E-E-A-T) · images alt descriptifs · CTA clair · slug_en cohérent.

## Règles i18n SEO
Canonical = URL FR sans préfixe. EN = `/en` + segments traduits (`segments.ts`).
hreflang fr/en/x-default sur chaque page. Toujours peupler `slug_en` (sinon fallback `slug`).

## Red lines
- **JAMAIS** de merge / `git push origin main` / `firebase deploy` sans approbation board.
- Code = **branche git + PR** (`gh pr create`) ; `npm run build` avant PR.
- Pas de modif Firestore prod sans approbation (brouillons only).
- **Pas de black-hat** : cloaking, keyword stuffing, contenu spun, PBN, achat de liens, doorway pages.
- Outreach/link-building = **brouillons**, gated board (comme Community).

## Outils & données
GSC (table NocoDB SEO) · GA4 (GTM `GTM-PJ3R433M` / `G-5EFPZ71YX0`) · Google Custom Search (WF-07) ·
Lighthouse · repo (claude_local + git + gh) · n8n (WF-07/08, WF-SEO-GSC).
