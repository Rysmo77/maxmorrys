import { describe, it, expect } from 'vitest';
import {
  PACKS, PLANS,
  recommend, computeTotals, depositAmount, balanceAmount,
  isValidQuoteRef, generateQuoteRef,
  findPack, findPlan, packEffectivePrice,
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
      expect(packEffectivePrice(pack)).toBeGreaterThanOrEqual(pack.floorPrice);
    }
  });

  /**
   * LE PRIX AFFICHÉ EST LE PRIX DEVISÉ — la seule chose que cette page promet vraiment.
   *
   * La page lisait `promoPrice ?? price` de son côté, `computeTotals()` lisait `price` du
   * sien : Présence Locale s'affichait à 250 000 et le devis ouvert derrière le même bouton
   * en annonçait 295 000. Ce test tient les deux lectures ensemble, pour tous les packs et
   * pas seulement pour celui qui portait une promo le jour où le défaut a été trouvé.
   */
  it('devise chaque pack au montant que la page affiche', () => {
    for (const pack of PACKS) {
      expect(computeTotals(pack.key, 'aucun').packPrice).toBe(packEffectivePrice(pack));
      expect(computeTotals(pack.key, 'aucun').setupDue).toBe(packEffectivePrice(pack));
    }
  });

  it('encaisse la promo quand elle existe, le prix de liste sinon', () => {
    expect(packEffectivePrice(findPack('presence')!)).toBe(250_000);
    expect(packEffectivePrice(findPack('visible')!)).toBe(495_000);
    expect(packEffectivePrice(findPack('boutique')!)).toBe(895_000);
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
  /**
   * SETUP-FIRST : LES DEUX MISES EN PLACE NE S'ADDITIONNENT PAS À LA SIGNATURE.
   *
   * `upfront` valait `packPrice + planSetup` et portait le libellé « Total à la mise en
   * place », avec l'échéancier 60/40 calculé dessus. Un prospect orienté vers Boutique +
   * Commerce 360 lisait donc 1 645 000 F exigibles à la signature, avant six mois à
   * 225 000 — la facture de première année que `docs/OFFRE_AGENCE_TPE.md` (§ 4, setup-first ;
   * § 149, conversion à J+30) et la maquette `GrilleComplete` interdisent tous deux
   * d'annoncer.
   *
   * Le total combiné n'a pas disparu : il vit dans `pipelineValue`, où il est juste, et sert
   * au pipeline commercial. Il ne doit jamais atteindre un écran de prospect ni
   * `depositAmount()`.
   */
  it('ne demande à la signature que la mise en place du pack', () => {
    const t = computeTotals('visible', 'croissance');
    expect(t.packPrice).toBe(495_000);
    expect(t.planSetup).toBe(375_000);
    expect(t.planMonthly).toBe(175_000);
    expect(t.setupDue).toBe(495_000);
  });

  it('garde la valeur d’affaire combinée pour le pipeline, à part', () => {
    const t = computeTotals('visible', 'croissance');
    expect(t.pipelineValue).toBe(870_000);
    expect(t.pipelineValue).toBe(t.packPrice + t.planSetup);
  });

  it('le cas le plus cher ne fait jamais porter l’accompagnement à l’acompte', () => {
    const t = computeTotals('boutique', 'commerce360');
    expect(t.setupDue).toBe(895_000);                 // et non 1 645 000
    expect(depositAmount(t.setupDue)).toBe(537_000);  // 60 % de la seule mise en place
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
    expect(computeTotals('undecided', 'aucun').setupDue).toBe(0);
    // 250 000 et non 295 000 : c'est la PROMO qui est due, celle que la page affiche.
    // Cette ligne attendait le prix de liste et scellait l'écart page/devis.
    expect(computeTotals('presence', 'aucun').setupDue).toBe(250_000);
    // Un accompagnement SANS pack ne crée aucune échéance de mise en place : sa propre mise
    // en place se décide plus tard, elle ne devient pas l'acompte d'aujourd'hui.
    expect(computeTotals('undecided', 'croissance').setupDue).toBe(0);
    expect(computeTotals('undecided', 'croissance').pipelineValue).toBe(375_000);
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
    /* Le message part AU PROSPECT : il annonce la mise en place du pack — 495 000, dont 60 %
       = 297 000 — et rien de plus. L'accompagnement est déjà sur sa propre ligne, avec sa
       mise en place et son mensuel ; l'additionner ici remettrait l'abonnement dans l'acompte
       et annoncerait 870 000 exigibles tout de suite. Setup-first : la mise en place se signe
       seule, l'accompagnement se décide à J+30. */
    expect(msg).toContain('495 000 FCFA');
    expect(msg).toContain('297 000 FCFA');
    expect(msg).not.toContain('870 000');
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
