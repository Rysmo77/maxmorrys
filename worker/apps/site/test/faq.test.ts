import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import { faqSlug, getFaqQuestionMeta, getFaqSlugs, withFaqIndexJsonLd } from '../src/prerender/faq';
import type { PageMeta } from '../src/prerender/types';

/**
 * LES QUESTIONS DE LA FAQ PARTAIENT EN `noindex`.
 *
 * `/faq/**` était routé vers le pré-rendu, mais aucune branche ne produisait de méta : chaque
 * question retombait dans `unknownRouteMeta`, donc désindexée, sous le titre et la description
 * de la page d'accueil. Vérifié en production le 03/09/2026 sur `/faq/c-est-qui-max-morrys`.
 *
 * Ces tests tiennent les trois propriétés qui font vivre la fonctionnalité : l'adresse d'une
 * question est celle que l'application ouvre, sa page se décrit elle-même, et une adresse
 * inventée reste refusée.
 */

function db(items: Array<Record<string, unknown>>): Firestore {
  return {
    query: vi.fn(async () =>
      items.map((data, i) => ({ id: `f${i}`, path: `faq/f${i}`, data })),
    ),
  } as unknown as Firestore;
}

const QUESTION = {
  question: "C'est qui Max-Morrys ?",
  answer:
    'Un spécialiste du marketing digital basé à Dakar, avec une expérience terrain en Afrique de l’Ouest.',
  category: 'Qui est derrière tout ça ?',
  order: 23,
};

describe('adresse d’une question', () => {
  it('dérive le slug du texte quand aucun n’est renseigné', () => {
    expect(faqSlug({ question: "C'est qui Max-Morrys ?", slug: undefined })).toBe(
      'c-est-qui-max-morrys',
    );
  });

  it('retire les accents plutôt que de les laisser passer', () => {
    expect(faqSlug({ question: 'Où sont hébergées mes données ?', slug: undefined })).toBe(
      'ou-sont-hebergees-mes-donnees',
    );
  });

  it('préfère le slug renseigné, qui fige l’adresse', () => {
    // C'est toute la valeur du champ : reformuler la question ne casse pas les liens partagés.
    expect(faqSlug({ question: 'Question reformulée ?', slug: 'paiement-en-plusieurs-fois' })).toBe(
      'paiement-en-plusieurs-fois',
    );
  });

  it('ne laisse ni tiret de tête ni tiret de queue', () => {
    expect(faqSlug({ question: '« Accès à vie », ça veut dire quoi ?', slug: undefined })).toBe(
      'acces-a-vie-ca-veut-dire-quoi',
    );
  });
});

