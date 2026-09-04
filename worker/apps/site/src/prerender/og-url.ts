import { SITE_URL } from '../constants';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ADRESSE D'UNE IMAGE D'APERÇU — écrite ici, relue ici.
 *
 * Deux endroits manipulent ces adresses : le pré-rendu, qui les écrit dans `og:image`, et
 * `scripts/og-cards.mjs`, qui écrit les fichiers correspondants sous `public/og/`. Les faire
 * dériver d'un seul module est ce qui garantit qu'ils désignent le même fichier — une
 * divergence produirait des `og:image` en 404, c'est-à-dire des liens partagés sans aucune
 * vignette.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE SONT DES FICHIERS STATIQUES, PAS UNE ROUTE.
 *
 * Les cartes sont rendues au build et servies par l'hébergement : coût d'exécution nul,
 * aucun démarrage à froid dans le chemin d'un robot, aucune dépendance de production. Une
 * page dont la carte n'a pas encore été générée est rattrapée par la réécriture
 * `/og/** → /og/_fallback.png` de `firebase.json` : jamais de 404.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Empreinte du texte rendu, ajoutée en `?v=`.
 *
 * Sans elle, l'image resterait en cache d'arête un an après une correction de titre : la
 * page dirait une chose, sa vignette une autre, et rien ne les réconcilierait. Avec elle,
 * modifier un titre change l'adresse, donc l'entrée de cache, donc l'image — et les robots
 * qui repassent voient la nouvelle. FNV-1a : quelques lignes, déterministe, et il ne s'agit
 * ici que de distinguer deux versions, pas de résister à quoi que ce soit.
 */
