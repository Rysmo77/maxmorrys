import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import {
  UsersThree, MapPin, LinkedinLogo, Globe, WhatsappLogo, FacebookLogo, InstagramLogo,
  XLogo, TiktokLogo, YoutubeLogo, PencilSimple, CircleNotch, FloppyDisk, MagnifyingGlass,
  Check, ChatCircle, Sparkle, X,
} from '@phosphor-icons/react';
import { cn } from '../../../../lib/utils';
import { getMyClubProfile, saveClubProfile, getClubMemberProfiles, getUserById, updateUserProfile } from '../../../../lib/firestore';
import { functions } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { ClubEmptyState } from './_shared';
import type { ClubMemberProfile } from '../../../../types';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';

interface CvResult {
  headline: string; skills: string[]; city: string; linkedin: string; website: string;
  facebook: string; instagram: string; twitter: string; tiktok: string; youtube: string;
}
const parseCvFn = httpsCallable<{ fileBase64: string; mimeType: string }, CvResult>(functions, 'parseCv');

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

type ClubData = ReturnType<typeof useClubData>;

const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500';
const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

const SOCIAL_BASE: Record<string, string> = {
  facebook: 'https://facebook.com/', instagram: 'https://instagram.com/',
  twitter: 'https://x.com/', tiktok: 'https://tiktok.com/@', youtube: 'https://youtube.com/',
};
function socialHref(platform: string, value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  if (platform === 'website') return `https://${handle}`;
  if (platform === 'linkedin') return `https://linkedin.com/in/${handle}`;
  return (SOCIAL_BASE[platform] ?? 'https://') + handle;
}

interface CompletionForm {
  headline: string; skills: string; city: string; available: boolean;
  linkedin: string; website: string; whatsapp: string;
  facebook: string; instagram: string; twitter: string; tiktok: string; youtube: string;
}
const COMPLETION_ITEMS: { key: string; label: string; benefit: string; done: (f: CompletionForm, photo: boolean) => boolean }[] = [
  { key: 'photo', label: 'Photo de profil', benefit: 'Une photo inspire confiance — les profils avec photo sont bien plus contactés.', done: (_, photo) => photo },
  { key: 'headline', label: 'Titre professionnel', benefit: "Décris ton expertise en une ligne pour être identifié au premier coup d'œil.", done: (f) => !!f.headline.trim() },
  { key: 'skills', label: 'Compétences', benefit: 'Tes compétences te rendent détectable pour les missions et opportunités du Club.', done: (f) => !!f.skills.trim() },
  { key: 'city', label: 'Ville', benefit: 'Indiquer ta ville te référence localement et te rend repérable pour des opportunités près de chez toi.', done: (f) => !!f.city.trim() },
  { key: 'available', label: 'Disponibilité', benefit: "Active « Dispo pour missions » pour apparaître en priorité auprès des recruteurs du Club.", done: (f) => f.available },
  { key: 'contact', label: 'Un moyen de contact', benefit: 'Ajoute au moins un réseau (LinkedIn, WhatsApp, site…) pour que les membres puissent te joindre.', done: (f) => !!(f.linkedin || f.whatsapp || f.website || f.facebook || f.instagram || f.twitter || f.tiktok || f.youtube).trim() },
];

