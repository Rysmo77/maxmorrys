import { describe, expect, it } from 'vitest';

import { AUDIO_CANDIDATES, VIDEO_CANDIDATES, baseType, extensionFor } from '../../src/lib/media/container';

/**
 * LE TÉMOIGNAGE FILMÉ SUR IPHONE NE DOIT PLUS PARTIR SOUS UNE FAUSSE ÉTIQUETTE.
 *
 * Ce fichier existe à cause d'un défaut réel, et d'une classe de défauts qu'il faut tenir :
 * `MediaRecorder` choisit son conteneur SELON LE NAVIGATEUR — WebM sur Chrome et Firefox,
 * MP4 sur Safari — et le code affirmait `video/webm` en dur, pour le type du Blob comme pour
 * l'extension de la clé R2.
 *
 * L'écart ne se voit sur aucune machine de développement : la relecture locale marche, le
 * téléversement réussit, et c'est à la modération que la vidéo ne démarre pas. Ce sont donc
 * les tables de correspondance qui se vérifient ici — le seul endroit d'où le type MIME et
 * l'extension peuvent rester d'accord.
 */

describe('le conteneur, sans ses codecs', () => {
  it('coupe la liste de codecs', () => {
    expect(baseType('video/webm;codecs=vp9,opus')).toBe('video/webm');
    expect(baseType('audio/webm;codecs=opus')).toBe('audio/webm');
  });

  it('supporte l’espace et la casse que rendent certains navigateurs', () => {
    expect(baseType('VIDEO/MP4; codecs="avc1.42E01E"')).toBe('video/mp4');
  });

  it('laisse intact un type déjà nu', () => {
    expect(baseType('video/mp4')).toBe('video/mp4');
  });
});

describe('l’extension suit ce qui a été encodé', () => {
  it('le cas Safari : du MP4 ne s’écrit pas en .webm', () => {
    // C'est LE défaut corrigé. Avant, l'extension était la constante 'webm'.
    expect(extensionFor('video/mp4', 'webm')).toBe('mp4');
    expect(extensionFor('video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'webm')).toBe('mp4');
  });

  it('le cas Chrome et Firefox reste du WebM', () => {
    expect(extensionFor('video/webm;codecs=vp9,opus', 'mp4')).toBe('webm');
  });

  it('l’audio MP4 s’écrit .m4a, pas .mp4', () => {
    expect(extensionFor('audio/mp4', 'm4a')).toBe('m4a');
  });

  it('couvre les types qu’un fichier IMPORTÉ apporte', () => {
    expect(extensionFor('video/quicktime', 'mp4')).toBe('mov');
    expect(extensionFor('audio/mpeg', 'm4a')).toBe('mp3');
    expect(extensionFor('audio/ogg;codecs=opus', 'm4a')).toBe('ogg');
  });

  it('retombe sur la valeur de repli quand le type est inexploitable', () => {
    // Un `Blob` sans type : le cas réel d'un fichier importé qu'un gestionnaire ne
    // reconnaît pas. Sans repli, la clé se terminerait par un point.
    expect(extensionFor('', 'mp4')).toBe('mp4');
    expect(extensionFor('application/octet-stream', 'mp4')).toBe('mp4');
  });

  it('ne prend pas un sous-type exotique pour une extension', () => {
    expect(extensionFor('video/x-matroska', 'mp4')).toBe('mkv');
    expect(extensionFor('video/vnd.avi', 'mp4')).toBe('mp4');
  });
});

describe('ce qu’on demande au navigateur', () => {
  it('propose le MP4 en dernier — c’est le repli de Safari, pas le premier choix', () => {
    expect(VIDEO_CANDIDATES[VIDEO_CANDIDATES.length - 1]).toBe('video/mp4');
    expect(VIDEO_CANDIDATES[0]).toContain('webm');
  });

  it('chaque conteneur proposé a une extension connue', () => {
    // Sans cela, un navigateur qui accepte un candidat écrirait une clé au sous-type brut.
    for (const type of [...VIDEO_CANDIDATES, ...AUDIO_CANDIDATES]) {
      expect(extensionFor(type, 'INCONNU')).not.toBe('INCONNU');
    }
  });
});
