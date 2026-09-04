import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import { faqSlug } from '../../src/lib/faq/slug';

/**
 * L'ADRESSE D'UNE QUESTION EST CALCULÉE DEUX FOIS, ET LES DEUX DOIVENT TOMBER JUSTE.
 *
 * Une question de la FAQ n'a pas d'adresse en base : les 46 documents n'ont pas de champ
 * `slug`, et `faqSlug()` la DÉRIVE du texte de la question. Ce calcul existe maintenant à deux
 * endroits, parce que le Worker Cloudflare ne peut pas importer le code de l'application :
 *
 *   · `src/lib/faq/slug.ts` + `src/lib/utils.ts` — ce que l'application ouvre ;
 *   · `worker/apps/site/src/prerender/faq.ts` — ce que le Worker pré-rend et déclare au
 *     sitemap.
 *
 * CE QUE COÛTERAIT LA DÉRIVE. Elle ne casserait rien de visible : le Worker publierait au
 * sitemap et pré-rendrait une adresse que l'application ne sait pas ouvrir. Un robot verrait
 * une page complète ; une personne qui clique le même lien depuis un résultat de recherche
 * tomberait sur la page « question introuvable ». Aucune erreur nulle part, et le défaut ne se
 * voit qu'en suivant un lien de recherche — c'est le profil exact du défaut que
 * `segments-sync.test.ts` a été écrit pour attraper, sur la table d'à côté.
 *
 * Le test compare les deux implémentations LITTÉRALEMENT : deux chaînes de `.replace()`
 * identiques calculent la même chose, et toute retouche d'un seul côté devient rouge.
 */

/** Extrait le corps de `slugify` d'un fichier, réduit à sa chaîne de transformations. */
function readSlugifyBody(path: string): string {
  const source = readFileSync(path, 'utf8');
  const match = source.match(/function slugify\(text: string\): string \{([\s\S]*?)\n\}/);
  if (!match) throw new Error(`Aucune fonction slugify dans ${path}`);
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('');
}

describe('le slug d’une question se calcule pareil des deux côtés', () => {
  it('les deux implémentations de slugify sont identiques', () => {
    const app = readSlugifyBody('src/lib/utils.ts');
    const worker = readSlugifyBody('worker/apps/site/src/prerender/faq.ts');
    expect(worker).toBe(app);
  });

  it('la priorité au slug renseigné est écrite des deux côtés', () => {
    // Sans elle, le Worker dériverait l'adresse du texte là où l'application la lit en base :
    // les questions dont l'adresse a été FIGÉE seraient justement celles qui divergent.
    const worker = readFileSync('worker/apps/site/src/prerender/faq.ts', 'utf8');
    expect(worker).toContain('const authored = item.slug?.trim();');
    expect(worker).toContain('return authored ? slugify(authored) : slugify(item.question);');
  });

  /*
   * Les cas ci-dessous sont pris dans les vraies questions de la collection `faq` : ils
   * couvrent l'apostrophe, les accents, la ponctuation ouvrante et les guillemets — c'est-à-dire
   * tout ce qui sépare deux implémentations de slugify qui « se ressemblent ».
   */
  const CAS: Array<[string, string]> = [
    ["C'est qui Max-Morrys ?", 'c-est-qui-max-morrys'],
    ["C'est quoi l'abonnement à 10 000 FCFA/an ?", 'c-est-quoi-l-abonnement-a-10-000-fcfa-an'],
    ['Est-ce que je peux payer en plusieurs fois ?', 'est-ce-que-je-peux-payer-en-plusieurs-fois'],
    ['"Accès à vie", ça veut dire quoi exactement ?', 'acces-a-vie-ca-veut-dire-quoi-exactement'],
    [
      "J'ai une connexion internet instable, je peux quand même suivre les cours ?",
      'j-ai-une-connexion-internet-instable-je-peux-quand-meme-suivre-les-cours',
    ],
  ];

  it.each(CAS)('« %s » donne la même adresse dans l’application', (question, expected) => {
    expect(faqSlug({ question, slug: undefined })).toBe(expected);
  });
});
