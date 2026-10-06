# Roadmap UI/UX mobile — Rysmo (30 / 60 / 90 jours)

> Point de départ : 05/10/2026, note globale **53/100** ([rapport](AUDIT_UI_UX_MOBILE_COMPLET.md)). Les identifiants renvoient au [backlog](BACKLOG_UI_UX_MOBILE.md). Hypothèse de capacité : **1 développeur·se RN à temps plein + ½ design**. Les jalons sont des portes : on ne passe pas à la suivante tant que ses critères de sortie ne sont pas remplis.

## Vue d'ensemble

| Fenêtre | Thème | Priorités | Note visée | Jalon |
|---|---|---|---|---|
| J0 → J30 | **Honnête et sans cul-de-sac** | P1 + quick wins | ≈ 66 | Soumission Play Store (test fermé → production) |
| J31 → J60 | **Fiable et accessible** | P2 + début P3 | ≈ 74 | Accessibilité ≥ 70, 0 `Alert` de succès |
| J61 → J90 | **Fluide et premium** | P3 + P4 | ≈ 80 | Motion du kit complète, perf vérifiée sur bas de gamme |
| Au-delà | Vision | P5 | — | iOS, audio, notifications, widget |

---

## J0 → J30 — Honnête et sans cul-de-sac

**Pourquoi d'abord :** l'app promet des fonctions qu'elle n'a pas (écran verrouillé, widget, notifications), son répétiteur cite des prix en contradiction avec la règle « l'app ne vend rien », et plusieurs écrans affirment « 0 » avant d'avoir lu. Chacun de ces défauts suffit à un refus en revue, ou à une perte de confiance dès la première session.

| Semaine | Contenu | Tickets |
|---|---|---|
| S1 | Les 36 quick wins (≈ 3 jours) ; garde de CI « `SansDonnees` reçoit `etat` » | QW1–QW36, ETA-11 |
| S2 | Répétiteur : canal `app` côté Worker (aucun prix, aucun achat), rendu Markdown, **onde de réflexion**, premier usage, quota épuisé | IA-01, IA-02, IA-03, IA-06, IA-07, IA-08, IA-10 |
| S3 | États restants ; retour de paiement à froid ; quiz → site ; signalement avec motif ; agenda optimiste ; relecture après blocage | ETA-03, ETA-07, ETA-08, PAY-01, PAY-02, NAV-03, NAV-08, HON-07, HON-09, HON-12, CLUB-09 |
| S4 | Relecture de toute la copie (ton, jargon, vente) ; recette complète sur TECNO et sur un émulateur Android 10 ; build `release-candidate` | COPY-02, COPY-05, HON-16, HON-17 |

**Critères de sortie J30**
- 0 promesse de fonction absente (relecture écran par écran, avec captures).
- 20 questions de test au répétiteur : 0 montant, 0 « achat », 0 lien de vente ; Markdown jamais visible brut.
- Chaque écran à données montre trois rendus distincts (chargement, panne, vide), vérifiés en mode avion.
- Tous les parcours de la carte (rapport § 5.2) se terminent sans cul-de-sac, y compris le démarrage à froid via `rysmo://acces`.
- `npm test`, `ds:check`, `proof:check` verts.

---

## J31 → J60 — Fiable et accessible

**Pourquoi ensuite :** une fois l'app honnête, il faut qu'elle soit sûre au toucher. Les formulaires se battent avec le clavier, 32 `Alert` interrompent l'utilisateur pour des succès, l'accessibilité est à 38, et l'accueil impose 5 écrans avant toute valeur.

| Semaine | Contenu | Tickets |
|---|---|---|
| S5 | Composants socle : `Bandeau`, `useConfirmation`, ton `danger` ; remplacement des ~22 `Alert` de succès/erreur | FBK-01, FBK-02, FBK-05 |
| S6 | Formulaires : `Screen` gère le clavier, `Field` v2, création et connexion explicatives ; verrou en arrière-plan | CPT-02 à CPT-07, CPT-09 à CPT-11 |
| S7 | Accueil en 3 écrans ; biométrie après la 1ʳᵉ connexion ; retour Android | ONB-01, ONB-02, NAV-04 à NAV-06 |
| S8 | Accessibilité : régions vivantes, contrastes sombres, cibles 44 pt, plancher typographique, plafonds de police ; graisses iOS | A11Y-02 à A11Y-07, A11Y-09, DS-01, DS-05, DS-07, RESP-01, RESP-04 |
| S8 | Club : bande d'onglets lisible, poser une question, relecture après écriture ; données qui restent pendant la relecture | CLUB-01, CLUB-02, CLUB-07, CLUB-08, CLUB-10, CLUB-13, CLUB-15, PERF-01, PERF-03 |

