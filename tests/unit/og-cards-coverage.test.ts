import { existsSync } from 'fs';
import { describe, expect, it } from 'vitest';

import { staticPages } from '../../worker/apps/site/src/prerender/static-pages';

/**
 * CHAQUE PAGE QUI ANNONCE UNE CARTE DOIT AVOIR SON FICHIER.
 *
 * Le pré-rendu écrit `og:image` en dérivant l'adresse du chemin de la page ; les fichiers,
 * eux, sont rendus au build par `npm run og:cards`. Rien dans le code ne relie les deux : on
 * peut parfaitement ajouter une page à `static-pages.ts` et oublier de régénérer.
 *
 * Ce que ça coûterait est atténué mais pas nul. La réécriture `/og/** → /og/_fallback.png`
 * empêche le 404, donc le lien garde une vignette — mais c'est la vignette GÉNÉRIQUE, celle
 * qu'on vient précisément de supprimer. Le défaut réapparaîtrait page par page, sans erreur
 * nulle part et sans que personne ne le remarque avant de partager le lien.
 *
 * ⚠️ Les questions de la FAQ ne sont pas vérifiables ici : elles viennent de Firestore, et un
 * test unitaire ne doit pas dépendre du réseau. `npm run og:check` les couvre, lui.
 */

/** L'adresse du fichier attendu, miroir de `ogImageUrl` sans le domaine ni l'empreinte. */
function cardFile(path: string): string {
  return path === '/' ? 'public/og.png' : `public/og${path}.png`;
}

describe('couverture des cartes d’aperçu', () => {
  const paths = Object.keys(staticPages);

  it('il y a bien des pages statiques à couvrir', () => {
    // Garde-fou du test lui-même : un import cassé rendrait tout le reste vert pour rien.
    expect(paths.length).toBeGreaterThan(10);
  });

  it.each(paths)('%s a sa carte', (path) => {
    const file = cardFile(path);
    expect(existsSync(file), `${file} manque — lancer \`npm run og:cards\``).toBe(true);
  });

  it('la carte de repli existe', () => {
    // C'est elle que sert la réécriture d'hébergement quand une carte manque. Sans le
    // fichier, la réécriture pointe dans le vide et le 404 revient.
    expect(existsSync('public/og/_fallback.png')).toBe(true);
  });
});
