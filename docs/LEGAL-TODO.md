# Alignement juridique — points à traiter

> **Ce document n'est pas un avis juridique.** Il signale des écarts constatés entre ce que la
> plateforme publie et ce que le code exécute ou que les documents corporate établissent. Le
> développement du site ne constitue en aucun cas une validation juridique.

Destinataire : représentant légal de MY ONOMA SARL, avec l'appui d'un conseil juridique
sénégalais.

_Dernière mise à jour : 13 août 2026._

---

## 1. Prix du Club des Digitos — **écart contractuel, priorité haute**

### Constat — pièces à l'appui

Les CGV publiées sur le site annoncent un prix, le code en débite un autre.

| Source | Montant | Référence |
| --- | --- | --- |
| **CGV, article 3** | **10 000 FCFA / an** | `src/i18n/locales/fr/legal.json:126` |
| Code de paiement (Cloud Functions) | **19 900 FCFA** | `functions/src/payment.ts:249` |
| Code de paiement (Cloudflare Worker) | **19 900 FCFA** | `worker/apps/api/src/lib/bictorys.ts:123` |
| Interface du Club | **19 900 FCFA / an** | `src/i18n/locales/fr/club.json:111,140,144` |

Texte exact des CGV :

> « **Club des Digitos**, communauté privée payante en abonnement annuel (**10 000 FCFA / an**),
> donnant accès à un fil d'actualité, à des discussions, à des sessions live, à des événements
> et à des contenus exclusifs. »

### Écart

Le client est débité de **9 900 FCFA de plus** que le montant figurant dans les conditions
générales de vente qu'il accepte. Les CGV sont le document contractuel opposable ; c'est donc
le site qui est en écart avec lui-même, et l'interface comme le code sont alignés **contre** le
contrat.

L'article 5.4 précise par ailleurs un engagement de douze (12) mois à compter du paiement, ce
qui donne à l'écart une portée sur toute la durée de l'abonnement.

### Action attendue

1. Trancher le prix qui fait foi.
2. Corriger la source erronée — **la correction n'a pas été faite ici** : modifier un prix
   contractuel ou un montant débité est une décision commerciale et juridique, pas un
   correctif de code.
3. Déterminer le traitement des abonnements déjà encaissés à 19 900 FCFA sous des CGV
   affichant 10 000 FCFA.

### Règle appliquée dans le code

Aucun des quatre emplacements n'a été modifié.

---

## 2. Données corporate publiées — incomplètes

### Constat

Les mentions légales et les CGV nomment déjà **My Onoma SARL** comme éditeur et opérateur de la
marque Max-Morrys, avec RCCM et NINEA. L'adresse publiée est toutefois réduite à la ville.

| Champ | Publié sur le site | Établi par l'avis d'immatriculation |
| --- | --- | --- |
| Dénomination | MY ONOMA SARL — _aligné sur le dépôt corporate ; le pied de page affichait « My Onoma SARL » avant ce chantier_ | MY ONOMA SARL |
| Forme juridique | _absente_ | Société à Responsabilité Limitée (SARL) |
| RCCM | SN DKR 2022 B 11134 | SN DKR 2022 B 11134 ✅ |
| NINEA | 009319501 | 009319501 ✅ |
| Capital social | 100 000 FCFA | 100 000 FCFA ✅ |
| Siège social | « Dakar, Sénégal » | Quartier Ouakam, Cité Batrain, Lot 384 — Dakar, Sénégal |
| Date de création | _absente_ | 06/04/2022 |

Source des valeurs de droite : `My-onoma/apps/web/src/lib/brand/company.ts`, lui-même sourcé de
l'avis d'immatriculation délivré par le Ministère de l'Économie, du Plan et de la Coopération
(immatriculation du 11/04/2022).

### À vérifier

1. **Orthographe et casse exactes de la dénomination.** Le site écrit « My Onoma SARL » ;
   les gabarits contractuels (`docs/AGENCE_DOCUMENTS_CONTRACTUELS.md`) écrivent « MY ONOMA
   SARL ». C'est la graphie du registre qui fait foi.
