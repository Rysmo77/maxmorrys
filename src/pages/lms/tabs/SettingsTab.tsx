import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Button, Field, GlassPanel, Icon, LessonRow, Segmented, Switch } from '@ds';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { SiteEyebrow, useReveal } from '../../../components/site';
import { functions } from '../../../config/firebase';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { updateUserProfile } from '../../../lib/firestore';

/**
 * LES PRÉFÉRENCES (`ScreensCompte.js` · `Preferences` et `Suppression`).
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * LE CONSTAT `ds:check` DE LA LIGNE 195 TOMBE ICI, IL NE SE DÉPLACE PAS.
 *
 * L'ancienne version écrivait la confirmation de suppression ainsi :
 *
 *     <Trans i18nKey="settings.deleteConfirmPrompt" components={[<span className="font-mono font-bold" />]} />
 *
 * `font-mono` sur une ligne où figure un nombre : règle 6 / AD-5. Le nombre en question était
 * le « 18 » de `i18nKey`, pas une donnée — mais la règle a raison d'être bête ici, parce que
 * la MONOSPACE elle-même était le défaut. Elle est le seul chemin du dépôt vers « ce nombre
 * vient de la base », et l'accorder à un mot de confirmation la dilue.
 *
 * Le `<Trans>` et sa classe disparaissent : le mot à taper est le LIBELLÉ du champ, en toutes
 * lettres, porté par `Field` — qui l'associe au contrôle par un `htmlFor` généré, ce que le
 * `<label>` orphelin d'avant ne faisait pas. La clé `settings.deleteConfirmPrompt` reste dans
 * les traductions : rien ne se supprime d'un fichier de langue.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * DEUX PRIMITIVES REMPLACENT LEURS DOUBLONS : `ui/Toggle` → `Switch` (qui porte `role="switch"`,
 * un nom accessible obligatoire et le cas « désactivé par le produit » avec sa raison lue), et
 * les deux boutons de données → `LessonRow`, la ligne de liste du système.
 *
 * LE KIT A TROIS APPARENCES — Clair, Sombre, Système. `ThemeContext` n'en expose que deux.
 * On n'en dessine donc que deux : un troisième segment qui ne ferait rien serait exactement
 * le réglage grisé sans explication que le contrat de `Switch` interdit.
 */

const exportUserData = httpsCallable<Record<string, never>, { downloadUrl: string; expiresInHours: number }>(
  functions,
  'exportUserData',
);
const deleteUserAccount = httpsCallable<{ confirmation: string }, { success: boolean }>(
  functions,
  'deleteUserAccount',
);

interface SettingsTabProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onSignOut: () => void;
}

