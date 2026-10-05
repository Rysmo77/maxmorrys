import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ajouter, identifiant, vider, type EnFile, type Issue } from '../../mobile/donnees/file';
import { garder, octetsUtf8, poids, PLAFOND_OCTETS, type Gardee } from '../../mobile/donnees/garde';
import { blocs, segmenter } from '../../mobile/ecrans/contenu';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE MODE HORS CONNEXION — ses trois cœurs purs.
 *
 * Avant le 05/10/2026, l'écran « Hors connexion » promettait des leçons téléchargées et
 * une file d'envoi qui n'existaient pas. Ces cœurs les font exister ; ce fichier tient
 * les règles qui empêchent qu'elles mentent à leur tour.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const coche = (leconId: string, faite: boolean, id = leconId): EnFile => ({
  id, titre: `Leçon ${leconId}`, faitLe: '2026-10-05T10:00:00Z',
  operation: { type: 'marquerLecon', params: { formationId: 'f1', leconId, faite } },
});
const note = (texte: string): EnFile => ({
  id: texte, titre: 'Note', faitLe: '2026-10-05T10:00:00Z',
  operation: { type: 'ecrireUneNote', params: { texte, idClient: identifiant() } },
});

describe('la file d’envoi', () => {
  it('cocher puis décocher la même leçon ne laisse que le dernier état, à la place du premier', () => {
    let f: EnFile[] = [];
    f = ajouter(f, coche('a', true));
    f = ajouter(f, coche('b', true));
    f = ajouter(f, coche('a', false, 'autre'));
    expect(f.map((e) => e.operation.type === 'marquerLecon' && [e.operation.params.leconId, e.operation.params.faite]))
      .toEqual([['a', false], ['b', true]]);
    expect(f[0].id).toBe('a');
  });

  it('deux notes ne fusionnent jamais', () => {
    expect(ajouter(ajouter([], note('un')), note('deux'))).toHaveLength(2);
  });

  it('s’arrête au premier échec de transport, sans changer l’ordre', async () => {
    const issues: Issue[] = ['envoye', 'transport', 'envoye'];
    const envoyes: string[] = [];
    const bilan = await vider([coche('a', true), coche('b', true), coche('c', true)], async (e) => {
      envoyes.push(e.id);
      return issues[envoyes.length - 1];
    });
    expect(envoyes).toEqual(['a', 'b']);
    expect(bilan.restantes.map((e) => e.id)).toEqual(['b', 'c']);
    expect(bilan.envoyees.map((e) => e.id)).toEqual(['a']);
  });

  it('un refus du serveur écarte le geste, garde son motif, et la file continue', async () => {
    const bilan = await vider([coche('a', true), coche('b', true)], async (e) =>
      (e.id === 'a' ? { refus: 'Cette leçon n’appartient pas à cette formation.' } : 'envoye'));
    expect(bilan.restantes).toEqual([]);
    expect(bilan.ecartees).toHaveLength(1);
    expect(bilan.ecartees[0].motif).toMatch(/n’appartient pas/);
    expect(bilan.envoyees.map((e) => e.id)).toEqual(['b']);
  });

  it('l’identifiant d’une note est un UUID v4 que le serveur accepte', () => {
    const FORME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    for (let i = 0; i < 50; i += 1) expect(identifiant()).toMatch(FORME);
    expect(new Set(Array.from({ length: 200 }, () => identifiant())).size).toBe(200);
  });
});

describe('les leçons gardées', () => {
  const g = (cle: string, octets: number, gardeeLe: string): Gardee => ({
    cle, formationId: 'f1', leconId: cle, titre: cle, moduleTitre: null, octets, gardeeLe, videoEnLigne: false,
  });

  it('le plafond évince la plus ANCIENNE, jamais celle qu’on vient de garder', () => {
    const index = [g('vieille', 3, '2026-01-01'), g('recente', 3, '2026-06-01')];
    const r = garder(index, g('nouvelle', 5, '2026-10-05'), 10);
    expect(r.evincees.map((e) => e.cle)).toEqual(['vieille']);
    expect(r.index.map((e) => e.cle).sort()).toEqual(['nouvelle', 'recente']);
    /* Même plus lourde que le plafond, la nouvelle reste : garder doit garder. */
    expect(garder(index, g('enorme', 50, '2026-10-05'), 10).index.map((e) => e.cle)).toEqual(['enorme']);
  });

  it('regarder une leçon déjà gardée la remplace sans la compter deux fois', () => {
    const r = garder([g('a', 4, '2026-01-01')], g('a', 6, '2026-10-05'), 10);
    expect(r.index).toHaveLength(1);
    expect(r.evincees).toEqual([]);
  });

  it('le poids est mesuré en UTF-8 et écrit en clair', () => {
    expect(octetsUtf8('é')).toBe(2);
    expect(octetsUtf8('a€')).toBe(4);
    expect(poids(2048)).toBe('2 Ko');
    expect(poids(PLAFOND_OCTETS)).toBe('5,0 Mo');
  });
});

