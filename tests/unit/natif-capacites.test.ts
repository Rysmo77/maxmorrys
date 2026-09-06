import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES CAPACITÉS NATIVES DU LOT 5 — CE QUI NE DOIT PAS REDEVENIR FAUX.
 *
 * Quatre dispositifs entrent ici : le verrou biométrique, l'état du réseau, la
 * sortie hors de l'application et le partage système. Trois d'entre eux existaient
 * déjà en morceaux, et c'est ce qui rend ce fichier nécessaire :
 *
 *   · le geste « ouvrir une adresse » vivait en TROIS copies, et une seule des
 *     trois portait le garde des App Links ;
 *   · le geste « partager » en vivait QUATRE ;
 *   · `USE_BIOMETRIC` était déclarée au manifeste pour une fonction absente.
 *
 * ⚠️ CES PORTES LISENT DES FICHIERS, PAS DES TYPES — même choix assumé que
 * `natif-socle.test.ts`. Elles attrapent la dérive de valeurs et le retour d'une
 * copie ; la compilation Gradle reste ce qui prouve que le code marche.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const KOTLIN = 'android/app/src/main/java/me/maxmorrys/rysmo';

const lire = (p: string) => readFileSync(resolve(RACINE, p), 'utf8');

/**
 * ⚠️ LES COMMENTAIRES SONT RETIRÉS LIGNE À LIGNE, ET PAS PAR EXPRESSION RÉGULIÈRE.
 *
 * Ce dépôt cite le code dont il parle : ce fichier-ci décrit `Intent.ACTION_VIEW`
 * dans ses propres explications, et une porte qui compte les commentaires compte
 * deux fois ce qui n'est écrit qu'une. Retirer les blocs `slash-étoile` par
 * expression régulière serait pire — la méthode a déjà mangé le milieu d'une
 * chaîne ailleurs dans ce dépôt.
 */
const sansCommentaires = (source: string) =>
  source
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*'));
    })
    .join('\n');

/** Tous les `.kt` écrits à la main sous `me/maxmorrys/rysmo`, générés exclus. */
function sourcesKotlin(): string[] {
  const out: string[] = [];
  const marcher = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) marcher(p);
      else if (e.name.endsWith('.kt') && !e.name.endsWith('.generated.kt')) out.push(p);
    }
  };
  marcher(join(RACINE, KOTLIN));
  return out;
}

const SORTIE = sansCommentaires(lire(`${KOTLIN}/systeme/Sortie.kt`));
const BIOMETRIE = sansCommentaires(lire(`${KOTLIN}/systeme/Biometrie.kt`));
const VERROUILLAGE = sansCommentaires(lire(`${KOTLIN}/ecrans/Verrouillage.kt`));
const RESEAU = sansCommentaires(lire(`${KOTLIN}/donnees/Reseau.kt`));
const ACTIVITE = sansCommentaires(lire(`${KOTLIN}/MainActivity.kt`));
const GRAPHE = sansCommentaires(lire(`${KOTLIN}/navigation/Graphe.kt`));
const MANIFESTE = lire('android/app/src/main/AndroidManifest.xml');
const GRADLE = lire('android/app/build.gradle.kts');

/* ─────────────────────────────────────────────────────────────────────────────
   0 · LES EXTRACTEURS REGARDENT VRAIMENT QUELQUE CHOSE
   ───────────────────────────────────────────────────────────────────────────── */

