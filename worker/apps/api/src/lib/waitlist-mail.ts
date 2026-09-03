import * as DS from './email-design';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES DEUX SEULS E-MAILS QUE LA LISTE D'ATTENTE ENVOIE.
 *
 * L'accusé de réception, puis l'alerte d'ouverture. C'est tout, et c'est la promesse
 * elle-même : « une seule alerte, le jour de l'ouverture ; pas de lettre, pas de relance ».
 *
 * ⚠️ CETTE PROMESSE EST OPPOSABLE. Le catalogue disait jusqu'ici, noir sur blanc, qu'il n'y
 * aurait jamais de « préviens-moi par e-mail », au motif qu'on ne fait pas remplir un champ
 * qui ne sert à rien. La liste d'attente n'annule pas cet engagement : elle le remplace par
 * un engagement plus étroit. Ajouter ici un troisième envoi — une relance, une actualité, une
 * offre — le romprait. Si un jour une lettre existe, elle se demandera séparément.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

export type Langue = 'fr' | 'en';

const T = {
  fr: {
    surTitre: 'Liste d’attente',
    titreInscrit: 'C’est noté.',
    apercuInscrit: 'Tu es sur la liste. Une seule alerte, le jour de l’ouverture.',
    sujetInscrit: (titre: string) => `Tu es sur la liste — ${titre}`,
    introInscrit: (titre: string) =>
      `Tu es inscrit·e à la liste d’attente de « ${titre} ». Je te préviens le jour où elle ouvre.`,
    promesse:
      'Un seul e-mail, le jour de l’ouverture. Pas de lettre, pas de relance, et tu n’as rien à faire d’ici là.',
    ouvertureLibelle: 'Ouverture',
    tarifLibelle: 'Tarif annoncé',
    boutonFiche: 'Revoir la formation',
    pied: 'Max-Morrys — Dakar, Sénégal',

    surTitreOuvert: 'C’est ouvert',
    titreOuvert: 'Elle est en ligne.',
    apercuOuvert: 'La formation que tu attendais vient d’ouvrir.',
    sujetOuvert: (titre: string) => `C’est ouvert — ${titre}`,
    introOuvert: (titre: string) =>
      `« ${titre} » est en ligne. Tu t’étais inscrit·e à sa liste d’attente : voilà l’unique e-mail que je t’avais promis.`,
    boutonOuvert: 'Voir la formation',
    fin: 'Tu ne recevras plus rien au sujet de cette formation.',
  },
  en: {
    surTitre: 'Waiting list',
    titreInscrit: 'You’re on the list.',
    apercuInscrit: 'You’re on the list. One alert, on opening day.',
    sujetInscrit: (titre: string) => `You’re on the list — ${titre}`,
    introInscrit: (titre: string) =>
      `You’ve joined the waiting list for “${titre}”. I’ll let you know the day it opens.`,
    promesse:
      'One email, on opening day. No newsletter, no follow-ups, and nothing for you to do until then.',
    ouvertureLibelle: 'Opening',
    tarifLibelle: 'Announced price',
    boutonFiche: 'See the course again',
    pied: 'Max-Morrys — Dakar, Senegal',

    surTitreOuvert: 'It’s open',
    titreOuvert: 'It’s live.',
    apercuOuvert: 'The course you were waiting for has just opened.',
    sujetOuvert: (titre: string) => `It’s open — ${titre}`,
    introOuvert: (titre: string) =>
      `“${titre}” is live. You joined its waiting list: this is the single email I promised you.`,
    boutonOuvert: 'View the course',
    fin: 'You won’t hear from me about this course again.',
  },
} as const;

export interface FormationCourrier {
  titre: string;
  slug: string;
  /** Déjà formatée pour l'humain, ou absente — l'e-mail n'invente aucune date. */
  ouverture?: string;
  /** Déjà formaté avec sa devise, ou absent. */
  tarif?: string;
}

function lien(baseUrl: string, langue: Langue, slug: string): string {
  return `${baseUrl}${langue === 'en' ? '/en/courses' : '/formations'}/${slug}`;
}

/** L'accusé de réception, envoyé dans la foulée de l'inscription. */
export function buildWaitlistConfirmation(
  f: FormationCourrier,
  langue: Langue,
  baseUrl: string,
): { subject: string; html: string; text: string } {
  const t = T[langue];
  const url = lien(baseUrl, langue, f.slug);

  // Ne poser une ligne que si sa valeur existe : un e-mail qui affiche « Ouverture : — »
  // annonce moins que rien, il annonce qu'on ne sait pas.
  const paires: Array<[string, string]> = [];
  if (f.ouverture) paires.push([t.ouvertureLibelle, f.ouverture]);
  if (f.tarif) paires.push([t.tarifLibelle, f.tarif]);

  const contenu = [
    DS.surTitre(t.surTitre),
    DS.titre(t.titreInscrit),
    DS.paragraphe(t.introInscrit(f.titre)),
    paires.length ? DS.lignes(paires) : '',
    DS.bouton(t.boutonFiche, url),
    DS.filet(),
    DS.paragraphe(t.promesse, true),
  ].join('');

  const text = [
    t.introInscrit(f.titre), '',
    ...paires.map(([k, v]) => `${k} : ${v}`),
    paires.length ? '' : '',
    url, '', t.promesse,
  ].join('\n');

  return {
    subject: t.sujetInscrit(f.titre),
    html: DS.page({ langue, apercu: t.apercuInscrit, contenu, pied: [t.pied] }),
    text,
  };
}

/** L'unique alerte promise, envoyée le jour de l'ouverture. */
export function buildWaitlistOpening(
  f: FormationCourrier,
  langue: Langue,
  baseUrl: string,
): { subject: string; html: string; text: string } {
  const t = T[langue];
  const url = lien(baseUrl, langue, f.slug);

  const contenu = [
    DS.surTitre(t.surTitreOuvert),
    DS.titre(t.titreOuvert),
    DS.paragraphe(t.introOuvert(f.titre)),
    f.tarif ? DS.lignes([[t.tarifLibelle, f.tarif]]) : '',
    DS.bouton(t.boutonOuvert, url),
    DS.filet(),
    DS.paragraphe(t.fin, true),
  ].join('');

  const text = [t.introOuvert(f.titre), '', url, '', t.fin].join('\n');

  return {
    subject: t.sujetOuvert(f.titre),
    html: DS.page({ langue, apercu: t.apercuOuvert, contenu, pied: [t.pied] }),
    text,
  };
}
