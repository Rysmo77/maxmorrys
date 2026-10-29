import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import {
  CORRESPONDANCES, cheminLogique, espaceDeHote, origineEspace, placer, type Espace,
} from '../../src/lib/espaces';

/**
 * LA TABLE DES TROIS HÔTES (PRD rév. 6, §2.1). Ce qui doit tenir : chaque correspondance fait
 * l'aller-retour, deux chemins logiques ne se disputent pas une adresse physique, et chaque
 * segment physique a sa traduction anglaise — sinon `/en` servirait un segment français.
 */

const espacesDe = (e: Espace | readonly Espace[]) => (typeof e === 'string' ? [e] : e);

describe('placer / cheminLogique', () => {
  it('chaque correspondance fait l’aller-retour', () => {
    for (const c of CORRESPONDANCES) {
      for (const e of espacesDe(c.espace)) {
        const place = placer(c.ancien, e);
        expect(place, c.ancien).toEqual({ espace: e, chemin: c.nouveau });
        if (!c.alias) expect(cheminLogique(e, c.nouveau), c.nouveau).toBe(c.ancien);
      }
    }
  });

  it('le sous-arbre suit, sauf sur une correspondance exacte', () => {
    expect(placer('/formations/seo-local')).toEqual({ espace: 'edu', chemin: '/formations/seo-local' });
    expect(placer('/mon-espace/quiz/m1')).toEqual({ espace: 'edu', chemin: '/quiz/m1' });
    expect(placer('/mon-espace/club/membres/u1')).toEqual({ espace: 'club', chemin: '/membres/u1' });
    expect(placer('/apprendre/autre')).toEqual({ espace: 'hub', chemin: '/apprendre/autre' });
    expect(cheminLogique('edu', '/cours/seo')).toBe('/cours/seo');
    expect(cheminLogique('edu', '/mes-formations')).toBe('/mon-espace/cours');
  });

  it('les écrans de compte restent sur l’hôte courant ; le retour de paiement sur edu. ou club.', () => {
    expect(placer('/connexion', 'club')).toEqual({ espace: 'club', chemin: '/connexion' });
    expect(placer('/paiement/retour', 'club').espace).toBe('club');
    expect(placer('/paiement/retour', 'hub').espace).toBe('edu');
  });

  it('aucune adresse physique n’est revendiquée par deux chemins logiques sur un même hôte', () => {
    const vus = new Map<string, string>();
    for (const c of CORRESPONDANCES.filter((x) => !x.alias)) {
      for (const e of espacesDe(c.espace)) {
        const cle = `${e}${c.nouveau}`;
        expect(vus.get(cle) ?? c.ancien, cle).toBe(c.ancien);
        vus.set(cle, c.ancien);
      }
    }
  });

  it('chaque segment physique figure dans la table des segments (sinon `/en` le laisse en français)', () => {
    const table = readFileSync('src/i18n/segments.ts', 'utf8');
    for (const c of CORRESPONDANCES) {
      for (const seg of c.nouveau.split('/').filter(Boolean)) {
        if (seg === 'r') continue; // `/r/<code>` : identique dans les deux langues, par choix
        expect(new RegExp(`['"]?${seg}['"]?\\s*:\\s*\\{\\s*fr:`).test(table), seg).toBe(true);
      }
    }
  });
});

describe('hôtes et origines', () => {
  it('l’hôte dit l’espace', () => {
    expect(espaceDeHote('edu.maxmorrys.me')).toBe('edu');
    expect(espaceDeHote('club.localhost')).toBe('club');
    expect(espaceDeHote('maxmorrys.me')).toBe('hub');
    expect(espaceDeHote('max-morrys.web.app')).toBe('hub');
  });

  it('les origines suivent la production, et le port en développement', () => {
    expect(origineEspace('edu', 'https://maxmorrys.me')).toBe('https://edu.maxmorrys.me');
    expect(origineEspace('hub', 'https://club.maxmorrys.me')).toBe('https://maxmorrys.me');
    expect(origineEspace('club', 'http://localhost:5173')).toBe('http://club.localhost:5173');
    expect(origineEspace('hub', 'http://edu.localhost:5173')).toBe('http://localhost:5173');
    expect(origineEspace('edu', 'https://max-morrys.web.app')).toBe('https://edu.maxmorrys.me');
  });
});
