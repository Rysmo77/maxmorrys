import { useEffect, useState } from 'react';

/** Vrai une fois `ms` écoulées — `true` d'emblée pour un délai nul. */
export function useDelayed(ms: number): boolean {
  const [on, setOn] = useState(ms <= 0);
  useEffect(() => {
    if (ms <= 0) return;
    const id = window.setTimeout(() => setOn(true), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return on;
}
