# 02 — Personas et marchés

> Extrait du dossier de connaissance du 29/10/2026 (branche `refonte/sous-domaines`, HEAD `77dd43f`). Chaque fait renvoie à `fichier:ligne` : **revérifier dans le code avant de citer un prix, une règle ou une URL.** Ordre d'autorité : code et tests > i18n `src/i18n/locales/` > PRD rév. 5 > CDC 14/09 > STRATEGIE_COMMUNICATION_2026 et skills paperclip/soc (périmés) > BUSINESS_MODEL/PLAN (spéculatifs). ⚠️ contradiction · ⛔ interdit · ✅ vérifié.

## 3. Personas

> **Statut :** toutes les personas sont des **hypothèses**. Aucun client réel n'a été interrogé, et les chiffres sont marqués `[FICTIF]` (PRD rév. 5 `prd.md:377-382`). Le PRD a tranché pour des « personas inline, pas de section persona autonome » (`prd-…-10-28/.memlog.md:8`).
>
> **À utiliser :**
> - pour cibler, les **deux publics de la stratégie** (jeu D) ;
> - pour l'incarnation, **les parcours du PRD rév. 5** (jeu F, dernier jeu versionné et marqué `final`), en signalant que la rév. 6 du 29/10 les a resitués.

### Jeu D : les deux publics (référence opérationnelle)
Sources : `docs/STRATEGIE_COMMUNICATION_2026.md:67-72` (v1, 06/08/2026), condensé dans `paperclip/skills/content-strategy/SKILL.md:8-17`.

| | **Apprenants** (piste Apprendre) | **Commerçants** (étage commerces de la piste Conception) |
|---|---|---|
| Qui | entrepreneurs, marketeurs salariés ou indépendants, créateurs, personnes en reconversion ; Afrique de l'Ouest francophone et diaspora | commerce physique de 1 à 15 salariés, CA de 800 k à 5 M XOF par mois, décideur unique joignable sur WhatsApp ; Dakar, Abidjan, Cotonou |
| Douleur | « Je sais qu'il faut se former, je ne sais pas par où commencer ni si j'en suis capable » | « Mes concurrents apparaissent sur Google, pas moi. Et je n'ai pas le temps » |
| Offre | formations, Club, Rysmo | packs et accompagnement mensuel |
| Canal principal | Instagram (5 créneaux par semaine) et LinkedIn | Facebook (4 créneaux par semaine) et LinkedIn |
| Preuve qui marche | progression visible, certificats, témoignages nominatifs | Google Maps avant/après, capture d'une demande WhatsApp |
| CTA | « Découvre la formation » / « Rejoins le Club » / « Pose ta question à Rysmo » | « Fais le test sur Google Maps » / « Trouve ton pack en 3 questions » |

### Jeu F : parcours du PRD rév. 5 (28/10/2026, `status: final`)
| | **UJ-1 Aïssatou** (`prd.md:384-418`) | **UJ-2 Moussa** (`:420-438`) | **UJ-3 Fatou** (`:440-463`) | UJ-4 Max-Morrys (`:465-481`) |
|---|---|---|---|---|
| Âge, ville | 27 ans, Dakar | 34 ans, Abidjan | 41 ans, Almadies (Dakar) | opérateur solo |
| Métier | chargée de com' dans une PME ; gère l'Instagram de sa cousine coiffeuse le week-end | freelance growth | boutique de cosmétiques, CA ≈ 1,2 M F par mois `[FICTIF]`, structure informelle | tout gérer seul |
| Équipement | téléphone en 4G, forfait surveillé, « appareil modeste, connexion payée au mégaoctet » (`:415`) | — | vend déjà sur WhatsApp et Facebook, gratuitement | — |
| Canaux | extrait de podcast dans un groupe WhatsApp pro → blog → Google | Club | WhatsApp, Facebook | — |
| Paiement | Wave sur page hébergée, contrevaleur en euros affichée (`:401-403`) | 19 900 F d'un seul coup au renouvellement | pack 495 k HT = 584 100 TTC, **TVA non récupérable** (informelle) → devis → WhatsApp | — |
| Objectif | certificat partagé sur LinkedIn (`:410-412`) | opportunités, sessions en direct, −20 % | être trouvée | — |
| Objection | prix de 95 à 200 k = 1,8 à 3,8 mois de SMIG ; « le prix la fait hésiter plus longtemps que le contenu ne la convainc » (`:392-394`) | inactif après 2 mois, la valeur ne se voit pas ; le lien de renouvellement tombe sur une porte fermée (FR-174) | compare à « un site à 400 000 francs une fois » ; la première année = 20 à 25 % du CA | — |
| Offre, piste | formation, Apprendre | Club, Apprendre | Commerce Visible, Conception (étage commerces, tutoiement) | — |

