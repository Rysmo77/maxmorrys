# Audit UI/UX mobile complet de Rysmo (Max-Morrys)

> **Date** : 5 octobre 2026 · **Version auditée** : `main` @ `ba2226e` (React Native 0.86 / Expo SDK 57, 55 routes, ~13 500 lignes d'écrans, design system maison de 40 fichiers)
> **Méthode** : lecture intégrale du code des 55 routes et du design system (`mobile/app`, `mobile/ds`, `mobile/ecrans`, `mobile/donnees`), confrontée au kit de design de référence (`DS_Final/` : planches de mouvement, de micro-interactions, de moments et de transitions ; écrans natifs `ui_kits/native`), au contrat serveur (`worker/apps/api`) et à une capture réelle sur un TECNO CK6 (1080 × 2400, Android). Chaque constat critique ou élevé a été **revérifié dans le code** par l'auditeur principal. Les preuves sont données en `fichier:ligne` (chemins relatifs à `mobile/`).
> **Limites** : un seul écran a pu être observé sur appareil (le téléphone a été débranché pendant l'audit). Les analyses responsive et de contraste sur maillage sont **calculées**, pas mesurées à l'écran ; elles sont signalées comme telles. Le benchmark s'appuie sur la connaissance de produits de référence, pas sur une recherche web du jour.

Documents liés : [`ROADMAP_UI_UX_MOBILE.md`](ROADMAP_UI_UX_MOBILE.md) · [`BACKLOG_UI_UX_MOBILE.md`](BACKLOG_UI_UX_MOBILE.md) · [`DESIGN_SYSTEM_MOBILE_RECOMMANDATIONS.md`](DESIGN_SYSTEM_MOBILE_RECOMMANDATIONS.md) · [`MOTION_DESIGN_RECOMMANDATIONS.md`](MOTION_DESIGN_RECOMMANDATIONS.md) · [`QUICK_WINS_UI_UX_MOBILE.md`](QUICK_WINS_UI_UX_MOBILE.md)

---

## 1. Résumé exécutif

### Impression générale

Rysmo a une **identité visuelle réelle et rare** : un maillage coloré par territoire, une typographie d'affichage Fraunces en capitales, une grammaire de mouvement écrite, et une éthique de produit inhabituelle (« un nombre affiché vient d'une source datée, sinon il dit *non relevé* »). Le socle technique de rendu est sain : couleurs 100 % en jetons, thème clair/sombre propre, animations sur le pilote natif.

Mais **l'application ment encore à plusieurs endroits**, et c'est son défaut le plus grave parce qu'il contredit précisément ce qui la distingue. Elle annonce une écoute sur écran verrouillé qui n'existe pas, un widget qui n'existe pas, des réglages de notification « enregistrés » qui ne le sont pas, un filtre « Recrutement » qui renvoie toujours vide en affirmant « le filtre marche », un « mot de passe envoyé » alors que rien n'est parti faute de réseau. Le répétiteur IA, cœur de l'engagement, affiche du Markdown brut et **des prix de formation avec « pour l'achat »** dans une application qui, par règle de magasin, ne vend rien.

Le second défaut est **la confusion des états** : sur une dizaine d'écrans, « en cours de chargement », « en panne » et « vide » s'affichent de la même façon. Un membre du Club hors ligne lit « Le Club est réservé aux membres ». Une liste de discussions affiche « 0 discussion » avant toute lecture.

Le troisième est **le retour d'action** : 32 boîtes `Alert.alert`, aucune feuille du bas, aucune confirmation sur place, aucun retour haptique. L'application paraît figée entre le geste et le résultat.

Le lot d'animations livré le jour même (enfoncement 120 ms, entrées en cascade, titres sous masque, dérive du maillage, anneaux d'attente) donne une **base de mouvement solide et conforme au kit**. Il reste incomplet (feuilles, confirmations, indicateur de frappe, pilules qui glissent) et introduit deux défauts mineurs signalés ici.

### Niveaux de maturité

| Dimension | Niveau | En une phrase |
|---|---|---|
| UI mobile | **Intermédiaire +** | Identité forte et jetons propres ; typographie et espacements non systématisés (301 tailles et 743 marges écrites en dur). |
| UX mobile | **Intermédiaire −** | Parcours principaux présents, mais promesses non tenues, états confondus, culs-de-sac de navigation. |
| Fluidité | **Correcte** | Pilote natif, squelettes ; mais cache de 30 s qui renvoie au squelette à chaque retour, et aucun tirer-pour-rafraîchir. |
| Interactivité | **Faible** | Retours par modale système, aucune feuille, aucune haptique, pas de confirmation sur place. |
| Motion design | **Intermédiaire** | Grammaire écrite et désormais appliquée au socle ; les micro-interactions et transitions spécifiques manquent. |

### Points forts

1. **Identité et direction artistique** : maillage par territoire, Fraunces 900 en capitales, quatre couleurs de marque avec chacune un territoire. Rien de générique.
2. **Éthique de la donnée** : `Num`, `SansDonnees`, « non relevé » ; aucun chiffre de démonstration en production (sauf exceptions listées).
3. **Socle technique** : jetons générés depuis le CSS du site (AD-8), mode sombre réel, pilote natif, file d'envoi hors ligne, lecture hors connexion, cache des vues canonique.
4. **Conformité magasins pensée** : rien à vendre, Google sans Apple interdit sur iOS, suppression de compte dans l'app, textes légaux sans compte.
5. **Grammaire de mouvement** : 4 durées, 2 courbes, 2 moments scénarisés, interdits explicites — exactement la retenue qui fait un produit premium.

### Faiblesses principales

1. **Promesses non tenues** (≥ 14 occurrences) : écran verrouillé, widget, notifications, digest, annuaire, filtres morts, faux succès, questionnaire factice.
2. **Répétiteur IA** : Markdown brut, vente dans les réponses, pas d'indicateur de frappe, placeholder « Plus de question aujourd'hui » à chaque envoi, pas de défilement vers la réponse.
3. **États confondus** : chargement = vide = panne sur Discussions, Opportunités, Agenda, Classement, Membre, Certificats, Hub Club, Leçon, Répétiteur.
4. **Retour d'action** : 32 `Alert`, 0 feuille, 0 haptique, 0 confirmation sur place.
5. **Accessibilité** : 2 titres annoncés dans tout le produit, 0 région vivante, 74 textes sous 12 pt, cibles de 26 à 42 pt, contrastes sombres à 2,5:1.
6. **Chaîne d'accueil** : 5 écrans avant la première valeur, dont deux (notifications, biométrie) pour des fonctions absentes ou hors contexte ; la biométrie est proposée avant toute connexion.

### Risques actuels

| Risque | Nature | Probabilité | Impact |
|---|---|---|---|
| **Rejet App Store / Play (2.3.1, 3.1.1)** | L'IA cite des prix et renvoie « pour l'achat » ; l'onboarding promet l'écoute sur écran verrouillé ; un écran explique comment installer un widget inexistant | Élevée | Bloquant |
| **Perte de confiance** | Le produit se vend sur l'honnêteté et affiche des fonctions qui n'existent pas | Élevée | Fort (rétention, bouche-à-oreille) |
| **Abandon au premier usage de l'IA** | 20 s sans signe de vie, puis Markdown illisible | Élevée | Fort (l'IA est le différenciateur) |
| **Parcours de paiement** | Retour de paiement au démarrage à froid → « session expirée » | Moyenne | Fort (moment de vérité commercial) |
| **Accessibilité / plaintes** | Lecteurs d'écran quasi inutilisables | Moyenne | Moyen |

### Opportunités majeures

1. **Faire de l'honnêteté une sensation**, pas seulement un texte : confirmations sur place, dates de relevé visibles, états distincts. C'est la promesse de marque rendue tangible.
2. **Le répétiteur comme moment premium** : indicateur de génération sobre, réponses mises en forme, copie en un geste, suggestions de départ.
3. **Le hors-ligne comme avantage concurrentiel** sur un marché à forfaits comptés : rendre la file d'envoi visible et rassurante (modèle WhatsApp : horloge → coche).
4. **Feuilles du bas et haptique** : deux briques qui, à elles seules, font passer la perception de « web emballé » à « app native ».

### Priorités absolues (à traiter avant toute soumission en magasin)

1. Retirer toutes les promesses de fonctions inexistantes (écran verrouillé, widget, notifications, digest, filtres morts, « ce que le Club coûte »).
2. Canal `app` côté serveur pour le répétiteur : **aucun prix ni « achat »** dans les réponses ; rendu du Markdown.
3. Distinguer chargement / panne / vide sur tous les écrans de données.
4. Corriger les culs-de-sac : fiche formation → bonne leçon, Média → vidéo, quiz → site, retour de paiement au démarrage à froid.
5. Chaîne d'accueil : onboarding → Espace ; biométrie après la première connexion ; permissions retirées tant que les notifications n'existent pas.

---

## 2. Score global

Notes sur 100, justifiées par les constats de ce rapport.

