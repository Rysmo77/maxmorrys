import { describe, expect, it } from 'vitest';

import { buildStructuredQuery, splitCollectionPath } from '../src/index';

describe('construction des requêtes structurées', () => {
  it('rend une requête simple avec filtre, tri et limite', () => {
    // Équivalent de la requête de functions/src/sitemap.ts.
    const query = buildStructuredQuery(
      {
        collection: 'blog',
        where: [{ field: 'status', op: '==', value: 'published' }],
        orderBy: [{ field: 'publishedAt', direction: 'desc' }],
        limit: 50,
      },
      'blog',
    );

    expect(query).toEqual({
      from: [{ collectionId: 'blog' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: 'published' },
        },
      },
      orderBy: [{ field: { fieldPath: 'publishedAt' }, direction: 'DESCENDING' }],
      limit: 50,
    });
  });

  it('assemble plusieurs filtres en compositeFilter AND', () => {
    const query = buildStructuredQuery(
      {
        collection: 'enrollments',
        where: [
          { field: 'userId', op: '==', value: 'u1' },
          { field: 'progress', op: '>=', value: 50 },
        ],
      },
      'enrollments',
    );

    expect(query.where).toEqual({
      compositeFilter: {
        op: 'AND',
        filters: [
          { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: 'u1' } } },
          {
            fieldFilter: {
              field: { fieldPath: 'progress' },
              op: 'GREATER_THAN_OR_EQUAL',
              value: { integerValue: '50' },
            },
          },
        ],
      },
    });
  });

  it('convertit une comparaison à null en unaryFilter', () => {
    // Un fieldFilter portant un nullValue est rejeté par l'API : c'est le piège
    // que rencontre `notifiedAt == null` (balayage des rappels).
    expect(
      buildStructuredQuery(
        { collection: 'enrollments', where: [{ field: 'notifiedAt', op: '==', value: null }] },
        'enrollments',
      ).where,
    ).toEqual({ unaryFilter: { field: { fieldPath: 'notifiedAt' }, op: 'IS_NULL' } });

    expect(
      buildStructuredQuery(
        { collection: 'enrollments', where: [{ field: 'notifiedAt', op: '!=', value: null }] },
        'enrollments',
      ).where,
    ).toEqual({ unaryFilter: { field: { fieldPath: 'notifiedAt' }, op: 'IS_NOT_NULL' } });
  });

  it('convertit une comparaison à NaN en unaryFilter', () => {
    expect(
      buildStructuredQuery(
        { collection: 'x', where: [{ field: 'score', op: '==', value: Number.NaN }] },
        'x',
      ).where,
    ).toEqual({ unaryFilter: { field: { fieldPath: 'score' }, op: 'IS_NAN' } });
  });

  it('refuse un opérateur d ordre sur null', () => {
    expect(() =>
      buildStructuredQuery(
        { collection: 'x', where: [{ field: 'a', op: '<', value: null }] },
        'x',
      ),
    ).toThrow(/invalide/);
  });

  it('exige un tableau pour les opérateurs ensemblistes', () => {
    expect(() =>
      buildStructuredQuery(
        { collection: 'x', where: [{ field: 'a', op: 'in', value: 'pas-un-tableau' }] },
        'x',
      ),
    ).toThrow(/attend un tableau/);
  });

  it('marque allDescendants pour une requête de groupe de collections', () => {
    const query = buildStructuredQuery(
      { collection: 'items', allDescendants: true },
      'items',
    );
    expect(query.from).toEqual([{ collectionId: 'items', allDescendants: true }]);
  });

  it('entoure de backticks un nom de champ non identifiant', () => {
    const query = buildStructuredQuery(
      { collection: 'x', where: [{ field: 'champ avec espaces', op: '==', value: 1 }] },
      'x',
    );
    expect(query.where).toMatchObject({
      fieldFilter: { field: { fieldPath: '`champ avec espaces`' } },
    });
  });

  it('cible la bonne collection pour une sous-collection', () => {
    // notifications/{uid}/items : le parent porte l uid, la requête porte `items`.
    const { parent, collectionId } = splitCollectionPath('notifications/u1/items');
    expect(parent).toBe('notifications/u1');
    expect(buildStructuredQuery({ collection: 'notifications/u1/items' }, collectionId).from).toEqual([
      { collectionId: 'items' },
    ]);
  });
});
