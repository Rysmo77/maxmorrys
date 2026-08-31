import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from './LocalizedLink';
// Import direct plutôt que via le barrel `lib/firestore` : celui-ci fait
// `export *` sur 17 modules, et cet unique import tirait tout `admin.ts`
// (saveAnnouncement, deleteAnnouncement, …) dans le chunk d'entrée.
import { getActiveAnnouncements } from '../../lib/firestore/admin';
import type { Announcement } from '../../types';
import { Icon } from '@ds';

const TYPE_CONFIG = {
  info: { icon: 'info', bg: 'bg-forme', text: 'text-white' },
  promo: { icon: 'tag', bg: 'bg-[color:var(--warn)]', text: 'text-white' },
  update: { icon: 'zap', bg: 'bg-ok', text: 'text-white' },
};

export default function AnnouncementBanner() {
  const { t } = useTranslation('shared');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    getActiveAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  const a = visible[0];
  const { icon: glyph, bg, text } = TYPE_CONFIG[a.type];

  return (
    <div className={`${bg} ${text} relative z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Icon name={glyph} size={16} className="shrink-0 opacity-90" />
          <p className="text-sm font-medium truncate">
            <span className="font-bold mr-1.5">{a.title}</span>
            <span className="opacity-90">{a.content}</span>
          </p>
          {a.link && (
            <LocalizedLink
              to={a.link}
              className="shrink-0 text-xs font-bold underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
            >
              {t('announcement.learnMore')}
            </LocalizedLink>
          )}
        </div>
        <button
          onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
          className="shrink-0 p-1 rounded-full hover:bg-[color-mix(in_srgb,var(--paper)_20%,transparent)] transition-colors"
          aria-label={t('announcement.dismiss')}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
