Système de design de la plateforme Max-Morrys, version 3 : **un compte, trois espaces**. `maxmorrys.me` est le **site de marque personnelle** de Max-Morrys — qui il est, ce qu'il construit, ce qu'il transmet ; `edu.maxmorrys.me` forme ; `club.maxmorrys.me` rassemble. Le logo, les quatre teintes, les trois familles de caractères et la règle de vérité ne changent pas ; ce qui change, c'est la mise en scène — des titres géants, des tableaux de bord en tuiles, un Club qui devient un réseau social clair et vivant, une console superadmin unique, et une couche de mouvement sur chaque surface.

## maxmorrys.me, site de marque personnelle

Le domaine principal n'est pas un portail : c'est **Max-Morrys, la personne**. Il raconte un parcours (Douala, Abidjan, Dakar), montre ce qu'il construit (piste Conception, réalisations) et ce qu'il transmet (blog, podcast, vidéos), et renvoie vers edu. pour se former et vers club. pour avancer ensemble. Ses pages : Accueil, Mon parcours, Services (Conception, Commerces et TPE, Sur mesure), Réalisations, Contenus (blog, article, podcast et vidéos), FAQ, Contact. Composants propres : `PersonalHero`, `AudienceCards`, `BookCallBand`, plus `HeroEditorial`, `ProcessAccordion`, `MediaCarousel`, `TruthAndTestimonial` et `MegaFooter`.

- **Les chiffres parlent de la personne, et sont sourcés** : année de création de MY ONOMA (RCCM), projets livrés (listés dans Réalisations), personnes formées (Académie Light, 2024), pays. Jamais d'abonnés, de « followers générés » ou de clients satisfaits non comptés.
- **Les logos de clients** n'apparaissent qu'avec un accord écrit ; sinon, le nom du projet en typographie, sans logo.
- **L'action principale** est « Réserver un appel » (`mm-btn is-club` ou `is-highlight`), une par écran.

## Ce que la v3 garde, ce qu'elle ajoute

| Garde, à l'identique | Ajoute |
|---|---|
| Le M en quatre teintes, `brand-bleu` `brand-orange` `brand-violet` `brand-teal` | Une identité par espace : `space-hub` (site personnel : encre, violet en accent), `space-edu` (bleu), `space-club` (violet) |
| Fraunces 900, Schibsted Grotesk, JetBrains Mono | `display-mega` (132 px) pour le nom en pied de page et le mot-titre d'un héros ; `lede` (18 px) ; `num-hero` (44 px) |
| La règle du monospace et l'encart de vérité | Tuiles `bento` opaques pour les tableaux de bord et les espaces sombres |
| Les maillages, le verre budgété, les replis `.lowfi` | Maillages `m-hub`, `m-edu`, `m-club` |
| Quatre durées, deux courbes | `t-page` (480 ms), `ease-spring` (récompenses seulement), `ease-in-out` (sorties) — voir la section Mouvement |
| Tutoiement sur Apprendre, vouvoiement sur Conception | Sous-domaines, session partagée, console superadmin — voir les sections dédiées |

## Fondamentaux de contenu

- **Voix par piste.** Tout ce qui apprend tutoie, à la première personne : « Je te forme », « Tu paies en Wave », « Écris-moi ». La piste Conception vouvoie (« nous / vous ») ; son étage commerçants tutoie. edu. et club. tutoient. La console parle neutre et court.
- **Anglais réécrit, pas traduit** : *I'll train you · I'll keep you posted · I'll push you further · I'll get you online · Talk to me*. Les titres d'affichage sont écrits par langue avec leurs propres coupures.
- **La règle du monospace.** Un nombre en JetBrains Mono vient de la base ou d'une source citée, et porte sa ligne de source (`mm-stat__src`, `mm-kpi__src`). Un nombre estimé ne s'affiche pas. Les références visuelles affichent « 200+ clients », « 4,98 ★ », « 500 000 abonnés » : **on prend leur mise en page, jamais leurs chiffres.**
- **Pas de preuve sociale inventée.** Aucune note, aucun nombre de membres ou d'inscrits, aucun témoignage non certifié, aucun logo de partenaire sans accord écrit. L'encart de vérité (`TruthAndTestimonial`) remplace tout cela.
- **Aucune promesse de remboursement.** Ni « 14 jours », ni « garantie » : les CGV art. 6 font foi (D-13).
- **Prix toujours cadrés** : `1 658 FCFA / mois` avec « facturé 19 900 FCFA une fois par an » dessous ; « une fois, accès à vie » pour une formation ; jamais un montant nu.
- **États honnêtes.** « Aucune formation n'est encore en ligne. » puis l'action. Jamais « oups ».
- **Casse.** Héros en capitales sur trois lignes courtes ; titres-phrases en casse normale ; sourcils en mono capitales entre crochets (`mm-eyebrow`) ; boutons en casse de phrase.
- **Aucun emoji.** Séparateur de métadonnées : le point médian `·`.
- **Contenu d'exemple étiqueté.** Toute maquette qui montre des personnes ou des chiffres inventés porte l'étiquette `mm-tag is-demo`.

