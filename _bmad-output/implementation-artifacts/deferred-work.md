# Travail différé

Objectifs séparés de l'intention « terminer le code natif restant » au titre de la règle
de portée du workflow : un objectif livrable par spécification. Le hors-ligne (téléchargements
+ lecture audio en fond) a été retenu en premier parce que c'est lui qui rallume la majorité
des dix-huit contrôles éteints.

- source_spec: none
  summary: Charger les trois fontes de marque (expo-font) au lieu de retomber sur la police système.
  evidence: Livrable indépendamment — aucune donnée, aucun contrôle, aucun écran ne change de comportement. Séparé du hors-ligne, avec lequel il ne partage ni fichier ni dépendance.

- source_spec: none
  summary: Trancher les notifications (expo-notifications) — les demander vraiment, ou retirer l'écran d'amorce.
  evidence: Décision produit avant d'être du code : brancher le paquet impose une permission Android, une icône de notification et une ligne au formulaire de confidentialité des deux magasins. L'écran `permissions.tsx` est déjà rendu honnête ; il n'y a pas d'urgence technique.

- source_spec: none
  summary: Déverrouillage biométrique (expo-local-authentication) sur `biometrie.tsx`.
  evidence: Dépend de la persistance de session, qui existe désormais, mais ne partage rien avec le hors-ligne. L'écran affiche déjà ce qu'il ne fait pas.

- source_spec: none
  summary: Orientation paysage (expo-screen-orientation) et état du réseau (expo-network).
  evidence: Deux paquets, deux écrans (`plein-ecran`, `hors-connexion`), aucun lien avec le stockage local. `hors-connexion` deviendra utile APRÈS le hors-ligne, mais ne le bloque pas.

## Différés une seconde fois, après investigation (2026-09-04)

- source_spec: none
  summary: Orientation paysage (`expo-screen-orientation`) sur `plein-ecran.tsx`.
  evidence: L'écran fait pivoter un LECTEUR QUI NE LIT RIEN — la vidéo de leçon est un `<iframe>` hébergé ailleurs (voir `constat-hors-ligne.md`). Faire tourner un dégradé statique n'est pas une fonction. À reprendre quand le média sera hébergé, pas avant.

- source_spec: none
  summary: Notifications (`expo-notifications`) — demander la permission et envoyer.
  evidence: Le paquet ne fait que la moitié du travail : il demande une autorisation. Ce qui manque est un SERVEUR QUI ENVOIE, et il n'existe pas. Brancher la demande sans l'envoi produirait une permission accordée pour rien — et une ligne au formulaire Data Safety des deux magasins pour une capacité jamais exercée. `permissions.tsx` et `profil.tsx` sont déjà honnêtes sur ce point depuis la correction du 3 septembre.

## ⛔ Décisions HUMAINES ouvertes par la réécriture Kotlin/Swift (2026-09-05)

Elles ne se tranchent pas depuis le code : chacune a une conséquence commerciale, de marque
ou de conformité magasin. Elles sont listées ici pour être VUES, plutôt qu'enfouies dans les
3 500 lignes des trois spécifications.

- source_spec: spec-ecrans-natif.md § F.1
  summary: ⭐ Nommer le magasin. Le kit affiche le nom du magasin, le prix et un bouton sortant sur QUATRE écrans ; le port React Native l'interdisait par test.
  evidence: Les deux positions sont défendables et incompatibles. Le kit dit l'intention de vente ; le test dit la conformité (App Store 3.1.1, achat de contenu numérique hors application). Le tunnel de paiement a DÉJÀ été supprimé quand l'application a cessé de vendre — c'est le précédent, et c'est la position retenue par défaut. ⚠️ Conséquence assumée : `/formation` et `/club` perdent leur bloc central sans remplacement dessiné. Reprendre cette décision suppose de redessiner ces deux écrans.

- source_spec: spec-ecrans-natif.md § C.4 règle 7
  summary: Le lien profond `/verifier` n'a AUCUN écran dans le kit.
  evidence: Le manifeste et `assetlinks.json` déclarent quatre préfixes ; le kit ne dessine pas d'écran de vérification de certificat. Deux issues : dessiner l'écran, ou retirer le préfixe des DEUX manifestes — ils doivent rester identiques. Position retenue par défaut : DESSINER l'écran, parce que la vérification de certificat est une fonction réelle (le chemin serveur a été réparé le 05/09) et qu'un lien déclaré sans destination s'ouvre en silence dans le navigateur. La destination existe déjà : `navigation/Destinations.kt` → `Verification(code)`.
  ⛔ MESURÉ LE 05/09 — IL MANQUE AUSSI LE SERVEUR. Le web lit `certificate_lookups` DIRECTEMENT dans Firestore (`src/lib/firestore/certificates.ts:38`) ; l'application native n'a pas de SDK Firebase (AD-10) et ne parle qu'au Worker. Or aucun handler ne sert la vérification, et les 19 vues du contrat exigent TOUTES une session (`session: obligatoire | obligatoire+club | obligatoire+role`) — alors qu'un certificat se vérifie par quelqu'un qui n'a pas de compte, c'est tout son objet. Il faut donc : un niveau `aucune` au vocabulaire de `vues.contrat.json`, un handler public lisant le miroir `certificate_lookups`, et son inscription dans les DEUX listes `MIGRATED`. Lot 4.

