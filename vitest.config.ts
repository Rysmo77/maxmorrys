import { defineConfig } from 'vitest/config';

// Test runner config. Firestore-rules tests run against the Firestore emulator
// (see `npm run test:rules`, which wraps this in `firebase emulators:exec`).
export default defineConfig({
  /*
   * ⛔ LES OPTIONS DE COMPILATION SONT FIXÉES ICI, ET C'EST CE QUI REND LA SUITE AUTONOME.
   *
   * Sans `tsconfigRaw` en CHAÎNE, Vite lit le `tsconfig.json` le plus proche de CHAQUE fichier
   * transformé. Les tests importent des modules purs de `mobile/` (la file d'envoi, les
   * dégradés, les termes) : Vite lisait donc `mobile/tsconfig.json`, qui étend
   * `expo/tsconfig.base` — introuvable sans `mobile/node_modules`, que le job `lint-and-build`
   * n'installe pas. Vert en local, rouge en CI (05/10/2026).
   *
   * Les trois valeurs sont celles sur lesquelles le site, le Worker et Expo s'accordent déjà.
   */
  esbuild: {
    tsconfigRaw: '{"compilerOptions":{"jsx":"react-jsx","target":"ES2022","useDefineForClassFields":true}}',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
