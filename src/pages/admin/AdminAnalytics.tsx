import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, GlassPanel, Icon, LessonRow, Num, ProgressBar, Skeleton, StatTile } from '@ds';
import type { NumSource } from '@ds';
import { ConsolePage, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { getPlatformStats, getAgencyStats, getPopupStats } from '../../lib/firestore';
import type { AgencyStats, PopupStatRow } from '../../lib/firestore';
import { PIPELINE_STAGES } from '../../lib/presence/offer';

/**
 * ── RELEVÉ — l'écran en tension frontale avec le motif, et l'arbitrage rendu ────────
 *
 * LE MOTIF DIT : « la console n'est pas un tableau de bord d'analyse : c'est une liste de
 * choses à faire aujourd'hui », et le pied de `DashboardOps` ajoute « ni analyse d'audience,
 * ni cohortes, ni graphiques ». Cet écran s'appelait « Analytics » et faisait exactement ce
 * que ces deux phrases refusent. Il n'est pourtant ni supprimé ni vidé : il est TRIÉ.
 *
 *   • CE QUI EST UNE FILE D'ATTENTE passe au motif. Quatre chiffres de cet écran n'étaient
 *     pas de la mesure mais du travail en retard — messages non traités, prospects agence
 *     non qualifiés, formations non publiées, articles en brouillon. Ils étaient rendus en
 *     barres de progression, c'est-à-dire en constat. Ils sont maintenant des LIGNES, avec
 *     une action chacune, qui mènent à l'écran qui les traite. Une file ne se contemple pas.
 *
 *   • CE QUI EST DE LA MESURE PURE reste de la mesure — et chaque case porte sa date de
 *     relevé, prise à la seconde où la requête a répondu. « Une case sans date affiche
 *     non relevé, jamais une estimation. »
 *
 *   • CE QUI ÉTAIT UNE ESTIMATION EST PARTI. Le bloc « Appareils » affichait 62 % mobile,
 *     31 % ordinateur, 7 % tablette — trois nombres ÉCRITS EN DUR dans le fichier, identiques
 *     à chaque chargement depuis le premier jour, sous une mention « données estimées ». Ce
 *     n'est pas une case sans date : c'est une case fausse. Aucune date ne la rattrape, et
 *     la règle ne dit pas « dater les estimations », elle dit « jamais une estimation ».
 *     Le tableau récapitulatif est parti aussi : ses sept lignes rejouaient, en moins lisible,
 *     les cases de relevé situées quinze centimètres plus haut.
 *
 * PAS DE ZONE 1 SUR CET ÉCRAN, ET C'EST DÉLIBÉRÉ. Le filtre par statut répond à « qu'est-ce
 * qui attend » ; ici la réponse n'est pas un filtre, c'est la liste elle-même, qui est la
 * première chose à l'écran. Un filtre par période aurait été l'autre réponse possible — et
 * c'est précisément celle que le motif interdit : « jamais par date ».
 * ────────────────────────────────────────────────────────────────────────────────────
 */

interface Stats {
  users: number;
  formations: number;
  publishedFormations: number;
  articles: number;
  publishedPosts: number;
  messages: number;
  newMessages: number;
  enrollments: number;
  subscribers: number;
  agencyLeads: number;
  newAgencyLeads: number;
}

/**
 * Une répartition, rendue en LISTE DATÉE et non plus en barres.
 *
 * Les quatre répartitions de l'agence — par pack, par accompagnement, par secteur, par ville
 * — étaient des graphiques à barres, donc de l'analyse de cohortes sur un écran qui n'en
 * veut pas. L'information, elle, sert : c'est ce qui se vend et à qui. Elle reste, sous la
 * forme que le motif accepte — un libellé, un nombre, sa source.
 */
function Distribution({ title, entries, asOf }: {
  title: string;
  entries: Record<string, number>;
  asOf: Date;
}) {
  const rows = Object.entries(entries).sort(([, a], [, b]) => b - a).slice(0, 6);
  if (rows.length === 0) return null;
  return (
    <div>
      <SiteEyebrow style={{ marginBottom: '8px' }}>{title}</SiteEyebrow>
      {rows.map(([key, count], i) => (
        <DocLine
          key={key}
          label={key}
          value={<Num value={count} source="db" asOf={asOf} showAsOf={false} />}
          last={i === rows.length - 1}
        />
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const { t } = useTranslation('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [agency, setAgency] = useState<AgencyStats | null>(null);
  const [popups, setPopups] = useState<PopupStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  /*
    LA DATE DE RELEVÉ, prise quand les trois requêtes ont répondu — pas au rendu, pas à
    l'ouverture de l'onglet. C'est elle que porte chaque case, et elle change à chaque
    « Actualiser » : un relevé de ce matin ne se fait pas passer pour celui de maintenant.
  */
  const [asOf, setAsOf] = useState<Date | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getPlatformStats(), getAgencyStats(), getPopupStats()])
      .then(([s, a, p]) => {
        setStats(s);
        setAgency(a);
        setPopups(p);
        setAsOf(new Date());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* Un ratio n'est lu nulle part : il est calculé sur deux compteurs de base. On le dit. */
  const ratioSource: NumSource = { cite: t('analytics.ratioCite') };
  const stamp = asOf ?? new Date();

  const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

  /*
    LA FILE. Quatre choses en retard, et rien d'autre — une ligne n'apparaît que si son
    compteur est strictement positif. Zéro n'est pas une tâche.
  */
  const queue = stats ? ([
    { key: 'messages', n: stats.newMessages, to: '/admin/messages', nav: 'nav.messages', glyph: 'chat' as const, token: '--stop' },
    { key: 'leads', n: stats.newAgencyLeads, to: '/admin/prospects-agence', nav: 'nav.agencyLeads', glyph: 'case' as const, token: '--mm-teal' },
    { key: 'formations', n: stats.formations - stats.publishedFormations, to: '/admin/formations', nav: 'nav.formations', glyph: 'book' as const, token: '--mm-orange' },
    { key: 'drafts', n: stats.articles - stats.publishedPosts, to: '/admin/articles', nav: 'nav.articles', glyph: 'doc' as const, token: '--mm-bleu' },
  ]).filter((row) => row.n > 0) : [];

  return (
    <ConsolePage title={t('analytics.title')} sub={t('analytics.sub')}>
      {loading && (
        <GlassPanel level="night" padding="14px 18px">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={44} label={i === 0 ? t('analytics.title') : undefined} style={{ marginBottom: '8px' }} />
          ))}
        </GlassPanel>
      )}

      {!loading && (
        <>
          {/* ── Zone 2 · ce qui attend ─────────────────────────────────────────── */}
          <SiteEyebrow style={{ marginBottom: '10px' }}>{t('analytics.queueTitle')}</SiteEyebrow>
          {queue.length === 0 ? (
            <GlassPanel level="night" padding={8}>
              <EmptyState
                glyph={<Icon name="check" size={26} color="var(--ok)" />}
                glyphBackground="color-mix(in srgb, var(--ok) 18%, transparent)"
                title={t('analytics.queueEmptyTitle')}
                body={t('analytics.queueEmptyBody')}
              />
            </GlassPanel>
          ) : (
            <ConsoleList label={t('analytics.queueTitle')}>
              {queue.map((row, i) => (
                <li key={row.key}>
                  <LessonRow
                    icon={<Icon name={row.glyph} size={14} color={`var(${row.token})`} />}
                    iconBackground={`color-mix(in srgb, var(${row.token}) 20%, transparent)`}
                    title={t(`analytics.queue.${row.key}`, { count: row.n })}
                    meta={t(row.nav)}
                    trailing={<Button size="sm" tone="quiet" href={row.to}>{t('analytics.queueOpen')}</Button>}
                    last={i === queue.length - 1}
                  />
                </li>
              ))}
            </ConsoleList>
          )}

          {/* ── Le relevé ──────────────────────────────────────────────────────── */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <SiteEyebrow>{t('analytics.measuredTitle')}</SiteEyebrow>
            <Button size="sm" tone="quiet" onClick={load}>
              <Icon name="repeat" size={15} /> {t('analytics.refresh')}
            </Button>
          </div>

          {stats && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile label={t('analytics.statUsers')} value={stats.users} source="db" asOf={stamp} />
              <StatTile
                label={t('analytics.statFormations')}
                value={stats.formations}
                source="db"
                asOf={stamp}
                foot={t('analytics.footPublished', { count: stats.publishedFormations })}
              />
              <StatTile
                label={t('analytics.statArticles')}
                value={stats.articles}
                source="db"
                asOf={stamp}
                foot={t('analytics.footPublished', { count: stats.publishedPosts })}
              />
              <StatTile
                label={t('analytics.statMessages')}
                value={stats.messages}
                source="db"
                asOf={stamp}
                foot={t('analytics.footHandled', { count: stats.messages - stats.newMessages })}
              />
              <StatTile label={t('analytics.statSubscribers')} value={stats.subscribers} source="db" asOf={stamp} />
              <StatTile label={t('analytics.statEnrollments')} value={stats.enrollments} source="db" asOf={stamp} />
            </div>
          )}

          {stats && (
            <GlassPanel level="night" padding={18} className="mt-3">
              <SiteEyebrow style={{ marginBottom: '14px' }}>{t('analytics.keyIndicators')}</SiteEyebrow>
              <div className="space-y-4">
                {([
                  { key: 'enrollmentRate', value: pct(stats.enrollments, stats.users) },
                  { key: 'articlePublishRate', value: pct(stats.publishedPosts, stats.articles) },
                  { key: 'formationPublishRate', value: pct(stats.publishedFormations, stats.formations) },
                ]).map((ratio) => (
                  <div key={ratio.key}>
                    {/* Le libellé de `ProgressBar` n'est qu'un nom accessible : il se voit ici. */}
                    <p className="m-0 mb-1.5 text-meta-2 text-ink-2">{t(`analytics.${ratio.key}`)}</p>
                    <ProgressBar
                      value={ratio.value}
                      source={ratioSource}
                      asOf={stamp}
                      label={t(`analytics.${ratio.key}`)}
                      readout
                    />
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* ── Agence : les trois montants, l'entonnoir, les répartitions ─────── */}
          {agency && agency.total > 0 && (
            <GlassPanel level="night" padding={18} className="mt-3">
              <SiteEyebrow style={{ marginBottom: '14px' }}>{t('analytics.agencyTitle')}</SiteEyebrow>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label={t('analytics.agencyWeighted')} value={agency.pipelineWeighted} unit="FCFA" source="db" asOf={stamp} />
                <StatTile label={t('analytics.agencySignedValue')} value={agency.signedValue} unit="FCFA" source="db" asOf={stamp} />
                <StatTile label={t('analytics.agencyConversion')} value={Math.round(agency.conversionRate * 100)} unit="%" source={ratioSource} asOf={stamp} />
              </div>

              <div className="mt-5">
                <SiteEyebrow style={{ marginBottom: '8px' }}>{t('analytics.agencyFunnel')}</SiteEyebrow>
                {PIPELINE_STAGES.map((stage, i) => (
                  <DocLine
                    key={stage}
                    label={t(`agencyLeads.status.${stage}`)}
                    value={<Num value={agency.byStatus[stage] ?? 0} source="db" asOf={stamp} showAsOf={false} />}
                    last={i === PIPELINE_STAGES.length - 1}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Distribution title={t('analytics.agencyByPack')} entries={agency.byPack} asOf={stamp} />
                <Distribution title={t('analytics.agencyByPlan')} entries={agency.byPlan} asOf={stamp} />
                <Distribution title={t('analytics.agencyBySector')} entries={agency.bySector} asOf={stamp} />
                <Distribution title={t('analytics.agencyByCity')} entries={agency.byCity} asOf={stamp} />
              </div>
            </GlassPanel>
          )}

          {/*
            Pop-ups. La colonne « témoin » est la SEULE qui réponde à la vraie question : le taux
            de clic dit combien de gens cliquent, jamais si la fenêtre a aidé. Une pop-up peut
            être très cliquée tout en faisant fuir plus de visiteurs qu'elle n'en convertit.
          */}
          <GlassPanel level="night" padding={18} className="mt-3">
            <SiteEyebrow>{t('analytics.popupsTitle')}</SiteEyebrow>
            <p className="m-0 mb-3 mt-1 text-meta-2 leading-[1.5] text-ink-2">{t('analytics.popupsSubtitle')}</p>

            {popups.length === 0 ? (
              <p className="m-0 text-meta-2 leading-relaxed text-ink-2">{t('analytics.popupsEmpty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--line)] text-left text-small uppercase tracking-wider text-ink-2">
                      <th className="px-3 py-2 font-semibold">{t('analytics.popupsColPopup')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('analytics.popupsColImpressions')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('analytics.popupsColClicks')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('analytics.popupsColCtr')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('analytics.popupsColControl')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--line)]">
                    {popups.map((row) => {
                      const shown = row.treatment.impressions;
                      return (
                        <tr key={row.popupId}>
                          <td className="px-3 py-2.5 font-medium text-ink">{row.popupId}</td>
                          <td className="px-3 py-2.5 text-right"><Num value={shown} source="db" asOf={stamp} showAsOf={false} /></td>
                          <td className="px-3 py-2.5 text-right"><Num value={row.treatment.clicks} source="db" asOf={stamp} showAsOf={false} /></td>
                          <td className="px-3 py-2.5 text-right">
                            <Num value={pct(row.treatment.clicks, shown)} unit="%" source={ratioSource} asOf={stamp} showAsOf={false} />
                          </td>
                          <td className="px-3 py-2.5 text-right"><Num value={row.control.withheld} source="db" asOf={stamp} showAsOf={false} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-meta-2 leading-relaxed text-ink-2">{t('analytics.popupsNote')}</p>
          </GlassPanel>
        </>
      )}

      <ConsoleScope>{t('analytics.scope')}</ConsoleScope>
    </ConsolePage>
  );
}
