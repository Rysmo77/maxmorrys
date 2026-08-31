import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button, GlassPanel, Icon, Tag } from '@ds';
import { useFormat } from '../../../../hooks/useFormat';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';
import { ClubEmptyState } from './_shared';

type ClubData = ReturnType<typeof useClubData>;

interface ClubSessionsProps {
  data: ClubData;
}

/**
 * LES SESSIONS EN DIRECT — la moitié basse de l'onglet Agenda.
 *
 * Reprise de l'écran `ClubAgenda` du kit : une puce carrée de 44 px à l'encre du territoire,
 * le titre, l'horaire en dessous, puis une ligne d'état et d'action. Ce qui a changé au
 * passage, et qui ne pouvait pas se reporter tel quel :
 *
 * — 🕐 devant l'horaire a disparu. Un emoji n'est pas un glyphe d'interface : il se rend
 *   différemment sur chaque plateforme, il n'hérite ni de la couleur ni du trait, et un
 *   lecteur d'écran l'annonce en toutes lettres au milieu d'une phrase.
 * — Le rond qui tourne pendant l'inscription est parti. Le contrat de `Button` tranche : « le
 *   libellé RESTE pendant le chargement […] Un liseré le balaie. Jamais de rond qui tourne. »
 *   Un bouton dont le texte s'efface fait douter de ce qu'on vient de déclencher.
 *
 * Aucun nombre de places n'est affiché : le produit ne stocke pas de capacité sur une session.
 */
export default function ClubSessions({ data }: ClubSessionsProps) {
  const { t } = useTranslation('club');
  const { locale } = useFormat();
  const { clubSessions, registeredSessions, togglingReg, handleToggleSessionReg } = data;

  if (clubSessions.length === 0) {
    return <ClubEmptyState icon="video" title={t('sessions.emptyTitle')} subtitle={t('sessions.emptySubtitle')} />;
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {clubSessions.map((session) => {
        const isReg = registeredSessions.has(session.id);
        const upcoming = session.status === 'upcoming';
        return (
          <motion.div key={session.id} variants={staggerItem}>
            <GlassPanel level="flat" padding={18} className="h-full">
              {session.imageUrl && (
                <img
                  src={session.imageUrl}
                  alt=""
                  loading="lazy"
                  className="mb-3 aspect-[16/9] w-full rounded-m object-cover"
                />
              )}
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 flex-none place-items-center rounded-m bg-[image:var(--action-transforme)]"
                >
                  <Icon name="video" size={20} color="var(--paper-fixed)" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{session.title}</p>
                  <p className="mt-0.5 text-meta-2 text-ink-2">
                    {new Date(session.scheduledAt).toLocaleDateString(locale, {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                    {session.duration ? ` · ${t('sessions.duration', { duration: session.duration })}` : ''}
                  </p>
                </div>
              </div>

              {session.description && (
                <p className="mt-3 text-meta-2 leading-relaxed text-ink-2">{session.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Tag tone={upcoming ? 'ok' : 'neutral'}>
                  {upcoming ? t('sessions.nextSession') : t('sessions.pastSession')}
                </Tag>
                {upcoming && (
                  <div className="flex flex-wrap items-center gap-2">
                    {session.link && (
                      <Button tone="transforme" size="sm" href={session.link} target="_blank">
                        <Icon name="video" size={15} /> {t('sessions.join')}
                      </Button>
                    )}
                    <Button
                      tone={isReg ? 'quiet' : 'ghost'}
                      size="sm"
                      loading={togglingReg === session.id}
                      onClick={() => handleToggleSessionReg(session.id)}
                    >
                      {isReg ? <Icon name="check" size={15} color="var(--ok)" /> : <Icon name="plus" size={15} />}
                      {isReg ? t('sessions.registered') : t('sessions.register')}
                    </Button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
