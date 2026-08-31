import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/firestore';
import { cn } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
import type { AppNotification, NotificationType } from '../../types';
import { Icon, type IconName } from '@ds';

const typeConfig: Record<NotificationType, { icon: IconName; color: string; bg: string }> = {
  enrollment: { icon: 'book', color: 'text-forme', bg: 'bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)]' },
  certificate: { icon: 'award', color: 'text-warn', bg: 'bg-[color-mix(in_srgb,var(--warn)_4%,transparent)]' },
  content: { icon: 'rss', color: 'text-informe-txt', bg: 'bg-[color-mix(in_srgb,var(--mm-orange)_4%,transparent)]' },
  club: { icon: 'crown', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  system: { icon: 'info', color: 'text-ink-2', bg: 'bg-[color:var(--fill-2)]' },
};

export default function NotificationDropdown() {
  const { t } = useTranslation('ui');
  const { formatDate } = useFormat();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.uid, setNotifications);
    return unsub;
  }, [user]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  };

  const handleClick = async (notif: AppNotification) => {
    if (!user || notif.read) return;
    await markNotificationRead(user.uid, notif.id);
  };

  // Keyboard navigation: Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={t('notifications.ariaLabel')}
        aria-expanded={open}
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[color:var(--stop)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 sm:max-w-none bg-paper border border-[color:var(--line)] rounded-2xl shadow-xl z-50 overflow-hidden mm-drop">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border-hair)]">
            <h3 className="font-bold text-ink text-sm">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-forme font-semibold hover:underline flex items-center gap-1"
              >
                <Icon name="check" size={12} /> {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Icon name="bell" size={32} className="text-ink-2 mx-auto mb-2" />
                <p className="text-sm text-ink-2">{t('notifications.empty')}</p>
                <p className="text-xs text-ink-2 mt-1">{t('notifications.emptyHint')}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.system;
                const glyph = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--fill-1)] dark:hover:bg-[color-mix(in_srgb,var(--night-3)_50%,transparent)]',
                      !notif.read && 'bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)]/10',
                    )}
                  >
                    <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', config.bg)}>
                      <Icon name={glyph} size={16} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm leading-snug',
                        notif.read
                          ? 'text-ink-2'
                          : 'text-ink font-semibold'
                      )}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-ink-2 mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-[color:var(--mm-bleu)] flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
