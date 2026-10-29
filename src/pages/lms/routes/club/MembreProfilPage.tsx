import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, Skeleton } from '@ds';
import SEOHead from '../../../../components/seo/SEOHead';
import LocalizedLink from '../../../../components/shared/LocalizedLink';
import { useAuth } from '../../../../contexts/AuthContext';
import { useFormat } from '../../../../hooks/useFormat';
import { getClubPosts, getMyClubProfile } from '../../../../lib/firestore/club';
import { getInitials } from '../../../../lib/utils';
import type { ClubDigitosPost, ClubMemberProfile } from '../../../../types';
import { ClubScreen } from '../../tabs/club/ClubScreen';
import { useClubAccess, useClubShell } from './useClubAccess';

/** Les liens qu'un membre peut publier sur sa fiche, dans l'ordre de l'annuaire. */
const LINKS = ['linkedin', 'website', 'instagram', 'facebook', 'tiktok', 'youtube', 'twitter'] as const;

/**
 * /mon-espace/club/membres/:memberId — maquette `Club-Profil.dc.html` (+ `-mobile`), lot C.
 *
 * DONNÉES RÉELLES : la fiche d'annuaire (`club_profiles/{id}` : nom, accroche, ville,
 * compétences, disponibilité, liens), affichée seulement si le membre l'a rendue visible —
 * ou si c'est la sienne. Les publications récentes viennent du fil (`club_posts`) ; les
 * certificats, des certificats de la personne connectée, sur son propre profil uniquement.
 *
 * CE QUI EST MASQUÉ : la rangée « Au Club » (publications, retours donnés, sessions suivies,
 * badges). Aucun de ces compteurs n'est tenu par la base : le fil n'est lu que sur ses
 * dernières publications, un total calculé dessus serait faux. « Partager » n'est pas
 * recopié (un profil du Club n'a pas d'adresse publique).
 */
