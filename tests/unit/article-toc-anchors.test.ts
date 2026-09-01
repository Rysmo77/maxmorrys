/**
 * L'ANCRE D'UN TITRE D'ARTICLE DOIT DÉSIGNER SA SECTION.
 *
 * Le sommaire d'article dérive une ancre du texte de chaque `<h2>` et de chaque `<h3>`. Le repli était posé sur
 * le GABARIT et non sur le RADICAL :
 *
 *     const base = `mm-h-${text…slice(0,48)}` || 'mm-h';
 *
 * Un gabarit de chaîne est TOUJOURS vrai — `` `mm-h-${''}` `` vaut « mm-h- » — donc le
 * `|| 'mm-h'` ne se déclenchait jamais. ESLint le voyait (`no-constant-binary-expression`),
 * et cette erreur faisait échouer l'étape « Lint » de la CI ; le défaut de rendu, lui, ne se
 * voyait sur aucune capture : il faut un titre sans caractère latin pour le déclencher.
 *
 * Ce que ça produisait : « ??? », « 你好 », « 2026 !! » donnaient tous l'ancre « mm-h- ». Le
 * dédoublonnage par compteur empêchait la collision dure, mais l'adresse ne disait plus rien
 * de la section — et un article traduit ou un titre écrit en caractères non latins est
 * exactement le cas d'usage d'une plateforme bilingue.
 *
 * Le test verrouille les trois comportements : l'ancre dérive du texte, elle se replie sur
 * un radical propre quand le texte ne donne rien, et deux titres identiques ne partagent
 * jamais la même ancre.
 */
import { describe, it, expect } from 'vitest';
import { withArticleToc } from '../../src/lib/markdown';

describe("ancres du sommaire d'article", () => {
  it("dérive l'ancre du texte du titre, accents translittérés", () => {
    const { html, headings } = withArticleToc('<h2>Référencement local à Dakar</h2>');
    expect(headings).toHaveLength(1);
    expect(headings[0].id).toBe('mm-h-referencement-local-a-dakar');
    expect(headings[0].text).toBe('Référencement local à Dakar');
    expect(html).toContain('id="mm-h-referencement-local-a-dakar"');
  });

  it('prend le TEXTE du titre, pas son balisage', () => {
    const { headings } = withArticleToc('<h2>Les <b>mots</b> que tapent tes clients</h2>');
    expect(headings[0].id).toBe('mm-h-les-mots-que-tapent-tes-clients');
    expect(headings[0].text).toBe('Les mots que tapent tes clients');
  });

  /* LE DÉFAUT CORRIGÉ. Sans radical, l'ancre était « mm-h- » — un tiret orphelin qui ne
     désigne rien. Le repli doit produire « mm-h », propre. */
  it("se replie sur « mm-h » quand le texte ne donne aucun radical latin", () => {
    const { headings } = withArticleToc('<h2>你好</h2>');
    expect(headings[0].id).toBe('mm-h');
    expect(headings[0].id).not.toMatch(/-$/);
  });

  it('ne laisse jamais une ancre se terminer par un tiret', () => {
    for (const titre of ['???', '2026 !!', '— — —', '   ']) {
      const { headings } = withArticleToc(`<h2>${titre}</h2>`);
      for (const h of headings) expect(h.id).not.toMatch(/-$/);
    }
  });

  /* Deux sections peuvent porter le même titre ; deux ancres identiques n'en font qu'une,
     et le second lien du sommaire renverrait au premier titre sans que rien ne le signale. */
  it('dédoublonne deux titres identiques', () => {
    const { headings } = withArticleToc('<h2>Mesurer</h2><h2>Mesurer</h2><h2>Mesurer</h2>');
    expect(headings.map((h) => h.id)).toEqual(['mm-h-mesurer', 'mm-h-mesurer-2', 'mm-h-mesurer-3']);
  });

  it('dédoublonne aussi les titres qui tombent tous sur le repli', () => {
    const { headings } = withArticleToc('<h2>???</h2><h2>你好</h2>');
    expect(new Set(headings.map((h) => h.id)).size).toBe(2);
  });

  it('laisse intact un titre vide plutôt que de lui inventer une ancre', () => {
    const { html, headings } = withArticleToc('<h2></h2>');
    expect(headings).toHaveLength(0);
    expect(html).toBe('<h2></h2>');
  });

  /*
   * LE NIVEAU 3 ÉTAIT IGNORÉ, ET C'EST CE QUI VIDAIT LE SOMMAIRE.
   *
   * La barre d'outils de l'éditeur propose H2 ET H3. Un article écrit en `###` ne
   * produisait aucune entrée, donc aucun panneau — le sommaire « ne fonctionnait pas »
   * parce qu'il n'existait pas. Et comme le corps d'article n'avait alors AUCUNE
   * typographie, rien à l'écran ne distinguait un h2 d'un h3 pour ramener l'auteur vers
   * le bon niveau : les deux défauts se cachaient l'un l'autre.
   */
  it('indexe aussi les h3, et dit leur niveau', () => {
    const { headings } = withArticleToc('<h2>La cause</h2><h3>Le détail</h3>');
    expect(headings.map((h) => [h.level, h.id])).toEqual([
      [2, 'mm-h-la-cause'],
      [3, 'mm-h-le-detail'],
    ]);
  });

  it('ferme chaque titre avec sa propre balise', () => {
    const { html } = withArticleToc('<h3>Le détail</h3>');
    expect(html).toBe('<h3 id="mm-h-le-detail" tabindex="-1">Le détail</h3>');
  });

  it('dédoublonne à travers les deux niveaux', () => {
    const { headings } = withArticleToc('<h2>Mesurer</h2><h3>Mesurer</h3>');
    expect(headings.map((h) => h.id)).toEqual(['mm-h-mesurer', 'mm-h-mesurer-2']);
  });

  /* Deux attributs `id` sur la même balise, et c'est l'analyseur du navigateur qui
     arbitre en silence lequel l'emporte — donc quelle ancre le sommaire désigne. */
  it('retire un id déjà posé plutôt que d’en écrire un second', () => {
    const { html } = withArticleToc('<h2 id="ancien" class="x">Mesurer</h2>');
    expect(html).toBe('<h2 id="mm-h-mesurer" tabindex="-1" class="x">Mesurer</h2>');
    expect(html.match(/\sid=/g)).toHaveLength(1);
  });

  /* Sans `tabindex`, suivre une ancre ne déplace pas le focus : la tabulation suivante
     repart du HAUT de la page, et on relit la barre de navigation à chaque section. */
  it('rend le titre focalisable, sans l’ajouter à l’ordre de tabulation', () => {
    const { html } = withArticleToc('<h2>Mesurer</h2>');
    expect(html).toContain('tabindex="-1"');
  });

  it('ne touche pas aux titres des autres niveaux', () => {
    const { html, headings } = withArticleToc('<h1>Titre</h1><h4>Aparté</h4>');
    expect(headings).toHaveLength(0);
    expect(html).toBe('<h1>Titre</h1><h4>Aparté</h4>');
  });
});
