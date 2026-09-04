import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../src/env';
import {
  PREAVIS_RYSMO_JOURS,
  buildRysmoRenewalNotice,
  dateLisible,
  sendRysmoRenewalNotices,
} from '../src/lib/rysmo-renewal';
import { FENETRE_RENOUVELLEMENT_JOURS } from '../src/lib/rysmo-subscription';
import { assertDitQueRienNestPreleve, assertNePrometAucunPrelevement } from './helpers/voix-echeance';

/**
 * Rysmo+ est mensuel, sans prélèvement, et n'était prévenu de rien. Trois choses doivent
 * tenir ici : le rappel part le bon jour et une seule fois, il mène vers une porte OUVERTE,
 * et il dit que reprendre maintenant ne coûte pas les jours restants.
 */

const AB = { userName: 'Aïssatou', langue: 'fr' as const };

describe('le préavis et la fenêtre sont le même nombre', () => {
  /*
   * ⚠️ LA GARDE CENTRALE DU LOT. Prévenir quelqu'un un jour où le bouton refuse encore, ou
   * ouvrir le bouton sans prévenir, sont les deux façons de rendre ce dispositif inutile.
   * L'égalité n'est pas une coïncidence à surveiller : c'est une seule constante, importée.
   */
  it('le rappel part exactement quand le renouvellement s’ouvre', () => {
    expect(PREAVIS_RYSMO_JOURS).toBe(FENETRE_RENOUVELLEMENT_JOURS);
  });
});