export default function SettingsTab({ theme, setTheme, onSignOut }: SettingsTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { addToast } = useToast();
  const { signOut, user, userData, refreshUserData } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const reveal = useReveal<HTMLDivElement>();

  const [savingConsent, setSavingConsent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleToggleAiMemory = async (checked: boolean) => {
    if (!user || !userData) return;
    setSavingConsent(true);
    try {
      await updateUserProfile(user.uid, {
        preferences: { ...userData.preferences, aiMemoryConsent: checked },
      });
      await refreshUserData();
      addToast('success', checked ? t('settings.toastMemoryOn') : t('settings.toastMemoryOff'));
    } catch {
      addToast('error', t('settings.toastUpdateError'));
    } finally {
      setSavingConsent(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportUserData({});
      const url = result.data.downloadUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
      addToast('success', t('settings.toastExportSuccess'));
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('settings.toastExportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    const typed = confirmText.trim().toUpperCase();
    if (typed !== 'SUPPRIMER' && typed !== 'DELETE') {
      addToast('error', t('settings.toastConfirmDelete'));
      return;
    }
    setDeleting(true);
    try {
      await deleteUserAccount({ confirmation: 'SUPPRIMER' });
      await signOut();
      addToast('success', t('settings.toastAccountDeleted'));
      navigate('/');
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('settings.toastDeleteError'));
      setDeleting(false);
    }
  };

  // Les deux langues s'écrivent DANS leur propre langue, jamais traduites : quelqu'un qui
  // cherche l'anglais cherche « English », pas « Anglais ».
  const LANGS = ['Français', 'English'] as const;
  const THEMES = [t('settings.themeLight'), t('settings.themeDark')] as const;

  /** Le texte tapé ne correspond pas encore : c'est une information, pas une faute. */
  const typed = confirmText.trim().toUpperCase();
  const confirmMismatch = confirmText.length > 0 && typed !== 'SUPPRIMER' && typed !== 'DELETE';


  /*
   * `.play` DOIT ÊTRE POSÉ ICI, ET RIEN NE LE POSAIT.
   *
   * `SiteEyebrow` rend `<p class="rv mm-eyebrow">`, et `.rv` vaut `opacity: 0` TANT QU'UN
   * ANCÊTRE NE PORTE PAS `.play`. Les pages publiques l'obtiennent de `PageSite`, les écrans
   * de compte de `AuthPage` — mais `AppShell`, la coquille de l'espace apprenant, n'appelle
   * `useReveal` nulle part. Sans ce déclencheur, chaque sourcil de cet onglet resterait
   * invisible, y compris pour qui a demandé moins de mouvement (le repli ramène les durées à
   * 1 ms, il ne rend pas `.rv` visible — c'est `useReveal` qui pose `.play` d'emblée).
   */
  return (
    <div ref={reveal} className="max-w-lg">
      {/* ── Langue ─────────────────────────────────────────────────────────── */}
      <SiteEyebrow>{t('settings.languageTitle')}</SiteEyebrow>
      <Segmented
        options={LANGS}
        value={language === 'en' ? 'English' : 'Français'}
        onChange={(o) => setLanguage(o === 'English' ? 'en' : 'fr')}
        label={t('settings.languageTitle')}
      />
      <p className="text-small text-ink-2 mt-1.5">{t('settings.languageNote')}</p>

      {/* ── Apparence ──────────────────────────────────────────────────────── */}
      <SiteEyebrow style={{ marginTop: '22px' }}>{t('settings.appearance')}</SiteEyebrow>
      <Segmented
        options={THEMES}
        value={theme === 'dark' ? THEMES[1] : THEMES[0]}
        onChange={(o) => setTheme(o === THEMES[1] ? 'dark' : 'light')}
        label={t('settings.appearanceGroupLabel')}
      />

      {/* ── Le répétiteur ──────────────────────────────────────────────────── */}
      <SiteEyebrow style={{ marginTop: '22px' }}>{t('settings.aiAssistant')}</SiteEyebrow>
      <GlassPanel level="flat" padding="6px 18px">
        <LessonRow
          state="plain"
          title={t('settings.rysmoMemory')}
          meta={savingConsent ? t('settings.updating') : t('settings.rysmoMemoryDesc')}
          trailing={
            <Switch
              on={userData?.preferences?.aiMemoryConsent !== false}
              onChange={(on) => void handleToggleAiMemory(on)}
              label={t('settings.rysmoMemory')}
            />
          }
          last
        />
      </GlassPanel>

      {/* ── Tes données ────────────────────────────────────────────────────── */}
      <SiteEyebrow style={{ marginTop: '22px' }}>{t('settings.myData')}</SiteEyebrow>
      <p className="text-small text-ink-2 mb-2.5">{t('settings.myDataDesc')}</p>
      <GlassPanel level="flat" padding="6px 18px">
        <LessonRow
          state="plain"
          icon={<Icon name="download" size={14} />}
          title={exporting ? t('settings.exporting') : t('settings.exportData')}
          meta={t('settings.exportNote')}
          onClick={exporting ? undefined : () => void handleExport()}
        />
        <LessonRow
          state="plain"
          icon={<Icon name="trash" size={14} color="var(--stop)" />}
          iconBackground="color-mix(in srgb, var(--stop) 12%, transparent)"
          title={<span style={{ color: 'var(--stop)' }}>{t('settings.deleteAccount')}</span>}
          meta={t('settings.deleteNote')}
          onClick={() => setShowDeleteConfirm(true)}
          last
        />
      </GlassPanel>

      {/* ── Compte ─────────────────────────────────────────────────────────── */}
      <SiteEyebrow style={{ marginTop: '22px' }}>{t('settings.account')}</SiteEyebrow>
      <Button tone="quiet" fullWidth onClick={onSignOut}>{t('settings.signOut')}</Button>
      <p className="text-small text-ink-2 text-center mt-2">{t('settings.signOutNote')}</p>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
        onConfirm={handleDelete}
        title={t('settings.deleteDialogTitle')}
        confirmLabel={deleting ? t('settings.deleting') : t('settings.deleteConfirmLabel')}
        variant="danger"
        loading={deleting}
      >
        <div className="space-y-3">
          <p className="text-meta text-ink-2">
            <Trans i18nKey="settings.deleteIrreversible" t={t} components={[<strong />]} />
          </p>
          <ul className="list-disc list-inside text-small text-ink-2 space-y-1">
            <li>{t('settings.deleteItem1')}</li>
            <li>{t('settings.deleteItem2')}</li>
            <li>{t('settings.deleteItem3')}</li>
            <li>{t('settings.deleteItem4')}</li>
          </ul>
          {/*
            Le mot à taper est le LIBELLÉ, pas un fragment mis en monospace au milieu d'une
            phrase. `Field` lie le libellé au contrôle par un `id` généré et pose
            `aria-invalid` + `aria-describedby` quand le texte ne correspond pas encore.
          */}
          <Field
            label={t('settings.deleteConfirmField')}
            value={confirmText}
            onChange={setConfirmText}
            placeholder={t('settings.deleteConfirmPlaceholder')}
            error={confirmMismatch ? t('settings.deleteConfirmMismatch') : undefined}
            autoComplete="off"
            style={{ marginTop: 0 }}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
