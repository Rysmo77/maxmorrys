# Audit du 03/11/2026 — gestes à faire dans la console

> Préparé le 03/11/2026 par la salle de rédaction en mode non interactif : 🗞️ Aminata (rédaction en chef), 💬 Mariam (social & communauté), 🤝 Josiane (succès client).
> **Rien n'a été écrit en base ni publié.** Chaque case ci-dessous est un geste humain de Max dans `maxmorrys.me/admin` (ou, quand c'est dit, dans la console Firebase).
> Source : audit UI/UX & QA du 03/11/2026. Lectures faites pour préparer ce document (lecture seule) : FAQ et articles publiés via l'API publique de Firestore, banque d'idées NocoDB, code et catalogues i18n.
> Les décisions prises sans toi sont signalées par **[décision]**. Tu peux les renverser : chacune dit pourquoi elle a été prise.

**Ordre conseillé (≈ 1 h 30 en tout) :** § 1 FAQ (5 min) → § 4 podcast (10 min) → § 2.5 données de test (20 min) → § 2.4 sessions (10 min) → § 2.1-2.3 Club (20 min) → § 3 blog, étape 0 (30 min), puis le calendrier.

---

## 1. FAQ — l'inscription par numéro WhatsApp (Josiane)

**Où :** `/admin/faq` → question n° 1 « Comment je m'inscris sur la plateforme ? » (catégorie Accès et Inscription) → Modifier.

**Pourquoi :** la réponse actuelle promet une inscription « avec ton email ou ton numéro WhatsApp ». La page d'inscription ne propose que Google ou l'e-mail (`fr/auth.json` → `register.*`) ; la connexion par téléphone répond « pas encore ouverte » (`phoneSoonTitle`). L'audit (constat sur l'onglet Téléphone) demande d'aligner la FAQ. Une FAQ qui promet une fonction absente fabrique des tickets de support.

**Texte actuel (lu en base) :**
> Tu cliques sur "Créer un compte", tu renseignes ton nom, ton email ou ton numéro WhatsApp, et c'est fait. En moins de 2 minutes, tu accèdes à ton espace apprenant.

- [ ] **Question :** ne pas la modifier. **[décision]** Son adresse `/faq/comment-je-m-inscris-sur-la-plateforme` est dérivée du texte : changer la question déplacerait la page sans prévenir.
- [ ] **Champ « slug » :** coller `comment-je-m-inscris-sur-la-plateforme` pour figer l'adresse. C'est la même adresse qu'aujourd'hui.
- [ ] **Réponse (FR) — à coller :**

```
Tu cliques sur « Créer un compte », puis tu choisis : continuer avec Google, ou créer ton compte avec ton nom, ton e-mail et un mot de passe. C'est gratuit et ça prend deux minutes. La connexion avec ton numéro de téléphone n'est pas encore ouverte : elle est annoncée « bientôt » sur la page de connexion, et ton compte restera le même le jour où elle ouvrira. Ce compte te sert sur maxmorrys.me, sur Edu et au Club.
```

- **EN :** la FAQ n'a qu'un champ FR en base. La version anglaise est traduite à l'affichage (`translateContent`). Rien à coller. Pour vérifier la traduction affichée, voici le sens attendu :
  > Click "Create an account", then either continue with Google or sign up with your name, email and a password. It's free and takes two minutes. Phone sign-in isn't open yet — it's marked "soon" on the sign-in page, and your account stays the same once it opens. The same account works on maxmorrys.me, Edu and the Club.

