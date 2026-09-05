---
date: '2026-09-05'
statut: 'spécification — source d''autorité pour la réécriture Jetpack Compose'
portee: 'les écrans, leur contenu, leur navigation, leurs destinations typées'
---

# Spécification exhaustive des écrans — application native Rysmo

## Ce document, et comment le lire

Il décrit **ce que la version Compose doit rendre**, écran par écran, et **comment on y arrive**.
Il est écrit contre trois sources, dans cet ordre d'autorité :

| Rang | Source | Ce qu'elle fait autorité sur | Chemin |
|---|---|---|---|
| 1 | **Le kit natif** | le RENDU : quelles sections, quels composants, quels textes | `DS_Final/ui_kits/native/*.js` (7 fichiers, 2 861 lignes de code d'écran) |
| 2 | **Le port React Native supprimé** | le COMPORTEMENT réellement porté : données, arêtes, gardes | `git show 9c22076:mobile/app/…` (55 fichiers, supprimés de l'arbre au commit `922b4d8`) |
| 3 | Les README du kit | l'intention déclarée — **contredits trois fois par le code, voir § F** | `DS_Final/ui_kits/native/README.md`, `DS_Final/readme.md` |

**Règle appliquée sans exception :** chaque affirmation cite un fichier et des lignes. Là où deux
sources se contredisent, la contradiction est écrite (§ F) et **aucune n'est choisie en silence** —
la décision revient à l'humain.

**Ce document ne rejoue pas d'audit hérité.** Les comptes annoncés ailleurs (« 43 écrans »,
« 36 écrans », « 11 routes inatteignables sur 51 ») ont tous été recomptés contre le code. Deux
sont faux, et le § F dit lesquels.

---

## 0 · Le compte exact, et pourquoi il est défendable

### 42 écrans dans le kit

Le compte se dérive des `MM_EXPORT` des six fichiers d'écrans, en retirant les non-écrans
(châssis, primitives, tables) et les alias :

| Fichier | Écrans | Noms |
|---|---:|---|
| `ScreensNatif.js` | 9 | `Lancement` `Onboarding` `Permissions` `MurPaiement` `Telechargements` `LecteurPleinEcran` `WidgetAccueil` `PartageSysteme` `Biometrie` |
| `ScreensNatifApp.js` | 6 | `NatCatalogue` `NatRetourPaiement` `NatEspace` `NatLecteur` `NatNotes` `NatCertificat` |
| `ScreensNatifEtats.js` | 6 | `NatRepetiteur` `NatMemoire` `NatChargement` `NatVide` `NatErreur` `NatHorsConnexion` |
| `ScreensNatifCompte.js` | 7 | `NatConnexion` `NatCreation` `NatPreferences` `NatSuppression` `NatClubMur` `NatClubFil` `NatClubAgenda` |
| `ScreensNatifMedia.js` | 7 | `NatMediaPole` `NatMediaEpisode` `NatEcranVerrouille` `NatPresence` `NatDevis` `NatConsoleSupport` `NatInterdit` |
| `ScreensNatifClub.js` | 7 | `NatClubDiscussions` `NatClubMembres` `NatClubClassement` `NatClubOpportunites` `NatClubInformations` `NatClubParrainage` `NatClubVerrouille` |
| | **42** | |

**Vérification croisée par les planches.** Les cinq planches de portage numérotent leurs écrans
en continu de `01` à `34` (`natif-argent-apprentissage.html:57` → `natif-club-huit-onglets.html:93`),
et `natif-neuf-ecrans.html:55-84` numérote les neuf écrans natifs de `01` à `09`.
34 + 9 = 43 **slots**, mais `MurPaiement` occupe deux slots à la fois — portage `02`
(`natif-argent-apprentissage.html:61`) **et** natif `04` (`natif-neuf-ecrans.html:62`). Le compte
de composants distincts est donc **42**, pas 43.

### Ce qui n'est PAS un écran

**Le châssis** (`NativeShell.js`, 236 l.) — `NativeScreen` (L146–L185) est l'enveloppe, pas un
écran. Avec lui : `StatusIos` (L28), `StatusAndro` (L63), `EncocheIos` (L51), `PoinconAndro` (L88),
`AccueilIos` (L55), `NavAndro` (L94), `NavBarIos` (L115), `NavBarAndro` (L129), `NTitre` (L188),
`NSourcil` (L196), `NChapo` (L200), `BandeClub` (L223), `CLUB_ORDRE` (L221), `NATIF` (L21).

**Les enveloppes et primitives d'écran** — `EcranClub` (`ScreensNatifClub.js:70`),
`FabClub` (`:50`), `actionHaut` (`:64`), `ApercuVerrou` (`:460`), `VERROU_NAT` (`:407-456`),
`Clavier` (`ScreensNatifEtats.js:23`), `MiniLecteur` (`ScreensNatifMedia.js:23`).

**Les trois tables d'onglets, identiques** — `TABS_NAT` (`ScreensNatif.js:23-29`),
`ONGLETS` (`ScreensNatifApp.js:21-27`), `ONGLETS_C` (`ScreensNatifClub.js:37-43`) déclarent les
**mêmes cinq onglets** (Espace · Cours · Répétiteur · Club · Profil), avec les mêmes glyphes et la
même taille 21. ⛔ **Trois déclarations d'une même vérité : à collapser en une seule en Compose.**

### Les 8 alias `NatVerrou*` ne sont PAS des écrans

`ScreensNatifClub.js:612-619` — huit constantes fléchées, toutes de la forme
`(p)=><NatClubVerrouille {...p} onglet="X" />`. Elles existent uniquement pour que la planche
puisse « monter par nom » (commentaire `:611`). Le vrai écran est `NatClubVerrouille` (L534–L609),
paramétré par `onglet` (défaut `'Opportunités'`, L534) qui indexe `VERROU_NAT` (L407-456) et
`ApercuVerrou` (L460).

**En Compose, cela devient UN composable avec un argument `onglet`,** pas huit destinations —
mais l'argument est **obligatoire** dans la route, parce que c'est la seule information qu'on
possède en plus (`ScreensNatifClub.js:378-384`).

---

## A · Inventaire des écrans du kit

Conventions de lecture : `territoire` = prop `territory` de `NativeScreen` ; « barre basse » =
prop `tabbar` ; « retour » et « titre » sont les props homonymes. Sur iOS, un titre `null` signifie
que le grand titre `NTitre` porte seul l'identité de l'écran.

### A.1 · Les neuf écrans propres au natif — `ScreensNatif.js`

| # | Écran | Lignes | Châssis | Structure rendue | Entrées |
|---|---|---|---|---|---|
| 01 | `Lancement` | L34–L44 | `territory="transforme"`, pas de barre haute, pas de barre basse | `Wordmark brand="rysmo" size=44` centré + une ligne mono « par Max-Morrys · Dakar ». **Aucun indicateur de progression** (raison écrite L31-33) | aucune |
| 02 | `Onboarding` | L49–L74 | `territory="forme"`, `droite` = « Passer » | Vignette dégradée 220 px + `Wordmark night` ; `NSourcil` « 1 sur 3 » ; `NTitre` 3 lignes ; `NChapo` ; 3 points de pas ; `Button tone="forme"` « Continuer » ; note « Aucun compte demandé » | index de pas (0-2) |
| 03 | `Permissions` | L80–L118 | `territory="transforme"`, centré | Glyphe cloche 66 px ; `NTitre` 3 lignes ; `NChapo` ; `GlassPanel level="flat"` avec **3 `LessonRow` nommant les 3 envois** ; `GlassPanel level="truth"` « ce que je ne t'enverrai jamais » ; 2 boutons ; **texte de bas différent iOS/Android** (L83-85 : iOS ne laisse poser qu'une fois) | `os` |
| 04 | `MurPaiement` | L125–L177 | `territory="forme"`, `retour="Cours"`, titre Android « Référencement local », `droite` = partage | Média 150 px + `Tag` « Aperçu · 4 min gratuit » ; `NSourcil` « SEO · 6 modules · 47 leçons » ; `NTitre` ; **`GlassPanel level="hero"`** : « Je ne peux pas te faire payer ici. » + **le magasin nommé** (L141) + `PriceBlock 95 000` + `Button` « Ouvrir sur maxmorrys.me » + 3 `Tag` Wave/OM/Carte ; panneau « Après le paiement » ; 3 `LessonRow` de modules (1 ouvert, 2 cadenassés) | `os`, formation |
| 05 | `Telechargements` | L182–L238 | `territory="forme"`, `retour="Profil"`, titre « Téléchargements » | `NSourcil` + `NTitre` (« 21 Mo / sur ton téléphone ») ; réglages (Wi-Fi seul `Switch on`, qualité 480p) ; 3 `LessonRow state="done"` avec poids et bouton corbeille ; total + `ProgressBar value=4` + plafond 512 Mo + « Tout supprimer » ; encart de vérité | total occupé, liste des ressources avec poids |
| 06 | `LecteurPleinEcran` | L244–L307 | ⛔ **hors châssis** — `<div>` propre, **PAYSAGE** `g.h × g.w` | Dégradé plein cadre ; barre haute (fermer / titre+méta / « Transcription ») ; commandes centrales (−15 / pause 70 px / +15) ; barre basse (03:12 · piste · 08:24 · « 1× ») ; phrase réseau. Encoche/poinçon et indicateur d'accueil redessinés localement (L221-223, L302-304) | position, durée, titre, module |
| 07 | `WidgetAccueil` | L313–L389 | ⛔ **hors châssis** — fond d'écran personnel, `dark` | Widget moyen (reprise : wordmark, titre, « 16 / 47 leçons · 34 % », barre, pilule « Reprendre ») ; widget petit « Série 3 j / record 7 j » ; grille de 4 icônes d'app ; encart noir « pourquoi ce widget existe ». Coins iOS 15 px / Android 50 % (L316) | progression, série |
| 08 | `PartageSysteme` | L394–L462 | ⛔ **hors châssis** — écran du certificat **recouvert** d'un voile `rgba(14,17,22,.3)` (L419) | Feuille système : poignée (iOS seulement, L423), en-tête document + URL de vérification, rangée de 5 cibles (LinkedIn, WhatsApp, Facebook, E-mail, Autre), 2 `LessonRow` (copier le lien / enregistrer le PDF), phrase « ce qui part est le lien » | code, titulaire, formation |
| 09 | `Biometrie` | L468–L505 | `territory="transforme"`, centré | Glyphe cadenas 66 px ; `NTitre` **variant par plateforme** (L481-482 : « FACE ID ? » / « TON EMPREINTE ? ») ; `NChapo` ; `GlassPanel` avec 4 `CheckLine` dont une à tiret ; 2 boutons ; encart « pourquoi cette question arrive maintenant » | `os`, capacité de l'appareil |

