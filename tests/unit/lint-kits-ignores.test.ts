import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TROIS RENOMMAGES, TROIS FOIS LE MÊME TROU.
 *
 * Les kits de design arrivent en `.js` portant du JSX, compilé dans le navigateur
 * par Babel standalone. Le parseur d'ESLint le refuse : chaque livraison rouvre
 * plusieurs dizaines de « Parsing error: Unexpected token < » sur des fichiers
 * qu'on n'a pas écrits et qu'on ne doit surtout pas modifier — le readme du kit
 * dit lui-même que les kits sont la source de vérité.
 *
 * ⛔ ET UNE SORTIE DE LINT À QUARANTE ERREURS PERMANENTES N'EST PLUS LUE. C'est le
 * mécanisme exact par lequel une VRAIE erreur passe inaperçue. Le danger n'est pas
 * le bruit : c'est ce que le bruit cache.
 *
 * Trois fois, une entrée d'ignore a été ajoutée en nommant le dossier du jour :
 *   · `handoff_natif` + `design_handoff_maxmorrys`  → absorbés
 *   · `Max-Morrys_DS_Platform`                      → remplacé
 *   · `DS_Final`                                    → 05/09/2026
 * Chaque fois, l'entrée précédente a cessé de désigner quoi que ce soit, et les
 * erreurs sont revenues à l'identique.
 *
 * Cette porte garde donc la FORME et non le nom : tout dossier de premier niveau
 * qui porte du JSX en `.js` doit être ignoré par ESLint. Le prochain kit se fera
 * refuser à l'entrée, quel que soit le nom qu'on lui donne.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');

/** Les dossiers que git suit, au premier niveau. */
function dossiersDeSurface(): string[] {
  return readdirSync(RACINE)
    .filter((e) => !e.startsWith('.') && e !== 'node_modules')
    .filter((e) => {
      try { return statSync(join(RACINE, e)).isDirectory(); } catch { return false; }
    });
}

/** Cherche un `.js` porteur de JSX, sans descendre inutilement. */
function porteDuJsxEnJs(dir: string, profondeur = 0): string | null {
  if (profondeur > 4) return null;
  let entrees: string[];
  try { entrees = readdirSync(dir); } catch { return null; }
  for (const e of entrees) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    let estDossier = false;
    try { estDossier = statSync(p).isDirectory(); } catch { continue; }
    if (estDossier) {
      const trouve = porteDuJsxEnJs(p, profondeur + 1);
      if (trouve) return trouve;
      continue;
    }
    if (!e.endsWith('.js')) continue;
    const code = readFileSync(p, 'utf8');
    /* Un retour de JSX : `return (<`, `=> <`, ou une balise majuscule ouverte en début
       d'expression. Assez précis pour ne pas prendre un `.js` ordinaire pour un kit. */
    if (/return\s*\(\s*</.test(code) || /=>\s*</.test(code) || /^\s*<[A-Z]/m.test(code)) {
      return p.slice(RACINE.length + 1);
    }
  }
  return null;
}

describe('les kits de design ne cassent pas la sortie de lint', () => {
  it('tout dossier portant du JSX en `.js` est ignoré par ESLint', () => {
    /*
     * ⚠️ LECTURE LIGNE À LIGNE, ET DEUX TENTATIVES RATÉES AVANT.
     *
     * 1. Extraire toutes les chaînes du bloc échoue : les commentaires de ce fichier sont
     *    en français et portent des apostrophes droites — « qu'on n'a pas écrits ». Elles
     *    s'apparient comme des guillemets et rendent des fragments de phrase.
     * 2. Retirer les commentaires d'abord échoue AUSSI, et plus méchamment : l'entrée
     *    `'worker/**' + '/node_modules'` contient la séquence d'ouverture et de fermeture
     *    d'un commentaire de bloc. Le retrait la mange au milieu de la chaîne et rend
     *    `'workernode_modules'` — une entrée qui a l'air valide et ne désigne rien.
     *
     * Une entrée d'ignore occupe sa propre ligne. C'est la seule lecture que ni les
     * apostrophes ni les astérisques ne peuvent tromper.
     */
    const lignes = readFileSync(resolve(RACINE, 'eslint.config.js'), 'utf8').split('\n');
    const debut = lignes.findIndex((l) => /ignores:\s*\[/.test(l));
    expect(debut, 'le tableau `ignores` est introuvable dans eslint.config.js').toBeGreaterThan(-1);
    const fin = lignes.findIndex((l, i) => i > debut && /^\s*\],?\s*$/.test(l));
    const ignores = lignes.slice(debut + 1, fin)
      .map((l) => /^\s*'([^']+)',?\s*$/.exec(l)?.[1])
      .filter((v): v is string => typeof v === 'string');

    const fautes: string[] = [];
    for (const d of dossiersDeSurface()) {
      const coupable = porteDuJsxEnJs(join(RACINE, d));
      if (coupable === null) continue;
      const couvert = ignores.some((i) => d === i || d.startsWith(`${i}/`));
      if (!couvert) fautes.push(`${d}/ (ex. ${coupable})`);
    }

    expect(
      fautes,
      'ces dossiers portent du JSX en .js et ne sont pas ignorés : ils rouvriront '
      + 'des dizaines d’erreurs de parsage, et une sortie de lint illisible cache les vraies',
    ).toEqual([]);
  });

  it('la porte regarde vraiment quelque chose', () => {
    /* Le garde-fou que ce dépôt met partout : un scanner qui ne trouve plus aucun
       dossier passerait au vert sans rien avoir gardé. */
    expect(dossiersDeSurface().length).toBeGreaterThan(5);
  });
});
