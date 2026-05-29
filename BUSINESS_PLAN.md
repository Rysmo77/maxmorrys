# Business Plan & Plan Financier 5 ans — Max-Morrys

**Société exploitante :** My Onoma SARL · **Marque :** Max-Morrys (maxmorrys.me)
**Siège :** Dakar, Sénégal · **Marché :** Afrique francophone (SN, CI, CM) + France
**Devise :** FCFA (XOF) — parité fixe 1 EUR = 655,957 FCFA
**Horizon :** 5 ans · **Point de départ :** pré-lancement (0 client en Année 1)
**Scénarios :** Prudent / Base / Optimiste

> Modèle financier reproductible : `finance/model.py`. Tableaux exportés en CSV dans `finance/`. Tous les montants sont en FCFA sauf mention contraire. Les conversions EUR sont indicatives.

---

## 1. Résumé exécutif

Max-Morrys est une plateforme **EdTech B2C francophone** combinant quatre sources de revenus complémentaires, déjà **codées et opérationnelles** dans la plateforme :

1. **Formations en ligne (LMS)** — achat unique, 95 000 à 200 000 FCFA — cœur du chiffre d'affaires.
2. **Club des Digitos** — abonnement communautaire récurrent à 19 900 FCFA/an.
3. **Rysmo+** — abonnements mensuels à l'assistant IA (3 000 / 7 500 FCFA/mois).
4. **Packs Rysmo** — micro-transactions (500 / 1 500 / 3 500 FCFA).

Le contenu gratuit (blog, podcasts, vidéos) constitue le **haut de funnel** d'acquisition.

### Synthèse financière (chiffre d'affaires & résultat net, FCFA)

| Scénario | CA An1 | CA An5 | Rés. net An1 | Rés. net An5 | Trésorerie fin An5 |
|---|--:|--:|--:|--:|--:|
| **Prudent** | 5 175 938 | 45 493 214 | −3 319 341 | −300 361 | **−3 174 505** |
| **Base** | 18 006 875 | 220 567 612 | 3 419 609 | 75 225 996 | **172 100 410** |
| **Optimiste** | 52 707 600 | 879 997 184 | 18 346 630 | 370 718 581 | **822 225 061** |

*CA An5 Base ≈ 336 300 € · CA An5 Optimiste ≈ 1 341 600 €.*

**Lecture clé :**
- En **scénario Base**, l'activité est rentable dès l'An 1 (marge brute > 90 %, modèle digital) et génère une trésorerie cumulée de **172 M FCFA** sur 5 ans, sans financement externe au-delà de l'apport initial de 9 M FCFA.
- En **scénario Optimiste**, le levier de l'audience existante du fondateur (+8 000 abonnés organiques) propulse le CA vers ~880 M FCFA en An 5.
- En **scénario Prudent**, l'activité approche seulement l'équilibre d'exploitation en An 5 et **la trésorerie devient négative dès l'An 3** : ce cas exige soit un financement complémentaire (~+4 M FCFA), soit une discipline accrue sur les charges de personnel/marketing. C'est le principal signal de vigilance du plan.

**Besoin de financement initial (apport recommandé) :** 6 M (Prudent) / **9 M (Base)** / 14 M (Optimiste) FCFA, principalement pour couvrir la rampe de lancement et le marketing d'amorçage.

---

## 2. Présentation

### 2.1 La marque
**« Max-Morrys — Maîtrisez le digital, accélérez votre croissance. »** Plateforme hybride de formation, de contenu et d'accompagnement au **marketing digital, à l'IA et à l'automatisation**, conçue pour l'Afrique francophone. Trois piliers :

- **Je te forme** — formations pratiques et actionnables (LMS + certificats).
- **Je t'informe** — blog, podcasts, vidéos.
- **Je te transforme** — communauté (Club) et tutorat IA (Rysmo).

