import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES DEUX GARANTIES DE `mobile-legal.test.ts`, RENDUES À LA VERSION COMPOSE.
 *
 * Ce fichier de test est mort avec le port React Native (`git show
 * 9c22076:tests/unit/mobile-legal.test.ts`). Il gardait trois manquements dont chacun
 * suffisait à faire rejeter l'application, et deux d'entre eux ne peuvent être tenus par
 * AUCUNE compilation : ils portent sur la correspondance entre deux mondes qui ne se
 * connaissent pas.
 *
 *   1 · LES QUATRE TEXTES LÉGAUX EXISTENT VRAIMENT SUR LE SITE. L'application ouvre des
 *       URL ; rien ne reliait les deux. « Le jour où `/legal/cgu` devient
 *       `/legal/conditions`, le site continue de fonctionner et l'application ouvre un 404
 *       — sur l'écran qui porte l'engagement juridique, et sans que personne ne le voie. »
 *       Un lien sortant échoue en SILENCE : c'est la définition même du défaut invisible.
 *
 *   2 · LA SUPPRESSION SUPPRIME VRAIMENT — et ici la garantie a CHANGÉ DE FORME, parce que
 *       le monde a changé. Le port pouvait vérifier que l'écran appelait `deleteUserAccount`.
 *       Aucun producteur de jeton d'identité n'étant branché, la version Compose ne peut pas
 *       appeler quoi que ce soit, et l'écran le dit au lieu d'afficher un bouton muet. Ce qui
 *       reste vérifiable — et qui est en réalité la garantie la plus dure — est le LIEN ENTRE
 *       LA PROMESSE ET LE BALAYAGE : `worker/apps/api/src/handlers/gdpr.ts` écrit lui-même
 *       que « l'écran de suppression ÉNUMÈRE ce qui disparaît » et que « le lien à tenir
 *       n'est pas le fichier, c'est la LISTE ». Cette porte-là tient la liste.
 *
 * ⚠️ Comme le reste de la suite native, ces portes lisent des FICHIERS. Elles attrapent une
 * correspondance rompue, pas une erreur de logique — c'est la compilation Gradle qui prouve
 * le reste.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const COMPTE = 'android/app/src/main/java/me/maxmorrys/rysmo/ecrans/compte';

const lire = (p: string) => readFileSync(join(RACINE, p), 'utf8');

/**
 * ⚠️ LES COMMENTAIRES SONT RETIRÉS LIGNE À LIGNE, ET PAS PAR EXPRESSION RÉGULIÈRE.
 *
 * C'est la méthode de `natif-navigation.test.ts`, pour ses deux raisons : ce dépôt cite
 * abondamment le code dont il parle — `gdpr.ts` nomme `club_posts` et `referrals` dans son
 * commentaire, à côté des vraies collections — et un retrait par expression régulière a déjà
 * mangé le milieu d'une chaîne contenant la séquence de fermeture, dans `lint-kits-ignores`.
 * Kotlin, lui, IMBRIQUE ses commentaires de bloc : une expression régulière non imbriquée y
 * est fausse par construction.
 */
const sansCommentaires = (source: string) =>
  source
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*'));
    })
    .join('\n');

/* ─────────────────────────────────────────────────────────────────────────────
   1 · LES QUATRE TEXTES LÉGAUX MÈNENT QUELQUE PART
   ───────────────────────────────────────────────────────────────────────────── */

