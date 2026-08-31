import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button, DocLine, EmptyState, Field, Icon, LessonRow, SearchPill, Skeleton, StatTile, Tag,
} from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { useReveal } from '../../components/site/useReveal';
import ConsoleSheet from './components/ConsoleSheet';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useFormat } from '../../hooks/useFormat';
import { MISSION_STAGES } from '../../lib/firestore';
import { exportToCsv } from '../../lib/utils';
import { useAdminMissions, isOpenLead } from './hooks/useAdminMissions';
import type { EngagementLead, EngagementLeadStatus } from '../../types';

/**
 * Pipeline des demandes de mission Max-Morrys Agency (collection `engagement_leads`).
 *
 * ⚠️ Écran distinct de `AdminAgencyLeads`, qui suit les prospects de l'offre
 * « Digital Commerce Local » : deux offres, deux schémas, deux cycles de vente.
 *
 * Le kit appelle cet écran « Défis » et lui donne le pipeline « tout · en cours · clos ». Le
 * nom ne correspond à rien ici — les défis du produit sont ceux du Club, administrés dans
 * `AdminClubDigitos`. Le PIPELINE, lui, s'applique : voir `hooks/useAdminMissions.ts`, qui
 * range les six statuts du cycle agence dans ces deux files.
 */
const STAGES = ['all', 'open', 'closed'] as const;
type Stage = (typeof STAGES)[number];

