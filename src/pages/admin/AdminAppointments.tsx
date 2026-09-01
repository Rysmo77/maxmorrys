import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Button, DocLine, EmptyState, Field, GlassPanel, Icon, LessonRow, Skeleton, StatTile, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { getAllAppointments, updateAppointmentStatus } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Appointment } from '../../types';

/**
 * LES RENDEZ-VOUS, SUR LE MOTIF DE CONSOLE.
 *
 * ⚠️ LE KIT SE CONTREDIT ICI, ET LE MOTIF TRANCHE. Sa grille des quatorze écrans range les
 * rendez-vous sous « tout · à venir · passés » — c'est-à-dire un filtre PAR DATE, que la
 * première règle du même kit interdit en toutes lettres : « filtre par statut, jamais par
 * date ; un opérateur unique cherche ce qui attend, pas ce qui s'est passé mardi ». « Passés »
 * est exactement « ce qui s'est passé mardi », et c'est la seule chose dont personne n'a
 * besoin sur un écran de console. Les étapes sont donc les trois statuts que la base porte
 * réellement — `pending · confirmed · cancelled` — précédés de « tout ». Le pied de l'écran
 * nomme l'écart, comme il nomme les autres.
 *
 * UNE ACTION PAR LIGNE, ET LA DÉCISION DANS LA FICHE. Confirmer et refuser sont deux issues
 * d'une même décision : les poser côte à côte sur chaque ligne, c'est « une hésitation par
 * ligne ». La ligne porte l'état et l'ouverture ; la fiche porte le message, les coordonnées,
 * et les deux issues — dans cet ordre, parce qu'on décide APRÈS avoir lu.
 */

type Stage = 'all' | Appointment['status'];

const STATUS_TONE: Record<Appointment['status'], TagTone> = {
  pending: 'warn',
  confirmed: 'ok',
  cancelled: 'neutral',
};

const STATUS_TINT: Record<Appointment['status'], string> = {
  pending: '--mm-orange',
  confirmed: '--ok',
  cancelled: '--ink-2',
};

