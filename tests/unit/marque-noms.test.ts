import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * LE NOM DE LA SOCIÉTÉ NE S'ÉCRIT PAS DANS UN CATALOGUE.
 *
 * Relevé le 18/09/2026 : le rattachement corporate était écrit **neuf fois** à l'écran, dont
 * sept tapées à la main dans les JSON — et **trois casses** cohabitaient : « MY ONOMA SARL »,
 * « MY ONOMA », « My Onoma », selon la page. Aucune porte ne pouvait le voir : chaque chaîne
 * était correcte prise seule.
 *
 * `src/lib/brand/company.ts` fait foi (`legalEntity.name`, `legalName`). Le nom arrive donc
 * par interpolation — `{{company}}` — et une casse interpolée ne peut plus dériver d'un
 * catalogue à l'autre.
 *
 * ── CE QUI RESTE PERMIS, ET POURQUOI ───────────────────────────────────────────────────────
 * L'HISTOIRE. Un jalon de parcours daté de 2018 nomme l'entreprise telle qu'elle s'appelait
 * alors ; la réécrire en capitales d'aujourd'hui falsifierait une frise que `proof:check`
 * garde par ailleurs. Une exemption s'ancre donc sur un CHEMIN DE CLÉ, pas sur une valeur —
 * une exemption qui cite la phrase se périme au premier mot changé, et se rouvre en silence.
 */

const LOCALES = 'src/i18n/locales';

/** Les formes fautives : tout ce qui n'est pas la casse du code. */
const FAUTIF = /\bMy[- ]?Onoma\b/;

/** Exemptions par chemin de clé, avec leur raison. */
const EXEMPTIONS: readonly (readonly [RegExp, string])[] = [
  [
    /^about\.json:milestones\./,
    "La frise du parcours nomme l'entreprise telle qu'elle s'appelait à la date du jalon. " +
      "C'est de l'histoire, pas une mention de marque — et `proof:check` garde ces jalons.",
  ],
];

interface Trouvaille { fichier: string; chemin: string; valeur: string }

function parcourir(node: unknown, chemin: string, fichier: string, out: Trouvaille[]): void {
  if (typeof node === 'string') {
    if (FAUTIF.test(node)) out.push({ fichier, chemin, valeur: node });
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => parcourir(v, `${chemin}[${i}]`, fichier, out));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) parcourir(v, chemin ? `${chemin}.${k}` : k, fichier, out);
  }
}

describe('le nom de la société vient du code, pas des catalogues', () => {
  const trouvailles: Trouvaille[] = [];
  for (const langue of readdirSync(LOCALES)) {
    const dossier = join(LOCALES, langue);
    for (const f of readdirSync(dossier).filter((n) => n.endsWith('.json'))) {
      parcourir(JSON.parse(readFileSync(join(dossier, f), 'utf8')), '', f, trouvailles);
    }
  }

  it('aucune casse concurrente ne traîne dans un catalogue', () => {
    const fautes = trouvailles
      .filter((t) => !EXEMPTIONS.some(([motif]) => motif.test(`${t.fichier}:${t.chemin}`)))
      .map((t) => `  ${t.fichier} → ${t.chemin}\n      « ${t.valeur.slice(0, 90)} »`);

    expect(
      fautes,
      `${fautes.length} mention(s) du nom écrite(s) à la main :\n${fautes.join('\n')}\n\n` +
      'Le nom vient de `src/lib/brand/company.ts` par interpolation `{{company}}`. Une casse ' +
      'tapée dans un JSON dérive de page en page sans que rien ne le signale.',
    ).toEqual([]);
  });

  it('la règle attrape bien ce qu’elle prétend attraper', () => {
    // Garde-fou : un motif cassé rendrait ce test vert sur un dépôt fautif.
    expect(FAUTIF.test('opéré par My Onoma')).toBe(true);
    expect(FAUTIF.test('opéré par MY ONOMA')).toBe(false);
  });
});
