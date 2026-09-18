import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import { REALISATIONS } from '../src/prerender/realisations';
import { buildSitemap } from '../src/seo/sitemap';

/**
 * LE SITEMAP ANNONCE CE QUE LE PRÉ-RENDU SERT — NI PLUS, NI MOINS.
 *
 * Relevé en production le 18/09/2026, le jour de la mise en ligne de la refonte en deux pistes :
 * les onze fiches `/conception/realisations/<slug>` étaient servies aux robots, chacune avec son
 * titre, sa description et son balisage — et **aucune n'était déclarée au sitemap**. Un
 * commentaire l'expliquait en affirmant qu'elles « vivent en base » et seraient poussées « quand
 * la collection existera ». Elles vivent dans `REALISATIONS`, la table que le pré-rendu lit.
 *
 * Ce test garde les deux sens de l'accord :
 *   · chaque fiche pré-rendue est annoncée, en français ET en anglais ;
 *   · aucune adresse redirigée n'est annoncée comme une page — Google la signale en « page avec
 *     redirection » et ne l'indexe jamais.
 */

/** Une base vide : le sitemap ne doit rien devoir à Firestore pour les pages que ce test garde. */
const vide = { query: vi.fn(async () => []) } as unknown as Firestore;

describe('sitemap — les fiches de réalisation sont annoncées', () => {
  it('la table n’est pas vide', () => {
    // Garde-fou : une table vide rendrait les assertions ci-dessous vraies sans rien vérifier.
    expect(REALISATIONS.length).toBeGreaterThan(5);
  });

  it.each(REALISATIONS.map((r) => r.slug))('%s est déclarée en français et en anglais', async (slug) => {
    const xml = await buildSitemap(vide);
    expect(xml).toContain(`<loc>https://maxmorrys.me/conception/realisations/${slug}</loc>`);
    expect(xml).toContain(`/en/design/work/${slug}`);
  });

  it('aucune adresse redirigée n’est présentée comme une page', async () => {
    const xml = await buildSitemap(vide);
    for (const redirigee of ['/agence', '/presence-digitale', '/podcasts', '/videos']) {
      expect(xml, redirigee).not.toContain(`<loc>https://maxmorrys.me${redirigee}</loc>`);
    }
  });
});
