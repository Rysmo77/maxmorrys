import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { recordContentEngagement } from '../lib/firestore';
import type { ContentEngagement } from '../types';

interface UseContentEngagementArgs {
  contentId: string | undefined;
  type: ContentEngagement['type'];
  slug: string;
  title: string;
  category: string;
  /** Élément média natif (audio/vidéo) pour mesurer les minutes ; null pour un embed. */
  mediaRef?: React.RefObject<HTMLMediaElement | null>;
}

const MIN_DWELL_SEC = 5;

/**
 * Mesure l'engagement (temps de présence, scroll %, position média max) et le persiste
 * à la fermeture/masquage de la page — uniquement si l'utilisateur a la mémoire Rysmo active.
 */
export function useContentEngagement({
  contentId, type, slug, title, category, mediaRef,
}: UseContentEngagementArgs) {
  const { user, userData } = useAuth();
  const consent = userData?.preferences?.aiMemoryConsent !== false;

  // Refs pour accumuler sans re-render
  const activeMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const scrollPctMaxRef = useRef(0);
  const mediaSecMaxRef = useRef(0);
  const flushedRef = useRef(false);

  useEffect(() => {
    if (!user || !consent || !contentId) return;

    flushedRef.current = false;
    activeMsRef.current = 0;
    lastTickRef.current = document.visibilityState === 'visible' ? Date.now() : null;
    scrollPctMaxRef.current = 0;
    mediaSecMaxRef.current = 0;

    const accumulate = () => {
      if (lastTickRef.current !== null) {
        activeMsRef.current += Date.now() - lastTickRef.current;
        lastTickRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastTickRef.current = Date.now();
      } else {
        accumulate();
        flush(); // sauvegarde quand l'onglet passe en arrière-plan
      }
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable > 0) {
        const pct = (window.scrollY / scrollable) * 100;
        if (pct > scrollPctMaxRef.current) scrollPctMaxRef.current = Math.min(100, pct);
      }
    };

    const media = mediaRef?.current ?? null;
    const onTimeUpdate = () => {
      if (media && media.currentTime > mediaSecMaxRef.current) {
        mediaSecMaxRef.current = media.currentTime;
      }
    };

    const flush = () => {
      accumulate();
      const dwellSec = Math.round(activeMsRef.current / 1000);
      activeMsRef.current = 0; // évite double comptage entre flush
      if (lastTickRef.current === null && document.visibilityState === 'visible') {
        lastTickRef.current = Date.now(); // reprend le comptage si encore visible
      }
      if (flushedRef.current && dwellSec < MIN_DWELL_SEC && scrollPctMaxRef.current === 0 && mediaSecMaxRef.current === 0) return;
      if (dwellSec < MIN_DWELL_SEC && scrollPctMaxRef.current < 25 && mediaSecMaxRef.current < 5) return;
      flushedRef.current = true;
      recordContentEngagement(user.uid, contentId, {
        type, slug, title, category,
        scrollPct: scrollPctMaxRef.current,
        dwellSec,
        mediaSec: Math.round(mediaSecMaxRef.current),
      });
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (media) media.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
      if (media) media.removeEventListener('timeupdate', onTimeUpdate);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, consent, contentId]);
}
