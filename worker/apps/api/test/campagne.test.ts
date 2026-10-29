import { afterEach, describe, expect, it, vi } from 'vitest';

import { controlerVoix, executerCampagne, validerDemande, type DemandeCampagne } from '../src/lib/campagne';
import { handleMarketing } from '../src/marketingRoute';
import { handleUnsubscribe } from '../src/unsubscribeRoute';
import { signerAdresse } from '../src/lib/unsubscribe';
import type { Env } from '../src/env';
import { fauxBrevo } from './helpers/faux-brevo';
import { fauxFirestore } from './helpers/faux-firestore';

/**
 * LA CAMPAGNE : ce qui ne doit JAMAIS arriver.
 *
 * Écrire à quelqu'un qui n'a pas consenti, écrire deux fois à la même personne, envoyer à
 * toute la liste un contenu que personne n'a relu, ou laisser la route ouverte faute de clé.
 * Chacun de ces défauts « marche » — l'envoi réussit — et ne se voit qu'en réclamation.
 *
 * Le transport est BREVO : le faux binding Cloudflare `EMAIL` est présent dans chaque
 * environnement, et chaque test vérifie qu'il n'a RIEN reçu — aucun marketing par Cloudflare.
 */

afterEach(() => { vi.unstubAllGlobals(); });

type Envoye = { to: string; from: { email: string }; subject: string; html: string; text: string; headers?: Record<string, string> };

function environnement(extra: Partial<Env> = {}) {
  const envoyes: Envoye[] = [];
  const env = {
    EXPORT_SIGNING_KEY: 'clef',
    API_BASE_URL: 'https://api.maxmorrys.me',
    EMAIL_FROM: 'facture@mail.maxmorrys.me',
    EMAIL_FROM_NAME: 'Max-Morrys',
    BREVO_API_KEY: 'xkeysib-test',
    BREVO_LIST_ID: '4',
    BREVO_SENDER_EMAIL: 'lettre@lettre.maxmorrys.me',
    MARKETING_TEST_TO: 'test@maxmorrys.me, relecture@maxmorrys.me',
    MARKETING_API_KEY: 'k'.repeat(48),
    EMAIL: { send: vi.fn(async (m: Envoye) => { envoyes.push(m); return {}; }) },
    ...extra,
  } as unknown as Env;
  return { env, envoyes };
}

const corps = (extra: Record<string, unknown> = {}) => ({
  id: 'lettre-2026-11-05',
  objet: 'Vendre sans site, d’abord',
  preheader: 'Trois choses, cinq minutes de lecture.',
  langue: 'fr',
  mode: 'test',
  blocs: [
    { type: 'titre', texte: 'Vendre sans site, d’abord.' },
    { type: 'paragraphe', texte: 'Bonjour,' },
    { type: 'paragraphe', texte: 'Ces deux semaines, j’ai publié un guide sur le catalogue WhatsApp.' },
    { type: 'bouton', libelle: 'Lire le guide', url: 'https://maxmorrys.me/blog/catalogue-whatsapp' },
  ],
  ...extra,
});

function demande(extra: Record<string, unknown> = {}): DemandeCampagne {
  const v = validerDemande(corps(extra));
  if (!v.ok) throw new Error(v.erreurs.join(' | '));
  return v.demande;
}

/** L'audience de référence : deux FR consentants, un EN, un retiré, un membre du personnel, un sans consentement. */
const BASE = {
  'newsletter/n1': { email: 'awa@example.com', consent: true, locale: 'fr' },
  'newsletter/n2': { email: 'Moussa@Example.com', consent: true, locale: 'fr' },
  'newsletter/n3': { email: 'john@example.com', consent: true, locale: 'en' },
  'newsletter/n4': { email: 'parti@example.com', consent: true, locale: 'fr', unsubscribedAt: '2026-10-01T00:00:00Z' },
  'users/u4': { email: 'parti@example.com', role: 'student', preferences: { newsletter: true } },
  'users/u5': { email: 'fatou@example.com', role: 'student', firstName: 'Fatou', preferences: { newsletter: true } },
  'users/a1': { email: 'admin@maxmorrys.me', role: 'admin', preferences: { newsletter: true } },
  'users/u6': { email: 'silence@example.com', role: 'student', preferences: {} },
};

