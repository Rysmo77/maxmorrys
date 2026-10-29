import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { EMETTEUR } from '../src/lib/invoice';
import { IDENTITE } from '../src/lib/marque';
import { catalogue } from './apercu/catalogue';

/**
 * TOUS LES COURRIERS DU PRODUIT, AU MÊME GABARIT ET À LA MÊME VOIX.
 *
 * Le catalogue (`apercu/catalogue.ts`) rend chaque e-mail avec des données d'exemple ; ce
 * fichier vérifie ce qu'aucune relecture ne garantit sur trente rendus : la version texte,
 * le retrait sur le marketing ET SEULEMENT sur lui, les mots interdits, les emoji, les
 * teintes interdites en texte, et la casse des boutons.
 */
const entrees = catalogue();

/** Le texte visible d'un HTML : balises et pré-en-tête retirés, entités communes décodées. */
function visible(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#8199;|&#65279;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');
}

describe('le catalogue', () => {
  it('couvre les deux langues et les deux régimes', () => {
    expect(entrees.length).toBeGreaterThanOrEqual(50);
    expect(new Set(entrees.map((e) => e.langue))).toEqual(new Set(['fr', 'en']));
    expect(entrees.some((e) => e.regime === 'marketing')).toBe(true);
    expect(new Set(entrees.map((e) => e.fichier)).size).toBe(entrees.length);
  });
});

describe.each(entrees.map((e) => [e.fichier, e] as const))('%s', (_nom, e) => {
  const { subject, html, text } = e.rendu;

  it('a un objet, un HTML complet en 600 px avec mode sombre, et une version texte', () => {
    expect(subject.trim().length).toBeGreaterThan(3);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain(`lang="${e.langue}"`);
    expect(html).toContain('max-width:600px');
    expect(html).toContain('prefers-color-scheme:dark');
    expect(text.trim().length).toBeGreaterThan(40);
    expect(text).not.toMatch(/<[a-z][^>]*>/i);
  });

  it('nomme son émetteur légal', () => {
    expect(html).toContain('MY ONOMA SARL');
  });

  it(e.regime === 'marketing' ? 'porte le lien de retrait, en HTML et en texte' : 'ne porte AUCUN lien de retrait', () => {
    if (e.regime === 'marketing') {
      expect(html).toContain('/desabonnement?e=');
      expect(text).toContain('/desabonnement?e=');
      expect(visible(html)).toMatch(e.langue === 'fr' ? /Me désabonner/ : /Unsubscribe/);
    } else {
      expect(html).not.toContain('/desabonnement');
      expect(text).not.toContain('/desabonnement');
    }
  });

  it('ne promet ni remboursement ni garantie', () => {
    const tout = `${subject}\n${visible(html)}\n${text}`;
    expect(tout).not.toMatch(/rembours|\bgaranti|\brefund|money[- ]back|\bguarantee/i);
  });

  it('ne contient aucun emoji', () => {
    expect(`${subject}${html}${text}`).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  /* L'orange (2,47:1) et le teal (2,84:1) échouent au contraste sur blanc : jamais en texte. */
  it('n’écrit pas de texte en orange ni en teal', () => {
    expect(html).not.toMatch(/(?:^|[;"\s])color:\s*#(?:F38B0A|02AC9C)/i);
  });

  it('a des boutons en casse de phrase, et un seul', () => {
    const boutons = [...html.matchAll(/class="mm-btn-a">([^<]+)</g)].map((m) => m[1]);
    expect(boutons.length).toBeLessThanOrEqual(1);
    for (const b of boutons) {
      expect(b).not.toBe(b.toUpperCase());
      expect(b[0]).toBe(b[0].toUpperCase());
    }
  });

  it('a un titre court', () => {
    for (const m of html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/g)) expect(m[1].length).toBeLessThanOrEqual(90);
  });
});

/* ── LE MIROIR DE L'IDENTITÉ LÉGALE ─────────────────────────────────────────────
   `marque.ts` recopie `src/lib/brand/company.ts` (un Worker ne peut pas l'importer). Une
   copie que rien ne compare finit par diverger : on relit la source. */
describe('l’identité légale du courrier', () => {
  const source = readFileSync(fileURLToPath(new URL('../../../../src/lib/brand/company.ts', import.meta.url).href), 'utf8');

  it('reprend la source de marque à l’identique', () => {
    expect(source).toContain(`rccm: '${IDENTITE.rccm}'`);
    expect(source).toContain(`ninea: '${IDENTITE.ninea}'`);
    expect(source).toContain(`registeredAddress: '${IDENTITE.siege}'`);
    expect(source).toContain(`city: '${IDENTITE.ville}'`);
    expect(source).toContain(`country: '${IDENTITE.pays.fr}'`);
    expect(source).toContain("name: 'MY ONOMA'");
  });

  it('dit la même chose que l’émetteur de la facture', () => {
    expect(EMETTEUR.raisonSociale).toBe(IDENTITE.raisonSociale);
    expect(EMETTEUR.rccm).toBe(IDENTITE.rccm);
    expect(EMETTEUR.ninea).toBe(IDENTITE.ninea);
    expect(EMETTEUR.siege.startsWith(IDENTITE.siege)).toBe(true);
  });
});
