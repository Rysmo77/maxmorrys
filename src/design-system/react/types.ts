/**
 * Les types partagés du design system.
 *
 * Ils sont ici, et pas répétés dans chaque composant, parce que c'est par eux que les
 * invariants deviennent des erreurs de compilation plutôt que des conventions.
 */

/**
 * Les quatre territoires de marque, et SEULEMENT les quatre.
 *
 * L'agence vit hors des quatre verbes — séparateur dans la barre haute, entrée en corail :
 * elle ne se range pas sous « Je te digitalise », c'est une autre promesse et un autre client.
 * Elle n'a donc pas de valeur ici, et le type l'empêche d'en gagner une par accident.
 */
export const TERRITORIES = ['forme', 'informe', 'transforme', 'digitalise'] as const;
export type Territory = (typeof TERRITORIES)[number];

/** Le verbe que porte chaque territoire. La navigation publique est construite dessus. */
export const TERRITORY_VERB: Record<Territory, { fr: string; en: string }> = {
  forme: { fr: 'Je te forme', en: "I'll train you" },
  informe: { fr: "Je t'informe", en: "I'll keep you posted" },
  transforme: { fr: 'Je te transforme', en: "I'll push you further" },
  digitalise: { fr: 'Je te digitalise', en: "I'll get you online" },
};

/**
 * La provenance d'un nombre affiché.
 *
 * Règle 6 du design system : « un nombre en monospace vient de la base ou d'une source citée.
 * Sinon il ne s'affiche pas. » Ce type est la façon dont cette règle cesse d'être une
 * habitude de revue : sans source, le composant <Num> ne compile pas.
 *
 * Le contexte : les chiffres de façade — 98 % de complétion, 1 486 étudiants, 45 M XOF —
 * étaient contredits par la base de production. Un visiteur qui les prend en défaut ne
 * revient pas.
 */
export type NumSource =
  /** Lu dans Firestore au chargement de la vue. */
  | 'db'
  /** Recalculé côté serveur — un prix débité, jamais un prix affiché. */
  | 'server'
  /** Sourcé hors du produit : la source se cite, et elle s'affiche. */
  | { cite: string };

/** Les niveaux de verre. Un seul porte encore un flou — voir GlassPanel. */
export type GlassLevel = 'panel' | 'hero' | 'flat' | 'night' | 'truth';

/**
 * L'encre de chaque territoire : le filet sous une entrée de barre haute, la pastille d'une
 * entrée latérale ou de sous-navigation.
 *
 * Elle vit ici et n'est pas recopiée dans les trois composants de navigation qui la lisent.
 * Trois copies, c'est trois occasions de diverger — et cette divergence-là ne se voit pas :
 * un violet un ton à côté sur une seule des trois surfaces passe toutes les revues.
 *
 * Les jetons `--mm-*` basculent seuls sous `.dk` (#6C23DD devient #B98CFF, qui tient 7,6:1
 * là où l'original tombe à 2,69:1). Il n'y a donc rien à passer au composant, et rien à
 * décider au moment de l'appel — AD-3.
 */
export const TERRITORY_INK: Record<Territory, string> = {
  forme: 'var(--mm-bleu)',
  informe: 'var(--mm-orange)',
  transforme: 'var(--mm-violet)',
  digitalise: 'var(--mm-teal)',
};