### A.2 · Argent et apprentissage — `ScreensNatifApp.js`

| # | Écran | Lignes | Châssis | Structure rendue | Entrées |
|---|---|---|---|---|---|
| 01 | `NatCatalogue` | L32–L71 | `territory="forme"`, titre Android « Mes cours », `droite` = recherche + cloche **à pastille**, barre basse `active="Cours"` | `NSourcil` « Je te forme · accès à vie » ; `NTitre` « 2 FORMATIONS. / ACCÈS À VIE. » ; `NChapo` ; `ChipRow` 3 filtres ; 2 `TerritoryCard` (forme, transforme) chacune avec `PriceBlock` + `Button` « Voir » ; encart « pourquoi il n'y a que deux titres ». **Ni note ni compteur d'inscrits** (raison L29-30) | catalogue (n formations) |
| 02 | `NatRetourPaiement` | L77–L106 | `territory="forme"`, centré, **sans barre haute** | Glyphe check 68 px ; `NTitre` « C'EST À TOI. » ; `NChapo` ; `GlassPanel` de 4 `DocLine` (Formation / Payée sur / Moyen / Accès) ; 2 boutons ; encart « où est passé le reçu ». **Ce n'est pas « paiement accepté »** (raison L73-76) | formation, moyen de paiement |
| 03 | `NatEspace` | L111–L186 | `territory="transforme"`, `droite` = cloche à pastille + `Avatar`, barre basse `active="Espace"` | `NSourcil` daté ; `NTitre` « Bonsoir / Aïssatou » ; **`TerritoryCard first` de reprise, premier objet non négociable** (L118) ; **carte de notification, propre au natif** (L128) ; 2 tuiles (Série / Niveau) ; carte répétiteur + `QuotaMeter used=2 total=5` ; `NSourcil` « Dans ton espace » + 3 `LessonRow` (paiements / certificats / téléchargements) | moi, espace, quota |
| 04 | `NatLecteur` | L191–L245 | `territory="forme"`, `retour="Cours"`, titre Android « Module 3 · Leçon 5 », `droite` = télécharger, barre basse `active="Cours"` | Média 178 px avec lecture + **bouton plein écran en haut à droite** (L207) + piste ; `ChipRow` 4 vues (Vidéo / Transcription / Mes notes / Ressources) ; `NSourcil` « Le programme » + « 34 % » + `ProgressBar` ; 5 `LessonRow` (done ×2, current, todo ×2) ; note sur les poids | leçon, module, programme |
| 05 | `NatNotes` | L250–L297 | `territory="forme"`, `retour="Leçon"`, titre Android « Mes notes », `droite` = recherche, barre basse `active="Cours"` | `NSourcil` + `NTitre` ; « 14 notes · 6 leçons » + `Tag` « Toi seule les lis » ; `ChipRow` 4 vues ; 5 `LessonRow` de notes ; encart « ce qu'elles deviennent » ; **bouton flottant** (L291-296) : rond sur iOS, `borderRadius:18` sur Android, placé à `NATIF[os].bottom + 96` px | notes (texte, horodatage, leçon) |
| 06 | `NatCertificat` | L302–L339 | `territory="forme"`, `retour="Espace"`, `droite` = partage. **Pas de barre basse** | `NSourcil` daté ; `NTitre` « C'EST FAIT, / AÏSSATOU. » ; `GlassPanel level="hero" className="sheen"` (**la brillance, deuxième moment scénarisé**) portant `Wordmark brand="signature"`, `Tag` « Vérifié », titre de formation, titulaire, **code mono `MM-C7K4-9RTX-2081`** ; un seul `Button` de partage (feuille système) ; encart « ce que ce code prouve » ; 3 `DocLine` | code, titulaire, formation, date, leçons |

### A.3 · Répétiteur et états — `ScreensNatifEtats.js`

| # | Écran | Lignes | Châssis | Structure rendue | Entrées |
|---|---|---|---|---|---|
| 01 | `NatRepetiteur` | L70–L126 | ⛔ **hors châssis** — `<div>` propre + `Mesh` + barre d'état + `NavBarIos`/`NavBarAndro` montées à la main (L84-86) | **`QuotaMeter` épinglé sous la barre haute, hors du flux défilant** (L89-91 — c'est LA décision de l'écran) ; fil de `ChatBubble` (accueil, question, réponse en 3 points) ; carte « Depuis ton cours » + `Button` « Ouvrir la leçon » ; **champ de saisie remonté à `bottom: hClavier`** (L110) ; `Clavier` (L124). Hauteurs mesurées : **291 px iOS, 268 px Android** (L72) | échanges, quota (utilisé/total), nom du tuteur |
| 02 | `NatMemoire` | L131–L175 | `territory="transforme"`, `retour="Répétiteur"`, titre Android « Mémoire de profil », `droite` = fermer | `NSourcil` + `NTitre` « DONNE-LUI / UN NOM. » ; `GlassPanel level="hero"` : `Field` de renommage + `ChipRow layout="wrap"` de 4 propositions + note « Rysmo reste le nom de l'application » ; `NSourcil` « Ce qu'il a retenu » + **5 `LessonRow` chacune avec un bouton d'oubli unitaire** (L167-171) ; « Tout effacer » ; encart | nom du tuteur, lignes de mémoire (texte + depuis) |
| 03 | `NatChargement` | L179–L202 | `territory="forme"`, `droite` = **2 `Skeleton` ronds** (le chrome est aussi en attente), barre basse `active="Espace"` | Squelette ayant **la forme exacte de `NatEspace`** : sur-ligne, 2 lignes de titre, carte 124 px, 2 tuiles 86 px, carte 92 px, sur-ligne, 3 lignes 46 px + phrase « Quand le contenu arrive, rien ne saute. » | aucune |
| 04 | `NatVide` | L206–L225 | `territory="transforme"`, `retour="Espace"`, titre Android **« Mes certificats »**, barre basse `active="Profil"` | `EmptyState` (glyphe doc, titre, corps, **une** action « Reprendre la leçon 5 ») ; phrase de bas : **« 0 émis depuis l'ouverture de ton compte, le 12 août »** — le zéro est daté (L221-223) | date d'ouverture du compte, compte d'émissions |
| 05 | `NatErreur` | L230–L258 | `territory="forme"`, `retour="Cours"`, centré | Glyphe alerte rouge 66 px ; `NTitre` ; `GlassPanel` en deux temps **`Le motif` puis `La conséquence`** (L241-247) ; `Button` « Réessayer » ; `Button tone="quiet"` « Lire la transcription à la place » ; « 0 Mo à charger » ; **référence d'incident `MM-E-7741`** | motif, conséquence, référence |
| 06 | `NatHorsConnexion` | L264–L298 | `territory="informe"`, `retour="Cours"`, `droite` = `Tag tone="stop"` « Hors connexion », barre basse `active="Cours"` | `NTitre` « Pas de réseau. » ; `NChapo` (n leçons téléchargées) ; « Disponible sans réseau » : 3 `LessonRow` avec poids ; **« En attente d'envoi » : 2 `LessonRow` avec `Tag tone="warn"` « en file »** ; encart « ce que l'app sait, et que le site ignorait » | liste hors-ligne, file d'envoi |

### A.4 · Compte et Club — `ScreensNatifCompte.js`

