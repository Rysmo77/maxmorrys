import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Num, Segmented, Skeleton, StatTile,
  Switch, Tag,
} from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { useReveal } from '../../components/site/useReveal';
import ConsoleSheet from './components/ConsoleSheet';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { useAdminRedirects, isFormValid } from './hooks/useAdminRedirects';
import {
  isValidSlug, isInternalTarget, normalizeTarget, VIA_FALLBACK, VIA_PREFIX,
} from '../../lib/redirects';
import { SITE_URL } from '../../components/seo/seo-config';
import type { Redirect, RedirectKind } from '../../types';

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
 *
 * L'ÉTAT, LES CONFLITS ET LES ÉCRITURES VIVENT DANS `hooks/useAdminRedirects.ts` — ce fichier
 * ne fait plus que le rendu, sur le motif de console : filtre par statut, une action par ligne,
 * un pied qui nomme les angles morts.
 */
const STAGES = ['all', 'active', 'conflict'] as const;
type Stage = (typeof STAGES)[number];

const KINDS = ['all', 'via', 'path'] as const;
type KindFilter = (typeof KINDS)[number];

export default function AdminRedirects() {
  const { t } = useTranslation('admin');
  const reveal = useReveal<HTMLDivElement>();
  const {
    redirects, loading, loadedAt, conflicts,
    modalOpen, setModalOpen, editing, form, setForm, saving, copied,
    openNew, openEdit, handleSave, handleToggle, handleDelete, copy, confirm,
  } = useAdminRedirects();

  const [stage, setStage] = useState<Stage>('all');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');

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

  const filtered = useMemo(() => redirects.filter((r) => {
    if (kindFilter !== 'all' && r.kind !== kindFilter) return false;
    if (stage === 'active') return r.active;
    if (stage === 'conflict') return conflicts.has(r.id);
    return true;
  }), [redirects, kindFilter, stage, conflicts]);

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const stageLabels = STAGES.map((s) => t(`redirects.stages.${s}`));
  const kindLabels = KINDS.map((k) => t(`redirects.filters.${k}`));

  const activeCount = redirects.filter((r) => r.active).length;

  /** Un seul état par ligne, et le conflit passe devant : c'est lui qui coûte du trafic. */
  const stateTag = (r: Redirect) => {
    const conflict = conflicts.get(r.id);
    if (conflict) return <Tag tone="stop">{t(`redirects.conflicts.${conflict}`)}</Tag>;
    if (!r.active) return <Tag tone="neutral">{t('redirects.tags.off')}</Tag>;
    return <Tag tone="ok">{t('redirects.tags.active')}</Tag>;
  };

  const slugOfForm = form.source.trim().toLowerCase();

  return (
    <div>
      <ConsolePage title={t('redirects.title')} sub={t('redirects.consoleSub')}>
        <Segmented
          label={t('redirects.kindFilterLabel')}
          options={kindLabels}
          value={t(`redirects.filters.${kindFilter}`)}
          onChange={(label) => {
            const index = kindLabels.indexOf(label);
            if (index >= 0) setKindFilter(KINDS[index]);
          }}
        />

        <ConsoleFilter
          label={t('redirects.stagesLabel')}
          stages={stageLabels}
          active={t(`redirects.stages.${stage}`)}
          onSelect={(label) => {
            const index = stageLabels.indexOf(label);
            if (index >= 0) setStage(STAGES[index]);
          }}
          style={{ marginTop: '12px' }}
        />

        {loadedAt && (
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <StatTile
              label={t('redirects.tiles.active')}
              value={activeCount}
              source="db"
              asOf={loadedAt}
              foot={t('redirects.tiles.activeFoot')}
            />
            <StatTile
              label={t('redirects.tiles.conflicts')}
              value={conflicts.size}
              source="db"
              asOf={loadedAt}
              foot={t('redirects.tiles.conflictsFoot')}
            />
          </div>
        )}

        <p className="mt-3 text-meta-2 leading-[1.5] text-ink-2">{t('redirects.propagationNotice')}</p>

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={openNew}>{t('redirects.new')}</Button>
        </div>

        <div className="mt-3">
          {loading || !loadedAt ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={56} radius="var(--r-m)" label={t('redirects.loading')} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              glyph={<Icon name="forward" size={26} color="var(--mm-teal)" />}
              glyphBackground="color-mix(in srgb, var(--mm-teal) 18%, transparent)"
              title={t('redirects.empty')}
              body={t('redirects.emptyBody')}
              action={<Button onClick={openNew}>{t('redirects.new')}</Button>}
            />
          ) : (
            <ConsoleList label={t('redirects.listLabel')}>
              {paged.map((r, i) => (
                <li key={r.id}>
                  <LessonRow
                    onClick={() => openEdit(r)}
                    icon={(
                      <Icon
                        name={r.kind === 'via' ? 'share' : 'forward'}
                        size={14}
                        color={r.kind === 'via' ? 'var(--mm-teal)' : 'var(--mm-bleu)'}
                      />
                    )}
                    iconBackground={r.kind === 'via'
                      ? 'color-mix(in srgb, var(--mm-teal) 20%, transparent)'
                      : 'color-mix(in srgb, var(--mm-bleu) 20%, transparent)'}
                    title={`${r.source} → ${r.target}`}
                    meta={(
                      <>
                        {t(`redirects.kinds.${r.kind}`)}
                        {' · '}
                        <Num value={r.code} source="db" asOf={loadedAt} />
                        {r.kind === 'via' && (
                          <>
                            {' · '}
                            <Num value={r.hits ?? 0} source="db" asOf={loadedAt} />
                            {' '}
                            {t('redirects.hitsWord', { count: r.hits ?? 0 })}
                          </>
                        )}
                        {r.label ? ` · ${r.label}` : ''}
                      </>
                    )}
                    trailing={stateTag(r)}
                    last={i === paged.length - 1}
                  />
                </li>
              ))}
            </ConsoleList>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        {/* `.rv` ne rend rien tant qu'un ancêtre ne porte pas `.play`, et la console n'en pose
            aucun : sans déclencheur, le pied du motif — obligatoire — resterait à `opacity: 0`.
            L'observateur est posé sur le PIED lui-même et non sur la page : au seuil de 12 %,
            un écran plus haut que huit fois la fenêtre ne l'atteindrait jamais. */}
        <div ref={reveal}>
          <ConsoleScope>{t('redirects.scope')}</ConsoleScope>
        </div>
      </ConsolePage>

      <ConsoleSheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeLabel={t('redirects.modal.close')}
        eyebrow={t(`redirects.kinds.${form.kind}`)}
        title={editing ? t('redirects.modal.editTitle') : t('redirects.modal.newTitle')}
        footer={(
          <>
            {editing && (
              <Button size="sm" tone="quiet" onClick={() => handleDelete(editing)} style={{ marginRight: 'auto' }}>
                {t('redirects.actions.delete')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setModalOpen(false)}>{t('redirects.actions.cancel')}</Button>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!isFormValid(form)}>
              {saving ? t('redirects.actions.saving') : t('redirects.actions.save')}
            </Button>
          </>
        )}
      >
        <Field
          as="select"
          label={t('redirects.form.kindLabel')}
          hint={t(`redirects.form.kindHint.${form.kind}`)}
          value={form.kind}
          onChange={(v) => {
            const kind = v as RedirectKind;
            // Le code suit l'usage : 302 pour l'attribution (révocable), 301 pour le SEO.
            setForm((p) => ({ ...p, kind, code: kind === 'via' ? 302 : 301, target: kind === 'via' ? VIA_FALLBACK : p.target }));
          }}
          options={[
            { value: 'via', label: t('redirects.kinds.via') },
            { value: 'path', label: t('redirects.kinds.path') },
          ]}
        />

        <Field
          label={form.kind === 'via' ? t('redirects.form.slugLabel') : t('redirects.form.sourceLabel')}
          value={form.source}
          onChange={(v) => setForm((p) => ({ ...p, source: v }))}
          placeholder={form.kind === 'via' ? t('redirects.form.slugPlaceholder') : t('redirects.form.sourcePlaceholder')}
          hint={form.kind === 'via' ? `${VIA_PREFIX}${slugOfForm}` : undefined}
          autoComplete="off"
          error={form.kind === 'via' && slugOfForm !== '' && !isValidSlug(slugOfForm)
            ? t('redirects.form.slugInvalid')
            : undefined}
        />

        <Field
          label={t('redirects.form.targetLabel')}
          value={form.target}
          onChange={(v) => setForm((p) => ({ ...p, target: v }))}
          placeholder={VIA_FALLBACK}
          autoComplete="off"
          error={form.target.trim() !== '' && !isInternalTarget(normalizeTarget(form.target))
            ? t('redirects.form.targetInvalid')
            : undefined}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            as="select"
            label={t('redirects.form.codeLabel')}
            value={String(form.code)}
            onChange={(v) => setForm((p) => ({ ...p, code: Number(v) === 301 ? 301 : 302 }))}
            options={[
              { value: '302', label: t('redirects.form.code302') },
              { value: '301', label: t('redirects.form.code301') },
            ]}
          />
          <Field
            label={t('redirects.form.labelLabel')}
            value={form.label}
            onChange={(v) => setForm((p) => ({ ...p, label: v }))}
            placeholder={t('redirects.form.labelPlaceholder')}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="m-0 text-meta font-semibold text-ink">{t('redirects.form.activeLabel')}</p>
            <p className="m-0 mt-1 text-meta-2 text-ink-2">{t('redirects.form.activeHint')}</p>
          </div>
          <Switch
            on={form.active}
            label={t('redirects.form.activeLabel')}
            onChange={(on) => {
              if (editing) handleToggle(editing, on);
              else setForm((p) => ({ ...p, active: on }));
            }}
          />
        </div>

        {form.kind === 'via' && isValidSlug(slugOfForm) && (
          <GlassPanel level="flat" padding={14}>
            <p className="m-0 text-meta-2 font-semibold text-ink-2">{t('redirects.form.snippetLabel')}</p>
            <code className="mt-2 block break-all text-small leading-[1.5] text-ink-2">
              {anchorFor(slugOfForm)}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" tone="quiet" onClick={() => copy('form-anchor', anchorFor(slugOfForm))}>
                {copied === 'form-anchor' ? t('redirects.actions.copied') : t('redirects.actions.copyAnchor')}
              </Button>
              <Button
                size="sm"
                tone="quiet"
                onClick={() => copy('form-url', `${SITE_URL}${VIA_PREFIX}${slugOfForm}`)}
              >
                {copied === 'form-url' ? t('redirects.actions.copied') : t('redirects.actions.copyLink')}
              </Button>
            </div>
          </GlassPanel>
        )}

        {editing && conflicts.has(editing.id) && (
          <GlassPanel level="flat" padding={14}>
            <p className="m-0 text-meta-2 leading-[1.5] text-ink-2">
              {t(`redirects.conflictHints.${conflicts.get(editing.id)}`)}
            </p>
          </GlassPanel>
        )}
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('redirects.confirmDelete.title')}
        message={confirm.message}
        confirmLabel={t('redirects.confirmDelete.confirmLabel')}
      />
    </div>
  );
}
