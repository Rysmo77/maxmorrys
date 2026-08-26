import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  canShow, blockedBy, markShown, markSuppressed, clearAllPopupState,
} from '../../src/lib/popups/rules';

/**
 * Ces tests couvrent EXACTEMENT les verrous qui ont rendu les pop-ups muettes en production.
 * Chacun était invisible depuis l'interface ; aucun n'était couvert.
 */

/** Stockage en mémoire — la suite tourne sous Node, sans `window`. */
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

beforeEach(() => {
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', makeStorage());
  vi.stubGlobal('sessionStorage', makeStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('état vierge', () => {
  it('autorise une pop-up jamais vue', () => {
    expect(blockedBy('agencyExit')).toBeNull();
    expect(canShow('agencyExit')).toBe(true);
  });

  it('ne dépend PAS du consentement cookies', () => {
    // Régression : ce verrou empêchait toute pop-up chez qui ignorait le bandeau.
    localStorage.removeItem('mm-cookie-consent');
    expect(canShow('agencyExit')).toBe(true);
  });
});

describe('plafond de session', () => {
  it('bloque TOUTES les pop-ups dès qu’une s’est affichée', () => {
    markShown('agencyExit');
    expect(blockedBy('agencyExit')).toBe('sessionCap');
    expect(blockedBy('blogEnd')).toBe('sessionCap');
  });
});

describe('délai de sept jours', () => {
  it('bloque avant échéance et libère après', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    markShown('agencyExit');
    sessionStorage.removeItem('mm-popup-session'); // isole le délai du plafond de session

    vi.setSystemTime(new Date('2026-01-06T00:00:00Z')); // J+5
    expect(blockedBy('agencyExit')).toBe('cooldown');

    vi.setSystemTime(new Date('2026-01-09T00:00:00Z')); // J+8
    expect(blockedBy('agencyExit')).toBeNull();
  });
});

describe('suppression', () => {
  it('bloque trente jours, puis EXPIRE', () => {
    // Régression : la suppression était permanente. Un simple focus dans le formulaire de
    // /agence condamnait l'aiguilleur pour toujours dans ce navigateur.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    markSuppressed('agencyExit');

    vi.setSystemTime(new Date('2026-01-20T00:00:00Z')); // J+19
    expect(blockedBy('agencyExit')).toBe('suppressed');

    vi.setSystemTime(new Date('2026-02-05T00:00:00Z')); // J+35
    expect(blockedBy('agencyExit')).toBeNull();
  });

  it('n’affecte que la pop-up visée', () => {
    markSuppressed('agencyExit');
    expect(blockedBy('agencyExit')).toBe('suppressed');
    expect(blockedBy('presenceExit')).toBeNull();
  });
});

describe('clearAllPopupState', () => {
  it('lève tous les verrous d’un coup', () => {
    markShown('agencyExit');
    markSuppressed('blogEnd');
    expect(canShow('agencyExit')).toBe(false);

    clearAllPopupState();

    expect(blockedBy('agencyExit')).toBeNull();
    expect(blockedBy('blogEnd')).toBeNull();
  });

  it('ne touche pas aux clés étrangères', () => {
    localStorage.setItem('mm-cookie-consent', '{"analytics":true}');
    localStorage.setItem('mm-lang', 'fr');
    markShown('agencyExit');

    clearAllPopupState();

    expect(localStorage.getItem('mm-cookie-consent')).toBe('{"analytics":true}');
    expect(localStorage.getItem('mm-lang')).toBe('fr');
  });
});

describe('stockage indisponible', () => {
  it('ne jette pas et reste silencieux', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
      key: () => { throw new Error('blocked'); },
      get length(): number { throw new Error('blocked'); },
    } as unknown as Storage);

    // Rien ne jette, et rien n'est perdu : le plafond de SESSION prend le relais du délai
    // persistant. C'est le repli documenté dans `markShown`.
    expect(canShow('agencyExit')).toBe(true);
    expect(() => markShown('agencyExit')).not.toThrow();
    expect(blockedBy('agencyExit')).toBe('sessionCap');
    expect(() => clearAllPopupState()).not.toThrow();
  });
});

describe('mode aperçu — readPopupOverride', () => {
  it('reconnaît un identifiant valide', async () => {
    const { readPopupOverride } = await import('../../src/lib/popups/debug');
    expect(readPopupOverride('?popup=agencyExit')).toBe('agencyExit');
    expect(readPopupOverride('?popup=blogEnd')).toBe('blogEnd');
  });

  it('ignore un identifiant inconnu plutôt que de forcer n’importe quoi', async () => {
    const { readPopupOverride } = await import('../../src/lib/popups/debug');
    expect(readPopupOverride('?popup=nimportequoi')).toBeNull();
    expect(readPopupOverride('')).toBeNull();
    expect(readPopupOverride('?autre=1')).toBeNull();
  });

  it('`reset` lève les verrous et ne force aucune fenêtre', async () => {
    const { readPopupOverride } = await import('../../src/lib/popups/debug');
    markShown('agencyExit');
    markSuppressed('blogEnd');
    expect(canShow('agencyExit')).toBe(false);

    expect(readPopupOverride('?popup=reset')).toBeNull();

    expect(blockedBy('agencyExit')).toBeNull();
    expect(blockedBy('blogEnd')).toBeNull();
  });
});
