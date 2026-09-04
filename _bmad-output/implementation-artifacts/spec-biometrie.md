---
title: 'Déverrouillage biométrique — rendre vrai un écran qui promet déjà'
type: 'feature'
created: '2026-09-04'
status: 'done'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** `app/biometrie.tsx` propose « Activer Face ID », et son bouton appelle
`router.replace('/(tabs)')`. Il n'active rien. Ce n'est pas un bouton mort au sens de la
porte existante — il A une action — mais ce n'est pas celle qu'il annonce, ce qui est pire :
quelqu'un croit avoir posé un verrou et n'en a aucun. Le profil propose la même chose.

**Approach :** Brancher `expo-local-authentication`, persister le choix dans
`expo-secure-store`, et exiger l'authentification système au démarrage à froid quand le
verrou est actif ET qu'une session existe.

## Boundaries & Constraints

**Always :**
- Le verrou protège l'ACCÈS À L'APPLICATION, jamais la session : celle-ci reste dans
  AsyncStorage et n'est pas rechiffrée. L'écran le dit déjà — « un raccourci, pas un
  remplacement » — et le code ne doit pas laisser croire davantage.
- Ne proposer le verrou que si le matériel existe ET qu'une empreinte est enrôlée
  (`hasHardwareAsync`, `isEnrolledAsync`). Proposer un verrou impossible à poser est un
  réglage qui ment, exactement ce que l'en-tête de l'écran reproche.
