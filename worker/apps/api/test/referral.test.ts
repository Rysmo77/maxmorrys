import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Firestore } from '@mm/firestore-rest';

import { niveauDepuisXp, recompenserParrain } from '../src/lib/referral';

/**
 * La remise du filleul était appliquée, la contrepartie du parrain non : le trigger Firestore
 * qui la versait est mort avec les Cloud Functions. Trois choses doivent tenir maintenant
 * qu'elle vit dans le webhook de paiement : elle ne se verse qu'UNE fois par filleul, elle ne
 * se verse pas à soi-même, et elle ne fait JAMAIS échouer le webhook.
 */

/** Faux Firestore minimal : on n'observe que ce qui est écrit. */
function fauxDb(docs: Record<string, Record<string, unknown>>, requete: Array<{ id: string }> = []) {
  const ecritures: Array<{ chemin: string; data: Record<string, unknown> }> = [];
  const ajouts: Array<{ collection: string; data: Record<string, unknown> }> = [];
  const db = {
    get: vi.fn(async (chemin: string) => (docs[chemin] ? { id: chemin.split('/').pop(), path: chemin, data: docs[chemin] } : null)),
    query: vi.fn(async () => requete.map((d) => ({ id: d.id, path: `users/${d.id}`, data: {} }))),
    update: vi.fn(async (chemin: string, data: Record<string, unknown>) => { ecritures.push({ chemin, data }); }),
    add: vi.fn(async (collection: string, data: Record<string, unknown>) => { ajouts.push({ collection, data }); return 'nouveau'; }),
    runTransaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        get: async (chemin: string) => (docs[chemin] ? { id: '', path: chemin, data: docs[chemin] } : null),
        set: (chemin: string, data: Record<string, unknown>) => { ecritures.push({ chemin, data }); },
      });
    }),
  } as unknown as Firestore;
  return { db, ecritures, ajouts };
}

