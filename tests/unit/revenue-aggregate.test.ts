import { describe, it, expect } from 'vitest';

import { agregerRevenu, bornePeriode, LIGNES_BUSINESS, PERIODES } from '../../src/lib/admin/revenue';
import type { Transaction } from '../../src/types';

/**
 * Ce module produit les seuls chiffres d'argent que la console affiche. Une erreur ici ne se
 * voit pas : un revenu faux ressemble exactement à un revenu vrai.
 */

const MAINTENANT = new Date('2026-09-04T12:00:00.000Z');

/** Une date à N jours avant `MAINTENANT`, en ISO. */
function ilYA(jours: number): string {
  const d = new Date(MAINTENANT);
  d.setUTCDate(d.getUTCDate() - jours);
  return d.toISOString();
}

function tx(p: Partial<Transaction>): Transaction {
  return {
    id: 'x', userId: 'u', formationId: 'f', amount: 0, currency: 'XOF',
    status: 'completed', paymentMethod: 'bictorys', createdAt: ilYA(1),
    ...p,
  } as Transaction;
}

describe('bornePeriode', () => {
  it('rend null pour « tout », qui n’a pas de borne', () => {
    expect(bornePeriode('tout', MAINTENANT)).toBeNull();
  });

  it('recule du bon nombre de jours', () => {
    expect(bornePeriode('mois', MAINTENANT)).toBe(ilYA(30));
    expect(bornePeriode('trimestre', MAINTENANT)).toBe(ilYA(90));
    expect(bornePeriode('annee', MAINTENANT)).toBe(ilYA(365));
  });

  /*
   * La comparaison de période est lexicographique sur des chaînes ISO. Ce test fige la
   * propriété qui l'autorise : à fuseau constant, l'ordre des chaînes EST l'ordre des dates.
   */
  it('produit une borne comparable en tant que chaîne', () => {
    const borne = bornePeriode('mois', MAINTENANT)!;
    expect(ilYA(29) > borne).toBe(true);
    expect(ilYA(31) > borne).toBe(false);
  });

  it('couvre les quatre périodes proposées', () => {
    expect(PERIODES).toHaveLength(4);
    for (const p of PERIODES) expect(() => bornePeriode(p, MAINTENANT)).not.toThrow();
  });
});

describe('agregerRevenu — ce qui compte dans quoi', () => {
  it('ne retient dans le brut que ce qui est encaissé', () => {
    const bilan = agregerRevenu(
      [
        tx({ ligne: 'formation', amount: 95000, status: 'completed' }),
        tx({ ligne: 'formation', amount: 95000, status: 'pending' }),
        tx({ ligne: 'formation', amount: 95000, status: 'failed' }),
      ],
      null,
    );
    expect(bilan.brut).toBe(95000);
    expect(bilan.ventes).toBe(1);
    expect(bilan.tentatives).toBe(3);
    expect(bilan.echecs).toBe(1);
  });

  it('soustrait les remboursements du net, sans toucher au brut', () => {
    const bilan = agregerRevenu(
      [
        tx({ ligne: 'club', amount: 19900, status: 'completed' }),
        tx({ ligne: 'club', amount: 19900, status: 'refunded' }),
      ],
      null,
    );
    expect(bilan.brut).toBe(19900);
    expect(bilan.rembourse).toBe(19900);
    expect(bilan.net).toBe(0);
    // Un remboursement n'est pas une vente négative : il ne retire pas la vente d'origine.
    expect(bilan.ventes).toBe(1);
  });

  it('ventile par ligne, dans l’ordre d’affichage et sans ligne vide', () => {
    const bilan = agregerRevenu(
      [
        tx({ ligne: 'rysmoPack', amount: 1500 }),
        tx({ ligne: 'formation', amount: 95000 }),
      ],
      null,
    );
    expect(bilan.lignes.map((l) => l.ligne)).toEqual(['formation', 'rysmoPack']);
  });

  it('ne fabrique pas de ligne pour un produit sans vente', () => {
    const bilan = agregerRevenu([tx({ ligne: 'club', amount: 19900 })], null);
    expect(bilan.lignes).toHaveLength(1);
    expect(LIGNES_BUSINESS.length).toBeGreaterThan(1);
  });
});

