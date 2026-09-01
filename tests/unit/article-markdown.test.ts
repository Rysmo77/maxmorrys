/**
 * LE CORPS D'UN ARTICLE DOIT SORTIR EN BALISES, PAS EN CARACTÈRES.
 *
 * Le convertisseur maison n'était couvert par aucun test, et il lui manquait la moitié
 * de ce que les auteurs écrivent : citations, blocs de code, titres au-delà de `###`,
 * retours à la ligne simples — et, le plus visible, une liste précédée de sa phrase
 * d'introduction. Le défaut ne se voyait nulle part ailleurs qu'à l'écran, sur un
 * article publié, sous la forme de tirets en clair au milieu d'un paragraphe.
 *
 * On teste `markdownToRawHtml` et non `markdownToHtml` : DOMPurify réclame un DOM, et
 * les suites tournent sous Node. L'assainissement est la couche d'après ; ce qui se
 * vérifie ici, c'est la CONVERSION.
 */
import { describe, it, expect } from 'vitest';
import { markdownToRawHtml } from '../../src/lib/markdown';

describe('conversion markdown du corps d’article', () => {
  /* LE DÉFAUT LE PLUS VISIBLE. `/^- /` était testé sur le BLOC entier : une liste
     introduite par une phrase — la façon dont on écrit — retombait dans le cas `<p>`
     et les tirets s'affichaient tels quels. */
  it('reconnaît une liste même précédée de sa phrase d’introduction', () => {
    const html = markdownToRawHtml('Voici les étapes :\n- Remplis les horaires\n- Ajoute cinq photos');
    expect(html).toBe(
      '<p>Voici les étapes :</p><ul><li>Remplis les horaires</li><li>Ajoute cinq photos</li></ul>',
    );
    expect(html).not.toContain('- Remplis');
  });

  it('rend une liste numérotée', () => {
    expect(markdownToRawHtml('1. un\n2. deux')).toBe('<ol><li>un</li><li>deux</li></ol>');
  });

  it('rend une citation, y compris sur plusieurs lignes', () => {
    const html = markdownToRawHtml('> Une adresse écrite de trois façons,\n> c’est trois commerces.');
    expect(html).toBe(
      '<blockquote><p>Une adresse écrite de trois façons,<br />c’est trois commerces.</p></blockquote>',
    );
  });

  /* Un retour à la ligne simple était AVALÉ : deux lignes voulues distinctes se
     collaient en une seule phrase. */
  it('garde le retour à la ligne simple', () => {
    expect(markdownToRawHtml('Ligne A\nLigne B')).toBe('<p>Ligne A<br />Ligne B</p>');
  });

  /* Le bloc clôturé doit sortir AVANT les remplacements en ligne : sinon un `**` cité
     dans un extrait de code devient du gras, et le code montré est faux. */
  it('protège le contenu d’un bloc de code des remplacements en ligne', () => {
    const html = markdownToRawHtml('```js\nconst a = **1**;\n```');
    expect(html).toBe('<pre><code class="language-js">const a = **1**;</code></pre>');
    expect(html).not.toContain('<strong>');
  });

  it('échappe le HTML à l’intérieur d’un bloc de code', () => {
    expect(markdownToRawHtml('```\n<div>x</div>\n```')).toBe('<pre><code>&lt;div&gt;x&lt;/div&gt;</code></pre>');
  });

  it('rend les titres jusqu’à h6, sans que `#` mange `###`', () => {
    expect(markdownToRawHtml('## Deux')).toBe('<h2>Deux</h2>');
    expect(markdownToRawHtml('### Trois')).toBe('<h3>Trois</h3>');
    expect(markdownToRawHtml('#### Quatre')).toBe('<h4>Quatre</h4>');
  });

  /* Un lien interne qui ouvre un nouvel onglet fait sortir la personne de la lecture
     pour l'emmener sur… le même site. `target` est réservé à l'extérieur. */
  it('n’ouvre un nouvel onglet que pour les liens externes', () => {
    expect(markdownToRawHtml('[ici](/blog)')).toBe('<p><a href="/blog">ici</a></p>');
    expect(markdownToRawHtml('[là](https://exemple.com)')).toContain('target="_blank"');
  });

  it('refuse un protocole dangereux', () => {
    expect(markdownToRawHtml('[x](javascript:alert(1))')).toContain('href="#"');
  });

  /* Le générateur n8n produit ces marqueurs et personne ne les convertissait : ils
     s'affichaient crochets compris dans les articles publiés. Ils sont déjà en base,
     donc corriger le prompt ne suffit pas. */
  it('convertit les marqueurs LIEN_INTERNE du générateur', () => {
    const html = markdownToRawHtml('[LIEN_INTERNE : la formation → /formations/seo]');
    expect(html).toBe('<p><a href="/formations/seo">la formation</a></p>');
    expect(html).not.toContain('LIEN_INTERNE');
  });

  /* Le même générateur ouvre son `content_html` par un `<h1>` qui redit le titre de la
     page : l'article l'affichait deux fois, et le document portait deux `<h1>`. */
  it('retire le titre de tête, qui redit celui de la page', () => {
    expect(markdownToRawHtml('# Le titre\n\nLe corps.')).toBe('<p>Le corps.</p>');
    expect(markdownToRawHtml('<h1>Le titre</h1><p>Le corps.</p>')).toBe('<p>Le corps.</p>');
  });

  it('laisse un h1 qui n’est PAS en tête — c’est un choix d’auteur', () => {
    expect(markdownToRawHtml('Intro.\n\n# Plus bas')).toBe('<p>Intro.</p>\n<h1>Plus bas</h1>');
  });

  it('laisse passer le HTML déjà écrit sans le repasser au convertisseur', () => {
    expect(markdownToRawHtml('<p>Déjà **écrit** en HTML.</p>')).toBe('<p>Déjà **écrit** en HTML.</p>');
  });

  it('rend une chaîne vide sans lever', () => {
    expect(markdownToRawHtml('')).toBe('');
  });
});
