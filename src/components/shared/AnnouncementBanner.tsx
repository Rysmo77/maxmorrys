import { useState, useEffect } from 'react';
import { X, Info, Tag, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActiveAnnouncements } from '../../lib/firestore';
import type { Announcement } from '../../types';

const TYPE_CONFIG = {
  info: { icon: Info, bg: 'bg-brand-600', text: 'text-white' },
  promo: { icon: Tag, bg: 'bg-warning-500', text: 'text-white' },
  update: { icon: Zap, bg: 'bg-success-600', text: 'text-white' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    getActiveAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  const a = visible[0];
  const { icon: Icon, bg, text } = TYPE_CONFIG[a.type];

  return (
    <div className={`${bg} ${text} relative z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden="true" />
          <p className="text-sm font-medium truncate">
            <span className="font-bold mr-1.5">{a.title}</span>
            <span className="opacity-90">{a.content}</span>
          </p>
          {a.link && (
            <Link
              to={a.link}
              className="shrink-0 text-xs font-bold underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
            >
              En savoir plus →
            </Link>
          )}
        </div>
        <button
          onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
          className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Fermer l'annonce"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
