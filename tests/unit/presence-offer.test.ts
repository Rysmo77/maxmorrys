import { describe, it, expect } from 'vitest';
import {
  PACKS, PLANS,
  recommend, computeTotals, depositAmount, balanceAmount,
  isValidQuoteRef, generateQuoteRef,
  findPack, findPlan,
} from '../../src/lib/presence/offer';
import { buildWhatsAppMessage, whatsappUrl } from '../../src/lib/presence/whatsapp';
import { localizeSegments, canonicalizeSegments } from '../../src/i18n/segments';

describe('grille tarifaire', () => {
  it('respecte les montants du kit commercial', () => {
    expect(findPack('presence')?.price).toBe(295_000);
    expect(findPack('visible')?.price).toBe(495_000);
    expect(findPack('boutique')?.price).toBe(895_000);
    expect(findPlan('croissance')).toMatchObject({ setupPrice: 375_000, monthlyPrice: 175_000 });
    expect(findPlan('commerce360')).toMatchObject({ setupPrice: 750_000, monthlyPrice: 225_000 });
  });

  it('désigne Commerce Visible comme offre principale, et elle seule', () => {
    expect(PACKS.filter((p) => p.featured).map((p) => p.key)).toEqual(['visible']);
    expect(PLANS.filter((p) => p.featured).map((p) => p.key)).toEqual(['croissance']);
  });

  it('garde chaque plancher strictement sous son prix affiché', () => {
    for (const pack of PACKS) {
      expect(pack.floorPrice).toBeLessThan(pack.price);
      expect(pack.promoPrice ?? pack.price).toBeGreaterThanOrEqual(pack.floorPrice);
    }
  });
});

describe('recommend', () => {
  it('ne recommande rien tant que les trois questions ne sont pas répondues', () => {
    expect(recommend({})).toBeNull();
    expect(recommend({ site: 'none', products: 'few' })).toBeNull();
  });

  it('impose Boutique Digitale dès que le client veut encaisser en ligne', () => {
    // Aucun autre pack ne porte le paiement : cette règle prime sur toutes les autres.
    for (const site of ['none', 'outdated', 'working'] as const) {
      expect(recommend({ site, products: 'online', publishing: 'nobody' })?.pack).toBe('boutique');
    }
  });

  it('associe Commerce 360 à la boutique quand personne ne publie', () => {
    expect(recommend({ site: 'none', products: 'online', publishing: 'nobody' })?.plan)
      .toBe('commerce360');
    // Le commerçant qui publie déjà régulièrement n'a pas besoin qu'on le remplace.
    expect(recommend({ site: 'none', products: 'online', publishing: 'myself' })?.plan)
      .toBe('aucun');
  });

  it('oriente vers Commerce Visible au-delà de vingt produits', () => {
    expect(recommend({ site: 'none', products: 'many', publishing: 'nobody' })?.pack)
      .toBe('visible');
  });

  it('ne refait pas un site qui fonctionne : il vend le pilotage', () => {
    const reco = recommend({ site: 'working', products: 'services', publishing: 'irregular' });
    expect(reco?.pack).toBe('presence');
    expect(reco?.plan).toBe('croissance');
  });

  it('propose Croissance dès que la publication est absente ou irrégulière', () => {
    for (const publishing of ['nobody', 'irregular'] as const) {
      expect(recommend({ site: 'none', products: 'services', publishing })?.plan)
        .toBe('croissance');
    }
    expect(recommend({ site: 'none', products: 'services', publishing: 'myself' })?.plan)
      .toBe('aucun');
  });

  it('justifie toujours sa recommandation', () => {
    const reco = recommend({ site: 'outdated', products: 'few', publishing: 'nobody' });
    expect(reco?.reasonKey).toBeTruthy();
  });
});

describe('computeTotals', () => {
  it('additionne mise en place du pack et de l’accompagnement', () => {
    const t = computeTotals('visible', 'croissance');
    expect(t.packPrice).toBe(495_000);
    expect(t.planSetup).toBe(375_000);
    expect(t.planMonthly).toBe(175_000);
    expect(t.upfront).toBe(870_000);
  });

  it('calcule le total d’engagement de Commerce 360 sur 6 mois', () => {
    const t = computeTotals('boutique', 'commerce360');
    expect(t.commitmentMonths).toBe(6);
    // 750 000 + 225 000 × 6 — le chiffre annoncé au client.
    expect(t.commitmentTotal).toBe(2_100_000);
  });

  it('n’expose pas d’engagement pour une formule qui n’en a pas', () => {
    expect(computeTotals('presence', 'croissance').commitmentTotal).toBeUndefined();
  });

  it('tolère un devis sans pack ou sans accompagnement', () => {
    expect(computeTotals('undecided', 'aucun').upfront).toBe(0);
    expect(computeTotals('presence', 'aucun').upfront).toBe(295_000);
    expect(computeTotals('undecided', 'croissance').upfront).toBe(375_000);
  });
});

describe('échéancier 60/40', () => {
  it('découpe le montant sans jamais perdre ni créer de franc', () => {
    for (const amount of [295_000, 495_000, 870_000, 1_645_000, 0, 1]) {
      expect(depositAmount(amount) + balanceAmount(amount)).toBe(amount);
    }
  });

  it('affecte bien 60 % à la commande', () => {
    expect(depositAmount(495_000)).toBe(297_000);
    expect(balanceAmount(495_000)).toBe(198_000);
  });
});

