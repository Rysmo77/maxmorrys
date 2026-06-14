import { defineConfig } from 'vitest/config';

// Test runner config. Firestore-rules tests run against the Firestore emulator
// (see `npm run test:rules`, which wraps this in `firebase emulators:exec`).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
