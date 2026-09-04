/**
 * LES DEUX PASSES DE CYCLE DE VIE — bienvenue et panier abandonné.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI DES PASSES ET NON DES DÉCLENCHEURS
 *
 * La création de compte se fait par DEUX chemins : `creerMonProfil` pour l'application
 * native, et `AuthContext.signUp` côté web, qui écrit `users/{uid}` directement depuis le
 * navigateur. Brancher un envoi sur le seul chemin serveur laisserait la moitié des inscrits
 * sans bienvenue, et le défaut serait invisible — les deux moitiés fonctionnent, l'une est
 * simplement muette.
 *
 * Une passe qui balaie `users` couvre les deux, sans toucher au client. Le prix est la
 * LATENCE : la bienvenue part au prochain cron de 08:00, donc entre 0 et 24 heures après
 * l'inscription. C'est un compromis assumé — un envoi immédiat exigerait une callable appelée
 * depuis `AuthContext`, ce qui est un chantier côté web.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'IDEMPOTENCE PORTE UNE DATE, JAMAIS UN BOOLÉEN
 *
 * `welcomeSentAt` et `cartReminderSentAt` sont des horodatages. Un booléen dirait « déjà
 * envoyé » sans dire quand, et interdirait de rejouer une passe après correction d'un
 * gabarit. C'est le même choix que `renewalNoticeFor` pour les rappels d'échéance.
 */
import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { envoyerModele, type Langue } from './brevo-send';
import { asText, toNumber } from './values';

/** Plafond par passe. Le même que les autres travaux du cron. */
const PAGE = 500;

export interface BilanPasse {
  examines: number;
  envoyes: number;
  ignores: number;
  echecs: number;
}

const vide = (): BilanPasse => ({ examines: 0, envoyes: 0, ignores: 0, echecs: 0 });

/** Le nombre de jours entiers écoulés depuis une date ISO. */
function joursDepuis(iso: unknown, maintenant: Date): number | null {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const jour = (x: Date) => Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  return Math.round((jour(maintenant) - jour(d)) / 86_400_000);
}

function langueDe(profil: { data: Record<string, unknown> } | null): Langue {
  const prefs = (profil?.data.preferences ?? {}) as { language?: string };
  return prefs.language === 'en' ? 'en' : 'fr';
}

/**
 * LA BIENVENUE — un seul courrier, le premier.
 *
 * Les deux suivants (J+2, J+5) sont MARKETING : ils exigent un consentement que personne n'a
 * à l'inscription. Les envoyer d'office transformerait une bienvenue en séquence commerciale
 * non sollicitée. Ils partiront quand quelqu'un cochera la case — pas avant.
 */
export async function envoyerBienvenues(
  db: Firestore,
  env: Env,
  maintenant = new Date(),
): Promise<BilanPasse> {
  const bilan = vide();

  const comptes = await db.query({
    collection: 'users',
    where: [{ field: 'role', op: '==', value: 'student' }],
    limit: PAGE,
  });

  for (const compte of comptes) {
    const d = compte.data;
    if (d.welcomeSentAt) continue;

    const age = joursDepuis(d.createdAt, maintenant);
    /*
      FENÊTRE DE DEUX JOURS. Sans borne haute, la première exécution écrirait à TOUS les
      comptes jamais créés — des gens inscrits il y a des mois recevraient « bienvenue »,
      ce qui est le meilleur moyen de se faire signaler comme spam au premier envoi.
    */
    if (age === null || age > 2) continue;
    bilan.examines += 1;

    const destinataire = asText(d.email) ?? '';
    if (!destinataire) { bilan.ignores += 1; continue; }

    const envoi = await envoyerModele(env, {
      modele: 'bienvenue1',
      to: destinataire,
      langue: langueDe(compte),
      params: {
        prenom: asText(d.firstName) ?? asText(d.displayName) ?? '',
        lien: `${env.APP_BASE_URL}${langueDe(compte) === 'fr' ? '/mon-espace' : '/en/my-learning'}`,
      },
    });

    if (envoi.issue === 'envoye') {
      await db.update(compte.path, { welcomeSentAt: maintenant.toISOString() });
      bilan.envoyes += 1;
    } else {
      bilan.echecs += 1;
      console.error('Bienvenue non envoyée pour', compte.path, '—', envoi.issue, envoi.erreur ?? '');
    }
  }

  return bilan;
}