describe('référence de devis', () => {
  it('génère une référence au format attendu', () => {
    const ref = generateQuoteRef();
    expect(ref).toMatch(/^DV-[0-9A-F]{12}$/);
    expect(isValidQuoteRef(ref)).toBe(true);
  });

  it('rejette les références malformées avant tout appel Firestore', () => {
    for (const bad of ['', 'DV-', 'DV-XYZ', 'dv-0123456789ab', '0123456789AB',
                       'DV-0123456789ABC', 'DV-0123456789A']) {
      expect(isValidQuoteRef(bad)).toBe(false);
    }
  });

  it('ne produit pas deux fois la même référence', () => {
    const refs = new Set(Array.from({ length: 200 }, generateQuoteRef));
    expect(refs.size).toBe(200);
  });
});

describe('URL localisées de l’offre', () => {
  it('traduit la page agence et le devis partageable', () => {
    expect(localizeSegments('agence', 'en')).toBe('agency');
    expect(localizeSegments('agence/devis/DV-0123456789AB', 'en'))
      .toBe('agency/quote/DV-0123456789AB');
  });

  it('reconstruit le chemin FR canonique depuis l’anglais', () => {
    expect(canonicalizeSegments('agency/quote/DV-0123456789AB'))
      .toBe('agence/devis/DV-0123456789AB');
  });
});

describe('buildWhatsAppMessage', () => {
  // `toLocaleString('fr-FR')` sépare les milliers par une espace fine insécable (U+202F) ou
  // insécable (U+00A0) selon la plateforme. On les normalise en espace simple — écrits en
  // échappement plutôt qu'en littéral : deux caractères invisibles dans une regex ne se relisent pas.
  const fmt = (n: number) => `${n.toLocaleString('fr-FR').replace(/\u202F|\u00A0/g, ' ')} FCFA`;
  const labels = {
    greeting: 'Bonjour Max-Morrys',
    intro: 'Je viens de remplir ma demande.',
    sectorLabel: 'Restaurant',
    monthlySuffix: 'puis 175 000 FCFA par mois',
    upfrontLabel: 'Total mise en place',
    depositLabel: '60% à la commande',
    quoteLabel: 'Mon récap',
  };
  const base = {
    businessName: 'Restaurant Le Baobab',
    city: 'Dakar, Point E',
    formatPrice: fmt,
  };

  it('reprend les montants exacts de la grille et l’acompte de 60 %', () => {
    const msg = buildWhatsAppMessage({
      ...base,
      pack: 'visible',
      plan: 'croissance',
      labels: { ...labels, packName: 'Commerce Visible', planName: 'Croissance Automatisée' },
    });
    expect(msg).toContain('Commerce Visible — 495 000 FCFA');
    expect(msg).toContain('Croissance Automatisée — 375 000 FCFA');
    // 495 000 + 375 000 = 870 000, dont 60% = 522 000
    expect(msg).toContain('870 000 FCFA');
    expect(msg).toContain('522 000 FCFA');
  });

  it('omet proprement les blocs absents, sans « undefined » ni ligne vide', () => {
    const msg = buildWhatsAppMessage({
      ...base,
      pack: 'undecided',
      plan: 'aucun',
      labels: { ...labels, sectorLabel: undefined, monthlySuffix: undefined },
    });
    expect(msg).not.toContain('undefined');
    expect(msg).not.toContain('NaN');
    expect(msg).not.toMatch(/\n{3,}/);
    expect(msg).toContain('Restaurant Le Baobab — Dakar, Point E');
    // Aucun montant : la ligne « total » n'a pas lieu d'être.
    expect(msg).not.toContain('Total mise en place');
  });

  it('inclut le lien du récapitulatif quand il existe', () => {
    const url = 'https://maxmorrys.me/agence/devis/DV-0123456789AB';
    const msg = buildWhatsAppMessage({
      ...base, pack: 'presence', plan: 'aucun',
      quoteUrl: url,
      labels: { ...labels, packName: 'Présence Locale' },
    });
    expect(msg).toContain(url);
  });

  it('tronque le message libre : une URL wa.me trop longue casse sur Android', () => {
    const msg = buildWhatsAppMessage({
      ...base, pack: 'presence', plan: 'aucun',
      message: 'a'.repeat(2000),
      labels: { ...labels, packName: 'Présence Locale' },
    });
    expect(msg).toContain('…');
    expect(msg.length).toBeLessThan(700);
  });

  it('normalise les espaces du message libre', () => {
    const msg = buildWhatsAppMessage({
      ...base, pack: 'undecided', plan: 'aucun',
      message: '  je vends\n\n\ndes   tissus  ',
      labels,
    });
    expect(msg).toContain('« je vends des tissus »');
  });

  it('ne se termine jamais par un blanc', () => {
    const msg = buildWhatsAppMessage({ ...base, pack: 'undecided', plan: 'aucun', labels });
    expect(msg).toBe(msg.trim());
  });
});

describe('whatsappUrl', () => {
  it('encode le message et cible le numéro unique du site', () => {
    expect(whatsappUrl()).toBe('https://wa.me/221776041985');
    expect(whatsappUrl('Bonjour & merci')).toBe(
      'https://wa.me/221776041985?text=Bonjour%20%26%20merci',
    );
  });
});
