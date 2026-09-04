---
date: '2026-09-04'
statut: 'bloqué — contenu, pas code'
---

# Le hors-ligne n'a pas de contenu — constat de l'investigation

Le chantier « téléchargements hors connexion + lecture audio en fond » a été ouvert, puis
arrêté avant écriture de code. Ce fichier existe pour que le constat ne soit pas refait.

## Ce que l'application promet

Dix-huit contrôles éteints, un écran entier (`app/telechargements.tsx`), un quota de
stockage, une bascule Wi-Fi, un écran verrouillé de lecteur audio, et un écran
`hors-connexion`. Le README appelle la lecture en fond « l'argument même du virage natif ».

## Ce que le contenu permet — trois niveaux vérifiés

**1 · La vidéo de leçon n'est pas un fichier.** `Lesson.videoUrl` est rendue par le web
dans un `<iframe src={activeLesson.videoUrl}>` (`src/pages/lms/CoursePlayer.tsx:502`).
C'est une intégration, pas un média servi. Rien à télécharger.

**2 · L'audio d'épisode est sur Spotify.** `podcasts.audioUrl` vaut
`episode.external_urls?.spotify` (`worker/apps/api/src/lib/media-sync.ts:230`). Ce n'est
ni notre fichier ni notre droit de le mettre en cache.

**3 · Et le repli n'a pas de contenu non plus.** Le tuyau R2 est À MOITIÉ CONSTRUIT :

| Préfixe | Lecture / signature | Téléversement |
|---|---|---|
| `courses/` | oui — `mediaToken.ts:19,48` | **AUCUN** |
| `certificates/` | oui — `mediaToken.ts:22,42` | **AUCUN** |
| `club_media/` | oui | oui (`FOLDER_RULES`, AV 100 Mo) |
| `avatars/`, `uploads/`, `club_events/`, `club_sessions/` | oui | oui (images) |

`FOLDER_RULES` (`worker/apps/media/src/index.ts:61`) est la seule porte d'écriture, et elle
ne connaît ni `courses/` ni `certificates/`. Par ailleurs `issueCertificate` n'écrit qu'un
document Firestore — **aucun PDF n'est généré**.

## Ce qui débloquerait, et ce n'est pas du code d'application

Une décision d'hébergement, puis une chaîne :

1. décider où vivent les vidéos de cours (R2 ? un hébergeur vidéo avec URL signée ?) ;
2. ouvrir une règle d'écriture `courses/` et un chemin de dépôt côté admin ;
3. donner une CLÉ R2 — et une TAILLE EN OCTETS — aux vues `appLecon` / `appMedia`. Le
   modèle n'a aujourd'hui que des tailles pré-formatées en chaînes (« 12 Mo »), jamais un
   nombre ;
4. alors seulement, le gestionnaire de téléchargements a un objet.

Le coût de stockage et d'encodage se décide avant l'étape 1, et il n'est pas technique.

## En attendant

Les dix-huit contrôles restent ÉTEINTS, ce qui est la position honnête : ils annoncent une
capacité que la plateforme ne peut pas encore rendre. Leur libellé promet toutefois un poids
(« Télécharger · 12 Mo ») qu'aucune donnée ne produit — à revoir si le chantier tarde.
