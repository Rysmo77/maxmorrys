import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Skeleton } from '@ds';
import SEOHead from '../../../../components/seo/SEOHead';
import LocalizedLink from '../../../../components/shared/LocalizedLink';
import { useFormat } from '../../../../hooks/useFormat';
import { getClubSessions } from '../../../../lib/firestore/club';
import type { ClubDigitosSession } from '../../../../types';
import { ClubScreen } from '../../tabs/club/ClubScreen';
import { useClubAccess } from './useClubAccess';

/** Une session est « en cours » de son heure de début à trois heures après. */
const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

/**
 * /mon-espace/club/live — maquette `Club-Live.dc.html` (+ `-mobile`), lot C.
 *
 * DONNÉES RÉELLES : `club_sessions`. L'écran prend la session en cours, sinon la prochaine
 * programmée. Son titre, sa date, sa durée et sa description viennent de la console ; si un
 * lien de session est renseigné, le bouton l'ouvre (c'est l'outil de visioconférence qui
 * porte le direct, pas cette page).
 *
 * CE QUI N'EST PAS RECOPIÉ : le flux vidéo intégré, le nombre de connectés, « prendre la
 * parole », les réactions et le chat de groupe. Aucun n'a de producteur ; la scène sombre est
 * gardée, sans caméra simulée, et le panneau de discussion dit où écrire en attendant.
 */
export default function ClubLivePage() {
  const { t } = useTranslation('ecrans');
  const { locale } = useFormat();
  const access = useClubAccess();
  const [sessions, setSessions] = useState<ClubDigitosSession[] | null>(null);
  const k = (s: string) => `club.live.${s}`;

  useEffect(() => {
    if (access !== 'member') return;
    let alive = true;
    getClubSessions()
      .then((all) => { if (alive) setSessions(all); })
      .catch(() => { if (alive) setSessions([]); });
    return () => { alive = false; };
  }, [access]);

  const { session, live } = useMemo(() => {
    const now = Date.now();
    const timed = (sessions ?? [])
      .map((s) => ({ s, at: Date.parse(s.scheduledAt) }))
      .filter((x) => Number.isFinite(x.at))
      .sort((a, b) => a.at - b.at);
    const current = timed.find((x) => x.at <= now && now - x.at < LIVE_WINDOW_MS);
    const upcoming = timed.find((x) => x.at > now);
    const pick = current ?? upcoming;
    return { session: pick?.s ?? null, live: Boolean(current) };
  }, [sessions]);

  if (access !== 'member') return access;

  const when = session
    ? new Date(session.scheduledAt).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : '';

  return (
    <>
      <SEOHead title={session?.title || t(k('title'))} description={t(k('body'))} noIndex />
      <ClubScreen
        title={session?.title || t(k('title'))}
        subtitle={session ? `${t(k('kick'))} · ${when} GMT${session.duration ? ` · ${session.duration}` : ''}` : t(k('empty'))}
        circlesLabel={t('club.circles.label')}
        circlesEmpty={t('club.circles.empty')}
      >
        {sessions === null ? (
          <Skeleton height={420} radius="var(--r-media)" label={t(k('title'))} />
        ) : (
          <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-4">
              {/* La scène reste sombre, comme dans la maquette (`.dk` est une portée, AD-3). */}
              <div className="dk relative flex min-h-[300px] flex-col items-center justify-center gap-4 overflow-hidden rounded-media bg-night p-6 text-center stack:min-h-[420px]">
                {session && live && (
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-pill bg-[color:var(--mm-corail)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.1em] text-[color:var(--paper-fixed)]">
                    <i className="h-1.5 w-1.5 rounded-pill bg-[color:var(--paper-fixed)]" aria-hidden="true" />{t(k('liveBadge'))}
                  </span>
                )}
                <span className="grid h-16 w-16 place-items-center rounded-pill text-ink" style={{ background: 'var(--fill-1)' }} aria-hidden="true">
                  <Icon name="video" size={28} />
                </span>
                <b className="max-w-[34ch] text-[18px] text-ink">
                  {!session ? t(k('empty')) : live ? t(k('stageLive')) : t(k('stageSoon'))}
                </b>
                {session?.link ? (
                  <a className="mm-btn-club" href={session.link} target="_blank" rel="noopener noreferrer">
                    {t(k('join'))} <Icon name="external" size={15} />
                  </a>
                ) : (
                  <p className="m-0 max-w-[44ch] text-[13.5px] text-ink-2">{session ? t(k('noLink')) : t(k('body'))}</p>
                )}
              </div>

              <div className="grid gap-4 stack:grid-cols-2">
                <section className="mm-card !p-5">
                  <h3 className="!text-[18px] text-ink">{t(k('programTitle'))}</h3>
                  <p className="m-0 mt-2 whitespace-pre-line text-[14px] leading-[1.55] text-ink-2">
                    {session?.description || t(k('programEmpty'))}
                  </p>
                </section>
                <section className="mm-card !p-5">
                  <span className="mm-eyebrow">{t(k('afterKick'))}</span>
                  <b className="mt-2 block text-[16px] text-ink">{t(k('afterTitle'))}</b>
                  <LocalizedLink to="/mon-espace/club/fil" className="mm-ulink mt-3">{t(k('afterCta'))}</LocalizedLink>
                </section>
              </div>
            </div>

            <section className="mm-card !p-5">
              <h3 className="!text-[18px] text-ink">{t(k('chatTitle'))}</h3>
              <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-ink-2">{t(k('chatEmpty'))}</p>
              <LocalizedLink to="/mon-espace/club/discussions" className="mm-ulink mt-3">{t(k('chatCta'))}</LocalizedLink>
              <p className="m-0 mt-5 border-t border-[color:var(--line)] pt-3 text-[12px] text-ink-3">{t(k('notRecorded'))}</p>
            </section>
          </div>
        )}
      </ClubScreen>
    </>
  );
}
