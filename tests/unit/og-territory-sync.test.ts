import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import { ogTerritory } from '../../worker/apps/site/src/prerender/og-url';

/**
 * LA CARTE ET L'ONGLET DOIVENT DÉSIGNER LE MÊME TERRITOIRE.
 *
 * Les quatre teintes du système portent chacune un verbe de la marque — `colors.css` les
 * annote une par une. Deux endroits décident laquelle s'applique à une route :
 *
 *   · `SITE_NAV` et `TRANSFORME_PATHS` (`src/components/layout/Header.tsx`), qui allument
 *     l'onglet dans la barre haute ;
 *   · `TERRITORIES` (`worker/apps/site/src/prerender/og-url.ts`), qui colore la carte
 *     d'aperçu — le Worker ne peut pas importer le code de l'application.
 *
 * Si les deux divergent, la fiche d'un épisode s'annonce violette dans la barre et bleue au
 * partage. Rien ne casse, aucun test ne rougit, et le défaut n'est visible que par quelqu'un
 * qui regarde les deux surfaces en même temps — c'est-à-dire personne.
 */

const HEADER = 'src/components/layout/Header.tsx';

/** Les entrées `{ path: '…', territory: '…' }` de `SITE_NAV`. */
function navTerritories(): Array<[string, string]> {
  const source = readFileSync(HEADER, 'utf8');
  const nav = source.match(/const SITE_NAV: NavEntry\[\] = \[([\s\S]*?)\n\];/);
  if (!nav) throw new Error(`SITE_NAV introuvable dans ${HEADER}`);
  return [...nav[1].matchAll(/path: '([^']+)',\s*territory: '([^']+)'/g)].map((m) => [m[1], m[2]]);
}

/** Les routes que la barre range sous « Je te transforme ». */
function transformePaths(): string[] {
  const source = readFileSync(HEADER, 'utf8');
  const list = source.match(/const TRANSFORME_PATHS = \[([\s\S]*?)\];/);
  if (!list) throw new Error(`TRANSFORME_PATHS introuvable dans ${HEADER}`);
  return [...list[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('le territoire d’une carte suit celui de la navigation', () => {
  const nav = navTerritories();

  it('la barre déclare bien ses quatre territoires', () => {
    // Garde-fou du test : une expression rationnelle qui ne matche plus rendrait tout vert.
    expect(nav.length).toBe(4);
  });

  it.each(nav)('%s est en territoire « %s » des deux côtés', (path, territory) => {
    expect(ogTerritory(path)).toBe(territory);
  });

  const transforme = transformePaths();

  it('les routes de « Je te transforme » sont bien listées', () => {
    expect(transforme.length).toBeGreaterThan(2);
  });

  it.each(transforme)('%s est en « transforme » des deux côtés', (path) => {
    expect(ogTerritory(path)).toBe('transforme');
    // Et sur une fiche de cette famille, pas seulement sur son index.
    expect(ogTerritory(`${path}/une-fiche`)).toBe('transforme');
  });

  it('une route hors navigation ne prend aucune teinte de territoire', () => {
    // Les pages de service — contact, mentions, FAQ — n'appartiennent à aucun verbe.
    for (const path of ['/contact', '/legal/cgv', '/faq', '/verifier']) {
      expect(ogTerritory(path), path).toBe('neutre');
    }
  });
});