describe('getFaqQuestionMeta', () => {
  it('donne à la question son propre titre et sa propre description', async () => {
    const meta = await getFaqQuestionMeta(db([QUESTION]), 'c-est-qui-max-morrys', 'fr');
    expect(meta).not.toBeNull();
    expect(meta?.title).toBe("C'est qui Max-Morrys ? | Max-Morrys");
    expect(meta?.description).toContain('marketing digital');
    // Le défaut réparé : ni le titre générique, ni le noindex.
    expect(meta?.title).not.toContain('Maîtrise le digital');
    expect(meta?.noIndex).toBeFalsy();
  });

  it('pose le h1, le corps et le fil d’Ariane de la question', async () => {
    const meta = await getFaqQuestionMeta(db([QUESTION]), 'c-est-qui-max-morrys', 'fr');
    expect(meta?.h1).toBe("C'est qui Max-Morrys ?");
    expect(meta?.bodyText).toContain('Dakar');
    expect(meta?.breadcrumbs?.map((b) => b.name)).toEqual([
      'Accueil',
      'FAQ',
      "C'est qui Max-Morrys ?",
    ]);
  });

  it('balise la question en FAQPage', async () => {
    const meta = await getFaqQuestionMeta(db([QUESTION]), 'c-est-qui-max-morrys', 'fr');
    const jsonLd = meta?.jsonLd as Record<string, unknown>;
    expect(jsonLd['@type']).toBe('FAQPage');
    const entities = jsonLd.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe("C'est qui Max-Morrys ?");
  });

  it('coupe la description à 160 caractères sans couper un mot', async () => {
    const long = { ...QUESTION, answer: 'Mot '.repeat(200) };
    const meta = await getFaqQuestionMeta(db([long]), 'c-est-qui-max-morrys', 'fr');
    expect(meta!.description.length).toBeLessThanOrEqual(160);
    expect(meta!.description).not.toMatch(/\s$/);
  });

  it('porte les alternates, avec le même segment dans les deux langues', async () => {
    // Une question n'a pas de `slug_en` : l'adresse anglaise ne diffère que par le préfixe.
    const meta = await getFaqQuestionMeta(db([QUESTION]), 'c-est-qui-max-morrys', 'en');
    expect(meta?.altFr).toBe('https://maxmorrys.me/faq/c-est-qui-max-morrys');
    expect(meta?.altEn).toBe('https://maxmorrys.me/en/faq/c-est-qui-max-morrys');
    expect(meta?.canonical).toBe(meta?.altEn);
  });

  it('refuse une adresse inventée', async () => {
    // Le repli sur `unknownRouteMeta`, donc `noindex`, reste le bon comportement ici.
    expect(await getFaqQuestionMeta(db([QUESTION]), 'question-qui-n-existe-pas', 'fr')).toBeNull();
  });

  it('ignore un document sans réponse plutôt que de publier une page vide', async () => {
    const orphan = { question: 'Question sans réponse ?', answer: '', order: 1 };
    expect(await getFaqQuestionMeta(db([orphan]), 'question-sans-reponse', 'fr')).toBeNull();
  });

  it('interroge la collection dans l’ordre d’affichage', async () => {
    // Deux questions peuvent produire le même slug dérivé, et c'est LA PREMIÈRE qui gagne,
    // dans l'application comme ici. Un autre tri ferait pré-rendre l'autre question.
    const database = db([QUESTION]);
    await getFaqQuestionMeta(database, 'c-est-qui-max-morrys', 'fr');
    expect(database.query).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'faq',
        orderBy: [{ field: 'order', direction: 'asc' }],
      }),
    );
  });
});

describe('index /faq', () => {
  const BASE: PageMeta = {
    title: 'FAQ — Questions Fréquentes | Max-Morrys',
    description: 'Les réponses aux questions fréquentes.',
    ogType: 'website',
    ogImage: 'https://media.maxmorrys.me/Je-te-forme/2252.jpg',
    canonical: 'https://maxmorrys.me/faq',
    h1: 'Questions fréquentes',
  };

  it('balise les questions et les lie depuis le corps', async () => {
    const meta = await withFaqIndexJsonLd(db([QUESTION]), BASE);
    const jsonLd = meta.jsonLd as Record<string, unknown>;
    expect(jsonLd['@type']).toBe('FAQPage');
    expect((jsonLd.mainEntity as unknown[]).length).toBe(1);
    // L'index ne montrait AUCUNE de ses questions au robot : le titre, et rien d'autre.
    expect(meta.bodyText).toContain("C'est qui Max-Morrys ?");
  });

  it('garde sa méta quand la base ne répond pas', async () => {
    // L'enrichissement est au mieux : une panne Firestore ne doit pas coûter la page.
    const broken = {
      query: vi.fn(async () => {
        throw new Error('indisponible');
      }),
    } as unknown as Firestore;
    const meta = await withFaqIndexJsonLd(broken, BASE);
    expect(meta.title).toBe(BASE.title);
    expect(meta.jsonLd).toBeUndefined();
  });
});

describe('getFaqSlugs', () => {
  it('ne rend qu’une adresse par slug', async () => {
    // Deux questions au même slug dérivé ne font pas deux pages : le sitemap ne doit pas
    // déclarer deux fois la même URL.
    const twin = { ...QUESTION, order: 24 };
    expect(await getFaqSlugs(db([QUESTION, twin]))).toEqual(['c-est-qui-max-morrys']);
  });
});
