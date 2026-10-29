import { vi } from 'vitest';

/**
 * UN BREVO EN MÉMOIRE — juste les routes que le Worker appelle.
 *
 * Remplace `fetch` (vi.stubGlobal) : tout appel à une autre origine que `api.brevo.com` fait
 * échouer le test, et chaque appel est journalisé. `campagnesEnvoyees` rend, pour chaque
 * `sendNow`, les destinataires que Brevo aurait réellement servis : membres de la liste du lot,
 * hors liste noire — c'est ce que les tests comparent.
 *
 * `pannes` : un chemin (préfixe « MÉTHODE /chemin ») → statut HTTP à rendre, ou `'reseau'`
 * pour simuler une coupure (fetch qui lève).
 */
interface Contact { email: string; bloque: boolean; listes: Set<number>; desinscrit: Set<number> }

export function fauxBrevo(initial: { contacts?: Array<{ email: string; bloque?: boolean; listes?: number[]; desinscrit?: number[] }> } = {}) {
  const contacts = new Map<string, Contact>();
  for (const c of initial.contacts ?? []) {
    contacts.set(c.email, { email: c.email, bloque: Boolean(c.bloque), listes: new Set(c.listes ?? [4]), desinscrit: new Set(c.desinscrit ?? []) });
  }
  const listes = new Map<number, { name: string; folderId: number }>([[4, { name: 'Lettre — apprenants', folderId: 1 }]]);
  const campagnes = new Map<number, Record<string, unknown>>();
  const campagnesEnvoyees: Array<{ id: number; subject: string; html: string; destinataires: string[] }> = [];
  const unitaires: Array<Record<string, unknown>> = [];
  const appels: Array<{ methode: string; chemin: string; corps: unknown }> = [];
  const pannes = new Map<string, number | 'reseau'>();
  let prochainId = 100;

  const rep = (status: number, corps?: unknown) =>
    new Response(status === 204 ? null : JSON.stringify(corps ?? {}), { status, headers: { 'content-type': 'application/json' } });

  const fetchFaux = vi.fn(async (entree: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof entree === 'string' ? entree : entree instanceof URL ? entree.href : entree.url);
    if (url.origin !== 'https://api.brevo.com') throw new Error(`appel réseau inattendu : ${url.href}`);
    const methode = (init.method ?? 'GET').toUpperCase();
    const chemin = url.pathname.replace(/^\/v3/, '');
    const corps = init.body ? JSON.parse(String(init.body)) : undefined;
    appels.push({ methode, chemin, corps });

    for (const [prefixe, issue] of pannes) {
      if (`${methode} ${chemin}`.startsWith(prefixe)) {
        if (issue === 'reseau') throw new Error('connexion interrompue');
        return rep(issue, { code: 'panne', message: 'panne simulée' });
      }
    }

    let m: RegExpMatchArray | null;
    if (methode === 'GET' && (m = chemin.match(/^\/contacts\/lists\/(\d+)\/contacts$/))) {
      const id = Number(m[1]);
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const limit = Number(url.searchParams.get('limit') ?? 50);
      const membres = [...contacts.values()].filter((c) => c.listes.has(id));
      return rep(200, {
        count: membres.length,
        contacts: membres.slice(offset, offset + limit).map((c) => ({
          email: c.email, emailBlacklisted: c.bloque, listIds: [...c.listes], listUnsubscribed: [...c.desinscrit],
        })),
      });
    }
    if (methode === 'GET' && (m = chemin.match(/^\/contacts\/lists\/(\d+)$/))) {
      const l = listes.get(Number(m[1]));
      return l ? rep(200, { id: Number(m[1]), ...l }) : rep(404, { code: 'document_not_found' });
    }
    if (methode === 'POST' && chemin === '/contacts/lists') {
      const id = prochainId++;
      listes.set(id, { name: corps.name, folderId: corps.folderId });
      return rep(201, { id });
    }
    if (methode === 'POST' && chemin === '/contacts') {
      const email = String(corps.email).toLowerCase();
      const c = contacts.get(email) ?? { email, bloque: false, listes: new Set<number>(), desinscrit: new Set<number>() };
      for (const l of corps.listIds ?? []) c.listes.add(Number(l));
      if (typeof corps.emailBlacklisted === 'boolean') c.bloque = corps.emailBlacklisted;
      const existait = contacts.has(email);
      contacts.set(email, c);
      return existait ? rep(204) : rep(201, { id: prochainId++ });
    }
    if (methode === 'POST' && chemin === '/emailCampaigns') {
      const id = prochainId++;
      campagnes.set(id, corps);
      return rep(201, { id });
    }
    if (methode === 'POST' && (m = chemin.match(/^\/emailCampaigns\/(\d+)\/sendNow$/))) {
      const id = Number(m[1]);
      const c = campagnes.get(id);
      if (!c) return rep(404, {});
      const listIds = ((c.recipients as { listIds: number[] }).listIds ?? []).map(Number);
      const destinataires = [...contacts.values()]
        .filter((x) => !x.bloque && listIds.some((l) => x.listes.has(l) && !x.desinscrit.has(l)))
        .map((x) => x.email)
        .sort();
      campagnesEnvoyees.push({ id, subject: String(c.subject), html: String(c.htmlContent), destinataires });
      return rep(204);
    }
    if (methode === 'POST' && chemin === '/smtp/email') {
      unitaires.push(corps);
      return rep(201, { messageId: `<${prochainId++}@brevo>` });
    }
    return rep(404, { code: 'route_inconnue', message: `${methode} ${chemin}` });
  });

  vi.stubGlobal('fetch', fetchFaux);
  return { fetch: fetchFaux, contacts, listes, campagnes, campagnesEnvoyees, unitaires, appels, pannes };
}

/** Un `fetch` qui fait échouer le test s'il est appelé : rien ne doit sortir vers un tiers. */
export function aucunAppelReseau() {
  const f = vi.fn(async (entree: unknown) => { throw new Error(`appel réseau interdit : ${String(entree)}`); });
  vi.stubGlobal('fetch', f);
  return f;
}
