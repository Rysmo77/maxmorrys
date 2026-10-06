# Suivi d'implémentation — backlog UI/UX mobile (06/10/2026)

> État de chaque épopée du [backlog](BACKLOG_UI_UX_MOBILE.md) après le lot d'implémentation du 06/10/2026. Les tickets non cités sont **faits**. Vérifié : `npm test` (1 067), Worker (449), `tsc`, `ds:check`, `eslint` (0 erreur), `expo export` Android, `expo-doctor` (21/21), `paquet-natif-propre`.
>
> ⚠️ **Rien n'est déployé ni commité.** Les changements du Worker (`maxmorrys-api`) doivent être déployés pour que l'application en profite. Il faut aussi un nouvel APK, car deux modules natifs ont été ajoutés (`expo-haptics`, `expo-clipboard`).

## Changements côté serveur (Worker `maxmorrys-api`)

| Changement | Fichier | Ticket |
|---|---|---|
| Canal `app` du répétiteur : prompt et catalogue sans prix, montants retirés de la réponse | `lib/rysmo-canal.ts`, `handlers/rysmo.ts` | IA-01 |
| `appFormation` sert `id` et `leconOuverte` par module | `handlers/app/formation.ts` | NAV-01 |
| `appLeconContenu` sert une leçon `isFree` sans inscription, et le `slug` | `handlers/app/leconContenu.ts` | NAV-01, NAV-03 |
| Nouvelle écriture `reglerLeRepetiteur` (nom + consentement mémoire) ; `appRepetiteur.memoireActive` | `handlers/reglerLeRepetiteur.ts`, `registry.ts`, `wrangler.jsonc` (×2) | IA-13, IA-14 |
| `appClubListe.membre` résout l'auteur d'une discussion ou d'une offre | `handlers/app/clubListe.ts` | CLUB-07, CLUB-10 |
| `posterAuClub` accepte un `idClient` (rejouable hors ligne, jamais réécrit) | `handlers/posterAuClub.ts` | CLUB-06 |

Le contrat (`vues.contrat.json`) est régénéré dans ses deux copies (`vues:gen`).

## Écarts par épopée

| Épopée | Non fait / partiel | Raison |
|---|---|---|
| CLUB | **CLUB-03** (barre d'onglets dans le Club) | Restructuration des routes `club/*` sous `(tabs)` : risque de régression de la navigation, à décider à part |
| MOT | **MOT-07 / MOT-08** (maillage à la racine, fondu de territoire) | Une pile native à fonds transparents laisse voir l'écran précédent pendant le glissement : il faut d'abord une transition personnalisée |
| MOT | **MOT-14** (profilage GPU) | Demande le TECNO branché |
| MOT | MOT-05 partiel | Le segment glisse, et les listes filtrées font un fondu de 180 ms. La pilule active fait un fondu au lieu de glisser : ses largeurs varient, et un `scaleX` déformerait ses arrondis |
| DS | **DS-02 / DS-03** : primitives livrées (`Texte`, `Pile`, `Rangee`, `Section`), migration non faite | Le codemod touche environ 260 tailles et 740 marges : à revoir visuellement écran par écran |
| DS | **DS-05** (nouveaux jetons) | Les jetons sont la copie littérale du kit (`ds:check`). Les valeurs sont dérivées : encre sombre fixe sur le violet nuit, ton `danger` voilé de `stop` |
| PERF | **PERF-04** (listes virtualisées) | Listes bornées à 40 par le serveur ; une FlatList imbriquée dans le défilement du châssis serait refusée par RN |
| PERF | **PERF-05** (`expo-linear-gradient`) | Même mesure de taille nécessaire, gain marginal |
| RESP | **RESP-02** (exclure les tablettes du Play Store), **RESP-03** (paysage vidéo) | Réglage de la fiche Play Console ; P5 |
| A11Y | A11Y-02 partiel | Régions vivantes posées (bandeau, erreurs de champ, réponses IA, feuille). À vérifier au lecteur d'écran sur appareil |
| FBK | FBK-01 : 11 `Alert` restantes | Toutes des confirmations destructives, ou l'atelier — garde de CI `mobile-etats-retours` |

## Nouveautés du design system

`haptique`, `useConfirmation` (+ `Button confirmation/confirme`), `Bandeau` / `useBandeau`, `Feuille`, `Onde`, `Fondu`, `Heros`, `SqueletteGroupe`, `POLICE` (graisses iOS), `useTransparenceReduite`, `Texte`, `Pile` / `Rangee` / `Section`, `elevation`, ton `danger`. `Field` v2 (ref, remplissage auto, chaînage, focus visible). `Screen` : clavier, tirer pour rafraîchir, colonne de 600 dp, rembourrage de la barre d'onglets compté une seule fois.

## Gardes ajoutées

- `tests/unit/mobile-etats-retours.test.ts` : état de `SansDonnees`, aucun texte en `textFaint`, plancher de 11,5 pt, `Alert` réservée au destructif.
- `worker/apps/api/test/rysmo-canal.test.ts` : aucun prix ni achat sur le canal `app`.
- Tests étendus : atelier (`widget`, `verrouille`, `permissions`), mouvement (boucles d'attente), fontes (`POLICE`), routes, Club, verrou.
