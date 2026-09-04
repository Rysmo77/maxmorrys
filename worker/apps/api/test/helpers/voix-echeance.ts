import { expect } from 'vitest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA VOIX DES RAPPELS D'ÉCHÉANCE — une définition, deux courriers.
 *
 * Ces assertions vivaient dans `renewal.test.ts`, écrites pour le Club. Quand le rappel
 * mensuel de Rysmo+ est arrivé, les recopier aurait produit deux gardes qui se ressemblent
 * — donc deux gardes qui divergent, et la divergence se serait vue sur le courrier le moins
 * relu des deux.
 *
 * ⚠️ CE QUE CES DEUX FONCTIONS PROTÈGENT N'EST PAS UN STYLE, C'EST UNE PROMESSE.
 * Le produit ne prélève rien automatiquement : ni Bictorys, ni Wave n'offrent de mandat
 * récurrent (voir l'en-tête de `src/lib/renewal.ts`). Un courrier d'échéance qui laisserait
 * croire à un prélèvement ferait attendre un débit qui n'arrivera jamais — et l'accès
 * s'arrêterait sans que personne ait rien vu venir. C'est la seule faute de ces messages qui
 * coûte un client sans qu'il sache pourquoi.
 *
 * Tout nouveau courrier d'échéance appelle ces deux fonctions. C'est ce qui rend impossible
 * d'en écrire un troisième sans la garde.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Le message DIT que rien ne sera prélevé — en français comme en anglais. */
export function assertDitQueRienNestPreleve(message: { text: string }): void {
  expect(message.text).toMatch(/[Rr]ien ne sera prélevé|[Nn]othing will be charged/);
}

/**
 * Le message ne promet à aucun moment un prélèvement automatique.
 *
 * La liste est celle des formulations qui ont réellement failli être écrites : « ton
 * abonnement sera renouvelé automatiquement », « tu seras débité le… ». Elle s'allonge
 * quand une nouvelle tournure apparaît, jamais elle ne se raccourcit.
 */
export function assertNePrometAucunPrelevement(message: { text: string }): void {
  expect(message.text).not.toMatch(
    /renouvellement automatique|sera débité|prélèvement automatique sera|automatically renewed|will be charged automatically/i,
  );
}
