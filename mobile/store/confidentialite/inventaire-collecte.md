---
releve: '2026-09-05'
methode: 'lecture de worker/apps/api/src/handlers/**, mobile/donnees/**, mobile/package.json'
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
