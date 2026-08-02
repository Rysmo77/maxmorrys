import { describe, expect, it } from 'vitest';

import { applySecurityHeaders } from '../src/prerender/shell';

/**
 * Garde-fou contre une régression déjà survenue en production.
 *
 * Un `new Response(...)` fabriqué par le Worker n'hérite d'aucun en-tête de
 * l'origine. Les routes prerendues — donc la page d'accueil et toutes les pages
 * SEO — ont ainsi été servies sans CSP ni HSTS, sans que rien ne le signale : la
 * page s'affichait normalement et les balises SEO étaient correctes.
 *
 * La vérification de bout en bout vit dans `scripts/origin-parity.mjs`, qui
 * compare désormais aussi les en-têtes. Ce test couvre l'unité.
 */

function originHeaders(): Headers {
  return new Headers({
    'Content-Security-Policy': "default-src 'self'; connect-src https://api.maxmorrys.me 'self'",
    'Strict-Transport-Security': 'max-age=31556926; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=()',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    // Ne doit pas être recopié : la réponse fabriquée a son propre cache.
    'Cache-Control': 'max-age=60',
  });
}

describe('report des en-têtes de sécurité sur les réponses fabriquées', () => {
  it('recopie les sept en-têtes posés par Firebase Hosting', () => {
    const target = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
    applySecurityHeaders(target, originHeaders());

    expect(target.get('content-security-policy')).toContain('https://api.maxmorrys.me');
    expect(target.get('strict-transport-security')).toContain('max-age=31556926');
    expect(target.get('x-frame-options')).toBe('DENY');
    expect(target.get('x-content-type-options')).toBe('nosniff');
    expect(target.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(target.get('permissions-policy')).toContain('geolocation=()');
    expect(target.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups');
  });

  it('ne recopie pas le cache de l origine', () => {
    const target = new Headers({ 'Cache-Control': 'no-store' });
    applySecurityHeaders(target, originHeaders());
    expect(target.get('cache-control')).toBe('no-store');
  });

  it('ne pose rien quand l origine n a rien à donner', () => {
    // Cas du shell de repli : mieux vaut ne rien inventer que poser une CSP
    // divergente de `firebase.json`.
    const target = new Headers();
    applySecurityHeaders(target, new Headers());
    expect([...target.keys()]).toEqual([]);
  });

  it('écrase une valeur déjà présente plutôt que de la dupliquer', () => {
    const target = new Headers({ 'X-Frame-Options': 'SAMEORIGIN' });
    applySecurityHeaders(target, originHeaders());
    expect(target.get('x-frame-options')).toBe('DENY');
  });
});
