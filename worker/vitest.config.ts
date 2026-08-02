import { defineConfig } from 'vitest/config';

/**
 * Deux projets, deux runtimes :
 *
 *  - `packages` tourne sous Node : le codec Firestore, la signature JWT et les
 *    enveloppes onCall sont de la logique pure, et WebCrypto y est natif.
 *  - `site` tourne sous workerd via `@cloudflare/vitest-pool-workers`, parce que
 *    HTMLRewriter n'existe que dans le runtime Workers — et c'est précisément le
 *    composant dont une régression coûterait du trafic organique.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'packages',
          include: ['packages/*/test/**/*.test.ts'],
          environment: 'node',
        },
      },
      './apps/site/vitest.config.ts',
    ],
  },
});