2. **Adresse à publier.** Confirmer que l'adresse complète du siège doit figurer aux mentions
   légales et sur les factures émises par le tunnel de paiement.

### Règle appliquée dans le code

Les données corporate sont centralisées dans [`src/lib/brand/company.ts`](../src/lib/brand/company.ts).
Tout champ non confirmé reste `null` et **n'est pas rendu** : ni valeur inventée, ni mention
« à compléter » en façade.

---

## 3. Deux adresses e-mail publiées

| Adresse | Où |
| --- | --- |
| `contact@maxmorrys.me` | CGV art. 2 et art. 9, CGU, politique de confidentialité, cookies |
| `hello@maxmorrys.me` | Pied de page, page Contact, `src/components/seo/seo-config.ts` |

Les documents contractuels désignent une adresse que le site n'affiche nulle part ailleurs.

### Action attendue

Désigner l'adresse de contact opposable, et confirmer que l'autre reste routée.

### Règle appliquée dans le code

Aucune des deux n'a été supprimée. `hello@maxmorrys.me` a été centralisée dans
`src/lib/brand/company.ts` ; l'adresse des documents légaux reste inchangée dans `legal.json`
tant que l'arbitrage n'est pas rendu.

---

## 4. Relation Max-Morrys Agency / MY ONOMA

Le site publie désormais :

> Max-Morrys Agency est la practice Product, AI, Technology & Brand de MY ONOMA.

Le site corporate publie la formulation symétrique **« Max-Morrys Agency — operated by
MY ONOMA »**, avec la précision que les prestations contractualisées sous MY ONOMA sont
réalisées par MY ONOMA SARL.

**Max-Morrys Agency est une marque commerciale, pas une personne morale.** Aucune donnée
structurée ne crée d'`Organization` autonome portant ce nom.

### Action attendue

Vérifier que cette formulation correspond à un accord écrit : licence de marque, apport
d'affaires ou autre montage. Confirmer également qui contracte avec le client final selon le
canal d'entrée — `maxmorrys.me/agence` ou le site corporate.

Tant que la fonction de Max-Morrys au sein de MY ONOMA n'est pas confirmée, le site ne la
mentionne pas. Voir [CONTENT-TODO.md §4](./CONTENT-TODO.md), qui signale une mention
préexistante et divergente dans la frise de la page À propos.

---

## 5. Objet social et activité affichée

Le dépôt corporate documente (`My-onoma/docs/LEGAL-ALIGNMENT-TODO.md §1`) que l'activité
principale immatriculée est :

> **ACTIVITÉS DE SOUTIEN AUX ENTREPRISES N.C.A.**

Cette rubrique résiduelle **ne mentionne ni** l'édition de logiciels, **ni** le développement
d'applications, **ni** l'exploitation de plateformes numériques.

Or maxmorrys.me exploite une plateforme de formation payante, encaisse des paiements, et
présente désormais une activité de conception de produits numériques et de systèmes IA.

### Règle appliquée dans le code

Le site **n'écrit jamais** que les activités logicielles sont couvertes par l'objet social.
Aucune page, aucun texte légal et aucune donnée structurée ne formule une telle affirmation.

### Action attendue

Faire examiner par un conseil l'opportunité d'une mise à jour statutaire couvrant explicitement
l'édition de logiciels, le développement de plateformes et l'exploitation de services numériques.

---

## 6. CGV et périmètre des prestations

Les CGV actuelles couvrent les **formations en ligne et services de la plateforme** :
inscription, accès aux cours, Club des Digitos, sessions live, remboursement sous 7 jours.

Elles ne couvrent **ni** les prestations de studio désormais présentées sur `/agence`
(conception produit, ingénierie logicielle, systèmes IA, architecture), **ni** l'offre
« Digital Commerce Local » déplacée vers `/presence-digitale`.

Pour cette dernière, des gabarits contractuels distincts existent déjà
(`docs/AGENCE_DOCUMENTS_CONTRACTUELS.md`) — mais ils portent leur propre avertissement :
_« Ces gabarits sont des bases de travail, pas un avis juridique »_, et laissent le régime de
TVA applicable en suspens.

