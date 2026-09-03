import { describe, it, expect } from 'vitest';

import { badgesMerites } from '../../src/lib/gamification';
import { BADGES } from '../../src/types/gamification';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HUIT BADGES SUR DIX N'AVAIENT AUCUN ATTRIBUTEUR.
 *
 * `BADGES` en déclare dix et `/mon-espace/succes` les affiche tous, verrouillés ou non.
 * Seuls `contributeur` et `ambassadeur` étaient décernés quelque part — et le second par une
 * Cloud Function, donc plus du tout depuis le plan Spark. Les huit autres étaient des cases
 * qui ne se décocheraient jamais, montrées à chaque visite.
 *
 * Ce test verrouille la promesse qui empêche la situation de se reproduire : l'attribution
 * est PILOTÉE PAR LES DONNÉES du catalogue, pas par une liste de `if`. Ajouter un badge doit
 * suffire à le rendre attribuable.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RIEN = { lessons: 0, streak: 0, certificates: 0, formations: 0 };
const ids = (s: typeof RIEN) => badgesMerites(s).map((b) => b.id);

describe('badgesMerites — les seuils du catalogue', () => {
  it('ne décerne rien à qui vient d’arriver', () => {
    expect(ids(RIEN)).toEqual([]);
  });

  it('respecte le seuil de chaque badge, au chiffre près', () => {
    // Pris du catalogue lui-même : si un seuil change, le test suit sans être réécrit.
    for (const badge of BADGES) {
      const compteur = { lessons: 'lessons', days: 'streak', certificates: 'certificates', formations: 'formations' }[
        badge.requirementType as 'lessons' | 'days' | 'certificates' | 'formations'
      ];
      if (!compteur) continue; // `posts` est attribué à la source, pas ici

      const juste = { ...RIEN, [compteur]: badge.requirement };
      const presque = { ...RIEN, [compteur]: badge.requirement - 1 };
      expect(ids(juste), `${badge.id} à ${badge.requirement}`).toContain(badge.id);
      expect(ids(presque), `${badge.id} à ${badge.requirement - 1}`).not.toContain(badge.id);
    }
  });

  it('cumule les paliers d’une même famille', () => {
    // 50 leçons méritent aussi les paliers de 1 et de 10 : on ne saute pas les précédents.
    const obtenus = ids({ ...RIEN, lessons: 50 });
    expect(obtenus).toEqual(expect.arrayContaining(['premier-pas', 'studieux', 'expert']));
  });

  /*
   * ⚠️ LA GARDE QUI COMPTE. `contributeur` et `ambassadeur` se décernent AU MOMENT DE L'ACTE —
   * le premier dans le fil du Club, le second dans le webhook de paiement, là où le compteur
   * est juste. Les faire aussi passer par ici supposerait de relire tout le fil du Club à
   * chaque ouverture du tableau de bord, et les décernerait deux fois par deux chemins.
   */
  it('ne touche jamais aux badges décernés à la source', () => {
    const tout = { lessons: 9999, streak: 9999, certificates: 9999, formations: 9999 };
    expect(ids(tout)).not.toContain('contributeur');
    expect(ids(tout)).not.toContain('ambassadeur');
  });

  it('couvre bien huit des dix badges du catalogue', () => {
    const tout = { lessons: 9999, streak: 9999, certificates: 9999, formations: 9999 };
    expect(ids(tout)).toHaveLength(BADGES.length - 2); // les deux `posts` exceptés
  });
});
