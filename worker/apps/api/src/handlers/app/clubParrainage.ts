import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import { abonnementActif } from './club';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appClubParrainage` — LE CODE, ET CE QU'IL A DONNÉ.
 *
 * L'écran lisait `contenu/demo` en direct : en production il affichait le code d'Aïssatou, ou
 * — la démonstration éteinte — rien du tout. Un membre ne pouvait pas parrainer.
 *
 * ⚠️ LE CODE SE CRÉE À LA PREMIÈRE LECTURE, et c'est délibéré malgré l'écriture dans une vue.
 * C'est exactement ce que fait le web (`getOrCreateReferralCode`, `src/lib/firestore/users.ts`),
 * et le format est repris à l'identique pour que les deux plateformes délivrent le MÊME code à
 * la même personne. L'alternative — une vue qui rend `null` et un bouton « générer mon code » —
 * ajoute un geste sans rien protéger : il n'y a aucune décision à prendre, aucun coût, et rien
 * à confirmer. L'opération est idempotente : un code déjà posé n'est jamais remplacé.
 *
 * ── CE QUI EST COMPTÉ, ET CE QUI NE L'EST PAS ───────────────────────────────────────────
 * `filleuls` compte les documents `referrals` dont on est le PARRAIN. Rien d'autre ne sort :
 * ni les noms, ni les identifiants, ni les dates. Un parrain n'a pas à savoir QUI a utilisé
 * son code — il a à savoir COMBIEN. La différence est celle entre un compteur et une liste de
 * personnes qu'on n'a pas prévenues qu'elles y figuraient.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Même fabrique que le web, pour que le code soit le même des deux côtés. */
function fabriquerCode(uid: string): string {
  return (uid.slice(0, 3) + Math.random().toString(36).slice(2, 7)).toUpperCase();
}

export async function appClubParrainage(_data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) return { vue: null, releveA };

  const profil = await context.db.get(`users/${auth.uid}`);
  let code = asText(profil?.data.referralCode) ?? null;
  if (!code) {
    code = fabriquerCode(auth.uid);
    await context.db.update(`users/${auth.uid}`, { referralCode: code });
  }

  const filleuls = await context.db.query({
    collection: 'referrals',
    where: [{ field: 'referrerId', op: '==', value: auth.uid }],
  });

  return {
    vue: {
      code,
      /* Le lien est composé ici pour que l'écran n'ait pas à connaître le domaine du site —
         et pour qu'un changement de domaine ne laisse pas une version de l'application
         partager des liens morts pendant des mois. */
      lien: `https://maxmorrys.me/club?code=${encodeURIComponent(code)}`,
      filleuls: filleuls.length,
    },
    releveA,
  };
}
