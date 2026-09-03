import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUE LES DEUX MAGASINS EXIGENT, ET QUE L'APPLICATION NE FAISAIT PAS.
 *
 * Trois manquements vérifiés avant d'être corrigés, chacun suffisant à faire rejeter :
 *
 *   1 · AUCUN TEXTE LÉGAL n'était atteignable. `grep -ri "legal|confidentialite"` sur
 *       `mobile/` ne renvoyait rien. App Store 5.1.1(i) veut la politique de
 *       confidentialité AU POINT DE CRÉATION DU COMPTE, et les deux fiches de magasin
 *       en exigent l'URL.
 *
 *   2 · PIRE, IL Y AVAIT UN FAUX LIEN. `creation.tsx` rendait « politique de
 *       confidentialité » en bleu et en gras — la forme exacte d'un lien — À
 *       L'INTÉRIEUR du `Pressable` de la case newsletter. Le toucher cochait la case.
 *       Une fausse affordance posée sur un contrôle de consentement.
 *
 *   3 · LA SUPPRESSION DE COMPTE N'EN ÉTAIT PAS UNE. `suppression.tsx` tenait toute la
 *       cérémonie — liste de ce qui part, saisie de « SUPPRIMER » — puis ouvrait une
 *       alerte « Pas encore branché ici » renvoyant vers le site. C'est mot pour mot ce
 *       que 5.1.1(v) interdit, et l'écran affirmait par ailleurs le contraire.
 *
 * Ces portes lisent des fichiers, comme le reste de la suite mobile : `mobile/` est un
 * projet Expo autonome, sans lanceur de tests à lui.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const APP = join(RACINE, 'mobile/app');

const lire = (p: string) => readFileSync(join(APP, p), 'utf8');
/** Le code servi, commentaires retirés — un commentaire n'est pas une affordance. */
const sansCommentaires = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const CHEMINS_LEGAUX = ['/confidentialite', '/cgu', '/cgv', '/mentions-legales'];

describe('exigences des magasins — textes légaux et suppression de compte', () => {
  it("l'écran légal existe et nomme les quatre textes", () => {
    expect(existsSync(join(APP, 'legal.tsx'))).toBe(true);
    const legal = lire('legal.tsx');
    for (const chemin of CHEMINS_LEGAUX) {
      expect(legal, `${chemin} manque à l'écran légal`).toContain(chemin);
    }
  });

  it('les quatre textes existent vraiment sur le site', () => {
    /*
     * LA PORTE QUI SURVIT À UN RENOMMAGE. L'application ouvre des URL du site ; rien ne
     * reliait les deux jusqu'ici. Le jour où `/legal/cgu` devient `/legal/conditions`, le
     * site continue de fonctionner et l'application ouvre un 404 — sur l'écran qui porte
     * l'engagement juridique, et sans que personne ne le voie.
     */
    const routes = readFileSync(join(RACINE, 'src/App.tsx'), 'utf8');
    for (const chemin of CHEMINS_LEGAUX) {
      expect(routes, `le site ne sert pas /legal${chemin}`).toContain(`legal${chemin}`);
    }
  });

  it("les trois écrans où l'engagement se prend citent l'écran légal", () => {
    // `creation` est le seul obligatoire (5.1.1(i)) ; les deux autres sont là parce
    // qu'on doit pouvoir lire avant de s'engager, et retrouver après.
    for (const ecran of ['creation.tsx', 'connexion.tsx', '(tabs)/profil.tsx']) {
      expect(lire(ecran), `${ecran} ne cite pas /legal`).toContain("'/legal'");
    }
  });

  it("le lien de confidentialité n'est plus enfermé dans la case newsletter", () => {
    /*
     * On vérifie la STRUCTURE, pas la présence : le texte pouvait très bien rester au même
     * endroit. Ce qui compte est qu'il ne soit plus dans le `Pressable` dont l'action est
     * de cocher — c'est-à-dire que le premier `Pressable` de l'écran, celui de la case,
     * ne contienne plus le mot.
     */
    const creation = sansCommentaires(lire('creation.tsx'));
    const debut = creation.indexOf('accessibilityRole="checkbox"');
    const fin = creation.indexOf('</Pressable>', debut);
    expect(debut, 'la case newsletter est introuvable — le test ne vérifie plus rien').toBeGreaterThan(-1);
    expect(creation.slice(debut, fin)).not.toMatch(/confidentialité/i);
  });

  it('la suppression de compte supprime vraiment', () => {
    const suppression = lire('suppression.tsx');
    expect(suppression).toContain('deleteUserAccount');
    // La phrase qui renvoyait au site. Sa présence était la violation elle-même.
    expect(suppression).not.toContain('Pas encore branché ici');
    // La déconnexion suit la suppression : rester « connecté » à un compte effacé
    // laisse l'application dans un état qui ne correspond à rien.
    expect(suppression).toContain('deconnexion');
  });

  it("l'export de données n'est pas un bouton mort", () => {
    /*
     * La ligne « Exporter mes données » du profil avait glyphe, titre, méta et chevron —
     * tout d'un contrôle — et AUCUN `onPress`. Sur l'écran des données, c'est le pire
     * endroit pour un bouton mort : on repart en croyant que l'export n'existe pas.
     */
    const profil = sansCommentaires(lire('(tabs)/profil.tsx'));
    const titre = profil.indexOf('Exporter mes données');
    expect(titre, 'la ligne d’export a disparu — le test ne vérifie plus rien').toBeGreaterThan(-1);

    /* On borne au COMPOSANT, pas au premier `/>` : celui-là ferme l'icône du `trailing`,
       et la borne suivante appartiendrait déjà à la ligne d'après — qui, elle, a bien une
       action. Un test qui déborde sur le voisin passe pour la mauvaise raison. */
    const debut = profil.lastIndexOf('<LessonRow', titre);
    const suivant = profil.indexOf('<LessonRow', titre);
    const bloc = profil.slice(debut, suivant === -1 ? undefined : suivant);
    expect(bloc, 'la ligne d’export n’a pas d’action').toContain('onPress');
  });

  it('on peut sortir du compte dans lequel on est entré', () => {
    // Il n'existait aucune déconnexion nulle part — un défaut invisible tant qu'il n'y
    // avait pas de session à quitter.
    expect(lire('(tabs)/profil.tsx')).toContain('deconnexion');
  });
});
