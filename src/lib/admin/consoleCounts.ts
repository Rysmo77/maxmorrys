import { useEffect, useState } from 'react';
import { getPlatformStats } from '../firestore';
import { captureError } from '../sentry';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES COMPTEURS DE LA NAVIGATION DE CONSOLE — RELEVÉS UNE FOIS, PARTAGÉS.
 *
 * Le handoff des tableaux de bord veut un compteur par entrée : « Transactions ·
 * 1 en attente », « Utilisateurs · 5 », « Articles · 47 brouillons ». La raison est
 * dans son README : l'opérateur est UNE personne, et la console « s'ouvre sur ce
 * qui bloque ». Un menu qui n'annonce rien oblige à ouvrir les dix-neuf écrans pour
 * savoir lequel demande quelque chose.
 *
 * `AppSidebar` porte déjà la prop `badge` (`AppSidebar.tsx:45`, rendue ligne 173).
 * Elle n'était simplement jamais alimentée : la capacité existait, inutilisée.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN CACHE, ET PAS UN APPEL DANS LA COQUE
 *
 * `getPlatformStats()` lance ONZE `getCountFromServer` en parallèle. La coque admin
 * est montée par les dix-neuf écrans : y brancher l'appel directement, c'est onze
 * requêtes d'agrégat à CHAQUE navigation interne, pour un menu qui ne change pas
 * entre deux clics.
 *
 * Le cache est de module, pas de composant : deux consommateurs montés en même
 * temps (la navigation et le tableau de bord) partagent le même relevé au lieu
 * d'en demander deux. `inflight` sert à ça — sans lui, deux montages simultanés
 * déclenchent deux vagues de onze requêtes avant que l'une ait répondu.
 *
 * ⚠️ UN COMPTEUR EST UN RELEVÉ, DONC IL PORTE SA DATE. `asOf` n'est pas décoratif :
 * c'est ce qui distingue « 0 encaissé au 30/08 » de « 0 » tout court. La règle 6 du
 * système l'exige pour tout nombre affiché, et un badge de navigation n'y échappe
 * pas — d'où le retour du couple `{ counts, asOf }` et jamais des seuls nombres.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type ConsoleCounts = Awaited<ReturnType<typeof getPlatformStats>>;

/** Durée de vie du relevé. Au-delà, la prochaine lecture redemande au serveur. */
const TTL_MS = 5 * 60_000;

let cache: { at: number; counts: ConsoleCounts } | null = null;
let inflight: Promise<ConsoleCounts> | null = null;

/**
 * Relève les compteurs, en réutilisant le dernier relevé s'il est encore frais.
 *
 * @param force ignore le cache — c'est ce que le bouton « Actualiser » du tableau
 *   de bord doit passer, sans quoi il ne rafraîchirait rien pendant cinq minutes.
 */
export async function readConsoleCounts(force = false): Promise<ConsoleCounts> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.counts;
  if (!force && inflight) return inflight;

  inflight = getPlatformStats()
    .then((counts) => {
      cache = { at: Date.now(), counts };
      return counts;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Vide le relevé — à appeler après une écriture qui change un des onze comptes. */
export function invalidateConsoleCounts(): void {
  cache = null;
}

/**
 * Le relevé des compteurs, pour la navigation.
 *
 * Rend `null` tant que rien n'est relevé, et `null` encore si le relevé échoue :
 * un badge absent dit « non relevé », là où un `0` affirmerait un compte qu'on n'a
 * pas. C'est la même règle que le quota du répétiteur — un relevé qui échoue se
 * tait, il ne se devine pas.
 */
export function useConsoleCounts(): { counts: ConsoleCounts | null; asOf: Date | null } {
  const [counts, setCounts] = useState<ConsoleCounts | null>(cache?.counts ?? null);
  const [asOf, setAsOf] = useState<Date | null>(cache ? new Date(cache.at) : null);

  useEffect(() => {
    let alive = true;
    readConsoleCounts()
      .then((next) => {
        if (!alive) return;
        setCounts(next);
        setAsOf(new Date());
      })
      .catch((error: unknown) => {
        captureError(error, { context: 'readConsoleCounts()' });
        if (alive) {
          setCounts(null);
          setAsOf(null);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return { counts, asOf };
}
