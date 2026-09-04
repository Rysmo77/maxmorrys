/**
 * Garde-fou du quota annoncé avant paiement.
 *
 * La page publique du Club vend « 5 questions par jour au lieu de 2 » à quelqu'un qui n'a pas
 * encore de compte, donc à partir de constantes client — le quota réel exige une session. Si
 * le serveur change et que la page ne suit pas, l'écart n'est visible que par la personne qui
 * vient de payer.
 *
 * Ce test lit les DEUX miroirs serveur comme du texte : les trois projets TypeScript du dépôt
 * ne peuvent pas s'importer entre eux, mais rien n'empêche de relire leur source. C'est ce que
 * `club-pricing.test.ts` déclarait hors de portée, et qui ne l'est qu'à l'import.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { RYSMO_BASE_DAILY, RYSMO_CLUB_BONUS, RYSMO_CLUB_DAILY } from '../../src/lib/rysmo/quota';

/** Extrait `const NOM = <entier>` d'un fichier TypeScript, `export` ou non. */
function constant(path: string, name: string): number {
  const source = readFileSync(path, 'utf8');
  const match = source.match(new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*(\\d+)`));
  if (!match) throw new Error(`${name} introuvable dans ${path}`);
  return Number(match[1]);
}

/*
 * `functions/src/rysmo.ts` était le second miroir serveur. `functions/` a été supprimé le
 * 03/09/2026 : aucune Cloud Function n'était plus déployée. Le Worker porte désormais seul
 * les constantes serveur, et c'est lui qu'il faut tenir aligné sur le client.
 */
const MIRRORS = [
  'worker/apps/api/src/lib/rysmo-quota.ts',
];

describe('quota du répétiteur — constantes client', () => {
  it('annonce 2 questions par jour hors abonnement', () => {
    expect(RYSMO_BASE_DAILY).toBe(2);
  });

  it('annonce 5 par jour pour un membre du Club, bonus compris', () => {
    expect(RYSMO_CLUB_DAILY).toBe(RYSMO_BASE_DAILY + RYSMO_CLUB_BONUS);
    expect(RYSMO_CLUB_DAILY).toBe(5);
  });
});

describe.each(MIRRORS)('miroir serveur — %s', (path) => {
  it('porte le même quota de base que le client', () => {
    expect(constant(path, 'BASE_DAILY_QUOTA')).toBe(RYSMO_BASE_DAILY);
  });

  it('porte le même bonus de Club que le client', () => {
    expect(constant(path, 'CLUB_BONUS_QUOTA')).toBe(RYSMO_CLUB_BONUS);
  });
});