| # | Écran | Lignes | Châssis | Structure rendue | Entrées |
|---|---|---|---|---|---|
| 01 | `NatConnexion` | L24–L74 | `territory="forme"`, centré, `droite` = fermer | `Wordmark` ; `NTitre` « CONTENT DE / TE REVOIR. » ; `GlassPanel level="hero"` : **`Button` « Continuer avec Apple » rendu UNIQUEMENT si `os === 'ios'`** (L36-45 — App Store 4.8), `Button` « Continuer avec Google », séparateur « ou », 2 `Field`, `Button` « Je me connecte », « Mot de passe oublié ? » ; **encart dont le texte compte « trois moyens » sur iOS et « deux » sur Android** (L61-67) ; pied « Crée-le, c'est gratuit » | `os` |
| 02 | `NatCreation` | L78–L128 | `territory="forme"`, `retour="Connexion"`, titre Android « Créer un compte » | `NTitre` « ON COMMENCE / PAR TOI. » ; même bloc de connexion tierce (Apple iOS seul, L86-93) ; 3 `Field` ; **case de consentement `useState(false)` — jamais pré-cochée** (L79, L109-121) ; `Button` « Crée mon compte » ; encart « cette case n'est jamais pré-cochée » | `os` |
| 03 | `NatPreferences` | L133–L201 | `territory="transforme"`, `retour="Espace"`, titre Android « Mon profil », barre basse `active="Profil"` | Carte d'identité (Avatar 54, nom, e-mail, « Modifier ») ; **Notifications : 3 `Switch on` + une 4ᵉ ligne « Par e-mail » grisée avec `Switch disabled`** (L146-152) ; carte verte « Autorisées sur cet appareil » disant que l'app **ne peut plus reposer la question** ; Langue (`Segmented` FR/EN) et Apparence (`Segmented` Clair/Sombre/Système) ; nom du répétiteur (`Field`) ; « Sur cet appareil » (biométrie `Switch`, téléchargements) ; « Tes données » (exporter, **supprimer** en rouge) | moi, état de la permission système, nom du tuteur |
| 04 | `NatSuppression` | L206–L237 | `territory="transforme"`, `retour="Profil"`, titre Android « Supprimer mon compte » | `NTitre` « Ce qui part / avec ton compte. » ; **5 `LessonRow` de ce qui part**, dont « Les 21 Mo téléchargés sur ce téléphone » ; carte verte « Ce qui reste » (les certificats restent vérifiables) ; `Field` de confirmation `state="error"` attendant le mot **SUPPRIMER** + `Button disabled` + « J'exporte d'abord » ; encart « pourquoi tout se passe ici » (App Store 5.1.1(v)) | inscriptions, notes, club, stockage |
| 05 | `NatClubMur` | L242–L283 | `territory="transforme"`, `retour="Espace"`, titre Android « Le Club », barre basse `active="Club"` | `NSourcil` « Je te transforme · payant, fermé » ; `NTitre` « LE CLUB DES / DIGITOS. » ; `NChapo` ; `GlassPanel level="hero"` : **« 1 658 F / mois » + « Facturé 19 900 F, une fois »** + **le magasin nommé** (L258) + `Button` « Ouvrir sur maxmorrys.me » + « Parrainé ? 16 915 F » ; 5 `CheckLine` d'engagements ; encart « ce que je ne te promets pas » (aucun nombre de membres) | prix, remise filleul |
| 06 | `NatClubFil` | L287–L354 | `territory="transforme"`, **pas de `retour`**, titre Android « Le fil », `droite` = cloche + Avatar, barre basse `active="Club"` | **`GlassPanel level="ink"` du bilan d'abonnement, permanent** (L292-322 : 3 nombres, échéance, « rien n'est prélevé ») ; **`BandeClub actif="Fil"`** (L326) ; une publication de membre (Avatar, nom, `Tag`, texte, 3 compteurs de réaction) ; une `TerritoryCard` de mission + `Button` « Postuler » | bilan (3 mesures + échéance), fil, mission |
| 07 | `NatClubAgenda` | L360–L412 | `territory="transforme"`, `retour="Club"`, titre Android « Agenda », barre basse `active="Club"` | `BandeClub actif="Agenda"` (L364) ; `Segmented` (À venir / Mes inscriptions / Passées) ; 2 sessions datées, chacune glyphe + titre + horaire ; la première : `Tag` « Tu es inscrite » + « Me désinscrire » + **`Button` « Ajouter à mon agenda » — la seule action native gagnée par le portage** (L399-401) ; la seconde : « 4 / 12 places » + « Je réserve » ; encart | agenda (sessions, places, inscription) |

### A.5 · Média, TPE, console — `ScreensNatifMedia.js`

