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
import { brevoConfigure } from './brevo-send';
import { canalMarketingOuvert, envoyerModele, type Langue } from './envoi-modele';
import { asText, toNumber } from './values';
import { urlSite } from './urls';

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
        lien: urlSite(env.APP_BASE_URL, '/mon-espace', langueDe(compte)),
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
 * LES SUITES DE BIENVENUE — #2 à J+2, #3 à J+5. MARKETING.
 *
 * Elles partent par BREVO (envoi unitaire, `envoi-modele.ts`), jamais par le binding
 * Cloudflare. Elles exigent un consentement que personne n'a à l'inscription — `envoyerModele`
 * le vérifie lui-même et répond `sansConsentement` sinon, compté ici comme ignoré, pas comme
 * échec. Au-delà du plafond Brevo du jour (`plafondAtteint`), ignoré aussi : le jour exact
 * passé, la suite ne repart pas — une suite manquée vaut mieux qu'un arriéré.
 *
 * Tant que le canal marketing est fermé (`MARKETING_ENVOI_REEL` ≠ `oui`, ou Brevo non
 * configuré), la passe sort AVANT toute lecture : pas de requête inutile chaque matin, et
 * aucun marqueur posé — le jour où le canal s'ouvre, seuls les comptes alors à J+2 ou J+5
 * reçoivent, jamais un arriéré.
 *
 * Un jour EXACT, comme le panier : une borne basse seule ferait écrire, au premier passage,
 * à tous les comptes plus anciens.
 */
export async function envoyerSuitesBienvenue(
  db: Firestore,
  env: Env,
  maintenant = new Date(),
): Promise<BilanPasse> {
  const bilan = vide();
  if (!canalMarketingOuvert(env) || !brevoConfigure(env)) return bilan;

  const comptes = await db.query({
    collection: 'users',
    where: [{ field: 'role', op: '==', value: 'student' }],
    limit: PAGE,
  });

  const etapes = [
    { jour: 2, modele: 'bienvenue2', marqueur: 'welcome2SentAt', chemin: '/mon-espace/repetiteur' },
    { jour: 5, modele: 'bienvenue3', marqueur: 'welcome3SentAt', chemin: '/formations' },
  ] as const;

  for (const compte of comptes) {
    const d = compte.data;
    const age = joursDepuis(d.createdAt, maintenant);
    const etape = etapes.find((e) => e.jour === age);
    if (!etape || d[etape.marqueur]) continue;
    bilan.examines += 1;

    const destinataire = asText(d.email) ?? '';
    if (!destinataire) { bilan.ignores += 1; continue; }

    const envoi = await envoyerModele(env, {
      modele: etape.modele,
      to: destinataire,
      langue: langueDe(compte),
      params: {
        prenom: asText(d.firstName) ?? asText(d.displayName) ?? '',
        lien: urlSite(env.APP_BASE_URL, etape.chemin, langueDe(compte)),
      },
    }, db);

    if (envoi.issue === 'envoye') {
      await db.update(compte.path, { [etape.marqueur]: maintenant.toISOString() });
      bilan.envoyes += 1;
    } else if (envoi.issue === 'sansConsentement' || envoi.issue === 'plafondAtteint') {
      bilan.ignores += 1;
    } else {
      bilan.echecs += 1;
      console.error('Suite de bienvenue non envoyée pour', compte.path, '—', envoi.issue, envoi.erreur ?? '');
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
        lien: urlSite(env.APP_BASE_URL, `/formations/${asText(d.formationSlug) ?? ''}`, langue),
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
