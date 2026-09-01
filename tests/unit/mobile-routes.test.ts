/**
 * TOUT LIEN NATIF MÈNE À UN ÉCRAN QUI EXISTE.
 *
 * expo-router route PAR FICHIERS : une adresse n'est valable que si un fichier porte son nom.
 * Rien ne le vérifie — ni le typecheck, qui accepte n'importe quelle chaîne dans un `href`, ni
 * le lancement, qui n'échoue qu'au moment où quelqu'un touche le lien. Un lien mort survit donc
 * jusqu'à ce qu'une personne le trouve, et il la mène à l'écran « unmatched route ».
 *
 * Ce n'est pas théorique. Sur le PREMIER écran de l'application, les quatre cartes de
 * territoire pointaient sur `/formations`, `/blog` et `/presence` — trois routes qui n'existent
 * pas ici : ce sont les adresses du WEB, recopiées. Trois des quatre portes d'entrée de
 * l'application native étaient donc fermées, et le typecheck était vert.
 *
 * Le test lit les deux formes qu'emploie le dossier — `href="/x"` et `pathname: '/x'` — et les
 * rapproche de l'arborescence de `app/`. Il ignore les liens construits (`/formation?id=${…}`
 * garde son segment, un `href={variable}` n'est pas lisible statiquement) : la valeur est dans
 * le cas simple, qui est aussi celui qui a cassé.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const MOBILE = join(new URL('../..', import.meta.url).pathname, 'mobile');
const APP = join(MOBILE, 'app');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/**
 * Les routes que le système de fichiers déclare. `_layout` n'est pas une route, et les groupes
 * entre parenthèses ne comptent pas dans l'URL — `app/(tabs)/cours.tsx` répond à `/cours`.
 */
function routes(): Set<string> {
  const out = new Set<string>(['/']);
  for (const f of walk(APP)) {
    const rel = f.slice(APP.length + 1).replace(/\.tsx$/, '');
    if (rel.endsWith('_layout') || rel.startsWith('+')) continue;
    const chemin = rel.split('/').filter((s) => !/^\(.*\)$/.test(s)).join('/');
    out.add(chemin === 'index' ? '/' : `/${chemin.replace(/\/index$/, '')}`);
    // Un dossier qui porte un `_layout` répond aussi à son nom nu (`/club`).
    const dossier = rel.split('/').slice(0, -1).filter((s) => !/^\(.*\)$/.test(s)).join('/');
    if (dossier && existsSync(join(APP, rel.split('/').slice(0, -1).join('/'), '_layout.tsx'))) {
      out.add(`/${dossier}`);
    }
  }
  out.add('/(tabs)');            // le groupe est une destination légitime après connexion
  return out;
}

function liens(file: string): string[] {
  const src = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const out: string[] = [];
  const formes = [
    /href=\{?['"]([^'"`]+)['"]/g,
    /href:\s*['"]([^'"`]+)['"]/g,   // les listes déclarent leur cible en données
    /(?:push|replace|navigate)\(\s*['"]([^'"`]+)['"]/g,
    /pathname:\s*['"]([^'"`]+)['"]/g,
  ];
  for (const re of formes) for (const m of src.matchAll(re)) out.push(m[1]);
  return out
    .filter((h) => h.startsWith('/'))
    .map((h) => h.split('?')[0].replace(/\/$/, '') || '/')
    // expo-router accepte le segment de groupe dans une adresse : `/(tabs)/profil` EST `/profil`.
    .map((h) => `/${h.split('/').filter((s) => s && !/^\(.*\)$/.test(s)).join('/')}`);
}

/**
 * Pour la question INVERSE — « qui ouvre cet écran ? » — la position du lien importe moins que
 * le fait qu'une adresse soit NOMMÉE quelque part. Deux destinations légitimes se calculent :
 * `pathname: genre === 'audio' ? '/episode' : '/video'` et le verdict de paiement, qui choisit
 * entre `/succes`, `/echec` et `/attente` d'après l'URL de retour. Les exiger en position de
 * lien pousserait à écrire trois `<Link>` là où une ternaire dit la même chose plus clairement.
 */
function citations(file: string): string[] {
  const src = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return [...src.matchAll(/['"](\/[a-z0-9()\-/]*)['"]/g)].map((m) =>
    `/${m[1].split('/').filter((x) => x && !/^\(.*\)$/.test(x)).join('/')}`,
  );
}

describe('port natif — la carte de navigation se referme', () => {
  const connues = routes();

  it("l'arborescence est bien lue", () => {
    expect(connues.size).toBeGreaterThan(25);
    expect(connues.has('/catalogue')).toBe(true);
  });

  it('aucun écran ne pointe sur une route inexistante', () => {
    const morts: string[] = [];
    for (const f of walk(APP)) {
      for (const h of liens(f)) {
        if (!connues.has(h)) morts.push(`${f.slice(MOBILE.length + 1)} → ${h}`);
      }
    }
    expect(morts).toEqual([]);
  });

  /**
   * L'inverse : un écran qu'aucun lien n'ouvre est du code mort, et il ne se voit pas manquer.
   * Deux exceptions ASSUMÉES — `erreur` et `interdit` sont des DESTINATIONS, atteintes par le
   * code comme `/403` au web. Les inscrire ici les rend délibérées plutôt qu'oubliées.
   */
  it('tout écran est atteignable, sauf les destinations déclarées', () => {
    const DESTINATIONS = new Set(['/erreur', '/interdit', '/', '/(tabs)']);
    const cites = new Set<string>();
    for (const f of walk(APP)) for (const h of citations(f)) cites.add(h);
    const orphelins = [...connues].filter((r) => !cites.has(r) && !DESTINATIONS.has(r));
    // Les onglets sont atteints par la barre, pas par un lien : ils portent leur propre entrée.
    const horsBarre = orphelins.filter((r) => !existsSync(join(APP, '(tabs)', `${r.slice(1)}.tsx`)));
    expect(horsBarre).toEqual([]);
  });
});
