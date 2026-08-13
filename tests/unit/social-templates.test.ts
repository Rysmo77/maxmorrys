import { describe, it, expect } from 'vitest';
import { buildTemplate } from '../../functions/src/templates';
import type { CardPayload, CardFormat, TemplateName } from '../../functions/src/templates';

/**
 * Les gabarits de créas sociales sont rendus par Satori, qui est intolérant :
 * flexbox uniquement, pas de `filter`/`blur`/`mask`, et tout élément portant du texte doit
 * déclarer `display:flex`. Un gabarit qui viole ça ne casse pas au build — il casse à la
 * génération, en production, une fois le contenu déjà validé par le board.
 *
 * Ces tests vérifient donc le markup produit, pas le PNG : c'est là que se situent les fautes
 * qui coûtent cher.
 */

const FORMATS: Record<CardFormat, { w: number; h: number }> = {
  '1:1': { w: 1080, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 },
};

const ALL_TEMPLATES: TemplateName[] = [
  'quote', 'tip', 'promo', 'poster', 'panel',
  'slide', 'stat', 'checklist', 'versus', 'ask', 'testimonial',
];

/** Une charge utile qui remplit TOUS les champs : chaque gabarit y pioche ce qui le concerne. */
function payload(template: TemplateName, format: CardFormat): CardPayload {
  return {
    template,
    format,
    title: 'Ta fiche Google, champ par champ',
    body: 'Le champ que neuf fiches sur dix laissent vide, et ce qu’il change.',
    cta: 'Sauvegarde pour plus tard',
    eyebrow: 'ATELIER',
    highlight: 'Google',
    accent: 'turquoise',
    curve: false,
    slideRole: 'body',
    slideIndex: 3,
    slideTotal: 8,
    stat: '+1 790 %',
    statLabel: 'de trafic en 18 mois',
    items: ['Renseigne tes horaires', 'Ajoute 10 photos', 'Choisis la bonne catégorie'],
    leftTitle: 'AVANT',
    leftItems: ['12 vues par semaine', 'Aucun appel'],
    rightTitle: 'APRÈS',
    rightItems: ['340 vues par semaine', '18 appels'],
    options: ['Complète', 'Jamais touchée'],
    authorName: 'Aminata Fall',
    authorRole: 'Fondatrice de boutique · Dakar',
  };
}

/** Compte les occurrences d'un motif — sert aux invariants structurels. */
function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('buildTemplate — invariants Satori', () => {
  for (const template of ALL_TEMPLATES) {
    for (const format of Object.keys(FORMATS) as CardFormat[]) {
      it(`${template} en ${format} produit un markup exploitable`, () => {
        const { w, h } = FORMATS[format];
        const html = buildTemplate(payload(template, format), w, h);

        expect(html.length).toBeGreaterThan(200);
        // Le conteneur racine porte les dimensions demandées.
        expect(html).toContain(`width:${w}px;height:${h}px`);
        // Satori n'a pas de layout par défaut : chaque div doit déclarer son display.
        expect(count(html, '<div')).toBe(count(html, 'display:flex'));
        // Propriétés que Satori ignore silencieusement — leur présence est un bug latent.
        expect(html).not.toMatch(/filter:|backdrop-filter:|mask:|box-sizing:/);
        expect(html).not.toContain('display:block');
        expect(html).not.toContain('display:grid');
        // Aucune valeur laissée à undefined/NaN par un champ optionnel absent.
        expect(html).not.toContain('undefined');
        expect(html).not.toContain('NaN');
      });
    }
  }

  it('échappe les chevrons plutôt que de casser le markup', () => {
    const html = buildTemplate(
      { ...payload('poster', '4:5'), title: 'Avant <script> après' },
      1080, 1350
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('‹script›');
  });

  it("n'encode pas les esperluettes (Satori rend le texte littéralement)", () => {
    const html = buildTemplate({ ...payload('poster', '4:5'), title: 'Q&A du vendredi' }, 1080, 1350);
    expect(html).toContain('Q&A');
    expect(html).not.toContain('&amp;');
  });

  it('retombe sur `quote` pour un gabarit inconnu', () => {
    const html = buildTemplate(
      { ...payload('quote', '4:5'), template: 'inexistant' as TemplateName },
      1080, 1350
    );
    expect(html).toContain('“'); // la marque de citation du gabarit quote
  });
});

/**
 * Les polices embarquées sont les sous-ensembles **latins** de Inter et Merriweather
 * (fichiers `-latin-` de `@fontsource`). Un caractère hors de cette plage ne fait pas échouer
 * le rendu : il sort en « tofu » (▯) dans le PNG publié. C'est exactement ce qui est arrivé à
 * « → » (U+2192, absent du sous-ensemble alors que U+2191 et U+2193 y sont).
 *
 * Plages du sous-ensemble latin de fontsource, telles que déclarées dans ses `unicode-range`.
 */
const LATIN_RANGES: Array<[number, number]> = [
  [0x0000, 0x00ff], [0x0131, 0x0131], [0x0152, 0x0153],
  [0x02bb, 0x02bc], [0x02c6, 0x02c6], [0x02da, 0x02da], [0x02dc, 0x02dc],
  [0x0304, 0x0304], [0x0308, 0x0308], [0x0329, 0x0329],
  [0x2000, 0x206f], [0x2074, 0x2074], [0x20ac, 0x20ac], [0x2122, 0x2122],
  [0x2191, 0x2191], [0x2193, 0x2193], [0x2212, 0x2212], [0x2215, 0x2215],
  [0xfeff, 0xfeff], [0xfffd, 0xfffd],
];

const inLatinSubset = (cp: number) => LATIN_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi);

