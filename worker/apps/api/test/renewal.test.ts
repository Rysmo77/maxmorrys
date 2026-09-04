import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../src/env';
import { PREAVIS_JOURS, buildRenewalNotice, estAEcheance, sendRenewalNotices } from '../src/lib/renewal';
import { assertDitQueRienNestPreleve, assertNePrometAucunPrelevement } from './helpers/voix-echeance';

/**
 * Le rappel d'échéance est le seul message que le produit envoie sans que personne ne l'ait
 * demandé au moment même. Trois choses doivent tenir : il part le bon jour et un seul, il ne
 * part qu'une fois par échéance, et il ne promet aucun prélèvement.
 */

const AUJ = new Date('2026-08-31T08:00:00.000Z');

describe('estAEcheance — un jour, et un seul', () => {
  it('est vrai exactement à J-15', () => {
    expect(estAEcheance('2026-09-15T00:00:00.000Z', AUJ)).toBe(true);
  });

  /*
   * LE TEST QUI JUSTIFIE LA COMPARAISON EN JOURS CALENDAIRES. Un prédicat « écart ≤ 15 jours »
   * serait vrai chaque jour pendant deux semaines : le cron enverrait le rappel une fois grâce
   * au marqueur d'idempotence, mais la fenêtre serait une pente au lieu d'un jour, et le
   * premier jour à passer gagnerait la course. Ici, un seul jour déclenche.
   */
  it('est faux à J-14 comme à J-16', () => {
    expect(estAEcheance('2026-09-14T00:00:00.000Z', AUJ)).toBe(false);
    expect(estAEcheance('2026-09-16T00:00:00.000Z', AUJ)).toBe(false);
  });

  it("ne dépend pas de l'heure dans la journée", () => {
    for (const h of ['00:00:00', '13:45:00', '23:59:59']) {
      expect(estAEcheance(`2026-09-15T${h}.000Z`, AUJ)).toBe(true);
    }
  });

  it('est faux pour une échéance déjà passée', () => {
    expect(estAEcheance('2026-08-01T00:00:00.000Z', AUJ)).toBe(false);
  });

  it('ignore une date illisible plutôt que de lever', () => {
    expect(estAEcheance('', AUJ)).toBe(false);
    expect(estAEcheance('pas-une-date', AUJ)).toBe(false);
  });

  it('respecte la fenêtre annoncée par les CGV', () => {
    expect(PREAVIS_JOURS).toBe(15);
  });
});

describe('buildRenewalNotice', () => {
  const ab = { userName: 'Aïssatou', expiresAt: '2026-09-15T00:00:00.000Z', langue: 'fr' as const };

  it('porte la date et le lien de réabonnement', () => {
    const m = buildRenewalNotice(ab, '15/09/2026', 'https://maxmorrys.me/club-des-digitos');
    expect(m.text).toContain('15/09/2026');
    expect(m.html).toContain('https://maxmorrys.me/club-des-digitos');
    expect(m.text).toContain('https://maxmorrys.me/club-des-digitos');
  });

  /*
   * PRENDRE L'ENGAGEMENT PLUTÔT QUE SUBIR LA CONTRAINTE. Le message doit dire explicitement
   * que RIEN n'est prélevé — c'est la différence entre ce rappel et le renouvellement
   * automatique que les CGV promettaient. La FORMULATION peut bouger, l'affirmation non :
   * c'est elle que ces deux gardes tiennent, pas une phrase particulière.
   */
  /* Les deux gardes vivent dans `helpers/voix-echeance.ts` : le rappel mensuel de Rysmo+
     les appelle aussi, et deux copies auraient divergé sur le moins relu des deux. */
  it('dit explicitement que rien ne sera prélevé', () => {
    assertDitQueRienNestPreleve(buildRenewalNotice(ab, '15/09/2026', 'https://x'));
  });

  it('ne promet à aucun moment un prélèvement automatique', () => {
    assertNePrometAucunPrelevement(buildRenewalNotice(ab, '15/09/2026', 'https://x'));
  });

  it('bascule en anglais', () => {
    const m = buildRenewalNotice({ ...ab, langue: 'en' }, '09/15/2026', 'https://x');
    expect(m.subject).toContain('ends in 15 days');
    assertDitQueRienNestPreleve(m);
    assertNePrometAucunPrelevement(m);
  });

  it('rend toujours une version texte non vide', () => {
    const m = buildRenewalNotice(ab, '15/09/2026', 'https://x');
    expect(m.text.trim().length).toBeGreaterThan(80);
  });
});

/**
 * Faux Firestore : juste ce que `sendRenewalNotices` appelle.
 *
 * LES FIXTURES SONT COPIÉES, PAS RÉFÉRENCÉES. `update` fait un `Object.assign` sur la donnée
 * stockée ; sans copie, il mutait l'objet `echeant` partagé par tout le fichier. Le premier
 * test qui envoyait y écrivait `renewalNoticeFor`, et les six suivants voyaient un abonnement
 * déjà prévenu — ils échouaient tous en suite, et passaient tous en isolation.
 */
