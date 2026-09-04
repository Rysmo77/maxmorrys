import type { CallContext } from '../context';
import { envoyerModele, type Langue } from '../lib/brevo-send';
import {
  empreinteAppelant,
  fenetreHoraire,
  fenetreJournaliere,
  incrementerBorne,
  UNE_HEURE,
  UN_JOUR,
} from '../lib/rate-limit';
import { asText, toNumber } from '../lib/values';

/**
 * LES DEUX ACCUSÉS DE RÉCEPTION CÔTÉ AGENCE.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUE ÇA FERME
 *
 * Un commerçant remplit le simulateur, reçoit un lien de devis à l'écran — et rien d'autre.
 * S'il ferme l'onglet, le lien est perdu ; le devis existe en base, lui, indéfiniment.
 *
 * Pire côté `/agence` : le formulaire haut de gamme (`engagement_leads`, paniers à six
 * chiffres) ne déclenchait **strictement aucun accusé**. Quelqu'un décrit un projet, envoie,
 * et le produit se tait. C'est le silence le plus cher de la plateforme.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI UNE CALLABLE ET NON UN DÉCLENCHEUR
 *
 * Les deux collections sont écrites DEPUIS LE NAVIGATEUR (`src/lib/firestore/agency.ts` et
 * `missions.ts`). Cloudflare Workers ne sait pas s'abonner aux événements Firestore, et il
 * ne reste aucune Cloud Function. La forme retenue est celle que le dépôt tient déjà pour
 * l'accusé de rendez-vous : **l'action qui écrit appelle aussi l'endpoint.**
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSACTIONNELS
 *
 * Ces deux courriers répondent à une demande explicite. Ni consentement, ni lien de retrait —
 * `brevo-send.ts` le sait par la table des modèles, et refuserait tout seul si on les y
 * déclarait marketing.
 *
 * Les gardes sont celles de `acknowledgeAppointment`, pour les mêmes raisons : ces callables
 * sont PUBLIQUES et non authentifiées, et un appel provoque un envoi.
 */

/** Un appelant, une heure. Un formulaire honnête en fait un ; deux en cas de reprise. */
const PLAFOND_PAR_APPELANT = 5;
/** Le plafond du jour, tous appelants confondus — l'alarme, pas la serrure. */
const PLAFOND_GLOBAL_JOUR = 200;
/**
 * Au-delà, l'appel ne peut plus venir du formulaire qui vient d'écrire le document.
 * Dix minutes couvrent une connexion lente et une reprise ; pas une rediffusion.
 */
const FRAICHEUR_MS = 10 * 60_000;

interface Requete {
  id?: string;
  langue?: string;
}