- `NSFaceIDUsageDescription` devient obligatoire dès que le paquet entre
  (`tests/unit/mobile-app-config.test.ts:63` l'exige, et la revue Apple la lit).
- Un échec d'authentification ne doit JAMAIS enfermer : il reste une sortie vers la
  déconnexion, sinon un capteur cassé rend le compte inaccessible depuis ce téléphone.

**Ask First :**
- Si `expo-local-authentication` impose une permission Android supplémentaire ou une chaîne
  d'usage non prévue : HALTE. Le tableau des permissions est explicitement vide et audité.

**Never :**
- Ne pas chiffrer ni déplacer la session : la biométrie n'est pas un coffre.
- Ne pas bloquer le démarrage quand aucune session n'existe — il n'y a rien à déverrouiller.
- Ne pas toucher aux textes de l'écran : ils sont justes, c'est le geste qui manquait.

## I/O & Edge-Case Matrix

| Scénario | État | Comportement attendu | Traitement d'erreur |
|---|---|---|---|
| Verrou actif, session présente | Démarrage à froid | Invite système ; le contenu n'apparaît qu'après succès | N/A |
| Verrou actif, échec ou annulation | L'invite est refusée | L'application reste verrouillée, avec une sortie « Me déconnecter » visible | Motif affiché, nouvelle tentative possible |
| Verrou actif, aucune empreinte enrôlée | L'utilisateur a retiré ses empreintes | L'application s'ouvre normalement, le réglage s'éteint tout seul | Le changement est dit, pas silencieux |
| Pas de session | Anonyme | Aucune invite | N/A |
| Matériel absent | Appareil sans capteur | L'écran ne propose pas le verrou, et dit pourquoi | N/A |

</frozen-after-approval>

## Code Map

- `mobile/app/biometrie.tsx:69-74` — le bouton « Activer Face ID » qui navigue sans activer.
- `mobile/app/(tabs)/profil.tsx:40` — l'entrée « Entrer sans mot de passe » du profil.
- `mobile/app/_layout.tsx` — la racine ; elle porte déjà `SessionProvider` et la porte des
  fontes. C'est le seul endroit d'où un verrou peut précéder tout rendu.
- `mobile/donnees/session.tsx` — `useSession()` ; `phase === 'connectee'` est la condition
  qui rend le verrou pertinent.
- `mobile/donnees/firebase.ts:44-52` — l'en-tête explique pourquoi SecureStore ne porte PAS
  la session (le blob dépasse la limite Android) mais reste le bon endroit pour un drapeau.
- `tests/unit/mobile-app-config.test.ts:63` — `NSFaceIDUsageDescription` ⇒
  `expo-local-authentication` installé.
- `tests/unit/mobile-controles-morts.test.ts:80` — un contrôle qui annonce agit.

## Tasks & Acceptance

**Execution:**
- [ ] `mobile/package.json` — `npx expo install expo-local-authentication expo-secure-store`
  — rationale : versions résolues par le SDK, jamais à la main.
- [ ] `mobile/app.json` — `NSFaceIDUsageDescription` et le greffon — rationale : la chaîne
  d'usage est lue en revue, et le test l'exige dès que le paquet entre.
- [ ] `mobile/donnees/verrou.ts` — lire/écrire le drapeau dans SecureStore, interroger le
  matériel, déclencher l'invite — rationale : la logique vit avec la session, pas dans un
  écran.
- [ ] `mobile/app/_layout.tsx` — poser la porte après la session et les fontes — rationale :
  un verrou qui s'affiche après le contenu n'a rien protégé.
- [ ] `mobile/app/biometrie.tsx` — le bouton active vraiment ; l'écran ne propose rien si le
  matériel manque — rationale : c'est le défaut d'origine.
- [ ] `mobile/app/(tabs)/profil.tsx` — refléter l'état réel du verrou, et permettre de
  l'éteindre — rationale : l'écran promet « désactivable à tout moment dans ton profil ».
- [ ] `tests/unit/mobile-verrou.test.ts` — porte statique : le bouton d'activation appelle
  bien l'activation ; la racine attend le verrou ; une sortie de déconnexion existe dans
  l'écran verrouillé — rationale : le défaut d'origine était un bouton qui naviguait au lieu
  d'agir, et rien ne l'attrapait.

**Acceptance Criteria:**
- Étant donné un verrou actif et une session, quand l'application démarre à froid, alors
  aucun écran de contenu n'est rendu avant que l'authentification ait réussi.
- Étant donné une authentification refusée, quand l'écran de verrouillage s'affiche, alors
  une action de déconnexion y est atteignable.
- Étant donné un appareil sans capteur, quand `biometrie.tsx` s'affiche, alors il ne propose
  pas d'activer et dit pourquoi.

## Spec Change Log

- **Porte « Ask First » déclenchée, et TENUE.** `expo-local-authentication` fait fusionner
  `USE_BIOMETRIC` et `USE_FINGERPRINT` depuis son propre manifeste — donc quel que soit le
  greffon déclaré. Le sous-agent s'est ARRÊTÉ plutôt que de toucher au tableau audité. C'est
  la bonne conduite, et exactement l'inverse de ce que l'orchestrateur avait fait sur la
  spécification des fontes.
- **Trouvé en vérifiant son constat :** il n'y avait pas deux permissions non déclarées mais
  SEPT. Le tableau `permissions` ne contrôle QUE ce que les greffons d'Expo ajoutent ; il ne
  retire rien de ce que Gradle fusionne depuis les manifestes des paquets. Vide, il donnait
  une assurance fausse — et la porte de test ne vérifiait que son existence, jamais sa
  véracité.
- **Tranché par l'humain :** déclarer les deux permissions biométriques, et BLOQUER
  `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`. Elles viennent du greffon
  d'`expo-file-system`, dépendance transitive d'`expo` que le code n'utilise pas, et
  `WRITE_EXTERNAL_STORAGE` aurait dû être justifiée au formulaire Data Safety pour une
  capacité jamais exercée. Vérifié après `prebuild` : le manifeste porte `tools:node="remove"`.
- **Risque connu, non levé :** rien n'a été essayé sur un appareil réel. Le comportement de
  `authenticateAsync` — verrouillage après échecs, invite pendant l'écran de lancement,
  mise en arrière-plan au milieu — n'est pas exercé. Et une lecture de SecureStore qui
  échoue ouvre SANS verrou : délibéré, parce qu'un drapeau illisible ne prouve aucun verrou
  et que la spécification interdit d'enfermer, mais un trousseau corrompu éteint alors le
  verrou en silence.

## Verification

**Commands:**
- `cd mobile && npx tsc --noEmit` — attendu : aucune sortie.
- `npm test` — attendu : tout au vert, y compris la porte neuve.
- `cd mobile && npx expo export --platform android --clear --output-dir /tmp/v` — attendu :
  le paquet se construit.
- `cd mobile && npx expo prebuild --platform android --clean --no-install` — attendu : aucune
  permission Android inattendue dans `android/app/src/main/AndroidManifest.xml`. Comparer à
  la liste d'avant : le tableau `permissions` d'`app.json` est vide et audité.
