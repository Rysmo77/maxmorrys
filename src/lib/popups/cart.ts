/**
 * Marqueur de tunnel de paiement abandonné.
 *
 * Un visiteur qui atteint `/checkout/<slug>` sans aller au bout est le prospect le plus proche de
 * l'achat de tout le site. On retient le slug pour pouvoir lui rappeler CE qu'il a laissé, pas un
 * message générique.
 *
 * ⚠️ Rien ne doit s'afficher tant qu'il est DANS le tunnel — voir `isCheckoutPath` dans
 * `registry.ts`. Le rappel n'a lieu qu'au retour sur une autre page.
 *
 * ⚠️ Le marqueur EXPIRE à sept jours. Sans expiration, un abandon vieux de six mois ressortirait
 * comme une nouveauté, et le prix affiché aurait toutes les chances d'être faux.
 */

const KEY = 'mm-cart-pending';

/** Durée de validité d'un abandon. Au-delà, l'intention n'est plus d'actualité. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface PendingCart {
  slug: string;
  at: number;
}

/** Enregistre l'entrée dans un tunnel de paiement. */
export function markCartPending(slug: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ slug, at: Date.now() } satisfies PendingCart));
  } catch {
    // Stockage indisponible : pas de rappel, ce n'est pas bloquant.
  }
}

/** Efface le marqueur — paiement abouti, ou rappel déjà présenté. */
export function clearCartPending(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Rien à effacer si le stockage est inaccessible.
  }
}

/** Le slug laissé en plan, ou `null` si aucun ou périmé. Nettoie au passage un marqueur expiré. */
export function getPendingCart(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCart>;
    if (typeof parsed.slug !== 'string' || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > TTL_MS) {
      clearCartPending();
      return null;
    }
    return parsed.slug;
  } catch {
    return null;
  }
}
