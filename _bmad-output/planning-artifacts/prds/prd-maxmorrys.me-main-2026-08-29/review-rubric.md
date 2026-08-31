# PRD Quality Review — PRD Plateforme Max-Morrys (2026-08-29)

## Overall verdict

Ce PRD est **honnête d'une manière rare** : il refuse la taille de marché qu'il aurait pu inventer,
il démonte sa propre différenciation (R-10 : « la gamification et le tuteur IA ne sont pas des
moats »), il apparie onze métriques de succès à onze contre-métriques, et il documente le trou de
crédibilité de son propre site (D-03). La Partie A tient : sur le paiement, le prix et le
bilinguisme, elle est précise, chiffrée et testable, et l'addendum est un excellent document
d'onboarding architecte.

Ce qui est à risque tient en trois points. **La Partie B n'est pas spécifiée au niveau où un
ingénieur pourrait la livrer** — quatorze des quatre-vingt-onze exigences n'ont aucune conséquence
vérifiable, aucune ne porte de critère d'acceptation, et aucune des vingt-quatre exigences de la
phase suivante ne porte le coût en minutes/semaine que NFR-11 déclare pourtant obligatoire. **Le
document ne fournit ni glossaire ni index des hypothèses**, alors qu'il est explicitement chef de
chaîne pour `bmad-ux`, `bmad-architecture` et `bmad-create-epics-and-stories`, et que son nom le
plus fréquent — « Rysmo » — désigne deux entités différentes. **Et la densité d'items ouverts
(~31) contredit l'enjeu déclaré** : un document dont la question ouverte n° 1 est marquée
« Bloquant pour : *tout le document* » n'est pas, de son propre aveu, prêt pour la lecture externe
qu'il revendique en §0.

---

## Decision-readiness — adequate

