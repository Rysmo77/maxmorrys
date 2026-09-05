/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'ENGAGEMENT DU CLUB — ET POURQUOI IL N'EST PAS DANS `demo.ts`.
 *
 * Ces deux listes vivaient sous l'interrupteur `EXPO_PUBLIC_CONTENU_DEMO`, avec le reste du
 * contenu de démonstration. Conséquence : en production, elles valaient `null`, et l'écran
 * `club/infos` affichait un `<SansDonnees origine="du serveur">` — c'est-à-dire qu'il
 * annonçait attendre d'un serveur une promesse que personne n'a jamais eu l'intention d'y
 * ranger.
 *
 * ⚠️ CE N'EST PAS UNE DONNÉE SIMULÉE. C'est l'engagement commercial du produit, les mêmes
 * mots que le site publie. Le simuler n'a aucun sens ; le faire disparaître non plus. La
 * règle de `contenu/portee.ts` s'applique ici telle quelle — « ce qui route reste, ce qui
 * raconte disparaît » — à ceci près que ceci ne RACONTE pas : ça ENGAGE.
 *
 * ── LA SECONDE LISTE EST LA RAISON D'ÊTRE DE L'ÉCRAN ────────────────────────────────────
 * Une page d'informations qui n'énumère que des promesses vend une deuxième fois quelqu'un
 * qui a déjà payé. `pasGaranti` n'est donc pas une précaution juridique : c'est ce qui rend
 * la première liste croyable.
 *
 * ⚠️ CES MOTS ENGAGENT MY ONOMA SARL. Les modifier n'est pas une décision de code. Le site
 * porte sa propre formulation dans `src/i18n/locales/{fr,en}/club.json` ; les deux doivent
 * dire la même chose, et c'est une relecture humaine — pas un test — qui en répond.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export const CLUB_GARANTI = [
  '2 sessions en direct par mois, avec moi',
  'Les missions que je sors de mon carnet',
  'Les ateliers à Dakar, places membres',
  "Une réponse de moi, pas d'un modérateur",
] as const;

export const CLUB_PAS_GARANTI = [
  'Des clients',
  'Un revenu',
  'Une place à chaque atelier — elles sont comptées',
  'Une réponse dans l’heure : je réponds dans la journée ouvrée',
] as const;

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'OFFRE PRÉSENCE DIGITALE — MÊME NATURE, MÊME RAISON DE NE PAS ÊTRE SIMULÉE.
 *
 * Elle vivait aussi sous l'interrupteur de démonstration, donc l'écran `/presence` — atteignable
 * depuis l'onglet Profil — était VIDE en production. Une offre commerciale n'est pas une donnée
 * à simuler : c'est ce que l'entreprise vend, avec les mots et le prix qu'elle annonce.
 *
 * ⚠️ ET LE PRIX RESTE, DÉLIBÉRÉMENT. Présence Digitale est une prestation du MONDE RÉEL —
 * une fiche Google, un site vitrine, des photos. La règle App Store 3.1.5(a) exige justement
 * que ce type de prestation se transacte HORS du magasin, et `mobile-store-achats.test.ts`
 * nomme `presence.tsx` et `devis.tsx` dans sa liste d'exceptions `PRESTATION_REELLE`.
 *
 * Ne pas confondre avec les formations et le Club : ceux-là sont du contenu numérique consommé
 * dans l'application, et leurs montants ont quitté le paquet.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
/**
 * ⚠️ LA PROVENANCE D'UN PRIX N'EST PAS UNE FORMALITÉ. La règle 6 du système — « un nombre en
 * monospace vient de la base ou d'une source citée, sinon il ne s'affiche pas » — vaut ici
 * comme ailleurs. Ces montants ne viennent d'aucune base : ils viennent de l'OFFRE, telle
 * qu'elle est publiée, et cette citation le dit. `PRESENCE_ARRETEE` porte la date à laquelle
 * la grille a été arrêtée — la changer sans changer cette date ferait afficher un prix neuf
 * sous une date ancienne, c'est-à-dire un relevé faux.
 */
export const PRESENCE_SOURCE = { cite: 'Offre Présence Digitale — grille publiée' } as const;
export const PRESENCE_ARRETEE = new Date('2026-08-02T00:00:00Z');

export const PACK_PRESENCE = {
  nom: 'Pack Visible',
  prix: 250000,
  prixBarre: 295000,
  ancrage: 400000,
  lignes: [
    'Fiche Google optimisée', 'Site vitrine · 5 pages', 'Photos et textes',
    'Prise en main · 1 h', 'Nom de domaine · 1 an',
  ],
} as const;

/** La question de qualification. Elle oriente la conversation, elle ne collecte rien. */
export const QUESTION_PRESENCE = {
  question: 'Tes clients te trouvent comment aujourd\u2019hui ?',
  reponses: ['Bouche-à-oreille et passage', 'WhatsApp et Facebook', 'Je ne sais pas trop'],
  etape: 2,
  total: 3,
} as const;
