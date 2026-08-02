# Offre Agence — « Digital Commerce Local »

> Document de référence commercial. Marché : Sénégal et Afrique de l'Ouest francophone (XOF).
> Modèle : **setup-first** — mise en place vendue seule, accompagnement mensuel vendu ensuite.
> Delivery : solo appuyé sur l'automatisation (VPS n8n + Paperclip).
> *Août 2026 — Document confidentiel*

**Source de vérité technique des montants : [`src/lib/agency/offer.ts`](../src/lib/agency/offer.ts).**
Toute modification de prix doit être répercutée ici, dans ce module, dans
`skills/commercial-kit/SKILL.md`, dans `finance/model.py` et dans `functions/src/prerender.ts`.

---

## 1 — Positionnement

**Ce que nous vendons :** un système pour être trouvé, présenter son offre, recevoir des demandes WhatsApp et mesurer ce que ça rapporte.

**Ce que nous ne vendons pas :** des prestations techniques à l'unité.

Un commerçant n'achète pas « GA4, Tag Manager ou n8n ». Il achète plus de visibilité, plus de demandes WhatsApp et plus de clarté sur ses résultats. Toute la communication — page web, devis, argumentaire — est formulée du côté du résultat.

### Avantage compétitif

La production de contenu est automatisée (n8n sur VPS + Paperclip « Maxmorrys Social »). Le coût marginal d'un contenu supplémentaire est proche de zéro. C'est ce qui rend l'accompagnement mensuel rentable là où un community manager humain à Dakar facture 150 000 – 250 000 XOF pour le même volume.

**Cet avantage n'est durable que si les outils ne sortent jamais de l'entreprise.** Voir §7.

### ⚠️ La contrainte structurelle du modèle setup-first

En setup-first solo, **chaque franc de revenu exige une nouvelle livraison**. À 3–4 mises en place par mois maximum, le plafond de la ligne est d'environ **20M XOF/an**.

Ce qui casse ce plafond : **la conversion des clients livrés vers un accompagnement mensuel.**

> **KPI central de la ligne : taux de conversion ≥ 40%, mesuré à J+30** (fin du support inclus).
> C'est la seule métrique à surveiller chaque mois. En dessous de 30%, la ligne est rentable mais bornée et le temps de livraison devient le facteur limitant absolu.

---

## 2 — ICP (Ideal Customer Profile)

Commerce physique établi, 1 à 15 salariés, CA mensuel 800 000 – 5 000 000 XOF, décideur unique joignable sur WhatsApp.

| Segment | Pourquoi il achète | Pack naturel |
|---|---|---|
| Restaurants, fast-food, pâtisseries | Google Maps + photos = réservations directes | Commerce Visible |
| Prêt-à-porter, chaussures, cosmétiques | Catalogue WhatsApp = canal de vente réel | Commerce Visible ou Boutique |
| Salons de beauté, barbiers, spas | Avis Google + publication régulière | Présence Locale → Croissance |
| Pharmacies, cliniques, cabinets | Crédibilité, horaires, itinéraire | Présence Locale |
| Quincailleries, matériaux, pièces auto | Catalogue + être trouvé sur requête produit | Commerce Visible |
| Écoles privées, centres de formation | Saisonnalité des inscriptions, preuve sociale | Commerce 360 |

### Bons signaux
- Page Facebook ou Instagram existante mais mal tenue → il croit au digital, il manque de temps.
- Commandes WhatsApp reçues de façon désordonnée → la valeur du catalogue est immédiate.
- Il répond lui-même au téléphone → décideur unique, cycle de vente court.

### À refuser
- Il veut « le site le moins cher possible » → il occupera du temps de livraison sans jamais revenir.
- Il demande les accès aux outils d'automatisation → hors périmètre (§7).
- Il exige un résultat chiffré garanti → obligation de moyens uniquement, sinon litige assuré.
- Trésorerie visiblement tendue → il ne paiera pas le solde.

---

## 3 — Grille tarifaire

