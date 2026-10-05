import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE VERROU BIOMÉTRIQUE FAIT CE QU'IL ANNONCE.
 *
 * Le défaut d'origine n'était pas un bouton MORT — la porte existante
 * (`mobile-controles-morts.test.ts`) ne pouvait donc pas le voir. « Activer Face ID »
 * portait bien un `onPress`, et cet `onPress` appelait `router.replace('/(tabs)')` :
 * il naviguait au lieu d'activer. Rien n'était enregistré, aucun verrou n'existait,
 * et l'interrupteur du profil s'affichait ALLUMÉ sur un `useState(true)`.
 *
 * C'est la forme d'erreur la plus coûteuse, parce qu'elle rassure : quelqu'un croyait
 * avoir posé un verrou et n'en avait aucun. Le typecheck était vert, l'écran était
 * juste, les textes étaient honnêtes — seul le geste manquait.
 *
 * ── CE QUE CES PORTES TIENNENT ────────────────────────────────────────────────
 *   1 · le bouton d'activation appelle l'ACTIVATION, et le geste système est branché ;
 *   2 · la racine attend le verrou AVANT de rendre le contenu ;
 *   3 · l'écran verrouillé porte une déconnexion — sinon un capteur cassé ferme le
 *       compte depuis ce téléphone, et la seule issue est de désinstaller ;
 *   4 · le matériel est interrogé avant qu'on propose quoi que ce soit ;
 *   5 · la chaîne d'usage iOS et les paquets sont là, ensemble.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const MOBILE = join(RACINE, 'mobile');

