import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import * as DS from './email-design';
import { sendEmail } from './email';
import { type Langue } from './invoice';
import { estAEcheance } from './renewal';
import { FENETRE_RENOUVELLEMENT_JOURS } from './rysmo-subscription';
import { asText } from './values';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE RAPPEL D'ÉCHÉANCE DE RYSMO+ — le mensuel, qui n'en avait aucun.
 *
 * ── POURQUOI UN MODULE À PART, ET PAS UNE BRANCHE DANS `renewal.ts` ────────────
 *
 * `renewal.ts` est écrit d'un bout à l'autre pour l'ANNUEL du Club : son en-tête cite
 * l'article 5 des CGV, sa table de textes code « quinze » en dur dans le sujet ET dans
 * le corps, et son lien vise la page du Club. Y ajouter une branche aurait produit un
 * module dont chaque phrase demande « lequel des deux ? » — et c'est exactement la forme
 * de code où l'on finit par envoyer le message du Club à un abonné Rysmo.
 *
 * Ce qui est PARTAGÉ l'est explicitement, et c'est le bon découpage :
 *   · `estAEcheance()` — la fenêtre d'un jour calendaire, avec son `joursAvant` en paramètre.
 *   · `test/helpers/voix-echeance.ts` — les assertions de voix, qui valent pour les deux.
 *
 * ── CE QUE CE COURRIER DOIT DIRE, ET QUE L'AUTRE N'A PAS À DIRE ────────────────
 *
 * Le rappel du Club annonce une fin. Celui-ci annonce une fin ET une reprise possible sans
 * perte : le renouvellement anticipé CHAÎNE les dates (`rysmo-subscription.ts`), donc les
 * jours restants ne sont pas perdus. Ne pas le dire ferait attendre le dernier jour, ce qui
 * est précisément le comportement que ce rappel existe pour éviter.
 *
 * ⚠️ La phrase de chaînage est ASSERTÉE par les tests. Si le chaînage disparaissait du code
 * sans disparaître du texte, ce courrier deviendrait une promesse fausse — et c'est la seule
 * de ce module qui coûterait de l'argent à quelqu'un.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Préavis, en jours. **Importé, jamais redéclaré** : c'est la même fenêtre que celle
 * pendant laquelle le renouvellement est ouvert, et l'égalité n'est pas une coïncidence
 * à maintenir — voir l'en-tête de `rysmo-subscription.ts`.
 */
export const PREAVIS_RYSMO_JOURS = FENETRE_RENOUVELLEMENT_JOURS;

/**
 * Rappels envoyés au plus par exécution.
 *
 * `estAEcheance` filtre déjà à environ un trentième de la base, donc ce plafond ne devrait
 * jamais être atteint. Il est là pour que le jour où il l'est se VOIE dans les journaux au
 * lieu de faire dépasser le temps imparti au Worker — une borne muette n'est pas une borne.
 */
const MAX_RAPPELS_PAR_PASSE = 200;

/** Taille de page de la lecture. Bornée, contrairement au `query` sans limite du Club. */
const PAGE = 200;

