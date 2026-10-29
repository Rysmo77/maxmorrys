import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Skeleton } from '@ds';
import SEOHead from '../../../../components/seo/SEOHead';
import LocalizedLink from '../../../../components/shared/LocalizedLink';
import { getClubChallenges } from '../../../../lib/firestore/club';
import { useFormat } from '../../../../hooks/useFormat';
import type { ClubDigitosChallenge } from '../../../../types';
import { ClubScreen } from '../../tabs/club/ClubScreen';
import { useClubAccess } from './useClubAccess';

/**
 * /mon-espace/club/defis — maquette `Club-Defis.dc.html` (+ `-mobile`), lot C.
 *
 * DONNÉES RÉELLES : `club_challenges` (titre, consigne, récompense, début, fin, actif), écrits
 * par la console. Le défi de la semaine est celui qui court aujourd'hui ; les défis passés sont
 * ceux dont la fin est dépassée.
 *
 * CE QUE LA MAQUETTE MONTRE ET QUE L'ÉCRAN NE MONTRE PAS : les « participations » (prénoms,
 * quartiers, compteurs) et les « coups de cœur ». Aucune publication n'est reliée à un défi
 * dans la base : la grille est remplacée par un état vide qui dit comment participer
 * aujourd'hui — publier au fil. « Participer » mène donc au fil, où l'on publie réellement.
 * La récompense s'affiche telle que la console l'a écrite, sans compteur inventé à côté.
 */
export default function ClubDefisPage() {
  const { t } = useTranslation('ecrans');
  const { locale } = useFormat();
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString(locale, o);
  const access = useClubAccess();
  const [challenges, setChallenges] = useState<ClubDigitosChallenge[] | null>(null);
  const k = (s: string) => `club.defis.${s}`;

  useEffect(() => {
    if (access !== 'member') return;
    let alive = true;
    getClubChallenges()
      .then((all) => { if (alive) setChallenges(all); })
      .catch(() => { if (alive) setChallenges([]); });
    return () => { alive = false; };
  }, [access]);

  const { current, past } = useMemo(() => {
    const now = Date.now();
    const list = challenges ?? [];
    const live = list.find((c) => c.active && Date.parse(c.startsAt) <= now && Date.parse(c.endsAt) >= now) ?? null;
    return {
      current: live,
      past: list.filter((c) => Date.parse(c.endsAt) < now).slice(0, 6),
    };
  }, [challenges]);

  if (access !== 'member') return access;

  return (
    <>
      <SEOHead title={t(k('title'))} description={t(k('sub'))} noIndex />
      <ClubScreen title={t(k('title'))} subtitle={t(k('sub'))} circlesLabel={t('club.circles.label')} circlesEmpty={t('club.circles.empty')}>
        <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            {challenges === null ? (
              <Skeleton height={280} radius="var(--r-media)" label={t(k('title'))} />
            ) : current ? (
              <section
                className="relative isolate flex min-h-[280px] flex-col justify-end overflow-hidden rounded-media p-6 text-[color:var(--paper-fixed)] stack:p-[30px]"
                style={{ background: 'radial-gradient(90% 100% at 80% 0%, var(--mm-orange), var(--mm-orange-t) 40%, var(--ink-fixed) 90%)' }}
              >
                <span className="mm-eyebrow !text-[color:var(--paper-fixed)]">
                  {t(k('weekKick'), { date: fmt(current.endsAt, { weekday: 'long', day: 'numeric', month: 'long' }) })}
                </span>
                <b className="mb-2.5 mt-3 block max-w-[16ch] font-display text-[34px] font-black leading-none stack:text-[52px]">{current.title}</b>
                {current.description && <span className="max-w-[52ch] text-[15px] opacity-90">{current.description}</span>}
                <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
                  <LocalizedLink
                    to="/mon-espace/club/fil"
                    className="rounded-xs bg-[color:var(--paper-fixed)] px-5 py-[13px] text-[14px] font-bold text-[color:var(--ink-fixed)] no-underline"
                  >
                    {t(k('participate'))}
                  </LocalizedLink>
                  {current.reward && <span className="text-[13px] font-semibold">{current.reward}</span>}
                </div>
              </section>
            ) : (
              <section className="mm-card !p-6 text-center">
                <span className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-m text-transforme" style={{ background: 'color-mix(in srgb, var(--mm-violet) 10%, transparent)' }}>
                  <Icon name="target" size={22} />
                </span>
                <b className="mt-3 block text-[18px] text-ink">{t(k('empty'))}</b>
                <p className="mx-auto mb-0 mt-1.5 max-w-[48ch] text-[14px] text-ink-2">{t(k('body'))}</p>
              </section>
            )}

            <h3 className="m-0 mt-1 text-[19px] font-semibold text-ink">{t(k('entriesTitle'))}</h3>
            <div className="mm-card !p-5">
              <p className="m-0 text-[14px] leading-[1.55] text-ink-2">{t(k('entriesEmpty'))}</p>
              <LocalizedLink to="/mon-espace/club/fil" className="mm-ulink mt-3">
                {t(k('toFeed'))} <Icon name="arrow-up-right" size={14} />
              </LocalizedLink>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <section className="mm-card !p-5">
              <h3 className="!text-[18px] text-ink">{t(k('howTitle'))}</h3>
              <ol className="m-0 mt-3 flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-[1.5] text-ink-2">
                {[t(k('how1')), t(k('how2')), t(k('how3'))].map((s) => <li key={s}>{s}</li>)}
              </ol>
            </section>
            <section className="mm-card !p-5">
              <h3 className="!text-[18px] text-ink">{t(k('pastTitle'))}</h3>
              {past.length === 0 ? (
                <p className="m-0 mt-2 text-[13.5px] text-ink-2">{t(k('pastEmpty'))}</p>
              ) : (
                <ul className="m-0 mt-2 list-none p-0">
                  {past.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 border-t border-[color:var(--line)] py-2.5 text-[14px] text-ink first:border-t-0">
                      <span className="min-w-0 truncate">{c.title}</span>
                      <span className="flex-none text-[12px] text-ink-3">{fmt(c.endsAt, { day: 'numeric', month: 'short' })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </ClubScreen>
    </>
  );
}
