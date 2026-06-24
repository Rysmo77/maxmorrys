import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * Traduction de contenu dynamique (Firestore) FR -> EN à la volée.
 * - Cache de session en mémoire (texte source -> traduction).
 * - Batching : les demandes émises dans la même fenêtre sont regroupées en un
 *   seul appel à la Cloud Function `translateContent` (qui a son propre cache Firestore).
 */

type TargetLang = 'en';

const callable = httpsCallable<
  { texts: string[]; targetLang: TargetLang },
  { translations: Record<string, string> }
>(functions, 'translateContent');

const cache = new Map<string, string>(); // texte source -> traduction EN
const inflight = new Map<string, Promise<void>>(); // texte source -> promesse en cours

let queue = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_BATCH = 60;

function flush() {
  flushTimer = null;
  const batch = [...queue].slice(0, MAX_BATCH);
  queue = new Set([...queue].slice(MAX_BATCH));
  if (queue.size > 0) scheduleFlush();
  if (batch.length === 0) return;

  const promise = callable({ texts: batch, targetLang: 'en' })
    .then((res) => {
      const translations = res.data?.translations ?? {};
      for (const src of batch) {
        const value = translations[src];
        if (typeof value === 'string') cache.set(src, value);
        inflight.delete(src);
      }
    })
    .catch(() => {
      // Échec réseau / quota : on laisse le texte source (dégradation gracieuse).
      for (const src of batch) inflight.delete(src);
    });

  for (const src of batch) inflight.set(src, promise);
}

function scheduleFlush() {
  if (flushTimer == null) flushTimer = setTimeout(flush, 60);
}

/** Demande la traduction d'un texte. Résout quand la traduction (ou le repli) est prête. */
export function requestTranslation(text: string): Promise<string> {
  const src = text?.trim();
  if (!src) return Promise.resolve(text);
  const cached = cache.get(text);
  if (cached != null) return Promise.resolve(cached);

  const existing = inflight.get(text);
  if (existing) return existing.then(() => cache.get(text) ?? text);

  queue.add(text);
  scheduleFlush();
  // On attend le prochain flush ; la promesse inflight sera posée au flush.
  return new Promise((resolve) => {
    const check = () => {
      const p = inflight.get(text);
      if (p) p.then(() => resolve(cache.get(text) ?? text));
      else if (cache.has(text)) resolve(cache.get(text) as string);
      else setTimeout(check, 30);
    };
    check();
  });
}

/** Lecture synchrone du cache (sans déclencher de requête). */
export function getCachedTranslation(text: string): string | undefined {
  return cache.get(text);
}
