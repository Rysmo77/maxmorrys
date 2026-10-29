import { useSyncExternalStore } from 'react';

/**
 * LE PACTE ENTRE LE VOILE ET LE REPLI DE ROUTE — un seul indicateur à la fois.
 *
 *   · `PageLoader` (repli `<Suspense>`) se déclare EN ATTENTE tant qu'il est monté ;
 *   · `RouteVeil` reste couvrant tant qu'une attente est déclarée, et se déclare ACTIF ;
 *   · voile actif → le repli ne dessine pas son logo (il réserve seulement la place).
 *
 * Un module, pas un contexte : le repli vit sous `<Outlet>`, le voile à côté, et aucun des
 * deux ne doit re-rendre la page entière pour se parler.
 */
let pending = 0;
let veil = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const routeVeil = {
  suspendStart() { pending += 1; emit(); },
  suspendEnd() { pending = Math.max(0, pending - 1); emit(); },
  setActive(v: boolean) { if (veil !== v) { veil = v; emit(); } },
};

export const usePendingRoutes = () => useSyncExternalStore(subscribe, () => pending, () => 0);
export const useVeilActive = () => useSyncExternalStore(subscribe, () => veil, () => false);
