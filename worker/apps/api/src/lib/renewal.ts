/**
 * LE RAPPEL D'ÉCHÉANCE — J-15 avant la fin d'un abonnement au Club.
 *
 * ── POURQUOI CE N'EST PAS UN RENOUVELLEMENT AUTOMATIQUE ──
 *
 * L'article 5 des CGV promettait qu'« en cas de renouvellement automatique, le Client est
 * informé par e-mail au moins quinze (15) jours avant l'échéance ». Deux choses manquaient,
 * pas une : le préavis ET le renouvellement lui-même. `expiresAt` était écrit à l'achat et
 * plus jamais relu — aucun code du dépôt ne traitait une échéance.
 *
 * Le renouvellement automatique n'est pas réalisable sur les rails de paiement du marché :
 *
 *   · Bictorys n'expose aucun endpoint d'abonnement, de mandat ou de récurrent.
 *   · Sa tokenisation est réservée aux CARTES, et `tokenizedCardObject` exige le CVV à chaque
 *     charge — donc la personne doit être présente, ce qui est la définition inverse d'un
 *     prélèvement automatique.
 *   · Wave n'a pas de mandat récurrent, et c'est le moyen de paiement dominant ici. Un
 *     agrégateur ne peut pas fabriquer par-dessus un mandat que l'opérateur n'offre pas.
 *
 * Un prélèvement automatique ne serait donc possible qu'en carte — c'est-à-dire pour la
 * minorité, en excluant exactement le marché pour lequel le produit existe. On ne l'a pas
 * construit. Ce module fait le maximum honnête à la place : prévenir à temps, avec le lien
 * pour se réabonner en un geste.
 *
 * `autoRenew` change donc de sens et garde son nom en base : il ne veut plus dire « prélève-moi »
 * — il n'a jamais rien prélevé — mais « préviens-moi ». Réinterpréter dans ce sens est sans
 * risque : les personnes qui avaient coché reçoivent un rappel au lieu de rien, et personne
 * n'est débité de quoi que ce soit.
 */
import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { sendEmail } from './email';
import { type Langue } from './invoice';

/** Fenêtre de préavis, en jours. Quinze, parce que c'est ce que disent les CGV. */
export const PREAVIS_JOURS = 15;

export interface AbonnementEcheant {
  path: string;
  userId: string;
  userEmail: string;
  userName?: string;
  expiresAt: string;
  langue: Langue;
}

/**
 * Le rappel tombe-t-il aujourd'hui ?
 *
 * On compare des JOURS CALENDAIRES en UTC, pas des durées. Un test « expiresAt − maintenant
 * ≤ 15 jours » se déclencherait à chaque exécution du cron pendant quinze jours d'affilée ;
 * le marqueur d'idempotence rattraperait, mais la fenêtre serait une pente au lieu d'un jour.
 * En comparant les dates, la condition est vraie un jour et un seul.
 */
export function estAEcheance(expiresAt: string, maintenant: Date, joursAvant = PREAVIS_JOURS): boolean {
  const fin = new Date(expiresAt);
  if (Number.isNaN(fin.getTime())) return false;
  const jour = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const ecart = Math.round((jour(fin) - jour(maintenant)) / 86_400_000);
  return ecart === joursAvant;
}

const T = {
  fr: {
    subject: 'Ton accès au Club se termine dans 15 jours',
    bonjour: (nom?: string) => (nom ? `Bonjour ${nom},` : 'Bonjour,'),
    corps: (date: string) =>
      `Ton abonnement au Club des Digitos arrive à échéance le ${date}, dans quinze jours.`,
    /* NOMMER LA CONTRAINTE PLUTÔT QUE LA MASQUER. Le produit ne prélève rien automatiquement,
       et le dire est plus utile que de laisser la personne le découvrir le jour où son accès
       s'arrête. */
    rien: "Rien ne sera prélevé : Wave et Orange Money ne permettent pas le prélèvement automatique, et je préfère te prévenir que te débiter sans que tu l'aies demandé.",
    action: 'Si tu veux continuer, tu te réabonnes ici — ça prend une minute.',
    lien: 'Reprendre mon abonnement',
    apres: "Si tu préfères t'arrêter là, tu n'as rien à faire : l'accès se termine tout seul à la date ci-dessus.",
    signature: 'Max-Morrys',
  },
  en: {
    subject: 'Your Club access ends in 15 days',
    bonjour: (nom?: string) => (nom ? `Hi ${nom},` : 'Hi,'),
    corps: (date: string) => `Your Club des Digitos membership ends on ${date}, fifteen days from now.`,
    rien: "Nothing will be charged: Wave and Orange Money don't support automatic debits, and I'd rather warn you than take your money without you asking.",
    action: "If you want to keep going, you can renew here — it takes a minute.",
    lien: 'Renew my membership',
    apres: "If you'd rather stop, there's nothing to do: access ends on its own on the date above.",
    signature: 'Max-Morrys',
  },
} as const;