describe('les portes des capacités regardent vraiment quelque chose', () => {
  /* Le garde-fou que ce dépôt met partout : un extracteur qui ne trouve plus rien
     passerait au vert sans avoir rien gardé. C'est exactement par là que la porte
     d'atteignabilité du port React Native est devenue aveugle. */
  it('les six fichiers sont lus et non vides', () => {
    for (const [nom, code] of [
      ['Sortie.kt', SORTIE], ['Biometrie.kt', BIOMETRIE], ['Verrouillage.kt', VERROUILLAGE],
      ['Reseau.kt', RESEAU], ['MainActivity.kt', ACTIVITE], ['Graphe.kt', GRAPHE],
    ] as const) {
      expect(code.length, `${nom} introuvable ou vide`).toBeGreaterThan(400);
    }
    expect(sourcesKotlin().length, 'aucune source Kotlin — le marcheur est cassé')
      .toBeGreaterThan(40);
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   1 · UN SEUL UTILITAIRE DE SORTIE, ET UN SEUL DE PARTAGE
   ───────────────────────────────────────────────────────────────────────────── */

describe('sortir de l’application se fait à un seul endroit', () => {
  /**
   * ⛔ LE DÉFAUT QUE CETTE PORTE EXISTE POUR EMPÊCHER A DÉJÀ ÉTÉ LIVRÉ.
   *
   * `ecrans/compte/Legal.kt`, `ecrans/media/Commun.kt`, `ecrans/apprentissage/Commun.kt`
   * et `ecrans/club/Informations.kt` portaient chacun leur copie. Le commentaire de
   * `media/Commun.kt` le NOMMAIT — « les deux devraient se rejoindre dans un seul
   * utilitaire de sortie » — et c'est resté une dette écrite. Une dette écrite qu'aucune
   * porte ne compte se rembourse le jour où quelqu'un a le temps, c'est-à-dire jamais.
   */
  const construits = (action: string) => sourcesKotlin()
    .filter((f) => new RegExp(`Intent\\(\\s*Intent\\.${action}`).test(sansCommentaires(readFileSync(f, 'utf8'))))
    .map((f) => f.slice(RACINE.length + 1));

  it('un seul fichier construit un `ACTION_VIEW`', () => {
    expect(construits('ACTION_VIEW'), 'une copie du geste de sortie est réapparue')
      .toEqual([`${KOTLIN}/systeme/Sortie.kt`]);
  });

  it('un seul fichier construit un `ACTION_SEND`', () => {
    expect(construits('ACTION_SEND'), 'une copie du partage est réapparue')
      .toEqual([`${KOTLIN}/systeme/Sortie.kt`]);
  });

  it('les écrans passent tous par l’utilitaire, jamais par le système', () => {
    /* Un écran qui appellerait `startActivity` lui-même contournerait le garde des App
       Links sans qu'aucune des deux portes ci-dessus ne le voie : il n'aurait pas besoin
       de construire un `Intent` nommé pour ça. */
    const fautifs = sourcesKotlin()
      .filter((f) => !f.endsWith('systeme/Sortie.kt'))
      .filter((f) => /\bstartActivity\s*\(/.test(sansCommentaires(readFileSync(f, 'utf8'))))
      .map((f) => f.slice(RACINE.length + 1));
    expect(fautifs, 'ces écrans lancent une activité sans passer par `systeme/Sortie.kt`')
      .toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   2 · LE MIROIR DES APP LINKS
   ───────────────────────────────────────────────────────────────────────────── */

describe('l’utilitaire de sortie connaît les adresses qui nous appartiennent', () => {
  /**
   * ⛔ CE MIROIR EST UNE DETTE, ET C'EST CETTE PORTE QUI LA REND TOLÉRABLE.
   *
   * `maxmorrys.me/formations` et `maxmorrys.me/verifier` sont des App Links VÉRIFIÉS.
   * Un `ACTION_VIEW` nu sur ces adresses se résout SUR NOUS : l'écran rouvre l'écran,
   * sans erreur et sans trace. Le jour où un troisième préfixe entre au manifeste et pas
   * dans le Kotlin, le défaut est silencieux — d'où l'appariement.
   */
  const hotesManifeste = [...MANIFESTE.matchAll(/android:host="([^"]+)"/g)].map((m) => m[1]);
  const prefixesManifeste = [...MANIFESTE.matchAll(/android:pathPrefix="([^"]+)"/g)].map((m) => m[1]);

  const listeKotlin = (nom: string) => {
    const bloc = new RegExp(`val ${nom}: List<String> = listOf\\(([^)]*)\\)`).exec(SORTIE)?.[1] ?? '';
    return [...bloc.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  };

  it('la porte regarde vraiment quelque chose', () => {
    expect(hotesManifeste.length, 'aucun hôte extrait du manifeste').toBeGreaterThan(0);
    expect(prefixesManifeste.length, 'aucun préfixe extrait du manifeste').toBeGreaterThan(0);
    expect(listeKotlin('HOTES_APPLICATIFS').length, 'aucun hôte extrait de Sortie.kt').toBeGreaterThan(0);
  });

  it('les hôtes sont les mêmes des deux côtés', () => {
    expect(new Set(listeKotlin('HOTES_APPLICATIFS'))).toEqual(new Set(hotesManifeste));
  });

  it('les préfixes sont les mêmes des deux côtés', () => {
    expect(new Set(listeKotlin('PREFIXES_APPLICATIFS'))).toEqual(new Set(prefixesManifeste));
  });

  it('⛔ le garde passe AVANT les trois essais, pas seulement avant le dernier', () => {
    /*
     * ⚠️ CETTE PORTE A ÉTÉ ÉCRITE À L'ENVERS UNE PREMIÈRE FOIS, et l'erreur valait d'être
     * gardée : j'avais posé le garde sur le seul repli `ACTION_VIEW`, en raisonnant qu'un
     * onglet personnalisé porte le paquet d'un navigateur et ne peut donc pas revenir sur
     * nous. C'est exact, et ça rate le point — l'essai qui cherche « une application qui
     * revendique l'adresse » trouve NOTRE application sur `/formations` et `/verifier`,
     * puisque c'est exactement ce que déclare le manifeste. Le garde doit précéder les trois.
     */
    const corps = /fun ouvrirUneAdresse\(([\s\S]*?)\n\}/.exec(SORTIE)?.[1] ?? '';
    expect(corps, '`ouvrirUneAdresse` est introuvable').not.toBe('');

    const garde = corps.indexOf('estUneAdresseDeCetteApplication(');
    const revendique = corps.indexOf('uneApplicationRevendique(');
    const onglet = corps.indexOf('fournisseurDOnglets(');

    expect(garde, 'le garde des App Links a disparu').toBeGreaterThanOrEqual(0);
    expect(revendique, 'l’essai « une application installée la revendique » a disparu')
      .toBeGreaterThanOrEqual(0);
    expect(onglet, 'l’onglet personnalisé a disparu').toBeGreaterThanOrEqual(0);

    expect(revendique, 'nos propres App Links seraient rendus à… nous-mêmes')
      .toBeGreaterThan(garde);
    expect(onglet, 'le garde doit précéder aussi l’onglet').toBeGreaterThan(garde);
  });

  it('⛔ l’application qui revendique l’adresse passe AVANT l’onglet personnalisé', () => {
    /*
     * ⛔ RÉGRESSION ÉVITÉE DE JUSTESSE, ET C'ÉTAIT LE GESTE LE PLUS UTILISÉ DU PRODUIT.
     * Un onglet personnalisé désigne un NAVIGATEUR par son paquet. Ouvert sur `wa.me` — que
     * WhatsApp déclare en lien applicatif — il aurait servi la page web au lieu d'ouvrir
     * WhatsApp, sur « En parler sur WhatsApp », qui est la conversion de l'offre Présence
     * Digitale. Même perte sur `open.spotify.com`, seule façon d'écouter un épisode tant que
     * l'audio n'est pas hébergé.
     */
    const corps = /fun ouvrirUneAdresse\(([\s\S]*?)\n\}/.exec(SORTIE)?.[1] ?? '';
    expect(corps.indexOf('uneApplicationRevendique('), 'l’application tierce passerait après l’onglet')
      .toBeLessThan(corps.indexOf('fournisseurDOnglets('));

    /* Et « revendiquer » exclut les navigateurs, sinon la réponse est toujours oui et
       l'onglet personnalisé ne s'ouvre jamais. La sonde documentée est un `http:` sans hôte. */
    const sonde = /private fun uneApplicationRevendique\(([\s\S]*?)\n\}/.exec(SORTIE)?.[1] ?? '';
    expect(sonde, '`uneApplicationRevendique` est introuvable').not.toBe('');
    expect(sonde, 'la sonde du navigateur générique a disparu').toMatch(/Uri\.fromParts\("http", "", null\)/);
    expect(sonde, 'les navigateurs ne sont plus soustraits : la réponse serait toujours oui')
      .toMatch(/!in navigateurs/);
  });

  it('l’onglet personnalisé désigne son navigateur, et le passage direct ne le fait pas', () => {
    /* `setPackage` est ce qui empêche un onglet de revenir sur nous ; l'absence de
       `setPackage` sur le passage direct est ce qui laisse le système donner l'adresse à
       WhatsApp plutôt qu'à un navigateur choisi par nous. */
    const corps = /fun ouvrirUneAdresse\(([\s\S]*?)\n\}/.exec(SORTIE)?.[1] ?? '';
    expect(corps, 'l’onglet ne désigne plus son navigateur').toMatch(/setPackage\(/);
    const direct = /private fun essayerLeSysteme\(([\s\S]*?)\n\}/.exec(SORTIE)?.[1] ?? '';
    expect(direct, '`essayerLeSysteme` est introuvable').not.toBe('');
    expect(direct, 'le passage direct choisirait le navigateur à la place du système')
      .not.toMatch(/setPackage\(/);
  });

  it('la comparaison passe par l’URI analysée, jamais par la chaîne', () => {
    /* `"https://maxmorrys.me.attaquant.example/formations"` commence par la bonne
       sous-chaîne sans être notre hôte, et `"HTTPS://MAXMORRYS.ME/…"` est le nôtre sans
       commencer par elle. Un `startsWith` sur l'adresse entière se trompe des deux côtés. */
    const corps = /internal fun estUneAdresseDeCetteApplication\(([\s\S]*?)\n\}/.exec(SORTIE)?.[1] ?? '';
    expect(corps, 'la fonction de garde est introuvable').not.toBe('');
    expect(corps).toMatch(/uri\.host/);
    expect(corps, 'l’adresse entière est comparée en préfixe : les deux sens se trompent')
      .not.toMatch(/adresse\.startsWith/);
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   3 · LES DEUX BIBLIOTHÈQUES DU CATALOGUE SONT DÉCLARÉES — ET PAS LES AUTRES
   ───────────────────────────────────────────────────────────────────────────── */

describe('le catalogue de versions et les dépendances disent la même chose', () => {
  /**
   * ⛔ UN CATALOGUE DE VERSIONS NE MET RIEN SUR LE CHEMIN DE COMPILATION.
   *
   * `androidx.biometric` et `androidx.browser` y figuraient depuis le lot 1 sans être
   * déclarées, et trois fichiers du lot 4 en tiraient une conclusion écrite en
   * commentaire : « l'onglet personnalisé est impossible ». La confusion est facile —
   * les deux se lisent dans `gradle/libs.versions.toml` — et elle a coûté un dispositif
   * qu'on croyait indisponible.
   */
  const declarees = [...GRADLE.matchAll(/implementation\(libs\.([a-z0-9.]+)\)/g)].map((m) => m[1]);

  it('la porte regarde vraiment quelque chose', () => {
    expect(declarees.length, 'aucune dépendance extraite').toBeGreaterThan(8);
  });

  it('biométrie et navigateur sont sur le chemin de compilation', () => {
    expect(declarees, 'sans elle, `BiometricPrompt` n’existe pas').toContain('biometric');
    expect(declarees, 'sans elle, l’onglet personnalisé n’existe pas').toContain('browser');
  });

  it('⛔ media3 reste DEHORS, et c’est la frontière du lot', () => {
    /*
     * Ce n'est pas un oubli : les médias ne sont pas hébergés. La vidéo de leçon est une
     * intégration tierce, l'audio d'épisode pointe sur Spotify, et la seule porte
     * d'écriture du stockage ne connaît ni `courses/` ni `certificates/`
     * (`constat-hors-ligne.md`). Un lecteur qui ne lit rien n'est pas une fonction — et
     * `FOREGROUND_SERVICE_MEDIA_PLAYBACK` serait une permission de plus à la fiche Play
     * pour une capacité jamais exercée.
     */
    expect(declarees).not.toContain('media3.exoplayer');
    expect(declarees).not.toContain('media3.session');
    expect(MANIFESTE, 'une permission de service de premier plan pour un lecteur absent')
      .not.toContain('FOREGROUND_SERVICE');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   4 · UNE PERMISSION NE SE DÉCLARE QUE SI LA FONCTION EXISTE
   ───────────────────────────────────────────────────────────────────────────── */

describe('chaque permission du manifeste est justifiée par du code qui s’en sert', () => {
  /**
   * ⛔ LA RÈGLE QUI A ÉTÉ CORRIGÉE LE 05/09/2026 SUR L'ÉCRAN D'ACCUEIL.
   *
   * `POST_NOTIFICATIONS` n'est PAS déclarée, délibérément : aucune notification n'est
   * envoyée, et demander une permission pour une fonction absente élargit la fiche des
   * magasins pour rien. La réciproque doit tenir aussi — `USE_BIOMETRIC` était déclarée
   * depuis le lot 1 pour un dispositif qui n'existait pas ; le lot 5 le construit, et
   * cette table l'exige.
   *
   * ⚠️ LE SYMBOLE CHERCHÉ EST CELUI DE L'API, pas un nom maison : une fonction qu'on
   * renomme ne doit pas pouvoir faire passer une permission pour justifiée.
   */
  const JUSTIFICATIONS: Record<string, string> = {
    'android.permission.INTERNET': 'OkHttpClient',
    'android.permission.ACCESS_NETWORK_STATE': 'ConnectivityManager',
    'android.permission.USE_BIOMETRIC': 'BiometricPrompt',
    'android.permission.USE_FINGERPRINT': 'BiometricPrompt',
  };

  const declarees = [...MANIFESTE.matchAll(/android:name="(android\.permission\.[A-Z_]+)"/g)]
    .map((m) => m[1]);

  const toutLeKotlin = sourcesKotlin()
    .map((f) => sansCommentaires(readFileSync(f, 'utf8')))
    .join('\n');

  it('la porte regarde vraiment quelque chose', () => {
    expect(declarees.length, 'aucune permission extraite du manifeste').toBe(4);
    expect(toutLeKotlin.length, 'aucun Kotlin lu').toBeGreaterThan(50_000);
  });

  it('aucune permission déclarée sans code qui l’exerce', () => {
    const injustifiees = declarees.filter((p) => {
      const symbole = JUSTIFICATIONS[p];
      return symbole === undefined || !toutLeKotlin.includes(symbole);
    });
    expect(
      injustifiees,
      'une permission sans fonction élargit la fiche des magasins pour rien — et si le '
      + 'symbole a changé de nom, c’est la table de ce test qu’il faut mettre à jour, '
      + 'après avoir vérifié que la fonction existe encore',
    ).toEqual([]);
  });

  it('`POST_NOTIFICATIONS` reste absente tant qu’aucune notification ne part', () => {
    expect(MANIFESTE).not.toContain('POST_NOTIFICATIONS');
    expect(toutLeKotlin, 'du code de notification est apparu sans sa permission')
      .not.toMatch(/NotificationManagerCompat|NotificationChannel/);
  });

  it('l’inventaire de confidentialité nomme exactement ces permissions', () => {
    /* ⛔ `store/confidentialite/inventaire-collecte.md` est la DÉRIVATION du formulaire
       des magasins. Un formulaire recopié sans sa source se re-remplit de mémoire à
       chaque version, et dérive. */
    const inventaire = lire('store/confidentialite/inventaire-collecte.md');
    for (const p of declarees) {
      const court = p.replace('android.permission.', '');
      expect(inventaire, `${court} n’est pas inscrite à l’inventaire de collecte`)
        .toContain(court);
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   5 · LE SAS BIOMÉTRIQUE
   ───────────────────────────────────────────────────────────────────────────── */

describe('le sas biométrique est une couche, pas une destination', () => {
  it('⛔ il enveloppe le graphe, il n’y est pas enregistré', () => {
    /*
     * `spec-ecrans-natif.md` § C.5 : « le sas biométrique → une couche AU-DESSUS du
     * graphe ». En faire une destination l'obligerait à être ATTEINTE, donc poussée par
     * quelqu'un, donc composée APRÈS le contenu qu'elle prétend protéger. Un verrou qui
     * s'affiche après le contenu n'a rien protégé.
     */
    expect(ACTIVITE, 'le sas n’enveloppe plus rien').toMatch(/SasBiometrique\(/);
    const corps = /SasBiometrique\(([\s\S]*?)\n {16}\}/.exec(ACTIVITE)?.[1] ?? ACTIVITE;
    expect(corps, 'le graphe n’est plus DANS le sas').toMatch(/GrapheRysmo\(/);
    expect(GRAPHE, 'le sas est devenu une destination').not.toMatch(/SasBiometrique/);
  });

  it('⛔ `MainActivity` est une `FragmentActivity`', () => {
    /* `androidx.biometric.BiometricPrompt` n'accepte rien d'autre. Le défaut ne se voit
       pas à la compilation : l'écran verrouillé fait `contexte as? FragmentActivity`, qui
       rendrait `null` à l'exécution — sur le seul appareil qui a un verrou armé. */
    expect(ACTIVITE).toMatch(/class MainActivity : FragmentActivity\(\)/);
  });

  it('⛔ rien du contenu n’est composé tant que le réglage n’est pas lu', () => {
    /* Rendre le graphe puis le recouvrir laisserait ses écrans se monter, lire leurs vues
       et paraître une image — et une image suffit à lire ce qu'on voulait cacher. */
    const sas = /fun SasBiometrique\(([\s\S]*?)\n\}/.exec(VERROUILLAGE)?.[1] ?? '';
    expect(sas, '`SasBiometrique` est introuvable').not.toBe('');
    const avantContenu = sas.slice(0, sas.indexOf('contenu()'));
    expect(avantContenu, 'le contenu est composé avant que le verrou ne sache quoi faire')
      .toMatch(/verrouArme == null/);
  });

  it('⛔ le verrouillage exige une session : il ne ferme pas un catalogue public', () => {
    const condition = /fun doitVerrouiller\([\s\S]*?=\n?([\s\S]*?)\n\n/.exec(VERROUILLAGE)?.[1] ?? '';
    expect(condition, '`doitVerrouiller` est introuvable').not.toBe('');
    expect(condition, 'le verrou se fermerait sur une application sans compte')
      .toMatch(/Session\.Connectee/);
  });
});

describe('le verrou ne peut pas mentir sur ce qu’il fait', () => {
  it('⛔ le bouton d’activation ARME, il ne navigue pas', () => {
    /*
     * LE DÉFAUT D'ORIGINE, À LA LETTRE : `app/biometrie.tsx` proposait « Activer Face ID »
     * et son bouton appelait `router.replace('/(tabs)')`. Il AVAIT une action — ce n'était
     * simplement pas celle qu'il annonçait, ce qui est pire qu'un bouton mort : quelqu'un
     * croyait avoir posé un verrou et n'en avait aucun.
     */
    expect(VERROUILLAGE).toMatch(/poserVerrouBiometrique\(true\)/);
    expect(VERROUILLAGE).toMatch(/poserVerrouBiometrique\(false\)/);
  });

  it('⛔ il ne s’arme QU’APRÈS une reconnaissance réussie', () => {
    /*
     * Poser le drapeau sur la seule intention armerait un verrou que la personne n'a jamais
     * ouvert une fois : le premier essai serait au démarrage suivant, quand il est trop tard
     * pour découvrir que le capteur ne la reconnaît pas.
     *
     * ⚠️ CETTE PORTE A ÉTÉ AVEUGLE À SA PREMIÈRE ÉCRITURE, et pour une raison qui vaut d'être
     * gardée : elle cherchait « le `demanderLIdentite` le plus proche AVANT l'armement » dans
     * le fichier entier. Déplacé hors de l'invite, l'armement trouvait alors l'invite de
     * l'ÉCRAN VERROUILLÉ, plus haut dans le même fichier, qui porte elle aussi une branche
     * `Reussie` — et la porte restait verte sur exactement le défaut d'origine. On borne
     * donc au bloc `onArmer`, et on compare des POSITIONS plutôt que des présences.
     */
    const armements = [...VERROUILLAGE.matchAll(/poserVerrouBiometrique\(true\)/g)];
    expect(armements.length, 'aucun armement, ou plusieurs : lequel fait foi ?').toBe(1);

    const onArmer = /onArmer = \{([\s\S]*?)\n {16}\},/.exec(VERROUILLAGE)?.[1] ?? '';
    expect(onArmer, 'le bloc `onArmer` est introuvable').not.toBe('');

    const invite = onArmer.indexOf('demanderLIdentite(');
    const reussie = onArmer.indexOf('ResultatBiometrique.Reussie');
    const arme = onArmer.indexOf('poserVerrouBiometrique(true)');

    expect(invite, 'le bouton n’ouvre plus l’invite du système').toBeGreaterThanOrEqual(0);
    expect(arme, 'l’armement a quitté le bouton d’activation').toBeGreaterThanOrEqual(0);
    expect(arme, 'le verrou s’arme AVANT que le système n’ait reconnu qui que ce soit')
      .toBeGreaterThan(invite);
    expect(reussie, 'la branche « réussie » a disparu').toBeGreaterThan(invite);
    expect(arme, 'l’armement n’est pas dans la branche « réussie »').toBeGreaterThan(reussie);
  });

  it('⛔ l’écran verrouillé garde une sortie qui ne passe pas par le capteur', () => {
    /* L'invariant de `spec-biometrie.md` : « un échec d'authentification ne doit JAMAIS
       enfermer ». Un capteur cassé rendrait sinon le compte inaccessible depuis ce
       téléphone, sans aucun geste pour en sortir. */
    const ecran = /private fun EcranVerrouille\(([\s\S]*?)\n\}\n/.exec(VERROUILLAGE)?.[1] ?? '';
    expect(ecran, '`EcranVerrouille` est introuvable').not.toBe('');
    expect(ecran, 'la sortie de secours a disparu de l’écran verrouillé')
      .toMatch(/"Me déconnecter",\n\s*onDeconnexion,/);
    /* ⛔ Et elle est branchée sur un geste RÉEL, pas sur une lambda vide : c'est
       `session::deconnecter`, et `SourceDeSession` la porte. */
    expect(ACTIVITE).toMatch(/onDeconnexion = session::deconnecter/);
    expect(lire(`${KOTLIN}/session/SourceDeSession.kt`)).toMatch(/fun deconnecter\(\)/);
  });

  it('⛔ la sortie ne dit pas « ouvrir sans le verrou »', () => {
    /* Une sortie qui OUVRE viderait le verrou de tout sens : n'importe qui la toucherait.
       Se déconnecter donne une issue sans donner l'accès. */
    const ecran = /private fun EcranVerrouille\(([\s\S]*?)\n\}\n/.exec(VERROUILLAGE)?.[1] ?? '';
    expect(ecran).not.toMatch(/onOuvert\s*,/);
  });

  it('l’écran ne propose rien quand le matériel ne suit pas', () => {
    /* « Proposer un verrou impossible à poser est un réglage qui ment » — et « pas de
       capteur » n'est pas « aucune empreinte enrôlée » : la seconde se règle en une
       minute dans les paramètres du téléphone. */
    for (const cas of ['AUCUN_MATERIEL', 'AUCUNE_EMPREINTE', 'INDISPONIBLE']) {
      expect(VERROUILLAGE, `le cas ${cas} n’est pas distingué`).toContain(cas);
    }
  });

  it('⛔ le code de l’appareil reste accepté, et aucun bouton négatif ne le contredit', () => {
    /*
     * Deux pièges en un. Le premier est de sûreté : sans `DEVICE_CREDENTIAL`, un capteur
     * qui cesse de reconnaître ferme le compte. Le second est mécanique :
     * `PromptInfo.Builder` LÈVE si un bouton négatif est posé en même temps que le code
     * de l'appareil — la panne serait au premier déverrouillage, pas à la compilation.
     */
    expect(BIOMETRIE).toMatch(/DEVICE_CREDENTIAL/);
    expect(BIOMETRIE, 'un bouton négatif avec DEVICE_CREDENTIAL fait lever `build()`')
      .not.toMatch(/setNegativeButtonText/);
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   6 · L'ÉTAT DU RÉSEAU
   ───────────────────────────────────────────────────────────────────────────── */

describe('l’état du réseau est lu au moment de l’échec, et jamais gardé', () => {
  /**
   * ⛔ LA RÈGLE, ET CE QU'ELLE COÛTE QUAND ON LA PERD.
   *
   * « Pas de connexion. » pour TOUT échec de transport envoie vérifier un forfait quand
   * c'est le serveur qui tombe. Sur ce marché, où les données se comptent, ce n'est pas
   * une approximation : c'est une accusation, et elle fait recharger du crédit pour rien.
   * Un état MÉMORISÉ produit la même accusation, avec un décalage en plus.
   */
  it('aucun état réseau n’est retenu dans une propriété', () => {
    expect(RESEAU, 'un état réseau gardé est faux dès qu’on passe une porte')
      .not.toMatch(/(?:var|val)\s+\w+\s*:\s*EtatReseau\s*=/);
  });

  it('le diagnostic ne peut pas jeter : tout son corps est sous `try`', () => {
    /* Elle est appelée DEPUIS UN `catch`. Une fonction de diagnostic qui échoue dans un
       gestionnaire d'erreur REMPLACE l'erreur d'origine par la sienne, et la personne lit
       le défaut de l'outil de mesure au lieu du sien. */
    expect(RESEAU).toMatch(/override fun etat\(\): EtatReseau = try \{/);
    const rattrapes = [...RESEAU.matchAll(/\}\s*catch \(erreur: (\w+)\)/g)].map((m) => m[1]);
    expect(rattrapes, 'les deux familles d’échec du système doivent être rattrapées')
      .toEqual(expect.arrayContaining(['SecurityException', 'RuntimeException']));
  });

  it('⛔ les quatre motifs restent distincts dans `Appel`', () => {
    /*
     * La porte du port avait d'abord vérifié la PRÉSENCE des motifs, pas leur
     * ATTEIGNABILITÉ : elle restait verte quand on réintroduisait la phrase unique. Ici on
     * exige que le `catch` DÉLÈGUE — qu'il interroge le réseau et branche sur les trois
     * réponses — et que le dépassement de délai se décide sur la limite QU'ON A POSÉE,
     * jamais sur le nom que la bibliothèque a donné à son exception.
     */
    const appel = sansCommentaires(lire(`${KOTLIN}/donnees/Appel.kt`));
    const transport = /private fun echecDeTransport\(([\s\S]*?)\n {4}\}/.exec(appel)?.[1] ?? '';
    expect(transport, '`echecDeTransport` est introuvable').not.toBe('');
    expect(transport, 'le `catch` ne délègue plus au diagnostic').toMatch(/reseau\.etat\(\)/);
    for (const cas of ['EtatReseau.ABSENT', 'EtatReseau.PRESENT', 'EtatReseau.INDETERMINE']) {
      expect(transport, `${cas} n’est plus branché`).toContain(cas);
    }
    expect(transport, 'le dépassement se reconnaît à la limite posée, pas au nom de la classe')
      .toMatch(/appel\.isCanceled\(\)|ecouleMs >= DELAI_MS/);
    expect(transport, 'le nom de la classe d’exception est redevenu la décision')
      .not.toMatch(/is TimeoutException|is InterruptedIOException/);
  });

  it('⛔ la veille du retour se referme, et ne prévient qu’une fois', () => {
    /* Une veille orpheline survit à l'écran et rappelle dans le vide ; une veille sans
       verrou rejoue l'appel à chaque battement d'une cellule en limite de couverture. */
    expect(RESEAU).toMatch(/registerNetworkCallback\(/);
    expect(RESEAU).toMatch(/unregisterNetworkCallback\(/);
    expect(RESEAU, 'rien n’empêche la veille de prévenir deux fois').toMatch(/compareAndSet\(false, true\)/);
  });

  it('⛔ l’écran hors-connexion est un ÉTAT, pas une destination', () => {
    /*
     * `spec-etat-reseau.md` l'interdit nommément : router vers `/hors-connexion`
     * montrerait deux listes vides — des téléchargements et une file d'envoi qui
     * n'existent pas (`constat-hors-ligne.md`). Ce qui change quand le réseau manque,
     * c'est ce que la carte de panne propose, pas l'écran où l'on se trouve.
     */
    const destinations = sansCommentaires(lire(`${KOTLIN}/navigation/Destinations.kt`));
    expect(destinations, 'le hors-connexion est devenu une destination')
      .not.toMatch(/@Serializable\s+(?:data class|object)\s+HorsConnexion/);

    const verification = sansCommentaires(lire(`${KOTLIN}/ecrans/apprentissage/Verification.kt`));
    expect(verification, 'la reprise au retour du réseau a disparu')
      .toMatch(/veillerLeRetourDuReseau\(/);
    /* ⛔ ET LA PHRASE DOIT ÊTRE BRANCHÉE. « Elle repart toute seule » est une promesse ;
       l'écrire sans la veille serait le contrôle mort d'une promesse, la version la plus
       difficile à voir puisqu'il n'y a même pas de bouton à toucher. */
    expect(verification).toMatch(/repart toute seule/);
    expect(verification, 'la veille n’est pas refermée avec la carte').toMatch(/onDispose \{ veille\.arreter\(\) \}/);
  });
});