describe('agregerRevenu — les transactions sans ligne', () => {
  /*
   * ⚠️ LE CAS QUI JUSTIFIE LE SEAU SÉPARÉ. Les ranger dans `formation` — la ligne
   * majoritaire — donnerait un relevé qui a l'air complet et ne l'est pas.
   */
  it('les compte à part, jamais dans formation', () => {
    const bilan = agregerRevenu(
      [tx({ amount: 95000 }), tx({ ligne: 'formation', amount: 95000 })],
      null,
    );
    expect(bilan.nonReparties).toBe(1);
    expect(bilan.lignes.find((l) => l.ligne === 'formation')?.brut).toBe(95000);
    expect(bilan.lignes.find((l) => l.ligne === null)?.brut).toBe(95000);
  });

  it('les range en dernier, après les lignes connues', () => {
    const bilan = agregerRevenu(
      [tx({ amount: 1 }), tx({ ligne: 'rysmoPack', amount: 1 })],
      null,
    );
    expect(bilan.lignes[bilan.lignes.length - 1].ligne).toBeNull();
  });

  it('les compte quand même dans le total encaissé', () => {
    const bilan = agregerRevenu([tx({ amount: 50000 })], null);
    expect(bilan.brut).toBe(50000);
  });
});

describe('agregerRevenu — la période', () => {
  it('écarte ce qui est antérieur à la borne', () => {
    const bilan = agregerRevenu(
      [tx({ ligne: 'formation', amount: 95000, createdAt: ilYA(40) })],
      bornePeriode('mois', MAINTENANT),
    );
    expect(bilan.tentatives).toBe(0);
    expect(bilan.brut).toBe(0);
  });

  it('garde ce qui est dans la fenêtre', () => {
    const bilan = agregerRevenu(
      [tx({ ligne: 'formation', amount: 95000, createdAt: ilYA(10) })],
      bornePeriode('mois', MAINTENANT),
    );
    expect(bilan.brut).toBe(95000);
  });

  /*
   * Un remboursement est daté de SA journée. Celui-ci sort donc de la fenêtre, alors que la
   * vente d'origine y est restée : c'est voulu, et c'est ce que le pied de l'écran doit dire.
   */
  it('ne rattrape pas un remboursement daté hors période', () => {
    const bilan = agregerRevenu(
      [
        tx({ ligne: 'club', amount: 19900, status: 'completed', createdAt: ilYA(5) }),
        tx({ ligne: 'club', amount: 19900, status: 'refunded', createdAt: ilYA(200) }),
      ],
      bornePeriode('mois', MAINTENANT),
    );
    expect(bilan.rembourse).toBe(0);
    expect(bilan.net).toBe(19900);
  });

  it('une transaction sans date est hors de toute période bornée, mais présente sur « tout »', () => {
    const sansDate = [tx({ ligne: 'formation', amount: 95000, createdAt: undefined })];
    expect(agregerRevenu(sansDate, bornePeriode('mois', MAINTENANT)).tentatives).toBe(0);
    expect(agregerRevenu(sansDate, null).tentatives).toBe(1);
  });
});

describe('agregerRevenu — les taux et les moyennes portent leur dénominateur', () => {
  /*
   * ⚠️ À ZÉRO TENTATIVE, IL N'Y A PAS DE TAUX. « 0 % » affirmerait qu'aucun paiement n'a
   * échoué, alors qu'aucun n'a été tenté. `null` fait rendre « non relevé ».
   */
  it('rend null plutôt que 0 % quand rien n’a été tenté', () => {
    expect(agregerRevenu([], null).tauxEchec).toBeNull();
  });

  it('calcule le taux sur toutes les tentatives, abandons compris', () => {
    const bilan = agregerRevenu(
      [
        tx({ ligne: 'formation', status: 'failed' }),
        tx({ ligne: 'formation', status: 'pending' }),
        tx({ ligne: 'formation', status: 'completed' }),
        tx({ ligne: 'formation', status: 'completed' }),
      ],
      null,
    );
    expect(bilan.tauxEchec).toBe(25);
  });

  it('rend null plutôt que 0 pour un panier moyen sans vente', () => {
    expect(agregerRevenu([tx({ ligne: 'formation', status: 'failed' })], null).panierMoyen).toBeNull();
  });

  it('calcule le panier moyen sur les seules ventes encaissées', () => {
    const bilan = agregerRevenu(
      [
        tx({ ligne: 'formation', amount: 100000, status: 'completed' }),
        tx({ ligne: 'formation', amount: 50000, status: 'completed' }),
        tx({ ligne: 'formation', amount: 999999, status: 'failed' }),
      ],
      null,
    );
    expect(bilan.panierMoyen).toBe(75000);
    expect(bilan.lignes[0].panierMoyen).toBe(75000);
  });
});
