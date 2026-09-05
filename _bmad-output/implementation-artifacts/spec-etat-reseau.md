---
title: 'État du réseau — cesser de dire « pas de connexion » quand c’est le serveur'
type: 'feature'
created: '2026-09-04'
status: 'done'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** `donnees/appel.ts` attrape TOUT échec de `fetch` — absence de réseau, serveur
injoignable, DNS, délai dépassé — et répond une seule phrase : « Pas de connexion. » Elle
est fausse la moitié du temps, et elle envoie quelqu'un vérifier son forfait quand c'est le
serveur qui tombe. Sur ce marché, où les données sont comptées, c'est une accusation.

**Approach :** Lire l'état réseau réel avec `expo-network` au moment de l'échec, et
distinguer trois causes qui appellent trois gestes différents : pas de réseau (attendre),
serveur injoignable (réessayer), délai dépassé (réessayer plus tard).

## Boundaries & Constraints

**Always :**
- L'état réseau est lu AU MOMENT DE L'ÉCHEC, jamais gardé en mémoire. Un état mis en cache
  est faux dès qu'on passe une porte, et il ferait dire « pas de réseau » à quelqu'un qui
  vient de retrouver la 4G.
- Ne jamais BLOQUER un appel parce que l'état dit « hors ligne ». L'état réseau du système
  se trompe — capture de portail, VPN, réseau d'entreprise. On tente, et on explique après.
- La distinction sert le MOTIF affiché, rien d'autre. `SansDonnees` en phase `panne` le rend
  déjà ; aucun écran ne change de structure.

**Ask First :**
- Si `expo-network` fait fusionner une permission Android non déclarée : HALTE. Le tableau
  `permissions` vient d'être rendu véridique (`USE_BIOMETRIC`, `USE_FINGERPRINT` déclarées,
  stockage bloqué) et ne doit pas redevenir faux.

**Never :**
- Ne pas router vers `/hors-connexion` : cet écran liste des téléchargements et une file
  d'envoi qui n'existent pas (voir `constat-hors-ligne.md`). L'y envoyer montrerait deux
  listes vides. Il reste une destination d'atelier.
- Ne pas ajouter d'indicateur permanent de connexion : un bandeau qui clignote sur un réseau
  instable coûte plus d'attention qu'il n'en économise.

## I/O & Edge-Case Matrix

| Scénario | État | Motif attendu | Traitement |
|---|---|---|---|
| Aucun réseau | `isInternetReachable === false` | « Ton téléphone n'a pas de réseau. » | Réessayer proposé |
| Réseau présent, serveur muet | `fetch` échoue, réseau OK | « Le serveur ne répond pas. » | Réessayer proposé |
| Délai dépassé | `AbortSignal.timeout` | « Le serveur met trop de temps. » | Réessayer proposé |
| `expo-network` lui-même échoue | L'appel d'état jette | Retomber sur le motif générique d'aujourd'hui | Aucun plantage |

</frozen-after-approval>

## Code Map

- `mobile/donnees/appel.ts:95-101` — le `catch` autour de `fetch` qui produit aujourd'hui
  « Pas de connexion. » pour toutes les causes. C'est le seul endroit à changer.
- `mobile/donnees/appel.ts:41-50` — `ErreurAppel(code, message, motif, details)` ; `motif`
  est ce que la personne lit, `message` ce que la trace porte.
- `mobile/ds/SansDonnees.tsx` — la phase `panne` rend déjà `etat.motif` et un « Réessayer ».
  Aucun changement.
- `mobile/app.json` — `android.permissions` et `blockedPermissions` viennent d'être rendus
  véridiques ; toute permission neuve doit y apparaître.
- `tests/unit/mobile-app-config.test.ts:82` — le tableau des permissions.

## Tasks & Acceptance

**Execution:**
- [ ] `mobile/package.json` — `npx expo install expo-network` — rationale : version résolue
  par le SDK.
