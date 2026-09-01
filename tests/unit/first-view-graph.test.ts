import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUE LA PREMIÈRE VUE A LE DROIT DE CHARGER.
 *
 * Vite émet un `<link rel="modulepreload">` pour tout chunk atteignable par le graphe
 * d'imports **statiques** de l'entrée. Un seul `import` mal placé suffit donc à faire
 * télécharger un SDK entier à quelqu'un qui lit l'accueil.
 *
 * C'est arrivé avec Firestore : **90 Ko gzip** préchargés sur toutes les pages. Cinq
 * arêtes le tiraient, et aucune n'était évidente —
 *
 *   · `AuthContext` → `config/firebase` (qui exportait `db`)
 *   · `Home` → `lib/firestore` — le BARILLET, `export *` sur quatorze modules
 *   · `LanguageContext` → `lib/firestore/users`
 *   · `PopupManager` → `lib/popups/settings` → `lib/firestore/admin`
 *   · `Header` → `AnnouncementBanner` → `lib/firestore/admin`
 *
 * Toutes ces lectures sont ASYNCHRONES et arrivent après le montage : l'import
 * dynamique ne change rien au comportement, et le SDK descend en parallèle du premier
 * rendu au lieu de le précéder. Première vue : 356,6 → 296,4 Ko gzip.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE TEST LIT LES SOURCES ET NON `dist/`
 *
 * Il tournerait aussi bien sur `dist/index.html`, mais il exigerait alors une build —
 * donc il ne protégerait rien en développement, et rien avant l'étape de build en CI.
 * En marchant le graphe des sources, il échoue à la seconde où quelqu'un écrit
 * l'import, avec le chemin complet qui l'a fait entrer.
 *
 * ⚠️ `import type` est EXCLU : TypeScript l'efface, il ne crée aucune arête. Les
 * confondre ferait échouer le test sur du code parfaitement correct.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SRC = resolve(__dirname, '../../src');
const ENTRY = join(SRC, 'main.tsx');

/** Paquets qui n'ont RIEN à faire dans le graphe statique de l'entrée. */
const FORBIDDEN = ['firebase/firestore'];

/** `import ... from '...'` et `import '...'`, mais jamais `import type ...`. */
const IMPORT = /^\s*import\s+(?!type\s)(?:([^'"]*?)\s+from\s+)?['"]([^'"]+)['"]/gm;

function resolveSpec(from: string, spec: string): string | null {
  let base: string;
  if (spec === '@ds' || spec.startsWith('@ds/')) base = join(SRC, 'design-system', 'index');
  else if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null;

  for (const cand of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx'), base]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand;
  }
  return null;
}

/** Chaîne d'imports depuis l'entrée jusqu'au premier module qui touche `pkg`. */
function chainTo(pkg: string): string[] | null {
  const seen = new Set<string>();
  const parent = new Map<string, string>();
  const stack = [ENTRY];

  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);

    let source: string;
    try { source = readFileSync(file, 'utf8'); } catch { continue; }

    /* Les imports DYNAMIQUES sont invisibles pour cette expression, et c'est tout
       l'intérêt : ce sont eux qui sortent un module de la première vue. */
    for (const m of source.matchAll(IMPORT)) {
      const spec = m[2];
      if (spec === pkg) {
        const chain: string[] = [];
        let cur: string | undefined = file;
        while (cur) { chain.push(relative(SRC, cur) || 'main.tsx'); cur = parent.get(cur); }
        return chain;
      }
      const target = resolveSpec(file, spec);
      if (target && !seen.has(target)) {
        parent.set(target, file);
        stack.push(target);
      }
    }
  }
  return null;
}

describe('première vue — le graphe statique de l\'entrée', () => {
  it.each(FORBIDDEN)('n\'atteint jamais « %s »', (pkg) => {
    const chain = chainTo(pkg);
    expect(
      chain,
      chain
        ? `« ${pkg} » redevient statique depuis l'entrée, donc préchargé sur TOUTES les pages :\n\n`
          + `  ${chain.join('\n    ← ')}\n\n`
          + 'Le charger en `await import()` au point d\'usage : ces lectures sont déjà '
          + 'asynchrones, le comportement ne change pas.'
        : '',
    ).toBeNull();
  });

  it('atteint bien firebase/auth — sinon le test ne prouverait rien', () => {
    /* Contrôle du contrôle : si la marche du graphe était cassée, elle ne trouverait
       RIEN et le test ci-dessus passerait pour de mauvaises raisons. L'authentification,
       elle, DOIT être statique — on doit savoir au démarrage si quelqu'un est connecté. */
    expect(chainTo('firebase/auth')).not.toBeNull();
  });
});
