import { describe, expect, it } from 'vitest';

import { analyser, publier, publierMeta, redirectionEspace, robotsTxt } from '../src/espaces';

/**
 * Les trois hôtes au bord. La table vit dans `src/lib/espaces.ts` ; ce qui se vérifie ici,
 * c'est ce que le Worker en fait : la 301 due (requête conservée), le chemin logique qu'il
 * passe au pré-rendu, et les adresses publiées.
 */

const r = (u: string) => redirectionEspace(new URL(u));

describe('redirectionEspace — les anciens chemins du hub partent sur leur hôte', () => {
  it.each([
    ['https://maxmorrys.me/formations/seo?utm_source=x', 'https://edu.maxmorrys.me/formations/seo?utm_source=x'],
    ['https://maxmorrys.me/en/courses', 'https://edu.maxmorrys.me/en/courses'],
    ['https://maxmorrys.me/apprendre', 'https://edu.maxmorrys.me/'],
    ['https://maxmorrys.me/apprendre/methode', 'https://edu.maxmorrys.me/methode'],
    ['https://maxmorrys.me/en/learning/method', 'https://edu.maxmorrys.me/en/method'],
    ['https://maxmorrys.me/verifier/MM-7K2Q-9F', 'https://edu.maxmorrys.me/verifier/MM-7K2Q-9F'],
    ['https://maxmorrys.me/mon-espace/cours', 'https://edu.maxmorrys.me/mes-formations'],
    ['https://maxmorrys.me/en/my-learning/learn', 'https://edu.maxmorrys.me/en/my-courses'],
    ['https://maxmorrys.me/mon-espace', 'https://edu.maxmorrys.me/tableau-de-bord'],
    ['https://maxmorrys.me/paiement/retour?transactionId=abc', 'https://edu.maxmorrys.me/paiement/retour?transactionId=abc'],
    ['https://maxmorrys.me/club-des-digitos', 'https://club.maxmorrys.me/'],
    ['https://maxmorrys.me/club-des-digitos/adhesion', 'https://club.maxmorrys.me/adhesion'],
    ['https://maxmorrys.me/en/digitos-club/membership', 'https://club.maxmorrys.me/en/membership'],
    ['https://maxmorrys.me/mon-espace/club', 'https://club.maxmorrys.me/fil'],
    ['https://maxmorrys.me/mon-espace/club/agenda', 'https://club.maxmorrys.me/agenda'],
    ['https://maxmorrys.me/en/my-learning/club/members', 'https://club.maxmorrys.me/en/members'],
    ['https://maxmorrys.me/r/AISSATOU', 'https://club.maxmorrys.me/r/AISSATOU'],
  ])('%s → %s', (depuis, vers) => {
    expect(r(depuis)).toBe(vers);
  });

  it('ce qui reste au hub ne bouge pas', () => {
    for (const u of ['/', '/blog/x', '/en/about', '/mon-espace/profil', '/mon-espace/assistant', '/admin', '/compte', '/connexion']) {
      expect(r(`https://maxmorrys.me${u}`), u).toBeNull();
    }
  });
});

describe('redirectionEspace — un chemin du hub demandé sur un sous-domaine repart au hub', () => {
  it.each([
    ['https://edu.maxmorrys.me/blog/x?a=1', 'https://maxmorrys.me/blog/x?a=1'],
    ['https://club.maxmorrys.me/contact', 'https://maxmorrys.me/contact'],
    ['https://edu.maxmorrys.me/mon-espace/profil', 'https://maxmorrys.me/mon-espace/profil'],
    ['https://club.maxmorrys.me/formations', 'https://edu.maxmorrys.me/formations'],
    // L'ancien chemin tapé sur le bon hôte prend son nouveau nom.
    ['https://edu.maxmorrys.me/mon-espace/cours', 'https://edu.maxmorrys.me/mes-formations'],
  ])('%s → %s', (depuis, vers) => {
    expect(r(depuis)).toBe(vers);
  });

  it('les pages de l’espace, les écrans de compte et les fichiers restent servis sur place', () => {
    for (const u of [
      'https://edu.maxmorrys.me/', 'https://edu.maxmorrys.me/en', 'https://edu.maxmorrys.me/mes-formations',
      'https://edu.maxmorrys.me/cours/seo', 'https://edu.maxmorrys.me/connexion', 'https://club.maxmorrys.me/inscription',
      'https://club.maxmorrys.me/', 'https://club.maxmorrys.me/fil', 'https://club.maxmorrys.me/paiement/retour',
      'https://edu.maxmorrys.me/assets/index-abc.js', 'https://edu.maxmorrys.me/sitemap.xml',
      'https://club.maxmorrys.me/robots.txt', 'https://edu.maxmorrys.me/og/apprendre.png',
      'https://club.maxmorrys.me/.well-known/assetlinks.json', 'https://edu.maxmorrys.me/__/auth/handler',
    ]) {
      expect(r(u), u).toBeNull();
    }
  });
});

