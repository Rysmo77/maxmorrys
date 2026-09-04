import { buildMetaInjection, buildSeoBody } from './meta';
import type { PageMeta } from './types';

/**
 * Injection des métadonnées par HTMLRewriter, en remplacement des douze
 * `String.replace` de la Cloud Function.
 *
 * Le traitement est en flux : le shell n'est jamais matérialisé en mémoire, et
 * il n'y a qu'un seul passage au lieu d'une dizaine de balayages du document.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES SIX BALISES QUI RESTAIENT EN DOUBLE, ET POURQUOI ELLES NE LE PEUVENT PLUS.
 *
 * `stripDefaultMeta` ne ciblait ni `og:image:width`, ni `og:image:height`, ni `og:locale`,
 * ni `og:site_name`, ni `twitter:card`, ni `twitter:site` : la sortie en portait donc DEUX
 * exemplaires, celui du shell et celui de l'injection. Le portage a reproduit ce
 * comportement à l'identique, et c'était le bon choix — un portage se juge sur sa fidélité.
 *
 * Deux raisons de le corriger maintenant, et la première n'est pas cosmétique :
 *
 *   1. `og:image:width` / `og:image:height` ne sont plus émises que lorsque les dimensions
 *      RÉELLES sont connues. Si le 1200×630 du shell survivait, une page sans dimensions
 *      connues continuerait d'annoncer une taille fausse — le défaut serait déplacé, pas
 *      réparé. Le dépouillement est donc ce qui rend l'émission conditionnelle honnête.
 *   2. `twitter:site` portait deux valeurs CONTRADICTOIRES : `@maxmorrys` (injectée, fausse)
 *      et `@max_morrys` (du shell, réelle). Deux balises qui se contredisent ne laissent pas
 *      le choix au robot, elles le font deviner.
 *
 * ⚠️ Divergence assumée avec la Cloud Function de repli, qui sert toujours des doublons.
 * `functions/src/prerender.ts` porte la même correction, mais son déploiement est manuel.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Balises retirées avant réinjection : chacune est réémise exactement une fois. */
const STRIPPED_SELECTORS = [
  'title',
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:type"]',
  'meta[property="og:url"]',
  'meta[property="og:image"]',
  'meta[property="og:image:width"]',
  'meta[property="og:image:height"]',
  'meta[property="og:locale"]',
  'meta[property="og:site_name"]',
  'meta[name="twitter:card"]',
  'meta[name="twitter:site"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
  'meta[name="twitter:image"]',
  'link[rel="canonical"]',
].join(', ');

export function injectMeta(shell: Response, meta: PageMeta): Response {
  const injection = buildMetaInjection(meta);
  const seoBody = buildSeoBody(meta);

  const rewriter = new HTMLRewriter()
    // `<html lang>` selon la langue de la page.
    .on('html', {
      element(element) {
        element.setAttribute('lang', meta.lang === 'en' ? 'en' : 'fr');
      },
    })
    // L'indentation reproduit `replace(/<head>/i, '<head>\n    ' + injection)`.
    .on('head', {
      element(element) {
        element.prepend(`\n    ${injection}`, { html: true });
      },
    })
    .on(STRIPPED_SELECTORS, {
      element(element) {
        element.remove();
      },
    });

  if (seoBody) {
    rewriter.on('#root', {
      element(element) {
        element.setInnerContent(seoBody, { html: true });
      },
    });
  }

  return rewriter.transform(shell);
}