- [ ] `mobile/donnees/reseau.ts` — une fonction qui répond « pas de réseau / réseau
  présent / indéterminé », sans jamais jeter — rationale : elle est appelée depuis un
  `catch`, et une fonction de diagnostic qui échoue dans un gestionnaire d'erreur masque
  l'erreur d'origine.
- [ ] `mobile/donnees/appel.ts` — dans le `catch`, distinguer le délai dépassé du reste,
  puis interroger le réseau — rationale : c'est le seul endroit qui produit le motif.
- [ ] `mobile/app.json` — déclarer toute permission apportée par le paquet, ou constater
  qu'il n'en apporte aucune — rationale : le tableau vient d'être rendu vrai.
- [ ] `tests/unit/mobile-reseau.test.ts` — porte statique : `appel.ts` ne produit plus une
  phrase unique pour tous les échecs de transport, et `reseau.ts` ne peut pas jeter
  (tout est dans un `try`) — rationale : le défaut d'origine était une seule phrase pour
  trois causes, et rien ne l'attrapait.

**Acceptance Criteria:**
- Étant donné un appel qui échoue avec du réseau disponible, quand le motif s'affiche,
  alors il désigne le serveur et non la connexion de la personne.
- Étant donné un appel qui dépasse le délai, quand le motif s'affiche, alors il le dit,
  et ne prétend ni l'absence de réseau ni une panne serveur.
- Étant donné `expo-network` en échec, quand un appel échoue, alors l'application affiche
  le motif générique et ne plante pas.

## Spec Change Log

- **⚠️ CETTE SPÉCIFICATION SE CONTREDISAIT, et c'est un défaut de l'orchestrateur.** Sa
  section « Ask First » exigeait de HALTER si le paquet faisait fusionner une permission ;
  sa section « Tasks » demandait de « déclarer toute permission apportée par le paquet ».
  `expo-network` en apporte deux. Le sous-agent a suivi la tâche, déclaré les permissions,
  ET SIGNALÉ qu'il n'avait pas halté — en indiquant précisément quoi révoquer si l'arrêt
  était voulu. C'est la bonne conduite face à une consigne contradictoire.
- **Décision tenue :** `ACCESS_NETWORK_STATE` et `ACCESS_WIFI_STATE` sont déclarées. Toutes
  deux de niveau `normal` : aucun dialogue à l'exécution, aucune ligne au formulaire Data
  Safety — elles lisent un état que le système publie déjà.
- **Le piège que la détection du délai cachait :** identifier le dépassement par le NOM de
  l'erreur aurait été faux de trois façons à la fois. `AbortSignal.timeout` d'Expo rejette
  un `TimeoutError`, le `whatwg-fetch` de React Native un `DOMException('AbortError')`, et
  le `fetch` d'Expo un `FetchError` nommé `Error`. Le même dépassement porte trois noms
  selon le drapeau et le SDK. Le code interroge donc `limite?.aborted`, vrai quelle que soit
  l'implémentation, et une porte interdit de revenir au nom.
- **Une porte qui passait pour la mauvaise raison, corrigée avant livraison :** la première
  version du test des trois motifs vérifiait leur PRÉSENCE, pas leur ATTEIGNABILITÉ — elle
  restait verte quand on réintroduisait la phrase unique. Réécrite pour exiger que le
  `catch` DÉLÈGUE.
- **Reste non traité, et nommé :** avec le `fetch` d'Expo, un dépassement de délai survenant
  pendant `await reponse.text()` échappe aux nouveaux motifs et retombe sur « La lecture a
  échoué. » de `vue.ts`. Pas de plantage, mais ce chemin ne nomme pas la cause.

## Verification

**Commands:**
- `cd mobile && npx tsc --noEmit` — attendu : aucune sortie.
- `npm test` — attendu : tout au vert.
- `cd mobile && npx expo export --platform android --clear --output-dir /tmp/v` — attendu :
  le paquet se construit.
- `cd mobile && npx expo prebuild --platform android --clean --no-install` puis comparer
  `android/app/src/main/AndroidManifest.xml` à l'état d'avant — attendu : aucune permission
  non déclarée.
