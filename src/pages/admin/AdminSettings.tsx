import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, Field, GlassPanel, Icon, Segmented, Skeleton, Switch, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleScope, ConsoleSplit } from '../../components/console';
import RolesPanel from './components/RolesPanel';
import { SiteEyebrow } from '../../components/site';
import { getSiteSettings, saveSiteSettings } from '../../lib/firestore';
import { captureError } from '../../lib/sentry';

/**
 * ── RÉGLAGES — motif de console ─────────────────────────────────────────────────────
 *
 * LE SEUL ÉCRAN DONT LE PIPELINE N'EST PAS UN STATUT MAIS UNE SECTION, et c'est cohérent
 * avec le motif plutôt qu'une exception à lui. La zone 1 répond toujours à la même question
 * — « où est ce que je cherche » —, et sur un écran de réglages la réponse n'est pas une
 * file d'attente : c'est une section. Le geste est identique, `ConsoleFilter` reste le
 * même composant, et il n'y a toujours aucun filtre par date.
 *
 * LE KIT NOMME `marque · paiement · SEO · rôles`. Trois de ces quatre sections N'EXISTENT
 * PAS dans ce document : il n'y a ici ni clé de paiement, ni réglage de référencement, ni
 * attribution de rôle. Inventer trois sections vides aurait fait croire le contraire — les
 * noms réels sont donc ceux des quatre blocs qui existent, et le pied dit où vivent les
 * trois autres. C'est exactement ce que le pied est là pour faire : « le non-dit d'un écran
 * d'administration finit toujours en manœuvre manuelle non tracée ».
 * ────────────────────────────────────────────────────────────────────────────────────
 */

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
  popup_clubExit: boolean;
  popup_mediaEnd: boolean;
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
  popup_clubExit: true,
  popup_mediaEnd: true,
  popupTreatmentShare: 0.5,
};

type Section = 'brand' | 'notifications' | 'popups' | 'security';

