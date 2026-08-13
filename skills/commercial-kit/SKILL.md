---
name: commercial-kit
description: >
  Commercial Kit Max-Morrys — référence partagée Sales/BD, SDR, Revenue Ops, Partnerships,
  Customer Success. Offre agence, ICP, process de vente, parrainage, pricing. À consulter
  avant toute action commerciale.
---

## Offre & modèle
- **Produits** : Club e-learning (abonnement, MRR), coach IA **Rysmo**, formations, contenus (blog/podcast/vidéo).
- **Services agence** (cf. `src/i18n/locales/fr/about.json`) : chatbots, **WhatsApp marketing**,
  formations B2B, accompagnement digital. ← à vendre par Sales/BD.
- **Agence « Digital Commerce Local »** : offre "done-for-you" pour petits commerces — site,
  catalogue Meta/WhatsApp/Merchant, fiche Google, mesure, SEO local, contenu automatisé.
  **Référence complète : `docs/OFFRE_AGENCE_TPE.md`** · **montants : `src/lib/agency/offer.ts`**.
- **Parrainage** : `ClubReferral` (existant) — levier d'acquisition à activer (Partnerships).
- **Pricing** : devise **XOF / FCFA**. Cible coût-conscient.

## Pricing agence (résumé — détail dans `docs/OFFRE_AGENCE_TPE.md`)

Modèle **setup-first** : la mise en place se vend seule, l'accompagnement se vend ensuite.

| Mise en place (unique) | Prix | Plancher |
|---|---:|---:|
| Présence Locale | 295 000 | 225 000 |
| **Commerce Visible** ⭐ offre principale | **495 000** | 400 000 |
| Boutique Digitale | 895 000 | 700 000 |

| Accompagnement | Mise en place | Mensuel |
|---|---:|---:|
| **Croissance Automatisée** ⭐ | 375 000 | 175 000 |
| Commerce 360 (6 mois) | 750 000 | 225 000 |

- Promo de lancement Présence Locale : **250 000**.
- Commerce 360 = **2 100 000 sur 6 mois** — toujours annoncer le total ET la décomposition.
- **Aucune remise sur la mise en place.** Les planchers ne sont jamais franchis.
- Options : produit suppl. 1 000–3 500 · page 35 000–75 000 · mesure avancée 75 000–350 000 ·
  automatisation sur mesure 125 000–250 000 · maintenance 45 000–75 000/mois ·
  référencement local 125 000–300 000/mois (engagement 6 mois).
- Conditions : **60% à la commande, 40% avant mise en ligne** · 2 séries de modifications incluses ·
  publicité, domaine, API et abonnements tiers exclus · **domaine et comptes au nom du client**.

### ⚠️ Le KPI qui décide de tout
En setup-first solo, chaque franc exige une nouvelle livraison — plafond ≈ 3–4 mises en place
par mois, soit ~20M XOF/an. **Ce qui casse ce plafond : le taux de conversion des clients livrés
vers un accompagnement mensuel. Cible ≥ 40%, mesuré à J+30** (fin du support inclus).
Préparer ce rendez-vous dès la livraison, avec le premier rapport chiffré en main.

## ICP (Ideal Customer Profile)
- **B2C** : entrepreneurs, freelances, créateurs, professionnels **d'Afrique francophone** voulant
  maîtriser le digital (formations, Club).
- **B2B (services agence)** : PME / TPE / créateurs francophones cherchant chatbots, WhatsApp marketing,
  présence digitale, formation d'équipe.
- **B2B (agence commerce local)** : commerce physique établi, 1–15 salariés, CA mensuel 800K–5M XOF,
  décideur unique joignable sur WhatsApp. Restaurants, prêt-à-porter, salons, pharmacies,
  quincailleries, écoles privées. Dakar, Abidjan, Cotonou.
  - **Bon signal** : page Facebook/Instagram existante mais mal tenue ; commandes WhatsApp désordonnées.
  - **À refuser** : veut "le site le moins cher" ; demande les accès aux outils d'automatisation ;
    exige un résultat chiffré garanti ; trésorerie visiblement tendue.

## Argumentaire — traduire la technique en bénéfice
Aucun terme technique dans un devis ou sur une page de vente.

