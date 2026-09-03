/**
 * Garde-fou de la contrevaleur euro / dollar.
 *
 * Ce que ce test protège n'est PAS l'exactitude du change — un arrondi de lisibilité n'a pas
 * à être exact. Il protège trois promesses que l'interface tient à l'écran :
 *
 *   1. LE FRANC RESTE LA DEVISE DU DÉBIT. La contrevaleur ne doit jamais pouvoir être prise
 *      pour un prix : elle porte toujours son « ≈ », dans les deux langues, sans exception.
 *   2. LA PARITÉ EURO EST FIXE ET EXACTE. 1 € = 655,957 FCFA est garanti par le Trésor ;
 *      une « mise à jour » de cette constante serait une erreur, jamais un rafraîchissement.
 *   3. L'ARRONDI NE MENT PAS D'UN ORDRE DE GRANDEUR. Le palier grossit avec le montant, ce
 *      qui est correct tant que l'erreur relative reste petite — c'est ce qui est vérifié.
 *
 * ⚠️ Ce test NE CASSE PAS quand le taux dollar vieillit. Un relevé daté qui prend de l'âge
 * reste honnête ; ce qui serait malhonnête, c'est un taux neuf sous une vieille date. Il
 * vérifie donc la COHÉRENCE du couple `EUR_USD` / `FX_AS_OF`, et se contente d'un avertissement
 * au-delà de `FX_STALE_AFTER_DAYS`. Casser un déploiement un matin au hasard sur une dérive de
 * change n'aiderait personne — voir l'en-tête de `src/lib/currency/convert.ts`.
 */
import { describe, it, expect } from 'vitest';

import {
  EUR_USD,
  FX_AS_OF,
  FX_STALE_AFTER_DAYS,
  SECONDARY_CURRENCY,
  XOF_PER_EUR,
  convertFromXof,
  formatSecondary,
  isFxStale,
  xofPerUnit,
} from '../../src/lib/currency/convert';
import { CLUB_PRICE_XOF } from '../../src/lib/club/pricing';
import { PACKS, packEffectivePrice } from '../../src/lib/presence/offer';

/**
 * Espaces fines et insécables des locales Intl, ramenées à une espace ordinaire.
 * Écrites en échappement, comme dans `club-pricing.test.ts` : à l'écran elles sont
 * indiscernables d'une espace ordinaire, et `no-irregular-whitespace` les refuse en littéral
 * de regex — la règle a raison, une classe de caractères invisibles ne se relit pas.
 */
const normalize = (s: string) => s.replace(/[\u202f\u00a0\u2009\u2007]/g, ' ');

describe('la devise secondaire suit la langue, et rien d\'autre', () => {
  it('euro en français, dollar US en anglais', () => {
    expect(SECONDARY_CURRENCY.fr).toBe('EUR');
    expect(SECONDARY_CURRENCY.en).toBe('USD');
  });
});

describe('la parité euro est fixe — elle ne se « rafraîchit » pas', () => {
  it('vaut exactement la parité garantie par le Trésor', () => {
    expect(XOF_PER_EUR).toBe(655.957);
  });

  it('le dollar passe par l\'euro, faute de parité XOF/USD', () => {
    expect(xofPerUnit('USD')).toBeCloseTo(XOF_PER_EUR / EUR_USD, 6);
  });
});

