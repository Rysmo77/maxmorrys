import { useEffect, useRef } from 'react';

/**
 * Barre de progression de lecture, montée sur toutes les pages publiques.
 *
 * Volontairement sans état React : l'ancienne version appelait `setProgress`
 * avec un flottant à chaque événement de scroll (60-120/s, jamais de bail-out),
 * lisait `scrollHeight` juste après avoir écrit `width` — un layout thrashing
 * par frame — et animait `width`, qui déclenche le layout plutôt que le
 * compositeur. Ici on écrit une `transform` sur une ref, coalescée en rAF, et
 * la hauteur du document n'est relue qu'au redimensionnement.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scrollable = 0;
    let frame: number | null = null;

    const measure = () => {
      scrollable = document.documentElement.scrollHeight - window.innerHeight;
    };

    const paint = () => {
      frame = null;
      const bar = barRef.current;
      const track = trackRef.current;
      if (!bar || !track) return;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      // En dessous de 1 %, la barre reste invisible — comportement d'origine.
      track.style.visibility = ratio < 0.01 ? 'hidden' : 'visible';
      bar.style.transform = `scaleX(${ratio})`;
    };

    const onScroll = () => {
      if (frame == null) frame = requestAnimationFrame(paint);
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={trackRef} className="fixed top-0 left-0 right-0 z-50 h-0.5" style={{ visibility: 'hidden' }}>
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-brand-500 will-change-transform"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
