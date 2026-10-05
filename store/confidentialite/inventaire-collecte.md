---
releve: '2026-09-05'
methode: 'lecture de worker/apps/api/src/handlers/**, mobile/donnees/**, mobile/package.json'
# ⓘ Du 05/09 au 04/10/2026, ce relevé décrivait la réécriture Kotlin (abandonnée) : READ_GSERVICES,
#   Play Integrity et reCAPTCHA venaient du SDK Android natif `firebase-auth`. Le SDK JavaScript
#   `firebase/auth` du port React Native n'entraîne pas `play-services`. Version Kotlin : `git show 09f2ceb:store/…`.
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

`mobile/donnees/firebase.ts` initialise `firebase/app` et `firebase/auth` **uniquement** — le
fichier interdit explicitement `firebase/firestore`. Il n'y a donc ni `@firebase/installations`
ni Installation ID.

Aucune permission de localisation, contacts, photos, micro ou caméra n'est déclarée. Face ID
(`expo-local-authentication`) ne transmet rien : la vérification a lieu sur l'appareil, et le
résultat ne quitte jamais le téléphone. Aucun achat n'est possible dans l'application.

⚠️ **Tracking : NON, partout.** `NSPrivacyTracking: false` et `NSPrivacyTrackingDomains: []`
sont cohérents avec l'absence totale de SDK tiers — ce n'est pas une déclaration de principe,
c'est un constat.

## Ce que le téléphone GARDE pour le hors-connexion (depuis le 05/10/2026)

Rien de ceci n'est COLLECTÉ — rien ne quitte l'appareil de plus qu'avant — mais un formulaire
de magasin demande ce qui est stocké, et la réponse doit être exacte.

| Ce qui est gardé | Où | Quand ça s'efface |
|---|---|---|
| Le texte des leçons que la personne a choisi de garder (« Télécharger ») | AsyncStorage, clés `rysmo.horsligne.<uid>.lecon.*` | à sa demande, au plafond (5 Mo, la plus ancienne d'abord), ou à la suppression du compte |
| La file d'envoi : leçons cochées et notes écrites sans réseau | AsyncStorage, `rysmo.horsligne.<uid>.file` | dès l'envoi réussi ; à la suppression du compte |
| Les gestes refusés par le serveur, avec leur motif | `rysmo.horsligne.<uid>.ecartees` | quand la personne touche « J'ai vu » ; à la suppression du compte |
| Le réglage « Wi-Fi seulement » | `rysmo.horsligne.<uid>.wifi` | à la suppression du compte |

⚠️ **La déconnexion ne les efface PAS**, délibérément : une note écrite sans réseau est un
geste de la personne, la perdre à la déconnexion serait la faute que ce dispositif existe pour
éviter. Les clés portent l'uid : un second compte sur le même téléphone ne les voit pas. Les
notes en attente sont donc stockées en clair sur l'appareil jusqu'à leur envoi — comme la
session Firebase elle-même (`firebase.ts`).

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
