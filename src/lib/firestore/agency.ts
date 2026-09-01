/**
 * Prospects et devis de l'offre « Digital Commerce Local » (page `/presence-digitale`).
 *
 * ⚠️ Le fichier et les collections gardent le préfixe `agency_` : les renommer casserait
 * les données de production, les règles Firestore et l'écran d'administration. Le
 * vocabulaire a évolué dans l'interface, pas en base. Cette offre n'est PAS Max-Morrys
 * Agency — voir `docs/AGENCY-POSITIONING.md §9`.
 */
import { orderBy } from 'firebase/firestore';
import { getCollection, getDocById, createDoc, setDocById, updateDocById, deleteDocById } from './helpers';
import { computeTotals, generateQuoteRef, isValidQuoteRef, QUOTE_VALIDITY_DAYS } from '../presence/offer';
import type { AgencyLead, AgencyLeadStatus, AgencyQuote } from '../../types';

/** Champs fournis par le prospect ; le statut et l'horodatage sont posés à la création. */
export type AgencyLeadInput = Omit<AgencyLead, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'notes' | 'quoteRef'>;

/**
 * Enregistre une demande de devis et génère le devis partageable associé.
 *
 * Deux écritures délibérément séparées :
 *   - `agency_leads`  → toutes les données de contact, lisible par admin/support uniquement
 *   - `agency_quotes` → aucune donnée personnelle, lisible par quiconque a la référence
 *
 * Le devis est écrit en premier : si cette écriture échoue, on ne veut pas d'un lead
 * portant une référence morte. Un lead sans devis reste exploitable commercialement.
 */
