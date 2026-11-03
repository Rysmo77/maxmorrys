import { describe, expect, it } from 'vitest';

import { analyser, estPage } from '../src/espaces';
import { isKnownAppPath } from '../src/routes';

/**
 * Le vrai 404 (audit du 03/11/2026, n°13). Le Worker requalifie en 404 le shell servi
 * pour une page dont le premier segment logique n'ouvre aucune branche du routeur.
 */
const connu = (href: string) => isKnownAppPath(analyser(new URL(href)).logiqueFr);

describe('chemins inconnus → 404', () => {
  it('reconnaît les pages réelles du hub, en français et en anglais', () => {
    for (const href of [
      'https://maxmorrys.me/',
      'https://maxmorrys.me/en',
      'https://maxmorrys.me/contact',
      'https://maxmorrys.me/en/contact',
      'https://maxmorrys.me/en/about',
      'https://maxmorrys.me/conception/projets-sur-mesure',
      'https://maxmorrys.me/en/design/custom-projects',
      'https://maxmorrys.me/legal/cgv',
      'https://maxmorrys.me/connexion',
      'https://maxmorrys.me/en/sign-in',
      'https://maxmorrys.me/admin/articles',
      'https://maxmorrys.me/403',
    ]) {
      expect(connu(href), href).toBe(true);
    }
  });

  it('reconnaît les chemins physiques des sous-domaines', () => {
    for (const href of [
      'https://edu.maxmorrys.me/',
      'https://edu.maxmorrys.me/methode',
      'https://edu.maxmorrys.me/mes-formations',
      'https://club.maxmorrys.me/',
      'https://club.maxmorrys.me/fil',
      'https://club.maxmorrys.me/sessions',
    ]) {
      expect(connu(href), href).toBe(true);
    }
  });

  it('ignore la casse, comme React Router (/Contact rend la page)', () => {
    expect(isKnownAppPath('/Contact')).toBe(true);
    expect(isKnownAppPath('/BLOG/un-article')).toBe(true);
  });

  it('rejette une adresse sans branche', () => {
    for (const href of [
      'https://maxmorrys.me/page-qui-nexiste-pas',
      'https://maxmorrys.me/en/nowhere',
      'https://maxmorrys.me/wp-login',
      'https://edu.maxmorrys.me/inexistant',
    ]) {
      expect(connu(href), href).toBe(false);
    }
  });

  it('ne s applique qu aux pages, jamais aux fichiers', () => {
    expect(estPage('/page-qui-nexiste-pas')).toBe(true);
    expect(estPage('/sw.js')).toBe(false);
    expect(estPage('/assets/index-abc.js')).toBe(false);
    expect(estPage('/__/auth/handler')).toBe(false);
  });
});