/** Le code servi, commentaires retirés : une intention citée n'est pas une preuve. */
function code(chemin: string): string {
  return readFileSync(join(MOBILE, chemin), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const app = JSON.parse(readFileSync(join(MOBILE, 'app.json'), 'utf8')).expo;
const paquet = JSON.parse(readFileSync(join(MOBILE, 'package.json'), 'utf8'));

describe('le verrou biométrique — les paquets et la chaîne d’usage', () => {
  it('les deux paquets sont installés', () => {
    /*
     * `expo-local-authentication` porte le geste ; `expo-secure-store` porte le drapeau.
     * Sans le second, le choix vivrait en mémoire et disparaîtrait au premier
     * redémarrage — c'est-à-dire exactement au moment où le verrou doit agir.
     */
    expect(paquet.dependencies['expo-local-authentication']).toBeDefined();
    expect(paquet.dependencies['expo-secure-store']).toBeDefined();
  });

  it("la chaîne d'usage Face ID est écrite, et elle explique", () => {
    /*
     * Apple la LIT en revue. Une phrase générique (« pour l'authentification ») est un
     * motif de retour ; celle-ci doit dire à quoi sert le geste ET ce qu'il ne fait pas.
     */
    const chaine = app.ios.infoPlist.NSFaceIDUsageDescription;
    expect(typeof chaine, 'NSFaceIDUsageDescription manque').toBe('string');
    expect(chaine.length).toBeGreaterThan(40);
  });

  it('les greffons sont déclarés', () => {
    const noms = (app.plugins ?? []).map((p: unknown) => (Array.isArray(p) ? p[0] : p));
    expect(noms).toContain('expo-local-authentication');
    expect(noms).toContain('expo-secure-store');
  });
});

describe('le verrou biométrique — le module', () => {
  const verrou = code('donnees/verrou.ts');

  it('le matériel est interrogé avant toute proposition', () => {
    /*
     * Les deux questions, pas une : un appareil PEUT avoir le capteur sans qu'aucune
     * empreinte n'y soit enregistrée. Proposer un verrou impossible à poser est un
     * réglage qui ment, et c'est le reproche que l'écran adresse lui-même aux autres.
     */
    expect(verrou).toMatch(/hasHardwareAsync\(\)/);
    expect(verrou).toMatch(/isEnrolledAsync\(\)/);
  });

  it('le geste système est réellement demandé', () => {
    expect(verrou).toMatch(/authenticateAsync\(/);
  });

  it('le drapeau vit dans le coffre, pas dans AsyncStorage', () => {
    /*
     * `firebase.ts` explique pourquoi la SESSION n'est pas dans SecureStore — le blob
     * dépasse la limite Android. Le drapeau, lui, tient en un octet, et c'est sa place.
     * Le mélange inverse (le drapeau dans AsyncStorage) le rendrait effaçable par
     * n'importe quel vidage de cache, donc silencieusement absent.
     */
    expect(verrou).toMatch(/from 'expo-secure-store'/);
    expect(verrou).not.toMatch(/async-storage/);
  });

  it("le verrou ne s'écrit QU'APRÈS un geste réussi", () => {
    /*
     * L'ordre inverse — écrire le drapeau puis demander — poserait un verrou au nom de
     * quelqu'un qui n'a jamais réussi à le franchir. C'est la façon exacte de
     * s'enfermer dehors.
     */
    const pose = /export async function poserVerrou[\s\S]*?\n}/.exec(verrou)?.[0] ?? '';
    expect(pose, 'poserVerrou introuvable').not.toBe('');
    const iVerdict = pose.indexOf('inviter(');
    const iEcriture = pose.indexOf('setItemAsync');
    expect(iVerdict).toBeGreaterThan(-1);
    expect(iEcriture).toBeGreaterThan(iVerdict);
  });

  it("le repli du système n'est jamais coupé", () => {
    /*
     * `disableDeviceFallback: true` retirerait le code du téléphone de l'invite. C'est
     * la dernière porte de sortie d'un capteur sale : la couper, c'est enfermer.
     */
    expect(verrou).not.toMatch(/disableDeviceFallback:\s*true/);
  });
});

describe('le verrou biométrique — l’écran qui le propose', () => {
  const ecran = code('app/biometrie.tsx');

  it("le bouton d'activation appelle l'activation, pas la navigation", () => {
    /*
     * LE DÉFAUT D'ORIGINE, à la lettre : `onPress={() => router.replace('/(tabs)')}` sur
     * un bouton libellé « Activer Face ID ». Il agissait — mais pas comme il l'annonçait.
     */
    expect(ecran).toMatch(/from '\.\.\/donnees\/verrou'/);
    const bouton = /<Button[^>]*label=\{isIOS \? 'Activer[\s\S]*?\/>/.exec(ecran)?.[0] ?? '';
    expect(bouton, "le bouton « Activer » est introuvable").not.toBe('');
    expect(bouton, "le bouton « Activer » navigue au lieu d'activer")
      .not.toMatch(/router\.(replace|push)/);
    expect(bouton).toMatch(/onPress=/);
  });

  it("l'écran ne propose rien quand l'appareil ne peut pas, et dit pourquoi", () => {
    // La capacité est LUE et elle commande le rendu : sans branche, l'écran proposerait
    // encore d'activer un verrou que le téléphone ne sait pas poser.
    expect(ecran).toMatch(/capacite/);
    expect(ecran).toMatch(/capacite\.motif/);
  });
});

describe('le verrou biométrique — la racine attend', () => {
  const racine = code('app/_layout.tsx');

  it('la porte est posée avant le contenu', () => {
    /*
     * Un verrou qui s'affiche APRÈS le contenu n'a rien protégé : on aurait vu la liste
     * des cours et le nom du compte avant que l'invite ne s'ouvre.
     */
    expect(racine).toMatch(/useVerrouDeDemarrage\(\)/);
    const iPorte = racine.indexOf('<Porte>');
    const iStack = racine.indexOf('<Stack');
    expect(iPorte, '<Porte> manque à la racine').toBeGreaterThan(-1);
    expect(iStack, '<Stack> manque à la racine').toBeGreaterThan(-1);
    expect(iPorte, '<Stack> doit être RENDU PAR la porte, pas à côté').toBeLessThan(iStack);
    // Et la porte retient vraiment : elle rend autre chose que ses enfants tant qu'elle
    // n'a pas tranché.
    expect(racine).toMatch(/etat === 'attente'\s*\)\s*return null;/);
    expect(racine).toMatch(/etat === 'verrouille'\s*\)\s*return <EcranVerrouille/);
  });

  it("l'écran verrouillé porte une sortie vers la déconnexion", () => {
    /*
     * Sans elle, un capteur cassé rend le compte inaccessible depuis ce téléphone, et la
     * seule issue est de désinstaller l'application. C'est une exigence, pas un confort.
     */
    const bloc = /function EcranVerrouille[\s\S]*$/.exec(racine)?.[0] ?? '';
    expect(bloc, 'EcranVerrouille introuvable').not.toBe('');
    expect(bloc).toMatch(/label="Me déconnecter"/);
    expect(bloc).toMatch(/deconnexion\(\)/);
    /* Et elle RETIRE le drapeau : sinon on se déconnecte, on se reconnecte, et on
       retombe sur le même mur au prochain démarrage — une boucle sans issue, puisque le
       profil n'est jamais atteint. */
    expect(bloc).toMatch(/retirerVerrou\(\)/);
    // Une nouvelle tentative reste possible : un refus n'est pas un verdict définitif.
    expect(bloc).toMatch(/reessayer/);
  });
});

describe('le verrou biométrique — le profil dit la vérité', () => {
  const profil = code('app/(tabs)/profil.tsx');

  it("l'interrupteur reflète l'état réel, il ne l'invente pas", () => {
    /*
     * `const [bio, setBio] = useState(true)` affichait le verrou ALLUMÉ au premier rendu,
     * pour un réglage que rien ne posait et que rien ne lisait.
     */
    expect(profil).not.toMatch(/useState\(true\)[\s\S]{0,40}bio/);
    expect(profil).not.toMatch(/const \[bio,/);
    expect(profil).toMatch(/from '\.\.\/\.\.\/donnees\/verrou'/);
    expect(profil).toMatch(/verrou\.actif/);
  });

  it("l'écran promet « désactivable dans ton profil » — et le profil le permet", () => {
    expect(profil).toMatch(/desactiver\(\)/);
  });
});
