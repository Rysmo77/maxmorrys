import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES VUES DU NATIF LISENT SANS FILET — et ce fichier est le filet.
 *
 * Les handlers `worker/apps/api/src/handlers/app/*` composent les modèles que
 * l'application native affiche. Ils lisent Firestore avec un COMPTE DE SERVICE, et
 * `worker/apps/api/src/context.ts` le dit sans détour :
 *
 *     « L'accès REST par compte de service contourne `firestore.rules` : chaque
 *       handler doit refaire ses contrôles explicitement, il n'y a pas de filet. »
 *
 * Deux conséquences, et la seconde est la plus grave.
 *
 * 1 · SANS `requireAuth`, la vue répond à un appel ANONYME. Toutes ces vues sont
 *     personnelles ; il n'en existe pas une seule qui doive répondre sans jeton.
 *
 * 2 · SANS LE CONTRÔLE D'ABONNEMENT, LE CLUB DEVIENT PUBLIC. `firestore.rules` garde
 *     `club_posts`, `club_events`, `club_infos` et `club_opportunities` derrière
 *     `hasActiveClubSub()`. Le compte de service ne la traverse pas — il l'ignore.
 *     Oublier la vérification une seule fois rend tout le contenu payant lisible par
 *     n'importe quel compte gratuit créé en trente secondes. Ce n'est pas une fuite
 *     discrète : c'est le produit, servi à qui le demande.
 *
 * Ces deux portes ne remplacent pas une relecture. Elles rendent l'oubli impossible à
 * livrer en silence, ce qui n'est pas la même chose — mais c'est ce qui manque le plus.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const VUES = join(RACINE, 'worker/apps/api/src/handlers/app');

function fichiers(): string[] {
  if (!existsSync(VUES)) return [];
  return readdirSync(VUES).filter((f) => f.endsWith('.ts'));
}

const lire = (f: string) => readFileSync(join(VUES, f), 'utf8');

