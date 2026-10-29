# Plan éditorial 360 — novembre 2026 à janvier 2027 (S45 → S05)

> Comité « contenu 360 » du 29/10/2026 — 🧭 Awa (CMO, plan 360), 🗞️ Aminata (rédaction en chef : ligne éditoriale et calendrier), avec 🔎 Thierry (veille et sources) et 🧩 Rokia (SEO).
> Demande de Max du 29/10/2026. Statut : **proposition à valider**. Rien n'est créé dans NocoDB ni publié.
> Étiquettes : **[sourcé]** = vérifié à une source datée (liste en fin de document) ou dans le code · **[hypothèse]** = cible ou estimation sans historique (aucune vente encore réalisée) · **[à vérifier]** = à confirmer avant la production.

---

> **Décisions de Max (29/10/2026, sur le § 6)** :
> 1. Fils rouges, 8 rubriques et offres du mois : **validés**.
> 2. Cadence : **8 à 10 posts par semaine** (au lieu de 14) + 7 stories — le lot S47-S48 est à recouper en conséquence (garder les rendez-vous de rubriques, réduire d'abord COULISSES/CERCLE ; OFFRE ≤ 2 par semaine).
> 3. Lettre / Cloudflare : **pas encore tranché**.
> 4. Black Friday : **aucune remise** sur nos offres.
> 5. Rythme allégé pendant les fêtes + une story neutre le 24/12 et le 31/12 : **oui**.
> 6. Formations : **on n'en parle pas pour l'instant** (décision révisée par Max le 29/10 : pas de fiche « bientôt », aucune mention des formations dans les contenus).

## 1. Décisions d'abord (la page à lire)

**Diagnostic en 5 lignes.** (1) La diffusion FB/IG repart : jeton Meta sans expiration posé le 29/10, et 25 lignes `validé` dans la file (vraisemblablement le lot S45-S46). (2) ⛔ Le dépôt des visuels sur R2 est en panne depuis le 22/08 : aucune carte ne se rend tant que le Worker média n'est pas redéployé (`11-visuels-nayo.md` §1). (3) Le blog n'a rien publié depuis le 22/05, 2 clics en 90 jours ; la nouvelle chaîne (agents → `content/blog/` → admin) n'a encore produit aucun article. (4) La lettre est prête techniquement mais l'**envoi réel marketing est fermé** (politique Cloudflare). (5) WF-SOCIAL-05 **ne publie pas les stories** : seulement les posts et carrousels (vérifié dans `n8n/live/WF-SOCIAL-05.json`).

**Mon arbitrage (Awa).** Un mois, une offre principale, une offre d'appui, un fil rouge. Les rubriques éducatives occupent 6 créneaux sur 14 chaque semaine : c'est notre façon d'éduquer sans bavarder, et ce qui rend les 3 OFFRE crédibles.

| | **Novembre** (à partir du 16/11) | **Décembre** | **Janvier** |
|---|---|---|---|
| **Objectif du mois** | Faire entrer des commerçants dans le tunnel avant les fêtes : leads commerces et appels gratuits | Garder la relation pendant les fêtes, préparer 2027 : appels gratuits, premières adhésions au Club | Rentrée des apprenants : adhésions au Club, usage de Rysmo |
| **Fil rouge** | 02-15/11 : « Vendre sans forcer » (déjà en file) → **16-29/11 : « Les fêtes, sans brader »** | **« Garder ceux qui ont acheté »** (fidéliser : avis, relance, remerciement) ; 21/12-03/01 : mode allégé « 2026 en revue, 2027 en vue » | **« Un plan, pas une résolution »** (apprendre le digital en 2027, petit à petit, par écrit) |
| **Offre principale** | Packs Commerces et TPE (HT) : Présence Locale 250 000 F HT, Commerce Visible 495 000 F HT | Appel gratuit de 30 min (« fais le point sur ton année ») | Club des Digitos : 19 900 F/an, soit ≈ 1 658 F/mois, payé une fois |
| **Offre d'appui** | Appel gratuit de 30 min | Club des Digitos | Rysmo : 2 questions gratuites par jour, packs dès 500 F |
| **En entretien** | Club, Rysmo | Packs (angle « prépare 2027 »), accompagnement mensuel | Packs, accompagnement |
| **Formations** | ⛔ aucune publiée : aucune promotion. Voir § 6, décision 6 (aucune entrée « liste d'attente » ne semble exister tant que le catalogue est vide) | idem | idem |

Prix relus dans le code le 29/10 **[sourcé]** : `src/lib/club/pricing.ts:30` (19 900), `src/lib/presence/offer.ts:102-110` (Présence Locale 250 000 facturés, barré 295 000 ; Visible 495 000 ; Boutique 895 000 ; Croissance 375 000 de mise en place + 175 000/mois ; Commerce 360 750 000 + 225 000/mois sur 6 mois), `worker/apps/api/src/lib/bictorys.ts:119-126` (Rysmo 500 / 1 500 / 3 500 ; Rysmo+ 3 000 et 7 500 par mois). ⚠️ `00-essentiel.md` ne cite pas les frais de mise en place des accompagnements : un post sur l'accompagnement doit les mentionner.

**Ce qu'on ne fait pas.** Aucune promotion Black Friday sur nos offres : le prix du Club « ne bouge pas pendant ton année » (`club.json:212`) et l'on ne casse pas un prix payé hier par un autre. Aucun contenu marketing accroché à une fête religieuse. Aucune actualité sans URL ni date.

**KPI simples (relevés le lundi par Yann, toutes les cibles sont des [hypothèse]).**

| KPI | Source | Novembre | Décembre | Janvier |
|---|---|---|---|---|
| File tenue : lot de 2 semaines déposé ≥ 7 jours avant son premier créneau | NocoDB | 100 % | 100 % | 100 % |
| Posts réellement en ligne / posts validés (preuve sur la plateforme, pas dans la table) | Meta | ≥ 90 % | ≥ 90 % | ≥ 90 % |
| Enregistrements + partages par post (signal fort, `10-community-management.md` §1) | Insights natifs | base à mesurer | base + 20 % | base + 30 % |
| Commentaires avec réponse humaine sous 24 h | Meta | 100 % | 100 % | 100 % |
| Appels gratuits réservés | `/contact` | 4 | 4 | 3 |
| Leads commerces qualifiés | `/admin/prospects-agence` | 3 | 2 | 2 |
| Adhésions au Club | Firestore | 1 | 2 | 5 |
| Articles publiés (dépôt par Omar, mise en ligne par Max) | admin | 1 | 2 | 3 |
| Impressions GSC du blog (base : 87 sur 90 jours au 29/10) | table `seo` | — | — | > 300 sur 90 j |

---

## 2. Nouvelles rubriques récurrentes (8)

Une rubrique est un **sous-format** qui vit dans une des six séries NocoDB (on garde RADAR, ATELIER, PREUVE, COULISSES, CERCLE, OFFRE). Comme il n'existe pas de champ « Rubrique » dans `Contenus`, on la note **en tête du `Titre`** (« Flash du lundi #3 — … »), en **première ligne du `Brief`** (« Rubrique : Flash du lundi ») et dans le **`sourcil`** du visuel (`LE FLASH DU LUNDI · N°3`). Le texte des visuels reste sans emoji.

**Règles communes (Thierry).** Chaque fait : URL, date de publication, date de consultation, citation exacte, dans le `Brief`. Actualité de moins de 30 jours pour le Flash. Une nouveauté de plateforme porte toujours la mention **« Dispo chez nous ? Oui / Pas encore / Annoncé seulement »**, vérifiée sur nos comptes depuis Dakar : beaucoup de fonctions sortent d'abord aux États-Unis. Aucun chiffre demandé à un modèle. Aucune donnée de plus de 2 ans sans le dire. Aucun commerce local nommé pour le critiquer.

**Sources fiables à suivre (veille du vendredi, Thierry).**
- Plateformes : Meta Newsroom (about.fb.com/news), blog WhatsApp (blog.whatsapp.com) et WhatsApp Business (business.whatsapp.com/blog), journal des modifications de Meta for Developers, blog Instagram (about.instagram.com/blog), blog Google (blog.google), blog Google Search Central (developers.google.com/search/blog), aide Google Business Profile, notes de version de Gemini, TikTok Newsroom (newsroom.tiktok.com), LinkedIn News (news.linkedin.com).
- Marché et Afrique de l'Ouest : ARTP Sénégal (observatoire trimestriel, artp.sn), BCEAO (rapports sur les services financiers numériques), GSMA (*State of the Industry Report on Mobile Money*), DataReportal (*Digital 2026* Sénégal, Côte d'Ivoire, Bénin), ANSD, communiqués officiels de Wave et d'Orange Money ; presse : Le Soleil, APS, Fraternité Matin, Financial Afrik, TechCabal (édition française).
- Nous-mêmes : requêtes GSC (table `seo`, relue chaque jour depuis le 29/10), questions reçues en commentaire, en DM et par `/contact`, et **thèmes** des questions posées à Rysmo (agrégés, jamais une question citée sans accord).

| # | Rubrique | Promesse | Série | Fréquence, créneau | Réseau, format, `Gabarit` | Méthode et source | Exemple de titre et d'accroche |
|---|---|---|---|---|---|---|---|
| 1 | **Le Flash du lundi** | « 3 actus marketing de la semaine, et ce que ça change pour toi. » | RADAR | hebdomadaire, lundi 19 h | IG carrousel 5 slides : couverture `affiche`, 1 actu par slide, slide 5 « Ce que je ferais cette semaine » ; reprise en story le mardi | Veille du vendredi : 3 faits datés de moins de 30 jours, au moins 1 local (paiement, régulation, plateforme vue depuis Dakar). S'il n'y a que 2 faits solides, on en publie 2 : jamais de remplissage | « Flash du lundi #1 — Black Friday, fiche Google, WhatsApp » · « 3 actus marketing de la semaine. Une seule va changer ton mois de décembre. 👇 » |
| 2 | **Nouveau sur…** (testé pour toi) | « Une nouveauté Meta, Google, TikTok ou WhatsApp, testée sur un vrai compte, et si elle est dispo chez nous. » | RADAR | toutes les 2 semaines, jeudi 12 h (alterne avec Décrypte et le RADAR du fil rouge) | FB post ou IG carrousel, `affiche` ou `etapes` ; mention « Dispo chez nous ? » sur le visuel | Annonce officielle datée (blogs des plateformes ci-dessus) + test sur nos comptes ; capture réelle seulement | « Nouveau sur WhatsApp Business — [nom de la fonction] » · « Meta l'a annoncé le [date]. Je l'ai cherché sur mon téléphone à Dakar. Verdict : 👇 » |
| 3 | **Le mot du digital** | « Un mot que tout le monde emploie, expliqué en 3 lignes avec un exemple d'ici. » | ATELIER | hebdomadaire, mardi 19 h + story du mercredi | IG post `affiche` (le mot en grand, la définition en corps) ; une fois sur deux en carrousel « 3 mots du même thème » | Définition vérifiée (aide officielle de la plateforme ou glossaire de référence) ; exemple local (boutique de Médina, pressing de Sacré-Cœur). Alimente l'article pilier « Lexique » (S01) | « Le mot du digital #1 — Taux de conversion » · « Tout le monde en parle, peu savent le calculer. 1 minute pour comprendre. 💡 » |
| 4 | **Mythe ou réalité ?** | « Une idée reçue, la vraie réponse, la source. » | PREUVE | toutes les 2 semaines, mardi 12 h (alterne avec Le vrai prix) ; sondage en story la veille | FB post `avant_apres` (`avantTitre` « Mythe », `apresTitre` « Réalité ») | Uniquement des idées reçues qu'une **source officielle** tranche (aide Google, aide Meta, CGV…). Une opinion ne fait pas une « réalité » | « Mythe ou réalité #1 — La fiche Google, c'est payant » · « “Pour être sur Google Maps, il faut payer.” Faux. Et ça te coûte des clients de le croire. 👇 » |
| 5 | **Le vrai prix de…** | « Ce que ça coûte vraiment, en francs CFA, en temps et en data. » | PREUVE | toutes les 2 semaines, mardi 12 h | FB post `chiffre` (`source` obligatoire) ou carrousel | Prix lus dans notre code (HT pour les packs) ou grilles publiques datées ; un calcul d'exemple est **étiqueté « exemple »** et ne prétend pas décrire un marché | « Le vrai prix #1 — Une remise de 30 % » · « Tu fais −30 % pour les fêtes ? Fais d'abord ce calcul. Il prend 1 minute. 👇 » |
| 6 | **L'outil à 0 F** | « Un outil gratuit, un réglage, un gain. Testé sur un Android d'entrée de gamme, sans carte bancaire. » | ATELIER | hebdomadaire, jeudi 19 h | IG carrousel `etapes` (4 à 6 slides) ; champ `Outil` renseigné | Test réel de l'outil ; gratuité vérifiée le jour J sur le Play Store ou le site de l'éditeur ; poids de l'appli et besoin de connexion indiqués. Au moins 2 outils sur 3 hors des incontournables (Canva, CapCut, WhatsApp Business, fiche Google) | « L'outil à 0 F #1 — Snapseed » · « Ta photo produit est sombre ? 3 réglages, sans connexion, sur ton téléphone. 📌 Garde ce post. » |
| 7 | **Ta question, ma réponse** | « Tu demandes, je réponds en public. » | CERCLE | hebdomadaire : boîte à questions en story le vendredi, réponse le mercredi 19 h | IG post `citation` (la question, anonyme) ou `question` ; réponse détaillée en légende | Questions réelles (story, commentaires, DM, `/contact`) ; question anonymisée ; si la boîte est vide, question réelle lue dans les « Autres questions » de Google (Rokia) | « Ta question, ma réponse #1 — Par où commencer ? » · « Tu m'as écrit : “Je veux apprendre le marketing digital mais je ne sais pas par où commencer.” Voici ma réponse honnête. 👇 » |
| 8 | **Décrypte cette pub** | « Une campagne de grande marque, démontée en 4 points que tu peux réutiliser. » | RADAR | mensuelle, jeudi 12 h (S50, S02, S05) | IG ou FB carrousel 5 slides, schéma redessiné (pas de capture d'une création protégée) | Campagne publique d'une **grande** marque (opérateur, banque, plateforme), avec lien vers l'original ; analyse neutre ou positive ; jamais un petit commerce, jamais un concurrent direct dénigré | « Décrypte cette pub #1 — La campagne de fin d'année d'un opérateur » · « Cette pub tourne partout en décembre. Voici les 4 trucs que tu peux copier pour ta boutique. 👇 » |

**Idées écartées ou fusionnées.** « L'outil gratuit de la semaine » devient « L'outil à 0 F » (la contrainte Android + sans carte bancaire est notre différence). « Question de la communauté » devient « Ta question, ma réponse » (registre tu/je). Aucune rubrique « astuce du jour » : une cadence quotidienne promise ne se tient pas, et le blog interdit les promesses de cadence.

**La grille v2 (14 posts, FB et IG, heure de Dakar).** 6 créneaux de rubrique fixes, 8 créneaux pour le fil rouge et les offres.

| Jour | 12 h FB (commerçants) | 19 h IG (apprenants) | Autres |
|---|---|---|---|
| Lundi | ATELIER du fil rouge | **Flash du lundi** (RADAR) | — |
| Mardi | **Mythe ou réalité / Le vrai prix** (PREUVE) | **Le mot du digital** (ATELIER) | — |
| Mercredi | OFFRE agence (9 h) | **Ta question, ma réponse** (CERCLE) | — |
| Jeudi | **Nouveau sur… / Décrypte / RADAR du fil rouge** (RADAR) | **L'outil à 0 F** (ATELIER) | — |
| Vendredi | COULISSES | PREUVE du fil rouge | — |
| Samedi | CERCLE commerçants (18 h) | OFFRE plateforme (11 h) | — |
| Dimanche | OFFRE ou COULISSES (12 h) | COULISSES ou OFFRE | — |

Stories : 7 par semaine sur IG à 12 h (lundi sondage, mardi coulisses ou reprise du Flash, mercredi « mot du digital » ou astuce express, jeudi preuve, vendredi boîte à questions, samedi rappel d'offre, dimanche récap).

---

## 3. Temps forts de novembre à janvier

Thierry a vérifié chaque date le 29/10/2026 (sources en fin de document). Ce sont des **propositions** : aucune règle sur les temps forts n'existe encore dans la marque.

| Date | Temps fort | Statut | Angle Max-Morrys | Offre associée |
|---|---|---|---|---|
| 16-22/11/2026 | Semaine mondiale de l'entrepreneuriat (GEW) | [sourcé] GEN | CERCLE : « ton projet en 3 mots » ; COULISSES sur le parcours | aucune (notoriété) |
| ~novembre | Black Friday des places de marché : Jumia Côte d'Ivoire a réuni ses vendeurs à Abidjan le 22/10 pour s'y préparer ; dates 2026 non publiées (en 2025 : à peu près tout le mois de novembre) | [sourcé] Fraternité Matin 13/10/2026 ; dates 2026 [à vérifier] sur jumia.sn / jumia.ci | RADAR « Vendredi fou : ce que les grandes plateformes préparent » ; ATELIER « faire une promo sans casser ton prix » | Packs commerces (être trouvé), appel gratuit |
| ven. 27/11/2026 | Black Friday (lendemain du 4e jeudi de novembre) ; Cyber Monday lun. 30/11 | [sourcé] calendrier | COULISSES « pourquoi je ne fais pas de Black Friday » ; CERCLE bilan le samedi | ⛔ aucune remise sur nos offres |
| 24-25/12/2026 | Noël (jour férié au Sénégal) | [sourcé] | « Les fêtes » comme **saison commerciale**, jamais comme fête religieuse ; une story sobre « Bonnes fêtes » au plus (décision 5) | Club en appui (« commence 2027 avec d'autres ») |
| 31/12 – 01/01 | Saint-Sylvestre, Nouvel An (1er janvier férié) | [sourcé] | RADAR « 2026 en revue : 5 changements qui comptent pour toi » ; COULISSES « ce que je garde, ce que je change » | aucune le 31/12 et le 01/01 |
| à partir du 04/01/2027 | Rentrée de janvier (bonnes résolutions, reprise du travail) | dates scolaires du Sénégal [à vérifier] | Fil rouge « Un plan, pas une résolution » | Club, Rysmo |
| mer. 06/01/2027 | Soldes d'hiver en France (diaspora) : date attendue, non officielle avant mi-décembre | [à vérifier] service-public.fr | Au plus un RADAR « vendre à la diaspora pendant les soldes » ; pas de période légale de soldes connue au Sénégal : ne rien affirmer | aucune |
| ~08/02/2027 | Début du Ramadan (estimation astronomique, 7, 8 ou 9 février selon l'observation) | [sourcé] estimation ; date officielle [à vérifier] | **S04-S05 seulement, si Max l'accepte** : un ATELIER pratique pour commerçants (« mets à jour tes horaires sur Google »), sans visuel religieux, sans promotion | Présence Locale en entretien |

**Hors fenêtre — à ne pas programmer.**
- **Grand Magal de Touba 2026 : célébré le dimanche 2 août 2026** (18 Safar 1448) **[sourcé]**. Il n'a donc pas lieu entre novembre et janvier. Maouloud 2026 : 25 août **[sourcé, sujet à décret]**. Tabaski 2027 : au printemps.
- **CAN 2027** : Kenya, Ouganda et Tanzanie, du 19 juin au 17 ou 18 juillet 2027 **[sourcé]** ; seules les qualifications tombent dans la fenêtre. Pas de contenu CAN.
- **Vodun Days 2027** à Ouidah (2-9 janvier) et Fête du Vodoun le 10 janvier au Bénin **[sourcé]** : fêtes religieuses et culturelles, pas d'opportunisme.

**Ce qu'on ne fait pas (règle proposée).** Aucun post commercial accroché au Magal, au Gamou, à la Tamkharit, à Noël, au Ramadan, à la Korité, à la Tabaski ou au Vodun ; aucun visuel religieux ; aucune remise de fête sur nos offres ; aucune fausse urgence (« dernières places », compte à rebours) ; pas d'actualité politique ; pas de logo ni d'image de compétition sportive.

---

## 4. Calendrier semaine par semaine (S45 → S05)

Posts : 14 par semaine sur FB et IG (grille v2), dont **3 OFFRE au plus**. Stories : 7 par semaine sur IG à 12 h. LinkedIn : publication manuelle facultative (pas de jeton), X non utilisé. Les lots se déposent en `rédigé` **au moins 7 jours** avant leur premier créneau.

| Sem. | Dates | Fil rouge | Rubriques de la semaine | Blog (Aminata, Rokia) | Lettre | OFFRE (≤ 3/14) | Stories |
|---|---|---|---|---|---|---|---|
| **S45** | 02-08/11 | Vendre sans forcer (lot en file) | — (lot existant) | Article 1 : dossier de sources de Thierry pour le 06/11 | — | 3 (Agence, Club, appel gratuit) | ⚠️ 0 dans le lot : 7 à produire à la main, ou trou accepté |
| **S46** | 09-15/11 | Vendre sans forcer (lot en file) | — | Article 1 : brief Rokia le 09/11, rédaction Cheikh | — | 3 (Agence, Rysmo, Club) | idem |
| | **09/11** | **Lot S47-S48 prêt (§ 5) ; dépôt NocoDB au plus tard le 12/11** | | | | | |
| **S47** | 16-22/11 | Les fêtes, sans brader · GEW | Flash #1 · Mot #1 · Mythe #1 · Nouveau sur #1 · Outil à 0 F #1 | **A1** — « Vendre sur WhatsApp pour les fêtes : la méthode » · mot-clé *vendre sur WhatsApp Business* · E-commerce & Vente en ligne · intention : pratique, locale · maillage : `/conception/commerces-et-tpe` · mise en ligne visée jeu. 19/11 | — | 3 (Présence Locale, Club, appel gratuit) | 7 |
| **S48** | 23-29/11 | Les fêtes, sans brader · Black Friday 27/11 | Flash #2 · Mot #2 · Le vrai prix #1 · Ta question #1 · Outil #2 | relais de A1 | **n°1 — jeu. 26/11** : Flash du mois, A1, le mot du mois · CTA unique : lire A1 | 3 (Commerce Visible, Rysmo, accompagnement mensuel) | 7 |
| | 23/11 | Lot S49-S50 prêt | | | | | |
| **S49** | 30/11-06/12 | Garder ceux qui ont acheté | Flash · Mot · Mythe #2 · Nouveau sur #2 · Ta question · Outil | **A2** — « Avis Google : en obtenir sans les acheter » · *avis Google*, *comment avoir des avis Google* · SEO & Visibilité · maillage : Présence Locale · jeu. 03/12 | — | 3 (appel gratuit, Présence Locale, Club) | 7 |
| **S50** | 07-13/12 | Garder ceux qui ont acheté | Flash · Mot · Le vrai prix #2 · **Décrypte #1** · Ta question · Outil | relais de A2 | — | 3 (appel gratuit, Club, accompagnement) | 7 |
| | 07/12 | Lot S51-S52 prêt | | | | | |
| **S51** | 14-20/12 | Garder ceux qui ont acheté → bilan | Flash · Mot · Mythe #3 · Nouveau sur #3 · Ta question · Outil | **A3** — « Débuter en marketing digital : par où commencer » · *apprendre le marketing digital* (+ Sénégal) · Business & Gestion · maillage : Club, Rysmo, `edu.maxmorrys.me` · jeu. 17/12 | **n°2 — jeu. 17/12** : bilan 2026, A3, l'outil à 0 F du mois · CTA : appel gratuit | 3 (appel gratuit, Club, Rysmo) | 7 |
| **S52** | 21-27/12 | **Allégé** : 2026 en revue | « Le Flash de l'année » (RADAR, 5 changements sourcés) · Mot · Ta question | — (pause de relecture) | — | 2 (Club, appel gratuit) | 7 ([hypothèse] : 7 posts au lieu de 14, décision 4) |
| | 21/12 | Lot S53-S01 prêt | | | | | |
| **S53** | 28/12-03/01 | **Allégé** : 2027 en vue | « Ce que 2027 change pour toi » (RADAR) · Mot · Outil | **Réparation** au lieu d'un article : fusion des 3 doublons de slug, titres trop longs (avec Max dans l'admin) | — | 1 (Club, pas le 31/12 ni le 01/01) | 7 |
| **S01** | 04-10/01 | Un plan, pas une résolution | Flash · Mot · Mythe #4 · Nouveau sur #4 · Ta question · Outil | **A4** — « Lexique du marketing digital, mot par mot » (**page pilier** qui regroupe Le mot du digital) · *lexique marketing digital*, *glossaire marketing digital* · Business & Gestion · maillage : Rysmo · jeu. 07/01 | — | 3 (Club, Rysmo, Commerce Visible) | 7 |
| | 04/01 | Lot S02-S03 prêt | | | | | |
| **S02** | 11-17/01 | Un plan, pas une résolution | Flash · Mot · Le vrai prix #3 · **Décrypte #2** · Ta question · Outil | relais de A4 | **n°3 — jeu. 14/01** : ton plan 2027 en 4 semaines, A4 · CTA : rejoindre le Club | 3 (Club, Rysmo, appel gratuit) | 7 |
| **S03** | 18-24/01 | Un plan, pas une résolution | Flash · Mot · Mythe #5 · Nouveau sur #5 · Ta question · Outil | **A5** — « Prix d'un site web à Dakar : le vrai calcul » · *prix site internet Dakar*, *combien coûte un site web au Sénégal* · Business & Gestion · intention : comparative, transactionnelle · maillage : les 3 packs HT · jeu. 21/01 | — | 3 (Club, Présence Locale, Rysmo) | 7 |
| | 18/01 | Lot S04-S05 prêt | | | | | |
| **S04** | 25-31/01 | Un plan… · (préparation du Ramadan pour les commerçants, si décision 7) | Flash · Mot · Le vrai prix #4 · RADAR du fil rouge · Ta question · Outil | relais de A5 | — | 3 (Club, accompagnement, Rysmo) | 7 |
| **S05** | 01-07/02 | Un plan… → bilan du trimestre (Awa, Yann) | Flash · Mot · Mythe #6 · **Décrypte #3** · Ta question · Outil | **A6** — « Réponses rapides WhatsApp et IA : le bon dosage » · *réponses automatiques WhatsApp Business*, *IA service client* · IA & Automatisation · maillage : accompagnement, Club · jeu. 04/02 | n°4 vers le 11/02 (hors fenêtre) | 3 | 7 |

**Notes de la rédaction (Aminata et Rokia).**
- Cadence : un article toutes les deux semaines, plus une semaine de réparation, soit 7 créneaux de relecture pour Max en 14 semaines. Elle n'est **jamais annoncée** publiquement.
- Chaque titre fait 47 caractères au plus (le site ajoute « | Max-Morrys »). Les mots-clés sont à **confirmer par Rokia sur la page de résultats réelle** avant chaque brief.
- Cannibalisation : A1 ne recoupe pas `vendre-en-ligne-afrique-francophone-lois-2026` (sujet juridique). A5 ne doit citer **aucun prix de concurrent** sans source datée ; nos prix HT sont lus dans `offer.ts`. A4 sert de page pilier : chaque « mot du digital » renverra vers son ancre.
- Banque NocoDB `idees-articles` : 1 204 lignes, dont 1 143 `nouveau`, 43 `produit_draft`, 5 `valide`, 11 vides et 2 en `erreur` [sourcé, 29/10]. **Aucune des 5 idées `valide` n'est retenue telle quelle** : « DeepSeek » et « LinkedIn B2B 2026 » sont des actualités périmées ; les deux idées « fixer ses prix » doublonnent l'article existant sur les tarifs ; « Personal Branding » touche le titre de formation « Marque personnelle », qui n'est pas publié. On ne change aucun statut sans l'accord de Max.
- La lettre (Serge) : une par mois, toujours le jeudi qui suit un article, un seul CTA, objet de moins de 50 caractères. ⛔ **Elle ne part que si Max ouvre l'envoi réel marketing** (décision 3). Sinon, elle est rédigée et testée, et l'on archive la version web.

---

## 5. Lot S47-S48 détaillé (16 au 29/11) — pour Mariam

Fil rouge : **« Les fêtes, sans brader »**. Comptes par semaine : 14 posts (RADAR 2, ATELIER 3, PREUVE 2, COULISSES 2, CERCLE 2, OFFRE 3) + 7 stories. Cibles : S47 A 4 · C 4 · M 6 ; S48 A 5 · C 4 · M 5 (le fil rouge penche vers les commerçants avant le Black Friday, c'est voulu). Offres sur 4 semaines glissantes (S45-S48) : Agence, Club, Rysmo, appel gratuit et accompagnement mensuel couverts ; Formations impossible (décision 6).
Heures de Dakar (UTC+0). Accroches ≤ 110 caractères ; légendes, emojis et hashtags selon `10-community-management.md`. Chaque fait daté est à re-vérifier par Thierry la veille du dépôt.

### S47 — 16 au 22/11

| # | Date, heure | Réseau, format | Série · rubrique | Offre | Cible | Titre interne | Accroche | `Gabarit` |
|---|---|---|---|---|---|---|---|---|
| 1 | lun. 16/11 12 h | FB post | ATELIER · fil rouge | Non-produit | Commerçants | Les fêtes sans brader #1 — 3 promos qui ne cassent pas ton prix | « Baisser tes prix pour les fêtes ? Il y a mieux, et ça garde ta marge. 👇 » (livraison offerte, lot, petit cadeau) | `etapes` |
| 2 | lun. 16/11 19 h | IG carrousel | RADAR · Flash du lundi #1 | Non-produit | Mixte | Flash du lundi #1 — 3 actus de la semaine | « 3 actus marketing de la semaine. Une seule va changer ton mois de décembre. 👇 » (candidats : préparation du Black Friday chez Jumia CI, GEW 16-22/11, 1 nouveauté de plateforme choisie à la veille du 13/11) | carrousel |
| 3 | mar. 17/11 12 h | FB post | PREUVE · Mythe ou réalité #1 | Non-produit | Commerçants | Mythe ou réalité #1 — La fiche Google, c'est payant | « “Pour être sur Google Maps, il faut payer.” Faux. Et le croire te coûte des clients. » (source : aide Google Business Profile, à citer) | `avant_apres` |
| 4 | mar. 17/11 19 h | IG post | ATELIER · Le mot du digital #1 | Non-produit | Apprenants | Le mot du digital #1 — Taux de conversion | « Tout le monde en parle, peu savent le calculer. 1 minute pour comprendre. 💡 » | `affiche` |
| 5 | mer. 18/11 09 h | FB post | OFFRE | Agence | Commerçants | Offre — Présence Locale : qu'on te trouve pendant les fêtes | « Ce mois-ci, on tape “cadeau” et le nom de ton quartier sur Google. Tu apparais ? » → Maps → concurrent → Présence Locale 250 000 F HT | `offre` |
| 6 | mer. 18/11 19 h | IG post | CERCLE · GEW | Non-produit | Mixte | Cercle — Semaine de l'entrepreneuriat : ton projet en 3 mots | « C'est la semaine mondiale de l'entrepreneuriat. Ton projet, en 3 mots ? Je commence. 👇 » | `question` |
| 7 | jeu. 19/11 12 h | FB post | RADAR · Nouveau sur… #1 | Non-produit | Mixte | Nouveau sur… #1 — [fonction choisie par Thierry le 13/11] | « [Plateforme] l'a annoncé le [date]. Je l'ai cherché sur mon téléphone à Dakar. Verdict : 👇 » (repli si rien de testable : « Horaires de fêtes sur ta fiche Google ») | `affiche` |
| 8 | jeu. 19/11 19 h | IG carrousel | ATELIER · L'outil à 0 F #1 | Non-produit | Apprenants | L'outil à 0 F #1 — Snapseed : ta photo produit en 3 réglages | « Ta photo produit est sombre ? 3 réglages, sans connexion, sur ton téléphone. 📌 » (gratuité [à vérifier] le jour J) | `etapes` |
| 9 | ven. 20/11 12 h | FB post | COULISSES | Non-produit | Mixte | Coulisses — Comment je prépare le Flash : mes sources | « Chaque vendredi, je lis 12 sources pour en garder 3. Voici comment je trie. » (nombre à remplacer par le vrai) | `coulisses` |
| 10 | ven. 20/11 19 h | IG post | PREUVE · fil rouge | Non-produit | Apprenants | Preuve — Avant/après : une story de promo qui donne envie | « Même promo, deux stories. Une seule donne envie de répondre. Laquelle ? » | `avant_apres` |
| 11 | sam. 21/11 11 h | IG post | OFFRE | Club Digitos | Apprenants | Offre — Club : ce que tu reçois vraiment | « Apprendre seul en décembre ? Tu vas lâcher. 😅 » → 2 lives par mois, 5 questions Rysmo par jour, −20 % sur les formations à l'ouverture → 1 658 F/mois, payés une fois (19 900 F) → lien en bio | `offre` |
| 12 | sam. 21/11 18 h | FB post | CERCLE | Non-produit | Commerçants | Cercle — Ton produit star des fêtes | « Le produit qui part le plus en décembre chez toi, c'est quoi ? Dis-le en commentaire. 💬 » | `question` |
| 13 | dim. 22/11 12 h | FB post | COULISSES | Non-produit | Mixte | Coulisses — Ce que je coupe en décembre pour tenir | « En décembre, je fais moins. Exprès. Voici ce que je coupe. » | `coulisses` |
| 14 | dim. 22/11 19 h | IG post | OFFRE | Accompagnement (appel gratuit, comme dans S45) | Mixte | Offre — 30 minutes pour faire le point avant 2027 | « Tu finis l'année sans savoir quoi garder ? 30 minutes au téléphone ou sur WhatsApp, gratuit. » | `affiche` |

**Stories S47 (IG, 12 h)**

| Jour | Série | Contenu |
|---|---|---|
| lun. 16/11 | CERCLE | Sondage : « Pour les fêtes, tes clients te trouvent surtout par… WhatsApp / Facebook / bouche-à-oreille » |
| mar. 17/11 | COULISSES | Reprise du Flash #1 : « 3 actus, slide 5 = ce que je ferais » → post de la veille |
| mer. 18/11 | ATELIER | Astuce express : « Horaires de fêtes sur ta fiche Google : où cliquer » |
| jeu. 19/11 | PREUVE | Avant/après express d'une photo produit (Snapseed), pour annoncer le carrousel de 19 h |
| ven. 20/11 | CERCLE | Boîte à questions : « Ta question marketing de la semaine ? Je réponds mercredi. » |
| sam. 21/11 | OFFRE | Rappel plateforme : « Rysmo : 2 questions gratuites par jour, lien en bio » |
| dim. 22/11 | COULISSES | Récap : « 3 posts de la semaine à garder » |

### S48 — 23 au 29/11 (Black Friday le vendredi 27/11)

| # | Date, heure | Réseau, format | Série · rubrique | Offre | Cible | Titre interne | Accroche | `Gabarit` |
|---|---|---|---|---|---|---|---|---|
| 15 | lun. 23/11 12 h | FB post | ATELIER · fil rouge (relais de A1) | Non-produit | Commerçants | Les fêtes sans brader #2 — Le message à envoyer à tes anciens clients | « Tes meilleurs clients de décembre ? Ceux de l'an dernier. Un message suffit. 👋 » (liste de diffusion : seuls ceux qui ont enregistré ton numéro la reçoivent, source FAQ WhatsApp à citer ; lien vers A1 en dernière ligne **si A1 est publié**, sinon sans lien) | `etapes` |
| 16 | lun. 23/11 19 h | IG carrousel | RADAR · Flash du lundi #2 | Non-produit | Mixte | Flash du lundi #2 — 3 actus de la semaine | « 3 actus de la semaine. La 2e concerne ton téléphone. 👇 » (veille du 20/11) | carrousel |
| 17 | mar. 24/11 12 h | FB post | PREUVE · Le vrai prix #1 | Non-produit | Mixte | Le vrai prix #1 — Ce que −30 % te coûte vraiment | « Tu fais −30 % vendredi ? Fais d'abord ce calcul. Il prend 1 minute. 👇 » (calcul étiqueté « exemple ») | `chiffre` (source : « exemple de calcul ») ou `avant_apres` |
| 18 | mar. 24/11 19 h | IG post | ATELIER · Le mot du digital #2 | Non-produit | Apprenants | Le mot du digital #2 — Panier moyen | « Ton chiffre de décembre dépend d'un seul mot. Tu le connais ? 💡 » | `affiche` |
| 19 | mer. 25/11 09 h | FB post | OFFRE | Agence | Commerçants | Offre — Commerce Visible : Google et WhatsApp prêts pour décembre | « Un client te trouve sur Maps, t'écrit sur WhatsApp, voit tes prix. C'est ça, Commerce Visible. » → 495 000 F HT | `offre` |
| 20 | mer. 25/11 19 h | IG post | CERCLE · Ta question, ma réponse #1 | Non-produit | Apprenants | Ta question, ma réponse #1 — [question de la boîte du 20/11] | « Tu m'as écrit : “[question réelle, anonyme]”. Voici ma réponse honnête. 👇 » (repli : « Par où commencer pour apprendre le marketing digital ? ») | `citation` |
| 21 | jeu. 26/11 12 h | FB post | RADAR · fil rouge | Non-produit | Mixte | RADAR — Vendredi fou : ce que les grandes plateformes préparent | « Demain, c'est le Black Friday. Les grandes plateformes s'y préparent depuis octobre. Et toi ? » (source : Fraternité Matin, 13/10/2026) | `affiche` |
| 22 | jeu. 26/11 19 h | IG carrousel | ATELIER · L'outil à 0 F #2 | Non-produit | Apprenants | L'outil à 0 F #2 — Google Trends : ce que le Sénégal cherche avant les fêtes | « Avant de créer ta promo, regarde ce que les gens cherchent vraiment. Gratuit. 📌 » | `etapes` |
| 23 | ven. 27/11 12 h | FB post | COULISSES | Non-produit | Mixte | Coulisses — Pourquoi je ne fais pas de Black Friday | « Aujourd'hui, pas de −50 % chez moi. Voici pourquoi. » (le prix ne bouge pas pour ceux qui ont payé hier) | `coulisses` |
| 24 | ven. 27/11 19 h | IG post | PREUVE · fil rouge | Non-produit | Apprenants | Preuve — Avant/après : la réponse à « c'est combien ? » | « “C'est combien ?” Une réponse perd le client, l'autre le garde. Compare. » | `avant_apres` |
| 25 | sam. 28/11 11 h | IG post | OFFRE | Rysmo | Apprenants | Offre — Rysmo : ta question à 23 h, la réponse tout de suite | « Bloqué sur ta leçon à 23 h ? Rysmo répond, même le soir. » → 2 questions gratuites par jour, packs dès 500 F | `offre` |
| 26 | sam. 28/11 18 h | FB post | CERCLE | Non-produit | Commerçants | Cercle — Ton Black Friday en un mot | « Ton vendredi, en un mot ? Calme, rush, déçu… Dis-moi. 💬 » | `question` |
| 27 | dim. 29/11 12 h | FB post | OFFRE | Accompagnement | Commerçants | Offre — Après les fêtes, qui s'occupe de ta page ? | « En janvier, ta page va dormir. Sauf si quelqu'un la tient pour toi. » → Croissance : 375 000 F HT de mise en place, puis 175 000 F HT par mois | `offre` |
| 28 | dim. 29/11 19 h | IG post | COULISSES | Non-produit | Mixte | Coulisses — Ce que novembre m'a appris | « Novembre en 3 leçons. La 3e m'a coûté cher. » (passerelle vers « Garder ceux qui ont acheté ») | `coulisses` |

**Stories S48 (IG, 12 h)**

| Jour | Série | Contenu |
|---|---|---|
| lun. 23/11 | CERCLE | Sondage : « Vendredi 27 : promo ou pas promo ? Oui / Non » |
| mar. 24/11 | COULISSES | « Nouvel article : vendre sur WhatsApp pour les fêtes, lien en bio » (si A1 est publié ; sinon coulisses de l'écriture) |
| mer. 25/11 | ATELIER | Le mot du digital en 1 écran : « liste de diffusion » |
| jeu. 26/11 | PREUVE | « 2 dates : Black Friday ven. 27/11, Cyber Monday lun. 30/11 » |
| ven. 27/11 | CERCLE | Boîte à questions (réponse mer. 02/12) |
| sam. 28/11 | OFFRE | Rappel agence : « Présence Locale, 250 000 F HT, le lien en bio » |
| dim. 29/11 | COULISSES | Récap de la semaine + annonce du fil rouge de décembre |

**Consignes de production (Mariam, Salimata).** Statut `rédigé` seulement. Ne jamais enchaîner trois fois le même `Gabarit`. Aucun prix hors code. Paiement : citer Wave, Orange Money **et** carte dans chaque OFFRE plateforme. Aucun lien sur IG (« lien dans ma bio »), un lien UTM au plus en dernière ligne sur FB (`utm_campaign=fetes_sans_brader`, `agence_fetes` pour les packs). Stories : ⚠️ WF-SOCIAL-05 ne les publie pas (décision 2).

---

## 6. Ce que Max doit trancher

| # | Décision | Recommandation du comité | Échéance |
|---|---|---|---|
| 1 | Valider les 3 fils rouges, l'offre principale de chaque mois et les KPI | Oui, tels quels | 02/11 |
| 2 | **Stories** | ✅ Traité le 29/10 : publication des stories IG/FB en cours d'ajout à WF-SOCIAL-05, et 14 stories S45-S46 en production | — |
| 3 | **La lettre** : ouvrir l'envoi réel marketing de Cloudflare (`MARKETING_ENVOI_REEL`) ? | Demander d'abord par écrit à Cloudflare si une lettre à faible volume et consentement explicite est tolérée ; sous-domaine `lettre.` séparé ; n°1 le 26/11 si c'est ouvert | 16/11 |
| 4 | Semaines des fêtes S52-S53 : grille allégée (7 posts au lieu de 14) ? | Oui : ta capacité de validation est le goulot | 07/12 |
| 5 | Noël et Nouvel An : une story sobre « Bonnes fêtes » ou rien ? | Une story neutre le 24/12 et une le 31/12, sans offre | 07/12 |
| 6 | **Formations** : aucune n'est publiée, et la liste d'attente se tient formation par formation (`admin.json:1996`) ; avec un catalogue vide, aucune porte d'entrée publique ne semble exister | Ne rien promouvoir. Si tu veux capter la demande, ouvrir une fiche « bientôt » (titre que tu fournis) ; sinon on suspend la règle « 5 offres sur 3 semaines » pour Formations | 16/11 |
| 7 | Préparation du Ramadan pour les commerçants en S04-S05 (ATELIER pratique, sans promotion ni visuel religieux) ? | Oui, si tu es à l'aise ; sinon on n'en parle pas du tout | 04/01 |
| 8 | Black Friday : confirmer « aucune remise sur nos offres » | Oui (prix fixes, cohérence avec le Club) | 09/11 |
| 9 | Valider les 8 rubriques, en particulier « Décrypte cette pub » (droits sur les visuels : schéma redessiné, lien vers l'original) | Garder les 8 ; Décrypte reste mensuelle | 09/11 |
| 10 | Cadence du blog : 6 articles + 1 semaine de réparation, soit 7 relectures en 14 semaines | Oui ; A1 doit être relu entre le 16 et le 18/11 | 02/11 |
| 11 | ~~Redéployer le Worker média~~ | ✅ Fait le 29/10 (version `fdf4f22a`) : le dépôt des visuels fonctionne | — |
| 12 | Ton temps de validation : environ 42 éléments toutes les 2 semaines | Deux créneaux fixes de 15 minutes par semaine ; sinon on descend à 10 posts par semaine | 02/11 |
| 13 | LinkedIn : publication manuelle des Flash du lundi, ou rien ? | Rien tant qu'il n'y a pas de jeton : le temps vaut plus sur FB et IG | — |
| 14 | Plus tard : un champ texte `Rubrique` dans `Contenus` (NocoDB) pour mesurer chaque rubrique | Oui, à créer par Max ou avec son accord (aucune écriture faite) | décembre |

**Prochaines étapes (propriétaires).** Thierry : veille du 06/11 et du 13/11, dossier de sources de A1. Rokia : vérifier les mots-clés A1 à A3 sur la page de résultats, brief A1 le 09/11. Cheikh : A1. Mariam : lot S47-S48 en `rédigé` au plus tard le 12/11, simulation d'abord. Salimata : visuels des rubriques (sourcils, couverture du Flash). Serge : lettre n°1 en mode test. Yann : relevé des KPI le lundi à partir du 23/11.

---

## Sources (consultées le 29/10/2026)

- Grand Magal de Touba 2026, le dimanche 2 août : [Le Soleil](https://lesoleil.sn/actualites/societe-fait-divers/le-grand-magal-de-touba-celebre-le-2-aout-2026-le-4-safar-place-sous-le-signe-du-savoir-et-de-la-transmission/), [Dakaractu](https://www.dakaractu.com/TOUBA-Le-Grand-Magal-celebre-le-dimanche-02-aout-prochain_a273930.html), [Senego](https://senego.com/officiel-le-croissant-lunaire-apercu-la-date-du-grand-magal-de-touba-2026-est-connue_1983858.html)
- Jours fériés au Sénégal en 2026 (Toussaint, Noël, Maouloud le 25 août) : [publicholidays.africa](https://publicholidays.africa/?p=4353), [Le Petit Journal Dakar](https://lepetitjournal.com/dakar/jours-feries-senegal-295473)
- Black Friday Jumia Côte d'Ivoire 2026, rencontre des vendeurs le 22/10 : [Fraternité Matin, 13/10/2026](https://www.fratmat.info/article/2645169/economie/commerce-en-ligne-les-vendeurs-preparent-le-black-friday-2026) ; période 2025 : [jumia.ci](https://www.jumia.ci/mlp-black-friday)
- Semaine mondiale de l'entrepreneuriat, 16-22/11/2026 : [Global Entrepreneurship Network](https://www.genglobal.org/global-entrepreneurship-week/news/after-its-largest-year-ever-global-entrepreneurship-week-set)
- Soldes d'hiver en France, attendues le 06/01/2027 : [tpeactu.fr](https://tpeactu.fr/2026/08/12/soldes-hiver-2026-dates-france-luxembourg/), [calendriergratuit.fr](https://www.calendriergratuit.fr/dates-soldes.html)
- Ramadan 2027, vers le 8 février (estimation) : [faire-le-pont.fr](https://www.faire-le-pont.fr/actualites/ramadan-2027-dates-debut-fin-aid-el-fitr-droit-absence/), [pleine-lune.org](https://www.pleine-lune.org/calendrier-ramadan)
- CAN 2027, du 19 juin au 17 ou 18 juillet : [Fraternité Matin](https://www.fratmat.info/article/2641638/sports/football/la-can-2027-au-kenya-en-tanzanie-et-en-ouganda-aura-lieu-du-19-juin-au-17-juillet), [Hespress](https://fr.hespress.com/468610-can-2027-le-kenya-louganda-et-la-tanzanie-accueilleront-la-competition-du-19-juin-au-18-juillet.html)
- Vodun Days 2027, du 2 au 9 janvier : [Bénin Web TV](https://beninwebtv.bj/benin-le-gouvernement-beninois-precise-les-raisons-de-la-prolongation-des-vodun-days-2027-a-ouidah/)
- Dans le dépôt : `docs/growth-kb/00, 01, 02, 04, 06, 07, 08, 10, 11`, `docs/STRATEGIE_COMMUNICATION_2026.md` (séries et grille, partiellement périmé), `_bmad-output/growth/2026-10-29-lot-social-S45-S46.json` (25 posts, FB et IG, 0 story), `n8n/live/WF-SOCIAL-05.json`, NocoDB `stats idees-articles Status` et `stats contenus Status` (79 publié, 54 rejeté, 25 validé, 18 échec, 3 prêt_à_valider).