/** Le tronc commun : gardes, lecture, envoi, marquage. */
async function accuser(
  context: CallContext,
  options: {
    collection: string;
    prefixeBorne: string;
    modele: 'accuseDevis' | 'accuseAgence';
    marqueur: string;
    /** Comment retrouver l'adresse et les variables du modèle depuis le document. */
    monter: (data: Record<string, unknown>) => Promise<{ email: string; params: Record<string, unknown> }>;
  },
  data: unknown,
): Promise<unknown> {
  const { id, langue } = (data ?? {}) as Requete;
  if (typeof id !== 'string' || !id.trim()) {
    return { ok: true, sent: false, reason: 'idManquant' };
  }
  const lang: Langue = langue === 'en' ? 'en' : 'fr';

  const empreinte = await empreinteAppelant(context.request);
  const parAppelant = await incrementerBorne(
    context.db,
    `_ratelimits/${options.prefixeBorne}_ip_${empreinte}_${fenetreHoraire()}`,
    PLAFOND_PAR_APPELANT,
    2 * UNE_HEURE,
  );
  if (!parAppelant.autorise) {
    console.warn(`Accusé ${options.modele} refusé : ${parAppelant.compte} appels sur l'heure.`);
    return { ok: true, sent: false, reason: 'plafondAppelant' };
  }

  const doc = await context.db.get(`${options.collection}/${id}`);
  if (!doc) return { ok: true, sent: false, reason: 'introuvable' };
  if (typeof doc.data[options.marqueur] === 'string') {
    return { ok: true, sent: false, reason: 'dejaAccuse' };
  }

  const cree = Date.parse(asText(doc.data.createdAt) ?? '');
  if (!Number.isFinite(cree) || Date.now() - cree > FRAICHEUR_MS) {
    return { ok: true, sent: false, reason: 'horsDelai' };
  }

  const { email, params } = await options.monter(doc.data);
  if (!email) return { ok: true, sent: false, reason: 'sansAdresse' };

  /* Le plafond global est consommé JUSTE AVANT l'envoi : un appel qui ne débouche sur aucun
     courrier ne doit pas épuiser l'alarme du jour, sinon elle perd son sens. */
  const parJour = await incrementerBorne(
    context.db,
    `_ratelimits/${options.prefixeBorne}_jour_${fenetreJournaliere()}`,
    PLAFOND_GLOBAL_JOUR,
    2 * UN_JOUR,
  );
  if (!parJour.autorise) {
    console.error(`Accusé ${options.modele} : plafond journalier atteint (${parJour.compte}).`);
    return { ok: true, sent: false, reason: 'plafondJour' };
  }

  const envoi = await envoyerModele(context.env, { modele: options.modele, to: email, langue: lang, params });
  if (envoi.issue !== 'envoye') {
    /* Le marqueur n'est PAS posé : un rejeu pourra rattraper tant qu'on est dans le délai. */
    console.error(`Accusé ${options.modele} non envoyé pour ${id} —`, envoi.issue, envoi.erreur ?? '');
    return { ok: true, sent: false, reason: 'envoiEchoue' };
  }

  await context.db.update(`${options.collection}/${id}`, { [options.marqueur]: new Date().toISOString() });
  return { ok: true, sent: true };
}

/**
 * B1 — l'accusé de devis Présence Digitale.
 *
 * ⚠️ `agency_quotes` ne porte AUCUNE donnée personnelle, délibérément : le lien se transfère
 * sans exposer le téléphone du prospect. L'adresse se retrouve donc dans `agency_leads`, par
 * `quoteRef` — exactement comme le fait déjà la relance J-7 de `quote-expiry.ts`.
 */
export async function accuserDevis(data: unknown, context: CallContext): Promise<unknown> {
  return accuser(context, {
    collection: 'agency_quotes',
    prefixeBorne: 'devis',
    modele: 'accuseDevis',
    marqueur: 'accuseSentAt',
    monter: async (d) => {
      const ref = asText(d.ref) ?? '';
      const leads = await context.db.query({
        collection: 'agency_leads',
        where: [{ field: 'quoteRef', op: '==', value: ref }],
        limit: 1,
      });
      const lead = leads[0]?.data ?? {};
      const setup = toNumber(d.packPrice);
      return {
        email: asText(lead.email) ?? '',
        params: {
          prenom: asText(lead.contactName) ?? '',
          commerce: asText(d.businessName) ?? '',
          ref,
          montant: `${setup} XOF`,
          validite: '30',
          expiration: (asText(d.expiresAt) ?? '').slice(0, 10),
          lien: `${context.env.APP_BASE_URL}/presence-digitale/devis/${ref}`,
        },
      };
    },
  }, data);
}

/**
 * B3 — l'accusé de demande sur `/agence`.
 *
 * Ici l'adresse est OBLIGATOIRE dans le formulaire, contrairement aux prospects Présence
 * Digitale : pas de jointure à faire.
 */
export async function accuserDemandeAgence(data: unknown, context: CallContext): Promise<unknown> {
  return accuser(context, {
    collection: 'engagement_leads',
    prefixeBorne: 'agence',
    modele: 'accuseAgence',
    marqueur: 'accuseSentAt',
    monter: async (d) => ({
      email: asText(d.email) ?? '',
      params: {
        prenom: asText(d.name) ?? '',
        entreprise: asText(d.company) ?? '',
      },
    }),
  }, data);
}
