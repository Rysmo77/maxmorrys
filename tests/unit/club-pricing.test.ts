/**
 * Garde-fou du prix du Club des Digitos.
 *
 * Les CGV ont annoncé 10 000 FCFA/an pendant que le code en débitait 19 900 : deux valeurs
 * introduites par deux commits distincts, sans point de contact, sur un abonnement engageant
 * douze mois. Ce test existe pour que cela ne puisse plus arriver silencieusement.
 *
 * ⚠️ Le texte des CGV est volontairement resté LITTÉRAL plutôt qu'interpolé : faire dériver
 * une clause contractuelle d'une constante ferait qu'un changement de code altère un engagement
 * juridique sans que personne ne le relise. La cohérence est donc vérifiée ici, pas imposée
 * par le rendu.
 *
 * ⚠️ Ce test ne peut PAS atteindre les miroirs serveur (`functions/src/payment.ts`,
 * `worker/apps/api/src/lib/bictorys.ts`) : les trois projets TypeScript du dépôt ne peuvent pas
 * s'importer entre eux. Ces deux-là restent sous surveillance humaine — voir l'en-tête de
 * `src/lib/club/pricing.ts`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import {
  CLUB_PRICE_XOF,
  CLUB_REFERRAL_DISCOUNT,
  clubReferralPrice,
} from '../../src/lib/club/pricing';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

const legal = { fr: read('src/i18n/locales/fr/legal.json'), en: read('src/i18n/locales/en/legal.json') };
const club = { fr: read('src/i18n/locales/fr/club.json'), en: read('src/i18n/locales/en/club.json') };

/**
 * Ramène tous les séparateurs de milliers à une espace simple.
 *
 * `toLocaleString('fr-FR')` produit une espace FINE INSÉCABLE (U+202F) là où le texte des CGV
 * porte une espace ordinaire (U+0020). Les deux se ressemblent à l'écran et diffèrent en
 * mémoire : sans normalisation, l'assertion échouerait sur une différence invisible.
 */
const normalize = (s: string) => s.replace(/[\u202f\u00a0\u2009\u2007]/g, ' ');

/** « 19 900 » en français, « 19,900 » en anglais — le séparateur diffère. */
const formatted = (lang: 'fr' | 'en') =>
  normalize(CLUB_PRICE_XOF.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US'));

describe('prix du Club — constante', () => {
  it('vaut 19 900 XOF', () => {
    expect(CLUB_PRICE_XOF).toBe(19900);
  });

  it('applique une remise de parrainage de 15 %', () => {
    expect(CLUB_REFERRAL_DISCOUNT).toBe(0.15);
  });

  it('donne 16 915 au filleul, avec le même arrondi que le serveur', () => {
    expect(clubReferralPrice()).toBe(Math.round(19900 * 0.85));
    expect(clubReferralPrice()).toBe(16915);
  });
});

describe('CGV — le contrat annonce le prix réellement débité', () => {
  for (const lang of ['fr', 'en'] as const) {
    it(`article 3.4 (${lang}) porte le montant de la constante`, () => {
      const item4 = normalize(legal[lang].cgv.art3.item4 as string);
      expect(item4).toContain(formatted(lang));
    });

    it(`article 3.4 (${lang}) ne contient plus l'ancien montant de 10 000`, () => {
      const item4 = normalize(legal[lang].cgv.art3.item4 as string);
      expect(item4).not.toMatch(/10[ ,]000/);
    });
  }
});

describe("interface — le prix n'est jamais recopié", () => {
  for (const lang of ['fr', 'en'] as const) {
    for (const key of ['tagline', 'activateSubtitle', 'joinCta'] as const) {
      it(`subscriptionGate.${key} (${lang}) passe par l'interpolation {{price}}`, () => {
        const value: string = club[lang].subscriptionGate[key];
        expect(value).toContain('{{price}}');
        // Un montant en dur rendrait l'interpolation décorative.
        expect(value).not.toMatch(/\d[\d  ,]{3,}/);
      });
    }
  }
});

describe('aucun montant du Club en dur dans le code client', () => {
  const sources = [
    'src/pages/Formations.tsx',
    'src/pages/Blog.tsx',
    'src/pages/Videos.tsx',
    'src/pages/Podcasts.tsx',
    'src/pages/lms/tabs/club/ClubSubscriptionGate.tsx',
    'src/pages/admin/hooks/useAdminClub.ts',
    'src/lib/firestore/club.ts',
  ];

  for (const file of sources) {
    it(`${file} dérive le prix au lieu de l'écrire`, () => {
      const code = readFileSync(file, 'utf8');
      // Ni « 19900 », ni « 19 900 » : la seule source admise est lib/club/pricing.
      expect(code).not.toMatch(/19[  ]?900/);
    });
  }
});
