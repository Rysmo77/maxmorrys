import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Button, Field, GlassPanel, Icon, LessonRow, Segmented, Switch, useToast } from '@ds';
import { ConfirmDialog } from '@/components/dialogs';
import { SiteEyebrow, useReveal } from '../../../components/site';
import { functions } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { tutorName } from '../../../lib/naming';
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
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * DEUX COLONNES DE TRAVAIL — `handoff_tableaux_de_bord` § ProfilDesktop
 *
 * La maquette range les réglages en DEUX colonnes et n'ouvre aucun panneau de contexte :
 * « les réglages n'ont pas de contexte permanent à afficher à côté ». Ce qu'on MODIFIE à
 * gauche — langue, apparence, répétiteur ; ce qui touche au COMPTE à droite — ce qui
 * m'arrive, mes données, la sortie. `ProfileTab` applique la même règle, et pour la même
 * raison : ces deux écrans sont les deux moitiés du `ProfilDesktop` de la maquette, séparés
 * ici par une route, pas par une intention.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * « CE QUE JE T'ENVOIE » : LE BLOC EXISTE, LES QUATRE INTERRUPTEURS N'EXISTENT PAS.
 *
 * La maquette dessine quatre réglages de notification — reprise de cours, série quotidienne,
 * digest du Club, par e-mail. `UserPreferences` n'en porte AUCUN : il n'a que `theme`,
 * `language`, `newsletter` et `aiMemoryConsent`. Quatre interrupteurs qui n'écrivent nulle
 * part seraient quatre réglages qui redeviennent silencieusement vrais au rechargement —
 * pire qu'absents, parce qu'on croit avoir décidé.
 *
 * Ce qui EST vrai, et que la maquette dit dans le même bloc, c'est le canal : « aucun e-mail
 * ne part encore ». Le produit a un centre de notifications applicatif, et un seul.
 * Cet écran renvoie donc vers lui, et rend le canal e-mail comme ce qu'il est — un
 * interrupteur désactivé QUI DIT SA RAISON, ce que `Switch` prend en charge par
 * `disabledReason` et annonce en `aria-describedby`. C'est la seule des cinq lignes de la
 * maquette qui puisse être rendue sans mentir.
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
  /* Le nom du répétiteur vient du profil, jamais d'une constante : chacun peut le renommer,
     et les préférences sont l'un des deux chemins de renommage. Y écrire « Rysmo » — le nom
     de l'APPLICATION — contredisait l'écran juste à côté. */
  const tutor = tutorName(userData);
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
      addToast('success', checked ? t('settings.toastMemoryOn', { tutor }) : t('settings.toastMemoryOff', { tutor }));
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
    <div ref={reveal} className="wide:grid wide:grid-cols-2 wide:items-start wide:gap-6">
      <div className="min-w-0 max-w-lg">
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
          title={t('settings.rysmoMemory', { tutor })}
          meta={savingConsent ? t('settings.updating') : t('settings.rysmoMemoryDesc', { tutor })}
          trailing={
            <Switch
              on={userData?.preferences?.aiMemoryConsent !== false}
              onChange={(on) => void handleToggleAiMemory(on)}
              label={t('settings.rysmoMemory', { tutor })}
            />
          }
          last
        />
      </GlassPanel>

      </div>

      {/* La marge haute vit sur la COLONNE : `SiteEyebrow` réserve son `className` à la
          couleur, et son `style` en ligne battrait une classe responsive. */}
      <div className="mt-[22px] min-w-0 max-w-lg wide:mt-0">
      {/* ── Ce que je t'envoie ─────────────────────────────────────────────── */}
      <SiteEyebrow>{t('settings.sendTitle')}</SiteEyebrow>
      <GlassPanel level="flat" padding="6px 18px">
        <LessonRow
          state="plain"
          icon={<Icon name="bell" size={14} />}
          title={t('settings.sendCenter')}
          meta={t('settings.sendCenterNote')}
          onClick={() => navigate('/mon-espace/notifications')}
          trailing={<Icon name="forward" size={16} color="var(--text-muted)" strokeWidth={2.4} />}
        />
        <LessonRow
          state="plain"
          icon={<Icon name="send" size={14} />}
          title={<span style={{ color: 'var(--text-faint)' }}>{t('settings.sendEmail')}</span>}
          meta={t('settings.sendEmailNote')}
          trailing={
            <Switch
              disabled
              label={t('settings.sendEmail')}
              disabledReason={t('settings.sendEmailNote')}
            />
          }
          last
        />
      </GlassPanel>
      <GlassPanel level="truth" style={{ marginTop: '12px' }}>
        <p className="mm-eyebrow m-0 mb-1.5">{t('settings.sendTruthTitle')}</p>
        <p className="m-0 text-meta leading-[1.55] text-ink-2">{t('settings.sendTruthBody')}</p>
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
      </div>

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
          {/*
            « CE QUI RESTE » — la maquette le pose face à la liste des pertes, et elle a
            raison : la liste seule fait croire que tout disparaît, y compris ce qui ne
            disparaît pas. `functions/src/gdpr.ts` supprime bien `certificates`, mais PAS
            `certificate_lookups` — le miroir public indexé par le code, qui ne porte ni UID
            ni adresse. Un certificat déjà émis reste donc vérifiable, ce qui est le principe
            même d'un certificat. La copie disait l'inverse.
          */}
          <div className="rounded-m border border-[color:color-mix(in_srgb,var(--ok)_28%,transparent)] p-3">
            <p className="m-0 text-meta font-bold text-ok">{t('settings.deleteKeptTitle')}</p>
            <p className="m-0 mt-1 text-small text-ink-2 leading-[1.5]">{t('settings.deleteKeptBody')}</p>
          </div>

          <Field
            label={t('settings.deleteConfirmField')}
            value={confirmText}
            onChange={setConfirmText}
            placeholder={t('settings.deleteConfirmPlaceholder')}
            error={confirmMismatch ? t('settings.deleteConfirmMismatch') : undefined}
            autoComplete="off"
            style={{ marginTop: 0 }}
          />

          {/* La sortie douce est là où la décision se prend, pas sur une autre ligne de la
              page : la maquette place « J'exporte d'abord mes données » sous le bouton de
              suppression, dans le même écran. */}
          <Button tone="quiet" fullWidth onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? t('settings.exporting') : t('settings.deleteExportFirst')}
          </Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
