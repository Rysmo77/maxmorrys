import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Palette, Bell, Shield, Link2, Megaphone, MousePointerClick, Save, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { getSiteSettings, saveSiteSettings } from '../../lib/firestore';
import { cn } from '../../lib/utils';
import { captureError } from '../../lib/sentry';

interface Settings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  whatsapp: string;
  defaultTheme: 'light' | 'dark' | 'system';
  notifNewSale: boolean;
  notifNewMessage: boolean;
  notifNewUser: boolean;
  notifCourseCompletion: boolean;
  announcementActive: boolean;
  announcementText: string;
  /*
    Interrupteurs des pop-ups contextuelles du site public. Lus par `lib/popups/settings.ts`, dont
    `settingsFieldFor()` fait foi pour le nom des champs. Absents du document = ACTIFS : un site
    jamais configuré doit bénéficier du dispositif sans configuration préalable.
  */
  popup_agencyExit: boolean;
  popup_formationsEntry: boolean;
  popup_formationExit: boolean;
  popup_presenceExit: boolean;
  popup_blogEnd: boolean;
  popup_cartRecovery: boolean;
  /*
    Part du trafic exposée aux pop-ups ; le reste sert de groupe témoin et n'en voit aucune.
    ⚠️ La descendre à 1 supprime le témoin — et avec lui toute possibilité de savoir si les
    pop-ups aident ou nuisent. Ne le faire qu'une fois la question tranchée.
  */
  popupTreatmentShare: number;
}

const DEFAULT: Settings = {
  siteName: 'Max-Morrys',
  siteDescription: 'Formateur, consultant et créateur de contenu digital',
  contactEmail: 'contact@maxmorrys.com',
  contactPhone: '+221 77 000 00 00',
  address: 'Dakar, Sénégal',
  facebook: '',
  instagram: '',
  youtube: '',
  linkedin: '',
  whatsapp: '',
  defaultTheme: 'system',
  notifNewSale: true,
  notifNewMessage: true,
  notifNewUser: false,
  notifCourseCompletion: false,
  announcementActive: false,
  announcementText: '',
  popup_agencyExit: true,
  popup_formationsEntry: true,
  popup_formationExit: true,
  popup_presenceExit: true,
  popup_blogEnd: true,
  popup_cartRecovery: true,
  popupTreatmentShare: 0.5,
};

