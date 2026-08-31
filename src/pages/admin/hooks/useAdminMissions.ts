import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import {
  getEngagementLeads, updateEngagementLeadStatus, updateEngagementLeadNotes,
  deleteEngagementLead, getMissionStats,
} from '../../../lib/firestore';
import type { EngagementLead, EngagementLeadStatus } from '../../../types';

/**
 * LES TROIS ÉTAPES DU KIT SUR SIX STATUTS RÉELS.
 *
 * Le kit donne « tout · en cours · clos ». La collection, elle, porte les six statuts du cycle
 * agence (`MISSION_STAGES` : nouvelle, qualifiée, cadrage, proposition, gagnée, perdue). Les
 * deux ne se contredisent pas — le filtre range, le statut reste : « en cours » regroupe les
 * quatre statuts ouverts, « clos » les deux qui ferment un dossier, et le statut fin se choisit
 * toujours sur la fiche.
 *
 * ⚠️ Ce cycle ne se fusionne PAS avec celui des prospects TPE (`AdminAgencyLeads`) : deux
 * offres, deux schémas, deux durées. C'est écrit dans `design-system/react/navigation/Pipeline`
 * et rappelé ici parce que la tentation revient à chaque écran.
 */
export const OPEN_STATUSES: EngagementLeadStatus[] = ['new', 'qualified', 'scoping', 'proposal'];
export const CLOSED_STATUSES: EngagementLeadStatus[] = ['won', 'lost'];

export const isOpenLead = (l: EngagementLead): boolean => OPEN_STATUSES.includes(l.status);

/**
 * L'état de l'écran des demandes de mission, hors de son rendu.
 *
 * L'écran portait huit `useState`, quatre écritures Firestore et un export CSV au milieu de
 * 351 lignes de JSX. Le rendu se recompose sur le motif de console ; la logique de données est
 * déplacée ici SANS être retouchée — mêmes appels, même enregistrement des notes au `blur`,
 * mêmes toasts.
 */
export function useAdminMissions() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const [leads, setLeads] = useState<EngagementLead[]>([]);
  const [loading, setLoading] = useState(true);
  /** Date du relevé : l'instant où la requête a répondu. Aucun compteur ne s'affiche sans elle. */
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  /** Fiche ouverte dans la feuille de détail. */
  const [openId, setOpenId] = useState<string | null>(null);
  /** Brouillon local des notes, indexé par demande — évite un aller-retour par frappe */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getEngagementLeads()
      .then((data) => { setLeads(data); setLoadedAt(new Date()); setLoading(false); })
      .catch(() => { addToast('error', t('missions.toastLoadError')); setLoading(false); });
  }, [addToast, t]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => getMissionStats(leads), [leads]);

  const handleStatus = useCallback(async (id: string, status: EngagementLeadStatus) => {
    setUpdating(id);
    try {
      await updateEngagementLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      addToast('success', t('missions.toastUpdated'));
    } catch {
      addToast('error', t('missions.toastUpdateError'));
    } finally {
      setUpdating(null);
    }
  }, [addToast, t]);

  /** Enregistre au `blur` : une écriture par frappe saturerait Firestore pour rien. */
  const handleSaveNote = useCallback(async (id: string) => {
    const draft = noteDrafts[id];
    if (draft === undefined) return;
    const current = leads.find((l) => l.id === id)?.notes ?? '';
    if (draft === current) return;
    setSavingNote(id);
    try {
      await updateEngagementLeadNotes(id, draft);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: draft } : l)));
    } catch {
      addToast('error', t('missions.toastUpdateError'));
    } finally {
      setSavingNote(null);
    }
  }, [addToast, leads, noteDrafts, t]);

  const handleDelete = useCallback((id: string) => {
    // La feuille se referme d'abord : deux dialogues ouverts, ce sont deux pièges de focus.
    setOpenId(null);
    confirm.requestConfirm(t('missions.confirmDelete'), async () => {
      try {
        await deleteEngagementLead(id);
        setLeads((prev) => prev.filter((l) => l.id !== id));
        addToast('success', t('missions.toastDeleted'));
      } catch {
        addToast('error', t('missions.toastUpdateError'));
      }
      confirm.closeConfirm();
    });
  }, [addToast, confirm, t]);

  return {
    leads, loading, loadedAt, stats,
    search, setSearch,
    updating, openId, setOpenId,
    noteDrafts, setNoteDrafts, savingNote,
    load, handleStatus, handleSaveNote, handleDelete, confirm,
  };
}
