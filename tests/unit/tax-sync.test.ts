import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import {
  REGIME,
  TVA_TAUX_NORMAL,
  doitMentionnerLaTaxe,
  regimeDe,
  ventilerDepuisHT,
  ventilerDepuisTTC,
  type FamilleFiscale,
} from '../../src/lib/tax/senegal';

/**
 * LE RÉGIME FISCAL NE DOIT PAS DÉRIVER ENTRE LE SITE ET LE WORKER.
 *
 * `src/lib/tax/senegal.ts` fixe le taux et le régime par famille de produits. Le Worker en
 * tient un MIROIR (`worker/apps/api/src/lib/tax.ts`) parce que ce sont deux paquets npm
 * distincts et que le site ne sait pas importer depuis `worker/`.
 *
 * Ce que coûterait la dérive est plus grave que pour les segments d'URL : le site
 * annoncerait un montant, le Worker en débiterait un autre, et la facture en imprimerait un
 * troisième. Un écart de taux ne se voit sur aucune capture d'écran — il se voit sur un
 * relevé bancaire, du côté du client.
 *
 * Voir `segments-sync.test.ts` : même idiome, même raison.
 */

const SOURCE = 'src/lib/tax/senegal.ts';
const MIROIR = 'worker/apps/api/src/lib/tax.ts';

/** Retire les commentaires — ils citent des taux et des états en toutes lettres. */
function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function lireTaux(path: string): string {
  const m = code(path).match(/TVA_TAUX_NORMAL\s*=\s*([0-9.]+)/);
  if (!m) throw new Error(`taux introuvable dans ${path}`);
  return m[1];
}

/** Extrait `{ famille: "etat|taux" }` de la table, quelle que soit sa mise en forme. */
function lireRegime(path: string): Record<string, string> {
  const bloc = code(path).match(/REGIME:\s*Record<FamilleFiscale,\s*Regime>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!bloc) throw new Error(`table REGIME introuvable dans ${path}`);
  const out: Record<string, string> = {};
  for (const [, famille, etat, taux] of bloc[1].matchAll(
    /(\w+):\s*\{\s*etat:\s*'(\w+)',\s*taux:\s*([^\s},]+)/g,
  )) {
    out[famille] = `${etat}|${taux}`;
  }
  if (Object.keys(out).length === 0) throw new Error(`aucune famille lue dans ${path}`);
  return out;
}

describe('le régime fiscal est identique des deux côtés', () => {
  it('porte le même taux normal', () => {
    expect(lireTaux(MIROIR)).toBe(lireTaux(SOURCE));
  });

  it('porte la même table de régimes, état ET taux, famille par famille', () => {
    expect(lireRegime(MIROIR)).toEqual(lireRegime(SOURCE));
  });

  it('couvre toutes les familles vendues, sans trou', () => {
    const familles: FamilleFiscale[] = ['agence', 'formation', 'club', 'rysmo'];
    for (const f of familles) expect(Object.keys(REGIME)).toContain(f);
  });
});

/**
 * LES TROIS ÉTATS, ET CE QU'ILS AUTORISENT À ÉCRIRE.
 *
 * C'est la distinction qui porte tout le module. `exonere` et `indetermine` produisent le
 * même calcul — zéro taxe — et des documents DIFFÉRENTS : le premier doit dire pourquoi la
 * taxe est absente, le second doit se taire. Les confondre, c'est soit une facture
 * incomplète, soit une mention légale inventée.
 */
describe('les trois états se distinguent là où ça compte', () => {
  it('assujettit l’agence au taux normal', () => {
    expect(REGIME.agence).toEqual({ etat: 'taxable', taux: TVA_TAUX_NORMAL });
  });

  it('exonère l’enseignement — formations et Club', () => {
    expect(REGIME.formation.etat).toBe('exonere');
    expect(REGIME.club.etat).toBe('exonere');
  });

  it('laisse Rysmo indéterminée tant que la direction ne s’est pas prononcée', () => {
    expect(REGIME.rysmo.etat).toBe('indetermine');
  });

  it('fait parler l’exonération, et taire l’indétermination', () => {
    expect(doitMentionnerLaTaxe('taxable')).toBe(true);
    expect(doitMentionnerLaTaxe('exonere')).toBe(true);
    expect(doitMentionnerLaTaxe('indetermine')).toBe(false);
  });

  it('ne calcule aucune taxe hors du régime taxable', () => {
    for (const f of ['formation', 'club', 'rysmo'] as FamilleFiscale[]) {
      expect(ventilerDepuisHT(95_000, regimeDe(f)).tva).toBe(0);
      expect(ventilerDepuisTTC(95_000, regimeDe(f)).tva).toBe(0);
    }
  });
});

/**
 * L'INVARIANT D'ARRONDI.
 *
 * Le franc CFA n'a pas de centimes : tout montant doit être entier. Et une facture dont les
 * lignes ne totalisent pas est une facture qu'un comptable rejette — d'où la règle
 * `ht + tva === ttc`, vraie sans exception, y compris sur les montants qui tombent mal.
 */
describe('la ventilation reste entière et additive', () => {
  const montants = [1, 7, 999, 1658, 19_900, 45_000, 95_000, 250_000, 495_000, 1_645_000];
  const agence = regimeDe('agence');

  it('depuis un montant HT : les trois nombres sont entiers et s’additionnent', () => {
    for (const m of montants) {
      const v = ventilerDepuisHT(m, agence);
      expect(Number.isInteger(v.ht)).toBe(true);
      expect(Number.isInteger(v.tva)).toBe(true);
      expect(Number.isInteger(v.ttc)).toBe(true);
      expect(v.ht + v.tva).toBe(v.ttc);
    }
  });

  it('depuis un montant TTC : idem, et le TTC est préservé au franc près', () => {
    for (const m of montants) {
      const v = ventilerDepuisTTC(m, agence);
      expect(v.ht + v.tva).toBe(v.ttc);
      // Le montant déjà encaissé ne bouge JAMAIS : c'est lui qui fait foi.
      expect(v.ttc).toBe(m);
    }
  });

  it('applique bien 18 % sur le cas de référence du devis agence', () => {
    // 250 000 HT est le prix promo du pack « Présence Locale » — voir `offer.ts`.
    expect(ventilerDepuisHT(250_000, agence)).toEqual({
      ht: 250_000,
      tva: 45_000,
      ttc: 295_000,
      taux: TVA_TAUX_NORMAL,
      etat: 'taxable',
    });
  });
});
