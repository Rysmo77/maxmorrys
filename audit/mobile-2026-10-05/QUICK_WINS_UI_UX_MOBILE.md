# Quick wins UI/UX mobile — Rysmo

> 36 corrections livrables chacune en moins d'une demi-journée, sans nouvelle dépendance sauf mention. Classées par rapport impact/difficulté. Chemins relatifs à `mobile/`. La colonne **Ticket** renvoie au [backlog](BACKLOG_UI_UX_MOBILE.md).
> **Impact** : Élevé (revue) = risque de refus en magasin. **Difficulté** : Très faible (< 1 h) · Faible (< ½ jour).

## Lot A — Avant soumission (honnêteté, culs-de-sac, faux succès)

| # | Problème | Solution | Impact | Difficulté | Ticket |
|---|---|---|---|---|---|
| QW1 | Promesse audio de l'accueil : le pas 3 annonce « écoute écran verrouillé », fonction absente du binaire (`app/onboarding.tsx:31-35`) | Remplacer le pas 3 par un gain réel : leçons gardées hors ligne, ou répétiteur | Élevé (revue) | Très faible | HON-01 |
| QW2 | Le champ du répétiteur affiche « Plus de question aujourd'hui » à chaque envoi, parce que `bloque` mélange quota et requête en vol (`repetiteur.tsx:83,201`) | Séparer `epuise` et `enVol` ; placeholder « {tuteur} te répond… » pendant l'envoi | Élevé | Très faible | IA-04 |
| QW3 | Le filtre « Recrutement » des Opportunités est toujours vide (`club/opportunites.tsx:33-37`) | Ajouter la branche manquante | Moyen | Très faible | HON-10 |
| QW4 | Discussions affiche « 0 discussion » avant la lecture, à cause de `valeur ?? []` (`club/discussions.tsx:30`) | `SansDonnees etat` ; `Num` affiché seulement en phase servie | Élevé | Faible | ETA-01 |
| QW5 | Formation → leçon : `push('/lecon')` sans paramètres ouvre la mauvaise leçon (`formation.tsx:170`) | Passer `formationId` et `leconId` | Élevé | Très faible | NAV-01 |
| QW6 | Média → vidéo : `push('/video')` sans paramètres mène à un cul-de-sac (`media.tsx:120`) | Passer les paramètres de la vidéo | Élevé | Faible | NAV-02 |
| QW7 | « Mot de passe oublié » affiche un succès même hors réseau : le catch est avalé (`mot-de-passe.tsx:44-54`) | Distinguer l'échec réseau (« rien n'est parti, réessaie ») de la réponse neutre | Élevé | Faible | CPT-01 |
| QW8 | « Voir ce que le Club coûte » renvoie vers la vente hors application (`club/infos.tsx:95-100`) | Supprimer le bouton | Moyen (revue) | Très faible | HON-08 |
| QW9 | Ligne « widget » au profil et écran widget, fonction inexistante | Retirer la ligne ; mettre `/widget` et `/verrouille` sous garde atelier | Élevé (revue) | Très faible | HON-03 |
| QW10 | La réponse du répétiteur arrive hors de l'écran | `scrollToEnd` à l'envoi et à la réception | Élevé | Très faible | IA-05 |
| QW11 | Média : tag, encart et bouton « Continue écran verrouillé » (`media.tsx:88,127-138`) | Retirer les trois | Élevé (revue) | Très faible | HON-02 |
| QW12 | Profil : « tes réglages sont enregistrés » alors que les interrupteurs sont un `useState(true)` local (`profil.tsx:70,191`) | Corriger la phrase (« ces réglages arrivent ») ou persister | Élevé | Très faible | HON-04 |
| QW13 | Catalogue : « Le widget et la notification, eux, existent » (`cours.tsx:114-117`) | Supprimer la phrase | Élevé | Très faible | HON-05 |
| QW14 | Agenda : le Segmented « Mes inscriptions » est sans effet, `vue` n'est jamais lue (`club/agenda.tsx:35`) | Filtrer sur `vue` | Élevé | Très faible | HON-11 |
| QW15 | Épisode : faux lecteur en pause et 3 contrôles sans action (`episode.tsx:112-170`) | Retirer le lecteur jusqu'à `expo-audio` | Élevé | Très faible | HON-13 |
| QW16 | Mémoire : poubelles rouges désactivées (`memoire.tsx:149-160`) | Les retirer | Moyen | Très faible | HON-14 |
| QW17 | Fil : `budget ?? 0` affiche « 0 FCFA » ; date de session écrite en dur (`club/fil.tsx:204,224`) | « budget non annoncé » ; date lue dans l'agenda ou absente | Élevé | Très faible | HON-15 |
| QW18 | Classement : `+semaine` hors de `Num`, donc sans source datée (`club/classement.tsx:68`) | L'envelopper dans `Num` | Moyen | Très faible | CLUB-11 |
| QW19 | Bloqués : la ligne reste affichée après le déblocage (`club/bloques.tsx:46-51`) | Retrait optimiste de la ligne, avec « Débloqué » sur place | Élevé | Très faible | CLUB-05 |
| QW20 | Leçon en panne sans copie gardée : aucune sortie (`lecon.tsx:119-126`) | `SansDonnees etat={servi}` avec « Réessayer » | Élevé | Très faible | ETA-06 |
| QW21 | Jargon visible : « Firebase », « route », « src/types » (`mot-de-passe.tsx:112`, `video.tsx`) | Réécrire en langage utilisateur | Élevé (revue) | Très faible | COPY-04 |
| QW22 | Vocabulaire de vente : « accès à vie », « gratuit », « payer » (`cours.tsx`, `formation.tsx`, `club.tsx:117`) | Neutraliser (« inclus », « ouvert ») | Élevé (revue) | Faible | COPY-03 |