La structure décisionnelle est la meilleure partie du document. §6.1 sort trois décisions du
corps du texte, les nomme, les chiffre, et les pose **avant** les exigences qu'elles conditionnent :
« Rien de cette partie n'est livré. Elle s'ouvre sur trois décisions qui doivent être tranchées
avant que les exigences qui suivent aient un sens. » D-01 va jusqu'au bout du format attendu :
un fait chiffré (21,9 % du CA), un tableau de trois options avec leur conséquence respective —
dont deux perdantes explicitement nommées (« réduit le marché adressable », « réduit mécaniquement
le volume de prospects qualifiés ») — et une recommandation assumée. Les objections d'un lecteur
hostile sont largement anticipées : R-08 déclare le fondateur « à la fois le moat et le point de
rupture » avec la mention « Aucun traitement à ce stade — à assumer explicitement devant un
investisseur » ; §2.1 avertit contre un chiffre flatteur que l'auteur aurait pu utiliser
(« ⚠️ Piège de chiffre à ne jamais reprendre » sur les 125,78 % de l'ARTP) ; §2.1 conclut que
« l'absence de concurrent direct est aussi un signal de demande non prouvée ». Les dix questions
ouvertes sont réellement ouvertes — aucune ne porte sa réponse à la ligne suivante.

Ce qui empêche le *strong* est d'un autre ordre : **le document ne donne pas au décideur les
éléments dont il a besoin pour trancher**. Le prix de la formation — que R-01 qualifie de « ligne
de revenu principale » et dont FR-072 fait le premier jalon — **n'est écrit nulle part**, ni dans
le PRD ni dans l'addendum, alors que le Club (19 900), Rysmo (500 / 1 500 / 3 500 / 3 000 / 7 500)
et les sept lignes de la grille TPE sont donnés au franc près. Un lecteur externe ne peut ni
apprécier R-01, ni instruire Q-06. Et le raisonnement de D-01 — le fait le plus lourd du document,
qui commande une refonte de la cible commerciale — repose sur un repère que l'annexe qualifie et
que le PRD dé-qualifie (voir finding ci-dessous).

**Sur la déclaration §0 / Q-01 concernant les parcours inférés : elle est nécessaire, elle ne
suffit pas.** Elle est correctement placée (bandeau §0, bandeau §4, Q-01 en tête de tableau,
« Bloquant pour : Tout le document. À traiter en premier ») et son honnêteté est au-dessus de la
moyenne du genre. Mais elle ne couvre pas trois choses. *Un* — déclarer un défaut ne le répare
pas : un investisseur y lit qu'après quatre ans d'exploitation, avec des transactions réelles
(FR-021), une progression réelle par apprenant (FR-022) et des agrégats serveur (FR-060),
l'opérateur n'a ni parlé à ses clients ni dérivé ses parcours de ses propres données ; le PRD ne
dit jamais pourquoi la donnée de production n'a pas servi à ancrer §4. *Deux* — le tag est
uniforme sur une section de confiance mixte : le passage par Wave et la page hébergée (UJ-1) est
vérifiable dans le code via FR-015, la nuisance du classement (UJ-2) est adossée à de la
littérature, la contrainte d'opérateur unique (UJ-4) est vérifiable au dépôt — tout cela est tagué
au même niveau que l'âge d'Aïssatou et les huit jours de décrochage. §2.1 / §2.2 fait exactement
cette discrimination, et bien ; §4 y renonce. *Trois* — le tag n'empêche pas un chiffre inventé de
circuler sous forme de conclusion : « son commerce, à 1,2 million de CA mensuel, consacrerait
**14,6 % de son chiffre d'affaires** » est un pourcentage calculé sur un dénominateur fictif,
en gras, typographiquement indiscernable des **21,9 %** de D-01 qui, eux, sont réels.

### Findings

- **high** Le prix de la ligne de revenu principale n'est jamais énoncé (§5.4 FR-014, §6.2 FR-072, §9 R-01) — le document chiffre au franc près le Club, Rysmo et les sept lignes TPE, et tait le prix de la formation. R-01 et Q-06 sont inexploitables en l'état. *Fix :* écrire le tarif catalogue en vigueur dans FR-014 et le rappeler dans R-01, avec sa date de dernière modification.
- **high** D-01 s'appuie sur un repère dont la qualification a été supprimée (§6.1 D-01) — le PRD écrit « les fourchettes usuelles tournent autour de 7 à 16 % du chiffre d'affaires **annuel** », alors que `research-agence-tpe.md:87` écrit « 7–16 % du CA *annuel* pour les PME **françaises** ». La décision la plus lourde du document transpose un repère marketing de PME françaises à une boutique de cosmétiques dakaroise, dans un PRD dont §2.2 déclare l'élasticité régionale « non sourcée ». *Fix :* restituer la qualification et le statut du repère, ou remplacer le raisonnement par la seule donnée locale disponible ; à défaut, rétrograder D-01 en hypothèse à valider par FR-081.
- **high** La déclaration sur les parcours inférés ne protège pas des chiffres inventés qui deviennent des conclusions (§4 UJ-3) — « 14,6 % de son chiffre d'affaires » est calculé sur un CA fictif (1,2 M) et présenté au même format que le 21,9 % réel de D-01. *Fix :* remplacer les pourcentages dérivés de données de personas par des fourchettes explicitement notées comme illustratives, ou les supprimer de §4 et ne les garder qu'en §6.1 où le dénominateur est celui de l'ICP déclaré.
- **medium** Seule D-01 porte une recommandation (§6.1) — D-02 énumère trois issues et n'en privilégie aucune ; D-03 énonce une règle (« sourcé, corrigé ou retiré ») sans dire laquelle s'applique à chacune des six lignes de son tableau. *Fix :* ajouter une ligne « Recommandation » à D-02 et une quatrième colonne « Traitement retenu » au tableau de D-03.
- **medium** Aucun propriétaire ni aucune échéance sur les décisions, questions et jalons (§6.1, §6.2, §11) — D-01 à D-03, Q-01 à Q-10, FR-072, FR-081 et FR-086 sont tous non datés. Sur un document à opérateur unique le propriétaire va de soi, la date non. *Fix :* ajouter une colonne « Avant le » aux tableaux §11 et à §6.1.
- **low** Le positionnement prix de la formation a disparu entre la recherche et le PRD (§6.2 FR-072) — l'analyse « ~25 000 FCFA côté créateur vs 150 000–500 000 FCFA côté école, la formation se situe côté école » figure au journal de rédaction et dans les annexes, et le PRD ne l'assume ni ne la corrige. *Fix :* énoncer le positionnement retenu dans FR-072, qui devient l'hypothèse que le test de prix doit falsifier.

---

## Substance over theater — strong

C'est la dimension où ce PRD se distingue vraiment, et il faut le dire nettement. Le réflexe
habituel du genre — remplir les sections que le modèle prévoit — est ici activement combattu.
§2.2 est une **table de ce que le document refuse d'affirmer** (« Taille du marché B2C edtech en
AO francophone : **Inconnue** », « Propension à payer de la diaspora : **Angle mort total** »),
posture qu'on rencontre rarement dans un document destiné à un investisseur. §0 va plus loin :
« Aucun chiffre de taille de marché n'est avancé dans ce document », avec la raison technique
(divergence d'un facteur 2,5 sur la même base 2024, aucune méthodologie publiée) et le refus
nommé d'un chiffre du propre business plan de la maison. Il n'y a **pas d'innovation theater** :
R-10 fait le travail inverse et démonte deux des quatre briques que le produit aurait pu vendre
comme différenciantes. Il n'y a **pas de vision theater** : la thèse de §1 (« le paiement en
monnaie électronique locale, nativement » + « une distribution propriétaire gratuite ») n'est pas
interchangeable avec un autre PRD edtech, elle est spécifique à l'UEMOA et adossée à des sources
primaires citées inline (BCEAO, GSMA, ITU, DataReportal). §8 refuse explicitement les métriques
d'activité (« M-01 Taux de renouvellement du Club à 12 mois *(métrique de survie de la ligne)* »),
et NFR-11 — « toute fonctionnalité nouvelle arrive avec son coût en minutes par semaine pour un
opérateur unique » — est une contrainte que je n'ai vue formulée dans aucun autre PRD.

