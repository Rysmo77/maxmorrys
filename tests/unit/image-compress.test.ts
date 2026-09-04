import { describe, expect, it } from 'vitest';

import { shouldCompress, targetSize, withExtension } from '../../src/lib/images/compress';

/**
 * LA COMPRESSION NE DOIT JAMAIS FAIRE PIRE.
 *
 * Elle s'exécute dans le navigateur, sur le chemin d'un téléversement d'administration — un
 * geste rare, fait par une seule personne, et dont l'échec se remarque tard. Les décisions
 * qui la gouvernent sont donc séparées du canevas et vérifiées ici : quoi convertir, jusqu'à
 * quelle taille, et sous quel nom.
 */

describe('quoi convertir', () => {
  it('convertit les gros PNG et JPEG — le cas mesuré', () => {
    // Les couvertures d'article : 1408×768, de 643 à 847 Ko en PNG.
    expect(shouldCompress('image/png', 700 * 1024)).toBe(true);
    expect(shouldCompress('image/jpeg', 900 * 1024)).toBe(true);
  });

  it('laisse le GIF intact, sinon l’animation disparaît', () => {
    expect(shouldCompress('image/gif', 900 * 1024)).toBe(false);
  });

  it('laisse le SVG intact : le rasteriser le rendrait plus lourd et flou', () => {
    expect(shouldCompress('image/svg+xml', 900 * 1024)).toBe(false);
  });

  it('ne reconvertit pas ce qui est déjà en format moderne', () => {
    expect(shouldCompress('image/webp', 900 * 1024)).toBe(false);
    expect(shouldCompress('image/avif', 900 * 1024)).toBe(false);
  });

  it('ignore les petites images, où le décodage coûte plus qu’il ne rapporte', () => {
    expect(shouldCompress('image/png', 12 * 1024)).toBe(false);
  });

  it('ne touche à rien qui ne soit pas une image', () => {
    // `uploadMedia` sert aussi l'audio et la vidéo.
    expect(shouldCompress('audio/mpeg', 5_000_000)).toBe(false);
    expect(shouldCompress('video/mp4', 20_000_000)).toBe(false);
    expect(shouldCompress('application/pdf', 900 * 1024)).toBe(false);
  });
});

describe('dimensions de sortie', () => {
  it('réduit une image trop large en gardant ses proportions', () => {
    expect(targetSize(3200, 1800)).toEqual({ width: 1600, height: 900 });
  });

  it('n’agrandit jamais', () => {
    // Agrandir ferait grossir le fichier pour zéro pixel de détail supplémentaire.
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('laisse passer une couverture d’article à sa taille', () => {
    expect(targetSize(1408, 768)).toEqual({ width: 1408, height: 768 });
  });

  it('reste au-dessus des 1200 px d’une image de partage', () => {
    // Descendre sous 1200 dégraderait les aperçus qu'on vient de réparer.
    expect(targetSize(4000, 2000).width).toBeGreaterThanOrEqual(1200);
  });
});

describe('nom du fichier', () => {
  it('suit le contenu réellement envoyé', () => {
    // Sans cela, R2 servirait des octets WebP sous une adresse en `.png`.
    expect(withExtension('uploads/articles/1712-abc.png', 'webp')).toBe(
      'uploads/articles/1712-abc.webp',
    );
  });

  it('ne casse pas un chemin qui contient des points', () => {
    expect(withExtension('avatars/u.1/profile.jpeg', 'webp')).toBe('avatars/u.1/profile.webp');
  });

  it('ajoute l’extension à une clé qui n’en a pas', () => {
    expect(withExtension('club_events/1712', 'webp')).toBe('club_events/1712.webp');
  });
});
