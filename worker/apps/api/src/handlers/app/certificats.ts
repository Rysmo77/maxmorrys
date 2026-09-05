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

  /*
    ⚠️ CETTE VUE A ÉTÉ TOUJOURS VIDE, POUR TOUT LE MONDE — corrigé le 05/09/2026.

    Elle lisait `c.data.code` et `c.data.userName`. Le champ écrit s'appelle
    `certificateCode` (c'est aussi celui que le web lit, `VerifyCertificate.tsx:171`), et
    `userName` n'était écrit NULLE PART. Le filtre `complets` ne pouvait donc jamais retenir
    une seule ligne : `incomplets` valait le total, et l'écran affichait son état vide de
    façon permanente, sans qu'aucune erreur ne se produise.

    Deux noms de champ contre un écran définitivement vide : c'est le mode d'échec le plus
    silencieux qui soit, et c'est pourquoi `tests/unit/worker-certificats.test.ts` compare
    désormais ce qui est ÉCRIT à ce qui est LU.
  */

  /* Le nom du titulaire est gravé sur le certificat au moment de l'émission. Pour les
     certificats émis AVANT ce correctif, il n'y est pas : on retombe sur le profil, qui est
     déjà chargé ici. C'est ce qui les rend visibles sans backfill. */
  const nomDuProfil =
    [asText(profil?.data.firstName), asText(profil?.data.lastName)].filter(Boolean).join(' ').trim() ||
    (asText(profil?.data.displayName) ?? '');

  /* Pas de repli sur `data.code` : ce champ n'a JAMAIS été écrit, ni par les Cloud
     Functions, ni par le port. Un repli sur un nom qui n'a jamais existé donne l'illusion
     d'une compatibilité et masque le vrai défaut. */
  const codeDe = (c: DocSnapshot) => asText(c.data.certificateCode) ?? '';
  const titulaireDe = (c: DocSnapshot) => asText(c.data.userName) ?? nomDuProfil;

  const complets = emis.filter((c: DocSnapshot) =>
    codeDe(c) && titulaireDe(c) && asText(c.data.formationTitle) && asText(c.data.issuedAt));

  return {
    vue: {
      ouvertureCompte: asText(profil?.data.createdAt) ?? null,
      certificats: complets.map((c: DocSnapshot) => ({
        code: codeDe(c),
        titulaire: titulaireDe(c),
        formation: asText(c.data.formationTitle) ?? '',
        emisLe: asText(c.data.issuedAt) ?? '',
        /* 0 = « non relevé » pour l'écran, qui le rend par `<Num>`. Les certificats émis
           avant le correctif n'ont pas ce compte, et il ne s'invente pas. */
        lecons: toNumber(c.data.lessonsCompleted, 0),
      })),
      /* Le compte des INCOMPLETS n'est pas montré à la personne, mais il part en trace :
         un certificat amputé côté base est un défaut de données, pas un vide légitime. */
      incomplets: emis.length - complets.length,
    },
    releveA,
  };
}