### 2.2 Le fondateur (actif clé)
Max-Morrys Eyoum, basé à Dakar. Parcours panafricain (Cameroun → Côte d'Ivoire → Sénégal), Growth & Marketing Manager. Résultats prouvés : **+1 790 % de trafic web et +8 000 abonnés organiques en 18 mois**. Cette **audience préexistante** est le moteur de l'amorçage : elle justifie une conversion non nulle dès le lancement (≠ démarrage à froid).

### 2.3 Marché & cible
- **Géographie :** Sénégal (base), Côte d'Ivoire, Cameroun, diaspora + France.
- **Profils :** entrepreneurs, créateurs de contenu, marketers, PME/PMI, étudiants pro.
- **Paiement local adapté :** Wave, Orange Money, carte bancaire via **Bictorys** (XOF).

---

## 3. Offre & flux de revenus (tarifs vérifiés dans la plateforme)

| Flux | Modèle | Tarif (FCFA) | Rôle économique |
|---|---|---|---|
| Formations LMS (5 cours) | Achat unique | 95 000 / 120 000 / 150 000 (promo 99 000) / 175 000 / 200 000 (promo 149 000) | Revenu principal |
| Club des Digitos | Abonnement annuel | 19 900/an | Revenu récurrent + rétention |
| Rysmo+ Lite | Abonnement mensuel | 3 000/mois (20 req/j) | MRR |
| Rysmo+ Pro | Abonnement mensuel | 7 500/mois (100 req/j) | MRR |
| Packs Rysmo | Micro-transaction | 500 (30) / 1 500 (100) / 3 500 (300) | Monétisation des gratuits |
| Blog / Podcasts / Vidéos | Gratuit | 0 | Acquisition (SEO/social) |
| Certificats | Inclus | 0 | Valeur perçue / preuve sociale |

**Prix moyen formation (ASP) retenu** (mix plein tarif/promo, skew entrée de gamme) : 110 000 (Prudent) / 125 000 (Base) / 135 000 (Optimiste) FCFA.
**Prix mensuel Rysmo+ pondéré** (mix 70 % Lite / 30 % Pro) : 4 350 FCFA/mois.

---

## 4. Marché & positionnement

- **Tendance :** forte croissance de la demande de compétences digitales en Afrique francophone, pénétration mobile/mobile-money élevée, faible offre de formation **localisée en français** et orientée résultats.
- **Concurrence :** MOOC internationaux (peu localisés, paiement carte uniquement), formateurs individuels (offre fragmentée), écoles privées (présentiel, cher). 
- **Avantage Max-Morrys :** (1) ancrage local + paiement mobile money natif, (2) crédibilité fondateur mesurable, (3) **stack produit intégrée** (LMS + communauté + IA) augmentant la rétention et la valeur vie client, (4) automatisation (n8n) réduisant le coût de production de contenu.

---

## 5. Stratégie go-to-market

**Funnel :** Contenu gratuit (SEO, LinkedIn, podcasts) → inscription gratuite → **première formation** → upsell **Club** (communauté/récurrent) + **Rysmo+/packs** (engagement IA) → recommandation/parrainage.

- **An 1 :** capitaliser sur l'audience existante (warm leads), lancer 5 formations, activer Rysmo et le Club.
- **An 2–3 :** industrialiser l'acquisition payante (Meta/Google), enrichir le catalogue, augmenter la rétention Club.
- **An 4–5 :** effets de réseau (communauté), montée du récurrent (Club + Rysmo+), partenariats (ex. Académie Light).

---

## 6. Hypothèses du modèle (drivers)

Le moteur est un funnel : **inscrits gratuits → acheteurs → upsell récurrent**. Détail exporté dans `finance/hypotheses.csv`.

| Driver | Prudent | Base | Optimiste |
|---|--:|--:|--:|
| Nouveaux inscrits gratuits — An1 | 1 500 | 2 500 | 4 000 |
| Nouveaux inscrits gratuits — An5 | 13 000 | 30 000 | 65 000 |
| Conversion inscrit → acheteur formation | 2,5 % | 4,0 % | 6,0 % |
| Cours / acheteur / an | 1,10 | 1,25 | 1,40 |
| Prix moyen formation (ASP) | 110 000 | 125 000 | 135 000 |
| Adhésion Club (% des acheteurs) | 15 % | 25 % | 35 % |
| Rétention annuelle Club | 60 % | 70 % | 80 % |
| Abonnement Rysmo+ (% des inscrits) | 1,5 % | 2,5 % | 4,0 % |
| Durée moyenne abo Rysmo+ (mois) | 4,0 | 5,0 | 6,0 |
| Achat de packs Rysmo (% des inscrits) | 4 % | 7 % | 10 % |
| Achats de packs / acheteur / an | 1,5 | 2,0 | 2,5 |

**Coûts variables (COGS) :** commission Bictorys **3 %** des encaissements ; infrastructure **300 FCFA/inscrit/an** (Firebase + API Gemini sur quota gratuit + bande passante) ; **4 000 FCFA/abonné Rysmo+/an** (usage Gemini intensif).

**Charges d'exploitation (OPEX) :** personnel (montée en charge progressive), marketing (% du CA avec plancher), outils (n8n, Canva, email/CRM, IA), frais généraux (compta/juridique SARL, banque). **Impôt sur les sociétés : 30 %** (Sénégal) sur le résultat positif.

---

## 7. Prévisions de revenus par flux (FCFA)

Source : `finance/revenus_par_flux_5ans.csv`.

### Scénario Base
| Flux | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| Formations | 15 625 000 | 37 500 000 | 75 000 000 | 125 000 000 | 187 500 000 |
| Club Digitos | 497 500 | 1 542 250 | 3 467 575 | 6 407 302 | 10 455 112 |
| Rysmo+ (abos) | 1 359 375 | 3 262 500 | 6 525 000 | 10 875 000 | 16 312 500 |
| Packs Rysmo | 525 000 | 1 260 000 | 2 520 000 | 4 200 000 | 6 300 000 |
| **Total CA** | **18 006 875** | **43 564 750** | **87 512 575** | **146 482 302** | **220 567 612** |

### Scénario Prudent
| Flux | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| Formations | 4 537 500 | 10 587 500 | 18 150 000 | 27 225 000 | 39 325 000 |
| Club Digitos | 111 938 | 328 350 | 644 760 | 1 058 481 | 1 605 214 |
| Rysmo+ (abos) | 391 500 | 913 500 | 1 566 000 | 2 349 000 | 3 393 000 |
| Packs Rysmo | 135 000 | 315 000 | 540 000 | 810 000 | 1 170 000 |
| **Total CA** | **5 175 938** | **12 144 350** | **20 900 760** | **31 442 481** | **45 493 214** |

### Scénario Optimiste
| Flux | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| Formations | 45 360 000 | 124 740 000 | 272 160 000 | 476 280 000 | 737 100 000 |
| Club Digitos | 1 671 600 | 5 934 180 | 14 776 944 | 29 373 355 | 50 662 184 |
| Rysmo+ (abos) | 4 176 000 | 11 484 000 | 25 056 000 | 43 848 000 | 67 860 000 |
| Packs Rysmo | 1 500 000 | 4 125 000 | 9 000 000 | 15 750 000 | 24 375 000 |
| **Total CA** | **52 707 600** | **146 283 180** | **320 992 944** | **565 251 355** | **879 997 184** |

> Les formations représentent **~85 %** du CA. Le récurrent (Club + Rysmo+) monte de ~10 % (An1) à ~12 % (An5) du CA — levier de prévisibilité à renforcer.

---

## 8. Compte de résultat prévisionnel (P&L)

Source : `finance/compte_resultat_5ans.csv`.

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

### EBITDA & résultat net — comparatif scénarios (FCFA)
| | An1 | An2 | An3 | An4 | An5 |
|---|--:|--:|--:|--:|--:|
| EBITDA — Prudent | −3 319 341 | −2 405 963 | −1 828 400 | −1 320 440 | −300 361 |
| EBITDA — Base | 4 885 156 | 15 793 562 | 36 994 431 | 67 861 727 | 107 465 709 |
| EBITDA — Optimiste | 26 209 472 | 79 463 890 | 184 574 920 | 334 760 976 | 529 597 973 |
| Net — Prudent | −3 319 341 | −2 405 963 | −1 828 400 | −1 320 440 | −300 361 |
| Net — Base | 3 419 609 | 11 055 494 | 25 896 102 | 47 503 209 | 75 225 996 |
| Net — Optimiste | 18 346 630 | 55 624 723 | 129 202 444 | 234 332 683 | 370 718 581 |

*En Prudent, l'EBITDA reste négatif sur tout l'horizon (pas d'IS dû), l'équilibre n'étant approché qu'en An5.*

---

## 9. Plan de trésorerie / cash-flow

Source : `finance/cashflow_tresorerie_5ans.csv` et `finance/tresorerie_mensuelle_an1.csv`. Base **encaissement** (les encaissements suivent le CA, settlement Bictorys quasi immédiat).

### 9.1 Trésorerie mensuelle — Année 1 (scénario Base)
Apport initial **9 000 000 FCFA** (janvier). Rampe de lancement progressive. *IS exclu (payable l'année N+1).*

| Mois | Encaissements | Décaissements | Flux net | Trésorerie cumulée |
|---|--:|--:|--:|--:|
| Jan | 383 125 | 752 058 | −368 933 | 8 631 067 |
| Fév | 574 688 | 810 587 | −235 899 | 8 395 168 |
| Mar | 766 250 | 869 116 | −102 866 | 8 292 302 |
| Avr | 957 812 | 927 644 | 30 168 | 8 322 470 |
| Mai | 1 149 375 | 986 174 | 163 201 | 8 485 672 |
| Jun | 1 340 938 | 1 044 703 | 296 235 | 8 781 907 |
| Jul | 1 532 500 | 1 103 231 | 429 269 | 9 211 175 |
| Aoû | 1 724 062 | 1 161 760 | 562 302 | 9 773 477 |
| Sep | 1 915 625 | 1 220 289 | 695 336 | 10 468 813 |
| Oct | 2 107 188 | 1 278 819 | 828 369 | 11 297 183 |
| Nov | 2 490 312 | 1 395 875 | 1 094 437 | 12 391 619 |
| Déc | 3 065 000 | 1 571 463 | 1 493 537 | 13 885 156 |

**Point bas de trésorerie An1 (Base) : 8 292 302 FCFA (mars)** — l'apport de 9 M couvre largement la rampe. Le **flux mensuel devient positif dès avril** (mois 4). Trésorerie fin An1 avant IS : 13 885 156 ; après provision IS (1 465 547) : **12 419 609** (cf. tableau annuel).

### 9.2 Trésorerie annuelle — 5 ans (FCFA)
| Scénario | Poste | An1 | An2 | An3 | An4 | An5 |
|---|---|--:|--:|--:|--:|--:|
| **Base** | Encaissements | 18 006 875 | 43 564 750 | 87 512 575 | 146 482 302 | 220 567 612 |
| | Décaissements | 14 587 266 | 32 509 256 | 61 616 473 | 98 979 094 | 145 341 616 |
| | Flux net | 3 419 609 | 11 055 494 | 25 896 102 | 47 503 209 | 75 225 996 |
| | **Trésorerie cumulée** | **12 419 609** | **23 475 103** | **49 371 205** | **96 874 414** | **172 100 410** |
| **Prudent** | Flux net | −3 319 341 | −2 405 963 | −1 828 400 | −1 320 440 | −300 361 |
| | **Trésorerie cumulée** | 2 680 659 | 274 696 | **−1 553 704** | **−2 874 144** | **−3 174 505** |
| **Optimiste** | Flux net | 18 346 630 | 55 624 723 | 129 202 444 | 234 332 683 | 370 718 581 |
| | **Trésorerie cumulée** | 32 346 630 | 87 971 353 | 217 173 797 | 451 506 480 | 822 225 061 |

*Décaissements = COGS + OPEX + IS. Apport initial inclus dans la trésorerie cumulée An1.*

> **Alerte trésorerie (Prudent) :** la trésorerie passe sous zéro dès l'An 3. Mesures correctrices : porter l'apport à ~10 M FCFA, **ou** plafonner le marketing à son plancher et différer une embauche, **ou** accélérer le récurrent (Club/Rysmo+) qui améliore la prévisibilité sans coût d'acquisition marginal.

---

## 10. Indicateurs clés (scénario Base)

| Indicateur | Valeur | Commentaire |
|---|--:|---|
| Marge brute | **~91,5 %** | Économie digitale ; COGS = paiement + IA/hébergement |
| CAC (coût d'acquisition acheteur) An2 | **~40 000 FCFA** | Marketing An2 / acheteurs (≈ 9,58 M / 240) |
| LTV brute par acheteur | **~142 000 FCFA** | ASP 125 000 × 1,25 cours × marge 91 % (hors upsell Club/Rysmo) |
| **Ratio LTV / CAC** | **~3,5×** | Sain (> 3 recommandé) ; supérieur avec upsell récurrent |
| ARR récurrent (Club + Rysmo+) An5 | **~26,8 M FCFA** | Base de revenus prévisibles à développer |
| Mois de break-even (flux mensuel, An1) | **Mois 4 (avril)** | Atteint grâce à l'audience initiale |
| Part du CA récurrent | **10 → 12 %** | Levier stratégique : viser > 25 % |

---

## 11. Analyse de risques & sensibilité

| Risque | Impact | Atténuation |
|---|---|---|
| **Conversion plus faible** (scénario Prudent) | Trésorerie négative dès An3 | Apport tampon, discipline OPEX, focus récurrent |
| **Dépendance aux formations (~85 % du CA)** | Volatilité du revenu | Accélérer Club & Rysmo+ (récurrent) |
| **Dépendance au fondateur** (audience/marque) | Risque clé-homme | Construire l'équipe contenu, capitaliser la communauté |
| **Coût API Gemini** si usage Rysmo explose | Compression de marge | Quotas (déjà codés), packs payants, surveillance COGS/abonné |
| **Concentration paiement (Bictorys)** | Risque opérationnel | Prévoir un PSP secondaire |
| **Change / inflation** | Marginal (coûts locaux XOF) | Tarifs en XOF, charges locales |

**Sensibilité — leviers à plus fort impact** (du plus au moins sensible) : (1) **nombre d'inscrits gratuits** (acquisition), (2) **taux de conversion en acheteur**, (3) **ASP formation**, (4) rétention Club. Une variation de ±1 pt du taux de conversion (4 % → 3 % ou 5 %) déplace le CA Base d'environ ±25 %.

### Recommandations
1. **Viser le scénario Base** avec apport de **9 M FCFA** ; suivre mensuellement les inscrits gratuits et le taux de conversion (drivers n°1 et 2).
2. **Augmenter la part de récurrent** (Club + Rysmo+) au-delà de 25 % du CA pour stabiliser la trésorerie et la valorisation.
3. **Tenir le ratio LTV/CAC > 3** : ne pas sur-investir en marketing tant que la conversion organique (audience fondateur) reste forte.
4. **Surveiller le COGS/abonné Rysmo+** (API Gemini) ; les packs payants doivent couvrir le coût marginal d'IA.
5. **Prévoir un second PSP** et formaliser la production de contenu (n8n) pour réduire la dépendance fondateur.

---

*Modèle et hypothèses entièrement documentés dans `finance/model.py`. Pour mettre à jour les projections, modifier les drivers dans le dictionnaire `SCEN` et relancer `python3 finance/model.py` — les CSV et les totaux se recalculent automatiquement.*
