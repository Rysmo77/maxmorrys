import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BookOpen, Award, Rss, Crown, Info, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/firestore';
import { cn } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
import type { AppNotification, NotificationType } from '../../types';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  enrollment: { icon: BookOpen, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  certificate: { icon: Award, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20' },
  content: { icon: Rss, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-900/20' },
  club: { icon: Crown, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  system: { icon: Info, color: 'text-neutral-600 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800' },
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
        className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={t('notifications.ariaLabel')}
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 sm:max-w-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-down">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
            <h3 className="font-bold text-neutral-900 dark:text-white text-sm">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">{t('notifications.empty')}</p>
                <p className="text-xs text-neutral-400 mt-1">{t('notifications.emptyHint')}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.system;
                const Icon = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
                      !notif.read && 'bg-brand-50/50 dark:bg-brand-900/10',
                    )}
                  >
                    <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', config.bg)}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm leading-snug',
                        notif.read
                          ? 'text-neutral-600 dark:text-neutral-400'
                          : 'text-neutral-900 dark:text-white font-semibold'
                      )}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-neutral-400 mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
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