## Fondations visuelles

### Couleur

- `brand-*` sont fixes dans les deux thèmes : aplats, dégradés d'action, lobes de maillage. **Texte** : lire les `accent-*`, qui basculent seuls (`accent-bleu` #0057BC → #6FB1FF, `accent-violet` #6C23DD → #B98CFF). L'orange et le teal ne s'écrivent jamais en clair (`accent-orange-t`, `accent-teal-t`).
- `ink` / `ink-2` / `ink-3` sur `paper`, `paper-2`, `bento`. `ink-3` est le plancher : jamais sur `bento-2` en sombre.
- `highlight` (orange) avec `on-highlight` : une pilule de mise en avant ou une bande défilante par écran, pas plus. C'est la traduction du jaune des références dans la charte.
- États `ok` `warn` `stop`, toujours avec un mot ou un glyphe.
- Deux fonds par écran au plus : le maillage et une surface (verre ou `bento`).

### Les trois espaces

| Espace | Domaine | Thème par défaut | Fond | Accent | Bouton |
|---|---|---|---|---|---|
| Site personnel | `maxmorrys.me` | clair, héros sombre plein cadre | `m-hub` | `space-hub`, accent `accent-violet` | `mm-btn` encre ; `is-club` pour « Réserver un appel » |
| Edu | `edu.maxmorrys.me` | clair | `m-edu` | `space-edu` | `mm-btn is-edu` |
| Club | `club.maxmorrys.me` | **clair** | `paper-2`, cartes `bento` | `space-club` | `mm-btn-club` |
| Console | `maxmorrys.me/admin` | **clair** | `paper-2`, cartes blanches, barre latérale à libellés | par espace filtré | `mm-cbtn`, `is-ink` pour l'action principale |

Le site personnel ouvre chaque page sur un héros sombre et photographique (portrait plein cadre, `PersonalHero`), puis repasse en clair : c'est la composition des références de marque personnelle. Le Club est **clair** depuis la v4.3 : fond `paper-2`, cartes blanches, accents violets ; le thème sombre reste disponible par les jetons, mais il n'est plus celui par défaut.

### Typographie

- Titres en `display-*` (Fraunces 900), jamais sous 22 px. `display-mega` une fois par page (pied de page géant ou mot-titre de héros desktop). `display-xl` en héros, trois lignes en capitales, montées sous masque.
- Corps en `body` 15 px, chapô de héros en `lede` 18 px `ink-2` (≤ 46 ch), prose en `prose` dans `measure-prose` (68 ch, quelle que soit la largeur).
- Chiffres en `num-*` (JetBrains Mono tabulaire) ; sourcils en `eyebrow`.

### Espacement, rayons, mise en page

- Échelle `sp-4` → `sp-40` dans les composants ; `sp-56` (mobile) et `sp-96` (desktop) entre les sections des pages d'accueil ; `sp-128` avant le pied de page géant.
- Tableaux de bord : grille de 12 colonnes, gouttière `sp-16` (`sp-12` en mobile), tuiles `bento` en `r-l`, rembourrage `sp-20`–`sp-24`. Une tuile héros prend 7 colonnes, les tuiles de relevé 3.
- Rayons : `r-s` puces, `r-m` champs, `r-l` cartes et tuiles, `r-xl` sections pleine largeur et héros, `r-media` images, `r-pill` tout ce qui se touche.
- Points de rupture inchangés : empilement en M sous 700 px, grille 2×2 jusqu'à 1080 px, rangée au-delà. Le rail (`rail-w`, 72 px) apparaît à partir de 1080 px ; en dessous, barre d'onglets basse (`tabbar-h`).

### Surfaces, verre, ombres

