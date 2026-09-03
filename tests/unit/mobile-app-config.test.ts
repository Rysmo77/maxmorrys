import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * `app.json` ET `eas.json` — LE SEUL ENDROIT DE `mobile/` QUE RIEN NE REGARDAIT.
 *
 * `mobile-ds.test.ts` interdit les couleurs hors système, mais il ne balaie que les
 * `.ts`/`.tsx`. `app.json` est donc le fichier par lequel une valeur hors système
 * entre sans être vue — et une y était déjà entrée : `#FBFCFE` en fond d'icône
 * adaptative, qui n'existe dans aucun jeu de jetons.
 *
 * Les autres portes attrapent des défauts qui ne se voient qu'au JOUR DE LA
 * SOUMISSION, c'est-à-dire trop tard :
 *   · un canal alpha dans l'icône → App Store Connect refuse le téléversement ;
 *   · un greffon `expo-*` déclaré sans son paquet → `prebuild` échoue (le README du
 *     port documente ce piège, et rien ne le gardait) ;
 *   · une chaîne d'usage `NS…UsageDescription` orpheline → une question en revue à
 *     laquelle il n'y a pas de bonne réponse ;
 *   · un profil `production` qui porterait le drapeau du contenu de démonstration.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const MOBILE = join(RACINE, 'mobile');

const app = JSON.parse(readFileSync(join(MOBILE, 'app.json'), 'utf8')).expo;
const eas = JSON.parse(readFileSync(join(MOBILE, 'eas.json'), 'utf8'));
const paquet = JSON.parse(readFileSync(join(MOBILE, 'package.json'), 'utf8'));

/** Toutes les couleurs des deux jeux de jetons, en minuscules. */
function jetons(): Set<string> {
  const source = readFileSync(join(MOBILE, 'ds/tokens.generated.ts'), 'utf8');
  return new Set([...source.matchAll(/"(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toLowerCase()));
}

describe('la configuration native', () => {
  it("l'identité est la même des deux côtés, et la version n'est plus une bêta", () => {
    expect(app.ios.bundleIdentifier).toBe(app.android.package);
    // `0.x` est accepté par les magasins mais se lit comme une préversion en fiche,
    // et `runtimeVersion: appVersion` démarrerait sur une valeur qu'on veut abandonner.
    expect(app.version).toMatch(/^[1-9]\d*\.\d+\.\d+$/);
    expect(app.ios.infoPlist.ITSAppUsesNonExemptEncryption).toBe(false);
  });

  it('toute couleur de `app.json` est un jeton du système', () => {
    const connus = jetons();
    const trouvees = [...JSON.stringify(app).matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toLowerCase());
    expect(trouvees.length, 'aucune couleur lue — le test ne vérifie plus rien').toBeGreaterThan(0);
    expect([...new Set(trouvees.filter((c) => !connus.has(c)))]).toEqual([]);
  });

  it('tout greffon `expo-*` déclaré a son paquet installé', () => {
    // Le piège exact que le README du port documente : déclarer le greffon sans le
    // paquet fait échouer `prebuild`, et rien ne le gardait.
    const noms = (app.plugins ?? []).map((p: unknown) => (Array.isArray(p) ? p[0] : p));
    const manquants = noms.filter((n: string) => n.startsWith('expo-') && !paquet.dependencies[n]);
    expect(manquants).toEqual([]);
  });

  it("aucune chaîne d'usage ne décrit une capacité absente", () => {
    /*
     * Une `NS…UsageDescription` sans le module correspondant est une question en revue :
     * « pourquoi demandez-vous la caméra ? » — et il n'y a pas de bonne réponse quand
     * rien ne l'utilise.
     */
    const modules: Record<string, string> = {
      NSCameraUsageDescription: 'expo-camera',
      NSMicrophoneUsageDescription: 'expo-av',
      NSPhotoLibraryUsageDescription: 'expo-image-picker',
      NSFaceIDUsageDescription: 'expo-local-authentication',
      NSCalendarsUsageDescription: 'expo-calendar',
      NSUserTrackingUsageDescription: 'expo-tracking-transparency',
    };
    const orphelines = Object.keys(app.ios.infoPlist)
      .filter((cle) => cle in modules && !paquet.dependencies[modules[cle]]);
    expect(orphelines).toEqual([]);
  });

  it('les permissions Android sont explicites et justifiées', () => {
    // Une liste ABSENTE laisse prebuild émettre le jeu par défaut d'Expo sans filtre.
    expect(Array.isArray(app.android.permissions), '`android.permissions` doit être déclaré').toBe(true);
    if (app.android.permissions.includes('POST_NOTIFICATIONS')) {
      expect(paquet.dependencies['expo-notifications']).toBeDefined();
    }
  });

  it('les actifs existent, et aux bonnes dimensions', async () => {
    const attendus: Array<[string, number]> = [
      [app.icon, 1024],
      [app.android.adaptiveIcon.foregroundImage, 1024],
    ];
    for (const [chemin, cote] of attendus) {
      const fichier = join(MOBILE, chemin);
      expect(existsSync(fichier), `${chemin} est déclaré mais absent`).toBe(true);
      const { width, height } = await sharp(fichier).metadata();
      expect(width, `${chemin} : largeur`).toBe(cote);
      expect(height, `${chemin} : hauteur`).toBe(cote);
    }
  });

  it("l'icône n'a aucun pixel translucide", async () => {
    /*
     * App Store Connect REFUSE une icône avec canal alpha, et le refus arrive au
     * téléversement — après le build, après la file d'attente. C'est le genre de défaut
     * qui coûte une demi-journée pour une raison qu'on ne pouvait pas voir avant.
     */
    const { data, info } = await sharp(join(MOBILE, app.icon))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let translucides = 0;
    for (let i = 3; i < data.length; i += info.channels) if (data[i] < 255) translucides++;
    expect(translucides, `${translucides} pixels non opaques dans l'icône`).toBe(0);
  });

  it('le profil `production` ne porte aucune variable', () => {
    // Strictement plus fort que « le drapeau est indéfini » : la clé elle-même est absente.
    expect(eas.build.production.env).toBeUndefined();
  });

  it("un profil permet toujours de tenir l'application dans la main", () => {
    /*
     * `preview` est `simulator: true` : il ne s'installe sur AUCUN iPhone. Sans un second
     * profil, il n'existe aucun moyen d'essayer l'application sur un vrai appareil avant
     * TestFlight — et c'est là que se voient la moitié des défauts d'interface.
     */
    const surAppareil = Object.values(eas.build as Record<string, { ios?: { simulator?: boolean } }>)
      .filter((p) => p.ios?.simulator === false);
    expect(surAppareil.length).toBeGreaterThan(0);
  });

  it('le bloc de soumission existe pour les deux magasins', () => {
    /*
     * Les VALEURS restent à remplir — elles n'existent pas tant que les comptes
     * développeur ne sont pas ouverts, et `eas submit` refusera de partir sans elles.
     * Ce que cette porte tient, c'est que le bloc ne DISPARAISSE pas : un `submit`
     * vide, comme il l'était, ne se remarque que le jour où l'on veut soumettre.
     */
    expect(eas.submit.production.ios).toHaveProperty('ascAppId');
    expect(eas.submit.production.ios).toHaveProperty('appleTeamId');
    expect(['internal', 'alpha', 'beta', 'production'])
      .toContain(eas.submit.production.android.track);
    // Aucune clé de compte de service sur disque : elles vivent chez EAS.
    expect(eas.submit.production.android.serviceAccountKeyPath).toBeUndefined();
  });
});
