import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNE PANNE DE TRANSPORT N'A PLUS UNE SEULE PHRASE.
 *
 * Le défaut d'origine tient en une ligne de `donnees/appel.ts` :
 *
 *     } catch {
 *       throw new ErreurAppel('unavailable', …, 'Pas de connexion.');
 *     }
 *
 * Absence de réseau, serveur muet, DNS, délai dépassé : quatre causes, une phrase. Elle est
 * fausse la moitié du temps, et sa fausseté COÛTE — sur ce marché, « pas de connexion »
 * envoie vérifier un forfait et recharger du crédit pendant que le serveur tombe.
 *
 * Rien ne l'attrapait, et rien ne pouvait : le typecheck est vert, l'écran s'affiche, la
 * phrase est bien écrite. Seul son rapport au réel manquait.
 *
 * ── CE QUE CES PORTES TIENNENT ────────────────────────────────────────────────
 *   1 · le `catch` de transport produit PLUSIEURS motifs, dont un qui nomme le serveur ;
 *   2 · le délai dépassé se reconnaît au SIGNAL, jamais au nom de l'erreur ;
 *   3 · l'état du réseau est lu à l'échec, jamais gardé en mémoire ;
 *   4 · `reseau.ts` ne peut pas jeter — il est appelé DEPUIS un gestionnaire d'erreur ;
 *   5 · aucun appel n'est bloqué sur la foi de cet état ;
 *   6 · les permissions Android du paquet sont déclarées, donc le tableau reste vrai.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const MOBILE = join(RACINE, 'mobile');

