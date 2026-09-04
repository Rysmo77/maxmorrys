import { describe, expect, it } from 'vitest';

import {
  ogCardTitle,
  ogEyebrow,
  ogImageUrl,
  ogTerritory,
  ogVersion,
  pagePathFromOgPath,
} from '../src/prerender/og-url';

/**
 * L'ALLER ET LE RETOUR DOIVENT SE RÉPONDRE.
 *
 * Le pré-rendu ÉCRIT ces adresses dans `og:image` ; `scripts/og-cards.mjs` écrit les FICHIERS
 * correspondants sous `public/og/`. Si les deux divergent d'un caractère, le robot demande une
 * image qui n'existe pas : la réécriture d'hébergement le rattrape sur la carte générique, et
 * tout le travail de génération ne sert plus à rien sans qu'aucune erreur n'apparaisse.
 *
 * Ces tests tiennent donc surtout une propriété : `pagePathFromOgPath(ogImageUrl(p)) === p`.
 */

describe('aller-retour entre une page et son image', () => {
  const CHEMINS = [
    '/',
    '/blog',
    '/faq/c-est-qui-max-morrys',
    '/legal/cgu',
    '/formations/seo-pour-les-tpe',
    '/en',
    '/en/faq/c-est-qui-max-morrys',
    '/en/legal/terms-of-use',
  ];

  it.each(CHEMINS)('%s retrouve son chemin', (chemin) => {
    const url = new URL(ogImageUrl(chemin, 'Un titre', 'Question'));
    expect(pagePathFromOgPath(url.pathname)).toBe(chemin);
  });

  it.each(CHEMINS)('%s désigne un chemin de fichier sous /og', (chemin) => {
    // Le fichier que `scripts/og-cards.mjs` écrit dans `public/` — même arborescence.
    const url = new URL(ogImageUrl(chemin, 'Un titre', 'Question'));
    expect(url.pathname.startsWith('/og')).toBe(true);
    expect(url.pathname.endsWith('.png')).toBe(true);
  });

  it("la racine n'a pas d'adresse à double barre", () => {
    // `/og` + `/` + `.png` donnerait `/og/.png`, que rien ne sait relire.
    expect(new URL(ogImageUrl('/', 'Accueil', 'Max-Morrys')).pathname).toBe('/og.png');
  });

  it('les adresses sont absolues et en https', () => {
    // Une image de partage relative n'est chargée par aucune plateforme.
    expect(ogImageUrl('/blog', 'Blog', 'Article')).toMatch(/^https:\/\/maxmorrys\.me\/og/);
  });
});

describe('pagePathFromOgPath', () => {
  it('refuse ce qui n’est pas une image d’aperçu', () => {
    for (const chemin of ['/blog', '/og', '/ogre/x.png', '/faq/x.png', '/og.jpg']) {
      expect(pagePathFromOgPath(chemin), chemin).toBeNull();
    }
  });

  it('accepte la racine et les chemins profonds', () => {
    expect(pagePathFromOgPath('/og.png')).toBe('/');
    expect(pagePathFromOgPath('/og/a/b/c.png')).toBe('/a/b/c');
  });
});

