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
 *   2 · LA SUPPRESSION SUPPRIME VRAIMENT — et la garantie du port est RENDUE, augmentée.
 *       Le port vérifiait que l'écran appelait `deleteUserAccount` ; la version Compose l'a
 *       fait dès que le producteur de jeton a été branché, et cette porte le vérifie de
 *       nouveau — avec deux choses que le port ne gardait pas : que la confirmation ÉCRITE
 *       est exigée avant l'envoi, et que le mot exigé est celui que le serveur compare.
 *
 *       ⭐ Et la garantie la plus dure reste la même : le LIEN ENTRE LA PROMESSE ET LE
 *       BALAYAGE. `worker/apps/api/src/handlers/gdpr.ts` écrit lui-même que « l'écran de
 *       suppression ÉNUMÈRE ce qui disparaît » et que « le lien à tenir n'est pas le
 *       fichier, c'est la LISTE ». Cette porte-là tient la liste.
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

  /* ───────────────────────────────────────────────────────────────────────────
     LA CÉRÉMONIE, MAINTENANT QU'ELLE EXISTE

     ⛔ CETTE PORTE A CHANGÉ DE FORME PARCE QUE LE MONDE A CHANGÉ, PAS PARCE QU'ELLE GÊNAIT.

     Elle interdisait `Field(` et `Button(` dans cet écran, et elle avait raison : tant
     qu'aucun appel ne pouvait être authentifié, un champ « SUPPRIMER » et un bouton rouge
     auraient fait repartir quelqu'un en croyant avoir disparu. Le producteur de jeton est
     branché ; l'interdit protégerait maintenant l'inverse de ce qu'il visait — un écran de
     suppression qui ne supprime pas.

     ⭐ CE QU'ELLE GARDE À LA PLACE EST PLUS DUR, ET C'EST LA MÊME CHOSE : que le geste PARTE
     vraiment, et qu'il exige la confirmation écrite. Une réécriture qui remettrait un bouton
     décoratif échoue ici, comme avant.
     ─────────────────────────────────────────────────────────────────────────── */

  it('la porte de la cérémonie regarde vraiment quelque chose', () => {
    /* Le garde-fou habituel : un extracteur qui ne trouve plus rien passe au vert sans
       avoir rien gardé. Si l'écran est renommé ou vidé, on veut le savoir ici. */
    expect(suppression.length, 'Suppression.kt est vide ou introuvable').toBeGreaterThan(2000);
    expect(suppression, 'le mot de confirmation a disparu du fichier').toMatch(/MOT_DE_CONFIRMATION/);
  });

  it('⛔ le geste part vraiment — la callable est appelée depuis l’écran', () => {
    /*
     * Le port appelait `deleteUserAccount` depuis son écran, et c'est ce qui rendait la
     * garantie vérifiable. Elle l'est de nouveau. ⚠️ Le littéral doit rester AU SITE
     * D'APPEL : `worker-routage-callables.test.ts` le lit là, et une constante intermédiaire
     * le rendrait invisible à la porte qui vérifie que le Worker sert bien ce nom.
     */
    expect(
      suppression,
      'plus rien n’appelle `deleteUserAccount` : l’écran promet une suppression qu’il ne '
      + 'demande pas',
    ).toMatch(/appelerBrut\(\s*"deleteUserAccount"/);
  });

  it('⛔ la confirmation écrite est exigée, et c’est la CONSTANTE qui part', () => {
    /* 1 · le champ existe : sans lui, un seul appui suffirait à tout effacer. */
    expect(suppression, 'le champ de confirmation a disparu').toMatch(/\bField\(/);

    /* 2 · la frappe est comparée à la constante — la friction est réelle, pas décorative. */
    expect(
      suppression,
      'plus rien ne compare la saisie au mot de confirmation : le bouton partirait sur '
      + 'n’importe quelle frappe',
    ).toMatch(/==\s*MOT_DE_CONFIRMATION/);

    /*
     * 3 · ce qui PART est la constante, jamais la saisie. Le serveur compare
     * `confirmation.toUpperCase()` à « SUPPRIMER » : envoyer la frappe brute ferait refuser
     * un geste voulu sur un espace de fin, et la personne recommencerait sans comprendre.
     */
    expect(
      suppression,
      'la charge envoyée ne porte plus la constante — une frappe brute se ferait refuser '
      + 'par le serveur sur un simple espace',
    ).toMatch(/put\(\s*"confirmation",\s*JsonPrimitive\(MOT_DE_CONFIRMATION\)\s*\)/);
  });

  it('⛔ l’envoi est sous la garde de la confirmation, pas seulement grisé', () => {
    /*
     * ⚠️ UN BOUTON DÉSACTIVÉ N'EST PAS UNE GARDE. `desactive` est une information pour l'œil ;
     * la lambda reste composée, et une refonte de la mise en page peut la déclencher sans
     * passer par l'état visuel. On exige donc que la garde soit DANS l'action, avant l'appel.
     */
    /* ⚠️ ON VISE L'APPEL DE SUPPRESSION, PAS LE PREMIER `appelerBrut` DU FICHIER. L'export
       le précède, et une porte qui inspectait « le premier appel » gardait la garde de
       l'export — c'est-à-dire rien de ce qu'elle prétend garder. */
    const envoi = suppression.search(/appelerBrut\(\s*"deleteUserAccount"/);
    expect(envoi, 'l’appel de suppression est introuvable — l’extracteur est cassé').toBeGreaterThan(0);
    const geste = suppression.lastIndexOf('onPress', envoi);
    expect(geste, 'aucune action ne précède l’appel — l’extracteur est cassé').toBeGreaterThan(0);
    const avantLEnvoi = suppression.slice(geste, envoi);
    expect(
      avantLEnvoi,
      'l’appel part sans vérifier la confirmation dans l’action elle-même',
    ).toMatch(/\bconfirme\b/);
  });

  it('⛔ le mot que l’écran exige est celui que le serveur compare', () => {
    /*
     * ⭐ LE MIROIR QUI MANQUAIT. Les deux valeurs vivent dans deux mondes qui ne se
     * connaissent pas : si le serveur passait à « EFFACER », l'écran continuerait de demander
     * « SUPPRIMER », le serveur répondrait `failed-precondition`, et la personne lirait
     * « Confirmation incorrecte » après avoir écrit exactement ce qu'on lui demandait. Aucune
     * compilation ne voit ça.
     */
    const cote = /MOT_DE_CONFIRMATION:\s*String\s*=\s*"([^"]+)"/.exec(suppression)?.[1];
    const serveur = /confirmation\s*!==\s*'([^']+)'/
      .exec(sansCommentaires(lire('worker/apps/api/src/handlers/gdpr.ts')))?.[1];

    expect(cote, 'le mot de confirmation est introuvable dans l’écran').toBeDefined();
    expect(serveur, 'le mot comparé est introuvable dans `deleteUserAccount`').toBeDefined();
    expect(
      cote,
      `l’écran fait écrire « ${cote} » et le serveur attend « ${serveur} » : la suppression `
      + 'serait refusée à quelqu’un qui a écrit exactement ce qu’on lui demandait',
    ).toBe(serveur);
  });

  it('⛔ l’export part aussi — c’était le second bouton mort du port', () => {
    /*
     * `mobile-controles-morts.test.ts` comptait « l'export de données » parmi ses six
     * contrôles éteints, sur l'écran où l'on vient précisément récupérer ce qu'on a écrit
     * avant de tout perdre. Le proposer sans qu'il parte serait pire ici qu'ailleurs : on
     * supprime ensuite.
     */
    expect(
      suppression,
      'l’écran parle d’export sans le demander — c’est le bouton mort du port, à l’identique',
    ).toMatch(/appelerBrut\(\s*"exportUserData"/);
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

describe('les textes légaux existent AUSSI en anglais', () => {
  /*
   * ⛔ LE SITE TRADUIT SES SEGMENTS, PAS SEULEMENT SON TEXTE.
   *
   * `/legal/cgu` devient `/en/legal/terms-of-use` (`src/i18n/segments.ts`). L'application
   * servait l'adresse française à tout le monde : quelqu'un dont l'appareil est en anglais
   * atterrissait sur des conditions générales qu'il ne peut pas lire — le pire endroit
   * possible pour supposer que « ça se comprend quand même ».
   *
   * La porte apparie les segments anglais de l'écran à la TABLE du site, jamais à une liste
   * recopiée : c'est la table qui fait autorité, et elle peut changer.
   */
  const legal = readFileSync(
    resolve(__dirname, '../../android/app/src/main/java/me/maxmorrys/rysmo/ecrans/compte/Legal.kt'),
    'utf8',
  );
  const segments = readFileSync(resolve(__dirname, '../../src/i18n/segments.ts'), 'utf8');

  it('chaque chemin français a son équivalent anglais, et c’est celui du site', () => {
    const paires = [...legal.matchAll(/chemin\s*=\s*"\/([^"]+)",\s*\n\s*cheminEn\s*=\s*"\/([^"]+)"/g)];
    expect(paires.length, 'aucune paire FR/EN extraite — l’extracteur est cassé').toBe(4);
    for (const [, fr, en] of paires) {
      const attendu = new RegExp(`['"]?${fr}['"]?:\\s*\\{\\s*fr:\\s*'${fr}',\\s*en:\\s*'([^']+)'`).exec(segments);
      expect(attendu, `« ${fr} » n’est plus dans la table de segments du site`).not.toBeNull();
      expect(en, `l’application ouvrirait /en/legal/${en} quand le site sert /en/legal/${attendu![1]}`)
        .toBe(attendu![1]);
    }
  });

  it('la racine anglaise est bien préfixée comme le site le fait', () => {
    expect(legal).toMatch(/SITE_LEGAL_EN[^=]*=\s*"\$SITE_PUBLIC\/en\/legal"/);
  });
});
