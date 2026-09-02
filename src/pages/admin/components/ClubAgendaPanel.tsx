import { useTranslation } from 'react-i18next';
import { DocLine, GlassPanel, Num, Tag } from '@ds';
import { SiteEyebrow } from '../../../components/site';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosEvent, ClubDigitosSession } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA PROCHAINE ÉCHÉANCE DU CLUB — troisième colonne de la console Club.
 *
 * `handoff_tableaux_de_bord/dashboards-console-2.jsx` § EvenementsDesktop, dont le
 * panneau porte deux choses : la fiche de la session sélectionnée, et l'engagement
 * qui la gouverne — « la session a lieu MÊME SI NOUS SOMMES QUATRE ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UN ÉCART DE STRUCTURE, ET IL VIENT DE L'ÉCRAN, PAS DE LA MAQUETTE
 *
 * La maquette dessine un écran « Événements » dédié, avec une liste et donc une
 * sélection. Ce dépôt a un CONCENTRATEUR à neuf sections — abonnements, publications,
 * événements, sessions, infos, défis, profils, opportunités, signalements — dont les
 * événements et les sessions ne sont que deux. Il n'y a pas de ligne sélectionnée à
 * l'échelle de l'écran, et en fabriquer une pour neuf sections hétérogènes serait
 * inventer un état que rien ne porte.
 *
 * Le panneau porte donc ce qui vaut pour les neuf : LA PROCHAINE ÉCHÉANCE. C'est la
 * seule chose du Club qui ait une date — tout le reste se consulte quand on veut — et
 * c'est exactement ce que la maquette met en avant côté apprenant (`ClubDesktop`).
 * L'édition d'un événement reste dans sa section, où elle est déjà complète.
 *
 * ⚠️ AUCUNE LECTURE SUPPLÉMENTAIRE. `useAdminClub` charge déjà événements et sessions
 * pour alimenter les compteurs du filtre. Ce panneau les trie, il ne les redemande pas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * « 4 / 12 PLACES » N'EST PAS REPRIS. `ClubDigitosEvent` n'a pas de champ de capacité,
 * et aucune collection ne compte les places restantes. Le nombre d'INSCRITS, lui, existe
 * — mais il est chargé à la demande, par section, et l'afficher ici ferait une lecture
 * par changement d'onglet. Le panneau annonce donc la date et le format, qui sont sur le
 * document, et laisse le compte là où il se relève.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
interface ClubAgendaPanelProps {
  events: ClubDigitosEvent[];
  sessions: ClubDigitosSession[];
  /** Instant de la lecture qui a produit les deux listes. `null` = jamais relevé. */
  loadedAt: Date | null;
}

export default function ClubAgendaPanel({ events, sessions, loadedAt }: ClubAgendaPanelProps) {
  const { t } = useTranslation('adminClub');
  const { locale } = useFormat();

  const asOf = loadedAt ?? new Date();

  const upcoming = [
    ...events
      .filter((e) => e.status === 'upcoming')
      .map((e) => ({
        id: `e-${e.id}`,
        at: new Date(e.date).getTime(),
        title: e.title,
        kind: e.type === 'online' ? t('panel.kindOnline') : t('panel.kindInPerson'),
        where: e.type === 'online' ? t('panel.kindOnline') : e.location,
        iso: e.date,
        time: e.time,
        duration: undefined as string | undefined,
      })),
    ...sessions
      .filter((s) => s.status === 'upcoming')
      .map((s) => ({
        id: `s-${s.id}`,
        at: new Date(s.scheduledAt).getTime(),
        title: s.title,
        kind: t('panel.kindSession'),
        where: t('panel.kindOnline'),
        iso: s.scheduledAt,
        time: undefined as string | undefined,
        duration: s.duration,
      })),
  ]
    .filter((x) => Number.isFinite(x.at))
    .sort((a, b) => a.at - b.at);

  const next = upcoming[0] ?? null;

  return (
    <>
      <SiteEyebrow>{t('panel.eyebrow')}</SiteEyebrow>

      {!loadedAt ? (
        <GlassPanel level="night" padding={18} className="mt-3">
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('panel.loading')}</p>
        </GlassPanel>
      ) : !next ? (
        /* UN ZÉRO DATÉ, PAS UN TIRET. « L'agenda est publié un mois à l'avance » est un
           engagement de la page publique : un agenda vide est une information sur cet
           engagement, et elle doit se lire ici plutôt que se déduire d'une absence. */
        <GlassPanel level="night" padding={18} className="rv mt-3" style={{ ['--i' as string]: 1 }}>
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('panel.empty')}</p>
        </GlassPanel>
      ) : (
        <>
          <div className="mt-3 flex items-start justify-between gap-3">
            <p className="m-0 font-display text-[18px] font-black leading-tight tracking-[-.03em] text-ink">
              {next.title}
            </p>
            <Tag tone="ok">{next.kind}</Tag>
          </div>

          <GlassPanel level="night" padding={18} className="rv mt-3.5" style={{ ['--i' as string]: 1 }}>
            <DocLine
              label={t('panel.docDate')}
              value={(
                <Num
                  value={new Date(next.iso).toLocaleDateString(locale, {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                  source="db"
                  asOf={asOf}
                />
              )}
            />
            <DocLine
              label={t('panel.docTime')}
              value={(
                <Num
                  value={next.time ?? new Date(next.iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  source="db"
                  asOf={asOf}
                />
              )}
            />
            <DocLine label={t('panel.docFormat')} value={next.kind} />
            <DocLine label={t('panel.docWhere')} value={next.where || <Num value={null} source="db" asOf={asOf} />} />
            <DocLine
              label={t('panel.docDuration')}
              value={<Num value={next.duration ?? null} source="db" asOf={asOf} />}
              last
            />
          </GlassPanel>

          <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-3">
            <Num value={upcoming.length} source="db" asOf={asOf} />{' '}
            {t('panel.upcomingCount', { count: upcoming.length })}
          </p>
        </>
      )}

      <GlassPanel level="night" padding={16} className="rv mt-3.5" style={{ ['--i' as string]: 2 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('panel.commitmentTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('panel.commitmentBody')}</p>
      </GlassPanel>

      <GlassPanel level="night" padding={16} className="rv mt-3.5" style={{ ['--i' as string]: 3 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('panel.reminderTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('panel.reminderBody')}</p>
      </GlassPanel>
    </>
  );
}
