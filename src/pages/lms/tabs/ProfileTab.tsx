import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Linkedin, Globe2, ExternalLink, Loader2, Save } from 'lucide-react';
import PhoneInput from '../../../components/ui/PhoneInput';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { updateUserProfile, syncSocialsToClubProfile } from '../../../lib/firestore';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { captureError } from '../../../lib/sentry';
import { staggerContainer, staggerItem } from '../../../lib/animations';

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

const socialLinks = [
  { label: 'Chaîne WhatsApp', desc: 'Rejoins la chaîne officielle', url: 'https://whatsapp.com/channel/0029Vb2mX9zDjiOe1qo3IR1H', color: 'bg-green-500' },
  { label: 'LinkedIn', desc: 'Suis mon actualité pro', url: 'https://www.linkedin.com/in/max-morrys-eyoum/', color: 'bg-blue-700' },
  { label: 'Instagram', desc: '@maxmorrys.me', url: 'https://www.instagram.com/maxmorrys.me', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { label: 'Facebook', desc: 'Rejoins la page', url: 'https://www.facebook.com/maxmorrys.me/', color: 'bg-blue-600' },
  { label: 'YouTube', desc: 'Formations et tutoriels gratuits', url: 'https://www.youtube.com/@maxmorrys-me', color: 'bg-red-600' },
  { label: 'TikTok', desc: 'Conseils en format court', url: 'https://www.tiktok.com/@maxmorrys.me', color: 'bg-neutral-900 dark:bg-neutral-700' },
  { label: 'X', desc: '@max_morrys', url: 'https://x.com/max_morrys', color: 'bg-neutral-900 dark:bg-neutral-700' },
];

interface ProfileTabProps {
  enrolledFormations: EnrolledFormation[];
  completedCount: number;
}

export default function ProfileTab({ enrolledFormations, completedCount }: ProfileTabProps) {
  const { user, userData, refreshUserData } = useAuth();
  const { addToast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Étudiant';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

  const [profileForm, setProfileForm] = useState({
    displayName: '', firstName: '', lastName: '', birthDate: '', phone: '', whatsapp: '', linkedin: '', bio: '',
    city: '', website: '', facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (userData) {
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { addToast('error', 'Seules les images sont acceptées.'); return; }
    if (file.size > 2 * 1024 * 1024) { addToast('error', 'La photo ne doit pas dépasser 2 Mo.'); return; }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileRef = storageRef(storage, `avatars/${user.uid}/profile.${ext}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateProfile(user, { photoURL: url });
      await updateUserProfile(user.uid, { photoURL: url });
      await refreshUserData();
      addToast('success', 'Photo de profil mise à jour.');
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to upload profile photo' });
      addToast('error', error instanceof Error ? error.message : 'Erreur lors du téléchargement de la photo.');
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
      addToast('success', 'Profil mis à jour avec succès.');
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to update user profile' });
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <motion.div
      className="max-w-2xl space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Photo de profil */}
      <motion.div variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-5">Photo de profil</h3>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center overflow-hidden ring-4 ring-brand-50 dark:ring-brand-900/20">
              {photoURL ? (
                <img src={photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
              )}
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
            >
              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">{displayName}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <p className="text-xs text-neutral-400 mt-1">JPG, PNG ou GIF · Max 2 Mo</p>
          </div>
        </div>
      </motion.div>

      {/* Informations personnelles */}
      <motion.div variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-5">Informations personnelles</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Prénom</label>
            <input value={profileForm.firstName} onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Ton prénom" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Nom de famille</label>
            <input value={profileForm.lastName} onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Ton nom" className={inputCls} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-500">Nom affiché <span className="font-normal text-neutral-400">(visible sur la plateforme)</span></label>
            <input value={profileForm.displayName} onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Ton nom d'affichage" className={inputCls} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-500">Adresse email</label>
            <input value={user?.email || ''} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Date de naissance</label>
            <input type="date" value={profileForm.birthDate} onChange={(e) => setProfileForm((p) => ({ ...p, birthDate: e.target.value }))} className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Téléphone</label>
            <PhoneInput value={profileForm.phone} onChange={(v) => setProfileForm((p) => ({ ...p, phone: v }))} placeholder="77 123 45 67" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">WhatsApp</label>
            <PhoneInput value={profileForm.whatsapp} onChange={(v) => setProfileForm((p) => ({ ...p, whatsapp: v }))} placeholder="77 123 45 67" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5"><Linkedin className="w-3 h-3" /> LinkedIn</label>
            <input type="url" value={profileForm.linkedin} onChange={(e) => setProfileForm((p) => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/ton-profil" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Ville</label>
            <input value={profileForm.city} onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))} placeholder="Dakar, Abidjan..." className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Site web</label>
            <input type="url" value={profileForm.website} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Facebook</label>
            <input value={profileForm.facebook} onChange={(e) => setProfileForm((p) => ({ ...p, facebook: e.target.value }))} placeholder="URL ou @pseudo" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">Instagram</label>
            <input value={profileForm.instagram} onChange={(e) => setProfileForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="URL ou @pseudo" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">X (Twitter)</label>
            <input value={profileForm.twitter} onChange={(e) => setProfileForm((p) => ({ ...p, twitter: e.target.value }))} placeholder="URL ou @pseudo" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500">TikTok</label>
            <input value={profileForm.tiktok} onChange={(e) => setProfileForm((p) => ({ ...p, tiktok: e.target.value }))} placeholder="URL ou @pseudo" className={inputCls} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-500">YouTube</label>
            <input value={profileForm.youtube} onChange={(e) => setProfileForm((p) => ({ ...p, youtube: e.target.value }))} placeholder="URL de la chaîne" className={inputCls} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-500">Biographie</label>
            <textarea value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Parle-nous de toi en quelques lignes..." rows={3} className={`${inputCls} resize-y`} />
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={handleSaveProfile} disabled={savingProfile} icon={savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
            {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
          </Button>
        </div>
      </motion.div>

      {/* Rejoindre la communauté */}
      <motion.div variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Rejoins la communauté</h3>
        <p className="text-sm text-neutral-500 mb-5">Suis Max-Morrys sur les réseaux pour ne rien manquer.</p>
        <div className="space-y-2">
          {socialLinks.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group">
              <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center flex-shrink-0`}>
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{link.label}</p>
                <p className="text-xs text-neutral-400">{link.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Mon parcours */}
      <motion.div variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Mon parcours</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <span className="text-neutral-500">Formations inscrites</span>
            <span className="font-medium text-neutral-900 dark:text-white">{enrolledFormations.length}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <span className="text-neutral-500">Formations terminées</span>
            <span className="font-medium text-neutral-900 dark:text-white">{completedCount}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-500">Membre depuis</span>
            <span className="font-medium text-neutral-900 dark:text-white">
              {userData?.createdAt ? formatDate(userData.createdAt) : '—'}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
