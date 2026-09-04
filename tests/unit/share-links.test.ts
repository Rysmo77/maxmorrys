import { describe, expect, it } from 'vitest';

import { shareLink, toAbsoluteUrl, type ShareNetwork } from '../../src/lib/share/links';

/**
 * UN LIEN DE PARTAGE CASSÉ NE LÈVE RIEN.
 *
 * C'est ce qui rend ces adresses dignes d'un test. Une URL d'intention mal encodée s'ouvre
 * quand même : le réseau affiche son formulaire de partage, vide ou tronqué, et la personne
 * abandonne. Aucune erreur, aucune trace, et le défaut ne se voit qu'en partageant un titre
 * qui contient une apostrophe — c'est-à-dire à peu près tous les titres de ce site.
 */

const NETWORKS: ShareNetwork[] = ['whatsapp', 'facebook', 'linkedin', 'twitter'];

/** Un titre réel du site : apostrophe, accents, ponctuation, et une esperluette. */
const TITRE = "C'est quoi l'abonnement à 10 000 FCFA/an ? Wave & Orange Money";

describe('toAbsoluteUrl', () => {
  it('complète un chemin avec le domaine canonique', () => {
    // Un chemin relatif ferait partager le domaine du RÉSEAU, pas le nôtre.
    expect(toAbsoluteUrl('/blog/mon-article')).toBe('https://maxmorrys.me/blog/mon-article');
  });

  it('ajoute la barre oblique manquante', () => {
    expect(toAbsoluteUrl('faq/c-est-qui-max-morrys')).toBe(
      'https://maxmorrys.me/faq/c-est-qui-max-morrys',
    );
  });

  it('laisse une URL déjà absolue intacte', () => {
    expect(toAbsoluteUrl('https://maxmorrys.me/formations/seo')).toBe(
      'https://maxmorrys.me/formations/seo',
    );
  });
});

describe('shareLink', () => {
  it.each(NETWORKS)('%s : produit une URL analysable', (network) => {
    const href = shareLink(network, '/blog/mon-article', TITRE);
    expect(() => new URL(href)).not.toThrow();
    expect(new URL(href).protocol).toBe('https:');
  });

  it.each(NETWORKS)('%s : le lien partagé survit à l’encodage', (network) => {
    const href = shareLink(network, '/blog/mon-article', TITRE);
    // Quel que soit le champ qui le porte, l'adresse complète doit se retrouver après décodage.
    expect(decodeURIComponent(href)).toContain('https://maxmorrys.me/blog/mon-article');
  });

  it('WhatsApp reçoit titre et lien dans un seul message', () => {
    // Son intention n'a pas de champ d'URL distinct : l'aperçu se construit à partir du lien
    // contenu dans le texte.
    const href = shareLink('whatsapp', '/blog/mon-article', 'Vendre au Cameroun');
    expect(href).toBe(
      'https://wa.me/?text=Vendre%20au%20Cameroun%20https%3A%2F%2Fmaxmorrys.me%2Fblog%2Fmon-article',
    );
  });

  it('l’esperluette d’un titre ne coupe pas l’URL en deux', () => {
    // Le défaut classique : `&` non encodé ouvre un paramètre fantôme et tronque le partage.
    const href = shareLink('twitter', '/blog/x', 'Wave & Orange Money');
    const params = new URL(href).searchParams;
    expect(params.get('text')).toBe('Wave & Orange Money');
    expect(params.get('url')).toBe('https://maxmorrys.me/blog/x');
  });

  it('le point d’interrogation d’une question de la FAQ reste dans le titre', () => {
    const href = shareLink('twitter', '/faq/c-est-qui-max-morrys', "C'est qui Max-Morrys ?");
    expect(new URL(href).searchParams.get('text')).toBe("C'est qui Max-Morrys ?");
  });

  it.each(NETWORKS)('%s : vise bien le domaine du réseau', (network) => {
    const host = new URL(shareLink(network, '/x', 'T')).hostname;
    const attendu: Record<ShareNetwork, string> = {
      whatsapp: 'wa.me',
      facebook: 'www.facebook.com',
      linkedin: 'www.linkedin.com',
      twitter: 'twitter.com',
    };
    expect(host).toBe(attendu[network]);
  });
});
