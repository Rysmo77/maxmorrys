import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Linkedin, Globe2, ExternalLink, Star, MessageSquareQuote, Loader2, Save, Send } from 'lucide-react';
import PhoneInput from '../../../components/ui/PhoneInput';
import Button from '../../../components/ui/Button';
import { cn, formatDate } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { updateUserProfile, getMyTestimonial, submitTestimonial } from '../../../lib/firestore';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';
import type { Testimonial } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { captureError } from '../../../lib/sentry';
import { staggerContainer, staggerItem } from '../../../lib/animations';

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

const socialLinks = [
  { label: 'Chaîne WhatsApp', desc: 'Rejoins la chaîne officielle', url: 'https://whatsapp.com/channel/0029Vb2mX9zDjiOe1qo3IR1H', color: 'bg-green-500' },
  { label: 'Instagram', desc: '@maxmorrys', url: 'https://instagram.com/maxmorrys', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { label: 'YouTube', desc: 'Formations et tutoriels gratuits', url: 'https://youtube.com/@maxmorrys', color: 'bg-red-600' },
  { label: 'TikTok', desc: 'Conseils en format court', url: 'https://tiktok.com/@maxmorrys', color: 'bg-neutral-900 dark:bg-neutral-700' },
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
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [myTestimonial, setMyTestimonial] = useState<Testimonial | null>(null);
  const [loadingTestimonial, setLoadingTestimonial] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ content: '', rating: 5 });
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

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
      });
    }
  }, [userData]);

  useEffect(() => {
    if (!user) return;
    setLoadingTestimonial(true);
    getMyTestimonial(user.uid).then((t) => {
      setMyTestimonial(t);
      setLoadingTestimonial(false);
    }).catch(() => { setLoadingTestimonial(false); });
  }, [user]);

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
      await updateUserProfile(user.uid, {
        displayName: newDisplayName,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        birthDate: profileForm.birthDate || undefined,
        phone: profileForm.phone.trim() || undefined,
        whatsapp: profileForm.whatsapp.trim() || undefined,
        linkedin: profileForm.linkedin.trim() || undefined,
        bio: profileForm.bio.trim() || undefined,
      });
      await refreshUserData();
      addToast('success', 'Profil mis à jour avec succès.');
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to update user profile' });
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!user || !testimonialForm.content.trim()) return;
    setSubmittingTestimonial(true);
    try {
      await submitTestimonial({
        userId: user.uid,
        name: displayName,
        avatar: user.photoURL || userData?.photoURL || '',
        role: 'Étudiant',
        content: testimonialForm.content.trim(),
        rating: testimonialForm.rating,
      });
      const t = await getMyTestimonial(user.uid);
      setMyTestimonial(t);
      setTestimonialForm({ content: '', rating: 5 });
      addToast('success', 'Merci pour ton témoignage ! Il sera visible après validation.');
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to submit testimonial' });
      addToast('error', error instanceof Error ? error.message : "Erreur lors de l'envoi du témoignage.");
    } finally {
      setSubmittingTestimonial(false);
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

      {/* Témoignage */}
      <motion.div variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareQuote className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Ton témoignage</h3>
        </div>
        <p className="text-sm text-neutral-500 mb-5">Partage ton expérience sur la plateforme Max-Morrys.</p>

        {loadingTestimonial ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
        ) : myTestimonial ? (
          <div className="space-y-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`w-4 h-4 ${n <= myTestimonial.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700'}`} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">"{myTestimonial.content}"</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-xs px-2.5 py-1 rounded-full font-semibold',
                myTestimonial.status === 'pending' ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400' :
                myTestimonial.status === 'approved' ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' :
                'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
              )}>
                {myTestimonial.status === 'pending' ? 'En attente de validation' :
                 myTestimonial.status === 'approved' ? 'Approuvé et publié' : 'Non retenu'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Ta note</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setTestimonialForm((p) => ({ ...p, rating: n }))} className="focus:outline-none transition-transform hover:scale-110">
                    <Star className={`w-7 h-7 ${n <= testimonialForm.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700'}`} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Ton message</label>
              <textarea value={testimonialForm.content} onChange={(e) => setTestimonialForm((p) => ({ ...p, content: e.target.value }))} placeholder="Décris ton expérience sur la plateforme Max-Morrys..." rows={4} maxLength={1000} className={`${inputCls} resize-y`} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmitTestimonial} disabled={submittingTestimonial || !testimonialForm.content.trim()} icon={submittingTestimonial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}>
                {submittingTestimonial ? 'Envoi...' : 'Envoyer mon témoignage'}
              </Button>
            </div>
          </div>
        )}
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