/** Le code servi, commentaires retirés : une intention citée n'est pas une preuve. */
function code(chemin: string): string {
  return readFileSync(join(MOBILE, chemin), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const appel = code('donnees/appel.ts');
const reseau = code('donnees/reseau.ts');
const app = JSON.parse(readFileSync(join(MOBILE, 'app.json'), 'utf8')).expo;
const paquet = JSON.parse(readFileSync(join(MOBILE, 'package.json'), 'utf8'));

describe('l’échec de transport — plus une seule phrase pour toutes les causes', () => {
  it('le paquet qui lit l’état est installé', () => {
    // Sans lui, `reseau.ts` retomberait sur `indetermine` à chaque appel et les trois
    // motifs se réduiraient silencieusement à un seul — le défaut d'origine, revenu.
    expect(paquet.dependencies['expo-network']).toBeDefined();
  });

  it('le catch produit trois motifs distincts, pas un seul', () => {
    /*
     * C'EST LA PORTE PRINCIPALE, et elle vérifie l'ATTEIGNABILITÉ, pas la présence. Trois
     * phrases posées dans une fonction que personne n'appelle laisseraient le défaut intact
     * tout en satisfaisant un `toContain` sur le fichier — c'est exactement la forme d'erreur
     * qui a survécu à la première rédaction de ce test.
     *
     * On exige donc les deux moitiés : le `catch` du transport DÉLÈGUE, et la fonction à qui
     * il délègue porte les trois motifs.
     */
    const emission = /export async function appeler<[\s\S]*?\n}/.exec(appel)?.[0] ?? '';
    expect(emission, 'appeler introuvable').not.toBe('');
    const attrape = /catch\s*\([\s\S]*?\)\s*\{[\s\S]*?\n {2}\}/.exec(emission)?.[0] ?? '';
    expect(attrape, "le `catch` du transport est introuvable").not.toBe('');
    expect(attrape, 'le `catch` fabrique son motif sur place — il ne peut donc en avoir qu’un')
      .not.toMatch(/new ErreurAppel\(/);
    expect(attrape, 'le `catch` ne délègue pas au traitement des trois causes')
      .toMatch(/throw await echecDeTransport\(/);

    const traitement = /async function echecDeTransport[\s\S]*?\n}/.exec(appel)?.[0] ?? '';
    expect(traitement, 'echecDeTransport introuvable').not.toBe('');
    const attendus = [
      "Ton téléphone n'a pas de réseau.",
      'Le serveur ne répond pas.',
      'Le serveur met trop de temps.',
    ];
    for (const motif of attendus) {
      expect(traitement, `le motif « ${motif} » n’est plus atteignable`).toContain(motif);
    }
  });

  it('le motif qui accusait le forfait ne couvre plus que l’inconnu', () => {
    /*
     * « Pas de connexion. » reste — c'est la réponse honnête quand le téléphone n'a pas pu
     * dire dans quel état il est. Mais il ne doit plus être écrit qu'UNE fois : deux
     * occurrences signifieraient qu'un chemin déterminé le réutilise, et l'accusation
     * serait de retour sur ce chemin-là.
     */
    const occurrences = appel.match(/Pas de connexion\./g) ?? [];
    expect(occurrences.length, '« Pas de connexion. » sert encore plusieurs chemins')
      .toBe(1);
  });

  it('le délai dépassé se reconnaît au signal, jamais au nom de l’erreur', () => {
    /*
     * Le piège exact, et il est invisible au typecheck : `AbortSignal.timeout` pose bien un
     * `TimeoutError` en `signal.reason`, mais le `fetch` de React Native rejette avec
     * `DOMException('Aborted', 'AbortError')` et celui d'Expo enveloppe l'échec natif dans
     * un `FetchError` nommé « Error ». Le même délai dépassé porte donc trois noms selon le
     * drapeau `EXPO_PUBLIC_USE_RN_FETCH` et la version du SDK — et un test qui lit le nom
     * passerait sur la machine de quelqu'un et pas sur le téléphone de quelqu'un d'autre.
     *
     * Le signal, lui, n'a qu'une raison de s'abattre : la nôtre.
     */
    expect(appel, 'le signal du délai n’est pas retenu pour être relu après l’échec')
      .toMatch(/limite\s*=\s*AbortSignal\.timeout\(/);
    expect(appel, 'le délai est déduit du signal, pas du nom')
      .toMatch(/limite\?\.aborted/);
    expect(appel, 'le nom de l’erreur ne décide de rien — il change selon le fetch en dessous')
      .not.toMatch(/(?:name|nom)\s*===\s*['"](?:TimeoutError|AbortError)['"]/);
  });

  it("l'état du réseau est lu DANS le chemin d'échec, pas au démarrage", () => {
    /*
     * Un état lu une fois et gardé est faux dès qu'on passe une porte : il ferait dire
     * « ton téléphone n'a pas de réseau » à quelqu'un qui vient de retrouver la 4G.
     * L'appel doit donc vivre à l'intérieur de la fonction qui traite l'échec, jamais au
     * niveau du module.
     */
    expect(appel).toMatch(/from '\.\/reseau'/);
    const traitement = /async function echecDeTransport[\s\S]*?\n}/.exec(appel)?.[0] ?? '';
    expect(traitement, 'echecDeTransport introuvable').not.toBe('');
    expect(traitement, "l'état du réseau n'est pas lu à l'échec").toMatch(/await etatDuReseau\(\)/);
    // Aucune valeur de module : ni cache, ni abonnement, ni dernier état connu.
    expect(reseau, 'un état gardé en mémoire est faux dès la porte suivante')
      .not.toMatch(/^(?:const|let|var)\s+\w*(?:cache|dernier|Cache|Dernier)/m);
    expect(reseau, 'un abonnement garderait un état entre deux appels')
      .not.toMatch(/addNetworkStateListener|useNetworkState/);
  });

  it('la lecture du réseau ne peut pas jeter', () => {
    /*
     * Elle est appelée DEPUIS un `catch`. Une fonction de diagnostic qui échoue dans un
     * gestionnaire d'erreur ne rate pas seulement son diagnostic : elle remplace l'erreur
     * d'origine par la sienne, et la personne lit le défaut de l'outil de mesure au lieu du
     * sien. Le corps entier — appel natif compris — doit donc tenir dans un `try`.
     */
    const corps = /export async function etatDuReseau\(\)[\s\S]*$/.exec(reseau)?.[0] ?? '';
    expect(corps, 'etatDuReseau introuvable').not.toBe('');
    expect(corps, "l'appel natif est hors du `try`")
      .toMatch(/try\s*\{[\s\S]*getNetworkStateAsync\(\)[\s\S]*\}\s*catch/);
    expect(corps, 'le `catch` doit répondre `indetermine`, pas relancer')
      .toMatch(/catch\s*(?:\([^)]*\))?\s*\{[^}]*return 'indetermine';[^}]*\}/);
    expect(corps, 'un `throw` dans une fonction de diagnostic masque l’erreur d’origine')
      .not.toMatch(/\bthrow\b/);
  });

  it("l'absence de réseau ne BLOQUE aucun appel", () => {
    /*
     * L'état du système se trompe — capture de portail, VPN, réseau d'entreprise, validation
     * qui tarde. Un client qui refuserait de partir sur cette foi refuserait des appels qui
     * auraient abouti. La distinction sert le MOTIF, rien d'autre : elle doit donc vivre
     * APRÈS le `fetch`, jamais avant.
     */
    const emission = /export async function appeler<[\s\S]*?\n}/.exec(appel)?.[0] ?? '';
    expect(emission, 'appeler introuvable').not.toBe('');
    expect(emission, 'le fetch a disparu').toMatch(/await fetch\(/);
    expect(emission, "la fonction qui ÉMET l'appel interroge le réseau — c'est un blocage")
      .not.toMatch(/etatDuReseau\(/);
    // Et la lecture n'existe qu'à un seul endroit : le traitement de l'échec.
    expect((appel.match(/etatDuReseau\(/g) ?? []).length, "l'état du réseau est lu ailleurs")
      .toBe(1);
  });

  it('les deux champs facultatifs sont comparés à `false`, jamais à leur véracité', () => {
    /*
     * `isInternetReachable` vaut `undefined` tant qu'Android n'a pas tranché sur
     * `NET_CAPABILITY_VALIDATED`, et sur iOS il recopie `isConnected`. Le raccourci
     * `!etat.isInternetReachable` dirait donc « pas de réseau » sur un téléphone
     * parfaitement connecté dont la validation n'est pas encore revenue — c'est-à-dire au
     * pire moment, juste après un changement d'antenne.
     */
    expect(reseau).toMatch(/isInternetReachable === false/);
    expect(reseau, 'la négation confond « indéterminé » et « absent »')
      .not.toMatch(/!\s*\w*\.?isInternetReachable\b/);
    expect(reseau, 'la négation confond « indéterminé » et « absent »')
      .not.toMatch(/!\s*\w*\.?isConnected\b/);
  });
});

describe('le tableau des permissions Android reste vrai', () => {
  it('les permissions fusionnées par `expo-network` y sont déclarées', () => {
    /*
     * `android.permissions` a été rendu véridique le 3 septembre, et il ne doit pas
     * redevenir faux : le paquet fait fusionner `ACCESS_NETWORK_STATE` et
     * `ACCESS_WIFI_STATE` dans le manifeste au `prebuild` — les taire ici rendrait le
     * tableau muet sur deux permissions réellement demandées.
     *
     * Les deux sont NORMALES au sens d'Android : aucune invite, aucun refus possible,
     * aucune ligne au formulaire de confidentialité des magasins. C'est la lecture d'un état
     * que le système publie déjà, pas un accès à des données.
     */
    if (!paquet.dependencies['expo-network']) return;
    for (const permission of ['ACCESS_NETWORK_STATE', 'ACCESS_WIFI_STATE']) {
      expect(app.android.permissions, `android.permission.${permission} manque au tableau`)
        .toContain(`android.permission.${permission}`);
    }
  });

  it("aucune de ces deux permissions n'est bloquée par ailleurs", () => {
    // `blockedPermissions` gagne sur `permissions` au `prebuild` : les deux listes qui se
    // contredisent produiraient un manifeste sans la permission, et un état réseau
    // silencieusement toujours `indetermine`.
    const bloquees: string[] = app.android.blockedPermissions ?? [];
    expect(bloquees.filter((p) => p.includes('ACCESS_NETWORK_STATE') || p.includes('ACCESS_WIFI_STATE')))
      .toEqual([]);
  });
});