export default function AdminAppointments() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const { addToast } = useToast();

  const STATUS_LABELS: Record<Appointment['status'], string> = {
    pending: t('appointments.statusPending'),
    confirmed: t('appointments.statusConfirmed'),
    cancelled: t('appointments.statusCancelled'),
  };

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<Stage>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  /** Demande ouverte — la fiche du motif : on lit, puis on décide. */
  const [openId, setOpenId] = useState<string | null>(null);
  /** Date de la MESURE, posée quand la lecture revient. */
  const [asOf, setAsOf] = useState(() => new Date());

  const load = () => {
    setLoading(true);
    getAllAppointments()
      .then((data) => { setAppointments(data); setAsOf(new Date()); setLoading(false); })
      .catch(() => { addToast('error', t('appointments.toastLoadError')); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: Appointment['status']) => {
    setUpdating(id);
    try {
      await updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      addToast('success', status === 'confirmed' ? t('appointments.toastConfirmed') : t('appointments.toastCancelled'));
    } catch {
      addToast('error', t('appointments.toastUpdateError'));
    } finally {
      setUpdating(null);
    }
  };

  const stages: Stage[] = ['all', 'pending', 'confirmed', 'cancelled'];
  const stageLabels: Record<Stage, string> = {
    all: t('appointments.stageAll'),
    pending: t('appointments.stagePending'),
    confirmed: t('appointments.stageConfirmed'),
    cancelled: t('appointments.stageCancelled'),
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter((a) => {
      const matchSearch = !q
        || a.name.toLowerCase().includes(q)
        || a.email.toLowerCase().includes(q)
        || a.subject.toLowerCase().includes(q);
      const matchStage = stage === 'all' || a.status === stage;
      return matchSearch && matchStage;
    });
  }, [appointments, search, stage]);

  /** Les compteurs portent sur la COLLECTION entière, jamais sur l'affichage filtré. */
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;

  const sheet = appointments.find((a) => a.id === openId) ?? null;

  return (
    // `.play` en dur : voir AdminDashboard.
    <div className="play">
      <ConsolePage title={t('appointments.title')} sub={t('appointments.sub')}>
        <div className="mb-3.5 flex justify-end">
          <Button size="sm" tone="quiet" onClick={load} disabled={loading}>
            {t('appointments.refresh')}
          </Button>
        </div>

        <ConsoleFilter
          className="rv"
          stages={stages.map((s) => stageLabels[s])}
          active={stageLabels[stage]}
          onSelect={(label) => setStage(stages.find((s) => stageLabels[s] === label) ?? 'all')}
          label={t('appointments.pipelineLabel')}
        />

        <div className="mt-3.5 grid gap-2.5 stack:grid-cols-3">
          <StatTile
            label={t('appointments.tilePending')}
            value={loading ? null : pendingCount}
            source="db"
            asOf={asOf}
            foot={t('appointments.footToDecide')}
          />
          <StatTile
            label={t('appointments.tileConfirmed')}
            value={loading ? null : confirmedCount}
            source="db"
            asOf={asOf}
            foot={t('appointments.footAgreed')}
          />
          <StatTile
            label={t('appointments.tileTotal')}
            value={loading ? null : appointments.length}
            source="db"
            asOf={asOf}
            foot={t('appointments.footAllStatuses')}
          />
        </div>

        <div className="mt-3.5 max-w-sm">
          <Field
            as="input"
            type="search"
            label={t('appointments.searchLabel')}
            hideLabel
            value={search}
            onChange={setSearch}
            placeholder={t('appointments.searchPlaceholder')}
            inputMode="search"
          />
        </div>

        {/* ── La fiche : on lit la demande, puis on décide ──────────────────────── */}
        {sheet && (
          <GlassPanel level="night" padding={18} className="rv mt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SiteEyebrow style={{ marginBottom: '4px' }}>{t('appointments.sheetEyebrow')}</SiteEyebrow>
                <p className="m-0 text-[15px] font-bold text-ink">{sheet.name}</p>
                <p className="m-0 mt-1 text-meta-2 text-ink-2">{sheet.subject}</p>
              </div>
              <Button size="sm" tone="quiet" onClick={() => setOpenId(null)}>
                {t('appointments.closeSheet')}
              </Button>
            </div>

            <div className="mt-3.5">
              <DocLine
                label={t('appointments.docWhen')}
                value={t('appointments.dateAtTime', { date: sheet.date, time: sheet.time })}
              />
              <DocLine label={t('appointments.docEmail')} value={sheet.email} />
              {sheet.phone && <DocLine label={t('appointments.docPhone')} value={sheet.phone} />}
              <DocLine label={t('appointments.docSubject')} value={sheet.subject} />
              <DocLine label={t('appointments.docReceivedAt')} value={formatDate(sheet.createdAt)} />
              <DocLine label={t('appointments.docMessage')} value={sheet.message || '—'} last />
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {sheet.status !== 'confirmed' && (
                <Button
                  size="sm"
                  tone="forme"
                  onClick={() => handleStatus(sheet.id, 'confirmed')}
                  loading={updating === sheet.id}
                >
                  {t('appointments.confirm')}
                </Button>
              )}
              {sheet.status !== 'cancelled' && (
                <Button
                  size="sm"
                  tone="quiet"
                  onClick={() => handleStatus(sheet.id, 'cancelled')}
                  loading={updating === sheet.id}
                >
                  {sheet.status === 'pending' ? t('appointments.refuse') : t('appointments.cancel')}
                </Button>
              )}
            </div>
          </GlassPanel>
        )}

        <SiteEyebrow style={{ marginTop: '22px', marginBottom: '10px' }}>
          {stageLabels[stage]}
        </SiteEyebrow>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={60} radius="var(--r-l)" label={t('appointments.title')} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="calendar" size={26} color="var(--mm-bleu)" />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 22%, transparent)"
            title={t('appointments.emptyTitle')}
            body={t('appointments.emptyBody')}
          />
        ) : (
          <ConsoleList label={t('appointments.listLabel')} className="rv">
            {filtered.map((a, i) => (
              <li key={a.id}>
                <LessonRow
                  icon={<Icon name="calendar" size={14} color={`var(${STATUS_TINT[a.status]})`} />}
                  iconBackground={`color-mix(in srgb, var(${STATUS_TINT[a.status]}) 22%, transparent)`}
                  title={a.name}
                  meta={`${t('appointments.dateAtTime', { date: a.date, time: a.time })} · ${a.subject}`}
                  trailing={
                    <span className="flex items-center gap-2">
                      <Tag tone={STATUS_TONE[a.status]}>{STATUS_LABELS[a.status]}</Tag>
                      <Button
                        size="sm"
                        tone="quiet"
                        onClick={() => setOpenId(openId === a.id ? null : a.id)}
                      >
                        {t('appointments.open')}
                      </Button>
                    </span>
                  }
                  last={i === filtered.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}

        <ConsoleScope>{t('appointments.scope')}</ConsoleScope>
      </ConsolePage>
    </div>
  );
}
