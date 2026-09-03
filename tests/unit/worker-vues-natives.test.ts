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
