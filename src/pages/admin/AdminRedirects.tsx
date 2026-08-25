import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Trash2, Edit2, Loader2, Route, Copy, Check, ArrowRight, MousePointerClick,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Toggle from '../../components/ui/Toggle';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllRedirects, saveRedirect, setRedirectActive, deleteRedirect } from '../../lib/firestore';
import { isValidSlug, isInternalTarget, normalizeSource, normalizeTarget, VIA_FALLBACK, VIA_PREFIX } from '../../lib/redirects';
import { SITE_URL } from '../../components/seo/seo-config';
import type { Redirect, RedirectKind } from '../../types';
import { captureError } from '../../lib/sentry';

/**
 * Table de redirections servie au bord par le Worker `maxmorrys-site`.
 *
 * Deux usages dans un seul écran :
 *   - `via`  — crédits d'agence posés au pied des sites clients (`/via/<slug>`)
 *   - `path` — anciennes URL redirigées en 301 pour ne pas perdre leur SEO
 *
 * ⚠️ Une modification n'est pas instantanée : le Worker met la table en cache
 * une minute. C'est dit à l'écran, parce que la question se poserait sinon à
 * chaque création de slug.
 */

interface FormState {
  kind: RedirectKind;
  /** Saisi seul pour `via` (`/via/` est ajouté), chemin complet pour `path`. */
  source: string;
  target: string;
  code: 301 | 302;
  label: string;
  active: boolean;
}

const EMPTY: FormState = { kind: 'via', source: '', target: VIA_FALLBACK, code: 302, label: '', active: true };

/** Chemin source effectif, tel qu'il sera comparé par le Worker. */
function sourceOf(form: FormState): string {
  return form.kind === 'via'
    ? `${VIA_PREFIX}${form.source.trim().toLowerCase()}`
    : normalizeSource(form.source);
}

function isFormValid(form: FormState): boolean {
  const target = normalizeTarget(form.target);
  if (!isInternalTarget(target)) return false;
  if (form.kind === 'via') return isValidSlug(form.source.trim().toLowerCase());
  const source = normalizeSource(form.source);
  return source !== '/' && source !== target;
}

