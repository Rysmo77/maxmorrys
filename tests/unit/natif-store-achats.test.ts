import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'APPLICATION NATIVE NE VEND RIEN — et cette porte tient la décision.
 *
 * App Store 3.1.1 et Play Payments imposent l'achat intégré pour tout contenu
 * numérique consommé dans une application. Le port React Native vendait pourtant :
 * un mur de paiement avec prix et bouton, un tunnel de quatre écrans, un abonnement
 * au Club affiché sous un bouton « Ouvrir sur maxmorrys.me ».
 *
 * Le repli a été choisi : **consultation seule**. L'application ouvre ce qui est
 * déjà acquis et ne propose rien à l'achat. C'est ce que ce fichier verrouille.
 *
 * ⚠️ ELLE EST EN CONTRADICTION AVEC LE KIT, QUI NOMME LE MAGASIN SUR QUATRE ÉCRANS.
 * Les deux positions sont défendables ; celle-ci est retenue parce que le tunnel de
 * paiement a DÉJÀ été supprimé quand l'application a cessé de vendre. La renverser
 * est un geste commercial délibéré, pas un ajustement — et cette porte est ce qui
 * l'oblige à être délibéré. Voir `deferred-work.md` § F.1.
 *
 * ── CE QU'ELLE REGARDE, ET POURQUOI CE N'EST PAS QUE LES BOUTONS ───────────────
 * UNE REVUE LIT LES CHAÎNES. Retirer le bouton en laissant « L'App Store exige son
 * propre système de paiement » dans le texte ne retire rien : la phrase décrit la
 * règle qu'on contournait, et elle suffit à orienter un relecteur vers ce qu'il doit
 * chercher.
 *
 * ⚠️ LES COMMENTAIRES SONT RETIRÉS AVANT L'EXAMEN. Ils n'atteignent pas le paquet,
 * et ils portent précisément l'explication de ce qui a été enlevé. Une porte qui les
 * lirait interdirait de documenter le retrait — c'est-à-dire punirait la seule trace
 * qui empêche quelqu'un de le rétablir par ignorance.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const ECRANS = 'android/app/src/main/java/me/maxmorrys/rysmo/ecrans';

/**
 * ⚠️ Retrait ligne à ligne, jamais par expression régulière : la méthode par regex a déjà
 * mangé le milieu d'une chaîne dans ce dépôt. Une ligne de commentaire Kotlin commence par
 * `//`, `/*` ou `*` une fois désindentée.
 */
function servi(chemin: string): string {
  return readFileSync(chemin, 'utf8')
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*'));
    })
    .join('\n');
}

function ecrans(): string[] {
  const base = join(RACINE, ECRANS);
  const out: string[] = [];
  const marcher = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) marcher(p);
      else if (e.name.endsWith('.kt')) out.push(p);
    }
  };
  marcher(base);
  return out;
}

const rel = (p: string) => p.slice(RACINE.length + 1);

/**
 * ⭐ PRÉSENCE DIGITALE EST UNE PRESTATION DU MONDE RÉEL — quelqu'un construit un site
 * pour un commerce. App Store 3.1.5(a) et Play EXIGENT qu'elle soit transactée HORS du
 * magasin : l'achat intégré y est interdit, pas obligatoire.
 *
 * Ses montants restent donc légitimes, et cette liste est NOMMÉE pour que l'y ajouter soit
 * un geste délibéré plutôt qu'une exception glissée pour faire passer un test.
 */
const PRESTATION_REELLE = [
  `${ECRANS}/media/Presence.kt`,
  `${ECRANS}/media/Devis.kt`,
];

describe('l’application native ne vend rien', () => {
  const fichiers = ecrans();

  it('la porte regarde vraiment quelque chose', () => {
    expect(fichiers.length, 'aucun écran trouvé — l’extracteur est cassé').toBeGreaterThan(30);
    expect(
      PRESTATION_REELLE.every((f) => fichiers.some((p) => rel(p) === f)),
      'un écran de prestation réelle a été renommé : l’exception ne désigne plus rien',
    ).toBe(true);
  });

  it('aucun écran de paiement n’existe', () => {
    const tunnel = fichiers.filter((f) => /\/(Paiement|Attente|Succes|Echec|MurPaiement)\.kt$/.test(f));
    expect(tunnel.map(rel), 'le tunnel de paiement a été supprimé avec la vente').toEqual([]);
  });

  it('aucun écran ne nomme un magasin dans son texte', () => {
    /* Citer la règle qu'on contournait est un signal aussi net qu'un lien d'achat —
       et sur Android, nommer l'App Store est en plus une confusion pure. */
    const fautes = fichiers
      .filter((f) => /App Store|Google Play|Play Store|achat intégré|in-app purchase/i.test(servi(f)))
      .map(rel);
    expect(fautes).toEqual([]);
  });

  it('aucun écran n’invite à acheter, hors prestation du monde réel', () => {
    const fautes = fichiers
      .filter((f) => !PRESTATION_REELLE.includes(rel(f)))
      .filter((f) => /\b(payer|paie|acheter|s'abonner|souscrire|Wave|Orange Money)\b/i.test(servi(f)))
      .map(rel);
    expect(fautes).toEqual([]);
  });

  it('aucun écran n’ouvre une page de vente', () => {
    /* Sortir vers le site est légitime — les textes légaux le font. Sortir vers un
       PANIER ne l'est pas : c'est le contournement que la règle 3.1.1 vise. */
    const fautes = fichiers
      .filter((f) => /\/checkout|\/panier|\/abonnement|maxmorrys\.me\/club/i.test(servi(f)))
      .map(rel);
    expect(fautes).toEqual([]);
  });
});