export function ogVersion(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Le titre TEL QU'IL EST DESSINÉ sur la carte.
 *
 * Presque tous les titres du site finissent par « | Max-Morrys ». Sur une page, ce suffixe
 * sert : il situe l'onglet et le résultat de recherche. Sur la carte, il est déjà écrit en
 * pied — la reprendre lui fait consommer une ligne entière sur les trois disponibles, et
 * « Conditions d'utilisation | Max-Morrys » se retrouve dessiné en deux lignes au lieu d'une.
 *
 * Le pré-rendu s'en sert pour le texte alternatif, `scripts/og-cards.mjs` pour le rendu :
 * une seule fonction, pour que l'`alt` décrive vraiment ce que l'image montre.
 */
export function ogCardTitle(title: string): string {
  return title.replace(/\s*\|\s*Max-Morrys\s*$/, '').trim() || title;
}

/** L'adresse de l'image d'aperçu d'une page. `path` est le chemin SERVI (préfixe `/en` inclus). */
export function ogImageUrl(path: string, title: string, eyebrow: string): string {
  // La racine donnerait `/og/.png` : elle a sa propre adresse.
  const suffix = path === '/' ? '' : path;
  return `${SITE_URL}/og${suffix}.png?v=${ogVersion(`${title}|${eyebrow}`)}`;
}

/**
 * L'opération inverse : de `/og/faq/x.png` vers `/faq/x`.
 *
 * Retourne `null` si le chemin n'est pas une adresse d'image d'aperçu — l'appelant sait alors
 * qu'il n'a rien à faire ici.
 */
export function pagePathFromOgPath(pathname: string): string | null {
  if (!pathname.endsWith('.png')) return null;
  const withoutExtension = pathname.slice(0, -'.png'.length);
  if (withoutExtension === '/og') return '/';
  if (!withoutExtension.startsWith('/og/')) return null;
  return withoutExtension.slice('/og'.length);
}

/**
 * Le surtitre de la carte : la famille à laquelle appartient la page.
 *
 * Il porte l'information que le titre seul ne donne pas — « FAQ », « FORMATION » — et c'est
 * ce qui distingue deux cartes dont les titres se ressemblent. Les libellés suivent la langue
 * de la page : une carte anglaise annonçant « FORMATION » trahirait que le texte est traduit
 * mais pas la surface.
 */
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE TERRITOIRE D'UNE PAGE — ce qui donne sa COULEUR à sa carte d'aperçu.
 *
 * Les quatre teintes du système ne sont pas décoratives : `colors.css` les annote une par une
 * — « `--mm-bleu` : Je te forme », « `--mm-orange` : Je t'informe », « `--mm-violet` : Je te
 * transforme », « `--mm-teal` : Je te digitalise ». Une carte de partage qui les ignore ne se
 * contente pas d'être hors charte : elle jette l'information la plus utile qu'elle pouvait
 * porter — de quel étage du site vient ce lien, visible avant même d'avoir lu le titre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET `neutre` POUR LE RESTE — PAS `rose`, ET LA RAISON EST MESURABLE.
 *
 * `TerritoryCard` propose bien une cinquième carte « hors des quatre verbes », en corail.
 * C'était le candidat évident pour l'accueil, le contact, la FAQ et les mentions. Mais ses
 * deux teintes sont `#FFD5D9 → #FFE7C7`, et celles du territoire « Je t'informe » sont
 * `#FFE6BC → #FFD2D6` : les MÊMES deux couleurs, dans l'autre sens. En vignette dans un fil,
 * une question de la FAQ et un article deviennent indiscernables — et trente-six des
 * quarante-trois cartes sont justement hors territoire.
 *
 * Ces pages n'appartiennent à aucun territoire ; leur carte le dit, sur la surface neutre du
 * système (`--paper` → `--paper-3`). Le filet d'arc suffit à les rattacher à la marque.
 *
 * ⚠️ MIROIR DE `SITE_NAV` ET `TRANSFORME_PATHS` (`src/components/layout/Header.tsx`), qui
 * décident quel onglet s'allume. Les deux tables doivent désigner le même territoire pour la
 * même route, sinon la carte d'un épisode serait violette dans la barre et bleue au partage.
 * `tests/unit/og-territory-sync.test.ts` le vérifie.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export type OgTerritory = 'forme' | 'informe' | 'transforme' | 'digitalise' | 'neutre';

const TERRITORIES: Record<string, OgTerritory> = {
  formations: 'forme',
  courses: 'forme',
  blog: 'informe',
  'podcast-et-videos': 'transforme',
  'podcast-and-videos': 'transforme',
  podcasts: 'transforme',
  videos: 'transforme',
  'club-des-digitos': 'transforme',
  'digitos-club': 'transforme',
  'presence-digitale': 'digitalise',
  'local-presence': 'digitalise',
};

export function ogTerritory(path: string): OgTerritory {
  const segments = path.split('/').filter(Boolean);
  const first = segments[0] === 'en' ? segments[1] : segments[0];
  return (first && TERRITORIES[first]) || 'neutre';
}

/**
 * Les libellés du sourcil, par famille.
 *
 * `index` nomme la SECTION, `item` nomme une de ses pièces — « BLOG » sur la liste des
 * articles, « ARTICLE » sur l'un d'eux. Sans cette distinction, l'index du blog s'annonçait
 * lui-même comme un article, ce qui est faux et se lit au premier coup d'œil.
 *
 * Les libellés suivent la langue de la page : une carte anglaise annonçant « FORMATION »
 * trahirait que le texte est traduit mais pas la surface qui l'entoure.
 */
interface SectionLabel {
  index: { fr: string; en: string };
  item?: { fr: string; en: string };
}

const SECTIONS: Record<string, SectionLabel> = {
  blog: { index: { fr: 'Blog', en: 'Blog' }, item: { fr: 'Article', en: 'Article' } },
  formations: {
    index: { fr: 'Formations', en: 'Courses' },
    item: { fr: 'Formation', en: 'Course' },
  },
  courses: { index: { fr: 'Formations', en: 'Courses' }, item: { fr: 'Formation', en: 'Course' } },
  podcasts: { index: { fr: 'Podcasts', en: 'Podcasts' }, item: { fr: 'Podcast', en: 'Podcast' } },
  videos: { index: { fr: 'Vidéos', en: 'Videos' }, item: { fr: 'Vidéo', en: 'Video' } },
  faq: { index: { fr: 'FAQ', en: 'FAQ' }, item: { fr: 'Question', en: 'Question' } },
  legal: { index: { fr: 'Mentions', en: 'Legal' } },
  'podcast-et-videos': { index: { fr: 'Podcast & vidéos', en: 'Podcast & videos' } },
  'podcast-and-videos': { index: { fr: 'Podcast & vidéos', en: 'Podcast & videos' } },
  'club-des-digitos': { index: { fr: 'Le Club', en: 'The Club' } },
  'digitos-club': { index: { fr: 'Le Club', en: 'The Club' } },
  'presence-digitale': { index: { fr: 'Commerce', en: 'Local business' } },
  'local-presence': { index: { fr: 'Commerce', en: 'Local business' } },
  agence: { index: { fr: 'Agence', en: 'Agency' } },
  agency: { index: { fr: 'Agence', en: 'Agency' } },
};

export function ogEyebrow(path: string, lang: 'fr' | 'en'): string {
  // Le préfixe de langue n'est pas une famille.
  const segments = path.split('/').filter(Boolean);
  const own = segments[0] === 'en' ? segments.slice(1) : segments;
  const family = own[0];
  if (!family) return 'Max-Morrys';

  const section = SECTIONS[family];
  if (!section) return 'Max-Morrys';

  // Un segment de plus que la famille = une pièce de la section, pas la section.
  const isItem = own.length > 1;
  return (isItem && section.item ? section.item[lang] : section.index[lang]) ?? 'Max-Morrys';
}
