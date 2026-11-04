import { defineConfig } from 'vitest/config';

/**
 * Deux projets, deux runtimes :
 *
 *  - `packages` tourne sous Node : le codec Firestore, la signature JWT et les
 *    enveloppes onCall sont de la logique pure, et WebCrypto y est natif.
 *  - `api` tourne sous Node aussi : seul le rendu de la facture y est testé, et il est pur
 *    à dessein — pas de réseau, pas de binding. C'est ce qui permet de vérifier un document
 *    légal (numérotation, montants, mentions d'émetteur) sans rien envoyer à personne.
 *  - `media` tourne sous Node : la route de génération d'image est testée avec des doublures.
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
      {
        // `media` : la génération d'image (`/internal/generate-image`) est testée sous Node
        // avec des doublures de Workers AI et de R2 — aucune image réelle, aucun coût.
        test: {
          name: 'media',
          include: ['apps/media/test/**/*.test.ts'],
          environment: 'node',
        },
      },
      './apps/site/vitest.config.ts',
    ],
  },
});