### Jeu G : PRD rév. 6 (29/10/2026, **le plus récent, mais non versionné** : `.design-ref/PRD-rev6.md:85-112`)
- Les noms sont gardés, les profils changent, et **tout le monde est à Dakar** :
  - **Aïssatou N.** : gérante d'un pressing à Sacré-Cœur 3, apprend le soir en taxi. Blocages : la vidéo ne charge pas, elle laisse filer une semaine. Réponses prévues : téléchargement en Wi-Fi, notification à J5. Elle paie par Wave « 160 000 F avec la remise membre » pour la formation « Marque personnelle » (`:96`).
  - **Moussa D.** : photographe à Grand Yoff, membre et administrateur du Club. Il a raté une session ; la valeur de l'adhésion reste invisible.
  - **Fatou K.** : couturière à Liberté 6, commerçante et membre du Club. Elle ne sait pas à qui demander un devis. Le devis affiche HT, TVA, TTC et l'acompte de 60 %, et arrive en PDF et sur WhatsApp (`:104`).
  - Nouveau parcours UJ-5 : nommer l'assistant (`:110-112`).
- Principes data : afficher la taille du téléchargement, Wi-Fi par défaut, 360p, transcription à 0 Mo (`:49-50`).

### Jeu C : profil client idéal (ICP) de l'offre TPE (`docs/OFFRE_AGENCE_TPE.md:41-60`, repris dans `skills/commercial-kit/SKILL.md:49-56`)
- **Sous-segments, pourquoi ils achètent, pack naturel :**
  - restaurants et pâtisseries : Maps et photos amènent des réservations → Commerce Visible ;
  - vêtements et cosmétiques : le catalogue WhatsApp est un vrai canal de vente → Visible ou Boutique ;
  - salons de beauté : les avis Google → Présence Locale, puis Croissance ;
  - pharmacies et cliniques : crédibilité, horaires → Présence Locale ;
  - quincailleries : être trouvé sur une recherche produit → Visible ;
  - écoles privées : saisonnalité des inscriptions → Commerce 360.
- **Déclencheurs, bons signaux :** page Facebook ou Instagram mal tenue, commandes WhatsApp désordonnées, répond lui-même au téléphone (`:52-55`).
- **À refuser :** veut « le site le moins cher », réclame les outils d'automatisation, exige un résultat chiffré garanti (`:57-60`).

### Jeux plus anciens (pour mémoire, ne pas utiliser seuls)
- **Jeu A, `BUSINESS_PLAN.md:153-159`** (v2.0, juin 2026) : l'entrepreneur pressé, le créateur ou personal brander, le marketer en poste, la PME en transformation, l'étudiant pro. Une ligne chacun, sans âge, revenu ni objection.
- **Jeu B, `BUSINESS_MODEL.md`** (avril 2026) : jeunes pros de 22 à 35 ans gagnant 150 à 500 k XOF par mois, pour qui « un cours à 99 k = 20 à 66 % du salaire » (`:134,176`). Club : anciens élèves (`:226`). B2B : agences de Dakar, Orange/Sonatel, banques, ONG (`:423`). Agence TPE (`:480`).
- **Jeu E, CDC du 14/09** : Apprendre = entrepreneurs et commerçants (tutoiement, achat instantané). Conception = entreprises structurées ; exemples d'acheteurs : « le responsable financier d'un client européen », « le directeur général d'un groupe ivoirien » (CDC txt:20,64-74).
- **Jeu H, copie en ligne :**
  - les trois publics de l'accueil : « Commerçants et TPE — être trouvé·e, vendre en ligne, encaisser en Wave », « Jeunes professionnels — apprendre un métier du digital, et le prouver », « Marques et organisations » (`fr/home.json:32-43`) ;
  - le « pour qui » des formations (`fr/formations.json:270-280`) :
    - oui : « tu vends déjà quelque chose », « appliquer le soir même », « tu paies en francs CFA, sans compte à l'étranger » ;
    - non : qui veut un diplôme d'État, qui veut qu'on fasse à sa place, débutant complet (→ blog).
- ⚠️ **Contradictions rév. 5 / rév. 6 :** Aïssatou passe de chargée de com' à gérante de pressing ; Moussa de freelance à Abidjan à photographe à Grand Yoff ; Fatou de cosmétiques aux Almadies à couturière à Liberté 6. **L'Abidjanais disparaît.** Prix : « Marque personnelle » à 160 k après remise (≈ 200 k plein tarif) en rév. 6, contre 95 k dans `BUSINESS_MODEL.md:144`.

---

