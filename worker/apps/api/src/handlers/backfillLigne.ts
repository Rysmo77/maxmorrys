import { type CallContext, requireAdmin } from '../context';
import { ligneDeBusiness } from '../lib/purchase';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * `backfillLigne` — poser la ligne de business sur les transactions antérieures.
 *
 * ── POURQUOI UNE REPRISE, PUISQUE LA DÉDUCTION EST EXACTE ──────────────────────
 *
 * `ligneDeBusiness` sait déjà lire une transaction ancienne : les quatre formes
 * historiques se déduisent sans ambiguïté, et rien n'est perdu quand on tient le document
 * en main. Mais on ne peut pas REQUÊTER une déduction. `where('ligne','==','club')` ne
 * verra jamais une transaction qui ne porte pas le champ, et c'est précisément ce que
 * l'écran de revenu doit faire dès qu'il cesse de tout charger en mémoire.
 *
 * La reprise ne corrige donc pas une donnée fausse : elle rend une donnée vraie
 * interrogeable.
 *
 * ── POURQUOI UNE CALLABLE ET PAS UN SCRIPT ─────────────────────────────────────
 *
 * `scripts/backfill-mail-pending.mjs` est le précédent, et sa recette est à moitié morte :
 * elle propose d'exécuter une copie depuis `functions/`, supprimé le 03/09/2026. Une
 * callable n'a besoin d'aucune identification locale, d'aucune clé de service sur un poste,
 * et elle passe par le même `requireAdmin` que le reste de la console.
 *
 * ── IDEMPOTENCE ET BORNAGE ─────────────────────────────────────────────────────
 *
 * Chaque passe ne touche que des documents SANS le champ, et n'écrit que ce champ
 * (`mask: true`). Relancer est donc sans effet une fois la reprise finie — `updated: 0` est
 * la condition d'arrêt, et `hasMore` dit s'il reste du travail.
 *
 * ⚠️ AUCUNE ÉCRITURE SUR UNE TRANSACTION QUI N'EN A PAS BESOIN. Le champ existant n'est
 * jamais réécrit, même s'il diverge de la déduction : un champ écrit par le Worker fait foi,
 * et une reprise qui « corrige » ce qu'un paiement a inscrit serait une reprise qui réécrit
 * l'histoire.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Transactions lues par appel.
 *
 * Le plafond porte sur la LECTURE, pas sur les écritures : une passe peut ne rien avoir à
 * faire sur les 400 documents qu'elle vient de lire. `hasMore` reste donc vrai tant qu'une
 * page pleine est revenue, même sans écriture — sinon la reprise s'arrêterait à la première
 * page déjà traitée, en laissant tout le reste derrière.
 */
const PAR_APPEL = 400;

/** Firestore plafonne un commit à 500 écritures. */
const PAR_LOT = 400;

/*
 * ⚠️ CHAQUE APPEL REPART DU DÉBUT, ET C'EST ASSUMÉ. On ne peut pas requêter « les documents
 * SANS le champ » — c'est le défaut même que cette reprise corrige —, donc il n'y a pas de
 * filtre qui saute ce qui est déjà fait. Les pages déjà traitées sont relues, ne produisent
 * aucune écriture, et la passe avance d'autant.
 *
 * Le coût est quadratique en nombre d'appels. Il est négligeable ici : la collection compte
 * quelques centaines de documents au plus. Si elle atteignait un jour des dizaines de
 * milliers, ce handler devrait prendre un curseur en entrée plutôt que d'être relancé à nu.
 */

export async function backfillLigne(_data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  let lus = 0;
  let updated = 0;
  const parLigne: Record<string, number> = {};

  for await (const page of context.db.queryPaged({ collection: 'transactions' }, PAR_LOT)) {
    lus += page.length;

    const aEcrire = page.filter((transaction) => typeof transaction.data.ligne !== 'string');
    if (aEcrire.length > 0) {
      const writes = aEcrire.map((transaction) => {
        const ligne = ligneDeBusiness(transaction.data);
        parLigne[ligne] = (parLigne[ligne] ?? 0) + 1;
        return context.db.buildWrite(transaction.path, { ligne }, { mask: true });
      });
      await context.db.commit(writes);
      updated += writes.length;
    }

    if (lus >= PAR_APPEL) {
      return { updated, parLigne, lus, hasMore: true };
    }
  }

  return { updated, parLigne, lus, hasMore: false };
}
