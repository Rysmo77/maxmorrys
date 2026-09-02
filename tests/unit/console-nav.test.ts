import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADMIN_NAV, ADMIN_SECTIONS, ADMIN_UNGROUPED, ADMIN_SCREEN_COUNT } from '../../src/lib/admin/consoleNav';
import { SUPPORT_SCOPE, isSupportAllowedPath } from '../../src/lib/adminAccess';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA TABLE DES ÉCRANS DE CONSOLE — CE QUI DOIT RESTER VRAI QUAND ELLE BOUGE.
 *
 * `handoff_tableaux_de_bord` § ParametresDesktop affiche « administrateur · 19 écrans,
 * support · 5 écrans » dans son panneau de droite. Ces deux nombres sont désormais
 * COMPTÉS (`RolesPanel`) plutôt qu'écrits — mais un compte dérivé d'une table ne vaut
 * que si la table reste la seule, et qu'aucun écran n'échappe au classement.
 *
 * Ce que ces portes tiennent, et qu'aucune n'est théorique :
 *
 *   1. AUCUN ÉCRAN HORS FAMILLE. Le menu groupe en cinq familles par une liste de
 *      chemins. Un écran ajouté à `ADMIN_NAV` sans l'être à une famille disparaît
 *      simplement du menu — la page existe, la route répond, et personne ne la voit.
 *      C'est le défaut le plus silencieux de cette table.
 *   2. AUCUN CHEMIN EN DOUBLE, dans la table comme dans les familles. Un doublon rend
 *      l'entrée deux fois et gonfle le compte affiché aux réglages.
 *   3. LE PÉRIMÈTRE SUPPORT EST UN SOUS-ENSEMBLE. `SUPPORT_SCOPE` nomme cinq chemins ;
 *      un chemin qui n'existe plus dans `ADMIN_NAV` y resterait sans que rien ne le
 *      signale, et le panneau des rôles annoncerait une portée fantôme.
 *   4. LA TABLE N'EST DÉCLARÉE QU'UNE FOIS. Elle vivait dans `AdminLayout.tsx` ; l'y
 *      redéclarer est exactement l'erreur que `lib/adminAccess.ts` documente — « deux
 *      déclarations, c'est deux occasions de mentir à la personne sur ce qu'elle a le
 *      droit de faire ».
 * ═══════════════════════════════════════════════════════════════════════════════
 */
describe('table des écrans de console', () => {
  it('classe chaque écran dans une famille du menu', () => {
    expect(ADMIN_UNGROUPED).toEqual([]);
  });

  it("ne déclare aucun chemin deux fois", () => {
    const paths = ADMIN_NAV.map((i) => i.to);
    expect(new Set(paths).size).toBe(paths.length);

    const grouped = ADMIN_SECTIONS.flatMap((s) => s.paths);
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("ne classe aucun chemin qui n'existe pas dans la table", () => {
    const known = new Set(ADMIN_NAV.map((i) => i.to));
    const unknown = ADMIN_SECTIONS.flatMap((s) => s.paths).filter((p) => !known.has(p));
    expect(unknown).toEqual([]);
  });

  it('garde le périmètre support comme sous-ensemble des écrans existants', () => {
    const known = new Set(ADMIN_NAV.map((i) => i.to));
    const ghosts = SUPPORT_SCOPE.map((s) => s.to).filter((p) => !known.has(p));
    expect(ghosts).toEqual([]);
    // Et le garde de route lit bien la même table.
    for (const s of SUPPORT_SCOPE) expect(isSupportAllowedPath(s.to)).toBe(true);
  });

  it('compte ce que la table contient, sans nombre écrit à la main', () => {
    expect(ADMIN_SCREEN_COUNT).toBe(ADMIN_NAV.length);
    expect(ADMIN_SCREEN_COUNT).toBeGreaterThan(SUPPORT_SCOPE.length);
  });

  it("n'est pas redéclarée dans AdminLayout", () => {
    const layout = readFileSync(resolve(__dirname, '../../src/components/layout/AdminLayout.tsx'), 'utf8');
    // Une seconde table se reconnaît à ses entrées : `to:` suivi d'un chemin /admin.
    const inlineEntries = layout.match(/to:\s*'\/admin[^']*'/g) ?? [];
    expect(inlineEntries).toEqual([]);
    expect(layout).toContain("from '../../lib/admin/consoleNav'");
  });
});
