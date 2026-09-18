/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES 301 PERMANENTES DE LA REFONTE EN DEUX PISTES (CDC §3.4).
 *
 * Ce sont des redirections ÉCRITES, pas administrées : elles ne vivent pas dans la
 * collection `redirects` de Firestore (`./redirects.ts`), qui sert les liens
 * d'attribution `/via/<slug>` et les 301 saisies depuis `/admin/redirections`. Celles-ci
 * sont un engagement du cahier des charges — « la redirection est obligatoire, pas
 * optionnelle » — et elles doivent tenir même si la base est injoignable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI AU BORD ET PAS SEULEMENT DANS `firebase.json`.
 *
 * Deux raisons, et chacune suffirait.
 *
 *   1. UNE PAGE PRÉRENDUE N'ATTEINT JAMAIS L'ORIGINE. `resolveRoute` décide avant tout
 *      relais : tant que `/agence` figurait dans `PRERENDER_EXACT`, le Worker servait la
 *      page et la redirection déclarée à l'hébergement n'était jamais lue. Les deux
 *      fichiers auraient été justes séparément, et la 301 n'aurait existé pour personne.
 *
 *   2. LA `Location` DE L'ORIGINE DÉSIGNE L'ORIGINE. `fetchOrigin` interroge
 *      `max-morrys.web.app` — hors zone, c'est ce qui évite la boucle. Firebase Hosting
 *      répond une `Location` absolue sur l'hôte qu'il a servi : relayée telle quelle,
 *      elle sortirait le visiteur du domaine canonique. Ici, la `Location` est un chemin
 *      relatif, donc correcte derrière l'apex comme derrière `www.`.
 *
 * `firebase.json` porte quand même les mêmes règles : c'est le filet du point 3 de
 * l'en-tête de `index.ts` — si la route Cloudflare est retirée, l'hébergement reprend la
 * main et les anciennes adresses continuent de résoudre. ⚠️ Les deux tables doivent donc
 * rester identiques ; `test/redirects.test.ts` les compare.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { normalizePath } from './routes';

export interface StaticRedirect {
  /** L'ancienne adresse, normalisée (sans slash final). Son sous-arbre est couvert aussi. */
  from: string;
  /** La nouvelle adresse. */
  to: string;
  /**
   * Le reste du chemin survit-il à la redirection ?
   *
   * `true` → `/presence-digitale/devis/A1` part sur `/conception/commerces-et-tpe/devis/A1`.
   * `false` → tout le sous-arbre de `/agence` tombe sur `/conception` : la page mère
   * remplace une section entière, aucun de ses anciens enfants n'a d'équivalent un pour un.
   */
  keepSuffix: boolean;
}

/**
 * La table, telle que le CDC l'arrête.
 *
 * ⚠️ L'ORDRE DE CE TABLEAU N'EST PAS CELUI DE LA RÉSOLUTION : `resolveStaticRedirect`
 * retient la source la PLUS LONGUE qui corresponde. Sans ça, `/agence/devis/A1` tomberait
 * sur `/conception` par la règle `/agence`, et la référence du devis — la seule chose que
 * cette URL porte — serait perdue en route.
 */
export const STATIC_REDIRECTS: readonly StaticRedirect[] = [
  /* L'offre commerçants devient l'étage productisé de la piste Conception. */
  { from: '/presence-digitale', to: '/conception/commerces-et-tpe', keepSuffix: true },
  { from: '/en/local-presence', to: '/en/design/shops-and-small-business', keepSuffix: true },
  /*
   * `/en/digital-presence` visait `/en/local-presence`, qui redirige désormais lui-même.
   * On vise la cible FINALE : deux sauts se tolèrent, trois font perdre à Google le
   * signal de la 301 et coûtent un aller-retour à chaque visiteur qui suit un vieux lien.
   */
  { from: '/en/digital-presence', to: '/en/design/shops-and-small-business', keepSuffix: true },

  /*
   * LA SEULE EXCEPTION DU LOT — et elle porte une référence client.
   *
   * Un devis est une adresse envoyée à quelqu'un, nommément. La faire tomber sur la page
   * mère rendrait le lien inutile pour la seule personne à qui il était destiné. Ces deux
   * règles passent donc avant `/agence`, et emportent la référence avec elles.
   */
  { from: '/agence/devis', to: '/conception/commerces-et-tpe/devis', keepSuffix: true },
  { from: '/en/agency/quote', to: '/en/design/shops-and-small-business/quote', keepSuffix: true },

  /* La page agence est supprimée : elle ne vend plus de direction marketing (CDC O3). */
  { from: '/agence', to: '/conception', keepSuffix: false },
  { from: '/en/agency', to: '/en/design', keepSuffix: false },
];

/**
 * La nouvelle adresse d'un chemin, ou `null` si rien ne le concerne.
 *
 * Le chemin BRUT est testé en plus du chemin normalisé, pour la même raison que dans
 * `resolveRoute` : `/agence/` doit tomber sous la règle `/agence`, slash final compris.
 */
export function resolveStaticRedirect(pathname: string): string | null {
  const path = normalizePath(pathname);

  let best: StaticRedirect | null = null;
  for (const rule of STATIC_REDIRECTS) {
    const exact = path === rule.from;
    const subtree = path.startsWith(`${rule.from}/`);
    if (!exact && !subtree) continue;
    if (!best || rule.from.length > best.from.length) best = rule;
  }
  if (!best) return null;

  if (!best.keepSuffix) return best.to;
  return `${best.to}${path.slice(best.from.length)}`;
}
