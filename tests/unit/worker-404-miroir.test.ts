import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import { APP_FIRST_SEGMENTS } from '../../worker/apps/site/src/routes';

/**
 * LE 404 DU WORKER `site` NE DOIT JAMAIS ATTEINDRE UNE VRAIE PAGE (audit 03/11/2026, n°13).
 *
 * Le Worker répond 404 à toute page dont le premier segment logique n'est pas dans
 * `APP_FIRST_SEGMENTS` — une copie à la main des branches de `appChildren()` dans
 * `src/App.tsx`. Ajouter une route sans l'y déclarer servirait la page aux humains (le
 * corps reste le shell SPA) mais la ferait disparaître des moteurs, sans aucun signe.
 */
describe('miroir des premiers segments de routes — App.tsx ↔ Worker site', () => {
  it('chaque branche de premier niveau du routeur est déclarée au Worker', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const debut = app.indexOf('function appChildren()');
    expect(debut).toBeGreaterThan(-1);
    const corps = app.slice(debut);
    // Les routes ENFANTS de `mon-espace` et `admin` sont montées sous une branche déjà
    // déclarée : on retire leurs blocs du texte (par position, pas par nom — `formations`
    // est à la fois une page publique et un onglet admin).
    let texte = corps;
    for (const parent of ['mon-espace', 'admin']) {
      const i = texte.indexOf(`path: '${parent}'`);
      expect(i, parent).toBeGreaterThan(-1);
      const debutEnfants = texte.indexOf('children:', i);
      const finEnfants = texte.indexOf('\n      ],', debutEnfants) > -1 && parent === 'admin'
        ? texte.indexOf('\n      ],', debutEnfants)
        : texte.indexOf('\n          ],', debutEnfants);
      expect(finEnfants, parent).toBeGreaterThan(debutEnfants);
      texte = texte.slice(0, debutEnfants) + texte.slice(finEnfants);
    }
    const premiers = new Set<string>();
    for (const m of texte.matchAll(/path:\s*['`]([^'`]+)['`]/g)) {
      const chemin = m[1];
      if (chemin === '*' || chemin.startsWith('/')) continue;
      premiers.add(chemin.split('/')[0]);
    }
    expect(premiers.has('contact')).toBe(true);
    const manquants = [...premiers].filter((s) => !APP_FIRST_SEGMENTS.has(s));
    expect(manquants).toEqual([]);
  });
});
