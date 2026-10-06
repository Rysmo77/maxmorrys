# Backlog UI/UX mobile — Rysmo

> Tiré de [`AUDIT_UI_UX_MOBILE_COMPLET.md`](AUDIT_UI_UX_MOBILE_COMPLET.md). Chemins relatifs à `mobile/`. **Effort** : S (< ½ jour) · M (½ à 2 jours) · L (> 2 jours). **Priorité** : P1 critique (avant soumission) · P2 important · P3 motion/interactivité · P4 optimisation · P5 long terme.
> Import : une ligne = un ticket ; colonnes `ID`, `Titre`, `Épopée`, `Gravité`, `Effort`, `Priorité`, `Critère d'acceptation` ; étiquettes suggérées : `ux`, `ui`, `a11y`, `motion`, `copy`, `store-review`, `ia`, `club`.

## Épopées

| Code | Épopée | Objectif |
|---|---|---|
| HON | Honnêteté de l'interface | Plus aucune promesse de fonction inexistante |
| IA | Répétiteur | Une IA lisible, vivante, sans vente |
| ETA | États | Chargement, panne, vide, verrouillé : toujours distincts |
| NAV | Navigation | Aucun cul-de-sac, retours justes |
| ONB | Accueil | 3 écrans jusqu'à la valeur |
| CPT | Compte et formulaires | Formulaires natifs, clavier, erreurs justes |
| CLUB | Club | Club fiable et actionnable |
| FBK | Retours d'action | Confirmations sur place, feuilles, haptique |
| A11Y | Accessibilité | ≥ 75/100 |
| MOT | Motion | Grammaire du kit complète |
| DS | Design system | Typographie, espacement, élévation systématisés |
| PERF | Performance perçue | Données qui restent, listes fluides |
| RESP | Responsive | 320 dp à tablette, police 200 % |
| COPY | Contenu | Ton neutre, sans jargon ni justification de conception |

## Tickets

### HON — Honnêteté de l'interface

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| HON-01 | Remplacer la promesse « ÉCOUTE ÉCRAN VERROUILLÉ » de l'accueil | `app/onboarding.tsx:31-35` | Critique | S | P1 | Le pas 3 décrit une fonction disponible dans le binaire |
| HON-02 | Retirer tag, encart et bouton « écran verrouillé » | `app/media.tsx:88,127-138` | Critique | S | P1 | Aucune mention d'écoute sur écran verrouillé tant qu'`expo-audio` n'est pas livré |
| HON-03 | Retirer la ligne widget du profil ; `/widget` et `/verrouille` sous garde atelier | `app/(tabs)/profil.tsx`, `app/widget.tsx`, `app/verrouille.tsx` | Élevée | S | P1 | Écrans inatteignables en production |
| HON-04 | Notifications : persister les 3 interrupteurs ou corriger « enregistrés » | `app/(tabs)/profil.tsx:70,94-95,191` | Élevée | S | P1 | Le texte décrit exactement le comportement |
| HON-05 | Supprimer « Le widget et la notification, eux, existent » | `app/(tabs)/cours.tsx:114-117` | Élevée | S | P1 | Phrase absente |
| HON-06 | « Pourquoi il n'y a que deux titres » : conditionner au compte réel | `app/(tabs)/cours.tsx:209-214` | Élevée | S | P1 | Aucun nombre écrit en dur à côté d'un nombre compté |
| HON-07 | Aligner les promesses des verrous du Club sur les écrans réels (digest, annuaire, seconde vue, partages) | `contenu/verrous.ts` | Élevée | S | P1 | Chaque promesse du verrou existe côté membre |
| HON-08 | Supprimer « Voir ce que le Club coûte » | `app/club/infos.tsx:95-100` | Élevée | S | P1 | Bouton absent |
| HON-09 | Présence : retirer le questionnaire factice ou rendre la recommandation dépendante de la réponse ; corriger « part sur WhatsApp » | `app/presence.tsx:99-121,187` | Élevée | S | P1 | Aucune interaction sans effet |
| HON-10 | Filtre « Recrutement » toujours vide | `app/club/opportunites.tsx:33-37` | Élevée | S | P1 | Le filtre renvoie les offres de type Recrutement |
| HON-11 | Segmented de l'Agenda sans effet | `app/club/agenda.tsx:35,91-97` | Élevée | S | P1 | « Mes inscriptions » ne montre que les sessions réservées |
| HON-12 | Signalement : demander réellement le motif promis | `app/club/membre.tsx:71` | Élevée | M | P1 | Étape « Tu veux dire pourquoi ? » facultative après envoi |
| HON-13 | Épisode : retirer le faux lecteur en état « pause » et les 3 contrôles morts | `app/episode.tsx:88,112-170` | Élevée | S | P1 | Aucun contrôle sans action |
| HON-14 | Mémoire : retirer les poubelles désactivées rouges | `app/memoire.tsx:149-160` | Élevée | S | P1 | Aucune affordance morte |
| HON-15 | Fil : budget `?? 0` et date de session en dur | `app/club/fil.tsx:204,224` | Élevée | S | P1 | « budget non annoncé » ; date issue de l'agenda ou absente |
| HON-16 | Erreur : motif par défaut inventé et « 0 Mo » de démo | `app/erreur.tsx:69,74,96-97` | Élevée | S | P1 | Motif générique, aucune donnée de démo en production |
| HON-17 | Formation : « Aperçu · 4 min gratuit » en dur | `app/formation.tsx:106` | Élevée | S | P1 | Durée servie ou absente ; pas de « gratuit » |
| HON-18 | Certificat : célébration rejouée à chaque session | `app/certificat.tsx:40,154` | Moyenne | S | P2 | Persistée par code ; titre neutre ensuite |

