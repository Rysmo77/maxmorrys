import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNE IDENTITÉ VIDE NE SE COMBLE PAS D'UN NOM EMPRUNTÉ.
 *
 * Le premier APK de démonstration a provoqué cette question : « est-ce que
 * l'application est connectée à un compte Aïssatou ? » Elle ne l'était pas — aucune
 * session, aucun appel serveur abouti. Mais l'écran d'accueil disait « Bonjour
 * Aïssatou », le profil portait son nom et son adresse, et rien ne permettait de faire
 * la différence avec une session ouverte.
 *
 * La cause : `composer()` comblait TOUS les vides avec le contenu du transfert, y
 * compris la phase `anonyme`. Or `anonyme` n'est pas un trou — c'est une réponse
 * définitive : il n'y a personne. La distinction manquait :
 *
 *   · un CATALOGUE vide comblé par un exemple → utile, personne ne croit le posséder ;
 *   · une IDENTITÉ vide comblée par un nom    → fait croire à une session ouverte.
 *
 * C'est le même genre de confusion que l'interrupteur de contenu avait été posé pour
 * supprimer, revenu par une autre porte. La production n'a jamais été touchée — la
 * réplique y vaut `null` par construction — mais c'est le build de REVUE que l'on
 * montre, et c'est là que la méprise s'est produite.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const DONNEES = join(RACINE, 'mobile/donnees');
const lire = (f: string) => readFileSync(join(DONNEES, f), 'utf8');

describe("l'identité ne se comble pas d'une réplique", () => {
  it('`useMoi` passe par la composition d’identité, pas par la composition ordinaire', () => {
    const code = lire('index.ts');
    const bloc = /export function useMoi\(\)[\s\S]*?\n\}/.exec(code)?.[0] ?? '';
    expect(bloc, 'useMoi introuvable — le test ne vérifie plus rien').not.toBe('');
    expect(bloc).toMatch(/composerIdentite\(/);
    // Et surtout PAS l'ordinaire, qui comblerait de nouveau l'anonymat.
    expect(bloc).not.toMatch(/\bcomposer\(/);
  });

  it('la composition d’identité refuse explicitement la phase `anonyme`', () => {
    const code = lire('etat.ts');
    expect(code).toMatch(/composerIdentite/);
    // La branche qui rend `brut` tel quel quand personne n'est connecté.
    expect(code).toMatch(/phase === 'anonyme'[\s\S]{0,60}return brut/);
  });

  it('la composition ordinaire garde son comportement pour le contenu', () => {
    /*
     * La correction ne doit PAS vider les écrans de revue : le catalogue, les leçons et
     * le fil du Club continuent de se peupler. Sans quoi le build `preview` perdrait sa
     * raison d'être, et quelqu'un rouvrirait la porte pour la retrouver.
     */
    const code = lire('index.ts');
    for (const hook of ['useCours', 'useLecon', 'useClubFil']) {
      const bloc = new RegExp(`export function ${hook}\\(`).test(code);
      expect(bloc, `${hook} a disparu`).toBe(true);
    }
    expect(code).toMatch(/composerListe\(/);
  });
});
