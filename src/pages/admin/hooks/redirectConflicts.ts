import { isInternalTarget, normalizeSource, normalizeTarget } from '../../../lib/redirects';
import type { Redirect } from '../../../types';

/**
 * L'ÉTAPE « EN CONFLIT » DU KIT, DÉFINIE PAR CE QUE LE BORD FAIT RÉELLEMENT.
 *
 * `worker/apps/site/src/redirects.ts` construit sa carte à partir des entrées ACTIVES
 * seulement, écarte `/` et les cibles non internes, et sur doublon de source garde « la plus
 * récemment modifiée ». Quatre états sortent de là, et chacun est un piège silencieux : la
 * table paraît juste dans l'écran, et le bord n'en sert pas la moitié.
 *
 *   • `duplicate` — deux entrées actives sur la même source. Le bord en garde UNE ; l'autre
 *     ne s'appliquera jamais, et rien ne le dit à qui l'a écrite.
 *   • `loop` — la cible est la source elle-même. Le navigateur boucle et abandonne
 *     (ERR_TOO_MANY_REDIRECTS) ; l'URL devient inatteignable.
 *   • `chain` — la cible est elle-même la source d'une autre entrée active. Deux sauts au lieu
 *     d'un : les moteurs escomptent la chaîne, et un cycle A→B→A est un `loop` en deux temps.
 *   • `unserved` — source `/` ou cible non interne : le bord passe l'entrée sans un mot.
 *
 * La normalisation est celle du module partagé (`src/lib/redirects.ts`), miroir exact du
 * Worker : comparer autrement reviendrait à vérifier une table que personne ne sert.
 *
 * CE FICHIER EST PUR — ni React, ni Firebase — pour que `tests/unit/redirect-conflicts.test.ts`
 * puisse l'exercer sans monter l'application.
 */
export type RedirectConflict = 'duplicate' | 'loop' | 'chain' | 'unserved';

/** Le chemin d'une cible, sans query ni fragment — c'est lui que le bord compare. */
function targetPath(target: string): string {
  return normalizeSource(normalizeTarget(target).split('?')[0].split('#')[0]);
}

export function findConflicts(redirects: Redirect[]): Map<string, RedirectConflict> {
  const conflicts = new Map<string, RedirectConflict>();
  const activeBySource = new Map<string, Redirect[]>();

  for (const r of redirects) {
    if (!r.active) continue;
    const source = normalizeSource(r.source);
    const list = activeBySource.get(source);
    if (list) list.push(r);
    else activeBySource.set(source, [r]);
  }

  for (const [, list] of activeBySource) {
    if (list.length > 1) for (const r of list) conflicts.set(r.id, 'duplicate');
  }

  for (const r of redirects) {
    if (!r.active || conflicts.has(r.id)) continue;
    const source = normalizeSource(r.source);
    const target = targetPath(r.target);

    if (source === '/' || !isInternalTarget(normalizeTarget(r.target))) {
      conflicts.set(r.id, 'unserved');
      continue;
    }
    if (target === source) {
      conflicts.set(r.id, 'loop');
      continue;
    }
    if (activeBySource.has(target)) conflicts.set(r.id, 'chain');
  }

  return conflicts;
}
