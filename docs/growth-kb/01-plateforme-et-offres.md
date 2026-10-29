# 01 — Plateforme et offres

> Extrait du dossier de connaissance du 29/10/2026 (branche `refonte/sous-domaines`, HEAD `77dd43f`). Chaque fait renvoie à `fichier:ligne` : **revérifier dans le code avant de citer un prix, une règle ou une URL.** Ordre d'autorité : code et tests > i18n `src/i18n/locales/` > PRD rév. 5 > CDC 14/09 > STRATEGIE_COMMUNICATION_2026 et skills paperclip/soc (périmés) > BUSINESS_MODEL/PLAN (spéculatifs). ⚠️ contradiction · ⛔ interdit · ✅ vérifié.

## 1. Fiche plateforme

### 1.1 Identité, mission, promesse
- **Signature publique :** « Max-Morrys ». Le nom civil « Max-Morrys Eyoum » n'apparaît que dans les données structurées et la page À propos (`src/lib/author.ts`, `src/i18n/locales/fr/about.json:3,12`). Le site parle à la **première personne du singulier** : « C'est une personne qui parle, pas une entreprise » (`Max-Morrys_DS_Platform/readme.md:65-66`).
- **H1 de l'accueil (en ligne) :** « Former. Construire. [Transmettre.] » (`src/i18n/locales/fr/home.json:3`). En anglais : « Train. Build. [Pass it on.] » (`en/home.json:3`).
- **Accroche de l'accueil :** « Je suis Max-Morrys. J'aide les entrepreneurs et les marques d'Afrique francophone à exister en ligne — en les formant, et en construisant avec eux. Depuis Dakar. » (`fr/home.json:4`).
- **Titre et description SEO servis aux robots par le Worker :**
  - Titre : « Max-Morrys | Conception web et formation au digital ».
  - Description : « Conception de sites et de plateformes web, et formations au digital — référencement, marketing, IA. Depuis Dakar, pour l'Afrique de l'Ouest. » (`worker/apps/site/src/constants.ts:14-16`).
- ⚠️ **L'ancien slogan « Maîtrise le digital, accélère ta croissance. » survit à plusieurs endroits :**
  - dans `index.html:21,32,66` (title, og et twitter du repli SPA) ;
  - dans le kit marketing (`Max-Morrys_BrandKit_Complet/06_Tokens_Design/brand-tokens.json:4`) ;
  - dans `docs/BRAND-ARCHITECTURE.md:57` ;
  - dans la signature du prompt n8n (`scripts/n8n-patch-strategy-2026.py:286-297`).

  Le site en ligne ne le porte plus. Le partage social peut donc afficher deux titres différents.
- **Mission (kit marketing) :** « Aider les entrepreneurs et professionnels à transformer leurs compétences digitales en résultats concrets » (`brand-tokens.json:5`). La vision est d'être la « référence francophone du digital pratique en Afrique de l'Ouest » (`03_Charte_Graphique_Complete/Max-Morrys_Charte_Graphique_Complete.md:13`). La personnalité est définie comme Premium / Pédagogique / Technologique / Humaine / Orientée croissance (`Charte…md:19-23`).
- **Formule de positionnement :** « Marketing × Product × Technology × AI » (`src/lib/brand/company.ts:78-82`, `docs/BRAND-ARCHITECTURE.md:55`). ⚠️ `positioning.tracks` vaut encore `['LEARN','WORK WITH ME']` (`company.ts:81`), et non Conception / Apprendre.
- **Fil conducteur social :** « Soit tu apprends à le faire, soit je le fais pour toi. » (`paperclip/skills/maxmorrys-brand/SKILL.md:10`).
- **Volant d'inertie :** apprendre → faire confiance → comprendre comment il pense → travailler avec son studio (`docs/BRAND-ARCHITECTURE.md:69-77`).
- **Paiement promis :** en FCFA, par Wave, Orange Money ou carte, sans conversion de devise (`worker/apps/site/src/prerender/static-pages.ts:49`). ⛔ Toute énumération des moyens de paiement doit les **citer tous les trois**. C'est la règle 8 de `scripts/proof-check.mjs:202-259`.