- Un seul flou par écran : le chrome fixe (`mm-glass` — barre haute, barre d'onglets). Tout ce qui défile est `mm-flat` ou `mm-bento`.
- Menus, tiroirs, palette de commandes : **opaques** (D-10), sur un voile.
- Ombres : `sh-soft` (pilules), `sh-card` (cartes), `sh-lift` (survol desktop, avec −2 px), ombres colorées sous les boutons dégradés (`sh-btn-edu`, `sh-btn-club`, `sh-btn-studio`). Jamais d'ombre dure ni de bordure gauche colorée.
- Mode sombre : même recette, opacités effondrées ; `bento` #121821 sur `paper` #0B0E13.

### Imagerie

- Les références reposent sur des portraits. Ici : **un vrai portrait de Max-Morrys ou rien** — les portraits générés par IA sont à remplacer (FR-084). En attendant, `mm-photo` (dégradé de l'espace + étiquette « photographie à faire »).
- Photos de membres dans le Club : celles qu'ils publient, rognées en `r-media`. Avatars : initiales sur dégradé.
- Aucune illustration de banque, aucune icône en PNG.

### États d'interaction

- Appui : `scale(.975)` boutons, `.94` pilules et ronds, `.985` cartes. Toujours un retour.
- Survol (desktop) : levée de 2 px + `sh-lift`, flèche qui pivote, soulignement qui se trace. Jamais d'information portée par le survol seul.
- Focus : liseré `focus` 2 px + `sh-focus`, sur toutes les surfaces.
- Sélection : encre pleine (chip actif) ou pouce blanc qui glisse (segments, barre haute).
- Désactivé : `fill-2`, texte `ink-2`, libellé qui dit pourquoi.

## Iconographie

- **Un seul jeu : Lucide**, boîte 24, trait 2,2 px, caps rondes (`.mm-ico`). La v3 retire Phosphor de l'espace apprenant et du Club : deux familles coexistaient par accident (Addendum §6).
- Tailles : 16 px dans un bouton petit ou une ligne, 20 px par défaut, 24 px dans un état vide.
- Glyphes pleins : `play` seulement, et le cœur une fois aimé.
- Marques tierces : sigles typographiques sur carré dégradé (« W » Wave, « OM » Orange Money), jamais de logo redessiné.

## Marque et logo

- Fichier unique : `assets/Logos/logo-mm-icon.png`, M à empattements en quatre teintes, fond transparent. Inchangé.
- Le nom est composé en Fraunces 900 ; les espaces ajoutent un sous-nom en mono (`EDU · JE TE FORME`, `PAR MAX-MORRYS`). Aucun logo propre à edu. ou club. — voir le composant `Brand`.
- Sur fond sombre ou coloré, le M se pose sur une pastille blanche arrondie.

## Mouvement, en bref

Chaque interface est vivante, mais chaque mouvement répond à une question : « ai-je été entendu·e ? » (`t-tap`), « qu'est-ce qui a changé ? » (`t-ui`), « qu'est-ce qui arrive ? » (`t-enter`), « où suis-je ? » (`t-scene`, `t-page`). `transform` et `opacity` uniquement ; tout se coupe sous `prefers-reduced-motion` et sur appareil modeste (`.lowfi`). Le catalogue complet est dans la section **Mouvement** ; le comportement est dans `components/bundle.js` (`window.MaxMorrys`).

## Accessibilité

- Texte ≥ 4,5:1 sur ses fonds dans les deux thèmes (les notes des jetons donnent les paires mesurées) ; 3:1 pour les grands titres, bordures de contrôle, focus et icônes. Le dégradé de titre `mm-hl` passe à #6FB1FF → #B98CFF en sombre.
- Cibles tactiles ≥ `touch-aa` (44 px), 8 px entre deux cibles.
- Rail et barre d'onglets : chaque icône a un `aria-label` ; l'infobulle n'est qu'un doublon visuel.
- Toasts en `role="status"`, palette en `role="dialog"`, onglets du Club enfin portés par l'URL.


## Edu v4 : l'école en ligne

edu.maxmorrys.me a deux visages.

- **Pages publiques** (accueil, catalogue, fiche, vérification de certificat), inspirées d'Acquisition.com : héros sombre en capitales serrées, ligne en italique orange, pilule orange à pastille, compte à rebours en verre, grand bloc orange « Ce que tu vas apprendre », couvertures de formation façon livre, bandeau de newsletter à cheval sur le pied de page sombre. L'orange (`highlight`) tient le rôle du jaune de la référence.
- **Espace connecté** (tableau de bord, mes formations, leçon, agenda, succès, notes, Rysmo), inspiré de Skillio : barre latérale blanche, recherche en pilule, carte d'accueil pastel, compteurs à teinte, vignettes de reprise, agenda à jours, quêtes.

**La cohorte.** Les cours se suivent à son rythme, mais personne n'avance seul : la cohorte réunit les personnes qui ont commencé la même formation le même mois. Facultative (proposée à l'accès, désactivée par défaut), elle sert à trois choses : relire les missions entre pairs avec une grille commune, un live par mois et par cohorte animé par Max (replay 30 jours), et situer chacun par module, sans classement. Les points et les quêtes récompensent la régularité de chacun, jamais une comparaison.

Pages : publiques (Accueil, Méthode, Rysmo, Catalogue, Fiche, Connexion, Paiement, Accès ouvert, Vérifier un certificat) et connectées (Tableau de bord, Mes formations, Leçon, Quiz, Mission, Ma cohorte, Live de cohorte, Agenda, Succès, Notes, Rysmo).

Composants : `EduHero`, `LearnGrid`, `CourseCover`, `AppShell`, `ResumeCards`, `AgendaQuests`, `Achievements`, `MobileSchoolShell`, `Checkout`, `CohortPanel`, `PeerReview`, `QuizCard`, `LiveRoom`. Classes : `mm-up`, `mm-script`, `mm-pill`, `mm-count`, `mm-learn`, `mm-cover`, `mm-tint-*`, `mm-prod`, `mm-tabs`, `mm-app`, `mm-side`, `mm-sidenav`, `mm-mate`, `mm-apptop`, `mm-search`, `mm-theme`, `mm-me`, `mm-card`, `mm-promo`, `mm-floaty`, `mm-statcard`, `mm-ringx`, `mm-vid`, `mm-days`, `mm-ev`, `mm-quest`, `mm-qbar`, `mm-claim`, `mm-mtop`, `mm-tabbar`.


## Club v4 : le réseau des Digitos

club.maxmorrys.me a deux visages, comme edu.

- **Pages publiques** (Accueil, Sessions, Adhésion), en **aperçu produit clair** (v4.3) : navigation blanche, titre net, prix dès le premier écran, la vraie interface du Fil dans un cadre de navigateur, puis ce que l'adhésion ouvre, comment on commence, prochaines sessions et cercles, tarif et questions fréquentes. La citation de Max-Morrys ferme la page.
- **Espace connecté** (Fil, Publication, Discussions, Agenda, Session en direct, Membres, Profil, Classement, Opportunités, Défis, Infos, Parrainage), inspiré d'UNIFY mais **en clair** : coquille à trois colonnes (rail d'icônes, contenu, rail des cercles), salutation géante, relevés personnels, bande en direct, horloge, grande carte de session, « Pour toi », tuiles média.
- **Mur d'abonnement** : un compte sans adhésion active voit un aperçu flouté, le prix et la séparation garanti / en construction ; ni nombre de membres, ni témoignage.