Les quatre parcours ne sont pas du persona theater au sens de la rubrique : ils sont quatre (la
limite, pas au-delà), aucun n'est un doublon, et chacun se termine par une clause « Ce que ce
parcours exige du produit » qui nomme une contrainte réelle et non un souhait. Réserve : deux des
quatre ne sont *câblés* à rien (voir Downstream usability).

Le mobilier restant est mince mais réel. §3 affirme que « le système de voix est un actif produit,
pas une préférence esthétique » et conclut « toute exigence de ce PRD s'y conforme » — or aucune
FR, aucune NFR n'encode le tutoiement ni le motif « Je te… », et FR-066 (traduction automatique
du contenu éditorial par modèle, mise en cache au pré-rendu) est précisément le mécanisme par
lequel cette voix disparaît en anglais. Un actif déclaré sans exigence attachée, contredit par une
exigence existante, est du mobilier bien écrit. Et quatre NFR sur treize sont du *boilerplate
justifié* : une justification excellente, aucun seuil (voir Done-ness).

### Findings

- **medium** Le « système de voix » est déclaré actif produit et n'est repris par aucune exigence (§3, contre FR-065, FR-066) — la promesse « toute exigence de ce PRD s'y conforme » n'est vérifiable nulle part, et FR-066 traduit automatiquement le contenu éditorial vers une langue où rien ne garantit la voix. *Fix :* soit une NFR de registre éditorial avec sa règle de contrôle, soit une exigence de relecture humaine sur le corpus EN ; soit retirer la phrase.
- **medium** Quatre NFR ont une justification et pas de seuil (§7 NFR-04, NFR-05, NFR-09, NFR-12) — le procédé est meilleur que le boilerplate copié, mais l'effet aval est identique : rien à vérifier. Détail en Done-ness. *Fix :* voir findings correspondants.
- **low** §5.1 est une table d'inventaire qui ne pilote aucune décision, et elle affaiblit la règle que le document vient d'édicter (§5.1, FR-057) — « ~45 fonctions Cloud v2 » porte un tilde et « 20 écrans » en énumère 19 dans FR-057, dans un PRD dont FR-070 exige que « tout nombre affiché en façade est calculé depuis les données, ou porte sa source, ou n'est pas affiché ». *Fix :* rendre les compteurs exacts ou les présenter comme des ordres de grandeur assumés.

---

## Strategic coherence — adequate

La thèse existe, elle est nommée, et §1 annonce que le document est bâti autour d'elle. Sur la
Partie A, c'est vrai et démontrable. Le point 1 (mobile money natif) se retrouve en FR-015,
FR-016, FR-018, en NFR-01, NFR-02, en D-02, en M-08 et en R-02 — la chaîne est complète, du fait
de marché jusqu'à la contre-métrique. Le point 2 (distribution propriétaire) se retrouve en
FR-001 à FR-008, FR-064 à FR-067, et surtout en M-07 dont la contre-métrique — « part du trafic
dépendant d'un seul canal » — est exactement le risque du moat revendiqué. Le refus du gratuit
illimité sur l'IA (NFR-10, FR-040) est cohérent avec l'analyse de structure de coût de
l'addendum §5, et non avec une simple prudence budgétaire. §8 ne contient aucune métrique de
vanité et les onze couples sont pertinents deux à deux.

La rupture est en Partie B. Le document diagnostique en R-10 une sur-extension (« Cinq produits,
une équipe ») et ne dé-scope aucune des cinq lignes ; §10 Hors périmètre n'exclut que des choses
jamais engagées (application native, ligne B2B An 4–5, nouveaux pays, IA illimitée), c'est-à-dire
qu'il ne fait aucun travail réel. Puis §6.2 ajoute vingt-quatre exigences réparties sur cinq blocs
et quatre des cinq lignes de revenu, sans priorité relative entre les blocs, sans dépendances
autres que deux titres (« préalable à tout le reste », « après D-01 et D-02 »), et sans aucune
notion d'effort. Le résultat est qu'un lecteur ne peut pas dire quelle ligne le prochain trimestre
doit servir. Plus net encore : **NFR-11 déclare qu'« une fonctionnalité sans réponse à cette
question n'est pas spécifiée », et aucune des vingt-quatre exigences de la Partie B ne porte son
coût en minutes par semaine.** Le PRD invalide sa propre Partie B au regard de sa propre règle,
dans un document dont §4 fait de la contrainte d'opérateur unique « le paramètre de conception le
plus déterminant du produit ».

### Findings

