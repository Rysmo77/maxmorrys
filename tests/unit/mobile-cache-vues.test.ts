import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { canonique } from '../../mobile/donnees/canonique';
import { VUES_PERIMEES } from '../../mobile/donnees/contrat.generated';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE CACHE DES VUES TIENT LA RÈGLE QU'IL EXISTE POUR TENIR.
 *
 * Trois défauts du port, trouvés par la réécriture Kotlin (abandonnée) : une clé qui
 * ne triait pas ses paramètres, un relevé daté par l'horloge du téléphone, et des
 * écritures qui ne périmaient aucune vue — `VUES_PERIMEES` était généré et lu par
 * personne.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const MOBILE = resolve(__dirname, '../../mobile');
const lire = (p: string) => readFileSync(join(MOBILE, p), 'utf8');

function sources(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(e) && !e.endsWith('.generated.ts')) out.push(p);
  }
  return out;
}

describe('la clé du cache est canonique', () => {
  it('l’ordre des paramètres ne compte pas, à toute profondeur', () => {
    expect(canonique({ a: 1, b: { y: 2, x: [1, { q: 1, p: 2 }] } }))
      .toBe(canonique({ b: { x: [1, { p: 2, q: 1 }], y: 2 }, a: 1 }));
  });

  it('des paramètres différents donnent des clés différentes', () => {
    expect(canonique({ onglet: 'membre' })).not.toBe(canonique({ onglet: 'discussions' }));
    expect(canonique({ a: [1, 2] })).not.toBe(canonique({ a: [2, 1] }));
  });

  it('une clé `undefined` ne crée pas une seconde entrée', () => {
    expect(canonique({ a: 1, b: undefined })).toBe(canonique({ a: 1 }));
  });
});

describe('le relevé affiché est celui du serveur', () => {
  it('le cache garde l’estampille du serveur, séparée de l’heure de lecture', () => {
    const vue = lire('donnees/vue.ts');
    expect(vue).toMatch(/ecrireCache\(cle,\s*\{[^}]*releveA:\s*asOf/);
    expect(vue).toMatch(/asOf:\s*entree\.releveA\b/);
    expect(vue).not.toMatch(/new Date\(entree\.releveA\)/);
  });
});

describe('toute écriture périme ce que le contrat déclare', () => {
  const ecritures = Object.keys(VUES_PERIMEES);

  it('la porte regarde vraiment quelque chose', () => {
    expect(ecritures.length).toBeGreaterThanOrEqual(8);
  });

  it('aucune écriture n’est appelée par `appeler` en direct', () => {
    const fautes: string[] = [];
    for (const f of sources(MOBILE)) {
      const code = readFileSync(f, 'utf8');
      for (const m of code.matchAll(/\bappeler(?:<[^\n]*?>)?\(\s*'([A-Za-z0-9_]+)'/g)) {
        if (ecritures.includes(m[1])) fautes.push(`${f.slice(MOBILE.length + 1)} → ${m[1]}`);
      }
    }
    expect(fautes, 'ces écritures contournent `ecrire()` et ne périment rien').toEqual([]);
  });

  it('`ecrire` périme réellement après l’appel', () => {
    const cache = lire('donnees/cache.ts');
    const corps = cache.slice(cache.indexOf('export async function ecrire'));
    expect(corps).toMatch(/await appeler[\s\S]*perimer\(nom\)/);
  });
});

describe('les types écrits à la main sont tenus au contrat', () => {
  /*
   * `donnees/conformite.ts` exige, À LA COMPILATION, que ce que le serveur envoie soit
   * assignable à ce que l'écran lit. Il a trouvé à sa première compilation 39 champs typés
   * `T | null` que le serveur OMET quand ils sont nuls — un `x === null` laissait passer
   * `undefined`, et le classement calculait une barre à `NaN`. Le compilateur ne voit pas,
   * en revanche, une vue OUBLIÉE dans la liste : c'est ce que ce test garde.
   */
  const LUES_PAR_LE_TYPE_GENERE = ['appVerifierCertificat', 'appApercuClub', 'appTransaction', 'appLeconContenu'];

  it('toute vue du contrat est conforme, ou lue dans son type généré', () => {
    const contrat = lire('donnees/contrat.generated.ts');
    const union = /export type NomDeVue\s*=([^;]*);/.exec(contrat)?.[1] ?? '';
    const vues = [...union.matchAll(/"([A-Za-z0-9_.]+)"/g)].map((m) => m[1]);
    expect(vues.length).toBeGreaterThanOrEqual(19);
    const conformite = lire('donnees/conformite.ts');
    const absentes = vues.filter((v) => !conformite.includes(`Vue<'${v}'>`) && !LUES_PAR_LE_TYPE_GENERE.includes(v));
    expect(absentes, 'vues que rien ne tient au contrat').toEqual([]);
  });

  it('aucun champ nullable n’est typé comme toujours présent', () => {
    const types = lire('donnees/types.ts');
    const fautes = types.split('\n').filter((l) => /\b[a-zA-Z_]+:\s[^;{}]*\|\s*null\b/.test(l) && !/\?:/.test(l));
    expect(fautes, 'le serveur omet un champ nul : `x?: T | null`').toEqual([]);
  });
});
