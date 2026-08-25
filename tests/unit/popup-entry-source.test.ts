import { describe, it, expect } from 'vitest';
import { classifyEntry } from '../../src/lib/popups/entrySource';
import { clientProjects } from '../../src/lib/brand';

const SELF = 'maxmorrys.me';

describe('classifyEntry — moteurs de recherche', () => {
  it('reconnaît Google, quel que soit le domaine national', () => {
    expect(classifyEntry('https://www.google.com/', '', SELF)).toBe('search');
    expect(classifyEntry('https://www.google.sn/', '', SELF)).toBe('search');
    expect(classifyEntry('https://google.fr/search?q=max+morrys', '', SELF)).toBe('search');
  });
  it('reconnaît les autres moteurs', () => {
    expect(classifyEntry('https://duckduckgo.com/', '', SELF)).toBe('search');
    expect(classifyEntry('https://www.bing.com/', '', SELF)).toBe('search');
    expect(classifyEntry('https://www.ecosia.org/', '', SELF)).toBe('search');
  });
});

describe('classifyEntry — signature de pied de page client', () => {
  it('reconnaît chaque domaine client du référentiel de marque', () => {
    for (const { domain } of clientProjects) {
      expect(classifyEntry(`https://${domain}/`, '', SELF)).toBe('clientFooter');
    }
  });

  it('reconnaît un sous-domaine d’un domaine client', () => {
    expect(classifyEntry('https://boutique.amourdivin.app/contact', '', SELF)).toBe('clientFooter');
  });

  it('ne confond pas un domaine qui se TERMINE par un nom de client', () => {
    expect(classifyEntry('https://notamourdivin.app/', '', SELF)).toBe('unknown');
  });

  it('le marqueur utm_medium prime sur le referrer', () => {
    // Cas réel : le visiteur atteint le site client via Google, PUIS clique la signature.
    expect(
      classifyEntry('https://www.google.com/', '?utm_source=khanouss&utm_medium=footer-signature', SELF),
    ).toBe('clientFooter');
  });

  it('un autre utm_medium ne suffit pas', () => {
    expect(classifyEntry('', '?utm_medium=email', SELF)).toBe('direct');
  });
});

describe('classifyEntry — autres contextes', () => {
  it('classe les plateformes sociales', () => {
    expect(classifyEntry('https://www.facebook.com/', '', SELF)).toBe('social');
    expect(classifyEntry('https://t.co/abc123', '', SELF)).toBe('social');
    expect(classifyEntry('https://www.linkedin.com/feed/', '', SELF)).toBe('social');
  });

  it('classe une absence de referrer en direct', () => {
    expect(classifyEntry('', '', SELF)).toBe('direct');
    expect(classifyEntry('pas-une-url', '', SELF)).toBe('direct');
  });

  it('classe une navigation interne en direct', () => {
    expect(classifyEntry(`https://${SELF}/blog`, '', SELF)).toBe('direct');
    expect(classifyEntry(`https://${SELF.toUpperCase()}/blog`, '', SELF)).toBe('direct');
  });

  it('classe un referrer externe inconnu en unknown', () => {
    expect(classifyEntry('https://un-blog-quelconque.example/', '', SELF)).toBe('unknown');
  });

  it('ne casse pas sur une query string illisible', () => {
    expect(classifyEntry('https://www.google.com/', '?%%%', SELF)).toBe('search');
  });
});