describe('le relevé dollar est daté, et sa date est cohérente', () => {
  it('EUR_USD tient dans une fourchette plausible', () => {
    // Large à dessein : la borne attrape la faute de frappe (6,5 au lieu de 1,16), pas la
    // dérive de marché. Une garde étroite deviendrait fausse avant d'être utile.
    expect(EUR_USD).toBeGreaterThan(0.8);
    expect(EUR_USD).toBeLessThan(1.6);
  });

  it('FX_AS_OF n\'est pas dans le futur', () => {
    expect(FX_AS_OF.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('signale un relevé vieilli sans faire échouer la CI', () => {
    if (isFxStale()) {
      const jours = Math.floor((Date.now() - FX_AS_OF.getTime()) / 86_400_000);
      console.warn(
        `⚠️ Le taux EUR/USD date de ${jours} jours (seuil : ${FX_STALE_AFTER_DAYS}). ` +
        'Mettre à jour EUR_USD ET FX_AS_OF ensemble dans src/lib/currency/convert.ts.',
      );
    }
    expect(FX_STALE_AFTER_DAYS).toBeGreaterThan(0);
  });
});

describe('rien ne se convertit qui ne soit un montant', () => {
  it('zéro et négatif ne produisent pas de contrevaleur', () => {
    // Un « ≈ 0 € » sous une option gratuite dirait le contraire de ce qu'il montre.
    expect(convertFromXof(0, 'EUR')).toBeNull();
    expect(convertFromXof(-1, 'EUR')).toBeNull();
    expect(convertFromXof(Number.NaN, 'USD')).toBeNull();
    expect(formatSecondary(0, 'fr', 'fr-FR')).toBeNull();
  });
});

describe('l\'arrondi de lisibilité reste dans son ordre de grandeur', () => {
  const MONTANTS = [1_000, 1_658, 19_900, 16_915, 45_000, 250_000, 495_000, 895_000];

  /*
    5 %, et pas moins : c'est la borne du palier le plus bas, atteinte juste au-dessus d'un
    changement de cran. Elle a une histoire — écrite d'abord à 3 %, elle a fait échouer
    1 000 FCFA en dollar (1,77 $ arrondi à 2 $, soit 13 %) et révélé qu'il manquait un
    palier sous 3. La borne reste donc serrée : c'est elle qui a trouvé le défaut.
  */
  const TOLERANCE = 0.05;

  it.each(MONTANTS)('%i FCFA : reste dans son ordre de grandeur en euro', (xof) => {
    const exact = xof / XOF_PER_EUR;
    const affiche = convertFromXof(xof, 'EUR')!;
    expect(Math.abs(affiche - exact) / exact).toBeLessThan(TOLERANCE);
  });

  it.each(MONTANTS)('%i FCFA : reste dans son ordre de grandeur en dollar', (xof) => {
    const exact = xof / xofPerUnit('USD');
    const affiche = convertFromXof(xof, 'USD')!;
    expect(Math.abs(affiche - exact) / exact).toBeLessThan(TOLERANCE);
  });

  /*
    La borne serrée porte sur la CONTREVALEUR, pas sur le montant en francs — nuance qui a
    d'abord été écrite à l'envers : 45 000 FCFA font 68,6 €, un nombre à deux chiffres, et
    son cran d'arrondi est celui des deux chiffres. Ce sont les montants que le visiteur lit
    à trois chiffres ou plus qui doivent être quasi exacts, parce que ce sont eux qu'il
    compare — les trois packs, les deux formules.
  */
  it('une contrevaleur à trois chiffres ou plus tombe sous 0,5 %', () => {
    for (const xof of [250_000, 375_000, 495_000, 750_000, 895_000]) {
      const exact = xof / XOF_PER_EUR;
      const affiche = convertFromXof(xof, 'EUR')!;
      expect(affiche).toBeGreaterThanOrEqual(100);
      expect(Math.abs(affiche - exact) / exact).toBeLessThan(0.005);
    }
  });

  it('garde une décimale utile sous 10, où arrondir à l\'unité surestimerait', () => {
    // 1 658 FCFA = 2,53 € : arrondi à 3 €, c'est +19 % sur l'équivalent mensuel du Club,
    // c'est-à-dire précisément le chiffre qui sert à dédramatiser le prix annuel.
    expect(convertFromXof(1_658, 'EUR')).toBe(2.5);
  });
});

describe('le « ≈ » ne se perd jamais — sans lui, c\'est un second prix affiché', () => {
  const CAS: [number, string][] = [
    [CLUB_PRICE_XOF, 'abonnement annuel du Club'],
    [packEffectivePrice(PACKS[0]), 'pack Présence Locale'],
  ];

  /*
    L'espace du séparateur est INSÉCABLE (U+00A0), et le test l'écrit en échappement plutôt
    qu'au clavier : les deux espaces sont identiques à l'œil dans un diff, et une assertion
    sur la mauvaise passerait pour un défaut du code. Elle est insécable parce qu'un « ≈ »
    resté seul en fin de ligne ne signale plus rien — il devient une puce.
  */
  const SIGNE = /^\u2248\u00a0/;

  it.each(CAS)('%i (%s) porte son signe dans les deux langues', (xof) => {
    expect(formatSecondary(xof, 'fr', 'fr-FR')).toMatch(SIGNE);
    expect(formatSecondary(xof, 'en', 'en-US')).toMatch(SIGNE);
  });

  it('écrit l\'euro en français et le dollar en anglais', () => {
    expect(normalize(formatSecondary(CLUB_PRICE_XOF, 'fr', 'fr-FR')!)).toContain('€');
    expect(formatSecondary(CLUB_PRICE_XOF, 'en', 'en-US')).toContain('$');
  });

  it('ne montre jamais une seule décimale — « 2,50 € » est un prix, « 2,5 € » un calcul', () => {
    for (const xof of [1_000, 1_658, 3_500, 19_900, 250_000]) {
      for (const [lang, locale] of [['fr', 'fr-FR'], ['en', 'en-US']] as const) {
        const written = normalize(formatSecondary(xof, lang, locale)!);
        expect(written).not.toMatch(/[.,]\d(?!\d)/);
      }
    }
  });
});
