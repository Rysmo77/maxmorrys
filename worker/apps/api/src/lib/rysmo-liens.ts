import { cheminLogique, espaceDeHote, origineEspace, placer } from '../../../../../src/lib/espaces';
import { canonicalizeSegments } from '../../../site/src/prerender/segments';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE FILTRE DES LIENS DE RYSMO — un lien maxmorrys qui ne mène nulle part ne reste pas.
 *
 * L'ancien filtre (`sanitizeInternalLinks`) ne regardait que les chemins RELATIFS de quatre
 * types (`/blog`, `/podcasts`, `/videos`, `/formations`). Le test à l'aveugle du 01/11/2026
 * a montré ses deux trous :
 *   - `[Adhésion](/club/adhesion)` passait : `/club` n'était pas un type contrôlé ;
 *   - `https://edu.maxmorrys.me/formations/<slug-inventé>/module-2/lecon-2-3` était
 *     TRONQUÉ — le motif relatif mordait au milieu de l'URL absolue et laissait une autre
 *     adresse fausse.
 *
 * LA RÈGLE. Tout lien vers un hôte maxmorrys (relatif, `maxmorrys.me`, `www.`, `edu.`,
 * `club.`, et n'importe quel autre sous-domaine) est ramené à son chemin LOGIQUE par la
 * table des espaces (`src/lib/espaces.ts`, la même que le Worker `site`). Il est conservé
 * seulement si ce chemin est :
 *   - une page publique réelle (`PAGES_PUBLIQUES`, recoupée par test avec `static-pages.ts`) ;
 *   - ou un contenu du catalogue injecté (articles, podcasts, vidéos, formations publiés, et
 *     formations de l'élève) — la liste `validPaths` construite par le handler.
 * Sinon le lien perd son URL : le texte d'un lien markdown reste, une URL nue disparaît.
 * Un sous-domaine qui ne sert pas de pages (`media.`, `api.`…) n'est jamais conservé.
 *
 * Une URL absolue conservée est réécrite à son adresse PUBLIQUE canonique
 * (`maxmorrys.me/club-des-digitos/adhesion` → `https://club.maxmorrys.me/adhesion`). Un lien
 * relatif reste relatif : le widget du site n'affiche que ceux-là, et le Worker `site`
 * redirige un chemin logique vers le bon sous-domaine.
 *
 * LES LIENS EXTERNES NE SONT PAS TOUCHÉS, ET C'EST VOULU. La base de connaissance en cite
 * elle-même (LinkedIn, YouTube, Instagram…) et les leçons en prescrivent
 * (business.google.com) ; une liste blanche courte en retirerait de légitimes à chaque
 * nouvelle leçon. Le risque est borné ailleurs : le widget du site ne rend cliquable AUCUNE
 * URL absolue (DOMPurify, `RysmoWidget.tsx`), et une URL externe inventée se voit — elle ne
 * se fait pas passer pour une page de la plateforme, ce qui était le vrai défaut.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Pages publiques réelles, en chemins LOGIQUES français. Ce sont les clés de `staticPages`
 * (`worker/apps/site/src/prerender/static-pages.ts`) — `test/rysmo-liens.test.ts` le vérifie —
 * plus les deux portes du compte.
 */
export const PAGES_PUBLIQUES: ReadonlySet<string> = new Set([
  '/',
  '/a-propos',
  '/blog',
  '/formations',
  '/podcasts',
  '/videos',
  '/podcast-et-videos',
  '/club-des-digitos',
  '/club-des-digitos/sessions',
  '/club-des-digitos/adhesion',
  '/verifier',
  '/faq',
  '/contact',
  '/conception',
  '/conception/commerces-et-tpe',
  '/conception/projets-sur-mesure',
  '/conception/realisations',
  '/apprendre',
  '/apprendre/methode',
  '/apprendre/assistant',
  '/legal/mentions-legales',
  '/legal/confidentialite',
  '/legal/cgv',
  '/legal/cgu',
  '/legal/cookies',
  '/connexion',
  '/inscription',
]);

/** Les sous-domaines qui servent des pages. Les autres (`media.`, `api.`) n'en servent pas. */
const HOTES_DE_PAGES = /^(?:(?:www|edu|club)\.)?maxmorrys\.me$/;

function normPath(path: string): string {
  const p = path.trim().toLowerCase().split(/[?#]/)[0].replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

/** `/en/...` → chemin français canonique ; le reste inchangé. */
function sansAnglais(path: string): string {
  if (path === '/en') return '/';
  if (path.startsWith('/en/')) return canonicalizeSegments(path.slice(3)) || '/';
  return path;
}

type Verdict = { garder: false } | { garder: true; url: string };

/**
 * Juge UN lien. `url` est relative (`/blog/x`), absolue (`https://edu.maxmorrys.me/x`) ou
 * sans protocole (`club.maxmorrys.me/adhesion`). Renvoie `null` pour un lien externe.
 */
export function jugerLien(url: string, validPaths: ReadonlySet<string>): Verdict | null {
  const brut = url.trim();
  const valide = (logique: string) => PAGES_PUBLIQUES.has(logique) || validPaths.has(logique);

  if (brut.startsWith('/') && !brut.startsWith('//')) {
    const logique = normPath(sansAnglais(normPath(brut)));
    return valide(logique) ? { garder: true, url: brut } : { garder: false };
  }

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(brut) ? brut : `https://${brut.replace(/^\/\//, '')}`);
  } catch {
    return null;
  }
  const hote = parsed.hostname.toLowerCase();
  if (hote !== 'maxmorrys.me' && !hote.endsWith('.maxmorrys.me')) return null; // externe
  if (!HOTES_DE_PAGES.test(hote)) return { garder: false };

  let chemin: string;
  try {
    chemin = decodeURIComponent(parsed.pathname);
  } catch {
    return { garder: false };
  }
  const espace = espaceDeHote(hote);
  const physique = normPath(sansAnglais(normPath(chemin)));
  const logique = normPath(cheminLogique(espace, physique));
  if (!valide(logique)) return { garder: false };

  const place = placer(logique);
  const canonique = `${origineEspace(place.espace, 'https://maxmorrys.me')}${place.chemin === '/' ? '' : place.chemin}`;
  // Déjà la bonne adresse, à l'écriture près (protocole, `/` final) : on garde ce qu'a écrit le modèle.
  const forme = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^\/\//, '').replace(/\/+$/, '');
  return { garder: true, url: forme(canonique) === forme(brut) ? brut : canonique };
}

/** Un lien markdown `[texte](url)`, l'URL sans espace ni parenthèse fermante. */
const LIEN_MARKDOWN = /\[([^\]\n]+)\]\(\s*([^)\s]+)\s*\)/g;

/** Une URL maxmorrys nue, avec ou sans protocole. S'arrête avant la ponctuation finale. */
const URL_MAXMORRYS =
  /(?<![\w@./-])(?:https?:\/\/)?(?:[a-z0-9-]+\.)*maxmorrys\.me(?:\/[^\s<>()[\]"'`]*)?/gi;

/** Un chemin relatif nu des quatre types de contenu (comportement historique conservé). */
const CHEMIN_NU = /(?<![\w.(/:-])\/(?:blog|podcasts|videos|formations)\/[a-z0-9-]+/gi;

/** La ponctuation qui termine une phrase n'appartient pas à l'URL. */
function separerPonctuation(url: string): [string, string] {
  const m = url.match(/[.,;:!?…]+$/);
  return m ? [url.slice(0, -m[0].length), m[0]] : [url, ''];
}

/** Retire les liens maxmorrys qui ne mènent à aucune page réelle — voir l'en-tête. */
export function filtrerLiensRysmo(reponse: string, validPaths: ReadonlySet<string>): string {
  // 1. Les liens markdown : le texte reste, seule l'URL saute.
  let out = reponse.replace(LIEN_MARKDOWN, (complet, texte: string, url: string) => {
    const verdict = jugerLien(url, validPaths);
    if (verdict === null) return complet;
    return verdict.garder ? `[${texte}](${verdict.url})` : texte;
  });

  // 2. Les URL maxmorrys nues — y compris celles qu'un texte de lien retiré laisse derrière lui.
  //    Celles qui sont à l'intérieur d'un lien markdown conservé ont déjà été validées : le
  //    lookbehind sur `(` les laisse en place.
  out = out.replace(URL_MAXMORRYS, (correspondance: string, decalage: number, chaine: string) => {
    if (chaine[decalage - 1] === '(' && chaine[decalage - 2] === ']') return correspondance;
    const [url, ponctuation] = separerPonctuation(correspondance);
    const verdict = jugerLien(url, validPaths);
    if (verdict === null) return correspondance;
    return verdict.garder ? `${verdict.url}${ponctuation}` : ponctuation;
  });

  // 3. Les chemins relatifs nus des quatre types de contenu.
  out = out.replace(CHEMIN_NU, (chemin: string, decalage: number, chaine: string) => {
    if (chaine[decalage - 1] === '(' && chaine[decalage - 2] === ']') return chemin;
    return validPaths.has(normPath(chemin)) ? chemin : '';
  });

  // Ce qu'un retrait laisse : parenthèses vides, espaces doublés, espace avant ponctuation.
  // Pas d'espace retiré devant « ! ? : ; » : c'est la typographie française, pas un reste.
  return out
    .replace(/\(\s*\)/g, '')
    .replace(/(\S)[ \t]{2,}/g, '$1 ')
    .replace(/(\S)[ \t]+([,.)])/g, '$1$2')
    .replace(/[ \t]+$/gm, '');
}
