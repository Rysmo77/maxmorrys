/**
 * L'AUDIENCE MARKETING — qui peut recevoir la lettre, et rien qu'eux.
 *
 * La règle d'éligibilité de la synchronisation Brevo, lue À L'ENVOI dans Firestore, qui reste
 * la SOURCE : Brevo ne reçoit que des copies (`brevo-contacts.ts`), et ses retraits remontent
 * ici avant chaque campagne. La preuve du consentement (`newsletter.consentAt`) ne quitte pas
 * Firestore.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️ CE QUI N'EST JAMAIS UNE AUDIENCE
 *
 * Sept collections portent des adresses e-mail. DEUX recueillent un consentement marketing :
 * `newsletter` (case cochée, horodatée, exigée par `firestore.rules`) et
 * `users.preferences.newsletter === true` (opt-in strict : `undefined` vaut NON).
 * Les cinq autres sont exclues définitivement :
 *   · `appointments`, `messages` — l'adresse sert à répondre, pas à démarcher ;
 *   · `agency_leads`, `engagement_leads` — aucun consentement collecté ;
 *   · `transactions`, `club_subscriptions` — un achat n'est pas un consentement ;
 *   · `waitlist` — engagement opposable de `waitlist-mail.ts` : « Un seul e-mail, le jour de
 *     l'ouverture. Pas de lettre, pas de relance. »
 * `notifyOnPublish` n'en est pas une non plus : c'est une notification DANS l'application,
 * pas un accord pour recevoir des e-mails.
 */
import type { Firestore } from '@mm/firestore-rest';

import { normaliserAdresse } from './unsubscribe';

export type Segment = 'lettre' | 'comptes' | 'sans-compte';
export const SEGMENTS: readonly Segment[] = ['lettre', 'comptes', 'sans-compte'];

export interface Destinataire {
  email: string;
  prenom: string;
  langue: 'fr' | 'en';
  /** Porte un compte ayant coché la préférence. */
  compte: boolean;
  /** Identifiants des documents d'origine : `users/{uid}` et/ou `newsletter/{id}`. */
  ids: string[];
}

function dernierSegment(path: string): string {
  return path.split('/').pop() ?? path;
}

/**
 * Rassemble les adresses réellement démarchables, DÉDUPLIQUÉES par adresse normalisée.
 *
 * Un retrait l'emporte toujours : une adresse dont UN document `newsletter` porte
 * `unsubscribedAt` est exclue, même si un compte dit encore oui — même règle que
 * `aConsenti`. Le personnel (`admin`, `support`) n'est jamais une audience.
 */
export async function rassemblerAudience(db: Firestore): Promise<Destinataire[]> {
  return (await lireAudience(db)).audience;
}

/**
 * L'audience ET les adresses retirées. Les retirées servent à la synchronisation Brevo
 * (`brevo-contacts.ts`) : une adresse retirée chez nous que Brevo connaît encore doit y être
 * mise en liste noire, sans quoi une campagne lancée depuis l'interface de Brevo l'atteindrait.
 */
export async function lireAudience(db: Firestore): Promise<{ audience: Destinataire[]; retires: string[] }> {
  const parAdresse = new Map<string, Destinataire>();
  const retires = new Set<string>();

  const abonnes = await db.query({ collection: 'newsletter', where: [{ field: 'consent', op: '==', value: true }] });
  for (const a of abonnes) {
    const email = normaliserAdresse(String(a.data.email ?? ''));
    if (!email.includes('@')) continue;
    if (a.data.unsubscribedAt) { retires.add(email); continue; }
    const deja = parAdresse.get(email);
    if (deja) { deja.ids.push(dernierSegment(a.path)); continue; }
    parAdresse.set(email, {
      email,
      prenom: '',
      langue: a.data.locale === 'en' ? 'en' : 'fr',
      compte: false,
      ids: [dernierSegment(a.path)],
    });
  }

  const comptes = await db.query({ collection: 'users', where: [{ field: 'preferences.newsletter', op: '==', value: true }] });
  for (const u of comptes) {
    const email = normaliserAdresse(String(u.data.email ?? ''));
    if (!email.includes('@')) continue;
    if (String(u.data.role ?? 'student') !== 'student') continue;

    const prefs = (u.data.preferences ?? {}) as Record<string, unknown>;
    const deja = parAdresse.get(email);
    // La version du compte l'emporte : elle porte un prénom et une langue choisie.
    parAdresse.set(email, {
      email,
      prenom: String(u.data.firstName ?? u.data.displayName ?? '').trim(),
      langue: prefs.language === 'en' ? 'en' : 'fr',
      compte: true,
      ids: [dernierSegment(u.path), ...(deja?.ids ?? [])],
    });
  }

  /*
   * Un compte dont la préférence est retombée à `false` n'apparaît dans aucune des deux
   * requêtes : il n'est ni audience ni « retiré » ici. C'est voulu — la synchronisation ne
   * pousse que ce que la base affirme explicitement.
   */
  for (const email of retires) parAdresse.delete(email);
  return {
    audience: [...parAdresse.values()].sort((a, b) => a.email.localeCompare(b.email)),
    retires: [...retires].sort(),
  };
}

/** Filtre l'audience sur un segment, une langue, et facultativement une liste d'identifiants. */
export function filtrerAudience(
  audience: Destinataire[],
  critere: { segment: Segment; langue: 'fr' | 'en'; ids?: string[] },
): Destinataire[] {
  const ids = critere.ids?.length ? new Set(critere.ids) : null;
  return audience.filter((d) => {
    if (d.langue !== critere.langue) return false;
    if (critere.segment === 'comptes' && !d.compte) return false;
    if (critere.segment === 'sans-compte' && d.compte) return false;
    if (ids && !d.ids.some((id) => ids.has(id))) return false;
    return true;
  });
}
