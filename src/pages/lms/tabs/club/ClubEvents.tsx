import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button, GlassPanel, Icon, Tag } from '@ds';
import { useFormat } from '../../../../hooks/useFormat';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';
import { ClubEmptyState } from './_shared';

type ClubData = ReturnType<typeof useClubData>;

interface ClubEventsProps {
  data: ClubData;
}

/**
 * LES ÉVÉNEMENTS — la moitié haute de l'onglet Agenda, sur l'écran `ClubAgenda` du kit.
 *
 * Deux emoji tenaient lieu d'étiquettes de champ : 📅 devant la date et 📍 devant le lieu.
 * Ils sont remplacés par les glyphes du jeu unique, `calendar` et `pin`. Ce n'est pas un
 * échange décoratif : un emoji ne prend ni la couleur ni le trait de la ligne qu'il ouvre, il
 * se dessine autrement sur chaque système, et il s'annonce en toutes lettres à un lecteur
 * d'écran au milieu d'une date.
 *
 * L'événement en ligne prend l'encre `forme`, le présentiel l'encre `informe` — la même
 * distinction que le kit fait entre sa session en ligne et son atelier à Dakar.
 */
export default function ClubEvents({ data }: ClubEventsProps) {
  const { t } = useTranslation('club');
  const { locale } = useFormat();
  const { clubEvents, registeredEvents, togglingReg, handleToggleEventReg } = data;

  if (clubEvents.length === 0) {
    return <ClubEmptyState icon="calendar" title={t('events.emptyTitle')} subtitle={t('events.emptySubtitle')} />;
  }

  return (
    <motion.div
      className="grid gap-4 stack:grid-cols-2"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {clubEvents.map((event) => {
        const isReg = registeredEvents.has(event.id);
        const upcoming = event.status === 'upcoming';
        const online = event.type === 'online';
        return (
          <motion.div key={event.id} variants={staggerItem}>
            <GlassPanel level="flat" padding={18} className="h-full">
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt=""
                  loading="lazy"
                  className="mb-3 aspect-[16/9] w-full rounded-m object-cover"
                />
              )}
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 flex-none place-items-center rounded-m"
                  style={{ background: online ? 'var(--action-forme)' : 'var(--action-informe)' }}
                >
                  <Icon name="calendar" size={20} color={online ? 'var(--paper-fixed)' : 'var(--ink-fixed)'} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{event.title}</p>
                  <p className="mt-0.5 text-meta-2 text-ink-2">
                    {new Date(event.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {event.time ? ` · ${event.time}` : ''}
                  </p>
                </div>
              </div>

              {event.description && (
                <p className="mt-3 text-meta-2 leading-relaxed text-ink-2">{event.description}</p>
              )}

              {event.location && (
                <p className="mt-2 flex items-center gap-1.5 text-meta-2 text-ink-2">
                  <span aria-hidden="true" className="flex-none"><Icon name="pin" size={14} /></span>
                  {event.location}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag tone={upcoming ? 'ok' : 'neutral'}>{upcoming ? t('events.upcoming') : t('events.past')}</Tag>
                  <Tag>{online ? t('events.online') : t('events.inPerson')}</Tag>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {event.link && (
                    <Button tone="quiet" size="sm" href={event.link} target="_blank">
                      <Icon name="share" size={15} /> {t('events.viewEvent')}
                    </Button>
                  )}
                  {upcoming && (
                    <Button
                      tone={isReg ? 'quiet' : 'transforme'}
                      size="sm"
                      loading={togglingReg === event.id}
                      onClick={() => handleToggleEventReg(event.id)}
                    >
                      {isReg ? <Icon name="check" size={15} color="var(--ok)" /> : <Icon name="plus" size={15} />}
                      {isReg ? t('events.registered') : t('events.register')}
                    </Button>
                  )}
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
