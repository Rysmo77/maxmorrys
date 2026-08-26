import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getVariant } from '../../src/lib/popups/variant';
import { markCartPending, getPendingCart, clearCartPending } from '../../src/lib/popups/cart';

function makeStorage(): Storage {
  let data: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = String(v); },
    removeItem: (k: string) => { delete data[k]; },
    clear: () => { data = {}; },
    key: (i: number) => Object.keys(data)[i] ?? null,
    get length() { return Object.keys(data).length; },
  } as Storage;
}

let uuidCounter = 0;

beforeEach(() => {
  uuidCounter = 0;
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', makeStorage());
  vi.stubGlobal('crypto', {
    randomUUID: () => `00000000-0000-4000-8000-${String(uuidCounter++).padStart(12, '0')}`,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('répartition A/B', () => {
  it('est STABLE pour un même visiteur', () => {
    // Une répartition retirée à chaque visite mélangerait les deux populations
    // et rendrait toute comparaison inexploitable.
    const first = getVariant(0.5);
    for (let i = 0; i < 20; i += 1) expect(getVariant(0.5)).toBe(first);
  });

  it('à 0, tout le monde est témoin — le dispositif est éteint', () => {
    expect(getVariant(0)).toBe('control');
  });

  it('à 1, plus personne n’est témoin', () => {
    expect(getVariant(1)).toBe('treatment');
  });

  it('répartit à peu près moitié-moitié sur un grand nombre de visiteurs', () => {
    let treatment = 0;
    const total = 400;
    for (let i = 0; i < total; i += 1) {
      localStorage.clear();
      if (getVariant(0.5) === 'treatment') treatment += 1;
    }
    // Tolérance large : on vérifie l'absence de biais grossier, pas une précision statistique.
    expect(treatment).toBeGreaterThan(total * 0.35);
    expect(treatment).toBeLessThan(total * 0.65);
  });

  it('sans stockage, expose plutôt que de priver le visiteur', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    } as unknown as Storage);
    expect(getVariant(0.5)).toBe('treatment');
  });
});

describe('marqueur de panier abandonné', () => {
  it('retient le slug laissé en plan', () => {
    markCartPending('ma-formation');
    expect(getPendingCart()).toBe('ma-formation');
  });

  it('s’efface au paiement abouti', () => {
    markCartPending('ma-formation');
    clearCartPending();
    expect(getPendingCart()).toBeNull();
  });

  it('EXPIRE à sept jours', () => {
    // Sans expiration, un abandon vieux de six mois ressortirait comme une nouveauté,
    // avec un prix affiché probablement faux.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    markCartPending('ma-formation');

    vi.setSystemTime(new Date('2026-01-05T00:00:00Z'));
    expect(getPendingCart()).toBe('ma-formation');

    vi.setSystemTime(new Date('2026-01-10T00:00:00Z'));
    expect(getPendingCart()).toBeNull();
  });

  it('ignore un contenu corrompu au lieu de jeter', () => {
    localStorage.setItem('mm-cart-pending', 'pas du json');
    expect(getPendingCart()).toBeNull();
    localStorage.setItem('mm-cart-pending', '{"slug":42}');
    expect(getPendingCart()).toBeNull();
  });
});
