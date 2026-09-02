import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UN IDENTIFIANT DE POP-UP EST RECOPIÉ À SEPT ENDROITS. AUCUN COMPILATEUR NE LES RELIE.
 *
 * Le type `PopupId` en gouverne quatre côté `src/` — le typecheck y suffirait presque. Mais
 * trois échappent complètement à TypeScript :
 *
 *   • `worker/apps/api/src/handlers/popupEvent.ts` est un projet TypeScript INDÉPENDANT
 *     (`@cloudflare/workers-types` seuls, jamais vérifié en CI). Sa liste blanche `POPUP_IDS`
 *     rejette en silence tout identifiant inconnu — et retourne `{ ok: true }` en le faisant,
 *     parce qu'une mesure ne doit jamais faire échouer une interaction. Une pop-up ajoutée sans
 *     y penser s'afficherait donc normalement, cliquerait normalement, et ne compterait RIEN.
 *     C'est le pire des défauts : invisible côté visiteur, invisible côté console, et il ne se
 *     manifeste que le jour où quelqu'un cherche à savoir si la fenêtre a servi.
 *
 *   • les deux `shared.json`. i18next ne signale pas une clé manquante : il rend la clé. Une
 *     fenêtre sans texte afficherait « popups.clubExit.title » en Fraunces 900.
 *
 * Ce test relie les sept. Il ne vérifie pas que les identifiants sont BONS — seulement qu'aucun
 * emplacement n'a été oublié, ce qu'aucun autre filet du dépôt ne fait.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

/** Les membres d'une union de littéraux : `| 'agencyExit'` … */
function unionMembers(src: string, typeName: string): string[] {
  const block = new RegExp(`export type ${typeName} =([\\s\\S]*?);`).exec(src);
  if (!block) throw new Error(`union ${typeName} introuvable`);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Les littéraux d'un tableau nommé, quel que soit son type déclaré. */
function arrayMembers(src: string, constName: string): string[] {
  const block = new RegExp(`${constName}[^=]*=\\s*\\[([\\s\\S]*?)\\]`).exec(src);
  if (!block) throw new Error(`tableau ${constName} introuvable`);
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const canonical = unionMembers(read('src/lib/popups/rules.ts'), 'PopupId');

describe('les identifiants de pop-up, recopiés à sept endroits', () => {
  it('le type en déclare au moins les six d’origine', () => {
    expect(canonical.length).toBeGreaterThanOrEqual(6);
    expect(canonical).toContain('agencyExit');
    expect(new Set(canonical).size).toBe(canonical.length); // aucun doublon
  });

  it('`settings.ts` les connaît tous — sinon la clé vaut ACTIVÉ sans interrupteur', () => {
    expect(arrayMembers(read('src/lib/popups/settings.ts'), 'ALL_IDS').sort())
      .toEqual([...canonical].sort());
  });

  it('`debug.ts` les connaît tous — sinon `?popup=<id>` refuse l’aperçu', () => {
    expect(arrayMembers(read('src/lib/popups/debug.ts'), 'KNOWN_IDS').sort())
      .toEqual([...canonical].sort());
  });

  it('le registre porte une entrée par identifiant, et pas deux', () => {
    const src = read('src/lib/popups/registry.ts');
    const ids = [...src.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(ids.sort()).toEqual([...canonical].sort());
  });

  it('⚠️ LA LISTE BLANCHE DU WORKER les accepte tous — sinon la mesure disparaît en silence', () => {
    // Le seul miroir hors du projet TypeScript de `src/` : rien d'autre ne l'attrape.
    expect(arrayMembers(read('worker/apps/api/src/handlers/popupEvent.ts'), 'POPUP_IDS').sort())
      .toEqual([...canonical].sort());
  });

  it('l’administration expose un interrupteur par pop-up', () => {
    const src = read('src/pages/admin/AdminSettings.tsx');
    const fields = [...src.matchAll(/popup_([A-Za-z]+):\s*boolean/g)].map((m) => m[1]);
    expect(fields.sort()).toEqual([...canonical].sort());
    // Et chacun doit figurer dans la liste rendue, pas seulement dans le type.
    for (const id of canonical) {
      expect(src).toContain(`key: 'popup_${id}'`);
    }
  });

  it('les deux langues portent le texte de chaque pop-up', () => {
    for (const lang of ['fr', 'en']) {
      const popups = JSON.parse(read(`src/i18n/locales/${lang}/shared.json`)).popups;
      expect(Object.keys(popups).sort()).toEqual([...canonical].sort());
      for (const id of canonical) {
        // i18next rendrait la clé brute : un titre vide n'est pas un défaut visible.
        expect(popups[id].title, `${lang}/popups.${id}.title`).toBeTruthy();
      }
    }
  });
});
