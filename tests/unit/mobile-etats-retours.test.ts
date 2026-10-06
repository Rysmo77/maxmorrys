import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES GARDES DE L'AUDIT UI/UX DU 05/10/2026 — ce qui revenait à chaque nouvel écran.
 *
 * Quatre défauts que l'audit a trouvés partout, et qu'aucune porte ne voyait :
 *
 *   1 · UN VIDE AFFIRMÉ AVANT D'AVOIR LU. `SansDonnees` sans `etat` dit « pas encore
 *       branché » pendant le chargement comme en panne — « 0 discussion » avant lecture.
 *   2 · DU TEXTE À L'ENCRE TERTIAIRE. `textFaint` ne porte pas de texte (AD-18) : il
 *       tombe sous 4,5:1 sur le verre.
 *   3 · DU TEXTE SOUS 11,5 PT. Illisible en plein soleil, sur le marché visé.
 *   4 · UNE BOÎTE SYSTÈME POUR DIRE « C'EST FAIT ». `Alert.alert` interrompt ; un succès
 *       se confirme SUR PLACE (`useConfirmation`), une erreur dans un `Bandeau`. La boîte
 *       reste aux confirmations destructives.
 *
 * Les commentaires sont retirés avant lecture : l'en-tête qui explique un interdit le cite.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const MOBILE = resolve(__dirname, '../../mobile');
const sansCommentaires = (c: string) => c
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

function sources(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(e) && !e.endsWith('.generated.ts')) out.push(p);
  }
  return out;
}
const rel = (p: string) => p.slice(MOBILE.length + 1);
const ecrans = () => [...sources(join(MOBILE, 'app')), ...sources(join(MOBILE, 'ecrans'))];

/** Les maquettes d'atelier, que la production redirige : elles décrivent, elles ne lisent rien. */
const ATELIER = new Set([
  'app/widget.tsx', 'app/verrouille.tsx', 'app/permissions.tsx', 'app/apercu.tsx',
]);

describe('les états se disent avant les absences', () => {
  /*
   * Les écrans DÉCLARÉS ci-dessous n'ont pas de lecture serveur derrière leur vide : leurs
   * données arrivent par la route (certificat, partage), ou la source n'existe pas encore
   * (annuaire, prix du pack). Pour eux, « pas encore branché » EST l'état vrai.
   */
  const SANS_LECTURE = new Set([
    'app/acces.tsx', 'app/certificat.tsx', 'app/partage.tsx', 'app/presence.tsx', 'app/club/membres.tsx',
  ]);

  it('tout `SansDonnees` d’un écran qui lit reçoit son `etat`', () => {
    const fautes: string[] = [];
    for (const f of ecrans()) {
      const r = rel(f);
      if (ATELIER.has(r) || SANS_LECTURE.has(r) || r.startsWith('app/console/')) continue;
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      for (const m of code.matchAll(/<SansDonnees\b([^>]*?)\/?>/gs)) {
        if (!/\betat=/.test(m[1])) fautes.push(`${r}:${code.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(fautes, 'un vide sans état affirme une absence avant d’avoir lu').toEqual([]);
  });
});

describe('le texte reste lisible', () => {
  it('aucun texte à l’encre tertiaire (`textFaint`)', () => {
    const fautes: string[] = [];
    for (const f of [...ecrans(), ...sources(join(MOBILE, 'ds'))]) {
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      code.split('\n').forEach((ligne, i) => {
        /* Un glyphe ou un texte d'exemple de champ peut la porter ; un texte, non. */
        if (/color:\s*t\('textFaint'\)/.test(ligne) && !/<Icon\b/.test(ligne)) fautes.push(`${rel(f)}:${i + 1}`);
      });
    }
    expect(fautes).toEqual([]);
  });

  it('aucun texte sous 11,5 pt — hors sourcils en capitales et maquettes d’atelier', () => {
    const fautes: string[] = [];
    for (const f of [...ecrans(), ...sources(join(MOBILE, 'ds'))]) {
      const r = rel(f);
      if (ATELIER.has(r) || r === 'app/lancement.tsx') continue;
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      code.split('\n').forEach((ligne, i) => {
        const m = /fontSize:\s*(\d+(?:\.\d+)?)\b/.exec(ligne);
        if (!m || Number(m[1]) >= 11.5) return;
        /* Le sourcil monospace en capitales (10,5, interlettré) est un rôle à part. */
        if (/letterSpacing/.test(ligne) || /letterSpacing/.test(code.split('\n')[i + 1] ?? '')) return;
        fautes.push(`${r}:${i + 1} (${m[1]})`);
      });
    }
    expect(fautes).toEqual([]);
  });
});

describe('les retours d’action restent sur place', () => {
  /* Une boîte non destructive survit ici, et chacune a sa raison. */
  const DECLAREES = new Set([
    'app/_layout.tsx',          // le verrou s'est éteint tout seul : à dire avant tout écran
    'app/club/bloques.tsx',     // débloquer : confirmation d'un geste qui rouvre le fil
  ]);

  it('`Alert.alert` ne sert qu’aux confirmations destructives', () => {
    const fautes: string[] = [];
    for (const f of ecrans()) {
      const r = rel(f);
      if (DECLAREES.has(r) || r.startsWith('app/console/')) continue;
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      for (const m of code.matchAll(/Alert\.alert\(/g)) {
        /* L'appel jusqu'à sa parenthèse fermante — assez pour y lire ses boutons. */
        const appel = code.slice(m.index, code.indexOf('\n    );', m.index) + 1 || m.index + 900);
        if (!/'destructive'/.test(appel)) fautes.push(`${r}:${code.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(fautes, 'un succès ou une erreur se dit sur place, pas dans une boîte système').toEqual([]);
  });
});
