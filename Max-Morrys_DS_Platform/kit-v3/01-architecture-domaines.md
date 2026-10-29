# Architecture : un compte, trois espaces

## Verdict

**Oui, les deux sous-domaines sont pertinents — à trois conditions, et c'est maintenant le moment le moins cher pour le faire.**

- `edu.maxmorrys.me` pour tout le LMS : catalogue, fiches, tunnel d'achat, lecteur, espace apprenant, Rysmo, certificats.
- `club.maxmorrys.me` pour le Club des Digitos, conçu comme un réseau social.
- `maxmorrys.me` devient le **site de marque personnelle** de Max-Morrys : parcours, services (piste Conception), réalisations, blog, podcast et vidéos, FAQ, contact — plus le compte et la console d'administration.

**Pourquoi maintenant.** Le catalogue n'a aucune formation publiée et le Club n'a encaissé aucun abonnement : `/formations` et `/club-des-digitos` n'ont pas encore de capital de référencement à perdre. Déplacer ces pages dans six mois, après l'ouverture de la boutique, coûterait du trafic ; aujourd'hui, ça coûte des redirections.

**Pourquoi c'est juste pour le produit.** Les trois espaces ont trois usages, trois rythmes et trois publics : on lit le hub une fois, on revient sur edu. pour avancer, on vit sur club. tous les jours. Un domaine par usage donne à chacun sa page d'accueil, son en-tête, son thème et sa navigation — sans transformer le site en labyrinthe.

## Les trois conditions

1. **Un seul compte, une seule session.** Se connecter sur un domaine connecte les trois. Firebase Auth garde sa session par origine : sans mécanisme dédié, chaque sous-domaine redemanderait la connexion. Voir « Session partagée » ci-dessous. Sans cette condition, ne pas faire la séparation.
2. **Le contenu gratuit reste sur le site personnel.** Blog, podcast, vidéos et FAQ sont la seule ligne qui vit (PRD §1.2) et tirent le référencement de tout le domaine. Ils ne partent pas.
3. **La séparation passe après les urgences du PRD.** Rang 1 : retirer la promesse de remboursement et fusionner la passe d'audit (FR-240, FR-241). Rang 2 : sécuriser le certificat (FR-265) et ouvrir une formation. La refonte et les sous-domaines se construisent en parallèle, mais ne se mettent en ligne qu'ensuite.

## Carte des domaines

