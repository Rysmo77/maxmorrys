/**
 * UN LIEN INTERNE POINTE SUR UNE ROUTE QUI EXISTE.
 *
 * Le bandeau hors connexion — la seule sortie de l'état où la personne n'a plus de réseau —
 * pointait sur `/hors-connexion`. La route déclarée est `mon-espace/hors-connexion` : le lien
 * tombait donc sur la 404, exactement au moment où il n'y a plus de réseau pour se rattraper.
 *
 * Rien ne pouvait le voir : `path()` accepte n'importe quelle chaîne, le typecheck ne connaît
 * pas les routes, et le lint non plus. Le défaut n'apparaît qu'au clic, sur un état que
 * personne ne reproduit en développement.
 *
 * CE QUE CE TEST VÉRIFIE, ET CE QU'IL NE VÉRIFIE PAS. Il compare le PREMIER SEGMENT de chaque
 * lien interne littéral à l'ensemble des segments de premier niveau déclarés dans `App.tsx`.
 * C'est volontairement grossier : reconstruire l'arbre imbriqué depuis le source serait un
 * analyseur fragile, qui casserait à la première refonte de `App.tsx` sans qu'aucune route
 * soit fausse. Le premier segment suffit à attraper la famille de défauts qui se produit
 * vraiment — un chemin enfant écrit comme s'il était à la racine.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) out.push(p);
  }
  return out;
}

/** Les segments de premier niveau déclarés par la table de routes. */
function declaredTopSegments(): Set<string> {
  const app = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8');
  const segments = [...app.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
  const top = new Set<string>();
  for (const s of segments) {
    const first = s.replace(/^\//, '').split('/')[0];
    if (first && first !== '*') top.add(first);
  }
  // La racine et le préfixe de langue, qui ne sont pas des segments nommés.
  top.add('');
  top.add('en');
  return top;
}

/**
 * Les liens internes littéraux : `path('/x')`, `to="/x"`, `href="/x"`.
 * Les chaînes interpolées et les URL absolues sont hors de portée — on ne vérifie que ce
 * qu'on peut lire sans exécuter le code.
 */
function internalLinks(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  const found = new Set<string>();
  for (const re of [/path\(\s*'(\/[^']*)'/g, /\bto="(\/[^"]*)"/g, /\bhref="(\/[^"]*)"/g]) {
    for (const m of src.matchAll(re)) found.add(m[1]);
  }
  return [...found];
}

describe('liens internes', () => {
  const top = declaredTopSegments();
  const files = walk(join(ROOT, 'src'));

  it('la table de routes expose bien ses segments', () => {
    // Garde-fou du test lui-même : si l'extraction casse, il ne doit pas passer en silence.
    expect(top.size).toBeGreaterThan(20);
    for (const s of ['mon-espace', 'blog', 'formations', 'admin', 'verifier']) {
      expect(top.has(s)).toBe(true);
    }
  });

  it('chaque lien interne commence par un segment déclaré', () => {
    const dead: string[] = [];
    for (const file of files) {
      for (const link of internalLinks(file)) {
        // Les fragments purs (`/#ancre`) et les fichiers servis hors routeur restent hors jeu.
        if (link.startsWith('/#') || /\.(xml|txt|json|ico|png|svg|webmanifest)$/.test(link)) continue;
        const first = link.replace(/^\//, '').split(/[/?#]/)[0];
        if (!top.has(first)) dead.push(`${file.slice(ROOT.length)} → ${link}`);
      }
    }
    expect(dead).toEqual([]);
  });

  /** Le cas précis qui a motivé ce test : la sortie de l'état hors connexion. */
  it("le bandeau hors connexion mène à l'écran hors connexion", () => {
    const banner = readFileSync(join(ROOT, 'src/components/states/OfflineBanner.tsx'), 'utf8');
    expect(banner).toContain("path('/mon-espace/hors-connexion')");
    expect(banner).not.toContain("path('/hors-connexion')");
  });
});
