import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UN CODE DE CERTIFICAT, TROIS ÉCRITURES — et le verdict faux qu'elles produisaient.
 *
 * ⛔ CE DÉFAUT ÉTAIT EN PRODUCTION. Le serveur émet « MM- » suivi de DIX caractères
 * d'un seul tenant. Le kit dessine « MM-C7K4-9RTX-2081 » (trois groupes). Et le site
 * annonçait sous son champ : « Quatre groupes, séparés par des tirets, tels qu'ils
 * figurent sur le document. »
 *
 * Quelqu'un qui recopiait EXACTEMENT COMME INDIQUÉ ajoutait des tirets ; la recherche
 * ne trouvait rien ; il lisait « aucun certificat à ce code » sur un document
 * AUTHENTIQUE. C'est le pire mode d'échec possible pour une vérification : elle ne se
 * trompe pas de réponse, elle rend un verdict faux sur un document vrai.
 *
 * La porte tient les trois côtés ensemble : ce que le serveur ÉMET, ce que le site
 * ANNONCE, et ce que les deux normalisations ACCEPTENT.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const lire = (p: string) => readFileSync(resolve(RACINE, p), 'utf8');

/** La forme émise, extraite de la SOURCE — jamais recopiée ici. */
function formeEmise(): { prefixe: string; longueur: number } {
  const src = lire('worker/apps/api/src/handlers/issueCertificate.ts');
  const m = /`(\w+)-\$\{crypto\.randomUUID\(\)[\s\S]*?substring\(0,\s*(\d+)\)/.exec(src);
  expect(m, 'l’émission du code a changé de forme — cette porte doit être relue').not.toBeNull();
  return { prefixe: m![1], longueur: Number(m![2]) };
}

describe('le code de certificat s’écrit d’une seule façon', () => {
  it('la porte lit vraiment la source', () => {
    const f = formeEmise();
    expect(f.prefixe).toBe('MM');
    expect(f.longueur).toBeGreaterThan(4);
  });

  for (const langue of ['fr', 'en']) {
    it(`l’exemple affiché en ${langue} a la forme réellement émise`, () => {
      const { prefixe, longueur } = formeEmise();
      const d = JSON.parse(lire(`src/i18n/locales/${langue}/lms.json`));
      const exemple: string = d.verify.codePlaceholder;
      expect(
        exemple,
        `l’exemple montré à l’utilisateur doit ressembler à ce que le serveur émet : `
        + `${prefixe}- suivi de ${longueur} caractères`,
      ).toMatch(new RegExp(`^${prefixe}-[A-Z0-9]{${longueur}}$`));
    });

    it(`l’indication en ${langue} ne promet pas de groupes qui n’existent pas`, () => {
      const d = JSON.parse(lire(`src/i18n/locales/${langue}/lms.json`));
      const indication: string = d.verify.codeHint;
      /* ⛔ « quatre groupes séparés par des tirets » décrivait un format que rien
         n'émet. Une indication fausse est pire qu'une indication absente : elle est
         SUIVIE. */
      expect(indication.toLowerCase()).not.toMatch(/groupes?\s+(de|séparés|separated)|four groups|quatre groupes/);
    });
  }

  it('les deux normalisations tolèrent les tirets surnuméraires', () => {
    /*
     * Les deux chemins — la page web et le handler du Worker — doivent accepter le même
     * code écrit avec des tirets ajoutés. Ils sont écrits séparément (l'un en React,
     * l'autre dans le Worker) : rien d'autre que cette porte ne les tient d'accord.
     */
    for (const [chemin, fichier] of [
      ['la page web', 'src/pages/VerifyCertificate.tsx'],
      ['le handler du Worker', 'worker/apps/api/src/handlers/app/verifierCertificat.ts'],
    ]) {
      const src = lire(fichier);
      expect(src, `${chemin} ne retire que les espaces : un tiret ajouté par l’utilisateur `
        + 'ferait rendre « introuvable » sur un document authentique')
        .toMatch(/replace\(\/\[\^A-Z0-9\]\/g,\s*''\)/);
      expect(src, `${chemin} doit reposer le tiret du préfixe après nettoyage`)
        .toMatch(/startsWith\('MM'\)/);
    }
  });
});
