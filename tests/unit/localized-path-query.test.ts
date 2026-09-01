import { describe, it, expect } from 'vitest';
import { localizedPath } from '../../src/i18n/routing';

/**
 * La chaîne de requête ne doit JAMAIS traverser la traduction des segments.
 *
 * Le défaut corrigé : `localizeSegments` recevait `repetiteur?tab=tokens` comme un seul
 * segment, ne le trouvait pas dans la table, et le laissait en français dans une URL
 * anglaise — qui ne correspond alors à aucune route déclarée. Le widget du répétiteur
 * portait deux liens de cette forme, tous deux vers l'écran d'achat des packs.
 */
describe('localizedPath — requête et ancre', () => {
  it('traduit le segment même quand une requête suit', () => {
    expect(localizedPath('/mon-espace/repetiteur?tab=tokens', 'en'))
      .toBe('/en/my-learning/tutor?tab=tokens');
  });

  it('préserve une ancre', () => {
    expect(localizedPath('/mon-espace/repetiteur#memoire', 'en'))
      .toBe('/en/my-learning/tutor#memoire');
  });

  it('préserve requête ET ancre ensemble', () => {
    expect(localizedPath('/mon-espace/repetiteur?tab=memoire#haut', 'en'))
      .toBe('/en/my-learning/tutor?tab=memoire#haut');
  });

  it('laisse le français intact, requête comprise', () => {
    expect(localizedPath('/mon-espace/repetiteur?tab=memoire', 'fr'))
      .toBe('/mon-espace/repetiteur?tab=memoire');
  });

  it("n'invente pas de requête quand il n'y en a pas", () => {
    expect(localizedPath('/mon-espace/repetiteur', 'en')).toBe('/en/my-learning/tutor');
  });

  it('gère la racine avec requête', () => {
    expect(localizedPath('/?ref=x', 'en')).toBe('/en?ref=x');
  });
});
