# Console superadmin

Une seule console, à `maxmorrys.me/admin`, pour les trois espaces. Elle remplace la console actuelle (21 écrans, rôles `admin` et `support`) sans en perdre un écran, et ajoute ce que le PRD constate manquant : le journal d'audit, la modération du Club, la gestion des domaines et des rôles par le serveur.

## Principe

- **Elle répond à « qu'est-ce qui bloque aujourd'hui ? »**, pas à « comment ça évolue ? ». L'écran d'accueil montre quatre relevés datés, puis la file de tout ce qui attend une personne, tous espaces confondus.
- **Un filtre d'espace** en tête (`Tout · Hub · Edu · Club · Conception · Rysmo`) filtre les tuiles, les files et les tableaux. Un administrateur d'espace ne voit que son espace ; le superadmin voit tout.
- **Pas de courbe sans historique.** Une tuile sans série réelle montre un fait daté.
- **Thème clair** (v4.3), comme edu. et le Club : fond `paper-2`, cartes blanches. **Barre latérale à libellés** de 248 px, groupée (Pilotage, Personnes, Argent, Espaces, Système) avec le nombre d'éléments en attente : douze icônes seules ne se lisent pas. Sur mobile, barre d'onglets basse (Bloque, Modération, Edu, Journal, Plus).

## Les rôles

| Rôle | Périmètre | Ce qui change par rapport à aujourd'hui |
|---|---|---|
| **Superadmin** | Tout, sur les trois domaines ; seul à accorder un rôle, à toucher aux paramètres, redirections, domaines et à l'infrastructure | Nouveau. Un ou deux comptes au plus. Remplace le rôle `admin` actuel, qui avait trop de droits sans trace |
| **Admin Edu** | Formations, modules, leçons, liste d'attente, certificats, témoignages, quotas Rysmo liés aux apprenants ; lecture des transactions de formation | Découpé de `admin` |
| **Admin Club** | Abonnements, publications, défis, événements, sessions, infos, digest, opportunités ; lecture des transactions du Club | Découpé de `admin` |
| **Modération Club** | Signalements de messages **et de profils**, blocages, masquage d'une publication | Nouveau. Branche enfin la collection `reports`, que personne ne lit (FR-171) |
| **Admin Conception** | Prospects commerces, projets sur mesure, réalisations, rendez-vous ; contenus du hub | Découpé de `admin` |
| **Support** | Messages (avec **droit de répondre**), rendez-vous, prospects en lecture et statut | Son geste échoue aujourd'hui sur deux écrans (FR-205) : la v3 le rend possible ou retire l'écran, jamais les deux à moitié |

Le détail croisé est dans le composant `RoleMatrix`.

**Trois règles non négociables** (corrigent FR-267, FR-092 et R-38) :
1. Un rôle ne s'écrit **que par le serveur** (une callable `accorderRole` réservée au superadmin), avec un motif. Aucun écran n'écrit `users/{uid}.role` depuis le navigateur.
2. Chaque action d'administration passe par le Worker et s'écrit au **journal d'audit** (`acteur, action, cible, espace, motif, horodatage`). L'écran Journal d'audit le lit en direct.
3. Le périmètre de chaque rôle est déclaré à **un seul endroit**, lu par le menu, le garde de route, les règles et le Worker.

## Carte des écrans

| Groupe (rail) | Écrans | Rôles |
|---|---|---|
| Vue d'ensemble | Ce qui bloque aujourd'hui · relevés datés | tous, filtrés |
| Comptes et rôles | Utilisateurs, fiche, rôles (serveur), inscriptions manuelles, octroi gracieux | Superadmin |
| Revenu et transactions | Transactions, remboursement avec date (corrige FR-204), revenu par ligne, coupons | Superadmin ; lecture par espace |
| Edu · formations et cohortes | Formations, « Bientôt » et liste d'attente, certificats émis, témoignages ; **cohortes** (membres, live du mois à planifier, lien envoyé aux inscrits), **relectures entre pairs** en retard (réattribuer, relancer) | Admin Edu |
| Club · communauté | Abonnements (avec « en attente » qu'on peut **libérer**), sessions et relevé public 2 par mois sur 90 jours, **coups de cœur des défis** (pas de vote), infos, classement facultatif, récompense de parrainage `[à définir]` ; digest, replays et cercles ouverts restent **désactivés tant qu'ils sont en construction** | Admin Club |
| Club · modération | Signalements de messages, de profils, de publications **et d'opportunités** ; fiche de décision avec la charte concernée et un motif obligatoire (avertir, masquer, suspendre, classer) | Modération Club |
| Conception | Prospects commerces, projets sur mesure, réalisations, rendez-vous | Admin Conception, Support |
| Hub · contenus | Articles, podcasts, vidéos, FAQ, annonces, lettre | Admin Conception |
| Rysmo | Quotas, packs, coût par jour (AI Gateway) | Superadmin, Admin Edu |
| Messages | Boîte de contact et réponses | Support et au-dessus |
| Journal d'audit | Toutes les actions, filtrables par acteur, espace, type | tous (chacun lit ses propres traces ; le superadmin lit tout) |
| Infrastructure | Domaines et redirections, versions des Workers comparées à `main`, tâches planifiées réelles, sauvegarde | Superadmin |

L'écran Infrastructure affiche ce qui tourne **vraiment** (version servie de chaque Worker, crons déclarés) — la console actuelle affirme des tâches qui n'existent plus (`admin.json:1673,1677`).

## Composants

`ConsoleShell` (coquille), `KpiTile`, `RoleMatrix`, `CommandPalette`, `Toast`, la table `mm-table`, le segment `mm-seg`, le badge `mm-env`, le journal `mm-log`.


## v4.3 : écrans maquettés

Ce qui bloque · Comptes (liste + fiche) · Rôles et accès (matrice + octroi avec motif) · Transactions (remboursement daté, codes et parrainages) · Edu : formations et cohortes · Club : communauté · Club : modération · Journal d'audit · Infrastructure. Chaque écran a sa version mobile. Conception, Hub, Rysmo et Messages gardent la même coquille et viendront ensuite.

Les relevés de ces maquettes sont des emplacements (`[N]`) : un chiffre réel vient du serveur, daté, ou ne s'affiche pas.