### 3.1 Mise en place (paiement unique)

| Pack | Prix | Contenu |
|---|---:|---|
| **Présence Locale** | **295 000** | Site one page · boutons WhatsApp et appel · fiche Google optimisée · catalogue WhatsApp 20 produits · GA4 + Search Console · SEO local de base · hébergement 1 an · formation · 30 jours de support |
| **Commerce Visible** ⭐ | **495 000** | Site vitrine 5 pages · catalogue Meta + WhatsApp 40 produits · fiche Google optimisée · GA4 + GTM + Pixel Meta · conversions clés suivies · SEO initial · formulaire et boutons WhatsApp · tableau de suivi · hébergement 1 an · 30 jours de support |
| **Boutique Digitale** | **895 000** | E-commerce ≤ 50 produits · panier et gestion des commandes · commande ou assistance WhatsApp · catalogues Meta + Google Merchant · fiche Google · GA4 + GTM + Pixel · tracking e-commerce complet · SEO initial · formation · 60 jours d'assistance |

- Promo de lancement **Présence Locale : 250 000**.
- **Planchers absolus** (jamais affichés, garde-fous internes) : Présence 225 000 · Visible 400 000 · Boutique 700 000. Aucune exception.
- ⭐ **Commerce Visible est l'offre principale.** C'est celle qui est mise en avant partout et vers laquelle le sélecteur oriente par défaut.
- Boutique Digitale : à proposer uniquement quand le client a déjà des produits, des prix clairs et une logistique minimale.

### 3.2 Accompagnement (mise en place + mensuel)

| Formule | Prix | Contenu |
|---|---:|---|
| **Croissance Automatisée** ⭐ | **375 000 + 175 000/mois** | Calendrier éditorial mensuel · 12 publications rédigées · visuels préparés · publications programmées avec validation humaine · mise à jour fiche Google · SEO local léger · reporting mensuel · maintenance |
| **Commerce 360** | **750 000 + 225 000/mois** (6 mois) | Site ou catalogue avancé · fiches Google, Meta et WhatsApp · Merchant Center si pertinent · analytics, pixels et reporting · SEO local et contenu · automatisations · accompagnement commercial |

**Commerce 360 = 2 100 000 XOF sur 6 mois.** Toujours annoncer le total ET la décomposition : « 750 000 pour construire l'écosystème, puis 225 000 par mois pour le faire fonctionner ». Cacher le total détruit la confiance dès la première facture.

### 3.3 Options à la carte

Ce qui protège la marge : périmètre clair, options facturées, maintenance séparée.

| Option | Fourchette |
|---|---:|
| Produits supplémentaires | 1 000 à 3 500 / produit |
| Pages supplémentaires | 35 000 à 75 000 / page |
| Mesure avancée (Looker Studio, e-commerce, événements) | 75 000 à 350 000 |
| Automatisation sur mesure | 125 000 à 250 000 |
| Maintenance | 45 000 à 75 000 / mois |
| Référencement local | 125 000 à 300 000 / mois (engagement 6 mois) |

**Facturation des produits :** ne jamais proposer « produits illimités ». 1 000 XOF/produit si les informations et photos sont propres ; 2 000 à 3 500 XOF si rédaction, recadrage et catégorisation sont à faire. La photographie produit est facturée séparément.

### 3.4 Conditions commerciales

- **60% à la commande, 40% avant mise en ligne.** Aucun démarrage sans acompte encaissé.
- **Deux séries de modifications incluses.** Au-delà, facturé.
- **Exclus :** publicité, nom de domaine, API et abonnements tiers.
- **Facturés à part :** produits, pages et automatisations supplémentaires.
- **Référencement mensuel :** engagement recommandé de 6 mois.
- **Validation humaine obligatoire** avant toute publication, y compris automatisée.
- **Maintenance = corrections et suivi**, pas de nouvelles fonctionnalités.
- **Domaine et comptes créés au nom du client.** Ils lui appartiennent, quoi qu'il arrive.

