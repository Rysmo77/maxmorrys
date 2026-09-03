import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appCertificats` — LA LISTE, ET LE ZÉRO QUI COMPTE.
 *
 * Un certificat vide n'est pas un écran raté : c'est une information, à condition d'être
 * DATÉE. « Zéro certificat depuis l'ouverture de ton compte, le 12 août » se lit ; « — »
 * ne se lit pas. D'où `ouvertureCompte` dans la même réponse : l'écran ne doit pas avoir à
 * faire un second appel pour dater son zéro.
 *
 * ⚠️ Un certificat est un document OPPOSABLE : quatre champs solidaires — titulaire,
 * formation, date, code. On les renvoie ensemble ou pas du tout ; un jeu partiel produirait
 * un document au nom de quelqu'un avec le code d'un autre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export async function appCertificats(_data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const [emis, profil] = await Promise.all([
    context.db.query({
      collection: 'certificates',
      where: [{ field: 'userId', op: '==', value: auth.uid }],
    }),
    context.db.get(`users/${auth.uid}`),
  ]);

  const complets = emis.filter((c: DocSnapshot) =>
    asText(c.data.code) && asText(c.data.userName) && asText(c.data.formationTitle) && asText(c.data.issuedAt));

  return {
    vue: {
      ouvertureCompte: asText(profil?.data.createdAt) ?? null,
      certificats: complets.map((c: DocSnapshot) => ({
        code: asText(c.data.code) ?? '',
        titulaire: asText(c.data.userName) ?? '',
        formation: asText(c.data.formationTitle) ?? '',
        emisLe: asText(c.data.issuedAt) ?? '',
        lecons: toNumber(c.data.lessonsCompleted, 0),
      })),
      /* Le compte des INCOMPLETS n'est pas montré à la personne, mais il part en trace :
         un certificat amputé côté base est un défaut de données, pas un vide légitime. */
      incomplets: emis.length - complets.length,
    },
    releveA,
  };
}