describe('analyser — le pré-rendu reçoit le chemin logique', () => {
  it('ramène chaque hôte au langage d’avant les sous-domaines', () => {
    expect(analyser(new URL('https://edu.maxmorrys.me/')).logique).toBe('/apprendre');
    expect(analyser(new URL('https://edu.maxmorrys.me/en/method')).logique).toBe('/en/learning/method');
    expect(analyser(new URL('https://club.maxmorrys.me/adhesion')).logique).toBe('/club-des-digitos/adhesion');
    expect(analyser(new URL('https://club.maxmorrys.me/en')).logique).toBe('/en/digitos-club');
    expect(analyser(new URL('https://maxmorrys.me/blog')).logique).toBe('/blog');
  });
});

describe('publier — canonical, hreflang et JSON-LD sur l’hôte public', () => {
  it('réécrit les adresses logiques, laisse les fichiers et le reste du web', () => {
    expect(publier('https://maxmorrys.me/apprendre')).toBe('https://edu.maxmorrys.me/');
    expect(publier('https://maxmorrys.me/en/digitos-club/sessions')).toBe('https://club.maxmorrys.me/en/sessions');
    expect(publier('https://maxmorrys.me/blog?q=1')).toBe('https://maxmorrys.me/blog?q=1');
    expect(publier('https://maxmorrys.me/og/apprendre.png?v=1')).toBe('https://maxmorrys.me/og/apprendre.png?v=1');
    expect(publier('https://media.maxmorrys.me/x.jpg')).toBe('https://media.maxmorrys.me/x.jpg');
  });

  it('publierMeta touche canonical, alternates, fil d’Ariane et JSON-LD', () => {
    const m = publierMeta({
      title: 't', description: 'd', ogType: 'website', ogImage: 'https://maxmorrys.me/og/x.png',
      canonical: 'https://maxmorrys.me/formations/seo',
      altFr: 'https://maxmorrys.me/formations/seo', altEn: 'https://maxmorrys.me/en/courses/seo',
      breadcrumbs: [{ name: 'Formations', url: 'https://maxmorrys.me/formations' }],
      jsonLd: { '@type': 'Course', url: 'https://maxmorrys.me/formations/seo', provider: { url: 'https://maxmorrys.me' } },
    });
    expect(m.canonical).toBe('https://edu.maxmorrys.me/formations/seo');
    expect(m.altEn).toBe('https://edu.maxmorrys.me/en/courses/seo');
    expect(m.breadcrumbs?.[0].url).toBe('https://edu.maxmorrys.me/formations');
    expect(m.jsonLd).toEqual({ '@type': 'Course', url: 'https://edu.maxmorrys.me/formations/seo', provider: { url: 'https://maxmorrys.me' } });
    expect(m.ogImage).toBe('https://maxmorrys.me/og/x.png');
  });
});

describe('robotsTxt — un par sous-domaine', () => {
  it('ferme l’espace privé, dans les deux langues, et annonce son sitemap', () => {
    const edu = robotsTxt('edu', 'https://edu.maxmorrys.me');
    expect(edu).toContain('Disallow: /mes-formations\n');
    expect(edu).toContain('Disallow: /en/my-courses\n');
    expect(edu).toContain('Disallow: /checkout\n');
    expect(edu).toContain('Sitemap: https://edu.maxmorrys.me/sitemap.xml');
    expect(edu).not.toContain('Disallow: /formations');
    const club = robotsTxt('club', 'https://club.maxmorrys.me');
    expect(club).toContain('Disallow: /fil\n');
    expect(club).toContain('Disallow: /en/feed\n');
    expect(club).not.toContain('Disallow: /adhesion');
  });
});
