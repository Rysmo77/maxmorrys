import { buildMetaInjection, buildSeoBody } from './meta';
import type { PageMeta } from './types';

/**
 * Injection des métadonnées par HTMLRewriter, en remplacement des douze
 * `String.replace` de la Cloud Function.
 *
 * Le traitement est en flux : le shell n'est jamais matérialisé en mémoire, et
 * il n'y a qu'un seul passage au lieu d'une dizaine de balayages du document.
 *
 * ⚠️ Les sélecteurs reproduisent **exactement** le jeu de `stripDefaultMeta`.
 * En particulier, `og:image:width`, `og:image:height`, `og:locale`,
 * `og:site_name`, `twitter:card` et `twitter:site` ne sont **pas** retirés : la
 * fonction actuelle les laisse en place et en réinjecte une seconde copie. Un
 * sélecteur générique du type `meta[property^="og:"]` produirait donc un
 * document différent de la production.
 */

/** Balises retirées avant réinjection — miroir de `stripDefaultMeta`. */
const STRIPPED_SELECTORS = [
  'title',
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:type"]',
  'meta[property="og:url"]',
  'meta[property="og:image"]',
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