/** Les seules clés qu'un interrupteur peut porter : celles qui valent vrai ou faux. */
type BooleanKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export default function AdminSettings() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<Section>('brand');

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

  const sections: { key: Section; label: string }[] = [
    { key: 'brand', label: t('settings.section.brand') },
    { key: 'notifications', label: t('settings.section.notifications') },
    { key: 'popups', label: t('settings.section.popups') },
    { key: 'security', label: t('settings.section.security') },
  ];

  const themeOptions: { value: Settings['defaultTheme']; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  const popups: { key: BooleanKey; label: string; desc: string }[] = [
    { key: 'popup_agencyExit', label: t('settings.popupAudienceRouterLabel'), desc: t('settings.popupAudienceRouterDesc') },
    { key: 'popup_formationExit', label: t('settings.popupFormationExitLabel'), desc: t('settings.popupFormationExitDesc') },
    { key: 'popup_presenceExit', label: t('settings.popupPresenceExitLabel'), desc: t('settings.popupPresenceExitDesc') },
    { key: 'popup_cartRecovery', label: t('settings.popupCartRecoveryLabel'), desc: t('settings.popupCartRecoveryDesc') },
    { key: 'popup_clubExit', label: t('settings.popupClubExitLabel'), desc: t('settings.popupClubExitDesc') },
    { key: 'popup_blogEnd', label: t('settings.popupBlogEndLabel'), desc: t('settings.popupBlogEndDesc') },
    { key: 'popup_mediaEnd', label: t('settings.popupMediaEndLabel'), desc: t('settings.popupMediaEndDesc') },
    { key: 'popup_formationsEntry', label: t('settings.popupFormationsEntryLabel'), desc: t('settings.popupFormationsEntryDesc') },
  ];

  const treatmentPercent = Math.round((settings.popupTreatmentShare ?? 0.5) * 100);

  const notifications: { key: BooleanKey; label: string; desc: string }[] = [
    { key: 'notifNewSale', label: t('settings.notifNewSaleLabel'), desc: t('settings.notifNewSaleDesc') },
    { key: 'notifNewMessage', label: t('settings.notifNewMessageLabel'), desc: t('settings.notifNewMessageDesc') },
    { key: 'notifNewUser', label: t('settings.notifNewUserLabel'), desc: t('settings.notifNewUserDesc') },
    { key: 'notifCourseCompletion', label: t('settings.notifCourseCompletionLabel'), desc: t('settings.notifCourseCompletionDesc') },
  ];

  /** Une rangée de réglage : le libellé, sa raison, et UN interrupteur. */
  const toggleRow = (key: BooleanKey, label: string, desc: string, last?: boolean) => (
    <div
      key={String(key)}
      className="flex items-center justify-between gap-4 py-3"
      style={{ borderBottom: last ? 0 : '1px solid var(--border-hair)' }}
    >
      <div className="min-w-0">
        <p className="m-0 text-sm font-semibold text-ink">{label}</p>
        <p className="m-0 text-meta-2 leading-[1.5] text-ink-2">{desc}</p>
      </div>
      <Switch
        on={settings[key]}
        label={label}
        onChange={(on) => set(key, on)}
      />
    </div>
  );

  return (
    <ConsolePage title={t('settings.pageTitle')} sub={t('settings.sub')}>
      {/* ── LA TROISIÈME COLONNE — `handoff_tableaux_de_bord` § ParametresDesktop ────────
          La maquette y met « Rôles et portée » et « Ce qu'un garde de route ne fait pas ».
          C'est le seul écran où le panneau ne dépend d'AUCUNE sélection : il dit une
          propriété du produit, pas l'état d'une ligne. Il reste donc identique quelle que
          soit la section ouverte — et c'est ce qui le rend lisible pendant qu'on règle un
          prix ou un interrupteur, c'est-à-dire au moment où l'on croit décider seul. */}
      <ConsoleSplit detailLabel={t('settings.panelRolesEyebrow')} detail={<RolesPanel />}>
      <ConsoleFilter
        stages={sections.map((s) => s.label)}
        active={sections.find((s) => s.key === section)?.label}
        onSelect={(label) => {
          const hit = sections.find((s) => s.label === label);
          if (hit) setSection(hit.key);
        }}
        label={t('settings.sectionLabel')}
      />

      {loading && (
        <GlassPanel level="night" padding={18} className="mt-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={38} label={i === 0 ? t('settings.pageTitle') : undefined} style={{ marginBottom: '10px' }} />
          ))}
        </GlassPanel>
      )}

      {!loading && section === 'brand' && (
        <div className="mt-4 space-y-3">
          <GlassPanel level="night" padding={18}>
            <SiteEyebrow style={{ marginBottom: '12px' }}>{t('settings.generalTitle')}</SiteEyebrow>
            <div className="space-y-4">
              <Field label={t('settings.siteNameLabel')} value={settings.siteName} onChange={(v) => set('siteName', v)} />
              <Field label={t('settings.siteDescriptionLabel')} value={settings.siteDescription} onChange={(v) => set('siteDescription', v)} />
              <div className="grid gap-4 stack:grid-cols-2">
                <Field label={t('settings.contactEmailLabel')} type="email" value={settings.contactEmail} onChange={(v) => set('contactEmail', v)} />
                <Field label={t('settings.contactPhoneLabel')} type="tel" value={settings.contactPhone} onChange={(v) => set('contactPhone', v)} />
              </div>
              <Field label={t('settings.addressLabel')} value={settings.address} onChange={(v) => set('address', v)} />
            </div>
          </GlassPanel>

          <GlassPanel level="night" padding={18}>
            <SiteEyebrow style={{ marginBottom: '12px' }}>{t('settings.socialTitle')}</SiteEyebrow>
            <div className="grid gap-4 stack:grid-cols-2">
              <Field label="Facebook" type="url" placeholder="https://facebook.com/..." value={settings.facebook} onChange={(v) => set('facebook', v)} />
              <Field label="Instagram" type="url" placeholder="https://instagram.com/..." value={settings.instagram} onChange={(v) => set('instagram', v)} />
              <Field label="YouTube" type="url" placeholder="https://youtube.com/..." value={settings.youtube} onChange={(v) => set('youtube', v)} />
              <Field label="LinkedIn" type="url" placeholder="https://linkedin.com/..." value={settings.linkedin} onChange={(v) => set('linkedin', v)} />
              <Field label="WhatsApp" type="tel" placeholder="+221 77 000 00 00" value={settings.whatsapp} onChange={(v) => set('whatsapp', v)} />
            </div>
          </GlassPanel>

          <GlassPanel level="night" padding={18}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SiteEyebrow>{t('settings.announcementTitle')}</SiteEyebrow>
                <p className="m-0 mt-1 text-meta-2 leading-[1.5] text-ink-2">{t('settings.announcementSubtitle')}</p>
              </div>
              <Switch
                on={settings.announcementActive}
                label={t('settings.announcementTitle')}
                onChange={(on) => set('announcementActive', on)}
              />
            </div>
            {settings.announcementActive && (
              <div className="mt-4">
                <Field
                  label={t('settings.announcementTextLabel')}
                  value={settings.announcementText}
                  onChange={(v) => set('announcementText', v)}
                  placeholder={t('settings.announcementTextPlaceholder')}
                />
              </div>
            )}
          </GlassPanel>

          <GlassPanel level="night" padding={18}>
            <SiteEyebrow style={{ marginBottom: '12px' }}>{t('settings.appearanceTitle')}</SiteEyebrow>
            <Segmented
              options={themeOptions.map((o) => o.label)}
              value={themeOptions.find((o) => o.value === settings.defaultTheme)?.label}
              onChange={(label) => {
                const hit = themeOptions.find((o) => o.label === label);
                if (hit) set('defaultTheme', hit.value);
              }}
              label={t('settings.defaultThemeLabel')}
            />
          </GlassPanel>
        </div>
      )}

      {!loading && section === 'notifications' && (
        <GlassPanel level="night" padding={18} className="mt-4">
          <SiteEyebrow style={{ marginBottom: '4px' }}>{t('settings.notificationsTitle')}</SiteEyebrow>
          <p className="m-0 mb-2 text-meta-2 leading-[1.5] text-ink-2">{t('settings.notificationsSubtitle')}</p>
          {notifications.map((n, i) => toggleRow(n.key, n.label, n.desc, i === notifications.length - 1))}
        </GlassPanel>
      )}

      {!loading && section === 'popups' && (
        <GlassPanel level="night" padding={18} className="mt-4">
          <SiteEyebrow style={{ marginBottom: '4px' }}>{t('settings.popupsTitle')}</SiteEyebrow>
          <p className="m-0 mb-2 text-meta-2 leading-[1.5] text-ink-2">{t('settings.popupsSubtitle')}</p>
          {popups.map((p, i) => toggleRow(p.key, p.label, p.desc, i === popups.length - 1))}

          {/*
            Groupe témoin. C'est la seule mesure qui distingue « la pop-up convertit » de « la
            pop-up aide » : sans population non exposée, un bon taux de clic peut masquer des
            visiteurs partis à cause d'elle.
          */}
          <div className="mt-5 border-t border-[color:var(--line)] pt-5">
            <label htmlFor="treatment-share" className="block text-sm font-semibold text-ink">
              {t('settings.popupTreatmentLabel', { percent: treatmentPercent })}
            </label>
            <p className="mt-1 text-meta-2 leading-relaxed text-ink-2">{t('settings.popupTreatmentDesc')}</p>
            <input
              id="treatment-share"
              type="range"
              min={0}
              max={100}
              step={10}
              value={treatmentPercent}
              onChange={(e) => set('popupTreatmentShare', Number(e.target.value) / 100)}
              className="mt-3 w-full cursor-pointer accent-[color:var(--mm-bleu)]"
            />
          </div>

          <p className="mt-4 text-meta-2 leading-relaxed text-ink-2">{t('settings.popupsCacheNote')}</p>
        </GlassPanel>
      )}

      {!loading && section === 'security' && (
        <GlassPanel level="night" padding={18} className="mt-4">
          <SiteEyebrow style={{ marginBottom: '4px' }}>{t('settings.securityTitle')}</SiteEyebrow>
          <p className="m-0 mb-3 text-meta-2 leading-[1.5] text-ink-2">{t('settings.securitySubtitle')}</p>
          <DocLine label="Firebase Authentication" value={t('settings.securityActive')} />
          <DocLine label="HTTPS" value={t('settings.securityActive')} />
          <DocLine label={t('settings.securityFirestoreRules')} value={t('settings.securityRbacEnabled')} last />
          <p className="mt-4 text-meta-2 leading-relaxed text-ink-2">{t('settings.securityReadOnlyNote')}</p>
        </GlassPanel>
      )}

      {!loading && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => { void handleSave(); }} loading={saving} fullWidth={false}>
            <Icon name="check" size={16} /> {saving ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      )}

      <ConsoleScope>{t('settings.scope')}</ConsoleScope>
      </ConsoleSplit>
    </ConsolePage>
  );
}