export default function AdminSettings() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings().then((data) => {
      if (data && Object.keys(data).length > 0) {
        setSettings({ ...DEFAULT, ...(data as Partial<Settings>) });
      }
      setLoading(false);
    }).catch(() => { addToast('error', t('settings.toastLoadError')); setLoading(false); });
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteSettings(settings as unknown as Record<string, unknown>);
      addToast('success', t('settings.toastSaveSuccess'));
    } catch (error: unknown) {
      captureError(error, { context: 'Save settings failed' });
      addToast('error', error instanceof Error ? error.message : t('settings.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const themeOptions: { value: Settings['defaultTheme']; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  const popups: { key: keyof Settings; label: string; desc: string }[] = [
    { key: 'popup_agencyExit', label: t('settings.popupAudienceRouterLabel'), desc: t('settings.popupAudienceRouterDesc') },
    { key: 'popup_formationExit', label: t('settings.popupFormationExitLabel'), desc: t('settings.popupFormationExitDesc') },
    { key: 'popup_presenceExit', label: t('settings.popupPresenceExitLabel'), desc: t('settings.popupPresenceExitDesc') },
    { key: 'popup_cartRecovery', label: t('settings.popupCartRecoveryLabel'), desc: t('settings.popupCartRecoveryDesc') },
    { key: 'popup_blogEnd', label: t('settings.popupBlogEndLabel'), desc: t('settings.popupBlogEndDesc') },
    { key: 'popup_formationsEntry', label: t('settings.popupFormationsEntryLabel'), desc: t('settings.popupFormationsEntryDesc') },
  ];

  const treatmentPercent = Math.round((settings.popupTreatmentShare ?? 0.5) * 100);

  const notifications: { key: keyof Settings; label: string; desc: string }[] = [
    { key: 'notifNewSale', label: t('settings.notifNewSaleLabel'), desc: t('settings.notifNewSaleDesc') },
    { key: 'notifNewMessage', label: t('settings.notifNewMessageLabel'), desc: t('settings.notifNewMessageDesc') },
    { key: 'notifNewUser', label: t('settings.notifNewUserLabel'), desc: t('settings.notifNewUserDesc') },
    { key: 'notifCourseCompletion', label: t('settings.notifCourseCompletionLabel'), desc: t('settings.notifCourseCompletionDesc') },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{t('settings.pageTitle')}</h1>
        <p className="text-sm text-neutral-500">{t('settings.pageSubtitle')}</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* General Info */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">{t('settings.generalTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('settings.generalSubtitle')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input label={t('settings.siteNameLabel')} value={settings.siteName} onChange={(e) => set('siteName', e.target.value)} />
            <Input label={t('settings.siteDescriptionLabel')} value={settings.siteDescription} onChange={(e) => set('siteDescription', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t('settings.contactEmailLabel')} type="email" value={settings.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
              <Input label={t('settings.contactPhoneLabel')} value={settings.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </div>
            <Input label={t('settings.addressLabel')} value={settings.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </Card>

        {/* Social Links */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
              <Link2 className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">{t('settings.socialTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('settings.socialSubtitle')}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Facebook" placeholder="https://facebook.com/..." value={settings.facebook} onChange={(e) => set('facebook', e.target.value)} />
            <Input label="Instagram" placeholder="https://instagram.com/..." value={settings.instagram} onChange={(e) => set('instagram', e.target.value)} />
            <Input label="YouTube" placeholder="https://youtube.com/..." value={settings.youtube} onChange={(e) => set('youtube', e.target.value)} />
            <Input label="LinkedIn" placeholder="https://linkedin.com/..." value={settings.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
            <Input label="WhatsApp" placeholder="+221 77 000 00 00" value={settings.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          </div>
        </Card>

        {/* Announcement */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-warning-50 dark:bg-warning-900/20 rounded-xl">
              <Megaphone className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-neutral-900 dark:text-white">{t('settings.announcementTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('settings.announcementSubtitle')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.announcementActive}
                onChange={(e) => set('announcementActive', e.target.checked)}
              />
              <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:ring-2 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500" />
            </label>
          </div>
          {settings.announcementActive && (
            <Input
              label={t('settings.announcementTextLabel')}
              value={settings.announcementText}
              onChange={(e) => set('announcementText', e.target.value)}
              placeholder={t('settings.announcementTextPlaceholder')}
            />
          )}
        </Card>

        {/* Appearance */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
              <Palette className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">{t('settings.appearanceTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('settings.appearanceSubtitle')}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">{t('settings.defaultThemeLabel')}</label>
            <div className="flex gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('defaultTheme', opt.value)}
                  className={cn(
                    'px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors',
                    settings.defaultTheme === opt.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-success-50 dark:bg-success-900/20 rounded-xl">
              <Bell className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">{t('settings.notificationsTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('settings.notificationsSubtitle')}</p>
            </div>
          </div>
          <div className="space-y-1">
            {notifications.map((n) => (
              <label key={n.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{n.label}</p>
                  <p className="text-xs text-neutral-500">{n.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[n.key] as boolean}
                  onChange={(e) => set(n.key, e.target.checked)}
                  className="rounded accent-brand-600 w-4 h-4 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Pop-ups contextuelles */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <MousePointerClick className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">{t('settings.popupsTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('settings.popupsSubtitle')}</p>
            </div>
          </div>
          <div className="space-y-1">
            {popups.map((p) => (
              <label key={p.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{p.label}</p>
                  <p className="text-xs text-neutral-500">{p.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[p.key] as boolean}
                  onChange={(e) => set(p.key, e.target.checked)}
                  className="rounded accent-brand-600 w-4 h-4 cursor-pointer"
                />
              </label>
            ))}
          </div>
          {/*
            Groupe témoin. C'est la seule mesure qui distingue « la pop-up convertit » de « la
            pop-up aide » : sans population non exposée, un bon taux de clic peut masquer des
            visiteurs partis à cause d'elle.
          */}
          <div className="mt-5 pt-5 border-t border-neutral-200 dark:border-neutral-700">
            <label htmlFor="treatment-share" className="block text-sm font-medium text-neutral-900 dark:text-white">
              {t('settings.popupTreatmentLabel', { percent: treatmentPercent })}
            </label>
            <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{t('settings.popupTreatmentDesc')}</p>
            <input
              id="treatment-share"
              type="range"
              min={0}
              max={100}
              step={10}
              value={treatmentPercent}
              onChange={(e) => set('popupTreatmentShare', Number(e.target.value) / 100)}
              className="mt-3 w-full accent-brand-600 cursor-pointer"
            />
          </div>

          <p className="mt-4 text-xs text-neutral-500 leading-relaxed">{t('settings.popupsCacheNote')}</p>
        </Card>

        {/* Security info */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-error-50 dark:bg-error-900/20 rounded-xl">
              <Shield className="w-5 h-5 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">{t('settings.securityTitle')}</h2>
              <p className="text-xs text-neutral-500">{t('settings.securitySubtitle')}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/10 rounded-xl">
              <span>Firebase Authentication</span>
              <span className="text-success-600 dark:text-success-400 font-medium">{t('settings.securityActive')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/10 rounded-xl">
              <span>HTTPS</span>
              <span className="text-success-600 dark:text-success-400 font-medium">{t('settings.securityActive')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
              <span>{t('settings.securityFirestoreRules')}</span>
              <span className="font-medium">{t('settings.securityRbacEnabled')}</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
            {saving ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
