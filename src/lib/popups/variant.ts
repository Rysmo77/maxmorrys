/**
 * Répartition A/B des pop-ups — groupe témoin contre groupe exposé.
 *
 * ⚠️ **C'est la pièce sans laquelle la mesure ne prouve rien.** Compter les clics sur une pop-up
 * dit combien de gens cliquent, jamais si la pop-up a AIDÉ. Une fenêtre peut afficher un bon taux
 * de clic tout en faisant fuir plus de visiteurs qu'elle n'en convertit. Seule la comparaison avec
 * un groupe qui n'en voit aucune répond à la question.
 *
 * Le groupe témoin émet `popup_withheld` là où il aurait vu une fenêtre : sans cet événement, on
 * saurait ce que fait le groupe exposé mais pas à quoi le comparer, et les deux populations ne
 * seraient plus appariées.
 *
 * L'identifiant est LOCAL et anonyme : un UUID de navigateur, jamais transmis au serveur — seule
 * la variante l'est, sous forme de compteur agrégé. Rien ici n'identifie une personne.
 */

export type PopupVariant = 'treatment' | 'control';

const VISITOR_KEY = 'mm-visitor';

/** Part du trafic exposée aux pop-ups. `0.5` = moitié témoin, moitié exposée. */
export const DEFAULT_TREATMENT_SHARE = 0.5;

function readOrCreateVisitorId(): string | null {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    // Stockage indisponible : pas d'identifiant stable, donc pas d'appartenance stable non plus.
    return null;
  }
}

/**
 * Hachage FNV-1a 32 bits, ramené à `[0, 1)`.
 *
 * Déterministe et sans dépendance : le même visiteur retombe toujours dans le même groupe, y
 * compris entre deux sessions. Une répartition tirée au hasard à chaque visite mélangerait les
 * deux populations et rendrait la comparaison inexploitable.
 */
function hashToUnitInterval(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash / 0x100000000;
}

/**
 * Groupe du visiteur courant.
 *
 * Sans identifiant stable (stockage bloqué), on retourne `treatment` : mieux vaut une mesure
 * légèrement biaisée qu'un visiteur privé de la fonctionnalité par un détail technique.
 */
export function getVariant(treatmentShare = DEFAULT_TREATMENT_SHARE): PopupVariant {
  if (typeof window === 'undefined') return 'control';
  const id = readOrCreateVisitorId();
  if (!id) return 'treatment';
  return hashToUnitInterval(id) < treatmentShare ? 'treatment' : 'control';
}
