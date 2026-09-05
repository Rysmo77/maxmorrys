import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEV ET PREVIEW ÉMETTAIENT DANS LES PROPRIÉTÉS DE PRODUCTION.
 *
 * `GTM-PJ3R433M` et le Pixel `925361066071417` étaient écrits en dur dans `index.html`,
 * que `vite.config.ts` ne transforme pas. Il n'existait donc AUCUN moyen de les changer
 * par environnement : chaque `npm run dev`, chaque canal de preview, chaque build local
 * alimentait la même propriété GA4 et le même Pixel que le site public.
 *
 * Ce n'est pas une gêne d'hygiène. Les chiffres sur lesquels se décident les campagnes
 * comptaient aussi les sessions de développement, et rien dans un rapport GA4 ne permet
 * de les en retrancher après coup.
 *
 * L'identifiant du Pixel vivait en outre dans TROIS fichiers, dont un dans un autre build
 * (le Worker de l'API, pour la Conversions API). Deux d'entre eux peuvent maintenant
 * suivre l'environnement ; le troisième ne le peut pas — d'où ce test.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const root = join(__dirname, '..', '..');
const lire = (chemin: string) => readFileSync(join(root, chemin), 'utf8');

const html = lire('index.html');
/** Le shell sans ses commentaires : ils citent les identifiants pour les expliquer. */
const htmlActif = html.replace(/<!--[\s\S]*?-->/g, '');
/**
 * Le chemin JavaScript seul — les deux `<noscript>` en sont retirés.
 *
 * Ils gardent leur identifiant littéral, et ce n'est pas un oubli : `vite:build-html`
 * passe chaque attribut d'URL à `decodeURI`, et un jeton `%VITE_…%` non substitué n'est
 * pas un échappement pourcent valide — le build ÉCHOUE, « URI malformed ». Mesuré.
 *
 * L'exception ne rouvre rien : ces balises ne s'exécutent que chez un visiteur sans
 * JavaScript, quand la pollution des chiffres venait des sessions de développement et de
 * preview, qui en ont.
 */
const htmlJs = htmlActif.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');

describe('les identifiants de mesure ne sont plus figés dans le shell', () => {
  it('le chemin JavaScript ne contient plus aucun identifiant écrit en dur', () => {
    expect(htmlJs, 'un identifiant GTM est réapparu en dur').not.toMatch(/GTM-[A-Z0-9]{6,}/);
    expect(htmlJs, 'un identifiant Pixel est réapparu en dur').not.toContain('925361066071417');
  });

  it('le chargeur GTM et l’init du Pixel passent par une variable de build', () => {
    expect((htmlJs.match(/%VITE_GTM_ID%/g) ?? []).length).toBe(1);
    expect((htmlJs.match(/%VITE_META_PIXEL_ID%/g) ?? []).length).toBe(1);
  });

  it('les deux `noscript` gardent une valeur littérale, et le disent', () => {
    // Sans cette attente, quelqu'un « corrigerait » l'incohérence en y remettant un jeton,
    // et casserait le build de tout environnement qui ne définit pas la variable.
    const noscripts = (htmlActif.match(/<noscript>[\s\S]*?<\/noscript>/g) ?? []).join('');
    expect(noscripts).toMatch(/GTM-[A-Z0-9]{6,}/);
    expect(noscripts).toContain('925361066071417');
    expect(noscripts, 'un jeton de variable dans un src casse `vite:build-html`').not.toMatch(
      /%VITE_/,
    );
  });

  it('un identifiant absent coupe la mesure au lieu d’appeler n’importe quoi', () => {
    // Sans variable définie, Vite laisse le jeton NON SUBSTITUÉ. Sans garde, le snippet
    // irait chercher un conteneur nommé « %VITE_GTM_ID% » et le Pixel s'initialiserait
    // sur une chaîne vide — qui envoie quand même des requêtes.
    expect(htmlJs, 'la garde du conteneur GTM a disparu').toContain("indexOf('GTM-')!==0");
    expect(htmlJs, 'la garde de l’init du Pixel a disparu').toMatch(
      /\/\^\[0-9\]\+\$\/\.test\(mmPixelId\)/,
    );
  });
});

describe('la CI ne peut pas éteindre la mesure en production', () => {
  const ci = lire('.github/workflows/ci.yml');

  it('les deux identifiants sont passés à CHAQUE build, avec un repli', () => {
    // Trois blocs `env:` de build : lint-and-build, deploy, preview. En oublier un
    // suffirait à publier un site sans mesure, sans qu'aucun test ne rougisse.
    for (const variable of ['VITE_GTM_ID', 'VITE_META_PIXEL_ID']) {
      const occurrences = (ci.match(new RegExp(`${variable}:`, 'g')) ?? []).length;
      expect(occurrences, `${variable} n'est pas passé aux trois builds`).toBe(3);
    }
    // Le repli `||` est ce qui rend une variable de dépôt oubliée sans conséquence.
    expect(ci).toMatch(/VITE_GTM_ID: \$\{\{ vars\.VITE_GTM_ID \|\| 'GTM-[A-Z0-9]+' \}\}/);
    expect(ci).toMatch(/VITE_META_PIXEL_ID: \$\{\{ vars\.VITE_META_PIXEL_ID \|\| '\d+' \}\}/);
  });

  it('la supervision d’erreurs est passée aux trois builds elle aussi', () => {
    expect((ci.match(/VITE_SENTRY_DSN:/g) ?? []).length).toBe(3);
  });
});

describe('le Pixel serveur et le Pixel client visent la même propriété', () => {
  it('le Worker CAPI porte l’identifiant qui sert de repli au client', () => {
    /*
     * Le Worker de l'API est un AUTRE build : il ne peut pas lire `import.meta.env`, et
     * son identifiant reste donc littéral. S'il divergeait du client, la déduplication
     * d'événements (`generateEventId`) cesserait de fonctionner en silence : Meta
     * compterait chaque achat DEUX FOIS, une fois par le navigateur, une fois par le
     * webhook de paiement — en gonflant le ROAS de la seule source qui décide du budget.
     */
    const capi = lire('worker/apps/api/src/lib/meta-capi.ts');
    const cote = lire('src/lib/meta-pixel.ts');

    const serveur = capi.match(/const PIXEL_ID = '(\d+)'/)?.[1];
    const client = cote.match(/VITE_META_PIXEL_ID \|\| '(\d+)'/)?.[1];

    expect(serveur, 'PIXEL_ID introuvable dans le Worker CAPI').toBeTruthy();
    expect(client, 'le repli du Pixel client a disparu').toBeTruthy();
    expect(serveur).toBe(client);
  });
});
