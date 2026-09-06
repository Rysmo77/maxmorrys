import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PACKS, DEPOSIT_RATE, QUOTE_VALIDITY_DAYS, CATALOGUE_REVISED_AT,
  findPack, packEffectivePrice, isValidQuoteRef, generateQuoteRef,
} from '../../src/lib/presence/offer';
import { TVA_TAUX_NORMAL, regimeDe, ventilerDepuisHT } from '../../src/lib/tax/senegal';
import { SUPPORT_SCOPE } from '../../src/lib/adminAccess';
import { ADMIN_SCREEN_COUNT } from '../../src/lib/admin/consoleNav';
import { contact } from '../../src/lib/brand';
import presenceFr from '../../src/i18n/locales/fr/presence.json';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES MIROIRS DU LOT 4 DE L'APPLICATION NATIVE — ET LA SEULE RAISON DE LES TOLÉRER.
 *
 * ⛔ CE DÉPÔT A DÉJÀ PAYÉ LA DUPLICATION AU PRIX FORT, deux fois. Le prix du Club
 * était recopié à treize endroits sans point de contact : les CGV ont annoncé
 * 10 000 FCFA/an pendant que le code en débitait 19 900. Le numéro de téléphone
 * vivait dans neuf fichiers sous trois formats. Et le compte d'écrans de la
 * console était écrit « 19 » dans une maquette qui ne le recomptait jamais.
 *
 * Trois projets TypeScript ne peuvent déjà pas s'importer entre eux ; un module
 * Gradle encore moins. L'application Android ajoute donc des miroirs — et la
 * seule chose qui distingue un miroir tolérable d'une dette silencieuse, c'est
 * qu'une porte rougisse quand les deux côtés divergent. C'est ce fichier.
 *
 * Il en garde cinq :
 *   1 · la grille tarifaire de l'offre Présence Digitale ;
 *   2 · le taux de taxe et la date de révision qui datent ces montants ;
 *   3 · le numéro WhatsApp ;
 *   4 · le compte d'écrans de la console de bureau ;
 *   5 · les cinq portées du rôle support — leurs libellés ET leurs chemins.
 *
 * ⚠️ MÊME MÉTHODE QUE `club-termes-miroir.test.ts` : les commentaires Kotlin sont
 * retirés LIGNE À LIGNE, pas par expression régulière. Ce dépôt cite le code dont
 * il parle dans ses commentaires ; une porte qui lit les commentaires compte deux
 * fois ce qui n'est écrit qu'une, et refuse un fichier correct.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const KOTLIN = 'android/app/src/main/java/me/maxmorrys/rysmo/ecrans/media';

const lire = (p: string) => readFileSync(resolve(RACINE, p), 'utf8');

/** Le code Kotlin, commentaires retirés — une ligne de commentaire commence par `*`, `//` ou `/*`. */
function sansCommentaires(source: string): string {
  return source
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*'));
    })
    .join('\n');
}

const COMMUN = sansCommentaires(lire(`${KOTLIN}/Commun.kt`));
const CONSOLE = sansCommentaires(lire(`${KOTLIN}/Console.kt`));
const CONSOLE_ECRAN = sansCommentaires(lire(`${KOTLIN}/ConsoleEcran.kt`));

/** Une `const val` Kotlin : rend la chaîne, ou le nombre (les `_` de lisibilité retirés). */
function constKotlin(code: string, nom: string): string | undefined {
  const m = new RegExp(`const val ${nom}\\b[^=]*=\\s*(?:"([^"]*)"|([\\d_]+))`).exec(code);
  if (!m) return undefined;
  return m[1] !== undefined ? m[1] : m[2].replace(/_/g, '');
}

/**
 * Les branches d'un `when` sur `PorteeSupport`, dans l'ordre du fichier.
 * `bloc` est le nom de la propriété d'extension qui le porte.
 */
function brancheesPortee(code: string, bloc: string): Array<[string, string]> {
  const debut = code.indexOf(`val PorteeSupport.${bloc}`);
  if (debut < 0) return [];
  const fin = code.indexOf('\n    }', debut);
  const corps = code.slice(debut, fin < 0 ? undefined : fin);
  return [...corps.matchAll(/PorteeSupport\.(\w+)\s*->\s*"([^"]*)"/g)]
    .map((m) => [m[1], m[2]] as [string, string]);
}

describe('les miroirs natifs regardent vraiment quelque chose', () => {
  /*
   * Le garde-fou que ce dépôt met partout : un extracteur qui ne trouve plus rien
   * passerait au vert sans avoir rien gardé. C'est exactement par là que la porte
   * d'atteignabilité du port React Native est devenue aveugle.
   */
  it('les trois fichiers Kotlin existent et livrent leurs valeurs', () => {
    expect(COMMUN.length, 'Commun.kt introuvable ou vide').toBeGreaterThan(500);
    expect(constKotlin(COMMUN, 'PACK_PRIX_PRATIQUE'), 'aucune constante extraite').toBeDefined();
    expect(constKotlin(CONSOLE, 'ECRANS_CONSOLE'), 'aucun compte extrait').toBeDefined();
    expect(brancheesPortee(CONSOLE, 'libelle')).toHaveLength(5);
    expect(brancheesPortee(CONSOLE_ECRAN, 'cheminDeBureau')).toHaveLength(5);
  });
});