**Vu au passage, non corrigé (hors périmètre, à trancher plus tard par Josiane et toi) :** la question 17 promet « réponse sous 24 h en jours ouvrés » sur WhatsApp, un délai que rien ne garantit ; la question 19 cite une offre « Max-Morrys Business » (licences multi-utilisateurs, tableau de bord d'équipe) que je n'ai trouvée nulle part dans le code ; les questions 15 et 16 promettent des « Office Hours » mensuelles « dans chaque parcours » ; la question 9 promet un certificat « à la fin de chaque parcours ». À relire avant de les laisser en ligne.

---

## 2. Club des Digitos (Mariam)

Tout se passe dans `/admin/club-digitos`, onglets en haut (Abonnements · Publications · Événements · Sessions Live · Infos exclusives · Défis · Profils membres · Opportunités · Signalements).
⚠️ Le contenu du Club **n'est pas traduit** : il s'affiche tel qu'il est écrit, aux lecteurs FR comme EN (`adminClub.json` → `infos.scope`). Tout est donc fourni en FR seulement.

### 2.1 L'article d'infos du 1er juin 2026, à passer au tutoiement

**Où :** onglet **Infos exclusives** → l'info du 01/06/2026 → Modifier.
**Pourquoi :** l'article vouvoie (« votre participation ») alors que le Club tutoie partout ailleurs (règle `voix-tutoiement` : seule la piste Conception vouvoie). C'est aussi la seule info du Club, et elle date d'avant l'ouverture des adhésions (août 2026).

**Le texte actuel n'est pas dans le dépôt** (collection `club_infos`, lecture réservée aux membres). Deux options :

**Option A — garder ton texte, ne changer que le registre (5 min).** Consigne :
1. vous → tu ; votre → ton / ta ; vos → tes ; « vous pouvez » → « tu peux » ; impératifs en 2ᵉ personne du singulier (« rejoignez » → « rejoins », « participez » → « participe ») ;
2. « nous » → « je » quand c'est toi qui parles (« je t'attends », pas « nous vous attendons ») ;
3. supprimer toute promesse d'une fonction qui n'existe pas encore. Les replays, le digest de la semaine et les cercles thématiques sont « en construction » : les présenter comme tels ;
4. aucun chiffre de membres ni d'audience (règle de preuve sociale) ;
5. ne pas toucher à la date affichée.

