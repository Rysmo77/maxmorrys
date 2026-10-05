#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * UN BINAIRE DE MAGASIN NE PART PAS SANS SES CLÉS FIREBASE.
 *
 * Crochet EAS `eas-build-pre-install` (voir `package.json`). Sans les six clés,
 * l'application se CONSTRUIT, s'installe, et ne peut rien lire : `donnees/config.ts` nomme
 * la panne à l'écran — le bon comportement sur un téléphone, et exactement le mauvais avant
 * une soumission. La CI ne peut pas tenir cette porte : son `expo export` tourne délibérément
 * sans aucune variable. C'est donc le build EAS lui-même qui refuse, avant de rien installer.
 *
 * Les profils de développement et d'aperçu passent : ils servent justement à voir l'écran
 * de panne, et un développeur sans `.env` doit pouvoir construire.
 *
 * ⚠️ La liste doit rester celle de `donnees/config.ts` — `tests/unit/mobile-app-config.test.ts`
 * compare les deux.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export const CLES = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

export const PROFILS_DE_MAGASIN = ['production', 'release-candidate'];

export function manquantes(env) {
  if (!PROFILS_DE_MAGASIN.includes(env.EAS_BUILD_PROFILE ?? '')) return [];
  return CLES.filter((k) => !(env[k] ?? '').trim());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const absentes = manquantes(process.env);
  if (absentes.length) {
    console.error(`⛔ Profil « ${process.env.EAS_BUILD_PROFILE} » : clés Firebase absentes — ${absentes.join(', ')}.`);
    console.error('   Les déclarer comme variables d’environnement EAS du projet (voir mobile/.env.example).');
    process.exit(1);
  }
  const profil = process.env.EAS_BUILD_PROFILE ?? 'local';
  console.log(PROFILS_DE_MAGASIN.includes(profil)
    ? `✅ clés Firebase présentes (profil ${profil}).`
    : `ⓘ clés Firebase non exigées pour le profil ${profil} — un binaire de magasin les exigera.`);
}
