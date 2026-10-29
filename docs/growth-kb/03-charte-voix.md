# 03 — Charte de voix et d'écriture

> Extrait du dossier de connaissance du 29/10/2026 (branche `refonte/sous-domaines`, HEAD `77dd43f`). Chaque fait renvoie à `fichier:ligne` : **revérifier dans le code avant de citer un prix, une règle ou une URL.** Ordre d'autorité : code et tests > i18n `src/i18n/locales/` > PRD rév. 5 > CDC 14/09 > STRATEGIE_COMMUNICATION_2026 et skills paperclip/soc (périmés) > BUSINESS_MODEL/PLAN (spéculatifs). ⚠️ contradiction · ⛔ interdit · ✅ vérifié.

## 5. Charte de voix et d'écriture

### 5.1 Registre : la règle exacte `voix-tutoiement` (✅ appliquée par les tests)
- **FR-121** (`prd-…-10-28/prd.md:574-577`) : « Le registre de voix est **fixé par piste** : la piste Conception vouvoie, toute autre copie française tutoie. … L'étage commerçants tutoie : il n'est pas dans la table de la piste. » Décision D-11, « Deux pistes, deux voix » (`prd.md:1515-1521`). FR-110 (`:1960-1964`).
- **Test** `tests/unit/voix-tutoiement.test.ts`, exécuté par `npm test` (`package.json:27`). La règle est **bidirectionnelle** :
  - Test 1 (`:109`) : « aucun catalogue français ne vouvoie, hors piste Conception ». Motif `/\b(vous|votre|vos)\b/i` (`:51`). Exemptions : `rendez-vous` et `vos échanges` (`:59`).
  - Test 2 (`:118`) : « la piste Conception ne tutoie jamais ». Motif `/\b(tu|te|toi|ton|ta|tes)\b|\bt'/i` (`:87`).
  - `PISTE_CONCEPTION = {conception.json, realisations.json}` (`:81`). `agency.json` est volontairement hors de la piste (`:76-79`).
  - Exception de sous-arbre : `levels.shops.`, la carte « Commerces et TPE » du hub, qui dit « Ici on se tutoie » (`:106`, `fr/conception.json:30`).
  - Les CGV et documents légaux **tutoient** aussi (`:17-20`).
- **Concrètement :**

| Surface | Registre | Personne |
|---|---|---|
| Accueil, nav, Apprendre, formations (**y compris B2B** « Forme tes équipes », `fr/formations.json:68`), Club, Rysmo, contact, légal | **tu** | **je** (Max-Morrys) |
| Commerces et TPE (`presence.json`), social pour les commerçants | **tu** | je |
| Conception hub, Projets sur mesure, Réalisations | **vous** | **nous** |
| Anglais | contractions, verbes à particule | « I » ; ⛔ « Contact us », « our team », « our agency », « our company », « I am Max-Morrys », « I educate/inform/transform/digitize you » ; ⛔ « Digital Presence » comme libellé de nav (`tests/unit/voix-anglaise.test.ts:50-57,99-138`). Libellés imposés : « I'm Max-Morrys », « I'll train you », « I'll keep you posted », « I'll push you further », « I'll get you online », « Talk to me ». La piste Design dit « We design » (`en/conception.json:11`) |

- ⚠️ **Sources périmées qui disent « tutoiement partout, y compris /agence ; vouvoiement pour les blocs B2B » :**
  - `paperclip/skills/maxmorrys-brand/SKILL.md:58-62` ;
  - `STRATEGIE:88-89,398` ;
  - `content-strategy/SKILL.md:141` ;
  - `PROMPTS_YOUTUBE_MAXMORRYS.md:33` ;
  - DS readme `:63` (« sans exception ») ;
  - `ARCHITECTURE-SPINE.md:266` (« jamais « nous » ») ;
  - Charte `:182-183`.

  ⚠️ La table de traduction pour commerçants est **au vouvoiement** (« Votre commerce visible 24h/24 ») dans `STRATEGIE:376-382`, `skills/commercial-kit/SKILL.md:66-72` et `paperclip/skills/agency-offer/SKILL.md:69-72`. **Il faut la retourner au tutoiement.**
- **Sur le social** (pas de test) : appliquer le même principe. Contenus Apprenants et commerçants en tu, je. Contenus agence sur mesure ou corporate (LinkedIn B2B) en vous, nous.

