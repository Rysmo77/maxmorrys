/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES JALONS DU PARCOURS — la donnée, hors de la page qui la rend.
 *
 * Elle vivait dans `src/pages/About.tsx`, avec les onze clés, les preuves, les non prouvables
 * et deux dates. Elle en sort pour la raison qui a déjà fait sortir la grille tarifaire de
 * `PresenceDigitale.tsx` et l'engagement du Club de `ClubDigitos.tsx` : le fichier qu'on ouvre
 * pour AJOUTER UNE PREUVE ne doit pas être un composant de huit cents lignes, et une valeur
 * que `scripts/proof-check.mjs` garde ne doit pas dépendre de ce qu'un rendu en fait.
 *
 * Rien n'a changé de sens en chemin. La page importe, elle ne décide plus.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * La date à laquelle le parcours a été relevé auprès de son auteur.
 *
 * `<Num>` exige `asOf` : un jalon déclaré n'est pas lu en base, il est DIT par quelqu'un, à un
 * moment. Le composant l'annonce au survol et au lecteur d'écran — « parcours déclaré par
 * Max-Morrys · relevé du 30/08/2026 » — ce qui est exactement le statut de cette information.
 */
export const DECLARED_AT = new Date('2026-08-30T12:00:00Z');

/**
 * L'EMPREINTE DES JALONS AU JOUR DU RELEVÉ — ce qui empêche la date ci-dessus de mentir.
 *
 * `DECLARED_AT` date un texte qui ne vit pas dans ce fichier : les onze jalons sont dans
 * `about.json`, en deux langues. Rien ne reliait les deux. Une correction de libellé l'an
 * prochain aurait gardé « relevé du 30/08/2026 » — une date à laquelle ce texte-là n'avait
 * jamais été relu, affichée par le composant dont tout l'objet est de dire d'où vient ce
 * qu'il montre.
 *
 * `npm run proof:check` recalcule cette empreinte sur les deux langues et échoue si elle a
 * bougé, avec la marche à suivre : relire les jalons, déplacer `DECLARED_AT`, reporter la
 * nouvelle valeur. Trois gestes qu'aucune vigilance n'a besoin de porter.
 *
 * ⚠️ MIDI UTC ci-dessus, pas minuit : `<Num>` rend la provenance dans le fuseau du visiteur,
 * et à minuit elle affichait la veille à l'ouest de Greenwich.
 */
export const MILESTONES_FINGERPRINT = 'e9e48b37763f9bb6';

/**
 * ── LA FRISE, EN TROIS CHAPITRES ────────────────────────────────────────────────────────
 *
 * Onze jalons en une colonne, chacun avec sa description : la section faisait à elle seule
 * plus d'un écran et demi, sur une page dont le rôle est de rassurer AVANT l'achat. Le kit,
 * lui, n'en dessine que trois et pose un emplacement « trois à cinq jalons à ajouter » — la
 * longueur est donc un écart, pas une fidélité.
 *
 * Les onze restent TOUS visibles : cacher une date sur la page dont le métier est de donner
 * des dates vérifiables serait le contraire du but. Ils sont groupés par chapitre, et les
 * trois chapitres passent côte à côte au-delà de 1080 px — la hauteur est divisée par trois
 * sans qu'aucun fait ne disparaisse.
 *
 * LES CHAPITRES SONT UNE INFORMATION, PAS UN ORNEMENT : ils nomment les trois temps que la
 * frise raconte déjà — la formation, le basculement vers le digital, la construction. C'est
 * pour ça qu'ils portent leur intervalle d'années plutôt qu'un numéro.
 */
export const CHAPTERS = [
  { key: 'learn', items: ['m2014', 'm2017', 'm2018', 'm2020'] },
  { key: 'pivot', items: ['m2021', 'm2023Onoma', 'm2023Master'] },
  { key: 'build', items: ['m2024Jan', 'm2024May', 'm2025Apr', 'm2025'] },
] as const;

/**
 * ── LA PREUVE PUBLIQUE D'UN JALON ───────────────────────────────────────────────────────
 *
 * Une date, un établissement, un employeur : tout ça est DÉCLARÉ par une personne. Sur une
 * page qui remplace la preuve sociale, la seule chose qui vaut mieux qu'une déclaration est
 * un lien qu'un inconnu peut ouvrir sans me croire.
 *
 * Chaque jalon peut donc porter une URL. Quand elle existe, la ligne affiche « Vérifier ↗ » ;
 * quand elle n'existe pas ET qu'elle est due, elle affiche « déclaré » — et l'emplacement en
 * bas de section compte ces lignes-là, au lieu de laisser croire que tout est sourcé.
 *
 * CE QUI FAIT UNE PREUVE ACCEPTABLE ICI, par ordre de force :
 *   1. une page du TIERS qui te nomme (un employeur, une école, une association) ;
 *   2. une réalisation en ligne que tu as construite — `src/lib/brand/clients.ts` en porte
 *      quatorze, toutes avec leur URL, et c'est la source la plus solide dont dispose cette
 *      page depuis que les accords écrits sont obtenus ;
 *   3. un profil public que TU tiens (LinkedIn), qui prouve la déclaration, pas le fait.
 *
 * Ce qui n'en est pas une : un annuaire tiers recopié, une capture d'écran, un chiffre.
 */
export const MILESTONE_PROOFS: Partial<Record<string, string>> = {
  // À remplir au fil des accords : `m2024Jan: 'https://…/equipe'`, etc.
};

/**
 * ── LE TROISIÈME ÉTAT : CE QU'AUCUN LIEN NE PROUVERA JAMAIS ─────────────────────────────
 *
 * « Déclaré » est une DETTE : le mot annonce un lien qui n'est pas encore là. Trois des onze
 * jalons n'en doivent aucun — un départ pour Abidjan, une arrivée à Dakar, la découverte d'un
 * métier. Aucun tiers ne publie de page sur un déménagement, et il n'en publiera pas l'an
 * prochain non plus.
 *
 * Les laisser sous « déclaré » avait deux conséquences, fausses toutes les deux : l'encart du
 * bas réclamait huit liens là où cinq sont réellement dus, et il ne pouvait PAS atteindre zéro
 * — c'est-à-dire qu'il ne se serait jamais fermé, quoi qu'on lui apporte.
 *
 * Ces lignes portent donc « personnel ». La ligne n'est jamais muette pour autant : le silence
 * présenterait une déclaration comme un fait vérifié, ce que cette page refuse.
 *
 * ⚠️ CE N'EST PAS UNE SORTIE DE SECOURS. Un jalon qui nomme un employeur, une école, une
 * association ou une plateforme en ligne DOIT un lien, même si personne ne l'a encore trouvé.
 * N'entre ici que ce dont aucune page tierce ne peut exister.
 */
export const MILESTONE_UNPROVABLE: ReadonlySet<string> = new Set(['m2014', 'm2018', 'm2021']);

/**
 * L'ENCART QUI RÉCAPITULAIT LES PREUVES DUES A ÉTÉ RETIRÉ LE 05/09/2026 (décision éditoriale).
 * `MILESTONE_KEYS` et `MILESTONES_OWED` le comptaient : sans lui, ils ne comptent plus rien et
 * sont partis avec. Les deux tables ci-dessus restent la source des états rendus ligne à ligne
 * sur la frise — « Vérifier », « déclaré », « personnel » — et gardent leurs portes CI.
 */
