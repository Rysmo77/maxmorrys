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

/**
 * Le message DIT que rien ne sera prélevé — en français comme en anglais.
 *
 * ⚠️ LA LISTE S'ALLONGE, ELLE NE SE RESSERRE PAS. Elle porte les tournures RÉELLEMENT
 * employées par les courriers du produit, et il y en a déjà deux familles : la forme
 * impersonnelle du rappel Rysmo+ (« rien ne sera prélevé ») et la forme à la première
 * personne du rappel du Club (« je ne prélèverai rien »), qui l'a remplacée le 04/09/2026.
 *
 * Une garde qui n'accepterait qu'une seule formulation forcerait le prochain rédacteur à
 * écrire la phrase du test plutôt que la phrase juste — c'est-à-dire à faire dire au produit
 * ce qui arrange la suite. Ce qui compte est que la promesse SOIT là, pas qu'elle soit
 * toujours dite pareil.
 */
export function assertDitQueRienNestPreleve(message: { text: string }): void {
  expect(message.text).toMatch(
    /[Rr]ien ne sera prélevé|ne prélèverai rien|[Nn]othing will be charged|won't charge anything/,
  );
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
