import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * CHAQUE PAGE MÈRE OFFRE UNE SORTIE, ET UNE SEULE.
 *
 * Relevé le 18/09/2026 : `/conception`, `/conception/projets-sur-mesure` et
 * `/conception/realisations` ne portaient **aucun** lien vers `/contact`. Zéro occurrence.
 * La page mère de la piste la plus chère du catalogue se terminait sur `MyOnomaBridge`,
 * c'est-à-dire sur un lien SORTANT du site.
 *
 * Pendant ce temps `/apprendre` et la fiche de réalisation en avaient chacune une, écrite à
 * la main, avec deux dessins et deux tons différents.
 *
 * ── POURQUOI CE TEST PLUTÔT QU'UNE RELECTURE ──────────────────────────────────────────────
 * C'est un défaut d'ABSENCE. Rien ne casse, aucune page ne rougit, aucun lien ne pointe dans
 * le vide : il n'y a simplement pas de porte. Aucun outil du dépôt ne peut voir ce qui n'est
 * pas là — c'est la classe de défaut la moins chère à introduire et la plus chère à repérer.
 * La seule barrière possible est une liste DÉCLARÉE de pages qui doivent en avoir une.
 *
 * ⚠️ `/conception/projets-sur-mesure` est nommément EXCLUE : la page EST le formulaire de
 * prise de contact. Un bandeau de sortie y mettrait deux demandes concurrentes à trois cents
 * pixels l'une de l'autre.
 */

/** Les pages qui doivent proposer une sortie — et celles qui ne doivent pas. */
const AVEC_SORTIE = [
  'src/pages/conception/Conception.tsx',
  'src/pages/conception/Realisations.tsx',
  'src/pages/conception/RealisationDetail.tsx',
  'src/pages/Apprendre.tsx',
];

const SANS_SORTIE = [
  // Elle porte le formulaire lui-même.
  'src/pages/conception/ProjetsSurMesure.tsx',
];

const lire = (p: string) => readFileSync(p, 'utf8');

describe('les pages mères ont une porte de sortie', () => {
  it.each(AVEC_SORTIE)('%s monte le bandeau partagé', (fichier) => {
    expect(lire(fichier)).toMatch(/<SiteExit/);
  });

  it.each(SANS_SORTIE)('%s n’en monte pas, et c’est voulu', (fichier) => {
    expect(lire(fichier)).not.toMatch(/<SiteExit/);
  });

  it('la sortie est un composant partagé, pas un dessin par page', () => {
    /*
     * Le ton vit DANS le composant : c'était exactement là que la divergence naissait —
     * `primary` sur une fiche, `quiet` sur `/apprendre`, pour la même action au même endroit.
     */
    const source = lire('src/components/site/SiteExit.tsx');
    expect(source).toMatch(/tone="primary"/);
  });
});
