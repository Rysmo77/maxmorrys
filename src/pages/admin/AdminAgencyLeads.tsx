import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, Field, GlassPanel, Icon, LessonRow, Num, Skeleton, StatTile, Tag } from '@ds';
import type { TagTone } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { useToast } from '../../components/ui/Toast';
import { getAllAgencyLeads, updateAgencyLeadStatus, updateAgencyLeadNotes, deleteAgencyLead } from '../../lib/firestore';
import { computeTotals, PIPELINE_STAGES } from '../../lib/presence/offer';
import { exportToCsv } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
import type { AgencyLead, AgencyLeadStatus } from '../../types';

/**
 * L'ÉCRAN `ProspectsOps` DU KIT — le cycle de vente Présence Digitale.
 *
 * LE MOTIF EST APPLIQUÉ DANS SA LECTURE COMPLÈTE, celle du README du kit : « une liste
 * filtrable par statut, UNE FICHE D'ÉDITION, une action tracée. » L'ancien écran empilait
 * quatre commandes sur chaque prospect — WhatsApp, changement de statut, notes, suppression —
 * soit quatre hésitations par ligne. Elles ne sont pas supprimées : elles descendent dans la
 * fiche, qui s'ouvre depuis la ligne. La ligne, elle, porte un état et UNE action : ouvrir.
 *
 * DEUX ÉCARTS AVEC LE KIT :
 *
 *   • Le kit ouvre sur un `Segmented` « Présence Digitale / Agence » — deux cycles de vente
 *     que le kit dit ne jamais fusionner. La base n'en stocke qu'UN : `agency_leads`,
 *     alimenté par /presence-digitale (le préfixe `agency_` est historique, cf.
 *     `lib/firestore/agency.ts`). Un sélecteur dont la seconde entrée serait vide en
 *     permanence apprendrait faux ; il n'est pas rendu, et le pied le dit.
 *   • `PIPELINE_STAGES` est la source d'autorité des cinq étapes, pas le kit : ce sont les
 *     mêmes (`new · qualified · quoted · signed · lost`), et elles vivent déjà dans
 *     `lib/presence/offer.ts` avec leurs libellés traduits. « tout » est ajouté en tête,
 *     par la convention de `ConsoleFilter`.
 */

type Stage = 'all' | AgencyLeadStatus;

const STATUS_TONE: Record<AgencyLeadStatus, TagTone> = {
  new: 'warn',
  qualified: 'neutral',
  quoted: 'neutral',
  signed: 'ok',
  lost: 'stop',
};

const STATUS_TINT: Record<AgencyLeadStatus, string> = {
  new: '--mm-orange',
  qualified: '--mm-bleu',
  quoted: '--mm-violet',
  signed: '--ok',
  lost: '--ink-2',
};