- **high** La Partie B viole NFR-11 intégralement (§6.2 contre §7 NFR-11) — vingt-quatre exigences, zéro coût opérationnel chiffré, alors que la règle qu'elles enfreignent est écrite trois pages plus loin dans le même document et qu'UJ-4 en fait le paramètre de conception dominant. *Fix :* ajouter à chaque FR de la Partie B une estimation du coût récurrent en minutes/semaine pour l'opérateur, ou marquer explicitement les exigences qui n'en créent aucun.
- **high** Aucune priorité, aucun séquencement et aucune dé-priorisation de ligne en Partie B (§6.2, §10) — R-10 identifie la sur-extension comme risque stratégique et la Partie B répartit l'effort sur quatre lignes sur cinq. §10 n'exclut que des chantiers jamais ouverts. *Fix :* ordonner les cinq blocs de §6.2, et faire dire à §10 ce qui est *réduit* dans l'existant (par exemple : Club en maintenance jusqu'à M-01, ou ligne TPE gelée jusqu'à FR-081).
- **medium** §10 ne dé-scope rien de vivant (§10) — quatre des six entrées portent sur des chantiers jamais engagés, la cinquième est une décision de positionnement, la sixième renvoie à NFR-10. *Fix :* voir ci-dessus.

---

## Done-ness clarity — thin

J'ai lu les quatre-vingt-onze exigences une à une. **Environ 54 portent au moins une conséquence
vérifiable** — une valeur, une énumération complète, une règle falsifiable. **Environ 23 sont
directionnellement justes mais sans borne**, c'est-à-dire qu'un ingénieur saurait ce qu'on veut
et pas quand il a fini. **Environ 14 n'ont aucune conséquence vérifiable du tout.** Et **zéro sur
quatre-vingt-onze porte un critère d'acceptation explicite**, ni le document une section
d'acceptation.

Le meilleur tiers est excellent, et c'est le tiers à risque : FR-016 (« le client n'envoie jamais
de montant »), FR-018 (dédoublonnage par identifiant de charge, contrôle du montant, effets de
bord avant marquage — un ordre d'opérations testable), FR-040 (2 / 5 / 20 / 100), FR-041 (six
montants exacts), FR-047 (trois packs, deux accompagnements, six options, prix plancher jamais
affiché), FR-050 (séparation devis / données personnelles imposée par les règles), FR-064 / FR-065
(double montage, aucune chaîne accentuée en dur), FR-083 (case non pré-cochée, lien, horodatage,
preuve conservée). Ces exigences-là sont directement transformables en tests.

Le tiers faible est constitué d'adjectifs et de verbes d'existence. Relevé exhaustif des formules
non vérifiables : FR-003 « synchronisées **périodiquement** » ; FR-010 le rôle `support` accède à
« un **sous-ensemble strict** » jamais énuméré ; FR-021 historique « **réconciliable** » par
l'administration ; FR-027 classement reconstruit « à **intervalle régulier** » ; FR-028 « des
relances automatiques **existent** » ; FR-036 « des défis communautaires **administrables** » ;
FR-038 contexte « borné par collection » sans la borne ; FR-039 mémoire régénérée « à **intervalle
de requêtes** » (l'addendum §5 dit « tous les *N* échanges » — *N* n'est donné nulle part) ;
FR-043 « une limitation de débit protège le service des abus » — ni débit, ni fenêtre, ni réponse ;
FR-045 « une relance de coaching automatique **existe** » ; FR-052 devis « purgés
**automatiquement** » sans durée de validité ni cadence ; FR-055 statuts « jusqu'à la proposition
et la signature » non énumérés là où FR-051 les énumère ; FR-061 sauvegarde « planifiée » et
nettoyage « périodique » sans cadence ni rétention ; FR-062 « nettoyage de ses dépendances » sans
liste ; FR-063 journal des « actions sensibles » sans liste ni durée ; FR-067 « une page
**complète** » ; FR-076 « restituer **périodiquement** » ; FR-077 « **plusieurs** semaines avant » ;
FR-082 « construire une preuve **autre** » ; FR-089 rendre « **détectable** » sans mécanisme ;
FR-090 « **localiser** » les navigations non traduites — localiser n'est pas corriger, et aucune
exigence ne demande la correction.

