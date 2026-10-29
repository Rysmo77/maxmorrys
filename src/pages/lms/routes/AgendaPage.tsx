import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Icon, IconButton, Num } from '@ds';
import SEOHead from '../../../components/seo/SEOHead';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { CardEmpty, EduCard, EduGrid, EduHead, EduPage } from '../../../components/edu/g4/EduParts';
import { getClubEvents, getClubSessions } from '../../../lib/firestore';
import { captureError } from '../../../lib/sentry';
/* Sous-ensemble du contexte de `StudentLayout` lu ici, déclaré localement : l'importer ferait
   compter à cette route les namespaces de la coquille (`tests/unit/route-namespaces.test.ts`). */
interface AgendaOutlet {
  isClubActive?: boolean;
}

/**
 * AGENDA — maquette `Edu-Agenda` (+ `-mobile`), passe 2 lot B.
 *
 * La semaine en colonnes (08:00 → 21:00), puis le panneau « À venir » et « Rappels ».
 * Seules des données DATÉES ET RÉELLES y entrent : les sessions et les événements du Club,
 * lisibles par un membre actif (`club_sessions`, `club_events` — règles Firestore). Les
 * lives de cohorte, quiz et missions de la maquette n'ont pas encore de producteur daté
 * côté serveur : ils n'apparaissent pas, et la carte le dit (D-09).
 *
 * Les heures sont celles de l'appareil — à Dakar, c'est GMT.
 */
interface AgendaItem {
  id: string;
  title: string;
  at: Date;
  kind: 'session' | 'event';
  minutes: number;
}

const HOUR_FIRST = 8;
const HOUR_LAST = 21;
const ROW = 46;

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7; // lundi = 0
  x.setDate(x.getDate() - offset);
  return x;
}

