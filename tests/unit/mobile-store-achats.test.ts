import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'APPLICATION NATIVE NE VEND RIEN — et ce test tient la décision.
 *
 * App Store 3.1.1 et Play Payments imposent l'achat intégré pour tout contenu
 * numérique consommé dans une application. Le port vendait pourtant : un mur de
 * paiement avec prix et bouton, un tunnel de quatre écrans, un abonnement au Club
 * affiché à 1 658 F/mois sous un bouton « Ouvrir sur maxmorrys.me ».
 *
 * Le repli a été choisi : **consultation seule.** L'application ouvre ce qui est déjà
 * acquis et ne propose rien à l'achat. C'est ce que ce fichier verrouille.
 *
 * ── CE QUE CE TEST REGARDE, ET POURQUOI CE N'EST PAS QUE LES BOUTONS ───────────
 * UNE REVUE LIT LES CHAÎNES. Retirer le bouton en laissant « L'App Store exige son
 * propre système de paiement » dans le texte ne retire rien du tout : la phrase
 * décrit la règle qu'on contournait, et elle suffit à orienter un relecteur vers ce
 * qu'il doit chercher. Les deux écrans concernés — la fiche de formation et le Club —
 * nommaient tous les deux le magasin.
 *
 * Les COMMENTAIRES sont donc retirés avant l'examen : ils n'atteignent pas le paquet,
 * et ils portent précisément l'explication de ce qui a été enlevé. Un test qui les
 * lirait interdirait de documenter le retrait.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const MOBILE = join(RACINE, 'mobile');

function fichiers(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...fichiers(p));
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/**
 * Le code SERVI : commentaires de bloc, de ligne, et JSX retirés.
 *
 * L'ordre compte. Un `{/* … *\/}` est un commentaire de bloc entouré d'accolades ;
 * retirer les blocs d'abord laisse `{}`, ce qui est du JSX valide et inoffensif.
 */
function servi(fichier: string): string {
  return readFileSync(fichier, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const rel = (p: string) => relative(RACINE, p);

/**
 * Présence Digitale est une PRESTATION DU MONDE RÉEL — quelqu'un construit un site pour
 * un commerce. App Store 3.1.5(a) et Play EXIGENT qu'elle soit transactée hors du
 * magasin : l'achat intégré y est interdit, pas obligatoire. Ses prix restent donc, et
 * cette liste est nommée pour que l'y ajouter soit un geste délibéré.
 */
const PRESTATION_REELLE = ['mobile/app/presence.tsx', 'mobile/app/devis.tsx'];

describe("l'application native ne vend rien", () => {
  it('le tunnel de paiement a été retiré', () => {
    for (const ecran of ['paiement', 'attente', 'succes', 'echec']) {
      expect(existsSync(join(MOBILE, `app/${ecran}.tsx`)), `app/${ecran}.tsx existe encore`)
        .toBe(false);
    }
  });

  it('aucun écran ne nomme un magasin dans son texte', () => {
    // Citer la règle qu'on contournait est un signal aussi net qu'un lien d'achat.
    const fautes = fichiers(join(MOBILE, 'app'))
      .filter((f) => /App Store|Google Play|Play Store|achat intégré/i.test(servi(f)))
      .map(rel);
    expect(fautes).toEqual([]);
  });

  it("aucun écran n'invite à acheter, hors prestation du monde réel", () => {
    const fautes = fichiers(join(MOBILE, 'app'))
      .filter((f) => !PRESTATION_REELLE.includes(rel(f)))
      .filter((f) => /\b(payer|paies|acheter|s'abonner|souscrire|Wave|Orange Money)\b/i.test(servi(f)))
      .map(rel);
    expect(fautes).toEqual([]);
  });

  it('aucun écran ne renvoie vers une page de vente', () => {
    const fautes = fichiers(join(MOBILE, 'app'))
      .filter((f) => /openAuthSessionAsync|openBrowserAsync/.test(servi(f)))
      .filter((f) => /\/checkout|\/formations\/|maxmorrys\.me\/club|\/panier|\/abonnement/.test(servi(f)))
      .map(rel);
    expect(fautes).toEqual([]);
  });

  it('le contenu de démonstration ne porte plus de prix de contenu numérique', () => {
    /*
     * Un montant laissé dans le module réapparaît tôt ou tard à l'écran — c'est ce que
     * fait un contenu de démonstration, il remplit les trous. `KIT_PACK` est l'exception
     * assumée : Présence Digitale, prestation du monde réel.
     */
    const demo = servi(join(MOBILE, 'contenu/demo.ts'));
    const blocs = ['KIT_FORMATION', 'KIT_FORMATION_2', 'KIT_CLUB', 'KIT_PARRAINAGE'];
    for (const bloc of blocs) {
      const debut = demo.indexOf(`const ${bloc} = {`);
      if (debut === -1) continue;
      const fin = demo.indexOf('} as const;', debut);
      expect(demo.slice(debut, fin), `${bloc} porte encore un prix`)
        .not.toMatch(/prix|echelonnement|remiseFilleul/);
    }
  });
});
