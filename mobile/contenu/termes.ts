/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES TERMES QUE L'APPLICATION RECOPIE DU SITE — à un seul endroit, et gardés.
 *
 * `mobile/` ne peut pas importer `src/` : Metro ne résout rien hors de la racine du projet
 * (AD-9). Ces valeurs sont donc RECOPIÉES. Une recopie non gardée est exactement ce qui a
 * fait annoncer 10 000 FCFA aux CGV pendant que le code en débitait 19 900 — d'où ce
 * fichier unique, sans aucune dépendance (ni React, ni React Native), que
 * `tests/unit/mobile-miroirs.test.ts` importe et compare à ses sources :
 *
 *   OFFRE              ← src/lib/presence/offer.ts, src/lib/tax/senegal.ts, presence.json
 *   PORTEES_SUPPORT    ← src/lib/adminAccess.ts (`SUPPORT_SCOPE`, libellés ET ordre)
 *   ECRANS_CONSOLE     ← src/lib/admin/consoleNav.ts (`ADMIN_SCREEN_COUNT`)
 *   WHATSAPP_NUMERO    ← src/lib/brand (`contact.phoneRaw`)
 *   CLUB_OUVERT_EN     ← src/lib/club/pricing.ts (`CLUB_OPENED_AT`)
 *   REMISE_FILLEUL_PCT ← src/lib/club/pricing.ts (`CLUB_REFERRAL_DISCOUNT`, en pourcentage)
 *
 * ⓘ Ces deux défauts ont été trouvés par la réécriture Kotlin (sept.–oct. 2026, abandonnée)
 * et sont reportés ici :
 *   · la console disait « 5 écrans sur 19 » et « les quatorze autres » — la table en compte
 *     davantage ; le total vient désormais de la table, le reste s'en déduit ;
 *   · la carte de l'offre disait « Pack Visible » à 250 000 barré 295 000 — le NOM d'un pack
 *     (`visible`, facturé 495 000) sur le PRIX d'un autre (`presence`).
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Le pack d'entrée de l'offre Présence Digitale — celui auquel appartiennent les montants. */
export const OFFRE = {
  packCle: 'presence',
  /** Source : `packs.presence.name` (presence.json). */
  packNom: 'Présence Locale',
  /** Prix de liste, hors taxes. Source : `PACKS` → `presence.price`. */
  prixListe: 295_000,
  /**
   * Le montant RÉELLEMENT PRATIQUÉ, hors taxes (`packEffectivePrice`). Le web a déjà payé la
   * confusion des deux : la page affichait 250 000 et le devis ouvert derrière le même bouton
   * en annonçait 295 000.
   */
  prixPratique: 250_000,
  supportJours: 30,
  /** Régime « agence » : prestation taxable au taux normal (CGV art. 5.1, hors taxes). */
  tvaTauxPct: 18,
  acomptePct: 60,
  validiteJours: 30,
  /** `CATALOGUE_REVISED_AT`, lue en UTC — posée à midi pour qu'aucun fuseau ne la déplace. */
  reviseLe: '02/08/2026',
  cheminOffre: '/presence-digitale',
  cheminDevis: '/presence-digitale/devis/',
  /**
   * Source : `packs.presence.features` (presence.json), mot pour mot. L'ancienne liste disait
   * « Site vitrine · 5 pages » et « Nom de domaine · 1 an » quand le site vend une page et
   * un an d'hébergement — une promesse que le devis aurait démentie.
   */
  lignes: [
    "Un site d'une page, clair et rapide",
    'Des boutons WhatsApp et appel direct',
    'Ta fiche Google créée et optimisée',
    "Ton catalogue WhatsApp jusqu'à 20 produits",
    'La mesure de tes visites installée',
    "Un an d'hébergement et je te forme à la prise en main",
  ],
} as const;

/** Le site public. Un devis s'y consulte à `OFFRE.cheminDevis + référence`. */
export const SITE_PUBLIC = 'https://maxmorrys.me';

/**
 * L'Edu et le Club ont chacun leur hôte (PRD rév. 6, §2.1 ; table du site :
 * `src/lib/espaces.ts`). L'application n'y renvoie que pour lire — jamais pour vendre.
 */
export const SITE_EDU = 'https://edu.maxmorrys.me';
export const SITE_CLUB = 'https://club.maxmorrys.me';

/**
 * La forme d'une référence de devis : `DV-` puis douze caractères hexadécimaux majuscules.
 * Source : `isValidQuoteRef` (offer.ts). Le kit écrivait `MM-D-4831`, qui n'a pas cette forme.
 */
export const FORME_REFERENCE = /^DV-[0-9A-F]{12}$/;

/**
 * Le lien PUBLIC de vérification d'un certificat : `/verifier?code=…`.
 *
 * ⛔ IL ÉTAIT `/verifier/<code>`, ET LE SITE NE SERT PAS CE CHEMIN : un employeur sans
 * l'application tombait sur la page 404 — ce qui ressemble le plus à un faux document. Le
 * préfixe `/verifier` reste celui des liens profonds (ouvre l'application chez qui l'a), et
 * `VerifyCertificate.tsx` lit `?code=` pour vérifier dès l'arrivée.
 */
export const lienDeVerification = (code: string): string =>
  `${SITE_EDU}/verifier?code=${encodeURIComponent(code)}`;

/** TTC arrondi au franc, comme `ventilerDepuisHT`. */
export const ttc = (ht: number): number => ht + Math.round((ht * OFFRE.tvaTauxPct) / 100);

/** Les cinq portées du rôle support, dans l'ordre du menu du site. */
export const PORTEES_SUPPORT = [
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/temoignages', label: 'Témoignages' },
  { to: '/admin/rendez-vous', label: 'Rendez-vous' },
  { to: '/admin/prospects-agence', label: 'Prospects' },
  { to: '/admin/projets', label: 'Projets' },
] as const;

export type LibellePortee = (typeof PORTEES_SUPPORT)[number]['label'];

/** Le nombre d'écrans de l'espace d'administration du site. Compté là-bas, pas écrit ici. */
export const ECRANS_CONSOLE = 26; // passe 2 : + journal, rôles, modération, quotas, infrastructure

/** « 5 écrans sur 21 » — le texte se DÉDUIT des deux nombres, il ne s'écrit pas. */
export const PORTEE_RESUMEE = `${PORTEES_SUPPORT.length} écrans sur ${ECRANS_CONSOLE}`;
export const ECRANS_HORS_PORTEE = ECRANS_CONSOLE - PORTEES_SUPPORT.length;

export const WHATSAPP_NUMERO = '221776041985';

/**
 * Le mois d'ouverture du Club, en toutes lettres.
 *
 * ⛔ « LE CLUB A OUVERT CETTE ANNÉE » EST UNE PHRASE QUI SE MET À MENTIR — dès janvier. Le site a
 * tranché : granularité au MOIS, écrite en absolu. Le prix et la remise du filleul, eux, ne
 * sont PAS recopiés : l'application n'annonce aucun montant du Club (décision F.1).
 */
export const CLUB_OUVERT_EN = 'août 2026';

/**
 * La remise du filleul, en pourcentage entier. C'est un TERME DE L'OFFRE, pas un relevé :
 * il s'affiche sur l'écran verrouillé du Parrainage. Le prix, lui, ne s'affiche nulle part.
 */
export const REMISE_FILLEUL_PCT = 15;