Le **classement** reste celui du PRD (par cohorte d'arrivée), mais il est **désactivé par défaut** pour chaque membre et ne compte que l'aide apportée (missions publiées, relectures, réponses utiles, sessions, défis) : aucun XP pour les « j'aime ».

Composants : `ClubHero`, `ClubOffer`, `ClubPricing`, `ClubDashboard`, `ClubTiles`, `ClubPost`, `ClubDirectory`, `ClubOpportunity`.

## Audit v4.4

Passe UI/UX sur les 112 maquettes (56 pages, desktop et mobile). Ce qui a été corrigé, et la règle qui en sort :

- **Rien ne dépend du script pour être visible.** Les sections `rv` d'edu. restaient invisibles sans `bundle.js` : une maquette s'affiche d'abord, le mouvement s'ajoute ensuite.
- **Une classe, un sens.** `mm-pill` du Club écrasait le bouton orange d'edu. : le Club utilise `mm-cpill`, la console `mm-cprod` et `mm-cspaces`. Toute nouvelle classe est vérifiée contre le paquet avant publication.
- **Un fond clair dans une zone sombre fixe sa propre encre.** Segments, champs et cartes flottantes blancs posés sur un héros sombre héritaient d'un texte clair.
- **Une grille mobile ne déborde pas** : `minmax(0, 1fr)` plutôt que `1fr` quand une colonne contient un défilement horizontal.
- **Contraste des pastilles de cercle** : IA `#00796b`, Marque `#a35200`, WhatsApp `#0f7a4a` (texte blanc ≥ 4,5:1).
- **Une seule histoire** : mêmes dates d'adhésion, mêmes prix, mêmes quotas Rysmo (8 par jour pour un membre du Club), mêmes formations publiées d'un espace à l'autre et dans la console. Ce qui est en construction (digest, replays, cercles ouverts) l'est partout.
- **Les plans du canevas montrent toute la page** : hauteurs remesurées, la page d'accueil du site personnel était coupée à mi-hauteur.


## Mouvement v4.5 : actif partout, sans script

Le catalogue de mouvement joue désormais dans toutes les maquettes, sans `bundle.js` : une couche CSS seule (`motion` dans `bundle.css`) suffit.

- **Entrée de page** : chaque page arrive en fondu (480 ms) ; le titre monte, puis ce qui le suit en cascade (70 ms).
- **Barres et rails** : la barre haute descend, la barre latérale glisse depuis la gauche, la barre d'onglets mobile monte.
- **Tableaux de bord** (edu., Club, console) : tuiles en cascade, barres de progression et anneaux qui se remplissent.
- **Au défilement** (Play, plein écran) : chaque bloc rejoue sa cascade une fois en entrant dans l'écran. Dans le canevas la page ne défile pas, tout reste visible.
- **Règles techniques** : `opacity` et les propriétés `translate`/`scale` seulement (elles se composent avec les `transform` posés en ligne) ; images clés sans valeur finale, pour garder l'opacité propre à chaque élément ; jamais de déplacement sur la racine, pour que les boutons fixes restent fixes ; tout est coupé sous « réduire les animations ».

## Application Rysmo (React Native)

Rysmo est l'application de toute la plateforme, en iOS et Android : Edu, Club des Digitos, contenus du site, rendez-vous, packs Commerces et une console d'administration limitée. Une seule source, deux châssis. 58 écrans par plateforme (116 maquettes cliquables), dans la page « Rysmo · app mobile iOS et Android » du canevas.

- **Onglets** : Accueil · Apprendre · Club · Assistant · Profil. Apprendre porte une bande de six sections, le Club une bande de huit onglets (`mm-r-band`).
- **Espaces** : `data-space="hub|edu|club|ia|admin"` sur la racine règle le dégradé de reprise (`mm-r-resume`), le fond maillé (`mm-r-mesh`) et l'accent, sans changer un composant.
- **L'assistant** s'appelle **Rysmo IA** par défaut ; chacun le renomme (40 caractères), choisit son apparence parmi six et son ton. Les textes lisent le nom choisi, jamais une chaîne en dur (champ `iaName` dans les Tweaks pour essayer).
- **Ce qui suit la plateforme** : barre haute (grand titre et « ‹ Retour » sur iOS, flèche en Material 3), onglets (pilule active sur Android), bouton flottant sur Android, Face ID ou empreinte, connexion Apple sur iOS seulement, nom du magasin dans les murs d'achat.
- **Ce qui ne bouge pas** : la marque, les textes, les quotas (2 par jour gratuit, 5 membre du Club ; packs 30 / 100 / 300 questions pour 500 / 1 500 / 3 500 F, sur le site), la mémoire désactivée par défaut, aucun encaissement de contenu numérique dans l'app.
- **Composants ajoutés** : `mm-r-band`, `mm-r-mesh`, `mm-r-resume`, `mm-r-tiles` / `mm-r-tile`, `mm-r-truth` (boîte de vérité), `mm-r-mini` (mini-lecteur), `mm-r-sk` (squelette), `mm-r-share` (feuille de partage), `mm-r-under` (écran sous une feuille), `is-land` (paysage).
- **Mouvement** : poussée latérale, fondu entre onglets, feuille qui monte, cascade des cartes, réponse mot à mot, barres et anneaux qui se remplissent ; deux moments scénarisés seulement (accès ouvert, certificat). Coupé par le réglage du téléphone et par « Réduire les animations ».

Composant : `RysmoApp`. Classes : `mm-r`, `mm-r-band`, `mm-r-mesh`, `mm-r-resume`, `mm-r-truth`, `mm-r-mini`, `mm-r-sk`, `mm-r__bar`, `mm-r__tabs`, `mm-r-card`, `mm-r-list`, `mm-r-li`, `mm-r-btn`, `mm-r-chip`, `mm-r-seg`, `mm-r-sw`, `mm-r-input`, `mm-r-bub`, `mm-r-compose`, `mm-r-sheet`, `mm-r-toast`, `mm-r-ring`, `mm-r-wave`, `mm-r-opt`, `mm-r-otp`, `mm-r-fab`.
