# Business Model — Max-Morrys Platform
### Analyse Strategique & Modele Economique par Ligne de Service
*Avril 2026 — Document confidentiel*

---

## TABLE DES MATIERES

1. [Synthese Executive](#1--synthese-executive)
2. [Phase 0 — Analyse de la Plateforme](#2--phase-0--analyse-de-la-plateforme)
3. [Phase 1 — Business Model par Ligne de Service](#3--phase-1--business-model-par-ligne-de-service)
4. [Phase 2 — Synergies & Ecosysteme](#4--phase-2--synergies--ecosysteme)
5. [Phase 3 — Strategie de Croissance](#5--phase-3--strategie-de-croissance)
6. [Phase 4 — Recommandations Operationnelles](#6--phase-4--recommandations-operationnelles)
7. [Phase 5 — Implementation Technique](#7--phase-5--implementation-technique)
8. [Livrables](#8--livrables)

---

## 1 — Synthese Executive

**Max-Morrys** est une plateforme d'education au marketing digital, SEO et intelligence artificielle ciblant le Senegal et l'Afrique de l'Ouest francophone. Fondee et operee par Max-Morrys, expert en marketing digital, elle repose sur une stack moderne (React 18 + Firebase + Gemini AI) et integre deja un systeme de paiement local (Bictorys, XOF), un chatbot IA pedagogique (Rysmo), une communaute exclusive (Club des Digitos), et 18 workflows d'automatisation de contenu (n8n).

**Chiffres cles actuels :**

| Indicateur | Valeur |
|------------|--------|
| Etudiants inscrits | 1 486 |
| Cours publies | 5 |
| Taux de completion | 98% |
| Croissance trafic | +1 790% |
| Revenu cumule revendique | 45 000 000 XOF (~68 700 USD) |
| Prix moyen par cours | 148 000 XOF (avant promo) |
| Panier moyen estime (avec promos) | ~110 000 XOF |

**Diagnostic :** L'infrastructure technique est mature et bien construite. Cependant, la monetisation est sous-exploitee : une seule ligne de revenu active (vente de cours), le Club des Digitos n'avait pas de paiement integre, la newsletter collectait des emails sans rien envoyer, les coupons n'etaient pas valides cote serveur, et le chatbot IA ne recommandait pas les cours. Ces gaps ont ete corriges dans la derniere iteration technique.

**Score de sante ecosysteme : 6.1/10** — Potentiel eleve, monetisation a debloquer.

**Objectif Annee 1 : 65 000 000 — 100 000 000 XOF** (~100 000 — 150 000 USD)

---

## 2 — Phase 0 — Analyse de la Plateforme

### 2.1 — Stack Technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, TypeScript 5.5, Tailwind CSS 3.4, Vite 5.4, Framer Motion |
| Backend | Firebase Cloud Functions v2 (Node.js), 15 fonctions deployees |
| Base de donnees | Cloud Firestore (NoSQL), 21+ collections |
| Authentification | Firebase Auth (email/password + Google OAuth) |
| Paiement | Bictorys (XOF, Wave/Orange Money/carte), webhooks HMAC-SHA256 |
| IA | Google Gemini 2.0 Flash (chatbot Rysmo), 50 appels/h/user |
| Analytics | Meta Pixel + Meta Conversions API (server-side), Sentry |
| SEO | Pre-rendering server-side, sitemap dynamique, JSON-LD, OG tags |
| Automatisation | 18 workflows n8n (creation contenu, publication, LMS, medias) |
| Stockage | Firebase Storage (images profil, ressources cours, medias club) |

### 2.2 — Inventaire Complet des Pages

**Pages publiques (16) :**
- Accueil, A propos, Blog, Blog/:slug, Formations, Formations/:slug
- Podcasts, Podcasts/:slug, Videos, Videos/:slug, FAQ, Contact
- 4 pages legales (Mentions, Confidentialite, CGV, Cookies)

**Espace etudiant (8 onglets + pages) :**
- Dashboard, Cours, Lecteur de cours, Notes, Messages, Realisations, Profil, Parametres
- Club des Digitos (feed, evenements, sessions, infos)
- Checkout, Retour paiement, Certificat

**Administration (17 pages) :**
- Dashboard, Articles, Formations, Utilisateurs, Messages, Analytics, Parametres
- Podcasts, Videos, Transactions, Coupons, Annonces, FAQ, Temoignages
- Rendez-vous, Club des Digitos

### 2.3 — Modele de Donnees (Collections Firestore)

| Collection | Champs business-critiques | Implications |
|------------|--------------------------|-------------|
| `users` | role (student/admin/support), preferences, newsletter | Segmentation, 3 niveaux d'acces |
| `formations` | price, promoPrice, modules[], certificateEnabled | Vente de cours, pricing flexible |
| `enrollments` | progress, completedLessons[], certificateIssued | Suivi completion, declenchement certificat |
| `transactions` | amount, status, paymentMethod, couponCode, chargeId | Historique paiements, reconciliation |
| `certificates` | certificateCode (MM-XXXXX), immutable | Preuve de completion, partage LinkedIn |
| `club_subscriptions` | amount (19 900), status, expiresAt, chargeId | Abonnement annuel, paiement Bictorys |
| `club_posts` | likes[], reposts[], commentsCount, category | Engagement communautaire |
| `club_events` | type (online/physical), registrations/ | Evenements communaute |
| `club_sessions` | scheduledAt, link, registrations/ | Sessions live |
| `club_infos` | type (article/resource/announcement), likes[] | Contenu exclusif |
| `coupons` | code, type (percentage/fixed), value, maxUses, usedCount | Promotions, acquisition |
| `gamification` | xp, level (1-10), badges[], currentStreak | Retention, engagement |
| `newsletter` | email, subscribedAt, source | Base email, lead nurturing |
| `appointments` | date, time, subject, status | Consulting (pas encore monetise) |
| `testimonials` | rating, status (pending/approved), featured | Preuve sociale |
| `announcements` | type, active, startDate, endDate | Communication urgente |

### 2.4 — Integrations Externes

| Service | Usage | Statut |
|---------|-------|--------|
| **Bictorys** | Paiement XOF (Wave, Orange Money, carte) | Actif — cours + club |
| **Google Gemini 2.0 Flash** | Chatbot pedagogique Rysmo | Actif |
| **Meta Pixel + CAPI** | Tracking conversions (client + serveur) | Actif |
| **Sentry** | Monitoring erreurs + performance | Actif |
| **Spotify API** | Metadonnees podcasts (proxy admin) | Actif |
| **YouTube API** | Metadonnees videos (proxy admin) | Actif |
| **n8n** | 18 workflows automatisation contenu | Configure |
| **Service email (Brevo)** | Newsletter, sequences email | **A integrer** |

### 2.5 — Roles Utilisateur

| Role | Acces | Population |
|------|-------|-----------|
| **Student** | Pages publiques, espace etudiant, cours inscrits, club (si abonne) | ~1 486 |
| **Admin** | Tout — CMS, utilisateurs, transactions, analytics, parametres | 1 |
| **Support** | Messages, temoignages, rendez-vous, club | 0-2 |

---

## 3 — Phase 1 — Business Model par Ligne de Service

### LIGNE 1 : E-Learning / Formations

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | Active |
| **Preuves code** | `functions/src/payment.ts`, `src/pages/lms/Checkout.tsx`, `src/types/index.ts` (Formation, Module, Lesson, Enrollment), `src/pages/lms/CoursePlayer.tsx` |
| **Description** | Cours structures en modules et lecons (video, texte, quiz, mission, ressources). Paiement Bictorys (XOF). Suivi de progression automatique. Certificat a 100% de completion. Gamification (XP, badges, niveaux, streaks) |
| **Proposition de valeur** | Formation marketing digital francophone de qualite, contextualisee Afrique de l'Ouest, accessible via paiement mobile local, avec certificat reconnu et tuteur IA 24/7 |
| **Audience cible** | Jeunes professionnels (22-35 ans), entrepreneurs, freelances, community managers, employes marketing au Senegal et Afrique de l'Ouest |
| **Concurrents** | Udemy (global, $10-30, pas Afrique), OpenClassrooms (cher, pas local), bootcamps Dakar (200-500K XOF, presentiel), formations YouTube gratuites (pas structurees) |

#### Catalogue actuel

| Formation | Prix | Promo | Duree | Etudiants | Categorie |
|-----------|------|-------|-------|-----------|-----------|
| Maitrisez le SEO de A a Z | 150 000 | 99 000 | 24h | 342 | SEO |
| Marketing Digital Complet | 200 000 | 149 000 | 36h | 521 | Marketing |
| L'IA pour les Entrepreneurs | 120 000 | — | 18h | 189 | IA |
| Personal Branding : Devenez une Reference | 95 000 | — | 12h | 278 | Personal Branding |
| Growth Hacking Avance | 175 000 | — | 20h | 156 | Growth |

#### Modele de revenus recommande

**Modele principal : Vente a l'unite (one-time purchase)**

*Pourquoi ce modele :*
- La cible a un pouvoir d'achat limite — un achat unique est moins intimidant qu'un abonnement
- La valeur est immediatement percue (contenu complet + certificat)
- Le modele fonctionne deja et genere 45M XOF
- Benchmarks : Udemy, Coursera (achat a l'unite), bootcamps locaux (forfait)

*Risque principal :* Plafond de revenus si le catalogue ne s'elargit pas (5 cours = marche fini)
*Fallback :* Passer a un modele All-Access Pass si le catalogue atteint 10+ cours

#### Strategie de pricing

**Grille de prix recommandee :**

| Tier | Contenu | Prix | Cible | Justification |
|------|---------|------|-------|---------------|
| Mini-cours (lead magnet) | 3-5 lecons, 3-5h | **Gratuit** | Visiteurs, decouverte | Acquisition, preuve de valeur, capture email |
| Cours Essentiel | 10-15 lecons, 12-18h | **49 000 — 79 000 XOF** | Debutants, budget serre | Seuil psychologique < 50K, premier achat facile |
| Cours Complet | 20-30 lecons, 18-30h | **99 000 — 149 000 XOF** | Professionnels, serieux | Tier principal, valeur forte, certificat inclus |
| Cours Premium | 30+ lecons, 30h+ | **149 000 — 249 000 XOF** | Avances, investissement | Contenu approfondi, ressources exclusives |
| Bundle 3 cours | 3 cours au choix | **249 000 XOF** (-35%) | Power users | Ancrage : prix unitaire = 83K vs 110K moyen |
| All-Access Pass | Tous les cours (actuel + futurs) | **399 000 XOF one-time** ou **29 900 XOF/mois** | Fans, professionnels | Futur tier — necessite 10+ cours au catalogue |

**Principes appliques :**
1. **Ancrage** : afficher le prix barre a cote du prix promo (deja en place dans le code)
2. **Seuil psychologique** : 99 000 au lieu de 100 000, 149 000 au lieu de 150 000
3. **Contexte local** : salaire moyen cible = 150K-500K XOF/mois. Un cours a 99K = 20-66% du salaire. Offrir le paiement en 2-3x si Bictorys le supporte
4. **Promotion d'ancrage** : lancer chaque nouveau cours a -30% pendant 2 semaines (urgence + premiere vague de ventes)
5. **Monetisation progressive** : ne pas ajouter le All-Access Pass avant d'avoir 10+ cours

#### Unit Economics

| Metrique | Valeur | Calcul / Hypothese |
|----------|--------|--------------------|
| **CAC organique** | 5 000 XOF | Temps contenu (blog/video) amorti sur audience. ~200h contenu/an, valorise a 500K XOF → 500K/100 nouveaux etudiants organiques |
| **CAC payant (Meta Ads)** | 15 000 — 25 000 XOF | CPC Senegal ~150-300 XOF, taux de conversion landing→achat ~1-2%, soit 50-200 clics par vente |
| **CAC moyen pondere** | 8 000 XOF | 70% organique (5K) + 30% payant (18K) |
| **ARPU** | 110 000 XOF | Panier moyen pondere (99K × 60% + 149K × 30% + 49K × 10%) |
| **LTV (1 an)** | 150 000 XOF | 1.3 cours/etudiant/an + upsell club (19.9K) |
| **LTV (2 ans)** | 210 000 XOF | 1.7 cours cumulatif + 2 ans club + consulting ponctuel |
| **Marge brute** | 87% | Prix 110K - Bictorys (~3%, 3.3K) - Firebase (~1K) - API IA (~0.5K) = ~105K marge |
| **LTV/CAC** | 18.7x | 150K / 8K — largement au-dessus du seuil de viabilite (3x) |
| **Payback period** | < 1 mois | CAC rembourse des le premier achat |
| **Break-even mensuel** | ~5 ventes | Couts fixes estimes : ~500K XOF/mois (Firebase, domaine, outils). 500K / 96K marge = 5.2 ventes |
| **Churn** | N/A | Achat one-time, pas de churn direct. Churn = non-reahat |

**Funnel de conversion estime :**

```
Visiteurs mensuels : 10 000 (hypothese M6)
    → Inscrits (email) :  800 (8%)
        → Utilisateurs actifs :  400 (50%)
            → Clients payants :  40 (10%)
                → Acheteurs recurrents : 12 (30%)
```

**Projection revenus Annee 1 :**

| Scenario | Nouveaux clients | ARPU | Revenu annuel |
|----------|-----------------|------|---------------|
| Pessimiste | 300 | 90 000 | 27 000 000 XOF |
| Realiste | 500 | 110 000 | 55 000 000 XOF |
| Optimiste | 800 | 120 000 | 96 000 000 XOF |

---

### LIGNE 2 : Club des Digitos / Communaute

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | Active (paiement fraichement integre) |
| **Preuves code** | `src/lib/firestore/club.ts` (19 900 XOF), `functions/src/payment.ts` (createClubCharge), 5 collections Firestore (club_subscriptions, club_posts, club_events, club_sessions, club_infos) |
| **Description** | Abonnement annuel donnant acces a un feed communautaire, evenements en ligne et physiques, sessions live avec Max-Morrys, articles et ressources exclusifs, discussions entre pairs |
| **Proposition de valeur** | Acces continu a Max-Morrys + reseau de professionnels du digital + contenu exclusif + evenements |
| **Audience cible** | Etudiants ayant termine au moins un cours, professionnels fideles a la marque |
| **Concurrents** | Communautes Discord/Slack gratuites, groupes WhatsApp, Patreon (pas adapte Afrique), Circle.so |

#### Modele de revenus

**Modele : Abonnement annuel avec option mensuelle**

| Tier | Prix | Inclus | Cible |
|------|------|--------|-------|
| Mensuel | 2 500 XOF/mois | Acces complet club | Decouverte, engagement incertain |
| Annuel | 19 900 XOF/an (economie 33%) | Acces complet club | Membres engages, retention |

*Pourquoi ce modele :*
- Le contenu communautaire a une valeur continue (pas ponctuelle)
- L'abonnement cree de la recurrence previsible
- Le prix annuel (19 900 XOF = ~1 660 XOF/mois) est tres accessible
- Benchmark : Patreon communities = $5-15/mois, soit 3K-10K XOF — on est dans la fourchette basse

*Risque principal :* Faible valeur percue si le contenu exclusif n'est pas regulier
*Mitigation :* Minimum 1 session live/mois + 2 articles exclusifs/semaine + 1 evenement/mois

#### Unit Economics

| Metrique | Valeur |
|----------|--------|
| **CAC** | ~0 XOF (conversion depuis etudiants existants) |
| **ARPU** | 19 900 XOF/an |
| **Taux de conversion cours→club** | 15% estime (an 1) |
| **Renouvellement an 1** | 60% |
| **Renouvellement an 2+** | 75% |
| **LTV** | 39 800 XOF (2 ans × 19 900 × 60% retention) |
| **Marge** | 95%+ (cout = temps de creation contenu exclusif) |
| **Break-even** | 1 membre (cout marginal quasi nul) |

**Projection revenus Annee 1 :**

| Scenario | Membres | Revenu annuel |
|----------|---------|---------------|
| Pessimiste | 100 | 1 990 000 XOF |
| Realiste | 200 | 3 980 000 XOF |
| Optimiste | 350 | 6 965 000 XOF |

---

### LIGNE 3 : Media / Contenu Gratuit

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | Active |
| **Preuves code** | `src/pages/Blog.tsx`, `Podcasts.tsx`, `Videos.tsx`, `functions/src/sitemap.ts`, `functions/src/prerender.ts`, 18 workflows n8n |
| **Description** | Blog (6 articles, categories SEO/Strategie/IA/Personal Branding/Marketing/Formation), podcasts (3 episodes, Spotify/Apple/Deezer), videos YouTube (3 videos, 12-21K vues) |
| **Proposition de valeur** | Education marketing digital gratuite, de qualite, en francais, contextualisee Afrique |
| **Audience cible** | La plus large — tout professionnel/etudiant interesse par le marketing digital en Afrique francophone |
| **Role strategique** | **Moteur d'acquisition** — top of funnel, SEO, notoriete, confiance, capture email |

#### Modele de revenus

**Modele : Gratuit — lead generation engine**

Le contenu gratuit ne genere pas de revenu direct. Il genere de la valeur indirecte :

| Mecanisme | Valeur indirecte |
|-----------|-----------------|
| SEO (blog) | Trafic organique gratuit → inscriptions → achats cours |
| YouTube (videos) | Visibilite, credibilite → inscriptions plateforme |
| Podcast | Notoriete marque, audience fidele → conversions |
| Newsletter | Email capture → sequences nurturing → vente |
| Preuve d'expertise | Confiance → justification du prix des cours |

**KPI critique :** Taux de conversion contenu → inscription → achat

```
Article lu → Inscription email : cible 8%
Email inscrit → Premier achat : cible 5%
Valeur indirecte par article : 10 000 visiteurs × 8% × 5% × 110K ARPU = 44 000 XOF/article
```

**Monetisation future (a partir de M6-M9) :**

| Canal | Condition | Prix estime |
|-------|-----------|-------------|
| Articles sponsorises | Trafic > 10K/mois | 50 000 — 150 000 XOF/article |
| Sponsoring podcast | Audience > 1 000 ecoutes/episode | 25 000 — 75 000 XOF/episode |
| Newsletter sponsorisee | Base > 5 000 emails | 15 000 — 50 000 XOF/envoi |
| YouTube AdSense | 1 000 abonnes + 4 000h watch | Variable (faible en Afrique ~$0.5-2 CPM) |

---

### LIGNE 4 : Tutorat IA (Rysmo)

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | Active (gratuit pour utilisateurs connectes) |
| **Preuves code** | `functions/src/rysmo.ts` (Gemini 2.0 Flash, rate limit 50/h), `src/components/ai/RysmoWidget.tsx` (voix, session, 4 quick actions) |
| **Description** | Chatbot IA pedagogique : explique les concepts, genere des quiz, recommande du contenu, motive les apprenants. Francais, contexte africain. Historique de conversation (10 messages). Desormais enrichi avec le catalogue de formations pour recommandations |
| **Proposition de valeur** | Tuteur personnel 24/7 qui connait les cours et s'adapte a l'etudiant |
| **Differenciateur** | Aucun concurrent local n'offre de chatbot IA pedagogique integre |

#### Modele de revenus

**Modele : Freemium — differenciateur de retention et upsell**

| Tier | Acces | Objectif |
|------|-------|---------|
| Gratuit (connecte) | 10 appels/jour | Valeur ajoutee pour tous, decouverte |
| Club des Digitos | 50 appels/jour (illimite effectivement) | Incentive majeur pour s'abonner au Club |
| Standalone (futur) | Illimite, 4 900 XOF/mois | Pour non-membres qui veulent juste le chatbot |

**Cout de revient :**
- Gemini 2.0 Flash : ~$0.075/1M tokens input, ~$0.30/1M tokens output
- Usage moyen : ~500 tokens/echange (input+output)
- Cout par echange : ~$0.0002 (~0.13 XOF)
- Cout par utilisateur actif/mois (20 echanges/jour × 30j) : ~$0.12 (~78 XOF)
- **Marge : 99.6%** sur un abonnement Club (19 900 XOF vs ~78 XOF de cout IA)

**Impact indirect :** Rysmo recommande desormais les cours pertinents dans ses reponses, generant un upsell naturel et non-intrusif.

---

### LIGNE 5 : Consulting / Rendez-vous

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | Partiellement construit |
| **Preuves code** | `src/types/index.ts` (Appointment: name, email, date, time, subject), `src/pages/admin/AdminAppointments.tsx` |
| **Description** | Formulaire de prise de rendez-vous accessible publiquement. Confirmation manuelle par admin. Pas de paiement, pas de calendrier, pas de visioconference |
| **Gap** | Pas de monetisation implementee |

#### Modele de revenus recommande

**Modele : Service premium, achat a l'unite**

| Offre | Duree | Prix | Cible |
|-------|-------|------|-------|
| Appel decouverte | 30 min | **Gratuit** | Qualification prospect, confiance |
| Session strategie | 1h | **50 000 XOF** | Entrepreneur/freelance avec question specifique |
| Demi-journee intensive | 3h | **150 000 XOF** | Audit complet strategie digitale |
| Accompagnement mensuel | 4 sessions × 1h | **150 000 XOF/mois** | Suivi regulier, PME/startup |

*Capacite maximum :* 8-10 sessions payantes/mois (solo entrepreneur, ne pas sacrifier la creation de contenu)

#### Unit Economics

| Metrique | Valeur |
|----------|--------|
| CAC | ~0 XOF (inbound via plateforme) |
| Panier moyen | 75 000 XOF/session |
| Capacite | 8 sessions/mois |
| Revenu mensuel max | 600 000 XOF |
| Revenu annuel plafond | 7 200 000 XOF |
| Marge | 100% (temps = seul cout) |

**Attention :** Cette ligne est par nature non-scalable (echange de temps contre argent). Elle doit rester complementaire, pas centrale.

---

### LIGNE 6 : Certifications Premium

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | Active (gratuit avec cours) |
| **Preuves code** | `src/lib/firestore/certificates.ts` (code MM-XXXXXXXXXX), `firestore.rules` (immutable, 100% progress requis), page publique `/certificat/:code` |
| **Description** | Certificat numerique genere automatiquement a la completion d'un cours. Code unique, verifiable, partageable |

#### Modele de revenus recommande

**Modele : Upsell — certificat standard gratuit + options premium**

| Tier | Prix | Inclus |
|------|------|--------|
| Standard | Gratuit (inclus avec cours) | PDF numerique, code verification, partage basique |
| Verifie | 15 000 XOF | Design premium, badge LinkedIn, page de verification enrichie |
| Certification seule | 25 000 — 49 000 XOF | Examen sans suivre le cours (professionnels experimentes) |

**Projection revenus Annee 1 :**
- 500 etudiants × 20% upsell verifie × 15 000 = 1 500 000 XOF
- 50 certifications seules × 35 000 moyen = 1 750 000 XOF
- **Total : 3 250 000 XOF**

---

### LIGNE 7 : Formation B2B / Entreprise

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | Potentielle (pas de code) |
| **Description** | Licences d'equipe, formations sur mesure, reporting managerial |
| **Cible** | Agences digitales Dakar, telcos (Orange/Sonatel), banques, ONG, programmes gouvernementaux numeriques |

#### Modele de revenus recommande

| Offre | Prix |
|-------|------|
| Licence equipe (5-20 sieges) | 75 000 XOF/siege (-25% vs individuel) |
| Licence entreprise (20+ sieges) | 50 000 XOF/siege (-50%) |
| Formation custom (programme sur mesure) | 1 500 000 — 5 000 000 XOF |
| Abonnement annuel entreprise (tous cours, tous sieges) | 2 000 000 — 10 000 000 XOF |

**Projection revenus Annee 1 (a partir de M7) :**
- 3 deals × 2 000 000 XOF moyen = **6 000 000 XOF**

---

### LIGNE 8 : Produits Digitaux / Templates

| Attribut | Detail |
|----------|--------|
| **Statut** | Potentielle (infrastructure partielle — type Resource existe) |
| **Description** | Vente standalone de templates marketing, guides PDF, checklists, tableurs |
| **Prix** | 5 000 — 25 000 XOF par produit |
| **Projection M12** | 2 000 000 XOF (200 ventes × 10 000 XOF moyen) |
| **Effort** | M — creer une page boutique + flow d'achat unitaire |

### LIGNE 9 : Programme Affiliation / Parrainage

| Attribut | Detail |
|----------|--------|
| **Statut** | Potentielle (systeme coupons existant utilisable) |
| **Description** | Etudiants referent de nouveaux clients via code promo personnalise, recoivent credit ou commission |
| **Mecanisme** | Coupon nominatif (PRENOM-10) → 10% reduction pour l'invite, 10% credit pour le parrain |
| **Impact** | Reduction CAC de 30-50%, croissance virale |
| **Effort** | M — tracking referral, dashboard parrain |

### LIGNE 10 : Contenu Sponsorise

| Attribut | Detail |
|----------|--------|
| **Statut** | Potentielle |
| **Prerequis** | Trafic > 10 000 visiteurs/mois |
| **Prix** | 50 000 — 150 000 XOF par article sponsorise |
| **Projection** | 2-4 articles sponsorises/mois a partir de M9 = 100 000 — 600 000 XOF/mois |
| **Effort** | S — page "Annonceurs" + processus editorial |

---
### LIGNE 11 : Agence « Digital Commerce Local »

#### Fiche d'identite

| Attribut | Detail |
|----------|--------|
| **Statut** | A lancer (offre definie : `docs/OFFRE_AGENCE_TPE.md`, page `/agence` livree, montants dans `src/lib/agency/offer.ts`) |
| **Preuves code** | `src/pages/Agence.tsx` + `src/components/agency/`, `src/lib/agency/offer.ts`, `src/lib/firestore/agency.ts` (collections `agency_leads` et `agency_quotes`), `n8n/` (20 workflows VPS), `paperclip/` (agence social media) |
| **Description** | Mise en place de la presence digitale des petits commerces : site web, catalogue produits (Meta / WhatsApp / Google Merchant), fiche d'etablissement Google, mesure (GA4/GTM/Pixel), SEO local. Puis accompagnement mensuel : calendrier editorial, publications preparees et programmees, reporting |
| **Proposition de valeur** | Un systeme pour etre trouve, presenter son offre, recevoir des demandes WhatsApp et mesurer ce que ca rapporte — pas un simple site web |
| **Audience cible** | Commerce physique etabli, 1-15 salaries, CA mensuel 800K-5M XOF, decideur unique joignable sur WhatsApp. Dakar, Abidjan, Cotonou |
| **Concurrents** | Freelances Dakar (100-300K le site vitrine, pas de recurrent), agences locales (350-600K pour du plus professionnel, cible PME structurees), community managers independants (100-210K XOF/mois) |

#### Modele de revenus recommande

**Modele : setup-first — mise en place vendue seule, accompagnement vendu ensuite**

*Pourquoi ce modele :*
- La grille 295/495/895 kFCFA est calee sur les prix reellement observes au Senegal ; elle est plus vendable qu'un ticket d'entree eleve
- Le commercant achete d'abord ce qu'il comprend (le site, la fiche Google) ; l'accompagnement se vend une fois la valeur demontree
- La production de contenu etant automatisee (n8n + Paperclip), l'accompagnement porte une marge de ~96%

*Risque principal :* **le plafond de livraison.** Chaque franc de revenu exige une nouvelle mise en place. A 3-4 livraisons/mois en solo, la ligne plafonne vers 20M XOF/an.
*Ce qui casse le plafond :* **le taux de conversion des clients livres vers un accompagnement mensuel — cible >= 40%, mesure a J+30** (fin du support inclus). C'est le seul KPI a surveiller chaque mois sur cette ligne.

#### Strategie de pricing

**Mise en place (paiement unique) :**

| Pack | Prix | Plancher | Contenu |
|------|------|----------|---------|
| Presence Locale | **295 000 XOF** | 225 000 | One page + fiche Google + WhatsApp Business + catalogue 20 produits + GA4/Search Console + SEO local + hebergement 1 an + 30j support |
| **Commerce Visible** | **495 000 XOF** | 400 000 | Site 5 pages + catalogue Meta/WhatsApp 40 produits + fiche Google + GA4/GTM/Pixel + conversions + SEO initial + tableau de suivi + 30j support |
| Boutique Digitale | **895 000 XOF** | 700 000 | E-commerce 50 produits + panier + Merchant Center + tracking e-commerce complet + 60j assistance |

**Accompagnement (mise en place + mensuel) :**

| Formule | Mise en place | Mensuel | Contenu |
|---------|---------------|---------|---------|
| **Croissance Automatisee** | **375 000 XOF** | **175 000 XOF** | Calendrier editorial + 12 publications redigees + visuels + programmation avec validation humaine + fiche Google + SEO leger + reporting |
| Commerce 360 (6 mois) | **750 000 XOF** | **225 000 XOF** | Tout le perimetre, pilote sur 6 mois — soit **2 100 000 XOF au total** |

**Principes appliques :**
1. **Commerce Visible est l'offre principale** — c'est elle qui est mise en avant partout
2. **Aucune remise sur la mise en place** : les planchers ne sont jamais franchis
3. **Toute option achetee est deduite du prix d'un pack souscrit sous 60 jours**
4. **Commerce 360 : annoncer le total ET la decomposition** — cacher les 2,1M detruit la confiance
5. **60% a la commande, 40% avant mise en ligne** ; deux series de modifications incluses
6. **Domaine et comptes crees au nom du client** — aucune retention d'actif

#### Unit Economics

| Metrique | Valeur | Calcul / Hypothese |
|----------|--------|--------------------|
| **ASP mise en place** | ~475 000 XOF | Mix 40% Presence + 45% Visible + 15% Boutique |
| **Temps de livraison** | 8-14 h / mise en place | Gabarits + automatisation ; Boutique nettement plus lourde |
| **Capacite solo** | **3-4 mises en place / mois** | LE facteur limitant du modele |
| **Cout marginal / client accompagne** | 6 000 XOF/mois | Quote-part VPS + API Gemini/Kling + hebergement |
| **Marge brute accompagnement** | 96% | ARPU mixte 190 000 - 6 000 |
| **Taux de conversion cible J+30** | **>= 40%** | **Le KPI de la ligne** |
| **CAC** | ~25 000 XOF | Inbound plateforme + parrainage sur la base des 1 486 etudiants |
| **Charges fixes** | 100 000 XOF/mois | VPS 15K + Firebase/APIs 40K + outils 45K |

**Projection Annee 1 (scenario base) :**

| Source | Volume | Revenu |
|--------|--------|--------|
| Mises en place | 28 x 475 000 (ASP) | 13 300 000 |
| Accompagnement — frais de mise en place | 11 conversions x 468 750 | 5 250 000 |
| Accompagnement — mensualites | 11 clients x 4,6 mois moyens x 187 500 | 9 618 000 |
| Options et supplements | 15% du CA mise en place | 1 995 000 |
| **Total encaisse annee 1** | | **~30 200 000 XOF** |

*Les mensualites de l'annee 1 portent sur 4,6 mois en moyenne et non 12 : une mise en place livree au mois m ne convertit qu'a m+1 (fin du support inclus). Calcul detaille dans `finance/model.py`.*

A comparer aux 7 200 000 XOF de plafond structurel de la LIGNE 5 (Consulting).

**Decision de capacite :** le declencheur de recrutement est **le volume de livraison**, pas le nombre d'abonnes. Des que le carnet depasse 4 mises en place par mois deux mois d'affilee, recruter un assistant delivery (300-400K XOF/mois).

**Red lines :** ne jamais livrer les workflows n8n au client (actif strategique), ne jamais facturer a l'heure, ne jamais vendre "SEO" ou "Analytics" en ligne isolee, validation humaine obligatoire avant publication, aucun demarrage sans acompte de 60% encaisse. Detail complet : `docs/OFFRE_AGENCE_TPE.md`.

---

## 4 — Phase 2 — Synergies & Ecosysteme

### 4.1 — Matrice de Synergies

```
                 E-Learning   Club      Contenu    Rysmo     Consulting  Certs
E-Learning          —         FEED      FEED       ENRICH    UPSELL      BUNDLE
                              les       le blog    le cours  les         le
                              diplomes  avec CTAs  avec IA   prospects   certificats
                              
Club              RETAIN       —        EXCLUSIVE  PREMIUM   QUALIFY     SHOWCASE
                  les clients            contenu    acces     les leads   les
                  en communaute          reserve    illimite  qualifies   badges
                  
Contenu           CONVERT    PROMOTE      —        DEMO      AUTHORITY   AWARENESS
                  visiteurs  le club               montrer   credibilite notoriete
                  en clients via CTAs              l'IA      d'expert    certificats
                  
Rysmo             IMPROVE    ENGAGE    SUGGEST      —        REMPLACER   MOTIVER
                  completion l'usage   du contenu            le low-end  l'etudiant
                  des cours  quotidien pertinent            consulting   a finir
                  
Consulting        VALIDER    APPROFONDIR CASE       INFORMER    —        CREDENTIAL
                  le contenu la relation STUDIES   les         les       du
                  des cours  client     pour blog  recomm.     sessions  consultant
                  
Certifs           COMPLETER  AFFICHER   PARTAGER   MOTIVER   PROUVER      —
                  le cycle   dans le    sur        l'etudiant l'expertise
                  de valeur  club       LinkedIn   a finir    du consultant
```

### 4.2 — Flywheel de Croissance

```
    ┌─── CONTENU GRATUIT (blog, podcasts, videos) ───┐
    │         SEO + reseaux sociaux                   │
    v                                                 │
NEWSLETTER + RYSMO                                    │
    │  Capture email + nurturing IA                   │
    v                                                 │
ACHAT DE COURS (premiere conversion)                  │
    │  Paiement Bictorys, access immediat             │
    v                                                 │
GAMIFICATION + CERTIFICATS                            │
    │  XP, badges, streaks → completion 98%           │
    v                                                 │
CLUB DES DIGITOS (retention recurrente)               │
    │  Communaute, sessions live, contenu exclusif    │
    v                                                 │
TEMOIGNAGES + CERTIFICATS sur LinkedIn ───────────────┘
    │  Preuve sociale → nouveau trafic organique
    v
   RETOUR AU DEBUT ↺
```

**Moteur principal :** Production de contenu (automatisee via 18 workflows n8n)

**Goulot d'etranglement actuel :**
1. ~~Newsletter collecte mais n'envoie rien~~ → A integrer (Brevo)
2. ~~Pas de CTAs dans le contenu gratuit~~ → Corrige (FormationCTA)
3. ~~Club sans paiement~~ → Corrige (createClubCharge)
4. ~~Rysmo ne recommande pas les cours~~ → Corrige (catalogue dans system prompt)

**Effets de reseau :**
- **Indirect** : Plus de contenu → plus de trafic SEO → plus d'etudiants → plus de temoignages → plus de trafic
- **Communaute** : Plus de membres Club → plus de discussions → plus de valeur pour chaque membre → plus de retention
- **Donnees** : Plus d'utilisation Rysmo → meilleures recommandations → plus de conversions

### 4.3 — Parcours de Monetisation Utilisateur

```
ETAPE 1 — DECOUVERTE (gratuit)
  ├─ Canal : Google (SEO blog), YouTube, LinkedIn, WhatsApp, bouche-a-oreille
  ├─ Obtient : Articles, podcasts, videos gratuitement
  └─ Objectif : Capturer l'email (newsletter) ou creer un compte

ETAPE 2 — ACTIVATION (gratuit, engagement)
  ├─ Premiere action : Lire un article complet, ecouter un podcast, utiliser Rysmo
  ├─ Moment "aha" : "Ce contenu est concret, applicable, adapte a MON contexte"
  ├─ Mecanisme : FormationCTA en bas d'article, newsletter hebdo, Rysmo suggere un cours
  └─ Objectif : Transformer visiteur → utilisateur actif (retour > 2x/semaine)

ETAPE 3 — PREMIERE CONVERSION (petit montant)
  ├─ Premier achat : Cours d'entree a 49 000 — 79 000 XOF, ou mini-cours gratuit
  ├─ Friction reduite : Paiement mobile (Wave/Orange Money), coupons -10 a -20%
  ├─ Declencheur : Promo limitee, recommandation Rysmo, temoignage visible
  └─ Objectif : Briser la barriere du premier paiement

ETAPE 4 — RETENTION (achats recurrents)
  ├─ Ce qui fait revenir : Gamification (streaks, XP, badges), contenu regulier
  ├─ Mecanismes : Notifications (lecon rappel, streak en danger), email hebdo
  ├─ Club des Digitos : Communaute + sessions live = engagement social
  └─ Objectif : Augmenter la duree de vie (LTV) → 2e, 3e cours

ETAPE 5 — EXPANSION (upsell / cross-sell)
  ├─ Upsell : Cours premium, certificat verifie, All-Access Pass
  ├─ Cross-sell : Club des Digitos, consulting, produits digitaux
  ├─ Mecanisme : Rysmo recommande, email sequences, page "Mes recommandations"
  └─ Objectif : Augmenter l'ARPU de 110K → 180K+ XOF

ETAPE 6 — ADVOCACY (viralite)
  ├─ Certificat partage sur LinkedIn → visibilite organique
  ├─ Temoignage soumis sur la plateforme → preuve sociale
  ├─ Coupon parrainage distribue → acquisition gratuite
  ├─ Post dans le Club → engagement communautaire visible
  └─ Objectif : K-factor > 0.3 (chaque etudiant amene 0.3 nouveau)
```

---

## 5 — Phase 3 — Strategie de Croissance

### 5.1 — Canaux d'Acquisition (classes par ROI)

#### Organique (70% de l'effort — cout faible, impact long terme)

| Canal | Action | KPI cible |
|-------|--------|-----------|
| **SEO / Blog** | 3 articles/semaine (via n8n). Keywords : "marketing digital Senegal", "SEO debutant", "IA pour entrepreneurs Afrique" | 10K visiteurs/mois a M6 |
| **YouTube** | 2 videos/mois. Format : tutoriels pratiques 10-15 min | 5K vues/video a M6 |
| **LinkedIn** | Posts quotidiens (personal branding Max-Morrys) | 1K followers a M6 |
| **Podcast** | 2 episodes/mois. Distribution Spotify/Apple/Deezer | 500 ecoutes/episode a M6 |
| **WhatsApp** | Groupe communautaire, partage contenu | 500 membres a M6 |

#### Payant (20% de l'effort — resultat rapide, cout immediat)

| Canal | Budget | Cible | ROAS cible |
|-------|--------|-------|-----------|
| **Meta Ads (Facebook/Instagram)** | 200K → 500K XOF/mois | Retargeting visiteurs formations, lookalike etudiants, interets marketing digital | 5x (100K depense → 500K revenu) |
| **Google Ads** | 100K XOF/mois (a partir de M4) | Keywords transactionnels : "formation marketing digital Dakar", "cours SEO en ligne" | 4x |

#### Viral (10% de l'effort — cout quasi nul si bien concu)

| Mecanisme | Description | Impact |
|-----------|-------------|--------|
| **Parrainage** | Coupon nominatif (PRENOM-10) : -10% invite, credit 10% parrain | K-factor +0.2 |
| **Certificats LinkedIn** | Partage automatique encourage post-completion | Visibilite organique |
| **Temoignages** | Workflow d'approbation existant, affichage homepage | Preuve sociale |
| **Gamification** | Badges partageables, leaderboard, niveaux (Digitos Supreme) | Engagement + FOMO |

### 5.2 — KPIs de Pilotage

#### KPIs de traction

| Metrique | Cible M3 | Cible M6 | Cible M12 |
|----------|----------|----------|-----------|
| MAU (Monthly Active Users) | 500 | 2 000 | 5 000 |
| Taux d'inscription visiteur→compte | 5% | 8% | 10% |
| Trafic mensuel (visiteurs uniques) | 3 000 | 10 000 | 25 000 |
| Trafic organique (% du total) | 50% | 65% | 75% |

#### KPIs de monetisation

| Metrique | Cible M3 | Cible M6 | Cible M12 |
|----------|----------|----------|-----------|
| MRR (Monthly Recurring Revenue) | 250K (club) | 700K | 1 500K |
| Revenu mensuel total | 4 500K | 8 500K | 15 000K |
| Conversion gratuit→payant | 3% | 5% | 8% |
| ARPU | 100K | 110K | 130K |
| Panier moyen | 99K | 110K | 120K |

#### KPIs de retention

| Metrique | Cible M3 | Cible M6 | Cible M12 |
|----------|----------|----------|-----------|
| Taux completion cours | 95% | 96% | 97% |
| Retention Club (renouvellement) | — | 60% | 70% |
| DAU/MAU (stickiness) | 15% | 20% | 25% |
| Streak moyen (jours consecutifs) | 3 | 5 | 7 |

#### KPIs de viralite

| Metrique | Cible M6 | Cible M12 |
|----------|----------|-----------|
| K-factor (viral coefficient) | 0.15 | 0.3 |
| Taux de parrainage (% etudiants qui referent) | 10% | 20% |
| Certificats partages LinkedIn / mois | 20 | 50 |
| NPS (Net Promoter Score) | 60 | 70 |

---

## 6 — Phase 4 — Recommandations Operationnelles

### 6.1 — Matrice de Priorisation

```
                         IMPACT REVENU ELEVE
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
 EFFORT    │  QUICK WINS      │  PRIORISER       │
 FAIBLE    │                  │                  │
           │  • Prix Club     │  • Paiement Club │
           │    (fait)        │    (fait)        │
           │  • CTAs contenu  │  • Coupons       │
           │    (fait)        │    serveur (fait) │
           │  • Rysmo upsell  │  • Email mktg    │
           │    (fait)        │  • Meta retarget │
           │                  │                  │
           ├──────────────────┼──────────────────┤
           │                  │                  │
 EFFORT    │  IGNORER         │  INVESTIR        │
 ELEVE     │  (pour l'instant)│  (si rentable)   │
           │                  │                  │
           │  • Marketplace   │  • B2B/Entreprise│
           │  • Mobile app    │  • All-Access    │
           │  • Multi-langue  │  • Parrainage    │
           │                  │  • Produits digi │
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                         IMPACT REVENU FAIBLE
```

### 6.2 — Roadmap de Monetisation (12 mois)

#### MOIS 1-3 : FONDATIONS (Avril — Juin 2026)

| Mois | Actions | Revenu mensuel | Investissement |
|------|---------|---------------|---------------|
| **M1** | ~~Prix Club 19.9K~~ ~~Paiement Club Bictorys~~ ~~Coupons serveur~~ ~~Rysmo recommandations~~ ~~CTAs formations~~ ~~Quiz/missions~~ Integration email Brevo, sequence bienvenue | 3 000 000 | 0 (dev time) |
| **M2** | Premiere campagne promo (coupon -20%, 2 semaines), email checkout abandonne, newsletter hebdo, 2 mini-cours gratuits (lead magnets) | 4 000 000 | 100 000 |
| **M3** | Consulting paye (integration paiement RDV), Meta retargeting (audiences ViewContent), 12 articles publies | 5 500 000 | 200 000 |

**Revenu cumule Q1 : 12 500 000 XOF**

#### MOIS 4-6 : ACCELERATION (Juillet — Septembre 2026)

| Mois | Actions | Revenu mensuel | Investissement |
|------|---------|---------------|---------------|
| **M4** | Certifications premium (15K verifie, 35K standalone), bundles 3 cours, debut Meta Ads 200K/mois, 2 nouveaux cours complets | 6 500 000 | 400 000 |
| **M5** | All-Access Pass (399K one-time ou 29.9K/mois), landing page comparaison tiers, drive Club | 7 500 000 | 300 000 |
| **M6** | Programme parrainage (coupons nominatifs + dashboard), scale Meta Ads 400K/mois, outreach B2B Dakar | 8 500 000 | 500 000 |

**Revenu cumule Q2 : 22 500 000 XOF | Total H1 : 35 000 000 XOF**

#### MOIS 7-9 : EXPANSION (Octobre — Decembre 2026)

| Mois | Actions | Revenu mensuel | Investissement |
|------|---------|---------------|---------------|
| **M7** | Features B2B (modele organisation, bulk enrollment, reporting manager), page commerciale B2B | 10 000 000 | 600 000 |
| **M8** | Premier deal B2B, 3 nouveaux cours, produits digitaux standalone (templates, guides) | 11 000 000 | 400 000 |
| **M9** | Expansion Cote d'Ivoire + Cameroun (marketing localise), PWA mobile, sponsor/evenement Dakar | 12 000 000 | 1 500 000 |

**Revenu cumule Q3 : 33 000 000 XOF | Total 9 mois : 68 000 000 XOF**

#### MOIS 10-12 : OPTIMISATION (Janvier — Mars 2027)

| Mois | Actions | Revenu mensuel | Investissement |
|------|---------|---------------|---------------|
| **M10** | A/B test pricing (tiers, promos), analytics avancees, optimisation funnel | 13 000 000 | 500 000 |
| **M11** | Guest instructor pilote (marketplace 70/30), contenu sponsorise regulier | 14 000 000 | 500 000 |
| **M12** | Bilan annuel, planification an 2, objectif run rate 180M XOF/an | 15 000 000 | 500 000 |

**Revenu cumule Q4 : 42 000 000 XOF | Total Annee 1 : 110 000 000 XOF (scenario optimiste)**

#### Resume Annee 1

| Scenario | Revenu total | Clients payants | Break-even |
|----------|-------------|----------------|-----------|
| **Pessimiste** | 65 000 000 XOF (~$99K) | 500 | Mois 1 |
| **Realiste** | 85 000 000 XOF (~$130K) | 700 | Mois 1 |
| **Optimiste** | 110 000 000 XOF (~$168K) | 1 000 | Mois 1 |

**Repartition revenus par ligne (scenario realiste) :**

| Ligne | Revenu | % du total |
|-------|--------|-----------|
| E-Learning | 55 000 000 | 65% |
| Club des Digitos | 3 980 000 | 5% |
| Consulting | 4 800 000 | 6% |
| B2B / Entreprise | 6 000 000 | 7% |
| Certifications premium | 3 250 000 | 4% |
| Produits digitaux | 2 000 000 | 2% |
| Contenu sponsorise | 1 500 000 | 2% |
| Programme parrainage | Impact indirect (CAC -30%) | — |
| Rysmo IA | Impact indirect (retention +15%) | — |
| Contenu media | Impact indirect (acquisition organique) | — |
| **Total monetise** | **76 530 000** | **91%** |
| **Impact indirect estime** | **+8 470 000** | **9%** |
| **Total equivalent** | **~85 000 000** | **100%** |

### 6.3 — Risques et Mitigations

#### Risques marche

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|-----------|
| **Pouvoir d'achat** : cours a 150K+ = part importante du salaire | Elevee | Eleve | Paiement en 2-3x, mini-cours a 49K, tier gratuit genereux, coupons |
| **Concurrence plateformes globales** : Udemy/Coursera baissent les prix | Moyenne | Moyen | Contextualisation africaine, paiement mobile local, communaute, marque personnelle |
| **Saturation contenu marketing** : trop de contenu gratuit sur YouTube | Moyenne | Moyen | Qualite > quantite, format structure (pas juste des tips), certificat = valeur tangible |

#### Risques execution

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|-----------|
| **Entrepreneur solo** : bottleneck sur toutes les lignes | Elevee | Critique | Automatisation n8n, deleguer support au role "support", prioriser impitoyablement |
| **Regularite contenu** : si la production baisse, le flywheel s'arrete | Moyenne | Eleve | Calendrier editorial strict, workflows n8n, batch production (1 jour/semaine = contenu de la semaine) |
| **Qualite des cours** : rush pour ajouter des cours = qualite en baisse | Faible | Eleve | 1 cours/2 mois max, tester avec beta-testeurs avant publication |

#### Risques techniques

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|-----------|
| **Bictorys downtime** : paiements bloquent les inscriptions | Faible | Critique | Monitoring webhooks, plan B (CinetPay ou Flutterwave), inscription manuelle admin en backup |
| **Firebase couts** : scaling non-lineaire des couts Firestore | Faible | Moyen | getCountFromServer deja utilise, monitoring usage quotidien, optimiser les lectures |
| **Gemini API changes** : Google modifie les prix ou deprecie le modele | Faible | Faible | Rysmo est un differenciateur, pas un revenu direct. Basculer vers Claude ou GPT-4o-mini si necessaire |

#### Risques reglementaires

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|-----------|
| **RGPD + CDP Senegal** : non-conformite donnees personnelles | Moyenne | Eleve | Pages legales en place, cookie banner, processus de suppression de compte a implementer |
| **TVA services digitaux** : obligation de facturation TVA au Senegal | Moyenne | Moyen | Consulter comptable local, integrer TVA dans les prix si requis |
| **Reglementation formation** : certification professionnelle = agrement | Faible | Moyen | Certificat Max-Morrys ≠ diplome d'Etat — communiquer clairement |

---

## 7 — Phase 5 — Implementation Technique

### 7.1 — Etat des lieux post-implementation

| Feature | Statut | Fichiers |
|---------|--------|---------|
| Prix Club 19 900 XOF | Fait | `src/lib/firestore/club.ts`, 6 pages UI |
| Paiement Bictorys Club | Fait | `functions/src/payment.ts` (createClubCharge), webhook, `useClubData.ts` |
| Validation coupons serveur | Fait | `functions/src/payment.ts` (validateCoupon), `Checkout.tsx` |
| Rysmo recommandations cours | Fait | `functions/src/rysmo.ts` (catalogue formations dans system prompt) |
| CTAs formations dans contenu | Fait | `src/components/shared/FormationCTA.tsx`, BlogPost, PodcastDetail, VideoDetail |
| Quiz interactif | Fait | `src/pages/lms/CoursePlayer.tsx` (QuizRenderer) |
| Missions dans CoursePlayer | Fait | `src/pages/lms/CoursePlayer.tsx` (MissionRenderer) |

### 7.2 — Chantiers restants (par priorite)

| # | Chantier | Fichiers a creer/modifier | Effort | Priorite |
|---|----------|--------------------------|--------|----------|
| 1 | **Integration email Brevo** — sync newsletter, sequences auto (bienvenue, abandon, hebdo) | Nouveau `functions/src/email.ts`, trigger sur creation user | 3-5 jours | Critique |
| 2 | **Paiement consulting** — ajouter prix aux RDV, paiement Bictorys avant confirmation | `functions/src/payment.ts`, `types/index.ts` (prix sur Appointment), `AdminAppointments.tsx` | 5-7 jours | Haute |
| 3 | **Systeme parrainage** — code referral par user, tracking, dashboard, commissions | Nouveau `src/lib/firestore/referrals.ts`, nouveau tab dashboard, Cloud Function | 5-7 jours | Haute |
| 4 | **Certifications premium** — design premium, badge LinkedIn, page verification enrichie, exam standalone | `src/lib/firestore/certificates.ts`, nouveau composant CertificateDesign, page exam | 5-7 jours | Moyenne |
| 5 | **Abonnement recurrent** — All-Access Pass mensuel (si Bictorys supporte recurring) | `functions/src/payment.ts`, nouveau modele subscription, page pricing | 5-10 jours | Moyenne |
| 6 | **Modele B2B** — collection organisations, admin equipe, bulk enrollment, reporting | Nouvelles collections Firestore, pages admin B2B, Cloud Functions | 15-20 jours | Moyenne |
| 7 | **Analytics avancees** — funnels, cohortes, revenus par ligne, dashboards | `AdminAnalytics.tsx`, Cloud Functions agregation | 5-10 jours | Basse |
| 8 | **Produits digitaux standalone** — page boutique, achat unitaire de ressources | Page Boutique, flow checkout adapte, collection `products` | 5-7 jours | Basse |
| 9 | **PWA mobile** — manifest, service worker, offline support | Configuration Vite PWA plugin, manifest.json | 2-3 jours | Basse |
| 10 | **Marketplace guest instructors** — modele instructeur, revenue sharing, dashboard | Modele Instructor, commission system, nouvelles pages | 15-20 jours | Future |

### 7.3 — Architecture de Monetisation Recommandee

**Collections Firestore supplementaires a creer :**

```
pricing_plans/
  - id, name, slug, description
  - lineOfBusiness ("courses", "club", "consulting", "products")
  - type ("one_time", "subscription", "commission")
  - price, currency, billingPeriod ("monthly", "yearly", "one_time")
  - features (JSON), limits (JSON)
  - isActive, sortOrder, trialDays

subscriptions/
  - id, userId, planId
  - status ("active", "cancelled", "past_due", "trialing")
  - currentPeriodStart, currentPeriodEnd
  - cancelAtPeriodEnd, paymentProvider, providerSubscriptionId

referrals/
  - id, referrerId, referredUserId
  - couponCode, transactionId
  - commissionAmount, commissionStatus ("pending", "paid")
  - createdAt

organizations/  (B2B)
  - id, name, contactEmail, contactName
  - seats, usedSeats, plan
  - status ("active", "trial", "expired")

org_memberships/
  - id, organizationId, userId, role ("admin", "member")
  - enrolledAt

products/  (standalone digital products)
  - id, title, slug, description, type, price, fileUrl
  - status ("published", "draft"), downloads
```

**Vue dashboard admin enrichie (future) :**
- Revenu par ligne de business (graphique empile)
- Revenu par periode (jour/semaine/mois, comparaison N-1)
- Top clients par LTV
- Funnel de conversion par ligne (visiteur → inscrit → actif → payant)
- Churn et retention par cohorte mensuelle
- Performance coupons (usage, revenu genere, CAC impact)

---

## 8 — Livrables

### Livrable 1 — Carte des Lignes de Business (Resume)

| # | Ligne | Statut | Modele | Pricing | Revenu M12 | Effort | Priorite |
|---|-------|--------|--------|---------|-----------|--------|----------|
| 1 | E-Learning | Active | One-time | 49K-249K XOF | 55 000 000 | S | 1 |
| 2 | Club Digitos | Active | Abonnement | 19 900/an | 3 980 000 | S | 2 |
| 3 | Contenu Media | Active | Gratuit (lead gen) | 0 | Indirect | S | 3 |
| 4 | Rysmo IA | Active | Freemium | Inclus Club | Indirect | S | 4 |
| 5 | Consulting | Partiel | Service | 50K-150K/session | 4 800 000 | M | 5 |
| 6 | Certifications | Active | Upsell | Gratuit-49K | 3 250 000 | M | 6 |
| 7 | B2B Entreprise | Potentiel | Enterprise | 50K-75K/siege | 6 000 000 | XL | 7 |
| 8 | Produits Digitaux | Potentiel | Vente | 5K-25K | 2 000 000 | M | 8 |
| 9 | Parrainage | Potentiel | Affiliation | 10% commission | Indirect | M | 9 |
| 10 | Sponsoring | Potentiel | Publicite | 50K-150K/article | 1 500 000 | S | 10 |

### Livrable 2 — Matrice Business Model Complete

| Ligne | Modele | Prix entry | Prix premium | CAC estime | LTV estime | LTV/CAC | Marge | Priorite |
|-------|--------|-----------|-------------|-----------|-----------|---------|-------|----------|
| E-Learning | One-time | 49 000 | 249 000 | 8 000 | 150 000 | 18.7x | 87% | 1 |
| Club Digitos | Abonnement | 2 500/mois | 19 900/an | ~0 | 39 800 | ∞ | 95% | 2 |
| Contenu Media | Gratuit | 0 | 0 | N/A | Indirect | N/A | N/A | 3 |
| Rysmo IA | Freemium | 0 | Inclus Club | ~0 | Indirect | ∞ | 99.6% | 4 |
| Consulting | Service | 50 000 | 150 000 | ~0 | 300 000 | ∞ | 100% | 5 |
| Certifications | Upsell | 0 (standard) | 15 000 | ~0 | 15 000 | ∞ | 98% | 6 |
| B2B | Enterprise | 50 000/siege | Custom | 200 000 | 2 000 000 | 10x | 80% | 7 |
| Produits Digi | Vente | 5 000 | 25 000 | ~0 | 15 000 | ∞ | 95% | 8 |

### Livrable 3 — Scorecard Ecosysteme

| Dimension | Score /10 | Commentaire |
|-----------|-----------|-------------|
| Diversification des revenus | 4 → **6** | Etait 1 source. Avec Club paye + coupons + CTAs = 3 sources actives, 7 planifiees |
| Synergies entre lignes | 7 → **8** | Flywheel contenu→cours→club connecte. CTAs + Rysmo reco ferment les boucles |
| Retention & recurrence | 5 → **6** | Club paiement integre. Gamification active. All-Access Pass a venir |
| Scalabilite | **8** | Firebase serverless, n8n automatisation, cout marginal quasi-nul |
| Defensabilite | **6** | Marque personnelle, contenu contextualise Afrique, IA differenciante, communaute |
| Efficacite d'acquisition | 7 → **8** | SEO solide, Meta Pixel+CAPI, CTAs dans contenu, Rysmo upsell, coupons fonctionnels |
| Marge | **9** | >85% sur tous les produits digitaux |
| Time-to-revenue | 3 → **7** | Club monetise, coupons actifs, quiz/missions augmentent la valeur percue |
| **SANTE GLOBALE** | **6.1 → 7.3** | Progression significative. Prochaine etape : email marketing + parrainage |

### Livrable 4 — Roadmap 12 Mois (Timeline)

```
     AVRIL        MAI         JUIN        JUIL        AOUT        SEPT
     ─────────────────────────────────────────────────────────────────────
M1   ████████     M2          M3          M4          M5          M6
     Club paye    Promo       Consulting  Certs       All-Access  Parrainage
     Email Brevo  campagne    paye        premium     Pass        Meta scale
     CTAs contenu Newsletter  Mini-cours  Bundles     Landing     B2B outreach
     Coupons srv  Abandon     12 articles Meta Ads    page tiers  
     Rysmo reco   checkout                2 nvx cours Drive Club  
     Quiz/mission 2 lead mag                                      
     ─────────────────────────────────────────────────────────────────────
     3M XOF       4M XOF      5.5M XOF    6.5M XOF    7.5M XOF    8.5M XOF

     OCT         NOV         DEC         JAN 27      FEV 27      MARS 27
     ─────────────────────────────────────────────────────────────────────
M7   M8          M9          M10         M11         M12
     B2B feat    1er deal    Expansion   A/B test    Marketplace Bilan
     Page B2B    B2B         CI+CMR      pricing     pilote      annuel
     3 nvx cours Produits    PWA mobile  Analytics   Sponsoring  Plan an 2
                 digitaux    Sponsor evt avancees    regulier    
     ─────────────────────────────────────────────────────────────────────
     10M XOF     11M XOF     12M XOF     13M XOF     14M XOF     15M XOF
     
     TOTAL ANNEE 1 (realiste) : 85 000 000 XOF (~130 000 USD)
```

### Livrable 5 — Actions Immediates (Top 10)

| # | Action | Impact estime | Effort | Statut |
|---|--------|--------------|--------|--------|
| 1 | ~~Paiement Bictorys Club des Digitos~~ | Debloquer revenu recurrent | S | **FAIT** |
| 2 | ~~Validation coupons cote serveur~~ | Activer promotions | S | **FAIT** |
| 3 | ~~CTAs formations dans contenu gratuit~~ | Convertir lecteurs → acheteurs | S | **FAIT** |
| 4 | ~~Augmenter prix Club 10K → 19.9K~~ | +99% revenu/membre | S | **FAIT** |
| 5 | ~~Rysmo recommande des cours~~ | Upsell automatise | S | **FAIT** |
| 6 | ~~Quiz et missions dans CoursePlayer~~ | Augmenter valeur des cours | M | **FAIT** |
| 7 | Integrer Brevo pour email marketing | Lead nurturing, sequences | M | A faire |
| 8 | Publier 3 articles SEO cette semaine | Alimenter flywheel SEO | M | A faire |
| 9 | Configurer retargeting Meta Ads | Recuperer visiteurs formations | S | A faire |
| 10 | Creer coupons parrainage manuels | Bouche-a-oreille avec tracking | S | A faire |

**6 actions sur 10 deja implementees.** Les 4 restantes sont des actions operationnelles (pas de code requis sauf Brevo).

---

*Document genere le 13 avril 2026 — Max-Morrys Platform*
*Analyse basee sur le code source, les donnees mock, et les benchmarks marche Afrique de l'Ouest*