| Aujourd'hui | Demain | Redirection |
|---|---|---|
| `/` | `maxmorrys.me/` (site de marque personnelle) | — |
| `/a-propos` | `maxmorrys.me/parcours` | 301 |
| `/apprendre` | `maxmorrys.me/apprendre` — aiguille vers edu., club., blog, média | — |
| `/formations`, `/formations/:slug` | `edu.maxmorrys.me/`, `edu.maxmorrys.me/formations/:slug` | 301 |
| `/checkout/:slug`, `/paiement/retour` | `edu.maxmorrys.me/paiement/:slug`, `edu.maxmorrys.me/paiement/retour` | 301 ; **retour codé dans `bictorys.ts` à mettre à jour le même jour** (Addendum §3.2, point 6) |
| `/cours/:slug` | `edu.maxmorrys.me/apprendre/:slug` | 301 |
| `/mon-espace/*` (tableau de bord, cours, notes, succès, témoignages, hors connexion, répétiteur) | `edu.maxmorrys.me/espace/*` | 301 |
| `/mon-espace/profil`, `/parametres`, `/notifications`, `/messages`, `/paiements` | `maxmorrys.me/compte/*` — le compte est transversal | 301 |
| `/certificat/:code`, `/verifier` | `edu.maxmorrys.me/certificat/:code`, `edu.maxmorrys.me/verifier` | 301 ; garder `maxmorrys.me/verifier` en 301 à vie (des certificats imprimés le citent) |
| `/club-des-digitos` | `club.maxmorrys.me/` (page d'accueil publique) | 301 |
| `/mon-espace/club` (+ 8 onglets sans URL) | `club.maxmorrys.me/fil`, `/discussions`, `/agenda`, `/membres`, `/classement`, `/opportunites`, `/infos`, `/parrainage` | 301 vers `/fil` |
| `/admin/*` | `maxmorrys.me/admin/*` — console superadmin unique | — |
| Version anglaise `/en/...` | `/en/...` sur chaque domaine, segments traduits | 301 pour chaque segment |

Le Club gagne au passage ce qui lui manquait : **des URL par onglet** (FR-031 notait que l'onglet n'est pas porté par l'URL), donc des liens partageables et un bouton retour qui fonctionne.

## Ce que les tableaux de bord montrent

- **Tableau de bord du compte** (`maxmorrys.me/compte`) : profil, paiements, notifications, et **deux lanceurs** (`SpaceSwitcher` → `mm-launch is-edu` et `mm-launch is-club`) qui portent un fait réel chacun — la leçon en cours, la prochaine session, les messages non lus.
- **Sur edu.** : le lanceur Club en tuile (« Publie ta mission de la leçon 13 ») ; pour un non-membre, le prix et ce que l'abonnement ouvre, jamais un nombre de membres.
- **Sur club.** : le lien vers edu. dans le rail, et « Pour toi » qui recommande la leçon suivante.
- **Partout** : le sélecteur d'espaces dans l'en-tête et la palette ⌘K, qui cherche dans les trois domaines.

## Session partagée — le point technique qui décide de tout

Recommandation : **échange de jeton à l'aller, cookie de session sur `.maxmorrys.me` en retour.**

1. La connexion a lieu sur `maxmorrys.me/connexion` (une seule page, une seule identité).
2. Le Worker `api` émet, sur demande d'une session valide, un **jeton personnalisé Firebase à usage unique et courte durée** (signé avec le compte de service déjà présent, `GCP_SA_JSON`).
3. En passant d'un espace à l'autre, le lien porte ce jeton dans un fragment (`#t=…`), jamais dans la requête ; le domaine d'arrivée appelle `signInWithCustomToken`, puis efface le fragment.
4. Un cookie `__mm_s` (HttpOnly, Secure, SameSite=Lax, domaine `.maxmorrys.me`) signale qu'une session existe, pour que chaque domaine sache s'il doit lancer l'échange sans afficher d'écran de connexion.
5. La déconnexion révoque les jetons de rafraîchissement côté serveur et efface le cookie : un clic déconnecte les trois espaces.

Alternative écartée : faire vivre les trois espaces sur un seul domaine avec des chemins (`/edu`, `/club`). Plus simple techniquement, mais elle prive le Club de son identité de réseau social et l'espace d'apprentissage de sa page d'accueil propre — ce qui est précisément la demande.

## Liste de contrôle technique

Tirée de l'Addendum ; chaque ligne est un oubli qui casse en silence.

- **Worker `site`** : ajouter les routes `edu.maxmorrys.me/*` et `club.maxmorrys.me/*`, leur pré-rendu (`PRERENDER_EXACT`, `PRERENDER_PREFIXES`), leur plan de site et leurs `hreflang`.
- **Redirections** : écrites dans `static-redirects.ts` **et** `firebase.json`, testées par `redirects.test.ts` ; une route retirée du pré-rendu le reste.
- **Paiement** : le segment de retour codé dans `worker/apps/api/src/lib/bictorys.ts` change le même jour que la route, sinon tout paiement en cours atterrit sur une page introuvable (NFR-03).
- **CORS et CSP** : `ALLOWED_ORIGINS` du Worker `api` et du Worker `media` ; `connect-src` des trois domaines.
- **Firebase Auth** : ajouter les deux sous-domaines aux domaines autorisés.
- **Application Rysmo** : `assetlinks.json` et l'AASA déclarent les nouveaux chemins (`edu.maxmorrys.me/formations/*`, `/verifier/*`) — et l'application doit enfin avoir les routes correspondantes (FR-268).
- **Consentement et mesure** : un seul bandeau cookies, consentement partagé par le cookie de domaine ; GA4 en mesure inter-domaines ; Meta Pixel sur les trois.
- **E-mails** : tous les liens des modèles Brevo et transactionnels pointent vers le bon domaine.
- **Console** : `redirects` administrables par domaine.
- **Ordre de mise en ligne** : frontend (CI), puis Worker `site`, puis Worker `api` — inchangé.

## Ordre de déploiement

1. Session partagée et cookie de domaine, testés sur les trois domaines **avant** de déplacer une page.
2. `club.maxmorrys.me` d'abord : moins de pages, pas de paiement unitaire, et c'est l'espace qui gagne le plus à exister seul.
3. `edu.maxmorrys.me` ensuite, avec le tunnel d'achat et le retour de paiement dans le même lot.
4. Retrait des anciennes routes du pré-rendu, 301 vérifiées par `proof-links` et `seo-check`.