| Axe | Note | Justification courte |
|---|---:|---|
| Design visuel | **72** | Identité forte et cohérente ; densité inégale, tailles hors échelle, graisses iOS retombées au 400. |
| UX globale | **50** | Parcours présents mais promesses non tenues et états confondus. |
| Navigation mobile | **58** | Onglets clairs ; culs-de-sac (vidéo, leçon), bande du Club à l'onglet actif invisible, barre d'onglets absente dans le Club. |
| Onboarding | **38** | 5 écrans avant la valeur, promesse audio fausse, biométrie avant connexion, aucune transition entre pas. |
| Clarté de la proposition de valeur | **60** | « Apprendre le digital, hors réseau aussi » est clair ; brouillé par des promesses fausses. |
| Conversion (activation) | **46** | Pas de vente par choix ; activation freinée par l'accueil et la création de compte (bouton désactivé sans raison). |
| Engagement | **42** | Répétiteur peu engageant, pas de notifications, pas de confirmation gratifiante. |
| Responsive mobile | **58** | Bon à 390–430 dp ; casse à 320–360 (Segmented, bande Club) ; tablettes Android non traitées ; clavier non géré. |
| Accessibilité | **38** | 2 titres annoncés, 0 région vivante, textes < 12 pt, cibles < 44, contrastes sombres insuffisants. |
| Cohérence graphique | **68** | Jetons de couleur parfaits ; typographie, espacements, rayons hors système. |
| Qualité des composants | **56** | Bonne API de base ; manquent feuille, confirmation, liste virtualisée ; `Field` sous-équipé. |
| Qualité des animations | **64** | Socle conforme au kit (lot du 05/10) ; quelques défauts (préférence lue tard, pilule lue deux fois). |
| Micro-interactions | **40** | Enfoncement et bascules ; ni « Copié », ni pastille de quota, ni frappe, ni réservation confirmée. |
| Motion design | **63** | Grammaire écrite et appliquée ; transitions de détail, feuilles et territoire absentes. |
| Performance perçue | **54** | Squelettes ; mais cache de 30 s qui vide l'écran, 1 s de mouvement cumulé à l'arrivée, fontes rechargées. |
| Crédibilité professionnelle | **46** | Identité premium, mais phrases de développeur visibles (« src/types/index.ts ») et fonctions fantômes. |
| Modernité | **66** | Esthétique contemporaine ; patterns datés (modales système, pas de feuilles). |
| Design system | **57** | Jetons et mouvement : bons ; typographie/espacement/élévation : à construire. |
| Contenu UX | **44** | Ton juste et tutoiement ; mais justifications de conception affichées, féminin imposé, jargon. |
| Plaisir d'utilisation | **48** | Beau à l'arrêt, peu gratifiant à l'usage. |
| **Note globale** | **53 / 100** | Moyenne pondérée (UX, crédibilité et accessibilité comptées double). |

**Lecture** : un produit à **fort potentiel (cible atteignable : 80+ en 90 jours)**, dont la note est aujourd'hui tirée vers le bas par des défauts d'honnêteté et de retour d'action, pas par son esthétique.

---

## 3. Analyse écran par écran

Gravités : **critique** (bloque un parcours ou un passage en magasin) · **élevée** · **moyenne** · **faible**. Les animations citent les durées du kit : *tap* 120 ms, *ui* 220 ms, *enter* 380 ms, *scene* 700 ms ; courbes `ease` (.2,.7,.2,1) et `ease-out` (.16,1,.3,1).

### 3.1 Entrée de l'application

#### Lancement — `app/lancement.tsx`, `app/index.tsx`
- **Objectif** : attendre la restauration de session puis orienter vers l'accueil ou l'Espace.
- **Fonctionne** : pas de fausse barre de progression ; attente réelle de `onAuthStateChanged` (pas de clignotement vers la connexion) ; `/` mène bien au lancement (corrigé le 04/10).
- **Problèmes**
  - Entrée statique alors que le kit prévoit mot-symbole en `rv-s` et signature en cascade (`lancement.tsx:70-81`). *Moyenne.*
  - Passage écran système blanc → maillage sans fondu (« pop »). *Faible.*
- **Recommandations / animations** : mot-symbole `opacity 0→1` + `scale .94→1`, 380 ms `ease-out` ; signature `translateY 16→0`, 380 ms, délai 210 ms ; `SplashScreen.setOptions({ fade: true, duration: 220 })` ; naviguer seulement à la fin de l'entrée (~590 ms) si la session est déjà prête.
- **Quick win** : fondu du splash (S).

#### Accueil (onboarding) — `app/onboarding.tsx`
- **Objectif** : trois promesses, passables, sans compte.
- **Fonctionne** : « Passer » de 44 pt, puces de progression avec rôle `progressbar`, « Aucun compte demandé ».
- **Problèmes**
  - **Promesse fausse** : pas 3 « ÉCOUTE ÉCRAN VERROUILLÉ » (`:31-35`) alors qu'aucune lecture audio n'existe. *Critique* (revue 2.3.1).
  - Titre tronqué « HORS RÉSEAU AUS.. » sur 1080 px (constaté sur TECNO) — corrigé par le lot du 05/10 (`adjustsFontSizeToFit`), à vérifier sur appareil.
  - Aucune transition entre les pas : le texte change sans rejouer l'entrée (`Revele` et `LigneDeTitre` ne s'animent qu'au montage). *Moyenne.*
  - Même illustration (dégradé + mot-symbole) sur les trois pas. *Moyenne.*
  - Le retour Android quitte l'application depuis le pas 2 ou 3 (pas de `BackHandler`). *Moyenne.*
  - « 1 sur 3 » double les puces. *Faible.*
- **Recommandations** : remplacer le pas 3 par un gain réel (« Ton certificat se vérifie sans compte » ou « Tes notes restent sur ton téléphone ») ; un glyphe par pas (wifi-off, chat, certificat) ; `key={pas}` sur le bloc pour rejouer l'entrée ; `BackHandler` qui recule d'un pas ; geste de balayage horizontal.
- **Animations** : sortie du pas `opacity 1→0` 120 ms ; entrée glyphe `rv-s` 380 ms, titre sous masque 700 ms (90 ms/ligne), chapô `rv` délai 140 ms ; puce active : pilule absolue en `scaleX` 220 ms `ease` (pas de `width`).

#### Notifications (pré-permission) — `app/permissions.tsx`
- **Objectif** : présenter trois relances avant le dialogue système.
- **Problème majeur** : **l'écran ne fait rien** — aucune bibliothèque de notifications, aucun choix enregistré ; « Pas maintenant la garde pour plus tard » est faux (`:50-52`, `:95-102`). *Élevée.*
- **Recommandation** : retirer de la chaîne d'accueil jusqu'à `expo-notifications` ; le jour venu, demander **en contexte**, après la première leçon terminée (« Je te rappelle demain à 19 h ? »).

#### Biométrie — `app/biometrie.tsx`
- **Fonctionne** : le drapeau n'est écrit qu'après un geste réussi ; repli sur le code du téléphone ; erreurs traduites.
- **Problèmes**
  - **Proposée avant toute connexion** (chaîne `permissions → biometrie` en anonyme), avec le texte « Parce que tu viens de te connecter » (`:137-142`). *Élevée.*
  - « Face ID » codé en dur sur iOS (`:63, 75, 117, 127`) alors que `capacite.geste` vaut « Touch ID » sur iPhone SE. *Moyenne.*
  - Aucune confirmation de succès : navigation sèche vers l'Espace. *Moyenne.*
- **Recommandations** : afficher l'écran **après la première connexion réussie** (e-mail, création, Google) ; utiliser `capacite.geste` partout.
- **Animation** : tuile cadenas → coche (fondu croisé 220 ms), texte « C'est posé. Ton mot de passe marche toujours. », haptique succès, navigation après 380 ms.

### 3.2 Compte

#### Connexion — `app/connexion.tsx`, `ecrans/BoutonGoogle.tsx`
- **Fonctionne** : bouton désactivé tant que vide, libellé « Connexion… », erreur volontairement générique (anti-énumération), œil afficher/masquer, Google réservé à Android (règle 4.8), textes légaux accessibles.
- **Problèmes**
  - **Clavier** : `Screen` ne gère pas le clavier ; sur iOS, le bouton d'envoi passe sous le clavier. *Élevée.*
  - **Formulaire** : pas de `autoComplete` (`email`, `current-password`), `textContentType="emailAddress"` au lieu de `username`, pas de `autoCorrect={false}`, pas de `returnKeyType`/`onSubmitEditing` ; icône d'œil identique dans les deux états (`:75-102`). *Moyenne.*
  - « Créer un compte » est sous trois blocs (`:137-142`). *Moyenne.*
  - Aucune aide après deux échecs. *Moyenne.*
- **Recommandations** : remonter « Pas encore de compte ? Créer un compte » sous le bouton principal ; au 2ᵉ échec : « Inscrit avec Google sur le site ? Utilise le bouton Google » (Android) ; `eye` / `eye-off`.
- **Animations** : bordure d'erreur en fondu 220 ms (couche en opacité) ; haptique erreur **sans secousse**.

#### Création de compte — `app/creation.tsx`
- **Problèmes**
  - **Bouton désactivé sans dire pourquoi** (8 caractères minimum, `:43, 138`). *Élevée* pour un public peu à l'aise avec les formulaires.
  - Message serveur contradictoire : « six caractères au minimum » (`donnees/identite.ts:66`) contre « Huit » dans l'aide. *Moyenne.*
  - Toutes les erreurs s'affichent sous le mot de passe, y compris « Un compte existe déjà ». *Moyenne.*
  - Pas d'œil afficher/masquer ; `textContentType="password"` au lieu de `newPassword` (pas de mot de passe fort iOS). *Moyenne.*
  - Encart rédigé pour un développeur (« la règle de la base refuse… »), qui laisse croire qu'il faut cocher la lettre d'information. *Moyenne.*
