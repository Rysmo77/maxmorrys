import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NI NOTE, NI NOMBRE D'INSCRITS, SUR AUCUNE SURFACE VISITEUR.
 *
 * Le kit formule l'interdit à la première personne, et c'est un engagement de marque, pas une
 * préférence de mise en page :
 *
 *   « Je n'affiche ni note ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai rien
 *     d'honnête à en dire. »              — Max-Morrys_DS_Platform/readme.md
 *
 * ⚠️ POURQUOI CE TEST EXISTE. L'interdit a été appliqué QUATRE fois, à quatre dates, par quatre
 * nettoyages successifs — le catalogue, la fiche, `FormationsEntryPopup`, puis `CoursesTab` — et
 * il en restait deux le 2 septembre 2026, aux deux pires endroits :
 *
 *   • `CartRecoveryPopup`, c'est-à-dire le RANG 1 du registre de pop-ups, celui qui écarte tous
 *     les autres, montré au prospect le plus proche de l'achat ;
 *   • `FormationCard`, montée par `FormationCTA` au bas de CHAQUE article de blog — et sans
 *     aucune garde `> 0`, donc affichant littéralement « ★ 0 » et « 0 » sur le trafic organique.
 *
 * Chaque nettoyage a laissé un commentaire expliquant la règle, et le suivant a dû la
 * redécouvrir. Un commentaire n'a jamais arrêté une régression : un test, si.
 *
 * ⚠️ PORTÉE. Les champs RESTENT en base et servent au tri interne et à l'administration — voir
 * `Formations.tsx`. Ce test ne vise donc que les surfaces vues par un visiteur ou un apprenant,
 * et laisse `pages/admin/` tranquille.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SRC = resolve(__dirname, '../../src');

/** Surfaces où ces nombres n'ont rien à faire. L'administration en est délibérément exclue. */
const EXEMPT = ['pages/admin/'];

function surfaces(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) surfaces(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/**
 * Le fichier PRIVÉ de ses commentaires.
 *
 * Indispensable ici : les quatre nettoyages ont chacun laissé un bloc qui CITE les expressions
 * interdites pour expliquer leur retrait. Chercher dans le texte brut ferait échouer le test sur
 * sa propre documentation — et pousserait le prochain à effacer l'explication pour le calmer.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

/** Un rendu JSX du champ : `{formation.rating}`, `{f.students}`, `{course.rating.toFixed(1)}`… */
const RENDERED = /\{[^{}\n]*\b[A-Za-z_$][\w$]*\.(rating|students)\b[^{}\n]*\}/;

describe('les interdits de preuve sociale', () => {
  const files = surfaces(SRC).filter(
    (p) => !EXEMPT.some((ex) => relative(SRC, p).replace(/\\/g, '/').startsWith(ex)),
  );

  it('inspecte bien un ensemble de surfaces non vide', () => {
    // Un test dont le balayage se vide passerait pour toujours sans rien garder.
    expect(files.length).toBeGreaterThan(50);
  });

  it('aucune surface visiteur ne rend une note ni un nombre d’inscrits', () => {
    const guilty = files
      .map((p) => ({ file: relative(SRC, p), code: stripComments(readFileSync(p, 'utf8')) }))
      .filter(({ code }) => RENDERED.test(code))
      .map(({ file, code }) => `${file} → ${RENDERED.exec(code)?.[0].trim()}`);

    expect(guilty).toEqual([]);
  });

  it('la règle attrape bien ce qu’elle prétend attraper', () => {
    // Sans cette vérification, une expression régulière trop stricte passerait inaperçue.
    expect(RENDERED.test('<span>{formation.rating}</span>')).toBe(true);
    expect(RENDERED.test('{formation.students}')).toBe(true);
    expect(RENDERED.test('{formation.rating.toFixed(1)}')).toBe(true);
    // Et qu'elle laisse passer ce qui est légitime : lire le champ sans l'afficher.
    expect(RENDERED.test('const sorted = list.sort((a, b) => b.students - a.students);')).toBe(false);
  });
});
