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
    else if (/\.tsx?$/.test(p) && !p.endsWith('.generated.ts')) out.push(p);
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
    if (!f.endsWith('.tsx')) continue;
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

/**
 * ⚠️ DETTE DATÉE (04/10/2026) : des écrans du kit qu'aucun écran de production n'ouvre.
 * La planche les citait, ce qui les cachait. Les brancher, c'est :
 * (05/10/2026 : la liste est VIDE. `/hors-connexion` s'ouvre depuis le bandeau de coupure.)
 * (`/devis` en est sorti le 05/10/2026 : il s'ouvre depuis une référence saisie sur `/presence`.
 *  `/chargement` aussi : ce n'est plus une route mais l'état de chargement d'Espace.)
 * Cette liste ne peut que RACCOURCIR (voir le dernier cas).
 */
const ORPHELINS_CONNUS: string[] = [];

describe('port natif — la carte de navigation se referme', () => {
  const connues = routes();

  it("l'arborescence est bien lue", () => {
    expect(connues.size).toBeGreaterThan(25);
    /* Garde-fou du test, pas une assertion de produit : `/cours` est l'onglet du catalogue.
       Il a remplacé `/catalogue`, qui rendait un SECOND catalogue — deux écrans pour la même
       liste, dont un que rien n'ouvrait plus une fois l'onglet en place. */
    expect(connues.has('/cours')).toBe(true);
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
    /* `/acces` est ouvert par le SITE (`rysmo://acces`, page de retour) — jamais depuis
       l'application, qui n'encaisse rien. `mobile-miroirs.test.ts` garde ce lien. */
    const DESTINATIONS = new Set(['/erreur', '/interdit', '/', '/acces']);
    const cites = new Set<string>();
    /*
     * ⛔ LA PLANCHE EST EXCLUE, ET SANS ELLE CE TEST ÉTAIT AVEUGLE. `apercu.tsx` écrit les 48
     * adresses en dur : toute route y était donc « citée », et le test restait vert alors
     * qu'aucun écran de PRODUCTION ne menait à quatorze d'entre elles — dont le lancement,
     * point d'entrée de l'application. Mesuré par la réécriture Kotlin, reporté ici.
     */
    for (const f of walk(APP)) {
      if (f.endsWith(`${'/'}apercu.tsx`)) continue;
      for (const h of citations(f)) cites.add(h);
    }
    /* Les tables de navigation vivent aussi dans `contenu/` (la portée du support), et les
       composants d'écran partagés dans `ecrans/` (le bandeau de coupure). */
    for (const d of ['contenu', 'ecrans']) for (const f of walk(join(MOBILE, d))) for (const h of citations(f)) cites.add(h);
    const orphelins = [...connues].filter((r) => !cites.has(r) && !DESTINATIONS.has(r));
    // Les onglets sont atteints par la barre, pas par un lien : ils portent leur propre entrée.
    const horsBarre = orphelins.filter((r) => !existsSync(join(APP, '(tabs)', `${r.slice(1)}.tsx`)));
    expect(horsBarre.filter((r) => !ORPHELINS_CONNUS.includes(r)), 'écrans que rien n’ouvre').toEqual([]);
  });

  it('la dette des écrans orphelins ne fait que descendre', () => {
    /* Une route branchée depuis doit SORTIR de la liste : une dette remboursée sans le dire
       redevient un cas ignoré. */
    const cites = new Set<string>();
    for (const f of walk(APP)) if (!f.endsWith(`${'/'}apercu.tsx`)) for (const h of citations(f)) cites.add(h);
    for (const d of ['contenu', 'ecrans']) for (const f of walk(join(MOBILE, d))) for (const h of citations(f)) cites.add(h);
    expect(ORPHELINS_CONNUS.filter((r) => cites.has(r)), 'branchés, mais encore listés comme dette').toEqual([]);
  });

  it('`/` mène au lancement, et le lancement à l’accueil', () => {
    /* La chaîne de première ouverture était écrite et jamais exécutée : sans `app/index.tsx`,
       `/` ouvrait l'onglet Espace. C'est ce qui avait été vu et signalé. */
    expect(existsSync(join(APP, '(tabs)', 'index.tsx')), "un onglet reprendrait `/` au lancement").toBe(false);
    expect(liens(join(APP, 'index.tsx'))).toEqual(['/lancement']);
    expect(liens(join(APP, 'lancement.tsx'))).toEqual(expect.arrayContaining(['/onboarding', '/espace']));
    /* L'accueil finit sur le CHOIX DE COMPTE (06/10/2026) : `/permissions` ne demandait
       rien au système, il a rejoint l'atelier. La biométrie, elle, se propose APRÈS la
       première connexion (`donnees/accueil.ts`). */
    expect(liens(join(APP, 'onboarding.tsx'))).toEqual(expect.arrayContaining(['/creation', '/connexion']));
  });
});