function parseEventDate(date: string, time?: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T${time && /^\d{1,2}:\d{2}/.test(time) ? time.padStart(5, '0') : '00:00'}`) : new Date(date);
}

function minutesOf(duration?: string): number {
  const n = duration ? parseInt(duration, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 60;
}

export default function AgendaPage() {
  const { t, i18n } = useTranslation('ecrans');
  const ctx = useOutletContext<AgendaOutlet | undefined>();
  const isClubActive = ctx?.isClubActive ?? false;
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [asOf, setAsOf] = useState<Date | null>(null);

  useEffect(() => {
    if (!isClubActive) return;
    let alive = true;
    Promise.all([getClubSessions(), getClubEvents()])
      .then(([sessions, events]) => {
        if (!alive) return;
        const list: AgendaItem[] = [
          ...sessions.map((s) => ({ id: `s-${s.id}`, title: s.title, at: new Date(s.scheduledAt), kind: 'session' as const, minutes: minutesOf(s.duration) })),
          ...events.map((e) => ({ id: `e-${e.id}`, title: e.title, at: parseEventDate(e.date, e.time), kind: 'event' as const, minutes: 60 })),
        ].filter((x) => !Number.isNaN(x.at.getTime()));
        setItems(list.sort((a, b) => a.at.getTime() - b.at.getTime()));
        setAsOf(new Date());
      })
      .catch((error: unknown) => captureError(error, { context: 'AgendaPage club agenda' }));
    return () => { alive = false; };
  }, [isClubActive]);

  const lang = i18n.language === 'en' ? 'en-GB' : 'fr-FR';
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);
  const weekEnd = new Date(days[6].getFullYear(), days[6].getMonth(), days[6].getDate() + 1);
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const fmtDay = new Intl.DateTimeFormat(lang, { weekday: 'short' });
  const fmtRange = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });
  const fmtTime = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
  const fmtWhen = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const rangeLabel = `${fmtRange.format(days[0])} – ${fmtRange.format(days[6])} ${days[6].getFullYear()}`;

  const inWeek = items.filter((x) => x.at >= weekStart && x.at < weekEnd);
  const upcoming = items.filter((x) => x.at >= today).slice(0, 4);
  const shift = (n: number) => setWeekStart((w) => { const x = new Date(w); x.setDate(x.getDate() + 7 * n); return x; });

  const hours = Array.from({ length: HOUR_LAST - HOUR_FIRST + 1 }, (_, i) => HOUR_FIRST + i);

  const aside = (
    <>
      <EduCard title={t('edu.agenda.upcomingTitle')}>
        {upcoming.length === 0 || !asOf ? (
          <CardEmpty
            icon="calendar"
            title={t('edu.agenda.empty')}
            body={isClubActive ? t('edu.agenda.body') : t('edu.agenda.bodyNoClub')}
          />
        ) : (
          upcoming.map((x) => (
            <div key={x.id} className="mm-ev">
              <span className="ico" style={{ background: 'var(--mm-violet-c)', color: 'var(--mm-violet-f)' }}>
                <Icon name={x.kind === 'session' ? 'video' : 'users'} size={20} />
              </span>
              <span className="min-w-0">
                <b>{x.title}</b>
                <span>
                  <Num value={fmtWhen.format(x.at)} source="db" asOf={asOf} />
                </span>
              </span>
            </div>
          ))
        )}
      </EduCard>
      <EduCard title={t('edu.agenda.remindersTitle')}>
        <CardEmpty icon="bell" title={t('edu.agenda.remindersEmpty')} body={t('edu.agenda.remindersBody')} />
      </EduCard>
    </>
  );

  return (
    <EduPage>
      <SEOHead title={t('edu.agenda.title')} description={t('edu.agenda.empty')} noIndex />
      <EduHead
        eyebrow={t('edu.agenda.eyebrow')}
        title={t('edu.agenda.title')}
        aside={
          <div className="flex items-center gap-2">
            <IconButton label={t('edu.agenda.prevWeek')} onClick={() => shift(-1)}>
              <Icon name="chevron-left" size={18} />
            </IconButton>
            <b className="text-[15px] font-semibold tabular-nums">{rangeLabel}</b>
            <IconButton label={t('edu.agenda.nextWeek')} onClick={() => shift(1)}>
              <Icon name="chevron-right" size={18} />
            </IconButton>
          </div>
        }
      />
      <EduGrid aside={aside} asideWidth={340}>
        <section className="mm-card overflow-x-auto" style={{ padding: '16px 18px' }}>
          <div className="min-w-[640px]">
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7,1fr)' }}>
              <div />
              {days.map((d) => (
                <div key={d.toISOString()} className="py-[10px] text-center">
                  <span className="text-[12px] capitalize text-ink-2">{fmtDay.format(d).replace('.', '')}</span>
                  <b
                    className="mt-1 block text-[18px] font-semibold tabular-nums"
                    style={sameDay(d, today) ? { color: 'var(--mm-bleu-f)' } : undefined}
                  >
                    {d.getDate()}
                  </b>
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7,1fr)' }}>
              <div>
                {hours.map((h) => (
                  <div key={h} className="text-[11px] tabular-nums text-ink-3" style={{ height: ROW, borderTop: '1px solid transparent' }}>
                    {`${String(h).padStart(2, '0')}:00`}
                  </div>
                ))}
              </div>
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className="relative"
                  style={{ borderLeft: '1px solid var(--line)', background: sameDay(d, today) ? 'color-mix(in srgb, var(--mm-bleu-c) 28%, transparent)' : undefined }}
                >
                  {hours.map((h) => <div key={h} style={{ height: ROW, borderTop: '1px solid var(--line)' }} />)}
                  {sameDay(d, today) && today.getHours() >= HOUR_FIRST && today.getHours() <= HOUR_LAST && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 z-[1]"
                      style={{ top: (today.getHours() + today.getMinutes() / 60 - HOUR_FIRST) * ROW, height: 2, background: 'var(--mm-corail-f)' }}
                    >
                      <i className="absolute -left-[5px] -top-[4px] h-[10px] w-[10px] rounded-pill" style={{ background: 'var(--mm-corail-f)' }} />
                    </span>
                  )}
                  {asOf && inWeek.filter((x) => sameDay(x.at, d)).map((x) => {
                    const h = x.at.getHours() + x.at.getMinutes() / 60;
                    const top = Math.max(0, Math.min(h - HOUR_FIRST, HOUR_LAST - HOUR_FIRST)) * ROW + 2;
                    return (
                      <div
                        key={x.id}
                        className="absolute left-1 right-1 overflow-hidden rounded-m text-[12px] font-semibold leading-[1.25]"
                        style={{
                          top,
                          minHeight: 42,
                          height: Math.max(42, (x.minutes / 60) * ROW - 4),
                          background: 'var(--mm-violet-c)',
                          borderLeft: '3px solid var(--mm-violet-f)',
                          color: 'var(--mm-violet-t)',
                          padding: '7px 9px',
                        }}
                      >
                        {x.title}
                        <span className="mt-[3px] block text-[10.5px] font-medium" style={{ opacity: 0.8 }}>
                          <Num value={fmtTime.format(x.at)} source="db" asOf={asOf} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
        {!isClubActive && (
          <p className="m-0 text-[13px] text-ink-2">
            {t('edu.agenda.clubHint')}{' '}
            <LocalizedLink to="/club-des-digitos" className="font-semibold text-ink">{t('edu.agenda.clubLink')} →</LocalizedLink>
          </p>
        )}
      </EduGrid>
    </EduPage>
  );
}
