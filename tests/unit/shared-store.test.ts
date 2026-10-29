import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { lirePartage, ecrirePartage, effacerPartage, clesPartagees } from '../../src/lib/sharedStore';
import { markShown, blockedBy, clearAllPopupState } from '../../src/lib/popups/rules';

/**
 * Le stockage commun aux trois hôtes. Sans lui, le plafond « une pop-up par session », le groupe
 * témoin et le consentement cookies se comptaient une fois PAR SOUS-DOMAINE.
 */

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

/** Un `document.cookie` minimal : un seul pot pour tous les hôtes de `.maxmorrys.me`. */
function makeCookieJar() {
  const jar = new Map<string, string>();
  const written: string[] = [];
  return {
    written,
    doc: {
      get cookie() { return [...jar].map(([k, v]) => `${k}=${v}`).join('; '); },
      set cookie(line: string) {
        written.push(line);
        const [pair, ...attrs] = line.split('; ');
        const [k, v] = [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)];
        if (attrs.includes('Max-Age=0')) jar.delete(k); else jar.set(k, v);
      },
    },
  };
}

function onHost(hostname: string, jar: ReturnType<typeof makeCookieJar>) {
  vi.stubGlobal('window', {});
  vi.stubGlobal('location', { hostname });
  vi.stubGlobal('document', jar.doc);
  vi.stubGlobal('localStorage', makeStorage());
  vi.stubGlobal('sessionStorage', makeStorage());
}

afterEach(() => vi.unstubAllGlobals());

describe('production : un cookie sur .maxmorrys.me', () => {
  let jar: ReturnType<typeof makeCookieJar>;
  beforeEach(() => { jar = makeCookieJar(); });

  it('une valeur écrite sur le hub se lit sur edu. et club.', () => {
    onHost('maxmorrys.me', jar);
    ecrirePartage('mm-test', 'oui');
    onHost('edu.maxmorrys.me', jar);
    expect(lirePartage('mm-test')).toBe('oui');
    onHost('club.maxmorrys.me', jar);
    expect(lirePartage('mm-test')).toBe('oui');
  });

  it('le plafond de session vaut pour les trois hôtes', () => {
    onHost('maxmorrys.me', jar);
    markShown('blogEnd');
    onHost('edu.maxmorrys.me', jar);
    expect(blockedBy('eduExit')).toBe('sessionCap');
    onHost('club.maxmorrys.me', jar);
    expect(blockedBy('clubExit')).toBe('sessionCap');
  });

  it('pose le cookie sur le domaine commun, en Lax et Secure', () => {
    onHost('edu.maxmorrys.me', jar);
    ecrirePartage('mm-test', 'x');
    expect(jar.written.at(-1)).toContain('Domain=.maxmorrys.me');
    expect(jar.written.at(-1)).toContain('SameSite=Lax');
    expect(jar.written.at(-1)).toContain('Secure');
  });

  it('un cookie de session ne porte pas de durée', () => {
    onHost('maxmorrys.me', jar);
    ecrirePartage('mm-s', '1', 'session');
    expect(jar.written.at(-1)).not.toContain('Max-Age');
  });

  it('migre une valeur d’avant les sous-domaines depuis localStorage', () => {
    onHost('maxmorrys.me', jar);
    localStorage.setItem('mm-cookie-consent', '{"analytics":true}');
    expect(lirePartage('mm-cookie-consent')).toBe('{"analytics":true}');
    expect(localStorage.getItem('mm-cookie-consent')).toBeNull();
    onHost('club.maxmorrys.me', jar);
    expect(lirePartage('mm-cookie-consent')).toBe('{"analytics":true}');
  });

  it('l’aperçu `?popup=reset` efface l’état sur les trois hôtes', () => {
    onHost('maxmorrys.me', jar);
    markShown('agencyExit');
    onHost('edu.maxmorrys.me', jar);
    clearAllPopupState();
    expect(clesPartagees('mm-popup')).toEqual([]);
    onHost('maxmorrys.me', jar);
    expect(blockedBy('agencyExit')).toBeNull();
  });

  it('effacer retire la valeur partout', () => {
    onHost('maxmorrys.me', jar);
    ecrirePartage('mm-test', 'x');
    effacerPartage('mm-test');
    onHost('edu.maxmorrys.me', jar);
    expect(lirePartage('mm-test')).toBeNull();
  });
});

describe('hors production : le stockage du navigateur, sous les mêmes clés', () => {
  it('localhost ne pose aucun cookie', () => {
    const jar = makeCookieJar();
    onHost('localhost', jar);
    ecrirePartage('mm-test', 'x');
    expect(jar.written).toEqual([]);
    expect(localStorage.getItem('mm-test')).toBe('x');
  });

  it('un domaine qui se TERMINE par le nôtre n’en est pas un', () => {
    const jar = makeCookieJar();
    onHost('pasmaxmorrys.me', jar);
    ecrirePartage('mm-test', 'x');
    expect(jar.written).toEqual([]);
  });
});
