/**
 * LE TUTOIEMENT EST UN NON-NÉGOCIABLE DE MARQUE, PAS UNE PRÉFÉRENCE DE TON.
 *
 * Le kit l'écrit en tête de ses cinq règles inviolables : « Copy is written in the first
 * person singular and always uses tutoiement — « Je te forme », « Tu paies en Wave ». Never
 * vouvoiement. » Le système de voix est un actif produit : toute la navigation publique est
 * bâtie autour de « Je te… », et une page qui bascule au « vous » ne casse pas un style, elle
 * fait parler quelqu'un d'autre.
 *
 * POURQUOI CE CONTRÔLE EXISTE. Quatre-vingt-onze chaînes de vouvoiement vivaient dans les
 * quatorze catalogues au moment de l'écrire, dont vingt-trois sur la seule page agence, qui
 * disait « Nous ne sommes ni une agence web… » là où le kit écrit « je te le dis en une
 * conversation ». Aucune porte ne les voyait : elles compilent, elles se traduisent, elles
 * passent le typecheck et le lint. Elles ne se voient qu'à la lecture, écran par écran — donc
 * jamais en revue, et jamais toutes ensemble.
 *
 * LES DOCUMENTS CONTRACTUELS NE SONT PAS UNE EXCEPTION. La tentation était de laisser les CGV
 * au registre juridique ; le kit tranche l'inverse dans sa propre maquette de CGV : « Tu
 * disposes de quatorze jours pour renoncer à une formation. » Ce test couvre donc `legal.json`
 * comme les autres.
 *
 * CE QU'IL NE CHERCHE PAS. Le possessif de la deuxième personne du PLURIEL est légitime quand
 * il désigne deux parties — « vos échanges » entre la personne et son répétiteur en est le
 * seul cas du dépôt. Et « rendez-vous » est un nom commun. Les deux sont exemptés nommément :
 * une règle qui crie au loup finit ignorée, ce qui coûte plus cher que de ne pas l'avoir.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const FR = 'src/i18n/locales/fr';

/** Le vouvoiement : pronom et possessifs de politesse. */
const VOUVOIEMENT = /\b(vous|votre|vos)\b/i;

/**
 * Les exemptions, nommées une par une — jamais une famille.
 *
 * `rendez-vous` est un nom commun. `vos échanges` désigne les deux interlocuteurs d'une
 * conversation, pas une personne vouvoyée : c'est un pluriel réel.
 */
const EXEMPT = /rendez-vous|vos échanges/gi;

type Trouvaille = { fichier: string; chemin: string; valeur: string };

function parcourir(o: unknown, chemin: string, fichier: string, out: Trouvaille[]) {
  if (typeof o === 'string') {
    if (VOUVOIEMENT.test(o.replace(EXEMPT, ''))) out.push({ fichier, chemin, valeur: o });
  } else if (Array.isArray(o)) {
    o.forEach((v, i) => parcourir(v, `${chemin}[${i}]`, fichier, out));
  } else if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) parcourir(v, chemin ? `${chemin}.${k}` : k, fichier, out);
  }
}

describe('voix de marque — tutoiement', () => {
  it('aucun catalogue français ne vouvoie', () => {
    const trouvailles: Trouvaille[] = [];
    for (const f of readdirSync(FR).filter((n) => n.endsWith('.json'))) {
      parcourir(JSON.parse(readFileSync(join(FR, f), 'utf8')), '', f, trouvailles);
    }
    const rapport = trouvailles.map((t) => `  ${t.fichier} → ${t.chemin}\n    « ${t.valeur} »`).join('\n');
    expect(trouvailles, `Vouvoiement dans ${trouvailles.length} chaîne(s) :\n${rapport}`).toEqual([]);
  });
});