### 5.2 Ton
- « Inspirant, clair, jamais racoleur » (`maxmorrys-brand:9`).
- Phrases courtes, « sans blabla », résultats mesurables, 1 à 3 touches locales, **un seul CTA par contenu** (`:61-74`).
- Ce qu'on n'est pas : corporate rigide, gourou américain traduit, hustle toxique, fausse modestie (`:61-74`).
- Les états vides ne disent jamais « oups » et ne s'excusent jamais. Format : motif réel, conséquence, sortie (DS readme `:79-80`, `ARCHITECTURE-SPINE.md:262`).
- **Lexique à favoriser :** maîtriser, accélérer, structurer, passer à l'action, croissance, résultat concret, méthode, automatiser, optimiser (`skills/soc-brand-kit/SKILL.md:26-29`, Charte `:166-185`).
- **CTA types :** Découvrir, Rejoindre, Télécharger, Réserver un appel, Commencer (`soc-brand-kit:30`).
- ⛔ **Avec les commerçants**, ne pas employer : « site web », « SEO », « catalogue Meta », « Merchant Center », « GA4 », « pixel », « workflow », « n8n » (`maxmorrys-brand:87-89`).
  - Sur Facebook, l'ordre est imposé : Maps → concurrent → packs. « Ne jamais commencer par le site web » (`STRATEGIE:368-388`).
  - La copie en ligne s'autorise une forme négative : « Pas un simple site web : un système… » (`fr/presence.json:36`).
- ⛔ **Anti-charte :**
  - pas de « -70 % !!! », **aucun montant cité de mémoire** (`maxmorrys-brand:80-85`) ; la source des prix est `src/lib/presence/offer.ts` et `src/lib/club/pricing.ts`, pas `src/lib/agency/offer.ts`, qui n'existe pas ;
  - aucun montant dans les titres YouTube ou n8n (`scripts/n8n-patch-strategy-2026.py:187`) ;
  - « La Note » ne dénigre jamais un commerce nommé ; un RADAR est **daté et sourcé** (`content-strategy:147-152`, `paperclip/skills/trends-radar/SKILL.md:45`) ;
  - jamais « 15 astuces » (`trends-radar:128`) ; « On enseigne le principe, jamais le livrable » (`:139-140`) ;
  - jamais « Salut c'est Max, aujourd'hui… » (`PROMPTS_YOUTUBE:82`).
- ⛔ **Preuve sociale :**
  - ni note ni nombre d'inscrits (`tests/unit/interdits-preuve-sociale.test.ts:7-13,61`) ; « Je n'affiche ni note ni nombre d'inscrits » (DS readme `:75-78`) ;
  - aucun chiffre d'audience (abonnés, vues, élèves) ; seuls des chiffres de production, datés, sur `/a-propos` (`static-pages.ts:39-42`) ;
  - « Règle du monospace » : un nombre affiché vient de la base ou d'une source citée (DS readme `:71-74`).
  - ⚠️ `STRATEGIE:92` et `maxmorrys-brand:66` mettent en avant « 33 clients » et « +1 790 % » : à **ne pas** utiliser sans source.

### 5.3 Typographie et forme
- **Emojis :** ⛔ **aucun sur le web ni sur les slides** (DS readme `:86-87`). Seuls le point médian `·` et les guillemets français « » sont admis. La flèche « → » est retirée de l'interface (`src/design-system/react/data/TranslationNotice.tsx:20-21`). Sur le social, emojis encadrés par réseau (§5.5).
- **Casse :**
  - titres d'affichage en capitales sur trois lignes courtes (`JE TE FORME / AU DIGITAL. / DEPUIS DAKAR.`) ;
  - titres-phrases en casse normale ;
  - sourcils en capitales monospace ;
  - boutons en casse de phrase (DS readme `:67-70`).
