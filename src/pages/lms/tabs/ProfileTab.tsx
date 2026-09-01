import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { updateProfile } from 'firebase/auth';
import { Avatar, Button, Field, GlassPanel, Icon, IconButton, LessonRow, Num, useToast } from '@ds';
import PhoneInput from '@/components/forms/PhoneInput';
import { SiteEyebrow, useReveal } from '../../../components/site';
import { useFormat } from '../../../hooks/useFormat';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserProfile, syncSocialsToClubProfile } from '../../../lib/firestore';
import { uploadMedia } from '../../../lib/storage';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { captureError } from '../../../lib/sentry';

/**
 * LE PROFIL (`ScreensCompte.js` · en-tête de `Preferences`).
 *
 * TROIS CHOSES CHANGENT, ET AUCUNE N'EST COSMÉTIQUE.
 *
 * 1. LES QUINZE `<input>` MAISON DEVIENNENT DES `Field`. La constante `inputCls` posait un
 *    un anneau Tailwind sans couleur nommée et aucun `autoComplete` : le navigateur ne
 *    (⚠️ le nom exact de la classe n'est PAS écrit ici : le scanner de Tailwind ne lit
 *    pas les commentaires, et une classe CITÉE dans un commentaire est GÉNÉRÉE dans le
 *    bundle. Celle-ci y survivait encore, en règle morte, longtemps après son retrait.)
 *    pré-remplissait rien, et le clavier logiciel d'un téléphone s'ouvrait en alphabétique
 *    pour un numéro de téléphone. `Field` expose `inputMode` et `autoComplete`, et lie chaque
 *    `<label>` à son contrôle par un `id` généré — les libellés d'avant étaient orphelins.
 *
 * 2. LES SEPT PASTILLES DE MARQUE PERDENT LEURS COULEURS LITTÉRALES. `bg-green-500`,
 *    `bg-blue-700`, `bg-gradient-to-br from-purple-500 to-pink-500` : des valeurs Tailwind
 *    hors de toute échelle du système, qui ne basculent pas sous `.dk` et qu'aucun jeton ne
 *    gouverne (AD-2). Les sept réseaux passent en lignes de liste, avec le glyphe du système
 *    et le chevron de sortie — le dessin que le kit donne à « Dans ton espace ».
 *
 * 3. LES DEUX COMPTEURS DE « MON PARCOURS » PASSENT PAR `<Num>`. Ce sont des nombres, ils
 *    viennent de la base, ils portent maintenant leur source et leur date de relevé. Ce ne
 *    sont PAS des nombres d'inscrits au sens de l'interdit du système : personne d'autre ne
 *    les lit, ils ne servent à convaincre personne.
 */

const SOCIAL_LINKS = [
  { key: 'whatsapp', url: 'https://whatsapp.com/channel/0029Vb2mX9zDjiOe1qo3IR1H' },
  { key: 'linkedin', url: 'https://www.linkedin.com/in/max-morrys-eyoum/' },
  { key: 'instagram', url: 'https://www.instagram.com/maxmorrys.me' },
  { key: 'facebook', url: 'https://www.facebook.com/maxmorrys.me/' },
  { key: 'youtube', url: 'https://www.youtube.com/@maxmorrys-me' },
  { key: 'tiktok', url: 'https://www.tiktok.com/@maxmorrys.me' },
  { key: 'x', url: 'https://x.com/max_morrys' },
];

interface ProfileTabProps {
  enrolledFormations: EnrolledFormation[];
  completedCount: number;
}