describe('la grille de l’offre Présence Digitale ne diverge pas entre le web et Android', () => {
  const presence = findPack('presence');

  it('le pack d’entrée est bien celui dont Android porte les montants', () => {
    /*
     * ⛔ LE KIT NATIF MÉLANGE LE NOM DE L'UN ET LE PRIX DE L'AUTRE. Il dessine
     * « Pack Visible » à 250 000 barré 295 000 ; ces deux montants sont ceux de
     * `presence`, et `visible` se facture 495 000 sans promotion. Cette porte fixe
     * quel pack Android affiche, pour que la confusion ne puisse pas revenir.
     */
    expect(constKotlin(COMMUN, 'PACK_CLE')).toBe('presence');
    expect(presence, 'le pack « presence » a disparu de la grille').toBeDefined();
    expect(findPack('visible')?.price).not.toBe(presence?.promoPrice);
  });

  it('les deux montants du pack sont les mêmes des deux côtés', () => {
    expect(Number(constKotlin(COMMUN, 'PACK_PRIX_LISTE'))).toBe(presence!.price);
    expect(Number(constKotlin(COMMUN, 'PACK_PRIX_PRATIQUE'))).toBe(presence!.promoPrice);
    /* Et c'est bien le prix PRATIQUÉ qu'Android affiche : le web a déjà payé la
       confusion des deux — la page annonçait 250 000, le devis 295 000. */
    expect(Number(constKotlin(COMMUN, 'PACK_PRIX_PRATIQUE'))).toBe(packEffectivePrice(presence!));
  });

  it('le nom du pack est celui des libellés publics', () => {
    const nom = (presenceFr as { packs: { presence: { name: string } } }).packs.presence.name;
    expect(constKotlin(COMMUN, 'PACK_NOM')).toBe(nom);
  });

  it('la durée de support incluse est la même des deux côtés', () => {
    expect(Number(constKotlin(COMMUN, 'PACK_SUPPORT_JOURS'))).toBe(presence!.supportDays);
  });

  it('l’acompte et la validité du devis sont les mêmes des deux côtés', () => {
    expect(Number(constKotlin(COMMUN, 'ACOMPTE_PCT'))).toBe(Math.round(DEPOSIT_RATE * 100));
    expect(Number(constKotlin(COMMUN, 'VALIDITE_JOURS'))).toBe(QUOTE_VALIDITY_DAYS);
  });

  it('la date de révision de la grille est la même des deux côtés', () => {
    /*
     * ⚠️ LUE EN UTC, comme la grille l'écrit. `CATALOGUE_REVISED_AT` est posée à MIDI
     * UTC précisément pour qu'aucun fuseau ne la déplace d'un jour ; la lire en heure
     * locale ici referait la faute que ce choix corrige.
     */
    const d = CATALOGUE_REVISED_AT;
    const attendue = [
      String(d.getUTCDate()).padStart(2, '0'),
      String(d.getUTCMonth() + 1).padStart(2, '0'),
      d.getUTCFullYear(),
    ].join('/');
    expect(constKotlin(COMMUN, 'REVISE_LE')).toBe(attendue);
  });

  it('la taxe est celle du régime « agence », et Android sait la calculer', () => {
    const regime = regimeDe('agence');
    expect(regime.etat, 'la prestation d’agence n’est plus taxable').toBe('taxable');
    expect(Number(constKotlin(COMMUN, 'TVA_TAUX_PCT'))).toBe(Math.round(TVA_TAUX_NORMAL * 100));

    /*
     * ⛔ ET VOICI POURQUOI ANDROID NE REND PAS LE PRIX BARRÉ DU KIT : depuis que
     * l'article 5.1 des CGV est passé hors taxes, le TTC du prix pratiqué tombe
     * EXACTEMENT sur le prix de liste. « 250 000 barré 295 000 » se lit donc aussi
     * bien comme une remise que comme une ventilation de taxe. Si cette égalité
     * cesse un jour, ce test le dira, et l'écart de rendu pourra être rediscuté.
     */
    const ttc = ventilerDepuisHT(presence!.promoPrice!, regime).ttc;
    expect(ttc, 'l’ambiguïté du prix barré a disparu — relire l’écart documenté dans Presence.kt')
      .toBe(presence!.price);
  });

  it('la forme d’une référence de devis est la même des deux côtés', () => {
    const forme = /val FORME_REFERENCE:\s*Regex\s*=\s*Regex\("([^"]*)"\)/.exec(COMMUN)?.[1];
    expect(forme, 'FORME_REFERENCE a disparu du Kotlin').toBeDefined();
    /* ⚠️ Kotlin échappe la classe de caractères comme JavaScript ici : la même
       expression doit accepter et refuser les mêmes chaînes. On la rejoue sur des
       références réelles plutôt que de comparer deux littéraux. */
    const kotlin = new RegExp(forme!);
    for (let i = 0; i < 5; i += 1) {
      const ref = generateQuoteRef();
      expect(isValidQuoteRef(ref)).toBe(true);
      expect(kotlin.test(ref), `Android refuse une référence valide : ${ref}`).toBe(true);
    }
    for (const faux of ['MM-D-4831', 'DV-0123', 'dv-0123456789ab', '']) {
      expect(isValidQuoteRef(faux)).toBe(false);
      expect(kotlin.test(faux), `Android accepte une référence invalide : ${faux}`).toBe(false);
    }
  });

  it('le chemin public d’un devis est celui que le routeur sert', () => {
    /*
     * ⛔ LE KIT ÉCRIT `maxmorrys.me/devis/MM-D-4831` : ni ce chemin ni cette forme
     * n'existent. Un lien mort imprimé sur un document commercial ne se voit qu'au
     * moment où quelqu'un le suit.
     */
    const app = lire('src/App.tsx');
    const chemin = constKotlin(COMMUN, 'CHEMIN_DEVIS');
    expect(chemin, 'CHEMIN_DEVIS a disparu du Kotlin').toBeDefined();
    expect(app).toContain(`path: '${chemin!.replace(/^\//, '')}:ref'`);
    expect(app).toContain(`path: '${constKotlin(COMMUN, 'CHEMIN_OFFRE')!.replace(/^\//, '')}'`);
  });

  it('le numéro WhatsApp est celui de la marque', () => {
    expect(constKotlin(COMMUN, 'WHATSAPP_NUMERO')).toBe(contact.phoneRaw);
  });

  it('la grille nomme son miroir Android', () => {
    /* Une liste de miroirs qui ne se tient pas à jour est exactement ce qui a produit
       l'écart de prix du Club : le miroir doit être NOMMÉ là où on va chercher. */
    expect(lire('src/lib/presence/offer.ts'), 'offer.ts ne mentionne pas le miroir Android')
      .toContain('ecrans/media/Commun.kt');
  });

  it('la grille garde bien trois packs distincts', () => {
    /* Le garde-fou de l'extracteur : si la grille se réduisait à un seul pack, les
       comparaisons ci-dessus deviendraient vraies sans rien prouver. */
    expect(new Set(PACKS.map((p) => p.key)).size).toBe(3);
  });
});

