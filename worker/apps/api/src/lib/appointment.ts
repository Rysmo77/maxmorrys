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

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUI SORT D'UN CHAMP LIBRE N'EST PAS DU TEXTE : C'EST UNE CHARGE UTILE.
 *
 * Les quatre valeurs recopiees dans ce courrier viennent d'un document `appointments`
 * que **n'importe qui peut creer sans compte** — c'est le propre d'un formulaire de
 * contact public, et ce n'est pas negociable : le prospect deconnecte est le cas
 * principal, pas le cas limite.
 *
 * Le HTML, lui, etait deja sur : `DS.paragraphe` et `DS.lignes` echappent via `echapper()`,
 * donc aucune balise ne passe. LE REPLI TEXTE N'ECHAPPE RIEN — et il n'a pas a le faire,
 * c'est du texte brut. Sauf que les clients de messagerie transforment automatiquement une
 * URL en lien cliquable. Le champ « objet » suffisait donc a placer l'adresse d'un
 * attaquant dans un courrier authentifie au nom de Max-Morrys : signature SPF/DKIM valide,
 * domaine legitime, et une destination choisie par lui. C'est la definition d'un
 * hameconnage credible.
 *
 * D'ou cette fonction, posee au point de passage OBLIGATOIRE entre le document et l'envoi
 * plutot que chez l'appelant : un second appelant de `buildAppointmentNotice` heriterait
 * de la garde sans avoir a y penser. C'est la lecon des six constats de l'audit — une
 * protection posee d'un seul cote de la porte n'en est pas une.
 *
 * Elle ne remplace pas les plafonds du handler : celle-ci retire le contenu de l'abus,
 * ceux-la en retirent le volume. Il faut les deux.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function assainirChampLibre(valeur: string, max = 120): string {
  return (
    valeur
      // Sauts de ligne, caracteres de controle, marques bidi et espaces de largeur nulle :
      // ils ne portent aucun texte, ils fabriquent une fausse mise en page dans le repli
      // texte — un faux pied de page, une fausse signature. Ils sont la CIBLE du filtre,
      // d ou la derogation ci-dessous : ici, les ecrire est le correctif.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u202A-\u202E\uFEFF]+/g, ' ')
      // Toute adresse explicite. C'est LA ligne qui compte.
      .replace(/\b(?:https?:\/\/|www\.|mailto:)\S*/gi, '[lien retire]')
      // Un domaine nu passe aussi la linkification chez plusieurs clients : « paye-ici.top »
      // devient cliquable sans jamais avoir porte de schema.
      .replace(
        /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|me|fr|sn|co|xyz|top|link|click|info|biz|app|site|online|shop|ru|cn)\b/gi,
        '[lien retire]',
      )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max)
  );
}

export function buildAppointmentNotice(
  entree: DemandeRdv,
  langue: Langue,
  baseUrl: string,
): { subject: string; html: string; text: string } {
  const t = T[langue];
  const lienContact = `${baseUrl}${langue === 'en' ? '/en' : ''}/contact`;

  /* Les bornes reprennent celles de `firestore.rules` : la regle refuse a l'entree ce que
     cette fonction retaille a la sortie. Les deux disent la meme chose, et c'est voulu —
     un document ecrit avant le durcissement des regles passe encore par ici. */
  const demande: DemandeRdv = {
    nom: assainirChampLibre(entree.nom, 100),
    date: assainirChampLibre(entree.date, 40),
    heure: assainirChampLibre(entree.heure, 10),
    objet: assainirChampLibre(entree.objet, 120),
  };

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