describe('le texte d’une leçon', () => {
  it('lit le Markdown du site', () => {
    const b = blocs('# Titre\n\nUn **gras** et un *italique*.\n\n- un\n- deux\n\n1. premier\n\n> citation');
    expect(b.map((x) => x.type)).toEqual(['titre', 'paragraphe', 'liste', 'liste', 'citation']);
    expect(b[1].type === 'paragraphe' && b[1].segments).toEqual([
      { texte: 'Un ' }, { texte: 'gras', gras: true }, { texte: ' et un ' }, { texte: 'italique', italique: true }, { texte: '.' },
    ]);
  });

  it('lit aussi le HTML d’un éditeur, sans rien exécuter', () => {
    const b = blocs('<h2>Plan</h2><p>Voir <a href="https://maxmorrys.me">le site</a> &amp; <strong>agir</strong></p><ul><li>A</li><li>B</li></ul><script>alert(1)</script>');
    expect(b[0]).toEqual({ type: 'titre', niveau: 2, segments: [{ texte: 'Plan' }] });
    expect(b[1].type === 'paragraphe' && b[1].segments).toContainEqual({ texte: 'le site', lien: 'https://maxmorrys.me' });
    expect(b[2].type === 'liste' && b[2].items.length).toBe(2);
    expect(JSON.stringify(b)).not.toContain('alert');
  });

  it('un lien `javascript:` reste du texte', () => {
    expect(segmenter('[clic](javascript:alert(1))')).toEqual([{ texte: 'clic' }, { texte: ')' }]);
  });
});

describe('le branchement — ce que les cœurs purs ne voient pas', () => {
  const lire = (p: string) => readFileSync(resolve(__dirname, '../../mobile', p), 'utf8');
  const sansCommentaires = (c: string) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('cocher une leçon et écrire une note passent par la file sur un échec de transport — et seulement là', () => {
    const index = sansCommentaires(lire('donnees/index.ts'));
    for (const nom of ['marquerLecon', 'ecrireUneNote']) {
      const corps = index.slice(index.indexOf(`export async function ${nom}(`));
      const fin = corps.indexOf('\n}\n');
      const fonction = corps.slice(0, fin);
      expect(fonction, nom).toMatch(/if \(!estUnEchecDeTransport\(e\)\) throw e;/);
      expect(fonction, nom).toMatch(/await mettreEnFile\(/);
      /* Le geste part TOUJOURS d'abord : aucune lecture du réseau avant l'appel. */
      expect(fonction, nom).not.toMatch(/etatDuReseau|getNetworkStateAsync|useReseau/);
    }
    expect(index).toMatch(/idClient: identifiant\(\)/);
  });

  it('tout est rangé par compte, et la suppression du compte efface tout', () => {
    const hl = lire('donnees/hors-ligne.ts');
    expect(hl).toMatch(/`rysmo\.horsligne\.\$\{uid\}\.\$\{quoi\}`/);
    const suppression = sansCommentaires(lire('app/suppression.tsx'));
    expect(suppression.indexOf('effacerHorsLigne(uid)')).toBeGreaterThan(-1);
    expect(suppression.indexOf('effacerHorsLigne(uid)')).toBeLessThan(suppression.indexOf('await deconnexion()'));
  });

  it('la file part toute seule : la veille est montée à la racine', () => {
    const racine = lire('app/_layout.tsx');
    expect(racine).toContain('<VeilleHorsLigne />');
    expect(racine).toMatch(/useRetourDuReseau\(/);
  });

  it('les écrans hors connexion lisent l’appareil, plus la démonstration', () => {
    for (const f of ['app/hors-connexion.tsx', 'app/telechargements.tsx', 'app/lecon.tsx']) {
      expect(lire(f), f).not.toMatch(/contenu\/demo/);
      expect(lire(f), f).toMatch(/useHorsLigne/);
    }
  });
});

