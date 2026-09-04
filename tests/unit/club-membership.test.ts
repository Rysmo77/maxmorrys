import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { estMembreActif } from '../../src/lib/club/membership';

/**
 * Ce prédicat décide de ce qu'on MONTRE d'un accès payant. Il vivait en trois exemplaires
 * écrits à la main ; ces cas figent la définition unique qui les remplace.
 */

const MAINTENANT = new Date('2026-09-04T12:00:00.000Z');

function dans(jours: number): string {
  const d = new Date(MAINTENANT);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString();
}

describe('estMembreActif', () => {
  it('reconnaît un abonnement actif qui court encore', () => {
    expect(estMembreActif({ status: 'active', expiresAt: dans(30) }, MAINTENANT)).toBe(true);
  });

  it('refuse un abonnement actif dont le terme est passé', () => {
    expect(estMembreActif({ status: 'active', expiresAt: dans(-1) }, MAINTENANT)).toBe(false);
  });

  it.each(['pending', 'cancelled', 'expired'])('refuse le statut %s', (status) => {
    expect(estMembreActif({ status, expiresAt: dans(30) }, MAINTENANT)).toBe(false);
  });

  /*
   * ⚠️ « Je n'ai pas encore lu » et « il n'est pas membre » se traitent PAREIL ici : on ne
   * montre rien tant qu'on ne sait pas. C'est à l'appelant de distinguer les deux quand ça
   * compte — `PaymentReturn` garde une troisième valeur pour ça.
   */
  it.each([[null], [undefined]])('répond faux sur %p, sans lever', (absent) => {
    expect(estMembreActif(absent, MAINTENANT)).toBe(false);
  });

  /*
   * ⚠️ ÉCART ASSUMÉ AVEC LE GARDE RYSMO, qui répute valide un abonnement SANS terme. Ici, se
   * tromper coûte un accès montré à quelqu'un qui n'y a pas droit — et les règles Firestore
   * le lui refuseraient ensuite sans explication.
   */
  it('refuse un abonnement sans échéance', () => {
    expect(estMembreActif({ status: 'active' }, MAINTENANT)).toBe(false);
  });

  it('refuse une échéance illisible plutôt que de la croire', () => {
    expect(estMembreActif({ status: 'active', expiresAt: 'bientôt' }, MAINTENANT)).toBe(false);
  });
});

describe('plus aucune copie du prédicat ne traîne', () => {
  /*
   * La forme exacte qui vivait en trois exemplaires. Ce test n'empêche pas d'écrire la règle
   * autrement — il empêche de recopier CELLE-LÀ, qui est celle qu'on vient de retirer.
   */
  const COPIE = /status === 'active'\s*&&\s*new Date\([^)]*expiresAt\)\s*>\s*new Date\(\)/;

  it.each([
    'src/components/layout/StudentLayout.tsx',
    'src/pages/lms/hooks/useClubData.ts',
  ])('%s lit la fonction au lieu de la réécrire', (chemin) => {
    const source = readFileSync(chemin, 'utf8');
    expect(source).not.toMatch(COPIE);
    expect(source).toContain('estMembreActif');
  });
});