export async function saveAgencyLead(data: AgencyLeadInput): Promise<{ id: string; quoteRef: string | null }> {
  const quoteRef = generateQuoteRef();
  const totals = computeTotals(data.pack, data.plan);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + QUOTE_VALIDITY_DAYS);

  let savedRef: string | null = null;
  try {
    // Champs volontairement énumérés un par un : garantit qu'aucune donnée de contact
    // du formulaire ne fuit vers un document lisible publiquement.
    await setDocById<Omit<AgencyQuote, 'ref'>>('agency_quotes', quoteRef, {
      businessName: data.businessName,
      city: data.city,
      pack: data.pack,
      plan: data.plan,
      packPrice: totals.packPrice,
      planSetup: totals.planSetup,
      planMonthly: totals.planMonthly,
      locale: data.locale ?? 'fr',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    savedRef = quoteRef;
  } catch {
    // Le devis est un confort, pas le livrable : on n'empêche pas la capture du lead.
    savedRef = null;
  }

  const id = await createDoc('agency_leads', {
    ...data,
    status: 'new' as const,
    ...(savedRef ? { quoteRef: savedRef } : {}),
  });

  return { id, quoteRef: savedRef };
}

/** Lecture publique d'un devis par sa référence. `null` si la référence est invalide ou inconnue. */
export async function getAgencyQuote(ref: string): Promise<AgencyQuote | null> {
  if (!isValidQuoteRef(ref)) return null;
  const quote = await getDocById<AgencyQuote & { id: string }>('agency_quotes', ref);
  return quote ? { ...quote, ref } : null;
}

export async function getAllAgencyLeads(): Promise<AgencyLead[]> {
  return getCollection<AgencyLead>('agency_leads', orderBy('createdAt', 'desc'));
}

export async function updateAgencyLeadStatus(id: string, status: AgencyLead['status']): Promise<void> {
  return updateDocById('agency_leads', id, { status, updatedAt: new Date().toISOString() });
}

export async function updateAgencyLeadNotes(id: string, notes: string): Promise<void> {
  return updateDocById('agency_leads', id, { notes, updatedAt: new Date().toISOString() });
}

export async function deleteAgencyLead(id: string): Promise<void> {
  return deleteDocById('agency_leads', id);
}

// ── Agrégats pour l'admin ─────────────────────────────────────────────────────

/**
 * Pondération de la valeur d'un prospect selon son avancement.
 *
 * Un prospect « nouveau » vaut zéro tant qu'il n'est pas qualifié : le compter à
 * 100% gonflerait le pipeline d'un chiffre que rien ne soutient. Un prospect signé
 * vaut son montant plein.
 */
const PIPELINE_WEIGHTS: Record<AgencyLeadStatus, number> = {
  new: 0,
  qualified: 0.25,
  quoted: 0.5,
  signed: 1,
  lost: 0,
};

export interface AgencyStats {
  total: number;
  byStatus: Record<AgencyLeadStatus, number>;
  /** Somme des montants de mise en place, sans pondération */
  pipelineGross: number;
  /** Même somme, pondérée par l'avancement de chaque prospect */
  pipelineWeighted: number;
  /** Montant déjà signé */
  signedValue: number;
  /** Mensualités récurrentes des prospects signés */
  signedMonthly: number;
  /** signed / (total − lost), en fraction. 0 si aucun prospect exploitable. */
  conversionRate: number;
  byPack: Record<string, number>;
  byPlan: Record<string, number>;
  bySector: Record<string, number>;
  byCity: Record<string, number>;
}

/** Regroupe des valeurs en comptant les occurrences, en ignorant les vides. */
function tally(values: (string | undefined)[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) {
    const key = v?.trim();
    if (!key) continue;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/**
 * Agrégats du pipeline agence, calculés côté client à partir des prospects.
 *
 * Les montants proviennent de `computeTotals()` — jamais recalculés ici, sous peine
 * de diverger de la grille tarifaire dès qu'un prix change.
 *
 * Lecture complète de la collection : acceptable tant que le volume reste de l'ordre
 * de quelques centaines de prospects. Au-delà, basculer sur des compteurs agrégés
 * maintenus par Cloud Function.
 */
export async function getAgencyStats(leads?: AgencyLead[]): Promise<AgencyStats> {
  const all = leads ?? (await getAllAgencyLeads());

  const byStatus = { new: 0, qualified: 0, quoted: 0, signed: 0, lost: 0 } as Record<AgencyLeadStatus, number>;
  let pipelineGross = 0;
  let pipelineWeighted = 0;
  let signedValue = 0;
  let signedMonthly = 0;

  for (const lead of all) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;

    const totals = computeTotals(lead.pack, lead.plan);
    /* `pipelineValue` et non `setupDue` : ici on pèse la VALEUR D'UNE AFFAIRE, pas ce qui est
       exigible à la signature. Une affaire qui comprend un accompagnement vaut sa mise en
       place plus celle de l'accompagnement, et c'est le seul endroit où les deux s'additionnent
       légitimement — un tableau de prévision que personne ne montre à un prospect. */
    pipelineGross += totals.pipelineValue;
    pipelineWeighted += totals.pipelineValue * (PIPELINE_WEIGHTS[lead.status] ?? 0);

    if (lead.status === 'signed') {
      signedValue += totals.pipelineValue;
      signedMonthly += totals.planMonthly;
    }
  }

  // Les prospects perdus sortent du dénominateur : les garder ferait baisser le taux
  // à mesure qu'on qualifie, ce qui est exactement l'inverse du signal recherché.
  const reachable = all.length - byStatus.lost;

  return {
    total: all.length,
    byStatus,
    pipelineGross,
    pipelineWeighted: Math.round(pipelineWeighted),
    signedValue,
    signedMonthly,
    conversionRate: reachable > 0 ? byStatus.signed / reachable : 0,
    byPack: tally(all.map((l) => l.pack)),
    byPlan: tally(all.map((l) => l.plan)),
    bySector: tally(all.map((l) => l.sector)),
    byCity: tally(all.map((l) => normalizeCity(l.city))),
  };
}

/**
 * Ramène « Dakar, Point E », « dakar » et « DAKAR - Plateau » à une même ville.
 * Sans ça, la répartition géographique compte autant de villes que de saisies.
 */
export function normalizeCity(city: string): string {
  const first = city.split(/[,\-/(]/)[0].trim().toLowerCase();
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1);
}