describe('la validation', () => {
  it('accepte une campagne en blocs', () => {
    expect(validerDemande(corps()).ok).toBe(true);
  });

  it.each([
    ['un document HTML complet', { blocs: undefined, html: '<html><body>x</body></html>', texte: 'x' }, /fragment attendu/],
    ['un script', { blocs: undefined, html: '<p>x</p><script>alert(1)</script>', texte: 'x' }, /balise interdite/],
    ['un gestionnaire d’événement', { blocs: undefined, html: '<p onclick="x()">x</p>', texte: 'x' }, /événement/],
    ['un lien http', { blocs: undefined, html: '<a href="http://x.com">x</a>', texte: 'x' }, /HTTPS/],
    ['du HTML sans texte', { blocs: undefined, html: '<p>x</p>' }, /texte : version texte obligatoire/],
    ['deux boutons', { blocs: [{ type: 'bouton', libelle: 'Un', url: 'https://a.b' }, { type: 'bouton', libelle: 'Deux', url: 'https://a.b' }] }, /un seul bouton/],
    ['un bouton en capitales', { blocs: [{ type: 'bouton', libelle: 'LIRE LE GUIDE', url: 'https://a.b' }] }, /casse de phrase/],
    ['un id instable', { id: 'Ma Lettre!' }, /^id/],
    ['un mode inconnu', { mode: 'envoyer' }, /^mode/],
  ])('refuse %s', (_cas, extra, motif) => {
    const v = validerDemande(corps(extra as Record<string, unknown>));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.erreurs.some((e) => motif.test(e))).toBe(true);
  });

  it.each([
    ['une promesse de remboursement', 'Satisfait ou remboursé sous 14 jours.'],
    ['une garantie', 'Résultat garanti.'],
    ['un emoji', 'On y va 🚀'],
    ['une variable non remplie', 'Bonjour {{ prenom }},'],
    ['un texte provisoire', '[à écrire]'],
  ])('refuse dans la voix : %s', (_cas, phrase) => {
    const v = validerDemande(corps({ blocs: [{ type: 'paragraphe', texte: phrase }] }));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.erreurs.join(' ')).toMatch(/^voix|voix :/);
  });

  it('laisse passer la négation du prélèvement — le dire n’est pas le promettre', () => {
    expect(controlerVoix(['Wave et Orange Money ne permettent pas le prélèvement automatique.'])).toEqual([]);
  });
});

describe('la route', () => {
  const requete = (cle: string | null, body: unknown = corps()) =>
    new Request('https://api.maxmorrys.me/marketing/campagne', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cle ? { 'X-Marketing-Key': cle } : {}) },
      body: JSON.stringify(body),
    });

  it('est fermée (503) tant que le secret n’est pas posé', async () => {
    const { env } = environnement({ MARKETING_API_KEY: undefined });
    expect((await handleMarketing(requete('nimporte'), env)).status).toBe(503);
  });

  it('refuse sans clé ou avec une mauvaise clé (401)', async () => {
    const { env, envoyes } = environnement();
    fauxBrevo();
    expect((await handleMarketing(requete(null), env)).status).toBe(401);
    expect((await handleMarketing(requete('mauvaise'), env)).status).toBe(401);
    expect(envoyes).toHaveLength(0);
  });

  it('refuse un GET (405) et un corps invalide (400, avec les raisons)', async () => {
    const { env } = environnement();
    expect((await handleMarketing(new Request('https://api.maxmorrys.me/marketing/campagne'), env)).status).toBe(405);
    const r = await handleMarketing(requete('k'.repeat(48), { id: 'x' }), env);
    expect(r.status).toBe(400);
    const json = (await r.json()) as { erreurs: string[] };
    expect(json.erreurs.length).toBeGreaterThan(2);
  });
});

