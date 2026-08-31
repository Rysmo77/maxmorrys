import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Avatar, GlassPanel, Icon, LessonRow, Num, Skeleton, TerritoryCard, TruthPanel } from '@ds';
import { getClubLeaderboard, type LeaderboardEntry } from '../../../../lib/gamification';
import { getLevelTitle } from '../../../../types/gamification';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer } from '../../../../lib/animations';
import { ClubEmptyState } from './_shared';

type ClubData = ReturnType<typeof useClubData>;

interface ClubLeaderboardProps {
  data: ClubData;
}

const initialsOf = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

/**
 * LE CLASSEMENT — et l'endroit où le kit décrit une fonction que le produit n'a pas.
 *
 * ⚠️ L'écran `ClubClassement` du kit repose ENTIÈREMENT sur une notion de vague d'arrivée :
 * son bandeau dit « Tu es 4ᵉ de ta vague », son sélecteur propose « Ma cohorte / Ma
 * progression », et son encart de vérité s'intitule « Pourquoi ce n'est pas un classement
 * général ». Le produit, lui, n'a qu'un `getClubLeaderboard()` : un top 20 ABSOLU, trié par
 * XP, sans date d'arrivée nulle part dans le modèle.
 *
 * Reprendre l'encart du kit tel quel afficherait, mot pour mot, le contraire de ce que fait le
 * code — sur l'écran d'un produit qui vend l'honnêteté chiffrée. Le sélecteur de cohorte est
 * donc absent, et l'encart de vérité dit ce qui est vrai : le classement EST général, la
 * comparaison par vague n'existe pas encore, et c'est écrit plutôt que sous-entendu.
 *
 * Le bandeau de tête, lui, survit : il porte le rang réel de la personne, lu en base.
 */
export default function ClubLeaderboard({ data }: ClubLeaderboardProps) {
  const { t } = useTranslation('club');
  const { user } = data;
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const asOf = useRef(new Date()).current;

  useEffect(() => {
    getClubLeaderboard().then(setEntries).catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return (
      <div className="space-y-3">
        <Skeleton height={118} radius="var(--r-l)" label={t('leaderboard.title')} />
        <Skeleton height={240} radius="var(--r-l)" label={t('leaderboard.title')} />
      </div>
    );
  }

  if (entries.length === 0) {
    return <ClubEmptyState icon="trophy" title={t('leaderboard.title')} subtitle={t('leaderboard.emptyText')} />;
  }

  const me = user ? entries.find((e) => e.userId === user.uid) : undefined;

  return (
    <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
      {/* Le bandeau du kit, sur la carte de territoire plutôt que sur un dégradé écrit à la
          main : les jetons `--g-transforme-*` prennent leur variante nuit, un hexadécimal non. */}
      <TerritoryCard
        territory="transforme"
        layout="plain"
        padding={22}
        meta={t('leaderboard.scope')}
        title={me
          ? <>{t('leaderboard.youAreRank')} <Num value={me.rank} source="db" asOf={asOf} /></>
          : t('leaderboard.notRankedTitle')}
        titleSize={24}
      >
        <p className="mt-2 text-meta leading-relaxed" style={{ color: 'var(--card-ink-2)' }}>
          {me ? t('leaderboard.rankExplain') : t('leaderboard.notInTop20')}
        </p>
      </TerritoryCard>

      <GlassPanel level="flat" padding="4px 18px" as="ol" className="m-0 list-none">
        {entries.map((entry, i) => {
          const isMe = user?.uid === entry.userId;
          return (
            <li key={entry.userId}>
              <LessonRow
                state="plain"
                last={i === entries.length - 1}
                iconBackground="transparent"
                icon={
                  <span className={isMe ? 'text-transforme' : 'text-ink-2'}>
                    <Num value={entry.rank} source="db" asOf={asOf} />
                  </span>
                }
                title={
                  <span className="flex items-center gap-1.5">
                    {entry.displayName}
                    {isMe && <span className="text-meta-2 font-normal text-transforme">{t('leaderboard.you')}</span>}
                    {entry.rank === 1 && (
                      <span className="text-informe-txt" aria-hidden="true"><Icon name="crown" size={14} /></span>
                    )}
                    {entry.rank > 1 && entry.rank <= 3 && (
                      <span className="text-ink-2" aria-hidden="true"><Icon name="medal" size={14} /></span>
                    )}
                  </span>
                }
                meta={t('leaderboard.level', { level: entry.level, title: getLevelTitle(entry.level) })}
                trailing={
                  <span className="flex items-center gap-2.5">
                    {entry.photoURL
                      ? <img src={entry.photoURL} alt="" loading="lazy" className="h-[30px] w-[30px] flex-none rounded-full object-cover" />
                      : <Avatar initials={initialsOf(entry.displayName)} size={30} />}
                    <Num value={entry.xp} unit="XP" source="db" asOf={asOf} />
                  </span>
                }
              />
            </li>
          );
        })}
      </GlassPanel>

      <TruthPanel
        provenTitle={t('leaderboard.truth.provenTitle')}
        withheldTitle={t('leaderboard.truth.withheldTitle')}
        proven={[t('leaderboard.truth.proven1'), t('leaderboard.truth.proven2')]}
        withheld={[t('leaderboard.truth.withheld1')]}
      />
    </motion.div>
  );
}