### 1.2 Les deux pistes (refonte CDC du 14/09/2026)
| | **Conception** (« fait POUR vous ») | **Apprendre** (« fait PAR toi ») |
|---|---|---|
| Route | `/conception` (EN `/en/design`) — `src/i18n/segments.ts:48-51` | `/apprendre` → **edu.maxmorrys.me** (EN `/en/learning`) |
| Sous-pages | `/conception/commerces-et-tpe` (packs publics HT), `/conception/projets-sur-mesure` (sur devis), `/conception/realisations` | formations, certificats, Rysmo, Club (→ **club.maxmorrys.me**) |
| Registre | **vous / nous** (sauf l'étage commerces, qui tutoie) | **tu / je** |
| Achat | devis, acompte 60 % | achat instantané en ligne (Bictorys) |
| Cible CDC | « Entreprises structurées, clients My Onoma, TPE en projet », euros sur devis possibles (CDC txt:64-74) | « entrepreneurs et commerçants d'Afrique francophone » (CDC txt:64-74) |

- « Deux pistes, et aucune n'est l'antichambre de l'autre » (`static-pages.ts:48`). L'accueil compte 5 blocs, les deux pistes y ont un poids égal, et rien n'y est vendu directement (`static-pages.ts:27-31`).
- **Écart de prix entre les deux publics :** « un facteur vingt » (CDC txt:21).
- **Redirections 301 :**
  - `/agence` → `/conception` ;
  - `/presence-digitale` → `/conception/commerces-et-tpe` (avec suffixe) ;
  - `/agence/devis/*` → `/conception/commerces-et-tpe/devis/*`.

  Sources : `worker/apps/site/src/static-redirects.ts:59-81`, miroir dans `firebase.json`, repli client dans `src/App.tsx:412,428-436`. ⛔ Ne jamais envoyer de trafic vers `/agence` ou `/presence-digitale`.

### 1.3 Sous-domaines (commit `22c4df1`, 29/10/2026 : « une session pour trois hôtes »)
Les trois hôtes sont servis par une seule application (`src/lib/espaces.ts:3-7`, `worker/apps/site/wrangler.jsonc:25-26`) :
- `maxmorrys.me` : le hub (site, contenus, services, admin).
- `edu.maxmorrys.me` : formations, espace apprenant, certificats (`/verifier`), assistant Rysmo.
- `club.maxmorrys.me` : le Club des Digitos (`/`, `/adhesion`, `/sessions`) et le parrainage (`/r/<code>`).

Les anciens chemins redirigent vers le nouvel hôte (`espaces.ts:55-87`, `worker/apps/site/test/espaces.test.ts:15-31`) : `/formations` → `edu…/formations`, `/club-des-digitos` → `club…/`, `/apprendre` → `edu…/`.
- ⚠️ Des commentaires « pas de sous-domaine » subsistent dans `src/pages/Apprendre.tsx:39`, `Contact.tsx:38` et `About.tsx:28`.
- **Autres domaines :**
  - `myonoma.com` (corporate, `company.ts:70`) ;
  - `nayo.pro` ;
  - `stepsmag.com` ;
  - `media.maxmorrys.me` (images OG, `constants.ts:17`).

### 1.4 Architecture de marque : MY ONOMA, BUILD · GROW · OWN
- **MY ONOMA SARL** se présente comme « Digital Product & Growth Studio / Venture Builder » (`docs/BRAND-ARCHITECTURE.md:21-33`, `src/lib/brand/index.ts:4-11`, `src/lib/brand/practices.ts:91`). Elle a trois piliers :
  - **BUILD → Max-Morrys Agency** : « Digital Product · AI · Technology · Brand », sur `/conception` (`practices.ts:45-58`). C'est un **nom commercial, pas une personne morale**. ⛔ Ne jamais émettre d'`Organization` « Max-Morrys Agency » (`BRAND-ARCHITECTURE.md:259-268`).
  - **GROW → Cléa Growth Office** : « Growth · Revenue · AdTech · Operations ». Elle n'a **aucune page sur maxmorrys.me** et renvoie vers myonoma.com/services/clea-growth-office (`practices.ts:59-73`). C'est une **practice sœur, jamais une sous-traitante** (`BRAND-ARCHITECTURE.md:131-144`). La formule de référence : « Max-Morrys Agency construit les systèmes. Cléa Growth Office construit et opère la machine de croissance. » (`:154-155`). Une demande « growth » est routée vers Cléa (`src/lib/agency/engagement.ts:53-79`, écran « Ce besoin relève de Cléa » à `fr/conception.json:282-286`).
  - **OWN → MY ONOMA Product Lab** : DOVEN (réseau social chrétien, `fr/about.json:52`), NAYO (Creative Production OS, nayo.pro) et STEPS (média, stepsmag.com). Chacune porte la mention « A MY ONOMA Venture » (`src/lib/brand/ventures.ts:44-77`).
- **Règles :**
  - ⛔ Les ventures ne sont jamais présentées comme propriété personnelle de Max-Morrys (`ventures.ts:8-10`).
  - ⛔ Aucun chiffre de traction (`ventures.ts:12-13`).
  - ⛔ Clients et ventures ne figurent jamais dans la même grille (`BRAND-ARCHITECTURE.md:220-225`).
  - ⛔ L'agence n'affiche pas de grille de prix publique pour le sur mesure et ne vend jamais « l'IA pour l'IA » (`:116-120`).
- **Casse du nom de la société :** ⛔ jamais « My Onoma » tapé en casse mixte. Il faut passer par `{{company}}` (`tests/unit/marque-noms.test.ts:5-27`).
- ⚠️ DOVEN pointe vers myonoma.com (`ventures.ts:54-55`), soit la même URL que le site corporate.
- ⚠️ Le rôle de MY ONOMA est formulé différemment selon les pages : « contracte les missions de direction marketing » (`static-pages.ts:128`) contre « portées par MY ONOMA… opérées par sa practice croissance » (`static-pages.ts:317`).

### 1.5 Entité légale (`src/lib/brand/company.ts:50-64`)
- MY ONOMA SARL, RCCM SN DKR 2022 B 11134, NINEA 009319501, capital de 100 000 FCFA.
- Adresse : Ouakam, Cité Batrain, Lot 384, Dakar.
- ⛔ L'objet social ne couvre pas l'édition logicielle et ne doit jamais être revendiqué (`company.ts:45-48`).
- La plateforme a ouvert en 2026-04 (`company.ts:157`), le Club en 2026-08 (`src/lib/club/pricing.ts:108`).

### 1.6 Fondateur
- Parcours : a grandi à Douala, a fait une licence au CERAP à Abidjan (`fr/about.json:83`), puis un master à BEM Dakar (`:95`). Le H1 de la page À propos est « Trois villes, un métier. » (`static-pages.ts:126`).
- Sa phrase de présentation : « J'ai appris le marketing en le faisant : pour des PME, des organisations, des hôpitaux, des églises » (`fr/home.json:24-25`).
- `jobTitle` JSON-LD : « Concepteur web et formateur au digital » (`static-pages.ts:115-124`). « Formateur depuis 2024 » (`fr/apprendre.json:99,112`).
- Portraits : `public/max-morrys-portrait-800.webp`, `-400.webp`, `public/max-morrys-avatar-192.webp`. Original : `Max-Morrys_BrandKit_Complet/08_Sources_Reference/Max-Morrys_portrait_original_1086.png` (`src/lib/author.ts:24-32`).
- ⛔ Son rôle au sein de MY ONOMA n'est pas publié (`BRAND-ARCHITECTURE.md:122-123`).
- ⛔ Eyone Medical est **son employeur, pas un client**. Ne jamais le lister (`:217-218`).
- ⚠️ « Une seule personne, à Dakar » (`static-pages.ts:47`) contredit « mon studio » (`fr/home.json:25`) et la conception en « nous ».

### 1.7 Canaux officiels (source unique `company.ts:94-113`, miroir `worker/apps/site/src/constants.ts:57-73`, synchronisation testée par `tests/unit/social-links-sync.test.ts`)
| Canal | Valeur |
|---|---|
| LinkedIn | linkedin.com/in/max-morrys-eyoum/ |
| Facebook | facebook.com/maxmorrys.me/ |
| Instagram | instagram.com/maxmorrys.me |
| YouTube | youtube.com/@maxmorrys-me (l'ancien `@maxmorrys` était en 404, `constants.ts:50-55`) |
| TikTok | tiktok.com/@maxmorrys.me (⚠️ **0 publication TikTok/vidéo depuis le 06/08/2026**, `STRATEGIE_COMMUNICATION_2026.md:284`) |
| X | **x.com/max_morrys**, handle `@max_morrys` (`constants.ts:66-73`). ⛔ Pas `@maxmorrys`. |
| WhatsApp / téléphone | **+221 77 604 19 85** (wa.me/221776041985), `company.ts:96-100`. Les `+221 77 000 00 00` du code sont des placeholders. |
| E-mail | ⚠️ `hello@maxmorrys.me` (pied de page, contact, SEO : `company.ts:94`) contre `contact@maxmorrys.me` (pages légales : `fr/legal.json:94,108,132,183,240`). Arbitrage ouvert (`docs/LEGAL-TODO.md:115-130`). Corporate : contact@myonoma.com. |
| Podcast | aucune plateforme ; seulement `/podcast.xml` (`company.ts:135`) |
| Lettre | « La lettre » (`fr/shared.json:2-15`). ⚠️ La cadence est contradictoire, voir §8. |

### 1.8 Clients (références de la piste Conception, `src/lib/brand/clients.ts:156-379`)
Amour Divin, Khanouss, Loma, HolyCash, English Lab, Klio Pro, ResHo Konnexion, LauraVerse, IN Sénégal 2026, Chez Mon Cardio, Vases d'Honneur Sénégal, FredKevWil Consulting, Concepcoe, RESIC, Africa Coop Tech. Dunamis Holydays et Je Témoigne ont été retirés (commit `03d70e0`).
- ⛔ Noms en texte seulement, **pas de logo** sans accord écrit (`fr/home.json:19`).
- ⛔ Aucun résultat commercial chiffré (`static-pages.ts:316`).
- ⛔ Aucun client identifiable dans un post sans accord écrit (`paperclip/skills/content-strategy/SKILL.md:147-152`).

---

## 2. Catalogue des offres en ligne

### 2.0 Règles transverses (✅ code)
- **Devise :** seul le XOF est débité. La contrevaleur s'affiche sous le prix, en EUR sur les pages FR et en USD sur les pages EN (`src/lib/currency/convert.ts:47`).
  - Parité `XOF_PER_EUR = 655.957` fixe (`:50`).
  - `EUR_USD = 1.161` (`:53`), relevé à `FX_AS_OF = 2026-09-03` (`:56`). Le taux est considéré périmé après 180 jours, soit vers le 02/03/2027 (`:64`).
  - L'affichage est toujours préfixé de « ≈ » et arrondi par paliers (`:95-103`).
- **TVA à 18 %** (`src/lib/tax/senegal.ts:38`). Décision de direction du 03/09/2026 (`:7-12`).
  - Agence : **taxable**.
  - Formations et Club : **exonérés** (enseignement).
  - Rysmo : régime **indéterminé**, aucune mention HT/TTC (`:56-78`).
- **CGV art. 5.1 :** prix **HT**, TVA ajoutée si due, TTC présenté avant validation (`fr/legal.json:152`). Jusqu'au 03/09/2026, l'article indiquait « TTC » (`src/lib/presence/offer.ts:330-332`). Le passage au HT est une hausse réelle ; les ventes antérieures restent TTC.
- **Rétractation, art. 6 :** ⛔ **aucun remboursement** une fois l'accès activé, sauf défaut technique majeur. L'accès au contenu vaut renonciation (`fr/legal.json:164-168`). Le Club n'est pas remboursé au prorata (`:161`). ⛔ Ne jamais écrire « 14 jours », « satisfait ou remboursé », « garantie », « sans risque ».
- **Paiement :** via Bictorys, par Wave, Orange Money, Free Money (listé dans les CGV seulement), Visa ou Mastercard (`fr/legal.json:154`). Le libellé de la transaction et la facture sont au nom de MY ONOMA SARL (`:156`). Les prestations d'agence sont encaissées hors plateforme (`fr/admin.json:193`).
- ⛔ **Jamais de prélèvement automatique.** Bictorys ne gère pas le récurrent, Wave n'a pas de mandat (PRD rév. 5 `prd.md:873,1492-1493`).
- **Prix cadrés :** 19 900 F/an s'écrit aussi « 1 658 FCFA / mois » (`Max-Morrys_DS_Platform/readme.md:83-85`).

### 2.1 Piste Apprendre

| Offre | Prix (FCFA) | TVA | Format / promesse | URL | CTA réels |
|---|---|---|---|---|---|
| **Formations** (Max-Morrys Edu) | Prix saisi dans Firestore, **aucune grille dans le code**. −20 % pour un membre du Club (`src/lib/club/pricing.ts:60`, serveur `worker/apps/api/src/lib/bictorys.ts:145`) | exonéré | Paiement unique, accès à vie, mises à jour comprises, leçons libres sans compte, certificat vérifiable, une mission par leçon (`fr/formations.json:227-230,259-265,287`, `fr/apprendre.json:105`). Niveaux : Débutant, Intermédiaire, Avancé (`formations.json:6-11`). Positionnement « deux titres » : « Je préfère deux formations que je tiens à jour à un catalogue qui fait nombre » (`formations.json:222-226,242-246`) | `edu.maxmorrys.me/formations`, `/formations/:slug`, `/checkout/:slug` | « Je m'inscris », « Commencer le module gratuit », « Acheter », « Lire une leçon libre », « Voir les formations » (`formations.json:262,263,296,365`, `fr/common.json:28`) |
| **⚠️ État réel des formations** | **Aucune formation publiée ni achetable** (PRD rév. 5 `prd.md:99,106,133`). Les deux titres ne sont nommés nulle part. États prévus : « Le catalogue ouvre bientôt » et « Bientôt / Préviens-moi à l'ouverture / Précommander maintenant » (`formations.json:231-234,300-320`) | | | | |
| **Formation d'équipe (B2B)** | sur devis | exonéré | Carte « Former toute ton équipe ? » (`formations.json:333-344`, `src/components/edu/g2/TeamQuoteCard.tsx:57-85`). Lead enregistré dans `agency_leads`, type `training` (`engagement.ts:45`). ⚠️ La copie « Max-Morrys Business » (`formations.json:66-81`) est **orpheline** : `BusinessSection` n'est pas monté | edu | « Demander un devis » → « Envoyer la demande » |
| **Certificat** | gratuit, inclus | — | Délivré par le serveur à 100 % des leçons (`fr/legal.json:138`, `worker/apps/api/src/handlers/issueCertificate.ts`). Code `MM-` suivi de 10 caractères (`src/pages/VerifyCertificate.tsx:87`). Vérification publique sans compte | `edu.maxmorrys.me/verifier` | « Vérifier un certificat » (`fr/apprendre.json:61-69`) |
| **Club des Digitos** | **19 900 /an**, formule unique (`src/lib/club/pricing.ts:30` `CLUB_PRICE_XOF = 19_900`, CGV `legal.json:140`). Parrainage : 16 915 (−15 %, `pricing.ts:36-44`). Contrevaleur ≈ 30 € / ≈ 35 $ | exonéré | « soit ≈ 1 658 FCFA par mois · payé une fois » (`fr/club.json:467-468`). Inclus : fil, messages privés, agenda, **2 sessions en direct par mois** (`pricing.ts:76`), opportunités, **−20 % sur chaque formation**, **+3 questions Rysmo par jour** (5 au lieu de 2), annuaire (`club.json:397-426,463-475`). En construction : replays, digest, cercles (`club.json:427-428,498`). « Les sessions ont lieu même si nous sommes quatre… Le prix ne bouge pas pendant ton année » (`club.json:212`) | `club.maxmorrys.me/`, `/adhesion`, `/sessions`, `/r/<code>` | « Rejoindre », « Rejoindre le Club », « Voir l'intérieur du Club » (`club.json:367,382,477`). Accueil : « Le réseau pour avancer avec d'autres. {{price}} F par an » (`fr/home.json:52`) |
| **Renouvellement Club** (commit `bde16ad`) | — | — | Sur consentement, un **lien de paiement Bictorys à J-7** (`worker/apps/api/src/lib/bictorys-billing.ts:20`, `club-autorenew.ts:14-24`, CGV `legal.json:159`) et un e-mail d'information à J-15 (`worker/apps/api/src/lib/renewal.ts:28`, `legal.json:160`) | | |
| **Rysmo IA** (assistant, « répétiteur ») | Gratuit : **2 questions par jour** (5 pour un membre du Club, `src/lib/rysmo/quota.ts:37-43`). **Packs sans expiration** : Découverte 30 requêtes / **500** ; Régulier 100 / **1 500** ; Intensif 300 / **3 500**. **Rysmo+ Lite** 20 par jour / **3 000 par mois** ; **Rysmo+ Pro** 100 par jour / **7 500 par mois** (`worker/apps/api/src/lib/bictorys.ts:118-126`, `fr/lmsTabs.json:375-404`) | indéterminée → aucune mention | « Rysmo IA répond sur la leçon que tu as sous les yeux, à n'importe quelle heure. Ton quota du jour est visible avant chaque question. » (`static-pages.ts:645-650`). Modèle Gemini `gemini-2.5-flash` (`worker/apps/api/src/lib/gemini.ts:45`), 2 000 caractères maximum, 10 derniers tours de conversation (`worker/apps/api/src/handlers/rysmo.ts:30-40`) | `edu.maxmorrys.me/assistant` (ex-`/apprendre/assistant`) | « Continue avec un pack à partir de 500 XOF » (`fr/rysmo.json:14,31`). CTA social : « Pose ta question à Rysmo » (`STRATEGIE:72`) |
| **Appli mobile Rysmo** (Expo, iOS et Android, `mobile/app.json`, bundle `me.maxmorrys.rysmo`) | ⛔ **aucun achat, aucun prix dans les fiches stores** (`store/README.md`) | — | Nom en store : « Rysmo — apprendre le digital ». Sous-titre : « Tes cours, hors ligne aussi ». Texte promo : « Le répétiteur répond en français, avec le contexte de ta formation. Et tes leçons restent lisibles quand le réseau lâche. » (`store/apple/fr-FR.md:6,9,15`). Ni pub ni pistage tiers, économe en data (`:32-42`). ⚠️ **Pas encore publiée** : comptes Apple et Play à créer (`mobile/README.md:454-460`) | — | — |
| **Gratuit / aimants** | 0 | — | Blog, podcast et vidéos « Gratuit · sans compte » (`fr/apprendre.json:29,34-45`). Liste d'attente par formation, « un seul e-mail le jour de l'ouverture » (`formations.json:305-309`). Leçons libres. La lettre. **Appel gratuit de 30 min** (visio, téléphone ou WhatsApp, `fr/contact.json:25-45`, `fr/home.json:64,85`) | `/blog`, `/podcast-et-videos`, `/contact` | « Commence par le blog » (`fr/apprendre.json:20`), « Réserver un appel de 30 min » (`fr/home.json:85`) |
| **Coaching / mentorat payant** | ⛔ **n'existe pas** en ligne | | | | |

### 2.2 Piste Conception

**Hub `/conception`.** Accroche : « Deux façons de travailler avec nous, de poids égal » (`fr/conception.json:15`). CTA : « Choisir mon niveau » et « Voir nos réalisations » (`:17-18`). Services cités : sites et plateformes, présence locale, marque et contenu, automatisation et IA (`:52-66`).

**A. Commerces et TPE, offre « Digital Commerce Local »** (`/conception/commerces-et-tpe`, EN `/en/design/shops-and-small-business`)
- Source unique des prix : `src/lib/presence/offer.ts:99-121`, grille révisée le 02/08/2026.
- **Tous les prix sont HT, TVA 18 % en sus** (`fr/presence.json:155-157,478-484`). On y **tutoie**.

| Offre | HT | TTC | Contenu | Support |
|---|---|---|---|---|
| Présence Locale | **250 000** (prix promo facturé, barré 295 000 ; `offer.ts:101`, `packEffectivePrice` `:193-195`) | 295 000 | site d'une page, fiche Google, catalogue WhatsApp de 20 produits | 30 j |
| Commerce Visible ⭐ « Si tu vends déjà » | 495 000 | 584 100 | 5 pages, catalogue de 40 produits | 30 j |
| Boutique Digitale | 895 000 | 1 056 100 | boutique en ligne de 50 produits | 60 j |
| Croissance Automatisée ⭐ (accompagnement) | 375 000 de mise en place, puis **175 000 par mois** | | 12 publications par mois, chacune validée par le client | — |
| Commerce 360 | 750 000, puis **225 000 par mois**, engagement de 6 mois | | « accompagnement commercial » retiré le 17/09 (`offer.ts:131-139`) | — |
| Options | produits 1 000–3 500 l'unité · pages 35–75 k · mesure 75–350 k · automatisation 125–250 k · maintenance 45–75 k par mois · référencement local 125–300 k par mois (`offer.ts:114-121`) | | | |

- Planchers internes, jamais affichés : 225 / 400 / 700 k (`offer.ts:101-105`).
- **Conditions :**
  - acompte de 60 % sur le HT, puis 40 % avant la mise en ligne (`offer.ts:391`, `presence.json:259-261`) ;
  - devis valable 30 jours (`offer.ts:259`) ;
  - délai de 1 à 3 semaines (`presence.json:301`) ;
  - domaine et comptes au nom du client ; publicité et outils tiers exclus (`presence.json:270-279`).
- **Promesse :** « Ton commerce, trouvé sur Google », « Trois packs. Les prix sont affichés » (`presence.json:114,466-470`). Aucun nombre de clients garanti (`:290-291`).
- **CTA :**
  - « Trouve ton pack en 3 questions » (`:8`), « Fais le test tout de suite » (`:15`), « Voir qui sort avant toi » (`:21`) ;
  - « Demander ce pack » (`:120`), « Choisir cette formule » (`:181`), « Recevoir mon devis » (`:501`) ;
  - « Poser ma question sur WhatsApp » (`:9`), « Réserver un appel » (`:518`).
- **CTA social :** « Fais le test sur Google Maps » / « Trouve ton pack en 3 questions » (`paperclip/skills/maxmorrys-brand/SKILL.md:71-73`).

**B. Projets sur mesure** (`/conception/projets-sur-mesure`, EN `/en/design/custom-projects`)
- **Aucun montant public.** On parle de « forme d'engagement » (`fr/conception.json:92,108-111,244-249`).
- Cinq familles : sites corporate et bilingues, plateformes, portails métier, systèmes de design, intégrations (`:119-139`).
- Parcours : conversation → cadrage écrit → proposition chiffrée → contrat (`:142-170`).
- Garanties : WCAG AA, le client possède le code, réversibilité (`static-pages.ts:303-317`, `conception.json:172-205`).
- Réponse sous 2 jours ouvrés (`:232`). **Vouvoiement strict.**
- CTA : « Décrire mon projet », « Envoyer ma demande » (`:49,98`).

**C. Hors maxmorrys.me :** Cléa Growth Office (growth et direction marketing, via myonoma.com) et les ventures. Rien n'est vendu sur le site.

### 2.3 Incohérences d'offre (à ne pas reproduire)
1. ⛔ **« Garantie 7 jours »** dans la base de connaissance du chatbot : `worker/apps/api/src/lib/rysmo-knowledge.ts:21` (« formations (certificat, accès à vie, garantie 7 jours)… et du coaching/consulting »). Cela contredit l'art. 6 des CGV, et le coaching n'existe pas.
2. ⛔ **Pop-up de sortie formation :**
   - `fr/shared.json:92` dit « Toutes les formations, la communauté et les sessions en direct, pour un seul abonnement ». C'est **faux** : le Club donne −20 %, pas l'accès aux formations.
   - S'y ajoutent « Sans risque » (`:88`) et « La formation la plus suivie » (`:80`) alors qu'aucune formation n'est publiée.
3. ⚠️ **Miroir SEO commerces :** « à partir de 295 000 FCFA » sans mention HT (`static-pages.ts:380,388`), contre 250 000 HT dans l'interface et le JSON-LD (`:423`, `fr/presence.json:3`).
4. ⚠️ **Miroir SEO du Club :** il annonce « ateliers en présentiel à Dakar » et « huit onglets », absents de l'interface, et ne cite pas le −20 % (`static-pages.ts:246`). Le miroir `/formations` promet un « accompagnement personnalisé » (`:170`) qui n'existe pas.
5. ⚠️ **Renouvellement du Club :** la page publique dit « rappel par e-mail 15 jours avant, si tu le demandes » sans parler du lien J-7 (`club.json:478,486`) ; l'écran d'abonnement et les CGV parlent du lien J-7 (`club.json:200,550`). La clé orpheline `formations.json:47` dit « Renouvellement auto ou manuel ».
6. ⚠️ **« Commerce Visible est remboursé au bout de 33 clients »** (`presence.json:286`) : c'est un calcul de retour sur investissement, mais le mot « remboursé » est risqué.
7. ⚠️ **Le « 14 jours » a disparu de `src/`** sur cette branche (reste `src/lib/mockData.ts:414`, code mort). Le PRD rév. 5 signale qu'il est encore en ligne sur `main` et en production : **à vérifier**.
8. ⚠️ **Noms multiples :**
   - l'offre TPE s'appelle « Digital Commerce Local » (`offer.ts:5`), « Présence Digitale » (`mobile/contenu/termes.ts:26`) ou « Commerces et TPE » (la copie en ligne) ;
   - Rysmo s'appelle « Rysmo IA », « répétiteur » ou « assistant d'apprentissage ».

   L'appli mobile pointe encore vers `/presence-digitale` (`termes.ts:47-48`).
9. ⚠️ **Docs et skills obsolètes sur les offres :**
   - `paperclip/skills/agency-offer/SKILL.md:1-13` (route `/agence`, `src/lib/agency/offer.ts` inexistant) ;
   - `paperclip/skills/formations-club-catalog/SKILL.md:13-21` (« Stripe », « Firebase Functions ») ;
   - `docs/OFFRE_AGENCE_TPE.md:8-10,85,131` ;
   - `skills/commercial-kit/SKILL.md:25-39`.

   **Aucun ne dit HT**, et tous présentent 295 000 avec une promo à 250 000.
10. ⚠️ **`BUSINESS_MODEL.md` est fictif :**
    - 5 cours à 95–200 k avec « 342/521 étudiants » (`:139-145`), repris du `mockData` mort ;
    - Club mensuel à 2 500 (`:235`), consulting payant (`:364-369`), certificats payants (`:404-406`), licences B2B (`:427-432`) : **rien de cela n'existe**.

    La fourchette 95–200 k du PRD (`prd.md:133`) vient de la même source. ⚠️ `STRATEGIE:69` dit « formations 49–249 k » et « packs 295/495/895 k ».

