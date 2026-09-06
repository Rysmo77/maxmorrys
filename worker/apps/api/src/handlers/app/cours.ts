import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appCours` — LE CATALOGUE, ET CE QU'IL N'AFFICHE PLUS.
 *
 * ⚠️ AUCUN PRIX N'EST RENVOYÉ, et ce n'est pas un oubli. L'application est en consultation
 * seule : un catalogue qui affiche des montants EST une vitrine, quel que soit le libellé du
 * bouton. Le champ `price` existe sur chaque document ; il s'arrête ici.
 *
 * ── DEUX ÉTATS, ET LA DIFFÉRENCE ENTRE EUX EST L'INFORMATION ─────────────────────────
 * L'écran distingue ce qu'on possède de ce qu'on ne possède pas. On renvoie donc
 * `acquise`, calculé depuis les inscriptions de la personne — jamais depuis un paramètre.
 *
 * ⚠️ ON NE LIT QUE LES FORMATIONS PUBLIÉES. Un brouillon visible dans le catalogue est une
 * promesse qu'on ne tient pas, et sur ce chemin-là le compte de service ne serait arrêté
 * par rien : `firestore.rules` filtre `status == 'published'` pour un visiteur, pas pour
 * nous. Le filtre est refait ici, explicitement.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export async function appCours(_data: unknown, context: CallContext): Promise<Reponse<'appCours'>> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const [publiees, inscriptions] = await Promise.all([
    context.db.query({
      collection: 'formations',
      where: [{ field: 'status', op: '==', value: 'published' }],
    }),
    context.db.query({
      collection: 'enrollments',
      where: [{ field: 'userId', op: '==', value: auth.uid }],
    }),
  ]);

  const acquises = new Set(
    inscriptions.map((i: DocSnapshot) => asText(i.data.formationId)).filter(Boolean),
  );

  return {
    vue: publiees.map((f: DocSnapshot) => {
      const modules = Array.isArray(f.data.modules) ? f.data.modules : [];
      const lecons = modules.reduce((n: number, m: unknown) => {
        const liste = (m as { lessons?: unknown[] })?.lessons;
        return n + (Array.isArray(liste) ? liste.length : 0);
      }, 0);
      const titre = asText(f.data.title) ?? '';
      return {
        id: f.id,
        slug: asText(f.data.slug) ?? '',
        titre,
        titreCourt: titre.split(/\s+(?:pour|—|:)\s+/)[0] ?? titre,
        meta: [
          asText(f.data.category),
          modules.length > 0 ? `${modules.length} modules` : null,
          lecons > 0 ? `${lecons} leçons` : null,
          asText(f.data.level),
        ].filter(Boolean).join(' · '),
        /* Le niveau sortait DÉJÀ, mais fondu dans `meta` — une chaîne d'affichage, dont on
           ne peut ni compter les valeurs ni filtrer dessus. L'écran s'en tirait avec un
           filtre aux comptes écrits en dur (« Tout · 2 · Débutant · 1 »), à quinze lignes
           d'un titre dont le commentaire explique justement pourquoi un nombre en dur est
           faux. Le niveau descend donc comme une DONNÉE, à côté de sa mise en forme. */
        niveau: asText(f.data.level) ?? null,
        acquise: acquises.has(f.id),
      };
    }),
    releveA,
  };
}