### IA — Répétiteur

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| IA-01 | Canal `app` : aucun prix, aucun « achat » dans les réponses | `worker/apps/api/src/handlers/rysmo.ts:101-131`, `donnees/index.ts` | Critique | M | P1 | 20 questions de test : 0 montant, 0 « achat », 0 lien de vente |
| IA-02 | Rendre les réponses (Markdown) via `TexteDeLecon` ; liens internes vers les écrans | `ds/ChatBubble.tsx`, `app/(tabs)/repetiteur.tsx` | Critique | S | P1 | Aucun crochet ni astérisque visible |
| IA-03 | Indicateur de réflexion « onde » (3 barres) | `app/(tabs)/repetiteur.tsx` | Élevée | S | P1 | Visible après 220 ms d'attente ; spécification motion § 7 |
| IA-04 | Séparer `epuise` et `enVol` ; placeholder « {tuteur} te répond… » | `repetiteur.tsx:83,201` | Élevée | S | P1 | « Plus de question » n'apparaît qu'à quota épuisé |
| IA-05 | Défilement automatique à l'envoi et à la réponse | `repetiteur.tsx:152` | Élevée | S | P1 | La réponse est toujours visible à son arrivée |
| IA-06 | Premier usage : bulle d'accueil + 3 suggestions | `repetiteur.tsx:159-163` | Élevée | S | P2 | Plus de « ne l'interroge pas encore » |
| IA-07 | Quota épuisé : « reviennent à minuit » + sorties (sans vente) | `repetiteur.tsx:201` | Élevée | S | P2 | Encart à la place de la saisie |
| IA-08 | `QuotaMeter` : barre continue au-delà de 10 | `ds/QuotaMeter.tsx:27-32` | Élevée | S | P2 | Pas de débordement à 100/jour |
| IA-09 | Quota : segment réservé à l'envoi, allumé à la réponse | `QuotaMeter`, `repetiteur.tsx:100` | Moyenne | S | P3 | Opacité 0,5 → 1 en 220 ms |
| IA-10 | Libellé « Il te reste N questions aujourd'hui (sur M) » | `repetiteur.tsx:143` | Moyenne | S | P2 | Plus de « 2 / 2 » ambigu |
| IA-11 | Réponses copiables (appui long + « Copié » 1,4 s) | `ds/ChatBubble.tsx` | Moyenne | S | P3 | Copie possible, confirmation sur place |
| IA-12 | Annonces lecteur d'écran : locuteur + réponse arrivée | `ds/ChatBubble.tsx` | Élevée | S | P2 | VoiceOver/TalkBack annoncent la réponse |
| IA-13 | Consentement mémoire : interrupteur dans `/memoire` | `app/memoire.tsx` | Moyenne | M | P2 | L'état opt-in est visible et modifiable |
| IA-14 | Nom du tuteur persisté ; saisie sans `trim` à chaque frappe | `ds/tutor.ts`, `app/memoire.tsx`, `profil.tsx:224` | Élevée | M | P2 | « Mon Coach » possible ; survit au redémarrage |
| IA-15 | Bandeau hors ligne sur le répétiteur | `repetiteur.tsx` | Moyenne | S | P2 | Bandeau présent comme sur Leçon/Notes |
| IA-16 | Glyphe d'onde au repos dans l'en-tête et la carte de l'Espace | `repetiteur.tsx`, `espace.tsx` | Faible | S | P3 | Signature visuelle cohérente |

