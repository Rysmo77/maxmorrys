/**
 * LA CONFIRMATION D'ACHAT — le courrier qui manquait aux quatre chemins de paiement.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QU'IL FERME
 *
 * Le webhook de paiement traite QUATRE produits — Club, pack de jetons Rysmo, abonnement
 * Rysmo, formation — et n'en annonçait aucun. Un achat de jetons, en particulier, ne
 * déclenchait strictement rien : le solde montait en silence, et la personne devait rouvrir
 * le répétiteur pour constater que son paiement avait abouti.
 *
 * La facture existe, mais elle ne remplit pas ce rôle : c'est une pièce comptable. Elle dit
 * combien on a payé, jamais ce qu'on vient d'obtenir ni où aller.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI UN SEUL MODULE ET QUATRE VARIANTES
 *
 * Les quatre achats partagent la même structure — on te confirme, on te montre ce que tu as,
 * on t'envoie t'en servir — et ne diffèrent que par l'objet obtenu. Quatre fichiers auraient
 * quadruplé la surface où la voix peut diverger, pour une différence qui tient en une ligne
 * de contenu.
 *
 * ⚠️ Ce courrier est TRANSACTIONNEL : il est déclenché par un paiement, il ne demande donc
 * aucun consentement et ne porte pas de lien de désabonnement. Ne jamais y glisser de
 * contenu promotionnel — c'est ce qui ferait basculer tout le canal dans le régime du
 * marketing, avec le consentement et le `List-Unsubscribe` que cela impose.
 */
import * as DS from './email-design';
import { type Langue } from './invoice';

export type AchatKind = 'club' | 'rysmoPack' | 'rysmoSubscription' | 'formation';

export interface Achat {
  kind: AchatKind;
  langue: Langue;
  userName?: string;
  /** Libellé de ce qui a été acheté — `formationTitle` sur la transaction. */
  designation?: string;
  /**
   * Jetons crédités par ce pack, et solde total après crédit.
   *
   * Les deux, et pas seulement le premier : « 500 jetons crédités » ne dit pas si on en a
   * 500 ou 1 700. C'est le solde qui répond à la question qu'on se pose vraiment.
   */
  jetonsCredites?: number;
  soldeTotal?: number;
  /** Date de fin d'accès, déjà mise en forme dans la langue du destinataire. */
  jusquAu?: string;
  /** Où aller maintenant. */
  url: string;
}

const T = {
  fr: {
    bonjour: (nom?: string) => (nom ? `Bonjour ${nom},` : 'Bonjour,'),
    intro: 'Ton paiement est passé. Tout est ouvert de ton côté.',
    apres: "La facture arrive dans un e-mail séparé — c'est la pièce à garder si tu dois justifier la dépense.",
    signature: 'Max-Morrys',
    club: {
      subject: 'Bienvenue au Club des Digitos',
      surtitre: 'Ton accès',
      valeur: 'Club des Digitos',
      note: (d?: string) => (d ? `Ouvert jusqu'au ${d}.` : undefined),
      corps: "Tu as accès à tout : les ateliers, les replays et l'espace des membres.",
      lien: 'Entrer dans le Club',
    },
    rysmoPack: {
      subject: 'Tes jetons sont crédités',
      surtitre: 'Crédités à l’instant',
      valeur: (n: number) => `${n} jetons`,
      note: (solde?: number) => (solde ? `Tu en as ${solde} au total.` : undefined),
      corps: 'Ils sont déjà sur ton compte. Le répétiteur les consomme au fil de tes questions, sans date limite.',
      lien: 'Ouvrir le répétiteur',
    },
    rysmoSubscription: {
      subject: 'Ton abonnement au répétiteur est actif',
      surtitre: 'Ton abonnement',
      valeur: 'Répétiteur Rysmo',
      note: (d?: string) => (d ? `Actif jusqu'au ${d}.` : undefined),
      corps: 'Tu peux poser tes questions sans compter les jetons.',
      lien: 'Ouvrir le répétiteur',
    },
    formation: {
      subject: (titre?: string) => (titre ? `Ton accès à « ${titre} » est ouvert` : 'Ton accès est ouvert'),
      surtitre: 'Ta formation',
      corps: 'Tu peux commencer quand tu veux — ta progression est gardée entre deux sessions.',
      lien: 'Commencer la formation',
    },
  },
  en: {
    bonjour: (nom?: string) => (nom ? `Hi ${nom},` : 'Hi,'),
    intro: "Your payment went through. Everything's open on your side.",
    apres: "The invoice comes in a separate email — that's the one to keep if you ever have to account for the expense.",
    signature: 'Max-Morrys',
    club: {
      subject: 'Welcome to the Digitos Club',
      surtitre: 'Your access',
      valeur: 'Digitos Club',
      note: (d?: string) => (d ? `Open until ${d}.` : undefined),
      corps: "You've got all of it: the workshops, the replays and the members' space.",
      lien: 'Step into the Club',
    },
    rysmoPack: {
      subject: 'Your tokens are in',
      surtitre: 'Just credited',
      valeur: (n: number) => `${n} tokens`,
      note: (solde?: number) => (solde ? `That puts you at ${solde} in total.` : undefined),
      corps: "They're on your account already. The tutor spends them as you ask, and they don't expire.",
      lien: 'Open the tutor',
    },
    rysmoSubscription: {
      subject: 'Your tutor subscription is live',
      surtitre: 'Your subscription',
      valeur: 'Rysmo tutor',
      note: (d?: string) => (d ? `Live until ${d}.` : undefined),
      corps: "You can ask away without counting tokens.",
      lien: 'Open the tutor',
    },
    formation: {
      subject: (titre?: string) => (titre ? `You're in — “${titre}”` : "You're in"),
      surtitre: 'Your course',
      corps: "Start whenever you like — it picks up where you left off.",
      lien: 'Start the course',
    },
  },
} as const;