export default function AdminAgencyLeads() {
  const { t } = useTranslation('admin');
  const { formatDate, formatPrice } = useFormat();
  const { addToast } = useToast();

  const [leads, setLeads] = useState<AgencyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<Stage>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  /** Fiche ouverte — le motif du kit : la liste dense, puis UNE fiche d'édition. */
  const [openLead, setOpenLead] = useState<string | null>(null);
  /** Brouillon local des notes, indexé par prospect — évite un aller-retour par frappe */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  /** Date de la MESURE, posée quand la lecture revient. */
  const [asOf, setAsOf] = useState(() => new Date());

  const load = () => {
    setLoading(true);
    getAllAgencyLeads()
      .then((data) => { setLeads(data); setAsOf(new Date()); setLoading(false); })
      .catch(() => { addToast('error', t('agencyLeads.toastLoadError')); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: AgencyLeadStatus) => {
    setUpdating(id);
    try {
      await updateAgencyLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      addToast('success', t('agencyLeads.toastUpdated'));
    } catch {
      addToast('error', t('agencyLeads.toastUpdateError'));
    } finally {
      setUpdating(null);
    }
  };

  /** Enregistre au `blur` : une écriture par frappe saturerait Firestore pour rien. */
  const handleSaveNote = async (id: string) => {
    const draft = noteDrafts[id];
    const current = leads.find((l) => l.id === id)?.notes ?? '';
    if (draft === undefined || draft === current) return;
    setSavingNote(id);
    try {
      await updateAgencyLeadNotes(id, draft);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: draft } : l)));
      addToast('success', t('agencyLeads.toastNoteSaved'));
    } catch {
      addToast('error', t('agencyLeads.toastUpdateError'));
    } finally {
      setSavingNote(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('agencyLeads.confirmDelete'))) return;
    setUpdating(id);
    try {
      await deleteAgencyLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setOpenLead((prev) => (prev === id ? null : prev));
      addToast('success', t('agencyLeads.toastDeleted'));
    } catch {
      addToast('error', t('agencyLeads.toastUpdateError'));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      const matchSearch = !q
        || l.businessName.toLowerCase().includes(q)
        || l.contactName.toLowerCase().includes(q)
        || l.phone.includes(q)
        || l.city.toLowerCase().includes(q);
      const matchStage = stage === 'all' || l.status === stage;
      return matchSearch && matchStage;
    });
  }, [leads, search, stage]);

  /** Les compteurs portent sur la COLLECTION entière, jamais sur l'affichage filtré. */
  const counts = useMemo(() => {
    const acc = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0])) as Record<AgencyLeadStatus, number>;
    for (const l of leads) acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, [leads]);

  const stages: Stage[] = ['all', ...PIPELINE_STAGES];
  const stageLabel = (s: Stage) => (s === 'all' ? t('agencyLeads.stageAll') : t(`agencyLeads.status.${s}`));

  /** Lien WhatsApp direct — le canal de réponse attendu par le prospect. */
  const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  /** Exporte ce qui est affiché, filtres compris — pas la collection entière. */
  const handleExport = () => {
    const headers = [
      t('agencyLeads.csv.date'), t('agencyLeads.csv.business'), t('agencyLeads.csv.contact'),
      t('agencyLeads.csv.phone'), t('agencyLeads.csv.email'), t('agencyLeads.csv.city'),
      t('agencyLeads.csv.sector'), t('agencyLeads.csv.pack'), t('agencyLeads.csv.plan'),
      t('agencyLeads.csv.upfront'), t('agencyLeads.csv.monthly'), t('agencyLeads.csv.status'),
      t('agencyLeads.csv.referral'), t('agencyLeads.csv.quoteRef'),
      t('agencyLeads.csv.message'), t('agencyLeads.csv.notes'),
    ];
    const rows = filtered.map((l) => {
      const totals = computeTotals(l.pack, l.plan);
      return [
        formatDate(l.createdAt), l.businessName, l.contactName,
        l.phone, l.email ?? '', l.city,
        t(`agencyLeads.sectors.${l.sector}`, { defaultValue: l.sector }),
        t(`agencyLeads.packs.${l.pack}`, { defaultValue: l.pack }),
        t(`agencyLeads.plans.${l.plan}`, { defaultValue: l.plan }),
        totals.upfront, totals.planMonthly,
        t(`agencyLeads.status.${l.status}`),
        l.referralCode ?? '', l.quoteRef ?? '',
        l.message ?? '', l.notes ?? '',
      ];
    });
    exportToCsv(t('agencyLeads.csv.filename'), headers, rows);
  };

  const sheet = leads.find((l) => l.id === openLead) ?? null;
  const sheetTotals = sheet ? computeTotals(sheet.pack, sheet.plan) : null;

  return (
    // `.play` en dur : voir AdminDashboard.
    <div className="play">
      <ConsolePage title={t('agencyLeads.title')} sub={t('agencyLeads.sub')}>
        <div className="mb-3.5 flex flex-wrap items-center justify-end gap-2">
          <Button size="sm" tone="quiet" onClick={handleExport} disabled={filtered.length === 0}>
            {t('agencyLeads.export')}
          </Button>
          <Button size="sm" tone="quiet" onClick={load} disabled={loading}>
            {t('agencyLeads.refresh')}
          </Button>
        </div>

        <ConsoleFilter
          className="rv"
          stages={stages.map(stageLabel)}
          active={stageLabel(stage)}
          onSelect={(label) => setStage(stages.find((s) => stageLabel(s) === label) ?? 'all')}
          label={t('agencyLeads.pipelineLabel')}
        />

        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
          <StatTile
            label={t('agencyLeads.tileToQualify')}
            value={loading ? null : counts.new}
            source="db"
            asOf={asOf}
            foot={t('agencyLeads.footNewest')}
          />
          <StatTile
            label={t('agencyLeads.tileSigned')}
            value={loading ? null : counts.signed}
            source="db"
            asOf={asOf}
            foot={t('agencyLeads.footSignedValue')}
          />
          <StatTile
            label={t('agencyLeads.tileTotal')}
            value={loading ? null : leads.length}
            source="db"
            asOf={asOf}
            foot={t('agencyLeads.footAllStages')}
          />
        </div>

        <div className="mt-3.5 max-w-sm">
          <Field
            as="input"
            type="search"
            label={t('agencyLeads.searchLabel')}
            hideLabel
            value={search}
            onChange={setSearch}
            placeholder={t('agencyLeads.searchPlaceholder')}
            inputMode="search"
          />
        </div>

        {/* ── La fiche d'édition — tout ce que la ligne ne porte pas ────────────── */}
        {sheet && sheetTotals && (
          <GlassPanel level="night" padding={18} className="rv mt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SiteEyebrow style={{ marginBottom: '4px' }}>{t('agencyLeads.sheetEyebrow')}</SiteEyebrow>
                <p className="m-0 text-[15px] font-bold text-ink">{sheet.businessName}</p>
                <p className="m-0 mt-1 text-meta-2 text-ink-2">
                  {t('agencyLeads.receivedOn', { date: formatDate(sheet.createdAt) })}
                </p>
              </div>
              <Button size="sm" tone="quiet" onClick={() => setOpenLead(null)}>
                {t('agencyLeads.closeSheet')}
              </Button>
            </div>

            <div className="mt-3.5">
              <DocLine label={t('agencyLeads.docContact')} value={`${sheet.contactName} · ${sheet.phone}`} />
              <DocLine label={t('agencyLeads.docCity')} value={sheet.city} />
              <DocLine
                label={t('agencyLeads.docSector')}
                value={t(`agencyLeads.sectors.${sheet.sector}`, { defaultValue: sheet.sector })}
              />
              <DocLine
                label={t('agencyLeads.docPack')}
                value={t(`agencyLeads.packs.${sheet.pack}`, { defaultValue: sheet.pack })}
              />
              <DocLine
                label={t('agencyLeads.docPlan')}
                value={t(`agencyLeads.plans.${sheet.plan}`, { defaultValue: sheet.plan })}
              />
              {/* Les montants sortent de la grille tarifaire, jamais d'un calcul local :
                  `computeTotals` est la source, <Num> la dit. */}
              <DocLine
                label={t('agencyLeads.docUpfront')}
                value={<Num value={formatPrice(sheetTotals.upfront)} source="db" asOf={asOf} />}
              />
              <DocLine
                label={t('agencyLeads.docMonthly')}
                value={<Num value={formatPrice(sheetTotals.planMonthly)} source="db" asOf={asOf} />}
              />
              {sheet.referralCode && (
                <DocLine label={t('agencyLeads.docReferral')} value={sheet.referralCode} />
              )}
              {sheet.quoteRef && (
                <DocLine
                  label={t('agencyLeads.docQuote')}
                  value={
                    <a
                      href={`/agence/devis/${sheet.quoteRef}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-digitalise-txt hover:underline"
                    >
                      {t('agencyLeads.quoteRef', { ref: sheet.quoteRef })}
                    </a>
                  }
                />
              )}
              <DocLine label={t('agencyLeads.docMessage')} value={sheet.message || '—'} last />
            </div>

            {/* Le statut est l'ÉTAT de la fiche, pas une action : il se règle par un champ. */}
            <div className="mt-3.5 max-w-xs">
              <Field
                as="select"
                label={t('agencyLeads.changeStatus')}
                value={sheet.status}
                onChange={(v) => handleStatus(sheet.id, v as AgencyLeadStatus)}
                disabled={updating === sheet.id}
                options={PIPELINE_STAGES.map((s) => ({ value: s, label: t(`agencyLeads.status.${s}`) }))}
              />
            </div>

            {/* Notes internes — jamais visibles du prospect (cf. firestore.rules) */}
            <div className="mt-3.5">
              <Field
                as="textarea"
                rows={3}
                label={sheet.notes ? t('agencyLeads.notesEdit') : t('agencyLeads.notesAdd')}
                value={noteDrafts[sheet.id] ?? sheet.notes ?? ''}
                onChange={(v) => setNoteDrafts((p) => ({ ...p, [sheet.id]: v }))}
                onBlur={() => handleSaveNote(sheet.id)}
                placeholder={t('agencyLeads.notesPlaceholder')}
                hint={savingNote === sheet.id ? t('agencyLeads.notesSaving') : t('agencyLeads.notesHint')}
              />
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2">
              <Button size="sm" tone="digitalise" href={waLink(sheet.phone)} target="_blank">
                {t('agencyLeads.whatsapp')}
              </Button>
              <Button
                size="sm"
                tone="quiet"
                onClick={() => handleDelete(sheet.id)}
                loading={updating === sheet.id}
              >
                {t('agencyLeads.delete')}
              </Button>
            </div>
          </GlassPanel>
        )}

        <SiteEyebrow style={{ marginTop: '22px', marginBottom: '10px' }}>
          {stageLabel(stage)}
        </SiteEyebrow>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={60} radius="var(--r-l)" label={t('agencyLeads.title')} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="case" size={26} color="var(--mm-teal)" />}
            glyphBackground="color-mix(in srgb, var(--mm-teal) 22%, transparent)"
            title={t('agencyLeads.emptyTitle')}
            body={t('agencyLeads.emptyBody')}
          />
        ) : (
          <ConsoleList label={t('agencyLeads.listLabel')} className="rv">
            {filtered.map((lead, i) => (
              <li key={lead.id}>
                <LessonRow
                  icon={<Icon name="case" size={14} color={`var(${STATUS_TINT[lead.status]})`} />}
                  iconBackground={`color-mix(in srgb, var(${STATUS_TINT[lead.status]}) 22%, transparent)`}
                  title={lead.businessName}
                  meta={`${lead.city} · ${t(`agencyLeads.sectors.${lead.sector}`, { defaultValue: lead.sector })} · ${formatDate(lead.createdAt)}`}
                  trailing={
                    <span className="flex items-center gap-2">
                      <Tag tone={STATUS_TONE[lead.status]}>{t(`agencyLeads.status.${lead.status}`)}</Tag>
                      <Button
                        size="sm"
                        tone="quiet"
                        onClick={() => setOpenLead(openLead === lead.id ? null : lead.id)}
                      >
                        {t('agencyLeads.open')}
                      </Button>
                    </span>
                  }
                  last={i === filtered.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}

        <ConsoleScope>{t('agencyLeads.scope')}</ConsoleScope>
      </ConsolePage>
    </div>
  );
}
