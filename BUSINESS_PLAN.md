# Business Model & Business Plan — Max-Morrys

**Société exploitante :** My Onoma SARL · **Marque :** Max-Morrys ([maxmorrys.me](https://maxmorrys.me))
**Siège :** Dakar, Sénégal · **Marché :** Afrique francophone (SN, CI, CM) + diaspora & France
**Devise :** FCFA (XOF) — parité fixe 1 EUR = 655,957 FCFA
**Horizon :** 5 ans · **Point de départ :** pré-lancement (0 client en Année 1)
**Scénarios financiers :** Prudent / Base / Optimiste
**Version :** 2.0 — Juin 2026

> Modèle financier reproductible : [`finance/model.py`](finance/model.py). Tableaux exportés en CSV dans [`finance/`](finance/). Tous les montants sont en FCFA sauf mention contraire ; les conversions EUR sont indicatives. Pour recalculer : modifier les drivers du dictionnaire `SCEN` puis `python3 finance/model.py`.

---

## Sommaire

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Vision, problème & solution](#2-vision-problème--solution)
3. [Business Model Canvas](#3-business-model-canvas)
4. [Produit & offre](#4-produit--offre)
5. [Marché, cible & personas](#5-marché-cible--personas)
6. [Concurrence & positionnement](#6-concurrence--positionnement)
7. [Stratégie go-to-market](#7-stratégie-go-to-market)
8. [Unit economics (LTV / CAC)](#8-unit-economics-ltv--cac)
9. [Opérations, équipe & roadmap](#9-opérations-équipe--roadmap)
10. [Hypothèses du modèle financier](#10-hypothèses-du-modèle-financier)
11. [Prévisions de revenus par flux](#11-prévisions-de-revenus-par-flux)
12. [Compte de résultat prévisionnel (P&L)](#12-compte-de-résultat-prévisionnel-pl)
13. [Plan de trésorerie](#13-plan-de-trésorerie)
14. [Besoin de financement & emploi des fonds](#14-besoin-de-financement--emploi-des-fonds)
15. [Indicateurs clés & jalons](#15-indicateurs-clés--jalons)
16. [Risques & analyse de sensibilité](#16-risques--analyse-de-sensibilité)
17. [Recommandations](#17-recommandations)

---

## 1. Résumé exécutif

**Max-Morrys** est une **plateforme EdTech B2C francophone** qui forme les entrepreneurs, créateurs et PME d'Afrique de l'Ouest au **marketing digital, au SEO et à l'intelligence artificielle**. La plateforme est **déjà construite et en production** (React/TypeScript + Firebase), avec paiement mobile money local intégré (Wave, Orange Money, carte via Bictorys).

Le modèle économique repose sur **quatre flux de revenus complémentaires**, tous déjà codés et opérationnels, articulés autour d'un funnel unique :

| # | Flux | Modèle | Rôle |
|---|---|---|---|
| 1 | **Formations en ligne (LMS)** | Achat unique (95 000–200 000 FCFA), accès à vie, certificat | Cœur du CA (~85 %) |
| 2 | **Club des Digitos** | Abonnement annuel (19 900 FCFA/an) | Récurrent + rétention |
| 3 | **Rysmo+** (assistant IA) | Abonnement mensuel (3 000 / 7 500 FCFA) | MRR + engagement |
| 4 | **Packs Rysmo** | Micro-transactions (500–3 500 FCFA) | Monétisation des gratuits |

Le **contenu gratuit** (blog, podcast, vidéos) constitue le haut de funnel d'acquisition organique.

### Atouts différenciants
- **Fondateur à crédibilité mesurable** : +1 790 % de trafic web généré pour un client, +8 000 abonnés organiques en 18 mois → **audience « warm » préexistante** qui permet une conversion non nulle dès le lancement (≠ démarrage à froid).
- **Marge brute > 91 %** (produit 100 % digital, coût marginal quasi nul).
- **Localisation native** : français, prix en FCFA, paiement mobile money — friction d'achat minimale sur le marché cible.
- **Stack produit intégrée** (formation + communauté + IA) → rétention et valeur vie client supérieures aux offres mono-produit.

### Synthèse financière (CA & résultat net, FCFA)
| Scénario | CA An1 | CA An5 | Rés. net An1 | Rés. net An5 | Trésorerie fin An5 |
|---|--:|--:|--:|--:|--:|
| **Prudent** | 5 175 938 | 45 493 214 | −3 319 341 | −300 361 | **−3 174 505** |
| **Base** | 18 006 875 | 220 567 612 | 3 419 609 | 75 225 996 | **172 100 410** |
| **Optimiste** | 52 707 600 | 879 997 184 | 18 346 630 | 370 718 581 | **822 225 061** |

*CA An5 Base ≈ 336 300 € · CA An5 Optimiste ≈ 1 341 600 €.*

**Lecture clé :** en scénario **Base**, l'activité est **rentable dès l'An 1** et génère **172 M FCFA** de trésorerie cumulée sur 5 ans sans financement externe au-delà de l'apport initial. Le scénario **Prudent** approche seulement l'équilibre en An 5 et exige une vigilance trésorerie (négative dès l'An 3).

**Besoin de financement initial recommandé : 9 M FCFA** (≈ 13 700 €) — couvre la rampe de lancement et le marketing d'amorçage sur 12 mois.

---

## 2. Vision, problème & solution

### 2.1 Vision
> *« Maîtrisez le digital, accélérez votre croissance. »*
Devenir la **référence francophone de la formation digitale actionnable** en Afrique de l'Ouest, en combinant savoir (formation), inspiration (contenu) et exécution (communauté + IA).

### 2.2 Le problème
En Afrique francophone, entrepreneurs et PME font face à :
- une **offre de formation fragmentée**, souvent en anglais, déconnectée des réalités locales (paiement, budgets, cas d'usage) ;
- un **déficit de compétences** digitales alors que la digitalisation s'accélère ;
- des contenus **théoriques** sans mise en pratique ni accompagnement ;
- peu d'acteurs combinant **formation + communauté + outil d'application**.

### 2.3 La solution — « Je te forme · Je t'informe · Je te transforme »
- **Je te forme** — formations actionnables (modules → leçons vidéo/texte/quiz/missions), certificat vérifiable, accès à vie, garantie satisfait/remboursé.
- **Je t'informe** — blog, podcast, vidéos : preuve de valeur et acquisition.
- **Je te transforme** — communauté **Club des Digitos** (entraide, lives, opportunités, gamification) + **Rysmo**, tuteur IA personnalisé disponible 24/7.

---

## 3. Business Model Canvas

| Bloc | Contenu |
|---|---|
| **Segments clients** | Entrepreneurs digitaux · créateurs / personal branders · freelances & consultants · marketing/growth managers · PME en transformation · étudiants pro. Géo : Sénégal (cœur), Côte d'Ivoire, Cameroun, diaspora & France. |
| **Proposition de valeur** | Maîtriser SEO/IA/marketing avec des formations concrètes + communauté + assistant IA, au prix et aux moyens de paiement locaux. « Sans blabla. » |
| **Canaux** | Site maxmorrys.me · SEO/blog · YouTube · podcast · LinkedIn (audience fondateur) · newsletter · WhatsApp · parrainage. |
| **Relation client** | Self-service (LMS) + communauté animée + tutorat IA + support (rôle `support`) + sessions live. |
| **Sources de revenus** | (1) Formations à l'unité ; (2) abonnement Club annuel ; (3) abonnements Rysmo+ mensuels ; (4) packs Rysmo. |
| **Ressources clés** | Plateforme React/Firebase · catalogue de formations · **marque & audience du fondateur** · contenu (articles/vidéos/podcasts) · modèle IA (Gemini) · données d'usage. |
| **Activités clés** | Production de contenu & formations · animation communauté · acquisition/marketing · développement produit · support. |
| **Partenaires clés** | Bictorys (paiement) · Google/Gemini (IA) · Firebase (infra) · intervenants invités · affiliés/ambassadeurs · médias & incubateurs. |
| **Structure de coûts** | Infra cloud & IA (variable) · commission paiement (~3 %) · acquisition (ads) · production contenu · salaires/freelances · outils (n8n, analytics). Majoritairement **variable et faible** → forte marge. |

---

## 4. Produit & offre

### 4.1 Catalogue formations (achat unique, accès à vie, certificat inclus)
| Formation | Niveau | Prix (FCFA) | Promo |
|---|---|--:|--:|
| Maîtrisez le SEO de A à Z | Intermédiaire | 150 000 | 99 000 |
| Marketing Digital Complet | Débutant→Avancé | 200 000 | 149 000 |
| L'IA pour les Entrepreneurs | Débutant | 120 000 | — |
| Personal Branding | Débutant | 95 000 | — |
| Growth Hacking Avancé | Avancé | 175 000 | — |

**ASP retenu** (mix plein tarif/promo, skew entrée de gamme) : 110 000 (Prudent) / **125 000 (Base)** / 135 000 (Optimiste). Garantie satisfait/remboursé 14 j.

### 4.2 Club des Digitos — communauté récurrente (19 900 FCFA/an)
Fil d'actualité, forum & discussions par catégorie, sessions live exclusives, événements & challenges gamifiés, réseau professionnel, **opportunités** (missions/emplois/partenariats postés par les membres), leaderboard, **bonus de quotas Rysmo**.

### 4.3 Rysmo — assistant IA (récurrent + pay-as-you-go)
| Offre | Prix | Quota |
|---|--:|---|
| Rysmo+ Lite | 3 000 FCFA/mois | 20 requêtes/jour |
| Rysmo+ Pro | 7 500 FCFA/mois | 100 requêtes/jour |
| Pack Discovery | 500 FCFA | 30 requêtes |
| Pack Regular | 1 500 FCFA | 100 requêtes |
| Pack Intensive | 3 500 FCFA | 300 requêtes |

Profil pédagogique par utilisateur (résumé, topics, niveau, points faibles, mémoire avec consentement) → personnalisation croissante. **Prix mensuel pondéré** (mix 70 % Lite / 30 % Pro) : 4 350 FCFA/mois.

### 4.4 Contenu gratuit (acquisition)
Blog, « Le Podcast du Marketing », chaîne YouTube « Le Marketing en Pratique », newsletter hebdomadaire. Rôle : haut de funnel SEO/social, preuve de valeur, nurturing.

### 4.5 Logique de packaging
**Freemium de contenu → 1ʳᵉ formation → Club (récurrent) → Rysmo+ (récurrent) → parrainage.** Le ticket d'entrée bas (pack Rysmo 500 FCFA) réduit la friction ; Club et Rysmo+ transforment l'achat ponctuel en revenu récurrent (MRR/ARR).

---

## 5. Marché, cible & personas

### 5.1 Dimensionnement
- **Contexte :** forte croissance de l'économie numérique en Afrique de l'Ouest ; pénétration mobile money élevée au Sénégal (Wave, Orange Money) ; demande croissante de compétences digitales ; **faible offre localisée en français orientée résultats**.
- **TAM** (francophones Afrique de l'Ouest + diaspora intéressés par la montée en compétences digitales) : plusieurs millions d'individus.
- **SAM** (entrepreneurs/créateurs/PME francophones solvables, SN + CI + CM + diaspora) : **~300 000–500 000** personnes.
- **SOM 5 ans** (part réaliste captée) : **3 000–6 000 clients payants cumulés** — cohérent avec le scénario Base (~3 600 acheteurs formation cumulés An 5).

> Bornes TAM/SAM à affiner avec des données terrain (enquêtes, taux de conversion réels des premières campagnes).

### 5.2 Personas
| Persona | Profil | Besoin | Produits |
|---|---|---|---|
| **L'entrepreneur pressé** | Dirige une TPE, veut des clients en ligne | Méthode actionnable rapide | Formation SEO/Marketing + Rysmo |
| **Le créateur / personal brander** | Construit son audience | Stratégie de contenu & branding | Personal Branding + Club |
| **Le marketer en poste** | Salarié growth/marketing | Monter en compétence (IA, growth) | Growth Hacking + Rysmo+ Pro |
| **La PME en transformation** | Équipe à former | Montée en compétence collective | Formations (futur B2B) + Club |
| **L'étudiant pro** | Cherche employabilité | Certification + réseau | Formation + Club (opportunités) |

---

## 6. Concurrence & positionnement

| Concurrent | Forces | Limites |
|---|---|---|
| **MOOC internationaux** (Udemy, Coursera) | Catalogue large, notoriété | Anglais, peu localisés, paiement carte seul, pas de communauté |
| **YouTube / contenu gratuit** | Gratuit, abondant | Non structuré, sans accompagnement ni certification |
| **Formateurs/coachs individuels** | Crédibilité, proximité | Offre fragmentée, pas de plateforme ni récurrent |
| **Écoles privées** (présentiel) | Diplôme, réseau | Cher, présentiel, peu flexible |
| **Communautés payantes** (Slack/WhatsApp) | Engagement | Sans LMS structuré ni certification |

**Avantage Max-Morrys (moats) :** (1) ancrage local + mobile money natif ; (2) crédibilité fondateur mesurable ; (3) **stack intégrée** LMS + communauté + IA (rétention/LTV) ; (4) automatisation (n8n) réduisant le coût de production ; (5) données d'usage Rysmo → personnalisation difficile à répliquer.

---

## 7. Stratégie go-to-market

### 7.1 Funnel
```
Contenu gratuit (SEO, LinkedIn, YouTube, podcast)
      ↓  inscription gratuite + newsletter
Nurturing (email, défis, lives gratuits)
      ↓  offre d'entrée (pack Rysmo 500 F / 1re formation en promo)
Client formation (revenu principal)
      ↓  upsell Club des Digitos (récurrent)
      ↓  upsell Rysmo+ (récurrent)
Ambassadeur / parrainage (boucle virale)
```

### 7.2 Leviers par phase
- **An 1 — Amorçage :** capitaliser sur l'audience existante (8 000+ warm leads), lancer les 5 formations, activer Club & Rysmo, séquences email, lives de lancement, offres *founding members* du Club.
- **An 2–3 — Traction :** SEO de fond (clusters de contenu), publicité payante mesurée (Meta/Google, ROAS suivi), affiliation/ambassadeurs, partenariats (incubateurs, écoles, médias tech).
- **An 4–5 — Échelle :** expansion CI/Cameroun, nouveaux intervenants/formations, montée du récurrent, **offre B2B** (formation d'équipes/PME).

---

## 8. Unit economics (LTV / CAC)

| Indicateur (scénario Base) | Valeur | Méthode |
|---|--:|---|
| Marge brute | **~91,5 %** | CA − (paiement 3 % + IA/infra) |
| ASP formation | 125 000 FCFA | Mix tarif/promo |
| Cours / acheteur / an | 1,25 | Driver modèle |
| **LTV brute par acheteur** | **~142 000 FCFA** | ASP × 1,25 × marge 91 % (hors upsell Club/Rysmo) |
| CAC acheteur (An 2) | **~40 000 FCFA** | Marketing An2 / acheteurs (~9,58 M / 240) |
| **Ratio LTV / CAC** | **~3,5×** | Sain (> 3) ; supérieur avec upsell récurrent |
| ARR récurrent (Club + Rysmo+) An5 | ~26,8 M FCFA | Base de revenus prévisibles |

**Leviers d'amélioration de la LTV :** taux d'adhésion au Club, rétention Club (60→80 %), durée d'abonnement Rysmo+, multi-achat de formations. L'upsell récurrent n'est **pas** inclus dans la LTV brute ci-dessus → marge de sécurité.

---

## 9. Opérations, équipe & roadmap

### 9.1 Plateforme (en production)
Frontend **React/TypeScript (Vite)** · backend **Firebase** (Auth, Firestore, Functions v2, Storage) · paiement **Bictorys** (Wave, Orange Money, carte) · IA **Google Gemini** (Rysmo) · automatisation **n8n** · analytics GA/Meta Pixel · hébergement Firebase Hosting. Sécurité auditée (règles Firestore testées, headers HTTP, rate-limiting Rysmo, validation env).

### 9.2 Équipe (montée progressive)
- **An 1 :** fondateur (produit/contenu/marketing) + 1 dev (freelance/temps partiel) + community/support (mi-temps) + freelances ponctuels (montage, design).
- **An 2–3 :** community manager dédié, growth/ads, support, intervenants formations.
- **An 4–5 :** responsable contenu, dev produit à plein temps, commercial B2B.

### 9.3 Roadmap
| Période | Jalons |
|---|---|
| **T0–T1** | Finaliser les 5 formations, séquences email, lancement Club (founding members), activation Rysmo+, campagnes audience existante. |
| **T2–T4 (An1)** | SEO de fond, optimisation funnel, lives réguliers, premiers ambassadeurs, mesure CAC/LTV par cohorte. |
| **An 2** | Publicité payante mesurée, affiliation, 3–5 nouvelles formations, amélioration personnalisation Rysmo. |
| **An 3** | Expansion CI/Cameroun, partenariats institutionnels, montée du récurrent. |
| **An 4–5** | Offre B2B (équipes/PME), catalogue élargi avec intervenants, optimisation marge & rétention. |

---

## 10. Hypothèses du modèle financier

Le moteur est un funnel **inscrits gratuits → acheteurs → upsell récurrent**. Détail : [`finance/hypotheses.csv`](finance/hypotheses.csv).

| Driver | Prudent | Base | Optimiste |
|---|--:|--:|--:|
| Nouveaux inscrits gratuits — An1 | 1 500 | 2 500 | 4 000 |
| Nouveaux inscrits gratuits — An5 | 13 000 | 30 000 | 65 000 |
| Conversion inscrit → acheteur | 2,5 % | 4,0 % | 6,0 % |
| Cours / acheteur / an | 1,10 | 1,25 | 1,40 |
| ASP formation | 110 000 | 125 000 | 135 000 |
| Adhésion Club (% acheteurs) | 15 % | 25 % | 35 % |
| Rétention annuelle Club | 60 % | 70 % | 80 % |
| Abonnement Rysmo+ (% inscrits) | 1,5 % | 2,5 % | 4,0 % |
| Durée moy. abo Rysmo+ (mois) | 4,0 | 5,0 | 6,0 |
| Achat packs Rysmo (% inscrits) | 4 % | 7 % | 10 % |
| Achats packs / acheteur / an | 1,5 | 2,0 | 2,5 |

**COGS :** commission Bictorys **3 %** des encaissements ; infra **300 FCFA/inscrit/an** ; **4 000 FCFA/abonné Rysmo+/an** (usage Gemini intensif).
**OPEX :** personnel (montée progressive), marketing (% du CA avec plancher), outils (n8n, Canva, email/CRM, IA), frais généraux (compta/juridique SARL, banque). **IS Sénégal : 30 %** sur résultat positif.

---

## 11. Prévisions de revenus par flux

Source : [`finance/revenus_par_flux_5ans.csv`](finance/revenus_par_flux_5ans.csv). Les formations représentent **~85 %** du CA ; le récurrent (Club + Rysmo+) monte de ~10 % à ~12 % du CA — levier à renforcer.

### Scénario Base (FCFA)
| Flux | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| Formations | 15 625 000 | 37 500 000 | 75 000 000 | 125 000 000 | 187 500 000 |
| Club Digitos | 497 500 | 1 542 250 | 3 467 575 | 6 407 302 | 10 455 112 |
| Rysmo+ (abos) | 1 359 375 | 3 262 500 | 6 525 000 | 10 875 000 | 16 312 500 |
| Packs Rysmo | 525 000 | 1 260 000 | 2 520 000 | 4 200 000 | 6 300 000 |
| **Total CA** | **18 006 875** | **43 564 750** | **87 512 575** | **146 482 302** | **220 567 612** |

### Scénario Prudent (FCFA)
| Flux | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| Formations | 4 537 500 | 10 587 500 | 18 150 000 | 27 225 000 | 39 325 000 |
| Club Digitos | 111 938 | 328 350 | 644 760 | 1 058 481 | 1 605 214 |
| Rysmo+ (abos) | 391 500 | 913 500 | 1 566 000 | 2 349 000 | 3 393 000 |
| Packs Rysmo | 135 000 | 315 000 | 540 000 | 810 000 | 1 170 000 |
| **Total CA** | **5 175 938** | **12 144 350** | **20 900 760** | **31 442 481** | **45 493 214** |

### Scénario Optimiste (FCFA)
| Flux | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| Formations | 45 360 000 | 124 740 000 | 272 160 000 | 476 280 000 | 737 100 000 |
| Club Digitos | 1 671 600 | 5 934 180 | 14 776 944 | 29 373 355 | 50 662 184 |
| Rysmo+ (abos) | 4 176 000 | 11 484 000 | 25 056 000 | 43 848 000 | 67 860 000 |
| Packs Rysmo | 1 500 000 | 4 125 000 | 9 000 000 | 15 750 000 | 24 375 000 |
| **Total CA** | **52 707 600** | **146 283 180** | **320 992 944** | **565 251 355** | **879 997 184** |

---

## 12. Compte de résultat prévisionnel (P&L)

Source : [`finance/compte_resultat_5ans.csv`](finance/compte_resultat_5ans.csv).

### Scénario Base (FCFA)
| Poste | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| Chiffre d'affaires | 18 006 875 | 43 564 750 | 87 512 575 | 146 482 302 | 220 567 612 |
| − COGS paiement (3 %) | 540 206 | 1 306 943 | 2 625 377 | 4 394 469 | 6 617 028 |
| − COGS infra/IA | 1 000 000 | 2 400 000 | 4 800 000 | 8 000 000 | 12 000 000 |
| **= Marge brute** | **16 466 669** | **39 857 808** | **80 087 198** | **134 087 833** | **201 950 583** |
| *Marge brute %* | *91,4 %* | *91,5 %* | *91,5 %* | *91,5 %* | *91,6 %* |
| − Personnel | 5 400 000 | 11 400 000 | 19 800 000 | 28 800 000 | 39 600 000 |
| − Marketing | 3 961 512 | 9 584 245 | 19 252 766 | 32 226 107 | 48 524 875 |
| − Outils | 720 000 | 1 080 000 | 1 440 000 | 1 800 000 | 2 160 000 |
| − Frais généraux | 1 500 000 | 2 000 000 | 2 600 000 | 3 400 000 | 4 200 000 |
| **= EBITDA** | **4 885 156** | **15 793 562** | **36 994 431** | **67 861 727** | **107 465 709** |
| − IS (30 %) | 1 465 547 | 4 738 069 | 11 098 329 | 20 358 518 | 32 239 713 |
| **= Résultat net** | **3 419 609** | **11 055 494** | **25 896 102** | **47 503 209** | **75 225 996** |

### Comparatif scénarios — EBITDA & résultat net (FCFA)
| | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| EBITDA — Prudent | −3 319 341 | −2 405 963 | −1 828 400 | −1 320 440 | −300 361 |
| EBITDA — Base | 4 885 156 | 15 793 562 | 36 994 431 | 67 861 727 | 107 465 709 |
| EBITDA — Optimiste | 26 209 472 | 79 463 890 | 184 574 920 | 334 760 976 | 529 597 973 |
| Net — Prudent | −3 319 341 | −2 405 963 | −1 828 400 | −1 320 440 | −300 361 |
| Net — Base | 3 419 609 | 11 055 494 | 25 896 102 | 47 503 209 | 75 225 996 |
| Net — Optimiste | 18 346 630 | 55 624 723 | 129 202 444 | 234 332 683 | 370 718 581 |

*En Prudent, l'EBITDA reste négatif sur tout l'horizon (pas d'IS dû) ; l'équilibre n'est approché qu'en An5.*

---

## 13. Plan de trésorerie

Source : [`finance/cashflow_tresorerie_5ans.csv`](finance/cashflow_tresorerie_5ans.csv) et [`finance/tresorerie_mensuelle_an1.csv`](finance/tresorerie_mensuelle_an1.csv). Base **encaissement** (settlement Bictorys quasi immédiat).

### 13.1 Trésorerie mensuelle — Année 1 (scénario Base)
Apport initial **9 000 000 FCFA** (janvier). *IS exclu (payable l'année N+1).*

| Mois | Encaissements | Décaissements | Flux net | Trésorerie cumulée |
|---|--:|--:|--:|--:|
| Jan | 383 125 | 752 058 | −368 933 | 8 631 067 |
| Fév | 574 688 | 810 587 | −235 899 | 8 395 168 |
| Mar | 766 250 | 869 116 | −102 866 | **8 292 302** |
| Avr | 957 812 | 927 644 | +30 168 | 8 322 470 |
| Mai | 1 149 375 | 986 174 | +163 201 | 8 485 672 |
| Jun | 1 340 938 | 1 044 703 | +296 235 | 8 781 907 |
| Jul | 1 532 500 | 1 103 231 | +429 269 | 9 211 175 |
| Aoû | 1 724 062 | 1 161 760 | +562 302 | 9 773 477 |
| Sep | 1 915 625 | 1 220 289 | +695 336 | 10 468 813 |
| Oct | 2 107 188 | 1 278 819 | +828 369 | 11 297 183 |
| Nov | 2 490 312 | 1 395 875 | +1 094 437 | 12 391 619 |
| Déc | 3 065 000 | 1 571 463 | +1 493 537 | 13 885 156 |

**Point bas An1 (Base) : 8 292 302 FCFA (mars)** — l'apport de 9 M couvre largement la rampe. **Flux mensuel positif dès avril (mois 4).**

### 13.2 Trésorerie annuelle — 5 ans (FCFA)
| Scénario | Poste | An1 | An2 | An3 | An4 | An5 |
|---|---|--:|--:|--:|--:|--:|
| **Base** | Flux net | 3 419 609 | 11 055 494 | 25 896 102 | 47 503 209 | 75 225 996 |
| | **Trésorerie cumulée** | **12 419 609** | **23 475 103** | **49 371 205** | **96 874 414** | **172 100 410** |
| **Prudent** | Flux net | −3 319 341 | −2 405 963 | −1 828 400 | −1 320 440 | −300 361 |
| | **Trésorerie cumulée** | 2 680 659 | 274 696 | **−1 553 704** | **−2 874 144** | **−3 174 505** |
| **Optimiste** | Flux net | 18 346 630 | 55 624 723 | 129 202 444 | 234 332 683 | 370 718 581 |
| | **Trésorerie cumulée** | 32 346 630 | 87 971 353 | 217 173 797 | 451 506 480 | 822 225 061 |

*Apport initial inclus dans la trésorerie cumulée An1.*

> **Alerte trésorerie (Prudent) :** trésorerie négative dès l'An 3. Correctifs : porter l'apport à ~10 M FCFA, **ou** plafonner le marketing au plancher et différer une embauche, **ou** accélérer le récurrent (Club/Rysmo+).

---

## 14. Besoin de financement & emploi des fonds

**Apport recommandé : 6 M (Prudent) / 9 M (Base) / 14 M (Optimiste) FCFA.** Cible retenue : **9 M FCFA**.

### Emploi des fonds (scénario Base, An 1)
| Poste | Montant indicatif | %|
|---|--:|--:|
| Marketing d'amorçage (ads, créa, partenariats) | ~4,0 M | 44 % |
| Personnel & freelances (dev, community, montage) | ~3,0 M | 33 % |
| Production de contenu & formations | ~1,0 M | 11 % |
| Outils & infra (n8n, IA, CRM, hébergement) | ~0,7 M | 8 % |
| Juridique/compta (SARL) & réserve | ~0,3 M | 4 % |

**Sources possibles :** autofinancement / love money · subvention ou concours startup · **préventes** (founding members du Club, early-bird formations) · éventuel ticket d'amorçage à An 2–3 pour accélérer l'acquisition.

---

## 15. Indicateurs clés & jalons

### KPIs de pilotage
- **Acquisition :** visiteurs, taux d'inscription, abonnés newsletter, CAC, ROAS.
- **Activation/Conversion :** visiteur→inscrit, inscrit→1er achat.
- **Récurrent :** MRR/ARR (Club + Rysmo+), churn, rétention 6/12 mois.
- **Valeur :** LTV, ratio LTV/CAC (cible > 3), panier moyen, multi-achat.
- **Engagement :** complétion formations, requêtes Rysmo/utilisateur, activité communautaire.

### Jalons (scénario Base)
| Jalon | Cible |
|---|---|
| Break-even mensuel (flux) | **Mois 4 (avril An1)** |
| Rentabilité annuelle | **An 1** |
| 1 000 acheteurs cumulés | An 3 |
| Part de CA récurrent > 25 % | An 4–5 (objectif) |
| Trésorerie cumulée > 170 M FCFA | An 5 |

---

## 16. Risques & analyse de sensibilité

| Risque | Impact | Atténuation |
|---|---|---|
| **Conversion plus faible** (Prudent) | Trésorerie négative dès An3 | Apport tampon, discipline OPEX, focus récurrent |
| **Dépendance aux formations** (~85 % du CA) | Volatilité du revenu | Accélérer Club & Rysmo+ (récurrent) |
| **Dépendance au fondateur** (audience/marque) | Risque clé-homme | Équipe contenu, capitaliser la communauté, intervenants |
| **Coût API Gemini** si usage Rysmo explose | Compression de marge | Quotas (déjà codés), packs payants, suivi COGS/abonné |
| **Concentration paiement (Bictorys)** | Risque opérationnel | Prévoir un PSP secondaire |
| **Charge de production de contenu** | Cadence | Calendrier éditorial, repurposing, n8n, freelances |
| **Change / inflation** | Marginal (coûts locaux XOF) | Tarifs en XOF, charges locales |

**Sensibilité — leviers à plus fort impact** (décroissant) : (1) **nombre d'inscrits gratuits** ; (2) **taux de conversion** ; (3) **ASP formation** ; (4) rétention Club. Une variation de ±1 pt du taux de conversion (4 % → 3 % ou 5 %) déplace le CA Base d'environ **±25 %**.

---

## 17. Recommandations

1. **Viser le scénario Base** avec un apport de **9 M FCFA** ; suivre mensuellement les inscrits gratuits et le taux de conversion (drivers n°1 et 2).
2. **Augmenter la part de récurrent** (Club + Rysmo+) au-delà de **25 % du CA** pour stabiliser trésorerie et valorisation.
3. **Tenir le ratio LTV/CAC > 3** : ne pas sur-investir en marketing tant que la conversion organique (audience fondateur) reste forte.
4. **Surveiller le COGS/abonné Rysmo+** (API Gemini) ; les packs payants doivent couvrir le coût marginal d'IA.
5. **Réduire le risque clé-homme** : prévoir un second PSP, formaliser la production de contenu (n8n), faire monter la communauté et des intervenants.

---

*Modèle et hypothèses entièrement documentés dans [`finance/model.py`](finance/model.py). Document de travail vivant — à recaler trimestriellement avec les données réelles de la plateforme (cohortes, MRR, churn, CAC/LTV).*
