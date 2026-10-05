import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ATELIER NE SORT PAS — la planche et la console d'administration.
 *
 * Deux surfaces partaient en production sans aucune garde :
 *
 *   · `/apercu` — la planche de référence, qui liste TOUS les écrans, systèmes et
 *     états compris. Elle était liée depuis l'onglet Profil, en clair.
 *   · `/console` — six écrans d'administration. `console/_layout.tsx` retournait un
 *     `<Stack>` nu. Le profil affirmait pourtant, en commentaire, que « le garde de
 *     route la cache ». Il n'existait pas.
 *
 * Un relecteur qui ouvre une console de support vide y lit une application inachevée
 * (2.1 / 4.2), ou une zone interne laissée ouverte (5.1.1).
 *
 * ── POURQUOI LE DRAPEAU DOIT ÊTRE LITTÉRAL DANS CHAQUE MODULE ─────────────────
 * Metro ne replie une branche morte QUE là où la condition est littérale. Un
 * `ATELIER` importé d'un module commun laisserait le contenu gardé embarqué dans le
 * paquet de production — inatteignable, mais présent. C'est exactement ce qui a été
 * mesuré sur `DEMO` : 3 octets d'écart entre les paquets tant que la condition était
 * importée, 3,4 Ko une fois rapatriée. La porte ci-dessous exige donc la duplication.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const APP = join(RACINE, 'mobile/app');
const lire = (p: string) => readFileSync(join(APP, p), 'utf8');

/** Les trois modules qui portent le drapeau : les deux gardés, et leur point d'entrée. */
const PORTEURS = ['apercu.tsx', 'console/_layout.tsx', '(tabs)/profil.tsx'];

describe("l'atelier reste hors de la production", () => {
  it('les trois modules déclarent le drapeau, littéralement', () => {
    for (const module of PORTEURS) {
      const code = lire(module);
      expect(code, `${module} ne déclare pas ATELIER`).toMatch(/const ATELIER = /);
      expect(code, `${module} : le drapeau n'est pas littéral`)
        .toMatch(/EXPO_PUBLIC_CONTENU_DEMO === '1'/);
      expect(code, `${module} : __DEV__ manque`).toContain('__DEV__');
      // La porte laissée ouverte, que la production devrait penser à refermer.
      expect(code, `${module} : le drapeau est forcé à vrai`).not.toMatch(/const ATELIER\s*=\s*true/);
      // Importé, il ne serait plus replié par le minifieur.
      expect(code, `${module} importe ATELIER au lieu de le déclarer`)
        .not.toMatch(/import \{[^}]*\bATELIER\b[^}]*\} from/);
    }
  });

  it('les deux surfaces gardées redirigent quand le drapeau est fermé', () => {
    for (const module of ['apercu.tsx', 'console/_layout.tsx']) {
      const code = lire(module);
      expect(code, `${module} ne redirige pas`).toMatch(/if \(!ATELIER\) return <Redirect/);
    }
  });

  it('le profil ne cite ces deux écrans que sous garde', () => {
    /*
     * La liste et la redirection sont DEUX portes distinctes, et il faut les deux :
     * retirer l'entrée du menu cache le chemin, elle ne le ferme pas — une URL directe
     * ou un lien profond y mène encore.
     */
    const profil = lire('(tabs)/profil.tsx');
    const garde = /\.\.\.\(ATELIER \? \[/;
    expect(profil, 'les entrées d’atelier ne sont pas dans un étalement gardé').toMatch(garde);

    const debut = profil.search(garde);
    const fin = profil.indexOf('] : []', debut);
    const bloc = profil.slice(debut, fin);
    for (const route of ['/console', '/apercu']) {
      expect(bloc, `${route} est cité hors de la garde`).toContain(route);
    }
  });
});