### ETA — États

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| ETA-01 | Discussions : « 0 discussion » avant lecture | `app/club/discussions.tsx:30-54` | Critique | S | P1 | `Num` seulement en phase servie ; squelette sinon |
| ETA-02 | Opportunités, Agenda : chargement/panne/vide | `club/opportunites.tsx`, `club/agenda.tsx` | Élevée | S | P1 | `SansDonnees etat` |
| ETA-03 | Classement, Membre : chargement présenté comme « non interrogé » | `club/classement.tsx`, `club/membre.tsx` | Élevée | S | P1 | `etat` transmis |
| ETA-04 | Hub Club : « réservé aux membres » pendant chargement/panne | `app/(tabs)/club.tsx:69-74` | Élevée | S | P1 | Décision sur `phase` |
| ETA-05 | Certificats : vide pendant chargement/panne | `app/certificats.tsx:55` | Élevée | S | P1 | idem |
| ETA-06 | Leçon : panne sans copie → « Réessayer » | `app/lecon.tsx:119-126` | Élevée | S | P1 | `etat={servi}` |
| ETA-07 | Mémoire, Téléchargements : états de chargement | `app/memoire.tsx`, `app/telechargements.tsx` | Moyenne | S | P2 | Plus de clignotement « Rien de gardé » |
| ETA-08 | Catalogue, Formation : titre qui affirme une absence pendant le chargement | `cours.tsx:119-122`, `formation.tsx:112` | Moyenne | S | P2 | Titre neutre en phase charge |
| ETA-09 | Hors connexion : état réseau indéterminé distinct | `app/hors-connexion.tsx:44-53` | Moyenne | S | P2 | « Vérification du réseau… » |
| ETA-10 | Espace : squelette au bon territoire et bonnes hauteurs ; fondu squelette → contenu | `ecrans/ChargementEspace.tsx` | Moyenne | S | P2 | Aucune teinte ni hauteur qui saute |
| ETA-11 | Garde de CI : tout `SansDonnees` reçoit `etat` | `tests/unit/` | Moyenne | S | P2 | Test rouge si oubli |

