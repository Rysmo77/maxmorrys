import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import {
  Avatar, Button, Field, GlassPanel, Icon, IconButton, ProgressBar, SearchPill, Skeleton, Switch, Tag,
} from '@ds';
import { getMyClubProfile, saveClubProfile, getClubMemberProfiles, getUserById, updateUserProfile } from '../../../../lib/firestore';
import { functions } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDialogA11y } from '../../../../hooks/useDialogA11y';
import { ClubEmptyState, ClubSectionHeader } from './_shared';
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

/**
 * LES RÉSEAUX D'UN MEMBRE, EN TOUTES LETTRES.
 *
 * Ils étaient huit logos de marque importés d'une seconde famille d'icônes, chacun survolé
 * dans SA couleur officielle écrite en hexadécimal — quatre des onze constats de `ds:check`
 * sortaient de ces quatre lignes. Et comme aucun lien ne portait de texte, un lecteur d'écran
 * annonçait huit fois « lien », sans dire lequel.
 *
 * Le design system a déjà tranché la question, dans l'en-tête de `Icon` : « `XLogo` n'entre
 * pas : une marque tierce n'est pas une icône d'interface. » Il n'y a donc pas de glyphe à
 * trouver — le nom du réseau EST l'étiquette, et il se lit dans les deux thèmes sans qu'aucune
 * couleur de marque n'ait à être écrite.
 */