| # | Écran | Lignes | Châssis | Structure rendue | Entrées |
|---|---|---|---|---|---|
| 01 | `NatMediaPole` | L48–L87 | `territory="transforme"`, `droite` = recherche, barre basse **`active="Club"`** (L53 — le pôle média vit sous le 4ᵉ onglet) | `SubNav` 2 entrées (Écouter & regarder / Le Club) ; `NSourcil` « Je te transforme · gratuit » ; `NTitre` ; `NChapo` ; 2 `Tag` (« Écoute gratuite, sans compte », « Continue écran verrouillé ») ; `MediaCard format="audio"` avec **coûts `['34:20','31 Mo','Transcription · 0 Mo']`** ; `MediaCard format="video"` ; encart ; **`MiniLecteur` monté en bas (L85)** | épisode, vidéo, lecture en cours |
| 02 | `NatMediaEpisode` | L92–L144 | `territory="transforme"`, `retour="Écouter"`, titre Android « Épisode 1 », `droite` = partage | `NSourcil` + `NTitre` + ligne mono (date · durée · invité) ; bloc de lecture dégradé (−15 / pause 62 px / +15 + piste) ; **`Button` « Télécharger · 31 Mo » + `Button` « 1× »** (ce qu'un navigateur ne garde pas, L128-133) ; `Segmented` (Transcription / Chapitres / Notes) ; phrase « 0 Mo contre 31 » ; 4 `LessonRow` de transcription horodatée | épisode, transcription, position |
| 03 | `NatEcranVerrouille` | L151–L248 | ⛔ **hors châssis**, `dark`, fond d'écran personnel | **Divergence de forme la plus large du kit :** iOS = horloge 82 px centrée + lecteur pleine largeur (pochette 58, titre, « Rysmo · avec Fatou D. », piste épaisse 7 px, −15 / pause / +15) ; Android = date à gauche + horloge 62 px + **carte de notification média** (wordmark + « · maintenant », pochette 50, pause ronde, piste 4 px). Rembourrage `boxSizing:'border-box'` obligatoire (L166-170) | épisode, position, durée |
| 04 | `NatPresence` | L253–L293 | `territory="digitalise"`, titre Android « Présence Digitale », `droite` = WhatsApp | `NSourcil` « Je te digitalise » ; `NTitre` 3 lignes ; `NChapo` ; **`GlassPanel level="hero"` d'ancrage désamorcé AVANT le prix** (L262-266 : la question « une agence me vend 400 000 F… », réponse 250 000 F) ; sélecteur 3 questions (`StepDots total=3 current=2` + 3 `PayOption`) ; `TerritoryCard` « Pack Visible » + `PriceBlock 250 000 strike 295 000` + « Mon devis » ; note « aucune règle de magasin ne s'applique » | réponse au sélecteur, pack |
| 05 | `NatDevis` | L298–L330 | `territory="digitalise"`, `retour="Offre"`, titre Android « Ton devis », `droite` = partage | `NSourcil` « Devis · consultable sans compte » ; `NTitre` ; **URL mono `maxmorrys.me/devis/MM-D-4831`** ; `GlassPanel` de 5 `DocLine` + `PriceBlock 250 000` + `Tag` « Valide 30 j » + dates d'émission/validité ; `Button` « Continuer sur WhatsApp » ; `Button` de partage ; encart « figé à l'émission » | code de devis, lignes, prix, dates |
| 06 | `NatConsoleSupport` | L336–L374 | `territory="nuit"` **`dark`**, `retour` iOS « Profil », titre Android « Console · support », `droite` = cloche | `NSourcil` **« Rôle support · 5 écrans sur 19 »** ; `NTitre` « À traiter / aujourd'hui. » ; 2 `StatTile dark` ; `Pipeline` (tout 1 / à traiter 1 / clos 0) ; 1 `LessonRow` de prospect + `Button` « Qualifier » ; **« Ce que ton rôle atteint » : 5 `LessonRow`** (Messages, Témoignages, Rendez-vous, Prospects, Projets) avec leur compte ; pied « ce que cet écran ne couvre pas » | console (compteurs, file), portée du rôle |
| 07 | `NatInterdit` | L379–L403 | `territory="nuit"` **`dark`**, `retour` iOS « Console », titre Android « Accès refusé » | **« 403 » en mono 86 px à 14 % d'opacité** ; `NTitre` « Cette page n'est / pas pour ce rôle. » ; `NChapo` ; 5 `LessonRow` de la portée du rôle, chacune avec un chevron ; encart « un garde de route cache, il n'interdit pas » | rôle, portée |

### A.6 · Le Club au complet — `ScreensNatifClub.js`

**L'enveloppe `EcranClub` (L70–L79)** porte les six onglets de liste :
`NativeScreen territory="transforme"`, `retour` = `'Espace'` sur iOS / `undefined` sur Android,
**`titre = onglet` sur les DEUX plateformes** (L72 — le ternaire `os === 'android' ? onglet : onglet`
est dégénéré, les deux branches sont identiques), barre basse `active="Club"`, puis
`BandeClub actif={onglet}` (L76), puis le contenu.

⛔ **Trois traitements différents pour huit onglets d'un même espace** — mesuré :

| Écran | `retour` iOS | `titre` iOS | Bande |
|---|---|---|---|
| Les 6 via `EcranClub` (L71-73) | `"Espace"` | l'onglet | ✅ `BandeClub` |
| `NatClubFil` (L288-291) | **aucun** | **`null`** | ✅ `BandeClub actif="Fil"` (L326) |
| `NatClubAgenda` (L361) | **`"Club"`** | **`null`** | ✅ `BandeClub actif="Agenda"` (L364) |
| `NatClubVerrouille` (L538-540) | `"Espace"` | l'onglet (toujours) | ✅ `BandeClub … verrou` (L543) |

**À trancher pour Compose : un seul traitement.** La spec recommande celui d'`EcranClub`
(retour « Espace », titre = onglet) et la disparition des deux exceptions.

| # | Écran | Lignes | Structure rendue | Entrées |
|---|---|---|---|---|
| 28 | `NatClubDiscussions` | L84–L130 | `ChipRow` 4 catégories ; **3 `TerritoryCard`** (transforme, forme, rose), chacune : catégorie devant le titre, pile de 2-3 `Avatar` chevauchés (−8 px), « +9 · il y a 3 h » ; note « le décompte dérive des listes stockées » ; `FabClub` (Android seulement) ; `actionHaut` (iOS seulement) | sujets (catégorie, titre, répondants, compte, âge) |
| 29 | `NatClubMembres` | L135–L172 | `ChipRow` 3 filtres ; **`NSourcil` « Arrivés en février · 6 fiches remplies sur 9 »** ; 6 `LessonRow` (Avatar, nom, métier · quartier, `Tag` niveau, chevron) ; note sur les 3 fiches non remplies **qui n'apparaissent pas** ; encart « jamais le numéro de téléphone » ; `FabClub` | vague, membres remplis / total, quartiers |
| 30 | `NatClubClassement` | L177–L223 | `ChipRow` (Ma cohorte / Ma progression) ; **carte de rang en dégradé plein** (pas du verre) : « Arrivés en février · 9 membres » + « Tu es 4ᵉ de ta vague » ; liste des 3 premiers + **ligne « Toi » sur fond teinté** (L204-213) ; encart « pourquoi ce n'est pas un classement général » | vague, rang, points, progression hebdo |
| 31 | `NatClubOpportunites` | L228–L276 | `ChipRow layout="scroll"` 4 filtres ; 3 `TerritoryCard` (Mission / Appel d'offres / Recrutement) avec `PriceBlock` et bouton ; **note « les budgets affichés sont ceux annoncés par la personne qui publie »** ; encart « une mission publiée arrive en notification » ; `FabClub` | opportunités (type, lieu, budget annoncé, échéance) |
| 32 | `NatClubInformations` | L282–L333 | **LE DIGEST HEBDOMADAIRE.** `NSourcil` « Digest · semaine du 4 septembre » ; `NTitre` ; `GlassPanel level="hero"` portant **trois sous-titres `h2` et leurs paragraphes**, dont **« Ce que je n'ai pas fait »** ; « Les chiffres de la semaine » : **4 `StatTile`** (Publications 7, Réponses 41, Missions 2, Sessions 1/1) ; « Les digests précédents » : 3 `LessonRow` ; encart **« Pas par e-mail »** | digest courant (3 sections), 4 mesures datées, digests passés |
| 33 | `NatClubParrainage` | L338–L375 | `NTitre` « FAIS-LUI / GAGNER 15 %. » ; `NChapo` (19 900 → 16 915 F) ; `GlassPanel level="hero"` : **code mono `MOUSSA15` 30 px** + `Button` Copier + `Button` Partager (feuille système) + note ; 2 `StatTile` (Partages 7 / Inscrits 0) ; 3 `CheckLine` dont **une à tiret « Aucune commission pour toi, jamais »** ; encart « ce que tu gagnes, toi » | code, partages, inscrits, remise |
| 34 | `NatClubVerrouille` | L534–L609 | **UN composant, HUIT contenus.** Barre haute : `titre = onglet`, `droite` = `Button` « Aide ». **`BandeClub … verrou` reste CLIQUABLE** (L543). Glyphe cadenas 54 px ; `NTitre` = `VERROU_NAT[onglet].titre` ; `NChapo` = `.quoi` ; **`GlassPanel` « Derrière ce cadenas, en ce moment » = les 3 compteurs réels `.chiffres` + « relevé du 05/09/2026 »** ; `NSourcil` = `.apercuTitre` + **`ApercuVerrou` : un élément COMPLET, non flouté, non tronqué** ; `GlassPanel level="hero"` : « 1 658 F / mois », « Facturé 19 900 F », **le magasin nommé** (L585, via `magasin` L536), `Button` « Ouvrir sur maxmorrys.me », « Parrainé ? 16 915 F » ; encart « pourquoi rien n'est flouté ici » ; `Button tone="quiet"` « En attendant, le podcast est gratuit » | **`onglet` (obligatoire)**, compteurs par onglet, date de relevé, prix |

**La table `VERROU_NAT` (L407–L456)** porte, pour chacun des 8 onglets : `titre` (2 lignes),
`quoi` (chapô), `chiffres` (3 paires nombre/libellé), `apercuTitre`. **`ApercuVerrou` (L460–L532)**
rend huit aperçus distincts et réels (une publication du fil, un sujet, une fiche membre, une
session, la carte de rang, une mission avec son `PriceBlock`, un extrait de digest, le code de
parrainage). Ce sont des **objets du produit à leur taille native**, pas des résumés (L457-458).

### A.7 · États d'écran présents dans le kit

Le kit ne dessine **pas** un état vide/chargement/erreur par écran. Il dessine **quatre écrans
transverses** — `NatChargement` (squelette de `NatEspace`), `NatVide` (certificats), `NatErreur`
(leçon), `NatHorsConnexion` — et **deux écrans qui portent leur propre vide** :
`NatClubMembres` (« 6 fiches remplies sur 9 », le manque est écrit) et `NatClubParrainage`
(`StatTile` « Inscrits 0 · aucun, pour l'instant »).

⛔ **Il n'existe dans le kit aucun état vide pour :** le catalogue, le fil, les discussions,
l'agenda, le classement, les opportunités, le digest, les notes, la console. **Le port RN a dû
les inventer** — voir § B.3 et § E.

---

## B · Correspondance kit ↔ port React Native supprimé

Base de mesure : `git ls-tree -r --name-only 9c22076 mobile/app` = **55 fichiers**, dont
4 `_layout.tsx` ⇒ **51 routes**. Aucun `mobile/app/index.tsx` (vérifié) : la racine `/` est servie
par `(tabs)/index.tsx`, le groupe `(tabs)` n'ajoutant aucun segment.

### B.1 · La table de correspondance (38 appariements mesurés)

| Écran du kit | Route RN | Fidélité |
|---|---|---|
| `Lancement` | `/lancement` (73 l.) | ✅ fidèle — mais **orpheline** |
| `Onboarding` | `/onboarding` (107 l.) | ✅ fidèle — **orpheline** |
| `Permissions` | `/permissions` (105 l.) | ⚠️ **n'ouvre AUCUN dialogue système** (`permissions.tsx:33-49`) — **orpheline** |
| `MurPaiement` | `/formation` (182 l.) | ⛔ **infidèle** — voir B.3.1 |
| `Telechargements` | `/telechargements` (118 l.) | ⚠️ 100 % démo ; garde `if (STOCKAGE === null)` l.26 ⇒ **branche vide seule en production** ; 3 contrôles `disabled` |
| `LecteurPleinEcran` | `/plein-ecran` (175 l.) | ⚠️ **jamais mis en paysage** ; « −15 »/« +15 » éteints par construction (l.61-81) ; « Transcription » fait un `router.back()` (l.112) |
| `WidgetAccueil` | `/widget` (179 l.) | ⚠️ 100 % démo, branche vide en production (l.35) |
| `PartageSysteme` | `/partage` (176 l.) | ⚠️ garde de vide **écrite deux fois**, la seconde inatteignable (l.52-64 puis l.86-98) |
| `Biometrie` | `/biometrie` (146 l.) | ✅ fidèle (`useVerrou()` réel) |
| `NatCatalogue` | `/cours` (233 l.) | ✅ **plus** fidèle que le kit : titre **compté** en 3 branches (l.98/120/137) |
| `NatRetourPaiement` | ⛔ **aucune** | supprimé avec le tunnel (`tests/unit/mobile-store-achats.test.ts:68-73`) |
| `NatEspace` | `/` (243 l.) | ⚠️ **la carte de notification a été retirée le 05/09** (`(tabs)/index.tsx:145-156`) ; série et niveau supprimés car fabriqués (l.159-170) |
| `NatLecteur` | `/lecon` (225 l.) | ⚠️ **titre écrit en dur** `['Les mots que','tapent tes clients']` (l.82), indépendant de la leçon |
| `NatNotes` | `/notes` (203 l.) | ✅ fidèle, `Fab` présent (l.100-104) |
| `NatCertificat` | `/certificat` (249 l.) | ⚠️ **aucun hook serveur** : repli en dur sur `contenu/demo` (l.54-61) |
| `NatRepetiteur` | `/repetiteur` (233 l.) | ✅ quota épinglé conservé ; le clavier est celui du système |
| `NatMemoire` | `/memoire` (186 l.) | ⚠️ le bouton d'oubli **unitaire** est `disabled` (l.153) — seul « Tout effacer » marche |
| `NatChargement` | `/chargement` (65 l.) | ✅ fidèle — **orpheline** |
| `NatVide` | `/certificats` (118 l.) | ✅ fidèle |
| `NatErreur` | `/erreur` (114 l.) | ✅ **enrichie** : entièrement paramétrable, cible de `+not-found` |
| `NatHorsConnexion` | `/hors-connexion` (91 l.) | ⛔ **l'état réseau n'est jamais lu** (l.23-25) ; 100 % démo — **orpheline** |
| `NatConnexion` | `/connexion` (145 l.) | ⛔ **ni Apple ni Google** : `connexionEmail` seul (l.48) |
| `NatCreation` | `/creation` (159 l.) | ⛔ idem ; case de consentement conservée (l.95) |
| `NatPreferences` | `/profil` (369 l.) | ⚠️ enrichie (déconnexion, export RGPD) mais **la section notifications ne pilote rien** |
| `NatSuppression` | `/suppression` (176 l.) | ✅ fidèle et **branchée** (`deleteUserAccount`, l.67) |
| `NatClubMur` | `/club` (126 l.) | ⛔ **infidèle** — voir B.3.2 |
| `NatClubFil` | `/club/fil` (232 l.) | ⚠️ `Bilan` conservé (l.61) mais **pas de bande des huit** — voir B.3.3 |
| `NatClubAgenda` | `/club/agenda` (166 l.) | ⛔ **« Ajouter à mon agenda » ouvre une `Alert`** (l.82) ; `Segmented` non branché au filtrage |
| `NatMediaPole` | `/media` (142 l.) | ⛔ **pas de mini-lecteur** — voir B.3.4 |
| `NatMediaEpisode` | `/episode` (222 l.) | ⚠️ titre « Épisode 1 » en dur (l.83-86) ; téléchargement et vitesse `disabled` |
| `NatEcranVerrouille` | `/verrouille` (189 l.) | ⚠️ branche sombre fidèle mais **démo-gardée** (l.36) ⇒ vide en production |
| `NatPresence` | `/presence` (157 l.) | ⚠️ 100 % en dur ; le bouton **ne mène plus à `/devis`** (l.133-139) |
| `NatDevis` | `/devis` (130 l.) | ⚠️ 100 % démo ⇒ branche vide en production — **orpheline** |
| `NatConsoleSupport` | `/console` (127 l.) | ✅ fidèle — mais derrière `ATELIER` |
| `NatInterdit` | `/interdit` (82 l.) | ✅ fidèle — mais **orpheline** (seule porte : `/console`, elle-même fermée) |
| `NatClubDiscussions` | `/club/discussions` (104 l.) | ⚠️ pas de bande ; **aucune arête sortante** |
| `NatClubMembres` | ⛔ **aucune** | remplacé par `/club/bloques` — voir B.2 |
| `NatClubClassement` | `/club/classement` (126 l.) | ⚠️ pas de bande ; aucune arête |
| `NatClubOpportunites` | `/club/opportunites` (115 l.) | ⚠️ pas de bande ; **« Postuler » est `disabled`** (l.90) |
| `NatClubInformations` | ⛔ **aucune** | `/club/infos` porte un tout autre écran — voir B.3.5 |
| `NatClubParrainage` | `/club/parrainage` (145 l.) | ⚠️ pas de bande ; partage système présent (l.61) |
| `NatClubVerrouille` | ⛔ **aucune** | voir B.3.6 |

### B.2 · (a) Les écrans du kit JAMAIS portés — 4

1. **`NatRetourPaiement`** (`ScreensNatifApp.js:77-106`). Son port (`app/succes.tsx`) a été
   supprimé avec le tunnel : `tests/unit/mobile-store-achats.test.ts:68-73` **vérifie que
   `paiement`, `attente`, `succes`, `echec` n'existent plus**.
2. **`NatClubMembres`** (`ScreensNatifClub.js:135-172`) — l'annuaire. Le hub du Club l'a
   **délibérément remplacé** par « Comptes bloqués » : `(tabs)/club.tsx:37-41` écrit la raison
   (« une fiche est un détail, pas une destination ») et `:41` pose
   `{href:'/club/bloques', titre:'Comptes bloqués'}`. Il n'existe **aucun** `club/membres.tsx`.
3. **`NatClubInformations`** (`ScreensNatifClub.js:282-333`) — le digest hebdomadaire, ses trois
   sections, ses quatre `StatTile` et son « Pas par e-mail ». `club/infos.tsx` occupe le nom de
   l'onglet avec un écran différent (§ B.3.5).
4. **`NatClubVerrouille`** (`ScreensNatifClub.js:534-609`) **et ses 8 contextes** — § B.3.6.

**Non porté également, quoique non-écran :** `MiniLecteur` (`ScreensNatifMedia.js:23-45`).
La primitive existe (`mobile/ds/MiniPlayer.tsx:27`, exportée `ds/index.ts:71`) mais
**aucun fichier de `app/` ne l'importe** — `media.tsx:17` ne la cite qu'en commentaire.

### B.3 · (c) Les écrans portés INFIDÈLEMENT

#### B.3.1 · `MurPaiement` → `/formation` : le prix et le magasin ont disparu

Le kit rend un `GlassPanel level="hero"` portant « Je ne peux pas te faire payer ici. », **le nom
du magasin** (`ScreensNatif.js:112`), un `PriceBlock 95 000`, un `Button` « Ouvrir sur
maxmorrys.me » et trois `Tag` Wave / Orange Money / Carte (`:108-125`).

`formation.tsx` **n'importe ni `PriceBlock` ni `Button`** ; son paramètre `prix` est reçu puis
**explicitement non lu** (`:59-62`). La garde qui l'impose est
`tests/unit/mobile-store-achats.test.ts:74-79` : *« aucun écran ne nomme un magasin dans son
texte »*, commentaires retirés avant examen (`:47-52`).
**Deux sources incompatibles — décision humaine requise, § F.1.**

#### B.3.2 · `NatClubMur` → `/club` : de mur de vente à hub ouvert

Le kit rend « 1 658 F / mois », « Facturé 19 900 F », le magasin nommé (`ScreensNatifCompte.js:258`)
et un bouton sortant. `(tabs)/club.tsx` n'importe **ni `PriceBlock` ni `Button`** ; il rend à la
place **une liste de 8 destinations ouvertes à tout le monde** (`:33-46`, `:110`), avec la raison
écrite `:27-30` : « Aucun n'est grisé. Chacun s'ouvre et dit lui-même ce qui n'est pas branché
chez lui. »

#### B.3.3 · La bande des huit onglets n'a **jamais** été portée

C'est le manque le plus structurel. Le kit la fait vivre dans le châssis
(`NativeShell.js:221-231`) précisément pour qu'elle ne dérive pas, et la README du kit
(`README.md:219-226`) dit qu'à quatre valeurs « cinq onglets sur huit ne sont atteignables par
aucun geste ».

Mesuré dans le port : `club/_layout.tsx:33` rend `<Stack screenOptions={{headerShown:false}} />`
et sa coquille partagée `ClubScreen` (`:84-105`) rend `<Screen … retour="Club" titre={titre}>` —
**aucune bande**. Sur les neuf routes `club/*`, seules trois importent `ChipRow`
(`fil`, `discussions`, `opportunites`), et dans `fil.tsx` elle ne porte que **deux** liens
(`:70-71`). La navigation d'onglet à onglet passait donc **obligatoirement par un retour au hub**.

#### B.3.4 · Le pôle média a perdu sa surface décisive

Le kit monte `MiniLecteur` dans `NatMediaPole` (`ScreensNatifMedia.js:85`) — la README du kit
l'appelle le gain décisif du virage (`README.md:190-201`). `media.tsx` ne le monte pas ; il rend à
la place un `Button` « Voir l'écran verrouillé » (`:137`) qui pousse `/verrouille` **comme une
destination**, alors que le kit en fait une surface système. La lecture de fond n'existe pas :
`_bmad-output/implementation-artifacts/constat-hors-ligne.md` établit que l'audio d'épisode
pointe sur Spotify (`worker/apps/api/src/lib/media-sync.ts:230`).

#### B.3.5 · `/club/infos` porte un écran que le kit n'a pas dessiné

Kit `NatClubInformations` = **le digest** (3 sections, 4 `StatTile`, digests précédents, « pas par
e-mail »). `club/infos.tsx:33-34` rend `ClubScreen titre="Infos"` avec le titre
`['Ce que l'abonnement','te donne.']` et les tables `CLUB_GARANTI` / `CLUB_PAS_GARANTI`
(`contenu/engagement`, `:6`). **Ce sont deux écrans différents sous un même nom d'onglet.**

#### B.3.6 · L'écran verrouillé du Club a été remplacé par un hub ouvert

Le kit y met 76 lignes : les compteurs réels par onglet, un élément entier **non flouté**, le prix
cadré des deux façons, un bouton qui n'achète pas, et une bande cliquable. Aucun fichier de
`mobile/app/` ne rend cela. `/verrouille` est **l'écran verrouillé du TÉLÉPHONE**
(`NatEcranVerrouille`), pas celui du Club — il est atteint depuis `/media:137`, jamais depuis le
Club. Le port a substitué l'ouverture générale (§ B.3.2) et, écran par écran, le composant
générique `SansDonnees` (`mobile/ds/SansDonnees.tsx`), importé par **24 des 51 routes**.

#### B.3.7 · Les infidélités mineures, mesurées

| Route | Ce qui diverge | Ligne |
|---|---|---|
| `/lecon` | titre de leçon **en dur** | `lecon.tsx:82` |
| `/episode` | titre « Épisode 1 » **en dur** | `episode.tsx:83-86` |
| `/plein-ecran` | « Transcription » fait un `router.back()` | `plein-ecran.tsx:112` |
| `/plein-ecran` | ronds −15/+15 sans action, par construction | `plein-ecran.tsx:61-81` |
| `/club/agenda` | l'action native devient une `Alert` | `club/agenda.tsx:82` |
| `/club/opportunites` | « Postuler » `disabled` | `club/opportunites.tsx:90` |
| `/memoire` | oubli unitaire `disabled` | `memoire.tsx:153` |
| `/video` | poussée **sans aucun** de ses 7 paramètres | `media.tsx:120` vs `video.tsx:42-51` |
| `/partage` | garde de vide dupliquée, seconde inatteignable | `partage.tsx:52-64`, `:86-98` |
| `/repetiteur` | le retour fait `push('/(tabs)')` au lieu de `back()` | `repetiteur.tsx:127` |

### B.4 · (b) Les routes RN qui n'existaient dans AUCUN écran du kit — 13 + 1

| Route | Ce qu'elle est | Verdict pour Compose |
|---|---|---|
| `/mot-de-passe` (133 l.) | réinitialisation par e-mail | **à garder** — `NatConnexion` écrit « Mot de passe oublié ? » sans destination |
| `/legal` (113 l.) | 4 textes légaux, ouverture navigateur | **à garder** — exigence de magasin |
| `/video` (198 l.) | fiche d'une vidéo, ouverture navigateur | **à garder** — `NatMediaPole` a une `MediaCard` vidéo sans destination |
| `/club/membre` (204 l.) | fiche membre + **signaler + bloquer** | **à garder** — App Store 1.2 ; c'est la seule porte du signalement (`club/fil.tsx:145-148`) |
| `/club/bloques` (102 l.) | comptes bloqués, déblocage | **à garder** — App Store 1.2 |
| `/club/infos` (102 l.) | garanties de l'abonnement | à trancher : le kit n'a pas cet écran, et son onglet « Informations » est le digest |
| `/console/messages` (71 l.) | | ces 5 écrans sont **le contenu** des 5 lignes que `NatConsoleSupport` **liste sans les ouvrir** |
| `/console/temoignages` (78 l.) | | |
| `/console/rendez-vous` (59 l.) | | |
| `/console/prospects` (95 l.) | | |
| `/console/projets` (60 l.) | | |
| `/apercu` (201 l.) | planche d'atelier, 48 liens | **à NE PAS reproduire** — voir § C.4 |
| `/+not-found` (34 l.) | redirige vers `/erreur` paramétré | **à garder** — obligatoire avec des liens profonds |
| *(non-route)* `EcranVerrouille` | **« RYSMO EST VERROUILLÉ. »**, le sas biométrique | `_layout.tsx:142-190` — **le kit ne le dessine pas** |

**Le compte annoncé de « ~18 routes de plus » est de 13 routes + 1 écran hors routage = 14.**
La différence avec l'estimation héritée vient de ce que 5 des routes « en plus » (`/club/infos`,
et les 4 tunnel supprimés) ne sont pas comptées de la même façon.

---

## C · Le graphe de navigation

### C.1 · Le graphe MESURÉ du port RN (état `9c22076`)

Format : `source:ligne — contrôle → cible`.

**Racine et sas**
- `_layout.tsx:70-90` — `<Stack>` **sans aucun `<Stack.Screen>` et sans `initialRouteName`** : tout est déduit du système de fichiers.
- `_layout.tsx:106-129` — `<Porte>` : `verrouille` → `EcranVerrouille` (biométrie) ; sinon les enfants. **Ce n'est pas un garde d'authentification.**

**Barre d'onglets** — `(tabs)/_layout.tsx:84-103`, cinq entrées, **aucun `href:null`, aucun `initialRouteName`** :
`index` « Espace » · `cours` « Cours » · `repetiteur` (titre = `useTutorNom()`, `:50`) · `club` « Club » · `profil` « Profil ».

**Depuis `/` (Espace)** — `(tabs)/index.tsx`
`:90` Avatar → `/(tabs)/profil` · `:114` « Voir le catalogue » → `/(tabs)/cours` ·
`:124` carte de reprise → `/lecon` · `:139` « Reprendre » → `/lecon` ·
`:208` rond répétiteur → `/(tabs)/repetiteur` · `:236` lignes d'espace → `/certificats`, `/telechargements`

**Depuis `/cours`** — `:196-199` « Voir le programme » → `/formation?slug&titre` · `:227` « Ouvrir » → `/lecon`

**Depuis `/repetiteur`** — `:127` retour → `/(tabs)` · `:130` « Mémoire de profil » → `/memoire` · `:177` « Ouvrir la leçon » → `/lecon`

**Depuis `/club`** — `:110` (8 lignes) → `/club/fil`, `/club/discussions`, `/club/agenda`, `/club/bloques`, `/club/classement`, `/club/opportunites`, `/club/parrainage`, `/club/infos`

**Depuis `/profil`** — `:75` déconnexion → `/connexion` (replace) · `:128` « Me connecter » → `/connexion` ·
`:138` « Modifier » → `/connexion` · `:233` → `/memoire` · `:263` → `/telechargements` ·
`:270` → `/widget` · `:295` → `/suppression` · `:315` → `/connexion`, `/mot-de-passe`, `/biometrie` ·
`:362` → `/media`, `/presence`, `/legal` **+ `/console`, `/apercu` sous `ATELIER`** (`:58-61`)

**Feuilles**
`/formation:170` → `/lecon` (si module ouvert) · `/lecon:65` → `/notes`, `:111` → `/plein-ecran` ·
`/certificats:69` → `/lecon`, `:87-96` → `/certificat?code…` · `/certificat:137` → `/partage?code…` ·
`/media:76` → `/(tabs)/club`, `:103-104` → `/episode`, `:120` → `/video`, `:137` → `/verrouille` ·
`/episode:216` → `/notes` · `/connexion:114` → `/mot-de-passe`, `:131` → `/creation`, `:141` → `/legal` ·
`/creation:123` → `/legal` · `/suppression:69` → `/connexion` · `/+not-found:21-31` → `/erreur` ·
`/hors-connexion:54` → `/lecon` · `/erreur:82` → `sortie` ou `back()`, `:93` → `/lecon`

**Club, arêtes internes**
`/club/fil:70` → `/club/discussions` · `:71` → `/club/opportunites` ·
**`:145-148` → `/club/membre?message&nom` (LA seule porte)** · `:213` → `/club/opportunites` · `:226` → `/club/agenda`
`/club/infos:69` → `/club/parrainage` · `:98` → `/(tabs)/club`
`/club/membre:98` → `/club/fil` (après blocage) · `:165` → `/club/fil`
⛔ **`agenda`, `bloques`, `classement`, `discussions`, `opportunites`, `parrainage` : ZÉRO arête sortante.**

**Chaîne de première ouverture (morte)**
`/lancement:48` → `/(tabs)` si connecté, `:51` → `/onboarding` sinon ·
`/onboarding:45` → `/permissions` (3ᵉ pas), `:56` → `/(tabs)` (« Passer ») ·
`/permissions:51` → `/biometrie`, `:96` → `/(tabs)` ·
`/biometrie:39/104/113/132` → `/(tabs)`

**Console (fermée en production)**
`/console:84` → `/console/prospects` · `:106` → les 5 écrans de portée · `:116` → `/interdit`
`/interdit:32/78` → `/console` · `:58` → les 5 écrans de portée

### C.2 · Les orphelins mesurés — 14 routes sur 51

Le drapeau : `ATELIER = process.env.EXPO_PUBLIC_CONTENU_DEMO === '1' || __DEV__`, recopié à
l'identique dans trois modules — `(tabs)/profil.tsx:49`, `apercu.tsx:140`,
`console/_layout.tsx:39`. En production il vaut `false`, et
`console/_layout.tsx:41` comme `apercu.tsx:157` rendent `<Redirect href="/" />`.

| Orphelin | Pourquoi |
|---|---|
| `/apercu` | fermé par `ATELIER` |
| `/console` + `messages`, `temoignages`, `rendez-vous`, `prospects`, `projets` | fermés par `ATELIER` (6) |
| `/interdit` | seule porte = `/console`, fermée |
| `/lancement` | **aucun appelant** hors la planche |
| `/onboarding` | seul appelant = `/lancement`, mort |
| `/permissions` | seuls appelants = `/onboarding` (mort) et une carte **retirée le 05/09** (`(tabs)/index.tsx:145-156`) |
| `/chargement` | aucun appelant hors la planche |
| `/hors-connexion` | aucun appelant hors la planche ; l'état réseau n'est jamais lu |
| `/devis` | `presence.tsx:133-139` dit avoir **retiré** le lien |

⛔ **Le compte hérité de « 11 sur 51 » est faux : c'est 14.** L'écart tient à trois routes que les
corrections du 05/09/2026 ont orphelinées après la dernière mesure (`/permissions`, `/devis`) et à
`/interdit`, orpheline par transitivité.

⚠️ **`/biometrie` n'est PAS orpheline** — elle est atteignable depuis `/profil:315`. La chaîne
morte est donc `lancement → onboarding → permissions`, **pas** `… → biometrie`.

### C.3 · Comment le port a rendu ce défaut invisible

`tests/unit/mobile-routes.test.ts` cherchait « toute chaîne littérale commençant par `/` dans
n'importe quel fichier ». `apercu.tsx:28-128` écrit **les 48 adresses en dur**. Toute route était
donc « citée », et le test restait vert alors qu'aucun écran de production ne menait à quatorze
d'entre elles (constat déjà écrit dans
`_bmad-output/implementation-artifacts/garanties-a-reconstruire.md`, § 2 — **rejoué ici et
confirmé, à la valeur près**).

### C.4 · Le graphe que la version Compose DOIT avoir

**Règle 1 — le premier écran est `Lancement`, et il est le seul point d'entrée.**
En Compose, `MainActivity` installe la `NavHost` avec `startDestination = Lancement`. C'est ce que
le thème XML prépare déjà : `android/app/src/main/res/values/themes.xml:13`
(`Theme.Rysmo.Lancement`) ne peint qu'un fond, pour que la fenêtre système et le premier composable
ne sautent pas. **Sans `startDestination = Lancement`, le kit perd trois écrans d'un coup.**

**Règle 2 — `Lancement` aiguille sur l'état de session, et rien d'autre.**

```
Lancement
  ├─ session en restauration  → ne rien faire (attendre)
  ├─ session connectée        → Espace          (popUpTo(Lancement) { inclusive = true })
  └─ session anonyme
        ├─ premier lancement  → Onboarding
        └─ déjà onboardé      → Espace          (le catalogue se parcourt sans compte)
```
Le drapeau « déjà onboardé » vit dans DataStore (`libs.versions.toml:datastore`, déjà au
catalogue). `Onboarding` → `Permissions` → `Biometrie` → `Espace`, chaque étape passable.

**Règle 3 — aucune destination n'existe sans arête entrante de production.**
Les quatre écrans transverses (`Chargement`, `Vide`, `Erreur`, `HorsConnexion`) **ne sont pas des
destinations** : ce sont des **états d'une destination**. `NatChargement` est le squelette de
`Espace` (sa forme le prouve, `ScreensNatifEtats.js:179-202`) ; `NatVide` est l'état vide de
`Certificats` ; `NatHorsConnexion` est un état global déclenché par `ACCESS_NETWORK_STATE`
(déjà déclaré, `AndroidManifest.xml:7`). **Seule `Erreur` reste une destination**, parce qu'elle
est la cible du lien profond invalide.

**Règle 4 — la bande des huit est la navigation du Club, et elle vit dans une enveloppe unique.**
Une `ClubScaffold(onglet)` porte la barre haute, la barre basse et `BandeClub`, exactement comme
`EcranClub` (`ScreensNatifClub.js:70-79`). Les huit onglets sont des destinations sœurs ; passer de
l'une à l'autre ne pousse pas, il **remplace** (`popUpTo(ClubRoot) { saveState = true }`).

**Règle 5 — l'écran verrouillé du Club est une BRANCHE de chaque onglet, pas une destination.**
`ClubOnglet(onglet)` rend le contenu si l'abonnement est actif, `NatClubVerrouille(onglet)` sinon.
C'est ce qui garantit que l'argument `onglet` est toujours présent — la seule information que
l'écran possède en plus (`ScreensNatifClub.js:378-384`).

**Règle 6 — pas de planche d'atelier dans le graphe.**
Si une planche de revue est nécessaire, elle est **hors du `NavHost` de production** (variante de
build `debug`), et la règle d'atteignabilité l'exclut explicitement avant de compter les citations.

**Règle 7 — les liens profonds sont des arêtes entrantes, et il en manque une.**
`public/.well-known/assetlinks.json` et `AndroidManifest.xml:58-63` déclarent quatre préfixes :
`/formations`, `/formations/*`, `/verifier`, `/verifier/*`.
⛔ **Le kit ne dessine AUCUN écran de vérification de certificat.** `/verifier/*` n'a donc pas de
destination. Deux issues, à trancher : dessiner l'écran, ou retirer le préfixe des deux
manifestes (ils doivent rester identiques — `tests/unit/mobile-liens-profonds.test.ts`).

### C.5 · Écrans du kit sans arête entrante possible en l'état

| Écran | Manque |
|---|---|
| `NatRetourPaiement` | dépend d'un retour d'achat web (schéma `rysmo://`, `AndroidManifest.xml:45`) |
| `NatEcranVerrouille` | ce n'est pas une destination : c'est `MediaSession` (`media3-session`, au catalogue mais **non déclaré en dépendance**) |
| `WidgetAccueil` | ce n'est pas une destination : c'est un `AppWidgetProvider` (aucune dépendance Glance au catalogue) |
| `PartageSysteme` | ce n'est pas une destination : c'est `Intent.ACTION_SEND` |
| `LecteurPleinEcran` | **`android:screenOrientation="portrait"` (`AndroidManifest.xml:31`) interdit le paysage** — voir § F.4 |

---

## D · Contrat de destination Compose, écran par écran

**Mécanisme.** `androidx.navigation:navigation-compose:2.8.5` (`libs.versions.toml:navigation`) avec
le greffon `org.jetbrains.kotlin.plugin.serialization` **déjà appliqué**
(`app/build.gradle.kts:5`) : les destinations sont des `@Serializable object` / `data class`,
et le compilateur tient le premier sens (« tout lien mène à un écran qui existe »).

**Colonne « Session » :** `—` = ouvert à tous ; `Anon` = doit fonctionner sans compte ;
`Auth` = exige une session ; `Auth+Club` = exige un abonnement actif (sinon branche verrouillée) ;
`Debug` = hors `NavHost` de production.

| Destination typée | Args | Parent | Session | Écran du kit |
|---|---|---|---|---|
| `object Lancement` | — | racine (`startDestination`) | — | `Lancement` |
| `object Onboarding` | — | `Lancement` | — | `Onboarding` |
| `object Permissions` | — | `Onboarding` | — | `Permissions` |
| `object Biometrie` | — | `Permissions` · `Profil` | `Auth` | `Biometrie` |
| **`object Espace`** | — | onglet 1 | `Anon` | `NatEspace` (+ état `NatChargement`) |
| `object Catalogue` | — | onglet 2 | `Anon` | `NatCatalogue` |
| `data class Formation` | `slug: String`, `titre: String?` | `Catalogue` | `Anon` | `MurPaiement` |
| `data class Lecon` | `slug: String`, `leconId: String?` | `Formation` · `Espace` | `Auth` | `NatLecteur` |
| `data class PleinEcran` | `leconId: String` | `Lecon` | `Auth` | `LecteurPleinEcran` |
| `data class Notes` | `leconId: String?` | `Lecon` · `Episode` | `Auth` | `NatNotes` |
| `object Certificats` | — | `Espace` | `Auth` | `NatVide` (état vide) |
| `data class Certificat` | `code`, `titulaire`, `formation`, `emisLe`, `lecons: Int` | `Certificats` | `Auth` | `NatCertificat` |
| `object Repetiteur` | — | onglet 3 | `Auth` | `NatRepetiteur` |
| `object Memoire` | — | `Repetiteur` · `Profil` | `Auth` | `NatMemoire` |
| **`object ClubRoot`** | — | onglet 4 | `Anon` | `NatClubMur` **ou** l'onglet par défaut si membre |
| `data class ClubOnglet` | **`onglet: OngletClub`** (enum des 8, ordre de `CLUB_ORDRE`) | `ClubRoot` | `Auth` → contenu si `Auth+Club`, **sinon `NatClubVerrouille(onglet)`** | `NatClubFil` · `NatClubDiscussions` · `NatClubMembres` · `NatClubAgenda` · `NatClubClassement` · `NatClubOpportunites` · `NatClubInformations` · `NatClubParrainage` |
| `data class ClubMembre` | `membreId: String?`, `messageId: String?` (au moins un) | `ClubOnglet(Fil)` · `ClubOnglet(Membres)` | `Auth+Club` | ⛔ aucun (à dessiner) |
| `object ClubBloques` | — | `Profil` | `Auth` | ⛔ aucun (à dessiner) |
| `object Profil` | — | onglet 5 | `Anon` | `NatPreferences` |
| `object Connexion` | — | `Profil` · modale | — | `NatConnexion` |
| `object Creation` | — | `Connexion` | — | `NatCreation` |
| `object MotDePasse` | — | `Connexion` | — | ⛔ aucun (à dessiner) |
| `object Suppression` | — | `Profil` | `Auth` | `NatSuppression` |
| `object Telechargements` | — | `Profil` · `Espace` | `Auth` | `Telechargements` |
| `object Legal` | — | `Profil` · `Connexion` · `Creation` | — | ⛔ aucun (à dessiner) |
| `object Media` | — | `Profil` · `ClubRoot` (`SubNav`) | `Anon` | `NatMediaPole` |
| `data class Episode` | `episodeId: String` | `Media` | `Anon` | `NatMediaEpisode` |
| `data class Video` | `videoId: String` | `Media` | `Anon` | ⛔ aucun (à dessiner) |
| `object Presence` | — | `Profil` | `Anon` | `NatPresence` |
| `data class Devis` | `code: String` | `Presence` · lien profond | `Anon` | `NatDevis` |
| `data class Erreur` | `titre`, `motif`, `consequence`, `reference`, `libelle`, `sortie` (tous `String?`) | n'importe laquelle | — | `NatErreur` |
| `object Console` | — | `Profil` | `Auth` + rôle `support`/`admin` | `NatConsoleSupport` |
| `data class ConsoleEcran` | `ecran: PorteeSupport` (enum de 5) | `Console` | `Auth` + rôle | ⛔ aucun (à dessiner ×5) |
| `object Interdit` | — | `Console` (garde de rôle) | `Auth` | `NatInterdit` |
| `object Planche` | — | hors `NavHost` de production | `Debug` | — |

**Surfaces qui ne sont PAS des destinations** (à ne pas mettre dans le `NavHost`) :
`NatEcranVerrouille` (`MediaSessionService`), `WidgetAccueil` (`AppWidgetProvider`),
`PartageSysteme` (`Intent.ACTION_SEND`), `MiniLecteur` (surface persistante au-dessus de la
`TabBar`), `NatChargement` / `NatHorsConnexion` (états), `EcranVerrouille` biométrique (sas
au-dessus du `NavHost`, comme `_layout.tsx:106-129`).

**Retour arrière.** Le libellé de retour d'iOS dit **où l'on revient** (`NativeShell.js:112-114`) ;
Android n'a que la flèche (`:129-142`). En Compose, la flèche de la barre haute et le geste système
doivent appeler **la même** fonction, et cette fonction fait `popBackStack()` — jamais un `navigate`
vers un parent (défaut mesuré : `repetiteur.tsx:127`).

---

## E · Ce que je n'ai PAS pu déterminer

1. **Le contenu de `mobile/ds/Screen.tsx`.** Le port utilisait `Screen`, pas `NativeScreen` ; je
   n'ai lu que sa liste de props (via le relevé des 55 fichiers de `app/`). L'équivalence exacte
   entre `Screen` et le châssis du kit n'a pas été vérifiée ligne à ligne.
2. **Les contrats de sortie des 18 endpoints** (`appEspace`, `appCours`, `appClubListe`…). Je sais
   par quel hook chaque écran les appelle, **pas** quels champs ils renvoient. Le remplissage des
   écrans en dépend et n'est pas spécifiable ici.
   → C'est l'objet de la spécification sœur `spec-donnees-natif.md` (§ F, « les 28 types de vue »),
   écrite contre `worker/apps/api/src`. **Les deux documents se complètent et ne se recouvrent
   pas** : celui-ci fait autorité sur le rendu et la navigation, celui-là sur le protocole et les
   données. En cas de désaccord sur un champ, c'est le Worker qui arbitre.
3. **Les états vides que le kit ne dessine pas** (§ A.7) : catalogue, fil, discussions, agenda,
   classement, opportunités, digest, notes, console. Le port les a inventés avec `SansDonnees` ;
   **le kit ne dit pas à quoi ils ressemblent.** Il faut soit les dessiner, soit décider que
   `SansDonnees` fait autorité — ce qui reviendrait à donner au port une autorité de rendu que la
   hiérarchie des sources lui refuse.
4. **Les cinq écrans de la console support.** `NatConsoleSupport` **liste** Messages, Témoignages,
   Rendez-vous, Prospects, Projets (`ScreensNatifMedia.js:359-368`) mais ne dessine que le sien.
   Les cinq écrans RN existent mais sont **100 % en dur** (aucun ne porte de hook, § B.4) : ils ne
   documentent donc ni les données ni le rendu attendus.
5. **La forme exacte de l'écran de vérification de certificat** (`/verifier/*`) : le lien profond
   est déclaré, le kit ne dessine rien (§ C.4, règle 7).
6. **Le nombre de vagues / cohortes du Club** et la règle qui les définit — `NatClubClassement` et
   `NatClubMembres` s'y appuient (« arrivés en février », « ta vague »), aucune source lue ne dit
   comment une vague est constituée.
7. **Les seuils du quota du répétiteur** hors des deux valeurs affichées (2/jour hors Club,
   5/jour membre — `ScreensNatifCompte.js:274`) : ni la fenêtre de remise à zéro ni le
   comportement au dépassement ne sont écrits.
8. **Le keystore de signature.** `app/build.gradle.kts:19-26` déclare l'empreinte publiée dans
   `assetlinks.json` et note que le keystore vit chez EAS — **non résolu**, et les App Links ne
   seront pas vérifiés tant qu'il ne l'est pas.
9. **Ce que devient `LecteurPleinEcran`** tant que la vidéo de leçon est un `<iframe>` hébergé
   ailleurs (`constat-hors-ligne.md`, niveau 1). Faire pivoter un dégradé n'est pas une fonction.

---

## F · Contradictions entre sources — à trancher, pas à choisir en silence

### F.1 · ⭐ Nommer le magasin : le kit dit oui, le port disait non

- **Kit** — quatre écrans nomment explicitement l'App Store ou Google Play et affichent le prix :
  `ScreensNatif.js:141` · `ScreensNatifCompte.js:258` · `ScreensNatifClub.js:585` (constante L536) ·
  et la README du kit en fait une décision de fond (`README.md:97-107`, `:243-248`).
- **Port** — `tests/unit/mobile-store-achats.test.ts:74-79` **interdit** toute occurrence de
  `App Store|Google Play|Play Store|achat intégré` dans `mobile/app/**`, commentaires retirés
  (`:47-52`), avec la raison écrite `:17-25` : *« une revue lit les chaînes »*. `:80-86` interdit
  en outre `payer|acheter|s'abonner|souscrire|Wave|Orange Money` **hors `presence.tsx` et
  `devis.tsx`** (prestation du monde réel, App Store 3.1.5(a), `:56-62`).
- **Conséquence si l'on suit le kit :** `MurPaiement`, `NatClubMur` et `NatClubVerrouille`
  retrouvent leur prix, leur bouton sortant et leur phrase — et le risque de rejet revient.
- **Conséquence si l'on suit le port :** trois écrans du kit perdent leur bloc central, et le kit
  n'en propose aucune version de remplacement.
- La README du kit signale elle-même deux points non tranchés (`README.md:108-111`) : la variante
  neutre du texte, et le droit *External Purchase Link* d'iOS.
  **⛔ Décision humaine. Aucune n'est prise ici.**

### F.2 · Le compte d'écrans, écrit de quatre façons

| Source | Ligne | Dit | Mesuré |
|---|---|---|---|
| `ui_kits/native/README.md` | 256 | « **43 écrans** : 9 propres au natif, 34 portés » | **42** — `MurPaiement` compte dans les deux lots |
| `ui_kits/native/README.md` | 114 | « les 9 groupes couverts, **36 écrans** » | incohérent avec `:256` du même fichier |
| `DS_Final/readme.md` | 348 | « **36 écrans** (9 propres au natif, **27** portés) » | faux : les lots donnent 34 slots portés |
| `DS_Final/readme.md` | 55 et 434 | « Il n'y a **pas d'application mobile native** (hors périmètre) » | **contredit par l'existence même de `ui_kits/native/`** |

`DS_Final/readme.md` porte donc un état antérieur au virage natif et **ne doit pas être utilisé**
comme source sur ce sujet.

### F.3 · ⭐ `handoff_natif/` est un instantané ANTÉRIEUR au lot 5

Mesuré par `diff` :
- `handoff_natif/native-shell.jsx` **n'a ni `CLUB_ORDRE` ni `BandeClub`** (28 lignes de moins que
  `ui_kits/native/NativeShell.js`).