const T = {
  fr: {
    subject: `Ton abonnement Rysmo+ se termine dans ${PREAVIS_RYSMO_JOURS} jours`,
    bonjour: (nom?: string) => (nom ? `Bonjour ${nom},` : 'Bonjour,'),
    corps: (date: string) => `Ton abonnement Rysmo+ arrive à échéance le ${date}.`,
    /* Même contrainte que pour le Club, et il faut la nommer ici aussi : ce module envoie
       un courrier MENSUEL, donc douze fois plus souvent l'occasion de laisser croire à un
       prélèvement qui n'existe pas. */
    rien: "Rien ne sera prélevé : Wave et Orange Money ne permettent pas le prélèvement automatique, et je préfère te prévenir que te débiter sans que tu l'aies demandé.",
    /* LA PHRASE QUI CHANGE LE COMPORTEMENT. Sans elle, reprendre aujourd'hui coûterait
       cinq jours — et attendre le dernier jour serait le calcul rationnel. */
    chaine: (date: string) =>
      `Si tu reprends maintenant, ton nouveau mois démarre le ${date} : tu ne perds pas les jours qui restent.`,
    action: 'Tu reprends ton abonnement ici — ça prend une minute.',
    lien: 'Reprendre mon abonnement',
    apres: "Si tu préfères t'arrêter là, tu n'as rien à faire : tu repasses à deux questions par jour à la date ci-dessus, et ton répétiteur reste là.",
    signature: 'Max-Morrys',
  },
  en: {
    subject: `Your Rysmo+ subscription ends in ${PREAVIS_RYSMO_JOURS} days`,
    bonjour: (nom?: string) => (nom ? `Hi ${nom},` : 'Hi,'),
    corps: (date: string) => `Your Rysmo+ subscription ends on ${date}.`,
    rien: "Nothing will be charged: Wave and Orange Money don't support automatic debits, and I'd rather warn you than take your money without you asking.",
    chaine: (date: string) =>
      `If you renew now, your new month starts on ${date}: you don't lose the days you have left.`,
    action: 'You can renew here — it takes a minute.',
    lien: 'Renew my subscription',
    apres: "If you'd rather stop, there's nothing to do: you go back to two questions a day on the date above, and your tutor stays.",
    signature: 'Max-Morrys',
  },
} as const;

/** Le message. Pur, comme celui du Club, et testable sans réseau. */
export function buildRysmoRenewalNotice(
  abonnement: { userName?: string; langue: Langue },
  dateLisible: string,
  urlReabonnement: string,
): { subject: string; html: string; text: string } {
  const t = T[abonnement.langue];

  /*
   * MÊME DESSIN QUE LE RAPPEL DU CLUB, et pour la même raison : la date est la seule
   * information du message, elle passe donc en display. Le bouton reste en encre — une
   * couleur vive lirait comme une urgence commerciale alors que le message dit l'inverse.
   */
  const html = DS.page({
    langue: abonnement.langue,
    apercu: t.corps(dateLisible),
    contenu: [
      DS.paragraphe(t.bonjour(abonnement.userName)),
      DS.titre(t.corps(dateLisible)),
      DS.paragraphe(t.rien, true),
      DS.filet(),
      DS.paragraphe(t.chaine(dateLisible)),
      DS.paragraphe(t.action),
      DS.bouton(t.lien, urlReabonnement),
      DS.mention(t.apres),
      DS.paragraphe(t.signature),
    ].join('\n'),
  });

  const text = [
    t.bonjour(abonnement.userName),
    '',
    t.corps(dateLisible),
    t.rien,
    '',
    t.chaine(dateLisible),
    t.action,
    urlReabonnement,
    '',
    t.apres,
    '',
    t.signature,
  ].join('\n');

  return { subject: t.subject, html, text };
}

/** La date, dans la convention de chaque langue. Même format que le rappel du Club. */
export function dateLisible(expiresAt: string, langue: Langue): string {
  const fin = new Date(expiresAt);
  const j = fin.getUTCDate();
  const m = String(fin.getUTCMonth() + 1).padStart(2, '0');
  const a = fin.getUTCFullYear();
  return langue === 'fr' ? `${j}/${m}/${a}` : `${m}/${j}/${a}`;
}

/** L'adresse de la boutique du répétiteur, par langue. */
function urlBoutique(base: string, langue: Langue): string {
  return `${base}${langue === 'fr' ? '/mon-espace/repetiteur' : '/en/my-learning/tutor'}`;
}

export interface BilanRappelsRysmo {
  examines: number;
  envoyes: number;
  echecs: number;
}

