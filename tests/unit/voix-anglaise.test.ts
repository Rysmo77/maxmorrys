/**
 * LES LIBELLÉS ANGLAIS NE SONT PAS TRADUITS, ILS SONT ÉCRITS.
 *
 * Toute la voix française repose sur le tutoiement, et l'anglais n'en a pas. La familiarité y
 * est portée par autre chose : la CONTRACTION (« I'll », « you're », « doesn't ») et le VERBE
 * À PARTICULE (« show up », « get you online », « keep you posted »). Le transfert donne les
 * six libellés exacts, et surtout les six formes à ne jamais servir — chacune avec sa raison :
 *
 *   « I am Max-Morrys »   la contraction porte le registre
 *   « I educate you »     met une estrade entre nous
 *   « I inform you »      sonne administratif
 *   « I transform you »   publicité de coach de vie
 *   « I digitize you »    « digitize » se dit de documents, pas de commerces
 *   « Contact us »        invente une équipe
 *
 * `voix-tutoiement.test.ts` ne balaie que le français : rien ne gardait l'anglais. Le défaut
 * s'était déjà produit — le pied de page servait « Contact », « FAQ » et surtout « Digital
 * Presence », exactement le mot de plaquette que `segments.ts` refuse pour l'URL, là où le
 * kit écrit « I'll get you online ». La barre haute, elle, était juste : c'est la preuve que
 * le défaut arrive par recopie d'une surface à l'autre, et pas par ignorance.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;
const EN = join(ROOT, 'src/i18n/locales/en');

function load(ns: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(EN, ns), 'utf8'));
}

/** Toutes les chaînes servies, à plat, tous namespaces anglais confondus. */
function everyEnglishString(): [string, string][] {
  const out: [string, string][] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'string') out.push([path, node]);
    else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  for (const f of readdirSync(EN).filter((f) => f.endsWith('.json'))) walk(load(f), f.replace('.json', ''));
  return out;
}

/** Les six verbes, tels que le transfert les écrit. */
const VERBS = {
  about: "I'm Max-Morrys",
  formations: "I'll train you",
  blog: "I'll keep you posted",
  transform: "I'll push you further",
  presence: "I'll get you online",
  contact: 'Talk to me',
} as const;

describe('voix anglaise — les six verbes', () => {
  const nav = load('nav.json') as Record<string, string>;

  for (const [key, expected] of Object.entries(VERBS)) {
    it(`nav.${key} est écrit « ${expected} »`, () => {
      expect(nav[key]).toBe(expected);
    });
  }

  /*
   * Le pied de page reprend quatre des six verbes. C'est LÀ que la dérive s'était produite :
   * la même entrée portait « I'll get you online » en haut et « Digital Presence » en bas.
   */
  it('le pied de page reprend les verbes de la barre haute, mot pour mot', () => {
    const footer = load('footer.json') as { links: Record<string, string> };
    expect(footer.links.formations).toBe(VERBS.formations);
    expect(footer.links.blog).toBe(VERBS.blog);
    expect(footer.links.pole).toBe(VERBS.transform);
    expect(footer.links.presence).toBe(VERBS.presence);
    expect(footer.links.about).toBe(VERBS.about);
    expect(footer.links.contact).toBe(VERBS.contact);
  });

  it('les verbes du design system portent les mêmes valeurs', () => {
    const types = readFileSync(join(ROOT, 'src/design-system/react/types.ts'), 'utf8');
    for (const v of [VERBS.formations, VERBS.blog, VERBS.transform, VERBS.presence]) {
      expect(types).toContain(v);
    }
  });
});

describe('voix anglaise — les formes interdites', () => {
  /**
   * Chacune est refusée pour une raison écrite dans le transfert, § 6 du readme.
   *
   * `legal` et `admin` sont hors périmètre, et ce n'est pas une commodité : dans un document
   * contractuel, c'est la SOCIÉTÉ qui parle — « contact us » y désigne MY ONOMA SARL, et un
   * contrat rédigé à la première personne du singulier ne vaudrait rien. La console, elle,
   * n'est lue que par l'opérateur.
   */
  const FORBIDDEN: [RegExp, string][] = [
    [/\bI am Max-Morrys\b/i, 'la contraction porte le registre'],
    [/\bI educate you\b/i, 'met une estrade entre nous'],
    [/\bI inform you\b/i, 'sonne administratif'],
    [/\bI transform you\b/i, 'publicité de coach de vie'],
    [/\bI digitize you\b/i, '« digitize » se dit de documents, pas de commerces'],
    [/\bContact us\b/i, 'invente une équipe'],
    [/\bour team\b/i, "invente l'équipe que la page à propos nie"],
    [/\bour agency\b/i, 'idem'],
    [/\bour company\b/i, 'idem'],
  ];

  const HORS_VOIX = new Set(['legal', 'admin', 'adminClub']);
  const strings = everyEnglishString().filter(([path]) => !HORS_VOIX.has(path.split('.')[0]));

  it('aucun catalogue anglais ne sert une forme interdite', () => {
    const found: string[] = [];
    for (const [pattern, why] of FORBIDDEN) {
      for (const [path, value] of strings) {
        if (pattern.test(value)) found.push(`${path} → « ${value} » (${why})`);
      }
    }
    expect(found).toEqual([]);
  });

  /*
   * « Digital Presence » reste le NOM de l'offre, et se cite comme tel en prose. Ce qui est
   * interdit, c'est de le servir comme LIBELLÉ DE NAVIGATION à la place du verbe : c'est
   * précisément le mot de plaquette que `segments.ts` refuse déjà pour l'URL. Le défaut
   * s'était produit au pied de page pendant que la barre haute, elle, écrivait le verbe.
   */
  it('aucun libellé de navigation ne remplace un verbe par un nom d’offre', () => {
    const nav = load('nav.json') as Record<string, string>;
    const footer = load('footer.json') as { links: Record<string, string> };
    const labels = [...Object.entries(nav), ...Object.entries(footer.links)];
    const plaquette = labels
      .filter(([, v]) => typeof v === 'string' && /\bDigital Presence\b/i.test(v))
      .map(([k, v]) => `${k} → « ${v} »`);
    expect(plaquette).toEqual([]);
  });
});
