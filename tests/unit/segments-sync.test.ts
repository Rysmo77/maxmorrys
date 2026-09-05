import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

/**
 * LES TROIS TABLES DE SEGMENTS NE DOIVENT PAS DÉRIVER.
 *
 * `src/i18n/segments.ts` est la table du frontend. Elle est RECOPIÉE À LA MAIN dans les
 * Cloud Functions et dans le Worker Cloudflare, qui ne peuvent pas importer le code de
 * l'application. Les trois fichiers le disent en commentaire — et c'est tout ce qui les
 * tenait ensemble.
 *
 * Ça n'a pas tenu. En alignant trois segments anglais sur la table du design system
 * (`digital-presence → local-presence`, `my-space → my-learning`, `login → sign-in`), les
 * trois copies étaient DÉJÀ désynchronisées entre elles sur d'autres valeurs, et rien ne
 * l'avait signalé : ni typecheck, ni lint, ni aucun test.
 *
 * CE QUE COÛTE LA DÉRIVE. Le frontend rend `/en/my-learning` ; le Worker, lui, ne reconnaît
 * `/en/my-space` que sous l'ancien nom, donc il n'y sert plus le bon pré-rendu et l'URL part
 * à l'origine. Le résultat n'est ni une erreur ni une page blanche : c'est une page qui
 * s'affiche, sans ses métadonnées, pour les robots seulement. Personne ne le voit en
 * naviguant — c'est exactement le profil de défaut que ce dépôt écrit des tests pour
 * attraper.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE TEST LAISSAIT PASSER, ET QUI EST ARRIVÉ (03/09/2026).
 *
 * Il ne comparait que les segments PRÉSENTS des deux côtés — « une copie n'a pas à porter
 * TOUS les segments, seulement à ne pas les CONTREDIRE ». Pour une route privée, c'est
 * vrai. Pour une route PUBLIQUE PRÉRENDUE, un segment absent n'est pas neutre : il est
 * une contradiction silencieuse.
 *
 * Trois manquaient dans les deux copies — `podcast-et-videos`, `club-des-digitos`,
 * `verifier` — et ça se payait deux fois :
 *   · `enPath()` laissait le segment FRANÇAIS dans l'URL anglaise, donc le sitemap
 *     publiait `/en/podcast-et-videos`, que `resolveRoute` ne connaît pas ;
 *   · `canonicalizeSegments()` ne ramenait pas `/en/digitos-club` sur `/club-des-digitos`,
 *     donc la vraie page anglaise tombait dans `unknownRouteMeta` — `noindex, nofollow`.
 *
 * Trois pages anglaises étaient donc à la fois mal annoncées au sitemap et activement
 * désindexées. Aucun test rouge, aucune erreur : la seule trace était dans le HTML servi
 * aux robots. Les deux invariants ajoutés plus bas ferment ce trou par construction — ils
 * ne comparent plus des tables, ils vérifient que l'ALLER-RETOUR d'une route publique
 * retombe sur une route publique.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Extrait les paires `fr: 'en'` d'une des trois tables, quel que soit son habillage. */
