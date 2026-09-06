---
releve: '2026-09-06'
methode: >-
  lecture de worker/apps/api/src/handlers/**, android/app/src/main/**, et
  `aapt2 dump permissions` sur le paquet CONSTRUIT (app-debug.apk)

> ⚠️ **LES CHEMINS `mobile/…` DE CE DOCUMENT NE RÉSOLVENT PLUS.** Le port React Native a été
> supprimé le 05/09/2026 ; l'application est réécrite en Kotlin/Compose et Swift/SwiftUI. Ils
> restent lisibles par `git show 9c22076:<chemin>`, et les CONSTATS qu'ils appuient sont
> inchangés : ce document décrit ce que l'application collecte, pas ce qui la construit.
>
> ⛔ **Un point ne survit PAS tel quel : le manifeste de confidentialité iOS.** Il vivait dans
> `mobile/app.json` (`ios.privacyManifests`), que le préconstruit d'Expo transformait en
> `PrivacyInfo.xcprivacy`. Dans un projet Xcode natif, ce fichier doit être écrit et ajouté
> à la cible À LA MAIN. Apple REFUSE la soumission sans lui. Il n'existe pas encore.
---

# Ce que l'application collecte réellement

Ce fichier n'est pas un résumé du formulaire des magasins : c'est **sa dérivation**. Un
formulaire recopié sans sa source se re-remplit de mémoire à chaque version, et dérive.
Chaque ligne ci-dessous nomme le handler qui écrit, et la collection qui reçoit.

`mobile/app.json` → `ios.privacyManifests.NSPrivacyCollectedDataTypes` est le miroir de ce
tableau, et `tests/unit/mobile-confidentialite.test.ts` refuse qu'ils divergent.

## Ce qui est collecté

| Donnée | Où elle va | Qui l'écrit | Type déclaré |
|---|---|---|---|
| E-mail, mot de passe | Firebase Auth | `mobile/donnees/identite.ts` | EmailAddress |
| Nom d'affichage | `users/{uid}.displayName` | `creerMonProfil.ts` | Name |
| Identifiant de compte | partout, par le jeton | Firebase Auth | UserID |
| Progression, leçons cochées | `enrollments.completedLessons`, `progress` | `marquerLecon.ts` | ProductInteraction |
| XP et gamification | `gamification/{uid}` | `marquerLecon.ts` | ProductInteraction |
| Inscriptions aux séances | `club_sessions_attendance` | `reserverSession.ts` | ProductInteraction |
| Notes personnelles | `users/{uid}/notes` | `ecrireUneNote.ts` | OtherUserContent |
| Publications au Club | `club_posts` | `posterAuClub.ts` | OtherUserContent |
| Échanges avec le répétiteur | `rysmoConversations/{uid}`, `rysmoProfiles/{uid}` | `lib/rysmo-context.ts` | OtherUserContent |
| Signalements de profils | `reports/{id}` | `signalerMembre.ts` | CustomerSupport |
| Comptes bloqués | `club_blocks/{uid}` | `bloquerMembre.ts` | OtherUserContent |
| ⛔ **Nom du titulaire d'un certificat** | `certificate_lookups/{code}` — **miroir PUBLIC** | `issueCertificate.ts:111` | Name |

## Ce qui n'est PAS collecté — et c'est aussi une réponse

Mesuré dans `mobile/package.json` : **aucun SDK d'analytique, de crash, de publicité ou
d'attribution**. Ni Sentry, ni Firebase Analytics, ni identifiant publicitaire.

⚠️ **Ce paragraphe décrivait le port React Native, supprimé le 05/09/2026.** Les faits qu'il
énonce restent vrais — ils portent sur ce que l'application COLLECTE, pas sur la technologie qui
la construit — mais les noms de fichiers et de paquets ont changé, et un formulaire de
confidentialité qui cite un paquet absent se fait refuser.

L'application ne parle qu'à `api.maxmorrys.me` (Cloudflare Worker) en HTTP+JSON. **Aucun SDK
Firebase côté client**, donc ni `@firebase/installations` ni Installation ID — c'était déjà la
règle du port RN (AD-10) et la réécriture Kotlin/Swift la garde, le contrat étant HTTP.

Aucune permission de localisation, contacts, photos, micro ou caméra n'est déclarée — vérifié
sur le paquet CONSTRUIT par `aapt2 dump permissions`, pas sur le manifeste source. Les quatre
permissions Android demandées sont `INTERNET`, `ACCESS_NETWORK_STATE`, `USE_BIOMETRIC` et
`USE_FINGERPRINT` (celle-ci plafonnée à l'API 27, où elle cesse d'être utile).

⭐ **Relevé le 06/09/2026 sur `app-debug.apk`, après l'entrée d'`androidx.biometric` et
d'`androidx.browser` :** la liste est INCHANGÉE. Ces deux bibliothèques n'apportent aucune
permission nouvelle — `browser-1.8.0.aar` n'en déclare aucune, et les deux que
`biometric-1.2.0-alpha05.aar` fait fusionner (`USE_BIOMETRIC`, `USE_FINGERPRINT`) étaient déjà
écrites en clair dans notre manifeste. Le plafond `maxSdkVersion="27"` est bien celui du
paquet livré : la bibliothèque déclare `USE_FINGERPRINT` sans plafond, et c'est notre valeur
qui l'emporte à la fusion.

⛔ **Une permission déclarée depuis le lot 1 est enfin exercée.** `USE_BIOMETRIC` l'était pour
un dispositif qui n'existait pas — c'est la faute symétrique de celle qu'on refuse pour
`POST_NOTIFICATIONS`. Le verrou est construit depuis le lot 5
(`android/…/systeme/Biometrie.kt`), et `tests/unit/natif-capacites.test.ts` apparie désormais
chaque permission du manifeste à un symbole d'API que le code doit contenir.

Le déverrouillage biométrique ne transmet rien : la vérification a lieu sur l'appareil, et le
résultat ne quitte jamais le téléphone. Sur Android il passe par `androidx.biometric`, sur iOS
par `LocalAuthentication` — deux cadres du système, sans service tiers. Aucun achat n'est
possible dans l'application.

**Ce que le verrou enregistre :** un booléen, dans le magasin de préférences non chiffré
(`verrou_biometrique`). Rien d'identifiant, rien de biométrique — l'empreinte ne quitte jamais
l'enclave du téléphone, et l'application n'y a pas accès. Ce drapeau ne part sur aucun réseau.

## Ce que l'application peut VOIR du téléphone

⚠️ **Ce n'est pas une permission, et ça se lit quand même dans le manifeste.** Depuis l'API 30,
une application ne voit pas les autres par défaut. `AndroidManifest.xml` déclare un bloc
`<queries>` pour une seule question : « qui sait ouvrir une adresse `https` ? ». Elle sert à
choisir le navigateur qui rendra l'onglet personnalisé, et elle ne lit rien de ce que ces
applications contiennent. Sans elle, l'onglet personnalisé ne s'ouvrirait jamais sur les
appareils récents — silencieusement.

**Les onglets personnalisés ne sont pas un navigateur intégré.** La page s'ouvre DANS le
navigateur de la personne, avec ses témoins de connexion, son historique et ses réglages ;
l'application ne voit ni l'URL visitée ensuite, ni le contenu, ni les témoins. C'est aussi
pourquoi la politique de cookies du site n'est toujours pas citée dans l'application : elle ne
pose aucun témoin elle-même.

⚠️ **Tracking : NON, partout.** `NSPrivacyTracking: false` et `NSPrivacyTrackingDomains: []`
sont cohérents avec l'absence totale de SDK tiers — ce n'est pas une déclaration de principe,
c'est un constat.

## ⛔ Ce qui SURVIT à la suppression du compte

`deleteUserAccount` balaie onze collections : `certificates`, `club_posts`, `club_profiles`,
`conversations`, `data_exports`, `enrollments`, `internal`, `messages`, `referrals`,
`testimonials`, `transactions`.

**`certificate_lookups` n'en fait pas partie**, et ce miroir garde quatre champs : le code,
le titre de la formation, la date d'émission, **et le NOM du titulaire**. Après suppression
du compte, ce nom reste donc lisible par quiconque possède le code.

⚠️ **Ce n'est pas un oubli, c'est le prix d'un certificat opposable.** Un document qu'on peut
faire disparaître ne prouve rien : l'employeur qui vérifie doit obtenir une réponse, y compris
si la personne a fermé son compte depuis. Le miroir ne porte d'ailleurs AUCUN identifiant de
compte, précisément pour qu'il ne relie à rien d'autre.

⛔ **Mais ce n'est déclaré nulle part.** La politique de confidentialité dit que les
certificats sont « vérifiables publiquement via un code unique » — elle ne dit pas que le nom
survit à la suppression. Le formulaire de confidentialité des magasins demande la durée de
conservation par type de donnée : celle-ci est ILLIMITÉE, et doit être annoncée comme telle.

**Décision humaine en attente** : soit assumer et écrire la conservation dans la politique et
dans les deux fiches de magasin, soit rendre le miroir effaçable — ce qui change la nature de
ce qu'un certificat Max-Morrys garantit.

## Deux points qui appellent une décision humaine

1. **Le répétiteur envoie les messages à Google (Gemini).** `rysmo.ts` appelle
   `generativelanguage.googleapis.com`. Répondre « non partagé » sur les formulaires repose
   sur l'exception « sous-traitant », et cette exception tient à condition que Google soit
   **nommé** dans la politique de confidentialité publiée. Vérifié le 05/09/2026 :
   `src/i18n/locales/fr/legal.json` dit « stockés côté serveur » sans nommer de destinataire.
   **À compléter côté web.**

2. **`creerMonProfil.ts` écrit `preferences.aiMemoryConsent: true` par défaut.** La mémoire du
   répétiteur est donc active dès la création du compte, et `mobile/app/memoire.tsx` propose de
   l'effacer, pas de la désactiver. Tant qu'aucun interrupteur n'existe côté natif, cette
   collecte se déclare **obligatoire** sur Google Play, pas facultative.