export default function AdminRedirects() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<'all' | RedirectKind>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAllRedirects().then((data) => { setRedirects(data); setLoading(false); })
      .catch(() => { addToast('error', t('redirects.toasts.loadError')); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (r: Redirect) => {
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
  };

  const handleSave = async () => {
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
  };

  const handleToggle = async (r: Redirect, active: boolean) => {
    setRedirects((prev) => prev.map((x) => (x.id === r.id ? { ...x, active } : x)));
    try {
      await setRedirectActive(r.id, active);
    } catch (error: unknown) {
      captureError(error, { context: 'Toggle redirect failed' });
      addToast('error', t('redirects.toasts.saveError'));
      setRedirects((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !active } : x)));
    }
  };

  const handleDelete = (r: Redirect) => {
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
  };

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      addToast('error', t('redirects.toasts.copyError'));
    }
  };

  /**
   * Ancre exacte à coller au pied d'un site client.
   *
   * `rel="noopener"` **sans** `noreferrer`, volontairement : `noopener` coupe
   * `window.opener` donc le tabnabbing — c'est la moitié sécurité, elle reste
   * toujours. `noreferrer` masquerait la provenance, ce qui ne protège de rien
   * sur un lien vers notre propre domaine et rendrait le visiteur invisible à
   * l'arrivée, où il compterait comme trafic direct : ce serait éteindre
   * l'attribution, qui est le but même du lien.
   *
   * `referrerPolicy` est épinglé parce qu'un en-tête `Referrer-Policy` posé plus
   * tard à l'échelle du site client éteindrait ce lien en silence ;
   * `strict-origin` envoie l'origine et jamais le chemin — nous apprenons d'où
   * vient le visiteur, pas ce qu'il lisait.
   */
  const anchorFor = (slug: string): string =>
    `Conception et développement : <a href="${SITE_URL}${VIA_PREFIX}${slug}" target="_blank" rel="noopener" referrerPolicy="strict-origin">Max-Morrys Agency</a>`;

  const filtered = useMemo(
    () => redirects.filter((r) => kindFilter === 'all' || r.kind === kindFilter),
    [redirects, kindFilter],
  );

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('redirects.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('redirects.count', { count: redirects.length })}</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('redirects.new')}</Button>
      </div>

      <p className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3">
        {t('redirects.propagationNotice')}
      </p>

      <div className="flex flex-wrap gap-2">
        {(['all', 'via', 'path'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${kindFilter === k ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400'}`}
          >
            {t(`redirects.filters.${k}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <Route className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('redirects.empty')}</p>
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {paged.map((r) => {
            const slug = r.kind === 'via' ? r.source.slice(VIA_PREFIX.length) : '';
            return (
              <div key={r.id} className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 ${r.active ? '' : 'opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={r.kind === 'via' ? 'lagoon' : 'default'}>{t(`redirects.kinds.${r.kind}`)}</Badge>
                      <Badge variant={r.code === 301 ? 'warning' : 'brand'}>{r.code}</Badge>
                      {r.label && <span className="text-xs text-neutral-500">{r.label}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-neutral-900 dark:text-white">
                      <span className="truncate">{r.source}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="truncate text-neutral-600 dark:text-neutral-300">{r.target}</span>
                    </div>
                    {r.kind === 'via' && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          {t('redirects.hits', { count: r.hits ?? 0 })}
                        </span>
                        {r.lastHitAt && <span>{t('redirects.lastHit', { date: new Date(r.lastHitAt).toLocaleDateString() })}</span>}
                        {r.lastReferrerHost && <span className="font-mono">{r.lastReferrerHost}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {r.kind === 'via' && (
                      <>
                        <button
                          onClick={() => copy(`url-${r.id}`, `${SITE_URL}${r.source}`)}
                          title={t('redirects.actions.copyLink')}
                          aria-label={t('redirects.actions.copyLink')}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                        >
                          {copied === `url-${r.id}` ? <Check className="w-4 h-4 text-success-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copy(`anchor-${r.id}`, anchorFor(slug))}
                          title={t('redirects.actions.copyAnchor')}
                          aria-label={t('redirects.actions.copyAnchor')}
                          className="p-1.5 rounded-lg text-xs font-mono text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                        >
                          {copied === `anchor-${r.id}` ? <Check className="w-4 h-4 text-success-600" /> : '</>'}
                        </button>
                      </>
                    )}
                    <Toggle checked={r.active} onChange={(next) => handleToggle(r, next)} />
                    <button onClick={() => openEdit(r)} aria-label={t('redirects.actions.edit')} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r)} aria-label={t('redirects.actions.delete')} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center mt-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-neutral-900 dark:text-white">{editing ? t('redirects.modal.editTitle') : t('redirects.modal.newTitle')}</h2>
              <button onClick={() => setModalOpen(false)} aria-label={t('redirects.modal.close')} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('redirects.form.kindLabel')}</label>
                <select
                  value={form.kind}
                  onChange={(e) => {
                    const kind = e.target.value as RedirectKind;
                    // Le code suit l'usage : 302 pour l'attribution (révocable), 301 pour le SEO.
                    setForm((p) => ({ ...p, kind, code: kind === 'via' ? 302 : 301, target: kind === 'via' ? VIA_FALLBACK : p.target }));
                  }}
                  className={inputCls}
                >
                  <option value="via">{t('redirects.kinds.via')}</option>
                  <option value="path">{t('redirects.kinds.path')}</option>
                </select>
                <p className="text-xs text-neutral-500">{t(`redirects.form.kindHint.${form.kind}`)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">
                  {form.kind === 'via' ? t('redirects.form.slugLabel') : t('redirects.form.sourceLabel')}
                </label>
                <div className="flex items-center gap-2">
                  {form.kind === 'via' && <span className="text-sm font-mono text-neutral-400 flex-shrink-0">{VIA_PREFIX}</span>}
                  <input
                    value={form.source}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                    placeholder={form.kind === 'via' ? t('redirects.form.slugPlaceholder') : t('redirects.form.sourcePlaceholder')}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                {form.kind === 'via' && form.source.trim() !== '' && !isValidSlug(form.source.trim().toLowerCase()) && (
                  <p className="text-xs text-error-600">{t('redirects.form.slugInvalid')}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('redirects.form.targetLabel')}</label>
                <input
                  value={form.target}
                  onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                  placeholder="/agence"
                  className={`${inputCls} font-mono`}
                />
                {form.target.trim() !== '' && !isInternalTarget(normalizeTarget(form.target)) && (
                  <p className="text-xs text-error-600">{t('redirects.form.targetInvalid')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('redirects.form.codeLabel')}</label>
                  <select
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: Number(e.target.value) === 301 ? 301 : 302 }))}
                    className={inputCls}
                  >
                    <option value={302}>{t('redirects.form.code302')}</option>
                    <option value={301}>{t('redirects.form.code301')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('redirects.form.labelLabel')}</label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder={t('redirects.form.labelPlaceholder')}
                    className={inputCls}
                  />
                </div>
              </div>

              <Toggle checked={form.active} onChange={(active) => setForm((p) => ({ ...p, active }))} label={t('redirects.form.activeLabel')} description={t('redirects.form.activeHint')} />

              {form.kind === 'via' && isValidSlug(form.source.trim().toLowerCase()) && (
                <div className="space-y-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4">
                  <p className="text-xs font-medium text-neutral-500">{t('redirects.form.snippetLabel')}</p>
                  <code className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 break-all">
                    {anchorFor(form.source.trim().toLowerCase())}
                  </code>
                  <Button
                    variant="outline"
                    onClick={() => copy('form-anchor', anchorFor(form.source.trim().toLowerCase()))}
                    icon={copied === 'form-anchor' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {t('redirects.actions.copyAnchor')}
                  </Button>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('redirects.actions.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving || !isFormValid(form)} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {saving ? t('redirects.actions.saving') : t('redirects.actions.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('redirects.confirmDelete.title')} message={confirm.message} confirmLabel={t('redirects.confirmDelete.confirmLabel')} />
    </div>
  );
}
