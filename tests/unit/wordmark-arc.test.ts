import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { Wordmark } from '../../src/design-system/react/brand/Wordmark';

/**
 * L'ARC DU MOT-SYMBOLE (AD-23) — ce qui le casse SANS RIEN CASSER D'AUTRE.
 *
 * Le remplissage est reçu par `a:hover > .mm-arc` : le sélecteur exige l'enfant DIRECT du
 * lien, et il est éteint par n'importe quel `color` en ligne, parce qu'un style en ligne bat
 * la primitive. Les deux régressions rendent une page parfaitement valide — typecheck vert,
 * build verte, six règles vertes, aucun avertissement — avec un mot-symbole qui ne s'allume
 * simplement plus. C'est ce qui vaut à AD-23 sa propre porte : personne ne survole un pied de
 * page en revue.
 */

const CSS = readFileSync(new URL('../../src/design-system/css/overrides/ad-23-arc.css', import.meta.url), 'utf8');

describe('le mot-symbole en cible', () => {
  it("l'enfant direct du lien porte la primitive, et rien d'autre", () => {
    // La structure EXACTE du pied de page : <LocalizedLink> rend un <a>, le mot-symbole en est
    // le seul enfant. Un conteneur de mise en page glissé entre les deux tuerait le survol.
    const html = renderToStaticMarkup(
      h('a', { href: '/', className: 'inline-block mb-5' }, h(Wordmark, { brand: 'signature', size: 26, arc: true })),
    );

    expect(html).toMatch(/<a[^>]*>\s*<span class="mm-arc mm-signature"/);
    expect(html).toContain('Max-Morrys');
  });

  it("l'arc ne peint AUCUNE couleur en ligne — un style en ligne battrait la primitive", () => {
    for (const props of [
      { brand: 'signature' as const, arc: true },
      { brand: 'hello' as const },
    ]) {
      const html = renderToStaticMarkup(h(Wordmark, props));
      expect(html).toContain('mm-arc');
      // On vise le style de l'élément QUI PORTE `.mm-arc`, pas « un `color:` quelque part » :
      // ce dernier laisserait passer une couleur posée en première propriété.
      const arc = html.match(/<span class="[^"]*mm-arc[^"]*"[^>]*>/)?.[0] ?? '';
      expect(arc).not.toMatch(/style="[^"]*color:/);
      // `-webkit-text-fill-color:transparent` est hérité : un enfant peint serait invisible.
      expect(html).not.toMatch(/<span[^>]*><span/);
    }
  });

  it('sans `arc`, la signature garde ses couleurs par lettre — console et certificat', () => {
    const html = renderToStaticMarkup(h(Wordmark, { brand: 'signature', size: 26 }));
    expect(html).not.toContain('mm-arc');
    expect(html).toContain('--mm-bleu');
    expect(html).toContain('Morrys');
  });

  it('`short` coupe au prénom des deux côtés, avec et sans arc', () => {
    expect(renderToStaticMarkup(h(Wordmark, { brand: 'signature', short: true, arc: true }))).toContain('>Max<');
    expect(renderToStaticMarkup(h(Wordmark, { brand: 'signature', short: true }))).not.toContain('Morrys');
  });

  it('les deux aplats de repos existent, et ils DIFFÈRENT', () => {
    // `.mm-hello` en `--ink-2` (une commande de barre parmi douze), `.mm-signature` en `--ink`
    // (la seule marque du pied de page, au-dessus d'un chapô déjà en `--ink-2`). Les aligner
    // ferait disparaître la hiérarchie du pied de page sans qu'aucune porte ne le voie.
    expect(CSS).toMatch(/\.mm-hello\{\s*color:var\(--ink-2\)/);
    expect(CSS).toMatch(/\.mm-signature\{\s*color:var\(--ink\)/);
  });

  it('le survol du LIEN et le focus clavier portent tous deux le remplissage', () => {
    expect(CSS).toContain('a:hover > .mm-arc');
    expect(CSS).toContain('a:focus-visible > .mm-arc');
  });
});