**Critères de sortie J60**
- ≤ 10 `Alert` dans `app/`, toutes des confirmations destructives.
- Parcours complet au lecteur d'écran (TalkBack sur TECNO, VoiceOver sur iPhone) : titres navigables, erreurs et réponses IA annoncées.
- Police système à 200 % : aucun texte coupé sur les 10 écrans principaux.
- Contrastes mesurés ≥ 4,5 (texte) et ≥ 3 (non-texte) en clair et en sombre.
- De l'installation à la première leçon ouverte : ≤ 3 écrans.

---

## J61 → J90 — Fluide et premium

**Pourquoi en dernier :** le mouvement amplifie ce qui existe. Animer des états faux les rendrait plus convaincants, pas plus justes. Une fois les fondations saines, ce lot apporte la sensation premium : feuilles du bas, haptique, transitions continues, micro-confirmations. Le tout dans la grammaire du kit (tap 120 · ui 220 · enter 380 · scene 700 ms), sans toast, confettis ni compteur qui défile ([motion](MOTION_DESIGN_RECOMMANDATIONS.md)).

| Semaine | Contenu | Tickets |
|---|---|---|
| S9 | `Feuille` (300 ms, voile 30 %, geste, clavier) ; publier, signaler, filtres et agenda en feuille ; haptique | FBK-03, FBK-04, CLUB-06, CLUB-14 |
| S10 | Micro-interactions : pilule et Segmented qui glissent, quota réservé à l'envoi, « Copié », fin de leçon, garder/retirer avec annulation, file hors ligne | MOT-05, IA-09, IA-11, FBK-06 à FBK-08, PAY-03, ONB-04 à ONB-06 |
| S11 | Transitions : détail 260 ms, maillage remonté à la racine, icône d'onglet au territoire, `rv-s` des objets-héros, squelette à pulsation partagée, plafond de cascade | MOT-04, MOT-06, MOT-07, MOT-09, MOT-10, MOT-12, MOT-13, ETA-10, IA-16 |
| S12 | Performance : appareil modeste élargi, maillage suspendu hors focus, profilage GPU sur TECNO/itel ; cache persistant ; listes virtualisées | MOT-11, MOT-14, PERF-02, PERF-04 à PERF-06 |
| S12 | Systématisation (en continu dès S9) : `<Texte>`, `<Pile>`, élévations, gardes de CI | DS-02 à DS-04, DS-06, DS-09, DS-10 |

**Critères de sortie J90**
- 60 i/s soutenus sur TECNO pendant les transitions de pile et l'ouverture d'une feuille (profilage GPU joint au ticket MOT-14).
- Chaque action qui écrit donne une confirmation sur place en moins de 220 ms, sans boîte modale.
- « Réduire les animations » coupe toute cascade, toute boucle et les transitions de pile.
- 0 `fontSize` numérique dans `app/` (garde de CI).
- Note globale réévaluée ≥ 78.

---

## Au-delà de J90 — Vision

| Thème | Condition préalable | Tickets |
|---|---|---|
| Lecture audio réelle (`expo-audio`), **puis seulement** l'écoute écran verrouillé | Droit d'audio en arrière-plan justifié | — |
| Notifications utiles (rappel du soir, réponse du Club), permission demandée en contexte | Backend d'envoi (Worker `scheduled`) | HON-04 (version persistée) |
| iOS : « Se connecter avec Apple » + publication | Règle 4.8 : Apple obligatoire dès que Google est proposé | — |
| Widget de reprise (WidgetKit / Glance) | Module natif | HON-03 (réouverture) |
| Tablettes et paysage vidéo | Colonne 600 dp en place | RESP-02, RESP-03 |
| Barre d'onglets présente dans le Club | Restructuration des routes | CLUB-03 |
| Changement de territoire 500 ms | Maillage remonté à la racine | MOT-08 |

## Risques du plan

| Risque | Parade |
|---|---|
| Le canal `app` du répétiteur touche le Worker, déployé à la main | Déployer et vérifier par `wrangler versions view --json` dans la même PR ; test sur 20 questions |
| Les retraits du lot S1 masquent des écrans que le marketing cite | Aligner la fiche Play Store le même jour |
| La capacité réelle est inférieure à 1 ETP | Couper par le bas de chaque fenêtre ; ne jamais commencer J61 avant les critères de J30 |
| L'émulateur ne tient pas sur la machine actuelle | Recette sur le TECNO physique + un appareil Android 10 d'entrée de gamme |
