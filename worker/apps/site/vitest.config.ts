import { cloudflarePool } from '@cloudflare/vitest-pool-workers';
import { defineProject } from 'vitest/config';

/**
 * Ces tests s'exécutent dans workerd, pas dans Node : HTMLRewriter n'existe que
 * dans le runtime Workers.
 *
 * L'environnement `preview` de `wrangler.jsonc` est utilisé pour ne jamais
 * charger la configuration porteuse des routes de production.
 */
export default defineProject({
  test: {
    name: 'site',
    include: ['test/**/*.test.ts'],
    pool: cloudflarePool({
      wrangler: { configPath: './wrangler.jsonc', environment: 'preview' },
    }),
  },
});