### Action attendue

Faire rédiger des conditions couvrant les prestations de studio : propriété intellectuelle des
livrables, cession de droits, réversibilité, maintenance, niveaux de service, confidentialité,
sous-traitance. Trancher le régime de TVA applicable à MY ONOMA SARL.

---

## 7. Traitement des données

### Newsletter — consentement

Avant ce chantier, le formulaire d'inscription n'enregistrait **aucun consentement** : pas de
case à cocher, pas de lien vers la politique de confidentialité, aucun champ stocké.

Un consentement explicite a été ajouté — **jamais pré-coché** — accompagné du lien vers la
politique de confidentialité. La règle Firestore correspondante plafonnait la charge utile à
trois clés (`firestore.rules`, collection `newsletter`) : ce plafond a été relevé en même temps,
faute de quoi toute inscription aurait échoué.

### Action attendue

1. Confirmer la durée de conservation des adresses collectées.
2. Décider si un double opt-in est requis. **Il n'a pas été mis en place** : cela suppose un
   envoi d'e-mail transactionnel, donc un prestataire — aucun ESP n'est branché dans le dépôt.
3. La politique de confidentialité mentionne des outils de mesure d'audience : vérifier que
   la liste correspond exactement à ce qui est réellement chargé (GTM, GA4, Meta Pixel).

### Règles Firestore

✅ **Déployées le 13 août 2026.** Les 29 tests de `tests/firestore-rules/rules.test.ts` passent
contre le fichier de production (émulateur, JDK 21).

⚠️ Rappel pour la suite : la CI **ne déploie que le hosting**. Ni les règles, ni les index, ni
les Cloud Functions, ni les Workers. Toute modification ultérieure de `firestore.rules` exige
un `firebase deploy --only firestore:rules` manuel.

⚠️ **Les deux nouvelles règles sont exactement à leur plafond de clés**, par construction :

| Collection | Charge utile maximale | Plafond |
| --- | --- | --- |
| `newsletter` | 5 clés (`email`, `subscribedAt`, `source`, `consent`, `consentAt`) | `<= 5` |
| `engagement_leads` | 12 clés (7 obligatoires + `website`, `routedTo`, `locale`, `status`, `createdAt`) | `<= 12` |

Ajouter **un seul** champ à l'un de ces formulaires sans relever le plafond correspondant fera
échouer **100 %** des soumissions en production, silencieusement. Le test
« accepte le payload MAXIMAL » existe précisément pour que cette rupture soit détectée avant la
mise en ligne — mais le job `rules-tests` de la CI est **non bloquant** : il faut lire son
résultat, il n'arrêtera pas un déploiement.

---

## 8. Pages légales et bilinguisme

Le site est bilingue FR/EN et les pages légales sont **traduites** en anglais
(`src/i18n/locales/en/legal.json`), sans mention désignant la version faisant foi.

### Action attendue

Désigner explicitement la version qui fait foi — en pratique le français, seule langue des
documents contractuels et du droit applicable (droit sénégalais, OHADA, tribunaux de Dakar,
CGV art. 10). Si la version anglaise doit rester opposable, la faire valider par un conseil.

---

## 9. Récapitulatif des décisions à rendre

| # | Point | Nature |
| --- | --- | --- |
| 1 | Prix du Club : 10 000 ou 19 900 FCFA | **Commerciale + juridique, urgente** |
| 2 | Graphie exacte et adresse complète de l'entité | Administrative |
| 3 | Adresse e-mail de contact opposable | Administrative |
| 4 | Accord écrit encadrant la marque Max-Morrys Agency | Juridique |
| 5 | Mise à jour statutaire de l'objet social | Juridique |
| 6 | CGV couvrant les prestations de studio + régime TVA | Juridique |
| 7 | Conservation des données newsletter, double opt-in | Conformité |
| 8 | Version linguistique faisant foi | Juridique |
| 9 | Accord du client Amour Divin ([CONTENT-TODO §5](./CONTENT-TODO.md)) | Contractuelle |
