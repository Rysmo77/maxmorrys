import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA CARTE DE NAVIGATION, FERMÉE DANS LES DEUX SENS.
 *
 * Le premier sens — « tout lien mène à un écran qui existe » — est tenu par le
 * COMPILATEUR : les destinations sont des types, et naviguer vers ce qui n'existe
 * pas ne compile pas. Ce fichier ne s'en occupe donc pas.
 *
 * ⛔ LE SECOND SENS — « tout écran est atteint par un lien » — N'EST TENU PAR RIEN
 * D'AUTRE QUE CETTE PORTE. Aucun type ne peut l'exprimer, et c'est exactement le
 * sens qui manquait au port React Native :
 *
 *   · 14 routes sur 51 n'étaient atteintes par aucun écran de production ;
 *   · parmi elles la chaîne de première ouverture au complet — `lancement`,
 *     `onboarding`, `permissions` — écrite, complète, et jamais exécutée ;
 *   · et le test censé le voir cherchait toute chaîne littérale commençant par
 *     « / » dans n'importe quel fichier. Or la planche d'atelier écrivait les 48
 *     adresses en dur : TOUTE route y était donc « citée », et la porte restait
 *     verte alors qu'aucun écran de production n'y menait.
 *
 * D'où deux choix de méthode ici :
 *   1. On ne cherche pas des chaînes, on apparie des DÉCLARATIONS de type à des
 *      ENREGISTREMENTS `composable<…>`. Une adresse écrite dans un commentaire ou
 *      dans une planche ne peut pas satisfaire la porte.
 *   2. La planche d'atelier vit dans `app/src/debug/`, que Gradle ne compile pas
 *      pour `release`. Elle ne peut donc pas entrer dans le graphe de production,
 *      quoi qu'elle contienne.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const NAV = 'android/app/src/main/java/me/maxmorrys/rysmo/navigation';

/**
 * ⚠️ LES COMMENTAIRES SONT RETIRÉS LIGNE À LIGNE, ET PAS PAR EXPRESSION RÉGULIÈRE.
 *
 * Ce dépôt commente abondamment, en citant le code dont il parle : la première version de
 * cette porte a compté DEUX `startDestination` — celui du code et celui de la phrase qui
 * l'explique — et refusé un graphe correct.
 *
 * Retirer les blocs `slash-étoile` par expression régulière serait pire : la même méthode a
 * déjà mangé le milieu d'une chaîne contenant cette séquence, dans `lint-kits-ignores`.
 * Une ligne de commentaire Kotlin commence par `//`, `/*` ou `*` une fois désindentée ;
 * c'est une lecture que ni les apostrophes ni les astérisques ne trompent.
 */
const sansCommentaires = (source: string) =>
  source
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*'));
    })
    .join('\n');

const destinations = sansCommentaires(readFileSync(resolve(RACINE, NAV, 'Destinations.kt'), 'utf8'));
const graphe = sansCommentaires(readFileSync(resolve(RACINE, NAV, 'Graphe.kt'), 'utf8'));

/** Les destinations déclarées : `@Serializable object X` ou `@Serializable data class X(`. */
function declarees(): string[] {
  return [...destinations.matchAll(/@Serializable\s+(?:data\s+class|object)\s+([A-Z]\w*)/g)]
    .map((m) => m[1]);
}

/** Les destinations ENREGISTRÉES dans le graphe : `composable<X> {`. */
function enregistrees(): string[] {
  return [...graphe.matchAll(/composable<(\w+)>/g)].map((m) => m[1]);
}