Côté non fonctionnel, le motif se répète : NFR-04 énonce que « le poids en mégaoctets d'une page
et d'un cours est une contrainte de conception, pas une optimisation », le justifie remarquablement
(4,2 % du RNB par habitant pour le panier d'entrée), puis conclut « toute exigence nouvelle porte
son budget en poids » — **le budget n'est fixé nulle part**. La règle délègue son propre seuil.
NFR-05 exige la survie « sur un appareil d'entrée de gamme » sans classe d'appareil, sans profil
réseau, sans cible temporelle. NFR-12 « les métriques de performance web sont collectées » — sans
seuil, une collecte n'est pas une exigence. NFR-09 réduit l'accessibilité d'une plateforme de
vingt écrans d'administration, onze onglets Club et dix onglets apprenant à **une seule** contrainte
de contraste sur une teinte. Et il n'existe **aucune exigence de disponibilité, aucun RPO ni RTO**,
alors que FR-061 planifie une sauvegarde et que le produit encaisse des paiements.

Enfin, la granularité est trop inégale pour alimenter un découpage en stories : FR-057 couvre
vingt écrans d'administration en une ligne pendant que FR-023 couvre la prise de notes ; FR-026
empile expérience, niveaux, badges, séries et record — quatre sous-systèmes — dans une seule
exigence ; FR-031 énumère onze surfaces produit sous un seul identifiant.

### Findings

- **critical** Quatorze exigences sans conséquence vérifiable et vingt-trois sans borne, sur quatre-vingt-onze ; aucun critère d'acceptation dans tout le document (§5.2–§5.11, §6.2) — c'est la dimension sur laquelle `bmad-create-epics-and-stories` s'appuiera le plus, et elle ne porte pas. Liste complète des formulations en cause ci-dessus. *Fix :* traiter d'abord les six qui touchent l'argent, la sécurité ou la conformité (FR-010, FR-043, FR-052, FR-061, FR-063, FR-089) en leur donnant valeur, fenêtre et rétention ; pour le reste, une ligne « Fait quand : … » par exigence.
- **high** NFR-04 pose une règle de poids sans jamais fixer de budget (§7 NFR-04) — « toute exigence nouvelle porte son budget en poids » sans budget de référence rend la règle inapplicable au premier arbitrage, alors que §2.1 en fait une contrainte de marché de premier rang. *Fix :* fixer un plafond en Ko pour une page publique et en Mo pour une leçon, mesuré sur le profil réseau de NFR-05.
- **high** Aucune exigence de disponibilité, de RPO ni de RTO (§7) — un produit qui encaisse des paiements par webhook (FR-018) et planifie des sauvegardes (FR-061) ne dit nulle part combien de temps il peut être indisponible ni combien de données il peut perdre. *Fix :* ajouter une NFR de continuité avec cible de disponibilité, RPO, RTO, et rattacher FR-061 à ce RPO.
- **medium** NFR-05 et NFR-12 n'ont ni profil ni seuil (§7) — « appareil d'entrée de gamme » sans classe d'appareil ni profil réseau ; « les métriques sont collectées » sans cible. *Fix :* nommer un appareil et un profil réseau de référence, et une cible LCP/INP sur ce profil.
- **medium** L'accessibilité est réduite à une contrainte de contraste (§7 NFR-09) — aucun niveau WCAG engagé, rien sur la navigation clavier, le focus, les lecteurs d'écran, pour une surface de plus de quarante écrans. *Fix :* engager un niveau et lister les trois ou quatre contrôles retenus.
- **medium** FR-010 laisse non énuméré le périmètre du rôle `support` (§5.3) — « un sous-ensemble strict » est une exigence d'habilitation non testable, sur un rôle qui accède à un back-office traitant des transactions. *Fix :* énumérer les écrans et actions accessibles au rôle, comme FR-051 énumère ses statuts.
- **medium** La granularité des FR est trop hétérogène pour un découpage en stories (§5.10 FR-057, §5.5 FR-026, §5.6 FR-031) — un identifiant couvre vingt écrans, un autre quatre sous-systèmes de gamification, un autre onze surfaces. *Fix :* éclater FR-026, FR-031 et FR-057 en sous-identifiants stables avant de lancer la création d'épopées.

---

## Scope honesty — adequate

Sur la question littérale de la dimension — les omissions sont-elles explicites ? — ce PRD est
au-dessus de tout ce que la rubrique attend. §0 institue un système de marqueurs et explique la
règle de lecture ; §2.2 liste huit sujets sur lesquels le document refuse de se prononcer, colonne
« État réel de la donnée » à l'appui ; §8 conclut par « Aucune valeur cible n'est fixée dans ce
document », avec la raison ; R-08 assume un risque sans traitement ; l'addendum §9 nomme ce qui a
été délibérément laissé hors PRD (six lignes de service non implémentées, le modèle financier à
cinq ans). Le déclassement du SAM de `BUSINESS_PLAN.md §5.1` est une dé-priorisation faite à voix
haute, contre l'intérêt narratif de l'auteur. L'absence de `[NOTE FOR PM]` et de `[NON-GOAL]`
inline n'est pas un défaut ici : D-01 à D-03 et Q-01 à Q-10 assurent la même fonction, de façon
plus consultable.

Deux choses tirent la dimension vers le bas. La première est **la densité, mesurée contre l'enjeu
déclaré**. Le décompte : dix questions ouvertes ; treize `[ASSUMPTION]` de fond, dont quatre
couvrent l'intégralité de la section 4 ; trois décisions bloquantes dont deux sans recommandation ;
cinq « exigences » de Partie B qui sont en réalité des activités de recherche sans livrable
(FR-072 « conduire un test de prix », FR-075 « ouvrir l'évaluation », FR-081 « conduire dix à
quinze entretiens », FR-086 « faire trancher par un conseil », FR-090 « localiser ») ; un risque
sans traitement. Soit environ **trente et un items ouverts** pour un document dont §0 déclare
l'enjeu « lecture externe — investisseur, associé, développeur à recruter ». La rubrique est claire
sur ce point : une densité élevée est acceptable sur un PRD à faible enjeu, elle est bloquante sur
un document destiné à autoriser une décision. Et Q-01 le formalise elle-même : « Bloquant pour :
**Tout le document.** À traiter en premier ». Le PRD se déclare donc bloqué en totalité par sa
propre première question — ce qui est honnête, et ce qui signifie qu'il ne doit pas circuler tel
quel.

La seconde est plus précise et plus corrigible : **le marqueur `[À SOURCER]` est défini en §0 et
n'est utilisé nulle part**. §0 promet au lecteur qu'il pourra reconnaître inline « tout chiffre
actuellement affiché ou revendiqué sans source ». La promesse n'est pas tenue, et pendant ce temps
plusieurs chiffres porteurs circulent sans marqueur et sans citation : « le churn médian des
communautés payantes est de 5,8 % par mois » (UJ-2), « environ 63 % des internautes sont sur
Facebook » (UJ-3), « un site à 400 000 francs une fois, **prix courant à Dakar** » (UJ-3),
« 85 à 97 % des unités économiques sénégalaises » (D-02), « 7 à 16 % du chiffre d'affaires
annuel » (D-01). §2.1 cite ses sources inline avec rigueur (BCEAO, GSMA, ITU, DataReportal,
HolonIQ) ; §4 et §6.1 ne citent **aucune** source — et ce sont les sections qui portent les
décisions. Le contraste est d'autant plus visible que D-03 est précisément une charge contre les
chiffres non sourcés.

### Findings

- **critical** Densité d'items ouverts incompatible avec l'enjeu déclaré (§0, §4, §6.1, §6.2, §11) — ~31 items ouverts (10 questions, 13 hypothèses de fond, 3 décisions non tranchées, 5 exigences qui sont des activités de recherche), et Q-01 marquée « Bloquant pour : Tout le document ». Un document externe ne peut pas être remis dans cet état. *Fix :* fermer d'abord le groupe qui bloque la lecture externe (Q-01, Q-06, Q-07, D-03) et publier une version « externe » restreinte, en gardant la version complète comme document de travail interne.
- **high** Le marqueur `[À SOURCER]` est institué en §0 et employé zéro fois (§0, §4, §6.1) — la promesse de repérage inline n'est pas tenue, et cinq chiffres porteurs de décision circulent sans marqueur ni citation, dont deux (« 7 à 16 % », « 400 000 F prix courant à Dakar ») entrent en tension avec les annexes de recherche du même dossier. *Fix :* appliquer le marqueur, ou citer l'annexe au point d'usage comme le fait §2.1 ; corriger « prix courant à Dakar » (l'annexe donne 150–300 k pour Dakar, 400 k étant le haut de la fourchette d'Abidjan).
- **medium** Cinq entrées de la Partie B sont des activités de recherche présentées comme des exigences (§6.2 FR-072, FR-075, FR-081, FR-086, FR-090) — sans livrable, sans échantillon, sans critère de succès. FR-081 est le meilleur du lot (il donne un nombre d'entretiens) ; FR-072 ne dit ni sur quel segment, ni sur quelle amplitude de prix, ni ce qui constituerait un résultat. *Fix :* leur donner un livrable nommé et un critère d'arrêt, ou les sortir de la numérotation FR et les placer dans un plan de validation distinct.
- **low** Aucun `[NON-GOAL]` ni `[NOTE FOR PM]` inline (tout le document) — la substitution par D-xx et Q-xx est légitime et plus lisible ; signalé pour mémoire, pas comme un défaut.

---

## Downstream usability — thin

Cette dimension compte pleinement ici, le PRD étant déclaré chef de chaîne vers `bmad-ux`,
`bmad-architecture` et `bmad-create-epics-and-stories`. Le bilan est contrasté.

Ce qui est irréprochable : **la continuité des identifiants**. Vérifié programmatiquement —
FR-001 à FR-091 sans trou ni doublon, quatre-vingt-onze définitions pour quatre-vingt-onze
identifiants ; NFR-01 à NFR-13, M-01 à M-11, R-01 à R-13, Q-01 à Q-10, D-01 à D-03, UJ-1 à UJ-4,
tous contigus et uniques. Les renvois par identifiant (`voir R-04`, `voir D-01`, `voir UJ-2`,
`voir R-09`) résolvent tous. Et **`addendum.md` est un excellent intrant pour
`bmad-architecture`** : frontières de version explicitées avec leur mode de panne (« Tailwind 4
casserait silencieusement une quarantaine de jetons de couleur »), trois projets TypeScript avec
leurs cibles et leur couverture d'intégration, cartographie complète des miroirs de prix, coût
réel d'un renommage de segment (six emplacements), et l'avertissement qui vaut à lui seul le
document (« le frontend est mis en ligne par un déploiement Wrangler, pas par la chaîne
d'intégration continue »). Un architecte peut travailler à partir de là.

Ce qui manque est ce que la rubrique demande nommément. **Il n'y a pas de glossaire** — recherché
dans les deux fichiers, absent. **Il n'y a pas d'index des hypothèses** — treize `[ASSUMPTION]`
inline, aucun aller-retour possible ; un lecteur qui veut la liste des inférences doit relire le
document. L'absence de glossaire se paie immédiatement, parce que le document a une vraie dérive
terminologique sur ses noms porteurs. **« Rysmo » désigne deux entités** : l'assistant pédagogique
(FR-037 à FR-045, NFR-10, addendum §5, M-05) et l'opérateur humain (front-matter `author: Rysmo`,
titre d'UJ-4 « Rysmo opère la plateforme, seul ») — sur le nom le plus fréquent du PRD, dans un
document destiné à un développeur qu'on recrute. L'offre TPE porte **cinq appellations** :
`/presence-digitale`, « Digital Commerce Local », « offre TPE », « ligne TPE », « ligne 11 » — et
**« ligne 11 » n'est définie nulle part dans `prd.md`** alors qu'elle apparaît trois fois dans les
tableaux les plus lus (R-02, R-07, Q-05) ; le contexte des onze lignes ne vit que dans
l'addendum §9. « Formation » et « cours » alternent sans règle (FR-014 « formations », FR-022
« lecteur de cours », NFR-04 « le poids d'une page et d'un cours »). « Relance » recouvre trois
mécanismes distincts (reprise de cours FR-028, coaching Rysmo FR-045, recouvrement mensuel D-02).

Sur la traçabilité fonctionnelle : **UJ-1 et UJ-3 ne sont cités par aucune exigence, aucune NFR,
aucune métrique.** Seul UJ-4 est câblé correctement (trois renvois, dont NFR-11) et UJ-2 une fois
(FR-076). Autrement dit le parcours de la ligne de revenu principale — Aïssatou — n'a aucun
descendant identifiable, alors que sa clause de sortie exige trois choses précises (survie à une
session interrompue, cadrage du prix avant affichage, certificat publiquement vérifiable) qui
existent bel et bien ailleurs sous NFR-05, FR-072 et FR-025. Il n'existe **aucune matrice
FR → UJ ni FR → M** : `bmad-ux` ne peut pas savoir quels écrans servent quel parcours, et
`bmad-create-epics-and-stories` n'a ni priorité, ni dépendance, ni taille pour ordonner les
vingt-quatre exigences de la Partie B.

### Findings

- **critical** Aucun glossaire (tout le document) — la rubrique le demande, et le PRD en a un besoin objectif : « Rysmo » a deux référents, l'offre TPE en a cinq, « ligne 11 » n'est pas défini, « formation »/« cours » et trois sens de « relance » alternent. *Fix :* un glossaire d'une quinzaine d'entrées en annexe de `prd.md`, et un renommage — l'assistant garde « Rysmo », l'opérateur devient « l'opérateur » partout, y compris dans le titre d'UJ-4.
- **critical** Aucun index des hypothèses (§4, §6.1, §6.2, §8, §9) — treize `[ASSUMPTION]` inline sans consolidation, alors que §0 en fait le pivot du contrat de lecture et que Q-01 en fait la première action à mener. *Fix :* une table en annexe — identifiant, texte, section d'origine, ce qui la validerait, statut — et un renvoi depuis chaque tag inline.
- **high** « Rysmo » désigne l'assistant IA et l'opérateur humain (front-matter, §4 UJ-4, §5.7) — collision sur le nom le plus fréquent du document, pour un lectorat qui inclut un développeur à recruter. *Fix :* voir ci-dessus.
- **high** UJ-1 et UJ-3 ne sont référencés par aucune exigence, aucune métrique ; aucune matrice FR → UJ ni FR → M (§4, §5, §6.2, §8) — deux parcours sur quatre, dont celui de la ligne de revenu principale, n'ont aucun descendant traçable. *Fix :* ajouter une colonne « Parcours » aux exigences, ou une table de traçabilité en annexe ; a minima citer UJ-1 depuis NFR-05, FR-025 et FR-068, et UJ-3 depuis D-01 et FR-079.
- **medium** « Ligne 11 » n'est définie nulle part dans `prd.md` (§9 R-02, R-07 ; §11 Q-05) — le terme n'apparaît que dans les tableaux, et son référentiel (les onze lignes de service) ne vit que dans `addendum.md` §9. *Fix :* définir au glossaire, ou remplacer par « ligne Présence Digitale » partout.
- **medium** L'offre TPE porte cinq noms (§3, §5.8, §6.2, §9) — `/presence-digitale`, « Digital Commerce Local », « offre TPE », « ligne TPE », « ligne 11 ». *Fix :* un nom canonique au glossaire, les autres en alias déclarés.
- **medium** Rien n'est exploitable pour ordonner la Partie B (§6.2) — ni priorité, ni dépendance, ni taille. `bmad-create-epics-and-stories` devra inventer l'ordonnancement, donc l'arbitrage produit. *Fix :* ajouter priorité et dépendances aux vingt-quatre exigences, ou au moins ordonner les cinq blocs.
- **low** « Formation »/« cours » et trois sens de « relance » (§5.4, §5.5, §5.7, §6.1) — dérive lexicale sans conséquence de compréhension immédiate, mais qui casse toute extraction automatisée par terme. *Fix :* glossaire.

---

## Shape fit — strong

La forme choisie est la bonne, et elle est tenue. Le découpage Partie A / Partie B est exactement
ce qu'un brownfield destiné à une lecture externe demande, et il est appliqué sans glissement :
§5 s'ouvre sur « chaque exigence de cette partie est **constatée dans le code**. Elle décrit un
comportement livré, pas un objectif », §6 sur « rien de cette partie n'est livré ». La promesse
« les identifiants FR sont stables et globaux : ils ne seront jamais réattribués » est le bon
engagement pour un dépôt qui va vivre. Le renvoi du *comment* vers `addendum.md` est propre et
respecté — je n'ai trouvé aucune fuite d'implémentation dans le corps du PRD, ce qui est rare.
Quatre parcours pour un produit grand public multi-lignes est le bon calibre : ni sur-formalisé
(la rubrique s'alarme au-delà de quatre), ni sous-formalisé. Les métriques opérationnelles
(M-01 charge de support, M-05 coût IA par membre, M-08 taux de recouvrement) reflètent
correctement la nature mi-produit mi-exploitation-solo de l'objet.

Deux réserves mineures. La rubrique demande, en brownfield, de distinguer les parcours existants
des nouveaux : ici les quatre UJ décrivent tous l'état actuel, et la Partie B modifie
substantiellement deux d'entre eux — UJ-2 via FR-076 / FR-077, UJ-3 via D-01 / FR-079 — sans en
donner la version cible. Un lecteur ne voit donc pas à quoi ressemble le parcours de Moussa après
la phase suivante. Et la vérification interne des références au code fait apparaître au moins un
écart (FR-057 annonce vingt écrans, en énumère dix-neuf) ; l'exactitude complète des références
Partie A relève d'une relecture contre le dépôt, hors du périmètre de cette rubrique.

### Findings

- **medium** La Partie B modifie deux parcours sans en donner la version cible (§4 UJ-2, UJ-3 ; §6.2 FR-076, FR-077, FR-079) — la rubrique brownfield demande de distinguer parcours existants et nouveaux ; ici tout est en état actuel. *Fix :* ajouter un paragraphe « après la phase suivante » à UJ-2 et UJ-3, ou deux UJ cibles distinctes.
- **low** FR-057 annonce vingt écrans et en énumère dix-neuf (§5.10, cohérent avec §5.1) — décompte : tableau de bord, articles, formations, utilisateurs, messages, analytique, paramètres, podcasts, vidéos, transactions, coupons, annonces, FAQ, témoignages, rendez-vous, Club, prospects TPE, projets, redirections. *Fix :* ajouter l'écran manquant ou corriger le nombre.

---

## Mechanical notes

- **Continuité des identifiants : irréprochable.** FR-001→FR-091 sans trou ni doublon, avec
  quatre-vingt-onze définitions pour quatre-vingt-onze identifiants ; NFR-01→13, M-01→11,
  R-01→13, Q-01→10, D-01→03, UJ-1→4 tous contigus et uniques. Tous les renvois par identifiant
  résolvent.
- **Renvoi de section erroné.** §2.2, dernier paragraphe : « pour la ligne TPE, dix à quinze
  entretiens de qualification (§6.1) » — les entretiens sont FR-081, en §6.2. §6.1 ne contient
  que les trois décisions.
- **Index des hypothèses : absent** (13 tags inline, aucun aller-retour possible). **Glossaire :
  absent.** Les deux sont demandés par la rubrique.
- **Marqueur déclaré non employé.** `[À SOURCER]`, défini en §0, apparaît zéro fois dans le corps.
- **Incohérences de format entre exigences jumelles.** FR-051 énumère ses cinq statuts de
  prospect, FR-055 n'énumère pas les siens. FR-039 renvoie à un intervalle *N* que ni le PRD ni
  l'addendum ne chiffre.
- **Couverture de l'addendum.** `addendum.md` ne cite que FR-088, FR-089 et NFR-01/03/09/10/13 :
  la plupart de ses contraintes techniques (trois projets TypeScript, découpage des paquets,
  absence de formateur, forme canonique de gestion d'erreur) ne sont rattachées à aucune exigence
  du PRD. Sans impact sur la qualité du PRD, mais `bmad-architecture` devra faire le lien seul.
- **Protagonistes des parcours.** Les quatre UJ ont un protagoniste nommé et porteur de contexte
  inline (âge, ville, métier, contrainte). Aucun parcours flottant. Réserve : le protagoniste
  d'UJ-4 porte le nom d'une fonctionnalité du produit (voir Downstream usability).
- **Sections attendues pour l'enjeu déclaré.** Présentes : résumé exécutif, contexte, parcours,
  exigences fonctionnelles, non fonctionnelles, métriques + contre-métriques, risques, hors
  périmètre, questions ouvertes. Manquantes : glossaire, index des hypothèses, critères
  d'acceptation, et — pour un document externe — toute notion de propriétaire et d'échéance.
