# Le dossier de soumission

Ce qui se saisit dans App Store Connect et dans la Play Console, versionné ici pour que la
version suivante ne se réécrive pas de mémoire.

⛔ **AUCUN SECRET DANS CE DOSSIER.** Pas de mot de passe, pas de clé, pas de jeton. Les
identifiants du compte de revue se saisissent dans les consoles des magasins — App Store
Connect → *App Review Information → Sign-In Information*, et Play Console → *App access*.
Ces champs ne sont pas publics ; un fichier de dépôt, lui, l'est dès qu'on clone.

```
store/
  confidentialite/   ce que l'app collecte, et la dérivation des deux formulaires
  play/<locale>/     les textes de la fiche Google Play, un fichier par champ
  apple/             les textes de la fiche App Store
  captures/          les captures d'écran, par plateforme et par langue
```

## La règle qui gouverne tous ces textes

**L'application ne vend rien.** Son tunnel de paiement a été supprimé, et
`tests/unit/mobile-store-achats.test.ts` le verrouille. Aucun texte de fiche ne doit donc
promettre un achat, nommer un prix de formation, ni renvoyer vers une boutique : une fiche qui
annonce ce que le binaire ne fait pas est un rejet 2.3.1, et il arrive après la file d'attente.

`tests/unit/mobile-fiches-magasins.test.ts` tient les longueurs, qui sont refusées au
téléversement — pas à la revue.

## ⚠️ Le compte de revue — ce qui reste à faire, et pourquoi ce n'est pas fait ici

L'application exige un compte pour l'essentiel de ses écrans. Sans identifiants, un relecteur
voit une porte de connexion et rien d'autre : c'est le motif de rejet 2.1 le plus courant.

Il ne suffit pas de créer un compte : **`abonnementActif()` ferme CINQ vues du Club**, et sans
inscription à une formation, la reprise, les leçons et les certificats n'ont rien à montrer. Un
relecteur qui ne voit que des écrans vides conclut que l'application ne fait rien — et il ne
peut surtout pas vérifier le blocage d'un membre, qui vit derrière l'abonnement et qui est
précisément ce qu'on lui demande de valider.

La procédure, dans l'ordre :

1. **Créer deux comptes** — `revue.appstore@maxmorrys.me` et `revue.play@maxmorrys.me`. Deux,
   parce que les deux magasins relisent parfois en parallèle et qu'un mot de passe changé
   casserait l'autre. Mot de passe stable, **sans double authentification** : Play l'exige
   explicitement.
2. **Inscrire chacun à une formation PUBLIÉE qui a de vraies leçons** — pas la plus courte : le
   relecteur doit pouvoir cocher une leçon et voir la progression bouger. Console admin →
   Utilisateurs → `adminManageEnrollment`.
3. **Activer un abonnement Club.** ⚠️ `activateClubSubscription()` écrit `status: 'pending'` ;
   `abonnementActif()` exige `'active'`. La seconde étape n'est pas optionnelle.
4. **Créer le profil Club** (`club_profiles/{uid}` avec `userName`), sinon la fiche de membre
   reste vide et le blocage n'a rien à quoi s'appliquer.
5. **Un troisième compte, non communiqué**, ayant publié un message au Club — pour que le
   relecteur puisse bloquer quelqu'un sans bloquer le compte dont il a besoin.

Ces gestes demandent une authentification administrateur. Ils sont donc humains, et ils sont la
dernière chose qui manque avant les captures.
