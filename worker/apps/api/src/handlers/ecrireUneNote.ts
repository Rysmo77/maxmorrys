import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { asText } from '../lib/values';
import type { Sortie } from '../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `ecrireUneNote` — la première ÉCRITURE de l'application native.
 *
 * L'écran ouvrait une alerte : « L'écriture arrive avec ton compte […] tant que le compte
 * n'est pas branché ici, elle s'écrit sur le site ». Le compte est branché ; la phrase
 * n'avait plus lieu d'être, et le bouton flottant non plus s'il n'écrivait rien.
 *
 * ⚠️ LE CHEMIN VIENT DE L'UID DU JETON. `users/{uid}/notes` est une sous-collection
 * propriétaire, et le compte de service ne passe pas par la règle `isOwner(userId)` qui la
 * garde. Prendre l'identifiant ailleurs que dans le jeton permettrait d'écrire dans le
 * carnet de quelqu'un d'autre — c'est le seul contrôle, et il n'y en a pas d'autre.
 *
 * ── CE QUI EST BORNÉ, ET POURQUOI ────────────────────────────────────────────────────
 * Une note vide n'est pas une note : on refuse plutôt que d'écrire une ligne que la
 * personne verra apparaître sans comprendre. Et la longueur est plafonnée à 4 000
 * caractères — non par avarice, mais parce qu'un champ sans borne finit par recevoir un
 * copier-coller de plusieurs mégaoctets, et c'est la liste ENTIÈRE qui devient lente à
 * charger, pas seulement la note fautive.
 *
 * `lessonId` est facultatif : on prend des notes en dehors d'une leçon, et exiger un
 * contexte rendrait le bouton flottant inutilisable là où il est le plus utile.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const MAX = 4_000;

export async function ecrireUneNote(data: unknown, context: CallContext): Promise<Sortie<'ecrireUneNote'>> {
  const auth = requireAuth(context);

  const { texte, lessonId, lessonLabel } = (data ?? {}) as {
    texte?: unknown; lessonId?: unknown; lessonLabel?: unknown;
  };
  if (typeof texte !== 'string' || texte.trim() === '') {
    throw new HttpsError('invalid-argument', 'Une note vide ne se range nulle part.');
  }
  for (const [nom, valeur] of [['lessonId', lessonId], ['lessonLabel', lessonLabel]] as const) {
    if (valeur !== undefined && typeof valeur !== 'string') {
      throw new HttpsError('invalid-argument', `${nom} illisible.`);
    }
  }

  const id = crypto.randomUUID();
  const maintenant = new Date().toISOString();

  await context.db.commit([
    context.db.buildWrite(`users/${auth.uid}/notes/${id}`, {
      text: texte.trim().slice(0, MAX),
      lessonId: typeof lessonId === 'string' ? lessonId : null,
      lessonLabel: typeof lessonLabel === 'string' ? lessonLabel.slice(0, 200) : null,
      createdAt: maintenant,
    }, { mask: false }),
  ]);

  /* On renvoie la note TELLE QU'ÉCRITE plutôt qu'un simple accusé : l'écran peut l'insérer
     sans relire toute la liste, et ce qu'il affiche est exactement ce qui est en base —
     pas une reconstruction locale qui pourrait en différer. */
  return {
    note: {
      id,
      texte: texte.trim().slice(0, MAX),
      date: asText(lessonLabel) ?? null,
      createdAt: maintenant,
    },
  };
}