export default function ClubMembreProfilPage() {
  const { memberId = '' } = useParams();
  const { t } = useTranslation('ecrans');
  const { formatDate } = useFormat();
  const { user } = useAuth();
  const ctx = useClubShell();
  const access = useClubAccess();
  const k = (s: string) => `club.profil.${s}`;
  const own = user?.uid === memberId;

  const [profile, setProfile] = useState<ClubMemberProfile | null | undefined>(undefined);
  const [posts, setPosts] = useState<ClubDigitosPost[]>([]);

  useEffect(() => {
    if (access !== 'member' || !memberId) return;
    let alive = true;
    Promise.all([getMyClubProfile(memberId).catch(() => null), getClubPosts(60).catch(() => [])]).then(([p, all]) => {
      if (!alive) return;
      setProfile(p && (p.visible || own) ? p : null);
      setPosts(all.filter((x) => x.userId === memberId).slice(0, 6));
    });
    return () => { alive = false; };
  }, [access, memberId, own]);

  if (access !== 'member') return access;

  const certificates = own ? (ctx?.certificates ?? []) : [];

  return (
    <>
      <SEOHead title={profile?.displayName || t(k('title'))} description={t(k('body'))} noIndex />
      <ClubScreen
        above={(
          <LocalizedLink to="/mon-espace/club/membres" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink no-underline">
            <Icon name="chevron-left" size={15} />{t(k('back'))}
          </LocalizedLink>
        )}
        title={profile?.displayName || t(k('title'))}
        circlesLabel={t('club.circles.label')}
        circlesEmpty={t('club.circles.empty')}
      >
        {profile === undefined ? (
          <Skeleton height={320} radius="var(--r-l)" label={t(k('title'))} />
        ) : profile === null ? (
          <section className="mm-card !p-6 text-center">
            <b className="block text-[18px] text-ink">{t(k('empty'))}</b>
            <p className="mx-auto mb-0 mt-1.5 max-w-[48ch] text-[14px] text-ink-2">{t(k('body'))}</p>
          </section>
        ) : (
          <>
            <section className="mm-card !p-6">
              <div className="flex flex-wrap items-center gap-5">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="" className="h-[88px] w-[88px] flex-none rounded-pill object-cover" />
                ) : (
                  <span className="mm-avatar !h-[88px] !w-[88px] !text-[28px]">{getInitials(profile.displayName)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="mm-d m-0 text-[30px] text-ink stack:text-[38px]">{profile.displayName}</h2>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[14px] text-ink-2">
                    {profile.headline}
                    {profile.city && <><span aria-hidden="true">·</span><Icon name="pin" size={14} />{profile.city}</>}
                  </span>
                </div>
                {own && (
                  <LocalizedLink to="/mon-espace/club/membres" className="mm-btn-club is-sm">{t(k('edit'))}</LocalizedLink>
                )}
              </div>
            </section>

            <div className="grid items-start gap-4 wide:grid-cols-[320px_minmax(0,1fr)]">
              <div className="flex flex-col gap-4">
                <section className="mm-card !p-5">
                  <h3 className="!text-[18px] text-ink">{t(k('about'))}</h3>
                  {profile.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {profile.skills.map((s) => <span key={s} className="mm-chipd">{s}</span>)}
                    </div>
                  ) : (
                    <p className="m-0 mt-2 text-[13.5px] text-ink-2">{t(k('noSkills'))}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">
                    {profile.available && <span className="mm-tag is-club">{t(k('available'))}</span>}
                    <span>{profile.visible ? t(k('visible')) : t(k('hidden'))}</span>
                  </div>
                  {LINKS.some((l) => profile[l]) && (
                    <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px]">
                      {LINKS.filter((l) => profile[l]).map((l) => (
                        <li key={l}>
                          <a href={profile[l]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-transforme">
                            {t(k(`links.${l}`))}<Icon name="external" size={12} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {own && (
                  <section className="mm-card !p-5">
                    <h3 className="!text-[18px] text-ink">{t(k('certificates'))}</h3>
                    {certificates.length === 0 ? (
                      <p className="m-0 mt-2 text-[13.5px] text-ink-2">{t(k('noCertificates'))}</p>
                    ) : certificates.slice(0, 3).map((c) => (
                      <LocalizedLink
                        key={c.id}
                        to={`/certificat/${c.certificateCode}`}
                        className="mt-3 block rounded-m border border-[color:var(--line)] p-3.5 text-ink no-underline"
                      >
                        <span className="mm-eyebrow">{t(k('certificateKick'))}</span>
                        <b className="mt-1 block text-[14.5px]">{c.formationTitle}</b>
                      </LocalizedLink>
                    ))}
                  </section>
                )}

                <section className="mm-card !p-5">
                  <h3 className="!text-[18px] text-ink">{t(k('atClub'))}</h3>
                  <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-2">{t(k('atClubMasked'))}</p>
                </section>
              </div>

              <section className="min-w-0">
                <h3 className="m-0 mb-3 text-[19px] font-semibold text-ink">{t(k('postsTitle'))}</h3>
                {posts.length === 0 ? (
                  <div className="mm-card !p-5"><p className="m-0 text-[14px] text-ink-2">{t(k('postsEmpty'))}</p></div>
                ) : (
                  <div className="grid gap-3.5 stack:grid-cols-2 wide:grid-cols-3">
                    {posts.map((p) => (
                      <LocalizedLink key={p.id} to={`/mon-espace/club/publication/${p.id}`} className="mm-card block !p-4 text-ink no-underline">
                        <span className="mm-chipd !h-[22px] !text-[11px]">{t(`club.categories.${p.category}`)}</span>
                        <b className="mt-2.5 line-clamp-3 block text-[14px] leading-[1.4]">{p.title || p.content}</b>
                        <span className="mt-2 block text-[12px] text-ink-3">{formatDate(p.createdAt)}</span>
                      </LocalizedLink>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </ClubScreen>
    </>
  );
}
