import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, GlassPanel, Icon, LessonRow, Num, Tag } from '@ds';
import { ConsoleFilter, ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { getDmReports, updateDmReportStatus, deleteDmReport, deleteDmMessage } from '../../../lib/firestore';
import { useFormat } from '../../../hooks/useFormat';
import { captureError } from '../../../lib/sentry';
import type { DmReport } from '../../../types';
import ConsoleListSkeleton from './ConsoleListSkeleton';

/**
 * ── SIGNALEMENTS — le constat bloquant du lot, et sa correction ─────────────────────
 *
 * CE QUI ÉTAIT RENDU. Trois boutons par ligne : « Supprimer le message », « Marquer
 * résolu », « Supprimer le signalement ». DEUX d'entre eux sont destructifs et
 * irréversibles, ils étaient côte à côte, ET ils portaient LE MÊME GLYPHE `trash`. Sur
 * l'écran de modération, c'est-à-dire l'écran où l'on agit vite, sur des lignes qui se
 * ressemblent toutes, souvent après avoir lu quelque chose de désagréable.
 *
 * Les deux gestes n'ont rien de commun. Supprimer le MESSAGE retire un contenu de la
 * conversation de deux personnes — il ne repousse pas, et l'auteur comme le destinataire le
 * verront disparaître. Supprimer le SIGNALEMENT jette la trace de la plainte et laisse le
 * message en place : c'est le geste qui dit « rien à signaler ». Confondre les deux, c'est
 * soit censurer quelqu'un qui n'avait rien fait, soit classer sans suite un harcèlement.
 *
 * LA CORRECTION. La ligne porte UN état et UNE action : ouvrir la fiche. Les trois gestes
 * vivent dans la feuille, sous le message signalé rendu EN ENTIER, chacun nommé en toutes
 * lettres, séparés, et les deux destructifs gardent leur confirmation — qui reprend son sens
 * dès lors qu'on voit ce sur quoi elle porte.
 *
 * ZONE 1 · `status: 'open' | 'resolved'` existe en base depuis toujours et n'était pas
 * filtrable : un signalement résolu occupait exactement la même place qu'un signalement qui
 * attend. La file s'ouvre donc sur « à traiter ».
 * ────────────────────────────────────────────────────────────────────────────────────
 */
type Stage = 'all' | DmReport['status'];

const STAGES: Stage[] = ['all', 'open', 'resolved'];

export default function ClubReportsAdminTab() {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [reports, setReports] = useState<DmReport[]>([]);
  const [loading, setLoading] = useState(true);
  /*
   * L'INSTANT OÙ LA REQUÊTE A RÉPONDU — pas celui du rendu.
   *
   * Les deux identifiants tronqués plus bas sont en monospace, et la règle 6 dit pourquoi :
   * la fonte signale une valeur qui vient du système. Ils la portaient sans passer par
   * `<Num>`, c'est-à-dire sans dire d'où ils venaient ni quand ils avaient été relevés.
   * `new Date()` au rendu aurait prétendu qu'ils venaient d'être vérifiés à chaque
   * réaffichage ; c'est la réponse de `getDmReports()` qui fait foi.
   */
  const [readAt, setReadAt] = useState<Date | null>(null);
  const [stage, setStage] = useState<Stage>('open');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getDmReports()
      .then((r) => { setReports(r); setReadAt(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const resolve = async (r: DmReport) => {
    setReports((prev) => prev.map((x) => x.id === r.id ? { ...x, status: 'resolved' } : x));
    setOpenId(null);
    try { await updateDmReportStatus(r.id, 'resolved'); addToast('success', t('reports.resolved')); }
    catch { addToast('error', t('common.genericError')); }
  };

  const removeReport = (r: DmReport) => {
    confirm.requestConfirm(t('reports.deleteReportConfirm'), async () => {
      try {
        await deleteDmReport(r.id);
        setReports((prev) => prev.filter((x) => x.id !== r.id));
        setOpenId(null);
        addToast('success', t('reports.reportDeleted'));
      } catch { addToast('error', t('common.deleteError')); }
      confirm.closeConfirm();
    });
  };

  const removeMessage = (r: DmReport) => {
    confirm.requestConfirm(t('reports.deleteMessageConfirm'), async () => {
      try {
        await deleteDmMessage(r.convId, r.messageId);
        await updateDmReportStatus(r.id, 'resolved').catch(() => null);
        setReports((prev) => prev.map((x) => x.id === r.id ? { ...x, status: 'resolved' } : x));
        setOpenId(null);
        addToast('success', t('reports.messageDeleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete reported DM message failed' });
        addToast('error', t('reports.messageDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const bar = useMemo(() => STAGES.map((s) => {
    const label = s === 'all' ? t('reports.stages.all') : t(s === 'open' ? 'reports.statusOpen' : 'reports.statusResolved');
    const n = s === 'all' ? reports.length : reports.filter((x) => x.status === s).length;
    return { key: s, text: `${label} ${n}` };
  }), [reports, t]);

  const filtered = useMemo(
    () => reports.filter((r) => stage === 'all' || r.status === stage),
    [reports, stage],
  );

  const sheet = reports.find((r) => r.id === openId) ?? null;

  /** La ligne montre l'AMORCE du message, pas le message : elle décide de l'ouvrir. */
  const excerpt = (s: string) => (s.length > 70 ? `${s.slice(0, 70)}…` : s);

  if (loading) return <ConsoleListSkeleton label={t('reports.listLabel')} />;

  return (
    <div>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === stage)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setStage(hit.key);
        }}
        label={t('reports.pipelineLabel')}
      />

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="flag" size={26} color="var(--ok)" />}
            glyphBackground="color-mix(in srgb, var(--ok) 20%, transparent)"
            title={t('reports.empty')}
            body={stage === 'open' ? t('reports.emptyOpen') : t('reports.emptyAll')}
          />
        ) : (
          <ConsoleList label={t('reports.listLabel')}>
            {filtered.map((r, i) => {
              const open = r.status === 'open';
              return (
                <li key={r.id}>
                  <LessonRow
                    onClick={() => setOpenId(r.id)}
                    icon={<Icon name="flag" size={14} color={`var(${open ? '--stop' : '--ink-2'})`} />}
                    iconBackground={`color-mix(in srgb, var(${open ? '--stop' : '--ink-2'}) 20%, transparent)`}
                    title={excerpt(r.text)}
                    meta={(
                      <>
                        {formatDate(r.createdAt)}
                        {' · '}
                        {t('reports.author')}
                        {' '}
                        <Num value={`${r.reportedUserId.slice(0, 8)}…`} source="db" asOf={readAt ?? new Date()} />
                      </>
                    )}
                    trailing={(
                      <Tag tone={open ? 'stop' : 'neutral'}>
                        {open ? t('reports.statusOpen') : t('reports.statusResolved')}
                      </Tag>
                    )}
                    last={i === filtered.length - 1}
                  />
                </li>
              );
            })}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('reports.scope')}</ConsoleScope>

      <ConsoleSheet
        open={Boolean(sheet)}
        onClose={() => setOpenId(null)}
        closeLabel={t('common.close')}
        eyebrow={sheet ? (sheet.status === 'open' ? t('reports.statusOpen') : t('reports.statusResolved')) : undefined}
        title={t('reports.sheetTitle')}
        footer={sheet && (
          <>
            {/* La destruction du CONTENU est à gauche, seule, et elle est nommée en entier :
                elle ne partage plus ni sa place ni son glyphe avec la destruction de la TRACE. */}
            <Button size="sm" tone="quiet" onClick={() => removeMessage(sheet)} style={{ marginRight: 'auto' }}>
              {t('reports.deleteMessage')}
            </Button>
            <Button size="sm" tone="quiet" onClick={() => removeReport(sheet)}>
              {t('reports.deleteReport')}
            </Button>
            {sheet.status === 'open' && (
              <Button size="sm" onClick={() => { void resolve(sheet); }}>{t('reports.markResolved')}</Button>
            )}
          </>
        )}
      >
        {sheet && (
          <div>
            {/* Le message signalé, EN ENTIER. C'est la seule chose sur laquelle les trois
                décisions portent ; la liste n'en montrait que soixante-dix caractères. */}
            <GlassPanel level="flat" padding={14}>
              <p className="m-0 whitespace-pre-wrap break-words text-small leading-[1.55] text-ink-2">
                {`« ${sheet.text} »`}
              </p>
            </GlassPanel>

            <div className="mt-4">
              <DocLine label={t('reports.dateLabel')} value={formatDate(sheet.createdAt)} />
              <DocLine
                label={t('reports.reportedBy')}
                value={<Num value={`${sheet.reporterId.slice(0, 8)}…`} source="db" asOf={readAt ?? new Date()} />}
              />
              <DocLine
                label={t('reports.author')}
                value={<Num value={`${sheet.reportedUserId.slice(0, 8)}…`} source="db" asOf={readAt ?? new Date()} />}
              />
              <DocLine
                label={t('reports.conversationLabel')}
                value={<Num value={`${sheet.convId.slice(0, 8)}…`} source="db" asOf={readAt ?? new Date()} />}
                last
              />
            </div>

            {/* Ce que chaque bouton FAIT, écrit au-dessus des boutons. Deux gestes
                irréversibles aux effets opposés ne se distinguent pas par leur couleur. */}
            <p className="m-0 mt-4 text-meta-2 leading-[1.55] text-ink-2">{t('reports.sheetNotice')}</p>
          </div>
        )}
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('reports.confirmTitle')}
        message={confirm.message}
        confirmLabel={t('reports.confirmLabel')}
      />
    </div>
  );
}