describe('la portée du rôle support ne diverge pas entre le web et Android', () => {
  it('le compte d’écrans de la console est compté, pas écrit', () => {
    /*
     * ⛔ IL A DÉJÀ DÉRIVÉ. Le kit natif écrit « 5 écrans sur 19 » et « les quatorze
     * autres ». La table en compte davantage, et ces deux nombres sont donc faux
     * dans la maquette. Ici, le total vient de la table et le reste s'en déduit.
     */
    expect(Number(constKotlin(CONSOLE, 'ECRANS_CONSOLE'))).toBe(ADMIN_SCREEN_COUNT);
    expect(ADMIN_SCREEN_COUNT).toBeGreaterThan(SUPPORT_SCOPE.length);
  });

  it('les cinq portées portent les mêmes libellés, dans le même ordre', () => {
    const kotlin = brancheesPortee(CONSOLE, 'libelle').map(([, libelle]) => libelle);
    expect(kotlin).toEqual(SUPPORT_SCOPE.map((s) => s.label));
  });

  it('les cinq portées ouvrent les mêmes écrans de bureau', () => {
    const kotlin = brancheesPortee(CONSOLE_ECRAN, 'cheminDeBureau').map(([, chemin]) => chemin);
    expect(kotlin).toEqual(SUPPORT_SCOPE.map((s) => s.to));
  });

  it('les deux tables Kotlin parlent des mêmes portées, dans le même ordre', () => {
    /* Les libellés et les chemins sont deux `when` distincts : rien d'autre que ceci
       ne garantit qu'ils désignent la même portée à la même place. */
    expect(brancheesPortee(CONSOLE_ECRAN, 'cheminDeBureau').map(([cle]) => cle))
      .toEqual(brancheesPortee(CONSOLE, 'libelle').map(([cle]) => cle));
  });

  it('les deux sources web nomment leur miroir Android', () => {
    expect(lire('src/lib/adminAccess.ts'), 'adminAccess.ts ne mentionne pas le miroir Android')
      .toContain('ecrans/media/ConsoleEcran.kt');
    expect(lire('src/lib/admin/consoleNav.ts'), 'consoleNav.ts ne mentionne pas le miroir Android')
      .toContain('ecrans/media/Console.kt');
  });
});