export default function ProfileTab({ enrolledFormations, completedCount }: ProfileTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
  const { user, userData, refreshUserData } = useAuth();
  const { addToast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const reveal = useReveal<HTMLDivElement>();

  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || t('profile.studentFallback');
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

  const [profileForm, setProfileForm] = useState({
    displayName: '', firstName: '', lastName: '', birthDate: '', phone: '', whatsapp: '', linkedin: '', bio: '',
    city: '', website: '', facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  /** L'instant où le profil a été lu : la date de relevé des deux compteurs de parcours. */
  const [readAt, setReadAt] = useState<Date>(() => new Date());

  useEffect(() => {
    if (userData) {
      setReadAt(new Date());
      setProfileForm({
        displayName: userData.displayName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        birthDate: userData.birthDate || '',
        phone: userData.phone || '',
        whatsapp: userData.whatsapp || '',
        linkedin: userData.linkedin || '',
        bio: userData.bio || '',
        city: userData.city || '',
        website: userData.website || '',
        facebook: userData.facebook || '',
        instagram: userData.instagram || '',
        twitter: userData.twitter || '',
        tiktok: userData.tiktok || '',
        youtube: userData.youtube || '',
      });
    }
  }, [userData]);

  const set = (key: keyof typeof profileForm) => (v: string) => setProfileForm((p) => ({ ...p, [key]: v }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { addToast('error', t('profile.toastPhotoTypeError')); return; }
    if (file.size > 2 * 1024 * 1024) { addToast('error', t('profile.toastPhotoSizeError')); return; }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const url = await uploadMedia(file, `avatars/${user.uid}/profile.${ext}`);
      await updateProfile(user, { photoURL: url });
      await updateUserProfile(user.uid, { photoURL: url });
      await refreshUserData();
      addToast('success', t('profile.toastPhotoSuccess'));
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to upload profile photo' });
      addToast('error', error instanceof Error ? error.message : t('profile.toastPhotoError'));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const newDisplayName = profileForm.displayName.trim()
        || `${profileForm.firstName} ${profileForm.lastName}`.trim()
        || displayName;
      if (newDisplayName !== user.displayName) {
        await updateProfile(user, { displayName: newDisplayName });
      }
      const socials = {
        city: profileForm.city.trim(),
        website: profileForm.website.trim(),
        linkedin: profileForm.linkedin.trim(),
        whatsapp: profileForm.whatsapp.trim(),
        facebook: profileForm.facebook.trim(),
        instagram: profileForm.instagram.trim(),
        twitter: profileForm.twitter.trim(),
        tiktok: profileForm.tiktok.trim(),
        youtube: profileForm.youtube.trim(),
      };
      await updateUserProfile(user.uid, {
        displayName: newDisplayName,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        birthDate: profileForm.birthDate || undefined,
        phone: profileForm.phone.trim() || undefined,
        bio: profileForm.bio.trim() || undefined,
        ...socials,
      });
      // Synchronise les réseaux vers le profil Club (annuaire) s'il existe
      await syncSocialsToClubProfile(user.uid, socials).catch(() => null);
      await refreshUserData();
      addToast('success', t('profile.toastSaveSuccess'));
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to update user profile' });
      addToast('error', error instanceof Error ? error.message : t('profile.toastSaveError'));
    } finally {
      setSavingProfile(false);
    }
  };


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
    <div ref={reveal} className="max-w-2xl">
      {/* ── L'identité ─────────────────────────────────────────────────────── */}
      <GlassPanel level="flat" padding={18}>
        <div className="flex items-center gap-3.5">
          <div className="relative flex-shrink-0">
            {photoURL
              ? <img src={photoURL} alt={t('profile.photoAlt')} className="w-14 h-14 rounded-full object-cover" />
              : <Avatar initials={initials} size={56} />}
            {/* Le déclencheur est un vrai bouton nommé : l'ancien n'avait ni libellé ni rôle
                annoncé, et son rond de chargement disparaissait le sens de la cible. */}
            <span className="absolute -bottom-1 -right-1">
              <IconButton
                label={t('profile.changePhoto')}
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
                style={{ width: '32px', height: '32px' }}
              >
                <Icon name="image" size={15} />
              </IconButton>
            </span>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink m-0 truncate">{displayName}</p>
            <p className="text-meta text-ink-2 m-0 truncate">{user?.email}</p>
            <p className="text-small text-ink-2 m-0 mt-0.5">{t('profile.photoHint')}</p>
          </div>
        </div>
      </GlassPanel>

      {/* ── Les informations ───────────────────────────────────────────────── */}
      <SiteEyebrow style={{ marginTop: '22px' }}>{t('profile.personalInfo')}</SiteEyebrow>
      <GlassPanel level="flat" padding={18} as="section" aria-label={t('profile.formLabel')}>
        <div className="grid stack:grid-cols-2 gap-x-4">
          <Field label={t('profile.firstName')} value={profileForm.firstName} onChange={set('firstName')} placeholder={t('profile.firstNamePlaceholder')} autoComplete="given-name" style={{ marginTop: 0 }} />
          <Field label={t('profile.lastName')} value={profileForm.lastName} onChange={set('lastName')} placeholder={t('profile.lastNamePlaceholder')} autoComplete="family-name" style={{ marginTop: 0 }} />

          <div className="stack:col-span-2">
            <Field
              label={t('profile.displayName')}
              hint={t('profile.displayNameHint')}
              value={profileForm.displayName}
              onChange={set('displayName')}
              placeholder={t('profile.displayNamePlaceholder')}
              autoComplete="nickname"
            />
          </div>

          <div className="stack:col-span-2">
            {/* L'adresse ne se modifie pas ici : c'est l'identifiant d'authentification. */}
            <Field label={t('profile.email')} type="email" value={user?.email || ''} readOnly disabled />
          </div>

          <Field label={t('profile.birthDate')} type="date" value={profileForm.birthDate} onChange={set('birthDate')} autoComplete="bday" />
          <div className="mt-[var(--sp-14)]">
            <label htmlFor="profile-phone" className="block text-meta-2 font-semibold text-ink-2 mb-1.5">{t('profile.phone')}</label>
            <PhoneInput id="profile-phone" value={profileForm.phone} onChange={set('phone')} placeholder="77 123 45 67" />
          </div>

          <div className="mt-[var(--sp-14)]">
            <label htmlFor="profile-whatsapp" className="block text-meta-2 font-semibold text-ink-2 mb-1.5">{t('profile.whatsapp')}</label>
            <PhoneInput id="profile-whatsapp" value={profileForm.whatsapp} onChange={set('whatsapp')} placeholder="77 123 45 67" />
          </div>
          <Field label={t('profile.linkedin')} type="url" inputMode="url" value={profileForm.linkedin} onChange={set('linkedin')} placeholder={t('profile.linkedinPlaceholder')} autoComplete="url" />

          <Field label={t('profile.city')} value={profileForm.city} onChange={set('city')} placeholder={t('profile.cityPlaceholder')} autoComplete="address-level2" />
          <Field label={t('profile.website')} type="url" inputMode="url" value={profileForm.website} onChange={set('website')} placeholder={t('profile.websitePlaceholder')} />

          <Field label={t('profile.facebook')} value={profileForm.facebook} onChange={set('facebook')} placeholder={t('profile.handlePlaceholder')} />
          <Field label={t('profile.instagram')} value={profileForm.instagram} onChange={set('instagram')} placeholder={t('profile.handlePlaceholder')} />
          <Field label={t('profile.twitter')} value={profileForm.twitter} onChange={set('twitter')} placeholder={t('profile.handlePlaceholder')} />
          <Field label={t('profile.tiktok')} value={profileForm.tiktok} onChange={set('tiktok')} placeholder={t('profile.handlePlaceholder')} />

          <div className="stack:col-span-2">
            <Field label={t('profile.youtube')} type="url" inputMode="url" value={profileForm.youtube} onChange={set('youtube')} placeholder={t('profile.youtubePlaceholder')} />
          </div>
          <div className="stack:col-span-2">
            <Field as="textarea" rows={3} maxLength={600} label={t('profile.bio')} value={profileForm.bio} onChange={set('bio')} placeholder={t('profile.bioPlaceholder')} />
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button size="sm" onClick={() => void handleSaveProfile()} loading={savingProfile}>
            {savingProfile ? t('profile.saving') : t('profile.saveProfile')}
          </Button>
        </div>
      </GlassPanel>

      {/* ── La communauté ──────────────────────────────────────────────────── */}
      <SiteEyebrow style={{ marginTop: '22px' }}>{t('profile.communityTitle')}</SiteEyebrow>
      <p className="text-small text-ink-2 mb-2.5">{t('profile.communitySubtitle')}</p>
      <GlassPanel level="flat" padding="6px 18px" as="nav" aria-label={t('profile.socialsLabel')}>
        {SOCIAL_LINKS.map((link, i) => (
          <LessonRow
            key={link.url}
            state="plain"
            icon={<Icon name="globe" size={14} />}
            title={t(`profile.social.${link.key}Label`)}
            meta={t(`profile.social.${link.key}Desc`)}
            href={link.url}
            trailing={<Icon name="forward" size={16} color="var(--text-muted)" strokeWidth={2.4} />}
            last={i === SOCIAL_LINKS.length - 1}
          />
        ))}
      </GlassPanel>

      {/* ── Mon parcours ───────────────────────────────────────────────────── */}
      <SiteEyebrow style={{ marginTop: '22px' }}>{t('profile.journeyTitle')}</SiteEyebrow>
      <GlassPanel level="flat" padding="6px 18px">
        <LessonRow
          state="plain"
          title={t('profile.enrolled')}
          trailing={<Num value={enrolledFormations.length} source="db" asOf={readAt} />}
        />
        <LessonRow
          state="plain"
          title={t('profile.completed')}
          trailing={<Num value={completedCount} source="db" asOf={readAt} />}
        />
        <LessonRow
          state="plain"
          title={t('profile.memberSince')}
          // Un `—` cacherait la différence entre « je ne sais pas » et une vraie date :
          // <Num> rend « non relevé » quand la valeur manque, ce qui est une information.
          trailing={<Num value={userData?.createdAt ? formatDate(userData.createdAt) : null} source="db" asOf={readAt} />}
          last
        />
      </GlassPanel>
    </div>
  );
}
