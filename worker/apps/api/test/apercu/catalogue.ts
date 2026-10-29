/**
 * LE CATALOGUE DES COURRIERS — chaque e-mail du produit, rendu avec des données d'exemple.
 *
 * Deux usages, une seule liste :
 *   · `test/email-gabarits.test.ts` vérifie chaque entrée (version texte, voix, retrait) ;
 *   · `scripts/apercu-emails.mjs` les écrit dans `.email-preview/` pour les ouvrir au navigateur.
 *
 * Un courrier ajouté au produit sans entrée ici échappe aux deux. C'est la liste à tenir.
 * Les données sont FICTIVES et pures : aucun réseau, aucune base, aucun binding.
 */
import { buildAppointmentNotice } from '../../src/lib/appointment';
import { rendreCampagne, type DemandeCampagne } from '../../src/lib/campagne';
import { rendreModele } from '../../src/lib/envoi-modele';
import { buildInvoice } from '../../src/lib/invoice';
import { MODELES, regimeDe, type CleModele } from '../../src/lib/modeles';
import { buildPurchaseNotice, type AchatKind } from '../../src/lib/purchase';
import { buildQuoteExpiryNotice } from '../../src/lib/quote-expiry';
import { buildRenewalNotice } from '../../src/lib/renewal';
import { buildReplyNotice } from '../../src/lib/reply';
import { buildRysmoRenewalNotice } from '../../src/lib/rysmo-renewal';
import { buildWaitlistConfirmation, buildWaitlistOpening } from '../../src/lib/waitlist-mail';

export type Langue = 'fr' | 'en';

export interface Entree {
  /** Nom de fichier, sans extension. */
  fichier: string;
  nom: string;
  regime: 'transactionnel' | 'marketing';
  declencheur: string;
  langue: Langue;
  rendu: { subject: string; html: string; text: string };
}

const BASE = 'https://maxmorrys.me';
const RETRAIT = (l: Langue) => `https://api.maxmorrys.me/desabonnement?e=awa%40example.com&s=${'0'.repeat(64)}&l=${l}`;

/** Paramètres d'exemple des gabarits déclenchés. */
const PARAMS: Record<CleModele, Record<string, string>> = {
  certificat: { prenom: 'Awa', formation: 'Vendre sur WhatsApp', code: 'MM-7K2Q-9XPA', lien: `${BASE}/verifier?code=MM-7K2Q-9XPA` },
  panierAbandonne: { prenom: 'Awa', designation: 'Vendre sur WhatsApp', mentionCoupon: 'Rien n’a été débité, et rien ne sera débité tant que tu n’auras pas repris.', lien: `${BASE}/formations/vendre-sur-whatsapp` },
  bienvenue1: { prenom: 'Awa', lien: `${BASE}/mon-espace` },
  accuseDevis: { prenom: 'Moussa', ref: 'DV-2026-0142', validite: '30', commerce: 'Boutique Ndiaye', montant: '250 000 F', expiration: '28/11/2026', lien: `${BASE}/devis/DV-2026-0142` },
  accuseAgence: { prenom: 'Moussa', entreprise: 'Ndiaye & Fils' },
  bienvenue2: { prenom: 'Awa', lien: `${BASE}/mon-espace/repetiteur` },
  bienvenue3: { prenom: 'Awa', lien: `${BASE}/formations` },
  quotaRysmo: { prenom: 'Awa', solde: '0 jeton', lien: `${BASE}/mon-espace/repetiteur` },
  serieRompue: { prenom: 'Awa', serie: '12', lien: `${BASE}/mon-espace` },
  reactivation: { prenom: 'Awa', lien: `${BASE}/blog` },
  nurtureDevis: { prenom: 'Moussa', ref: 'DV-2026-0142', expiration: '28/11/2026', lien: 'https://wa.me/221776041985' },
};

/** Un numéro d'exemple de la lettre, en blocs — la forme que n8n et les agents envoient. */
export function lettreExemple(langue: Langue): DemandeCampagne {
  const fr = langue === 'fr';
  return {
    id: 'lettre-exemple',
    objet: fr ? 'Ce que j’ai appris en vendant sur WhatsApp' : 'What selling on WhatsApp taught me',
    preheader: fr ? 'Trois choses, cinq minutes de lecture.' : 'Three things, a five-minute read.',
    langue,
    segment: 'lettre',
    mode: 'test',
    taille: 25,
    blocs: [
      { type: 'surTitre', texte: fr ? 'La lettre · numéro 1' : 'The letter · issue 1' },
      { type: 'titre', texte: fr ? 'Vendre sans site, d’abord.' : 'Sell without a site, first.' },
      { type: 'paragraphe', texte: fr ? 'Bonjour,' : 'Hi,' },
      { type: 'paragraphe', texte: fr ? 'Ces deux dernières semaines, j’ai publié un guide sur le catalogue WhatsApp Business. Voilà ce que j’en retiens.' : 'Over the last two weeks I published a guide to the WhatsApp Business catalogue. Here’s what I took from it.' },
      { type: 'encadre', texte: fr ? 'Un catalogue de dix produits bien photographiés vend mieux qu’un site de cent produits que personne ne visite.' : 'A catalogue of ten well-shot products sells better than a hundred-product site nobody visits.' },
      { type: 'bouton', libelle: fr ? 'Lire le guide' : 'Read the guide', url: `${BASE}/blog/catalogue-whatsapp` },
      { type: 'paragraphe', texte: 'Max-Morrys' },
    ],
  };
}