- source_spec: spec-ecrans-natif.md § C.5, § F.4
  summary: Le plein écran du lecteur est en paysage, l'activité est verrouillée en portrait.
  evidence: `requestedOrientation` au moment de l'exécution prime sur le manifeste — la contradiction se résout en code, pas en décision. Notée ici pour qu'on ne la « corrige » pas en déverrouillant l'activité entière, ce qui ferait pivoter TOUS les écrans, qui ne sont dessinés qu'en portrait.

- source_spec: —
  summary: ⛔ Le keystore Android vit chez EAS, et son empreinte est déjà PUBLIÉE.
  evidence: `public/.well-known/assetlinks.json` publie l'empreinte du keystore EAS (Build Credentials 8UyPdZw7WS). Construire avec un keystore neuf casserait la vérification des App Links en silence et rendrait le paquet impossible à mettre à jour. Il faut soit l'exporter d'EAS, soit continuer de signer via EAS. Aucune des deux voies n'est engagée.

- source_spec: —
  summary: La lecture audio en fond — l'argument MÊME du virage natif — n'a rien à lire.
  evidence: Les médias ne sont pas hébergés : la vidéo de leçon est une intégration tierce, l'audio est sur Spotify. La décision de ré-hébergement (R2) est prise, le contenu n'est pas déposé. `MediaSession` sur un lecteur qui ne lit rien n'est pas une fonction.

## Constats du groupe Club (06/09/2026) — mesurés, pas tous graves

- source_spec: spec-ecrans-natif.md § A.6
  summary: ⛔ Deux des huit onglets du Club n'ont AUCUN producteur côté serveur.
  evidence: `appClubListe` sert `discussions`, `opportunites` et `membre` (UNE fiche) — pas d'annuaire des membres. Et aucune vue ne sert le digest hebdomadaire. Le kit dessine les deux. Les onglets restent en place — l'ordre de la bande est porteur, l'utilisateur l'apprend par la position — et disent ce qui manque. Les brancher demande DEUX vues serveur de plus, pas du travail d'écran.

- source_spec: —
  summary: « Ajouter à mon agenda » est impossible avec le contrat actuel — et c'était la seule action native GAGNÉE par le portage.
  evidence: `Seance.jour` et `Seance.horaire` arrivent déjà mis en forme en français (« Mardi 12 août », « 18 h »), sans horodatage. Aucun `Intent` d'agenda ne se construit d'une chaîne localisée. Il manque un champ ISO à la vue, pas un bouton à l'écran.

- source_spec: spec-ecrans-natif.md § D
  summary: ⚠️ Les blocages sont invisibles sans abonnement actif — moins grave qu'il n'y paraît.
  evidence: `appClubBlocages` et `bloquerMembre` exigent tous deux un abonnement actif. Un membre dont l'abonnement expire ne peut ni voir ni défaire ses blocages. MAIS ils restent STOCKÉS et reviennent au réabonnement, et pendant l'expiration ils n'ont de toute façon aucun effet puisque le Club est inaccessible. Le seul défaut réel est de confusion : l'écran est atteint depuis le PROFIL, hors du Club, et affiche l'écran verrouillé sur les choix de modération de la personne elle-même.

- source_spec: —
  summary: Les deux phrases de canal du digest sont périmées, en sens contraire.
  evidence: L'une annonce des notifications que rien ne pousse (la permission n'est même pas déclarée) ; l'autre ignore que la plateforme a un canal e-mail depuis le 03/09/2026 (`worker/apps/api/src/lib/email.ts`). Non reprises dans l'écran.

- source_spec: —
  summary: ⚠️ La copie du kit porte des relevés qui ne sont mesurés nulle part.
  evidence: « Sept publications et quarante-et-une réponses », « DEUX SESSIONS », « TROIS MISSIONS » sont écrits dans le kit comme du texte. Sortis de la copie et redescendus dans les compteurs (`Num(null)` → « non relevé ») : un nombre sans source est exactement ce que le dispositif de preuves existe pour empêcher.
