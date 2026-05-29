import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, CircleNotch } from '@phosphor-icons/react';
import { cn } from '../../../../lib/utils';
import { getClubLeaderboard, type LeaderboardEntry } from '../../../../lib/gamification';
import { getLevelTitle } from '../../../../types/gamification';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubLeaderboardProps {
  data: ClubData;
}

const initialsOf = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const rankAccent = (rank: number) =>
  rank === 1 ? 'text-accent-500' : rank === 2 ? 'text-neutral-400' : rank === 3 ? 'text-coral-500' : 'text-neutral-300 dark:text-neutral-600';

function Avatar({ entry, size }: { entry: LeaderboardEntry; size: string }) {
  return (
    <div className={cn('rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden', size)}>
      {entry.photoURL
        ? <img src={entry.photoURL} alt="" className="w-full h-full object-cover" />
        : <span className="font-bold text-plum-600 dark:text-plum-400">{initialsOf(entry.displayName)}</span>}
    </div>
  );
}

export default function ClubLeaderboard({ data }: ClubLeaderboardProps) {
  const { user } = data;
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    getClubLeaderboard().then(setEntries).catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return <div className="flex justify-center py-16"><CircleNotch className="w-8 h-8 animate-spin text-plum-500" /></div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
        <Trophy className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" weight="duotone" />
        <p className="text-neutral-500">Le classement se construit. Gagne de l'XP pour y figurer !</p>
      </div>
    );
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myRank = user ? entries.find((e) => e.userId === user.uid)?.rank : undefined;

  return (
    <motion.div className="space-y-5" variants={staggerContainer} initial="hidden" animate="visible">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-plum-500" weight="duotone" />
        <h3 className="font-bold text-neutral-900 dark:text-white">Classement de la communauté</h3>
      </div>

      {/* Podium top 3 */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 items-end">
        {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => {
          const isFirst = entry.rank === 1;
          return (
            <motion.div
              key={entry.userId}
              variants={staggerItem}
              className={cn(
                'flex flex-col items-center text-center rounded-2xl border p-2 sm:p-4 min-w-0',
                isFirst
                  ? 'bg-gradient-to-b from-plum-50 to-white dark:from-plum-900/30 dark:to-neutral-800 border-plum-300 dark:border-plum-700 sm:-mt-2'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
              )}
            >
              <div className="relative">
                <Avatar entry={entry} size={isFirst ? 'w-12 h-12 sm:w-16 sm:h-16 text-base sm:text-lg' : 'w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm'} />
                {isFirst && <Crown className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 text-accent-500" weight="fill" />}
              </div>
              <Medal className={cn('w-4 h-4 mt-2', rankAccent(entry.rank))} weight="fill" />
              <p className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white truncate max-w-full mt-1">{entry.displayName}</p>
              <p className="text-[10px] sm:text-[11px] text-plum-600 dark:text-plum-400 font-semibold tabular-nums">{entry.xp.toLocaleString('fr-FR')} XP</p>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of the list */}
      {rest.length > 0 && (
        <div className="space-y-1.5">
          {rest.map((entry) => {
            const isMe = user?.uid === entry.userId;
            return (
              <motion.div
                key={entry.userId}
                variants={staggerItem}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5',
                  isMe ? 'bg-plum-50 dark:bg-plum-900/20 border-plum-300 dark:border-plum-700' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
                )}
              >
                <span className={cn('w-6 text-center text-sm font-bold tabular-nums', isMe ? 'text-plum-600 dark:text-plum-400' : 'text-neutral-400')}>{entry.rank}</span>
                <Avatar entry={entry} size="w-9 h-9 text-xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                    {entry.displayName}{isMe && <span className="text-xs text-plum-500 font-normal"> · toi</span>}
                  </p>
                  <p className="text-xs text-neutral-400">Niv. {entry.level} · {getLevelTitle(entry.level)}</p>
                </div>
                <span className="text-sm font-bold text-plum-600 dark:text-plum-400 tabular-nums flex-shrink-0">{entry.xp.toLocaleString('fr-FR')} XP</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Current user out of top 20 */}
      {user && !myRank && (
        <p className="text-xs text-neutral-400 text-center pt-1">
          Tu n'es pas encore dans le top 20 — publie, commente et apprends pour gagner de l'XP !
        </p>
      )}
    </motion.div>
  );
}