function fakeDb(abonnements: Array<Record<string, unknown>>, profils: Record<string, unknown> = {}) {
  const store = abonnements.map((data, i) => ({
    path: `club_subscriptions/u${i}`,
    id: `u${i}`,
    data: { ...data },
  }));
  const updates: Array<[string, Record<string, unknown>]> = [];
  return {
    updates,
    store,
    db: {
      query: vi.fn(async () => store),
      get: vi.fn(async (path: string) => {
        const uid = path.replace('users/', '');
        return profils[uid] ? { data: profils[uid] as Record<string, unknown> } : null;
      }),
      update: vi.fn(async (path: string, data: Record<string, unknown>) => {
        updates.push([path, data]);
        const cible = store.find((s) => s.path === path);
        if (cible) Object.assign(cible.data, data);
      }),
    } as unknown as Firestore,
  };
}

function fakeEnv(envoi: { sent: boolean; error?: string } = { sent: true }) {
  return {
    APP_BASE_URL: 'https://maxmorrys.me',
    EMAIL_FROM: 'facture@mail.maxmorrys.me',
    EMAIL_FROM_NAME: 'Max-Morrys',
    EMAIL: { send: vi.fn(async () => { if (!envoi.sent) throw new Error(envoi.error ?? 'échec'); return {}; }) },
  } as unknown as Env;
}

describe('sendRenewalNotices', () => {
  const echeant = {
    userId: 'u0',
    userEmail: 'aissatou@exemple.sn',
    userName: 'Aïssatou',
    status: 'active',
    expiresAt: '2026-09-15T00:00:00.000Z',
  };

  it('envoie à qui arrive à J-15', async () => {
    const { db } = fakeDb([echeant]);
    const env = fakeEnv();
    const bilan = await sendRenewalNotices(db, env, AUJ);
    expect(bilan).toEqual({ examines: 1, envoyes: 1, echecs: 0 });
  });

  it("n'envoie rien hors de la fenêtre", async () => {
    const { db } = fakeDb([{ ...echeant, expiresAt: '2026-12-01T00:00:00.000Z' }]);
    const bilan = await sendRenewalNotices(db, fakeEnv(), AUJ);
    expect(bilan.envoyes).toBe(0);
  });

  /*
   * IDEMPOTENCE. Le marqueur porte la DATE D'ÉCHÉANCE, pas un booléen : sinon une personne
   * qui se réabonne ne recevrait jamais le rappel de l'année suivante.
   */
  it('ne renvoie pas deux fois pour la même échéance', async () => {
    const { db } = fakeDb([echeant]);
    const env = fakeEnv();
    await sendRenewalNotices(db, env, AUJ);
    const second = await sendRenewalNotices(db, env, AUJ);
    expect(second.envoyes).toBe(0);
  });

  it('marque avec la date visée, pas avec un booléen', async () => {
    const { db, updates } = fakeDb([echeant]);
    await sendRenewalNotices(db, fakeEnv(), AUJ);
    expect(updates[0][1]).toEqual({ renewalNoticeFor: '2026-09-15T00:00:00.000Z' });
  });

  it('renvoie bien pour une NOUVELLE échéance après réabonnement', async () => {
    const { db } = fakeDb([{ ...echeant, renewalNoticeFor: '2025-09-15T00:00:00.000Z' }]);
    const bilan = await sendRenewalNotices(db, fakeEnv(), AUJ);
    expect(bilan.envoyes).toBe(1);
  });

  /*
   * Un échec d'envoi ne pose PAS le marqueur : la prochaine exécution du cron réessaiera,
   * tant qu'on est encore dans la journée J-15.
   */
  it('ne marque pas quand l’envoi échoue', async () => {
    const { db, updates } = fakeDb([echeant]);
    const bilan = await sendRenewalNotices(db, fakeEnv({ sent: false }), AUJ);
    expect(bilan).toEqual({ examines: 1, envoyes: 0, echecs: 1 });
    expect(updates).toHaveLength(0);
  });

  it('compte un échec, sans lever, quand l’adresse manque', async () => {
    const { db } = fakeDb([{ ...echeant, userEmail: '' }]);
    const bilan = await sendRenewalNotices(db, fakeEnv(), AUJ);
    expect(bilan).toEqual({ examines: 1, envoyes: 0, echecs: 1 });
  });

  it('écrit dans la langue du profil', async () => {
    const { db } = fakeDb([echeant], { u0: { preferences: { language: 'en' } } });
    const env = fakeEnv();
    await sendRenewalNotices(db, env, AUJ);
    const send = (env as unknown as { EMAIL: { send: ReturnType<typeof vi.fn> } }).EMAIL.send;
    expect(send.mock.calls[0][0].subject).toContain('ends in 15 days');
  });

  it('retombe sur le français quand le profil ne dit rien', async () => {
    const { db } = fakeDb([echeant]);
    const env = fakeEnv();
    await sendRenewalNotices(db, env, AUJ);
    const send = (env as unknown as { EMAIL: { send: ReturnType<typeof vi.fn> } }).EMAIL.send;
    expect(send.mock.calls[0][0].subject).toContain('se termine dans 15 jours');
  });

  it('traite plusieurs abonnements en une passe', async () => {
    const { db } = fakeDb([
      echeant,
      { ...echeant, userId: 'u1', userEmail: 'b@x.sn' },
      { ...echeant, userId: 'u2', userEmail: 'c@x.sn', expiresAt: '2026-10-30T00:00:00.000Z' },
    ]);
    const bilan = await sendRenewalNotices(db, fakeEnv(), AUJ);
    expect(bilan).toEqual({ examines: 3, envoyes: 2, echecs: 0 });
  });
});