| Technique | Ce que le commerçant achète |
|---|---|
| Site web | « Votre commerce visible 24h/24, même fermé » |
| Catalogue Meta / WhatsApp | « Vos produits commandables directement sur WhatsApp » |
| Merchant Center | « Vos produits affichés dans les résultats Google » |
| Fiche d'établissement Google | « Apparaître sur Google Maps quand on cherche votre métier dans votre quartier » |
| GA4, Tag Manager, Pixel | « Savoir combien de clients Internet vous rapporte » |
| Référencement SEO | « Passer devant vos concurrents sur Google » |
| Calendrier + automatisations | « Publier tous les jours sans y penser » |

**Ordre de démonstration en rendez-vous** : (1) ouvrir Google Maps devant lui, chercher son métier +
son quartier, lui montrer où il est ou n'est pas ; (2) comparer sa page sociale à celle d'un
concurrent régulier ; (3) seulement ensuite, parler des packs. **Ne jamais commencer par le site web.**

## Process de vente (gated)
1. **Diagnostic** — visibilité actuelle, canaux de contact réels. Lead → collection `agency_leads`.
2. **Priorités** — choix du pack selon maturité, budget, urgence.
3. **Preuves** — montrer concrètement ce qui sera livré, avant signature.
4. **Contrat** — devis (rédigé par Sales, **brouillon**) puis **closing = board humain**, jamais l'agent.
5. **Livraison** — formation + 30 à 60 jours de support. **Rendez-vous J+30 = conversion en accompagnement.**
6. Onboarding → Customer Success.

## Revenue Ops
- Suivi : MRR (Stripe→Firestore), LTV, CAC, taux de conversion signup→payant, churn.
- **Agence** : mises en place livrées, **taux de conversion J+30** (le KPI), clients en
  accompagnement, churn, **temps de livraison moyen**.
  Seuils d'alerte : livraison > 14h sur un Commerce Visible → pack sous-facturé ou processus à
  automatiser. Conversion < 30% → le problème est le rendez-vous J+30, pas le prix.
  Capacité : 3–4 mises en place/mois en solo. Recruter un assistant delivery dès que le carnet
  dépasse ce seuil deux mois d'affilée.
- **Parrainage agence** : 15% de la mise en place + 1 mois d'accompagnement offert au parrain,
  code `PRENOM-AGENCE`.

## Red lines (NON négociables)
- **AUCUN message sortant** (prospection, proposition, relance) à un prospect réel sans **approbation board**.
- Pas de cold-spam ; outbound SDR = séquences **brouillons**, ciblées, opt-out respecté.
- **Closing & engagement contractuel = humain** (board), jamais l'agent.
- **Ne jamais livrer les workflows n8n, gabarits Paperclip ou accès aux outils de production.**
  Le client achète un résultat, jamais l'outil. Les livrer supprime la marge et fabrique un concurrent.
  Au contrat : workflows et gabarits restent propriété Max-Morrys ; le client possède son domaine,
  son contenu publié et ses comptes. **Vocabulaire client : « vos publications préparées et
  programmées, vous validez d'un message ». L'option payante s'appelle « Automatisation sur mesure ».**
- **Ne jamais facturer à l'heure ou à la journée** — les TPE achètent un résultat, pas du temps.
- **Ne jamais vendre "SEO" ou "Analytics" en ligne isolée** à un petit commerce : invérifiable de son
  point de vue, donc perçu comme du vent et générateur de litiges.
- **Aucune obligation de résultat sur un canal tiers** (Meta, Google) : obligation de moyens explicite.
- **Validation humaine obligatoire avant toute publication** de contenu généré automatiquement.
- **Aucun démarrage sans acompte de 60% encaissé.**
- Aucun compte ne doit dépasser **25% du CA de la ligne** — refuser sa croissance plutôt que créer
  une dépendance.
- Voix Max-Morrys (brand kit) ; honnêteté (pas de promesses irréalistes) ; RGPD.
- **Un devis partageable (`agency_quotes`) ne contient JAMAIS de donnée personnelle** : le lien
  circule sur WhatsApp. Téléphone, email et nom du contact restent dans `agency_leads`.