- `handoff_natif/screens-compte.jsx:318-320` rend encore
  `<ChipRow options={['Fil','Discussions','Membres','Opportunités']} />` — **la bande de quatre**,
  exactement le défaut que le lot 5 a corrigé.
- **Il n'existe aucun `screens-club.jsx`** : les 6 onglets et l'écran verrouillé y sont absents.
- `handoff_natif/apercu.html:48-92` liste **35 écrans**, pas 36 ; son README `:1` en annonce 36 et
  son `:165` répète la phrase fausse « cinq onglets de liste du Club sur huit… se portent à
  l'identique ».

⛔ **Un développeur qui reçoit `handoff_natif/` construit 35 écrans et reproduit exactement le
manque du port RN.** La source du rendu est `DS_Final/ui_kits/native/`, jamais `handoff_natif/`.

### F.4 · L'échafaudage Android contredit deux écrans du kit

| Fait mesuré | Écran du kit empêché |
|---|---|
| `AndroidManifest.xml:31` — `android:screenOrientation="portrait"` | `LecteurPleinEcran` (paysage, `ScreensNatif.js:244-307`) |
| `AndroidManifest.xml` — **aucun `POST_NOTIFICATIONS`**, alors que `targetSdk = 36` (`app/build.gradle.kts:37`) l'exige depuis l'API 33 | `Permissions` (`ScreensNatif.js:80-118`) et les 3 interrupteurs de `NatPreferences` |
| `libs.versions.toml` déclare `media3-exoplayer`, `media3-session`, `biometric`, `browser` — **aucun n'est en dépendance** dans `app/build.gradle.kts:69-93` | `NatEcranVerrouille`, `MiniLecteur`, `Biometrie`, tous les boutons « Ouvrir sur maxmorrys.me » |
| Aucune dépendance Glance / `AppWidgetProvider` | `WidgetAccueil` |