## 4. Cible et marchés
- **Géographie :**
  - **Cœur :** Sénégal, Dakar.
  - **Offre TPE et PRD :** Dakar, Abidjan, Cotonou (`docs/OFFRE_AGENCE_TPE.md:41`, `fr/presence.json:11`, PRD rév. 5 `:279-281`).
  - ⚠️ `BUSINESS_PLAN.md:96` dit Sénégal, Côte d'Ivoire, Cameroun, diaspora et France, avec l'expansion CI/CM prévue en années 3 à 5 (`:195,231`, `BUSINESS_MODEL.md:795`). Le Cameroun a été abandonné sans décision (`prd-…-08-29/reconcile-modele-economique.md:197-209`). Bamako n'apparaît que dans `MAJ/AUDIT_UI_UX_COMPLET.md:5`.
- **Diaspora :** « probablement le segment le plus solvable », mais son consentement à payer est un « angle mort total » (PRD rév. 5 `:306`). Aucune persona. Consigne : « Français standard — la diaspora doit suivre » (`STRATEGIE:93-94`).
- **Mobile d'abord, data chère :**
  - le panier haut débit d'entrée coûte 4,2 % du RNB par habitant (cible ONU : 2 %, PRD `:270-273`). D'où NFR-04, frugalité data (`:1985`), et NFR-05, survivre à une session interrompue sur un téléphone d'entrée de gamme (`:1990-1993`) ;
  - pénétration réelle d'internet : Sénégal 60,6 %, Côte d'Ivoire 40,7 %, Bénin ≈ 32 % ; âge médian au Sénégal 19,6 ans (`:279-281`). ⛔ Ne pas citer les 125,78 % de l'ARTP, qui comptent les cartes SIM (`:283-285`) ;
  - un smartphone d'entrée coûte 130 à 160 USD, soit 2 à 4 mois de revenu (`prd-…-08-29/research-marche-edtech-ao.md:76-78`).
- **Mobile money :** taux d'inclusion financière de 73,6 % dans l'UEMOA, contre 25,2 % de bancarisation stricte (PRD `:264-268`). Wave, Orange Money et carte via Bictorys, commission de 3 % (`finance/hypotheses.csv:22`). « Wave ≈ 70 % » n'est **pas sourcé** (`research-marche-edtech-ao.md:130`).
- **WhatsApp :** au cœur des deux tunnels, mais sa pénétration n'est « non sourcée en primaire » (PRD `:303`). ⛔ Ne pas écrire « 95 %+ ».
- **Revenus :**
  - SMIG de 52 500 FCFA par mois ; salaire moyen contradictoire, 114 152 ou 186 710 (PRD `:304`) ;
  - ancre de prix d'une formation au Sénégal ≈ 25 000 (`research-comparables.md:20`) ;
  - 85 à 97 % des entreprises sénégalaises sont informelles, donc la TVA n'est pas récupérable (PRD `:1401`).
- **Audiences publicitaires au Sénégal :** Facebook 3,6 M, LinkedIn 1,5 M, YouTube 5,42 M (`research-marche-edtech-ao.md:31`).
- **Langues :** français canonique ; site bilingue FR/EN sous `/en` (NFR-06, `segments.ts:1-12`). L'anglais est **réécrit, pas traduit** (`Max-Morrys_DS_Platform/readme.md:88-91`). Pas de wolof dans la copie, et « pas de patois » (`STRATEGIE:94`). ⚠️ `DESIGN_BRIEF.md:62` dit « français exclusivement », ce qui est périmé.
- **Saisonnalité :**
  - fils rouges : septembre, rentrée « Ton système, pas ton temps » ; octobre, préparation des fêtes « Vendre sans forcer » (`STRATEGIE:586-590`) ;
  - écoles privées : saisonnalité des inscriptions (`OFFRE_AGENCE_TPE.md:50`) ;
  - ⚠️ **Ramadan, Korité, Tabaski, Magal : aucune règle** (Tabaski n'apparaît que dans d'anciens CSV Airtable, sous `backups/`).
- **Créneaux de publication (heure de Dakar) :** Facebook à la pause de midi et le week-end ; Instagram le soir ; LinkedIn en semaine le matin et le dimanche (`STRATEGIE:258-296`).
- **Dimensionnement :** le SAM de 300 à 500 k (`BUSINESS_PLAN.md:146-149`) est rejeté comme non sourcé (PRD `:300`). Scénario de base dans `finance/hypotheses.csv` :
  - 2 500 inscrits gratuits en année 1 (`:2`) ;
  - conversion des formations à 4 % (`:4`), prix moyen 125 k (`:6`) ;
  - 25 % des acheteurs rejoignent le Club (`:7`) ;
  - 28 mises en place agence en année 1 (`:13`), prix moyen 475 k (`:15`).

  ⛔ Ce sont des hypothèses. Aucune vente n'a été réalisée (PRD `:134-139`).

