import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@ds';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import {
  getAllRedirects, saveRedirect, setRedirectActive, deleteRedirect,
} from '../../../lib/firestore';
import {
  isValidSlug, isInternalTarget, normalizeSource, normalizeTarget, VIA_FALLBACK, VIA_PREFIX,
} from '../../../lib/redirects';
import { findConflicts } from './redirectConflicts';
import type { Redirect, RedirectKind } from '../../../types';
import { captureError } from '../../../lib/sentry';

export interface RedirectFormState {
  kind: RedirectKind;
  /** Saisi seul pour `via` (`/via/` est ajouté), chemin complet pour `path`. */
  source: string;
  target: string;
  code: 301 | 302;
  label: string;
  active: boolean;
}

export const EMPTY_REDIRECT: RedirectFormState = {
  kind: 'via', source: '', target: VIA_FALLBACK, code: 302, label: '', active: true,
};

/** Chemin source effectif, tel qu'il sera comparé par le Worker. */
export function sourceOf(form: RedirectFormState): string {
  return form.kind === 'via'
    ? `${VIA_PREFIX}${form.source.trim().toLowerCase()}`
    : normalizeSource(form.source);
}

export function isFormValid(form: RedirectFormState): boolean {
  const target = normalizeTarget(form.target);
  if (!isInternalTarget(target)) return false;
  if (form.kind === 'via') return isValidSlug(form.source.trim().toLowerCase());
  const source = normalizeSource(form.source);
  return source !== '/' && source !== target;
}

/**
 * L'état de l'écran des redirections, hors de son rendu.
 *
 * L'écran portait quatorze `useState` et six gestionnaires au milieu de son JSX : recomposer
 * le rendu par-dessus aurait mélangé deux changements dans un seul diff, dont un seul se
 * relit. La logique de données est donc déplacée telle quelle — mêmes appels, mêmes clés,
 * mêmes toasts — et le rendu la consomme.
 */
export function useAdminRedirects() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  /** Date du relevé : l'instant où la requête a répondu. Aucun compteur ne s'affiche sans elle. */
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [form, setForm] = useState<RedirectFormState>(EMPTY_REDIRECT);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAllRedirects()
      .then((data) => { setRedirects(data); setLoadedAt(new Date()); setLoading(false); })
      .catch(() => { addToast('error', t('redirects.toasts.loadError')); setLoading(false); });
  }, [addToast, t]);

  useEffect(() => { load(); }, [load]);

  const openNew = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_REDIRECT);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((r: Redirect) => {
    setEditing(r);
    setForm({
      kind: r.kind,
      source: r.kind === 'via' ? r.source.slice(VIA_PREFIX.length) : r.source,
      target: r.target,
      code: r.code,
      label: r.label ?? '',
      active: r.active,
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!isFormValid(form)) return;
    const source = sourceOf(form);

    // Une source en double serait tranchée arbitrairement au bord : on la refuse ici.
    if (redirects.some((r) => r.source === source && r.id !== editing?.id)) {
      addToast('error', t('redirects.toasts.duplicate', { source }));
      return;
    }

    setSaving(true);
    try {
      await saveRedirect({
        id: editing?.id,
        source,
        target: normalizeTarget(form.target),
        code: form.code,
        kind: form.kind,
        active: form.active,
        label: form.label,
      });
      addToast('success', editing ? t('redirects.toasts.updated') : t('redirects.toasts.created'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save redirect failed' });
      addToast('error', error instanceof Error ? error.message : t('redirects.toasts.saveError'));
    } finally {
      setSaving(false);
    }
  }, [addToast, editing, form, load, redirects, t]);

  /**
   * L'allumage d'une entrée, écrit tout de suite.
   *
   * C'est le seul champ de la feuille qui ne passe PAS par « Enregistrer », et c'est délibéré :
   * `setRedirectActive` est une écriture d'un champ, avec retour en arrière si elle échoue —
   * couper une redirection qui part en boucle ne doit pas dépendre du reste du formulaire, qui
   * peut être en cours de saisie et invalide.
   */
  const handleToggle = useCallback(async (r: Redirect, active: boolean) => {
    setRedirects((prev) => prev.map((x) => (x.id === r.id ? { ...x, active } : x)));
    setForm((p) => ({ ...p, active }));
    try {
      await setRedirectActive(r.id, active);
    } catch (error: unknown) {
      captureError(error, { context: 'Toggle redirect failed' });
      addToast('error', t('redirects.toasts.saveError'));
      setRedirects((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !active } : x)));
      setForm((p) => ({ ...p, active: !active }));
    }
  }, [addToast, t]);

  const handleDelete = useCallback((r: Redirect) => {
    // La feuille se referme d'abord : deux dialogues ouverts, ce sont deux pièges de focus.
    setModalOpen(false);
    confirm.requestConfirm(t('redirects.confirmDelete.message', { source: r.source }), async () => {
      try {
        await deleteRedirect(r.id);
        setRedirects((prev) => prev.filter((x) => x.id !== r.id));
        addToast('success', t('redirects.toasts.deleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete redirect failed' });
        addToast('error', t('redirects.toasts.deleteError'));
      }
      confirm.closeConfirm();
    });
  }, [addToast, confirm, t]);

  const copy = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      addToast('error', t('redirects.toasts.copyError'));
    }
  }, [addToast, t]);

  const conflicts = useMemo(() => findConflicts(redirects), [redirects]);

  return {
    redirects, loading, loadedAt, conflicts,
    modalOpen, setModalOpen, editing, form, setForm, saving, copied,
    load, openNew, openEdit, handleSave, handleToggle, handleDelete, copy, confirm,
  };
}
