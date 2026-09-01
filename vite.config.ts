import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path';

/**
 * Regroupement manuel des dépendances.
 *
 * Forme fonction et non objet : la forme objet fait de chaque entrée un module
 * atteignable depuis l'entrée, donc Vite lui émet un `<link rel="modulepreload">`
 * sur *toutes* les pages. C'est ainsi que la page d'accueil préchargeait
 * l'intégralité des icônes utilisées par l'admin et le LMS.
 *
 * `lucide-react` A DISPARU DU PROJET. Il n'avait plus de groupe pour que Rollup
 * co-localise chaque icône avec sa route ; il n'a plus de paquet du tout. Les 107
 * glyphes qu'il servait sont entrés dans `MM_ICONS`, qui est de la DONNÉE pure —
 * donc dans le chunk de l'entrée, pour 12,2 Ko avant gzip, et sans seconde famille.
 * `framer-motion` en garde un, lui,
 * parce qu'il est réellement sur le chemin critique de la page d'accueil
 * (`PageTransition` dans `App.tsx`, et les nœuds `motion.*` de `Home`) —
 * l'isoler sert le cache, pas le poids.
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;

  // Avant le test `react/` : `react-router-dom` ne doit pas tomber dans vendor-react.
  if (id.includes('node_modules/react-router')) return 'router';

  // React était jusqu'ici hissé dans le chunk `router`, faute de groupe propre :
  // impossible de le mettre en cache indépendamment d'une montée de react-router.
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';

  /*
   * FIRESTORE A SON PROPRE GROUPE, ET C'EST CE QUI LE SORT DE LA PREMIÈRE VUE.
   *
   * Le groupe unique `firebase` réunissait app, auth, firestore et functions. Comme
   * `AuthContext` a besoin d'auth au démarrage, le chunk entier était statiquement
   * atteignable depuis l'entrée — et Firestore, 59,4 Ko gzip, était préchargé sur
   * toutes les pages pour un visiteur anonyme qui n'interroge aucune collection.
   *
   * Rendre l'import dynamique (`config/db.ts`, `AuthContext`) ne suffisait PAS : tant
   * que Rollup les regroupe, le morceau dynamique voyage avec le morceau statique.
   * Mesuré : le total de première vue avait même AUGMENTÉ, à 387,7 Ko.
   *
   * Les deux vont donc ensemble — import dynamique ET groupe séparé.
   *
   * `firebase/storage` n'est plus utilisé (les médias passent par R2) ; `firebase/functions`
   * garde son groupe, il n'est appelé que par des callables de fonctionnalité.
   */
  if (/node_modules\/(@firebase\/firestore|firebase\/firestore)/.test(id)) return 'firebase-firestore';
  if (/node_modules\/(@firebase\/functions|firebase\/functions)/.test(id)) return 'firebase-functions';
  if (/node_modules\/(@firebase|firebase)\//.test(id)) return 'firebase-core';

  if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';

  return undefined;
}

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 65 },
      svg: { multipass: true },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Le point d'entrée unique du design system (AD-9). Une surface n'importe jamais
      // un chemin profond de `design-system/react/`.
      '@ds': path.resolve(__dirname, 'src/design-system'),
    },
  },
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: { manualChunks },
    },
  },
});