## Lot B — Qualité perçue (états, feedback, accessibilité)

| # | Problème | Solution | Impact | Difficulté | Ticket |
|---|---|---|---|---|---|
| QW23 | Hub Club : « réservé aux membres » affiché pendant le chargement (`(tabs)/club.tsx:69-74`) | Décider sur `phase`, pas sur l'absence de valeur | Élevé | Très faible | ETA-04 |
| QW24 | Certificats : écran vide pendant le chargement (`certificats.tsx:55`) | `etat` transmis | Moyen | Très faible | ETA-05 |
| QW25 | Opportunités et Agenda : chargement, panne et vide indistincts | `SansDonnees etat` | Élevé | Faible | ETA-02 |
| QW26 | Titres non annoncés comme titres (2 rôles `header` dans toute l'app) | `accessibilityRole="header"` et libellé fusionné dans `Display` | Moyen | Très faible | A11Y-01 |
| QW27 | Les pilules sont lues deux fois par VoiceOver/TalkBack (défaut du lot du 05/10) | Un seul nœud accessible par pilule | Moyen | Très faible | MOT-03 |
| QW28 | « Réduire les animations » lu après le premier écran : la cascade se joue quand même (défaut du lot du 05/10) | Lire la préférence au chargement du module ; `animation: 'none'` sur la pile | Moyen | Faible | MOT-01, MOT-02 |
| QW29 | Parrainage : le code ne se copie pas (`club/parrainage.tsx:81`) | Bouton « Copier » (`expo-clipboard`) + « Copié » 1,4 s sur place | Élevé | Faible | CLUB-04 |
| QW30 | Biométrie : « Face ID » écrit en dur, faux sur iPhone SE et Android (`biometrie.tsx`, `profil.tsx:244`) | Utiliser `capacite.geste` | Moyen | Très faible | ONB-03 |
| QW31 | Suppression de compte : « Content de te revoir » s'affiche après la suppression (`suppression.tsx:75`) | Écran d'adieu sobre | Élevé | Très faible | CPT-08 |
| QW32 | Création de compte : le bouton est désactivé sans explication ; l'erreur dit « six » au lieu de « huit » (`creation.tsx:43,92,138`) | « Encore N caractères » sous le champ ; corriger le nombre | Élevé | Faible | CPT-04, CPT-05 |
| QW33 | Retour Android sur l'accueil : quitte l'app au lieu de reculer d'un pas | `BackHandler` qui recule d'un pas | Moyen | Très faible | NAV-07 |
| QW34 | Titres de leçon tronqués (`lecon.tsx:129`) | `LigneDeTitre` en `deuxLignes` équilibrées | Élevé | Très faible | DS-08 |
| QW35 | Justifications de conception affichées à l'utilisateur (« Pourquoi il n'y a que deux titres », textes de `ChargementEspace`, `hors-connexion`, `video`, `interdit`) | Supprimer ces paragraphes | Moyen | Faible | COPY-01, HON-06 |
| QW36 | « Demande à ton ${tuteur.toLowerCase()} » casse les noms propres de tuteur (`espace.tsx:215-216`) | « Pose ta question à {tuteur} » | Moyen | Très faible | COPY-06 |

## Ordre d'exécution conseillé

1. **Une demi-journée :** QW1, QW8, QW9, QW11 à QW13, QW15, QW16, QW21. Uniquement des retraits : risque de régression nul, et le plus gros gain pour la revue.
2. **Une journée :** QW2 à QW7, QW10, QW14, QW17 à QW20. Logique d'état et de route ; un test unitaire par correction quand le module est pur.
3. **Une journée :** lot B. À relire au lecteur d'écran sur le TECNO et sur un iPhone.

Les 36 quick wins représentent environ **3 jours-personne**. Ils font passer le score estimé de **53 à ≈ 63/100**, principalement sur la crédibilité, l'UX et les états, avant tout travail de motion.
