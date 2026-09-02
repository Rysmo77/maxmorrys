import { useTranslation } from 'react-i18next';
import { GlassPanel, Icon, Tag } from '@ds';
import { useFormat } from '../../../../hooks/useFormat';
import type { useClubData } from '../../hooks/useClubData';

type ClubData = ReturnType<typeof useClubData>;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * « À VENIR » — troisième colonne du Club.
 *
 * `handoff_tableaux_de_bord/dashboards-app.jsx` § ClubDesktop : « Le panneau porte
 * l'agenda : c'est la seule chose du Club qui a une échéance. » Tout le reste du Club
 * — le fil, les membres, les opportunités, le parrainage — se consulte quand on veut.
 * Une session, non : elle a lieu à une heure, et la manquer est définitif.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AUCUNE LECTURE SUPPLÉMENTAIRE. `useClubData` charge déjà `clubEvents`,
 * `clubSessions` et l'état d'inscription de la personne pour l'onglet Agenda. Ce
 * panneau est de la mise en forme, pas une requête de plus.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX CHOSES DE LA MAQUETTE NE SONT PAS REPRISES, ET C'EST MESURÉ
 *
 * · « 4 / 12 PLACES ». `ClubDigitosEvent` n'a pas de champ de capacité, et aucune
 *   collection ne compte les places restantes. Le nombre serait inventé — exactement
 *   ce que le README du handoff appelle « un mensonge qu'on oublie de retirer ».
 *   L'étiquette d'inscription, elle, est réelle : elle vient de `registeredEvents`.
 *
 * · « TA VAGUE — 4ᵉ sur 9 ». La comparaison par vague d'arrivée n'existe pas dans ce
 *   produit : `getClubLeaderboard()` rend un top 20 ABSOLU, trié par expérience.
 *   `ClubLeaderboard` documente déjà ce même écart et l'écrit à l'écran plutôt que de
 *   le sous-entendre. Le rappeler ici sous une autre forme reviendrait à l'affirmer.
 *
 * ⚠️ LE PANNEAU RESTE À L'ÉCRAN QUAND L'AGENDA EST VIDE. « L'agenda est publié un mois
 * à l'avance — c'est un engagement de la page publique, pas une habitude » : un panneau
 * qui disparaît quand il n'y a rien laisse croire que l'engagement n'existe pas.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
interface ClubAgendaPanelProps {
  data: ClubData;
}

export default function ClubAgendaPanel({ data }: ClubAgendaPanelProps) {
  const { t } = useTranslation('club');
  const { locale } = useFormat();
  const { clubEvents, clubSessions, registeredEvents, registeredSessions } = data;

  const when = (iso: string, time?: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return time ?? '';
    const day = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const hour = time ?? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${hour}`;
  };

  /* Les deux collections fusionnées, triées par échéance, plafonnées à trois. Au-delà,
     ce n'est plus « ce qui vient » mais l'onglet Agenda — qui existe et porte tout. */
  const upcoming = [
    ...clubEvents
      .filter((e) => e.status === 'upcoming')
      .map((e) => ({
        id: `e-${e.id}`,
        at: new Date(e.date).getTime(),
        title: e.title,
        meta: `${when(e.date, e.time)} · ${e.type === 'online' ? t('events.online') : e.location}`,
        glyph: e.type === 'online' ? ('chat' as const) : ('users' as const),
        gradient: e.type === 'online' ? 'var(--action-transforme)' : 'var(--action-digitalise)',
        registered: registeredEvents.has(e.id),
      })),
    ...clubSessions
      .filter((s) => s.status === 'upcoming')
      .map((s) => ({
        id: `s-${s.id}`,
        at: new Date(s.scheduledAt).getTime(),
        title: s.title,
        meta: `${when(s.scheduledAt)}${s.duration ? ` · ${s.duration}` : ''}`,
        glyph: 'video' as const,
        gradient: 'var(--action-transforme)',
        registered: registeredSessions.has(s.id),
      })),
  ]
    .filter((x) => Number.isFinite(x.at))
    .sort((a, b) => a.at - b.at)
    .slice(0, 3);

  return (
    <>
      <p className="mm-eyebrow m-0">{t('panel.upcomingEyebrow')}</p>

      {upcoming.length === 0 ? (
        <GlassPanel level="flat" padding={16} className="rv mt-2.5" style={{ ['--i' as string]: 1 }}>
          <p className="m-0 text-meta-2 leading-[1.5] text-ink-2">{t('panel.upcomingEmpty')}</p>
        </GlassPanel>
      ) : (
        upcoming.map((item, i) => (
          <GlassPanel
            key={item.id}
            level="flat"
            padding={16}
            className="rv mt-2.5"
            style={{ ['--i' as string]: i + 1 }}
          >
            <div className="flex gap-[11px]">
              <span
                aria-hidden="true"
                className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[12px]"
                style={{ background: item.gradient }}
              >
                <Icon name={item.glyph} size={17} color="var(--paper-fixed)" />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-meta font-semibold leading-[1.35]">{item.title}</p>
                <p className="m-0 mt-0.5 text-meta-2 text-ink-2">{item.meta}</p>
              </div>
            </div>
            {item.registered && <Tag tone="ok" style={{ marginTop: '12px' }}>{t('panel.registered')}</Tag>}
          </GlassPanel>
        ))
      )}

      <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-3">{t('panel.upcomingNote')}</p>
    </>
  );
}
