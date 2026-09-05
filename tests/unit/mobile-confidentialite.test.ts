import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE MANIFESTE DE CONFIDENTIALITÉ DISAIT QUE L'APPLICATION NE COLLECTE RIEN.
 *
 * `NSPrivacyCollectedDataTypes` valait `[]` — un tableau vide — alors que
 * l'application collecte une adresse e-mail, un nom, une progression pédagogique,
 * des notes personnelles, des publications au Club et des échanges avec un
 * répétiteur qui partent chez un tiers.
 *
 * Ce n'était pas un mensonge délibéré : c'est le champ qu'on remplit en dernier,
 * qu'aucun outil ne vérifie, et qu'Apple confronte au formulaire App Privacy
 * saisi ailleurs — dans App Store Connect, des semaines plus tard, par quelqu'un
 * qui n'a pas le code sous les yeux.
 *
 * D'où ces deux portes : le manifeste doit déclarer quelque chose, et chaque type
 * déclaré doit être JUSTIFIÉ dans l'inventaire versé au dépôt. Un formulaire
 * recopié sans sa dérivation se re-remplit de mémoire à chaque version.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const app = JSON.parse(readFileSync(resolve(RACINE, 'mobile/app.json'), 'utf8')).expo;
const inventaire = readFileSync(
  resolve(RACINE, 'mobile/store/confidentialite/inventaire-collecte.md'),
  'utf8',
);

interface TypeCollecte {
  NSPrivacyCollectedDataType: string;
  NSPrivacyCollectedDataTypeLinked: boolean;
  NSPrivacyCollectedDataTypeTracking: boolean;
  NSPrivacyCollectedDataTypePurposes: string[];
}

const declares: TypeCollecte[] = app.ios.privacyManifests.NSPrivacyCollectedDataTypes;

describe('le manifeste de confidentialité dit ce que l’application collecte', () => {
  it('il ne déclare pas une collecte vide', () => {
    /* Le cas d'origine, et le plus coûteux : un tableau vide passe toutes les portes
       techniques, se téléverse sans erreur, et se contredit au moment de la revue. */
    expect(
      declares.length,
      'NSPrivacyCollectedDataTypes est vide — or l’application collecte au moins un e-mail',
    ).toBeGreaterThan(0);
  });

  it('chaque type déclaré est justifié dans l’inventaire versé', () => {
    const orphelins = declares
      .map((d) => d.NSPrivacyCollectedDataType.replace('NSPrivacyCollectedDataType', ''))
      .filter((court) => !inventaire.includes(court));
    expect(
      orphelins,
      `types déclarés sans justification dans inventaire-collecte.md : ${orphelins.join(', ')}`,
    ).toEqual([]);
  });

  it('rien n’est déclaré comme du pistage, et le manifeste le dit deux fois', () => {
    /* `NSPrivacyTracking` et le drapeau par type doivent s'accorder : les déclarer
       différemment produit une contradiction qu'Apple lit, pas nous. */
    expect(app.ios.privacyManifests.NSPrivacyTracking).toBe(false);
    expect(app.ios.privacyManifests.NSPrivacyTrackingDomains).toEqual([]);
    expect(declares.filter((d) => d.NSPrivacyCollectedDataTypeTracking !== false)).toEqual([]);
  });

  it('chaque type porte au moins une finalité', () => {
    /* Une donnée collectée sans finalité déclarée est un rejet au téléversement — et la
       question « pourquoi la collectez-vous ? » n'a pas de bonne réponse improvisée. */
    const sansBut = declares
      .filter((d) => !Array.isArray(d.NSPrivacyCollectedDataTypePurposes) || d.NSPrivacyCollectedDataTypePurposes.length === 0)
      .map((d) => d.NSPrivacyCollectedDataType);
    expect(sansBut).toEqual([]);
  });

  it('l’inventaire nomme les deux décisions humaines qui restent ouvertes', () => {
    /*
     * Elles ne se règlent pas en code, et elles se perdent si personne ne les écrit :
     *  · le répétiteur envoie des messages à Google, qui n'est pas nommé dans la
     *    politique de confidentialité publiée — c'est ce qui rend « non partagé »
     *    défendable, ou pas ;
     *  · la mémoire du répétiteur est active PAR DÉFAUT, sans interrupteur natif, ce qui
     *    rend cette collecte obligatoire au sens de Google Play.
     */
    expect(inventaire).toContain('generativelanguage.googleapis.com');
    expect(inventaire).toContain('aiMemoryConsent');
  });
});