export function catalogue(): Entree[] {
  const entrees: Entree[] = [];
  for (const langue of ['fr', 'en'] as const) {
    const L: Langue = langue;
    const push = (fichier: string, nom: string, regime: Entree['regime'], declencheur: string, rendu: Entree['rendu']) =>
      entrees.push({ fichier: `${fichier}.${L}`, nom, regime, declencheur, langue: L, rendu });

    /* ── Le chemin de l'argent (webhook Bictorys → transaction-mail.ts) ── */
    const facture = buildInvoice(
      { amount: 95000, currency: 'XOF', designation: 'Vendre sur WhatsApp', userEmail: 'awa@example.com', userName: 'Awa Diop', chargeId: 'ch_exemple', paidAt: '2026-10-29T09:30:00.000Z' },
      'MM-2026-000142',
      L,
    );
    push('facture', 'Facture', 'transactionnel', 'Webhook de paiement validé (`transaction-mail.ts`).', facture);

    const kinds: AchatKind[] = ['formation', 'club', 'rysmoPack', 'rysmoSubscription'];
    for (const kind of kinds) {
      push(`achat-${kind}`, `Confirmation d’achat — ${kind}`, 'transactionnel', 'Webhook de paiement validé (`transaction-mail.ts`).',
        buildPurchaseNotice({ kind, langue: L, userName: 'Awa', designation: 'Vendre sur WhatsApp', jetonsCredites: 500, soldeTotal: 1700, jusquAu: L === 'fr' ? '29/10/2027' : '10/29/2027', url: `${BASE}/mon-espace` }));
    }

    /* ── Cron 08:00 ── */
    push('rappel-club', 'Rappel d’échéance du Club (J-15)', 'transactionnel', 'Cron 08:00, J-15 avant la fin d’accès (`renewal.ts`).',
      buildRenewalNotice({ userName: 'Awa', expiresAt: '2026-11-13T00:00:00.000Z', langue: L }, L === 'fr' ? '13/11/2026' : '11/13/2026', 'https://club.maxmorrys.me/abonnement'));
    push('rappel-club-programme', 'Rappel d’échéance du Club — renouvellement programmé', 'transactionnel', 'Cron 08:00, J-15, membre ayant consenti au lien annuel (`renewal.ts`).',
      buildRenewalNotice({ userName: 'Awa', expiresAt: '2026-11-13T00:00:00.000Z', langue: L }, L === 'fr' ? '13/11/2026' : '11/13/2026', 'https://club.maxmorrys.me/abonnement',
        { lienLe: L === 'fr' ? '06/11/2026' : '11/06/2026', urlGerer: 'https://club.maxmorrys.me/abonnement' }));
    push('rappel-rysmo', 'Rappel d’échéance Rysmo+', 'transactionnel', 'Cron 08:00, J-5 avant la fin du mois (`rysmo-renewal.ts`).',
      buildRysmoRenewalNotice({ userName: 'Awa', langue: L }, L === 'fr' ? '03/11/2026' : '11/03/2026', `${BASE}/mon-espace/repetiteur`));
    push('relance-devis', 'Relance de devis (J-7)', 'transactionnel', 'Cron 08:00, 7 jours avant l’expiration du devis (`quote-expiry.ts`).',
      buildQuoteExpiryNotice({ ref: 'DV-2026-0142', commerce: 'Boutique Ndiaye', echeance: L === 'fr' ? '28/11/2026' : '11/28/2026' }, 'Moussa', L, BASE));

    /* ── Réponses et accusés ── */
    push('reponse-message', 'Réponse à un message de contact', 'transactionnel', 'Callable `replyToMessage` (console admin).',
      buildReplyNotice({ destinataireNom: 'Awa', sujet: L === 'fr' ? 'Paiement Wave' : 'Wave payment', question: L === 'fr' ? 'Est-ce que je peux payer en deux fois ?' : 'Can I pay in two instalments?', reponse: L === 'fr' ? 'Pas pour l’instant : chaque paiement se fait en une fois, en Wave ou Orange Money.' : 'Not for now: each payment is made in one go, by Wave or Orange Money.', langue: L }, `${BASE}/mon-espace`));
    push('accuse-rdv', 'Accusé de rendez-vous', 'transactionnel', 'Callable `acknowledgeAppointment`, à la demande de rendez-vous.',
      buildAppointmentNotice({ nom: 'Moussa', date: '2026-11-04', heure: '10:00', objet: L === 'fr' ? 'Ma boutique en ligne' : 'My online shop' }, L, BASE));

    /* ── Liste d'attente (un seul e-mail promis, à l'ouverture) ── */
    const formation = { titre: 'Vendre sur WhatsApp', slug: 'vendre-sur-whatsapp', ouverture: L === 'fr' ? '15 novembre 2026' : 'November 15, 2026', tarif: '45 000 F' };
    push('attente-inscription', 'Liste d’attente — inscription', 'transactionnel', 'Callable `joinWaitlist`, à l’inscription.', buildWaitlistConfirmation(formation, L, BASE));
    push('attente-ouverture', 'Liste d’attente — ouverture', 'transactionnel', 'Callable `notifyWaitlist` (console admin), le jour de l’ouverture.', buildWaitlistOpening(formation, L, BASE));

    /* ── Gabarits déclenchés (ex-Brevo) ── */
    for (const cle of Object.keys(MODELES) as CleModele[]) {
      const regime = regimeDe(cle);
      push(`modele-${cle}`, `Gabarit ${cle}`, regime, MODELES[cle].declencheur,
        rendreModele(cle, L, PARAMS[cle], regime === 'marketing' ? RETRAIT(L) : undefined));
    }

    /* ── La lettre ── */
    push('lettre', 'La lettre (campagne)', 'marketing', 'n8n WF-09 ou un agent, via `POST /marketing/campagne`.', rendreCampagne(lettreExemple(L), RETRAIT(L)));
  }

  return entrees;
}