- **Microcopy** : « Crée mon compte » → **« Créer mon compte »** ; encart → « Cette case est décochée par défaut. Tu ne reçois rien sans la cocher, et tu te désinscris quand tu veux. »
- **Animations** : aide « Encore 2 caractères » en fondu 220 ms sous le champ ; bouton qui s'active en fondu croisé 220 ms.

#### Mot de passe oublié — `app/mot-de-passe.tsx`
- **Problème critique** : **faux succès hors réseau** — l'erreur de transport est avalée (`:44-54`), l'écran affirme « le lien y est déjà ». Une panne réseau ne révèle rien sur l'existence d'un compte : il faut la dire. *Élevée.*
- Autres : pas d'état « Envoi… », renvois multiples possibles, accusé sous le pli et sous le clavier, « vient de Firebase » (jargon), pas de sortie « Revenir à la connexion ».
- **Microcopy** : « C'est parti » → « **Lien envoyé.** » ; « …vient de Firebase… » → « Il arrive d'une adresse *noreply*. Regarde aussi dans Spam et Promotions. »
- **Animations** : accusé `rv` 380 ms, coche `rv-s` délai 70 ms, formulaire à 0,5 d'opacité en 220 ms, haptique succès.

#### Suppression du compte — `app/suppression.tsx`
- **Fonctionne** : conforme 5.1.1(v), ordre de décision, export réel, double confirmation.
- **Problèmes**
  - **Après suppression, arrivée sur « CONTENT DE TE REVOIR. »** (`:75`). *Élevée.* Créer un écran d'adieu.
  - Erreur rouge dès la première lettre tapée (`:153`). *Moyenne.*
  - Liste « ce qui part » générique et nourrie de démonstration (`:7, 39-41`) ; atteignable en anonyme. *Moyenne.*
- **Animations** : quand « SUPPRIMER » correspond, bordure → vert et coche en 220 ms ; bouton activé en fondu croisé 220 ms ; haptique *warning* à l'alerte finale.

#### Profil — `app/(tabs)/profil.tsx`
- **Problèmes**
  - **Réglages de notification non enregistrés** mais annoncés « enregistrés » (`:70, 94-95, 191`). *Élevée.*
  - **Nom du répétiteur** : impossible de taper un espace ou de vider le champ (`setTutorNom` applique `trim()` à chaque frappe). *Élevée.*
  - **« Modifier » à côté du nom mène à `/connexion`** (`:140`). *Élevée.*
  - « Connexion » et « Mot de passe oublié » proposés à une personne connectée. *Moyenne.*
  - Ligne « widget » vers une fonction inexistante. *Élevée.*
  - Interrupteur de 29 pt et ligne non pressable. *Moyenne.*
  - E-mail en monospace (hors règle). *Faible.*
- **Animations** : bascules 220 ms (faites) + haptique sélection ; ligne entière pressable avec enfoncement 120 ms.

### 3.3 Apprentissage

#### Mon espace — `app/(tabs)/espace.tsx`, `ecrans/ChargementEspace.tsx`
- **Fonctionne** : la reprise est le premier objet ; salutation à l'heure du téléphone ; squelette tant que rien n'est tranché ; chiffres inventés retirés.
- **Problèmes**
  - Squelette sur maillage *forme*, écran sur *transforme* : la teinte saute à l'arrivée. *Moyenne.*
  - Squelette à 3 lignes contre 2 réelles ; phrase « Quand le contenu arrive, rien ne saute. » affichée à l'utilisateur. *Moyenne.*
  - Progression affichée deux fois (carte de reprise + case « Ta reprise »). *Moyenne.*
  - « Demande à ton ${tuteur.toLowerCase()} » → « ton awa » ; « Il sait où tu t'es arrêtée » (genre imposé, et faux sans consentement mémoire). *Moyenne.*
  - Quota du répétiteur visible seulement en démo. *Moyenne.*
  - « Bonne nuit » est un adieu, pas un salut. *Faible.*