describe('empreinte de version', () => {
  it('change quand le titre change', () => {
    // C'est ce qui fait qu'une correction de titre renouvelle l'image, malgré un cache d'un an.
    expect(ogVersion('Titre A|Article')).not.toBe(ogVersion('Titre B|Article'));
  });

  it('change quand le surtitre change', () => {
    expect(ogVersion('Titre|Article')).not.toBe(ogVersion('Titre|Question'));
  });

  it('est stable pour un même texte', () => {
    expect(ogVersion('Titre|Article')).toBe(ogVersion('Titre|Article'));
  });

  it('tient sur huit caractères hexadécimaux', () => {
    expect(ogVersion('Un titre quelconque')).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('surtitre de la carte', () => {
  it('nomme la pièce sur une fiche', () => {
    expect(ogEyebrow('/faq/c-est-qui-max-morrys', 'fr')).toBe('Question');
    expect(ogEyebrow('/blog/mon-article', 'fr')).toBe('Article');
    expect(ogEyebrow('/formations/seo', 'fr')).toBe('Formation');
  });

  it('nomme la SECTION sur un index', () => {
    // L'index du blog s'annonçait lui-même comme un article — faux, et lisible au premier
    // coup d'œil sur la vignette.
    expect(ogEyebrow('/blog', 'fr')).toBe('Blog');
    expect(ogEyebrow('/formations', 'fr')).toBe('Formations');
    expect(ogEyebrow('/faq', 'fr')).toBe('FAQ');
  });

  it('suit la langue de la page', () => {
    // Une carte anglaise annonçant « Formation » trahirait que le texte est traduit mais pas
    // la surface qui l'entoure.
    expect(ogEyebrow('/en/courses/seo', 'en')).toBe('Course');
    expect(ogEyebrow('/en/videos/x', 'en')).toBe('Video');
    expect(ogEyebrow('/en/blog', 'en')).toBe('Blog');
  });

  it('ignore le préfixe de langue, qui n’est pas une famille', () => {
    expect(ogEyebrow('/en/faq/x', 'fr')).toBe('Question');
  });

  it('retombe sur la marque pour une page sans famille', () => {
    expect(ogEyebrow('/', 'fr')).toBe('Max-Morrys');
    expect(ogEyebrow('/contact', 'fr')).toBe('Max-Morrys');
  });
});

/**
 * LA TEINTE D'UNE CARTE EST UNE INFORMATION, PAS UNE DÉCORATION.
 *
 * `colors.css` annote chaque teinte d'un territoire — bleu « Je te forme », orange « Je
 * t'informe », violet « Je te transforme », teal « Je te digitalise ». Une carte qui porte la
 * bonne teinte dit de quel étage du site vient le lien avant même qu'on ait lu le titre.
 */
describe('territoire de la carte', () => {
  it('rend le territoire des quatre verbes', () => {
    expect(ogTerritory('/formations/seo')).toBe('forme');
    expect(ogTerritory('/blog/mon-article')).toBe('informe');
    expect(ogTerritory('/podcast-et-videos')).toBe('transforme');
    expect(ogTerritory('/presence-digitale')).toBe('digitalise');
  });

  it('range les quatre routes de « Je te transforme » ensemble', () => {
    // Ce sont celles qui allument le même onglet dans la barre haute.
    for (const p of ['/podcast-et-videos', '/podcasts/x', '/videos/x', '/club-des-digitos']) {
      expect(ogTerritory(p), p).toBe('transforme');
    }
  });

  it('reconnaît les segments anglais', () => {
    expect(ogTerritory('/en/courses/seo')).toBe('forme');
    expect(ogTerritory('/en/digitos-club')).toBe('transforme');
    expect(ogTerritory('/en/local-presence')).toBe('digitalise');
  });

  it('rend « neutre » hors des quatre verbes, et jamais « rose »', () => {
    // `rose` du design system porte les mêmes deux teintes que « Je t'informe », inversées :
    // en vignette, une question de la FAQ et un article deviendraient indiscernables.
    for (const p of ['/', '/contact', '/faq/x', '/legal/cgu', '/a-propos', '/verifier']) {
      expect(ogTerritory(p), p).toBe('neutre');
    }
  });
});

describe('titre dessiné sur la carte', () => {
  it('retire le suffixe du site, que le pied de carte porte déjà', () => {
    expect(ogCardTitle("Conditions d'utilisation | Max-Morrys")).toBe("Conditions d'utilisation");
  });

  it('laisse intact un titre qui n’en porte pas', () => {
    expect(ogCardTitle("C'est qui Max-Morrys ?")).toBe("C'est qui Max-Morrys ?");
  });

  it('ne vide jamais un titre', () => {
    // Un titre réduit au seul nom du site doit rester lisible plutôt que disparaître.
    expect(ogCardTitle('Max-Morrys')).toBe('Max-Morrys');
  });
});

