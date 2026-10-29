import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import DsNavHost from '../../components/layout/DsNavHost';
import { KitButton } from '../../components/site/v3/kit';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, useLocalizedPath } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFormat } from '../../hooks/useFormat';
import { getUserTransactions, markAllNotificationsRead, subscribeNotifications } from '../../lib/firestore';
import type { AppNotification, NotificationType } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MON COMPTE (`/compte`) — maquettes `Hub-Compte` (bureau) / `Hub-Compte-mobile`, passe 2.
 *
 * Le carrefour d'un compte unique : les deux espaces (Edu, Club), les paiements, les
 * notifications, les préférences et les données. Tout ce qui s'affiche est LU :
 * - le prénom vient du profil (`userData`), la salutation de l'heure locale ;
 * - les paiements de `getUserTransactions` (les trois derniers ; vide = phrase honnête) ;
 * - les notifications de `subscribeNotifications` ;
 * - langue et thème sont les réglages réels (`LanguageContext`, `ThemeContext`).
 *
 * Écarts volontaires à la planche (« données d'exemple ») :
 * - les cartes Edu/Club n'affichent ni leçon en cours, ni messages, ni date d'abonnement :
 *   aucun de ces chiffres n'est lu ici, ils restent dans leur espace ;
 * - le domaine des cartes n'est pas un sous-domaine (il n'y en a pas) ;
 * - pas de thème « Système » : le châssis a tranché clair par défaut, deux choix seulement ;
 * - « La lettre » et « Mémoire de Rysmo » ne sont pas rendus : aucun état lisible par compte ;
 * - export et suppression vivent dans les paramètres de l'espace : on y renvoie.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const NOTIF: Record<NotificationType, { icon: IconName; tone: string }> = {
  enrollment: { icon: 'book', tone: 'is-edu' },
  certificate: { icon: 'award', tone: 'is-ok' },
  content: { icon: 'book', tone: 'is-edu' },
  club: { icon: 'users', tone: 'is-club' },
  system: { icon: 'bell', tone: '' },
};

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="mm-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={value === o.value ? 'bg-bento text-ink shadow-[var(--sh-soft)]' : ''}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ComptePage() {
  const { t } = useTranslation('ecrans');
  const path = useLocalizedPath();
  const { user, userData, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { formatDate, formatPrice } = useFormat();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);

  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    return subscribeNotifications(uid, setNotifications);
  }, [uid]);

  const { data: payments = null } = useQuery({
    queryKey: ['transactions', 'user', uid],
    queryFn: () => getUserTransactions(uid as string),
    enabled: Boolean(uid),
  });

  const firstName = userData?.firstName || (userData?.displayName || user?.displayName || '').split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting = hour >= 18 || hour < 5 ? t('hub.compte.evening') : t('hub.compte.morning');
  const recent = (payments ?? []).slice(0, 3);
  const notifs = (notifications ?? []).slice(0, 4);
  const hasUnread = notifs.some((n) => !n.read);

  const launches = [
    { key: 'edu', to: '/mon-espace/tableau-de-bord', domain: t('hub.compte.eduDomain'), title: t('hub.compte.eduTitle'), body: t('hub.compte.eduBody') },
    { key: 'club', to: '/mon-espace/club', domain: t('hub.compte.clubDomain'), title: t('hub.compte.clubTitle'), body: t('hub.compte.clubBody') },
  ];

  return (
    <DsNavHost>
      <SEOHead title={t('hub.compte.title')} noIndex />
      <div className="min-h-screen bg-[color:var(--paper-2)] pb-24" style={{ marginTop: 'calc(-1 * var(--header-h))' }}>
        <section className="dk relative isolate overflow-hidden rounded-b-xl bg-night text-ink" style={{ paddingTop: 'var(--header-h)' }}>
          <div aria-hidden="true" className="mm-mesh m-hub is-wide" style={{ opacity: 0.7 }}>
            <b />
            <b />
            <b />
          </div>
          <header className="relative z-[1] mx-auto box-border max-w-[1360px] px-5 pb-[30px] pt-[34px] wide:px-10 wide:pb-[52px] wide:pt-[72px]">
            <span className="mm-eyebrow text-[color:var(--mm-bleu-c)]">{t('hub.compte.eyebrow')}</span>
            <h1 className="mm-d mb-[10px] mt-3 text-[48px] leading-[.92] wide:mb-[14px] wide:mt-4 wide:text-[clamp(48px,6vw,88px)] wide:leading-[.9]">
              {greeting},
              {firstName && (
                <>
                  <br className="hidden wide:inline" /> <span className="text-[color:var(--mm-bleu-n)]">{firstName}.</span>
                </>
              )}
            </h1>
            <p className="m-0 text-[15px] text-ink-2 wide:text-[17px]">
              <span className="wide:hidden">{t('hub.compte.ledeShort')}</span>
              <span className="hidden wide:inline">{t('hub.compte.lede')}</span>
            </p>
          </header>
        </section>

        <div className="relative z-[1] mx-auto box-border flex max-w-[1360px] flex-col gap-[14px] px-4 pt-[18px] wide:gap-4 wide:px-6 wide:pt-8">
          <div className="grid gap-[14px] wide:grid-cols-2 wide:gap-4">
            {launches.map((l) => (
              <a key={l.key} href={path(l.to)} className={`mm-launch is-${l.key} min-h-[210px] no-underline wide:min-h-[260px]`}>
                <div className="mm-launch__top">
                  <span className="mm-launch__domain">{l.domain}</span>
                  <span className="mm-launch__go" aria-hidden="true">
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                </div>
                <div>
                  <h3 className="wide:!text-[40px]">{l.title}</h3>
                  <p>{l.body}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="grid gap-[14px] wide:grid-cols-12 wide:gap-4">
            <section className="mm-bento order-2 min-w-0 p-2 pb-3 wide:order-none wide:col-span-7" aria-labelledby="compte-paiements">
              <div className="flex items-center px-[14px] pb-[6px] pt-[14px]">
                <span id="compte-paiements" className="mm-eyebrow is-plain">{t('hub.compte.payments')}</span>
                <a href={path('/mon-espace/paiements')} className="ml-auto text-[13px] font-semibold">{t('hub.compte.paymentsAll')}</a>
              </div>
              {payments === null ? null : recent.length === 0 ? (
                <p className="m-0 px-[14px] py-3 text-[14px] text-ink-2">{t('hub.compte.paymentsEmpty')}</p>
              ) : (
                <>
                  <div className="hidden overflow-x-auto stack:block">
                    <table className="mm-table">
                      <thead>
                        <tr>
                          <th>{t('hub.compte.colDate')}</th>
                          <th>{t('hub.compte.colItem')}</th>
                          <th>{t('hub.compte.colMethod')}</th>
                          <th className="text-right">{t('hub.compte.colAmount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((p) => (
                          <tr key={p.id}>
                            <td className="mm-n">{formatDate(p.createdAt)}</td>
                            <td><b>{p.formationTitle || p.formationSlug || t('hub.compte.paymentFallback')}</b></td>
                            <td>{p.paymentMethod}</td>
                            <td className="mm-n text-right">{formatPrice(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-2 stack:hidden">
                    {recent.map((p) => (
                      <div key={p.id} className="flex items-center justify-between border-0 border-b border-solid border-[color:var(--line)] py-3">
                        <span>
                          <b className="block text-[14px]">{p.formationTitle || p.formationSlug || t('hub.compte.paymentFallback')}</b>
                          <span className="mm-n text-[11px] text-ink-3">{formatDate(p.createdAt)} · {p.paymentMethod}</span>
                        </span>
                        <span className="mm-n font-semibold">{formatPrice(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="mm-bento order-1 p-3 wide:order-none wide:col-span-5" aria-labelledby="compte-notifs">
              <div className="flex items-center px-2 pb-2 pt-[6px]">
                <span id="compte-notifs" className="mm-eyebrow is-plain">{t('hub.compte.notifications')}</span>
                {hasUnread && uid && (
                  <button type="button" onClick={() => void markAllNotificationsRead(uid)} className="ml-auto border-0 bg-transparent p-0 text-[13px] font-semibold text-[color:var(--mm-violet)]">
                    {t('hub.compte.markAllRead')}
                  </button>
                )}
              </div>
              {notifications === null ? null : notifs.length === 0 ? (
                <p className="m-0 px-2 py-3 text-[14px] text-ink-2">{t('hub.compte.notificationsEmpty')}</p>
              ) : (
                <div className="mm-activity">
                  {notifs.map((n) => {
                    const { icon, tone } = NOTIF[n.type] ?? NOTIF.system;
                    const body = (
                      <>
                        <span className={`mm-activity__ico ${tone}`}><Icon name={icon} size={16} /></span>
                        <div>
                          <b>{n.title}</b>
                          <span>{formatDate(n.createdAt)}</span>
                        </div>
                      </>
                    );
                    return n.link ? (
                      <a key={n.id} href={n.link} className="mm-activity__item text-ink no-underline">{body}</a>
                    ) : (
                      <div key={n.id} className="mm-activity__item">{body}</div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mm-bento order-3 flex flex-col gap-[14px] p-5 wide:order-none wide:col-span-6" aria-labelledby="compte-prefs">
              <span id="compte-prefs" className="mm-eyebrow is-plain">{t('hub.compte.prefs')}</span>
              <div className="flex items-center justify-between gap-3">
                <span>
                  <b className="block">{t('hub.compte.language')}</b>
                  <span className="mm-muted text-[13px]">{t('hub.compte.prefsHelp')}</span>
                </span>
                <Seg value={language} label={t('hub.compte.language')} options={[{ value: 'fr', label: 'FR' }, { value: 'en', label: 'EN' }]} onChange={setLanguage} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>
                  <b className="block">{t('hub.compte.theme')}</b>
                  <span className="mm-muted text-[13px]">{t('hub.compte.prefsHelp')}</span>
                </span>
                <Seg value={theme} label={t('hub.compte.theme')} options={[{ value: 'light', label: t('hub.compte.themeLight') }, { value: 'dark', label: t('hub.compte.themeDark') }]} onChange={setTheme} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>
                  <b className="block">{t('hub.compte.profile')}</b>
                  <span className="mm-muted text-[13px]">{userData?.email || user?.email}</span>
                </span>
                <KitButton href={path('/mon-espace/profil')} tone="quiet" size="sm">{t('hub.compte.edit')}</KitButton>
              </div>
            </section>

            <section className="mm-bento order-4 flex flex-col gap-[14px] p-5 wide:order-none wide:col-span-6" aria-labelledby="compte-donnees">
              <span id="compte-donnees" className="mm-eyebrow is-plain">{t('hub.compte.data')}</span>
              <p className="m-0 text-[14px] text-ink-2">{t('hub.compte.dataBody')}</p>
              <div className="flex flex-wrap gap-[10px]">
                <KitButton href={path('/mon-espace/parametres')} tone="quiet" size="sm">{t('hub.compte.dataExport')}</KitButton>
                <KitButton href={path('/mon-espace/parametres')} tone="ghost" size="sm" className="!border-[color:var(--stop)] !text-[color:var(--stop)]">
                  {t('hub.compte.dataDelete')}
                </KitButton>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-1 self-start border-0 bg-transparent p-0 text-[14px] font-bold text-[color:var(--stop)]"
              >
                {t('hub.compte.signOut')}
              </button>
            </section>
          </div>
        </div>
      </div>
    </DsNavHost>
  );
}
