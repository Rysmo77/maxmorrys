# 05 — Identité visuelle et concurrents

> Extrait du dossier de connaissance du 29/10/2026 (branche `refonte/sous-domaines`, HEAD `77dd43f`). Chaque fait renvoie à `fichier:ligne` : **revérifier dans le code avant de citer un prix, une règle ou une URL.** Ordre d'autorité : code et tests > i18n `src/i18n/locales/` > PRD rév. 5 > CDC 14/09 > STRATEGIE_COMMUNICATION_2026 et skills paperclip/soc (périmés) > BUSINESS_MODEL/PLAN (spéculatifs). ⚠️ contradiction · ⛔ interdit · ✅ vérifié.

## 6. Identité visuelle (deux kits, à ne pas mélanger)

| | **A. Kit MARKETING** (social, print, présentations) | **B. Design system PRODUIT** (site, appli : ce que voit le client) |
|---|---|---|
| Source | `Max-Morrys_BrandKit_Complet/06_Tokens_Design/brand-tokens.json` (+ `.css`), Charte `03_…/Max-Morrys_Charte_Graphique_Complete.md` | `src/design-system/` (copie de `Max-Morrys_DS_Platform/design_handoff_maxmorrys/` via `npm run ds:sync`) |
| Bleu | profond #072B49 · principal #0074C5 · vif #0C93E7 · très clair #F0F7FF | **forme #0057BC**, « Je te forme » → Formations |
| Orange | #ED9516 | **informe #F38B0A**, « Je t'informe » → Blog/FAQ (texte sûr #8A4B00) |
| Violet | #8A3DE8 | **transforme #6C23DD**, « Je te transforme » → Podcasts, Vidéos, Club |
| Turquoise / teal | #08BDAA | **digitalise #02AC9C**, « Je te digitalise » → Commerces (texte sûr #00695E) |
| Corail | #FA5A2E | #FF6E7F (fonds dégradés seulement) ; **l'agence vit hors territoire, en corail** |
| Autres | vert #22C55E, texte #071B3A / #52627A ; dégradés institutionnel, innovation, énergie, croissance (`brand-tokens.json:8-38`) | encre #0E1116, papier #FFFFFF ; variantes nuit #6FB1FF / #B98CFF / #FFB24D / #3FD9C6 ; ⛔ orange et teal **interdits en texte** sur blanc (`src/lib/sectionThemes.ts:38-41`) |
| Polices | Display **Merriweather Display**, texte **Inter** (`brand-tokens.json:41-42`) | display **Fraunces** (900), texte **Schibsted Grotesk**, mono **JetBrains Mono** (`src/design-system/css/tokens/fonts.css:8-14`) |
| Logos | `05_Assets_Logos_Icones/monogramme_principal_1024.png`, `monogramme_transparent.png`, `favicon_app_icon/app_icon_{32…1024}.png`, `svg_icones/{accompagnement,communaute,contenus,formations,ia}.svg`. Monogramme = deux M stylisés ; zone de protection = la hauteur du monogramme ; ⛔ ne pas recolorer ni déformer (Charte `:41-58`) | `public/icone-mm.png` (273 Ko : préférer le `Wordmark` typographique ; plaque blanche sur fond couleur), `public/monogramme-320.png`, `public/og.png`, `public/og/*.png`, `public/favicon-32.png`, `public/apple-touch-icon.png` |
| Gabarits | `07_Templates_Marketing/` : brief créatif, `calendrier_editorial_30_jours.csv` (⚠️ remplacé par `docs/calendrier_editorial_12_semaines.csv`), checklist QA, conventions de nommage, matrice des angles, taxonomie UTM. Bannières FB et YT : `08_Sources_Reference/` | — |

- Territoires : `src/design-system/css/tokens/colors.css:5-28`, `src/design-system/react/types.ts:15-24`, `sectionThemes.ts:103-215`. Couleur de l'appli : `#0057BC` (`mobile/app.json`).
- ⚠️ **Les deux kits divergent sur chaque teinte et sur les polices.** Un visuel social fait avec le kit A ne ressemble ni au site ni à l'appli. Le sens des couleurs diffère aussi : turquoise = IA ou Éducation dans A, teal = commerces dans B.
- **Recommandation :** utiliser B pour tout ce qui renvoie vers le produit, comme les pages d'atterrissage ou les captures (**à trancher par l'humain**).
- ⚠️ `_bmad-output/project-context.md:353-360` (Inter seule, brand #0c93e7) est **périmé** sur le style.

---

## 7. Concurrents et références
- **Formation, EdTech** :
  - `BUSINESS_PLAN.md:163-172` : Udemy et Coursera (anglais, carte bancaire seulement, sans communauté), YouTube (non structuré), coachs individuels, écoles privées en présentiel (chères), communautés payantes sur Slack ou WhatsApp (sans plateforme de cours).
  - `BUSINESS_MODEL.md:135` : OpenClassrooms, bootcamps de Dakar à 200–500 k XOF.
- **Comparables Afrique de l'Ouest** (`_bmad-output/planning-artifacts/prds/prd-maxmorrys.me-main-2026-08-29/research-comparables.md`) :
  - GOMYCODE (campus à Dakar et Abidjan, 8 M$ levés, `:11-13`) ;
  - Abidjan Digital School (150–500 k par formation, `:14`) ;
  - Etudesk (B2B, `:15`) ;
  - **Chariow** (abonnement à 0 €, ≈ 15 % de commission, mobile money natif : le « concurrent d'infrastructure direct », `:17-18`) ;
  - Cap Learning, Edumiaa, Waraba Academy (`:19`) ;
  - Copy Mastery, LiveMentor (`:27-28`).
- **Communauté :** Skool (9 $ / 99 $), désigné comme « le tueur direct » (`:116-119`) ; Circle, Kajabi, Maven (`:36-44`) ; Discord, Patreon (`BUSINESS_MODEL.md:227`). PRD rév. 5 : Skool, Kajabi et Circle ne gèrent pas le mobile money, Chariow oui (`prd.md:149-152`). Aucun acteur d'Afrique de l'Ouest ne combine plateforme de cours, communauté, IA et gamification (`:287-290`).
- **Tuteur IA :** Khanmigo, LearnWorlds, Thinkific, Coursera Coach (`research-comparables.md:57-65`), Duolingo (`:84`). Pour Rysmo, « aucun concurrent local » (`BUSINESS_MODEL.md:325`).
- **Agence TPE** :
  - freelances de Dakar à 100–300 k, agences locales à 350–600 k, community managers à 100–210 k par mois (`BUSINESS_MODEL.md:481`) ;
  - prix affichés de Systalink, PixlStudio, Safaricloud, Webxpert, Awa Cotonou ; offres low-cost à 50–100 k ; abonnements de community management au Sénégal à 49 / 115 / 220 k (`prd-…-08-29/research-agence-tpe.md:12-62`) ;
  - **le vrai substitut : Facebook et WhatsApp gratuits** (`:37-40`).
- **Inspirations éditoriales (pas des concurrents)** : Jenna Kutcher, Stanislas Zeze, Fabrice Sawegnon, Balkissa Ahmadou, Oprah, Mark Saint Julien, Life Mag, Wave, Coca-Cola, BEM (`STRATEGIE:100-112`).

