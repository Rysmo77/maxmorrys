import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE CINQUIÈME MIROIR DES TERMES DU CLUB — et le seul qui soit gardé.
 *
 * ⛔ CE DÉPÔT A DÉJÀ PAYÉ CE DÉFAUT AU PRIX FORT. Le prix du Club était recopié à
 * treize endroits sans point de contact : les CGV ont annoncé 10 000 FCFA/an
 * pendant que le code en débitait 19 900. Deux valeurs, deux commits, un
 * abonnement engageant douze mois.
 *
 * `src/lib/club/pricing.ts` liste ses miroirs et dit lesquels restent « sous
 * votre garde » — c'est-à-dire non vérifiés. L'application Android en ajoute un
 * cinquième, dans un cinquième langage. Celui-là est vérifié ici.
 *
 * ⚠️ Le PRIX lui-même n'est pas recopié côté Android, et c'est voulu : la
 * décision F.1 (ne pas nommer le magasin ni annoncer de montant) tient encore.
 * Si elle était renversée, ce fichier devrait gagner une comparaison de montant.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const lire = (p: string) => readFileSync(resolve(RACINE, p), 'utf8');

const WEB = lire('src/lib/club/pricing.ts');
const KOTLIN = lire('android/app/src/main/java/me/maxmorrys/rysmo/ecrans/club/Termes.kt');

/** Une constante Kotlin, hors commentaires — le dépôt en cite dans ses explications. */
function constKotlin(nom: string): string | undefined {
  const code = KOTLIN.split('\n')
    .filter((l) => { const t = l.trim(); return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')); })
    .join('\n');
  return new RegExp(`const val ${nom}[^=]*=\\s*(?:"([^"]*)"|(\\d+))`).exec(code)?.slice(1).find(Boolean);
}

describe('les termes du Club ne divergent pas entre le web et Android', () => {
  it('la porte lit vraiment les deux côtés', () => {
    expect(WEB.length, 'pricing.ts introuvable ou vide').toBeGreaterThan(500);
    expect(constKotlin('REMISE_FILLEUL_PCT'), 'aucune constante extraite du Kotlin').toBeDefined();
  });

  it('la remise du filleul est la même des deux côtés', () => {
    const web = /CLUB_REFERRAL_DISCOUNT\s*=\s*([\d.]+)/.exec(WEB)?.[1];
    expect(web, 'CLUB_REFERRAL_DISCOUNT a disparu de pricing.ts').toBeDefined();
    /* Le web l'écrit en fraction (0.15), Android en pourcentage entier : c'est la
       conversion qui doit tenir, pas l'écriture. */
    expect(Number(constKotlin('REMISE_FILLEUL_PCT'))).toBe(Math.round(Number(web) * 100));
  });

  it('la date de révision des termes est la même des deux côtés', () => {
    const web = /CLUB_TERMS_REVISED_AT\s*=\s*new Date\('(\d{4})-(\d{2})-(\d{2})/.exec(WEB);
    expect(web, 'CLUB_TERMS_REVISED_AT a disparu de pricing.ts').not.toBeNull();
    const [, a, m, j] = web!;
    expect(constKotlin('REVISE_LE'), 'Android affiche une autre date de révision que le web').toBe(`${j}/${m}/${a}`);
  });

  it('le mois d’ouverture du Club est le même des deux côtés', () => {
    /*
     * ⛔ « LE CLUB A OUVERT CETTE ANNÉE » EST UNE PHRASE QUI SE MET À MENTIR.
     * Le web a tranché : granularité au MOIS, écrite en absolu. Android doit dire le
     * même mois — sur les deux écrans dont le métier est d'expliquer pourquoi aucun
     * chiffre n'est annoncé, une date qui dérive est le pire endroit possible.
     */
    const web = /CLUB_OPENED_AT\s*=\s*'(\d{4})-(\d{2})'/.exec(WEB);
    expect(web, 'CLUB_OPENED_AT a disparu de pricing.ts').not.toBeNull();
    const [, annee, mois] = web!;
    const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    expect(constKotlin('OUVERT_EN')).toBe(`${MOIS[Number(mois) - 1]} ${annee}`);
  });

  it('Android figure dans la liste des miroirs de pricing.ts', () => {
    /* Une liste de miroirs qui ne se tient pas à jour est exactement ce qui a produit
       l'écart de prix : le cinquième miroir doit être NOMMÉ là où on va chercher. */
    expect(WEB, 'pricing.ts ne mentionne pas le miroir Android').toContain('Termes.kt');
  });
});