describe('le mode test (épreuve par l’envoi unitaire Brevo)', () => {
  it('envoie à l’adresse de test par défaut, objet préfixé, et enregistre l’empreinte', async () => {
    const { env, envoyes } = environnement();
    const brevo = fauxBrevo();
    const { db, docs } = fauxFirestore(BASE);
    const b = await executerCampagne(db, env, demande());
    expect(b).toMatchObject({ ok: true, mode: 'test', envoyeA: 'test@maxmorrys.me', envoye: true, audiencePrevue: 3 });
    expect(brevo.unitaires).toHaveLength(1);
    const u = brevo.unitaires[0] as { to: Array<{ email: string }>; sender: { email: string }; subject: string; htmlContent: string; textContent: string; headers: Record<string, string> };
    expect(u.to).toEqual([{ email: 'test@maxmorrys.me' }]);
    expect(u.subject).toBe('[TEST] Vendre sans site, d’abord');
    expect(u.sender.email).toBe('lettre@lettre.maxmorrys.me');
    expect(u.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(u.htmlContent).toContain('MY ONOMA SARL');
    expect(u.textContent).toContain('/desabonnement?e=test%40maxmorrys.me');
    expect(docs.get('campaigns/lettre-2026-11-05')?.empreinteTestee).toMatch(/^[0-9a-f]{64}$/);
    expect(envoyes).toHaveLength(0); // rien par Cloudflare
    expect(brevo.campagnesEnvoyees).toHaveLength(0); // une épreuve n'est pas une campagne
  });

  it('marche sans l’accord — c’est précisément son rôle', async () => {
    const { env } = environnement({ MARKETING_ENVOI_REEL: 'non' });
    const brevo = fauxBrevo();
    const b = await executerCampagne(fauxFirestore().db, env, demande());
    expect(b.ok).toBe(true);
    expect(brevo.unitaires).toHaveLength(1);
  });

  it('exige Brevo configuré (503 nonConfigure), et ne se rabat JAMAIS sur Cloudflare', async () => {
    for (const manque of ['BREVO_API_KEY', 'BREVO_LIST_ID', 'BREVO_SENDER_EMAIL'] as const) {
      const { env, envoyes } = environnement({ [manque]: undefined });
      const brevo = fauxBrevo();
      expect(await executerCampagne(fauxFirestore(BASE).db, env, demande())).toMatchObject({ ok: false, erreur: 'nonConfigure' });
      expect(envoyes).toHaveLength(0);
      expect(brevo.appels).toHaveLength(0);
    }
  });

  it('refuse une adresse de test hors liste — sinon la route enverrait n’importe où', async () => {
    const { env } = environnement();
    const brevo = fauxBrevo();
    const b = await executerCampagne(fauxFirestore().db, env, demande({ adresseTest: 'inconnu@example.com' }));
    expect(b).toMatchObject({ ok: false, erreur: 'adresseTestNonAutorisee' });
    expect(brevo.appels).toHaveLength(0);
  });

  it('accepte la seconde adresse de la liste', async () => {
    const { env } = environnement();
    const brevo = fauxBrevo();
    await executerCampagne(fauxFirestore().db, env, demande({ adresseTest: 'RELECTURE@maxmorrys.me' }));
    expect((brevo.unitaires[0] as { to: Array<{ email: string }> }).to[0].email).toBe('relecture@maxmorrys.me');
  });

  it('n’enregistre pas l’empreinte si Brevo a refusé l’épreuve', async () => {
    const { env } = environnement({ MARKETING_ENVOI_REEL: 'oui' });
    const brevo = fauxBrevo();
    brevo.pannes.set('POST /smtp/email', 400);
    const { db } = fauxFirestore(BASE);
    expect(await executerCampagne(db, env, demande())).toMatchObject({ ok: true, envoye: false });
    brevo.pannes.clear();
    expect(await executerCampagne(db, env, demande({ mode: 'reel' }))).toMatchObject({ ok: false, erreur: 'testRequis' });
  });
});

describe('le mode réel (campagnes Brevo)', () => {
  const ouvert = { MARKETING_ENVOI_REEL: 'oui' } as Partial<Env>;

  /** Teste puis renvoie un état prêt pour le réel. */
  async function pret(extraEnv: Partial<Env> = {}, extra: Record<string, unknown> = {}, base: Record<string, Record<string, unknown>> = BASE, brevoInitial?: Parameters<typeof fauxBrevo>[0]) {
    const { env, envoyes } = environnement({ ...ouvert, ...extraEnv });
    const brevo = fauxBrevo(brevoInitial);
    const { db, docs } = fauxFirestore(base);
    await executerCampagne(db, env, demande(extra));
    brevo.unitaires.length = 0;
    return { env, envoyes, brevo, db, docs };
  }

  it('est refusé sans l’accord (403 canalFerme), même Brevo configuré', async () => {
    const { env, envoyes } = environnement();
    const brevo = fauxBrevo();
    const b = await executerCampagne(fauxFirestore(BASE).db, env, demande({ mode: 'reel' }));
    expect(b).toMatchObject({ ok: false, erreur: 'canalFerme' });
    expect(envoyes).toHaveLength(0);
    expect(brevo.appels).toHaveLength(0);
  });

  it('exige que CE contenu exact ait été testé', async () => {
    const { env, brevo, db } = await pret();
    const modifie = demande({ mode: 'reel', objet: 'Un autre objet, après le test' });
    expect(await executerCampagne(db, env, modifie)).toMatchObject({ ok: false, erreur: 'testRequis' });
    expect(brevo.campagnesEnvoyees).toHaveLength(0);
    expect(await executerCampagne(fauxFirestore(BASE).db, env, demande({ mode: 'reel' }))).toMatchObject({ ok: false, erreur: 'testRequis' });
  });

  it('crée une liste et une campagne Brevo pour le lot, avec NOS gabarits et le retrait Brevo', async () => {
    const { env, envoyes, brevo, db, docs } = await pret();
    const b = await executerCampagne(db, env, demande({ mode: 'reel' }));
    expect(b).toMatchObject({ ok: true, mode: 'reel', audience: 3, envoyes: 3, echecs: 0, restants: 0, statut: 'terminee', retraitsRepris: 0 });
    expect(brevo.campagnesEnvoyees).toHaveLength(1);
    const c = brevo.campagnesEnvoyees[0];
    expect(c.destinataires).toEqual(['awa@example.com', 'fatou@example.com', 'moussa@example.com']);
    expect(c.subject).toBe('Vendre sans site, d’abord');
    expect(c.html).toContain('MY ONOMA SARL'); // l'enveloppe du design system
    expect(c.html).toContain('href="{{ unsubscribe }}"'); // le retrait géré par Brevo
    expect(c.html).not.toContain('/desabonnement?e='); // pas de lien signé nominatif dans une campagne
    const corps = brevo.campagnes.get(c.id) as { sender: { email: string }; previewText: string; recipients: { listIds: number[] } };
    expect(corps.sender.email).toBe('lettre@lettre.maxmorrys.me');
    expect(corps.previewText).toBe('Trois choses, cinq minutes de lecture.');
    expect(corps.recipients.listIds).not.toContain(4); // jamais la liste principale entière
    expect(envoyes).toHaveLength(0); // rien par Cloudflare
    expect([...docs.keys()].filter((k) => k.startsWith('campaign_sends/'))).toHaveLength(3);
    expect(docs.get('campaigns/lettre-2026-11-05')).toMatchObject({ statut: 'terminee', derniereCampagneBrevo: c.id });
  });

  it('respecte le segment et la liste d’identifiants', async () => {
    const a = await pret({}, { segment: 'comptes' });
    await executerCampagne(a.db, a.env, demande({ mode: 'reel', segment: 'comptes' }));
    expect(a.brevo.campagnesEnvoyees[0].destinataires).toEqual(['fatou@example.com']);

    const b = await pret({}, { ids: ['n2'] });
    await executerCampagne(b.db, b.env, demande({ mode: 'reel', ids: ['n2'] }));
    expect(b.brevo.campagnesEnvoyees[0].destinataires).toEqual(['moussa@example.com']);
  });

  it('procède par lots — une campagne Brevo par lot — et n’écrit JAMAIS deux fois', async () => {
    const { env, brevo, db } = await pret({}, { taille: 2 });
    const lot1 = await executerCampagne(db, env, demande({ mode: 'reel', taille: 2 }));
    expect(lot1).toMatchObject({ envoyes: 2, restants: 1, statut: 'enCours' });
    const lot2 = await executerCampagne(db, env, demande({ mode: 'reel', taille: 2 }));
    expect(lot2).toMatchObject({ envoyes: 1, restants: 0, statut: 'terminee', dejaTraites: 2 });
    const rejeu = await executerCampagne(db, env, demande({ mode: 'reel', taille: 2 }));
    expect(rejeu).toMatchObject({ envoyes: 0, restants: 0 });

    expect(brevo.campagnesEnvoyees).toHaveLength(2);
    const tous = brevo.campagnesEnvoyees.flatMap((c) => c.destinataires);
    expect(new Set(tous).size).toBe(tous.length);
    expect(tous).toHaveLength(3);
  });

  it('s’arrête au plafond du jour, épreuve comprise (Brevo compte tout)', async () => {
    // Plafond 3 : l'épreuve en consomme 1, le lot en obtient 2 sur 3.
    const { env, brevo, db } = await pret({ MARKETING_PLAFOND_JOUR: '3' });
    const b = await executerCampagne(db, env, demande({ mode: 'reel' }));
    expect(b).toMatchObject({ envoyes: 2, restants: 1, plafondAtteint: true });
    expect(brevo.campagnesEnvoyees[0].destinataires).toHaveLength(2);
    const suite = await executerCampagne(db, env, demande({ mode: 'reel' }));
    expect(suite).toMatchObject({ envoyes: 0, restants: 1, plafondAtteint: true });
    expect(brevo.campagnesEnvoyees).toHaveLength(1);
  });

  it('plafond par défaut : 300 par jour', async () => {
    const { env, db, docs } = await pret({ MARKETING_PLAFOND_JOUR: undefined });
    await executerCampagne(db, env, demande({ mode: 'reel' }));
    const quota = [...docs.entries()].find(([k]) => k.startsWith('_ratelimits/marketing_jour_'))?.[1];
    expect(quota?.count).toBe(4); // 1 épreuve + 3 destinataires, sur 300
  });

  it('fait remonter un retrait fait chez Brevo AVANT d’envoyer, et l’écrit dans Firestore', async () => {
    const { env, brevo, db, docs } = await pret({}, {}, BASE, {
      contacts: [{ email: 'awa@example.com', bloque: true }, { email: 'fatou@example.com', desinscrit: [4] }],
    });
    const b = await executerCampagne(db, env, demande({ mode: 'reel' }));
    expect(b).toMatchObject({ ok: true, retraitsRepris: 2, audience: 1, envoyes: 1 });
    expect(brevo.campagnesEnvoyees[0].destinataires).toEqual(['moussa@example.com']);
    expect(docs.get('newsletter/n1')?.unsubscribedAt).toBeTruthy();
    expect((docs.get('users/u5')?.preferences as Record<string, unknown>).newsletter).toBe(false);
    expect([...docs.keys()].filter((k) => k.startsWith('brevo_retraits/'))).toHaveLength(2);
  });

  it('n’envoie RIEN si Brevo est illisible — on n’écrit pas sans connaître ses retraits', async () => {
    const { env, brevo, db, docs } = await pret();
    brevo.pannes.set('GET /contacts/lists/4/contacts', 500);
    expect(await executerCampagne(db, env, demande({ mode: 'reel' }))).toMatchObject({ ok: false, erreur: 'brevoIndisponible' });
    expect(brevo.campagnesEnvoyees).toHaveLength(0);
    expect([...docs.keys()].filter((k) => k.startsWith('campaign_sends/'))).toHaveLength(0);
  });

  it('Brevo refuse l’envoi : traces effacées, quota rendu, le même appel reprend le lot', async () => {
    const { env, brevo, db, docs } = await pret();
    brevo.pannes.set('POST /emailCampaigns', 400);
    expect(await executerCampagne(db, env, demande({ mode: 'reel' }))).toMatchObject({ ok: false, erreur: 'brevoIndisponible' });
    expect([...docs.keys()].filter((k) => k.startsWith('campaign_sends/'))).toHaveLength(0);
    const quota = [...docs.entries()].find(([k]) => k.startsWith('_ratelimits/marketing_jour_'))?.[1];
    expect(quota?.count).toBe(1); // seule l'épreuve reste comptée

    brevo.pannes.clear();
    expect(await executerCampagne(db, env, demande({ mode: 'reel' }))).toMatchObject({ envoyes: 3, restants: 0 });
    expect(brevo.campagnesEnvoyees).toHaveLength(1);
  });

  it('issue inconnue (coupure pendant sendNow) : marqué échec, JAMAIS retenté', async () => {
    const { env, brevo, db, docs } = await pret();
    brevo.pannes.set('POST /emailCampaigns/', 'reseau'); // ne touche que …/{id}/sendNow
    const b = await executerCampagne(db, env, demande({ mode: 'reel' }));
    expect(b).toMatchObject({ ok: true, envoyes: 0, echecs: 3, restants: 0 });
    const traces = [...docs.entries()].filter(([k]) => k.startsWith('campaign_sends/')).map(([, v]) => v);
    expect(traces.every((t) => t.statut === 'echec')).toBe(true);
    brevo.pannes.clear();
    expect(await executerCampagne(db, env, demande({ mode: 'reel' }))).toMatchObject({ envoyes: 0, restants: 0 });
  });

  it('un contact refusé par Brevo est un échec isolé, les autres partent', async () => {
    const { env, brevo, db } = await pret();
    const vrai = brevo.fetch.getMockImplementation()!;
    brevo.fetch.mockImplementation(async (u, init = {}) => {
      if (String(init.body ?? '').includes('"email":"moussa@example.com"')) return new Response('{"code":"invalid_parameter"}', { status: 400 });
      return vrai(u, init);
    });
    const b = await executerCampagne(db, env, demande({ mode: 'reel' }));
    expect(b).toMatchObject({ envoyes: 2, echecs: 1, restants: 0 });
    expect(brevo.campagnesEnvoyees[0].destinataires).toEqual(['awa@example.com', 'fatou@example.com']);
  });
});

describe('le retrait en un clic (RFC 8058)', () => {
  it('répond 200 au POST signé, 400 au POST mal signé', async () => {
    const { env } = environnement();
    const s = await signerAdresse(env, 'awa@example.com');
    const ok = await handleUnsubscribe(new Request(`https://api.maxmorrys.me/desabonnement?e=awa%40example.com&s=${s}&l=fr`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    }), env);
    expect(ok.status).toBe(200);

    const ko = await handleUnsubscribe(new Request(`https://api.maxmorrys.me/desabonnement?e=awa%40example.com&s=${'0'.repeat(64)}`, { method: 'POST', body: 'List-Unsubscribe=One-Click' }), env);
    expect(ko.status).toBe(400);
  });
});
