import { describe, expect, it } from 'vitest';

import { cached } from '../src/cache';
import type { Env } from '../src/env';

/**
 * Le TTL peut dépendre de la valeur produite : une page anglaise restée en français par
 * repli (traduction en panne) ne doit vivre qu'une minute en cache, pas cinq.
 */
function fauxEnv() {
  const puts: Array<{ key: string; ttl: number | undefined }> = [];
  const env = {
    SEO: {
      get: async () => null,
      put: async (key: string, _value: string, options?: { expirationTtl?: number }) => {
        puts.push({ key, ttl: options?.expirationTtl });
      },
    },
  } as unknown as Env;
  const attentes: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => attentes.push(p) } as unknown as ExecutionContext;
  return { env, ctx, puts, attentes };
}

describe('cached', () => {
  it('un TTL fixe reste un TTL fixe', async () => {
    const { env, ctx, puts, attentes } = fauxEnv();
    await cached(env, ctx, 'k', 300, async () => ({ found: true }));
    await Promise.all(attentes);
    expect(puts).toEqual([{ key: 'k', ttl: 300 }]);
  });

  it('un repli est mis en cache brièvement', async () => {
    const { env, ctx, puts, attentes } = fauxEnv();
    const ttl = (v: { repli?: boolean }) => (v.repli ? 60 : 300);
    await cached(env, ctx, 'a', ttl, async () => ({ repli: true }));
    await cached(env, ctx, 'b', ttl, async () => ({}));
    await Promise.all(attentes);
    expect(puts).toEqual([{ key: 'a', ttl: 60 }, { key: 'b', ttl: 300 }]);
  });
});
