import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import { ogTerritory } from '../../worker/apps/site/src/prerender/og-url';

/**
 * LA CARTE ET L'ONGLET DOIVENT DÉSIGNER LE MÊME TERRITOIRE.
 *
 * Les quatre teintes du système portent chacune un verbe de la marque — `colors.css` les
 * annote une par une. Deux endroits décident laquelle s'applique à une route :
 *
 *   · les deux sous-navigations de piste (`src/components/navigation/PisteSubNav.tsx`), qui
 *     posent une pastille de territoire par entrée ;
 *   · `TERRITORIES` (`worker/apps/site/src/prerender/og-url.ts`), qui colore la carte
 *     d'aperçu — le Worker ne peut pas importer le code de l'application.
 *
 * Si les deux divergent, la fiche d'un épisode s'annonce violette dans la navigation et bleue
 * au partage. Rien ne casse, aucun test ne rougit, et le défaut n'est visible que par quelqu'un
 * qui regarde les deux surfaces en même temps — c'est-à-dire personne.
 *
 * ⚠️ CE TEST LISAIT `SITE_NAV` ET `TRANSFORME_PATHS` DANS LA BARRE HAUTE. La refonte en deux
 * pistes (CDC du 14/09/2026) a vidé la barre de ses territoires : ses quatre entrées sont des
 * PISTES — « Conception » vit hors des quatre verbes, « Apprendre » les contient tous les
 * quatre — et le type `Territory` interdit d'en inventer un. Les verbes sont descendus d'un
 * étage, dans les deux `SubNav` de piste : c'est là que vit désormais la correspondance
 * route ↔ territoire, et c'est donc là que ce test la lit.
 */

const SUBNAV = 'src/components/navigation/PisteSubNav.tsx';

/** Les entrées `path('/…'), territory: '…'` des deux sous-navigations de piste. */
function subNavTerritories(): Array<[string, string]> {
  const source = readFileSync(SUBNAV, 'utf8');
  const pairs = [...source.matchAll(/path\('([^']+)'\),\s*territory: '([^']+)'/g)];
  if (pairs.length === 0) throw new Error(`Aucune entrée à territoire dans ${SUBNAV}`);
  return pairs.map((m) => [m[1], m[2]]);
}

describe('le territoire d’une carte suit celui de la navigation de piste', () => {
  const nav = subNavTerritories();

  it('les deux pistes déclarent bien les quatre territoires', () => {
    // Garde-fou du test : une expression rationnelle qui ne matche plus rendrait tout vert.
    expect(new Set(nav.map(([, t]) => t))).toEqual(
      new Set(['forme', 'informe', 'transforme', 'digitalise']),
    );
  });

  it.each(nav)('%s est en territoire « %s » des deux côtés', (path, territory) => {
    expect(ogTerritory(path)).toBe(territory);
  });

  /**
   * Le territoire violet s'étend aux fiches, pas seulement aux index : une fiche d'épisode et
   * une page de vidéo partagent la teinte de leur territoire.
   */
  const TRANSFORME = ['/podcast-et-videos', '/podcasts', '/videos', '/club-des-digitos'];

  it.each(TRANSFORME)('%s est en « transforme » jusque dans ses fiches', (path) => {
    expect(ogTerritory(path)).toBe('transforme');
    expect(ogTerritory(`${path}/une-fiche`)).toBe('transforme');
  });

  /**
   * ⚠️ LA PISTE CONCEPTION N'EST PAS UN TERRITOIRE, SAUF SUR UNE PAGE.
   *
   * `/conception/commerces-et-tpe` EST « Je te digitalise » : c'est l'ancienne présence
   * digitale, elle garde son teal, sa grille publique et son ton direct (`universeFromPath`
   * le câble dans l'application). Les deux autres pages de la piste vivent hors des quatre
   * verbes — « autre promesse, autre client » — et leur carte doit rester neutre.
   *
   * C'est le seul endroit du dépôt où le territoire dépend du DEUXIÈME segment. Une table
   * qui ne lit que le premier donnerait le teal aux projets sur mesure, c'est-à-dire la
   * couleur d'une grille de prix à la page qui n'en affiche aucun.
   */
  it('la piste Conception ne prend le teal que sur son étage productisé', () => {
    expect(ogTerritory('/conception/commerces-et-tpe')).toBe('digitalise');
    expect(ogTerritory('/en/design/shops-and-small-business')).toBe('digitalise');
    for (const path of ['/conception', '/conception/projets-sur-mesure', '/conception/realisations']) {
      expect(ogTerritory(path), path).toBe('neutre');
    }
  });

  it('la piste Apprendre prend le bleu du verbe qui l’ouvre', () => {
    expect(ogTerritory('/apprendre')).toBe('forme');
    expect(ogTerritory('/en/learning')).toBe('forme');
  });

  it('une route hors navigation ne prend aucune teinte de territoire', () => {
    // Les pages de service — contact, mentions, FAQ — n'appartiennent à aucun verbe.
    for (const path of ['/contact', '/legal/cgv', '/faq', '/verifier']) {
      expect(ogTerritory(path), path).toBe('neutre');
    }
  });
});