/**
 * Parcourt les abonnements Rysmo+ actifs et prévient ceux qui arrivent à échéance.
 *
 * IDEMPOTENCE — `renewalNoticeFor` porte la DATE D'ÉCHÉANCE visée, exactement comme sur le
 * Club, et pour la même raison : une personne qui reprend obtient une nouvelle `expiresAt`
 * et doit pouvoir être prévenue le mois suivant. Sur un mensuel, un booléen aurait privé
 * chacun de onze rappels sur douze au lieu d'un sur deux.
 *
 * Le marqueur est écrit APRÈS un envoi réussi : un échec laisse la case vide et la prochaine
 * exécution réessaie — tant qu'on est encore dans la journée. Au-delà, le rappel est perdu
 * plutôt qu'envoyé en retard, parce qu'« il te reste cinq jours » écrit le troisième jour
 * est une information fausse.
 *
 * ⚠️ LES LANGUES SONT LUES EN UN SEUL ALLER-RETOUR PAR PAGE (`getAll`), et non par un `get`
 * dans la boucle. C'est le patron de `digest.ts` ; celui du Club fait encore le N+1, et sur
 * un mensuel il coûterait douze fois plus.
 */
export async function sendRysmoRenewalNotices(
  db: Firestore,
  env: Env,
  maintenant = new Date(),
): Promise<BilanRappelsRysmo> {
  let examines = 0;
  let envoyes = 0;
  let echecs = 0;

  for await (const page of db.queryPaged(
    { collection: 'rysmoSubscriptions', where: [{ field: 'status', op: '==', value: 'active' }] },
    PAGE,
  )) {
    examines += page.length;

    // Ne garder que ceux dont le rappel tombe aujourd'hui, et qui n'ont pas déjà été prévenus.
    const aPrevenir = page.filter((abonnement) => {
      const expiresAt = asText(abonnement.data.expiresAt);
      if (!expiresAt || !estAEcheance(expiresAt, maintenant, PREAVIS_RYSMO_JOURS)) return false;
      return abonnement.data.renewalNoticeFor !== expiresAt;
    });
    if (aPrevenir.length === 0) continue;

    const uids = [...new Set(aPrevenir.map((a) => asText(a.data.userId) ?? a.id))];
    const profils = await db.getAll(uids.map((uid) => `users/${uid}`));
    const langueDe = new Map<string, Langue>();
    uids.forEach((uid, i) => {
      const prefs = profils[i]?.data.preferences as { language?: string } | undefined;
      langueDe.set(uid, prefs?.language === 'en' ? 'en' : 'fr');
    });

    for (const abonnement of aPrevenir) {
      if (envoyes + echecs >= MAX_RAPPELS_PAR_PASSE) {
        console.error(
          `Rappels Rysmo+ : plafond de ${MAX_RAPPELS_PAR_PASSE} atteint, le reste attendra demain.`,
        );
        return { examines, envoyes, echecs };
      }

      const expiresAt = asText(abonnement.data.expiresAt) ?? '';
      const destinataire = asText(abonnement.data.userEmail) ?? '';
      if (!destinataire) {
        console.error('Rappel Rysmo+ : aucune adresse sur', abonnement.path);
        echecs += 1;
        continue;
      }

      const uid = asText(abonnement.data.userId) ?? abonnement.id;
      const langue = langueDe.get(uid) ?? 'fr';
      const message = buildRysmoRenewalNotice(
        { userName: asText(abonnement.data.userName), langue },
        dateLisible(expiresAt, langue),
        urlBoutique(env.APP_BASE_URL, langue),
      );

      const envoi = await sendEmail(env, { to: destinataire, ...message });
      if (envoi.sent) {
        await db.update(abonnement.path, { renewalNoticeFor: expiresAt });
        envoyes += 1;
      } else {
        console.error('Rappel Rysmo+ non envoyé pour', abonnement.path, '—', envoi.error);
        echecs += 1;
      }
    }
  }

  return { examines, envoyes, echecs };
}
