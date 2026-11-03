import { useState, useEffect, useMemo, useRef } from 'react';
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
  // Le Club vit sous « Je te transforme » : sa couleur est le violet du territoire, pas
  // le doré générique d'une couronne. `--mm-violet-t` est la version TEXTE (le violet
  // plein tombe à 2,69:1 sous `.dk`), et elle pointe seule sur la variante nuit.
  club: { icon: 'crown', color: 'text-transforme-txt', bg: 'bg-[color-mix(in_srgb,var(--mm-violet)_4%,transparent)]' },
  system: { icon: 'info', color: 'text-ink-2', bg: 'bg-[color:var(--fill-2)]' },
};

type TFn = (key: string, opts?: Record<string, unknown>) => string;

/**
 * LES RELANCES DU WORKER, DANS LA LANGUE DE L'ÉCRAN (audit 03/11/2026, E3/X11).
 *
 * `worker/apps/api/src/lib/reengagement.ts` écrit le titre et le texte EN DUR, dans la langue
 * de `users/{uid}.preferences.language` — pas dans celle de l'interface (la langue suit
 * l'URL). Quelqu'un en français lisait donc « Your 4-day streak is still alive ».
 *
 * Depuis le 03/11/2026 le Worker pose une clé de modèle (`template` + `params`) : c'est elle
 * qui fait foi. La reconnaissance du TEXTE ne reste qu'en repli, pour les notifications écrites
 * avant la clé. ⚠️ Miroir : les `id` ci-dessous valent `ModeleRelance` côté Worker.
 */
const TEMPLATES: { id: string; match: (n: AppNotification) => RegExpMatchArray | null; render: (m: readonly string[], t: TFn) => { title: string; message: string } }[] = [
  {
    id: 'streak',
    match: (n) => n.title.match(/^Your (\d+)-day streak is still alive$/) ?? n.title.match(/^Ta série de (\d+) jours tient encore$/),
    render: (m, t) => ({
      title: t('notifications.tpl.streakTitle', { count: Number(m[1]) }),
      message: t('notifications.tpl.streakBody'),
    }),
  },
  {
    /* Reconnue par son TEXTE, plus spécifique que le titre (« Continue … » est trop courant). */
    id: 'resume',
    match: (n) => n.message.match(/^You haven't opened “(.+)” in \d+ days\./) ?? n.message.match(/^Tu n'as pas ouvert « (.+) » depuis \d+ jours\./),
    render: (m, t) => ({
      title: t('notifications.tpl.resumeTitle', { title: m[1] }),
      message: t('notifications.tpl.resumeBody', { title: m[1] }),
    }),
  },
];

/** Rendu d'après la clé de modèle posée par le Worker ; `null` si clé absente ou incomplète. */
function parCle(n: AppNotification, t: TFn): { title: string; message: string; template: string } | null {
  const p = n.params ?? {};
  if (n.template === 'streak' && typeof p.count === 'number' && Number.isFinite(p.count)) {
    return { ...TEMPLATES[0].render(['', String(p.count)], t), template: 'streak' };
  }
  if (n.template === 'resume' && typeof p.title === 'string' && p.title) {
    return { ...TEMPLATES[1].render(['', p.title], t), template: 'resume' };
  }
  return null;
}

function localise(n: AppNotification, t: TFn): { title: string; message: string; template: string | null } {
  const cle = n.type === 'system' ? parCle(n, t) : null;
  if (cle) return cle;
  if (n.type === 'system' && typeof n.title === 'string' && typeof n.message === 'string') {
    for (const tpl of TEMPLATES) {
      const m = tpl.match(n);
      if (m) return { ...tpl.render(m, t), template: tpl.id };
    }
  }
  return { title: n.title, message: n.message, template: null };
}

/** Jour local d'une date ISO (clé de dédoublonnage). */
function dayOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface ShownNotification {
  notif: AppNotification;
  title: string;
  message: string;
  /** Toutes les notifications regroupées sous celle-ci (la plus récente en tête). */
  ids: string[];
  read: boolean;
}

export default function NotificationDropdown() {
  const { t } = useTranslation('ui');
  const { formatDate } = useFormat();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Dédoublonnage À L'AFFICHAGE : même type + même modèle (ou même titre) + même jour = une
     seule ligne, la plus récente. La relance de série pouvait tomber deux fois le même jour ;
     l'écrire une seule fois relève du Worker, mais l'écran ne doit pas la montrer deux fois. */
  const shown = useMemo<ShownNotification[]>(() => {
    const groups = new Map<string, ShownNotification>();
    const sorted = [...notifications].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    for (const n of sorted) {
      const l = localise(n, t as TFn);
      const key = `${n.type}|${l.template ?? l.title}|${dayOf(n.createdAt)}`;
      const g = groups.get(key);
      if (g) {
        g.ids.push(n.id);
        g.read = g.read && n.read;
      } else {
        groups.set(key, { notif: n, title: l.title, message: l.message, ids: [n.id], read: n.read });
      }
    }
    return [...groups.values()];
  }, [notifications, t]);

  const unreadCount = shown.filter((n) => !n.read).length;

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

  const handleClick = async (item: ShownNotification) => {
    if (!user || item.read) return;
    const unread = notifications.filter((n) => item.ids.includes(n.id) && !n.read);
    await Promise.all(unread.map((n) => markNotificationRead(user.uid, n.id)));
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
        /* Déjà opaque avant AD-26, mais par une recette à elle : `bg-surface-sheet` + bordure
           + `shadow-xl`, à côté d'un `UserMenu` en verre. Un seul nom pour un seul objet. */
        /* Plus large qu'avant (384 → 420 px) et l'action d'en-tête ne se coupe plus : elle ne
           rétrécit pas, le titre si (audit E3/X11). */
        <div className="mm-menu absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-[420px] stack:w-[420px] rounded-2xl z-50 overflow-hidden mm-drop">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[color:var(--border-hair)]">
            <h3 className="min-w-0 truncate font-bold text-ink text-sm">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="min-h-[44px] shrink-0 whitespace-nowrap text-xs text-forme font-semibold hover:underline flex items-center gap-1"
              >
                <Icon name="check" size={12} /> {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {shown.length === 0 ? (
              <div className="py-10 text-center">
                <Icon name="bell" size={32} className="text-ink-2 mx-auto mb-2" />
                <p className="text-sm text-ink-2">{t('notifications.empty')}</p>
                <p className="text-xs text-ink-2 mt-1">{t('notifications.emptyHint')}</p>
              </div>
            ) : (
              shown.map((item) => {
                const { notif } = item;
                const config = typeConfig[notif.type] || typeConfig.system;
                const glyph = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(item)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--fill-1)] dark:hover:bg-[color-mix(in_srgb,var(--night-3)_50%,transparent)]',
                      !item.read && 'bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)]/10',
                    )}
                  >
                    <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', config.bg)}>
                      <Icon name={glyph} size={16} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm leading-snug',
                        item.read
                          ? 'text-ink-2'
                          : 'text-ink font-semibold'
                      )}>
                        {item.title}
                      </p>
                      <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">{item.message}</p>
                      <p className="text-xs text-ink-2 mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                    {!item.read && (
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