Ce ne sont pas des oublis à corriger en silence : chacun est une **décision de portée** que la
première itération Compose doit assumer ou financer.

### F.5 · Trois tables d'onglets pour une seule vérité

`ScreensNatif.js:23-29`, `ScreensNatifApp.js:21-27`, `ScreensNatifClub.js:37-43` déclarent les
mêmes cinq onglets. En Compose : **une seule** énumération, dans le module du design system.

---

## G · Les six règles exécutables que cette spec impose

1. **Une destination = un `@Serializable`.** Aucune route en chaîne, aucun argument non typé.
2. **Aucune destination sans arête entrante de production.** La règle d'atteignabilité s'évalue en
   **excluant** toute planche de revue (c'est l'angle mort qui a coûté 14 routes au port —
   `apercu.tsx:28-128`).
3. **`startDestination = Lancement`.** Le thème `Theme.Rysmo.Lancement` existe déjà pour ça.
4. **`BandeClub` vit dans l'enveloppe du Club, jamais dans un écran.** Elle porte les **huit** noms
   (`CLUB_ORDRE`, `NativeShell.js:221`), défile, et est servie à **44 px** — plancher tactile, pas
   valeur d'esthétique.
5. **`NatClubVerrouille` est une branche paramétrée par `onglet`, pas un écran générique.** Un
   `SansDonnees` à sa place supprime les compteurs réels, l'élément entier non flouté et le prix —
   c'est-à-dire tout l'argument.
6. **Un contrôle porte une action, ou il est explicitement éteint.** Le port a laissé
   `disabled`/`undefined` sur au moins 10 contrôles (§ B.3.7) ; la règle Detekt de remplacement est
   décrite dans `garanties-a-reconstruire.md` § 1.

---

*Mesuré le 05/09/2026 contre `DS_Final/ui_kits/native/` (état de l'arbre de travail) et contre le
commit `9c22076` pour le port React Native supprimé.*