function echapper(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Le message de rappel. Pur, comme le rendu de facture, et testable sans réseau. */
export function buildRenewalNotice(
  abonnement: { userName?: string; expiresAt: string; langue: Langue },
  dateLisible: string,
  urlReabonnement: string,
): { subject: string; html: string; text: string } {
  const t = T[abonnement.langue];
  const html = `<!doctype html>
<html lang="${abonnement.langue}">
<body style="margin:0;padding:24px;background:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0E1116;font-size:15px;line-height:1.5">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:18px;padding:28px">
    <p style="margin:0 0 16px">${echapper(t.bonjour(abonnement.userName))}</p>
    <p style="margin:0 0 12px">${echapper(t.corps(dateLisible))}</p>
    <p style="margin:0 0 20px;color:#5A6472">${echapper(t.rien)}</p>
    <p style="margin:0 0 18px">${echapper(t.action)}</p>
    <p style="margin:0 0 22px">
      <a href="${echapper(urlReabonnement)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#6C23DD;color:#FFFFFF;text-decoration:none;font-weight:700">${echapper(t.lien)}</a>
    </p>
    <p style="margin:0 0 20px;font-size:13px;color:#5A6472">${echapper(t.apres)}</p>
    <p style="margin:0;font-size:13px">${echapper(t.signature)}</p>
  </div>
</body>
</html>`;

  const text = [
    t.bonjour(abonnement.userName),
    '',
    t.corps(dateLisible),
    t.rien,
    '',
    t.action,
    urlReabonnement,
    '',
    t.apres,
    '',
    t.signature,
  ].join('\n');

  return { subject: t.subject, html, text };
}

/**
 * Parcourt les abonnements actifs et envoie le rappel à ceux qui arrivent à J-15.
 *
 * IDEMPOTENCE. Le marqueur `renewalNoticeFor` porte la DATE D'ÉCHÉANCE visée, pas un booléen :
 * une personne qui se réabonne obtient une nouvelle `expiresAt`, et doit donc pouvoir recevoir
 * un nouveau rappel l'année suivante. Un booléen `noticeSent` la priverait du deuxième.
 *
 * Le marqueur est écrit APRÈS un envoi réussi. Un échec laisse la case vide : la prochaine
 * exécution du cron réessaiera — tant qu'on est encore dans la journée J-15. Au-delà, le
 * rappel est perdu plutôt qu'envoyé en retard : « ton accès se termine dans 15 jours » écrit
 * le douzième jour est une information fausse.
 */
export async function sendRenewalNotices(
  db: Firestore,
  env: Env,
  maintenant = new Date(),
): Promise<{ examines: number; envoyes: number; echecs: number }> {
  const actifs = await db.query({
    collection: 'club_subscriptions',
    where: [{ field: 'status', op: '==', value: 'active' }],
  });

  let envoyes = 0;
  let echecs = 0;

  for (const abonnement of actifs) {
    const d = abonnement.data;
    const expiresAt = typeof d.expiresAt === 'string' ? d.expiresAt : '';
    if (!expiresAt || !estAEcheance(expiresAt, maintenant)) continue;

    // Déjà prévenu POUR CETTE ÉCHÉANCE-LÀ.
    if (d.renewalNoticeFor === expiresAt) continue;

    const destinataire = typeof d.userEmail === 'string' ? d.userEmail : '';
    if (!destinataire) {
      console.error('Rappel d’échéance : aucune adresse sur', abonnement.path);
      echecs += 1;
      continue;
    }

    const userId = typeof d.userId === 'string' ? d.userId : abonnement.id;
    const profil = await db.get(`users/${userId}`);
    const prefs = profil?.data.preferences as { language?: string } | undefined;
    const langue: Langue = prefs?.language === 'en' ? 'en' : 'fr';

    const fin = new Date(expiresAt);
    const dateLisible = langue === 'fr'
      ? `${fin.getUTCDate()}/${String(fin.getUTCMonth() + 1).padStart(2, '0')}/${fin.getUTCFullYear()}`
      : `${String(fin.getUTCMonth() + 1).padStart(2, '0')}/${fin.getUTCDate()}/${fin.getUTCFullYear()}`;

    const message = buildRenewalNotice(
      { userName: typeof d.userName === 'string' ? d.userName : undefined, expiresAt, langue },
      dateLisible,
      `${env.APP_BASE_URL}${langue === 'fr' ? '/club-des-digitos' : '/en/digitos-club'}`,
    );

    const envoi = await sendEmail(env, { to: destinataire, ...message });
    if (envoi.sent) {
      await db.update(abonnement.path, { renewalNoticeFor: expiresAt });
      envoyes += 1;
    } else {
      console.error('Rappel d’échéance non envoyé pour', abonnement.path, '—', envoi.error);
      echecs += 1;
    }
  }

  return { examines: actifs.length, envoyes, echecs };
}
