import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import { listeDesBloques } from '../bloquerMembre';
import { abonnementActif } from './club';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appClubBlocages` — LA LISTE, PARCE QU'UN BLOCAGE QU'ON NE PEUT PAS DÉFAIRE EST UN PIÈGE.
 *
 * La guideline App Store 1.2 demande de pouvoir bloquer. Elle ne demande pas explicitement de
 * pouvoir débloquer — mais un geste irréversible pris dans un moment d'agacement, sur une
 * plateforme où l'on se croise professionnellement, ne se répare plus. Et un relecteur qui
 * bloque un compte pour vérifier la fonctionnalité doit pouvoir revenir en arrière.
 *
 * ── UN NOM DISPARU N'EST PAS RENDU « INCONNU » ──────────────────────────────────────────
 * Si le profil Club d'un compte bloqué n'existe plus, l'entrée est OMISE plutôt que rendue
 * avec un nom de remplacement. Une ligne « Membre inconnu » dans une liste de blocage ne dit
 * rien d'utile et empêche de comprendre ce qu'on regarde.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

function initiales(nom: string): string {
  return nom.trim().split(/\s+/).map((m) => m.charAt(0)).join('').slice(0, 2).toUpperCase();
}

export async function appClubBlocages(_data: unknown, context: CallContext): Promise<Reponse<'appClubBlocages'>> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) return { vue: null, releveA };

  const bloques = [...await listeDesBloques(context, auth.uid)];
  const fiches = await Promise.all(bloques.map((id) => context.db.get(`club_profiles/${id}`)));

  return {
    vue: {
      comptes: fiches.flatMap((fiche, i) => {
        const nom = fiche ? asText(fiche.data.userName) : null;
        if (!nom) return [];
        return [{ id: bloques[i], nom, initiales: initiales(nom) }];
      }),
    },
    releveA,
  };
}