export default function ClubMembers({ data }: { data: ClubData }) {
  const { user, displayName, photoURL, addToast, setDmTarget, setClubTab } = data;
  const { refreshUserData } = useAuth();
  const [profiles, setProfiles] = useState<ClubMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<ClubMemberProfile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    headline: '', skills: '', city: '', available: false, visible: true,
    linkedin: '', website: '', whatsapp: '', facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '',
  });

  const reload = () => getClubMemberProfiles().then(setProfiles).catch(() => null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getMyClubProfile(user.uid), getClubMemberProfiles(), getUserById(user.uid)]).then(([mine, list, u]) => {
      // Club profile takes precedence; fall back to the student profile (users) for socials
      setForm({
        headline: mine?.headline ?? '',
        skills: (mine?.skills ?? []).join(', '),
        city: mine?.city ?? u?.city ?? '',
        available: mine?.available ?? false,
        visible: mine?.visible ?? true,
        linkedin: mine?.linkedin ?? u?.linkedin ?? '',
        website: mine?.website ?? u?.website ?? '',
        whatsapp: mine?.whatsapp ?? u?.whatsapp ?? '',
        facebook: mine?.facebook ?? u?.facebook ?? '',
        instagram: mine?.instagram ?? u?.instagram ?? '',
        twitter: mine?.twitter ?? u?.twitter ?? '',
        tiktok: mine?.tiktok ?? u?.tiktok ?? '',
        youtube: mine?.youtube ?? u?.youtube ?? '',
      });
      setProfiles(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (cvInputRef.current) cvInputRef.current.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') { addToast('error', 'Seuls les PDF sont acceptés.'); return; }
    if (file.size > 8 * 1024 * 1024) { addToast('error', 'CV trop lourd (max 8 Mo).'); return; }
    setAnalyzing(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const { data: r } = await parseCvFn({ fileBase64, mimeType: file.type });
      setForm((p) => ({
        ...p,
        headline: r.headline || p.headline,
        skills: r.skills?.length ? r.skills.join(', ') : p.skills,
        city: r.city || p.city,
        linkedin: r.linkedin || p.linkedin,
        website: r.website || p.website,
        facebook: r.facebook || p.facebook,
        instagram: r.instagram || p.instagram,
        twitter: r.twitter || p.twitter,
        tiktok: r.tiktok || p.tiktok,
        youtube: r.youtube || p.youtube,
      }));
      setEditing(true);
      addToast('success', 'CV analysé — vérifie et complète, puis enregistre.');
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || "Échec de l'analyse du CV.";
      addToast('error', msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const socials = {
      city: form.city.trim(), linkedin: form.linkedin.trim(), website: form.website.trim(),
      whatsapp: form.whatsapp.trim(), facebook: form.facebook.trim(), instagram: form.instagram.trim(),
      twitter: form.twitter.trim(), tiktok: form.tiktok.trim(), youtube: form.youtube.trim(),
    };
    try {
      await saveClubProfile(user.uid, {
        displayName, photoURL: photoURL || '', headline: form.headline.trim(),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        available: form.available, visible: form.visible, ...socials,
      });
      // Synchronise les réseaux vers le profil étudiant (source de vérité) + rafraîchit /mon-espace/profil
      await updateUserProfile(user.uid, socials).catch(() => null);
      await refreshUserData().catch(() => null);
      addToast('success', 'Profil enregistré.');
      setEditing(false);
      reload();
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = profiles.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return p.displayName.toLowerCase().includes(q)
      || (p.city ?? '').toLowerCase().includes(q)
      || (p.headline ?? '').toLowerCase().includes(q)
      || p.skills.some((s) => s.toLowerCase().includes(q));
  });

  const completionChecks = COMPLETION_ITEMS.map((it) => ({ ...it, ok: it.done(form, !!photoURL) }));
  const doneCount = completionChecks.filter((c) => c.ok).length;
  const completion = Math.round((doneCount / COMPLETION_ITEMS.length) * 100);
  const nextItems = completionChecks.filter((c) => !c.ok);

  if (loading) return <div className="flex justify-center py-16"><CircleNotch className="w-8 h-8 animate-spin text-plum-500" /></div>;

  return (
    <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
      {/* My profile */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UsersThree className="w-5 h-5 text-plum-500" weight="duotone" />
            <h3 className="font-bold text-neutral-900 dark:text-white">Mon profil membre</h3>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-plum-600 dark:text-plum-400 hover:underline">
              <PencilSimple className="w-3.5 h-3.5" weight="bold" /> Modifier
            </button>
          )}
        </div>

        {/* Taux de remplissage + avantages */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-neutral-500">Profil complété à {completion}%</span>
            {completion === 100 && <span className="text-xs font-bold text-success-600 dark:text-success-400 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" weight="bold" /> Profil au top !</span>}
          </div>
          <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-500', completion === 100 ? 'bg-success-500' : 'bg-plum-500')} style={{ width: `${completion}%` }} />
          </div>
          {nextItems.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {nextItems.map((it) => (
                <li key={it.key} className="flex items-start gap-2 text-xs">
                  <Sparkle className="w-3.5 h-3.5 text-plum-500 flex-shrink-0 mt-0.5" weight="fill" />
                  <span className="text-neutral-600 dark:text-neutral-400">
                    <button onClick={() => setEditing(true)} className="font-semibold text-neutral-800 dark:text-neutral-200 hover:text-plum-600 dark:hover:text-plum-400 transition-colors">{it.label}</button>
                    {' — '}{it.benefit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CV → IA autofill (membres) */}
        <input ref={cvInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleCvUpload} />
        <button
          onClick={() => cvInputRef.current?.click()}
          disabled={analyzing}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-plum-300 dark:border-plum-700 text-plum-600 dark:text-plum-400 text-sm font-semibold hover:bg-plum-50 dark:hover:bg-plum-900/20 transition-colors disabled:opacity-60"
        >
          {analyzing ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" weight="fill" />}
          {analyzing ? 'Analyse du CV en cours…' : 'Remplir depuis mon CV (PDF) avec l\'IA'}
        </button>

        {editing ? (
          <div className="mt-3 space-y-3">
            <input value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} placeholder="Titre (ex : Community manager freelance)" className={inputCls} />
            <input value={form.skills} onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))} placeholder="Compétences séparées par des virgules (SEO, Ads, IA…)" className={inputCls} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Ville" className={inputCls} />
              <input value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp (optionnel)" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.linkedin} onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn URL" className={inputCls} />
              <input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="Site web" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.facebook} onChange={(e) => setForm((p) => ({ ...p, facebook: e.target.value }))} placeholder="Facebook" className={inputCls} />
              <input value={form.instagram} onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={form.twitter} onChange={(e) => setForm((p) => ({ ...p, twitter: e.target.value }))} placeholder="X (Twitter)" className={inputCls} />
              <input value={form.tiktok} onChange={(e) => setForm((p) => ({ ...p, tiktok: e.target.value }))} placeholder="TikTok" className={inputCls} />
              <input value={form.youtube} onChange={(e) => setForm((p) => ({ ...p, youtube: e.target.value }))} placeholder="YouTube" className={inputCls} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm((p) => ({ ...p, available: e.target.checked }))} className="rounded" /> Dispo pour missions
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input type="checkbox" checked={form.visible} onChange={(e) => setForm((p) => ({ ...p, visible: e.target.checked }))} className="rounded" /> Visible dans l'annuaire
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-xl text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? <CircleNotch className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" weight="fill" />} Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 mt-2">
            {form.visible ? 'Ton profil est visible dans l\'annuaire.' : 'Ton profil est masqué — active la visibilité pour apparaître.'}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom, compétence, ville…" className={cn(inputCls, 'pl-10')} />
      </div>

      {/* Directory */}
      {filtered.length === 0 ? (
        <ClubEmptyState icon={UsersThree} title="Aucun membre dans l'annuaire" subtitle="Complète et rends ton profil visible pour être le premier à apparaître." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <motion.button
              key={p.id}
              variants={staggerItem}
              onClick={() => setSelectedMember(p)}
              className="text-left bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 hover:border-plum-300 dark:hover:border-plum-700 hover:shadow-soft transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-plum-600 dark:text-plum-400">{initialsOf(p.displayName)}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-neutral-900 dark:text-white truncate">{p.displayName}</p>
                    {p.userId === user?.uid && <span className="text-[10px] text-neutral-400">· toi</span>}
                    {p.available && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400">Dispo</span>}
                  </div>
                  {p.headline && <p className="text-xs text-neutral-500 truncate">{p.headline}</p>}
                  {p.city && <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" weight="fill" /> {p.city}</p>}
                </div>
              </div>
              {p.skills.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {p.skills.slice(0, 5).map((s) => (
                    <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-plum-50 dark:bg-plum-900/20 text-plum-700 dark:text-plum-300">{s}</span>
                  ))}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Member profile modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setSelectedMember(null)}>
          <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
            {/* Poignée mobile */}
            <div className="sm:hidden flex justify-center pt-2.5">
              <span className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>
            <div className="p-5">
              {/* En-tête en ligne */}
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedMember.photoURL ? <img src={selectedMember.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-black text-plum-600 dark:text-plum-400">{initialsOf(selectedMember.displayName)}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white truncate">{selectedMember.displayName}</h3>
                  {selectedMember.headline && <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{selectedMember.headline}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedMember.city && <span className="text-xs text-neutral-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" weight="fill" /> {selectedMember.city}</span>}
                    {selectedMember.available && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400">Dispo pour missions</span>}
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"><X className="w-4 h-4" weight="bold" /></button>
              </div>

              {selectedMember.skills.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-4">
                  {selectedMember.skills.map((s) => (
                    <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-plum-50 dark:bg-plum-900/20 text-plum-700 dark:text-plum-300">{s}</span>
                  ))}
                </div>
              )}

              {/* Socials */}
              <div className="flex gap-2 flex-wrap mt-4">
                {selectedMember.linkedin && <a href={socialHref('linkedin', selectedMember.linkedin)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-[#0a66c2] transition-colors"><LinkedinLogo className="w-5 h-5" weight="fill" /></a>}
                {selectedMember.website && <a href={socialHref('website', selectedMember.website)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-plum-600 transition-colors"><Globe className="w-5 h-5" weight="fill" /></a>}
                {selectedMember.facebook && <a href={socialHref('facebook', selectedMember.facebook)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-[#1877f2] transition-colors"><FacebookLogo className="w-5 h-5" weight="fill" /></a>}
                {selectedMember.instagram && <a href={socialHref('instagram', selectedMember.instagram)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-[#e1306c] transition-colors"><InstagramLogo className="w-5 h-5" weight="fill" /></a>}
                {selectedMember.twitter && <a href={socialHref('twitter', selectedMember.twitter)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"><XLogo className="w-5 h-5" weight="fill" /></a>}
                {selectedMember.tiktok && <a href={socialHref('tiktok', selectedMember.tiktok)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"><TiktokLogo className="w-5 h-5" weight="fill" /></a>}
                {selectedMember.youtube && <a href={socialHref('youtube', selectedMember.youtube)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-[#ff0000] transition-colors"><YoutubeLogo className="w-5 h-5" weight="fill" /></a>}
                {selectedMember.whatsapp && <a href={`https://wa.me/${selectedMember.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-green-600 transition-colors"><WhatsappLogo className="w-5 h-5" weight="fill" /></a>}
              </div>

              {/* Key actions */}
              <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                {selectedMember.userId === user?.uid ? (
                  <button onClick={() => { setSelectedMember(null); setEditing(true); }} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold transition-colors">
                    <PencilSimple className="w-4 h-4" weight="bold" /> Modifier mon profil
                  </button>
                ) : (
                  <button onClick={() => { setDmTarget({ id: selectedMember.userId, name: selectedMember.displayName, photo: selectedMember.photoURL }); setSelectedMember(null); setClubTab('discussions'); }} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold transition-colors">
                    <ChatCircle className="w-4 h-4" weight="fill" /> Envoyer un message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
