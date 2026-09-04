import { describe, expect, it } from 'vitest';

import { LIGNES_BUSINESS, classerAchat, familleDeLaLigne, ligneDeBusiness } from '../src/lib/purchase';

/**
 * La ligne de business décide de trois choses : l'effet appliqué au paiement, la famille
 * fiscale de la facture, et la colonne où la vente atterrit dans le relevé de revenu. Une
 * erreur ici est donc soit un droit non accordé, soit une mention fiscale fausse, soit un
 * chiffre d'affaires rangé sous le mauvais produit.
 */

/** Les quatre formes que le Worker écrit, telles qu'elles existent en base. */
const HISTORIQUE = {
  formation: { formationId: 'kR3xY', formationSlug: 'seo-local' },
  club: { formationId: 'club_digitos', formationSlug: 'club-des-digitos' },
  rysmoPack: { formationId: 'rysmo_pack_regular', rysmoKind: 'pack', rysmoPurchaseId: 'p1' },
  rysmoSubscription: { formationId: 'rysmo_sub_pro', rysmoKind: 'subscription', rysmoSubscriptionId: 's1' },
} as const;

describe('ligneDeBusiness — la déduction historique reste exacte', () => {
  /*
   * ⚠️ NON-RÉGRESSION PURE. Les transactions écrites avant le champ `ligne` n'en ont pas, et
   * il n'y a pas de script capable de deviner à leur place autre chose que ceci. Si cette
   * déduction se mettait à mentir, tout l'historique changerait de colonne en silence.
   */
  it.each(Object.keys(HISTORIQUE) as Array<keyof typeof HISTORIQUE>)(
    'reconnaît une transaction %s sans champ explicite',
    (attendu) => {
      expect(ligneDeBusiness({ ...HISTORIQUE[attendu] })).toBe(attendu);
    },
  );

  it('range en formation ce qui ne ressemble à rien de connu', () => {
    expect(ligneDeBusiness({})).toBe('formation');
  });
});

describe('ligneDeBusiness — le champ écrit fait foi', () => {
  it.each(LIGNES_BUSINESS)('lit la ligne %s telle qu’elle est écrite', (ligne) => {
    expect(ligneDeBusiness({ ligne })).toBe(ligne);
  });

  /*
   * Le champ prime sur la déduction — c'est ce qui permettra un jour de vendre un produit
   * dont la forme historique ne dit rien.
   */
  it('l’emporte sur ce que la déduction aurait conclu', () => {
    expect(ligneDeBusiness({ ...HISTORIQUE.club, ligne: 'formation' })).toBe('formation');
  });

  /*
   * ⚠️ Une valeur inconnue ne devient JAMAIS une cinquième ligne. Le seul écrivain est le
   * Worker : ce qu'il n'a pas écrit est une donnée corrompue, pas un produit nouveau — et
   * une ligne inventée ferait apparaître une colonne fantôme dans le relevé de revenu.
   */
  it.each([['platine'], [''], [42], [null], [{ lite: true }]])(
    'ignore la valeur illégitime %p et retombe sur la déduction',
    (illegitime) => {
      expect(ligneDeBusiness({ ...HISTORIQUE.club, ligne: illegitime })).toBe('club');
    },
  );
});

describe('familleDeLaLigne — le régime fiscal suit le produit', () => {
  it('range les deux produits Rysmo sous la même famille', () => {
    expect(familleDeLaLigne('rysmoPack')).toBe('rysmo');
    expect(familleDeLaLigne('rysmoSubscription')).toBe('rysmo');
  });

  it('sépare la formation et le Club, qui n’ont pas le même régime à l’avenir', () => {
    expect(familleDeLaLigne('formation')).toBe('formation');
    expect(familleDeLaLigne('club')).toBe('club');
  });
});

describe('classerAchat — le contrat des appelants n’a pas bougé', () => {
  /*
   * `transaction-mail.ts` et la console l'appellent sous cette forme depuis toujours. Le
   * déplacement dans `purchase.ts` ne doit rien changer à ce qu'elle rend, sur aucune des
   * quatre formes.
   */
  it.each([
    ['formation', 'formation'],
    ['club', 'club'],
    ['rysmoPack', 'rysmo'],
    ['rysmoSubscription', 'rysmo'],
  ] as const)('rend %s / %s comme avant', (kind, famille) => {
    expect(classerAchat({ ...HISTORIQUE[kind] })).toEqual({ kind, famille });
  });
});