/** Extrait le texte visible : tout ce qui se trouve hors des balises. */
function visibleText(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function tofu(html: string): string[] {
  return [...visibleText(html)]
    .filter((ch) => !inLatinSubset(ch.codePointAt(0) as number))
    .map((ch) => `${ch} (U+${(ch.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, '0')})`);
}

describe('glyphes — rien qui sorte du sous-ensemble latin embarqué', () => {
  // Chaque variante doit être rendue : le libellé fautif ne vivait que dans la branche `cover`,
  // qu'un seul rendu par gabarit n'atteignait jamais.
  const variants: Array<[string, CardPayload]> = ALL_TEMPLATES.flatMap((template) =>
    template === 'slide'
      ? (['cover', 'body', 'outro'] as const).map(
          (role) => [`slide:${role}`, { ...payload('slide', '4:5'), slideRole: role }] as [string, CardPayload]
        )
      : [[template, payload(template, '4:5')] as [string, CardPayload]]
  );

  for (const [label, p] of variants) {
    it(`${label} ne produit aucun caractère qui s’afficherait en tofu`, () => {
      expect(tofu(buildTemplate(p, 1080, 1350))).toEqual([]);
    });
  }

  it('détecte bien un caractère hors sous-ensemble (le test ne passe pas à vide)', () => {
    // U+2192 « → » : absent du sous-ensemble latin, alors que U+2191 et U+2193 y sont.
    const html = buildTemplate({ ...payload('poster', '4:5'), title: 'Avant → après' }, 1080, 1350);
    expect(tofu(html)).toContain('→ (U+2192)');
  });
});

describe('slide — les carrousels', () => {
  const render = (over: Partial<CardPayload>) =>
    buildTemplate({ ...payload('slide', '4:5'), ...over }, 1080, 1350);

  it('affiche la progression sur les slides du milieu, pas sur la cover', () => {
    expect(render({ slideRole: 'body', slideIndex: 3, slideTotal: 8 })).toContain('03 / 08');
    expect(render({ slideRole: 'cover', slideIndex: 1, slideTotal: 8 })).not.toContain('01 / 08');
  });

  it('invite à faire défiler sur la cover uniquement', () => {
    expect(render({ slideRole: 'cover' })).toContain('FAIS DÉFILER');
    expect(render({ slideRole: 'body' })).not.toContain('FAIS DÉFILER');
    expect(render({ slideRole: 'outro' })).not.toContain('FAIS DÉFILER');
  });

  it("ne porte le CTA que sur l'outro — un carrousel a un seul appel à l'action", () => {
    expect(render({ slideRole: 'outro' })).toContain('Sauvegarde pour plus tard');
    expect(render({ slideRole: 'body' })).not.toContain('Sauvegarde pour plus tard');
    expect(render({ slideRole: 'cover' })).not.toContain('Sauvegarde pour plus tard');
  });

  it('reste lisible sans slideIndex ni slideTotal', () => {
    const html = render({ slideRole: 'body', slideIndex: undefined, slideTotal: undefined });
    expect(html).toContain('01 / 01');
    expect(html).not.toContain('NaN');
  });
});

describe('ask — les stories', () => {
  it("réserve les zones de sécurité Instagram en haut et en bas", () => {
    const { w, h } = FORMATS['9:16'];
    const html = buildTemplate(payload('ask', '9:16'), w, h);
    const top = Math.round(h * 0.13);
    const bottom = Math.round(h * 0.16);
    expect(html).toContain(`padding:${top}px ${Math.round(w * 0.085)}px ${bottom}px`);
    // Sans ces marges, l'interface d'Instagram tronque le texte.
    expect(top).toBeGreaterThanOrEqual(240);
    expect(bottom).toBeGreaterThanOrEqual(300);
  });

  it('rend les options de sondage quand il y en a, et rien sinon', () => {
    const { w, h } = FORMATS['9:16'];
    expect(buildTemplate(payload('ask', '9:16'), w, h)).toContain('Jamais touchée');
    const sans = buildTemplate({ ...payload('ask', '9:16'), options: [] }, w, h);
    expect(sans).not.toContain('Jamais touchée');
    expect(sans).not.toContain('undefined');
  });
});

describe('validation de la requête — ce que le handler accepte', () => {
  /**
   * Reproduit la garde de `functions/src/socialCard.ts`. Elle exigeait `title` pour TOUS les
   * gabarits, alors que `stat` porte son texte dans `stat` (le grand chiffre) : une charge
   * parfaitement valide était rejetée en 400. Découvert en testant le service déployé.
   */
  const accepte = (p: Partial<CardPayload>): boolean => {
    if (!p || !p.template || !p.format) return false;
    return p.template === 'stat' ? Boolean(p.stat || p.title) : Boolean(p.title);
  };

  it('accepte un `stat` qui n’a que son chiffre', () => {
    expect(accepte({ template: 'stat', format: '4:5', stat: '+1 790 %' })).toBe(true);
  });

  it('accepte un `stat` qui n’a qu’un titre — le gabarit sait retomber dessus', () => {
    expect(accepte({ template: 'stat', format: '4:5', title: '33 clients' })).toBe(true);
  });

  it('refuse un `stat` sans chiffre ni titre', () => {
    expect(accepte({ template: 'stat', format: '4:5' })).toBe(false);
  });

  it('exige toujours un titre pour les autres gabarits', () => {
    expect(accepte({ template: 'poster', format: '4:5' })).toBe(false);
    expect(accepte({ template: 'poster', format: '4:5', title: 'T' })).toBe(true);
  });

  it('exige toujours template et format', () => {
    expect(accepte({ format: '4:5', title: 'T' })).toBe(false);
    expect(accepte({ template: 'poster', title: 'T' })).toBe(false);
  });
});

describe('champs optionnels absents', () => {
  // Les agents remplissent ce qu'ils ont ; un champ manquant ne doit jamais produire un visuel cassé.
  const nu = (template: TemplateName): CardPayload => ({ template, format: '4:5', title: 'Titre seul' });

  for (const template of ALL_TEMPLATES) {
    it(`${template} se rend avec le seul titre`, () => {
      const html = buildTemplate(nu(template), 1080, 1350);
      expect(html).toContain('Titre');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
      expect(count(html, '<div')).toBe(count(html, 'display:flex'));
    });
  }

  it('stat retombe sur le titre quand aucun chiffre n’est fourni', () => {
    const html = buildTemplate({ template: 'stat', format: '4:5', title: '33 clients' }, 1080, 1350);
    expect(html).toContain('33 clients');
  });

  it('checklist plafonne à 6 items et versus à 5 par colonne', () => {
    const many = Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`);
    const check = buildTemplate({ template: 'checklist', format: '4:5', title: 'T', items: many }, 1080, 1350);
    expect(check).toContain('Item 6');
    expect(check).not.toContain('Item 7');

    const vs = buildTemplate(
      { template: 'versus', format: '4:5', title: 'T', leftItems: many, rightItems: many },
      1080, 1350
    );
    expect(vs).toContain('Item 5');
    expect(vs).not.toContain('Item 6');
  });
});
