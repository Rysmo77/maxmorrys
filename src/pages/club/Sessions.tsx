import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon, Num } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import DsNavHost from '../../components/layout/DsNavHost';
import { SiteBand } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { LIVE_SESSIONS_PER_MONTH } from '../../lib/club/pricing';
import { getPublicClubStats, type PublicClubStats } from '../../lib/firestore/club';
import { queryKeys } from '../../lib/queryClient';
import { HERO_TOP } from './parts';

/**
 * /club-des-digitos/sessions — maquette `Club-Evenements.dc.html` (+ `-mobile`), lot C.
 *
 * La maquette liste quatre rendez-vous « d'exemple ». Les sessions vivent dans
 * `club_sessions`, lisible par les seuls membres (`firestore.rules`, non modifié par ce lot) :
 * cette page publique ne peut donc lire aucune date. Elle garde la mise en page — héros,
 * bande « À venir », carte d'engagement — et met, à la place des cartes d'exemple, une carte
 * qui dit où sont les dates. Le seul nombre est l'engagement de l'offre et, à côté, ce qui a
 * été tenu (`public_stats/club`, « non relevé » tant que le relevé n'existe pas).
 */
export default function ClubSessionsPage() {
  const { t } = useTranslation('ecrans');
  const path = useLocalizedPath();
  const asOf = useRef(new Date()).current;
  const { data: stats } = useQuery<PublicClubStats | null>({
    queryKey: queryKeys.publicClubStats,
    queryFn: () => getPublicClubStats(),
  });
  const k = (s: string) => `club.sessions.${s}`;

  return (
    <DsNavHost>
      <SEOHead title={t(k('title'))} description={t(k('seoDescription'))} />

      <section className="mm-lhero px-[18px] pb-14 stack:px-11" style={HERO_TOP}>
        <span className="mm-kick">{t(k('kick'), { n: LIVE_SESSIONS_PER_MONTH })}</span>
        <h1 className="!text-[36px] stack:!text-[78px]">{t(k('heroA'))} <em>{t(k('heroEm'))}</em></h1>
        <p className="mm-lhero__sub !text-[16px] stack:!text-[18px]">{t(k('sub'))}</p>
      </section>

      <SiteBand style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="mb-[18px] flex items-end justify-between gap-3">
          <h2 className="mm-d m-0 text-[30px] text-ink stack:text-[40px]">{t(k('upcoming'))}</h2>
          <span className="mm-tag is-club"><Icon name="lock" size={12} />{t(k('membersOnly'))}</span>
        </div>

        {/* La carte qui remplace la liste : même gabarit qu'une session de la maquette
            (cartouche · vignette · texte · mention), mais elle ne prétend à aucune date. */}
        <article className="grid items-center gap-4 rounded-card border border-[color:var(--line)] bg-bento p-4 stack:grid-cols-[76px_minmax(0,1fr)_auto] stack:gap-5">
          <span
            aria-hidden="true"
            className="grid h-[76px] w-[76px] place-items-center rounded-m text-transforme"
            style={{ background: 'color-mix(in srgb, var(--mm-violet) 10%, transparent)' }}
          >
            <Icon name="calendar" size={28} />
          </span>
          <div className="min-w-0">
            <span className="text-[12px] font-bold text-transforme">{t(k('cardKick'))}</span>
            <b className="mb-1 mt-1.5 block text-[17px] leading-[1.2] text-ink">{t(k('emptyTitle'))}</b>
            <span className="text-[13.5px] leading-[1.5] text-ink-2">{t(k('emptyBody'))}</span>
          </div>
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
            <Icon name="lock" size={14} />{t(k('reserved'))}
          </span>
        </article>

        <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-card border border-[color:var(--line)] bg-bento px-7 py-6 stack:flex-row stack:items-center">
          <div>
            <b className="block text-[17px] text-ink">{t(k('commitment'), { n: LIVE_SESSIONS_PER_MONTH })}</b>
            <span className="text-[14px] text-ink-2">
              {t(k('heldPre'), { days: stats?.windowDays ?? 90 })}{' '}
              <Num
                value={stats?.liveSessionsHeld ?? null}
                source="server"
                asOf={stats ? new Date(stats.asOf) : asOf}
                showAsOf={Boolean(stats)}
              />
              {' · '}{t(k('heldPost'))}
            </span>
          </div>
          <a className="mm-btn-club flex-none" href={path('/club-des-digitos/adhesion')}>{t(k('cta'))}</a>
        </div>
      </SiteBand>
    </DsNavHost>
  );
}
