import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import { getCertificateMeta } from '../src/prerender/certificat';
import { DEFAULT_OG_IMAGE } from '../src/constants';

/**
 * UN CERTIFICAT PARTAGÉ S'AFFICHAIT COMME LA PAGE D'ACCUEIL.
 *
 * `/certificat/:code` tombait en `origin` : l'hébergement servait `index.html` tel quel, et
 * les robots sociaux lisaient ses balises figées — titre de la page d'accueil, photo de la
 * page d'accueil. Sur la seule page du produit dont la fonction EST d'être montrée à
 * quelqu'un d'autre.
 *
 * Ces tests tiennent les trois propriétés qui font que le partage sert à quelque chose : la
 * page se décrit elle-même, elle porte une carte qui dit « certificat », et un code inventé
 * ne produit rien.
 */

function db(doc: Record<string, unknown> | null): Firestore {
  return {
    get: vi.fn(async (chemin: string) =>
      doc ? { id: 'MM-ABCDEF1234', path: chemin, data: doc } : null,
    ),
  } as unknown as Firestore;
}

const CERTIFICAT = {
  certificateCode: 'MM-ABCDEF1234',
  formationTitle: 'Référencement local',
  holderName: 'Aïssatou Diallo',
  issuedAt: '2026-09-01T10:00:00.000Z',
};

describe('la page se décrit elle-même', () => {
  it('porte la formation dans le titre et le titulaire dans la description', async () => {
    const meta = (await getCertificateMeta(db(CERTIFICAT), 'MM-ABCDEF1234', 'fr'))!;
    expect(meta.title).toContain('Référencement local');
    expect(meta.description).toContain('Aïssatou Diallo');
    /* Le jour n'est pas zéro-comblé — même convention que le rappel d'échéance du Club. */
    expect(meta.description).toContain('1/09/2026');
  });

  it('bascule en anglais, date comprise', async () => {
    const meta = (await getCertificateMeta(db(CERTIFICAT), 'MM-ABCDEF1234', 'en'))!;
    expect(meta.title).toContain('Certificate');
    expect(meta.description).toContain('09/1/2026');
    expect(meta.description).toContain('/en/verify');
  });

  it('se passe de la date plutôt que d’en inventer une', async () => {
    const meta = (await getCertificateMeta(db({ ...CERTIFICAT, issuedAt: 'hier' }), 'X', 'fr'))!;
    expect(meta.description).toContain('Aïssatou Diallo');
    expect(meta.description).not.toContain('NaN');
    expect(meta.description).not.toContain('Invalid');
  });

  it('renvoie vers la page de vérification, qui est le seul intérêt du code', async () => {
    const meta = (await getCertificateMeta(db(CERTIFICAT), 'MM-ABCDEF1234', 'fr'))!;
    expect(meta.description).toContain('/verifier');
  });
});

describe('la carte de partage', () => {
  /*
   * ⚠️ LA PROPRIÉTÉ QUI FAIT TOUT TENIR. `withShareImage` court-circuite sur `noIndex` et
   * retombe sur la photo par défaut — mais seulement si `ogImage` vaut encore
   * `DEFAULT_OG_IMAGE`. En la posant ici, la carte survit sans qu'il y ait rien à changer
   * ailleurs. Si quelqu'un retirait cette ligne, le défaut d'origine reviendrait en silence.
   */
  it('est posée explicitement, donc elle survit au repli de `withShareImage`', async () => {
    const meta = (await getCertificateMeta(db(CERTIFICAT), 'MM-ABCDEF1234', 'fr'))!;
    expect(meta.ogImage).not.toBe(DEFAULT_OG_IMAGE);
    expect(meta.ogImage).toContain('/og/certificat.png');
  });

  it('porte ses dimensions réelles, pas une constante décorative', async () => {
    const meta = (await getCertificateMeta(db(CERTIFICAT), 'MM-ABCDEF1234', 'fr'))!;
    expect(meta.ogImageWidth).toBe(1200);
    expect(meta.ogImageHeight).toBe(630);
  });

  it('a un texte alternatif qui nomme la formation', async () => {
    const meta = (await getCertificateMeta(db(CERTIFICAT), 'MM-ABCDEF1234', 'fr'))!;
    expect(meta.ogImageAlt).toContain('Référencement local');
  });
});

describe('ce qui reste refusé', () => {
  /*
   * Un certificat nominatif se PARTAGE, il ne se CHERCHE pas. Les deux ne sont pas la même
   * chose, et c'est leur confusion qui avait rendu le défaut invisible : la page était déjà
   * en `noindex` côté client, donc le problème passait pour réglé.
   */
  it('reste hors des index de recherche', async () => {
    const meta = (await getCertificateMeta(db(CERTIFICAT), 'MM-ABCDEF1234', 'fr'))!;
    expect(meta.noIndex).toBe(true);
  });

  it('un code inconnu ne produit rien', async () => {
    expect(await getCertificateMeta(db(null), 'INVENTE', 'fr')).toBeNull();
  });

  /* Un miroir amputé ne doit pas produire une page qui parle d'un certificat vide. */
  it.each([['formationTitle'], ['holderName']])(
    'un miroir sans %s ne produit rien non plus',
    async (champ) => {
      const ampute = { ...CERTIFICAT, [champ]: undefined };
      expect(await getCertificateMeta(db(ampute), 'MM-ABCDEF1234', 'fr')).toBeNull();
    },
  );

  /*
   * ⚠️ UN `get` PAR IDENTIFIANT, JAMAIS UNE REQUÊTE. C'est ce qui rend la lecture publique
   * acceptable : `certificate_lookups` est ouvert en lecture, mais on ne peut pas LISTER —
   * seulement demander un code qu'on possède déjà.
   */
  it('lit par identifiant, sans jamais lister la collection', async () => {
    const firestore = db(CERTIFICAT);
    await getCertificateMeta(firestore, 'MM-ABCDEF1234', 'fr');
    const get = firestore.get as unknown as ReturnType<typeof vi.fn>;
    expect(get).toHaveBeenCalledWith('certificate_lookups/MM-ABCDEF1234');
    expect((firestore as unknown as { query?: unknown }).query).toBeUndefined();
  });
});