- **Animations** : passage squelette → contenu en fondu croisé 220 ms (aujourd'hui démontage sec).

#### Catalogue — `app/(tabs)/cours.tsx`
- **Problèmes**
  - « Pourquoi il n'y a que **deux** titres » écrit en dur sous un titre compté (`:209-214`). *Élevée.*
  - « Le widget et la notification, eux, existent » : **faux** (`:114-117`). *Élevée.*
  - « accès à vie », « avant de sortir de l'application » : vocabulaire de vente et d'achat externe (`:134-150`). *Élevée* (revue).
  - Titre « LE CATALOGUE N'EST PAS ARRIVÉ » pendant le chargement. *Moyenne.*
  - Cartes non cliquables (seul un petit bouton l'est) ; loupe et cloche désactivées. *Faible.*
- **Animations** : changement de filtre : cartes sortantes en opacité 220 ms, entrantes en `rv` 380 ms décalées de 70 ms.

#### Fiche formation — `app/formation.tsx`
- **Problèmes**
  - **Le module ouvert pousse `/lecon` sans paramètre** (`:170`) : la leçon affichée est celle de la formation *en reprise*, pas de celle-ci. *Élevée.*
  - « Aperçu · 4 min gratuit » en dur (durée inventée, mot de vente) ; visuel non cliquable. *Élevée.*
  - « L'accès est à vie » ; même phrase répétée 3 fois ; « Cette formation n'est pas chargée » pendant le chargement. *Moyenne.*
- **Animations** : module verrouillé touché → révélation de « S'ouvre avec ton accès » en 220 ms.

#### Leçon — `app/lecon.tsx`, `ecrans/TexteDeLecon.tsx`
- **Fonctionne** : coche optimiste, copie gardée lue en panne avec sa date, poids réel, rendu Markdown/HTML sûr.
- **Problèmes**
  - **Titre sur une seule ligne** : rétrécit à 65 % puis se tronque (`:129`). *Élevée.*
  - **Quiz ou mission « se fait sur le site » sans lien** (`:159-162`). *Élevée.*
  - Panne sans copie : phrase fausse et pas de « Réessayer » (`etat` non transmis, `:119-126`). *Élevée.*
  - Après « J'ai terminé », la ligne du programme garde l'icône *lecture* (l'état « fait » est masqué). *Moyenne.*
  - Précédente/Suivante ne remontent pas en haut ; pourcentage tiré d'une autre formation ; onglet « Mes notes » qui navigue. *Moyenne.*
- **Animations** : pastille « fait » 220 ms (existe) visible dans le programme ; « Suivante » mise en avant en `rv-s` 380 ms après la coche ; haptique succès.

#### Notes — `app/notes.tsx`
- **Problèmes**
  - **Onglets mensongers** « Vidéo / Transcription / Mes notes / Ressources » qui font tous `router.back()` (`:125-131`). *Élevée.*
  - Le bouton flottant ouvre la saisie **en haut** de la liste, hors champ si on a défilé, sans mise au point ; latence ressentie ~730 ms (décalage de cascade). *Élevée.*
  - Chevrons sans action ; compteur figé ; « 1 notes ». *Moyenne.*
- **Animations** : saisie en feuille du bas (300 ms) ou en `rv` sans délai ; nouvelle note en `rv` 380 ms.

#### Répétiteur IA — `app/(tabs)/repetiteur.tsx`, `ds/ChatBubble.tsx`, `ds/QuotaMeter.tsx`
- **Fonctionne** : quota épinglé hors défilement ; question affichée avant la réponse ; question remise dans le champ en cas d'échec ; quota tenu par le serveur.
- **Problèmes**
  - **Réponses en Markdown brut avec prix et « pour l'achat »** : le prompt serveur impose des liens `[Titre](/formations/slug)` et suggère « la formation payante … (X FCFA) … pour l'achat » (`worker/apps/api/src/handlers/rysmo.ts:101-131`) ; la bulle affiche le texte brut. *Critique* (3.1.1, confiance, lisibilité).
  - **Aucun indicateur de génération** pendant jusqu'à 20 s ; `ChatBubble typing` existe mais n'est jamais rendu. *Élevée.*
  - **« Plus de question aujourd'hui » s'affiche à chaque envoi** (`bloque` inclut `enVol`, `:83, :201`). *Élevée.*
  - Pas de défilement automatique vers la réponse. *Élevée.*
  - État vide présenté comme « l'application ne l'interroge pas encore ». *Élevée.*
  - Quota épuisé sans heure de reprise (cas fréquent : 2 questions/jour en gratuit). *Élevée.*
  - `QuotaMeter` déborde au-delà de ~18 segments (abonnés à 20 ou 100/jour). *Élevée.*
  - Aucune annonce de la réponse aux lecteurs d'écran ; locuteur non dit. *Élevée.*
  - Réponses non copiables. *Moyenne.*
- **Recommandations** : voir §6.4 (indicateur de génération) et le backlog `IA-*`.

#### Mémoire du répétiteur — `app/memoire.tsx`
- **Problèmes** : nom du tuteur non persisté (perdu au redémarrage) ; poubelles par fait **désactivées mais rouges** ; liste vide muette ; aucun réglage de consentement alors que la mémoire est *opt-in* côté serveur. *Élevée / Moyenne.*

#### Certificats et certificat — `app/certificats.tsx`, `app/certificat.tsx`
- **Problèmes**
  - « Aucun certificat pour l'instant » pendant le chargement et la panne. *Élevée.*
  - **La célébration (« C'EST FAIT » + brillance) se rejoue à chaque session** pour un vieux certificat (mémoire non persistée), alors que le kit la veut non rejouable. *Moyenne.*
  - Deux « Partager » qui ne font pas la même chose ; provenance de démonstration sur des données réelles. *Moyenne.*
  - Brillance : traverse en 2 400 ms au lieu de 1 320 ms + pause de 1 080 ms (kit). *Faible.*

#### Vérifier un certificat — `app/verifier.tsx`
- **Fonctionne** : trois réponses distinctes, lien profond qui vérifie immédiatement.
- **Problèmes** : champ sans capitales forcées ni validation au clavier ; « Ce n'est PAS une réponse » en capitales criardes. *Moyenne / Faible.*

#### Téléchargements et Hors connexion — `app/telechargements.tsx`, `app/hors-connexion.tsx`
- **Fonctionne** : poids réel, plafond expliqué, Wi-Fi seul par défaut, file d'envoi listée, refus serveur montrés.
- **Problèmes** : pas d'état de chargement (« Rien de gardé » clignote) ; poubelle sans annulation ; l'état réseau *indéterminé* s'affiche « Le réseau est là » ; bandeau qui apparaît sec et non annoncé ; phrase « Ce que l'app sait, et que le site ignorait ». *Moyenne.*
- **Animation de référence (WhatsApp)** : chaque geste en file porte une **horloge** qui devient **coche** à l'envoi (fondu croisé 220 ms), puis la ligne s'efface (opacité 220 ms).

#### Média, Épisode, Vidéo — `app/media.tsx`, `app/episode.tsx`, `app/video.tsx`
- **Problèmes**
  - **Fonctions annoncées inexistantes** : tag « Continue écran verrouillé », encart et bouton « Voir l'écran verrouillé » (`media.tsx:88, 127-138`). *Critique.*
  - **« Regarder » pousse `/video` sans paramètre** : cul-de-sac (`media.tsx:120`). *Critique.*
  - Faux lecteur en état « pause » sur l'épisode, « Épisode 1 » en dur, trois contrôles morts. *Élevée.*
  - Jargon de développeur visible sur la vidéo (« src/types/index.ts », « aucune URL transmise ») ; sélecteur qui ressemble à un choix de **paiement**. *Élevée.*

### 3.4 Club des Digitos

#### Hub Club — `app/(tabs)/club.tsx`
- **Fonctionne** : aucun prix, « Comptes bloqués » trouvable (exigence 1.2).
- **Problèmes** : « Le Club est réservé aux membres » affiché **aussi pendant le chargement et en panne** (un membre hors ligne lit qu'il n'est pas membre) ; « Huit onglets » au-dessus de 9 lignes ; verbe « payer » resté (`:117`). *Élevée / Faible.*

#### Bande des 8 onglets et coquille — `app/club/_layout.tsx`, `ds/ChipRow.tsx`
- **Problèmes**
  - **L'onglet actif est hors champ** dès le 5ᵉ sur 360 dp (calcul : 4 premières pilules ≈ 341 dp pour 324 dp utiles), pas de `scrollTo`. *Élevée.*
  - Bande rognée à la gouttière (le kit la fait déborder jusqu'au bord) ; pas de cadenas en mode verrouillé. *Moyenne.*
  - Changement d'onglet en **glissé latéral** au lieu du fondu 180 ms. *Moyenne.*
  - Barre d'onglets principale **absente** dans `/club/*` (le kit la montre). *Moyenne.*
  - Bordure des pilules inactives invisible en clair (`rgba(255,255,255,.6)` sur blanc ≈ 1:1). *Moyenne.*
  - **Le lecteur d'écran lit chaque libellé deux fois** (deux couches de texte introduites par le lot du 05/10). *Moyenne.*
  - Le corps verrouillé **promet** un digest, un annuaire, une « seconde vue » du classement et un compteur de partages **qui n'existent pas** côté membre (`contenu/verrous.ts`). *Élevée.*

#### Fil — `app/club/fil.tsx`
- **Problèmes** : budget de mission `?? 0` → « 0 F » inventé (`:204`) ; date « jeudi 10 septembre · 20:00 » **en dur et passée** (`:224`) ; pas de file hors ligne pour publier ; catégorie imposée « Entraide » à l'insu ; cœur violet non interactif ; publication en petit bouton au lieu du FAB du kit ; seconde rangée de puces qui double la bande. *Élevée / Moyenne.*
- **Recommandation phare** : publier dans une **feuille du bas** (300 ms, voile 0→30 %), avec les 4 catégories, ouverte par le FAB (Android) ou l'action haute (iOS) ; le message apparu en tête **est** la confirmation.

#### Discussions — `app/club/discussions.tsx`
- **Critique** : « **0 discussion** » en monospace et « Le filtre marche… pas une panne » affichés **pendant le chargement et en panne** (`:30-54`). L'écran affirme qu'il n'y a pas de panne quand il y en a une.
- Aussi : impossible de poser une question (alors que c'est la promesse de l'onglet) ; auteur non touchable (pas de signalement depuis Discussions, exigence 1.2) ; filtres ≠ catégories d'écriture. *Élevée.*

#### Membres, Membre, Classement, Opportunités, Infos, Parrainage, Bloqués, Agenda
| Écran | Problème principal | Gravité |
|---|---|---|
| Membre `club/membre.tsx` | Le signalement promet « Je te demanderai le motif ensuite » et ne le demande jamais (`:71`) ; chargement présenté comme « non interrogé » ; après blocage, le fil d'origine reste dans la pile avec la personne bloquée visible | Élevée |
| Agenda `club/agenda.tsx` | Le sélecteur « À venir / Mes inscriptions » **ne filtre rien** (`vue` jamais lue) ; le bouton lit l'état serveur au lieu de l'état optimiste ; ni vide, ni chargement, ni panne ; e-mail promis pour un atelier en présentiel | Élevée |
| Classement `club/classement.tsx` | `+{semaine}` hors `Num` (« +null » possible) ; chargement présenté comme « non calculé » | Élevée |
| Opportunités `club/opportunites.tsx` | **Filtre « Recrutement » sans branche → toujours vide**, avec « Le filtre marche » ; « Postuler » désactivé sans explication ; vide pendant le chargement | Élevée |
| Infos `club/infos.tsx` | **« Voir ce que le Club coûte » mène à un écran sans prix** ; le digest promis n'existe pas | Élevée |
| Parrainage `club/parrainage.tsx` | **Pas de bouton « Copier »** (`expo-clipboard` absent) ; message partagé pauvre et lien doublé sur iOS ; vocabulaire de remise à valider avec la règle magasin | Élevée |
| Bloqués `club/bloques.tsx` | La personne débloquée **reste dans la liste** (pas de relecture après écriture) | Élevée |

### 3.5 Écrans système et satellites

| Écran | Problème principal | Gravité | Recommandation |
|---|---|---|---|
| Retour de paiement `acces.tsx` | **Démarrage à froid** : l'appel part avant la restauration de session → « session expirée » au moment du retour de paiement ; une seule erreur arrête la relecture, sans « Réessayer » | Élevée | Attendre `session.phase !== 'restauration'` ; chemin anonyme « Connecte-toi pour voir ton accès » ; relecture tolérante + bouton |
| Erreur `erreur.tsx` | Motif par défaut inventé (« plus de 30 secondes ») et « 0 Mo » de démonstration ; `/lecon` sans paramètre | Élevée | Motif générique, paramètres obligatoires |
| Widget `widget.tsx` | **Explique comment installer un widget inexistant** ; proposé depuis le profil | Élevée | Retirer du profil, garde atelier |
| Écran verrouillé `verrouille.tsx` | Maquette figée (« 9:41 », « vendredi 4 septembre ») livrée et atteignable | Moyenne | Garde atelier |
| Présence `presence.tsx` | **Questionnaire factice** (« Trois questions », une seule, figée à 2/3, sans effet) ; « Le devis part sur WhatsApp » alors que le bouton ouvre le site | Élevée | Retirer les étapes ou rendre la recommandation dépendante de la réponse |
| Interdit `interdit.tsx` | Jargon (« Un garde de route est du code client ») ; rôle en dur | Moyenne | Copie humaine |
| Légal `legal.tsx` | Deux sorties ; libellé « Profil » faux depuis la connexion ; échec hors réseau muet | Faible | Une sortie, message d'échec |
| Introuvable `+not-found.tsx` | Sortie vers `/` qui rejoue le lancement | Faible | `/espace` |
| Partage `partage.tsx` | Lien doublé sur iOS ; garde dupliquée ; aucun retour après partage | Faible | `url` seul sur iOS ; état « Lien envoyé » en ligne |
| Porte du verrou `_layout.tsx` | Le verrou ne s'applique qu'au démarrage à froid ; aucun voile dans le sélecteur d'applications | Moyenne | Reverrouiller après 5 min en arrière-plan ; voile opaque à `inactive` |

---

## 4. Audit UI mobile détaillé

### 4.1 Couleurs
- **Réussi** : 225 jetons générés depuis le CSS du site, clair et sombre, **0 hexadécimal dans `app/`** ; quatre teintes de marque associées à quatre territoires ; états `ok`/`warn`/`stop` avec variantes nuit ; voiles dérivés par `veil()`.
- **Problèmes (ratios calculés depuis `tokens.generated.ts`)**

| Paire | Ratio | Seuil | Où |
|---|---:|---:|---|
| Blanc sur `mmViolet` nuit (#B98CFF) | **2,54** | 4,5 | bulle « moi » du répétiteur, avatars |
| Pouce blanc sur `mmBleu` nuit (#6FB1FF) | **2,23** | 3 (non-texte) | interrupteur actif en sombre |
| Piste éteinte `fill4` sur fond nuit | **1,67** | 3 | interrupteur éteint en sombre |
| Blanc sur #02AC9C (début du dégradé *digitalise*) | **2,84** | 4,5 | boutons « digitalise » |
| `ok` #0F7B52 sur son voile, 11 pt | **4,42** | 4,5 | `Tag tone="ok"` |
| Bordure de pilule inactive (clair) | **≈ 1** | 3 | `ChipRow` |
| `textFaint` sur maillage, centre de lobe | **2,4–2,7** (pire cas, à mesurer) | 4,5 | 31 textes |

- **Recommandations** : encre fixe sombre sur `mmViolet` nuit (ou violet saturé fixe) ; recaler le dégradé *digitalise* pour que le blanc atteigne 4,5:1 ; bordure inactive `borderHair` ; **interdire `textFaint` pour du texte** (règle AD-18 déjà écrite, à faire respecter par une garde) ; lobes du maillage sombre en teintes fixes du kit plutôt qu'en pastels nuit.

### 4.2 Typographie
- **Réussi** : trois familles au rôle clair (Fraunces 900 pour l'affichage, Schibsted Grotesk pour le texte, JetBrains Mono pour les nombres) ; titres écrits ligne par ligne en français ; `allowFontScaling` actif.
- **Problèmes**
  - **Sur iOS, Schibsted 500/600/700 retombent au 400** (alias de famille, compromis documenté dans `ds/Fontes.ts:83-86`). Boutons, titres de barre et de ligne paraissent maigres sur iPhone. *Élevée.*
  - **301 tailles écrites en dur** (23 valeurs distinctes) contre 4 lectures de jeton ; 200 surcharges de `<Body>` ; 48 tailles numériques de `Display` (dont 19 et 20, sous le minimum de 22). **74 textes sous 12 pt** (sourcils 10,5, méta 11, tags 11, onglets 11, 9,5 et 10 ponctuels).
  - `Display` applique son `style` (donc `marginTop`) à **chaque ligne** : interligne irrégulier (`ds/Type.tsx`). *Moyenne.*
  - Monospace utilisé hors de sa règle (méta de `LessonRow`, e-mail, URL, « 403 »).
  - Libellés d'onglets en police **système** (11 pt, sans `fontFamily`).
- **Recommandation** : échelle de 13 rôles (voir le fichier design system) portée par une primitive `<Texte variant>` ; plancher 11,5 pt pour le mono capitales, 12 pt pour le reste ; familles par graisse sur iOS.

### 4.3 Layouts
- **Réussi** : gouttière de 18 dp, colonne unique, zones sûres gérées dans `Screen`, `Fab`, onglets.
- **Problèmes** : rembourrage bas compté deux fois sous la barre d'onglets (~104–138 dp de vide) ; `tabbar` passé à des écrans de pile (80 dp morts, FAB décalé) ; carte « Bilan » de ~250 dp en tête du Fil et d'Opportunités (premier message vers y≈480 sur 640 dp) ; aucune largeur maximale (tablettes Android étirées).

### 4.4 Espacements
- 743 marges/rembourrages écrits en dur, 26 valeurs (dont 7, 9, 11, 13, 15, 17, 19) ; `gap` en 14 valeurs ; 2 appels seulement à `useSpace`.
- **Recommandation** : échelle 4/8 (`2·4·8·12·16·24·32·40·48`) + sémantique (`inline` 8, `group` 12, `block` 16, `section` 24) portée par `<Pile>`, `<Rangee>`, `<Section>`.

### 4.5 Boutons
- **Réussi** : 8 tons, enfoncement 120 ms (lot du 05/10), ondulation Android à la couleur de l'encre, désactivé sans enfoncement.
- **Problèmes** : `sm` à 42 pt ; aucun ton *danger* (le bouton de suppression est en encre) ; aucune prop d'état confirmé (« Copié », « Place réservée ») ; libellé jamais réduit (coupé à 320 dp).

### 4.6 Cartes et surfaces
- **Réussi** : `Surface` à niveaux (`hero`, `flat`, `night`, `truth`, `ink`), `TerritoryCard` empilées.
- **Problèmes** : rgba écrits en dur dans `Surface` qui s'écartent des jetons ; le niveau `chrome` (flou) n'est jamais utilisé ; aucune élévation générée (les jetons d'ombre CSS n'ont pas de convertisseur).

### 4.7 Icônes et images
- **Réussi** : 109 tracés partagés avec le site ; une seule image chargée (sobriété data assumée).
- **Problèmes** : `Icon` retombe en silence sur `check` quand le nom est inconnu ; pas d'icônes « pleines » pour l'état actif des onglets ; pas d'`expo-image` pour le jour où les vignettes arrivent.

### 4.8 Navigation (UI)
- Barre haute 44 pt (iOS) / 64 dp (Android) conforme ; libellé de retour iOS qui dit *où* l'on revient — mais plusieurs libellés **faux** (« Cours » depuis l'Espace, « Profil » depuis la connexion).
- Onglet actif : `ink` vs `ink3`, deux neutres — le territoire n'est pas porté.

### 4.9 Formulaires
- `Field` : 54 pt de haut, erreur en fondu 220 ms (lot du 05/10). Manquent `ref`, `autoComplete`, `returnKeyType`, `onSubmitEditing`, `autoCorrect`, `autoFocus`, `textContentType` étendu, `autoCapitalize="characters"`, état de focus visible, erreur annoncée.

### 4.10 États interactifs
- Pressé : 120 ms. Désactivé : opacité 0,4. Sélectionné : 220 ms (pilules, interrupteur). **Manquent** : focus visible, confirmé (1,4 s), en cours (« Envoi… » systématique), erreur sur place.

### 4.11 Cohérence visuelle
- **Forte** sur la couleur, le maillage, les titres. **Faible** sur la densité (tailles et marges libres), les rayons (21 valeurs) et le registre des retours (modales système au milieu d'une UI de marque).

---

## 5. Audit UX mobile détaillé

### 5.1 Navigation
- 5 onglets (Espace, Cours, Répétiteur, Club, Profil) : profondeur raisonnable, libellés clairs.
- **Culs-de-sac** : Média → Vidéo sans paramètre ; fiche formation → leçon d'une autre formation ; quiz → « sur le site » sans lien ; erreur → `/lecon` sans paramètre.
- **Club** : barre d'onglets absente dans les 9 écrans ; changement d'onglet en glissé au lieu du fondu ; seconde rangée de puces qui *empile* là où la bande *remplace* ; onglet actif hors champ.
- **Retour Android** : quitte l'application pendant l'accueil ; ramène un fil périmé après un blocage.

### 5.2 Parcours clés

| Parcours | Étapes | Frictions principales | Moments de plaisir | Note |
|---|---:|---|---|---:|
| Découverte → accueil | 5 écrans | promesse audio fausse ; permissions et biométrie hors contexte | maillage, typographie | 4/10 |
| Inscription | 1 écran | bouton désactivé sans raison ; clavier ; erreurs mal placées | — | 5/10 |
| Connexion | 1 écran + Google (Android) | clavier ; inscription enterrée ; pas d'aide après échec | Google en un geste | 6/10 |
| Premier usage (Espace) | — | squelette qui change de teinte ; progression en double | reprise en tête | 6/10 |
| Apprendre (leçon) | 2–3 écrans | titre tronqué ; quiz sans lien ; pas de suite proposée | coche optimiste, hors-ligne | 6/10 |
| Poser une question à l'IA | 1 écran | 20 s sans signe de vie ; « Plus de question » ; Markdown brut ; prix | — | 3/10 |
| Club (membre) | 2+ écrans | états confondus ; filtres morts ; pas de copie du code | publication en tête du fil | 4/10 |
| Retour de paiement | 1 écran | démarrage à froid → « session expirée » | anneaux, « C'est à toi » | 5/10 |
| Mot de passe oublié | 1 écran | faux succès hors réseau | — | 4/10 |
| Suppression | 1 écran | atterrissage sur « Content de te revoir » | — | 5/10 |
| Déconnexion | Profil | confirmation correcte | — | 7/10 |

### 5.3 Frictions transverses
1. **Le système ne dit pas ce qu'il fait** : pas d'indicateur de génération, pas d'état « Envoi… » partout, faux succès.
2. **Le système dit ce qu'il ne fait pas** : promesses de fonctions inexistantes.
3. **Les données disparaissent** : cache de 30 s, puis squelette à chaque retour ; pas de rafraîchissement manuel.
4. **Les écritures ne mettent pas l'écran à jour** (bloqués, fil après blocage).

### 5.4 Conversion et engagement
- L'application **ne vend pas** (règle 3.1.1) : la conversion se mesure en **activation** (première leçon terminée, première question à l'IA, première note) et en **rétention** (retour à J+1, J+7).
- **Mécaniques absentes** : aucun rappel (notifications non branchées), aucune gratification à la fin d'une leçon hors du libellé, pas de « suite » proposée, pas de progression hebdomadaire visible.
- **Mécaniques à ne pas ajouter** (kit) : confettis, séries culpabilisantes, compteurs qui défilent.
- **Recommandation** : un **moment de fin de leçon** sobre (coche + barre qui avance de 380 ms + « Leçon suivante » mise en avant + haptique succès), et une **reprise du lendemain** quand les notifications existeront.

### 5.5 Charge cognitive et réassurance
- **Positif** : textes courts, tutoiement chaleureux, encarts « Ce que je ne te promets pas ».
- **Négatif** : des **justifications de conception** affichées à l'utilisateur (« Quand le contenu arrive, rien ne saute », « Ce que l'app sait, et que le site ignorait », « src/types/index.ts », « un tiret n'en est pas une ») ; féminin imposé (« arrêtée », « inscrite », « Toi seule ») pour un public mixte ; jargon (« Firebase », « route », « garde de route »).

### 5.6 Expérience tactile et usage à une main
- Cibles : interrupteur 29 pt, Pipeline ~26, Segmented ~35, pilules 40, `Button sm` 42, auteur du fil 38 → **sous 44 pt**.
- Aucune ligne de réglage pressable en entier (seul l'interrupteur l'est).
- Gestes absents : tirer pour rafraîchir, balayage de l'accueil, appui long pour copier une réponse IA.
- Une main : FAB en bas à droite (Android) bien placé quand il existe ; actions principales souvent en haut d'écran (publier, garder une leçon) : à rapprocher du pouce par des feuilles.

---

## 6. Audit animations et motion design

### 6.1 État actuel (après le lot du 05/10/2026)

| Élément | Kit | Implémenté | Conformité |
|---|---|---|---|
| Enfoncement | 120 ms, .975 / .94 | `Pressoir` | ✅ |
| Entrée en cascade | 380 ms, +16 px, 70 ms | `Revele` dans `Screen` | ✅ (sans `rv-s` pour les héros) |
| Titre sous masque | 700 ms, 90 ms/ligne | `LigneDeTitre` | ✅ |
| Barre de progression | 700 ms puis 380 ms | `translateX` | ✅ |
| Interrupteur, pilules, erreur | 220 ms | `useBascule` | ✅ (pilule : fondu, pas de glissé) |
| Dérive du maillage | 25–38 s, figée si réduit/modeste | 3 lobes natifs | ✅ (modeste = RAM ≤ 2 Go seulement) |
| Onglets | fondu 180 ms | `animation: 'fade'` | ✅ |
| Moment nº1 | anneaux 2,6 s, décalage 1,3 s | `Anneaux` sur `/acces` | ✅ |
| Moment nº2 | brillance 2 passages | certificat | ⚠️ rythme et rejeu |

### 6.2 Défauts du lot du 05/10 (à corriger)
1. **Préférence « réduire les animations » lue trop tard** : la lecture part au premier `useMouvement()`, donc le premier écran joue sa cascade même si le réglage est actif. → brancher au chargement du module.
2. **Pilules lues deux fois** par les lecteurs d'écran (deux couches de texte) → masquer la couche décorative (`importantForAccessibility="no-hide-descendants"`, `accessibilityElementsHidden`).
3. Les transitions de pile ignorent « réduire » → `animation: reduit ? 'none' : …`.
4. Commentaires périmés (`Mesh.tsx`, `ProgressBar.tsx`, `_layout.tsx`) qui affirment l'inverse du code.

### 6.3 Ce que le kit prévoit et qui manque

| Transition / micro-interaction | Kit | Intention | Effort |
|---|---|---|---|
| Entrer dans un détail | 260 ms ; la liste recule de 22 % à 0,5 ; le maillage reste | dire « j'entre » | M |
| Changer de territoire | 500 ms, fondu croisé des maillages | dire « je change d'univers » | M |
| Ouvrir une feuille | 300 ms, `translateY 100%→0`, voile 0→30 %, poignée | dire « je recouvre, je ne quitte pas » | M |
| Pilule de filtre | glisse 220 ms ; la liste fond en 180 ms | dire « même liste, filtrée » | S |
| Segmented | pastille en `translateX` 220 ms | idem | S |
| Copier | « Copié » 220 ms, retour à 1,4 s, **pas de toast** | confirmer là où est le doigt | S |
| Quota du répétiteur | segment réservé à l'envoi, allumé à la réponse, 220 ms | « c'est le geste qui consomme » | S |
| Indicateur de frappe | `blink` 1 250 ms, décalage 180 ms | « ça vit, ça répond » | S |
| Icône active d'onglet | couleur du territoire en 220 ms | dire où l'on est | S |
| Squelette | pulsation partagée (natif sans miroitement coûteux) | dire « ça charge », pas « c'est vide » | S |
| Série | une pulsation 220 ms, sans confettis | gratifier sans culpabiliser | S |

### 6.4 Indicateur de génération du répétiteur et icône « onde »

**Constat.** Rien ne bouge pendant jusqu'à 20 s. C'est le principal trou de sensation premium du produit.

**Avis sur l'icône « style vague ».** L'idée est bonne **si elle reste un indicateur d'état**, pas une icône d'identité animée en permanence :
- une onde animée en permanence serait une **troisième boucle** sans attente derrière, contraire à la grammaire du kit ;
- une onde **bleue** évoque **Wave**, le portefeuille mobile dominant à Dakar, et donc un paiement ;
- l'application utilise déjà une onde de 16 barres (`MediaCard`) pour dire « ça s'écoute » : une onde dense sur l'IA promettrait de la voix.

**Recommandation retenue — « l'onde de réflexion »** (spécification complète dans [`MOTION_DESIGN_RECOMMANDATIONS.md`](MOTION_DESIGN_RECOMMANDATIONS.md#onde)) :
1. **Dans le fil**, une bulle du tuteur portant **3 barres violettes** (3 × 12 px, rayon 1,5, écart 2,5) qui ondulent en `scaleY 0,4 ↔ 1`, période **1 250 ms**, déphasage **180 ms** — le rythme du `blink` du kit, en barres plutôt qu'en points pour donner l'identité « onde ». Apparition seulement si l'attente dépasse 220 ms ; entrée `rv` 380 ms ; sortie en fondu 220 ms quand la réponse entre.
2. **Dans l'en-tête**, le même glyphe **au repos, statique** (pose 0,5 / 1 / 0,67) à gauche du nom du tuteur — il devient la signature visuelle du répétiteur ; il ne s'anime **que** si la bulle de génération est hors champ (fil remonté), avec le sous-titre « écrit… ».
3. **Dans la barre d'onglets** : jamais animé (garder `chat`) ; au plus un point statique si une réponse arrive pendant qu'un autre onglet est ouvert.
4. **Réduire les animations** : barres figées en pose active + texte « {tuteur} écrit… ». Lecteurs d'écran : « {tuteur} écrit une réponse », région vivante polie.
5. **Un seul `Animated.Value` sur le pilote natif** pour les trois barres (coût négligeable même sur appareil modeste) ; la boucle ne survit jamais à la requête (arrêt à 20 s).

### 6.5 Animations à supprimer ou à ne pas créer
- Aucune animation existante n'est nuisible. **À ne pas créer** : toasts flottants, confettis de fin de formation, secousse sur erreur, compteur qui défile, pulsation de la cloche de notification, onde animée permanente.

### 6.6 Impact attendu
Le passage de modales système à des confirmations sur place, l'arrivée des feuilles du bas, de l'haptique et de l'indicateur de génération déplacent la perception de « site web dans une app » vers « app native soignée » — c'est le levier le plus rentable de la note *plaisir d'utilisation* (48 → 75 visé).

---

## 7. Audit onboarding

### 7.1 Parcours actuel
`Lancement → Accueil (3 pas) → Notifications (pré-permission sans effet) → Biométrie (avant connexion) → Espace (anonyme)` : **5 écrans avant toute valeur**, puis un Espace vide pour un visiteur sans compte.

### 7.2 Frictions
1. Promesse audio fausse (pas 3).
2. Notifications demandées sans canal d'envoi.
3. Biométrie proposée à quelqu'un qui n'a pas de compte (« parce que tu viens de te connecter »).
4. Aucune transition entre les pas ; même illustration ; retour Android qui quitte.
5. Aucun aperçu de contenu avant l'inscription.

### 7.3 Parcours recommandé (3 écrans jusqu'à la valeur)
1. **Lancement** (≤ 600 ms, entrée du mot-symbole).
2. **Accueil en 3 pas** avec un glyphe par pas et des gains *réels* : « Apprends hors réseau aussi » · « Un répétiteur qui part de ton cours » · « Un certificat vérifiable sans compte ». Balayage + bouton ; « Passer » toujours visible.
3. **Choix** : « Créer mon compte » / « J'ai déjà un compte » / « Regarder d'abord » (→ catalogue et module d'ouverture sans compte).
4. **Après la première connexion** : proposition de biométrie (une fois).
5. **Après la première leçon terminée** : proposition de rappel (quand `expo-notifications` existera).

### 7.4 Animations utiles
Glyphe `rv-s` 380 ms ; titre sous masque 700 ms ; chapô `rv` délai 140 ms ; sortie du pas 120 ms ; puce active en `scaleX` 220 ms ; haptique de sélection à chaque pas (Android).

---

## 8. Audit responsive mobile

> Calculé depuis le code (largeurs de contenu = largeur − 2 × 18 dp). À confirmer sur appareils.

| Format | État | Problèmes |
|---|---|---|
| **320 dp** (iPhone SE 1, petits Android) | ⚠️ | Titre de barre iOS ~100 pt ; Segmented à 3 options sur 2 lignes ; libellés de bouton coupés (« Réessayer avec Empreinte digitale ») ; deux `StatTile` de 137 dp pour des nombres de 25–27 pt |
| **360 dp** (Android d'entrée de gamme, cible principale) | ⚠️ | Segmented casse ; **onglet actif du Club hors champ** dès le 5ᵉ ; titres d'affichage réduits jusqu'à 65 % |
| **375 dp** | ⚠️ | Idem 360 en plus léger |
| **390–412 dp** (gabarits du kit) | ✅ | RAS |
| **430–480 dp** | ✅ | RAS |
| **768 / 1024 dp** (tablettes) | ❌ Android / — iOS | iOS : `supportsTablet: false` (mode compatibilité) ✅. **Android : aucune restriction**, aucun code ne regarde la largeur ; boutons `md` étirés sur 700+ dp, lignes de 150+ caractères |
| **Portrait** | ✅ | Verrouillé |
| **Paysage** | ❌ | Verrouillé, alors que le kit prévoit un lecteur vidéo plein écran en paysage |
| **Safe areas** | ✅ | `Screen`, `Fab`, onglets, répétiteur |
| **Clavier** | ❌ | `Screen` sans évitement : champs bas masqués sur iOS (connexion, création, suppression, devis) ; bord-à-bord Android SDK 57 à vérifier |
| **Police système 130–200 %** | ❌ | 0 `maxFontSizeMultiplier` ; hauteurs fixes (Tag 27, ChipRow 40, SubNav 42, barre haute) qui rognent |

**Recommandations** : colonne de contenu max 600 dp centrée ; `minHeight` au lieu de `height` sur tout conteneur de texte ; plafonds de police par rôle ; `automaticallyAdjustKeyboardInsets` / `KeyboardAvoidingView` dans `Screen` ; paysage déverrouillé pour le seul lecteur vidéo ; exclure les tablettes Android du Play Store tant qu'elles ne sont pas traitées.

---

## 9. Audit accessibilité

**Score : 38 / 100.**

| # | Problème | Impact | Gravité | WCAG / HIG / Material | Correctif |
|---|---|---|---|---|---|
| A1 | Aucun titre `Display` annoncé comme titre (2 rôles `header` dans tout le produit) ; titres lus ligne par ligne | Navigation par titres impossible | Élevée | WCAG 1.3.1, 2.4.6 · HIG *Accessibility* | `accessibilityRole="header"` + libellé fusionné dans `Display` |
| A2 | 0 région vivante : erreurs, réponses IA, accusés, bandeau hors ligne non annoncés | Lecteur d'écran « aveugle » aux changements | Élevée | WCAG 4.1.3 | `accessibilityLiveRegion="polite"` + `announceForAccessibility` |
| A3 | 74 textes sous 12 pt (jusqu'à 9,5) | Lisibilité, presbytie | Moyenne | HIG : 11 pt min · Material : 12 sp | Plancher 11,5 / 12 |
| A4 | Cibles 26–42 pt | Erreurs de toucher | Moyenne | WCAG 2.5.8 (24 px AA), HIG 44 pt, Material 48 dp | `minHeight` 44 / `hitSlop` |
| A5 | Contrastes sombres 2,2–2,8 ; bordure de pilule ≈ 1:1 | Illisible pour basse vision | Élevée | WCAG 1.4.3, 1.4.11 | voir §4.1 |
| A6 | État des lignes de leçon (fait / en cours / à faire) non exposé | L'utilisateur ne sait pas où il en est | Moyenne | WCAG 4.1.2 | `accessibilityState` / libellé |
| A7 | Pilules lues deux fois ; radios en `selected` au lieu de `checked` ; `tab` sans `tablist` | Annonces confuses | Moyenne | WCAG 4.1.2 | rôles et états corrects |
| A8 | Squelettes annoncés comme N barres de progression | Bruit | Faible | — | une annonce par groupe |
| A9 | 0 `maxFontSizeMultiplier`, hauteurs fixes | Textes rognés à 200 % | Moyenne | WCAG 1.4.4 · Dynamic Type | plafonds par rôle |
| A10 | Bulles IA sans locuteur ; avatars qui lisent les initiales | Confusion | Moyenne | WCAG 1.1.1 | « {tuteur} : » / « Toi : » ; avatar décoratif |
| A11 | « Réduire les animations » lu après le premier écran ; transitions de pile non coupées | Gêne vestibulaire | Moyenne | WCAG 2.3.3 · HIG *Motion* | lecture au chargement ; `animation: 'none'` |
| A12 | « Réduire la transparence » (iOS) jamais lu | Lisibilité sur verre | Faible | HIG | surfaces denses |

**Correctifs prioritaires** : A1, A2, A5, A4, A11.

---

## 10. Benchmark et inspirations

> Fondé sur la connaissance de produits de référence (pas de recherche web le jour de l'audit).

| Référence | Ce qu'elle fait mieux | Ce qu'on adapte | À éviter |
|---|---|---|---|
| **Duolingo** | Valeur avant compte (on fait une leçon puis on s'inscrit) ; retours haptiques et sonores à chaque réponse ; fin de leçon gratifiante | « Regarder d'abord » sans compte ; moment de fin de leçon sobre (coche + barre + suite) | La surenchère de célébrations et les séries culpabilisantes (le kit les interdit, à raison) |
| **WhatsApp** | File d'envoi hors ligne lisible : **horloge → une coche → deux coches** | Marqueur d'état par geste en file dans Notes, Club et Hors connexion | — |
| **Wave (Sénégal)** | Confiance par la sobriété ; fonctionne sur téléphones modestes ; chiffres énormes et clairs | Typographie numérique franche, zéro décor pendant une action d'argent | Ne pas reprendre son **bleu** ni l'onde pour l'IA (confusion de marque) |
| **ChatGPT / Claude (apps)** | Indicateur de génération, rendu Markdown, copie en un geste, suggestions de départ | Bulle de réflexion, réponses mises en forme, appui long « Copier », 3 suggestions au premier usage | Le streaming mot à mot n'est pas requis : un indicateur + une entrée `rv` suffisent |
| **Headspace** | Motion calme, courbes douces, transitions lentes mais jamais bloquantes | Tenir le *scene* 700 ms aux seuls titres et barres | Les illustrations animées en boucle (coût, distraction) |
| **Coursera / Khan Academy** | Téléchargement de leçons, réglage Wi-Fi seul, reprise exacte | Reprise au paragraphe ; leçon suivante proposée | Les listes de cours denses sans hiérarchie |
| **Spotify** | Feuilles du bas pour toutes les actions secondaires ; état « téléchargé » visible partout | Feuilles pour publier, signaler, filtrer, ajouter à l'agenda | — |
| **Material 3 / iOS natifs** | Indicateur actif de navigation (pilule M3), feuilles natives (`formSheet`), haptique de sélection | Pilule active Android ; `presentation: 'formSheet'` d'expo-router | Copier un châssis au détriment de la marque (le kit l'interdit) |

**Recommandation stratégique** : se positionner comme **« l'app de formation qui ne te ment pas et marche sans réseau »**. Le benchmark montre que les deux attributs (honnêteté perçue, hors-ligne lisible) sont sous-exploités par les références ; ce sont les deux qui comptent le plus sur le marché visé (forfaits comptés, méfiance envers les promesses commerciales).

---

## 11. Recommandations design system mobile

Synthèse — le détail (jetons, API des composants, règles) est dans [`DESIGN_SYSTEM_MOBILE_RECOMMANDATIONS.md`](DESIGN_SYSTEM_MOBILE_RECOMMANDATIONS.md).

- **Palette** : conserver les jetons générés ; ajouter une famille de teintes **fixes** pour le maillage sombre et une encre fixe pour les fonds `mmViolet` nuit ; ton `danger` pour les boutons destructifs.
- **Typographie** : 13 rôles (`display-xl` → `eyebrow`) portés par `<Texte variant>` ; plancher 11,5 / 12 pt ; familles par graisse sur iOS ; plafonds de police système par rôle.
- **Grille** : gouttière 18 dp (exception de marque) ; colonne max 600 dp ; échelle d'espacement 4/8.
- **Rayons** : 6 · 10 · 16 · 24 · 30 · pill ; règle d'imbrication.
- **Élévations** : `e0`–`e3` générées depuis les jetons `sh*`.
- **Composants à créer** : `Texte`, `Pile/Rangee/Section`, `Feuille`, `Confirmer`, `Bandeau`, `useConfirmation`, `haptique`, `SkeletonGroup`, `Liste` (FlatList + rafraîchir + cascade), `IndicateurDeReflexion`, `Field` v2, `ChipRow`/`Segmented` v2, `Colonne`.
- **À ne pas créer** : `Toast` (interdit par le kit).
- **Motion** : tableau durée/courbe/propriété/usage dans [`MOTION_DESIGN_RECOMMANDATIONS.md`](MOTION_DESIGN_RECOMMANDATIONS.md).
- **Responsive** : `minHeight`, plafonds de police, colonne 600 dp, clavier dans `Screen`.

---

## 12. Roadmap d'amélioration

Le plan daté (30/60/90 jours) est dans [`ROADMAP_UI_UX_MOBILE.md`](ROADMAP_UI_UX_MOBILE.md).

### Priorité 1 — Corrections critiques (avant toute soumission)
1. Retirer les promesses de fonctions inexistantes (accueil pas 3, Média écran verrouillé, widget, notifications « enregistrées », « la notification existe », digest/annuaire/seconde vue/partages des verrous, « Voir ce que le Club coûte », questionnaire factice de Présence).
2. Répétiteur : canal `app` sans prix ni « achat » ; rendu Markdown ; indicateur de génération ; placeholder correct ; défilement vers la réponse.
3. États : distinguer chargement / panne / vide (Discussions, Opportunités, Agenda, Classement, Membre, Certificats, Hub Club, Leçon, Répétiteur, Mémoire, Téléchargements).
4. Culs-de-sac : formation → bonne leçon ; Média → vidéo ; quiz → site ; erreur → leçon ; retour de paiement au démarrage à froid.
5. Faux succès : mot de passe oublié hors réseau ; filtre Recrutement ; Segmented de l'Agenda ; signalement sans motif.

### Priorité 2 — Améliorations importantes
6. Chaîne d'accueil (3 écrans, biométrie après connexion, permissions retirées).
7. Formulaires (`Field` v2, clavier dans `Screen`, création de compte explicative).
8. Accessibilité (titres, régions vivantes, contrastes sombres, cibles, plafonds de police).
9. Retours d'action : `Bandeau` + confirmations sur place à la place de ~22 `Alert` ; ton `danger`.
10. Club : bande (onglet actif visible, débord, cadenas, fondu), barre d'onglets présente, « Copier » le code, relecture après écriture.

### Priorité 3 — Motion et interactivité
11. Feuilles du bas (publier, signaler, agenda, filtres) — 300 ms, voile 30 %.
12. Haptique (sélection, succès, erreur, *warning*).
13. Indicateur de réflexion « onde » du répétiteur.
14. Pilules et Segmented qui glissent ; quota réservé à l'envoi ; « Copié » 1,4 s ; icône d'onglet au territoire.
15. Transitions de détail 260 ms et de territoire 500 ms ; maillage remonté à la racine.

### Priorité 4 — Optimisations avancées
16. Typographie et espacement systématisés (`Texte`, `Pile`), graisses iOS.
17. Cache : afficher le cache pendant la relecture, persistance au démarrage, tirer pour rafraîchir.
18. Listes virtualisées ; `expo-image` ; `expo-linear-gradient`.
19. Appareil modeste élargi (≤ 3 Go ou ≤ 4 cœurs) ; profilage GPU sur TECNO/itel.

### Priorité 5 — Vision long terme
20. Notifications utiles (rappel du soir, réponse du Club) avec permission en contexte.
21. Lecture audio réelle (`expo-audio`) — et alors seulement, l'écoute écran verrouillé.
22. « Se connecter avec Apple » + publication iOS.
23. Widget de reprise (WidgetKit / Glance).
24. Tablettes et paysage pour la vidéo.

---

## 13. Quick wins

Liste complète (36) avec problème, solution, impact et difficulté : [`QUICK_WINS_UI_UX_MOBILE.md`](QUICK_WINS_UI_UX_MOBILE.md). Les 10 premiers :

| # | Problème | Solution | Impact | Difficulté |
|---|---|---|---|---|
| QW1 | Promesse audio de l'accueil | Remplacer le pas 3 par un gain réel | Élevé (revue) | Très faible |
| QW2 | « Plus de question aujourd'hui » à chaque envoi | Séparer `epuise` et `enVol` | Élevé | Très faible |
| QW3 | Filtre Recrutement toujours vide | Ajouter la branche | Moyen | Très faible |
| QW4 | « 0 discussion » avant lecture | `SansDonnees etat` ; `Num` en phase servie | Élevé | Faible |
| QW5 | Formation → mauvaise leçon | Passer `formationId`/`leconId` | Élevé | Très faible |
| QW6 | Média → vidéo cul-de-sac | Passer les paramètres | Élevé | Faible |
| QW7 | Faux succès du mot de passe | Distinguer l'échec réseau | Élevé | Faible |
| QW8 | « Voir ce que le Club coûte » | Supprimer | Moyen (revue) | Très faible |
| QW9 | Ligne et écran widget | Retirer du profil, garde atelier | Élevé (revue) | Très faible |
| QW10 | Défilement vers la réponse IA | `scrollToEnd` | Élevé | Très faible |

---

## 14. Backlog actionnable

Le backlog complet (146 tickets en 15 épopées, avec critères d'acceptation et étiquettes) est dans [`BACKLOG_UI_UX_MOBILE.md`](BACKLOG_UI_UX_MOBILE.md). Extrait des tickets prioritaires :

| ID | Problème | Écran/section | Gravité | Recommandation | Animation/Motion recommandé | Impact | Effort | Priorité |
|----|----------|---------------|---------|----------------|-----------------------------|--------|--------|----------|
| HON-01 | Promesse « écoute écran verrouillé » | Accueil pas 3 | Critique | Gain réel | Glyphe `rv-s` 380 ms | Élevé | S | P1 |
| HON-02 | Fonctions écran verrouillé annoncées | Média | Critique | Retirer tag, encart, bouton | — | Élevé | S | P1 |
| HON-03 | Widget inexistant expliqué | Widget, Profil | Élevée | Retirer, garde atelier | — | Élevé | S | P1 |
| HON-04 | Notifications « enregistrées » | Profil | Élevée | Persister ou corriger | — | Moyen | S | P1 |
| IA-01 | Prix et « achat » dans les réponses | Répétiteur / serveur | Critique | Canal `app` | — | Élevé | M | P1 |
| IA-02 | Markdown brut | Répétiteur | Critique | Rendu `TexteDeLecon` | Bulle `rv` 380 ms | Élevé | S | P1 |
| IA-03 | Aucun indicateur de génération | Répétiteur | Élevée | Onde de réflexion | 3 barres, 1 250 ms, déphasage 180 ms | Élevé | S | P1 |
| IA-04 | Placeholder « Plus de question » à l'envoi | Répétiteur | Élevée | Séparer les états | — | Élevé | S | P1 |
| ETA-01…06 | Chargement = vide = panne | 11 écrans | Élevée | `SansDonnees etat` partout | Fondu squelette → contenu 220 ms | Élevé | M | P1 |
| NAV-01 | Formation → mauvaise leçon | Formation | Élevée | Paramètres de route | — | Élevé | S | P1 |
| NAV-02 | Média → vidéo cul-de-sac | Média | Critique | Paramètres | — | Élevé | S | P1 |
| PAY-01 | Retour de paiement à froid | Accès | Élevée | Attendre la session | Anneaux → coche | Élevé | M | P1 |
| CPT-01 | Faux succès hors réseau | Mot de passe | Élevée | Distinguer l'échec | Accusé `rv` 380 ms | Élevé | S | P1 |
| ONB-01 | 5 écrans avant valeur | Chaîne d'accueil | Élevée | 3 écrans, biométrie après connexion | Puce `scaleX` 220 ms | Élevé | M | P2 |
| A11Y-01 | Titres non annoncés | `Display` | Élevée | `header` + libellé fusionné | — | Moyen | S | P2 |
| FBK-01 | 22 `Alert` de succès/erreur | Global | Élevée | `Bandeau` + confirmations | Fondu 220 ms, retour 1,4 s | Élevé | M | P2 |
| FBK-03 | Aucune feuille du bas | Global | Élevée | `Feuille` 300 ms | `translateY` + voile 30 % | Élevé | M | P3 |
| FBK-04 | Aucune haptique | Global | Moyenne | `expo-haptics` | — | Élevé | S | P3 |

---

## 15. Conclusion

**Ce que l'application doit absolument corriger.** Les promesses non tenues et la vente dans les réponses de l'IA : elles exposent à un rejet en magasin et contredisent la promesse de marque. Puis la confusion des états, qui fait mentir l'interface au pire moment (hors réseau, en panne). Ces deux chantiers représentent **environ deux semaines de travail** et font passer la note globale d'environ 53 à environ 68.

**Ce qu'elle peut devenir.** L'une des rares applications de formation du marché ouest-africain à **paraître aussi soignée qu'une app internationale tout en restant honnête et utilisable sans réseau**. Le socle (identité, jetons, grammaire de mouvement, hors-ligne, éthique de la donnée) est déjà là, ce qui est l'essentiel du coût d'un produit premium.

**Niveau de potentiel** : élevé — **80+ / 100 atteignable en 90 jours** avec la roadmap proposée.

**Actions les plus importantes à lancer** :
1. Sprint « honnêteté » (P1) — retirer, corriger, distinguer.
2. Sprint « répétiteur » — canal sans vente, rendu, onde de réflexion, défilement, quota lisible.
3. Sprint « retours d'action » — `Feuille`, `Bandeau`, confirmations sur place, haptique.
4. Sprint « système » — `Texte`, `Pile`, `Field` v2, accessibilité.

**Comment la rendre plus vivante, plus fluide, plus premium.** Pas en ajoutant de la décoration : en rendant **chaque geste visiblement reçu et chaque résultat visiblement confirmé**, au bon endroit, à la bonne durée. L'enfoncement de 120 ms, la bascule de 220 ms, l'entrée de 380 ms et la mise en place de 700 ms sont désormais en place ; il reste à les appliquer aux moments qui comptent — publier, réserver, copier, terminer une leçon, attendre l'IA — et à remplacer les boîtes système par des réponses qui restent sous le doigt. C'est cette précision silencieuse, plus que tout effet, qui fait la sensation premium.