describe('le courrier de rappel Rysmo+', () => {
  it('porte la date et le lien de reprise', () => {
    const m = buildRysmoRenewalNotice(AB, '09/09/2026', 'https://maxmorrys.me/mon-espace/repetiteur');
    expect(m.text).toContain('09/09/2026');
    expect(m.html).toContain('https://maxmorrys.me/mon-espace/repetiteur');
    expect(m.text).toContain('https://maxmorrys.me/mon-espace/repetiteur');
  });

  it('dit que rien ne sera prélevé, et ne promet aucun prélèvement', () => {
    const m = buildRysmoRenewalNotice(AB, '09/09/2026', 'https://x');
    assertDitQueRienNestPreleve(m);
    assertNePrometAucunPrelevement(m);
  });

  /*
   * SANS CETTE PHRASE, LE RAPPEL SE RETOURNE CONTRE LUI-MÊME. Si reprendre cinq jours avant
   * coûtait cinq jours, le calcul rationnel serait d'attendre le dernier jour — donc de
   * rater l'échéance, donc de subir exactement ce que ce courrier existe pour éviter.
   */
  it('annonce que les jours restants ne sont pas perdus', () => {
    const m = buildRysmoRenewalNotice(AB, '09/09/2026', 'https://x');
    expect(m.text).toMatch(/nouveau mois démarre le 09\/09\/2026/);
    expect(m.text).toMatch(/tu ne perds pas les jours qui restent/);
  });

  it('bascule en anglais, phrase de chaînage comprise', () => {
    const m = buildRysmoRenewalNotice({ ...AB, langue: 'en' }, '09/09/2026', 'https://x');
    expect(m.subject).toContain(`ends in ${PREAVIS_RYSMO_JOURS} days`);
    expect(m.text).toMatch(/you don't lose the days you have left/);
    assertDitQueRienNestPreleve(m);
    assertNePrometAucunPrelevement(m);
  });

  it('parle du répétiteur, jamais du Club', () => {
    const m = buildRysmoRenewalNotice(AB, '09/09/2026', 'https://x');
    expect(m.text).toContain('Rysmo+');
    expect(m.text).not.toMatch(/Club des Digitos/);
  });

  it('échappe le nom, qui vient d’un profil éditable', () => {
    const m = buildRysmoRenewalNotice({ ...AB, userName: '<img onerror=x>' }, '09/09/2026', 'https://x');
    expect(m.html).not.toContain('<img onerror=x>');
    expect(m.html).toContain('&lt;img');
  });

  it('rend toujours une version texte non vide', () => {
    expect(buildRysmoRenewalNotice(AB, '09/09/2026', 'https://x').text.trim().length).toBeGreaterThan(80);
  });
});

describe('dateLisible', () => {
  it('suit la convention de chaque langue', () => {
    expect(dateLisible('2026-09-09T00:00:00.000Z', 'fr')).toBe('9/09/2026');
    expect(dateLisible('2026-09-09T00:00:00.000Z', 'en')).toBe('09/9/2026');
  });
});

// ── La passe ────────────────────────────────────────────────────────────────

/** Une échéance à N jours d'aujourd'hui, à midi UTC pour éviter tout effet de bord horaire. */
function dans(jours: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString();
}

/**
 * Faux Firestore : `queryPaged` (générateur), `getAll` (lecture groupée) et `update`.
 *
 * Les fixtures sont COPIÉES, jamais référencées — `update` fait un `Object.assign` sur la
 * donnée stockée, et sans copie le premier test qui envoie écrirait `renewalNoticeFor` dans
 * l'objet partagé par tout le fichier. C'est le défaut que `renewal.test.ts` documente.
 */
function fauxDb(abonnements: Array<Record<string, unknown>>, profils: Record<string, unknown> = {}, pageSize = 200) {
  const store = abonnements.map((data, i) => ({
    path: `rysmoSubscriptions/s${i}`,
    id: `s${i}`,
    data: { ...data },
  }));
  const maj: Array<[string, Record<string, unknown>]> = [];
  const pagesLues: number[] = [];

  const db = {
    queryPaged: vi.fn(async function* () {
      for (let i = 0; i < store.length; i += pageSize) {
        const page = store.slice(i, i + pageSize);
        pagesLues.push(page.length);
        yield page;
      }
    }),
    getAll: vi.fn(async (paths: string[]) =>
      paths.map((p) => {
        const uid = p.replace('users/', '');
        return profils[uid] ? { data: profils[uid] as Record<string, unknown> } : null;
      }),
    ),
    update: vi.fn(async (path: string, data: Record<string, unknown>) => {
      maj.push([path, data]);
      const cible = store.find((s) => s.path === path);
      if (cible) Object.assign(cible.data, data);
    }),
  } as unknown as Firestore;

  return { db, maj, store, pagesLues };
}

function fauxEnv(envoi: { sent: boolean; error?: string } = { sent: true }) {
  return {
    APP_BASE_URL: 'https://maxmorrys.me',
    EMAIL_FROM: 'facture@mail.maxmorrys.me',
    EMAIL_FROM_NAME: 'Max-Morrys',
    EMAIL: {
      send: vi.fn(async () => {
        if (!envoi.sent) throw new Error(envoi.error ?? 'échec');
        return {};
      }),
    },
  } as unknown as Env;
}

describe('sendRysmoRenewalNotices', () => {
  const echeant = {
    userId: 'u0',
    userEmail: 'aissatou@exemple.sn',
    userName: 'Aïssatou',
    plan: 'lite',
    status: 'active',
    expiresAt: dans(PREAVIS_RYSMO_JOURS),
  };

  it('envoie à qui arrive dans la fenêtre, et pose le marqueur', async () => {
    const { db, maj } = fauxDb([echeant]);
    const env = fauxEnv();

    const bilan = await sendRysmoRenewalNotices(db, env);

    expect(bilan).toEqual({ examines: 1, envoyes: 1, echecs: 0 });
    expect(maj).toEqual([['rysmoSubscriptions/s0', { renewalNoticeFor: echeant.expiresAt }]]);
  });

  it('n’envoie rien un jour trop tôt ni un jour trop tard', async () => {
    for (const decalage of [-1, 1]) {
      const { db } = fauxDb([{ ...echeant, expiresAt: dans(PREAVIS_RYSMO_JOURS + decalage) }]);
      const bilan = await sendRysmoRenewalNotices(db, fauxEnv());
      expect(bilan.envoyes).toBe(0);
    }
  });

  /* Le marqueur porte la DATE visée, pas un booléen : sur un mensuel, un booléen priverait
     chacun de onze rappels sur douze. */
  it('ne renvoie pas pour la même échéance', async () => {
    const { db } = fauxDb([{ ...echeant, renewalNoticeFor: echeant.expiresAt }]);
    const bilan = await sendRysmoRenewalNotices(db, fauxEnv());
    expect(bilan.envoyes).toBe(0);
  });

  it('renvoie quand une nouvelle échéance arrive', async () => {
    const { db } = fauxDb([{ ...echeant, renewalNoticeFor: dans(-25) }]);
    const bilan = await sendRysmoRenewalNotices(db, fauxEnv());
    expect(bilan.envoyes).toBe(1);
  });

  it('ne pose pas le marqueur quand l’envoi échoue, pour pouvoir réessayer', async () => {
    const { db, maj } = fauxDb([echeant]);
    const bilan = await sendRysmoRenewalNotices(db, fauxEnv({ sent: false }));
    expect(bilan).toEqual({ examines: 1, envoyes: 0, echecs: 1 });
    expect(maj).toEqual([]);
  });

  it('compte un échec, sans lever, quand l’adresse manque', async () => {
    const { db } = fauxDb([{ ...echeant, userEmail: undefined }]);
    const bilan = await sendRysmoRenewalNotices(db, fauxEnv());
    expect(bilan).toEqual({ examines: 1, envoyes: 0, echecs: 1 });
  });

  it('écrit dans la langue du profil, lue en une seule fois', async () => {
    const { db } = fauxDb([echeant], { u0: { preferences: { language: 'en' } } });
    const env = fauxEnv();
    await sendRysmoRenewalNotices(db, env);

    const send = (env.EMAIL as unknown as { send: ReturnType<typeof vi.fn> }).send;
    expect(send.mock.calls[0][0].subject).toContain('ends in');
    expect(send.mock.calls[0][0].html).toContain('/en/my-learning/tutor');
    // Une lecture groupée, pas un `get` par abonnement.
    expect((db.getAll as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('retombe sur le français quand le profil est absent', async () => {
    const { db } = fauxDb([echeant]);
    const env = fauxEnv();
    await sendRysmoRenewalNotices(db, env);
    const send = (env.EMAIL as unknown as { send: ReturnType<typeof vi.fn> }).send;
    expect(send.mock.calls[0][0].html).toContain('/mon-espace/repetiteur');
  });

  it('ne lit pas les profils quand personne n’est à échéance', async () => {
    const { db } = fauxDb([{ ...echeant, expiresAt: dans(20) }]);
    await sendRysmoRenewalNotices(db, fauxEnv());
    expect((db.getAll as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('parcourt la collection page par page', async () => {
    const lot = Array.from({ length: 5 }, (_, i) => ({
      ...echeant,
      userId: `u${i}`,
      userEmail: `p${i}@exemple.sn`,
    }));
    const { db, pagesLues } = fauxDb(lot, {}, 2);
    const bilan = await sendRysmoRenewalNotices(db, fauxEnv());
    expect(bilan.envoyes).toBe(5);
    expect(pagesLues).toEqual([2, 2, 1]);
  });
});
