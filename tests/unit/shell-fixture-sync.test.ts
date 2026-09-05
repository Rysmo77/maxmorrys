import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * LA FIXTURE DU REWRITER EST UNE COPIE DE `index.html`, ET RIEN NE LE VÉRIFIAIT.
 *
 * `worker/apps/site/test/fixtures/shell.html` sert à prouver que le pré-rendu conserve
 * ce qu'il doit conserver — au premier rang, les balises de vérification Search Console
 * et Meta, dont la perte coûterait les deux propriétés d'un coup.
 *
 * Sa seule garde était un commentaire : « À resynchroniser si le shell change. » Elle
 * avait dérivé de sept balises — `og:title`, `og:description`, `twitter:title`,
 * `twitter:description`, les deux dimensions de l'image de partage et `theme-color`. Le
 * test du rewriter passait donc au vert contre un shell qui n'existait plus.
 *
 * C'est le défaut le plus discret de la famille : une garde qui protège une CHOSE PÉRIMÉE
 * ne signale rien, et donne en prime la certitude d'être protégé.
 */

const root = join(__dirname, '..', '..');

describe('la fixture du rewriter suit le shell', () => {
  it('est identique à index.html, octet pour octet', () => {
    const shell = readFileSync(join(root, 'index.html'), 'utf8');
    const fixture = readFileSync(
      join(root, 'worker/apps/site/test/fixtures/shell.html'),
      'utf8',
    );

    expect(
      fixture,
      'la fixture a dérivé — `cp index.html worker/apps/site/test/fixtures/shell.html`',
    ).toBe(shell);
  });
});
