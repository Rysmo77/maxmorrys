import { describe, expect, it, vi } from 'vitest';

import {
  desabonner,
  lienDesabonnement,
  normaliserAdresse,
  signerAdresse,
  verifierAdresse,
} from '../src/lib/unsubscribe';
import type { Env } from '../src/env';

const env = {
  EXPORT_SIGNING_KEY: 'clef-de-test-pour-la-signature',
  API_BASE_URL: 'https://api.maxmorrys.me',
} as unknown as Env;

/**
 * LE DÉSABONNEMENT EST LA MOITIÉ MANQUANTE DU CONSENTEMENT.
 *
 * Ces tests portent sur ce qui casse silencieusement : une signature qui ne se vérifie pas,
 * une casse qui empêche de retrouver l'adresse, un lien qu'on croit valable et qui ne l'est
 * pas. Aucun de ces défauts ne se voit à l'écran — ils se voient quand quelqu'un continue de
 * recevoir une lettre qu'il a refusée, ce qui est exactement le scénario qui produit une
 * plainte réglementaire.
 */
describe('la signature du lien de désabonnement', () => {
  it('se vérifie elle-même', async () => {
    const s = await signerAdresse(env, 'awa@example.com');
    expect(await verifierAdresse(env, 'awa@example.com', s)).toBe(true);
  });

  it('refuse une signature qui ne correspond pas à l’adresse', async () => {
    const s = await signerAdresse(env, 'awa@example.com');
    expect(await verifierAdresse(env, 'moussa@example.com', s)).toBe(false);
  });

  it('refuse une signature tronquée ou bricolée', async () => {
    const s = await signerAdresse(env, 'awa@example.com');
    expect(await verifierAdresse(env, 'awa@example.com', s.slice(0, -2))).toBe(false);
    expect(await verifierAdresse(env, 'awa@example.com', 'pas-de-l-hexadecimal')).toBe(false);
    expect(await verifierAdresse(env, 'awa@example.com', '')).toBe(false);
  });

  /*
   * LA CASSE EST LE PIÈGE PRINCIPAL.
   *
   * Le formulaire stocke l'adresse en minuscules ; un lien signé sur la saisie brute
   * « Awa@Example.com » doit donc retrouver la même signature, sinon le clic échoue pour la
   * seule personne qui a tapé une majuscule — et elle n'a aucun moyen de le savoir.
   */
  it('ignore la casse et les espaces, des deux côtés', async () => {
    const s = await signerAdresse(env, '  Awa@Example.COM ');
    expect(await verifierAdresse(env, 'awa@example.com', s)).toBe(true);
    expect(normaliserAdresse('  Awa@Example.COM ')).toBe('awa@example.com');
  });

  it('produit un lien complet, avec l’adresse encodée', async () => {
    const lien = await lienDesabonnement(env, 'awa+club@example.com');
    expect(lien).toContain('https://api.maxmorrys.me/desabonnement?e=');
    // Le `+` doit être encodé, sans quoi il se lit comme une espace côté serveur.
    expect(lien).toContain('awa%2Bclub%40example.com');
    expect(lien).toMatch(/&s=[0-9a-f]{64}$/);
  });
});

/** Un faux Firestore : on n'observe que les écritures. */
function fauxDb(abonnes: Array<Record<string, unknown>>, comptes: Array<Record<string, unknown>> = []) {
  const update = vi.fn().mockResolvedValue(undefined);
  const query = vi.fn(async (q: { collection: string }) =>
    q.collection === 'newsletter'
      ? abonnes.map((data, i) => ({ path: `newsletter/a${i}`, data }))
      : comptes.map((data, i) => ({ path: `users/u${i}`, data })),
  );
  return { db: { query, update } as never, update };
}

describe('le retrait effectif', () => {
  it('marque chaque inscription trouvée', async () => {
    const { db, update } = fauxDb([{ email: 'awa@example.com' }, { email: 'awa@example.com' }]);
    const bilan = await desabonner(db, 'awa@example.com');
    expect(bilan.marques).toBe(2);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[0][1]).toHaveProperty('unsubscribedAt');
  });

  it('ne réécrit pas la date d’une adresse déjà sortie', async () => {
    const { db, update } = fauxDb([{ email: 'awa@example.com', unsubscribedAt: '2026-01-01T00:00:00.000Z' }]);
    const bilan = await desabonner(db, 'awa@example.com');
    expect(bilan.marques).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });

  /*
   * ZÉRO TROUVÉ N'EST PAS UNE ERREUR — voir l'en-tête du module. Répondre « introuvable » à
   * quelqu'un qui vient de recevoir un courrier de notre part le pousse vers le bouton
   * « spam », qui coûte infiniment plus cher qu'un retrait sans effet.
   */
  it('répond « c’est fait » même sans rien trouver', async () => {
    const { db } = fauxDb([]);
    const bilan = await desabonner(db, 'inconnue@example.com');
    expect(bilan.ok).toBe(true);
    expect(bilan.marques).toBe(0);
  });

  it('coupe aussi la préférence du compte lié', async () => {
    const { db, update } = fauxDb([], [{ email: 'awa@example.com', preferences: { newsletter: true, language: 'fr' } }]);
    const bilan = await desabonner(db, 'awa@example.com');
    expect(bilan.compteMisAJour).toBe(true);
    const ecrit = update.mock.calls[0][1] as { preferences: Record<string, unknown> };
    expect(ecrit.preferences.newsletter).toBe(false);
    // Les autres préférences survivent : on coupe une lettre, on ne réinitialise pas un profil.
    expect(ecrit.preferences.language).toBe('fr');
  });

  it('ne touche pas un compte qui n’était pas abonné', async () => {
    const { db, update } = fauxDb([], [{ email: 'awa@example.com', preferences: { newsletter: false } }]);
    const bilan = await desabonner(db, 'awa@example.com');
    expect(bilan.compteMisAJour).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it('retrouve l’adresse quelle qu’en soit la casse', async () => {
    const { db } = fauxDb([{ email: 'awa@example.com' }]);
    const bilan = await desabonner(db, '  AWA@Example.com  ');
    expect(bilan.marques).toBe(1);
  });
});