export default function AdminMissions() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const reveal = useReveal<HTMLDivElement>();
  const {
    leads, loading, loadedAt, stats,
    search, setSearch, updating, openId, setOpenId,
    noteDrafts, setNoteDrafts, savingNote,
    load, handleStatus, handleSaveNote, handleDelete, confirm,
  } = useAdminMissions();

  const [stage, setStage] = useState<Stage>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (stage === 'open' && !isOpenLead(l)) return false;
      if (stage === 'closed' && isOpenLead(l)) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    });
  }, [leads, search, stage]);

  /** Exporte l'ensemble filtré, pas la collection entière. */
  const handleExport = () => {
    const headers = t('missions.csv.headers', { returnObjects: true }) as string[];
    const rows = filtered.map((l) => [
      l.createdAt,
      l.name,
      l.company,
      l.email,
      l.website ?? '',
      t(`missions.projectTypes.${l.projectType}`),
      t(`missions.budgets.${l.budget}`),
      t(`missions.timelines.${l.timeline}`),
      t(`missions.status.${l.status}`),
      l.routedTo ?? '',
      l.via ?? '',
      l.description,
      l.notes ?? '',
    ]);
    exportToCsv(t('missions.csv.filename'), headers, rows);
  };

  const stageLabels = STAGES.map((s) => t(`missions.stages.${s}`));
  const openCount = leads.filter(isOpenLead).length;
  const open = leads.find((l) => l.id === openId) ?? null;

  /** Un seul état par ligne : le statut du cycle, tel qu'il est en base. */
  const stateTag = (l: EngagementLead) => (
    <Tag tone={l.status === 'won' ? 'ok' : l.status === 'lost' ? 'neutral' : 'warn'}>
      {t(`missions.status.${l.status}`)}
    </Tag>
  );

  return (
    <div>
      <ConsolePage title={t('missions.title')} sub={t('missions.consoleSub')}>
        <ConsoleFilter
          label={t('missions.stagesLabel')}
          stages={stageLabels}
          active={t(`missions.stages.${stage}`)}
          onSelect={(label) => {
            const index = stageLabels.indexOf(label);
            if (index >= 0) setStage(STAGES[index]);
          }}
        />

        {loadedAt && (
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <StatTile
              label={t('missions.tiles.open')}
              value={openCount}
              source="db"
              asOf={loadedAt}
              foot={t('missions.tiles.openFoot')}
            />
            <StatTile
              label={t('missions.tiles.routed')}
              value={stats.routed.MY_ONOMA_GROW}
              source="db"
              asOf={loadedAt}
              foot={t('missions.tiles.routedFoot')}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SearchPill
            label={t('missions.searchLabel')}
            labelHidden
            placeholder={t('missions.searchPlaceholder')}
            icon={<Icon name="search" size={16} color="var(--text-muted)" />}
            value={search}
            onChange={setSearch}
            height={46}
            style={{ flex: '1 1 220px' }}
          />
          <Button size="sm" tone="quiet" onClick={load}>{t('missions.refresh')}</Button>
          <Button size="sm" tone="quiet" onClick={handleExport}>{t('missions.export')}</Button>
        </div>

        <div className="mt-3">
          {loading || !loadedAt ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={56} radius="var(--r-m)" label={t('missions.loading')} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              glyph={<Icon name="case" size={26} color="var(--mm-teal)" />}
              glyphBackground="color-mix(in srgb, var(--mm-teal) 18%, transparent)"
              title={t('missions.empty')}
              body={t('missions.emptyBody')}
            />
          ) : (
            <ConsoleList label={t('missions.listLabel')}>
              {filtered.map((l, i) => (
                <li key={l.id}>
                  <LessonRow
                    onClick={() => setOpenId(l.id)}
                    icon={<Icon name="case" size={14} color="var(--mm-teal)" />}
                    iconBackground="color-mix(in srgb, var(--mm-teal) 20%, transparent)"
                    title={l.company}
                    meta={(
                      <>
                        {`${l.name} · ${formatDate(l.createdAt)} · `}
                        {t(`missions.projectTypes.${l.projectType}`)}
                        {l.routedTo ? ` · ${t('missions.routedBadge')}` : ''}
                        {l.via ? ` · ${t('missions.viaBadge', { slug: l.via })}` : ''}
                      </>
                    )}
                    trailing={stateTag(l)}
                    last={i === filtered.length - 1}
                  />
                </li>
              ))}
            </ConsoleList>
          )}
        </div>

        {/* `.rv` ne rend rien tant qu'un ancêtre ne porte pas `.play`, et la console n'en pose
            aucun : sans déclencheur, le pied du motif — obligatoire — resterait à `opacity: 0`.
            L'observateur est posé sur le PIED lui-même et non sur la page : au seuil de 12 %,
            un écran plus haut que huit fois la fenêtre ne l'atteindrait jamais. */}
        <div ref={reveal}>
          <ConsoleScope>{t('missions.scope')}</ConsoleScope>
        </div>
      </ConsolePage>

      <ConsoleSheet
        open={open !== null}
        onClose={() => setOpenId(null)}
        closeLabel={t('missions.sheetClose')}
        eyebrow={open ? t(`missions.status.${open.status}`) : undefined}
        title={open?.company ?? ''}
        footer={open ? (
          <>
            <Button size="sm" tone="quiet" onClick={() => handleDelete(open.id)} style={{ marginRight: 'auto' }}>
              {t('missions.deleteAria')}
            </Button>
            <Button size="sm" href={`mailto:${open.email}`}>{t('missions.writeAction')}</Button>
          </>
        ) : undefined}
      >
        {open && (
          <>
            <div>
              <DocLine label={t('missions.docContact')} value={`${open.name} · ${open.email}`} />
              <DocLine label={t('missions.docReceived')} value={formatDate(open.createdAt)} />
              <DocLine label={t('missions.docProjectType')} value={t(`missions.projectTypes.${open.projectType}`)} />
              <DocLine label={t('missions.docBudget')} value={t(`missions.budgets.${open.budget}`)} />
              <DocLine label={t('missions.docTimeline')} value={t(`missions.timelines.${open.timeline}`)} />
              <DocLine
                label={t('missions.docSource')}
                value={open.via ? t('missions.viaBadge', { slug: open.via }) : t('missions.docSourceDirect')}
              />
              <DocLine
                label={t('missions.docRouted')}
                value={open.routedTo ? t('missions.routedBadge') : t('missions.docRoutedNone')}
                last={!open.website}
              />
              {open.website && (
                <DocLine
                  label={t('missions.docWebsite')}
                  value={(
                    <a
                      href={open.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      style={{ color: 'var(--text-link)' }}
                    >
                      {open.website}
                    </a>
                  )}
                  last
                />
              )}
            </div>

            <p className="m-0 whitespace-pre-line text-meta leading-[1.6] text-ink-2">{open.description}</p>

            <Field
              as="select"
              label={t('missions.statusLabel')}
              value={open.status}
              disabled={updating === open.id}
              onChange={(v) => handleStatus(open.id, v as EngagementLeadStatus)}
              options={MISSION_STAGES.map((s) => ({ value: s, label: t(`missions.status.${s}`) }))}
            />

            <Field
              // Une fiche par champ : sans clé, le brouillon non contrôlé d'une demande
              // resterait affiché sur la suivante.
              key={open.id}
              as="textarea"
              rows={3}
              label={t('missions.notesLabel')}
              hint={savingNote === open.id ? t('missions.notesSaving') : undefined}
              defaultValue={open.notes ?? ''}
              onChange={(v) => setNoteDrafts((p) => ({ ...p, [open.id]: v }))}
              onBlur={() => handleSaveNote(open.id)}
            />
            {/* Le brouillon vit dans le hook : rouvrir la fiche ne perd pas une note non encore
                enregistrée, et le `blur` compare au contenu en base avant d'écrire. */}
            {noteDrafts[open.id] !== undefined && noteDrafts[open.id] !== (open.notes ?? '') && (
              <p className="m-0 text-meta-2 text-ink-2">{t('missions.notesDirty')}</p>
            )}
          </>
        )}
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('missions.confirmDeleteTitle')}
        message={confirm.message}
        confirmLabel={t('missions.deleteAria')}
      />
    </div>
  );
}
