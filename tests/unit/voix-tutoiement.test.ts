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
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * LA PISTE CONCEPTION VOUVOIE, ET C'EST UNE DÉCISION, PAS UNE FUITE.  (CDC du 14/09/2026)
 *
 * Le cahier des charges de la refonte en deux pistes ne demande pas d'aplatir la voix vers le
 * corporate — il dit l'inverse, mot pour mot : « ce serait détruire ce qui fonctionne ». Il
 * constate autre chose : « un seul registre sert deux publics qui n'achètent pas la même
 * chose, à des prix séparés par un facteur vingt ». Le tutoiement reste la voix de Max-Morrys
 * pour l'audience qui l'a construite ; la piste Conception s'adresse à une direction qui
 * signe un lot technique, et elle vouvoie.
 *
 * D'où DEUX règles au lieu d'une, et surtout pas une exemption. Une exemption aurait laissé
 * ces deux catalogues sans aucune garde — c'est-à-dire libres de dériver vers le tutoiement à
 * la première recopie depuis une page voisine, qui est exactement le mode de dérive que ce
 * fichier documente en tête. La seconde règle est la symétrique de la première, et la recette
 * du CDC la réclame nommément : « la page Projets sur mesure ne contient aucun tutoiement ».
 * ─────────────────────────────────────────────────────────────────────────────────────────
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
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

/**
 * Les catalogues de la PISTE CONCEPTION — les deux seuls du dépôt qui vouvoient.
 *
 * `agency.json` n'en est PAS, et c'est délibéré : ses chaînes sont rendues par les composants
 * de `src/components/agency/`, écrits au tutoiement et repris tels quels. Le jour où l'un
 * d'eux passe au vouvoiement, sa chaîne doit déménager dans un de ces deux fichiers — la
 * règle le dira.
 */
const PISTE_CONCEPTION = new Set(['conception.json', 'realisations.json']);

/**
 * Le tutoiement : pronom, possessifs, et l'élision qui porte les verbes de la marque
 * (« je t'informe », « ça t'aide »). `toi` compris — « chez toi » est la forme qui passait.
 */
const TUTOIEMENT = /\b(tu|te|toi|ton|ta|tes)\b|\bt'/i;

/**
 * Les exemptions du tutoiement, nommées une par une.
 *
 * `TPE` porte un `\bt` sans apostrophe, donc il ne déclenche rien — mais « ta » et « ton »
 * sont aussi des mots anglais et italiens, et un nom propre les contient parfois. Rien de tel
 * dans le dépôt à ce jour : la liste est vide, et elle est écrite pour que le prochain ajout
 * soit un ajout nommé, pas une famille.
 */
const EXEMPT_TU = /$^/;

describe('voix de marque — tutoiement', () => {
  it('aucun catalogue français ne vouvoie, hors piste Conception', () => {
    const trouvailles: Trouvaille[] = [];
    for (const f of readdirSync(FR).filter((n) => n.endsWith('.json') && !PISTE_CONCEPTION.has(n))) {
      parcourir(JSON.parse(readFileSync(join(FR, f), 'utf8')), '', f, trouvailles);
    }
    const rapport = trouvailles.map((t) => `  ${t.fichier} → ${t.chemin}\n    « ${t.valeur} »`).join('\n');
    expect(trouvailles, `Vouvoiement dans ${trouvailles.length} chaîne(s) :\n${rapport}`).toEqual([]);
  });

  it('la piste Conception ne tutoie jamais', () => {
    const trouvailles: Trouvaille[] = [];
    const chercher = (o: unknown, chemin: string, fichier: string) => {
      if (typeof o === 'string') {
        if (TUTOIEMENT.test(o.replace(EXEMPT_TU, ''))) trouvailles.push({ fichier, chemin, valeur: o });
      } else if (Array.isArray(o)) {
        o.forEach((v, i) => chercher(v, `${chemin}[${i}]`, fichier));
      } else if (o && typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) chercher(v, chemin ? `${chemin}.${k}` : k, fichier);
      }
    };

    for (const f of PISTE_CONCEPTION) {
      const chemin = join(FR, f);
      if (!existsSync(chemin)) continue;
      chercher(JSON.parse(readFileSync(chemin, 'utf8')), '', f);
    }
    const rapport = trouvailles.map((t) => `  ${t.fichier} → ${t.chemin}\n    « ${t.valeur} »`).join('\n');
    expect(trouvailles, `Tutoiement dans ${trouvailles.length} chaîne(s) de la piste Conception :\n${rapport}`).toEqual([]);
  });
});