describe('la carte de navigation est fermée', () => {
  it('la porte regarde vraiment quelque chose', () => {
    /* Le garde-fou que ce dépôt met partout : un extracteur qui ne trouve plus rien
       passerait au vert sans avoir rien gardé. C'est précisément par là que la porte
       équivalente du port RN est devenue aveugle. */
    expect(declarees().length, 'aucune destination extraite — l’extracteur est cassé').toBeGreaterThan(20);
    expect(enregistrees().length, 'aucun enregistrement extrait — l’extracteur est cassé').toBeGreaterThan(20);
  });

  it('aucun écran orphelin : chaque destination déclarée est enregistrée', () => {
    const inscrites = new Set(enregistrees());
    const orphelines = declarees().filter((d) => !inscrites.has(d));
    expect(
      orphelines,
      'ces destinations sont déclarées et n’apparaissent dans AUCUN `composable<…>` : '
      + 'elles ne peuvent être atteintes par rien, et la navigation planterait si on essayait',
    ).toEqual([]);
  });

  it('aucun enregistrement fantôme : chaque `composable<…>` désigne une destination déclarée', () => {
    const connues = new Set(declarees());
    const fantomes = enregistrees().filter((e) => !connues.has(e));
    expect(fantomes, 'enregistrées dans le graphe sans être déclarées').toEqual([]);
  });

  it('une destination n’est enregistrée qu’une fois', () => {
    const vues = new Map<string, number>();
    for (const e of enregistrees()) vues.set(e, (vues.get(e) ?? 0) + 1);
    const doublons = [...vues.entries()].filter(([, n]) => n > 1).map(([d]) => d);
    expect(doublons, 'Navigation Compose garderait le PREMIER enregistrement en silence').toEqual([]);
  });

  it('⛔ le point d’entrée est `Lancement`, et il n’y en a qu’un', () => {
    /*
     * SANS CETTE LIGNE, LE KIT PERD TROIS ÉCRANS D'UN COUP.
     *
     * C'est le défaut exact du port RN : faute de point d'entrée déclaré, le routeur
     * servait « / » depuis le premier onglet, et personne n'a jamais vu l'écran de
     * lancement ni l'accueil. Le défaut ne produisait aucune erreur — l'application
     * avait simplement l'air de commencer au milieu.
     */
    const departs = [...graphe.matchAll(/startDestination\s*=\s*(\w+)/g)].map((m) => m[1]);
    expect(departs, 'un seul `startDestination`, et c’est `Lancement`').toEqual(['Lancement']);
  });

  it('la chaîne de première ouverture existe et mène quelque part', () => {
    for (const d of ['Lancement', 'Onboarding', 'Espace']) {
      expect(declarees(), `${d} n’est plus déclarée`).toContain(d);
      expect(enregistrees(), `${d} n’est plus enregistrée`).toContain(d);
    }
    /* Le lancement doit DÉPILER derrière lui : sans `inclusive`, le retour système
       ramènerait sur l'écran de lancement, qui réaiguillerait aussitôt — une boucle
       dont on ne sort qu'en tuant l'application. */
    expect(graphe).toMatch(/popUpTo\(Lancement\)\s*\{\s*inclusive\s*=\s*true\s*\}/);
  });
});

describe('les écrans restant à construire sont comptés', () => {
  /*
   * ⚠️ `EnChantier` EXISTE POUR FERMER LA CARTE, PAS POUR FAIRE NOMBRE.
   *
   * Une destination sans écran ferait planter la navigation ; une destination qui rend
   * une page blanche ferait croire à un défaut de chargement. Celle-ci nomme ce qui
   * manque et le lot qui l'apporte.
   *
   * Le risque est qu'elle s'installe. Ce plafond doit être ABAISSÉ à chaque écran
   * livré, et tomber à zéro : un chiffre qu'on ne peut que descendre est la seule
   * forme de dette qui se rembourse.
   */
  const PLAFOND = 1;

  it(`il en reste au plus ${PLAFOND}, et ce nombre ne doit que descendre`, () => {
    const restants = [...graphe.matchAll(/EnChantier\(/g)].length;
    expect(
      restants,
      `${restants} destinations sont encore des chantiers. Si tu viens d’en livrer une, `
      + 'baisse le plafond dans ce test — c’est le geste qui rembourse la dette.',
    ).toBeLessThanOrEqual(PLAFOND);
  });

  it('les cinq onglets, eux, ne sont PAS des chantiers', () => {
    /* Ils portent l'état honnête de leur vue, pas un écriteau « à venir ». C'est la
       différence entre une application qui attend son serveur et une maquette. */
    for (const onglet of ['Espace', 'Catalogue', 'Repetiteur', 'ClubRoot', 'Profil']) {
      const ligne = new RegExp(`composable<${onglet}>\\s*\\{[^}]*\\}`);
      const trouve = ligne.exec(graphe)?.[0] ?? '';
      expect(trouve, `${onglet} n’est pas enregistré`).not.toBe('');
      expect(trouve, `${onglet} rend un écriteau au lieu de son onglet`).not.toContain('EnChantier');
    }
  });
});