describe('les textes légaux cités par l’application existent sur le site', () => {
  const legal = sansCommentaires(lire(`${COMPTE}/Legal.kt`));

  /** Les chemins que l'écran ouvre vraiment, lus dans sa table. */
  const cites = [...legal.matchAll(/chemin\s*=\s*"([^"]+)"/g)].map((m) => m[1]);

  /** La racine à laquelle ils se collent — `…/legal`, jamais l'URL entière. */
  const racine = /SITE_LEGAL:\s*String\s*=\s*"([^"]+)"/.exec(legal)?.[1] ?? '';

  /** Les chemins que le routeur du site sert réellement. */
  const routes = new Set(
    [...sansCommentaires(lire('src/App.tsx')).matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]),
  );

  it('la porte regarde vraiment quelque chose', () => {
    /* Le garde-fou que ce dépôt met partout : un extracteur qui ne trouve plus rien passe au
       vert sans avoir rien gardé. C'est exactement par là que la porte des routes du port RN
       est devenue aveugle. */
    expect(cites.length, 'aucun chemin légal extrait — l’extracteur est cassé').toBe(4);
    expect(racine, 'la racine légale est introuvable dans Legal.kt').toContain('/legal');
    expect(routes.size, 'aucune route extraite de src/App.tsx').toBeGreaterThan(20);
  });

  it('⛔ chacun des quatre chemins est une route du site', () => {
    /* `SITE_LEGAL` finit par `/legal` et chaque chemin commence par `/` : la route servie
       par React Router s'écrit sans barre de tête, d'où le découpage. */
    const prefixe = racine.slice(racine.lastIndexOf('/legal') + 1);
    const morts = cites.filter((chemin) => !routes.has(`${prefixe}${chemin}`));
    expect(
      morts,
      'ces chemins sont ouverts par l’application et ne correspondent à aucune route de '
      + 'src/App.tsx : le navigateur s’ouvrirait sur un 404, depuis l’écran qui porte '
      + 'l’engagement juridique, et rien dans l’application ne le saurait',
    ).toEqual([]);
  });

  it('les quatre textes que les magasins réclament sont bien ceux-là', () => {
    /* App Store 5.1.1(i) et la fiche Play exigent la confidentialité ; les trois autres sont
       ce à quoi on s'engage en créant un compte et en achetant. Un renommage qui en ferait
       disparaître un se verrait ici, pas six mois plus tard. */
    expect(cites.sort()).toEqual(['/cgu', '/cgv', '/confidentialite', '/mentions-legales']);
  });

  it("les écrans où l'engagement se prend citent l'écran légal", () => {
    /*
     * `Creation` est le seul obligatoire — 5.1.1(i) veut les textes AU POINT DE CRÉATION DU
     * COMPTE. Les deux autres sont là parce qu'on doit pouvoir lire avant de s'engager, et
     * retrouver après : `Connexion` est la porte d'entrée, `Principal` porte le profil.
     */
    for (const ecran of [`${COMPTE}/Creation.kt`, `${COMPTE}/Connexion.kt`,
      'android/app/src/main/java/me/maxmorrys/rysmo/ecrans/Principal.kt']) {
      const code = sansCommentaires(lire(ecran));
      expect(code, `${ecran} n’ouvre pas la destination Legal`).toMatch(/\bLegal\b/);
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   2 · LA LISTE DE LA SUPPRESSION EST CELLE DU BALAYAGE
   ───────────────────────────────────────────────────────────────────────────── */

describe('ce que l’écran promet d’effacer est ce que le serveur efface', () => {
  const suppression = sansCommentaires(lire(`${COMPTE}/Suppression.kt`));

  /** Les collections que chaque ligne de l'écran déclare couvrir. */
  const promises = new Set(
    [...suppression.matchAll(/balaye\s*=\s*listOf\(([^)]*)\)/g)]
      .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((n) => n[1])),
  );

  /**
   * Les collections que `deleteUserAccount` efface réellement.
   *
   * ⛔ ON NE LIT QUE LE CORPS DE CETTE FONCTION. `exportUserData`, juste au-dessus, PARCOURT
   * les mêmes collections sans en effacer aucune : les confondre ferait promettre la
   * suppression de ce qui n'est qu'exporté.
   *
   * La normalisation retire le segment de l'identifiant — `users/${uid}/notes` devient
   * `users/notes` — et ne garde que ce qui a la forme d'un chemin de collection. Les motifs
   * d'erreur, le mot de confirmation et les noms de champ en casse mixte tombent d'eux-mêmes.
   */
  const balayees = (() => {
    const gdpr = sansCommentaires(lire('worker/apps/api/src/handlers/gdpr.ts'));
    const debut = gdpr.indexOf('export async function deleteUserAccount');
    const corps = gdpr.slice(debut);
    const bruts = [...corps.matchAll(/['`]([^'`\n]*)['`]/g)].map((m) => m[1]);
    const normaliser = (b: string) =>
      b.split('/').filter((s) => s !== '' && s !== '${uid}').join('/');
    return new Set(
      bruts.map(normaliser).filter((t) => /^[a-z][a-z_]*(\/[a-z][a-z_]*)*$/.test(t)),
    );
  })();

  it('la porte regarde vraiment quelque chose', () => {
    expect(promises.size, 'aucune collection promise extraite — l’extracteur est cassé')
      .toBeGreaterThan(10);
    expect(balayees.size, 'le corps de `deleteUserAccount` n’a pas été trouvé')
      .toBeGreaterThan(10);
  });

  it('⛔ rien de ce que le serveur efface n’est passé sous silence', () => {
    const tues = [...balayees].filter((c) => !promises.has(c)).sort();
    expect(
      tues,
      'le serveur efface ces collections et aucune ligne de l’écran ne les couvre. C’est le '
      + 'défaut exact que `gdpr.ts` a dû corriger : `club_posts` porte `userName` en clair, '
      + 'et une personne supprimée gardait ses messages signés sur le mur du Club',
    ).toEqual([]);
  });

  it('⛔ rien de ce que l’écran promet n’échappe au balayage', () => {
    const promesses = [...promises].filter((c) => !balayees.has(c)).sort();
    expect(
      promesses,
      'l’écran annonce la disparition de ces collections et `deleteUserAccount` n’y touche '
      + 'pas. Une promesse de suppression non tenue est pire qu’un silence : elle se vérifie',
    ).toEqual([]);
  });

  it('deux lignes ne portent jamais le même titre', () => {
    /* Le titre est la clef de composition de la liste. Deux lignes homonymes s’effondreraient
       en une seule et retireraient une promesse de l’écran sans que rien ne le voie —
       `key = auteur` a déjà fait exactement ça sur le fil du Club. */
    const titres = [...suppression.matchAll(/titre\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(titres.length).toBeGreaterThan(5);
    expect(new Set(titres).size, 'deux lignes de la liste portent le même titre').toBe(titres.length);
  });

  it('⛔ l’écran ne dessine ni champ de confirmation ni bouton, tant que rien ne part', () => {
    /*
     * La cérémonie complète — le mot à taper, le bouton rouge, « j'exporte d'abord » — est
     * écrite dans le kit et elle est belle. Tant que l'appel ne peut pas être authentifié,
     * la dessiner ferait repartir quelqu'un en croyant avoir disparu. C'est la seule page du
     * produit où l'illusion du succès coûte plus cher que l'aveu de la panne.
     */
    expect(suppression, 'un champ de saisie est revenu sans que le geste puisse partir')
      .not.toMatch(/\bField\(/);
    expect(suppression, 'un bouton est revenu sans que le geste puisse partir')
      .not.toMatch(/\bButton\(/);
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   3 · AUCUN CONTRÔLE MORT DANS LE LOT
   ───────────────────────────────────────────────────────────────────────────── */

describe('aucun contrôle mort dans les écrans du compte', () => {
  /*
   * `mobile-controles-morts.test.ts` avait attrapé SIX contrôles éteints dans le port :
   * l'oubli unitaire de la mémoire, le téléchargement d'un épisode, la vitesse de lecture,
   * « Postuler », et deux réglages de téléchargement. Chacun était rendu, coloré, et sans
   * effet. La règle de ce lot est plus stricte que la sienne : un geste qui ne peut pas
   * partir n'est pas grisé, il n'est pas dessiné — et l'écran dit pourquoi.
   */
  const fichiers = readdirSync(join(RACINE, COMPTE)).filter((f) => f.endsWith('.kt'));

  it('la porte regarde vraiment quelque chose', () => {
    expect(fichiers.length, 'aucun écran de compte trouvé').toBeGreaterThanOrEqual(7);
  });

  it('aucun contrôle n’est rendu désactivé, et aucune action n’est vide', () => {
    const fautes: string[] = [];
    for (const f of fichiers) {
      const code = sansCommentaires(lire(`${COMPTE}/${f}`));
      if (/desactive\s*=\s*true/.test(code)) fautes.push(`${f} : un contrôle désactivé`);
      /*
       * LA LAMBDA VIDE — exactement ce que le port posait sur « Réessayer » de la panne de
       * configuration : le bouton s'affichait, le geste ne faisait rien.
       *
       * ⚠️ ON NE CHERCHE PAS QUE LA FORME NOMMÉE. Ma première version ne voyait que
       * `onPress = { }` ; or `Button("Lire…", { })` passe l'action en POSITIONNEL, et c'est
       * la forme qu'utilise tout ce lot. La porte est donc passée au vert sur l'épreuve où
       * je l'avais cassée exprès. On borne sur ce qui PRÉCÈDE la lambda — une affectation,
       * une virgule, une parenthèse ouvrante — ce qui la reconnaît dans les deux écritures.
       */
      if (/[=(,]\s*\{\s*\}/.test(code)) fautes.push(`${f} : une action vide`);
    }
    expect(fautes, 'un contrôle qui ne fait rien se lit comme un produit cassé, pas comme un chantier').toEqual([]);
  });
});
