/**
 * Demandes de mission Max-Morrys Agency — collection `engagement_leads` (page `/agence`).
 *
 * ⚠️ Ne pas confondre avec deux voisins :
 *   - `agency.ts`    → prospects et devis de l'offre « Digital Commerce Local »
 *                      (`/presence-digitale`), avec packs, secteur et grille tarifaire.
 *   - `engagement.ts` → engagement de LECTURE sur un contenu (scroll, temps passé).
 *                      Aucun rapport : ici, « engagement » a le sens de mission.
 *
 * ⚠️ Le barrel `lib/firestore/index.ts` fait `export *` sur tous ces fichiers : tout nom
 * exporté doit rester unique sur l'ensemble.
 */
import { orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

/** Accusé de réception — voir `worker/apps/api/src/handlers/accuserDemande.ts`. */
const accuserAgenceCallable = httpsCallable<{ id: string; langue: string }, { ok: boolean; sent: boolean }>(
  functions,
  'accuserDemandeAgence',
);
import { getCollection, createDoc, updateDocById, deleteDocById } from './helpers';
import type { EngagementLead, EngagementLeadStatus, EngagementRouting } from '../../types';

/**
 * Champs fournis par le prospect. Le statut est posé à la création et les règles Firestore
 * le forcent à `'new'` : un prospect ne peut pas se déclarer « gagné ».
 */
export type EngagementLeadInput = Omit<
  EngagementLead,
  'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'
>;

/**
 * Étapes du pipeline commercial high-ticket, dans l'ordre d'avancement.
 *
 * Volontairement distinctes de `PIPELINE_STAGES` (offre TPE) : un cycle de vente produit
 * passe par une phase de cadrage qui n'existe pas dans la vente de packs.
 */
export const MISSION_STAGES: EngagementLeadStatus[] = [
  'new',
  'qualified',
  'scoping',
  'proposal',
  'won',
  'lost',
];

/**
 * Enregistre une demande de mission.
 *
 * Une seule écriture, contrairement au tunnel de devis TPE : il n'y a pas de document
 * partageable à générer, donc aucune séparation de données personnelles à opérer.
 */
export async function saveEngagementLead(data: EngagementLeadInput): Promise<string> {
  const id = await createDoc('engagement_leads', {
    ...data,
    status: 'new' as const,
  });

  /*
    L'ACCUSÉ DE RÉCEPTION — celui qui manquait le plus.

    Ce formulaire porte les demandes haut de gamme, à cinq ou six chiffres. Jusqu'ici,
    quelqu'un décrivait son projet, envoyait, et le produit se taisait : ni e-mail, ni
    notification, ni la moindre trace visible de réception.

    L'échec est avalé et l'appel ne bloque pas le retour : la demande est enregistrée, c'est
    ce qui compte. Le serveur revérifie tout — fraîcheur, plafonds, idempotence.
  */
  void accuserAgenceCallable({ id, langue: data.locale ?? 'fr' }).catch(() => null);

  return id;
}

/** Liste complète des demandes, les plus récentes d'abord. Réservé à l'administration. */
export async function getEngagementLeads(): Promise<EngagementLead[]> {
  return getCollection<EngagementLead>('engagement_leads', orderBy('createdAt', 'desc'));
}

/** Met à jour le statut de qualification d'une demande. */
export async function updateEngagementLeadStatus(
  id: string,
  status: EngagementLeadStatus,
): Promise<void> {
  return updateDocById('engagement_leads', id, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

/** Enregistre les notes internes de qualification. Jamais visibles du prospect. */
export async function updateEngagementLeadNotes(id: string, notes: string): Promise<void> {
  return updateDocById('engagement_leads', id, {
    notes,
    updatedAt: new Date().toISOString(),
  });
}

/** Supprime une demande. */
export async function deleteEngagementLead(id: string): Promise<void> {
  return deleteDocById('engagement_leads', id);
}

export interface MissionPipelineStats {
  total: number;
  byStatus: Record<EngagementLeadStatus, number>;
  /** Demandes orientées vers une autre practice — ici, Cléa Growth Office. */
  routed: Record<EngagementRouting, number>;
  /** Taux de conversion, hors demandes perdues et hors demandes réorientées. */
  conversionRate: number;
}

/**
 * Agrège le pipeline des missions.
 *
 * Les demandes réorientées vers Cléa sont exclues du taux de conversion : les compter
 * ferait baisser mécaniquement une performance commerciale sur des leads qui n'ont jamais
 * relevé de cette practice.
 */
export function getMissionStats(leads: EngagementLead[]): MissionPipelineStats {
  const byStatus = MISSION_STAGES.reduce(
    (acc, stage) => ({ ...acc, [stage]: 0 }),
    {} as Record<EngagementLeadStatus, number>,
  );
  const routed: Record<EngagementRouting, number> = { MY_ONOMA_GROW: 0 };

  for (const lead of leads) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    if (lead.routedTo) routed[lead.routedTo] += 1;
  }

  const ownLeads = leads.filter((l) => !l.routedTo);
  const decided = ownLeads.filter((l) => l.status !== 'lost').length;
  const conversionRate = decided > 0 ? byStatus.won / decided : 0;

  return { total: leads.length, byStatus, routed, conversionRate };
}