### NAV — Navigation

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| NAV-01 | Formation → leçon : passer `formationId` et `leconId` | `app/formation.tsx:170` | Élevée | S | P1 | La leçon ouverte appartient à la formation affichée |
| NAV-02 | Média → Vidéo : passer les paramètres | `app/media.tsx:120` | Critique | S | P1 | La vidéo se lance |
| NAV-03 | Quiz/mission : « Ouvrir sur le site » | `app/lecon.tsx:159-162` | Élevée | S | P1 | Lien fonctionnel |
| NAV-04 | Erreur → leçon : paramètres ; `+not-found` → `/espace` | `app/erreur.tsx:93`, `app/+not-found.tsx:29` | Moyenne | S | P2 | Aucun rejeu du lancement |
| NAV-05 | Leçon : remonter en haut à Précédente/Suivante | `app/lecon.tsx:198-199` | Moyenne | M | P2 | `scrollTo({y:0})` |
| NAV-06 | Libellés de retour justes (« Retour » générique quand l'origine varie) | Leçon, Téléchargements, Légal, Erreur | Faible | S | P2 | Aucun libellé faux |
| NAV-07 | Accueil : `BackHandler` qui recule d'un pas | `app/onboarding.tsx` | Moyenne | S | P2 | Le retour Android ne quitte plus l'app |
| NAV-08 | Après blocage : `dismissTo` + relecture du fil | `app/club/membre.tsx:98` | Élevée | S | P1 | La personne bloquée n'apparaît plus au retour |

### PAY — Retour de paiement

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| PAY-01 | Attendre la restauration de session ; chemin anonyme vers la connexion | `app/acces.tsx`, `donnees/index.ts` (`useAcces`) | Élevée | M | P1 | Démarrage à froid via `rysmo://acces` : pas de « session expirée » |
| PAY-02 | Relecture tolérante aux pannes + « Réessayer » + « Vérifier à nouveau » après abandon | idem | Élevée | S | P1 | Une coupure ne fige pas l'écran |
| PAY-03 | Transition attente → ouvert : anneaux qui s'éteignent, coche `rv-s`, haptique | `app/acces.tsx` | Moyenne | S | P3 | Spécification motion |

### ONB — Accueil

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| ONB-01 | Chaîne : accueil → choix (créer / connexion / regarder d'abord) | `onboarding.tsx`, `permissions.tsx` | Élevée | M | P2 | 3 écrans jusqu'à la valeur |
| ONB-02 | Biométrie proposée après la 1ʳᵉ connexion seulement | `biometrie.tsx`, `connexion.tsx`, `creation.tsx`, `BoutonGoogle.tsx` | Élevée | S | P2 | Jamais en anonyme |
| ONB-03 | `capacite.geste` au lieu de « Face ID » en dur | `biometrie.tsx`, `profil.tsx:244` | Moyenne | S | P2 | « Touch ID » sur iPhone SE |
| ONB-04 | Un glyphe par pas, transition entre pas, balayage | `onboarding.tsx` | Moyenne | M | P3 | Spécification motion |
| ONB-05 | Lancement : entrée du mot-symbole, fondu du splash | `lancement.tsx` | Moyenne | S | P3 | `rv-s` 380 ms ; fondu 220 ms |
| ONB-06 | Biométrie : confirmation de succès | `biometrie.tsx:38-41` | Moyenne | S | P3 | Coche + « C'est posé » + haptique |

### CPT — Compte et formulaires

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| CPT-01 | Mot de passe oublié : distinguer l'échec réseau | `app/mot-de-passe.tsx:44-54` | Élevée | S | P1 | Hors réseau : « rien n'est parti » |
| CPT-02 | `Screen` gère le clavier | `ds/Screen.tsx` | Élevée | M | P2 | Bouton d'envoi visible clavier ouvert (iOS, Android bord-à-bord) |
| CPT-03 | `Field` v2 (ref, autoComplete, returnKeyType, autoFocus, focus visible, erreur annoncée) | `ds/Field.tsx` | Moyenne | M | P2 | Chaînage « suivant », remplissage auto |
| CPT-04 | Création : dire pourquoi le bouton est désactivé | `app/creation.tsx:43,138` | Élevée | S | P2 | « Encore N caractères » |
| CPT-05 | Création : erreurs par champ ; « six » → « huit » | `creation.tsx:92`, `donnees/identite.ts:66` | Moyenne | S | P2 | Erreur sous le bon champ |
| CPT-06 | Création : œil afficher/masquer ; `newPassword` | `creation.tsx:85-93` | Moyenne | S | P2 | Mot de passe fort iOS proposé |
| CPT-07 | Connexion : inscription remontée ; aide au 2ᵉ échec ; `eye-off` | `app/connexion.tsx` | Moyenne | S | P2 | — |
| CPT-08 | Suppression : écran d'adieu | `app/suppression.tsx:75` | Élevée | S | P2 | Plus de « Content de te revoir » |
| CPT-09 | Suppression : aide neutre, liste réelle, masquée hors session | `suppression.tsx:7,39-41,153` | Moyenne | M | P2 | — |
| CPT-10 | Profil : « Modifier » et lignes de compte selon la session | `profil.tsx:39-43,140` | Élevée | S | P2 | Aucun lien trompeur |
| CPT-11 | Verrou : reverrouiller après 5 min en arrière-plan ; voile à `inactive` | `app/_layout.tsx`, `donnees/verrou.ts` | Moyenne | M | P2 | Aperçu masqué dans le sélecteur |

### CLUB — Club

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| CLUB-01 | Bande : `scrollTo` vers l'onglet actif ; débord ; cadenas | `club/_layout.tsx`, `ds/ChipRow.tsx` | Élevée | S | P2 | Onglet actif visible à 360 dp |
| CLUB-02 | Bande : fondu 180 ms au lieu du glissé | `club/_layout.tsx:36` | Moyenne | S | P2 | — |
| CLUB-03 | Barre d'onglets présente dans le Club (pile sous `(tabs)/club`) | `app/club/*` | Moyenne | L | P4 | Kit respecté |
| CLUB-04 | Parrainage : bouton « Copier » (`expo-clipboard`) | `club/parrainage.tsx:81` | Élevée | S | P2 | « Copié » 1,4 s |
| CLUB-05 | Bloqués : retirer la ligne après déblocage | `club/bloques.tsx:46-51` | Élevée | S | P1 | — |
| CLUB-06 | Fil : publier en feuille (FAB Android / action haute iOS), catégories, file hors ligne | `club/fil.tsx`, `donnees/index.ts` | Élevée | M | P3 | Spécification motion |
| CLUB-07 | Discussions : poser une question ; auteur touchable (signalement) | `club/discussions.tsx` | Élevée | M | P2 | Exigence 1.2 couverte |
| CLUB-08 | Fil : retirer la seconde rangée de puces | `club/fil.tsx:66-74` | Moyenne | S | P2 | — |
| CLUB-09 | Agenda : état optimiste partout ; désinscription confirmée ; texte selon le type | `club/agenda.tsx` | Élevée | S | P1 | — |
| CLUB-10 | Opportunités : « Postuler » remplacé par une action réelle | `club/opportunites.tsx:90` | Élevée | S | P2 | Aucun bouton mort |
| CLUB-11 | Classement : `+semaine` dans `Num` | `club/classement.tsx:68` | Élevée | S | P1 | — |
| CLUB-12 | Bilan compact en tête du Fil/Opportunités | `club/_layout.tsx` | Moyenne | M | P3 | Premier message visible sans défiler |
| CLUB-13 | Verrou : date de relevé + sortie « le podcast est gratuit » | `club/_layout.tsx` | Moyenne | S | P2 | — |
| CLUB-14 | Cœur du fil : réaction réelle ou couleur neutre | `club/fil.tsx:168-184` | Moyenne | M | P3 | — |
| CLUB-15 | `useVue` : relire après écriture sur l'écran ouvert | `donnees/vue.ts`, `donnees/cache.ts` | Élevée | M | P2 | Écrans à jour sans démontage |

### FBK — Retours d'action

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| FBK-01 | Composant `Bandeau` ; remplacer ~22 `Alert` de succès/erreur | global | Élevée | M | P2 | ≤ 10 `Alert` (confirmations destructives seulement) |
| FBK-02 | `useConfirmation` + prop `confirmation` de `Button` | `ds/` | Élevée | S | P2 | « Copié », « Débloqué », « Place réservée » |
| FBK-03 | Composant `Feuille` | `ds/` | Élevée | M | P3 | 300 ms, voile 30 %, geste, clavier, a11y |
| FBK-04 | Module `haptique` (`expo-haptics`) | `ds/` | Moyenne | S | P3 | Sélection, succès, erreur, attention |
| FBK-05 | Ton `danger` pour les boutons destructifs | `ds/Button.tsx` | Faible | S | P2 | — |
| FBK-06 | Leçon terminée : moment de fin (coche visible, barre, « Suivante ») | `app/lecon.tsx` | Moyenne | S | P3 | — |
| FBK-07 | Garder/retirer une leçon : confirmation et annulation | `lecon.tsx`, `telechargements.tsx` | Moyenne | S | P3 | Annulation 4 s |
| FBK-08 | File hors ligne : marqueur horloge → coche par geste | Notes, Hors connexion, Fil | Moyenne | M | P3 | Modèle WhatsApp |

### A11Y — Accessibilité

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| A11Y-01 | `Display` : rôle `header`, libellé fusionné | `ds/Type.tsx` | Élevée | S | P2 | Navigation par titres possible |
| A11Y-02 | Régions vivantes : erreurs, réponses IA, bandeau, accusés | global | Élevée | M | P2 | Annonces vérifiées VoiceOver/TalkBack |
| A11Y-03 | Contrastes sombres (bulle « moi », avatar, interrupteur, *digitalise*, tag ok, bordure de pilule) | jetons, composants | Élevée | S | P2 | ≥ 4,5 (texte) / 3 (non-texte) |
| A11Y-04 | Cibles ≥ 44 pt (Switch, Segmented, Pipeline, ChipRow, Button sm, auteur du fil) | `ds/` | Moyenne | S | P2 | — |
| A11Y-05 | Plancher 11,5 / 12 pt | global | Moyenne | M | P2 | 0 texte < 11,5 pt |
| A11Y-06 | `maxFontSizeMultiplier` par rôle ; `minHeight` | `ds/` | Moyenne | M | P2 | Lisible à 200 % |
| A11Y-07 | États : lignes de leçon, radios `checked`, `tablist` | `LessonRow`, `PayOption`, `ChipRow`, `Segmented` | Moyenne | S | P2 | — |
| A11Y-08 | Squelettes : une annonce par groupe | `ds/Skeleton.tsx` | Faible | S | P3 | — |
| A11Y-09 | Avatars décoratifs ; bulles avec locuteur | `ds/Avatar.tsx`, `ds/ChatBubble.tsx` | Moyenne | S | P2 | — |
| A11Y-10 | « Réduire la transparence » (iOS) | `ds/Surface.tsx` | Faible | S | P4 | Surfaces denses |

### MOT — Motion

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| MOT-01 | Préférence « réduire » lue au chargement du module | `ds/mouvement.ts` | Moyenne | S | P2 | Premier écran sans cascade si réduit |
| MOT-02 | Pile : `animation: 'none'` si réduit | `app/_layout.tsx`, `app/club/_layout.tsx` | Moyenne | S | P2 | — |
| MOT-03 | Pilules lues une fois | `ds/ChipRow.tsx` | Moyenne | S | P2 | — |
| MOT-04 | `rv-s` pour les objets-héros | `ds/Screen.tsx` | Faible | S | P3 | — |
| MOT-05 | Pilule et Segmented qui glissent ; liste en fondu 180 ms | `ds/ChipRow.tsx`, `ds/Segmented.tsx` | Moyenne | S | P3 | — |
| MOT-06 | Icône d'onglet à la couleur du territoire (220 ms) ; pilule M3 Android | `app/(tabs)/_layout.tsx` | Moyenne | M | P3 | — |
| MOT-07 | Transition de détail 260 ms ; maillage remonté à la racine | `app/_layout.tsx`, `ds/Screen.tsx` | Moyenne | M | P3 | Le maillage ne bouge pas en entrant dans un détail |
| MOT-08 | Changement de territoire 500 ms | idem | Faible | M | P4 | — |
| MOT-09 | Squelette à pulsation partagée | `ds/Skeleton.tsx` | Faible | S | P3 | — |
| MOT-10 | Interrupteur au dégradé du kit | `ds/Switch.tsx` | Faible | S | P3 | — |
| MOT-11 | Appareil modeste : ≤ 3 Go ou ≤ 4 cœurs ; cascade en fondu | `ds/mouvement.ts` | Moyenne | S | P3 | — |
| MOT-12 | Brillance du certificat au rythme du kit | `app/certificat.tsx:85-92` | Faible | S | P3 | 1 320 + 1 080 ms |
| MOT-13 | Plafond de cascade (6) ; titre et cascade simultanés | `ds/Pressoir.tsx`, `ds/Screen.tsx` | Faible | S | P3 | ≤ 800 ms de mouvement |
| MOT-14 | Profilage GPU sur TECNO / itel | — | Moyenne | M | P3 | Rapport chiffré |

### DS — Design system

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| DS-01 | Graisses iOS : familles par graisse ; supprimer `useFonts` | `ds/Fontes.ts` | Élevée | M | P2 | 600/700 visibles sur iPhone |
| DS-02 | Primitive `<Texte variant>` + codemod | `ds/`, `app/` | Élevée | L | P4 | 0 `fontSize` numérique dans `app/` |
| DS-03 | `<Pile>`, `<Rangee>`, `<Section>` + échelle 4/8 | `ds/` | Moyenne | L | P4 | Marges libres < 50 |
| DS-04 | Élévations `e0`–`e3` générées | `scripts/ds-tokens.mjs` | Faible | S | P4 | — |
| DS-05 | Teintes fixes du maillage sombre ; `onViolet` ; `danger` | `scripts/ds-tokens.mjs` | Moyenne | S | P2 | — |
| DS-06 | `Surface` lit les jetons | `ds/Surface.tsx` | Faible | S | P4 | 0 rgba en dur |
| DS-07 | `Display` : style sur le bloc, pas chaque ligne | `ds/Type.tsx` | Moyenne | S | P2 | Interligne régulier |
| DS-08 | Leçon : titre sur deux lignes équilibrées (`deuxLignes`) | `app/lecon.tsx:129` | Élevée | S | P1 | Aucun titre de leçon tronqué |
| DS-09 | Gardes de CI (fontSize, textFaint, SansDonnees, Alert de succès) | `tests/unit/` | Moyenne | M | P4 | — |
| DS-10 | Commentaires périmés (Mesh, ProgressBar, _layout) | `ds/` | Faible | S | P4 | — |

### PERF — Performance perçue

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| PERF-01 | Afficher le cache pendant la relecture (stale-while-revalidate) | `donnees/vue.ts`, `donnees/cache.ts` | Élevée | M | P2 | Plus de squelette au retour sur un écran |
| PERF-02 | Persister le cache des vues au démarrage à froid | idem | Moyenne | M | P4 | Espace visible avant le réseau |
| PERF-03 | Tirer pour rafraîchir (`Screen onRefresh`, `Liste`) | `ds/Screen.tsx` | Moyenne | S | P2 | — |
| PERF-04 | Listes virtualisées (fil, notes, discussions, certificats) | `ds/Liste` | Moyenne | M | P4 | — |
| PERF-05 | `expo-linear-gradient` à la place du SVG mesuré | `ds/Gradient.tsx` | Faible | S | P4 | Plus d'image d'aplat |
| PERF-06 | Boucles du maillage suspendues hors focus | `ds/Mesh.tsx` | Moyenne | S | P3 | ≤ 1 maillage animé à la fois |

### RESP — Responsive

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| RESP-01 | Segmented et libellés de bouton à 320/360 dp | `ds/Segmented.tsx`, `ds/Button.tsx` | Moyenne | S | P2 | Aucune coupure |
| RESP-02 | Colonne max 600 dp ; exclure les tablettes Android du Play Store en attendant | `ds/Screen.tsx`, fiche Play | Moyenne | S | P3 | — |
| RESP-03 | Paysage pour le lecteur vidéo | `expo-screen-orientation` | Faible | M | P5 | — |
| RESP-04 | Barre d'onglets : rembourrage bas compté une fois ; `tabbar` retiré des écrans de pile | `ds/Screen.tsx`, 4 écrans | Moyenne | S | P2 | — |

### COPY — Contenu

| ID | Titre | Écran / fichier | Gravité | Effort | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|
| COPY-01 | Retirer les justifications de conception affichées | `ChargementEspace.tsx:62-67`, `hors-connexion.tsx:132-138`, `video.tsx:179-182`, `certificats.tsx:112-114`, `creation.tsx:152-158`, `interdit.tsx:64-71` | Moyenne | S | P2 | 0 phrase « pour développeur » |
| COPY-02 | Ton neutre (« arrêtée », « inscrite », « Toi seule », « Elle », « comparée ») | global | Moyenne | S | P2 | Relecture complète |
| COPY-03 | Vocabulaire de vente (« accès à vie », « gratuit », « payer », « sortir de l'application ») | `cours.tsx`, `formation.tsx`, `club.tsx:117`, `media.tsx` | Élevée | S | P1 | Relecture `mobile-store-achats` étendue |
| COPY-04 | Jargon (« Firebase », « route », « src/types ») | `mot-de-passe.tsx:112`, `video.tsx` | Élevée | S | P1 | — |
| COPY-05 | Microcopy des boutons (« Créer mon compte », « Lien envoyé », « Place réservée »…) | voir audit | Faible | S | P2 | — |
| COPY-06 | « Demande à ton ${tuteur.toLowerCase()} » | `espace.tsx:215-216` | Moyenne | S | P2 | « Pose ta question à {tuteur} » |
