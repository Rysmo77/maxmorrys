import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UNE SEULE FORME DE PILULE, ET C'EST LE SYSTÈME QUI LA DESSINE.
 *
 * `ChipRow` (`@ds`) existe pour ça, et les trois index publics du site l'emploient : `/blog`,
 * `/faq`, `/formations`. `/conception/realisations` avait sa propre barre de filtres, écrite
 * à la main — même geste, deux hauteurs (36 contre 40), deux tailles de texte, deux traitements
 * de l'état actif, et surtout : **l'une défilait, l'autre passait à la ligne**.
 *
 * Le coût n'était pas cosmétique. La version maison n'avait ni `mm-touch-extend` (le plancher
 * de 44 px de cible tactile) ni `mm-press-sm` (le retour au doigt), et rien n'obligeait la
 * suivante à les avoir non plus.
 *
 * ⚠️ CE QUE CE TEST NE DIT PAS : qu'une page n'a pas le droit d'un `aria-pressed`. Une bascule
 * n'est pas une pilule — la question d'aiguillage de `/contact` est faite de trois grands
 * panneaux basculants, et c'est juste. Ce qui est interdit, c'est de REDESSINER la pilule :
 * l'appariement d'un `aria-pressed` et d'un `rounded-pill` sur la même surface.
 */

const PORTEE = ['src/pages', 'src/components'];

/** Le design system a le droit — c'est lui qui dessine. */
const AUTORISE = /^src\/design-system\//;

function fichiers(chemin: string): string[] {
  return readdirSync(chemin, { withFileTypes: true }).flatMap((e) => {
    const p = join(chemin, e.name);
    return e.isDirectory() ? fichiers(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

describe('la pilule n’est dessinée qu’à un seul endroit', () => {
  const cibles = PORTEE.flatMap(fichiers).filter((f) => !AUTORISE.test(f));

  it('le balayage voit bien les surfaces', () => {
    expect(cibles.length).toBeGreaterThan(50);
  });

  it('aucune surface ne redessine un chip', () => {
    const fautes: string[] = [];
    for (const f of cibles) {
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      // Les deux marqueurs dans la même balise ouvrante : c'est ça, redessiner un chip.
      for (const balise of code.match(/<[a-zA-Z][^>]{0,600}>/g) ?? []) {
        if (/aria-pressed/.test(balise) && /rounded-pill/.test(balise)) {
          fautes.push(`  ${f} → ${balise.slice(0, 110).replace(/\s+/g, ' ')}`);
        }
      }
    }
    expect(
      fautes,
      `${fautes.length} chip dessiné hors du système :\n${fautes.join('\n')}\n\n` +
      'Employer `ChipRow` de `@ds`. Une pilule de plus, c\'est une hauteur de cible tactile ' +
      'et un comportement de débordement qui recommencent à diverger.',
    ).toEqual([]);
  });
});