describe('les vues natives refont les contrôles que les règles ne feront pas', () => {
  it('il y a des vues à vérifier', () => {
    // Sans ce garde, tout le fichier passerait au vert sur un dossier vide.
    expect(fichiers().length).toBeGreaterThan(0);
  });

  it('chaque vue exige un appel authentifié', () => {
    const sans = fichiers().filter((f) => !/requireAuth\(/.test(lire(f)));
    expect(sans, 'répondraient à un appel anonyme').toEqual([]);
  });

  it("chaque vue borne ses requêtes sur l'uid du JETON", () => {
    /*
     * `auth.uid` vient du jeton vérifié ; un identifiant pris dans la charge utile
     * viendrait de l'appelant. C'est toute la différence entre un handler et une faille,
     * et elle ne se voit pas à la lecture rapide — les deux lignes se ressemblent.
     */
    const suspects = fichiers().filter((f) => {
      const code = lire(f);
      return /\bdata\s*(?:as|\))/.test(code) && /userId/.test(code) && !/auth\.uid/.test(code);
    });
    expect(suspects, 'liraient un identifiant transmis par l’appelant').toEqual([]);
  });

  it("toute vue du Club vérifie l'abonnement elle-même", () => {
    const duClub = fichiers().filter((f) => /club/i.test(f));
    expect(duClub.length, 'aucune vue Club trouvée — le test ne vérifie plus rien')
      .toBeGreaterThan(0);
    /*
     * ⚠️ ON CHERCHE UN APPEL, PAS UNE DÉFINITION. La première version de cette porte
     * cherchait `abonnementActif(` — motif que la DÉCLARATION de la fonction satisfait
     * elle-même. Le test passait donc au vert sur un fichier dont le contrôle avait été
     * retiré : vérifié en le retirant pour de bon, et il n'a rien dit. Une porte qui ne
     * rougit jamais ne prouve rien, et celle-ci gardait le contenu payant.
     */
    const sans = duClub.filter((f) => !/await abonnementActif\(/.test(lire(f)));
    expect(sans, 'exposeraient le contenu payant à tout compte connecté').toEqual([]);
  });

  it('chaque vue estampille sa réponse', () => {
    /*
     * `releveA` alimente `<Num asOf>`. Sans lui, l'écran retombe sur une date par défaut et
     * affiche un chiffre daté d'aujourd'hui alors qu'il vient d'un cache — la règle du
     * système veut qu'un nombre n'existe pas sans sa date, et c'est ici qu'elle se tient.
     */
    const sans = fichiers().filter((f) => !/releveA/.test(lire(f)));
    expect(sans, 'répondraient sans date de relevé').toEqual([]);
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES ÉCRITURES DU NATIF — là où l'absence de filet coûte le plus cher.
 *
 * Une LECTURE sans contrôle expose des données. Une ÉCRITURE sans contrôle en fabrique :
 * elle laisse quelqu'un modifier ce qui ne lui appartient pas, et le défaut ne se voit
 * qu'après, dans les données.
 *
 * Le cas le plus subtil est `marquerLecon`. La règle `match /enrollments/{id}` impose
 * SEPT conditions à une mise à jour, dont celle-ci : `maxProgress` ne peut jamais
 * décroître. Ce n'est pas un plafond décoratif — il sert à n'accorder l'XP d'un palier
 * qu'une fois. Sans lui, décocher puis recocher une leçon rapporte de l'XP en boucle, et
 * cet XP alimente le classement du Club et les badges de parrainage.
 *
 * Le compte de service ne subit aucune de ces sept conditions. Chaque handler d'écriture
 * doit donc les refaire, et ces portes vérifient qu'il ne s'en dispense pas.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
/*
 * ⚠️ CETTE LISTE ÉTAIT INCOMPLÈTE, ET IL Y MANQUAIT LES DEUX PLUS SENSIBLES.
 *
 * `posterAuClub.ts` et `reserverSession.ts` sont les seules écritures qui touchent le
 * contenu PAYANT, et les seules dont l'abus est visible par d'autres membres. Elles font
 * les bons contrôles — vérifié à la lecture — mais RIEN ne les y obligeait : une liste
 * codée en dur ne garde que ce qu'on a pensé à y mettre, et personne ne relit une
 * constante.
 *
 * Ajoutées le 05/09/2026. Les quatre assertions de ce bloc s'y appliquent désormais.
 */
const ECRITURES = [
  'ecrireUneNote.ts',
  'marquerLecon.ts',
  'signalerMembre.ts',
  'creerMonProfil.ts',
  'posterAuClub.ts',
  'reserverSession.ts',
];

describe("les écritures natives refont les règles qu'elles contournent", () => {
  const lireEcriture = (f: string) =>
    readFileSync(join(RACINE, 'worker/apps/api/src/handlers', f), 'utf8');

  it('chaque handler d’écriture existe', () => {
    for (const f of ECRITURES) {
      expect(existsSync(join(RACINE, 'worker/apps/api/src/handlers', f)), f).toBe(true);
    }
  });

  it("aucune écriture ne prend son identifiant ailleurs que dans le jeton", () => {
    /*
     * Le chemin d'écriture se construit avec `auth.uid`, jamais avec une valeur reçue.
     * Un `users/${data.uid}/notes` écrirait dans le carnet de quelqu'un d'autre, et les
     * deux lignes se ressemblent assez pour passer une relecture.
     */
    const fautes = ECRITURES.filter((f) => !/auth\.uid/.test(lireEcriture(f)));
    expect(fautes, 'écrivent sans borner sur le jeton').toEqual([]);
  });

  it('`marquerLecon` empêche la progression maximale de redescendre', () => {
    // La ligne qui ferme la boucle à XP. Sans elle, le classement du Club devient faux.
    const code = lireEcriture('marquerLecon.ts');
    expect(code).toMatch(/Math\.max\(\s*maxAvant/);
    // Et le pourcentage est DÉDUIT, pas reçu : un `progress` transmis serait un curseur
    // qu'on tend à l'appelant — il n'a qu'à écrire 100 pour obtenir son certificat.
    expect(code).not.toMatch(/progress:\s*toNumber\(\s*data/);
  });

  it('chaque écriture borne ce qu’elle accepte', () => {
    /*
     * Un champ de texte sans plafond finit par recevoir un copier-coller de plusieurs
     * mégaoctets — et c'est la LISTE entière qui devient lente à charger, pas seulement
     * l'entrée fautive.
     *
     * DEUX FAÇONS DE BORNER, toutes deux valides, et la porte accepte les deux : tronquer
     * (`slice`) ou REFUSER (`.length > N` puis `HttpsError`). La première version de ce
     * test n'acceptait que `slice` et signalait `creerMonProfil`, qui refuse — c'est-à-dire
     * qu'elle poussait à remplacer un refus explicite par une troncature silencieuse. Un
     * nom coupé au 120e caractère sans le dire est pire qu'un nom rejeté avec son motif.
     */
    const borne = (code: string) => /\.slice\(/.test(code) || /\.length\s*>\s*\d+/.test(code);
    const fautes = ECRITURES
      .filter((f) => /texte|motif|displayName/.test(lireEcriture(f)))
      .filter((f) => !borne(lireEcriture(f)));
    expect(fautes, 'acceptent un texte sans borne').toEqual([]);
  });
});
