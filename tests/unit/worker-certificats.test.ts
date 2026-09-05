import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUI EST ÉCRIT ET CE QUI EST LU DOIVENT PORTER LE MÊME NOM.
 *
 * Ce fichier existe à cause d'un défaut mesuré le 05/09/2026, et il vaut d'être
 * raconté parce que sa forme se reproduira ailleurs.
 *
 * `issueCertificate` écrivait `certificateCode`. `appCertificats` lisait `code`.
 * Rien n'échouait : aucune exception, aucun avertissement, aucun test rouge. Le
 * filtre `complets` — qui exige les quatre champs solidaires d'un document
 * opposable — ne retenait simplement JAMAIS une seule ligne. Tout utilisateur
 * ayant obtenu un certificat voyait un écran vide, définitivement, et le compteur
 * `incomplets` accusait la base de données d'un défaut qui était dans la lecture.
 *
 * Et le même port avait perdu le SECOND document. La Cloud Function supprimée en
 * `e3a2775` écrivait `certificates/{id}` ET son miroir public
 * `certificate_lookups/{code}`. Le miroir n'a pas été porté. Or c'est LUI que lit
 * la vérification publique — `worker/apps/site/src/prerender/certificat.ts` et
 * `src/lib/firestore/certificates.ts`. Conséquence : tout certificat émis depuis
 * le retrait des Cloud Functions était INVÉRIFIABLE sur `/verifier`, c'est-à-dire
 * exactement là où le produit engage sa parole.
 *
 * Un certificat qui ne se vérifie pas n'est pas un certificat. D'où ces portes.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const lire = (p: string) => readFileSync(resolve(RACINE, p), 'utf8');

/** Retire blocs et lignes de commentaire : une porte ne doit pas lire sa propre notice. */
const sansCommentaires = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const EMISSION = 'worker/apps/api/src/handlers/issueCertificate.ts';
const VUE = 'worker/apps/api/src/handlers/app/certificats.ts';

describe('le certificat, de son émission à sa vérification', () => {
  it('émet le miroir public, sans lequel la vérification lit un document absent', () => {
    const source = lire(EMISSION);
    expect(
      source.includes('certificate_lookups/'),
      "`issueCertificate` n'écrit plus le miroir public : /verifier ne trouvera rien",
    ).toBe(true);

    /* Le miroir est PUBLIC. Ces quatre champs sont ceux qu'un certificat affiche
       déjà ; tout ajout ici est une donnée personnelle publiée sans le vouloir. */
    for (const champ of ['certificateCode', 'formationTitle', 'issuedAt', 'holderName']) {
      expect(source.includes(champ), `le miroir public doit porter ${champ}`).toBe(true);
    }
    expect(
      /certificate_lookups[^}]*email/is.test(source),
      "aucune adresse e-mail dans un miroir PUBLIC",
    ).toBe(false);
  });

  it('écrit tous les champs que la vue native exige, sous le même nom', () => {
    const emission = lire(EMISSION);
    /* On examine le CODE SERVI, commentaires retirés — comme `mobile-store-achats`.
       Sans ça, la phrase qui documente le défaut déclenche la porte qui le garde. */
    const vue = sansCommentaires(lire(VUE));

    /* La vue compose un document OPPOSABLE : titulaire, formation, date, code —
       renvoyés ensemble ou pas du tout. Chacun doit donc être écrit à l'émission. */
    const solidaires = ['certificateCode', 'formationTitle', 'issuedAt', 'userName'];
    const manquants = solidaires.filter((champ) => !emission.includes(champ));
    expect(
      manquants,
      `champs lus par la vue mais jamais écrits : ${manquants.join(', ')}`,
    ).toEqual([]);

    /* La porte qui aurait attrapé le défaut d'origine : la vue ne doit plus lire
       `data.code`, qui n'a jamais existé en base. */
    expect(
      /data\.code\b/.test(vue.replace(/data\.certificateCode/g, '')),
      "la vue lit `data.code` : le champ écrit s'appelle `certificateCode`",
    ).toBe(false);
  });

  it('le nom du titulaire ne retombe jamais sur une adresse e-mail', () => {
    /* Le miroir est public. La fonction supprimée le disait déjà : « retombe sur une
       chaîne vide plutôt que sur l'e-mail ». Le port doit tenir la même ligne. */
    const source = lire(EMISSION);
    const bloc = source.slice(source.indexOf('async function resolveHolderName'));
    expect(/\bemail\b/i.test(bloc), 'le nom public ne doit pas dériver de l\'e-mail').toBe(false);
  });
});