/**
 * LE PANIER ABANDONNÉ — un seul rappel, à J+1.
 *
 * TRANSACTIONNEL par décision de la direction : il se rattache à une transaction que la
 * personne a elle-même lancée. Il part donc à tous ceux qui ont abandonné, sans exiger de
 * consentement — c'est-à-dire là où il rapporte.
 *
 * ⚠️ Ce régime a un prix, et il faut le respecter : le courrier reste FACTUEL. Aucune
 * promotion ajoutée, aucune urgence fabriquée, aucune relance répétée. Un second rappel
 * ferait basculer l'ensemble dans le marketing, et avec lui l'obligation de consentement.
 *
 * Le coupon reste valable, et le courrier le dit : `usedCount` n'est incrémenté qu'au succès
 * (`webhook/bictorys.ts`), donc un panier abandonné n'en consomme aucun usage.
 */
export async function relancerPaniers(
  db: Firestore,
  env: Env,
  maintenant = new Date(),
): Promise<BilanPasse> {
  const bilan = vide();

  const enAttente = await db.query({
    collection: 'transactions',
    where: [{ field: 'status', op: '==', value: 'pending' }],
    limit: PAGE,
  });

  for (const t of enAttente) {
    const d = t.data;
    if (d.cartReminderSentAt) continue;

    /*
      EXACTEMENT UN JOUR. Plus tôt, on écrit à quelqu'un dont le paiement est peut-être encore
      en cours chez l'opérateur. Plus tard, la relance n'a plus de sens — et une borne basse
      seule ferait écrire, à la première exécution, à toutes les transactions abandonnées
      depuis toujours.
    */
    const age = joursDepuis(d.createdAt, maintenant);
    if (age !== 1) continue;
    bilan.examines += 1;

    const destinataire = asText(d.userEmail) ?? '';
    if (!destinataire) { bilan.ignores += 1; continue; }

    const userId = asText(d.userId) ?? '';
    const profil = userId ? await db.get(`users/${userId}`) : null;
    const langue = langueDe(profil);
    const coupon = asText(d.couponCode);

    const envoi = await envoyerModele(env, {
      modele: 'panierAbandonne',
      to: destinataire,
      langue,
      params: {
        prenom: asText(d.userName) ?? '',
        designation: asText(d.formationTitle) ?? '',
        montant: `${toNumber(d.amount)} ${asText(d.currency) ?? 'XOF'}`,
        // La mention du coupon n'existe que s'il y en a un : inventer « ton coupon » quand la
        // personne n'en a pas utilisé lui ferait chercher une remise qui n'existe pas.
        mentionCoupon: coupon
          ? (langue === 'fr'
              ? `Ton coupon ${coupon} est toujours valable — il n'est décompté qu'au moment où le paiement aboutit.`
              : `Your coupon ${coupon} still works — it's only counted once the payment goes through.`)
          : (langue === 'fr'
              ? 'Rien n’a été débité, et rien ne sera débité tant que tu n’auras pas repris.'
              : 'Nothing was charged, and nothing will be until you pick it up again.'),
        lien: `${env.APP_BASE_URL}${langue === 'fr' ? '/formations/' : '/en/courses/'}${asText(d.formationSlug) ?? ''}`,
      },
    });

    if (envoi.issue === 'envoye') {
      await db.update(t.path, { cartReminderSentAt: maintenant.toISOString() });
      bilan.envoyes += 1;
    } else {
      bilan.echecs += 1;
      console.error('Relance de panier non envoyée pour', t.path, '—', envoi.issue, envoi.erreur ?? '');
    }
  }

  return bilan;
}
