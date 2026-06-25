import { describe, it, expect, afterEach } from 'vitest';
import { countryToLang, langFromNavigator } from '../../src/lib/detectLanguage';

describe('countryToLang', () => {
  it('mappe les pays francophones vers fr', () => {
    expect(countryToLang('FR')).toBe('fr');
    expect(countryToLang('SN')).toBe('fr');
    expect(countryToLang('CI')).toBe('fr');
    expect(countryToLang('be')).toBe('fr'); // insensible à la casse
  });
  it('mappe les autres pays vers en', () => {
    expect(countryToLang('NG')).toBe('en');
    expect(countryToLang('US')).toBe('en');
    expect(countryToLang('ES')).toBe('en');
    expect(countryToLang('DE')).toBe('en');
  });
  it('défaut en si code absent', () => {
    expect(countryToLang(null)).toBe('en');
    expect(countryToLang(undefined)).toBe('en');
    expect(countryToLang('')).toBe('en');
  });
});

describe('langFromNavigator', () => {
  const original = globalThis.navigator;
  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true });
  });
  const stub = (languages: string[]) => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { languages, language: languages[0] },
      configurable: true,
    });
  };

  it('détecte fr/en depuis les préférences navigateur', () => {
    stub(['fr-FR', 'en-US']);
    expect(langFromNavigator()).toBe('fr');
    stub(['en-GB', 'fr']);
    expect(langFromNavigator()).toBe('en');
    stub(['en']);
    expect(langFromNavigator()).toBe('en');
  });
  it('renvoie null si aucune langue fr/en', () => {
    stub(['es-ES', 'de-DE']);
    expect(langFromNavigator()).toBeNull();
  });
});
