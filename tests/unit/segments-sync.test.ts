import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

/**
 * LES TROIS TABLES DE SEGMENTS NE DOIVENT PAS DÉRIVER.
 *
 * `src/i18n/segments.ts` est la table du frontend. Elle est RECOPIÉE À LA MAIN dans les
 * Cloud Functions et dans le Worker Cloudflare, qui ne peuvent pas importer le code de
 * l'application. Les trois fichiers le disent en commentaire — et c'est tout ce qui les
 * tenait ensemble.
 *
 * Ça n'a pas tenu. En alignant trois segments anglais sur la table du design system
 * (`digital-presence → local-presence`, `my-space → my-learning`, `login → sign-in`), les
 * trois copies étaient DÉJÀ désynchronisées entre elles sur d'autres valeurs, et rien ne
 * l'avait signalé : ni typecheck, ni lint, ni aucun test.
 *
 * CE QUE COÛTE LA DÉRIVE. Le frontend rend `/en/my-learning` ; le Worker, lui, ne reconnaît
 * `/en/my-space` que sous l'ancien nom, donc il n'y sert plus le bon pré-rendu et l'URL part
 * à l'origine. Le résultat n'est ni une erreur ni une page blanche : c'est une page qui
 * s'affiche, sans ses métadonnées, pour les robots seulement. Personne ne le voit en
 * naviguant — c'est exactement le profil de défaut que ce dépôt écrit des tests pour
 * attraper.
 */

/** Extrait les paires `fr: 'en'` d'une des trois tables, quel que soit son habillage. */
function readTable(path: string): Record<string, string> {
  const src = readFileSync(path, 'utf8');
  // On neutralise les commentaires : ils citent des valeurs de segments en toutes lettres.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const out: Record<string, string> = {};

  // Frontend : `'mon-espace': { fr: 'mon-espace', en: 'my-learning' },`
  for (const m of code.matchAll(/['"]?([\w-]+)['"]?\s*:\s*\{\s*fr:\s*['"][\w-]+['"]\s*,\s*en:\s*['"]([\w-]+)['"]\s*\}/g)) {
    out[m[1]] = m[2];
  }
  if (Object.keys(out).length > 0) return out;

  // Functions et Worker : `'mon-espace': 'my-learning',`
  for (const m of code.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]([\w-]+)['"]\s*,/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const FRONT = 'src/i18n/segments.ts';
const COPIES = [
  ['Cloud Functions', 'functions/src/segments.ts'],
  ['Worker Cloudflare', 'worker/apps/site/src/prerender/segments.ts'],
] as const;

describe('table des segments — les trois copies', () => {
  const front = readTable(FRONT);

  it('la table du frontend se lit et n\'est pas vide', () => {
    expect(Object.keys(front).length).toBeGreaterThan(20);
  });

  for (const [nom, path] of COPIES) {
    it(`${nom} donne la même traduction que le frontend pour chaque segment partagé`, () => {
      const copy = readTable(path);
      const ecarts: string[] = [];
      for (const [fr, en] of Object.entries(copy)) {
        // Une copie n'a pas à porter TOUS les segments — seulement à ne pas les CONTREDIRE.
        if (front[fr] !== undefined && front[fr] !== en) {
          ecarts.push(`« ${fr} » : frontend « ${front[fr]} » vs ${nom} « ${en} »`);
        }
      }
      expect(ecarts).toEqual([]);
    });
  }

  it('les trois segments alignés sur la table du design system y sont bien', () => {
    expect(front['presence-digitale']).toBe('local-presence');
    expect(front['mon-espace']).toBe('my-learning');
    expect(front['connexion']).toBe('sign-in');
  });
});
