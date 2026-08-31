import { defineConfig } from 'vitest/config';

/**
 * Deux projets, deux runtimes :
 *
 *  - `packages` tourne sous Node : le codec Firestore, la signature JWT et les
 *    enveloppes onCall sont de la logique pure, et WebCrypto y est natif.
 *  - `api` tourne sous Node aussi : seul le rendu de la facture y est testé, et il est pur
 *    à dessein — pas de réseau, pas de binding. C'est ce qui permet de vérifier un document
 *    légal (numérotation, montants, mentions d'émetteur) sans rien envoyer à personne.
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
      {
        test: {
          name: 'api',
          include: ['apps/api/test/**/*.test.ts'],
          environment: 'node',
        },
      },
      './apps/site/vitest.config.ts',
    ],
  },
});