**Option B — remplacer par une info à jour (recommandée) [décision].** Le constat de l'audit, c'est surtout que cette info décrit un Club vide. Mieux vaut la remplacer par une info qui dit ce qui est ouvert aujourd'hui. Type : **Annonce**. Date de publication : le jour où tu l'enregistres (c'est un affichage, elle ne programme rien).

Titre :
```
Le Club, ce qui est ouvert et ce qui arrive
```
Contenu :
```
Bienvenue au Club. Voici ce que tu as déjà, et ce que je construis encore. Je préfère te le dire clairement plutôt que te promettre ce qui n'existe pas.

Ce qui est ouvert
· Le fil : tu publies ce que tu fais, ce que tu cherches, ce qui t'a bloqué. Chaque publication a une catégorie (Général, Question, Ressource, Témoignage, Opportunité, Discussion).
· Les discussions privées et l'annuaire : tu écris directement à un membre.
· L'agenda : deux sessions en direct par mois avec moi. Les dates sont dans l'onglet Agenda, et je ne les annonce pas ailleurs.
· Le défi de la semaine : une action concrète, à faire en quelques jours, que tu montres dans le fil.
· Les opportunités : missions, stages et emplois publiés par les membres. Je ne les vérifie pas : prends tes précautions.
· Rysmo : trois questions de plus par jour, tant que ton adhésion est active.

Ce qui arrive
· Les replays des sessions, le digest de la semaine et les cercles thématiques. Ils sont en construction. Je te préviens le jour où chacun ouvre.

Ce que je te demande
Présente-toi dans le fil : ton métier, ta ville, et ce que tu veux savoir faire d'ici la fin de l'année. C'est comme ça que les autres membres te trouvent.
```
(Chiffres relus dans le code : `LIVE_SESSIONS_PER_MONTH = 2` dans `src/lib/club/pricing.ts`, `RYSMO_CLUB_BONUS = 3` dans `src/lib/rysmo/quota.ts`.)

- [ ] Si tu choisis B : remplacer l'info du 01/06 plutôt que d'en ajouter une seconde, pour ne pas laisser deux discours côte à côte.

### 2.2 Un message de bienvenue publié par toi dans le fil

**Où :** `club.maxmorrys.me/fil` → composeur, **connecté avec ton compte administrateur** (celui qui ouvre `/admin`). Catégorie **Général**. Pas de média.
**Pourquoi :** le fil ne contient qu'un « Bonjour » du 29 mai. Un membre qui arrive sur un fil vide ne publie pas. Le premier message doit venir de toi et appeler une seule action : se présenter.
**Quand :** le lundi 16/11, le jour où le premier défi s'ouvre (§ 2.3). À défaut, dès que le § 2.5 est fait : le fil doit être propre avant que ton message n'y soit le seul.

```
Bienvenue au Club. Ici, on apprend le digital en le faisant, et on se montre ce qu'on fait, même quand ce n'est pas parfait.

Trois choses pour bien commencer :
1. Présente-toi en commentaire juste en dessous : ton métier, ta ville, et une chose que tu veux savoir faire d'ici la fin de l'année.
2. Regarde le défi de la semaine en haut du fil. Il prend moins d'une heure.
3. Note la prochaine session en direct dans l'Agenda.

Je lis tout et je réponds à chaque présentation. Je commence : je suis Max-Morrys, je forme au marketing digital depuis Dakar, et d'ici la fin de l'année je veux voir chaque membre publier ici sa première réalisation. La tienne aussi.
```
(environ 650 caractères sur les 2 000 permis par le composeur.)
⚠️ « Je réponds à chaque présentation » est un engagement : le retirer si tu ne peux pas le tenir. L'audit note que le Club t'appelle « Rys » et le profil « Rys Digi » ; le nom affiché sous ce message sera celui de ton profil. **Le mettre à « Max-Morrys » avant de publier** (Paramètres du profil), sinon le message signé « je suis Max-Morrys » paraît venir d'un autre.

### 2.3 Quatre défis hebdomadaires, novembre-décembre

**Où :** onglet **Défis** → « Nouveau défi », quatre fois.
**Comment le Club choisit le défi affiché** (`getActiveClubChallenge`, `src/lib/firestore/club.ts`) : parmi les défis dont l'interrupteur « Défi actif » est allumé, celui dont la période contient aujourd'hui ; à défaut, le dernier par date de début. **[décision]** Crée les quatre tout de suite, interrupteur **allumé**, avec des périodes qui se suivent sans trou (lundi 00:00 → dimanche 23:59) : le bon défi s'affiche tout seul chaque lundi. Le 14/12, éteins les quatre, sinon le dernier reste affiché.
Le champ « Récompense » n'est qu'un texte affiché : rien n'est remis, aucune participation n'est comptée. **[décision]** On ne promet donc ni argent, ni remise, ni badge (un concours a des obligations légales), seulement ta réponse personnelle. Le suivi des participations se fait à la main, dans le fil.
Thèmes alignés sur les fils rouges du plan 360 : « Les fêtes, sans brader » (16-29/11) puis « Garder ceux qui ont acheté » (décembre).

| # | Début → Fin | Titre (champ « Titre ») | Consigne (champ « Description ») | Critère de réussite (dans la description) | Récompense |
|---|---|---|---|---|---|
| 1 | lun. 16/11/2026 00:00 → dim. 22/11 23:59 | Ta fiche Google prête pour les fêtes | Ouvre ta fiche Google, ou celle d'un commerce que tu accompagnes. Mets à jour les horaires de décembre, ajoute 3 photos prises cette semaine et écris en une phrase ce que tu vends pendant les fêtes. | Réussi si tu publies dans le fil (catégorie Témoignage) les 3 changements faits, avec une capture avant/après. Pas de fiche ? Raconte ce qui t'en empêche, ça compte aussi. | Je commente chaque participation. |
| 2 | lun. 23/11 00:00 → dim. 29/11 23:59 | Une promo de fêtes sans casser ton prix | Écris une offre de fêtes pour ton activité, ou pour un commerce réel, sans aucune remise en pourcentage : livraison offerte, lot, petit cadeau, service en plus. Dis à qui elle s'adresse et jusqu'à quand. | Réussi si tu publies le texte de l'offre (catégorie Général) et que tu commentes l'offre d'un autre membre avec une suggestion concrète. | Je commente chaque participation. |
| 3 | lun. 30/11 00:00 → dim. 06/12 23:59 | Le message à un ancien client | Écris un message de remerciement ou de nouvelles à 3 personnes qui t'ont déjà acheté quelque chose ou déjà écrit. Pas de lien de vente, pas de promo : une vraie nouvelle et une question. N'écris qu'à des gens qui ont déjà échangé avec toi. | Réussi si tu publies ton message (sans nom ni numéro) et le nombre de réponses reçues au bout de 48 h, même s'il est de zéro. | Je commente chaque participation. |
| 4 | lun. 07/12 00:00 → dim. 13/12 23:59 | Ton année en 3 chiffres vrais | Relève 3 chiffres réels de ton activité en 2026 : messages reçus, publications faites, ventes, abonnés gagnés… Chacun doit venir d'un outil (statistiques de la page, WhatsApp Business, ton cahier). Puis fixe un seul objectif chiffré pour janvier. | Réussi si tu publies les 3 chiffres avec leur source et ton objectif de janvier. Un chiffre sans source ne compte pas. | Je commente chaque participation. |

Notes de Mariam : le défi 3 respecte la règle « aucun message non sollicité » (seulement des gens déjà en conversation) ; le défi 4 prépare le fil rouge de janvier « Un plan, pas une résolution ». Les défis peuvent être relayés en story le lundi (rubrique CERCLE), seulement **après** avoir été créés.

### 2.4 Sessions : retirer la « Session Test », traiter celle du 21/02

**Où :** onglet **Sessions Live**.
**Pourquoi :** l'audit voit les sessions du 21/02 et du 04/04/2026 encore annoncées « à venir » en novembre. Le correctif de code est fait dans `fac106b` (`src/pages/lms/tabs/club/schedule.ts` : une date passée ou un statut « passée/tenue » ferme la session), sous réserve du déploiement. Les données restent à nettoyer : une session de test n'a rien à faire en production.

- [ ] **« Session Test » du 04/04/2026** (statut « tenue » dans la console) → **Supprimer la session**. C'est une donnée de test.
- [ ] **Session du samedi 21/02/2026** → **[décision] ne pas la supprimer, passer son statut à « Passée ».** Un compte y est inscrit (l'audit s'est désinscrit puis réinscrit) : la supprimer laisserait une inscription orpheline. La passer à « Passée » la retire de l'agenda à venir sans rien détruire. Ne pas changer sa date pour la « recycler » : les inscrits d'une session de février ne se sont pas inscrits pour décembre.
- [ ] **Créer une vraie session** (« Nouvelle session »). La page publique du Club promet deux sessions par mois, et la console en compte 0 tenue. Proposition, à ne créer **que si tu peux la tenir** (une session annoncée puis ratée coûte plus qu'un agenda vide) :
  - **Titre :** `Ta fiche Google avant les fêtes, en direct` · **Date :** samedi 21/11/2026, 11:00 (heure de Dakar) · **Durée :** 45 min · **Statut :** À venir · **Lien :** ton lien Meet ou Zoom, à coller (la console ne le vérifie pas).
  - **Description :** `On ouvre ensemble une fiche Google, on corrige ce qui empêche les clients de te trouver en décembre, et je réponds à tes questions. Viens avec ta fiche ouverte, ou celle d'un commerce que tu accompagnes.`
  - Seconde date suggérée : samedi 12/12/2026, 11:00, « Garder ceux qui ont acheté : le message de fin d'année ».
  - ⚠️ La console n'envoie aucun rappel aux inscrits : annonce-la toi-même dans le fil.

### 2.5 Comptes de test et données « [TEST QA] » à supprimer

**Pourquoi :** le classement montre « Max-Morrys » et « Max-Morrys Eyoum », vraisemblablement deux comptes de la même personne, et l'audit a laissé du contenu marqué « [TEST QA] » (coordonnées fictives `test-qa@example.com`). Un nouveau membre voit aujourd'hui des comptes de test et des publications de test.

**Comptes « Max-Morrys » et « Max-Morrys Eyoum » — signaler, ne pas supprimer à l'aveugle.**
Je n'ai pas pu déterminer lequel est réel : la collection `users` n'est pas lisible hors console.
- [ ] `/admin/utilisateurs` (Comptes) → chercher les deux noms. Pour chacun, noter l'e-mail, le rôle, l'abonnement Club et les paiements (`/admin/transactions`).
- [ ] Celui qui n'a ni paiement, ni inscription, ni rôle admin est le compte de test : `/admin/club-digitos` → **Profils membres** → passer son profil à **Masqué**. Ne supprimer le compte qu'ensuite, et seulement s'il n'a aucune transaction, car la suppression est définitive.
- [ ] Vérifier ensuite sur `club.maxmorrys.me/classement` qu'il a disparu. Si un profil masqué y reste, c'est un défaut de code à signaler : le classement ne lirait pas l'état du profil.

**Données « [TEST QA] » (liste de l'audit, section « Données de test à supprimer »)** :

| ☐ | Où | Quoi supprimer |
|---|---|---|
| ☐ | `club.maxmorrys.me/fil` → menu « ⋮ » de la publication (ou `/admin/club-digitos` → Publications) | la publication « [TEST QA] Publication de test… » **et son commentaire** |
| ☐ | `/admin/club-digitos` → Opportunités (ou icône corbeille sur `club.maxmorrys.me/opportunites`) | l'annonce « [TEST QA] Opportunité de test » |
| ☐ | `edu.maxmorrys.me` → Mes notes → « Supprimer la note » | la note « [TEST QA] Note de test » |
| ☐ | `edu.maxmorrys.me` → assistant Prof → historique | la conversation « [TEST QA] En une phrase, c'est quoi le SEO ? ». Vérifier aussi la **mémoire de Prof** (activée par défaut), qui a pu la retenir. La question consommée (15 → 14) ne se rend pas d'elle-même : au besoin, `/admin/quotas`. |
| ☐ | `maxmorrys.me` → Mes messages | le message « [TEST QA] Message de test » |
| ☐ | `/admin/messages` | sa copie, et le message de contact « [TEST QA] Message de test » de `test-qa@example.com` |
| ☐ | `/admin/prospects-agence` (Conception · prospects) | la demande de devis « [TEST QA] Commerce de test », référence **DV-86CD720C9277** |
| ☐ | `/admin/projets` (demandes d'agence) | la demande « [TEST QA] Organisation » de « [TEST QA] Testeur » (`test-qa@example.com`) |
| ☐ | **Console Firebase** → Firestore → collection `newsletter` (aucun écran `/admin` ne liste les abonnés) | le document de `test-qa@example.com`. Puis, si le contact a été synchronisé, le supprimer aussi dans **Brevo** → Contacts. |

Rien à faire pour l'inscription à la session du 21/02 ni pour l'interrupteur « Me prévenir à la publication » : l'audit les a restaurés.

---

## 3. Blog : les 47 brouillons (Aminata)

### 3.1 Ce que j'ai pu lire, et ce que je n'ai pas pu lire

- `npm run blog:lint` (lecture seule) → **« Aucun article à contrôler »**. `content/blog/` ne contient que `README.md` et `_modele.md` : **aucun des 47 brouillons n'est versionné.**
- Les brouillons sont dans Firestore `blog/` (93 documents, dont 46 publiés). Les règles réservent les brouillons aux administrateurs : **je n'ai pas leurs titres.** Le plan ci-dessous est donc un plan de tri puis de publication par créneau ; le choix nominatif se fait à l'étape 0.
- Ce que je sais de leur origine : les 46 articles publiés et, selon toute vraisemblance, les 47 brouillons sortent de WF-08 (Gemini, avril-juin 2026). Les 43 idées NocoDB au statut `produit_draft` correspondent presque toutes à des sujets **déjà publiés** (QR Code, SEO immobilier Dakar, influence Cameroun, matériel vidéo…). D'où mon hypothèse : **une bonne part des 47 sont des doublons de sujets en ligne.**
- Défauts connus de tout ce que WF-08 a produit (audit éditorial du 29/10) : un H1 dans le corps, des emojis, des statistiques non sourcées, un CTA de fin concurrent, des titres de plus de 47 caractères, parfois du vouvoiement, `publishedAt` fixé à la date du brouillon (avril-mai), pas de `slug_en`. **Aucun brouillon ne se publie tel quel.**

### 3.2 Étape 0 — le tri (toi, 30 min, avant le 13/11)

**Où :** `/admin/articles` → filtre brouillons. Pour chaque brouillon, trois questions, dans cet ordre :

| Question | Si oui | Décision |
|---|---|---|
| 1. Le sujet est-il **déjà publié** (même mot-clé, même promesse : voir l'annexe A) ? | — | **Retirer** (supprimer le brouillon, ou le laisser en brouillon avec « [RETIRÉ] » devant le titre si tu préfères garder une trace) |
| 2. Est-ce une **actualité périmée** (« 2024 », DeepSeek, « nouveautés 2026 » de mai, Mistral…) ou un sujet sans lien avec une offre (Club, Rysmo, packs commerces, accompagnement) ? | — | **Retirer** |
| 3. Sert-il un fil rouge du plan 360 ? (novembre : vendre pour les fêtes sans brader, être trouvé sur Google ; décembre : fidéliser, avis, relance ; janvier : apprendre le marketing digital, se former, s'organiser) | oui | **Garder, priorité 1** |
| | non, mais utile et intemporel (méthode, outil gratuit, prix) | **Garder, priorité 2** |

Puis noter le slug des « Garder » dans `_bmad-output/editorial/remise-a-niveau.md` (ou me les donner en session). **Cible réaliste : 14 brouillons gardés au plus**, ce qui correspond aux 14 créneaux du calendrier ci-dessous. Je m'attends à retirer plus de la moitié des 47. Ce n'est pas un échec : 46 articles en ligne font 2 clics en 90 jours, en publier 47 de plus du même moule n'y changera rien.

### 3.3 Chaîne de remise en état d'un brouillon gardé

1. Cheikh recopie le texte du brouillon dans `content/blog/<slug>.md` (modèle `_modele.md`) et le corrige : retrait du H1 et des emojis, chiffres sourcés par Thierry ou supprimés, tutoiement, titre de 47 caractères au plus, un seul CTA (celui de la page).
2. Béatrice : `npm run blog:lint -- content/blog/<slug>.md`, jusqu'à 0 erreur.
3. **Toi, dans `/admin/articles` :** tu colles le texte corrigé dans le brouillon existant, sans en créer un nouveau (`blog:publish` refuse un slug déjà pris, c'est voulu), puis :
   - ⚠️ **remplace la date de publication par la date du jour** : sinon l'article s'affiche daté d'avril-mai et se range sous les anciens ;
   - **enregistre une fois avant de publier**, pour que le `slug_en` se génère (WF-08 ne l'écrivait pas) ;
   - **Publier le jour J.** Le statut « programmé » n'existe pas, et une date future publie tout de suite : il faut cliquer le jour même.

### 3.4 Calendrier de publication [décision]

**Cadence : 2 articles par semaine au plus, le mardi et le jeudi, jamais plus.** Tu demandais 2 à 3. Je prends 2, parce que le goulot est ton temps de relecture : chaque brouillon demande une remise en état complète, et le plan 360 du 29/10 te demande déjà de relire A1 à A6 (un article neuf toutes les deux semaines, le jeudi). Ces articles neufs **prennent le créneau du jeudi** dans leur semaine. Pause pendant les fêtes (S52-S53). Cadence jamais annoncée publiquement.
**Si tu tiens moins** : on passe à 1 par semaine (le mardi seulement) et l'on coupe la colonne « priorité 2 ».
⚠️ Ceci **double** la cadence blog recommandée le 29/10 (décision n° 10 du plan 360, « 6 articles + 1 semaine de réparation »). À trancher par toi : je ne l'ai pas tranché à ta place.

| Date | Créneau | Contenu | Ce qu'on cherche dans les brouillons gardés |
|---|---|---|---|
| **sem. 46 (09-15/11)** | — | **Réparation des doublons publiés (§ 3.5)**, avant de publier quoi que ce soit | — |
| mar. 17/11 | brouillon P1 | novembre : être trouvé | fiche Google, Maps, visibilité locale d'un commerce, s'il n'est pas déjà en ligne |
| jeu. 19/11 | **A1** (neuf) | « Vendre sur WhatsApp pour les fêtes » | — |
| mar. 24/11 | brouillon P1 | novembre : vendre sans brader | promo, prix, lots, livraison ; **pas** un 2ᵉ article WhatsApp (cannibalise A1) |
| jeu. 26/11 | brouillon P1 | novembre : avant le Black Friday | photo produit, catalogue, contenu à petit budget |
| mar. 01/12 | brouillon P1 | décembre : fidéliser | relance, service client, réponses rapides |
| jeu. 03/12 | **A2** (neuf) | « Avis Google : en obtenir sans les acheter » | — |
| mar. 08/12 | brouillon P1 | décembre : garder ceux qui ont acheté | CRM simple, suivi client, liste de diffusion |
| jeu. 10/12 | brouillon P2 | intemporel | outil gratuit testé, méthode |
| mar. 15/12 | brouillon P2 | intemporel | — |
| jeu. 17/12 | **A3** (neuf) | « Débuter en marketing digital : par où commencer » | — |
| 21/12 → 03/01 | **pause** | S53 : fusion de contenu des paires du § 3.5 (réécriture), avec toi | — |
| mar. 05/01/2027 | brouillon P1 | janvier : apprendre | se former, premiers pas, organisation |
| jeu. 07/01 | **A4** (neuf) | « Lexique du marketing digital » (page pilier) | — |
| mar. 12/01 | brouillon P1 | janvier : un plan | planifier son contenu, son mois |
| jeu. 14/01 | brouillon P2 | intemporel | — |
| mar. 19/01 | brouillon P1 | janvier | — |
| jeu. 21/01 | **A5** (neuf) | « Prix d'un site web à Dakar : le vrai calcul » | — |
| mar. 26/01 | brouillon P2 | intemporel | — |
| jeu. 28/01 | brouillon P2 | intemporel | — |
| mar. 02/02 | brouillon P2 | intemporel | — |
| jeu. 04/02 | **A6** (neuf) | « Réponses rapides WhatsApp et IA » | — |

**Règle de vide :** si aucun brouillon gardé ne convient à un créneau, **le créneau reste vide.** On ne publie pas pour remplir. Total : 14 créneaux de brouillons + 6 articles neufs + 1 semaine de réparation, du 09/11 au 04/02. Les brouillons non publiés au 04/02 sont retirés ou renvoyés dans la banque d'idées.

### 3.5 Doublons et cannibales déjà publiés : à réparer avant tout (sem. 46)

Lu en direct sur l'API publique le 03/11 : les slugs en double ont été renommés le 29/10, mais **les deux exemplaires restent publiés** avec des titres identiques ou presque. **[décision]** Règle : on garde le document qui porte l'URL d'origine, celle que Google a pu voir, et l'on dépublie l'autre avec une redirection 301. La fusion du contenu (reprendre le meilleur des deux textes) vient ensuite, en S53, par la chaîne du § 3.3.

**Où :** `/admin/articles` (passer en brouillon = « dépublier »), puis `/admin/redirections` → Nouvelle redirection, code **301 — permanent**, active. Une redirection par langue, jamais d'une langue vers l'autre.

| Sujet | **Garder** (id · URL FR) | **Dépublier** (id · URL FR) | Redirections 301 à créer |
|---|---|---|---|
| **Matériel vidéo** (titre identique : « Matériel vidéo entrepreneur : Ton guide complet 2026 à Dakar ») | `hsoIgnH2…` · `/blog/materiel-video-entrepreneur-guide-2026` → **changer sa catégorie** de « SEO & Visibilité » à « Business & Gestion » | `NpryN6PZ…` · `/blog/materiel-video-entrepreneur-guide-complet-2026-dakar` (renommé le 29/10, inconnu de Google) | `/blog/materiel-video-entrepreneur-guide-complet-2026-dakar` → `/blog/materiel-video-entrepreneur-guide-2026` · `/en/blog/entrepreneur-video-equipment-your-complete-2026-guide-in-dakar` → `/en/blog/entrepreneur-video-equipment-your-complete-2026-guide-in-dakar-2` |
| **Algorithme Instagram** | `JZbIawtr…` · `/blog/algorithme-instagram-2026-vues-strategie` | `J4GrQTGD…` · `/blog/algorithme-instagram-2026-pourquoi-les-vues-comptent` | FR : ancienne → gardée ; EN : `/en/blog/instagram-algorithm-2026-why-views-matter-more` → le `slug_en` du document gardé (à lire dans sa fiche admin) |
| **Lois e-commerce** | `jHvSXlz5…` · `/blog/vendre-en-ligne-afrique-francophone-lois-2026` | `EHrwvFGz…` · `/blog/vendre-en-ligne-afrique-francophone-guide-des-lois-2026` | FR : ancienne → gardée ; EN : `/en/blog/selling-online-in-francophone-africa-2026-legal-guide` → `slug_en` du gardé |
| **Pub Facebook 50 000 F** (cannibales) | `CATS0haI…` · `/blog/rentabiliser-50000-fcfa-publicite-facebook-afrique` (le seul article avec des clics : 2 clics, 29 impressions en 90 j) | `4GbCGDN4…` · `/blog/publicite-facebook-petit-budget-50000-fcfa` | FR + EN (lire le `slug_en` des deux fiches) |

Vérifier ensuite que la page « Redirections » ne signale ni chaîne ni conflit. Les autres paires proches (« fixer tes prix » ×2, « SEO local Dakar/Abidjan » ×2, « Personal Branding » ×3) passent en S53 dans le plan de remise à niveau : on n'y touche pas avant.

---

## 4. Podcast en double (Aminata)

**Constat :** un seul épisode est publié : « 5 tendances Marketing Digital en Afrique en 2025 », id `qjiHonzYHYzpmCPrgPyT`, saisi à la main le 07/03/2026, slug `5-tendances-marketing-digital-en-afrique-en-2025`, Spotify `0VkCOu2XTiAp56jG7jwm9g`. Son double « importé de Spotify · à relire » est un brouillon dont l'identifiant doit être `sp_0VkCOu2XTiAp56jG7jwm9g`.

**Piège :** l'import Spotify tourne **chaque jour à 04:00** (cron du Worker `api`) et ne reconnaît un épisode que par l'identifiant de document `sp_<id>` (`worker/apps/api/src/lib/media-sync.ts`). **Si tu supprimes le brouillon `sp_…`, il revient le lendemain.**

**[décision] On garde le document importé `sp_…`, on y reporte le travail du document manuel, puis on supprime le manuel.** Garder le manuel et supprimer l'importé ne tiendrait pas une nuit.

**Où :** `/admin/podcasts`.
- [ ] Vérifier que l'identifiant du brouillon « à relire » est bien `sp_0VkCOu2XTiAp56jG7jwm9g` (même lien Spotify que l'épisode publié). Si ce n'est pas le cas, s'arrêter : le doublon est d'une autre nature.
- [ ] Ouvrir l'épisode **publié** (manuel) et copier ce qui a été saisi à la main : description, transcription, catégorie (« Marketing »), couverture, `slug_en`.
- [ ] Sur l'épisode **manuel** : remplacer le slug par `5-tendances-marketing-digital-en-afrique-en-2025-ancien` et le passer en brouillon, pour libérer le slug.
- [ ] Sur l'épisode **importé** `sp_…` : coller le slug `5-tendances-marketing-digital-en-afrique-en-2025` (la même URL, rien ne casse), puis les champs copiés. Garder la date de publication d'origine (24/02/2025). Statut **publié**, Enregistrer.
- [ ] Vérifier que `/podcasts/5-tendances-marketing-digital-en-afrique-en-2025` répond, puis **supprimer l'épisode manuel**.

---

## Annexe A — les 46 articles publiés (pour l'étape 0 du tri)

Lu le 03/11/2026 sur l'API publique (`status == published`). Format : date · pôle · slug.

```
04-01 Business   auto-entrepreneur-senegal-cote-ivoire-guide-complet
04-03 Réseaux    personal-branding-lamine-yamal-afrique-business
04-04 SEO        seo-local-senegal-cote-divoire-google-maps
04-06 E-com      paiement-en-ligne-senegal-cote-ivoire-passerelles-fcfa
04-06 Pub        tiktok-ads-afrique-guide-pme
04-07 E-com      vendre-produits-locaux-en-ligne-senegal
04-07 IA         ia-marketing-afrique-copywriting-local
04-08 SEO        seo-local-marketing-digital-senegal-cote-divoire
04-09 Réseaux    influenceur-cameroun-marketing-roi
04-10 E-com      vendre-sur-whatsapp-afrique-catalogue-vs-site
04-11 IA         ia-pour-entrepreneurs-afrique-prompts-business
04-11 SEO        seo-immobilier-dakar-dominer-google
04-12 Business   salaire-community-manager-cameroun-grille-recrutement
04-12 E-com      ecommerce-senegal-guide-complet
04-12 Réseaux    influenceur-cote-divoire-marketing-influence-abidjan
04-13 E-com      vendre-sur-facebook-senegal-sans-site-web
04-14 Pub        rentabiliser-50000-fcfa-publicite-facebook-afrique
04-14 Réseaux    vendre-sur-facebook-sans-pub-groupes
04-14 SEO        google-my-business-afrique-visibilite-locale
04-15 Réseaux    personal-branding-cote-divoire-cadres-abidjan
04-16 Business   gestion-financiere-entrepreneur-afrique-fcfa
04-18 Business   vendre-en-ligne-afrique-francophone-guide-des-lois-2026   (à dépublier, § 3.5)
04-20 E-com      marche-afrique-francophone-opportunites-benin-togo
04-22 SEO        tiktok-seo-recherche-dakar-afrique
04-25 Business   qr-code-pme-boutique-physique-digital
04-26 Pub        publicite-facebook-senegal-marketing-football
04-28 IA         automatiser-ton-marketing-ia-afrique
04-30 Pub        google-ads-afrique-trouver-clients-dakar-abidjan
05-01 IA         automatisation-whatsapp-ia-service-client-afrique
05-03 Réseaux    marketing-pour-photographe-afrique-contrats-mariage
05-06 Business   crm-gratuit-pme-afrique-google-sheets
05-08 Business   outils-gestion-business-gratuits-afrique
05-09 Business   materiel-video-entrepreneur-guide-complet-2026-dakar      (à dépublier, § 3.5)
05-12 E-com      vendre-au-cameroun-depuis-le-senegal-logistique
05-14 Pub        publicite-facebook-petit-budget-50000-fcfa                (à dépublier, § 3.5)
05-18 Business   vendre-montage-video-freelance-afrique
05-19 SEO        materiel-video-entrepreneur-guide-2026
05-20 IA         mistral-ai-marketing-afrique-francophone-2026
05-20 Réseaux    algorithme-instagram-2026-pourquoi-les-vues-comptent      (à dépublier, § 3.5)
05-21 Business   tarifs-marketing-fixer-prix-fcfa-2026
05-22 Business   freelance-digital-fixer-prix-senegal-cote-ivoire-2026
05-24 Réseaux    algorithme-instagram-2026-vues-strategie
05-26 Réseaux    personal-branding-discret-vendre-expertise-afrique
05-28 IA         deepseek-ia-marketing-afrique-2026
06-01 Réseaux    linkedin-b2b-2026-marketing-afrique
06-04 E-com      vendre-en-ligne-afrique-francophone-lois-2026
```

## Ce qui reste indéterminé

- Les titres et le contenu des **47 brouillons** (lecture admin seulement) : le tri nominatif est l'étape 0, faite par toi.
- Le texte exact de l'**info Club du 01/06/2026** : consigne et texte de remplacement fournis.
- **Lequel** des comptes « Max-Morrys » et « Max-Morrys Eyoum » est le compte de test : procédure fournie.
- Le déploiement en production du correctif de dates du Club (`fac106b`) : non vérifié ici.
- Le sens exact de la traduction EN affichée pour la FAQ (`translateContent`) : à contrôler sur `/en/faq` après modification.
