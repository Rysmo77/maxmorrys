import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { asText } from '../lib/values';
import type { Sortie } from '../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `signalerMembre` — le signalement, qui n'existait pas.
 *
 * L'écran `club/membre.tsx` ouvrait une alerte disant « Le signalement part tout de suite,
 * sans que tu aies à expliquer pourquoi », puis son bouton destructif se fermait sans rien
 * envoyer. Le texte promettait ce que le geste ne faisait pas — et sur un signalement, la
 * personne qui l'a touché s'en va en pensant que c'est traité.
 *
 * ── CE QUI EST ÉCRIT, ET CE QUI NE L'EST PAS ─────────────────────────────────────────
 * L'auteur du signalement est enregistré (il faut pouvoir traiter les abus de l'outil
 * lui-même), mais l'écran promet que « la personne ne saura pas que ça vient de toi » : ce
 * document n'est donc lisible que par le support. Aucune règle Firestore n'ouvre
 * `reports` en lecture à un membre, et ce handler n'en renvoie jamais le contenu.
 *
 * Le motif est FACULTATIF, comme l'écran le dit : exiger une explication pour signaler,
 * c'est filtrer les signalements par la capacité à les argumenter.
 *
 * ⚠️ ON NE PEUT PAS SE SIGNALER SOI-MÊME, et ce n'est pas une coquetterie : c'est le
 * moyen le plus simple de polluer la file du support depuis un compte gratuit.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export async function signalerMembre(data: unknown, context: CallContext): Promise<Sortie<'signalerMembre'>> {
  const auth = requireAuth(context);

  const { membreId, motif } = (data ?? {}) as { membreId?: unknown; motif?: unknown };
  if (typeof membreId !== 'string' || membreId.trim() === '') {
    throw new HttpsError('invalid-argument', 'Membre non désigné.');
  }
  if (membreId === auth.uid) {
    throw new HttpsError('failed-precondition', 'On ne se signale pas soi-même.');
  }
  if (motif !== undefined && typeof motif !== 'string') {
    throw new HttpsError('invalid-argument', 'Motif illisible.');
  }

  const vise = await context.db.get(`club_profiles/${membreId}`);
  if (!vise) throw new HttpsError('not-found', 'Ce membre n’existe pas.');

  /*
   * L'identifiant du document est DÉTERMINISTE : un signalement par personne et par cible.
   * Toucher deux fois le bouton ne crée pas deux entrées — la file du support n'a pas à
   * absorber les doubles touches, et le compte de signalements distincts reste juste.
   */
  await context.db.commit([
    context.db.buildWrite(`reports/${auth.uid}_${membreId}`, {
      reporterId: auth.uid,
      targetId: membreId,
      targetName: asText(vise.data.userName) ?? null,
      motif: typeof motif === 'string' ? motif.trim().slice(0, 500) : null,
      status: 'new',
      createdAt: new Date().toISOString(),
    }, { mask: false }),
  ]);

  return { recu: true };
}