describe('niveauDepuisXp — miroir des paliers du client', () => {
  /*
   * ⚠️ LE TEST QUI JUSTIFIE LA DUPLICATION. Les trois projets TypeScript du dépôt ne peuvent pas
   * s'importer entre eux : ces paliers sont donc recopiés du client. Plutôt que de recopier
   * aussi les nombres ICI — ce qui ne prouverait que ma propre cohérence — on lit le fichier
   * client et on vérifie que les deux implémentations répondent pareil.
   */
  it('répond comme `getLevelFromXP` de `src/types/gamification.ts`', () => {
    const src = readFileSync(resolve(__dirname, '../../../../src/types/gamification.ts'), 'utf8');
    const bornes = [...src.matchAll(/if \(xp < (\d+)\) return (\d+);/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(bornes.length).toBe(9); // dix niveaux, neuf bornes puis le repli

    for (const [seuil, niveau] of bornes) {
      expect(niveauDepuisXp(seuil - 1), `xp=${seuil - 1}`).toBe(niveau);
      expect(niveauDepuisXp(seuil), `xp=${seuil}`).toBe(niveau + 1);
    }
    expect(niveauDepuisXp(999_999)).toBe(10);
  });
});

describe('recompenserParrain', () => {
  /*
   * Audit du 03/09/2026 — LE CODE AMBIGU.
   *
   * La requête portait `limit: 1` sur un `where` sans `orderBy` : elle ne rendait donc pas
   * « le porteur du code » mais le document dont l'identifiant trie le plus bas. Couplée à
   * une règle `create` qui laissait poser `referralCode` à l'inscription, elle permettait de
   * capter les conversions d'un tiers en recréant un compte jusqu'à obtenir un UID plus bas.
   *
   * La règle Firestore ferme la porte ; ce test tient le second rideau, qui refuse
   * d'arbitrer plutôt que de désigner un gagnant au hasard.
   */
  it('ne récompense personne quand deux comptes portent le même code', async () => {
    const { db, ecritures, ajouts } = fauxDb(
      { 'users/filleul': { referredByCode: 'ABC123', displayName: 'Awa' } },
      [{ id: 'aaa-attaquant' }, { id: 'zzz-legitime' }],
    );

    const r = await recompenserParrain(db, 'filleul');

    expect(r).toEqual({ recompense: false, raison: 'codeAmbigu' });
    // Ni XP, ni badge, ni conversion consignée, ni marqueur posé sur le filleul :
    // l'ambiguïté doit rester rattrapable une fois le doublon corrigé à la main.
    expect(ecritures).toHaveLength(0);
    expect(ajouts).toHaveLength(0);
  });

  it('verse 100 XP et le badge Ambassadeur, et consigne la conversion', async () => {
    const { db, ecritures, ajouts } = fauxDb(
      { 'users/filleul': { referredByCode: 'ABC123', displayName: 'Awa' }, 'gamification/parrain': { xp: 40, badges: [] } },
      [{ id: 'parrain' }],
    );
    const r = await recompenserParrain(db, 'filleul');

    expect(r.recompense).toBe(true);
    const gam = ecritures.find((e) => e.chemin === 'gamification/parrain');
    expect(gam?.data.xp).toBe(140);
    expect(gam?.data.badges).toContain('ambassadeur');
    expect(ajouts[0].collection).toBe('referrals');
    expect(ajouts[0].data).toMatchObject({ referrerId: 'parrain', refereeId: 'filleul', status: 'converted' });
  });

  it('ne double pas le badge si le parrain l’a déjà', async () => {
    const { db, ecritures } = fauxDb(
      { 'users/filleul': { referredByCode: 'ABC123' }, 'gamification/parrain': { xp: 300, badges: ['ambassadeur', 'contributeur'] } },
      [{ id: 'parrain' }],
    );
    await recompenserParrain(db, 'filleul');
    const badges = ecritures.find((e) => e.chemin === 'gamification/parrain')?.data.badges as string[];
    expect(badges.filter((b) => b === 'ambassadeur')).toHaveLength(1);
    expect(badges).toContain('contributeur'); // les badges déjà acquis survivent
  });

  it('ne verse rien deux fois pour le même filleul', async () => {
    const { db, ajouts } = fauxDb(
      { 'users/filleul': { referredByCode: 'ABC123', referralRewarded: true } },
      [{ id: 'parrain' }],
    );
    const r = await recompenserParrain(db, 'filleul');
    expect(r).toEqual({ recompense: false, raison: 'dejaRecompense' });
    expect(ajouts).toHaveLength(0);
  });

  it('refuse l’auto-parrainage', async () => {
    const { db, ajouts } = fauxDb({ 'users/moi': { referredByCode: 'MOI' } }, [{ id: 'moi' }]);
    const r = await recompenserParrain(db, 'moi');
    expect(r.raison).toBe('autoParrainage');
    expect(ajouts).toHaveLength(0);
  });

  it('ne fait rien, sans erreur, quand il n’y a pas de parrain', async () => {
    const { db } = fauxDb({ 'users/filleul': {} });
    expect(await recompenserParrain(db, 'filleul')).toEqual({ recompense: false, raison: 'pasDeParrain' });
  });

  it('⚠️ NE JETTE JAMAIS — le webhook doit répondre 200 même si la récompense échoue', async () => {
    /*
     * C'est la propriété la plus importante du module. Une exception ici ferait répondre autre
     * chose que 200 à Bictorys, qui RELIVRERAIT le webhook sur un paiement déjà encaissé.
     * Une récompense perdue se rattrape à la main ; un double débit, non.
     */
    const db = { get: vi.fn(async () => { throw new Error('Firestore indisponible'); }) } as unknown as Firestore;
    await expect(recompenserParrain(db, 'filleul')).resolves.toEqual({ recompense: false, raison: 'erreur' });
  });
});