---

## 4 — Argumentaire : traduire la technique en bénéfice

| Terme technique | Ce que le commerçant achète |
|---|---|
| Conception de site web | « Votre commerce visible 24h/24, même fermé » |
| Catalogue Meta / WhatsApp | « Vos produits commandables directement sur WhatsApp » |
| Google Merchant Center | « Vos produits affichés dans les résultats Google » |
| Fiche d'établissement Google | « Apparaître sur Google Maps quand on cherche votre métier dans votre quartier » |
| GA4, Tag Manager, Pixel | « Savoir combien de clients Internet vous rapporte » |
| Référencement SEO | « Passer devant vos concurrents sur Google » |
| Calendrier + workflows n8n | « Publier tous les jours sans y penser » |

### Ordre de démonstration en rendez-vous

1. **Ouvrir Google Maps devant lui** et chercher son métier + son quartier. Lui montrer qui apparaît, et où il est. C'est la démonstration la plus efficace de toute l'offre — elle ne coûte rien et elle est irréfutable. *(C'est exactement ce que fait le bloc interactif en haut de `/agence`.)*
2. **Ouvrir la page Facebook d'un concurrent** qui publie régulièrement, et la sienne.
3. **Seulement ensuite**, parler des packs.

Ne jamais commencer par le site web : c'est ce qu'il croit vouloir, et c'est la partie la moins déterminante pour son résultat.

---

## 5 — Process commercial

| Étape | Ce qui se passe |
|---|---|
| **Diagnostic** | Identifier la visibilité actuelle et les canaux de contact réels. |
| **Priorités** | Choisir le pack selon maturité, budget et urgence. |
| **Preuves** | Montrer concrètement ce qui sera livré : pages, catalogue, fiche, mesure. |
| **Contrat** | 60% à la commande, 40% avant mise en ligne. |
| **Livraison** | Formation à la prise en main, puis 30 à 60 jours de support selon le pack. |

**Le moment décisif est J+30**, à la fin du support inclus : c'est là que se joue la conversion vers l'accompagnement mensuel. Préparer ce rendez-vous dès la livraison, avec le premier rapport chiffré en main.

---

## 6 — Traitement des objections

| Objection | Réponse |
|---|---|
| « C'est trop cher » | « Combien vaut un nouveau client pour vous ? » — s'il répond 15 000 XOF, Commerce Visible est remboursé à 33 clients. Ramener le prix à l'unité de valeur du commerçant, jamais le défendre dans l'absolu. |
| « Mon neveu peut me faire un site » | « Il peut, oui. Ce qu'il ne fera pas, c'est votre fiche Google, votre catalogue WhatsApp, la mesure de ce que ça rapporte, et douze publications par mois pendant un an. » Un site est un objet ; ce que nous vendons est un système. |
| « Je veux juste le site » | Au tarif plein, sans négociation. Dire franchement qu'un site sans entretien perd sa position en quelques mois — avant, pas après. |
| « Je vais réfléchir » | Ne pas relancer dans le vide. Envoyer sous 48h l'audit gratuit de sa fiche Google par WhatsApp : capture de sa position actuelle, 3 problèmes, 1 correction offerte. Crée une dette de réciprocité et démontre la compétence. |
| « Combien de clients me garantissez-vous ? » | Aucune garantie chiffrée, jamais. « Je garantis la qualité de ce qui est installé et la régularité de ce qui est publié. Le nombre de clients dépend aussi de votre offre et de vos prix, sur lesquels je n'ai pas la main. » |
| « Et si j'arrête ? » | Domaine, contenus et comptes sont à votre nom depuis le premier jour. Ils restent les vôtres. Dit à la signature, pas à la rupture. |
| « Pourquoi payer chaque mois ? » | « Parce que Google Maps et Instagram ne récompensent pas ce qui est fait une fois. Un site laissé à l'abandon six mois disparaît des résultats. » |

---

## 7 — Red lines opérationnelles

1. **Ne jamais livrer les workflows n8n, les gabarits Paperclip ou les accès aux outils de production.** Le client achète un résultat (« vos publications programmées »), jamais l'outil. Les remettre revient à supprimer sa propre marge et à fabriquer un concurrent. Au contrat : les workflows et gabarits restent propriété de Max-Morrys ; le client possède son domaine, ses comptes et son contenu publié.
   → Sur la page publique et les devis, la formule employée est **« vos publications préparées et programmées, vous validez d'un message »**. L'option payante s'appelle **« Automatisation sur mesure »**, jamais « workflow n8n ».

2. **Ne jamais facturer à l'heure ou à la journée.** Les TPE achètent un résultat. Facturer au temps plafonne le revenu et transforme chaque gain de productivité en perte de chiffre d'affaires.

3. **Ne jamais vendre « SEO » ou « Analytics » en ligne isolée** à un petit commerce : invérifiable de son point de vue, donc perçu comme du vent et générateur de litiges. Toujours reformulé en bénéfice, toujours intégré à un pack.

4. **Validation humaine obligatoire avant toute publication.** Le contenu est généré automatiquement, jamais publié automatiquement.

5. **Aucune obligation de résultat sur un canal tiers.** Meta et Google modifient leurs règles unilatéralement. Obligation de moyens explicite aux CGV.

6. **Aucun démarrage sans acompte encaissé.**

7. **Aucun compte ne doit dépasser 25% du chiffre d'affaires de la ligne.** Refuser sa croissance plutôt que créer une dépendance.

---

## 8 — Unit economics

| Métrique | Valeur | Base |
|---|---:|---|
| ASP mise en place | **~475 000 XOF** | Mix 40% Présence (295K) · 45% Visible (495K) · 15% Boutique (895K) |
| Temps de livraison par mise en place | 8 – 14 h | Gabarits + automatisation ; Boutique Digitale est nettement plus lourde |
| **Capacité solo** | **3 – 4 mises en place / mois** | C'est LE facteur limitant du modèle setup-first |
| Coût marginal / client en accompagnement | ~6 000 XOF/mois | Quote-part VPS + API Gemini/Kling + hébergement |
| Marge brute accompagnement | **~96%** | 190 000 (ARPU mixte) − 6 000 |
| Temps opérateur / client en accompagnement | 1h30 – 2h/mois | Validation contenu + rapport |
| **Taux de conversion cible J+30** | **≥ 40%** | **Le KPI de la ligne** |
| CAC | ~25 000 XOF | Inbound plateforme + parrainage |
| Charges fixes | ~100 000 XOF/mois | VPS 15K + Firebase/APIs 40K + outils 45K |

### Trajectoire année 1 (scénario base)

| | Volume | Revenu |
|---|---:|---:|
| Mises en place | 28 × 475 000 (ASP) | **13 300 000** |
| Accompagnement — frais de mise en place | 11 conversions × 468 750 | **5 250 000** |
| Accompagnement — mensualités | 11 clients × 4,6 mois moyens × 187 500 | **9 618 000** |
| Options et suppléments (15% du CA mise en place) | — | **1 995 000** |
| **Total encaissé année 1** | | **~30 200 000 XOF** |

*Les mensualités de l'année 1 portent sur 4,6 mois en moyenne, pas 12 : une mise en place livrée au mois m ne convertit qu'à m+1 (fin du support inclus) et ne facture donc que 11−m mois. Calcul détaillé dans [`finance/model.py`](../finance/model.py).*

À comparer aux 7 200 000 XOF de plafond structurel de la LIGNE 5 (Consulting).

### Décision de capacité

Le déclencheur de recrutement n'est **pas** le nombre d'abonnés mais **le volume de livraison**. Dès que le carnet dépasse 4 mises en place par mois deux mois d'affilée, recruter un assistant delivery (300 000 – 400 000 XOF/mois). Le recrutement prend deux mois, la saturation se voit en deux semaines.

---

## 9 — Acquisition

**Canal prioritaire — la base existante.** Les ~1 486 étudiants inscrits sur la plateforme : une part significative tient un commerce ou en connaît un. CAC quasi nul. Le parrainage réutilise `coupons` et `ClubReferral` : **15% de la mise en place + 1 mois d'accompagnement offert** au parrain, code `PRENOM-AGENCE`.

**Canal secondaire — l'audit gratuit.** Audit de fiche Google envoyé sous 48h par WhatsApp : capture de la position actuelle, 3 problèmes identifiés, 1 correction appliquée gratuitement. ~15 minutes avec les gabarits.

**À éviter au démarrage — la publicité payante.** Avec un CAC inbound proche de zéro et un plafond de capacité à 3–4 livraisons/mois, dépenser en acquisition payante n'a aucun sens tant que le carnet n'est pas plein.

---

## 10 — Risques et antidotes

| Risque | Antidote |
|---|---|
| **Plafond de livraison** (le risque n°1 du modèle setup-first) | Conversion ≥ 40% en accompagnement · recrutement déclenché sur le volume de livraison · industrialisation continue des gabarits |
| **Churn de l'accompagnement** | Rapport mensuel **chiffré** (appels via la fiche Google, messages WhatsApp, visites) qui rend la valeur visible · engagement 6 mois sur le SEO |
| **Client mono-prestation** qui ne revient jamais | Toute option achetée est déduite du prix d'un pack souscrit sous 60 jours |
| **Qualité du contenu auto-généré** | Validation humaine systématique · charte de marque par client · 3 refus d'affilée = revue du prompt client |
| **Dépendance aux plateformes tierces** | Obligation de moyens explicite · jamais de résultat garanti |
| **Fuite de l'actif d'automatisation** | Clause de propriété au contrat (§7-1) · aucun accès client aux instances n8n |
| **Concentration client** | Aucun compte > 25% du CA de la ligne |

---

## 11 — Validation avant industrialisation

1. **Test de désirabilité.** 5 entretiens de découverte avec des commerçants réels de Dakar. Question d'ouverture : « qu'est-ce qui vous empêche aujourd'hui d'avoir plus de clients ? ». Jamais « voulez-vous un site ? ».
2. **Test des paliers.** Présenter les 3 packs aux 10 premiers prospects et mesurer où se situe le refus. Si personne ne refuse Commerce Visible, la grille est trop basse.
3. **Chronométrer la première livraison Commerce Visible de bout en bout.** Au-delà de 14h, le pack est sous-facturé ou le processus demande plus d'automatisation avant d'être vendu à l'échelle.
4. **Suivi mensuel** : mises en place livrées, **taux de conversion J+30**, clients en accompagnement, churn, temps de livraison moyen.
5. **Revue à M6.** Si la conversion est sous 30%, le problème est le rendez-vous J+30 et le rapport chiffré, pas le prix.

---

## Annexe — Récapitulatif

```
MISE EN PLACE                      Prix      Plancher
  Présence Locale                295 000     225 000   (promo lancement 250 000)
  Commerce Visible ⭐            495 000     400 000   ← offre principale
  Boutique Digitale              895 000     700 000

ACCOMPAGNEMENT              Mise en place    Mensuel
  Croissance Automatisée ⭐      375 000     175 000
  Commerce 360                   750 000     225 000   (6 mois = 2 100 000)

OPTIONS
  Produit supplémentaire     1 000 – 3 500 / produit
  Page supplémentaire       35 000 – 75 000 / page
  Mesure avancée            75 000 – 350 000
  Automatisation sur mesure 125 000 – 250 000
  Maintenance               45 000 – 75 000 / mois
  Référencement local      125 000 – 300 000 / mois

CONDITIONS   60% commande / 40% avant mise en ligne · 2 séries de modifs
             domaine et comptes au nom du client · validation humaine avant publication

KPI CENTRAL  Taux de conversion en accompagnement à J+30 ≥ 40%
```