/**
 * OÙ ENVOYER LA PERSONNE, SELON CE QU'ELLE VIENT D'ACHETER.
 *
 * ⚠️ Ces segments anglais sont une RECOPIE de `src/i18n/segments.ts`. C'est le quatrième
 * miroir de cette table dans le dépôt, et le dépôt a déjà payé cette duplication : le lien
 * de `reply.ts` pointait encore sur `/en/my-space/`, segment abandonné par la refonte, sur
 * un courrier cliqué des jours après son envoi.
 *
 * `tests/unit/segments-sync.test.ts` garde les trois premières copies. Les valeurs ci-dessous
 * doivent être vérifiées contre elle à chaque renommage de segment — c'est aujourd'hui la
 * seule chose qui les tient.
 */
export function urlDeDestination(kind: AchatKind, langue: Langue, base: string): string {
  const fr = langue === 'fr';
  switch (kind) {
    case 'club':
      return `${base}${fr ? '/club-des-digitos' : '/en/digitos-club'}`;
    case 'rysmoPack':
    case 'rysmoSubscription':
      return `${base}${fr ? '/mon-espace/repetiteur' : '/en/my-learning/tutor'}`;
    default:
      return `${base}${fr ? '/mon-espace' : '/en/my-learning'}`;
  }
}

/**
 * Le message de confirmation. Pur — comme la facture et le rappel d'échéance — donc testable
 * sans réseau ni binding.
 */
export function buildPurchaseNotice(achat: Achat): { subject: string; html: string; text: string } {
  const t = T[achat.langue];

  let subject: string;
  let surtitre: string;
  let valeur: string;
  let note: string | undefined;
  let corps: string;
  let lien: string;

  switch (achat.kind) {
    case 'club':
      subject = t.club.subject;
      surtitre = t.club.surtitre;
      valeur = t.club.valeur;
      note = t.club.note(achat.jusquAu);
      corps = t.club.corps;
      lien = t.club.lien;
      break;
    case 'rysmoPack':
      subject = t.rysmoPack.subject;
      surtitre = t.rysmoPack.surtitre;
      valeur = t.rysmoPack.valeur(achat.jetonsCredites ?? 0);
      note = t.rysmoPack.note(achat.soldeTotal);
      corps = t.rysmoPack.corps;
      lien = t.rysmoPack.lien;
      break;
    case 'rysmoSubscription':
      subject = t.rysmoSubscription.subject;
      surtitre = t.rysmoSubscription.surtitre;
      valeur = t.rysmoSubscription.valeur;
      note = t.rysmoSubscription.note(achat.jusquAu);
      corps = t.rysmoSubscription.corps;
      lien = t.rysmoSubscription.lien;
      break;
    default:
      subject = t.formation.subject(achat.designation);
      surtitre = t.formation.surtitre;
      // La désignation VIENT DE LA BASE. Si elle manque, on n'invente pas un titre de
      // remplacement : l'encart porte alors le libellé générique, et rien n'est affirmé.
      valeur = achat.designation ?? t.formation.surtitre;
      corps = t.formation.corps;
      lien = t.formation.lien;
      break;
  }

  const html = DS.page({
    langue: achat.langue,
    apercu: `${valeur}${note ? ` — ${note}` : ''}`,
    contenu: [
      DS.paragraphe(t.bonjour(achat.userName)),
      DS.paragraphe(t.intro, true),
      DS.encart(surtitre, valeur, note),
      DS.paragraphe(corps),
      DS.bouton(lien, achat.url),
      DS.mention(t.apres),
      DS.paragraphe(t.signature),
    ].join('\n'),
  });

  const text = [
    t.bonjour(achat.userName),
    '',
    t.intro,
    '',
    `${surtitre} : ${valeur}`,
    ...(note ? [note] : []),
    '',
    corps,
    achat.url,
    '',
    t.apres,
    '',
    t.signature,
  ].join('\n');

  return { subject, html, text };
}
