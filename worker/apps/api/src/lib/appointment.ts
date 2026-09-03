import * as DS from './email-design';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ACCUSÉ DE DEMANDE DE RENDEZ-VOUS.
 *
 * ⚠️ CE QUI SE PASSAIT AVANT : RIEN. Quelqu'un remplissait le formulaire de `/contact`,
 * voyait un message à l'écran, et n'entendait plus jamais parler de sa demande. Ni accusé,
 * ni rappel, ni invitation d'agenda — et côté interne, aucune alerte non plus. Sur une page
 * dont le métier est la prise de contact, c'est à la fois un moteur de désistement et une
 * fuite de confiance : la personne ne sait même pas si sa demande est arrivée.
 *
 * ⚠️ CE COURRIER N'EST PAS UNE CONFIRMATION, ET IL LE DIT.
 *
 * La tentation est d'écrire « ton rendez-vous est confirmé » : c'est ce que fait n'importe
 * quel gabarit du marché, et ce serait faux ici. Le statut initial est `pending`, la
 * confirmation est un geste MANUEL depuis la console, aucun créneau n'est vérifié — deux
 * personnes peuvent demander la même heure — et aucun calendrier n'est tenu à jour. Annoncer
 * une confirmation automatique produirait exactement la faute que ce dépôt a déjà corrigée
 * ailleurs : promettre ce que le produit ne tient pas.
 *
 * Il accuse donc réception, répète le créneau DEMANDÉ, et nomme la suite telle qu'elle est.
 * Pas d'invitation `.ics` non plus, pour la même raison : un fichier d'agenda dit « c'est
 * pris », ce qui n'est pas vrai tant que personne n'a répondu.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type Langue = 'fr' | 'en';

const T = {
  fr: {
    sujet: 'Ta demande de rendez-vous est bien arrivée',
    apercu: 'Je te réponds pour confirmer le créneau, ou t’en proposer un autre.',
    surTitre: 'Demande reçue',
    titre: 'C’est bien arrivé',
    bonjour: (nom: string) => (nom ? `Bonjour ${nom},` : 'Bonjour,'),
    intro: 'Ta demande de rendez-vous m’est parvenue. Voici ce que tu as demandé :',
    date: 'Date souhaitée',
    heure: 'Heure',
    objet: 'Objet',
    /* La phrase qui fait tout le travail : elle dit que rien n'est acquis. */
    suite: 'Ce message accuse réception, il ne vaut pas confirmation : le créneau n’est pas encore bloqué. Je reviens vers toi pour le confirmer, ou t’en proposer un autre s’il est déjà pris.',
    bouton: 'Voir mes autres façons de me joindre',
    pied: 'Tu reçois ce message parce que tu as demandé un rendez-vous sur maxmorrys.me.',
  },
  en: {
    sujet: 'Your booking request has arrived',
    apercu: 'I’ll get back to you to confirm the slot, or offer another one.',
    surTitre: 'Request received',
    titre: 'It came through',
    bonjour: (nom: string) => (nom ? `Hello ${nom},` : 'Hello,'),
    intro: 'Your booking request reached me. Here is what you asked for:',
    date: 'Requested date',
    heure: 'Time',
    objet: 'Subject',
    suite: 'This is an acknowledgement, not a confirmation: the slot is not held yet. I’ll come back to you to confirm it, or offer another one if it is already taken.',
    bouton: 'See other ways to reach me',
    pied: 'You are receiving this because you requested a booking on maxmorrys.me.',
  },
} as const;

export interface DemandeRdv {
  nom: string;
  date: string;
  heure: string;
  objet: string;
}

export function buildAppointmentNotice(
  demande: DemandeRdv,
  langue: Langue,
  baseUrl: string,
): { subject: string; html: string; text: string } {
  const t = T[langue];
  const lienContact = `${baseUrl}${langue === 'en' ? '/en' : ''}/contact`;

  const contenu = [
    DS.surTitre(t.surTitre),
    DS.titre(t.titre),
    DS.paragraphe(t.bonjour(demande.nom)),
    DS.paragraphe(t.intro),
    DS.lignes([
      [t.date, demande.date],
      [t.heure, demande.heure],
      [t.objet, demande.objet],
    ]),
    DS.filet(),
    DS.paragraphe(t.suite, true),
    DS.bouton(t.bouton, lienContact),
  ].join('');

  /* Le repli texte n'est pas un luxe : certains clients de messagerie d'entrée de gamme, très
     répandus sur le marché visé, n'affichent que lui. */
  const text = [
    t.bonjour(demande.nom),
    '',
    t.intro,
    `${t.date} : ${demande.date}`,
    `${t.heure} : ${demande.heure}`,
    `${t.objet} : ${demande.objet}`,
    '',
    t.suite,
    '',
    lienContact,
  ].join('\n');

  return {
    subject: t.sujet,
    html: DS.page({ langue, apercu: t.apercu, contenu, pied: [t.pied] }),
    text,
  };
}
