import { describe, expect, it } from 'vitest';

import { clientProjects } from '../../../../src/lib/brand/clients';
import { getRealisationMeta, REALISATIONS } from '../src/prerender/realisations';
import { resolveRoute } from '../src/routes';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA COPIE DES PROJETS CLIENTS NE DOIT PAS DÉRIVER DE SA SOURCE.
 *
 * `src/lib/brand/clients.ts` est la source ; le Worker ne peut pas l'importer en
 * production — pas de bundler d'application au bord — donc `prerender/realisations.ts`
 * la recopie. C'est le même arrangement que `prerender/segments.ts`, et c'est le même
 * risque : une copie à moitié à jour ne produit AUCUNE erreur. Elle produit une fiche
 * servie aux moteurs avec une pile qui n'est plus celle du projet, ou un projet retiré
 * de la source qui continue d'être indexé.
 *
 * Ici, la comparaison peut être directe : les tests sont bundlés par esbuild, et
 * `clients.ts` n'a aucune dépendance. Ce qui n'est pas possible en production l'est à
 * la vérification — c'est exactement ce qu'on veut d'une barrière.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
describe('miroir de src/lib/brand/clients.ts', () => {
  it('porte exactement les mêmes projets, dans le même ordre', () => {
    expect(REALISATIONS.map((r) => r.slug)).toEqual(clientProjects.map((p) => p.slug));
  });

  it.each(clientProjects.map((p) => [p.slug, p] as const))(
    '%s : nom, secteur, domaine, rôle et pile sont ceux de la source',
    (slug, source) => {
      const copie = REALISATIONS.find((r) => r.slug === slug);
      expect(copie, `${slug} absent de la copie du Worker`).toBeDefined();
      expect(copie!.name).toBe(source.name);
      expect(copie!.category).toBe(source.category);
      expect(copie!.domain).toBe(source.domain);
      expect(copie!.capabilities ?? []).toEqual(source.capabilities ?? []);
      expect(copie!.stack ?? []).toEqual(source.stack ?? []);
    },
  );

  it('ne recopie NI durée NI résultat, même le jour où la source en portera', () => {
    /*
     * L'accord de publication couvre le nom, le rôle, la pile et le lien — et exclut
     * « aucun résultat, aucun chiffre de croissance ». Le jour où `duration` et `outcome`
     * seront renseignées dans la source, les faire apparaître ici demandera une décision
     * explicite, pas un copier-coller. Ce test est ce qui force la décision.
     */
    for (const projet of REALISATIONS) {
      expect(Object.keys(projet).sort()).toEqual(
        Object.keys(projet)
          .filter((k) => k !== 'duration' && k !== 'outcome')
          .sort(),
      );
    }
  });
});

describe('méta d’une fiche de réalisation', () => {
  it('décrit le projet sans rien affirmer que la source n établisse', () => {
    const meta = getRealisationMeta('loma', 'fr');
    expect(meta).not.toBeNull();
    expect(meta!.title).toBe('Loma — E-commerce | Max-Morrys');
    expect(meta!.h1).toBe('Loma');
    expect(meta!.canonical).toBe('https://maxmorrys.me/conception/realisations/loma');
    expect(meta!.altEn).toBe('https://maxmorrys.me/en/design/work/loma');
    // Le rôle est nommé ; le produit reste au client.
    expect(meta!.bodyText).toContain('développement et règles de sécurité');
    expect(meta!.bodyText).toContain('Le produit appartient à son client');
    // Et la limite de l'accord est ÉCRITE, pas seulement respectée.
    expect(meta!.bodyText).toContain('Aucun résultat commercial');
  });

  it('n AFFIRME jamais un résultat, une durée ou un chiffre', () => {
    /*
     * ⚠️ La formulation de ce test a dû être reprise, et l'erreur valait d'être notée : la
     * première version interdisait la CHAÎNE « chiffre de croissance », et échouait donc
     * sur la phrase qui dit précisément qu'il n'y en a pas. Une barrière qui ne distingue
     * pas une affirmation de sa négation interdit d'écrire la vérité.
     *
     * On cherche donc des FORMES d'affirmation : un pourcentage, un multiplicateur, une
     * durée chiffrée, un « résultat mesuré » annoncé.
     */
    const affirmations = /\d+\s?%|×\s?\d|x\d+\b|en \d+\s?(jours|semaines|mois)|résultat mesur/i;
    for (const projet of REALISATIONS) {
      const meta = getRealisationMeta(projet.slug, 'fr')!;
      for (const texte of [meta.title, meta.description, meta.bodyText ?? '']) {
        expect(affirmations.test(texte), `${projet.slug} : « ${texte} »`).toBe(false);
      }
    }
  });

  it('ÉCRIT la limite de l accord, au lieu de seulement la respecter', () => {
    // Une fiche muette sur ce qu'elle tait laisse croire qu'il n'y avait rien à dire.
    for (const projet of REALISATIONS) {
      const { bodyText } = getRealisationMeta(projet.slug, 'fr')!;
      expect(bodyText, projet.slug).toContain('Aucun résultat commercial');
      expect(bodyText, projet.slug).toContain("l'accord ne les couvre pas");
    }
  });

  it('tient la description sous ce que Google affiche', () => {
    for (const projet of REALISATIONS) {
      const { description } = getRealisationMeta(projet.slug, 'fr')!;
      expect(description.length, `${projet.slug} : ${description.length} caractères`).toBeLessThan(
        200,
      );
      // Et deux fiches ne partagent pas la même description : ce serait du doublon interne.
      expect(description).toContain(projet.name);
    }
  });

  it('donne un titre distinct à chaque fiche', () => {
    const titres = REALISATIONS.map((p) => getRealisationMeta(p.slug, 'fr')!.title);
    expect(new Set(titres).size).toBe(titres.length);
  });

  it('laisse un slug inconnu retomber en noindex plutôt qu en page du site', () => {
    // `null` → `unknownRouteMeta` → `noindex, nofollow`. Une adresse inventée ne doit pas
    // devenir une page indexable portant le titre de l'accueil.
    expect(getRealisationMeta('un-projet-qui-n-existe-pas', 'fr')).toBeNull();
  });

  it('chaque fiche est bien routée vers le pré-rendu, dans les deux langues', () => {
    for (const projet of REALISATIONS) {
      expect(resolveRoute(`/conception/realisations/${projet.slug}`), projet.slug).toBe(
        'prerender',
      );
      expect(resolveRoute(`/en/design/work/${projet.slug}`), projet.slug).toBe('prerender');
    }
  });
});