function readTable(path: string): Record<string, string> {
  const src = readFileSync(path, 'utf8');
  // On neutralise les commentaires : ils citent des valeurs de segments en toutes lettres.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const out: Record<string, string> = {};

  // Frontend : `'mon-espace': { fr: 'mon-espace', en: 'my-learning' },`
  for (const m of code.matchAll(/['"]?([\w-]+)['"]?\s*:\s*\{\s*fr:\s*['"][\w-]+['"]\s*,\s*en:\s*['"]([\w-]+)['"]\s*\}/g)) {
    out[m[1]] = m[2];
  }
  if (Object.keys(out).length > 0) return out;

  // Functions et Worker : `'mon-espace': 'my-learning',`
  for (const m of code.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]([\w-]+)['"]\s*,/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

/** Retire les commentaires : ils citent des chemins en toutes lettres. */
function sansCommentaires(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

/** Les sources exactes routées vers le pré-rendu, telles que `routes.ts` les déclare. */
function prerenderExact(): string[] {
  const src = sansCommentaires('worker/apps/site/src/routes.ts');
  const bloc = src.slice(src.indexOf('PRERENDER_EXACT'), src.indexOf('PRERENDER_PREFIXES'));
  return [...bloc.matchAll(/'(\/[\w/-]*)'/g)].map((m) => m[1]);
}

/** Les préfixes `/xxx/**` routés vers le pré-rendu. */
function prerenderPrefixes(): string[] {
  const src = sansCommentaires('worker/apps/site/src/routes.ts');
  const bloc = src.slice(src.indexOf('PRERENDER_PREFIXES'), src.indexOf('export function normalizePath'));
  return [...bloc.matchAll(/'(\/[\w/-]*\/)'/g)].map((m) => m[1]);
}

/** Les chemins FR listés au sitemap. */
function sitemapStaticPages(): string[] {
  const src = sansCommentaires('worker/apps/site/src/seo/sitemap.ts');
  const bloc = src.slice(src.indexOf('const STATIC_PAGES'));
  return [...bloc.matchAll(/path:\s*'(\/[\w/-]*)'/g)].map((m) => m[1]);
}

const FRONT = 'src/i18n/segments.ts';
/*
 * `functions/src/segments.ts` figurait ici comme troisième copie. Le répertoire `functions/`
 * a été supprimé le 03/09/2026 : plus aucune Cloud Function n'était déployée depuis le
 * passage au plan Spark, et les sondes des deux régions répondaient 404. Il ne reste donc
 * que deux copies à tenir alignées — le frontend et le Worker.
 */
const COPIES = [
  ['Worker Cloudflare', 'worker/apps/site/src/prerender/segments.ts'],
] as const;

describe('table des segments — les deux copies', () => {
  const front = readTable(FRONT);

  it('la table du frontend se lit et n\'est pas vide', () => {
    expect(Object.keys(front).length).toBeGreaterThan(20);
  });

  for (const [nom, path] of COPIES) {
    it(`${nom} donne la même traduction que le frontend pour chaque segment partagé`, () => {
      const copy = readTable(path);
      const ecarts: string[] = [];
      for (const [fr, en] of Object.entries(copy)) {
        // Une copie n'a pas à porter TOUS les segments — seulement à ne pas les CONTREDIRE.
        if (front[fr] !== undefined && front[fr] !== en) {
          ecarts.push(`« ${fr} » : frontend « ${front[fr]} » vs ${nom} « ${en} »`);
        }
      }
      expect(ecarts).toEqual([]);
    });
  }

  it('les trois segments alignés sur la table du design system y sont bien', () => {
    expect(front['presence-digitale']).toBe('local-presence');
    expect(front['mon-espace']).toBe('my-learning');
    expect(front['connexion']).toBe('sign-in');
  });

  /*
   * L'ALLER-RETOUR DES ROUTES PUBLIQUES.
   *
   * `routes.ts` déclare les deux versions de chaque page prérendue. Ces deux tests exigent
   * qu'elles se répondent PAR LA TABLE de la copie concernée : si la copie ignore un
   * segment, `enPath` produit une URL que `routes.ts` ne déclare pas, et le test tombe.
   * C'est la seule formulation qui rende un segment MANQUANT visible.
   */
  for (const [nom, path] of COPIES) {
    const enPathVia = (table: Record<string, string>, frPath: string): string => {
      const localized = frPath
        .split('/')
        .map((seg) => (seg ? (table[seg] ?? seg) : seg))
        .join('/');
      return localized === '/' ? '/en' : `/en${localized}`;
    };

    it(`${nom} — chaque route FR prérendue a sa jumelle EN dans routes.ts`, () => {
      const table = readTable(path);
      const ecarts: string[] = [];

      for (const frPath of prerenderExact().filter((r) => !r.startsWith('/en'))) {
        const en = enPathVia(table, frPath);
        if (!prerenderExact().includes(en)) {
          ecarts.push(`${frPath} → « ${en} », que routes.ts ne déclare pas`);
        }
      }
      for (const frPrefix of prerenderPrefixes().filter((r) => !r.startsWith('/en'))) {
        // Le préfixe porte un slash final : on traduit le chemin, pas le vide qui suit.
        const en = `${enPathVia(table, frPrefix.replace(/\/$/, ''))}/`;
        if (!prerenderPrefixes().includes(en)) {
          ecarts.push(`${frPrefix} → « ${en} », que routes.ts ne déclare pas`);
        }
      }

      expect(
        ecarts,
        "Un segment absent de la copie laisse le mot français dans l'URL anglaise : "
          + 'le sitemap publie une adresse que le Worker renvoie à l\'origine, sans méta.',
      ).toEqual([]);
    });

    it(`${nom} — chaque page du sitemap a une URL anglaise réellement prérendue`, () => {
      const table = readTable(path);
      const ecarts: string[] = [];

      for (const frPath of sitemapStaticPages()) {
        const en = enPathVia(table, frPath);
        const routee =
          prerenderExact().includes(en) || prerenderPrefixes().some((p) => en.startsWith(p));
        if (!routee) ecarts.push(`${frPath} → « ${en} » n'est pas une route prérendue`);
      }

      expect(
        ecarts,
        'Le sitemap annoncerait à Google des URL anglaises sans pré-rendu.',
      ).toEqual([]);
    });
  }
});

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * LA TROISIÈME COPIE DES SEGMENTS EST DANS `robots.txt`, ET PERSONNE NE LA REGARDAIT.
 *
 * Le fichier listait `Disallow: /en/my-space` alors que le segment anglais de
 * `mon-espace` valait `my-learning` depuis son alignement sur la table du design system.
 * La ligne protégeait donc une URL qui REDIRIGE (301 vers `/en/my-learning`), pendant que
 * l'espace apprenant anglais — qui répond 200 — restait ouvert à l'indexation.
 *
 * C'est le même profil de défaut que tout ce fichier traque, avec un cran de plus : un
 * `Disallow` qui ne correspond à aucune route ne produit AUCUNE erreur, nulle part. Ni
 * chez Google, qui l'ignore en silence, ni au build, qui recopie le fichier tel quel.
 * Le seul symptôme est une page privée qui apparaît dans un index — c'est-à-dire trop tard.
 * ─────────────────────────────────────────────────────────────────────────────
 */
describe('robots.txt — les chemins protégés existent vraiment', () => {
  const disallows = readFileSync('public/robots.txt', 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('Disallow:'))
    .map((l) => l.slice('Disallow:'.length).trim())
    .filter(Boolean);

  const fr = disallows.filter((p) => !p.startsWith('/en/'));
  const en = disallows.filter((p) => p.startsWith('/en/'));

  it('le relevé trouve les deux familles de chemins', () => {
    expect(fr.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
  });

  it('chaque chemin FR protégé a son équivalent anglais, traduit par la table', () => {
    const front = readTable(FRONT);
    const ecarts: string[] = [];

    for (const frPath of fr) {
      // `/403` n'a pas de traduction : un segment absent de la table se recopie tel quel.
      const attendu = `/en${frPath.split('/').map((seg) => (seg ? (front[seg] ?? seg) : seg)).join('/')}`;
      if (!en.includes(attendu)) {
        ecarts.push(`${frPath} → « ${attendu} » manque dans robots.txt`);
      }
    }

    expect(
      ecarts,
      'Une route privée est protégée en français et ouverte en anglais.',
    ).toEqual([]);
  });

  it('aucun chemin anglais protégé n’est le fantôme d’un ancien segment', () => {
    const front = readTable(FRONT);
    const anglaisConnus = new Set(Object.values(front));
    const ecarts: string[] = [];

    for (const enPath of en) {
      const premier = enPath.split('/')[2];
      // Un segment purement numérique est un code de statut (`/en/403`), pas une traduction.
      if (!premier || /^\d+$/.test(premier)) continue;
      if (!anglaisConnus.has(premier)) {
        ecarts.push(`« ${premier} » n'est la traduction d'aucun segment — chemin mort`);
      }
    }

    expect(
      ecarts,
      'Un Disallow qui ne vise aucune route ne protège rien, et ne signale rien.',
    ).toEqual([]);
  });
});