const SOCIALS = ['linkedin', 'website', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'] as const;
const SOCIAL_LABEL: Record<(typeof SOCIALS)[number], string> = {
  linkedin: 'LinkedIn', website: 'Web', facebook: 'Facebook', instagram: 'Instagram',
  twitter: 'X', tiktok: 'TikTok', youtube: 'YouTube',
};

interface CompletionForm {
  headline: string; skills: string; city: string; available: boolean;
  linkedin: string; website: string; whatsapp: string;
  facebook: string; instagram: string; twitter: string; tiktok: string; youtube: string;
}
const COMPLETION_ITEMS: { key: string; labelKey: string; benefitKey: string; done: (f: CompletionForm, photo: boolean) => boolean }[] = [
  { key: 'photo', labelKey: 'completion.photoLabel', benefitKey: 'completion.photoBenefit', done: (_, photo) => photo },
  { key: 'headline', labelKey: 'completion.headlineLabel', benefitKey: 'completion.headlineBenefit', done: (f) => !!f.headline.trim() },
  { key: 'skills', labelKey: 'completion.skillsLabel', benefitKey: 'completion.skillsBenefit', done: (f) => !!f.skills.trim() },
  { key: 'city', labelKey: 'completion.cityLabel', benefitKey: 'completion.cityBenefit', done: (f) => !!f.city.trim() },
  { key: 'available', labelKey: 'completion.availableLabel', benefitKey: 'completion.availableBenefit', done: (f) => f.available },
  { key: 'contact', labelKey: 'completion.contactLabel', benefitKey: 'completion.contactBenefit', done: (f) => !!(f.linkedin || f.whatsapp || f.website || f.facebook || f.instagram || f.twitter || f.tiktok || f.youtube).trim() },
];

/**
 * L'ANNUAIRE ET LA FICHE — écran `ClubMembre` du kit.
 *
 * La barre de remplissage passe par `ProgressBar`. Ce n'est pas un remplacement cosmétique :
 * la barre écrite à la main animait `width` sans marqueur, et surtout elle affirmait un
 * pourcentage sans jamais dire d'où il venait. `ProgressBar` exige `source` et `asOf` — ici
 * `db`, puisque les six critères se calculent sur le profil lu en base — et c'est le contrat
 * qui rend la règle 6 exécutable au lieu d'être une habitude de revue.
 *
 * ⚠️ CE QUE LE KIT MONTRE ET QUE LE PRODUIT N'A PAS : sa fiche membre porte « Ses
 * publications » et un panneau « Signaler ce membre ». Le modèle n'expose ni les publications
 * d'un membre donné, ni de signalement de PERSONNE — seul un MESSAGE se signale
 * (`reportDmMessage`, onglet Messages). Les deux blocs sont donc absents plutôt que
 * maquettés : un bouton de signalement qui n'appelle rien est pire que pas de bouton.
 */
export default function ClubMembers({ data }: { data: ClubData }) {
  const { t } = useTranslation('club');
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
  const asOf = useRef(new Date()).current;
  const [form, setForm] = useState({
    headline: '', skills: '', city: '', available: false, visible: true,
    linkedin: '', website: '', whatsapp: '', facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '',
  });

  const dialogRef = useDialogA11y(!!selectedMember, () => setSelectedMember(null));

  const reload = () => getClubMemberProfiles().then(setProfiles).catch(() => null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getMyClubProfile(user.uid), getClubMemberProfiles(), getUserById(user.uid)]).then(([mine, list, u]) => {
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
    if (file.type !== 'application/pdf') { addToast('error', t('members.toastCvTypeError')); return; }
    if (file.size > 8 * 1024 * 1024) { addToast('error', t('members.toastCvSizeError')); return; }
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
      addToast('success', t('members.toastCvSuccess'));
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || t('members.toastCvError');
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
      await updateUserProfile(user.uid, socials).catch(() => null);
      await refreshUserData().catch(() => null);
      addToast('success', t('members.toastSaved'));
      setEditing(false);
      reload();
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('members.toastSaveError'));
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height={210} radius="var(--r-l)" label={t('members.myProfile')} />
        <Skeleton height={46} radius="var(--r-pill)" label={t('members.searchPlaceholder')} />
        <div className="grid grid-cols-1 gap-3 stack:grid-cols-2 wide:grid-cols-3">
          <Skeleton height={132} radius="var(--r-l)" label={t('members.myProfile')} />
          <Skeleton height={132} radius="var(--r-l)" label={t('members.myProfile')} />
          <Skeleton height={132} radius="var(--r-l)" label={t('members.myProfile')} />
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
      {/* ── Ma fiche ────────────────────────────────────────────────────────── */}
      <GlassPanel level="flat" padding={18}>
        <ClubSectionHeader
          icon="user"
          title={t('members.myProfile')}
          action={!editing ? (
            <Button tone="quiet" size="sm" onClick={() => setEditing(true)}>
              <Icon name="pencil" size={15} /> {t('members.edit')}
            </Button>
          ) : undefined}
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-meta-2 font-semibold text-ink-2">{t('members.completionLabel')}</span>
          {completion === 100 && <Tag tone="ok">{t('members.profileTop')}</Tag>}
        </div>
        <ProgressBar
          value={completion}
          source="db"
          asOf={asOf}
          readout
          label={t('members.completionLabel')}
          style={{ marginTop: '6px' }}
        />

        {nextItems.length > 0 && (
          <ul className="mt-3 list-none space-y-1.5 p-0">
            {nextItems.map((it) => (
              <li key={it.key} className="flex items-start gap-2 text-meta-2">
                <span className="mt-0.5 flex-none text-transforme" aria-hidden="true"><Icon name="plus" size={13} /></span>
                <span className="text-ink-2">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="font-semibold text-ink-2 underline decoration-dotted transition-colors duration-ui ease-ds hover:text-transforme"
                  >
                    {t(`members.${it.labelKey}`)}
                  </button>
                  {' — '}{t(`members.${it.benefitKey}`)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <input ref={cvInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleCvUpload} />
        <Button
          tone="ghost"
          size="sm"
          loading={analyzing}
          onClick={() => cvInputRef.current?.click()}
          style={{ marginTop: '12px', width: '100%' }}
        >
          <Icon name="doc" size={15} />
          {analyzing ? t('members.analyzingCv') : t('members.fillFromCv')}
        </Button>

        {editing ? (
          <div className="mt-2">
            <Field label={t('members.headlineLabel')} value={form.headline} onChange={(v) => setForm((p) => ({ ...p, headline: v }))} placeholder={t('members.headlinePlaceholder')} />
            <Field label={t('members.skillsLabel')} value={form.skills} onChange={(v) => setForm((p) => ({ ...p, skills: v }))} placeholder={t('members.skillsPlaceholder')} hint={t('members.skillsHint')} />
            <div className="grid grid-cols-1 gap-3 stack:grid-cols-2">
              <Field label={t('members.cityLabel')} value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} placeholder={t('members.cityPlaceholder')} autoComplete="address-level2" />
              <Field label={t('members.whatsappLabel')} value={form.whatsapp} onChange={(v) => setForm((p) => ({ ...p, whatsapp: v }))} placeholder={t('members.whatsappPlaceholder')} type="tel" inputMode="tel" autoComplete="tel" />
            </div>
            <div className="grid grid-cols-1 gap-3 stack:grid-cols-2">
              <Field label="LinkedIn" value={form.linkedin} onChange={(v) => setForm((p) => ({ ...p, linkedin: v }))} placeholder={t('members.linkedinPlaceholder')} inputMode="url" />
              <Field label={t('members.websiteLabel')} value={form.website} onChange={(v) => setForm((p) => ({ ...p, website: v }))} placeholder={t('members.websitePlaceholder')} inputMode="url" />
            </div>
            <div className="grid grid-cols-1 gap-3 stack:grid-cols-2">
              <Field label="Facebook" value={form.facebook} onChange={(v) => setForm((p) => ({ ...p, facebook: v }))} placeholder={t('members.facebookPlaceholder')} />
              <Field label="Instagram" value={form.instagram} onChange={(v) => setForm((p) => ({ ...p, instagram: v }))} placeholder={t('members.instagramPlaceholder')} />
            </div>
            <div className="grid grid-cols-1 gap-3 stack:grid-cols-3">
              <Field label="X" value={form.twitter} onChange={(v) => setForm((p) => ({ ...p, twitter: v }))} placeholder={t('members.twitterPlaceholder')} />
              <Field label="TikTok" value={form.tiktok} onChange={(v) => setForm((p) => ({ ...p, tiktok: v }))} placeholder={t('members.tiktokPlaceholder')} />
              <Field label="YouTube" value={form.youtube} onChange={(v) => setForm((p) => ({ ...p, youtube: v }))} placeholder={t('members.youtubePlaceholder')} />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-meta text-ink-2">{t('members.availableForMissions')}</span>
                <Switch
                  on={form.available}
                  label={t('members.availableForMissions')}
                  onChange={(on) => setForm((p) => ({ ...p, available: on }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-meta text-ink-2">{t('members.visibleInDirectory')}</span>
                <Switch
                  on={form.visible}
                  label={t('members.visibleInDirectory')}
                  onChange={(on) => setForm((p) => ({ ...p, visible: on }))}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button tone="quiet" size="sm" onClick={() => setEditing(false)}>{t('members.cancel')}</Button>
              <Button tone="transforme" size="sm" loading={saving} onClick={handleSave}>
                <Icon name="check" size={15} /> {t('members.save')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-meta text-ink-2">
            {form.visible ? t('members.profileVisible') : t('members.profileHidden')}
          </p>
        )}
      </GlassPanel>

      {/* ── L'annuaire ──────────────────────────────────────────────────────── */}
      <SearchPill
        value={query}
        onChange={setQuery}
        label={t('members.searchLabel')}
        labelHidden
        placeholder={t('members.searchPlaceholder')}
        icon={<Icon name="search" size={17} />}
      />

      {filtered.length === 0 ? (
        <ClubEmptyState icon="users" title={t('members.emptyTitle')} subtitle={t('members.emptySubtitle')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 stack:grid-cols-2 wide:grid-cols-3">
          {filtered.map((p) => (
            <motion.button
              key={p.id}
              variants={staggerItem}
              type="button"
              onClick={() => setSelectedMember(p)}
              className="glass-flat mm-press mm-touch-extend p-4 text-left"
            >
              <div className="flex items-start gap-3">
                {p.photoURL
                  ? <img src={p.photoURL} alt="" loading="lazy" className="h-11 w-11 flex-none rounded-full object-cover" />
                  : <Avatar initials={initialsOf(p.displayName)} size={44} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-bold text-ink">{p.displayName}</p>
                    {p.userId === user?.uid && <span className="text-small text-ink-2">{t('members.you')}</span>}
                  </div>
                  {p.headline && <p className="truncate text-meta-2 text-ink-2">{p.headline}</p>}
                  {p.city && (
                    <p className="mt-0.5 flex items-center gap-1 text-meta-2 text-ink-2">
                      <span aria-hidden="true" className="flex-none"><Icon name="pin" size={12} /></span> {p.city}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.available && <Tag tone="ok">{t('members.available')}</Tag>}
                {p.skills.slice(0, 4).map((s) => <Tag key={s}>{s}</Tag>)}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* ── La fiche d'un membre ────────────────────────────────────────────── */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--night)_55%,transparent)] p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedMember(null)}
        >
          {/* `shadow-card`, PAS `shadow-glass` : ce panneau défile en interne, et `ds:check`
              signale le mot `glass` sur toute surface qui n'est ni `fixed` ni `sticky` — y
              compris quand il n'est que le nom d'une classe d'ombre. */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={selectedMember.displayName}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-surface-sheet shadow-card sm:max-w-md sm:rounded-xl"
          >
            <div className="flex justify-center pt-2.5 sm:hidden">
              <span aria-hidden="true" className="h-1.5 w-10 rounded-pill bg-[color:var(--fill-4)]" />
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3">
                {selectedMember.photoURL
                  ? <img src={selectedMember.photoURL} alt="" className="h-16 w-16 flex-none rounded-full object-cover" />
                  : <Avatar initials={initialsOf(selectedMember.displayName)} size={64} />}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-ttl text-ink">{selectedMember.displayName}</h3>
                  {selectedMember.headline && <p className="text-meta text-ink-2">{selectedMember.headline}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {selectedMember.city && (
                      <span className="flex items-center gap-1 text-meta-2 text-ink-2">
                        <span aria-hidden="true"><Icon name="pin" size={13} /></span> {selectedMember.city}
                      </span>
                    )}
                    {selectedMember.available && <Tag tone="ok">{t('members.availableForMissionsBadge')}</Tag>}
                  </div>
                </div>
                <IconButton label={t('members.close')} onClick={() => setSelectedMember(null)}>
                  <Icon name="close" size={17} />
                </IconButton>
              </div>

              {selectedMember.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {selectedMember.skills.map((s) => <Tag key={s}>{s}</Tag>)}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {SOCIALS.map((key) => {
                  const value = selectedMember[key];
                  if (!value) return null;
                  return (
                    <Button key={key} tone="quiet" size="sm" href={socialHref(key, value)} target="_blank">
                      <Icon name="share" size={14} /> {SOCIAL_LABEL[key]}
                    </Button>
                  );
                })}
                {selectedMember.whatsapp && (
                  <Button tone="quiet" size="sm" href={`https://wa.me/${selectedMember.whatsapp.replace(/\D/g, '')}`} target="_blank">
                    <Icon name="chat" size={14} /> WhatsApp
                  </Button>
                )}
              </div>

              <div className="mt-5 border-t border-[color:var(--border-hair)] pt-4">
                {selectedMember.userId === user?.uid ? (
                  <Button tone="transforme" onClick={() => { setSelectedMember(null); setEditing(true); }}>
                    <Icon name="pencil" size={16} /> {t('members.editMyProfile')}
                  </Button>
                ) : (
                  <Button
                    tone="transforme"
                    onClick={() => {
                      setDmTarget({ id: selectedMember.userId, name: selectedMember.displayName, photo: selectedMember.photoURL });
                      setSelectedMember(null);
                      setClubTab('discussions');
                    }}
                  >
                    <Icon name="chat" size={16} /> {t('members.sendMessage')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