- **Titres :** tableau de lignes, chaque ligne insécable (AD-13, `ARCHITECTURE-SPINE.md:163-166`).
- ⛔ **Les crochets sont porteurs** (surlignage de l'arc, AD-23 : `src/components/site/SiteType.tsx:46-70,80-82,151-160`). Les retirer casse l'arc sans aucune alerte. Exemples en ligne :
  - « Former. Construire. [Transmettre.] » (`fr/home.json:3`) ;
  - « ou [construire avec moi.] » (`fr/home.json:46`) ;
  - « [en ligne.] » (`fr/conception.json:13`) ;
  - « [PUIS TU REJOINS.] » (`fr/apprendre.json:15`) ;
  - « ton [projet.] » (`fr/contact.json:9`) ;
  - « [sur Google.] » (`fr/presence.json:456`) ;
  - « [livrés.] » (`fr/realisations.json:12`).

  La position du crochet change selon la langue, puisque les titres sont **écrits** dans chaque langue.
- **Usage réel dans les catalogues FR** (aucun test ne le vérifie) :
  - guillemets « » ;
  - tiret long — entouré d'espaces ;
  - apostrophe majoritairement droite (1 571 contre 67) ;
  - **espace normale** avant `: ? !`, aucun U+00A0 ni U+202F dans les catalogues ;
  - séparateur de milliers = espace insécable produite par le code (`src/design-system/react/data/Num.tsx:67,81`, `src/lib/currency/convert.ts:133-139`) ; virgule en anglais.
  - Pour les livrables marketing hors code, recommandé : espace fine insécable avant `; ! ?` et insécable avant `:` et dans « 19 900 F ». **Ce n'est pas une règle écrite du repo.**
- **Écriture inclusive au point médian** : « trouvé·e » (`fr/home.json:38`), « inscrit·e » (`fr/club.json:373`), « Prêt·e à commencer ? » (`fr/formations.json:358`).
- ⛔ **Aucune date en toutes lettres dans l'i18n**, mois seul compris : il faut l'interpolation `{{asOf}}`. Règle 6 de `scripts/proof-check.mjs:134-171` ; exemptions : `legal.json` et `about.json › experiences.*`. Les autres règles de proof:check :
  - preuves non orphelines ;
  - aucune phrase qui nie une fonction livrée (`:302-376`) ;
  - le miroir SEO cite les mêmes moyens de paiement (`:261-300`).
- **Pas de doublon :** aucune phrase de plus de 60 caractères servie deux fois (`tests/unit/copie-doublons.test.ts`).

### 5.7 Copie réelle de référence
- **Navigation FR :** « Je suis Max-Morrys · Je te forme · Je t'informe · Je te transforme · Je te digitalise · Contacte-moi » (`fr/nav.json:3-13`). Barre haute neutre : Conception / Apprendre / À propos / Contact (`:27-30`).
- **Accueil :**
  - « Marketing digital, SEO, IA. Payées en Wave, Orange Money ou carte, à toi pour toujours. » (`fr/home.json:49`) ;
  - « Ta présence en ligne, en pack, avec un devis immédiat. » (`:55`) ;
  - « Plateformes, sites, produits. Sur devis, vouvoiement de rigueur. » (`:58`) ;
  - « Construisons ta marque, / et ton business. » (`:84`).
- **Conception (vous, nous) :**
  - « Nous concevons / votre présence / [en ligne.] » (`fr/conception.json:11-13`) ;
  - « Votre projet, à votre échelle. » (`:22`) ;
  - « Nous qualifions votre besoin avant de parler de budget. » (`:43`) ;
  - « C'est reçu. / Nous vous [répondons.] » (`:273`).
- **Apprendre :** « TU LIS. TU ÉCOUTES. / TU TE FORMES, / [PUIS TU REJOINS.] » (`fr/apprendre.json:13-15`) ; « Je ne te demande pas ton adresse pour lire ou pour écouter… » (`:21`).
- **Club :** « Apprends le digital / avec d'autres, / pas seul. » ; « Wave, Orange Money ou carte · aucun prélèvement automatique » (`fr/club.json:379-383`).
- **Commerces :** « Aujourd'hui, ils trouvent tes concurrents… » (`fr/presence.json:7`) ; « Fais le test tout de suite » (`:15`).
- **Contact :** « Parlons de / ton [projet.] » ; « Dis-moi ce que tu cherches : je t'envoie au bon endroit… » (`fr/contact.json:8-11`).
- **Calendrier social (piste commerçants) :** « Je t'offre l'audit de ta fiche Google — dis-moi ton métier et ton quartier » → CTA « Trouve ton pack en 3 questions ».

