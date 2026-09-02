import { HttpsError } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';

/**
 * `notifyOnPublish` — prévenir, à la publication, ceux qui l'ont demandé.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QU'IL FERME
 *
 * Trois surfaces du site promettaient « je t'alerte dans ton espace le jour de la mise en
 * ligne » — l'état vide du catalogue, le pied de page, le panneau « suivre » du blog — et
 * AUCUN producteur n'existait. Le canal de notification tournait pourtant : il ne portait
 * simplement pas cet événement-là.
 *
 * ⚠️ CE N'EST PAS UN DÉCLENCHEUR FIRESTORE, ET ÇA NE PEUT PAS L'ÊTRE. Workers ne sait pas
 * s'abonner aux événements Firestore, et il ne reste plus une seule Cloud Function depuis
 * le passage au plan Spark. La forme est donc celle de tout le reste du Worker : l'action
 * qui publie appelle aussi l'endpoint.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ADHÉSION EST EXPLICITE, ET LE DÉFAUT EST « NON »
 *
 * `preferences.notifyOnPublish == true`, strictement. Notifier tous les comptes existants
 * parce qu'ils n'ont rien refusé serait précisément le spam que ce réglage existe pour
 * empêcher : personne ne peut consentir à une case qui n'existait pas quand il s'est
 * inscrit. L'égalité stricte fait que `undefined` et `false` valent tous les deux non, sans
 * qu'on ait à s'en occuper.
 *
 * ⚠️ L'ACCÈS REST PAR COMPTE DE SERVICE CONTOURNE `firestore.rules`. Le contrôle
 * d'administrateur est fait ici, et il n'y a pas de filet derrière.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Les deux seules choses qui se publient et que quelqu'un peut vouloir suivre. */
const KINDS = {
  formation: { collection: 'formations', link: '/formations', type: 'formation' },
  article: { collection: 'blog', link: '/blog', type: 'article' },
} as const;

type Kind = keyof typeof KINDS;

const TITRE: Record<Kind, Record<'fr' | 'en', string>> = {
  formation: { fr: 'Une nouvelle formation est en ligne', en: 'A new course is live' },
  article: { fr: 'Un nouvel article est en ligne', en: 'A new article is live' },
};

/**
 * Garde-fou de volume. Au-delà, on refuse plutôt que d'écrire en silence : une erreur se
 * voit et se rejoue, une écriture partielle laisse une moitié des gens prévenus et l'autre
 * pas, sans que rien ne le dise.
 */
const MAX_DESTINATAIRES = 2000;

interface Requete {
  kind?: unknown;
  id?: unknown;
}

export async function notifyOnPublish(data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  const { kind, id } = (data ?? {}) as Requete;
  if (kind !== 'formation' && kind !== 'article') {
    throw new HttpsError('invalid-argument', "kind doit valoir 'formation' ou 'article'.");
  }
  if (typeof id !== 'string' || !id.trim()) {
    throw new HttpsError('invalid-argument', 'id est obligatoire.');
  }
  const spec = KINDS[kind];

  const doc = await context.db.get(`${spec.collection}/${id}`);
  if (!doc) throw new HttpsError('not-found', 'Document introuvable.');

  /*
   * ON NE PRÉVIENT QUE POUR CE QUI EST RÉELLEMENT EN LIGNE. La console appelle cet endpoint
   * après un enregistrement en `published`, mais un appel rejoué à la main sur un brouillon
   * enverrait tout le monde sur une page qui répond 404.
   */
  if (doc.data.status !== 'published') {
    throw new HttpsError('failed-precondition', "Ce document n'est pas publié.");
  }

  const slug = typeof doc.data.slug === 'string' ? doc.data.slug : '';
  const titre = typeof doc.data.title === 'string' ? doc.data.title : '';
  if (!slug) throw new HttpsError('failed-precondition', 'Ce document n’a pas de slug.');

  /*
   * IDEMPOTENCE. Le marqueur porte la DATE d'envoi, pas un booléen : il dit quand, et il
   * empêche le second appel. Sans lui, deux enregistrements successifs en `published` —
   * une correction de titre juste après la mise en ligne, le cas le plus banal — enverraient
   * deux notifications pour la même chose.
   */
  if (typeof doc.data.publishNotifiedAt === 'string') {
    return { ok: true, notified: 0, alreadyNotified: true };
  }

  const abonnes = await context.db.query({
    collection: 'users',
    where: [{ field: 'preferences.notifyOnPublish', op: '==', value: true }],
  });

  if (abonnes.length > MAX_DESTINATAIRES) {
    throw new HttpsError(
      'resource-exhausted',
      `${abonnes.length} destinataires : au-delà de ${MAX_DESTINATAIRES}, l'envoi doit être découpé.`,
    );
  }

  const maintenant = new Date().toISOString();

  /*
   * Le marqueur est posé AVANT les écritures. Si l'envoi casse à mi-parcours, le rejeu ne
   * doublera pas ceux qui ont déjà reçu — on préfère une notification manquante à une
   * notification en double, qui est la seule des deux que le destinataire remarque.
   */
  await context.db.update(`${spec.collection}/${id}`, { publishNotifiedAt: maintenant });

  await Promise.all(
    abonnes.map((abonne) => {
      const prefs = abonne.data.preferences as { language?: unknown } | undefined;
      const langue: 'fr' | 'en' = prefs?.language === 'en' ? 'en' : 'fr';
      return context.db.add(`notifications/${abonne.id}/items`, {
        userId: abonne.id,
        type: spec.type,
        title: TITRE[kind][langue],
        message: titre,
        read: false,
        createdAt: maintenant,
        link: `${spec.link}/${slug}`,
      });
    }),
  );

  return { ok: true, notified: abonnes.length, alreadyNotified: false };
}
