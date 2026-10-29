import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { espaceCourant, toLogicalPath } from '../../lib/hosts';
import { universeFromPath, universeThemes } from '../../lib/sectionThemes';
import { routeVeil, usePendingRoutes } from './routeVeilStore';

type Phase = 'idle' | 'in' | 'hold' | 'out';

const IN_MS = 200;
const OUT_MS = 300;
/** Un chunk qui n'arrive jamais ne doit pas laisser le voile en place : le repli prend le relais. */
const MAX_HOLD_MS = 8000;

/** Les espaces à onglets internes : passer d'un onglet à l'autre n'est pas changer de page. */
const SANS_VOILE = /^\/(mon-espace|admin)(\/|$)/;

const reduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * LA TRANSITION DE PAGE — un voile à la teinte du territoire couvre, le logo respire au
 * centre, puis le voile se retire. ~500 ms au total (200 entrée + 300 retrait).
 *
 *   · Seulement quand le `pathname` change : ni hash, ni requête, ni premier chargement,
 *     ni passage d'un onglet à l'autre sous `/mon-espace` ou `/admin`.
 *   · Si le code de la page n'est pas encore là, le voile TIENT jusqu'à la résolution du
 *     `<Suspense>` ; le repli, lui, n'affiche alors pas son propre logo (`routeVeilStore`).
 *   · Non bloquant : `pointer-events: none`, `aria-hidden`, aucun focus déplacé — l'annonce
 *     de route et le lien d'évitement restent intacts. Sous la barre haute (z-40).
 *   · `prefers-reduced-motion` : aucune transition.
 */
export default function RouteVeil() {
  const { pathname } = useLocation();
  const precedent = useRef(pathname);
  const [phase, setPhase] = useState<Phase>('idle');
  const [run, setRun] = useState(0);
  const pending = usePendingRoutes();

  // Layout : la décision est prise avant la peinture de la nouvelle page.
  useLayoutEffect(() => {
    const avant = precedent.current;
    precedent.current = pathname;
    if (avant === pathname || reduced()) return;
    const a = toLogicalPath(avant);
    const b = toLogicalPath(pathname);
    if (a === b || (SANS_VOILE.test(a) && SANS_VOILE.test(b))) return;
    routeVeil.setActive(true);
    setRun((r) => r + 1);
    setPhase('in');
  }, [pathname]);

  // Entrée : son minuteur ne dépend QUE de la phase (une attente qui change ne le relance pas).
  useEffect(() => {
    if (phase !== 'in') return;
    const id = window.setTimeout(() => setPhase('hold'), IN_MS);
    return () => window.clearTimeout(id);
  }, [phase, run]);

  useEffect(() => {
    if (phase === 'hold') {
      if (pending === 0) { setPhase('out'); return; }
      const id = window.setTimeout(() => setPhase('out'), MAX_HOLD_MS);
      return () => window.clearTimeout(id);
    }
    if (phase === 'out') {
      // Le voile se retire : le repli éventuel reprend son propre logo.
      routeVeil.setActive(false);
      const id = window.setTimeout(() => setPhase('idle'), OUT_MS);
      return () => window.clearTimeout(id);
    }
  }, [phase, pending]);

  useEffect(() => () => routeVeil.setActive(false), []);

  if (phase === 'idle') return null;

  const espace = espaceCourant();
  const territoire = universeThemes[universeFromPath(pathname)].mesh;
  const teinte = espace !== 'hub' ? espace : territoire === null ? 'agence' : territoire === 'nuit' ? 'hub' : territoire;

  return (
    <div key={run} className={`mm-veil is-${phase === 'out' ? 'out' : 'in'}`} data-tint={teinte} aria-hidden="true">
      <span className="mm-ll mm-ll--lg">
        <span className="mm-ll__plate">
          <img src="/monogramme-320.png" alt="" width={72} height={72} decoding="async" />
        </span>
        <span className="mm-ll__trait"><i /></span>
      </span>
    </div>
  );
}
